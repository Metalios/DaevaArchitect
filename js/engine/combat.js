'use strict';
// Global-only candidate evaluation. Base skill cooldowns are cross-checked
// against the Global client skill index. Occupied action durations and cancels
// are unmeasured sensitivity scenarios, NOT data transferred from KR/TW.
// This engine deliberately never claims to produce measured in-game DPS.
const GlobalCombatEngine=(()=>{
  const SOURCE=Object.freeze({
    version:'Global client data 0.0.4387.0 / reviewed 2026-11-01',
    skills:'https://aion2.gaming.tools/skills/15040000',
    coefficients:'https://aion2data.com/best/sorcerer-skills',
    animations:'https://aion2.grimvane.app/companion/wiki/sorcerer-primer/',
    timings:'Unmeasured Global action-time/cancel scenario; not valid for absolute DPS'
  });
  // Event damage values are relative scenario units, not independently
  // calibrated to measured Global damage logs or the server combat formula.
  // Durations other than Hellfire charge are explicit uncertain scenario inputs.
  const ACTIONS=Object.freeze({
    'Flame Arrow':{cd:0,occupied:.64,power:.054,mp:-100,mode:'filler',speed:'combat'},
    'Firestorm':{cd:5,occupied:.76,power:.28,mp:250,mode:'macro',speed:'skill'},
    'Bittercold Wind':{cd:15,occupied:.82,power:.84,mp:150,mode:'macro',speed:'combat',ground:true},
    'Blaze':{cd:5,occupied:.65,power:.41,mp:-60,mode:'macro',requires:'fireMark',speed:'combat'},
    'Frost':{cd:30,occupied:.72,power:.15,mp:100,mode:'macro',speed:'combat'},
    'Frost Burst':{cd:10,occupied:.68,power:.30,mp:160,mode:'macro',requires:'frost',speed:'combat'},
    "Winter's Shackles":{cd:45,occupied:.76,power:.23,mp:180,mode:'macro',speed:'combat'},
    'Flame Scattershot':{cd:0,occupied:.60,power:.28,mp:70,mode:'conditional',requires:'stagger',speed:'combat'},
    'Hellfire':{cd:45,occupied:1.85,charge:1.50,recovery:.35,power:4.00,mp:200,mode:'manual-charge',speed:'skill'},
    'Wish of Concentration':{cd:60,occupied:.60,power:0,mp:100,mode:'manual-buff',speed:'combat'},
    'Element Enhancement':{cd:60,occupied:.60,power:0,mp:0,mode:'manual-buff',speed:'combat'},
    'Delayed Explosion':{cd:30,occupied:.65,power:.60,mp:200,mode:'manual-debuff',speed:'combat'},
    // 60s Global base cooldown and 50 Stagger on the target. Triggered
    // manually during a meaningful boss stagger/short burst opportunity;
    // direct relative damage and action lock remain uncalibrated.
    'Divine Burst':{cd:60,occupied:.68,power:.75,mp:200,mode:'manual-stagger',speed:'combat'},
    // Immediate power plus delayed ground DoT are uncalibrated relative
    // damage units; the 1s tick and 10s durations are from Global tooltips.
    'Fire Wall':{cd:60,occupied:.72,power:.65,mp:200,mode:'macro',speed:'combat',ground:true,dot:{ticks:10,every:1,power:.065}},
    'Cold Storm':{cd:60,occupied:.75,power:.42,mp:200,mode:'macro',speed:'combat',ground:true,dot:{ticks:10,every:1,power:.056}}
  });
  const ENCOUNTERS=[
    {id:'stationary',duration:180,movement:0,weight:.5,animation:1},
    {id:'mobile',duration:180,movement:.35,weight:.3,animation:1.15},
    {id:'short',duration:30,movement:.08,weight:.2,animation:.9}
  ];
  // Solo level-45 is Nightmare and Ascension Trial progression, not
  // campaign trash leveling. Movement is a transparent sensitivity
  // parameter; exact boss uptime/animation traces are NOT yet measured.
  const NIGHTMARE_ENCOUNTERS=Object.freeze([
    {id:'nightmare-boss',duration:180,movement:.38,weight:.55,animation:1.12},
    {id:'nightmare-mobile-boss',duration:180,movement:.60,weight:.30,animation:1.16},
    {id:'nightmare-burst-window',duration:30,movement:.28,weight:.15,animation:1.08}
  ]);
  function scenariosFor(context,goal='performance'){
    const base=context==='solo'?NIGHTMARE_ENCOUNTERS:ENCOUNTERS;
    if(goal==='burst')return [base[2]];
    if(goal==='sustained')return base.slice(0,2);
    return base;
  }
  const MACRO_LAYOUTS=Object.freeze({
    // All Q skills below can be used on the move without a specialty.
    // Do not automate a channel/ground placement in a forced-dodge window.
    // Blaze is conditional on Fire Mark. Attempt the ready spender FIRST;
    // Firestorm then supplies mark/MP pressure when Blaze is unavailable.
    mobile:{label:'Mobile Blaze priority / Firestorm setup',steps:['Q'],
      stacks:[{key:'Q',title:'Fire Mark spender before setup',skills:['Blaze','Firestorm']}]},
    compact:{label:'One-stack Q',steps:['Q'],
      stacks:[{key:'Q',title:'Compact cooldown damage',skills:['Blaze','Firestorm','Bittercold Wind',"Winter's Shackles"]}]},
    balanced:{label:'Two-stack Q / E',steps:['Q','E'],
      stacks:[{key:'Q',title:'Cooldown and frost setup',skills:["Winter's Shackles",'Bittercold Wind','Frost','Firestorm']},
        {key:'E',title:'Conditional follow-ups',skills:['Blaze','Frost Burst','Flame Scattershot']}]},
    ground:{label:'Ground-damage Q / E / R',steps:['Q','E','R'],
      stacks:[{key:'Q',title:'Cooldown and frost setup',skills:['Firestorm','Bittercold Wind',"Winter's Shackles",'Frost']},
        {key:'E',title:'Conditional follow-ups',skills:['Blaze','Frost Burst','Flame Scattershot']},
        {key:'R',title:'Equipped damage Stigmas',skills:['Fire Wall','Cold Storm']}]}
  });
  const CORE=['Firestorm','Blaze','Hellfire','Wish of Concentration','Bittercold Wind',"Winter's Shackles",'Flame Arrow'];
  const SPEC_KEYS=['Firestorm','Hellfire','Blaze','Wish of Concentration',"Winter's Shackles",'Flame Arrow','Bittercold Wind','Frost','Frost Burst'];
  // AION 2 Global mobile defaults and exact rank-8 mobile Specialty ids.
  // This answers whether the caster can keep moving while USING a skill.
  // It does not prove animation frames or real boss damage uptime.
  const DEFAULT_MOBILE=new Set(['Flame Arrow','Firestorm','Blaze','Frost',
    'Wish of Concentration','Element Enhancement','Delayed Explosion']);
  const MOBILE_SPECIALTIES=Object.freeze({
    'Hellfire':3,'Bittercold Wind':2,"Winter's Shackles":1,
    'Frost Burst':2,'Flame Scattershot':3
  });
  const isMobile=(name,spec={})=>
    DEFAULT_MOBILE.has(name)||
    (MOBILE_SPECIALTIES[name]!==undefined&&has(spec,name,MOBILE_SPECIALTIES[name]));
  const mobileLayout=(spec,extended=false)=>{
    const extra=extended?['Bittercold Wind',"Winter's Shackles"]
      .filter(name=>isMobile(name,spec)):[];
    return {label:extra.length?'Mobile fire + mobile-specialty follow-ups':'Continuous mobile Firestorm / Blaze',
      steps:extra.length?['Q','E']:['Q'],
      stacks:[{key:'Q',title:'Fire Mark spender then mobile setup',skills:['Blaze','Firestorm']},
        ...(extra.length?[{key:'E',title:'Only mobile-specialty follow-ups',skills:extra}]:[])]};
  };
  // Low-input Global PvE layout: LMB basic attack is held separately,
  // while RMB continually attempts three small safe skill columns. Manual
  // charged/channel and defensive abilities never enter this macro.
  // Only deterministic offensive Stigmas are auto-cast; burst builds retain
  // Delayed Explosion by hand for a deliberately timed Hellfire window.
  // Offensive buffs with a short damage window (especially Delayed
  // Explosion) are NOT safe to loop in an endgame RMB macro. The low-input
  // sustained goal may cycle Element Enhancement, but burst-oriented goals
  // keep the buffs in one *manual* hotbar stack.
  const CONTINUOUS_OFFENSE=Object.freeze(['Element Enhancement']);
  function flowLayout(build,spec){
    const purpose=build.objective||'performance';
    const context=build.context==='solo'?'solo':'party';
    const isSustained=purpose==='sustained';
    const isBurst=purpose==='burst';
    const active=new Set(build.equippedStigmas||[]);
    const capable=name=>(build.availableSkills||[]).includes(name);
    const equipped=name=>active.has(name)&&(build.stigma?.[name]||0)>0;
    const firePriority=build.firePriority==='firestorm'?'firestorm':'blaze';
    const fire=(firePriority==='firestorm'?['Firestorm','Blaze']:['Blaze','Firestorm'])
      .filter(capable);

    // Conquest: spend Bittercold Wind on a relatively stable target before
    // filler. Nightmare: only automate it after its genuine mobile option is
    // owned, so a dodge never commits a stationary channel by accident.
    const q=[
      ...(context==='party'&&!isBurst&&capable('Bittercold Wind')
        ?['Bittercold Wind']:[]),
      ...fire
    ];
    const mobileFrost=capable('Frost Burst')&&capable('Frost')&&
      isMobile('Frost Burst',spec);
    const mobileSolo=[
      ...(capable('Bittercold Wind')&&isMobile('Bittercold Wind',spec)
        ?['Bittercold Wind']:[]),
      ...(mobileFrost?['Frost Burst','Frost']:[])
    ];
    // Persistent ground Stigmas are useful only if the boss remains inside.
    // Group sustained/performance can automate them; burst and mobile Solo
    // keep explicit positioning on the manual bar. All four Stigma slots
    // remain constrained by actual funded ranks/equipment.
    const groupGround=context==='party'&&!isBurst&&purpose!=='survivability'
      ?['Fire Wall','Cold Storm'].filter(equipped):[];
    const e=context==='solo'?mobileSolo:groupGround;

    // The skill-level-16 Wish reset should be timed AFTER important skills
    // enter cooldown. The simplified sustained goal can automatically cycle
    // Wish *only without* that reset option, after a model comparison.
    const autoWish=isSustained&&build.autoWish===true&&
      !has(spec,'Wish of Concentration',5)&&capable('Wish of Concentration');
    const r=[
      ...(isSustained&&equipped('Element Enhancement')
        ?['Element Enhancement']:[]),
      ...(autoWish?['Wish of Concentration']:[])
    ];
    const stacks=[
      ...(q.length?[{key:'Q',title:context==='solo'
        ?'Mobile fire: Fire Mark spender / Hellfire cooldown support'
        :'Conquest: Bittercold and repeatable fire damage',skills:q}]:[]),
      ...(e.length?[{key:'E',title:context==='solo'
        ?'Earned mobile follow-ups':'Ground damage on stable bosses',skills:e}]:[]),
      ...(r.length?[{key:'R',title:'Optional sustained auto-buffs (never Delayed Explosion)',skills:r}]:[])
    ];
    return {
      label:context==='solo'?'Nightmare mobile damage with timed burst':
        'Conquest boss damage with conditional ground effects',
      context,firePriority,autoWish,steps:stacks.map(stack=>stack.key),stacks
    };
  }
  // Global Firestorm has five projectile hits. The level-12 Specialty
  // reduces Hellfire by two seconds for EACH projectile that actually hits.
  // This helper accepts an observed landed count once combat logs supply it.
  const FIRESTORM_PROJECTILES=5;
  const firestormHellfireCooldownReduction=landed=>
    2*Math.max(0,Math.min(FIRESTORM_PROJECTILES,Math.floor(Number(landed)||0)));
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
    const cooldownReduction=clamp(((boardStats.CoolTimeDecrease||0)+(gearStats.CoolTimeDecrease||0))/10000,0,.6);
    const damageBoost=clamp(((boardStats.AmplifyAllDamage||0)+(gearStats.AmplifyAllDamage||0))/10000,0,2);
    const attackBonus=(boardStats.FixingDamage||0)/2000; // unknown base Attack: comparative scenario only
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
    let now=0,damage=0,mp=2000,fireMarkUntil=0,frostUntil=0,staggerUntil=0,
      wishBuffUntil=0,elementBuffUntil=0,delayedUntil=0,
      pveBuffUntil=0,combatBuffUntil=0,manualActions=0,missedGround=0,
      skippedForMp=0,unavailable=0,castTime=0,fireMarkProcReady=0,
      forcedStopTime=0,stationaryCastTime=0,mobileCastTime=0,
      wishResetSeconds=0,wishResetTargets=0,wishCastsAuto=0,wishBuffUptime=0,
      incompleteActions=0;
    // Event queue preserves the four-second delayed hit and one-second
    // periodic damage rather than pretending every effect is instantaneous.
    const pending=[];
    const delayedBonus=at=>at<delayedUntil-1e-9?
      1+((stigma['Delayed Explosion']||0)>=20?.25:.15):1;
    const record=(name,raw,at)=>{
      if(raw<=0)return;
      const done=raw*delayedBonus(at);
      damage+=done;damageBySkill[name]=(damageBySkill[name]||0)+done;
    };
    const settle=until=>{
      pending.sort((a,b)=>a.at-b.at);
      while(pending.length&&pending[0].at<=until+1e-9){
        const next=pending.shift();
        record(next.name,next.amount,next.at);
      }
    };
    const macro=build.macroLayout==='flow'?flowLayout(build,spec)
      :['mobile','mobile-extended'].includes(build.macroLayout)
      ?mobileLayout(spec,build.macroLayout==='mobile-extended')
      :(MACRO_LAYOUTS[build.macroLayout]||MACRO_LAYOUTS.ground);
    const macroStacks=macro.steps.map(key=>macro.stacks.find(stack=>stack.key===key))
      .filter(Boolean);
    let macroCursor=0;
    const macroStepOverhead=(macro.steps.length-1)*.012; // input sensitivity, not measured animation
    const equippedGround=['Fire Wall','Cold Storm'].filter(name=>
      macro.stacks.some(stack=>stack.skills.includes(name))&&hasStigma(build,name));
    const macroSkills=new Set(macro.stacks.flatMap(stack=>stack.skills));
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
        time=speedTime(name),movement=scenario.movement||0,
        mobile=isMobile(name,spec);
      // A mobile attack keeps dealing damage during required dodges. A
      // stationary cast requires a stop/positioning window and costs extra
      // opportunity time. The multiplier is an explicitly UNMEASURED
      // sensitivity parameter, not a claim about Global animation frames.
      const stopCost=mobile?0:time*movement*
        (name==='Hellfire'?1.45:1.0);
      // Damage and buffs apply on COMPLETED actions only. A Hellfire whose
      // final charge/release extends beyond the scenario cannot be counted
      // as a landed hit; incomplete action attempts are reported explicitly.
      if(now+time+stopCost>scenario.duration+1e-9){
        incompleteActions++;now=scenario.duration;return false;
      }
      forcedStopTime+=stopCost;
      if(mobile)mobileCastTime+=time;else stationaryCastTime+=time;
      now+=time+stopCost;castTime+=time;settle(now);
      if(act.mp>=0)mp-=act.mp;else mp=Math.min(3000,mp-act.mp);
      // Unmeasured damage is normalized for comparative build ranking.
      let multiplier=rankBonus*(1+damageBoost+attackBonus);
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
      // Robe of Flame's PvE boost and Double Chance require separate
      // probability treatment; these remain model estimates until calibrated.
      const robePve=robe*.01*robeBoost;
      const robeDouble=robe*.002;
      multiplier*=(1+robePve)*(1+Math.min(.50,robeDouble))*
        (1+(mp>750?.004*grace*graceBoost:0));
      // The Global buffs are distinct: Wish = +10% Attack, Element =
      // +20% Fire/Water Attack, and Shackles = +20% PvE Damage Boost.
      // Actual additive/multiplicative server stacking is not yet measured.
      if(wishBuffUntil>now)multiplier*=1.1+(has(spec,'Wish of Concentration',2)?.1:0);
      if(elementBuffUntil>now)multiplier*=1.20;
      if(pveBuffUntil>now)multiplier*=1.2;
      // Nonmobile Hellfire is already penalized by the opportunity cost
      // of stopping. Do not double-charge it with an arbitrary damage loss.
      if(act.ground){multiplier*=1-movement*.65;missedGround+=movement}
      const done=act.power*multiplier;
      if(name==='Delayed Explosion'){
        // Global: +15% damage taken for FOUR seconds, impact at expiry.
        // Only this skill's hit is deferred; other actions benefit meanwhile.
        delayedUntil=now+4;
        pending.push({name,at:delayedUntil,amount:done});
      }else record(name,done,now);
      if(act.dot){
        const retention=Math.max(.2,1-movement*.65);
        for(let tick=1;tick<=act.dot.ticks;tick++)
          pending.push({name,at:now+tick*act.dot.every,
            amount:act.dot.power*multiplier*retention});
      }
      counts[name]=(counts[name]||0)+1;
      cd[name]=now+Math.max(0,(act.cd-
        (name==='Delayed Explosion'&&(stigma[name]||0)>=10?10:0)-
        (name==='Frost'&&has(spec,'Frost',2)?5:0))*(1-cooldownReduction)-
        (name==='Hellfire'&&has(spec,'Hellfire',5)?15:0));
      if(name==='Flame Arrow'||name==='Firestorm'){fireMarkUntil=now+5;mp=Math.min(3000,mp+35)}
       // Expected Fire Mark proc approximation, limited by its internal cooldown.
       // Rank slope is provisional: replace with Global-client damage table when
       // validated before advertising measured damage or a proven best build.
       if(name!=='Wish of Concentration'&&name!=='Element Enhancement'){
         const markRank=effective(build,'Fire Mark')-1;
         if(markRank>0&&now>=fireMarkProcReady){
           damage+=act.power*.20*(.13+.018*markRank)*multiplier;
           fireMarkProcReady=now+1;
         }
       }
      if(name==='Frost'){
        frostUntil=now+3;
        if(has(spec,'Frost',3))reduceCooldown('Frost Burst',10000);
      }
      if(name==="Winter's Shackles"&&has(spec,name,3))pveBuffUntil=now+5;
      if(name==='Firestorm'&&has(spec,name,4)){
        // Global client: Firestorm fires FIVE fireballs; each one that
        // lands reduces Hellfire's cooldown by 2s (up to 10s / cast).
        // This comparative simulator assumes its modeled attack connects
        // with all five. Real misses/resists must be supplied by calibrated
        // encounter evidence; do not falsely score the effect as one hit.
        const modeledLandedFireballs=FIRESTORM_PROJECTILES;
        reduceCooldown('Hellfire',
          firestormHellfireCooldownReduction(modeledLandedFireballs));
      }
      if(name==='Blaze'&&has(spec,name,5))reduceCooldown('Wish of Concentration',3);
      if(name==='Wish of Concentration'){
        wishBuffUptime+=Math.max(0,Math.min(now+10,scenario.duration)-
          Math.max(now,wishBuffUntil));
        wishBuffUntil=now+10;
        if(has(spec,name,4))combatBuffUntil=now+10;
        if(has(spec,name,5)){
          // Only report seconds removed from cooldowns that are actually
          // RUNNING. This reveals wasted early auto-Wish activations.
          for(const [target,endsAt] of Object.entries(cd)){
            if(target===name)continue;
            const removed=Math.min(10,Math.max(0,endsAt-now));
            if(removed<=0)continue;
            wishResetTargets++;wishResetSeconds+=removed;
            reduceCooldown(target,10);
          }
        }
      }
      if(name==='Element Enhancement')
        elementBuffUntil=now+((stigma[name]||0)>=20?20:10);
      if(name==='Delayed Explosion'&&(stigma[name]||0)>=5)
        mp=Math.min(3000,mp+200);
      if(name==='Flame Scattershot')staggerUntil=0;
    };
    for(let step=0;now<scenario.duration&&step<maxSteps;step++){
      // Stagger is an encounter condition, not an unconditional spam ability.
      if(Math.floor(now/40)>Math.floor((now-.5)/40))staggerUntil=now+3;
      let name=null;
      // With the -10s cooldown Specialty, a manually timed Wish belongs
      // AFTER a completed major attack; otherwise the Attack buff can
      // reasonably precede it. Automatic Wish never enters this loop.
      const manualOrder=has(spec,'Wish of Concentration',5)
        ?['Element Enhancement','Delayed Explosion','Divine Burst','Hellfire',
          'Wish of Concentration']
        :['Element Enhancement','Wish of Concentration','Delayed Explosion',
          'Divine Burst','Hellfire'];
      for(const manual of manualOrder){
        if(macroSkills.has(manual))continue;
        if(manual==='Element Enhancement'||manual==='Delayed Explosion'||manual==='Divine Burst'){
          if(!hasStigma(build,manual))continue;
        }else if((build.mastery[manual]||1)===0)continue;
        if(eligible(manual)){name=manual;manualActions++;break}
      }
      if(!name){
        // One in-game keypress selects at most one ready row from that
        // stack. Do not flatten the Q/E/R columns into a fictitious priority
        // queue. Round-robin is an explicit scheduling hypothesis, not proof
        // of exact client order or action-time occupancy.
        let selected=null;
        for(let offset=0;offset<macroStacks.length;offset++){
          const index=(macroCursor+offset)%macroStacks.length;
          const ready=macroStacks[index].skills.find(eligible);
          if(!ready)continue;
          selected=ready;
          macroCursor=(index+1)%macroStacks.length;
          break;
        }
        name=selected||'Flame Arrow';
        if(!selected)unavailable++;
        else now+=macroStepOverhead;
      }
      if(!eligible(name)){name='Flame Arrow';skippedForMp++}
      if(cast(name)===false)break;
      if(name==='Wish of Concentration'&&macroSkills.has(name))wishCastsAuto++;
      if(!Number.isFinite(damage)||!Number.isFinite(now))throw Error('Invalid combat simulation state');
    }
    settle(scenario.duration);
    return {score:damage/scenario.duration,damage,damageBySkill,counts,manualActions,
      manualPerMinute:manualActions*60/scenario.duration,mpFinal:mp,castTime,
      missedGround,skippedForMp,unavailable,combatSpeed,cooldownReduction,damageBoost,
      forcedStopTime,stationaryCastTime,mobileCastTime,
      wishResetSeconds,wishResetTargets,wishCastsAuto,wishBuffUptime,
      incompleteActions,
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
    const movingNightmare=scenarioSet.some(s=>
      String(s.id||'').startsWith('nightmare-')&&(s.movement||0)>.2);
    // Global Hellfire rank 8 offers mutually exclusive +30% Skill Speed
    // (option 1) and Mobile (option 3) in the first and only slot.
    // The old solver forced Mobile immediately, which made charged attacks
    // visibly sluggish. For damage-first moving Nightmares, use speed at
    // one slot and add Mobile once rank 12 opens a second slot.
    // An explicit player-selected Specialty is never overwritten.
    const hellfireRank=effective(build,'Hellfire');
    const availableHellfire=legalOptions('Hellfire',hellfireRank,specData);
    const hellfireSlots=slots(hellfireRank);
    const requireHellfireSpeed=movingNightmare&&!Array.isArray(manual.Hellfire)&&
      availableHellfire.includes(1)&&hellfireSlots>=1;
    const requireHellfireMobile=requireHellfireSpeed&&
      availableHellfire.includes(3)&&hellfireSlots>=2;
    if(requireHellfireSpeed){
      const preferred=[1,...(requireHellfireMobile?[3]:[]),
        ...current.Hellfire].filter((id,i,all)=>
          availableHellfire.includes(id)&&all.indexOf(id)===i);
      current.Hellfire=preferred.slice(0,hellfireSlots);
    }
    let best=evaluate(build,current,scenarioSet);
    for(const name of SPEC_KEYS){
      if(Array.isArray(manual[name]))continue;
      const level=effective(build,name),options=legalOptions(name,level,specData),
        available=combinations(options,slots(level));
      for(const choices of available){
        if(name==='Hellfire'&&requireHellfireSpeed&&
           (!choices.includes(1)||(requireHellfireMobile&&!choices.includes(3))))
          continue;
        const candidate={...current,[name]:choices},estimate=evaluate(build,candidate,scenarioSet);
        if(estimate.robustScore>best.robustScore+1e-9){
          current=candidate;best=estimate;
        }
      }
    }
    return {specialties:current,...best};
  }
  function compareFirePriority(build,specialties,scenarios=ENCOUNTERS){
    const variants={};
    for(const firePriority of ['blaze','firestorm']){
      const candidate={...build,macroLayout:'flow',firePriority};
      const summary=evaluate(candidate,specialties,scenarios);
      variants[firePriority]={
        robustScore:summary.robustScore,modeledDamage:summary.score,
        manualPerMinute:summary.manualPerMinute,
        wishResetSeconds:sum(summary.samples.map(x=>
          x.wishResetSeconds*x.weight))/(sum(summary.samples.map(x=>x.weight))||1)
      };
    }
    // Below 0.5% there is no meaningful relative separation even in
    // this incomplete simulator; prefer the stable conditional Blaze
    // priority instead of thrashing recommendations on tiny fluctuations.
    const switchMargin=.005;
    const selected=variants.firestorm.robustScore>
      variants.blaze.robustScore*(1+switchMargin)?'firestorm':'blaze';
    return {selected,variants,switchMargin,
      evidence:'Uncalibrated Global timing sensitivity, not measured DPS or guaranteed cast order'};
  }
  function compareWishAutomation(build,specialties,scenarios=ENCOUNTERS,
      firePriority='blaze'){
    const result={};
    const weightedMetric=(samples,key)=>sum(samples.map(item=>
      (item[key]||0)*item.weight))/(sum(samples.map(item=>item.weight))||1);
    for(const [policy,autoWish] of [['automatic',true],['timedManual',false]]){
      const sample=evaluate({...build,macroLayout:'flow',autoWish,firePriority},
        specialties,scenarios);
      result[policy]={
        robustScore:sample.robustScore,modeledDamage:sample.score,
        manualPerMinute:sample.manualPerMinute,
        wishResetSeconds:weightedMetric(sample.samples,'wishResetSeconds'),
        wishResetTargets:weightedMetric(sample.samples,'wishResetTargets'),
        wishBuffUptime:weightedMetric(sample.samples,'wishBuffUptime'),
        wishCastsAuto:weightedMetric(sample.samples,'wishCastsAuto'),
        incompleteActions:weightedMetric(sample.samples,'incompleteActions')
      };
    }
    const reset=has(specialties,'Wish of Concentration',5);
    const autoEligible=build.objective==='sustained'&&!reset&&
      result.automatic.robustScore>=result.timedManual.robustScore*.985;
    return {...result,selected:autoEligible?'automatic':'timedManual',
      evidence:'Relative combat model, not observed cooldown logs. A cooldown-reset Wish requires manual timing.'};
  }
  function chooseMacro(build,specialties,scenarios=ENCOUNTERS){
    let winner=null;
    const nightmare=scenarios.some(s=>String(s.id||'').startsWith('nightmare-'));
    const choices=build.macroLayout==='flow'||nightmare?['flow']:
      ['flow','mobile','mobile-extended','compact','balanced','ground'];
    const fireComparison=compareFirePriority(build,specialties,scenarios);
    const wishComparison=compareWishAutomation(build,specialties,scenarios,
      fireComparison.selected);
    // Unlike the old code, the compared Wish policy is actually applied.
    // Preserve the high-value -10s cooldown reset for human timing. With no
    // reset Specialty, sustained mode may auto-buff if it costs less than
    // 1.5% relative modeled throughput (convenience-sensitive threshold).
    const autoWish=wishComparison.selected==='automatic';
    for(const mode of choices){
      const priority=mode==='flow'?fireComparison.selected:'blaze';
      const variantBuild={...build,macroLayout:mode,firePriority:priority,
        autoWish:mode==='flow'&&autoWish};
      const layout=mode==='flow'?flowLayout(variantBuild,specialties):
        ['mobile','mobile-extended'].includes(mode)
          ?mobileLayout(specialties,mode==='mobile-extended')
          :MACRO_LAYOUTS[mode];
      if(mode==='mobile-extended'&&layout.steps.length===1)continue;
      if(!layout.steps.length)continue;
      if(mode==='ground'&&!['Fire Wall','Cold Storm']
        .some(name=>hasStigma(build,name)))continue;
      const data=evaluate(variantBuild,specialties,scenarios);
      const adjusted=data.robustScore*(1-.002*(layout.steps.length-1));
      if(!winner||adjusted>winner.adjusted+1e-8)
        winner={...layout,mode,adjusted,...data,
          firePriority:priority,autoWish:variantBuild.autoWish,
          fireComparison,wishComparison};
    }
    return winner;
  }
  function scoreMastery(build,specData,manualSpecs={},seed=null,
    scenarios=[ENCOUNTERS[0],ENCOUNTERS[1]]){
    return tuneSpecialties(build,specData,manualSpecs,seed,scenarios).robustScore;
  }
  function refineMastery({initial,budget,cost,cap,build,specData,manualSpecs={},
    scenarios=[ENCOUNTERS[0],ENCOUNTERS[1]]}){
    const mastery={...initial},names=CORE.concat(['Robe of Flame','Grace of Enhancement','Fire Mark','Robe of Earth','Absorb Essence','Frost','Frost Burst']);
    const unique=[...new Set(names)].filter(n=>Object.prototype.hasOwnProperty.call(mastery,n));
    let spent=Object.entries(mastery).reduce((v,[name,rank])=>{
      for(let r=2;r<=rank;r++)v+=cost(r);return v;
    },0);
    const score=()=>scoreMastery({...build,mastery},specData,manualSpecs,null,scenarios);
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
    // Spend any remaining affordable points only when the simulated
    // marginal benefit is positive. This preserves zero-overspend while
    // permitting the solver to improve a legacy incomplete recommendation.
    let upgrades=0;
    while(upgrades<20){
      let winner=null;
      for(const name of unique){
        const rank=mastery[name]+1,need=cost(rank);
        if(rank>cap(name)||spent+need>budget)continue;
        mastery[name]=rank;
        const trial=score();
        mastery[name]--;
        if(trial<=best+1e-7)continue;
        const gain=(trial-best)/need;
        if(!winner||gain>winner.gain+1e-10)
          winner={name,need,trial,gain};
      }
      if(!winner)break;
      mastery[winner.name]++;spent+=winner.need;
      best=winner.trial;upgrades++;
    }
    return {levels:mastery,spent,score:best,passes:passes-1,upgrades};
  }
  return Object.freeze({SOURCE,ACTIONS,ENCOUNTERS,legalOptions,slots,effective,
    MACRO_LAYOUTS,NIGHTMARE_ENCOUNTERS,scenariosFor,isMobile,MOBILE_SPECIALTIES,
    CONTINUOUS_OFFENSE,flowLayout,compareFirePriority,compareWishAutomation,
    FIRESTORM_PROJECTILES,firestormHellfireCooldownReduction,
    chooseMacro,simulate,evaluate,tuneSpecialties,refineMastery,scoreMastery});
})();
