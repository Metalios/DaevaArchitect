// Global Sorcerer Nightmare: movement is a hard automatic-macro constraint.
// Estimates of forced-stop time are NOT measured animation/cancel timings.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const skills=JSON.parse(read('skill_unlocks.json')).sorcerer;
const specData=JSON.parse(read('specialties.json')).sorcerer;
const ctx=vm.createContext({});
vm.runInContext(read('js/engine/combat.js')+
  '\nglobalThis.engine=GlobalCombatEngine;',ctx);
const model=ctx.engine;
for(const skill of ['Flame Arrow','Firestorm','Blaze','Frost',
 'Wish of Concentration','Element Enhancement','Delayed Explosion'])
 assert(model.isMobile(skill,{}),skill+' should already be mobile in Global');
for(const [skill,choice] of Object.entries({
 Hellfire:3,'Bittercold Wind':2,"Winter's Shackles":1,
 'Frost Burst':2,'Flame Scattershot':3})){
 assert.equal(model.isMobile(skill,{}),false,skill+' incorrectly auto-mobile');
 assert.equal(model.isMobile(skill,{[skill]:[choice]}),true,
  skill+' must become mobile only with real Specialty '+choice);
}
for(const name of ['Fire Wall','Cold Storm','Divine Burst']){
 assert(!model.isMobile(name,{}),name+' cannot be automated during dodges');
}
const names=Object.keys(skills);
const build={
 mastery:Object.fromEntries(names.map(name=>[name,10])),
 boardSkills:{Hellfire:6,'Bittercold Wind':6,"Winter's Shackles":6,
  'Firestorm':6,Blaze:6},
 gearSkills:{},boardStats:{},gearStats:{},
 stigma:{'Element Enhancement':10,'Delayed Explosion':5,
  'Steel Barrier':5,'Fire Wall':1},
 equippedStigmas:['Element Enhancement','Delayed Explosion',
  'Steel Barrier','Fire Wall'],
 availableSkills:names
};
const mobileSpecialties={
 Hellfire:[1,3],"Bittercold Wind":[2,4],
 "Winter's Shackles":[1,3],Firestorm:[2,4],Blaze:[3,5],
 'Wish of Concentration':[2,5]
};
const stationarySpecialties={
 ...mobileSpecialties,Hellfire:[1,4],
 'Bittercold Wind':[1,4],"Winter's Shackles":[3,4]
};
const moving={id:'nightmare-boss',duration:180,weight:1,
 movement:.7,animation:1.12};
const mobile=model.simulate({...build,macroLayout:'mobile'},mobileSpecialties,moving);
const rooted=model.simulate({...build,macroLayout:'mobile'},stationarySpecialties,moving);
assert(mobile.score>0&&rooted.score>0);
assert(mobile.forcedStopTime<rooted.forcedStopTime,
 'Mobile Hellfire should reduce forced-stop opportunity time');
assert(rooted.stationaryCastTime>mobile.stationaryCastTime);
const stationaryFight=model.simulate({...build,macroLayout:'mobile'},
 stationarySpecialties,{...moving,movement:0});
assert.equal(stationaryFight.forcedStopTime,0);
const contexts=[
 model.scenariosFor('solo','performance'),
 model.scenariosFor('solo','sustained'),
 model.scenariosFor('solo','burst')
];
for(const encounters of contexts){
 for(const selected of [mobileSpecialties,stationarySpecialties]){
  const plan=model.chooseMacro(build,selected,encounters);
  assert(['mobile','mobile-extended'].includes(plan.mode),
   'Nightmare must not choose automatic stationary cast / ground macros');
  assert(plan.stacks.every(stack=>stack.skills.every(name=>
   model.isMobile(name,selected))),
   'A mobile macro attempted an unearned stationary action');
  assert(!plan.stacks.some(stack=>stack.skills.some(name=>
   ['Hellfire','Fire Wall','Cold Storm','Divine Burst'].includes(name))),
   'Charged attacks and ground fields must remain manual for Nightmare');
  assert(plan.steps.length>=1&&plan.steps.length<=2);
 }
}
const unupgraded=model.chooseMacro(build,stationarySpecialties,contexts[0]);
assert.equal(unupgraded.mode,'mobile');
assert.deepEqual(Array.from(unupgraded.steps),['Q']);
assert.deepEqual(Array.from(unupgraded.stacks[0].skills),
 ['Firestorm','Blaze']);
const tuned=model.tuneSpecialties({...build,macroLayout:'mobile'},
 specData,{},null,[moving]);
assert(tuned.specialties.Hellfire.includes(3),
 'Nightmare damage optimizer must unlock mobile Hellfire once earned');
const explicitlyPinned=model.tuneSpecialties({...build,macroLayout:'mobile'},
 specData,{Hellfire:[1,5]},null,[moving]);
assert.deepEqual(Array.from(explicitlyPinned.specialties.Hellfire),
 [1,5],'Explicit player Specialty choices must remain pinned');
console.log('Global Sorcerer mobile DPS: real movement gates, cooldown-safe Q/E macros, earned Hellfire mobile Specialty, forced stop time and manual override passed.');
