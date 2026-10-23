// Recommendation quality invariants: actual Global data, 8 classes, 3 modes.
// These assert mechanically coherent guidance; they do not claim measured DPS.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const load=p=>JSON.parse(read(p));
const data=load('classes_data.json'),unlocks=load('skill_unlocks.json'),stigmas=load('stigmas.json');
const ctx=vm.createContext({});
vm.runInContext(read('js/recommendations.js')+'\n'+read('js/progression.js')+`
globalThis.policy={PROGRESSION_PLANS,PROGRESSION_ITEM_LEVEL,progressionMasteryStages,progressionStigmaStages,progressionBoardTargets,progressionNextBreakpoint,progressionRotationProfile,adviceFor};`,ctx);
const p=ctx.policy,classes=Object.keys(data);
assert.equal(classes.length,8);
assert.deepEqual([...Object.keys(p.PROGRESSION_PLANS)].sort(),[...classes].sort());
const stigmaCost=rank=>rank<=5?1:rank<=10?2:rank<=15?4:8;
function fund(stages,budget,slots){
 const ranks=Object.fromEntries(slots.map(name=>[name,0]));let spent=0;
 for(const [name,target] of stages){
  if(!(name in ranks))continue;
  while(ranks[name]<target){
   const cost=stigmaCost(ranks[name]+1);
   if(spent+cost>budget)break;
   spent+=cost;ranks[name]++;
  }
 }
 return {ranks,spent};
}
let checks=0;
for(const cls of classes){
 const names=Object.values(data[cls].skills).map(s=>s.name),known=new Set(names),stigmaSet=new Set(Object.keys(stigmas[cls]));
 const policy=p.PROGRESSION_PLANS[cls];
 for(const name of [...policy.leveling,...policy.endgame])assert(known.has(name),cls+': invalid core '+name);
 for(const [name,rank] of policy.breakpoints)assert(known.has(name)&&[8,12,16,20].includes(rank),cls+': invalid breakpoint '+name+' '+rank);
 for(const [name,rank] of policy.stigma)assert(stigmaSet.has(name)&&[5,10,15,20].includes(rank),cls+': invalid Stigma '+name);
 for(const mode of ['solo','party','pvp']){
  const advice=p.adviceFor(cls,mode);
  assert(advice&&advice.stigmas.length===4,cls+' '+mode+': missing actual advice');
  for(const name of [...advice.core,...advice.support])assert(known.has(name),cls+' '+mode+': unknown mastery '+name);
  const early=p.progressionMasteryStages(cls,mode,11,true,advice,unlocks[cls],names,(_,wanted)=>wanted);
  const finish=p.progressionMasteryStages(cls,mode,45,false,advice,unlocks[cls],names,(_,wanted)=>wanted);
  for(const level of [1,6,11,22,32,45]){
   const stages=p.progressionMasteryStages(cls,mode,level,true,advice,unlocks[cls],names,(_,wanted)=>wanted);
   assert(stages.length,cls+' '+mode+' Lv'+level+': empty mastery');
   for(const [name,wanted] of stages)assert(known.has(name)&&(unlocks[cls][name]||1)<=level&&wanted>=1&&wanted<=10,cls+' '+mode+' Lv'+level+': illegal '+name);
   checks++;
  }
  assert(finish.length>=early.length,cls+' '+mode+': truncated endgame');
  const equipped=advice.stigmas;
  for(const name of equipped)assert(stigmaSet.has(name),cls+' '+mode+': unknown equipped Stigma '+name);
  const stages=p.progressionStigmaStages(cls,mode,equipped,advice);
  for(const [name,rank] of stages)assert(equipped.includes(name)&&rank>=1&&rank<=20,cls+' '+mode+': illegal Stigma priority');
  const fresh=fund(stages,29,equipped);
  assert(fresh.spent<=29,cls+' '+mode+': fresh 45 overspend');
  assert(Math.max(...Object.values(fresh.ranks))>=10,cls+' '+mode+': fresh 45 failed first Lv10 perk');
  assert(Object.values(fresh.ranks).every(n=>n>=1),cls+' '+mode+': equipped but unlearned Stigma');
  const high=fund(stages,100,equipped);
  assert(high.spent<=100&&Math.max(...Object.values(high.ranks))>=15,cls+' '+mode+': 100-point milestone missing');
  const route=p.progressionBoardTargets(cls,mode);
  if(mode==='pvp')assert.equal(Object.keys(route).length,0);
  else for(const [name,targets] of Object.entries(route)){
   assert(known.has(name));assert(targets.milestones.length);
   assert(targets.milestones.every((goal,index,all)=>[8,12,16,20].includes(goal.rank)&&goal.weight>0&&(index===0||all[index-1].rank<=goal.rank)));
  }
  checks++;
 }
}
// Protect duplicate ranked milestones against a lossy Object.fromEntries map.
assert.deepEqual(Array.from(p.progressionBoardTargets('gladiator','party')['Overhead Slam'].milestones.map(x=>x.rank)),[16,20]);
assert.deepEqual(Array.from(p.progressionBoardTargets('cleric','solo').Condemnation.milestones.map(x=>x.rank)),[12,16]);
assert.equal(p.progressionBoardTargets('cleric','party')['Light of Regeneration'].milestones[0].rank,16);
assert.equal(p.progressionNextBreakpoint('cleric','party',()=>1,136).startsWith('Light of Regeneration'),true);
const clericProfile={stacks:[{key:'E',title:'Damage',skills:['Chain of Torment','Condemnation']}],hotbar:[],rule:'',macro:['E']};
const clericUpdated=p.progressionRotationProfile(clericProfile,'cleric','party',()=>10,['Earth Punishment']);
assert.deepEqual(Array.from(clericUpdated.stacks[0].skills),['Earth Punishment','Condemnation','Chain of Torment']);
const clericWithout=p.progressionRotationProfile(clericProfile,'cleric','party',()=>10,[]);
assert(!clericWithout.stacks[0].skills.includes('Earth Punishment'));
console.log('Verified '+checks+' actual Global class/context/level progression cases, fresh-45 Stigma Lv10 investment, cumulative board milestone ordering and Cleric macro synergy.');
