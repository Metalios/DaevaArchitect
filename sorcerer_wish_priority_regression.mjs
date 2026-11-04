// Global Sorcerer: compare both fire priorities, automatic vs timed manual
// Wish, and verify that no unfinished charge/attack is counted as damage.
// These are RELATIVE model tests, not observed player DPS measurements.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(read('js/engine/combat.js')+
  '\nglobalThis.engine=GlobalCombatEngine;',ctx);
const engine=ctx.engine;
const skills=Object.keys(JSON.parse(read('skill_unlocks.json')).sorcerer);
const equipped=['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm'];
const build={
 mastery:Object.fromEntries(skills.map(name=>[name,10])),
 boardSkills:{'Hellfire':10,'Wish of Concentration':10,'Firestorm':10},
 gearSkills:{},boardStats:{},gearStats:{},objective:'performance',
 stigma:Object.fromEntries(equipped.map(name=>[name,10])),
 equippedStigmas:equipped,availableSkills:skills,macroLayout:'flow'
};
const specialties={
 'Hellfire':[1,3,5],'Firestorm':[2,4,5],'Blaze':[3,5],
 'Wish of Concentration':[2,4,5],'Frost Burst':[2],
 'Frost':[2,3],'Bittercold Wind':[2],"Winter's Shackles":[1,3]
};
const scenarios=[
 {id:'nightmare-stationary-opportunity',duration:180,movement:.18,animation:1,weight:.4},
 {id:'nightmare-moving',duration:180,movement:.65,animation:1.15,weight:.6}
];
const results=[];
for(const goal of ['performance','sustained','burst','survivability','control']){
 const input={...build,objective:goal};
 const compare=engine.compareFirePriority(input,specialties,scenarios);
 for(const key of ['blaze','firestorm']){
  assert(Number.isFinite(compare.variants[key].robustScore)&&
    compare.variants[key].robustScore>0,
    'Both fire priorities require a completed combat simulation');
 }
 const firestormWins=compare.variants.firestorm.robustScore>
   compare.variants.blaze.robustScore*(1+compare.switchMargin);
 assert.equal(compare.selected,firestormWins?'firestorm':'blaze',
   'Fire priority must be selected by the explicitly modeled comparison');
 const pick=engine.chooseMacro(input,specialties,scenarios);
 assert.equal(pick.mode,'flow');
 assert.equal(pick.firePriority,compare.selected);
 assert.deepEqual(Array.from(pick.stacks[0].skills),
   compare.selected==='firestorm'?['Firestorm','Blaze']:['Blaze','Firestorm']);
 const auto=goal!=='burst';
 const expectedWish=engine.flowLayout(input,specialties).stacks
  .flatMap(stack=>stack.skills).includes('Wish of Concentration');
 assert.equal(expectedWish,auto,'Only continuous goals auto-cycle Wish');
 const r=pick.stacks.find(stack=>stack.key==='R');
 if(auto){
  assert(r&&r.skills.at(-1)==='Wish of Concentration',
    'Wish must be last in the R column after offensive buffs');
  assert(!r.skills.includes('Hellfire'));
 }else{
  assert(!pick.stacks.some(stack=>
    stack.skills.includes('Wish of Concentration')),
    'Burst must retain manual Wish');
 }
 const wished=engine.compareWishAutomation(input,specialties,scenarios,compare.selected);
 assert(Number.isFinite(wished.automatic.robustScore));
 assert(Number.isFinite(wished.timedManual.robustScore));
 assert.equal(wished.selected,auto?'automatic':'timedManual');
 if(auto){
  assert(wished.automatic.manualPerMinute<wished.timedManual.manualPerMinute,
    'Continuous automatic Wish must eliminate at least one routine manual action');
  assert(wished.automatic.wishCastsAuto>0,
    'Automatic Wish must actually fire during the modeled fight');
 }else{
  assert.equal(wished.automatic.wishCastsAuto,0,
    'Burst objective must not automate Wish even for a counterfactual flag');
 }
 assert.equal(wished.timedManual.wishCastsAuto,0);
 assert(wished.automatic.wishResetSeconds>=0&&
   wished.timedManual.wishResetSeconds>=0);
 results.push({
  goal,priority:compare.selected,
  blazeRelative:compare.variants.blaze.robustScore,
  firestormRelative:compare.variants.firestorm.robustScore,
  autoWishRelative:wished.automatic.robustScore,
  manualWishRelative:wished.timedManual.robustScore,
  wishResetAuto:wished.automatic.wishResetSeconds,
  wishResetManual:wished.timedManual.wishResetSeconds
 });
}
// No partial actions: a 0.1s encounter cannot complete any Sorcerer
// action; a queued Hellfire should not be counted as a full damage event.
const cutoff=engine.simulate({...build,autoWish:true},specialties,
 {id:'short-cutoff',duration:.1,movement:0,animation:1,weight:1});
assert.equal(cutoff.damage,0,'Never count an unfinished skill as a complete hit');
assert(cutoff.incompleteActions>0,'Incomplete attempt must be reported');
assert.equal(cutoff.counts.Hellfire||0,0);
assert.equal(cutoff.counts['Wish of Concentration']||0,0);
const manualBurst=engine.simulate({...build,objective:'burst'},specialties,
 scenarios[0]);
assert.equal(manualBurst.wishCastsAuto,0);
const automated=engine.simulate({...build,objective:'performance'},specialties,
 scenarios[1]);
assert(automated.wishCastsAuto>0);
assert(automated.wishBuffUptime>0);
assert(automated.wishResetTargets>=1,'Rank16 Wish should hit an existing cooldown');
console.log('Sorcerer Q priority & Wish timeline candidates:');
for(const r of results)
 console.log(JSON.stringify(r));
console.log('PASS: five goals, conditional Blaze-vs-Firestorm, auto-Wish vs manual reset, complete-only hits and Burst manual timing.');
