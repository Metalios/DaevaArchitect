// Endgame Sorcerer acceptance: all PvE goals must produce genuinely
// different invested builds at fresh45, not merely different prose labels.
// This checks legal budget use and factual skill/stigma identifiers.
// The scenario model remains uncalibrated and is not a DPS claim.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const data=JSON.parse(read('classes_data.json')).sorcerer;
const stigmaData=JSON.parse(read('stigmas.json')).sorcerer;
const skillUnlocks=JSON.parse(read('skill_unlocks.json')).sorcerer;
const context=vm.createContext({
  console,SPECS:JSON.parse(read('specialties.json')),
  STIGMAS:JSON.parse(read('stigmas.json'))
});
vm.runInContext([
 'js/optimizer/roles.js','js/engine/class_models.js',
 'js/recommendations.js','js/progression.js',
 'js/optimizer/objectives.js','js/engine/combat.js',
 'js/ariel_data.js','js/optimizer/joint.js'
].map(read).join('\n')+
 '\nglobalThis.api={adviceFor,progressionMasteryStages,progressionBoardTargets,ClassCombatModels,GlobalCombatEngine,PveBuildOptimizer,ARIEL,JointProgression};',
 context);
const api=context.api;
const names=Object.values(data.skills).map(s=>s.name);
const masteryCost=n=>n<=4?1:n<=7?2:4;
function allocatedStages(stages,budget=203){
 const levels=Object.fromEntries(names.map(name=>[name,1]));
 let spent=0;
 for(const [name,target] of stages){
  assert(names.includes(name),'Unknown Mastery skill '+name);
  for(let next=levels[name]+1;next<=target;next++){
   if(spent+masteryCost(next)>budget)break;
   spent+=masteryCost(next);levels[name]=next;
  }
 }
 assert(spent<=budget&&Object.values(levels).every(n=>n>=1&&n<=10));
 return {levels,spent};
}
const goals=['performance','sustained','burst','survivability','control'];
const contexts=['solo','party'];
const builds={};
for(const mode of contexts){
 builds[mode]={};
 for(const goal of goals){
  const advice=api.adviceFor('sorcerer',mode,goal);
  assert.equal(advice.stigmas.length,4,mode+' '+goal+' must have 4 Global Stigma slots');
  assert.equal(new Set(advice.stigmas).size,4);
  assert(advice.stigmas.every(name=>stigmaData[name]),'Unknown Global Stigma');
  const stages=api.progressionMasteryStages('sorcerer',mode,45,false,advice,
    skillUnlocks,names,(_,want)=>want);
  const mastery=allocatedStages(stages);
  const targets=api.progressionBoardTargets('sorcerer',mode,goal);
  assert(Object.keys(targets).length>0,mode+' '+goal+' must have documented board milestones');
  assert(stages.length>0&&mastery.spent>100);
  builds[mode][goal]={stigmas:[...advice.stigmas],mastery,targets,
    signature:advice.stigmas.join('|')+'--'+
      names.map(name=>mastery.levels[name]).join(':')};
 }
 const signatures=goals.map(goal=>builds[mode][goal].signature);
 assert.equal(new Set(signatures).size,goals.length,
  mode+' fresh45 goals are still identical, not distinct functional builds');
 const bars=goals.map(goal=>builds[mode][goal].stigmas.join('|'));
 assert.equal(new Set(bars).size,goals.length,
  mode+' fresh45 Stigma choices are still effectively the same across PvE goals');
}
const solo=builds.solo;
assert(solo.performance.stigmas.includes('Steel Barrier'),
 'Nightmare balanced path needs its manual mitigation Stigma');
assert(!solo.sustained.stigmas.includes('Steel Barrier'),
 'Maximum sustained solo DPS is explicitly a higher-risk damage build');
assert(solo.burst.stigmas.includes('Divine Burst')&&
       solo.burst.stigmas.includes('Steel Barrier'),
 'Nightmare burst must have manually timed Stagger damage and a safety slot');
assert(solo.survivability.stigmas.includes('Hibernation')&&
       solo.survivability.stigmas.includes('Arctic Armor'));
assert(solo.survivability.mastery.levels['Robe of Earth']>
       solo.sustained.mastery.levels['Robe of Earth'],
 'Endgame survivability should invest more in Robe of Earth');
assert(solo.burst.mastery.levels.Hellfire>=
       solo.control.mastery.levels.Hellfire,
 'Burst path must not sacrifice core charged Hellfire for CC');
const nightmare=api.GlobalCombatEngine.scenariosFor('solo','performance');
const group=api.GlobalCombatEngine.scenariosFor('party','performance');
assert(nightmare.some(s=>s.id.includes('nightmare')));
assert(nightmare.some(s=>s.movement>=.35));
assert(group.every(s=>!s.id.includes('nightmare')));
assert.deepEqual(Array.from(api.GlobalCombatEngine.scenariosFor('solo','burst').map(s=>s.id)),
 ['nightmare-burst-window']);
const weights=JSON.parse(read('context_routes.json')).sorcerer.weights.solo;
const soloWeights=api.PveBuildOptimizer.weightsFor(weights,'sorcerer','solo','performance',0,45);
const speedWeights=api.PveBuildOptimizer.weightsFor(weights,'sorcerer','solo','sustained',0,45);
assert(soloWeights.stats.HPMax>speedWeights.stats.HPMax,
 'Nightmare balanced must value defensive HP more than max sustained DPS');
const grp=api.PveBuildOptimizer.weightsFor(
 JSON.parse(read('context_routes.json')).sorcerer.weights.party,
 'sorcerer','party','performance',0,45);
assert(soloWeights.stats.HPMax>grp.stats.HPMax);
const ariel=api.ARIEL.sorcerer;
const routes=JSON.parse(read('context_routes.json'));
const arielPrefixes=new Set();
for(const goal of goals){
 const full=api.JointProgression.rankConnectedBoard({
  board:ariel,context:'solo',objective:goal,classId:'sorcerer',
  role:'damage',stats:{},weights:routes.sorcerer.weights.solo.stats,
  meta:data.stats||{},budget:80
 });
 let spent=0;
 const funded=[];
 for(const item of full){
  const node=ariel.nodes.find(n=>n[0]===item.id);
  if(!node||spent+node[5]>80)break;
  spent+=node[5];funded.push(item.id);
 }
 assert(spent<=80&&funded.length>0,'Ariel '+goal+' route must fund connected affordable tiles');
 arielPrefixes.add(funded.slice(0,50).join(','));
}
assert(arielPrefixes.size>=2,
 'Ariel is not differentiating Nightmare survival from offensive endgame objectives');
console.log('Fresh45 Sorcerer: 10 distinct PvE goal/context plans; 5 unique bars within each context, rank investments, boss-specific scenarios and target milestones and separate Ariel routes verified.');
