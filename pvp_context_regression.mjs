// Check four PvP contexts for all Global classes and 61-point Templar regression.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const load=p=>JSON.parse(read(p));
const DATA=load('classes_data.json'),STIGMAS=load('stigmas.json');
const ctx={DATA,STIGMAS,SKILL_UNLOCKS:load('skill_unlocks.json'),LEVEL_REWARDS:load('level_rewards.json'),
 SPECS:load('specialties.json'),ROUTES:load('context_routes.json'),AZPHEL:load('azphel_data.json'),
 PROFILES:vm.runInNewContext(read('js/profiles.js')+'\nPROFILES'),
 localStorage:{getItem:()=>null},console};
vm.createContext(ctx);
const source=read('js/app.js');
vm.runInContext(read('js/recommendations.js')+'\n'+read('js/progression.js')+'\n'+source.slice(0,source.indexOf('function render(){'))+
 '\nglobalThis.testing={isPvpContext,adviceFor,progressionMasteryStages,optimizeRecommendedStigmas,progressionBoardTargets,state,account,activeWeights};',ctx);
const p=ctx.testing;
const modes=['pvp','pvp-arena','pvp-abyss-solo','pvp-abyss-group'];
const costs=rank=>Array.from({length:rank},(_,i)=>i+1<=5?1:i+1<=10?2:i+1<=15?4:8).reduce((a,b)=>a+b,0);
let count=0;
for(const cls of Object.keys(DATA)){
 p.state.class=cls;
 const skills=new Set(Object.values(DATA[cls].skills).map(s=>s.name));
 for(const mode of modes){
  p.account().context=mode;
  const advice=p.adviceFor(cls,mode);
  assert(p.isPvpContext(mode),cls+' '+mode+' is not PvP');
  assert(advice?.why?.length>40,cls+' '+mode+' missing explanation');
  assert.equal(new Set(advice.stigmas).size,4,cls+' '+mode+' duplicate stigma');
  for(const name of advice.stigmas)assert(STIGMAS[cls][name],cls+' '+mode+' unknown stigma '+name);
  for(const name of [...advice.core,...advice.support])assert(skills.has(name),cls+' '+mode+' unknown mastery '+name);
  assert(Object.keys(p.activeWeights().skills).length>0);
  assert.equal(Object.keys(p.progressionBoardTargets(cls,mode)).length,0);
  for(const points of [29,61,100,300]){
    const allocation=p.optimizeRecommendedStigmas(advice.stigmas,points,cls,mode);
    assert.equal(Object.values(allocation.levels).reduce((sum,rank)=>sum+costs(rank),0),allocation.spent);
    assert(allocation.spent<=points&&Object.values(allocation.levels).every(rank=>Number.isInteger(rank)&&rank>=0&&rank<=20));
  }
  count++;
 }
}
p.state.class='templar';p.account().context='party';
const t=p.optimizeRecommendedStigmas(p.adviceFor('templar','party').stigmas,61,'templar','party');
assert.equal(t.spent,60);
assert.equal(t.levels['Noble Armor'],15);
assert.equal(t.levels['Shield of Protection'],10);
assert.equal(t.levels.Taunt,5);
assert.equal(t.levels['Doom Shield'],5);
console.log('Verified '+count+' PvP class/mode combinations, 29–300 point allocations and Templar 61-point breakpoints.');
