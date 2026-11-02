// Empirical Global combat cohort test: these values come from a dated public
// aggregate; they are NOT simulated, inferred from tier lists, or claimed
// motion timings / causal "best" skills. Does not call third-party websites.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const source=JSON.parse(read('research/global_combat_cohort_2026-11-02.json'));
const roster=JSON.parse(read('classes_data.json'));
const x=vm.createContext({});
vm.runInContext('const GLOBAL_COMBAT_COHORT='+JSON.stringify(source)+';\n'+
  read('js/engine/cohort_analysis.js')+
  '\nglobalThis.cohort=GlobalCohortBenchmarks;',x);
const cohort=x.cohort;
assert(cohort.valid());
assert.equal(source.schema,'daeva-global-combat-cohort/v1');
assert.equal(source.sourceTotalLogs,3031);
assert.equal(source.sourceTotalPlayerSamples,13441);
assert.deepEqual(Object.keys(source.classes).sort(),Object.keys(roster).sort());
let samples=0,reported=0,aliases=0;
for(const [classId,c] of Object.entries(source.classes)){
  samples+=c.samples;
  assert(c.samples>=500, classId+' insufficient sample cohort');
  assert(c.middleHalfDps[0]<=c.medianDps&&
    c.medianDps<=c.middleHalfDps[1],classId+' invalid middle-half');
  const realNames=new Set(Object.values(roster[classId].skills).map(s=>s.name));
  for(const skill of c.skillObservations){
    reported++;
    assert(skill.name.length>0);
    assert(skill.usedByPct>=0&&skill.usedByPct<=100);
    if(!realNames.has(skill.name))aliases++;
    assert(skill.mostCommonSpecialties.every(id=>Number.isInteger(id)&&id>=1&&id<=5));
  }
  assert.equal(c.skillObservations.length,10);
  const analysis=cohort.examine({
    classId,effectiveSkills:Object.fromEntries([...realNames].map(name=>[name,20])),
    selectedSpecialties:{}
  });
  assert(analysis.available&&analysis.samples===c.samples);
  assert.equal(analysis.confidence,'observed-aggregate-no-causal-calibration');
  const report=cohort.summarize({ok:true,classId,observedDps:c.medianDps});
  assert.equal(report.comparable,false,'Median-match alone must not establish measured build fidelity');
  assert.equal(report.metricsComparable,false);
  assert(!('percentile' in report));
}
assert.equal(samples,13441);
assert.equal(reported,80);
assert(aliases>0,'Cohort must preserve non-Mastery triggered skill names without fabricated aliases');
const templar=cohort.examine({classId:'templar',effectiveSkills:{
  Judgment:20,Pummel:16,Punishment:16},
  selectedSpecialties:{Judgment:[4,5],Pummel:[3,4],Punishment:[2,3]},
  characterCombatPower:115100,characterGearRating:2350
});
assert.equal(templar.samples,1633);
assert.equal(templar.medianDps,18820);
assert.equal(templar.matchesCommonSpecialties,3);
assert.equal(templar.playerGearRating,2350);
assert.equal(templar.skillOverlaps.find(s=>s.skill==='Pummel').observedUsedByPercent,94);
assert(templar.caveats.some(x=>x.includes('NOT a predicted DPS')));
console.log('Validated measured Global snapshot: '+source.sourceTotalLogs+
  ' logs, '+samples+' class samples, '+reported+' skill observations, '+
  aliases+' explicit triggered/unmapped names; no fabricated causal calibration.');
