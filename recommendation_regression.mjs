// Pure-policy audit; no DOM or gaming performance claims.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('./js/progression.js',import.meta.url),'utf8');
const load=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const data=load('classes_data.json'),unlocks=load('skill_unlocks.json'),stigmas=load('stigmas.json');
const ctx=vm.createContext({});
vm.runInContext(source+'\nglobalThis.policy={PROGRESSION_PLANS,PROGRESSION_ITEM_LEVEL,progressionMasteryStages,progressionStigmaStages,progressionBoardTargets,progressionNextBreakpoint,progressionRotationProfile};',ctx);
const p=ctx.policy;
const classes=Object.keys(data);
assert.equal(classes.length,8);
assert.deepEqual([...Object.keys(p.PROGRESSION_PLANS)].sort(),[...classes].sort());
let checks=0;
for(const cls of classes){
 const allSkills=Object.values(data[cls].skills).map(s=>s.name);
 const skillSet=new Set(allSkills),stigmaSet=new Set(Object.keys(stigmas[cls]));
 const definition=p.PROGRESSION_PLANS[cls];
 for(const name of [...definition.leveling,...definition.endgame])assert(skillSet.has(name),cls+': unknown '+name);
 for(const [name,rank] of definition.breakpoints){assert(skillSet.has(name));assert([8,12,16,20].includes(rank))}
 for(const [name,rank] of definition.stigma){assert(stigmaSet.has(name),cls+': unknown Stigma '+name);assert([5,10,15,20].includes(rank))}
 for(const mode of ['solo','party','pvp']){
  const advice={core:definition.endgame,support:[],stigmaPriority:definition.stigma.map(x=>x[0])};
  for(const level of [1,6,11,22,32,45]){
   const mastery=p.progressionMasteryStages(cls,mode,level,true,advice,unlocks[cls],allSkills,(_,wanted)=>wanted);
   assert(mastery.length);
   for(const [name,wanted] of mastery){assert(skillSet.has(name));assert((unlocks[cls][name]||1)<=level);assert(wanted>=1&&wanted<=10)}
   checks++;
  }
  const mastery=p.progressionMasteryStages(cls,mode,45,false,advice,unlocks[cls],allSkills,(_,wanted)=>wanted);
  assert(mastery.length);
  const chosen=definition.stigma.map(x=>x[0]).slice(0,4);
  while(chosen.length<4){const candidate=[...stigmaSet].find(x=>!chosen.includes(x));chosen.push(candidate)}
  const ranks=p.progressionStigmaStages(cls,mode,chosen,advice);
  for(const [name,rank] of ranks){assert(chosen.includes(name));assert([5,10,15,20].includes(rank))}
  const board=p.progressionBoardTargets(cls,mode);
  if(mode==='pvp')assert.equal(Object.keys(board).length,0);
  else assert(Object.keys(board).length>0);
  checks++;
 }
}
assert.equal(p.PROGRESSION_ITEM_LEVEL[0].level,1200);
console.log('Progression policy: '+checks+' class/context/level invariants verified.');
