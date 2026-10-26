'use strict';
// AION 2 Global build evaluation. Mechanics are from Global 2.0.8.0.
// Animation baselines can be transferred from KR/TW; unmeasured actions are
// *scenarios*, not measured Global timings. Scores are comparative units.
// This engine deliberately never claims to produce measured in-game DPS.
const GlobalCombatEngine=(()=>{
  const SOURCE=Object.freeze({
    version:'Global 2.0.8.0 / 2026-10-21',
    skills:'https://aion2.gaming.tools/skills/15040000',
    coefficients:'https://aion2data.com/best/sorcerer-skills',
    animations:'https://aion2.grimvane.app/companion/wiki/sorcerer-primer/',
    timings:'KR/TW transferable hypothesis; Global cancel limits unverified'
  });
  // Event damage units are calibrated to the proportions seen in historical
  // Global Sorcerer combat records, NOT a substitute for server damage.
  // Durations other than Hellfire charge are explicit uncertain scenario inputs.
  const ACTIONS=Object.freeze({
    'Flame Arrow':{cd:0,occupied:.64,power:.054,mp:-100,mode:'filler',speed:'combat'},
    'Firestorm':{cd:5,occupied:.76,power:.28,mp:250,mode:'macro',speed:'skill'},
    'Bittercold Wind':{cd:15,occupied:.82,power:.84,mp:220,mode:'macro',speed:'combat',ground:true},
    'Blaze':{cd:5,occupied:.65,power:.41,mp:-60,mode:'macro',requires:'fireMark',speed:'combat'},
    'Frost':{cd:30,occupied:.72,power:.15,mp:120,mode:'macro',speed:'combat'},
    'Frost Burst':{cd:10,occupied:.68,power:.30,mp:160,mode:'macro',requires:'frost',speed:'combat'},
    "Winter's Shackles":{cd:45,occupied:.76,power:.23,mp:180,mode:'macro',speed:'combat'},
    'Flame Scattershot':{cd:0,occupied:.60,power:.28,mp:70,mode:'conditional',requires:'stagger',speed:'combat'},
    'Hellfire':{cd:45,occupied:1.85,charge:1.50,recovery:.35,power:4.00,mp:300,mode:'manual-charge',speed:'skill'},
    'Wish of Concentration':{cd:60,occupied:.60,power:0,mp:0,mode:'manual-buff',speed:'combat'},
    'Element Enhancement':{cd:60,occupied:.60,power:0,mp:0,mode:'manual-buff',speed:'combat'},
    'Delayed Explosion':{cd:25,occupied:.65,power:.60,mp:150,mode:'manual-debuff',speed:'combat'},
    'Fire Wall':{cd:30,occupied:.72,power:1.15,mp:200,mode:'macro',speed:'combat',ground:true},
    'Cold Storm':{cd:30,occupied:.75,power:.78,mp:200,mode:'macro',speed:'combat',ground:true}
  });
  const ENCOUNTERS=[
    {id:'stationary',duration:180,movement:0,weight:.5,animation:1},
    {id:'mobile',duration:180,movement:.35,weight:.3,animation:1.15},
    {id:'short',duration:30,movement:.08,weight:.2,animation:.9}
  ];
  const MACRO_LAYOUTS=Object.freeze({
    compact:{label:'One-stack Q',steps:['Q'],
      stacks:[{key:'Q',title:'Compact cooldown damage',skills:['Firestorm','Blaze','Bittercold Wind',"Winter's Shackles"]}]},
    balanced:{label:'Two-stack Q / E',steps:['Q','E'],
      stacks:[{key:'Q',title:'Cooldown and frost setup',skills:['Firestorm','Bittercold Wind',"Winter's Shackles",'Frost']},
        {key:'E',title:'Conditional follow-ups',skills:['Blaze','Frost Burst','Flame Scattershot']}]},
    ground:{label:'Ground-damage Q / E / R',steps:['Q','E','R'],
      stacks:[{key:'Q',title:'Cooldown and frost setup',skills:['Firestorm','Bittercold Wind',"Winter's Shackles",'Frost']},
        {key:'E',title:'Conditional follow-ups',skills:['Blaze','Frost Burst','Flame Scattershot']},
        {key:'R',title:'Equipped damage Stigmas',skills:['Fire Wall','Cold Storm']}]}
  });
  const CORE=['Firestorm','Blaze','Hellfire','Wish of Concentration','Bittercold Wind',"Winter's Shackles",'Flame Arrow'];
  const SPEC_KEYS=['Firestorm','Hellfire','Blaze','Wish of Concentration',"Winter's Shackles",'Flame Arrow','Bittercold Wind'];
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const sum=items=>items.reduce((acc,n)=>acc+n,0);
  const effective=(build,name)=>clamp((build.mastery[name]||1)+(build.boardSkills[name]||0)+(build.gearSkills[name]||0),1,40);
  const has=(specialties,name,id)=>(specialties[name]||[]).includes(id);
  function legalOptions(name,level,specData){
    const options=specData?.[name]?.options||{};
    return Object.keys(options).map(Number).filter(n=>level>=(n<=3?8:n===4?12:16)).sort((a,b)=>a-b);
  }
  function slots(level){return level>=20?3:level>=12?2:level>=8?1:0}
  function combinations(items,count){
    if(count===0)return [[]];
    const out=[];for(let i=0;i<items.length;i++)
      for(const tail of combinations(items.slice(i+1),count-1))out.push([items[i],...tail]);
    return out;
  }
  function fallbackPicks(name,level,specData){
    const entry=specData?.[name];
    const key=level>=20?'20':level>=16?'16':level>=12?'12':level>=8?'8':null;
    const legal=legalOptions(name,level,specData),maximum=slots(level);
    const picks=(entry?.picks?.[key]||[]).filter(id=>legal.includes(id)).slice(0,maximum);
    return picks.length===maximum?picks:legal.slice(0,maximum);
  }
  const hasStigma=(build,name)=>build.equippedStigmas.includes(name)&&(build.stigma[name]||0)>0;
  function simulate(build,spec,scenario=ENCOUNTERS[0]){
    const ranks=build.mastery,boardStats=build.boardStats||{},gearStats=build.gearStats||{};
    // Global Combat Speed bonus uses the Global client stat scale /100.
    // Exact server animation modifier is not known; divide-by-(1+speed)
    // is a sensitivity hypothesis, not a confirmed game formula.
    const combatSpeed=clamp(((boardStats.CombatSpeed||0)+(gearStats.CombatSpeed||0))/10000,0,.8);
    const skillSpeed=name=>{
      if(name==='Firestorm'&&has(spec,name,2))return .20;
      if(name==='Hellfire'&&has(spec,name,1))return .30;
      return 0;
    };
    const speedTime=name=>{
      const action=ACTIONS[name],speed=skillSpeed(name),bonus=combatBuffUntil>now?.10:0,
        overall=1+combatSpeed+bonus;
      if(name==='Hellfire'){
        // 1.50s full charge is transferred from a regional client; the
        // .35s release/recovery is an unverified scenario assumption.
        return Math.max(.18,((action.charge*(1-speed))+action.recovery)*scenario.animation/overall);
      }
      return Math.max(.18,action.occupied*scenario.animation*(1-speed)/overall);
    };
    const cd={},counts={},damageBySkill={},stigma=build.stigma;
    let now=0,damage=0,mp=2000,fireMarkUntil=0,frostUntil=0,staggerUntil=0,attackBuffUntil=0,
      pveBuffUntil=0,combatBuffUntil=0,manualActions=0,missedGround=0,skippedForMp=0,unavailable=0,castTime=0;
    const macro=MACRO_LAYOUTS[build.macroLayout]||MACRO_LAYOUTS.ground;
    const priority=macro.stacks.flatMap(stack=>stack.skills);
    const macroStepOverhead=(macro.steps.length-1)*.012; // input sensitivity, not measured animation
    const equippedGround=macro.steps.includes('R')?['Fire Wall','Cold Storm'].filter(name=>hasStigma(build,name)):[];
    const maxSteps=2500;
    const eligible=name=>{
      const action=ACTIONS[name];
      if(!action)return false;
      if(!hasStigma(build,name)&&!(build.availableSkills||[]).includes(name))return false;
      if((cd[name]||0)>now+1e-6)return false;
      if(action.requires==='fireMark'&&fireMarkUntil<now)return false;
      if(action.requires==='frost'&&frostUntil<now)return false;
      if(action.requires==='stagger'&&staggerUntil<now)return false;
      return mp>=Math.max(0,action.mp);
    };
    const reduceCooldown=(name,seconds)=>{cd[name]=Math.max(now,(cd[name]||0)-seconds)};
    const cast=name=>{
      const act=ACTIONS[name],current=effective(build,name),rankBonus=1+.035*(current-1),
        time=speedTime(name),movement=scenario.movement||0;
      now+=time;castTime+=time;
      if(act.mp>=0)mp-=act.mp;else mp=Math.min(3000,mp-act.mp);
      // Unmeasured damage is normalized for comparative build ranking.
      let multiplier=rankBonus;
      if(name==='Hellfire'&&has(spec,'Hellfire',4))multiplier*=1.12;
      if(name==='Firestorm'&&has(spec,'Firestorm',5))multiplier*=1.45;
      if(name==='Blaze'&&has(spec,'Blaze',3))multiplier*=1.11;
      if(name==='Blaze'&&has(spec,'Blaze',4))multiplier*=1.16;
      if(name==='Flame Arrow'&&has(spec,'Flame Arrow',3))multiplier*=1.12;
      if(name==='Bittercold Wind'&&has(spec,'Bittercold Wind',4))multiplier*=1.10;
      // These passive rank slopes are comparative estimates, not client data.
      const robe=effective(build,'Robe of Flame')-1,
            grace=effective(build,'Grace of Enhancement')-1;
      const elementLevel=hasStigma(build,'Element Enhancement')?(stigma['Element Enhancement']||0):0;
      const robeBoost=elementLevel>=10?1.5:1;
      const graceBoost=elementLevel>=15?1.5:1;
      multiplier*=1+.004*robe*robeBoost+(mp>750?.004*grace*graceBoost:0);
      if(attackBuffUntil>now)multiplier*=1.1;
      if(pveBuffUntil>now)multiplier*=1.2;
      if(name==='Hellfire'&&movement>0&&!has(spec,'Hellfire',3))multiplier*=1-movement*.22;
      if(act.ground){multiplier*=1-movement*.65;missedGround+=movement}
      const done=act.power*multiplier;
      damage+=done;damageBySkill[name]=(damageBySkill[name]||0)+done;
      counts[name]=(counts[name]||0)+1;
      cd[name]=now+Math.max(0,act.cd-(name==='Hellfire'&&has(spec,'Hellfire',5)?15:0));
      if(name==='Flame Arrow'||name==='Firestorm'){fireMarkUntil=now+12;mp=Math.min(3000,mp+35)}
      if(name==='Frost')frostUntil=now+4;
      if(name==="Winter's Shackles"&&has(spec,name,3))pveBuffUntil=now+5;
      if(name==='Firestorm'&&has(spec,name,4))reduceCooldown('Hellfire',10);
      if(name==='Blaze'&&has(spec,name,5))reduceCooldown('Wish of Concentration',3);
      if(name==='Wish of Concentration'){
        attackBuffUntil=now+15;
        if(has(spec,name,4))combatBuffUntil=now+15;
        if(has(spec,name,5))for(const target of Object.keys(cd))reduceCooldown(target,10);
      }
      if(name==='Element Enhancement')attackBuffUntil=Math.max(attackBuffUntil,now+10);
      if(name==='Flame Scattershot')staggerUntil=0;
    };
    for(let step=0;now<scenario.duration&&step<maxSteps;step++){
      // Stagger is an encounter condition, not an unconditional spam ability.
      if(Math.floor(now/40)>Math.floor((now-.5)/40))staggerUntil=now+3;
      let name=null;
      for(const manual of ['Element Enhancement','Wish of Concentration','Delayed Explosion','Hellfire']){
        if(manual==='Element Enhancement'||manual==='Delayed Explosion'){
          if(!hasStigma(build,manual))continue;
        }else if((build.mastery[manual]||1)===0)continue;
        if(eligible(manual)){name=manual;manualActions++;break}
      }
      if(!name){
        // Q/E is deliberately treated as opportunistic rather than a
        // perfectly deterministic game macro execution sequence.
        const available=priority.filter(eligible);
        name=available[0]||'Flame Arrow';
        if(!available.length)unavailable++;
        else now+=macroStepOverhead;
      }
      if(!eligible(name)){name='Flame Arrow';skippedForMp++}
      cast(name);
      if(!Number.isFinite(damage)||!Number.isFinite(now))throw Error('Invalid combat simulation state');
    }
    return {score:damage/scenario.duration,damage,damageBySkill,counts,manualActions,
      manualPerMinute:manualActions*60/scenario.duration,mpFinal:mp,castTime,
      missedGround,skippedForMp,unavailable,combatSpeed,
      units:'relative damage units per second (not measured DPS)'};
  }
  function evaluate(build,spec,scenarios=ENCOUNTERS){
    const samples=scenarios.map(s=>({scenario:s.id,weight:s.weight,...simulate(build,spec,s)}));
    const totalWeight=sum(samples.map(x=>x.weight))||1;
    const average=sum(samples.map(x=>x.score*x.weight))/totalWeight;
    const manual=sum(samples.map(x=>x.manualPerMinute*x.weight))/totalWeight;
    const weakest=Math.min(...samples.map(x=>x.score));
    return {score:average,robustScore:average*.85+weakest*.15,manualPerMinute:manual,samples,
      evidence:'modeled Global relative damage; incomplete regional animation timings'};
  }
  function candidateSpecs(build,specData,manual={},seed=null){
    const result={};
    for(const name of SPEC_KEYS){
      const rank=effective(build,name),choices=legalOptions(name,rank,specData),count=slots(rank);
      const locked=manual[name];
      result[name]=Array.isArray(locked)
        ? [...new Set(locked)].filter(x=>choices.includes(x)).slice(0,count)
        : seed?.[name]?.length===count&&seed[name].every(x=>choices.includes(x))
          ? [...seed[name]]:fallbackPicks(name,rank,specData);
    }
    return result;
  }
  function tuneSpecialties(build,specData,manual={},seed=null,scenarioSet=ENCOUNTERS){
    let current=candidateSpecs(build,specData,manual,seed);
    let best=evaluate(build,current,scenarioSet);
    for(const name of SPEC_KEYS){
      if(Array.isArray(manual[name]))continue;
      const level=effective(build,name),options=legalOptions(name,level,specData),
        available=combinations(options,slots(level));
      for(const choices of available){
        const candidate={...current,[name]:choices},estimate=evaluate(build,candidate,scenarioSet);
        if(estimate.robustScore>best.robustScore+1e-9){
          current=candidate;best=estimate;
        }
      }
    }
    return {specialties:current,...best};
  }
  function chooseMacro(build,specialties,scenarios=ENCOUNTERS){
    let winner=null;
    for(const mode of ['compact','balanced','ground']){
      const layout=MACRO_LAYOUTS[mode];
      if(mode==='ground'&&!['Fire Wall','Cold Storm'].some(name=>hasStigma(build,name)))continue;
      const data=evaluate({...build,macroLayout:mode},specialties,scenarios);
      // Complexity cost is only a tie-breaker for setup burden. Actual
      // human inputs remain LMB+RMB with charged Hellfire/buffs manual.
      const adjusted=data.robustScore*(1-.002*(layout.steps.length-1));
      if(!winner||adjusted>winner.adjusted+1e-8)
        winner={...layout,mode,adjusted,...data};
    }
    return winner;
  }
  function scoreMastery(build,specData,manualSpecs={},seed=null){
    return tuneSpecialties(build,specData,manualSpecs,seed,[ENCOUNTERS[0],ENCOUNTERS[1]]).robustScore;
  }
  function refineMastery({initial,budget,cost,cap,build,specData,manualSpecs={}}){
    const mastery={...initial},names=CORE.concat(['Robe of Flame','Grace of Enhancement','Fire Mark','Robe of Earth','Absorb Essence','Frost','Frost Burst']);
    const unique=[...new Set(names)].filter(n=>Object.prototype.hasOwnProperty.call(mastery,n));
    let spent=Object.entries(mastery).reduce((v,[name,rank])=>{
      for(let r=2;r<=rank;r++)v+=cost(r);return v;
    },0);
    const score=()=>scoreMastery({...build,mastery},specData,manualSpecs);
    // Bounded coordinate exchange. Every accepted operation is legal and
    // improves the same comparative combat objective. Does not invent points.
    let best=score(),passes=0;
    while(passes++<3){
      let improved=false;
      for(const give of unique){
        if(mastery[give]<=1)continue;
        mastery[give]--;const recovered=cost(mastery[give]+1);
        for(const take of unique){
          const next=mastery[take]+1,need=cost(next);
          if(take===give||next>cap(take)||spent-recovered+need>budget)continue;
          mastery[take]=next;
          const trial=score();
          mastery[take]--;
          if(trial>best+1e-6){
            mastery[take]=next;spent=spent-recovered+need;best=trial;
            improved=true;break;
          }
        }
        if(improved)break;
        mastery[give]++;
      }
      if(!improved)break;
    }
    // Preserve original spent budget if no exchange won.
    return {levels:mastery,spent,score:best,passes:passes-1};
  }
  return Object.freeze({SOURCE,ACTIONS,ENCOUNTERS,legalOptions,slots,effective,
    MACRO_LAYOUTS,chooseMacro,simulate,evaluate,tuneSpecialties,refineMastery,scoreMastery});
})();
