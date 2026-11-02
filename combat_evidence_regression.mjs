// Only fixture data: demonstrates the normalized input contract. No actual
// character name, regional transferred damage, or claimed cancel timing.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const src=fs.readFileSync(new URL('js/engine/combat_evidence.js',import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(src+'\nglobalThis.api=GlobalCombatEvidence;',ctx);
const v=ctx.api;
const example={region:'Global',clientVersion:'2.0.9.0',classId:'templar',
 durationSeconds:10,events:[
  {timeMs:0,skill:'Pummel',type:'cast'},
  {timeMs:200,skill:'Pummel',type:'hit',damage:100},
  {timeMs:300,skill:'Doom Shield',type:'buff-start'},
  {timeMs:1000,skill:'Punishment',type:'cast'},
  {timeMs:1600,skill:'Punishment',type:'hit',damage:600},
  {timeMs:3400,skill:'Doom Shield',type:'buff-end'},
  {timeMs:5100,skill:'Pummel',type:'cast'},
  {timeMs:5400,skill:'Pummel',type:'hit',damage:110}
 ]};
const r=v.analyze(example,{classId:'templar',
 allowedSkills:['Pummel','Punishment','Doom Shield']});
assert.equal(r.ok,true);
assert.equal(r.totalDamage,810);
assert.equal(r.observedDps,81);
assert.equal(r.skills.Pummel.casts,2);
assert.equal(r.skills.Pummel.hits,2);
assert.equal(r.buffUptimeSeconds['Doom Shield'],3.1);
assert.equal(r.observedCastGaps.Pummel.medianSeconds,5.1);
assert(r.evidence.includes('NOT validated animation/cancel times'));
assert.equal(v.analyze({...example,region:'KR'},{classId:'templar'}).ok,false);
assert.equal(v.analyze(example,{classId:'gladiator'}).ok,false);
assert.equal(v.analyze({...example,events:example.events.slice().reverse()},
 {classId:'templar'}).ok,false);
const unknown=v.analyze(example,{classId:'templar',
 allowedSkills:['Pummel','Punishment']});
assert(unknown.unsupportedEvents>0);
const prediction={ok:true,bySkill:{Pummel:{casts:1},Punishment:{casts:2}}};
const diff=v.compare(r,prediction);
assert(diff.differences.some(x=>x.skill==='Pummel'&&x.difference===1));
console.log('Global-only normalized encounter evidence: privacy, class/region gates, cast-vs-hit counts, buffs, and motion uncertainty.');
