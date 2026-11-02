// Deterministic engine tests use ILLUSTRATIVE mechanics/math only. They do NOT
// assert that these toy damages or action locks were measured in AION 2 Global.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const load=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(load('js/engine/combat_timeline.js')+
  '\nglobalThis.timeline=GlobalTimelineEngine;',ctx);
const engine=ctx.timeline;
const action=(id,cooldown,flatDamage=100,triggers=[])=>({
  id,cooldown,flatDamage,attackCoefficient:0,hits:1,lockSeconds:.5,
  triggers,timingSource:'scenario',damageSource:'scenario'
});
function run(abilities,priority,duration=12,other={}){
  return engine.simulate({abilities,priority,duration,attack:0,...other});
}
assert.equal(engine.COOLDOWN_REDUCTION_CAP,.6);
{
  const base=run([action('A',10)],['A']);
  const haste=run([action('A',10)],['A'],12,{extraHaste:.5});
  const cap=run([action('A',10)],['A'],12,{extraHaste:.99});
  const atCap=run([action('A',10)],['A'],12,{extraHaste:.6});
  assert.equal(base.bySkill.A.casts,2);
  assert.equal(haste.bySkill.A.casts,3);
  assert.equal(cap.bySkill.A.casts,atCap.bySkill.A.casts);
  assert.equal(cap.totalDamage,atCap.totalDamage);
}
{
  const initial=[
    action('Judgment',5,100),
    action('Shield Smite',10,10)
  ];
  const triggered=[
    action('Judgment',5,100),
    action('Shield Smite',10,10,[{event:'hit',effect:'cooldown',target:'Judgment',operation:'reset'}])
  ];
  const without=run(initial,['Judgment','Shield Smite'],12);
  const withReset=run(triggered,['Judgment','Shield Smite'],12);
  assert(withReset.bySkill.Judgment.casts>without.bySkill.Judgment.casts,
    'A conditional reset must create additional Judgment opportunities, not a flat multiplier.');
  assert(withReset.metrics.resets>0);
}
{
  const baseline=run([action('A',10,100),action('B',10,10)],['A','B'],12);
  const reduced=run([action('A',10,100),
    action('B',10,10,[{event:'hit',effect:'cooldown',target:'A',operation:'reduce',seconds:7}])],['A','B'],12);
  assert(reduced.bySkill.A.casts>baseline.bySkill.A.casts,
    'Flat cooldown-second reduction must affect future cast times.');
  assert(reduced.metrics.reductions>0);
}
{
  const buf=action('Buff',20,0,[{event:'hit',effect:'buff',id:'Power',duration:5,damageMultiplier:2}]);
  const strike=action('Strike',0,100);
  const result=run([buf,strike],['Buff','Strike'],3);
  assert(result.bySkill.Strike.damage>result.bySkill.Strike.casts*100,
    'Buff must affect damage while active.');
  assert(result.limitations.some(x=>x.includes('uncalibrated')),
    'Illustrative motion/damage data must never be represented as validated Global DPS.');
}
{
  const costly={...action('Skill',0),resourceCost:50};
  const zero=run([costly],['Skill'],2,{resource:{initial:0,max:100,regenPerSecond:0}});
  const regen=run([costly],['Skill'],2,{resource:{initial:0,max:100,regenPerSecond:50}});
  assert.equal(zero.events.length,0);
  assert(regen.metrics.casts>0);
}
{
  const crit=action('Crit',0,100,[{event:'crit',effect:'cooldown',target:'Support',operation:'reset'}]);
  const support=action('Support',10,10);
  const unknown=run([crit,support],['Support','Crit'],3);
  assert(unknown.limitations.some(x=>x.includes('critical/proc outcomes')));
  const observed=run([crit,support],['Support','Crit'],3,{outcomes:{Crit:[{hit:true,critical:true}]}});
  assert(observed.metrics.resets>=1);
}
{
  const incomplete=run([{id:'A',cooldown:5,flatDamage:100,attackCoefficient:1,hits:1}],['A']);
  assert.equal(incomplete.ok,false);
  assert(incomplete.errors.some(x=>x.includes('measured action lock')));
}
console.log('Validated timeline simulation: CDR cap, triggered resets, flat CD reductions, buff windows, MP costs, crit outcomes, and missing-data safeguards.');
