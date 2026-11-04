// AION 2 Global Sorcerer: easy mobile Nightmare damage on LMB + RMB,
// while charged, burst, ground and defensive actions remain deliberate.
// The modeled timing is not a substitute for measured Global action locks.
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
 "Winter's Shackles":[1],Hellfire:[1,3],Firestorm:[2,4],
 'Wish of Concentration':[5]
};
const loadouts={
 performance:['Element Enhancement','Delayed Explosion','Steel Barrier','Fire Wall'],
 sustained:['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm'],
 burst:['Element Enhancement','Delayed Explosion','Divine Burst','Steel Barrier'],
 survivability:['Element Enhancement','Steel Barrier','Arctic Armor','Hibernation'],
 control:['Hibernation','Curse: Tree','Cold Storm','Steel Barrier']
};
const forbidden=new Set(['Hellfire','Flame Arrow','Delayed Explosion','Wish of Concentration',
 'Fire Wall','Cold Storm','Steel Barrier','Arctic Armor','Hibernation',
 'Divine Burst','Curse: Tree','Soul Freeze','Ice Chain','Flame Scattershot','Defiance',
 "Winter's Shackles"]);
const actions=[];
for(const [goal,equipped] of Object.entries(loadouts)){
 for(const mobility of [false,true]){
  const picked=mobility?specs:{Firestorm:[2,4],Hellfire:[1],
    'Wish of Concentration':[5]};
  const build={
   context:'solo',
   mastery:Object.fromEntries(skills.map(name=>[name,10])),
   boardSkills:{},gearSkills:{},boardStats:{},gearStats:{},
   availableSkills:skills,stigma:Object.fromEntries(equipped.map(name=>[name,5])),
   equippedStigmas:equipped,objective:goal,macroLayout:'flow',autoWish:false
  };
  const layout=engine.flowLayout(build,picked);
  assert.equal(layout.steps[0],'Q');
  assert.deepEqual(Array.from(layout.stacks[0].skills),['Blaze','Firestorm']);
  const e=layout.stacks.find(stack=>stack.key==='E');
  assert.equal(Boolean(e),mobility,
    'Only earned mobile follow-up Specialties enable the Nightmare E stack');
  if(mobility){
    assert(e.skills.includes('Frost Burst')&&e.skills.includes('Frost')&&
      e.skills.includes('Bittercold Wind'));
  }
  const names=Array.from(layout.stacks.flatMap(stack=>Array.from(stack.skills)));
  assert.equal(new Set(names).size,names.length,goal+': duplicate automatic action');
  for(const action of names)
   assert(!forbidden.has(action),'Forbidden held-macro action: '+action);
  const expected=goal==='sustained'&&equipped.includes('Element Enhancement')
    ?['Element Enhancement']:[];
  const automatedStigmas=names.filter(name=>
    equipped.includes(name)||name==='Wish of Concentration');
  assert.deepEqual(automatedStigmas,expected,
    goal+': only permitted sustained auto Element Enhancement should appear');
  const trusted=joint.adviseMacro({
   classId:'sorcerer',context:'solo',objective:goal,
   profile:{
    stacks:layout.stacks,
    hotbar:[
     [['Hellfire'],'Fully charged manually','attack'],
     [['Wish of Concentration'],'Manual cooldown reset','buff'],
     [['Element Enhancement'],'Damage buff','buff'],
     [['Delayed Explosion'],'Manual burst window','buff'],
     [["Winter's Shackles"],'Manual damage-boost window','attack']
    ]
   },
   available:skills,stigma:equipped,
   levels:{},specialties:picked
  });
  assert.deepEqual(
   Array.from(trusted.stacks.flatMap(stack=>stack.skills)
    .filter(name=>equipped.includes(name)||name==='Wish of Concentration')),
   expected,goal+': macro safety filter contradicted the configured buff policy');
  assert(!trusted.stacks.some(stack=>stack.skills.includes("Winter's Shackles")),
   'Brief damage-boost window must stay manual, even with a mobile Specialty');
  const scenario={id:'nightmare-moving',duration:120,weight:1,
   movement:.6,animation:1.12};
  const sample=engine.simulate(build,picked,scenario);
  assert(Number.isFinite(sample.score)&&sample.score>0);
  assert(sample.manualPerMinute>=0);
  actions.push({goal,mobility,steps:layout.steps.length,
   automatic:names.length,manualPerMinute:sample.manualPerMinute});
 }
}
const noExtras=engine.flowLayout({
 context:'solo',mastery:{},boardSkills:{},gearSkills:{},availableSkills:skills,
 stigma:{},equippedStigmas:[],objective:'performance'
},{});
assert.deepEqual(Array.from(noExtras.steps),['Q'],
 'Do not generate phantom E/R macro steps in a basic mobile build');
console.log('Global Sorcerer two-button Nightmare macro: '+actions.length+
 ' goal/mobility combinations, earned follow-ups, timed burst, MP and manual overrides passed.');
