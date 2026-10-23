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
 SPECS:read('specialties.json'),ROUTES:read('context_routes.json'),AZPHEL:read('azphel_data.json'),
 PROFILES:vm.runInNewContext(scripts('js/profiles.js')+'\nPROFILES'),
 gearSkillLevels:()=>({}),localStorage:{getItem:()=>null},console};
vm.createContext(ctx);
vm.runInContext(lib+'\n'+app.slice(0,app.indexOf('function render(){'))+`
globalThis.api={state,account,adviceFor,activeStigmas,masteryStages,
 stigmaStages,allocate,masteryCost,masteryRankCap,stigmaCost,skillNames,budget,modifiedBuild};
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
 }
}
console.log('Verified '+count+' researched class/context/level allocations (8 classes × 3 contexts × 10 levels) with legal spending and valid data identifiers.');
