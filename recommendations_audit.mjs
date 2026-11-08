// Research-backed recommendation invariants for all eight AION 2 Global classes.
// The website presents priorities, not mathematically proven optima.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const scripts=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const lib=scripts('js/recommendations.js');
const app=scripts('js/app.js');
const DATA=read('classes_data.json'),STIGMAS=read('stigmas.json');
const ctx={DATA,STIGMAS,SKILL_UNLOCKS:read('skill_unlocks.json'),LEVEL_REWARDS:read('level_rewards.json'),
 SPECS:read('specialties.json'),ROUTES:read('context_routes.json'),AZPHEL:read('azphel_data.json'),ARIEL:vm.runInNewContext(scripts('js/ariel_data.js')+'\nARIEL'),
 PROFILES:vm.runInNewContext(scripts('js/profiles.js')+'\nPROFILES'),
 gearSkillLevels:()=>({}),localStorage:{getItem:()=>null},console};
vm.createContext(ctx);
vm.runInContext(lib+'\n'+app.slice(0,app.indexOf('function render(){'))+`
globalThis.api={state,account,adviceFor,adviceSpecialtyChoices,SPECIALTY_CONTEXT,activeStigmas,masteryStages,
 stigmaStages,recommendedStigmaAllocation,allocate,masteryCost,masteryRankCap,stigmaCost,skillNames,budget,modifiedBuild};
`,ctx);
let count=0;
for(const cls of Object.keys(DATA)){
 const skillNames=new Set(Object.values(DATA[cls].skills).map(skill=>skill.name));
 const stigmas=new Set(Object.keys(STIGMAS[cls]));
 for(const mode of ['party','solo','pvp']){
  const advice=ctx.api.adviceFor(cls,mode);
  assert(advice,cls+' '+mode+': missing advice');
  assert.equal(new Set(advice.stigmas).size,4,cls+' '+mode+': duplicate equipped Stigmas');
  assert.equal(advice.stigmas.length,4,cls+' '+mode+': Stigma count wrong');
  for(const name of [...advice.core,...advice.support])assert(skillNames.has(name),cls+' '+mode+': unknown Mastery skill '+name);
  for(const name of [...advice.stigmas,...advice.stigmaPriority])assert(stigmas.has(name),cls+' '+mode+': unknown Stigma '+name);
  assert(advice.why.length>=30,cls+' '+mode+': rationale missing');
  for(const level of [1,12,20,22,23,27,32,37,40,45]){
   ctx.api.state.class=cls;
   const a=ctx.api.account();a.journey='leveling';a.context=mode;a.leveling.level=level;
   a.manualMastery=null;a.manualStigma=null;a.customStigmas=null;a.customSpecialties={};
   a.gear={};
   const selected=Array.from(ctx.api.activeStigmas());
   assert.equal(selected.join('|'),advice.stigmas.join('|'),cls+' '+mode+': incorrect Stigma loadout');
   const names=Array.from(ctx.api.skillNames());
   const m=ctx.api.allocate(ctx.api.masteryStages(),ctx.api.budget('mastery'),ctx.api.masteryCost,names,1,ctx.api.masteryRankCap);
   assert(m.spent<=ctx.api.budget('mastery'),cls+' '+mode+' '+level+': Mastery overspend');
   for(const [name,rank] of Object.entries(m.levels))assert(rank<=ctx.api.masteryRankCap(name),cls+' '+mode+' '+level+': illegal Mastery rank '+name);
   const stigma=ctx.api.allocate(ctx.api.stigmaStages(),ctx.api.budget('stigma'),ctx.api.stigmaCost,selected,0);
   assert(stigma.spent<=ctx.api.budget('stigma'),cls+' '+mode+' '+level+': Stigma overspend');
   assert(!ctx.api.modifiedBuild(),'Changing class, level and context must not mark manually modified');
   count++;
  }
  // Audit the SAME recommendation function that model() calls, at every
  // actual leveling step rather than only inspecting a hypothetical stage
  // allocator with four endgame names.
  if(mode!=='pvp'){
   for(let level=1;level<=45;level++){
    ctx.api.state.class=cls;
    const a=ctx.api.account();a.journey='leveling';a.context=mode;
    a.leveling.level=level;a.manualStigma=null;a.customStigmas=null;
    const {names,allocation:plan}=ctx.api.recommendedStigmaAllocation();
    const unlocked=Array.from(ctx.api.activeStigmas()).slice(0,ctx.LEVEL_REWARDS[level].slots);
    assert.deepEqual(Array.from(names),unlocked,cls+' '+mode+' '+level+': locked slot in recommendation');
    assert.deepEqual(Object.keys(plan.levels),unlocked,cls+' '+mode+' '+level+': hidden Stigma rank');
    const actual=unlocked.reduce((total,name)=>{
     const rank=plan.levels[name];
     assert(Number.isInteger(rank)&&rank>=0&&rank<=20,cls+' '+mode+' '+level+': illegal Stigma rank');
     for(let n=1;n<=rank;n++)total+=ctx.api.stigmaCost(n);
     return total;
    },0);
    assert.equal(plan.spent,actual,cls+' '+mode+' '+level+': incorrect Stigma point accounting');
    const available=ctx.api.budget('stigma')-plan.spent;
    assert(available>=0,cls+' '+mode+' '+level+': overspent Stigma points');
    for(const name of unlocked){
     const rank=plan.levels[name];
     assert(rank===20||ctx.api.stigmaCost(rank+1)>available,
      cls+' '+mode+' '+level+': affordable Stigma rank left unused ('+available+' points)');
    }
    if(level===45)assert.equal(plan.spent,30,cls+' '+mode+': fresh-45 did not spend 30 Stigma points');
   }
  }
 }
}
// Context-specific Specialty effects must respect actual option/slot gates.
const allSpecs=ctx.SPECS;let specialtyChecks=0;
for(const [cls,modes] of Object.entries(ctx.api.SPECIALTY_CONTEXT||{})){
 for(const [mode,skills] of Object.entries(modes))for(const [name,breakpoints] of Object.entries(skills)){
  const options=allSpecs[cls]?.[name]?.options;
  assert(options,cls+' '+name+': missing skills for Specialty context');
  for(const [level,expected] of Object.entries(breakpoints)){
   const actual=ctx.api.adviceSpecialtyChoices(cls,mode,name,Number(level),options);
   assert.deepEqual(Array.from(actual),Array.from(expected),cls+' '+mode+' '+name+' '+level);
   assert(actual.length<=(Number(level)>=20?3:Number(level)>=12?2:1));
   specialtyChecks++;
  }
 }
}
console.log('Verified '+specialtyChecks+' role/context-specific Specialty breakpoint selections.');
console.log('Verified '+count+' researched class/context/level allocations, plus 720 all-class solo/group leveling Stigma recommendations with no hidden slots or affordable ranks left unspent.');

// Keep connected-board objective invariants in the existing CI audit suite.
await import('./objective_optimizer_audit.mjs');

await import('./class_models_audit.mjs');
