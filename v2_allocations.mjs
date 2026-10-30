import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const app=fs.readFileSync(new URL('js/app.js',import.meta.url),'utf8');
const context={
 DATA:read('classes_data.json'),ROUTES:read('context_routes.json'),
 AZPHEL:read('azphel_data.json'),SPECS:read('specialties.json'),
 STIGMAS:read('stigmas.json'),SKILL_UNLOCKS:read('skill_unlocks.json'),
 LEVEL_REWARDS:read('level_rewards.json'),
 PROFILES:vm.runInNewContext(fs.readFileSync(new URL('js/profiles.js',import.meta.url),'utf8')+'\nPROFILES'),
 localStorage:{getItem:()=>null},gearSkillLevels:()=>({}),console
};
vm.createContext(context);
vm.runInContext(app.slice(0,app.indexOf('function render(){'))+'\n'+app.slice(app.indexOf('function recommendedSpecPicks('),app.indexOf('function renderMastery('))+`
globalThis.v2check={
 set:(cls,level,journey='leveling')=>{state.class=cls;const a=account();a.journey=journey;a.context='solo';a.leveling.level=level;return a},
 recommendation:()=>allocate(masteryStages(),budget('mastery'),masteryCost,skillNames(),1,masteryRankCap),
 spend:(raw)=>manualAllocation(raw,skillNames(),budget('mastery'),masteryCost,1,masteryRankCap),
 stigma:(raw)=>manualAllocation(raw,activeStigmas(),budget('stigma'),stigmaCost,0,20),
 custom:modifiedBuild,account,stage:masteryStages,skills:skillNames,
 spec:specPicks,stigmaNames:activeStigmas,level:currentLevel
};`,context);
const {v2check:c}=context;
for(const cls of Object.keys(context.DATA)){
 for(const level of [1,12,20,21,23,25,32,40,45]){
   const a=c.set(cls,level);
   const baseline=c.recommendation();
   assert(!c.custom(),cls+' '+level+' starts recommended');
   a.gear={}; const stages=JSON.stringify(c.stage());
   a.gear[c.skills()[0]]=25;
   assert.equal(JSON.stringify(c.stage()),stages,cls+' '+level+': gear changed recommended priority');
   assert(!c.custom(),cls+' '+level+': gear marked build custom');
   a.manualMastery=Object.fromEntries(c.skills().map(n=>[n,10]));
   const plan=c.spend(a.manualMastery);
   assert(plan.spent<=context.LEVEL_REWARDS[level].mastery,cls+' '+level+': manual Mastery overspent');
   for(const name of c.skills()){
     if(context.SKILL_UNLOCKS[cls][name]>level)assert.equal(plan.levels[name],1,cls+' '+level+': unavailable skill trained');
   }
   assert(c.custom(),cls+' '+level+': Mastery edit not marked custom');
   a.manualMastery=null;
   a.manualStigma=Object.fromEntries(c.stigmaNames().map(n=>[n,20]));
   const sp=c.stigma(a.manualStigma);
   assert(sp.spent<=context.LEVEL_REWARDS[level].stigma,cls+' '+level+': Stigma overspent');
   a.manualStigma=null;
   assert(!c.custom());
 }
}
const a=c.set('templar',45,'endgame');
a.customSpecialties={'Pummel':[4,5,3]};
assert.deepEqual(Array.from(c.spec('Pummel',8)),[3],'Lv8 specialty gate incorrect');
assert.deepEqual(Array.from(c.spec('Pummel',12)),[4,3],'Lv12 specialty gate incorrect');
assert.deepEqual(Array.from(c.spec('Pummel',16)),[4,5],'Lv16 specialty gate incorrect');
assert.deepEqual(Array.from(c.spec('Pummel',20)),[4,5,3],'Lv20 third specialty slot incorrect');
assert(c.custom(),'custom specialty did not mark build modified');
a.customSpecialties={};
a.customStigmas=['Doom Shield','Noble Armor','Taunt','Shield of Protection'];
assert.equal(Array.from(c.stigmaNames()).join('|'),a.customStigmas.join('|'),'custom Stigma loadout not used');
console.log('v2: budget, gate, gear-neutral recommendations, Stigma and Specialty invariants validated for all eight classes.');
