'use strict';
/**
 * Local, privacy-preserving Global fight evidence analyzer.
 * Schema: {region:"Global",clientVersion:"2.0.9.0",classId:"templar",
 * durationSeconds:120,events:[
 * {timeMs:100,skill:"Pummel",type:"cast"},
 * {timeMs:250,skill:"Pummel",type:"hit",damage:1000},
 * {timeMs:900,skill:"Buff",type:"buff-start"},
 * {timeMs:5900,skill:"Buff",type:"buff-end"}]}
 *
 * This is a normalized export FORMAT, not a claim that third-party meters
 * export this exact schema. User-provided text is never submitted remotely.
 * Hit timing, server packet spacing and player delays DO NOT measure the
 * minimum action/cancel lock. A measured animation source is separate.
 */
const GlobalCombatEvidence=(()=>{
  const TYPES=new Set(['cast','hit','heal','buff-start','buff-end']);
  const MAX_EVENTS=50000;
  const invalid=message=>({ok:false,error:message});
  function analyze(raw,{classId,allowedSkills=[]}={}){
    if(!raw||typeof raw!=='object'||Array.isArray(raw))
      return invalid('A fight object is required');
    if(raw.region!=='Global')
      return invalid('Only Global client fight evidence is accepted for build calibration');
    if(!raw.clientVersion||typeof raw.clientVersion!=='string')
      return invalid('Global client version is required');
    if(!raw.classId||classId&&raw.classId!==classId)
      return invalid('Class does not match the selected DaevaArchitect character');
    const duration=Number(raw.durationSeconds);
    if(!Number.isFinite(duration)||duration<1||duration>3600)
      return invalid('Fight duration must be 1–3600 seconds');
    if(!Array.isArray(raw.events)||raw.events.length<3||
       raw.events.length>MAX_EVENTS)
      return invalid('Between 3 and 50,000 fight events are required');
    const known=new Set(allowedSkills),counts={},buffWindows=new Map();
    const uptime={},gaps={},lastCast=new Map();
    let lastEvent=-1;
    let hitEvents=0,castEvents=0,damage=0,healing=0,unsupported=0;
    for(const e of raw.events){
      if(!e||typeof e!=='object')return invalid('Malformed combat event');
      const at=Number(e.timeMs),type=e.type,skill=e.skill;
      if(!Number.isFinite(at)||at<0||at>duration*1000||!TYPES.has(type)||
         typeof skill!=='string'||skill.length>100)
        return invalid('Invalid event time, skill or type');
      if(at<lastEvent)return invalid('Combat events must be in timestamp order');
      lastEvent=at;
      if(known.size&&!known.has(skill)){unsupported++;continue}
      const row=counts[skill]||(counts[skill]={casts:0,hits:0,
        damage:0,healing:0});
      if(type==='cast'){
        row.casts++;castEvents++;
        if(lastCast.has(skill)){
          gaps[skill] ||= [];
          if(gaps[skill].length<2000)gaps[skill].push((at-lastCast.get(skill))/1000);
        }
        lastCast.set(skill,at);
      }
      if(type==='hit'||type==='heal'){
        const rawValue=Number(e.damage??e.amount??0);
        if(!Number.isFinite(rawValue)||rawValue<0||rawValue>1e12)
          return invalid('Invalid combat damage or healing value');
        if(type==='hit'){row.hits++;hitEvents++;row.damage+=rawValue;damage+=rawValue}
        else {row.healing+=rawValue;healing+=rawValue}
      }
      if(type==='buff-start'&&!buffWindows.has(skill))buffWindows.set(skill,at);
      if(type==='buff-end'&&buffWindows.has(skill)){
        uptime[skill]=(uptime[skill]||0)+(at-buffWindows.get(skill))/1000;
        buffWindows.delete(skill);
      }
    }
    for(const [skill,at] of buffWindows)uptime[skill]=(uptime[skill]||0)+
      (duration*1000-at)/1000;
    const median=values=>{
      const sorted=values.slice().sort((a,b)=>a-b);
      return sorted.length?sorted[Math.floor(sorted.length/2)]:null;
    };
    const observedCastGaps=Object.fromEntries(
      Object.entries(gaps).map(([skill,values])=>
        [skill,{samples:values.length,medianSeconds:median(values)}]));
    // Optional matched-fight metadata. The importer never infers these from
    // damage output, character names or source file paths.
    const test=raw.benchmark;
    let benchmark=null;
    if(test!==undefined){
      if(!test||typeof test!=='object'||Array.isArray(test))
        return invalid('benchmark must be a structured object');
      const strings=['buildLabel','bossId','difficulty','targetScope','gearFingerprint'];
      if(strings.some(key=>typeof test[key]!=='string'||
         test[key].length<1||test[key].length>128))
        return invalid('Complete boss, difficulty, scope, build and gear metadata required for matched calibration');
      if(!['baseline','candidate'].includes(test.buildLabel)||
         test.targetScope!=='boss')
        return invalid('Only baseline/candidate boss-scope matched recordings are supported');
      const cp=Number(test.combatPower),gr=Number(test.gearRating),
        ping=Number(test.pingMs);
      if(!Number.isFinite(cp)||cp<1||cp>1e9||
         !Number.isFinite(gr)||gr<1||gr>100000||
         !Number.isFinite(ping)||ping<0||ping>500)
        return invalid('Measured CP, GR and ping required for matched calibration');
      benchmark={buildLabel:test.buildLabel,bossId:test.bossId,
        difficulty:test.difficulty,targetScope:test.targetScope,
        gearFingerprint:test.gearFingerprint,combatPower:cp,gearRating:gr,
        pingMs:ping};
    }
    return {ok:true,region:'Global',classId:raw.classId,
      clientVersion:raw.clientVersion,durationSeconds:duration,
      benchmark,
      totalDamage:damage,totalHealing:healing,
      observedDps:damage/duration,observedHps:healing/duration,
      casts:castEvents,hits:hitEvents,unsupportedEvents:unsupported,
      skills:counts,buffUptimeSeconds:uptime,observedCastGaps,
      evidence:'User-declared Global fight events (origin is not independently authenticated); observed cast gaps include decisions, movement and latency and are NOT validated animation/cancel times.',
      limitations:[
        'Only recognized class skill events included; some server packets and summoned/pet damage may be absent.',
        'Damage totals reflect received events, not necessarily the full boss/party damage.',
        'A single fight does not establish optimal skill order or a statistical proc rate.'
      ]};
  }
  function compare(report,simulation){
    if(!report?.ok||!simulation?.ok)return null;
    const differences=[];
    const all=new Set([...Object.keys(report.skills),...Object.keys(simulation.bySkill||{})]);
    for(const skill of all){
      const actual=report.skills[skill]?.casts||0,
        expected=simulation.bySkill?.[skill]?.casts||0;
      differences.push({skill,actual,expected,difference:actual-expected});
    }
    return {differences,evidence:'Count comparison only. Does not infer animation lock or calibrate damage from mismatched gear/encounters.'};
  }
  return Object.freeze({analyze,compare});
})();
