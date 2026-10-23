/* AION 2 Global build advice, reviewed 2026-10-22.
   These are progression priorities, NOT exact damage-simulation outputs.
   Sources: https://aion2data.com/guides (global-client-labelled player builds)
            https://metabot.gg/en/aion-2/guides/class-builds-guide
            https://aion2index.com/classes/templar (armory sample)
            https://wikily.gg/aion-2/skills (skill names and breakpoints)
   Game files define hard gates/costs; guide consensus informs preference.
   Source samples are descriptive, not proof of optimality. */
const BUILD_ADVICE={
 gladiator:{
  party:{core:['Overhead Slam','Rending Blow','Ruinous Blow','Keen Strike','Leaping Slam','Crushing Wave'],support:['Experienced Counterstrike','Identify Weakness','Attack Preparation','Murderous Burst'],stigmas:['Lunge Stance',"Zikel's Blessing",'Rage Burst','Focused Block'],stigmaPriority:['Rage Burst',"Zikel's Blessing",'Lunge Stance','Focused Block'],why:'Build the Overhead Slam → Rending Blow damage engine; pair the burst Stigmas with a deliberate block window.'},
  solo:{core:['Overhead Slam','Rending Blow','Ruinous Blow','Keen Strike','Leaping Slam','Crushing Wave'],support:['Blood Absorption','Experienced Counterstrike','Identify Weakness','Attack Preparation'],stigmas:['Lunge Stance',"Zikel's Blessing",'Rage Burst','Lifestealing Blade'],stigmaPriority:['Lifestealing Blade','Rage Burst',"Zikel's Blessing",'Lunge Stance'],why:'Preserve boss damage while including Lifestealing Blade and sustain for solo encounters.'},
  pvp:{core:['Leaping Slam','Rending Blow','Overhead Slam','Keen Strike','Rush Strike','Ankle Slice'],support:['Experienced Counterstrike','Survival Willpower','Blood Absorption','Protection Armor'],stigmas:["Zikel's Blessing",'Focused Block','Lifestealing Blade','Armor of Balance'],stigmaPriority:['Focused Block','Armor of Balance','Lifestealing Blade',"Zikel's Blessing"],why:'Trade some PvE burst uptime for gap closing, blocks and survival; matchup-dependent recommendation.'}
 },
 templar:{
  party:{core:['Judgment','Warding Strike','Vicious Strike','Pummel','Punishment','Shield Smite','Annihilate'],support:['Fury','Insulting Roar','Enhance Health','Impact Hit'],stigmas:['Doom Shield','Noble Armor','Shield of Protection','Taunt'],stigmaPriority:['Noble Armor','Taunt','Shield of Protection','Doom Shield'],stigmaMilestones:[['Shield of Protection',5],['Doom Shield',5],['Taunt',5],['Noble Armor',5],['Noble Armor',15],['Taunt',15],['Taunt',20],['Shield of Protection',10],['Doom Shield',10],['Noble Armor',20],['Shield of Protection',20],['Doom Shield',20]],why:'Run Doom Shield to trigger Judgment, Noble Armor for Fury and party buff uptime, Taunt for its Shrink debuff, and Shield of Protection for reliable block/Fury. In damage-safe overgeared groups, Battlefield Banner can replace block; it is more attractive at high Stigma rank.'},
  solo:{core:['Judgment','Pummel','Punishment','Vicious Strike','Warding Strike','Shield Smite','Annihilate'],support:['Fury','Insulting Roar','Enhance Health','Punishing Benediction'],stigmas:['Doom Shield','Battlefield Banner','Noble Armor',"Empyrean Lord's Punishment"],stigmaPriority:['Doom Shield','Battlefield Banner','Noble Armor',"Empyrean Lord's Punishment"],why:'Favor Judgment and Pummel damage, burst buffs and Doom Shield survival while questing without a party.'},
  pvp:{core:['Punishment','Pummel','Debilitating Smash','Vicious Strike','Judgment','Poach','Warding Strike'],support:['Survival Willpower','Enhance Health','Fury','Block Pain'],stigmas:['Battlefield Banner','Second Skin','Shield of Protection',"Nezekan's Shield"],stigmaPriority:['Second Skin','Shield of Protection',"Nezekan's Shield",'Battlefield Banner'],why:'Favor anti-healing, sustained pressure, block and shields. PvP findings are less certain and some reports are KR-only; check against the Global client.'}
 },
 assassin:{
  party:{core:['Heart Gore','Insignia Explosion','Quick Slice','Savage Roar','Whirlwind Slice','Storm Rampage'],support:['Defense Break','Apply Poison','Ambush Stance','Exploit Weakness'],stigmas:['Illusive Clone','Swift Contract','Savage Fang',"Triniel's Dagger"],stigmaPriority:['Illusive Clone','Swift Contract','Savage Fang',"Triniel's Dagger"],why:'Keep Insignia generation and expenditure timed inside the Clone burst window; stay behind the boss.'},
  solo:{core:['Quick Slice','Heart Gore','Savage Roar','Insignia Explosion','Ambush','Shadowstrike'],support:['Apply Poison','Defense Break','Revitalization Contract','Determination'],stigmas:['Illusive Clone','Swift Contract','Savage Fang','Evasion Contract'],stigmaPriority:['Illusive Clone','Evasion Contract','Swift Contract','Savage Fang'],why:'Retain the burst engine while trading a pure damage Stigma for an evasion safety option.'},
  pvp:{core:['Ambush','Shadowstrike','Quick Slice','Insignia Explosion','Heart Gore','Savage Roar'],support:['Determination','Revitalization Contract','Defense Break','Apply Poison'],stigmas:['Evasion Contract','Smoke Bomb','Swift Contract','Illusive Clone'],stigmaPriority:['Evasion Contract','Smoke Bomb','Swift Contract','Illusive Clone'],why:'Prioritize positional engagement, control/escape and short burst windows rather than static dummy DPS.'}
 },
 ranger:{
  party:{core:['Deadshot','Gale Arrow','Drill Dart','Snipe','Tempest Shot','Burst Arrow'],support:["Hunter's Resolve",'Concentrated Fire','Focused Eye',"Hunter's Soul"],stigmas:["Vaizel's Authority",'Bow of Blessing','Supporting Fire','Griffon Arrow'],stigmaPriority:["Vaizel's Authority",'Bow of Blessing','Supporting Fire','Griffon Arrow'],why:'Build around long-range sustained damage and the Vaizel/Bow buff windows.'},
  solo:{core:['Snipe','Deadshot','Gale Arrow','Drill Dart','Snare Shot','Tempest Shot'],support:["Hunter's Resolve",'Focused Eye','Vigilant Eye','Wind Vigor'],stigmas:["Vaizel's Authority",'Bow of Blessing','Supporting Fire','Explosive Arrow'],stigmaPriority:["Vaizel's Authority",'Bow of Blessing','Explosive Arrow','Supporting Fire'],why:'Keep high-value ranged skills while allowing more mobile and multi-target solo play.'},
  pvp:{core:['Snare Shot','Drill Dart','Gale Arrow','Deadshot','Suppressing Arrow','Snipe'],support:['Wind Vigor','Unyielding Resolve','Vigilant Eye',"Hunter's Soul"],stigmas:["Vaizel's Authority","Mother Nature's Breath",'Ensnaring Trap','Stealth'],stigmaPriority:["Mother Nature's Breath",'Ensnaring Trap','Stealth',"Vaizel's Authority"],why:'Trade some PvE output for range control and movement; situational PvP guide consensus.'}
 },
 sorcerer:{
  party:{core:['Hellfire','Firestorm','Wish of Concentration','Blaze','Flame Arrow',"Winter's Shackles"],support:['Fire Mark','Grace of Enhancement','Absorb Essence','Robe of Flame'],stigmas:['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm'],stigmaPriority:['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm'],why:'Prioritize Hellfire burst, Firestorm and elemental-buff uptime; Delayed Explosion amplifies the damage window.'},
  solo:{core:['Flame Arrow','Hellfire','Firestorm',"Winter's Shackles",'Blaze','Ice Chain'],support:['Absorb Essence','Grace of Enhancement','Robe of Earth','Cold Snap'],stigmas:['Element Enhancement','Delayed Explosion','Steel Barrier','Fire Wall'],stigmaPriority:['Element Enhancement','Steel Barrier','Delayed Explosion','Fire Wall'],why:'Keep ranged fire damage but carry Steel Barrier for mistakes and Nightmare content.'},
  pvp:{core:["Winter's Shackles",'Ice Chain','Hellfire','Flame Arrow','Firestorm','Frost'],support:['Grace of Resistance','Robe of Earth','Cold Snap','Absorb Essence'],stigmas:['Element Enhancement','Steel Barrier','Soul Freeze','Hibernation'],stigmaPriority:['Steel Barrier','Soul Freeze','Hibernation','Element Enhancement'],why:'Movement denial and defensive control matter more than theoretical uninterrupted cast DPS.'}
 },
 spiritmaster:{
  party:{core:['Elemental Fusion','Combustion','Jointstrike: Curse','Summon: Fire Spirit','Summon: Water Spirit','Dimensional Control'],support:['Spirit Communion','Mental Focus','Element Unification','Consecutive Countercurrent'],stigmas:['Summon: Ancient Spirit',"Enhance: Spirit's Benediction",'Jointstrike: Corrode','Flame Blessing'],stigmaPriority:['Summon: Ancient Spirit',"Enhance: Spirit's Benediction",'Jointstrike: Corrode','Flame Blessing'],why:'Cycle spirits through Fusion and Corrode uptime, rather than ranking only raw skill coefficients.'},
  solo:{core:['Elemental Fusion','Combustion','Cold Shock','Summon: Earth Spirit','Summon: Fire Spirit','Jointstrike: Curse'],support:['Spirit Communion','Spirit Protection','Mental Focus','Element Unification'],stigmas:['Summon: Ancient Spirit',"Enhance: Spirit's Benediction",'Jointstrike: Corrode','Siphon'],stigmaPriority:['Summon: Ancient Spirit',"Enhance: Spirit's Benediction",'Siphon','Jointstrike: Corrode'],why:'Lean on consistent pet damage and an added sustain option for long solo fights.'},
  pvp:{core:['Combustion','Elemental Fusion','Jointstrike: Curse','Cold Shock','Dimensional Control','Summon: Earth Spirit'],support:['Spirit Protection','Spirit Revitalization','Mental Focus','Spirit Communion'],stigmas:['Summon: Ancient Spirit',"Enhance: Spirit's Benediction",'Seize Magic','Cry of Terror'],stigmaPriority:['Seize Magic','Cry of Terror','Summon: Ancient Spirit',"Enhance: Spirit's Benediction"],why:'Preserve pet pressure while adding dispel and crowd-control responses.'}
 },
 cleric:{
  party:{core:['Radiant Recovery','Light of Regeneration','Healing Light','Condemnation','Chain of Torment','Divine Aura'],support:['Healing Enhancement',"Earth's Grace",'Prayer of Concentration','Radiant Benediction'],stigmas:['Light of Protection','Noble Aura','Earth Punishment','Summon Resurrection'],stigmaPriority:['Light of Protection','Noble Aura','Summon Resurrection','Earth Punishment'],why:'Protect party uptime with emergency healing, shields and a resurrection option. For a damage-focused group swap Resurrection to Prayer of Amplification.'},
  solo:{core:['Condemnation','Chain of Torment',"Earth's Retribution",'Judgment Thunder','Bolt','Healing Light'],support:['Healing Enhancement',"Earth's Grace",'Prayer of Concentration','Radiant Benediction'],stigmas:['Earth Punishment','Noble Aura','Prayer of Amplification','Light of Protection'],stigmaPriority:['Earth Punishment','Prayer of Amplification','Noble Aura','Light of Protection'],why:'Switch to a damage-healer hybrid for solo questing without removing your defensive fallback.'},
  pvp:{core:['Radiant Recovery','Light of Regeneration','Healing Light','Condemnation','Chain of Torment','Defiance'],support:['Healing Enhancement','Immortal Veil','Survival Willpower',"Earth's Grace"],stigmas:['Salvation','Absolution',"Yustiel's Power",'Light of Protection'],stigmaPriority:['Absolution','Salvation',"Yustiel's Power",'Light of Protection'],why:'Heal through burst and remove control; PvP picks vary by group size and opponent.'}
 },
 chanter:{
  party:{core:['Dark Crush','Spinning Strike','Onslaught','Recuperation','Impactful Crush','Incandescent Blow'],support:['Attack Preparation',"Earth's Promise",'Inspiring Spell','Blessing of Life'],stigmas:['Undefeated Mantra','Power of the Storm','Sprint Mantra',"Marchutan's Wrath"],stigmaPriority:['Undefeated Mantra','Power of the Storm',"Marchutan's Wrath",'Sprint Mantra'],why:'Prioritize melee burst and party damage amplification; use Recuperation when assigned support duties.'},
  solo:{core:['Dark Crush','Spinning Strike','Onslaught','Impactful Crush','Recuperation','Incandescent Blow'],support:['Attack Preparation','Blessing of Life',"Wind's Promise",'Inspiring Spell'],stigmas:['Undefeated Mantra','Sprint Mantra','Power of the Storm',"Marchutan's Wrath"],stigmaPriority:['Undefeated Mantra','Power of the Storm','Sprint Mantra',"Marchutan's Wrath"],why:'Blend damage skills with Recuperation and movement for efficient solo uptime.'},
  pvp:{core:['Recuperation','Dark Crush','Onslaught','Rushing Smash','Impactful Crush','Spinning Strike'],support:['Blessing of Life','Protection Circle',"Wind's Promise",'Survival Willpower'],stigmas:['Undefeated Mantra','Barrier Spell','Healing Touch','Focused Defense'],stigmaPriority:['Barrier Spell','Healing Touch','Focused Defense','Undefeated Mantra'],why:'Move some resources from group damage into timely heals, shields and anti-burst defenses.'}
 }
};
function adviceFor(cls,context){return BUILD_ADVICE[cls]?.[context]||BUILD_ADVICE[cls]?.party||null}

/* Context-specific Specialty choices where the *verified option effect*
   clearly serves different play goals. Other skills retain the baseline
   picks in specialties.json (no unsupported blanket substitutions).
   The keys are effective levels, not purchasable Mastery rank. */
const SPECIALTY_CONTEXT={
 gladiator:{solo:{
  'Keen Strike':{'8':[2],'12':[2,4],'16':[4,5],'20':[2,4,5]}
 }},
 templar:{pvp:{
  'Pummel':{'8':[2],'12':[2,4],'16':[2,4],'20':[2,4,5]},
  'Warding Strike':{'8':[2],'12':[2,4],'16':[4,5],'20':[2,4,5]}
 }},
 assassin:{pvp:{
  'Ambush':{'8':[3],'12':[1,3],'16':[3,5],'20':[1,3,5]}
 }},
 ranger:{pvp:{
  'Gale Arrow':{'8':[2],'12':[2,4],'16':[2,5],'20':[2,4,5]}
 }},
 sorcerer:{pvp:{
  'Firestorm':{'8':[3],'12':[2,3],'16':[2,3],'20':[2,3,4]}
 }},
 spiritmaster:{pvp:{
  'Dimensional Control':{'8':[1],'12':[1,4],'16':[4,5],'20':[1,4,5]}
 }},
 cleric:{party:{
  'Healing Light':{'8':[1],'12':[1,3],'16':[1,3],'20':[1,2,3]}
 },pvp:{
  'Healing Light':{'8':[3],'12':[2,3],'16':[2,3],'20':[2,3,5]}
 }},
 chanter:{party:{
  'Recuperation':{'8':[1],'12':[1,2],'16':[1,2],'20':[1,2,4]}
 },pvp:{
  'Recuperation':{'8':[1],'12':[1,2],'16':[1,2],'20':[1,2,5]}
 }}
};
function adviceSpecialtyChoices(cls,context,name,effective,options){
 const breakKey=effective>=20?'20':effective>=16?'16':effective>=12?'12':effective>=8?'8':null;
 if(!breakKey)return null;
 const preferred=SPECIALTY_CONTEXT[cls]?.[context]?.[name]?.[breakKey];
 if(!preferred)return null;
 const count=effective>=20?3:effective>=12?2:1;
 const eligible=n=>options?.[n]&&effective>=(n<=3?8:n===4?12:16);
 if(preferred.length>count||preferred.some(n=>!eligible(n)))return null;
 return preferred;
}
