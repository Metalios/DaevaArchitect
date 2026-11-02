'use strict';
/**
 * Strict matched-fight hypothesis test. Observational, never causal proof of
 * a build or per-skill DPS optimum.
 *
 * Requires normalized Global fight reports created by GlobalCombatEvidence,
 * a user-asserted identical boss, difficulty, gear and target scope, plus
 * multiple runs with both builds. No server capture or remote file upload.
 */
const GlobalMatchedCalibration=(()=>{
  const median=values=>{
    const ordered=values.slice().sort((a,b)=>a-b);
    return ordered.length%2?ordered[(ordered.length-1)/2]:
      (ordered[ordered.length/2-1]+ordered[ordered.length/2])/2;
  };
  function reject(reason){return {comparable:false,reason,
    classification:'not-validated',recommendationChangeAllowed:false}}
  const rng=seed=>{
    let x=seed>>>0;
    return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296};
  };
  function compare(reports,{iterations=1000}={}){
    if(!Array.isArray(reports))return reject('Fight reports array required');
    if(reports.length<10||reports.length>500)
      return reject('At least 5 baseline and 5 candidate fights required; maximum 500');
    if(reports.some(r=>!r?.ok||r.region!=='Global'||!r.benchmark))
      return reject('Only complete user-declared Global boss recordings are eligible');
    const first=reports[0],b=first.benchmark,records=[];
    const signatures=new Set();
    for(const r of reports){
      const x=r.benchmark;
      if(r.classId!==first.classId||r.clientVersion!==first.clientVersion||
         x.bossId!==b.bossId||x.difficulty!==b.difficulty||
         x.gearFingerprint!==b.gearFingerprint||
         x.targetScope!=='boss')
        return reject('Class, client version, boss, difficulty, target scope and gear must match');
      if(!Number.isFinite(r.observedDps)||r.observedDps<=0||
         r.durationSeconds<20||r.unsupportedEvents>0)
        return reject('Each fight needs 20+ seconds of complete recognized boss damage');
      const signature=[x.buildLabel,r.durationSeconds,r.totalDamage,
        r.casts,r.hits].join(':');
      if(signatures.has(signature))
        return reject('Identical fight summaries detected; deduplicate captures before calibration');
      signatures.add(signature);
      records.push(r);
    }
    const initial=records.filter(r=>r.benchmark.buildLabel==='baseline');
    const proposed=records.filter(r=>r.benchmark.buildLabel==='candidate');
    if(initial.length<5||proposed.length<5)
      return reject('Need at least five independent fights for each build');
    const gr=[...new Set(records.map(r=>r.benchmark.gearRating))];
    if(Math.max(...gr)/Math.min(...gr)>1.01)
      return reject('Recorded GR varied by more than 1%');
    const cp=records.map(r=>r.benchmark.combatPower);
    if(Math.max(...cp)/Math.min(...cp)>1.12)
      return reject('Combat Power varied by more than 12%; check equipment/skills/buffs');
    const ping=records.map(r=>r.benchmark.pingMs);
    if(Math.max(...ping)-Math.min(...ping)>40)
      return reject('Measured ping varied by more than 40 ms');
    const lengths=records.map(r=>r.durationSeconds);
    if(Math.max(...lengths)/Math.min(...lengths)>1.65)
      return reject('Fight durations differ too much; match encounter conditions');
    const baseline=initial.map(r=>r.observedDps);
    const candidate=proposed.map(r=>r.observedDps);
    const oldMedian=median(baseline),newMedian=median(candidate);
    const random=rng(0xA102C011);
    const values=[];
    const trials=Math.max(200,Math.min(2000,Math.floor(iterations)||1000));
    for(let i=0;i<trials;i++){
      const take=arr=>Array.from({length:arr.length},()=>
        arr[Math.floor(random()*arr.length)]);
      const old=median(take(baseline));
      const now=median(take(candidate));
      values.push(old>0?(now/old-1)*100:0);
    }
    values.sort((a,b)=>a-b);
    const at=p=>values[Math.min(values.length-1,Math.floor(p*(values.length-1)))];
    const interval=[at(.05),at(.95)];
    const delta=(newMedian/oldMedian-1)*100;
    return {
      comparable:true,classId:first.classId,clientVersion:first.clientVersion,
      bossId:b.bossId,difficulty:b.difficulty,
      baselineFights:initial.length,candidateFights:proposed.length,
      baselineMedianDps:oldMedian,candidateMedianDps:newMedian,
      measuredDifferencePercent:delta,
      bootstrap90PercentRange:interval,
      direction:interval[0]>0?'positive-directional':
        interval[1]<0?'negative-directional':'inconclusive',
      classification:'user-declared matched observational tests, not causal or independently verified',
      recommendationChangeAllowed:false,
      warnings:[
        'Boss, gear, patch, ping and displayed difficulty match user-entered metadata, not authenticated game state.',
        'Player execution, party buffs, target defenses and mechanic patterns may still differ.',
        'A 90% bootstrap interval measures resampling variability, NOT causal confidence in build superiority.',
        'This comparator does not infer animation lock, cancel frames, or per-rank damage coefficients.',
        'Do not automatically change all-class optimizer scoring based on this unreplicated comparison.'
      ]
    };
  }
  return Object.freeze({compare});
})();
