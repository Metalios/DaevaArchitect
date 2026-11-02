// Fixture values below are SYNTHETIC and test only the validation,
// comparison and uncertainty computation, not AION 2 skill coefficients.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(read('js/engine/combat_evidence.js')+'\n'+
  read('js/engine/matched_calibration.js')+
  '\nglobalThis.api={GlobalCombatEvidence,GlobalMatchedCalibration};',ctx);
const {GlobalCombatEvidence:events,GlobalMatchedCalibration:calibrate}=ctx.api;
function report(n,build='baseline',options={}){
  const raw={region:'Global',clientVersion:'2.0.9.0',classId:'templar',
    durationSeconds:60,benchmark:{
      buildLabel:build,bossId:'Krao',difficulty:'Hard',targetScope:'boss',
      gearFingerprint:'same-equip',combatPower:115100,
      gearRating:2350,pingMs:60,...options
    },
    events:[{timeMs:0,skill:'Pummel',type:'cast'},
      {timeMs:150,skill:'Pummel',type:'hit',
        damage:(build==='candidate'?2500:2000)+n*100},
      {timeMs:1000,skill:'Punishment',type:'cast'},
      {timeMs:1500,skill:'Punishment',type:'hit',
        damage:(build==='candidate'?4500:3500)+n*200}]};
  return events.analyze(raw,{classId:'templar',allowedSkills:['Pummel','Punishment']});
}
const base=Array.from({length:6},(_,i)=>report(i));
const candidate=Array.from({length:6},(_,i)=>report(i,'candidate'));
const compared=calibrate.compare([...base,...candidate]);
assert(compared.comparable);
assert.equal(compared.baselineFights,6);
assert.equal(compared.candidateFights,6);
assert(compared.measuredDifferencePercent>0);
assert(compared.bootstrap90PercentRange[0]>0);
assert.equal(compared.direction,'positive-directional');
assert.equal(compared.recommendationChangeAllowed,false);
assert(compared.classification.includes('observational'));
const noBaseline=calibrate.compare(candidate);
assert.equal(noBaseline.comparable,false);
const otherBoss=calibrate.compare([...base,...candidate.slice(0,5),
  report(5,'candidate',{bossId:'Other'})]);
assert.equal(otherBoss.comparable,false);
const otherGear=calibrate.compare([...base,...candidate.slice(0,5),
  report(5,'candidate',{gearFingerprint:'different'})]);
assert.equal(otherGear.comparable,false);
const otherPatch={...candidate[0],clientVersion:'2.0.9.1'};
assert.equal(calibrate.compare([...base,otherPatch,...candidate.slice(1)])
  .comparable,false);
const duplicated=calibrate.compare([...base,...candidate.slice(0,5),
  candidate[0]]);
assert.equal(duplicated.comparable,false);
const largePing=calibrate.compare([...base,...candidate.slice(0,5),
  report(5,'candidate',{pingMs:150})]);
assert.equal(largePing.comparable,false);
const reversed=calibrate.compare([...candidate,...base.map((x,i)=>({
  ...x,benchmark:{...x.benchmark,buildLabel:'candidate'},
  totalDamage:x.totalDamage+i+1,
  observedDps:x.observedDps+(i+1)/60
}))]);
assert.equal(reversed.comparable,false,
  'Known duplicate total-damage summaries must not be treated as independent fights');
console.log('Validated matched Global fight uncertainty: 6+6 trials, boss/gear/patch/latency gates, duplicate rejection and no causal re-ranking.');
