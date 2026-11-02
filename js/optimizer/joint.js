'use strict';
/**
 * Joint character progression tools for AION 2 Global.
 *
 * Unlike a priority list, a neighboring build is evaluated after the actual
 * gear, purchased ranks, Daevanion bonuses, Stigmas and unlocked Specialties
 * have been combined by the caller's combat model.
 *
 * Outputs are COMPARATIVE hypotheses until Global damage and action locks
 * have been measured. This module must not invent cast frames or DPS.
 */
const JointProgression = (()=>{
  const EPS=1e-9;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)||0));
  const spend=(levels,names,cost,minimum)=>names.reduce((sum,name)=>{
    const level=levels[name]??minimum;
    for(let n=minimum+1;n<=level;n++)sum+=cost(n);
    return sum;
  },0);
  function improveRanks({names,initial,budget,cost,cap,score,minimum=1,
      pinned=[],maxEvaluations=700,maxPasses=10}){
    if(!Array.isArray(names)||!names.length||typeof score!=='function')
      throw Error('Rank optimization requires legal names and a combat scorer');
    const set=new Set(pinned),allowed=new Set(names);
    const values=Object.fromEntries(names.map(name=>{
      const limit=typeof cap==='function'?cap(name):cap;
      return [name,clamp(Math.floor(initial[name]??minimum),minimum,limit)];
    }));
    const limit=Math.max(0,Math.floor(budget||0));
    let spent=spend(values,names,cost,minimum);
    if(spent>limit)throw Error('Cannot optimize a build exceeding its point budget');
    let evaluations=0,changes=0;
    const cache=new Map();
    const evaluate=candidate=>{
      const key=names.map(name=>candidate[name]??minimum).join(',');
      if(cache.has(key))return cache.get(key);
      if(evaluations>=maxEvaluations)return -Infinity;
      evaluations++;
      const value=Number(score(candidate));
      const safe=Number.isFinite(value)?value:-Infinity;
      cache.set(key,safe);
      return safe;
    };
    let bestScore=evaluate(values);
    // First spend available points when an increase actually improves the
    // user's modeled objective; never add pointless ranks just to fill a bar.
    for(let pass=0;pass<maxPasses;pass++){
      let winner=null;
      const update=(candidate,newSpent,change)=>{
        if(newSpent>limit||newSpent<0)return;
        const trial=evaluate(candidate),gain=trial-bestScore;
        if(gain<=EPS)return;
        const efficiency=gain/Math.max(1,Math.abs(newSpent-spent)+1);
        if(!winner||gain>winner.gain+EPS||
           Math.abs(gain-winner.gain)<EPS&&efficiency>winner.efficiency){
          winner={values:candidate,spent:newSpent,score:trial,gain,efficiency,change};
        }
      };
      for(const recipient of names){
        if(set.has(recipient))continue;
        const current=values[recipient];
        const maximum=typeof cap==='function'?cap(recipient):cap;
        if(current>=maximum)continue;
        const addition=cost(current+1);
        if(spent+addition<=limit){
          const candidate={...values,[recipient]:current+1};
          update(candidate,spent+addition,{skill:recipient,delta:1});
        }
        // Legal point-for-point tradeoffs let the engine reassign ranks
        // even when no unspent currency remains. Evaluate complete builds.
        for(const donor of names){
          if(donor===recipient||set.has(donor)||values[donor]<=minimum)continue;
          const refund=cost(values[donor]),nextSpent=spent-refund+addition;
          if(nextSpent>limit)continue;
          const candidate={...values,[recipient]:current+1,
            [donor]:values[donor]-1};
          update(candidate,nextSpent,{skill:recipient,donor});
          if(evaluations>=maxEvaluations)break;
        }
        if(evaluations>=maxEvaluations)break;
      }
      if(!winner)break;
      Object.assign(values,winner.values);
      spent=winner.spent;bestScore=winner.score;changes++;
      if(evaluations>=maxEvaluations)break;
    }
    return {levels:values,spent,score:bestScore,evaluations,changes,
      unspent:limit-spent,method:'Legal combat-score rank exchanges (bounded coordinate search)'};
  }
  function optimizeCombined({classId,context,objective,
      mastery,stigma,masteryNames,stigmaNames,masteryBudget,stigmaBudget,
      masteryCost,stigmaCost,masteryCap,scoreBuild,
      pinMastery=false,pinStigma=false}){
    const mNames=masteryNames.filter(Boolean),sNames=stigmaNames.filter(Boolean);
    const initialM={...mastery.levels},initialS={...stigma.levels};
    let m={...mastery,levels:initialM},s={...stigma,levels:initialS};
    const trace=[];
    const score=(mr,sr)=>scoreBuild(mr,sr);
    const before=score(initialM,initialS);
    for(let i=0;i<2;i++){
      if(!pinMastery){
        const result=improveRanks({names:mNames,initial:m.levels,
          budget:masteryBudget,cost:masteryCost,cap:masteryCap,
          score:r=>score(r,s.levels),minimum:1,maxEvaluations:500,
          maxPasses:6});
        m={...m,levels:result.levels,spent:result.spent,
          unspent:result.unspent};
        trace.push({area:'mastery',pass:i+1,evaluations:result.evaluations,
          changes:result.changes});
      }
      if(!pinStigma&&sNames.length){
        const result=improveRanks({names:sNames,initial:s.levels,
          budget:stigmaBudget,cost:stigmaCost,cap:20,
          score:r=>score(m.levels,r),minimum:0,maxEvaluations:350,
          maxPasses:6});
        s={...s,levels:result.levels,spent:result.spent,
          unspent:result.unspent};
        trace.push({area:'stigma',pass:i+1,evaluations:result.evaluations,
          changes:result.changes});
      }
      if(pinMastery&&pinStigma)break;
    }
    const after=score(m.levels,s.levels);
    return {mastery:m,stigma:s,scoreBefore:before,scoreAfter:after,
      objective,context,classId,trace,
      evidence:'comparative combat proxy; uncalibrated for absolute DPS/HPS/PvP win-rate'};
  }
  const STATS_SCALE=Object.freeze({
    HPMax:1500,MPMax:500,Defense:2000,Critical:500,
    CriticalResist:500,CombatSpeed:1000,CoolTimeDecrease:1000,
    PvEAddDamage:80,PvEDamageDefense:1200,PvEAccuracy:150,PvEEvasion:150,
    BossNpcAddDamage:80,BossNpcDefense:1200,
    PvPAddDamage:80,PvPDamageDefense:1200,PvPAccuracy:150,PvPEvasion:150,
    PvPCritical:500,PvPCriticalResist:500,AbnormalAccuracy:150,
    AbnormalResistance:150,PvEAmplifyDamage:500,PvEDecreaseDamage:500,
    BossNpcAmplifyDamage:500,BossNpcDecreaseDamage:500,
    PvPAmplifyDamage:500,PvPDecreaseDamage:500
  });
  const STAT_DEFAULT=Object.freeze({
    PvEAmplifyDamage:18,BossNpcAmplifyDamage:14,PvEAddDamage:8,
    BossNpcAddDamage:8,PvEDecreaseDamage:9,BossNpcDecreaseDamage:8,
    PvEDamageDefense:5,BossNpcDefense:5,HPMax:5,MPMax:2,
    PvPAmplifyDamage:16,PvPAddDamage:8,PvPDecreaseDamage:12,
    PvPDamageDefense:8,AbnormalResistance:10,AbnormalAccuracy:9,
    Critical:8,CriticalResist:7,CoolTimeDecrease:11,CombatSpeed:12
  });
  const emphasis=(key,context,objective,role)=>{
    let scale=1;
    const pvp=String(context).startsWith('pvp');
    if(pvp&&/PvE|BossNpc/.test(key))scale=.02;
    if(!pvp&&/^PvP|^Abnormal/.test(key))scale=.01;
    if(objective==='survivability'&&/Defense|DecreaseDamage|Resist|HPMax|Evasion/.test(key))scale*=2.2;
    if(objective==='burst'&&/Amplify|AddDamage|Critical|CombatSpeed/.test(key))scale*=1.8;
    if(objective==='sustained'&&/CoolTimeDecrease|CombatSpeed|Accuracy|AddDamage/.test(key))scale*=1.65;
    if(role==='healer'&&/HPMax|Defense|DecreaseDamage/.test(key))scale*=1.5;
    if(context==='pvp-arena'&&/Abnormal|PvPAccuracy|PvPCritical/.test(key))scale*=1.4;
    if(context==='pvp-abyss-group'&&/Defense|Resist|HPMax/.test(key))scale*=1.35;
    return scale;
  };
  // A board route always respects the actual node graph, costs, free start
  // and point-type boundary. Its order is driven by marginal contextual
  // utility, not by cosmetic tab order or the next unconnected high stat.
  function rankConnectedBoard({board,context='party',objective='performance',
      role='damage',stats={},weights={},meta={}}){
    if(!board?.nodes?.length)throw Error('Board nodes required');
    const nodes=board.nodes;
    const grid=new Map(nodes.map(n=>[n[1]+':'+n[2],n]));
    const starts=nodes.filter(n=>n[5]===0);
    if(starts.length!==1)throw Error('Board requires one free root');
    const visited=new Set(starts.map(n=>n[0]));
    const totals={...stats},route=[];
    const frontier=new Map();
    const offer=n=>{
      for(const [r,c] of [[n[1]-1,n[2]],[n[1]+1,n[2]],
          [n[1],n[2]-1],[n[1],n[2]+1]]){
        const other=grid.get(r+':'+c);
        if(other&&!visited.has(other[0]))frontier.set(other[0],other);
      }
    };
    offer(starts[0]);
    function marginal(node){
      let value=0;
      for(const [key,raw] of node[6]||[]){
        const numeric=Number(raw);
        if(!Number.isFinite(numeric)||numeric<0)continue;
        const weight=Number(weights[key])>0?Number(weights[key]):
          (STAT_DEFAULT[key]||2);
        const scale=STATS_SCALE[key]||500;
        const divisor=meta[key]?.div||1;
        const before=Math.max(0,Number(totals[key])||0)/divisor;
        const gain=numeric/divisor;
        const cap=1+before/scale;
        value+=weight*emphasis(key,context,objective,role)*gain/
          Math.max(1,scale/20)/cap;
      }
      // Lower cost wins if two tiles provide similar marginal utility.
      return value/Math.max(1,node[5])+
        (node[5]===1?.00001:0);
    }
    while(frontier.size){
      let choice=null,score=-Infinity;
      for(const node of frontier.values()){
        const current=marginal(node);
        if(current>score+EPS||Math.abs(current-score)<=EPS&&
          (choice===null||node[0]<choice[0])){choice=node;score=current}
      }
      if(!choice)break;
      frontier.delete(choice[0]);visited.add(choice[0]);
      route.push({board:board.name,id:choice[0]});
      for(const [key,value] of choice[6]||[])
        totals[key]=(totals[key]||0)+value;
      offer(choice);
    }
    if(route.length!==nodes.length-1)throw Error('Unreachable board nodes');
    return route;
  }
  const MANUAL_MOTION=new Set(['Hellfire','Deadshot','Punishment']);
  function adviseMacro({classId,context,objective='performance',profile,
      available=[],stigma=[],levels={},specialties={}}){
    const usable=new Set([...available,...stigma]);
    const activeOnly=new Set(available);
    const manual=new Set(profile?.hotbar?.flatMap(([names,description,tone])=>
      (tone==='buff'||tone==='heal'||tone==='defense'||
       /manual|charge|heal|block|control|escape|buff/i.test(description||''))
        ?names:[])||[]);
    for(const name of MANUAL_MOTION)manual.add(name);
    if(classId==='spiritmaster'&&(specialties['Elemental Fusion']||[]).includes(4))
      manual.add('Elemental Fusion');
    const stacks=(profile?.stacks||[]).filter(s=>!s.manual).map(stack=>{
      const skills=stack.skills.filter(name=>usable.has(name)&&
        !manual.has(name));
      // Preserve actual stack order when trigger requirements are not known.
      // This is a legality pass, not a fabricated optimal cast-order claim.
      return {...stack,skills,knownCooldowns:skills.map(name=>({
        name,seconds:typeof GlobalActionData!=='undefined'
          ?GlobalActionData.lookup(classId,name):null,
        effectiveLevel:levels[name]||null
      }))};
    }).filter(stack=>stack.skills.length);
    const keys=stacks.map(s=>s.key);
    return {stacks,keys,manual:[...manual].filter(n=>usable.has(n)),
      caveat:'Stack order retains validated class trigger dependencies; exact macro timing, resets and motion locks require Global measurements.',
      objective,context,classId,
      coverage:stacks.flatMap(s=>s.knownCooldowns)};
  }
  return Object.freeze({improveRanks,optimizeCombined,rankConnectedBoard,adviseMacro,spend});
})();
