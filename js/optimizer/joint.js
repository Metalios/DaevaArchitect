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
      pinned=[],minRanks={},maxEvaluations=700,maxPasses=10,breakpoints=[]}){
    if(!Array.isArray(names)||!names.length||typeof score!=='function')
      throw Error('Rank optimization requires legal names and a combat scorer');
    const set=new Set(pinned),allowed=new Set(names);
    const floor=name=>Math.max(minimum,Math.floor(Number(minRanks[name])||minimum));
    const values=Object.fromEntries(names.map(name=>{
      const limit=typeof cap==='function'?cap(name):cap;
      return [name,clamp(Math.floor(initial[name]??minimum),floor(name),limit)];
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
          if(donor===recipient||set.has(donor)||values[donor]<=floor(donor))continue;
          const refund=cost(values[donor]),nextSpent=spent-refund+addition;
          if(nextSpent>limit)continue;
          const candidate={...values,[recipient]:current+1,
            [donor]:values[donor]-1};
          update(candidate,nextSpent,{skill:recipient,donor});
          if(evaluations>=maxEvaluations)break;
        }
        if(evaluations>=maxEvaluations)break;
      }
      // Ranks often have no benefit until the next 8/12/16 effective-skill
      // Specialty or Stigma 5/10/15/20 unlock. A pure +/-1 search cannot
      // exchange a complete milestone if fully budgeted. Check affordable
      // rank bundles as well as single ranks, with the same evaluation cap.
      for(const recipient of names){
        if(set.has(recipient)||evaluations>=maxEvaluations)break;
        const current=values[recipient],maximum=typeof cap==='function'?cap(recipient):cap;
        const targets=[...new Set(breakpoints)].filter(rank=>rank>current&&rank<=maximum)
          .sort((a,b)=>a-b).slice(0,2);
        for(const target of targets){
          if(evaluations>=maxEvaluations)break;
          let addition=0;for(let rank=current+1;rank<=target;rank++)addition+=cost(rank);
          const raised={...values,[recipient]:target};
          if(spent+addition<=limit)
            update(raised,spent+addition,{skill:recipient,from:current,to:target});
          for(const donor of names){
            if(evaluations>=maxEvaluations)break;
            if(donor===recipient||set.has(donor)||values[donor]<=floor(donor))continue;
            const previous=[floor(donor),...breakpoints.filter(rank=>rank<values[donor]&&rank>=floor(donor))]
              .sort((a,b)=>b-a)[0];
            if(previous>=values[donor])continue;
            let refund=0;for(let rank=previous+1;rank<=values[donor];rank++)refund+=cost(rank);
            if(spent+addition-refund>limit)continue;
            update({...raised,[donor]:previous},spent+addition-refund,
              {skill:recipient,from:current,to:target,donor,donorTo:previous});
          }
        }
      }
      if(!winner)break;
      Object.assign(values,winner.values);
      spent=winner.spent;bestScore=winner.score;changes++;
      if(evaluations>=maxEvaluations)break;
    }
    const remaining=limit-spent;
    let next=null;
    for(const name of names){
      if(set.has(name))continue;
      const rank=values[name]??minimum,
        maximum=typeof cap==='function'?cap(name):cap;
      if(rank>=maximum)continue;
      const costNext=cost(rank+1);
      if(costNext<=remaining)continue;
      const candidate={...values,[name]:rank+1};
      const gain=cache.get(names.map(key=>candidate[key]??minimum).join(','))-
        bestScore;
      const benefit=Number.isFinite(gain)?gain:0;
      const need=costNext-remaining;
      if(!next||benefit/need>next.benefit/next.need+EPS||
         Math.abs(benefit/need-next.benefit/next.need)<EPS&&need<next.need)
        next={name,rank:rank+1,cost:costNext,need,benefit};
    }
    return {levels:values,spent,score:bestScore,evaluations,changes,
      next,unspent:remaining,
      method:'Legal combat-score rank exchanges (bounded coordinate search)'};
  }
  function optimizeCombined({classId,context,objective,
      mastery,stigma,masteryNames,stigmaNames,masteryBudget,stigmaBudget,
      masteryCost,stigmaCost,masteryCap,scoreBuild,
      pinMastery=false,pinStigma=false,stigmaFloors={}}){
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
          maxPasses:6,breakpoints:[5,8,10]});
        m={...m,levels:result.levels,spent:result.spent,
          unspent:result.unspent,next:result.next};
        trace.push({area:'mastery',pass:i+1,evaluations:result.evaluations,
          changes:result.changes});
      }
      if(!pinStigma&&sNames.length){
        const result=improveRanks({names:sNames,initial:s.levels,
          budget:stigmaBudget,cost:stigmaCost,cap:20,
          score:r=>score(m.levels,r),minimum:0,minRanks:stigmaFloors,maxEvaluations:350,
          maxPasses:6,breakpoints:[5,10,15,20]});
        s={...s,levels:result.levels,spent:result.spent,
          unspent:result.unspent,next:result.next};
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
    // Ariel unlocks at 45 and is a separate PvE currency. Solo endgame
    // requires surviving Nightmare mechanics; it must not inherit the exact
    // same stat bias as a guarded five-player boss run.
    if(context==='solo'&&/Defense|DecreaseDamage|Resist|HPMax|Evasion/.test(key))
      scale*=objective==='survivability'?1.8:
        objective==='performance'?1.6:objective==='control'?1.45:
          objective==='burst'?1.2:1.0;
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
      classId=null,role='damage',pvpOpponent='all',stats={},weights={},meta={},
      budget=Infinity,locked=[]}){
    if(!board?.nodes?.length)throw Error('Board nodes required');
    const nodes=board.nodes;
    const grid=new Map(nodes.map(n=>[n[1]+':'+n[2],n]));
    const starts=nodes.filter(n=>n[5]===0);
    if(starts.length!==1)throw Error('Board requires one free root');
    const visited=new Set(starts.map(n=>n[0]));
    const totals={...stats},route=[];
    const availablePoints=Number.isFinite(budget)?
      Math.max(0,Math.floor(budget)):Infinity;
    let spent=0;
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
        value+=weight*emphasis(key,context,objective,role)*
          (classId?RoleBuildGoals.roleStatBoost(key,classId,objective):1)*
          (classId&&typeof PvpCombatModels!=='undefined'&&PvpCombatModels.isPvp(context)?
            PvpCombatModels.statPriority(classId,context,pvpOpponent,key):1)*gain/
          Math.max(1,scale/20)/cap;
      }
      // Lower cost wins if two tiles provide similar marginal utility.
      return value/Math.max(1,node[5])+
        (node[5]===1?.00001:0);
    }
    // Fund already-obtained Ariel/Azphel nodes FIRST. Connect scattered
    // marks with the cheapest real grid path, so the displayed route never
    // silently replaces a user's purchased special-board investments.
    const required=new Set((locked||[]).map(Number).filter(id=>
      nodes.some(n=>n[0]===id&&n[5]>0)));
    const adjacency=node=>{
      const found=[];
      for(const [r,c] of [[node[1]-1,node[2]],[node[1]+1,node[2]],
        [node[1],node[2]-1],[node[1],node[2]+1]]){
        const other=grid.get(r+':'+c);
        if(other)found.push(other);
      }
      return found;
    };
    const byId=new Map(nodes.map(n=>[n[0],n]));
    function pathTo(target){
      const open=[...visited].map(id=>({id,cost:0})),
        cost=new Map([...visited].map(id=>[id,0])),from=new Map();
      while(open.length){
        open.sort((a,b)=>a.cost-b.cost||a.id-b.id);
        const step=open.shift();
        if(step.cost!==cost.get(step.id))continue;
        if(step.id===target){
          const path=[];
          let id=target;
          while(!visited.has(id)){
            path.push(byId.get(id));id=from.get(id);
            if(id===undefined)throw Error('Unconnected special board target');
          }
          return path.reverse();
        }
        for(const n of adjacency(byId.get(step.id))){
          const next=step.cost+(visited.has(n[0])?0:n[5]);
          if(next<(cost.get(n[0])??Infinity)){
            cost.set(n[0],next);from.set(n[0],step.id);
            open.push({id:n[0],cost:next});
          }
        }
      }
      throw Error('Purchased special board tile has no connected route');
    }
    while([...required].some(id=>!visited.has(id))){
      let selected=null;
      for(const id of required){
        if(visited.has(id))continue;
        const path=pathTo(id),cost=path.reduce((sum,n)=>sum+n[5],0);
        if(!selected||cost<selected.cost||
            cost===selected.cost&&id<selected.id)selected={id,path,cost};
      }
      for(const node of selected.path){
        if(visited.has(node[0]))continue;
        visited.add(node[0]);frontier.delete(node[0]);
        spent+=node[5];
        route.push({board:board.name,id:node[0]});
        for(const [key,value] of node[6]||[])
          totals[key]=(totals[key]||0)+value;
        offer(node);
      }
    }
    if(spent>availablePoints)
      throw Error('Recorded special-board purchases require more connected crystals than the entered budget');
    while(frontier.size){
      let choice=null,score=-Infinity;
      // Optimize the *actual available currency*, not only the order of a
      // 232-point completed board. Avoid leading the user into a 4-point
      // branch while an affordable connected 1-point node remains.
      const candidates=[...frontier.values()];
      const affordable=candidates.filter(node=>
        spent+node[5]<=availablePoints);
      const pool=affordable.length?affordable:candidates;
      for(const node of pool){
        const current=marginal(node);
        if(current>score+EPS||Math.abs(current-score)<=EPS&&
          (choice===null||node[0]<choice[0])){choice=node;score=current}
      }
      if(!choice)break;
      frontier.delete(choice[0]);visited.add(choice[0]);
      spent+=choice[5];
      route.push({board:board.name,id:choice[0]});
      for(const [key,value] of choice[6]||[])
        totals[key]=(totals[key]||0)+value;
      offer(choice);
    }
    if(route.length!==nodes.length-1)throw Error('Unreachable board nodes');
    return route;
  }
  /**
   * Conservative four-slot Global Stigma comparison. Full real-score search
   * is limited by incomplete damage and animation evidence; avoid altering a
   * research-grounded default on a tiny or ambiguous proxy-score gain.
   */
  function chooseStigmaLoadout({baseline,candidates=[],isKnown,rankPlan,score,
      minimumImprovement=.12}){
    if(!Array.isArray(baseline)||baseline.length!==4)
      throw Error('Global Stigma candidates require four equipped slots');
    const legal=names=>Array.isArray(names)&&names.length===4&&
      new Set(names).size===4&&names.every(name=>
        typeof name==='string'&&isKnown(name));
    if(!legal(baseline))throw Error('Baseline equipped Stigmas are not legal');
    const unique=new Map();
    for(const names of [baseline,...candidates]){
      if(!legal(names))continue;
      const key=[...names].sort().join('|');
      if(!unique.has(key))unique.set(key,names.slice());
    }
    const tested=[];
    for(const names of unique.values()){
      const allocation=rankPlan(names);
      if(!allocation||!allocation.levels)continue;
      const value=Number(score(names,allocation.levels));
      if(!Number.isFinite(value))continue;
      tested.push({names,allocation,score:value});
    }
    const first=tested.find(candidate=>
      candidate.names.every(name=>baseline.includes(name)));
    if(!first)return {names:baseline.slice(),changed:false,evidence:'unavailable'};
    const improved=tested.slice().sort((a,b)=>b.score-a.score)[0];
    const delta=improved.score-first.score;
    const significant=delta>Math.max(1e-7,Math.abs(first.score)*minimumImprovement);
    return {names:significant?improved.names:first.names,
      changed:significant,score:significant?improved.score:first.score,
      baselineScore:first.score,compared:tested.length,
      evidence:'conservative comparative mechanics, not measured PvP win-rate or DPS'};
  }
  function optimizeSpecialties({skillNames,effectiveLevel,specData,
      manual={},preferred=null,score,maxEvaluations=300}){
    if(typeof score!=='function'||typeof effectiveLevel!=='function')
      throw Error('Specialty search requires an effective-rank combat model');
    const candidates={};
    const powers=skillNames.filter(name=>specData?.[name]&&
      effectiveLevel(name)>=8);
    const slots=level=>level>=20?3:level>=12?2:level>=8?1:0;
    const legal=(name)=>{
      const level=effectiveLevel(name);
      return Object.keys(specData[name]?.options||{}).map(Number)
        .filter(id=>Number.isInteger(id)&&id>=1&&id<=5&&
          level>=(id<=3?8:id===4?12:16)).sort((a,b)=>a-b);
    };
    const normalize=(name,values)=>{
      const options=new Set(legal(name));
      return [...new Set((values||[]).map(Number))]
        .filter(id=>options.has(id)).slice(0,slots(effectiveLevel(name)));
    };
    const combinations=(values,count,start=0)=>{
      if(count===0)return [[]];
      const result=[];
      for(let i=start;i<=values.length-count;i++)
        for(const rest of combinations(values,count-1,i+1))
          result.push([values[i],...rest]);
      return result;
    };
    for(const name of powers){
      const level=effectiveLevel(name),key=level>=20?'20':
        level>=16?'16':level>=12?'12':'8';
      const defaultPicks=specData[name].picks?.[key]||[];
      const researched=typeof preferred==='function'
        ?preferred(name,level,specData[name]):preferred?.[name];
      const selected=manual[name]??researched??defaultPicks;
      candidates[name]=normalize(name,selected);
    }
    let scoreNow=Number(score(candidates)),evaluations=1,changes=0;
    if(!Number.isFinite(scoreNow))throw Error('Specialty model score is invalid');
    for(let pass=0;pass<2;pass++){
      let changed=false;
      for(const name of powers){
        if(Array.isArray(manual[name]))continue;
        const choices=legal(name),count=Math.min(slots(effectiveLevel(name)),choices.length);
        if(count===0)continue;
        let best=candidates[name],bestScore=scoreNow;
        for(const alternative of combinations(choices,count)){
          if(evaluations>=maxEvaluations)break;
          if(alternative.join(',')===candidates[name].join(','))continue;
          const candidate={...candidates,[name]:alternative};
          const value=Number(score(candidate));evaluations++;
          if(Number.isFinite(value)&&value>bestScore+EPS){
            bestScore=value;best=alternative;
          }
        }
        if(best!==candidates[name]){
          candidates[name]=best;scoreNow=bestScore;changes++;changed=true;
        }
        if(evaluations>=maxEvaluations)break;
      }
      if(!changed||evaluations>=maxEvaluations)break;
    }
    return {picks:candidates,score:scoreNow,evaluations,changes,
      evidence:'Specialty combinations scored by class mechanics, not verified action-time DPS'};
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
    // Sorcerer PvE intentionally moves repeatable offensive Stigmas into
    // its held macro (and NOT charge/defense/toggle skills). Generic hotbar
    // "buff" labels must not silently delete those explicitly chosen rows.
    if(classId==='sorcerer'&&context!=='pvp'&&!String(context).startsWith('pvp-')){
      const explicitlyAutomated=new Set((profile?.stacks||[])
        .filter(stack=>!stack.manual).flatMap(stack=>stack.skills)
        .filter(name=>name==='Element Enhancement'||
          name==='Delayed Explosion'||name==='Wish of Concentration'));
      for(const name of explicitlyAutomated)manual.delete(name);
      // An explicitly requested Conquest Bittercold attack must not vanish
      // merely because the generic solo hotbar describes manual placement.
      // Only these offensive spells are exempt; emergency defense, charged
      // attacks and short burst buffs remain manual.
      if(context==='party'&&(profile?.stacks||[]).some(stack=>
        !stack.manual&&stack.skills.includes('Bittercold Wind')))
        manual.delete('Bittercold Wind');
      // Some shared base profiles retain a *manual fallback* label for a
      // mobile-specialty attack. When its real Global option is selected
      // and the context profile deliberately placed it in E, the generic
      // "manual" keyword must not silently delete that automatic action.
      const mobileFollowups={
        'Frost Burst':2,'Bittercold Wind':2,"Winter's Shackles":1
      };
      for(const [name,option] of Object.entries(mobileFollowups)){
        if((specialties[name]||[]).includes(option)&&
          (profile?.stacks||[]).some(stack=>!stack.manual&&stack.skills.includes(name)))
          manual.delete(name);
      }
    }
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
  return Object.freeze({improveRanks,optimizeCombined,rankConnectedBoard,chooseStigmaLoadout,optimizeSpecialties,adviseMacro,spend});
})();
