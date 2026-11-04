// AION 2 Global Sorcerer two-button loop: verify that macro handles
// sustainable fire/Frost/offensive Stigmas, while charge, ground spells and
// emergency skills remain independently playable.
// This validates action legality, NOT an invented absolute DPS/cancel window.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(read('js/engine/combat.js')+'\n'+read('js/optimizer/joint.js')+
  '\nglobalThis.check={engine:GlobalCombatEngine,joint:JointProgression};',ctx);
const {engine,joint}=ctx.check;
const skills=Object.keys(JSON.parse(read('skill_unlocks.json')).sorcerer);
const specs={
 'Frost Burst':[2],Frost:[3],'Bittercold Wind':[2],
 "Winter's Shackles":[1],Hellfire:[1,3],Firestorm:[2,4]};
const loadouts={
 performance:['Element Enhancement','Delayed Explosion','Steel Barrier','Fire Wall'],
 sustained:['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm'],
 burst:['Element Enhancement','Delayed Explosion','Divine Burst','Steel Barrier'],
 survivability:['Element Enhancement','Steel Barrier','Arctic Armor','Hibernation'],
 control:['Hibernation','Curse: Tree','Cold Storm','Steel Barrier']
};
const forbidden=new Set(['Hellfire','Flame Arrow',
 'Fire Wall','Cold Storm','Steel Barrier','Arctic Armor','Hibernation',
 'Divine Burst','Curse: Tree','Soul Freeze','Ice Chain','Flame Scattershot','Defiance']);
const actions=[];
for(const [goal,equipped] of Object.entries(loadouts)){
 for(const mobility of [false,true]){
  const picked=mobility?specs:{Firestorm:[2,4],Hellfire:[1]};
  const build={
   mastery:Object.fromEntries(skills.map(name=>[name,10])),
   boardSkills:{},gearSkills:{},boardStats:{},gearStats:{},
   availableSkills:skills,stigma:Object.fromEntries(equipped.map(name=>[name,5])),
   equippedStigmas:equipped,objective:goal,macroLayout:'flow'
  };
  const layout=engine.flowLayout(build,picked);
  assert.deepEqual(Array.from(layout.steps.slice(0,2)),['Q','E']);
  assert.deepEqual(Array.from(layout.stacks[0].skills),['Blaze','Firestorm']);
  assert(layout.stacks[1].skills.includes('Frost'));
  if(mobility)assert(layout.stacks[1].skills.includes('Frost Burst'));
  else assert(!layout.stacks[1].skills.includes('Frost Burst'));
  const names=Array.from(layout.stacks.flatMap(stack=>Array.from(stack.skills)));
  assert.equal(new Set(names).size,names.length,goal+': duplicate automatic action');
  for(const action of names)
   assert(!forbidden.has(action),'Forbidden held-macro action: '+action);
  const automatedStigmas=names.filter(name=>
    equipped.includes(name)||name==='Wish of Concentration');
  const expected=[
    ...['Element Enhancement',...(goal==='burst'?[]:['Delayed Explosion'])]
      .filter(name=>equipped.includes(name)),
    ...(goal==='burst'?[]:['Wish of Concentration'])
  ];
  assert.deepEqual(automatedStigmas,expected,
   goal+': only nondefensive safe offensive Stigmas should be automated');
  const trusted=joint.adviseMacro({
   classId:'sorcerer',context:'solo',objective:goal,
   profile:{
    stacks:layout.stacks,
    hotbar:[
     [['Hellfire'],'Fully charged manually','attack'],
     [['Wish of Concentration'],'Manual cooldown reset','buff'],
     [['Element Enhancement'],'Damage buff','buff'],
     [['Delayed Explosion'],'Manual burst window','buff'],
     [["Winter's Shackles"],'Manual fallback until mobile Specialty','attack']
    ]
   },
   available:skills,stigma:equipped,
   levels:{},specialties:picked
  });
  assert.deepEqual(
   Array.from(trusted.stacks.flatMap(stack=>stack.skills)
    .filter(name=>equipped.includes(name)||name==='Wish of Concentration')),
   expected,goal+': generic safety filter dropped safe offensive Stigmas / Wish');
  assert.equal(names.includes('Wish of Concentration'),goal!=='burst',
   goal+': only continuous PvE may automate Wish');
  if(goal!=='burst'){
    const r=layout.stacks.find(stack=>stack.key==='R');
    assert(r&&r.skills.at(-1)==='Wish of Concentration',
      'Wish must remain LAST after offensive Stigmas in the R priority column');
  }
  // Burst holds Winter's Shackles for the timed Hellfire damage window,
  // regardless of movement eligibility. All other goals may automate it
  // once its actual mobile Specialty is earned.
  const shackleAuto=mobility&&goal!=='burst';
  assert.equal(trusted.stacks.some(stack=>
    stack.key==='E'&&stack.skills.includes("Winter's Shackles")),shackleAuto,
    goal+': Winter\'s Shackles must respect mobile eligibility AND manual burst alignment');
  const scenario={id:'nightmare-moving',duration:120,weight:1,
   movement:.6,animation:1.12};
  const sample=engine.simulate(build,picked,scenario);
  assert(Number.isFinite(sample.score)&&sample.score>0);
  assert(sample.manualPerMinute>=0);
  actions.push({goal,mobility,steps:layout.steps.length,
   automatic:names.length,manualPerMinute:sample.manualPerMinute});
 }
}
assert(engine.flowLayout({
 mastery:{},boardSkills:{},gearSkills:{},availableSkills:skills,
 stigma:{},equippedStigmas:[],objective:'performance'
},{}).steps.length===2);
console.log('Global Sorcerer two-button macro: '+actions.length+
 ' goal/mobility combinations; action eligibility, proactive safe Stigmas and hand-charged Hellfire passed.');
