'use strict';
/**
 * AION 2 action timing evidence resolver.
 *
 * A skill's "cast_time" database field is NOT its input-to-next-usable-action
 * delay. Network combat logs establish observed hit intervals and ability
 * ordering, but cannot by themselves separate player decision time, latency,
 * animation wind-down and client animation-cancel windows.
 *
 * Global observations take precedence. KR/TW results can be compared only
 * when the relevant skill variant, cancel rules, timing method and player
 * conditions are comparable. Later regional patch effects are not assumed
 * to be present on Global.
 */
const GlobalAnimationEvidence=(()=>{
  const REGIONS=Object.freeze(['Global','KR','TW']);
  const MODES=Object.freeze(['normal','basic-weave','held-macro']);
  const TIMING_KINDS=Object.freeze(['input-to-next-usable','observed-hit-gap','charge-stage']);
  const REGIONAL_CANCEL_CHANGES=Object.freeze([
    Object.freeze({
      region:'KR',effective:'2026-08-26',scope:'all classes',
      change:'minimum skill-cancel time added for each skill',
      source:'https://aion2.grimvane.app/companion/wiki/combat-and-systems/'
    }),
    Object.freeze({
      region:'KR',effective:'2026-09-16',scope:'Templar and Assassin',
      change:'additional minimum-cancel delay for several skills',
      source:'https://aion2.akunito.com/en/classes/templar-skills-guide/'
    })
  ]);
  // Regional, community-reported *charge* timing. It does not represent the
  // full cast lock because release, hit registration and recovery are unknown.
  const REFERENCE_CHARGES=Object.freeze({
    sorcerer:Object.freeze({
      Hellfire:Object.freeze({
        region:'KR/TW',mechanic:'charge-stages',stageSeconds:Object.freeze([.5,1,1.5]),
        skillSpeedSpecialtySeconds:Object.freeze([.35,.70,1.05]),
        source:'https://aion2.grimvane.app/companion/wiki/sorcerer-primer/',
        confidence:'regional-community',globalVerified:false
      })
    })
  });
  function contextMatches(record,context){
    if(record.classId!==context.classId||record.skill!==context.skill)return false;
    if(record.mode!==context.mode)return false;
    // Skill level, animation speed and other context may change motion
    // timing. Do not silently transfer timings across differing settings.
    for(const key of ['skillVariant','combatSpeedPct','skillSpeedPct','cancelSpecialty']){
      if(context[key]!==undefined&&record[key]!==context[key])return false;
    }
    return true;
  }
  function normalized(record){
    if(!record||typeof record!=='object')return null;
    const region=record.region;
    if(!REGIONS.includes(region)||!MODES.includes(record.mode)||
       !TIMING_KINDS.includes(record.kind)||typeof record.classId!=='string'||
       typeof record.skill!=='string'||typeof record.source!=='string'||
       !/^https:\/\//.test(record.source))return null;
    const seconds=Number(record.seconds),samples=Number(record.samples);
    if(!Number.isFinite(seconds)||seconds<=0||
       !Number.isInteger(samples)||samples<3||
       typeof record.clientVersion!=='string'||!record.clientVersion.trim())
      return null;
    return {...record,seconds,samples};
  }
  /**
   * Caller decides whether specific KR/TW cancel rules match the Global
   * client. Unknown parity remains a provisional sensitivity scenario.
   *
   * Input records are structured research measurements, never automatically
   * fetched from third-party websites or invented from their guide text.
   * Only input-to-next-usable timing can supply a simulator action lock.
   */
  function resolve(context,records=[],options={}){
    if(!context||!context.classId||!context.skill)return Object.freeze({
      available:false,reason:'Class and skill are required.'
    });
    const candidates=records.map(normalized).filter(Boolean)
      .filter(r=>contextMatches(r,context))
      .filter(r=>r.kind==='input-to-next-usable')
      .filter(r=>r.region==='Global'||options.allowRegionalTransfer===true);
    const ranked=candidates.map(r=>{
      const isGlobal=r.region==='Global';
      const knownParity=r.rulesMatchGlobal===true;
      const risk=isGlobal?'global-measured':
        knownParity?'regional-validated-transfer':'regional-sensitivity-only';
      // Unknown cross-region parity requires explicit scenario permission.
      const allowed=isGlobal||knownParity||options.allowUnverifiedScenario===true;
      return {...r,risk,allowed,score:(isGlobal?100:knownParity?50:10)+
        Math.min(20,Math.log2(r.samples+1))};
    }).filter(r=>r.allowed).sort((a,b)=>b.score-a.score||
      b.samples-a.samples||a.seconds-b.seconds);
    const best=ranked[0];
    if(!best)return Object.freeze({available:false,
      reason:'No compatible Global action-lock measurement; regional timing requires explicit provenance and patch-parity review.',
      regionalChargeReference:REFERENCE_CHARGES[context.classId]?.[context.skill]||null});
    return Object.freeze({
      available:true,seconds:best.seconds,region:best.region,
      clientVersion:best.clientVersion,source:best.source,samples:best.samples,
      provenance:best.risk,mode:best.mode,
      uncertainty:best.risk==='global-measured'?'measurement-variability':
        best.risk==='regional-validated-transfer'?'region-transfer':'unverified-regional-scenario'
    });
  }
  /**
   * Add timing locks to a timeline candidate only if observations exist.
   * Missing measurements are left missing so the timeline's validator can
   * decline to claim a calibrated DPS prediction.
   */
  function enrich(abilities,context,records=[],options={}){
    return abilities.map(a=>{
      if(Number.isFinite(a.lockSeconds)&&a.lockSeconds>0)return {...a};
      const matched=resolve({...context,skill:a.id},records,options);
      if(!matched.available)return {...a,timingMissing:true};
      return {...a,lockSeconds:matched.seconds,timingSource:matched.provenance,
        timingProvenance:{region:matched.region,clientVersion:matched.clientVersion,
          source:matched.source,samples:matched.samples,
          uncertainty:matched.uncertainty}};
    });
  }
  return Object.freeze({REGIONS,MODES,TIMING_KINDS,REGIONAL_CANCEL_CHANGES,
    REFERENCE_CHARGES,resolve,enrich,normalized});
})();
