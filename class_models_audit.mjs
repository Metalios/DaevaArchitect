// Validate the mechanically distinct Global PvE class models and their input
// catalogs. No simulated result is a claim of measured server DPS/HPS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const load=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const classes=JSON.parse(load('classes_data.json'));
const stigmas=JSON.parse(load('stigmas.json'));
const ctx={SPECS:JSON.parse(load('specialties.json'))};vm.createContext(ctx);
vm.runInContext(load('js/engine/class_models.js')+'\nthis.models=ClassCombatModels;',ctx);
const model=ctx.models;
const goals=['performance','survivability','sustained','burst'];
const contexts=['solo','party'];
assert.equal(Object.keys(model.profiles).length,7);
let total=0;
for(const [cls,p] of Object.entries(model.profiles)){
 assert(classes[cls],cls+': class missing');
 const skills=new Set(Object.values(classes[cls].skills).map(x=>x.name));
 for(const name of [...p.offense,...p.defense,...p.support,...Object.keys(p.milestones)])
  if(!stigmas[cls][name])assert(skills.has(name),cls+': unknown skill '+name);
 for(const name of [...p.burstBuffs,...p.survivalStigmas,...p.damageStigmas])
  assert(stigmas[cls][name],cls+': unknown Stigma '+name);
 assert.equal(p.damageStigmas.length,4);
 assert.equal(p.survivalStigmas.length,4);
 assert.equal(new Set(p.survivalStigmas).size,4);
 assert.equal(new Set(p.damageStigmas).size,4);
 assert(/^https:\/\//.test(p.evidence));
 const ranks=Object.fromEntries([...skills].map(name=>[name,8]));
 const baseBuild={mastery:ranks,boardSkills:{},gearSkills:{},boardStats:{},
   gearStats:{},equippedStigmas:p.damageStigmas,
   stigma:Object.fromEntries(p.damageStigmas.map(name=>[name,10]))};
 for(const mode of contexts){
  for(const goal of goals){
   const advice=model.advice(cls,mode,goal,{core:p.offense,support:p.support,
     stigmas:p.damageStigmas,stigmaPriority:p.damageStigmas,why:'Source baseline for test'});
   assert.equal(advice.stigmas.length,4);
   for(const stigma of advice.stigmas)assert(stigmas[cls][stigma]);
   const a=model.evaluate({classId:cls,context:mode,objective:goal,build:baseBuild});
   assert(Number.isFinite(a.score)&&a.score>0,cls+' '+goal+': invalid score');
   assert(Number.isFinite(a.sustained)&&Number.isFinite(a.burst));
   assert(Number.isFinite(a.survival)&&a.survival>0);
   assert(a.provenance.source===p.evidence);
   total++;
  }
 }
 const stronger={...baseBuild,boardStats:{AmplifyAllDamage:1000,HPMax:1000}};
 const before=model.evaluate({classId:cls,context:'party',objective:'performance',build:baseBuild});
 const after=model.evaluate({classId:cls,context:'party',objective:'performance',build:stronger});
 assert(after.score>before.score,cls+': adding damage and HP did not improve performance');
}
// This is a chosen-Specialty test, not simply a rank gate. Judgment's
// cooldown-removal option must not be credited if the user deselects it.
const tSkills=new Set(Object.values(classes.templar.skills).map(x=>x.name));
const mastery=Object.fromEntries([...tSkills].map(name=>[name,8]));
mastery.Judgment=16;mastery['Warding Strike']=16;
const tBuild={mastery,boardSkills:{},gearSkills:{},boardStats:{},gearStats:{},
  equippedStigmas:['Doom Shield','Shield of Protection','Noble Armor','Taunt'],
  stigma:{'Doom Shield':5,'Shield of Protection':5,'Noble Armor':5,Taunt:5}};
const withReset=model.evaluate({classId:'templar',context:'party',objective:'sustained',
  build:tBuild,selectedSpecs:{Judgment:[5,3]}});
const withoutReset=model.evaluate({classId:'templar',context:'party',objective:'sustained',
  build:tBuild,selectedSpecs:{Judgment:[3,4]}});
assert(withReset.sustained>withoutReset.sustained,
 'Deselected Judgment cooldown Specialty must not receive reset credit');
// Skill Speed is a chosen Specialty modifier, not a generic rank bonus.
// Each class's active toolkit exposes at least one imported Global option.
const speedPicks={
  gladiator:['Ruinous Blow',1],
  templar:['Punishment',3],
  assassin:['Savage Roar',2],
  ranger:['Deadshot',2],
  spiritmaster:['Combustion',4],
  cleric:['Judgment Thunder',3],
  chanter:['Impactful Crush',4]
};
for(const [cls,[skill,id]] of Object.entries(speedPicks)){
  const p=model.profile(cls),names=Object.values(classes[cls].skills).map(x=>x.name);
  const ranks=Object.fromEntries(names.map(name=>[name,8]));
  ranks[skill]=12;
  const equipped=p.damageStigmas;
  const build={mastery:ranks,boardSkills:{},gearSkills:{},boardStats:{},
    gearStats:{},equippedStigmas:equipped,
    stigma:Object.fromEntries(equipped.map(name=>[name,10]))};
  const slower=model.evaluate({classId:cls,context:'party',objective:'burst',
    build,selectedSpecs:{[skill]:[]}});
  const faster=model.evaluate({classId:cls,context:'party',objective:'burst',
    build,selectedSpecs:{[skill]:[id]}});
  assert(faster.castThroughput>slower.castThroughput,cls+': skill speed not applied');
  assert(faster.burst>slower.burst,cls+': faster casts missing from burst');
  assert(faster.sustained>slower.sustained,cls+': faster casts missing from sustained');
  const haste=model.evaluate({classId:cls,context:'party',objective:'burst',
    build:{...build,boardStats:{CoolTimeDecrease:1000}}});
  assert(haste.burst>slower.burst,cls+': burst ignored cooldown reduction');
  const combatSpeed=model.evaluate({classId:cls,context:'party',objective:'burst',
    build:{...build,boardStats:{CombatSpeed:1000}}});
  assert(combatSpeed.castThroughput>slower.castThroughput,cls+': combat speed missed');
}
console.log('Validated '+total+' class/context/objective mechanic projections across seven Global classes.');
