// Regression for legal budget exhaustion. Uses actual Global class boards
// and pure budget helpers, without claiming any DPS optimum.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const classes=JSON.parse(read('classes_data.json'));
const context=vm.createContext({});
vm.runInContext(read('js/board_budget.js')+'\n'+read('js/mastery_budget.js')+
  '\nglobalThis.helpers={fitConnectedBoardBudget,spendAvailableMastery};',context);
const {fitConnectedBoardBudget,spendAvailableMastery}=context.helpers;
let checks=0;
const masteryCost=rank=>rank<=4?1:rank<=7?2:4;
function checkMastery(names,budget,cap){
 const initial={levels:Object.fromEntries(names.map(name=>[name,1])),spent:0};
 const stages=names.map(name=>[name,10]);
 const res=spendAvailableMastery(initial,budget,masteryCost,()=>cap,names,stages);
 const recomputed=Object.values(res.levels).reduce((s,rank)=>{
   for(let n=2;n<=rank;n++)s+=masteryCost(n);
   return s;
 },0);
 assert.equal(res.spent,recomputed,'Mastery accounting mismatch');
 assert(res.spent<=budget,'Mastery overspend');
 assert(Object.values(res.levels).every(rank=>rank<=cap&&rank>=1));
 if(res.unspent){
   assert(names.every(name=>res.levels[name]>=cap||
     masteryCost(res.levels[name]+1)>res.unspent),'Affordable Mastery rank overlooked');
 }
 checks++;
}
for(const [name,cls] of Object.entries(classes)){
 const names=Object.values(cls.skills).map(skill=>skill.name);
 for(const budget of [1,2,3,4,5,9,17,36,147,153,203,218,285,350,420,900])
   checkMastery(names,budget,10);
 // Model the leveling cap without allowing the budget finisher to break it.
 for(const budget of [9,36,147])checkMastery(names,budget,5);
 // Build a legal complete BFS route on all four actual PvE boards.
 const route=[];
 const graph=new Map(),visited=new Set(),ids=new Set();
 for(const board of cls.boards){
   const coords=new Map(board.nodes.map(n=>[`${n[1]}:${n[2]}`,n[0]]));
   for(const n of board.nodes){
     if(n[5]===0)visited.add(n[0]);
     else{
       ids.add(n[0]);graph.set(n[0],{board:board.name,node:n,
         near:[[n[1]-1,n[2]],[n[1]+1,n[2]],[n[1],n[2]-1],[n[1],n[2]+1]]
           .map(([r,c])=>coords.get(`${r}:${c}`)).filter(v=>v!==undefined)});
     }
   }
 }
 while(ids.size){
   const found=[...ids].find(id=>graph.get(id).near.some(neighbor=>visited.has(neighbor)));
   assert(found!==undefined,name+': disconnected fixture');
   visited.add(found);ids.delete(found);
   route.push({id:found,board:graph.get(found).board,goal:found});
 }
 for(const budget of [1,2,3,9,17,36,100,104,119,203,285,350,600]){
   const fitted=fitConnectedBoardBudget(cls,route,budget);
   const owned=new Set(cls.boards.flatMap(b=>b.nodes.filter(n=>n[5]===0).map(n=>n[0])));
   let spent=0;
   for(const entry of fitted.route){
     const item=graph.get(entry.id);
     assert(item.near.some(id=>owned.has(id)),name+': disconnected planned tile');
     owned.add(entry.id);
     if(spent+item.node[5]<=budget && spent===fitted.spent){
       // The full route includes future tiles; avoid resuming at a future node.
     }
     if(spent+item.node[5]<=budget)spent+=item.node[5];
     else break;
   }
   assert.equal(spent,fitted.spent,name+': funded prefix differs from fitter accounting');
   assert.equal(fitted.unused,budget-spent,name+': wrong unused crystals');
   // A frontier tile must never be affordable after the funded prefix.
   const affordable=[...graph].filter(([id,item])=>!owned.has(id)&&
     item.near.some(n=>owned.has(n))&&item.node[5]<=fitted.unused);
   assert.equal(affordable.length,0,
     name+': left '+fitted.unused+' crystals with affordable connected tiles');
   checks++;
 }
}
// Deliberately bad value/cost ordering: the reachable cheap branch must win.
const toy={boards:[{name:'Nezekan',nodes:[
 [10,0,0,0,0,0,[]],[11,0,1,0,0,3,[]],[12,1,0,0,0,1,[]]]}]};
const rearranged=fitConnectedBoardBudget(toy,[{id:11,board:'Nezekan'},{id:12,board:'Nezekan'}],1);
assert.equal(rearranged.spent,1);
assert.equal(rearranged.route[0].id,12);
console.log('Passed '+checks+' all-class Mastery and Daevanion budget-fit checks, including cheap connected detours.');
