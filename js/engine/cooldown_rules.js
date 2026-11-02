'use strict';
/**
 * AION 2 Global cooldown interactions extracted from the planner's own
 * imported Specialty and Stigma text. Source strings remain inspectable.
 *
 * This module does not invent trigger rates or treat no-cooldown conditional
 * attacks as freely spammable. Unknown conditional use, patch ambiguity and
 * regional motion locks remain unverified until measured.
 */
const GlobalCooldownRules=(()=>{
  const VERSION='Global client 2.0.9.0 + reviewed class tooltip data / 2026-11-01';
  const numeric=n=>Number.isFinite(Number(n))?Number(n):null;
  const normalize=t=>String(t||'').replace(/\s+/g,' ').trim();
  const seconds=t=>{
    const m=t.match(/(?:^|\s)-\s*(\d+(?:\.\d+)?)\s*s\b/i);
    return m?Number(m[1]):null;
  };
  const chance=t=>{
    const m=t.match(/(\d+(?:\.\d+)?)\s*%\s*chance/i);
    return m?Math.min(1,Number(m[1])/100):null;
  };
  const condition=t=>{
    if(/critical hit|\bon each crit\b|\bon crit\b/i.test(t))return 'crit';
    if(/\bon (?:a |the )?(?:kill|defeating|defeat)|player kill/i.test(t))return 'kill';
    if(/\bon block\b/i.test(t))return 'block';
    if(/\bon evasion\b/i.test(t))return 'evasion';
    if(/\bon hit\b|\bon landing\b|per fireball/i.test(t))return 'hit';
    return null;
  };
  // Used for *documented* effects only, not general English inference.
  function compileSpecialty(source,classId,skill,id){
    const t=normalize(source),slot=Number(id);
    if(!Number.isInteger(slot)||slot<1||slot>5||!t)return null;
    const evidence={classId,skill,option:slot,tooltip:t,kind:'specialty',
      dataVersion:VERSION};
    const duration=seconds(t),trigger=condition(t);
    let match;
    if((match=t.match(/(?:resets?|reset)\s*\[([^\]]+)\]\s*cooldown/i))||
        (match=t.match(/reset\s+\[([^\]]+)\]\s+cooldown/i))){
      return {...evidence,type:'reset',target:match[1],event:trigger||'unknown',
        probability:chance(t),conditional:!trigger};
    }
    if(/\bresets?\s+cooldown\b|cooldown\s+reset\b/i.test(t)){
      return {...evidence,type:'reset',target:skill,event:trigger||'unknown',
        probability:chance(t),conditional:!trigger};
    }
    if(/\bremove(?:s)?\s+(?:\[[^\]]+\]\s+)?cooldown\b/i.test(t)){
      return {...evidence,type:'remove',target:skill,event:'conditional-use',
        conditional:true,warning:'Removed cooldown does not remove the skill triggering/eligibility conditions.'};
    }
    if(duration!==null){
      match=t.match(/-\s*\d+(?:\.\d+)?\s*s\s*\[([^\]]+)\]\s*cooldown/i);
      if(match)return {...evidence,type:'reduce',target:match[1],seconds:duration,
        event:trigger||'unknown',conditional:!trigger,
        perHit:/\bper fireball\b/i.test(t)};
      if(/-\s*\d+(?:\.\d+)?\s*s\s*(?:to\s+)?all\s+(?:skill\s+)?cooldowns?/i.test(t))
        return {...evidence,type:'reduce',target:'*',seconds:duration,
          event:trigger||'unknown',conditional:!trigger};
      if(/-\s*\d+(?:\.\d+)?\s*s\s*(?:to\s+)?(?:\[[^\]]+\]\s+)?cooldown/i.test(t))
        return {...evidence,type:'base-reduction',target:skill,seconds:duration,
          event:trigger,conditional:!!trigger};
    }
    match=t.match(/-\s*(\d+(?:\.\d+)?)%\s*\[([^\]]+)\]\s*cooldown/i);
    if(match)return {...evidence,type:'percent-reduction',target:match[2],
      fraction:Math.min(1,Number(match[1])/100),event:trigger||null};
    return null;
  }
  function compileStigma(source,classId,skill,rank){
    const t=normalize(source),r=Number(rank),base={classId,skill,rank:r,
      tooltip:t,kind:'stigma',dataVersion:VERSION};
    const sec=seconds(t),on=condition(t);
    const x=t.match(/resets?\s*\[([^\]]+)\]\s*cooldown/i);
    if(x)return {...base,type:'reset',target:x[1],
      event:on||'unknown',conditional:!on,probability:chance(t)};
    if(/resets?\s+cooldown\b|cooldown reset/i.test(t))
      return {...base,type:'reset',target:skill,event:on||'unknown',
        conditional:!on,probability:chance(t)};
    const b=t.match(/-\s*(\d+(?:\.\d+)?)\s*s\s*cooldown/i);
    if(b)return {...base,type:'base-reduction',target:skill,seconds:Number(b[1])};
    if(sec!==null&&/all\s+cooldowns/i.test(t))
      return {...base,type:'reduce',target:'*',seconds:sec,
        event:on||'unknown',conditional:!on};
    return null;
  }
  const threshold=id=>id<=3?8:id===4?12:16;
  function fromBuild({classId,effectiveLevels={},specialties={},
      stigmaLevels={},equippedStigmas=[],specData={},stigmaData={}}){
    const effects=[],warnings=[];
    for(const [name,raw] of Object.entries(specialties||{})){
      const rank=Number(effectiveLevels[name]||0);
      const seen=new Set();
      for(const option of Array.isArray(raw)?raw:[]){
        const id=Number(option);
        if(seen.has(id)||!Number.isInteger(id)||id<1||id>5||
           rank<threshold(id)||!specData[name]?.options?.[id])continue;
        seen.add(id);
        const rule=compileSpecialty(specData[name].options[id],classId,name,id);
        if(rule)effects.push(rule);
      }
    }
    const chosen=[...new Set(equippedStigmas)].slice(0,4);
    for(const name of chosen){
      const rank=Number(stigmaLevels[name]||0);
      if(rank<=0||!stigmaData[name])continue;
      for(const [at,t] of Object.entries(stigmaData[name].perks||{}))
        if(rank>=Number(at)){
          const rule=compileStigma(t,classId,name,at);
          if(rule)effects.push(rule);
        }
    }
    // Incomplete conditional text must never silently become an
    // unconditional reset or generate fake proc rates.
    for(const effect of effects)
      if(effect.conditional||effect.event==='unknown'||
        effect.type==='remove'||effect.probability!==null&&effect.probability!==undefined)
        warnings.push({
          skill:effect.skill,option:effect.option??effect.rank,
          reason:effect.type==='remove'?'Conditional availability must be modeled':
            effect.probability!==null&&effect.probability!==undefined?
              'Explicit event outcome needed for chance to proc':'Trigger condition not fully specified',
          source:effect.tooltip
        });
    return {effects,warnings,source:VERSION};
  }
  function effectiveCooldown(base,skill,effects=[]){
    if(!Number.isFinite(Number(base))||base===null||base===undefined)return null;
    let seconds=Math.max(0,Number(base));
    for(const rule of effects){
      if(rule.target!==skill)continue;
      if(rule.type==='base-reduction'&&!rule.conditional)
        seconds=Math.max(0,seconds-rule.seconds);
      else if(rule.type==='percent-reduction'&&!rule.event)
        seconds=Math.max(0,seconds*(1-rule.fraction));
      // A conditional "remove cooldown" is not safe to treat as 0 here.
    }
    return seconds;
  }
  function eventRules(skill,effects=[]){
    return effects.filter(effect=>effect.skill===skill&&
      ['hit','crit','cast','kill','block','evasion'].includes(effect.event)&&
      ['reset','reduce'].includes(effect.type)&&!effect.conditional)
      .map(effect=>({
        event:effect.event,effect:'cooldown',
        operation:effect.type==='reset'?'reset':'reduce',
        target:effect.target,seconds:effect.seconds,
        probability:effect.probability??null,
        perHit:!!effect.perHit,source:effect.tooltip
      }));
  }
  return Object.freeze({VERSION,compileSpecialty,compileStigma,
    fromBuild,effectiveCooldown,eventRules});
})();
