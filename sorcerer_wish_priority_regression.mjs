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
 context:'solo',
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
 const auto=false; // Equipped rank-16 reset requires human timing in all goals.
 const r=pick.stacks.find(stack=>stack.key==='R');
 assert(!r||!r.skills.includes('Wish of Concentration'),
  'Cooldown-reset Wish must stay manual for Nightmare damage');
 assert(!pick.stacks.some(stack=>stack.skills.includes('Delayed Explosion')),
  'Four-second amplification cannot be blindly looped');
 const wished=engine.compareWishAutomation(input,specialties,scenarios,compare.selected);
 assert(Number.isFinite(wished.automatic.robustScore));
 assert(Number.isFinite(wished.timedManual.robustScore));
 assert.equal(wished.selected,'timedManual');
 assert.equal(wished.automatic.wishCastsAuto,0,
  'Counterfactual automatic policy must respect the purchased cooldown-reset Specialty');
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
assert.equal(automated.wishCastsAuto,0,
 'With cooldown-reset Specialty Wish remains manually timed');
assert(automated.wishBuffUptime>0);
assert(automated.wishResetTargets>=1,'Manual reset Wish should hit an existing cooldown');
const noReset={...specialties,'Wish of Concentration':[2,4]};
const sustained={...build,objective:'sustained'};
const noResetWish=engine.compareWishAutomation(sustained,noReset,scenarios);
const eligible=noResetWish.automatic.robustScore>=
 noResetWish.timedManual.robustScore*.985;
assert.equal(noResetWish.selected,eligible?'automatic':'timedManual');
const noResetMacro=engine.chooseMacro(sustained,noReset,scenarios);
assert.equal(Boolean(noResetMacro.stacks.some(stack=>
 stack.skills.includes('Wish of Concentration'))),eligible,
 'Chosen reset-free Wish automation must match the comparison decision');
console.log('Sorcerer Q priority & Wish timeline candidates:');
for(const r of results)
 console.log(JSON.stringify(r));
console.log('PASS: five goals, conditional Blaze-vs-Firestorm, manual reset Wish and comparison-driven reset-free automation, complete-only hits.');
