// Sorcerer Global full-path regression: four PvE goals, control role,
// four PvP venues, corrected skill effects, manual reaction skills and
// independently funded/purchased Daevanion special boards.
// These assertions verify deterministic implementation, NOT real match DPS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const json=name=>JSON.parse(read(name));
const skills=json('skill_unlocks.json').sorcerer;
const stigmaData=json('stigmas.json');
const specs=json('specialties.json');
const azphel=json('azphel_data.json').sorcerer;
const ctx=vm.createContext({SPECS:specs,STIGMAS:stigmaData,console});
vm.runInContext([
 'js/ariel_data.js',
 'js/optimizer/roles.js',
 'js/engine/pvp_models.js',
 'js/engine/class_models.js',
 'js/recommendations.js',
 'js/progression.js',
 'js/profiles.js',
 'js/optimizer/joint.js',
 'js/engine/combat.js'
].map(read).join('\n')+`\n globalThis.sorc={
 RoleBuildGoals,ClassCombatModels,PvpCombatModels,
 adviceFor,progressionMasteryStages,progressionBoardTargets,
 progressionRotationProfile,JointProgression,GlobalCombatEngine,PROFILES,ARIEL
 };`,ctx);
const A=ctx.sorc;
const ariel=A.ARIEL.sorcerer;
assert(A.ClassCombatModels.profile('sorcerer'),
 'Sorcerer missing from shared Mastery/Stigma/Specialty combat model');
assert.equal(A.PROFILES.sorcerer.weave,'Flame Arrow');
const names=Object.keys(skills);
const adjust=(name,level)=>Math.max(1,Math.min(10,level));
const knownStigmas=new Set(Object.keys(stigmaData.sorcerer));
const goals=['performance','sustained','burst','survivability','control'];
for(const context of ['solo','party']){
 for(const goal of goals){
  const advice=A.adviceFor('sorcerer',context,goal);
  assert.equal(advice.stigmas.length,4,context+' '+goal+' must equip exactly four');
  assert(advice.stigmas.every(name=>knownStigmas.has(name)));
  const stages=A.progressionMasteryStages('sorcerer',context,45,false,
    advice,skills,names,adjust);
  assert(stages.length>10&&stages.every(([name,rank])=>
    names.includes(name)&&rank>=1&&rank<=10));
  const targets=A.progressionBoardTargets('sorcerer',context,goal);
  if(goal==='survivability')
    assert(Object.hasOwn(targets,'Robe of Earth')&&
      Object.hasOwn(targets,'Absorb Essence'),
      'Survivability must target real defensive skill breakpoints, not damage-only gates');
  else if(goal==='control')
    assert(Object.hasOwn(targets,"Winter's Shackles"));
  else assert(Object.keys(targets).length>0);
  if(goal==='survivability'){
    assert.equal(advice.core[0],'Robe of Earth');
    assert(advice.stigmas.includes('Arctic Armor')&&advice.stigmas.includes('Steel Barrier'));
  }
 }
}
const pvpModes=['pvp','pvp-arena','pvp-abyss-solo','pvp-abyss-group'];
for(const context of pvpModes){
 const advice=A.adviceFor('sorcerer',context);
 const rotation=A.progressionRotationProfile(A.PROFILES.sorcerer,
  'sorcerer',context,()=>20,advice.stigmas);
 assert.deepEqual(Array.from(rotation.macro),['Q'],context+' must not automate control');
 assert.deepEqual(Array.from(rotation.stacks.filter(s=>!s.manual)
   .flatMap(s=>s.skills)),['Blaze','Firestorm']);
 assert(!rotation.stacks.some(s=>s.skills.some(name=>
  ['Hellfire','Hibernation','Soul Freeze','Curse: Tree','Arctic Armor','Steel Barrier',
   'Frost',"Winter's Shackles","Lumiel's Space"].includes(name))));
 assert.equal(rotation.hotbar[0][0][0],'Hellfire');
 assert.equal(rotation.hotbar[1][0][0],'Wish of Concentration');
 for(const stigma of advice.stigmas)
  assert(rotation.hotbar.some(([powers])=>powers.includes(stigma)),
    context+' omitted equipped manual Stigma '+stigma);
 const base=Object.fromEntries(names.map(name=>[name,8]));
 const build={mastery:base,boardSkills:{},gearSkills:{},boardStats:{},
  gearStats:{},stigma:Object.fromEntries(advice.stigmas.map(name=>[name,10])),
  equippedStigmas:advice.stigmas,pvpOpponent:'all',availableSkills:names};
 for(const opponent of Object.keys(A.PvpCombatModels.OPPONENTS)){
  const outcome=A.ClassCombatModels.evaluate({
   classId:'sorcerer',context,build:{...build,pvpOpponent:opponent}});
  assert(Number.isFinite(outcome.score)&&outcome.score>0);
  assert.equal(outcome.scenarios.length,1);
 }
 const antiheal=A.PvpCombatModels.evaluate({
  classId:'sorcerer',context,build,
  selectedSpecs:{Firestorm:[3],Frost:[4],'Bittercold Wind':[3]}});
 const fallback=A.PvpCombatModels.evaluate({
  classId:'sorcerer',context,build,selectedSpecs:{
   Firestorm:[2],Frost:[2],'Bittercold Wind':[2]}});
 assert(antiheal.metrics.antiheal>fallback.metrics.antiheal,
  'Firestorm PvP healing reduction Specialty must be modeled');
 assert(antiheal.metrics.control>fallback.metrics.control,
  'Frost PvP chance and Bittercold Wind pull must be modeled');
}
const baseSkills=Object.fromEntries(names.map(name=>[name,10]));
const combatBuild={
 mastery:baseSkills,boardSkills:{},gearSkills:{},
 boardStats:{},gearStats:{},
 stigma:{'Element Enhancement':10,'Delayed Explosion':10,'Fire Wall':5,'Cold Storm':5},
 equippedStigmas:['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm'],
 availableSkills:names,macroLayout:'ground'
};
const scene={id:'stationary',duration:180,movement:0,animation:1,weight:1};
const model=A.GlobalCombatEngine;
const special={Firestorm:[2,4],'Wish of Concentration':[2,5],Frost:[2,3],Hellfire:[1]};
const complete=model.simulate(combatBuild,special,scene);
assert(Number.isFinite(complete.score)&&complete.score>0);
assert((complete.damageBySkill['Delayed Explosion']||0)>0,
 'Delayed Explosion must resolve a deferred damage event');
assert((complete.damageBySkill['Fire Wall']||0)>0,
 'Fire Wall must account for its periodic damage events');
const noElement=model.simulate({...combatBuild,
 stigma:{...combatBuild.stigma,'Element Enhancement':0}},special,scene);
assert(complete.score>noElement.score*.90,
 'Element buff may not be incorrectly overwritten by Wish buff');
const mobile=model.simulate(combatBuild,special,
 {...scene,id:'mobile',movement:.5});
assert(mobile.missedGround>complete.missedGround);
const noStigma=model.chooseMacro({...combatBuild,
 equippedStigmas:[],stigma:{}},special);
assert(!noStigma.steps.includes('R'));
for(const board of [azphel,ariel]){
 assert(board.nodes.length>30);
 const initial=A.JointProgression.rankConnectedBoard({
  board,context:board.name==='Azphel'?'pvp-arena':'party',
  classId:'sorcerer',budget:70,weights:{},meta:{}});
 const lock=initial.find((entry,i)=>i>=10&&i<=20);
 assert(lock,'Expected a reachable non-root special-board tile');
 const route=A.JointProgression.rankConnectedBoard({
  board,context:board.name==='Azphel'?'pvp-abyss-group':'party',
  classId:'sorcerer',budget:70,weights:{},
  meta:{},locked:[lock.id]});
 let spent=0;const funded=new Set();
 for(const entry of route){
  const node=board.nodes.find(n=>n[0]===entry.id);
  if(spent+node[5]>70)break;
  spent+=node[5];funded.add(entry.id);
 }
 assert(funded.has(lock.id),'Existing special-board purchase lost: '+board.name);
 assert.equal(new Set(route.map(x=>x.id)).size,board.nodes.length-1);
}
console.log('Sorcerer: 10 PvE goals, 4 PvP venues x 8 foes, timed damage scenarios and both purchased special boards validated.');
