// Objective optimization invariants, including disconnected and locked routes.
// Run: node objective_optimizer_audit.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const js=read('js/optimizer/objectives.js');
const data=JSON.parse(read('classes_data.json'));
const routes=JSON.parse(read('context_routes.json'));
const context={
  console,
  optimizeBoardRoute:(classData,weights,mastery,gear,cp,baseCp,locked,level,targets)=>{
    const all=classData.boards.flatMap(board=>board.nodes.filter(n=>n[5]>0)
      .map(n=>({board:board.name,id:n[0],goal:n[0]})));
    return {route:all};
  },
  fitConnectedBoardBudget:(classData,route,budget)=>({route:[],spent:0})
};
vm.createContext(context);
vm.runInContext(js+'\nthis.api={PveBuildOptimizer,PVE_OBJECTIVES};',context);
const api=context.api;
assert.equal(Object.keys(api.PVE_OBJECTIVES).length,4);
for(const cls of Object.keys(data)){
  const graphs=api.PveBuildOptimizer.buildGraph(data[cls],45);
  assert.equal(graphs.length,4);
  for(const mode of ['party','solo']){
    const variants=api.PveBuildOptimizer.weightsFor(routes[cls].weights[mode],cls,mode,'survivability');
    assert(Object.keys(variants.skills).length>0);
    assert(Object.keys(variants.stats).length>0);
  }
}
const mock={
  skills:{1:{name:'Hellfire'},2:{name:'Robe of Flame'},3:{name:'Fire Mark'}},
  stats:{CombatSpeed:{name:'Combat Speed',div:100}},
  boards:[{name:'Nezekan',nodes:[
    [1,0,0,'',null,0,[]],
    [2,0,1,'',null,1,[[1,1]]],
    [3,0,2,'',null,1,[[2,1]]],
    [4,1,0,'',null,1,[[3,1]]],
    [5,1,1,'',null,1,[['CombatSpeed',100]]]
  ]}]
};
const run=(objective,budget,locked=[])=>{
  const args={classData:mock,classId:'sorcerer',context:'party',objective,
    baseWeights:{skills:{Hellfire:20,'Robe of Flame':20,'Fire Mark':20},stats:{CombatSpeed:20}},
    mastery:{Hellfire:8,'Robe of Flame':8,'Fire Mark':8},gear:{},locked,
    crystalBudget:budget,characterLevel:45,skillTargets:{}};
  // A predictable whole-board route for this fixture. The actual optimizer
  // must not recommend disconnected nodes or overspend the funded prefix.
  const previous=context.optimizeBoardRoute;
  context.optimizeBoardRoute=()=>({route:[
    {board:'Nezekan',id:2,goal:2},{board:'Nezekan',id:3,goal:3},
    {board:'Nezekan',id:4,goal:4},{board:'Nezekan',id:5,goal:5}]});
  context.fitConnectedBoardBudget=(_data,route,b)=>({
    route:route.slice(0,b),spent:Math.min(b,route.length)
  });
  try{return api.PveBuildOptimizer.optimize(args)}
  finally{context.optimizeBoardRoute=previous}
};
for(const goal of Object.keys(api.PVE_OBJECTIVES))for(const budget of [0,1,2,3,4]){
  const result=run(goal,budget);
  const funded=result.route.slice(0,budget).map(x=>x.id);
  assert(funded.length<=budget);
  const nodes=new Map(mock.boards[0].nodes.map(n=>[n[0],n]));
  const selected=new Set([1]);
  for(const id of funded){
    const n=nodes.get(id);
    assert([...selected].some(prev=>{
      const p=nodes.get(prev);
      return Math.abs(n[1]-p[1])+Math.abs(n[2]-p[2])===1;
    }),`Disconnected route for ${goal} at ${budget}: ${id}`);
    selected.add(id);
  }
}
for(const goal of Object.keys(api.PVE_OBJECTIVES)){
  const result=run(goal,4,[3]);
  assert(result.route.slice(0,4).some(x=>x.id===3),'Previously obtained node lost');
}
assert.throws(()=>run('invalid',3),/Unknown PvE objective/);
console.log('Objective planner fixture invariants verified for four objectives, budgets and protected nodes.');
