'use strict';
/**
 * Global PvE class-synergy evaluator.
 * Mechanics come from dated Global-client guides and the imported in-game
 * node/stigma datasets. Numeric utility coefficients are comparative
 * hypotheses, NOT measured DPS/HPS or authoritative server formulas.
 *
 * Deliberately keep the model inspectable, deterministic and free of remote
 * runtime dependencies; community adoption is prior evidence, not proof.
 */
const ClassCombatModels=(()=>{
 const VERSION='global-2026-10-21-research-2026-10-27';
 const profiles={
  gladiator:{
   offense:['Overhead Slam','Rending Blow','Ruinous Blow','Keen Strike','Leaping Slam','Sword Aura Rampage'],
   defense:['Blood Absorption','Protection Armor','Survival Stance','Survival Willpower','Experienced Counterstrike'],
   support:['Experienced Counterstrike','Murderous Burst','Identify Weakness'],
   milestones:{'Overhead Slam':[12,16,20],'Rending Blow':[16],'Lunge Stance':[20]},
   burstBuffs:['Rage Burst',"Zikel's Blessing"],
   survivalStigmas:['Focused Block','Lifestealing Blade','Wave Armor','Lunge Stance'],
   damageStigmas:['Lunge Stance',"Zikel's Blessing",'Rage Burst','Focused Block'],
   evidence:'https://aion2data.com/guides/gladiator/pve',
   mechanics:'Overhead Slam 16 cooldown removal; Rending Blow 16 MP; Lunge Stance 20 crit-triggered cooldown changes'
  },
  templar:{
   offense:['Judgment','Warding Strike','Vicious Strike','Pummel','Punishment','Shield Smite','Annihilate'],
   defense:['Enhance Health','Warding Shield','Ironclad Defense','Guarding Seal','Block Pain','Survival Willpower'],
   support:['Fury','Insulting Roar','Impact Hit','Warding Strike'],
   milestones:{Judgment:[12,16,20],'Warding Strike':[16],Pummel:[12],Taunt:[5,15]},
   burstBuffs:['Noble Armor','Battlefield Banner'],
   survivalStigmas:['Doom Shield','Shield of Protection','Noble Armor','Taunt'],
   damageStigmas:['Doom Shield','Battlefield Banner','Noble Armor',"Empyrean Lord's Punishment"],
   evidence:'https://aion2data.com/guides/templar/pve',
   mechanics:'Judgment 16 cooldown removal following triggers; Warding Strike 16 party tolerance; Taunt Shrink debuff'
  },
  assassin:{
   offense:['Heart Gore','Quick Slice','Insignia Explosion','Savage Roar','Storm Rampage','Whirlwind Slice'],
   defense:['Revitalization Contract','Determination','Heightened Sixth Sense','Assault Stance'],
   support:['Defense Break','Apply Poison','Exploit Weakness'],
   milestones:{'Heart Gore':[12,16],'Quick Slice':[12,16],'Insignia Explosion':[16],'Illusive Clone':[20]},
   burstBuffs:['Illusive Clone','Swift Contract',"Triniel's Dagger"],
   survivalStigmas:['Evasion Contract','Evasion Stance','Illusive Clone','Swift Contract'],
   damageStigmas:['Illusive Clone','Swift Contract','Savage Fang',"Triniel's Dagger"],
   evidence:'https://aion2data.com/guides/assassin/pve',
   mechanics:'Heart Gore 16 crit resets; Quick Slice 12 Explosion cooldown; Clone and Swift Contract timing; positional back attacks'
  },
  ranger:{
   offense:['Deadshot','Gale Arrow','Snipe','Tempest Shot','Drill Dart','Burst Arrow'],
   defense:['Vigilant Eye','Wind Vigor','Unyielding Resolve','Revitalization Contract'],
   support:['Focused Eye',"Hunter's Resolve","Hunter's Soul",'Concentrated Fire'],
   milestones:{Deadshot:[16],Snipe:[12,16],'Gale Arrow':[16],"Vaizel's Authority":[20]},
   burstBuffs:["Vaizel's Authority",'Bow of Blessing'],
   survivalStigmas:["Mother Nature's Breath",'Bow of Blessing',"Vaizel's Authority",'Supporting Fire'],
   damageStigmas:["Vaizel's Authority",'Bow of Blessing','Supporting Fire','Griffon Arrow'],
   evidence:'https://aion2data.com/guides/ranger/pve',
   mechanics:'Deadshot full charge manual; Snipe cooldown reduction; Gale Arrow 16 cooldown; Vaizel 20 crit-based reductions'
  },
  spiritmaster:{
   offense:['Elemental Fusion','Combustion','Summon: Fire Spirit','Summon: Water Spirit','Summon: Earth Spirit','Dimensional Control','Jointstrike: Curse','Cold Shock'],
   defense:['Spirit Protection','Spirit Revitalization','Spirit Communion','Revitalization Contract'],
   support:['Spirit Strike','Mental Focus','Element Unification','Consecutive Countercurrent'],
   milestones:{'Elemental Fusion':[16,20],Combustion:[16,20],'Summon: Fire Spirit':[16],'Summon: Water Spirit':[16],'Summon: Earth Spirit':[16],'Summon: Wind Spirit':[16]},
   burstBuffs:['Summon: Ancient Spirit',"Enhance: Spirit's Benediction",'Jointstrike: Corrode'],
   survivalStigmas:['Summon: Ancient Spirit',"Enhance: Spirit's Benediction",'Siphon','Jointstrike: Corrode'],
   damageStigmas:['Summon: Ancient Spirit',"Enhance: Spirit's Benediction",'Jointstrike: Corrode','Flame Blessing'],
   evidence:'https://aion2data.com/guides/spiritmaster/pve-spirit-cycle',
   mechanics:'Four Elements stacks from spirit cycling; Fusion payoff; three-versus-four summon strategy uncertain'
  },
  cleric:{
   offense:['Condemnation','Judgment Thunder','Chain of Torment','Debilitating Mark','Bolt',"Earth's Retribution"],
   defense:['Healing Light','Radiant Recovery','Light of Regeneration','Healing Enhancement',"Earth's Grace",'Radiant Benediction'],
   support:['Divine Aura','Prayer of Concentration','Healing Enhancement','Light of Regeneration'],
   milestones:{Condemnation:[12,16,20],'Judgment Thunder':[16],'Chain of Torment':[12],"Earth's Retribution":[12]},
   burstBuffs:['Earth Punishment','Prayer of Amplification','Noble Aura'],
   survivalStigmas:['Light of Protection','Summon Resurrection','Noble Aura','Earth Punishment'],
   damageStigmas:['Earth Punishment','Prayer of Amplification','Noble Aura','Light of Protection'],
   evidence:'https://aion2data.com/guides/cleric/pve-condemnation',
   mechanics:'Condemnation 12 crit cooldown reset; Judgment Thunder 16 repeat hit; manual effective healing'
  },
  chanter:{
   offense:['Dark Crush','Spinning Strike','Onslaught','Impactful Crush','Incandescent Blow','Gust Rampage'],
   defense:['Recuperation','Blessing of Life','Protection Circle','Crossguard','Survival Willpower'],
   support:['Inspiring Spell',"Earth's Promise",'Attack Preparation','Recuperation'],
   milestones:{'Dark Crush':[8,16,20],'Spinning Strike':[16],'Onslaught':[16]},
   burstBuffs:['Undefeated Mantra','Power of the Storm',"Marchutan's Wrath"],
   survivalStigmas:['Undefeated Mantra','Sprint Mantra','Healing Touch','Focused Defense'],
   damageStigmas:['Undefeated Mantra','Power of the Storm',"Marchutan's Wrath",'Sprint Mantra'],
   evidence:'https://aion2data.com/guides/chanter/pve',
   mechanics:'Dark Crush trigger gating and 16 cooldown removal; mantras support party; Recuperation heal timing'
  }
 };
 const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number(n)||0));
 const average=(xs)=>xs.length?xs.reduce((s,n)=>s+n,0)/xs.length:0;
 const uniq=(a)=>[...new Set(a)];
 function profile(cls){return profiles[cls]||null}
 function advice(cls,context,objective,base){
   const p=profile(cls);
   if(!p||!base||context==='pvp'||!objective||objective==='performance')return base;
   const survival=objective==='survivability';
   const core=survival?uniq([...p.defense.slice(0,3),...p.offense.slice(0,4)]):
     objective==='burst'?uniq([...p.offense.slice(0,3),...p.offense.slice(3,6)]):
       uniq([...p.offense.slice(0,6)]);
   const support=survival?uniq([...p.defense,...p.support]).slice(0,6):
     uniq([...p.support,...p.defense.slice(0,2)]).slice(0,6);
   const stigmas=survival?p.survivalStigmas:p.damageStigmas;
   return {...base,core,support,stigmas:[...stigmas],
     stigmaPriority:survival?[...stigmas]:[...stigmas],
     stigmaMilestones:undefined,
     why:`${base.why} Research-informed ${objective} objective: ${p.mechanics}. The solver uses comparative mechanics and does not establish measured optimum.`};
 }
 function evaluate({classId,context,objective,build,selectedSpecs={}}){
   const p=profile(classId);if(!p)throw Error('Unsupported class combat model: '+classId);
   const ranks=build.mastery||{},board=build.boardSkills||{},gear=build.gearSkills||{},
     stamina=build.boardStats||{},equipStats=build.gearStats||{};
   const rank=name=>clamp((ranks[name]||1)+(board[name]||0)+(gear[name]||0),1,40);
   const stigma=name=>(build.equippedStigmas||[]).includes(name)?clamp(build.stigma?.[name],0,20):0;
   const hasOption=(name,id)=>{
     const entry=typeof SPECS==='undefined'?null:SPECS[classId]?.[name];
     const level=rank(name);
     if(!entry||level<(id<=3?8:id===4?12:16))return false;
     const breakpoint=level>=20?'20':level>=16?'16':level>=12?'12':'8';
     const chosen=Array.isArray(selectedSpecs[name])
       ?selectedSpecs[name]:(entry.picks?.[breakpoint]||[]);
     const slots=level>=20?3:level>=12?2:1;
     return chosen.slice(0,slots).includes(id);
   };
   const effect=name=>rank(name)-1;
   const gate=(name,level)=>rank(name)>=level?1:0;
   const stat=(name)=>Math.max(0,(Number(stamina[name])||0)+(Number(equipStats[name])||0));
   const crit=clamp(stat('Critical')/10000,0,.50); // only known added crit; no invented baseline
   const speed=clamp(stat('CombatSpeed')/10000,0,.70);
   const haste=clamp(stat('CoolTimeDecrease')/10000,0,.60);
   const boost=clamp(stat('AmplifyAllDamage')/10000,0,2);
   const defense=clamp(stat('DecreaseDamage')/10000,0,.70);
   const active=average(p.offense.map((name,i)=> (1+.035*effect(name))*(1.15-i*.065)));
   const supportRanks=average(p.support.map(name=>1+.028*effect(name)));
   const survivalRanks=average(p.defense.map(name=>1+.04*effect(name)));
   let sustained=active*(1+boost)*(1+.65*crit)*(1+.55*speed)*(1+.45*haste),
       burst=active*(1+boost)*(1+.75*crit)*(1+.12*speed),
       survival=(1+.15*survivalRanks)*(1+defense)*(1+Math.min(1,stat('HPMax')/6000))*
         (1+Math.min(.4,stat('Defense')/12000)),
       party=0,uptime=1;
   let mechanics=[];
   const add=(condition,multiplier,kind,note)=>{
     if(!condition)return;
     if(kind==='burst')burst*=multiplier;
     else if(kind==='survival')survival*=multiplier;
     else if(kind==='party')party+=multiplier-1;
     else if(kind==='uptime')uptime*=multiplier;
     else {sustained*=multiplier;burst*=1+(multiplier-1)*.45}
     mechanics.push(note);
   };
   switch(classId){
    case 'gladiator':
     add(gate('Overhead Slam',16)&&hasOption('Overhead Slam',5),1.72,'sustained','Overhead Slam cooldown removal');
     add(gate('Rending Blow',16)&&hasOption('Rending Blow',5),1.13,'uptime','Rending Blow critical MP return');
     add(stigma('Lunge Stance')>=20,1.28,'sustained','Lunge Stance cooldown proc hypothesis');
     add(stigma("Zikel's Blessing")>=10,1.13,'burst','Zikel PvE buff');
     add(stigma('Focused Block')>=5,1.22,'survival','Focused Block consecutive use');
     add(gate('Overhead Slam',12)&&hasOption('Overhead Slam',4),1.08,'sustained','Overhead Slam guaranteed critical Specialty');
     break;
    case 'templar':
     add(gate('Judgment',16)&&hasOption('Judgment',5),1.78,'sustained','Judgment triggered cooldown removal');
     add(gate('Warding Strike',16)&&hasOption('Warding Strike',5),1.18,'survival','Warding Strike tolerance window');
     add(gate('Warding Strike',16)&&hasOption('Warding Strike',5)&&context==='party',1.2,'party','Warding Strike group mitigation');
     add(stigma('Taunt')>=5&&context==='party',1.13,'party','Taunt Shrink resistance reduction');
     add(stigma('Shield of Protection')>=5,1.25,'survival','Shield of Protection block window');
     add(stigma('Doom Shield')>=5,1.10,'sustained','Doom Shield Judgment trigger');
     add(gate('Pummel',12)&&hasOption('Pummel',4),1.06,'sustained','Pummel Punishment cooldown synergy');
     break;
    case 'assassin':
     add(gate('Quick Slice',12)&&hasOption('Quick Slice',4),1.16,'sustained','Quick Slice Insignia cooldown loop');
     add(gate('Insignia Explosion',16)&&hasOption('Insignia Explosion',5),1.22,'sustained','Insignia Explosion cooldown Specialty');
     add(gate('Heart Gore',16)&&hasOption('Heart Gore',5),1.24,'sustained','Heart Gore critical reset');
     add(stigma('Illusive Clone')>=5,1.25,'burst','Illusive Clone damage window');
     add(stigma('Illusive Clone')>=20,1.18,'burst','Illusive Clone capstone');
     add(stigma('Swift Contract')>=5,1.12,'burst','Swift Contract burst synchronization');
     add(stigma('Evasion Contract')>=5||stigma('Evasion Stance')>=5,1.20,'survival','Assassin defensive Evasion Stigma');
     break;
    case 'ranger':
     add(gate('Deadshot',8)&&hasOption('Deadshot',2),1.13,'burst','Deadshot skill-speed and manual full charge');
     add(gate('Deadshot',12)&&hasOption('Deadshot',4),1.08,'burst','Deadshot multi-hit Specialty');
     add(gate('Snipe',12)&&hasOption('Snipe',4),1.19,'sustained','Snipe Deadshot cooldown interaction');
     add(gate('Gale Arrow',16)&&hasOption('Gale Arrow',5),1.16,'sustained','Gale Arrow buff uptime');
     add(stigma("Vaizel's Authority")>=20,1.31,'sustained','Vaizel critical-hit cooldown return');
     add(stigma('Bow of Blessing')>=15,1.12,'burst','Bow of Blessing critical damage');
     add(stigma("Mother Nature's Breath")>=5,1.16,'survival','Ranger self recovery');
     break;
    case 'spiritmaster':{
     const spirits=['Summon: Fire Spirit','Summon: Water Spirit','Summon: Earth Spirit','Summon: Wind Spirit']
       .filter(name=>rank(name)>=8).length;
     add(gate('Elemental Fusion',20),1.08,'sustained','Fusion third Specialty slot');
     add(hasOption('Elemental Fusion',5),1.17,'sustained','Fusion refund on Four Elements');
     add(gate('Combustion',20)&&hasOption('Combustion',5),1.15,'sustained','Combustion rank 20');
     add(spirits>=3,1.18,'sustained','Spirit cycling elemental generation');
     add(spirits>=4,1.06,'uptime','Four-spirit variant; evidence contested');
     add(stigma('Summon: Ancient Spirit')>=15,1.20,'burst','Ancient Spirit burst');
     add(stigma('Summon: Ancient Spirit')>=20,1.13,'sustained','Ancient Spirit level 20 bonus');
     add(stigma("Enhance: Spirit's Benediction")>=15,1.13,'sustained','Spirit Benediction');
     add(stigma('Siphon')>=5,1.18,'survival','Siphon sustain');
     break;
    }
    case 'cleric':
     add(gate('Condemnation',12)&&hasOption('Condemnation',4),1.65,'sustained','Condemnation critical reset');
     add(gate('Judgment Thunder',16)&&hasOption('Judgment Thunder',5),1.20,'burst','Judgment Thunder guaranteed critical hit');
     add(gate('Chain of Torment',12)&&hasOption('Chain of Torment',4)&&context==='party',1.13,'party','Chain of Torment party debuff');
     add(gate("Earth's Retribution",12)&&hasOption("Earth's Retribution",4),1.12,'sustained','Discharge reduces Bolt cooldown');
     add(stigma('Earth Punishment')>=5,1.18,'sustained','Earth Punishment synergy');
     add(stigma('Light of Protection')>=5,1.22,'survival','Light of Protection shield');
     add(stigma('Summon Resurrection')>=5,1.10,'survival','Resurrection safety utility');
     add(gate('Light of Regeneration',16),1.16,'survival','Healing over time damage tolerance');
     break;
    case 'chanter':{
     const trigger=(gate('Spinning Strike',8)?1:0)+(gate('Impactful Crush',8)?1:0)+(stigma("Marchutan's Wrath")>0?1:0);
     add(gate('Dark Crush',16)&&hasOption('Dark Crush',5)&&trigger>0,1.75,'sustained','Triggered Dark Crush cooldown removal');
     add(gate('Onslaught',12)&&hasOption('Onslaught',4),1.13,'uptime','Onslaught spinning cooldown support');
     add(stigma('Undefeated Mantra')>=5,1.23,'party','Undefeated Mantra group buff');
     add(stigma('Power of the Storm')>=5,1.12,'sustained','Power of the Storm attack window');
     add(stigma('Sprint Mantra')>=5,1.09,'uptime','Sprint Mantra movement uptime');
     add(gate('Recuperation',12),1.17,'survival','Recuperation healing and cleanse');
     break;
    }
   }
   // Model scenario-dependent uptime, not an unexplained overall DPS rank.
   sustained*=uptime;burst*=Math.sqrt(uptime);
   const mobilePenalty=classId==='assassin'?.14:classId==='ranger'?.08:classId==='cleric'?.13:.10;
   const mobility=1-mobilePenalty/(1+.2*speed+Math.max(0,stigma('Sprint Mantra'))*.01);
   sustained*=mobility;
   if(context==='party')party+=(supportRanks-1)*.35;
   else survival*=1.07;
   const performance=context==='party'
      ? .44*sustained+.25*burst+.19*survival+.12*(1+party)
      : .40*sustained+.24*burst+.27*survival+.09*uptime;
   const objectiveScore=objective==='burst'?burst:
      objective==='sustained'?sustained:
      objective==='survivability'?survival+.08*sustained:
      performance;
   return {score:objectiveScore,sustained,burst,survival,party,uptime,mobility,mechanics,
      classification:'comparative scenario model; not measured Global DPS or HPS',
      provenance:{version:VERSION,source:p.evidence,assumptions:'rank slopes, encounter uptime and relative utility are uncalibrated'}};
 }
 return Object.freeze({VERSION,profile,advice,evaluate,profiles});
})();
