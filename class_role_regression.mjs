// All eight Global classes: role catalog validity, class-restricted PvE goals,
// different Stigma/Mastery priorities, and a mechanics-aware score response.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const classes=JSON.parse(read('classes_data.json'));
const stigmas=JSON.parse(read('stigmas.json'));
const specialties=JSON.parse(read('specialties.json'));
const ctx=vm.createContext({SPECS:specialties});
vm.runInContext(read('js/optimizer/roles.js')+'\n'+
 read('js/engine/class_models.js')+'\n'+
 read('js/optimizer/objectives.js')+
 '\nglobalThis.api={RoleBuildGoals,ClassCombatModels,PVE_OBJECTIVES};',ctx);
const {RoleBuildGoals:roles,ClassCombatModels:models,PVE_OBJECTIVES:objectives}=ctx.api;
assert.equal(Object.keys(classes).length,8);
for(const cls of Object.keys(classes)){
 const knownSkills=new Set(Object.values(classes[cls].skills).map(x=>x.name));
 const knownStigmas=new Set(Object.keys(stigmas[cls]));
 const options=roles.available(cls,'party'),ids=options.map(x=>x.id);
 assert(ids.includes('performance')&&ids.includes('survivability'));
 assert(new Set(ids).size===ids.length);
 assert(options.every(x=>x.label&&x.description&&objectives[x.id]));
 for(const [name,goal] of Object.entries(roles.catalog[cls])){
  if(name==='order'||name==='names')continue;
  assert(roles.catalog[cls].order.includes(name));
  assert(goal.focus.length>=4);
  assert(goal.focus.every(n=>knownSkills.has(n)),cls+' '+name+' invalid focus');
  assert(goal.utility.every(n=>knownSkills.has(n)),cls+' '+name+' invalid utility');
  assert(goal.stigma.length===4&&new Set(goal.stigma).size===4);
  assert(goal.stigma.every(n=>knownStigmas.has(n)),cls+' '+name+' invalid Stigma');
  const baseline={core:models.profile(cls).offense,support:models.profile(cls).support,
    stigmas:models.profile(cls).damageStigmas,why:'PvE'};
  const advised=models.advice(cls,'party',name,baseline);
  assert.equal(advised.stigmas.length,4);
  assert.deepEqual(Array.from(advised.stigmas),goal.stigma);
  assert.equal(advised.core[0],goal.focus[0]);
  assert(advised.why.includes('not measured HPS')||advised.why.includes('not measured'));
  const a=Object.fromEntries([...knownSkills].map(n=>[n,1]));
  const b={...a};for(const skill of goal.focus)b[skill]=10;
  const build=mastery=>({mastery,boardSkills:{},gearSkills:{},
    boardStats:{},gearStats:{},stigma:{},equippedStigmas:goal.stigma});
  const low=models.evaluate({classId:cls,context:'party',objective:name,
    build:build(a)});
  const high=models.evaluate({classId:cls,context:'party',objective:name,
    build:build(b)});
  assert(Number.isFinite(low.score)&&Number.isFinite(high.score));
  assert(high.score>low.score,cls+' '+name+' must reward actual selected focus skills');
 }
}
const cleric=roles.available('cleric','party').map(x=>x.id);
assert(cleric.includes('healing')&&cleric.includes('hybrid')&&cleric.includes('debuff'));
assert(!roles.available('cleric','solo').some(x=>x.id==='healing'));
assert(!roles.available('chanter','solo').some(x=>x.id==='support'));
assert(roles.available('templar','party').some(x=>x.id==='tank'));
assert(roles.available('gladiator','party').some(x=>x.id==='offtank'));
assert(roles.available('spiritmaster','solo').some(x=>x.id==='pet'));
assert.equal(roles.normalize('cleric','solo','healing'),'performance');
assert.equal(roles.normalize('cleric','party','healing'),'healing');
assert.equal(roles.normalize('templar','party','healing'),'performance');
assert.equal(roles.normalize('cleric','party','performance'),'performance');
const selected=roles.info('cleric','healing');
assert(selected.focus.includes('Radiant Recovery'));
assert(selected.stigma.includes('Absolution'));
assert(roles.roleStatBoost('MPMax','cleric','healing')>1);
assert(roles.roleStatBoost('PvEAccuracy','cleric','debuff')>1);
assert.equal(roles.roleStatBoost('MPMax','assassin','burst'),1);
console.log('Verified all eight Global class role matrices, valid unlockable focus/Stigmas, role scoring, and party-only selections.');
