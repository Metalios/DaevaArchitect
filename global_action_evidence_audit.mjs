// Source audit: only Global class action cooldowns; no frame/cancel timings claimed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const load=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const classes=JSON.parse(load('classes_data.json'));
const benchmark=JSON.parse(load('research/global_top100_summary_2026-11-01.json'));
const c=vm.createContext({});
vm.runInContext(load('js/engine/global_actions.js')+'\n'+load('js/engine/combat.js')+
  '\nglobalThis.api={GlobalActionData,GlobalCombatEngine};',c);
const {GlobalActionData:actions,GlobalCombatEngine:engine}=c.api;
for(const [cls,data] of Object.entries(classes)){
  const names=new Set(Object.values(data.skills).map(skill=>skill.name));
  const known=actions.COOLDOWNS[cls];
  assert(known,cls+': missing Global action metadata');
  assert.equal(Object.keys(known).length,12,cls+': expected 12 active skills');
  for(const [skill,cd] of Object.entries(known)){
    assert(names.has(skill),cls+': unknown skill '+skill);
    assert(Number.isFinite(cd)&&cd>=0,cls+': illegal cooldown '+skill);
  }
  const example=benchmark.classes[cls];
  assert(example&&example.n>=99,cls+': missing dated benchmark');
  assert(example.actives.every(name=>names.has(name)),cls+': benchmark skill not in Global catalog');
  assert(example.passives.every(name=>names.has(name)),cls+': benchmark passive not in Global catalog');
}
for(const [name,model] of Object.entries(engine.ACTIONS)){
  const cd=actions.lookup('sorcerer',name);
  if(cd!==null)assert.equal(model.cd,cd,'Global Sorcerer base cooldown mismatch: '+name);
}
assert.equal(actions.lookup('templar','Judgment'),5);
assert.equal(actions.lookup('templar','Pummel'),0);
assert.equal(actions.readyWindows(5,30),6);
assert.equal(actions.readyWindows(5,30,.5),12);
assert.equal(actions.readyWindows(0,30),null);
assert.equal(actions.relativeCooldownOpportunity('templar','Pummel',30,.5),1);
assert.equal(actions.relativeCooldownOpportunity('templar','Judgment',30,.5),2);
assert.equal(actions.lookup('sorcerer','Delayed Explosion'),null,
  'Stigma cooldowns are not yet in the core 96-action dataset');
console.log('Audited 96 Global active cooldown entries, eight class summaries and Sorcerer engine cooldown fidelity.');
