'use strict';
/**
 * AION 2 Global event timeline kernel.
 *
 * This is deliberately data-driven. A caller must supply actual ability damage,
 * motion/cast-lock timings, conditional triggers and buff parameters. Missing
 * motion measurements or coefficients are reported as incomplete input, never
 * replaced with purported "Global" observations or KR/TW frame data.
 *
 * The kernel is deterministic: crit/proc conditions fire ONLY when an explicit
 * scenario outcome supplies them. No fabricated RNG probabilities, game GCD or
 * animation-cancel windows. Ranking builds requires comparing multiple observed
 * and sensitivity scenarios, not interpreting a single trace as measured DPS.
 */
const GlobalTimelineEngine=(()=>{
  const EPS=1e-8;
  const MAX_EVENTS=20000;
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,Number(n)||0));
  const finite=n=>typeof n==='number'&&Number.isFinite(n);
  const percentCap=.60;
  const allowedTriggerEvents=new Set(['cast','hit','crit','status','kill','block','evasion']);
  const ruleCondition=(rule,event,active,hitCrit)=>{
    if(rule.event!==event)return false;
    if(rule.requiresCritical&&!hitCrit)return false;
    if(rule.requiresBuff&&!active.has(rule.requiresBuff))return false;
    if(rule.requiresStatus&&!active.has(rule.requiresStatus))return false;
    return true;
  };
  function validate(abilities,priority,duration,attack){
    const errors=[];
    if(!Array.isArray(abilities)||abilities.length===0)errors.push('Abilities array is required.');
    if(!Array.isArray(priority)||priority.length===0)errors.push('Action priority is required.');
    if(!finite(duration)||duration<=0||duration>3600)errors.push('Encounter duration must be 0-3600 seconds.');
    if(!finite(attack)||attack<0)errors.push('Recorded Attack is required for absolute damage calculations.');
    const seen=new Set();
    for(const a of Array.isArray(abilities)?abilities:[]){
      if(!a?.id||seen.has(a.id)){errors.push('Duplicate or missing skill ID.');continue}
      seen.add(a.id);
      if(!finite(a.cooldown)||a.cooldown<0)errors.push(a.id+': Global base cooldown missing.');
      if(!finite(a.lockSeconds)||a.lockSeconds<=0)errors.push(a.id+': measured action lock or explicitly labelled scenario timing required.');
      if(!finite(a.attackCoefficient)||!finite(a.flatDamage)||!finite(a.hits)||a.hits<=0)
        errors.push(a.id+': rank-appropriate coefficient, flat damage and hits required.');
      if(a.resourceCost!==undefined&&(!finite(a.resourceCost)||a.resourceCost<0))
        errors.push(a.id+': resource cost must be a nonnegative number.');
      if(a.requires&&(!Array.isArray(a.requires)||a.requires.some(x=>typeof x!=='string')))
        errors.push(a.id+': requires must list named active conditions.');
      for(const trigger of a.triggers||[]){
        if(!allowedTriggerEvents.has(trigger.event))errors.push(a.id+': unsupported trigger event.');
        if(trigger.effect==='cooldown'){
          if(!['reset','reduce'].includes(trigger.operation))errors.push(a.id+': unknown cooldown operation.');
          if(trigger.operation==='reduce'&&(!finite(trigger.seconds)||trigger.seconds<=0))errors.push(a.id+': reduction seconds missing.');
          if(!trigger.target)errors.push(a.id+': cooldown target missing.');
        }else if(trigger.effect==='buff'||trigger.effect==='status'){
          if(!trigger.id||!finite(trigger.duration)||trigger.duration<=0)errors.push(a.id+': buff/status duration missing.');
        }else errors.push(a.id+': unsupported trigger effect.');
      }
    }
    for(const id of Array.isArray(priority)?priority:[])if(!seen.has(id))errors.push('Priority contains unknown ability '+id+'.');
    return errors;
  }
  /**
   * Input:
   *   abilities: [{id,cooldown,lockSeconds,attackCoefficient,flatDamage,hits,
   *     resourceCost?,requires?:[conditionId],
   *     triggers?:[{event:'hit'|'crit'|'cast'|'status',
   *       effect:'cooldown',target,operation:'reset'|'reduce',seconds?},
   *       {event:'hit',effect:'buff',id,duration,damageMultiplier?,cooldownReduction?}]}]
   *   priority: IDs in the order a player/macro actually tries to cast.
   *   outcomes: {"Ability":[{critical:true,hit:true}, ...]} (optional deterministic
   *     recorded sequence; no outcome means ordinary noncritical hit).
   *   extraHaste: recorded total CDR fraction. Combined active CDR caps at 60%.
   *   resource: {initial,max,regenPerSecond?} (optional; Infinity if omitted).
   *
   * lockSeconds must already reflect the observed input->next-usable-action
   * delay at the player's speed, including any validated animation cancelling.
   * Damage is comparative only until the inputs are measured and checked.
   */
  function simulate({abilities,priority,duration,attack,extraHaste=0,
    outcomes={},resource=null,initialConditions=[],
    timingRecords=[],timingContext=null,timingOptions={},cooldownRules=[],
    cooldownStart='complete'}={}){
    // A regional measurement may supply the action lock ONLY when explicitly
    // requested, sourced and labelled. Unknown motion stays invalid.
    const prepared=timingContext&&typeof GlobalAnimationEvidence!=='undefined'
      &&Array.isArray(abilities)
      ?GlobalAnimationEvidence.enrich(abilities,timingContext,timingRecords,timingOptions)
      :abilities;
    const resolved=typeof GlobalCooldownRules!=='undefined'&&Array.isArray(prepared)?
      prepared.map(a=>({
        ...a,
        cooldown:GlobalCooldownRules.effectiveCooldown(a.cooldown,a.id,cooldownRules),
        triggers:[...(a.triggers||[]),...GlobalCooldownRules.eventRules(a.id,cooldownRules)]
      })):prepared;
    const errors=validate(resolved,priority,duration,attack);
    if(!['start','complete'].includes(cooldownStart))errors.push('Invalid cooldownStart policy');
    if(errors.length)return {ok:false,errors,events:[]};
    const actions=new Map(resolved.map(x=>[x.id,x]));
    const nowConditions=new Map(initialConditions.filter(x=>x&&x.id&&finite(x.duration)&&x.duration>0)
      .map(x=>[x.id,{...x,until:x.duration}]));
    const snapshots=[];
    const cooldowns=new Map(resolved.map(x=>[x.id,0]));
    const casts=new Map(resolved.map(x=>[x.id,0]));
    const metrics={totalDamage:0,casts:0,completed:0,idleSeconds:0,
      resets:0,reductions:0,misses:0,criticalEvents:0};
    const rp=resource||{initial:Infinity,max:Infinity,regenPerSecond:0};
    const maxResource=finite(rp.max)?Math.max(0,rp.max):Infinity;
    let mana=finite(rp.initial)?clamp(rp.initial,0,maxResource):Infinity;
    const regen=finite(rp.regenPerSecond)?Math.max(0,rp.regenPerSecond):0;
    const events=[],limitations=[];
    const missingCritData=new Set(),missingProcData=new Set();
    let now=0;
    const live=()=>new Map([...nowConditions.entries()].filter(([,b])=>b.until>now+EPS));
    function advance(until) {
      const target=Math.min(duration,Math.max(now,until));
      const elapsed=target-now;
      if(Number.isFinite(mana))mana=Math.min(maxResource,mana+elapsed*regen);
      now=target;
      for(const [id,b] of nowConditions)if(b.until<=now+EPS)nowConditions.delete(id);
    }
    function getHaste(){
      const extras=[...live().values()].reduce((s,b)=>s+(finite(b.cooldownReduction)?b.cooldownReduction:0),0);
      return clamp(extraHaste+extras,0,percentCap);
    }
    function executeTrigger(rule,event,critical,source,outcome=null,hits=1){
      const active=live();
      if(!ruleCondition(rule,event,active,critical))return;
      // A stochastic proc is deterministic ONLY when the supplied encounter
      // outcome marks this effect as successful. We do not invent random
      // outcomes from the tooltip probability.
      if(rule.probability!==null&&rule.probability!==undefined){
        const proven=Array.isArray(outcome?.procs)&&
          (outcome.procs.includes(rule.source)||outcome.procs.includes(rule.target));
        if(!proven){
          if(!outcome)missingProcData.add(source);
          return;
        }
      }
      if(rule.effect==='cooldown'){
        const targets=rule.target==='*'?
          [...cooldowns.keys()].filter(id=>id!==source):[rule.target];
        for(const target of targets){
          const before=cooldowns.get(target);
          if(before===undefined)continue;
          let after=before;
          if(rule.operation==='reset')after=now;
          if(rule.operation==='reduce')after=Math.max(now,before-
            rule.seconds*(rule.perHit?hits:1));
          if(after<before-EPS){
            cooldowns.set(target,after);
            metrics[rule.operation==='reset'?'resets':'reductions']++;
            events.push({at:now,type:rule.operation,source,target,
              seconds:Math.max(0,before-after)});
          }
        }
      }else{
        const prev=nowConditions.get(rule.id);
        const next={...rule,until:now+rule.duration};
        if(prev&&prev.until>next.until)next.until=prev.until;
        nowConditions.set(rule.id,next);
        snapshots.push({id:rule.id,from:now,to:Math.min(duration,next.until)});
      }
    }
    for(let cycle=0;now<duration-EPS&&cycle<MAX_EVENTS;cycle++){
      const active=live();
      const available=priority.map(id=>actions.get(id)).find(a=>
        (cooldowns.get(a.id)||0)<=now+EPS&&
        (a.resourceCost||0)<=mana+EPS&&
        (a.requires||[]).every(id=>active.has(id))
      );
      if(!available){
        const candidates=priority.map(id=>actions.get(id))
          .filter(a=>(a.requires||[]).every(id=>active.has(id)))
          .map(a=>Math.max(now,cooldowns.get(a.id)||0,
            finite(mana)&&mana<(a.resourceCost||0)&&regen>0?
              now+((a.resourceCost||0)-mana)/regen:now))
          .filter(t=>t>now+EPS);
        if(!candidates.length)break;
        const next=Math.min(...candidates);
        metrics.idleSeconds+=Math.min(next,duration)-now;
        advance(next);
        continue;
      }
      const a=available;
      const index=casts.get(a.id);
      const outcome=Array.isArray(outcomes[a.id])?outcomes[a.id][index]:null;
      const critical=!!outcome?.critical,hit=outcome?.hit!==false;
      if((a.triggers||[]).some(x=>x.requiresCritical||x.event==='crit')&&!outcome)
        missingCritData.add(a.id);
      const tStart=now;
      if(Number.isFinite(mana))mana-=a.resourceCost||0;
      const buffed=[...active.values()].reduce((p,b)=>p*
        (finite(b.damageMultiplier)?b.damageMultiplier:1),1);
      if(cooldownStart==='start')cooldowns.set(a.id,
        tStart+a.cooldown*(1-getHaste()));
      for(const rule of a.triggers||[])executeTrigger(rule,'cast',critical,a.id,outcome,a.hits);
      // A measured lock controls both whether an ability completes and when
      // the next action can begin. No post-cast damage is invented after fight end.
      advance(tStart+a.lockSeconds);
      if(now<tStart+a.lockSeconds-EPS)break;
      // Cooldown starts on completion in this conservative scenario.
      if(cooldownStart==='complete')cooldowns.set(a.id,
        now+a.cooldown*(1-getHaste()));
      const base=(a.flatDamage+a.attackCoefficient*attack)*a.hits;
      const damage=hit?base*buffed*(critical?(finite(a.criticalMultiplier)?a.criticalMultiplier:1):1):0;
      metrics.totalDamage+=damage;metrics.casts++;metrics.completed++;
      if(!hit)metrics.misses++;
      if(critical)metrics.criticalEvents++;
      casts.set(a.id,index+1);
      events.push({at:now,start:tStart,type:'cast',id:a.id,damage,critical,hit,resource:mana});
      if(hit)for(const rule of a.triggers||[])
        executeTrigger(rule,'hit',critical,a.id,outcome,a.hits);
      if(critical&&hit)for(const rule of a.triggers||[])
        executeTrigger(rule,'crit',critical,a.id,outcome,a.hits);
      for(const event of ['kill','block','evasion'])
        if(outcome?.[event])for(const rule of a.triggers||[])
          executeTrigger(rule,event,critical,a.id,outcome,a.hits);
    }
    if(events.length>=MAX_EVENTS)limitations.push('Simulation event cap reached.');
    if(missingCritData.size)limitations.push('No observed critical/proc outcomes for: '+[...missingCritData].join(', '));
    if(missingProcData.size)limitations.push('No measured chance-proc outcomes for: '+[...missingProcData].join(', '));
    if(!resolved.every(a=>a.timingSource==='global-measured'&&a.damageSource==='global-measured'))
      limitations.push('Some action locks or damage coefficients are uncalibrated scenarios. DPS is NOT an observed Global result.');
    const regional=resolved.filter(a=>a.timingSource?.startsWith('regional-'));
    if(regional.length)limitations.push('Regional timing transfers are subject to Global patch parity and input latency; check '+regional.map(a=>a.id).join(', ')+'.');
    const bySkill={};
    for(const e of events)if(e.type==='cast'){
      bySkill[e.id]||={casts:0,damage:0};
      bySkill[e.id].casts++;bySkill[e.id].damage+=e.damage;
    }
    return {ok:true,totalDamage:metrics.totalDamage,dps:metrics.totalDamage/duration,
      duration,metrics,bySkill,events,limitations,
      timingProvenance:Object.fromEntries(resolved.filter(a=>a.timingProvenance).map(a=>[a.id,a.timingProvenance])),
      assumptions:{cooldownCap:percentCap,cooldownStart:cooldownStart==='start'?'cast-start':'cast-completion',
        actionLock:'caller-provided',criticalEvents:'deterministic explicit outcomes',
        animationCancel:'only if represented in caller-provided measured lockSeconds'}};
  }
  return Object.freeze({simulate,validate,COOLDOWN_REDUCTION_CAP:percentCap});
})();
