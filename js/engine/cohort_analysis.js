'use strict';
/**
 * Public Global A2Tools empirical aggregate audit.
 * DOES NOT optimize skill allocations from popularity or turn cross-boss
 * medians into normalized DPS for a particular character.
 */
const GlobalCohortBenchmarks=(()=>{
  const snapshot=()=>typeof GLOBAL_COMBAT_COHORT!=='undefined'?
    GLOBAL_COMBAT_COHORT:null;
  const valid=()=>!!snapshot()&&snapshot().schema==='daeva-global-combat-cohort/v1';
  const byClass=classId=>valid()?snapshot().classes[classId]||null:null;
  function examine({classId,effectiveSkills={},selectedSpecialties={},
    selectedStigmas=[],characterCombatPower=null,characterGearRating=null}={}){
    const cohort=byClass(classId);
    if(!cohort)return {available:false,reason:'No verified Global cohort snapshot for this class.'};
    const present=Object.entries(effectiveSkills).filter(([,level])=>Number(level)>=8);
    const observed=[];
    const catalog=new Map(cohort.skillObservations.map(x=>[x.name,x]));
    for(const [name,level] of present){
      const sample=catalog.get(name);
      if(!sample)continue;
      const selection=selectedSpecialties[name]||[];
      const standard=sample.mostCommonSpecialties;
      const allowed=Array.isArray(selection)?selection:[];
      observed.push({
        skill:name,effectiveLevel:Number(level),
        observedUsedByPercent:sample.usedByPct,
        typicalSpecialties:standard,
        chosenSpecialties:allowed,
        specialtyExactMatch:!!standard.length&&
          allowed.length===standard.length&&
          allowed.every(id=>standard.includes(Number(id)))
      });
    }
    const missingTop=cohort.skillObservations.filter(s=>
      s.usedByPct>=75&&!(s.name in effectiveSkills));
    const cp=Number(characterCombatPower),gr=Number(characterGearRating);
    const knownCp=characterCombatPower!==null&&
      characterCombatPower!==''&&Number.isFinite(cp)&&cp>0;
    const knownGr=characterGearRating!==null&&
      characterGearRating!==''&&Number.isFinite(gr)&&gr>0;
    return {
      available:true,source:snapshot().source,snapshotDate:snapshot().snapshotDate,
      classId,samples:cohort.samples,encounterLogs:snapshot().sourceTotalLogs,
      medianDps:cohort.medianDps,
      middleHalfDps:[...cohort.middleHalfDps],
      medianCombatPower:cohort.medianCombatPower,
      medianGearRating:cohort.medianGearRating,
      playerCombatPower:knownCp?cp:null,playerGearRating:knownGr?gr:null,
      skillOverlaps:observed,
      missingTop:missingTop.map(s=>({name:s.name,usedByPct:s.usedByPct})),
      matchesCommonSpecialties:observed.filter(x=>x.specialtyExactMatch).length,
      caveats:[
        'Recorded DPS is across a non-matched boss/difficulty/gear cohort; it is NOT a predicted DPS for this build.',
        'Used-by percentages show which skills appeared in logs, NOT their damage contribution.',
        'Common specialties indicate adoption, NOT proof of damage optimality.',
        'Class-specific support, tanking and healing cannot be valued from personal DPS medians.',
        'No animation-lock or cancel-frame measurements are supplied by this cohort.',
        'All cohort fights are PvE bosses and CANNOT validate PvP damage, Arena, Abyss or match win rates.'
      ],
      confidence:'observed-aggregate-no-causal-calibration'
    };
  }
  function summarize(log,{classId}={}){
    const c=byClass(classId||log?.classId);
    if(!c||!log?.ok)return {comparable:false,reason:'Cohort or player recording missing'};
    // Default cohort mixes fights, classes, bosses and gear. Do not attach
    // performance labels/percentiles to the player's DPS by merely dividing
    // it by the cohort median.
    return {comparable:false,observedPlayerDps:log.observedDps,
      classMedianReference:c.medianDps,samples:c.samples,
      reason:'Unmatched boss, difficulty, combat power, equipment and client patch. Percentile and expected DPS are deliberately unavailable.',
      metricsComparable:false};
  }
  return Object.freeze({valid,byClass,examine,summarize});
})();
