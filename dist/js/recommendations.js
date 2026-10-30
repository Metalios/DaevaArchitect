// Global PvP scenarios: four actual build contexts, not four UI aliases.
const PVP_CONTEXT_LABELS=Object.freeze({pvp:'General PvP','pvp-arena':'Arena PvP','pvp-abyss-solo':'Solo PvP (Abyss)','pvp-abyss-group':'Group PvP (Abyss)'});
function isPvpContext(mode){return Object.prototype.hasOwnProperty.call(PVP_CONTEXT_LABELS,mode)}
const PVP_CONTEXT_SOURCES=Object.freeze(['https://metabot.gg/en/aion-2/guides/arena-pvp-guide','https://aion2maps.com/guides/pvp/','https://aion2data.com/guides','https://aion2.gg/tier-list/pvp-group']);
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
// Variants are research-informed Global skill-kit hypotheses, not measured win rates.
const PVP_VARIANTS={
 "gladiator": {
  "pvp-arena": {
   "stigmas": [
    "Tenaciousness",
    "Forced Restraint",
    "Focused Block",
    "Zikel's Blessing"
   ],
   "lead": [
    "Rush Strike",
    "Ankle Slice",
    "Leaping Slam"
   ],
   "supportLead": [
    "Survival Willpower",
    "Experienced Counterstrike"
   ],
   "why": "Arena of Solitude (1v1): bait Defiance, land Seal or gap-close control, use Tenaciousness through enemy burst and preserve a mobile Parry window. Gear and opponent matchup matter."
  },
  "pvp-abyss-solo": {
   "stigmas": [
    "Tenaciousness",
    "Fracturing Rush",
    "Lifestealing Blade",
    "Focused Block"
   ],
   "lead": [
    "Rush Strike",
    "Leaping Slam",
    "Ankle Slice"
   ],
   "supportLead": [
    "Blood Absorption",
    "Survival Willpower"
   ],
   "why": "Solo Abyss: mobility, an escape route, a controlled engage and recovery after skirmishes matter more than stationary peak damage."
  },
  "pvp-abyss-group": {
   "stigmas": [
    "Wrath Wave",
    "Tenaciousness",
    "Fracturing Rush",
    "Armor of Balance"
   ],
   "lead": [
    "Leaping Slam",
    "Rending Blow",
    "Overhead Slam"
   ],
   "supportLead": [
    "Survival Willpower",
    "Protection Armor"
   ],
   "why": "Group Abyss: bring area knockdowns, approach control and frontline damage tolerance. Coordinate CC around opposing Defiance rather than spending every control together."
  }
 },
 "templar": {
  "pvp-arena": {
   "stigmas": [
    "Grapple",
    "Doom Shield",
    "Second Skin",
    "Shield of Protection"
   ],
   "lead": [
    "Poach",
    "Debilitating Smash",
    "Judgment",
    "Pummel"
   ],
   "supportLead": [
    "Survival Willpower",
    "Block Pain"
   ],
   "why": "Arena of Solitude (1v1): pull/root, threaten Judgment through Doom Shield, maintain mobile guaranteed Block and survive the opponent's burst. Taunt PvE tolerance does not apply as a full PvP modifier."
  },
  "pvp-abyss-solo": {
   "stigmas": [
    "Doom Shield",
    "Grapple",
    "Shield of Protection",
    "Second Skin"
   ],
   "lead": [
    "Poach",
    "Judgment",
    "Punishment",
    "Pummel"
   ],
   "supportLead": [
    "Survival Willpower",
    "Enhance Health"
   ],
   "why": "Solo Abyss: pick fights with gap closure and Grapple, keep guaranteed Block mobile and retain a defensive disengage option."
  },
  "pvp-abyss-group": {
   "stigmas": [
    "Grapple",
    "Nezekan's Shield",
    "Comrade in Arms",
    "Second Skin"
   ],
   "lead": [
    "Warding Strike",
    "Poach",
    "Judgment",
    "Shield Rush"
   ],
   "supportLead": [
    "Block Pain",
    "Guarding Seal",
    "Survival Willpower"
   ],
   "why": "Group Abyss: pull and root priority targets, protect nearby allies with Nezekan's Shield, absorb focused damage with Comrade in Arms and hold the front line."
  }
 },
 "assassin": {
  "pvp-arena": {
   "stigmas": [
    "Illusive Clone",
    "Evasion Contract",
    "Smoke Bomb",
    "Shadowstep"
   ],
   "lead": [
    "Ambush",
    "Shadowstrike",
    "Heart Gore",
    "Insignia Explosion"
   ],
   "supportLead": [
    "Determination",
    "Revitalization Contract"
   ],
   "why": "Arena of Solitude (1v1): stage a controlled opener, force Defiance or a defensive cooldown, then synchronize Clone burst; reserve evasion and blind for retaliation."
  },
  "pvp-abyss-solo": {
   "stigmas": [
    "Shadow Walk",
    "Illusive Clone",
    "Evasion Contract",
    "Shadowstep"
   ],
   "lead": [
    "Ambush",
    "Shadowstrike",
    "Quick Slice"
   ],
   "supportLead": [
    "Revitalization Contract",
    "Determination"
   ],
   "why": "Solo Abyss: approach from stealth, isolate one target, burst and preserve repositioning or an exit. Shadow Walk's in-combat use requires its level-15 perk."
  },
  "pvp-abyss-group": {
   "stigmas": [
    "Assault Ambush",
    "Smoke Bomb",
    "Triniel's Dagger",
    "Evasion Stance"
   ],
   "lead": [
    "Shadowstrike",
    "Ambush",
    "Insignia Explosion"
   ],
   "supportLead": [
    "Determination",
    "Revitalization Contract"
   ],
   "why": "Group Abyss: flank rather than brawl at the frontline, pressure vulnerable backliners, blind clustered opponents and keep Evasion Stance for area retaliation."
  }
 },
 "ranger": {
  "pvp-arena": {
   "stigmas": [
    "Sealing Arrow",
    "Ensnaring Trap",
    "Mother Nature's Breath",
    "Bow of Blessing"
   ],
   "lead": [
    "Snare Shot",
    "Suppressing Arrow",
    "Gale Arrow",
    "Deadshot"
   ],
   "supportLead": [
    "Wind Vigor",
    "Unyielding Resolve"
   ],
   "why": "Arena of Solitude (1v1): force distance with Seal, trap and slows; time Bow burst around an opponent's CC break and preserve Mother Nature's Breath against counterpressure."
  },
  "pvp-abyss-solo": {
   "stigmas": [
    "Stealth",
    "Sealing Arrow",
    "Mother Nature's Breath",
    "Explosive Arrow"
   ],
   "lead": [
    "Snipe",
    "Snare Shot",
    "Deadshot"
   ],
   "supportLead": [
    "Wind Vigor",
    "Vigilant Eye"
   ],
   "why": "Solo Abyss: scout from stealth, strike at range, root/Seal pursuers and keep a defensive escape window. Stealth cannot be used in combat without its level-15 perk."
  },
  "pvp-abyss-group": {
   "stigmas": [
    "Arrow Storm",
    "Sealing Arrow",
    "Vaizel's Authority",
    "Mother Nature's Breath"
   ],
   "lead": [
    "Suppressing Arrow",
    "Gale Arrow",
    "Deadshot",
    "Tempest Shot"
   ],
   "supportLead": [
    "Wind Vigor",
    "Unyielding Resolve"
   ],
   "why": "Group Abyss: ranged area stun and Seal pressure can disrupt clustered threats; maintain distance and coordinate control with party focus targets."
  }
 },
 "sorcerer": {
  "pvp-arena": {
   "stigmas": [
    "Curse: Tree",
    "Hibernation",
    "Steel Barrier",
    "Soul Freeze"
   ],
   "lead": [
    "Winter's Shackles",
    "Frost",
    "Hellfire",
    "Ice Chain"
   ],
   "supportLead": [
    "Grace of Resistance",
    "Robe of Earth",
    "Cold Snap"
   ],
   "why": "Arena of Solitude (1v1): protect the opening with Steel Barrier, force Defiance, then create a safe cast window through polymorph/Seal; Hibernation is a manual emergency reset."
  },
  "pvp-abyss-solo": {
   "stigmas": [
    "Hibernation",
    "Steel Barrier",
    "Curse: Tree",
    "Element Enhancement"
   ],
   "lead": [
    "Ice Chain",
    "Winter's Shackles",
    "Firestorm",
    "Hellfire"
   ],
   "supportLead": [
    "Grace of Resistance",
    "Robe of Earth"
   ],
   "why": "Solo Abyss: survive unexpected engagements with Barrier and Hibernation; retreat through slows/polymorph before committing to stationary spell bursts."
  },
  "pvp-abyss-group": {
   "stigmas": [
    "Lumiel's Space",
    "Steel Barrier",
    "Soul Freeze",
    "Fire Wall"
   ],
   "lead": [
    "Firestorm",
    "Winter's Shackles",
    "Frost",
    "Hellfire"
   ],
   "supportLead": [
    "Grace of Resistance",
    "Cold Snap"
   ],
   "why": "Group Abyss: aim area Airborne and ground effects at clustered opponents, use Seal for priority targets and cast from allied protection."
  }
 },
 "spiritmaster": {
  "pvp-arena": {
   "stigmas": [
    "Magic Block",
    "Cry of Terror",
    "Command: Proxy",
    "Siphon"
   ],
   "lead": [
    "Cold Shock",
    "Combustion",
    "Elemental Fusion"
   ],
   "supportLead": [
    "Spirit Protection",
    "Spirit Revitalization"
   ],
   "why": "Arena of Solitude (1v1): pressure through spirits, stagger Seal/Fear rather than stacking both into Defiance, use Proxy defensively and sustain through Siphon."
  },
  "pvp-abyss-solo": {
   "stigmas": [
    "Siphon",
    "Command: Proxy",
    "Cry of Terror",
    "Magic Block"
   ],
   "lead": [
    "Cold Shock",
    "Jointstrike: Curse",
    "Combustion"
   ],
   "supportLead": [
    "Spirit Protection",
    "Spirit Revitalization"
   ],
   "why": "Solo Abyss: maintain a defensive spirit for Proxy, use sustain/MP return and disengage behind Fear or Seal when outnumbered."
  },
  "pvp-abyss-group": {
   "stigmas": [
    "Cry of Terror",
    "Seize Magic",
    "Kaisinel's Power",
    "Magic Block"
   ],
   "lead": [
    "Dimensional Control",
    "Jointstrike: Curse",
    "Combustion"
   ],
   "supportLead": [
    "Spirit Protection",
    "Mental Focus"
   ],
   "why": "Group Abyss: area Fear, multi-target buff removal and accurate control help the team win coordinated engagements more than isolated pet burst."
  }
 },
 "cleric": {
  "pvp-arena": {
   "stigmas": [
    "Salvation",
    "Absolution",
    "Root",
    "Light of Protection"
   ],
   "lead": [
    "Healing Light",
    "Radiant Recovery",
    "Condemnation"
   ],
   "supportLead": [
    "Survival Willpower",
    "Healing Enhancement",
    "Immortal Veil"
   ],
   "why": "Arena of Solitude (1v1): survive burst and control through Salvation/Absolution, Root to create space and maintain protection; this is a survival/attrition plan, not a fast-kill claim."
  },
  "pvp-abyss-solo": {
   "stigmas": [
    "Salvation",
    "Absolution",
    "Root",
    "Yustiel's Power"
   ],
   "lead": [
    "Healing Light",
    "Condemnation",
    "Radiant Recovery"
   ],
   "supportLead": [
    "Survival Willpower",
    "Healing Enhancement"
   ],
   "why": "Solo Abyss: defensive cooldowns and cleansing keep an escape route; short Root windows create room to reposition rather than chase kills."
  },
  "pvp-abyss-group": {
   "stigmas": [
    "Absolution",
    "Salvation",
    "Yustiel's Power",
    "Light of Protection"
   ],
   "lead": [
    "Radiant Recovery",
    "Light of Regeneration",
    "Healing Light",
    "Defiance"
   ],
   "supportLead": [
    "Healing Enhancement",
    "Immortal Veil",
    "Survival Willpower"
   ],
   "why": "Group Abyss: protect allied uptime with manual burst heals, cleanse, party PvP damage tolerance and an emergency invulnerability save."
  }
 },
 "chanter": {
  "pvp-arena": {
   "stigmas": [
    "Focused Defense",
    "Ensnaring Mark",
    "Barrier Spell",
    "Power of the Storm"
   ],
   "lead": [
    "Dark Crush",
    "Rushing Smash",
    "Spinning Strike"
   ],
   "supportLead": [
    "Blessing of Life",
    "Survival Willpower",
    "Protection Circle"
   ],
   "why": "Arena of Solitude (1v1): create Dark Crush windows through Seal, block mobile at level 10 and reserve Barrier Spell for counter-burst."
  },
  "pvp-abyss-solo": {
   "stigmas": [
    "Sprint Mantra",
    "Focused Defense",
    "Ensnaring Mark",
    "Healing Touch"
   ],
   "lead": [
    "Rushing Smash",
    "Dark Crush",
    "Onslaught"
   ],
   "supportLead": [
    "Blessing of Life",
    "Survival Willpower"
   ],
   "why": "Solo Abyss: mobility, mobile Block and manual self-heals extend skirmish safety; use Seal to disengage when a second enemy joins."
  },
  "pvp-abyss-group": {
   "stigmas": [
    "Undefeated Mantra",
    "Barrier Spell",
    "Healing Touch",
    "Guardian Blessing"
   ],
   "lead": [
    "Recuperation",
    "Dark Crush",
    "Rushing Smash"
   ],
   "supportLead": [
    "Inspiring Spell",
    "Blessing of Life",
    "Protection Circle"
   ],
   "why": "Group Abyss: party PvP mitigation/damage aura, no-death window, group healing and defensive sustain are more useful than a selfish duel package."
  }
 }
};
function adviceFor(cls,context,objective='performance'){
 if(isPvpContext(context)){
   const original=BUILD_ADVICE[cls]?.pvp||null;
   const preset=PVP_VARIANTS[cls]?.[context];
   if(!original||!preset)return original;
   const distinct=items=>[...new Set(items)];
   return {...original,core:distinct([...(preset.lead||[]),...original.core]).slice(0,8),
     support:distinct([...(preset.supportLead||[]),...original.support]).slice(0,7),
     stigmas:[...preset.stigmas],stigmaPriority:[...preset.stigmas],
     why:preset.why,researchSources:PVP_CONTEXT_SOURCES,buildContext:context};
 }
 const base=BUILD_ADVICE[cls]?.[context]||BUILD_ADVICE[cls]?.party||null;
 return typeof ClassCombatModels!=='undefined'
   ?ClassCombatModels.advice(cls,context,objective,base):base;
}

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
 const preferred=SPECIALTY_CONTEXT[cls]?.[context]?.[name]?.[breakKey]||
   (isPvpContext(context)?SPECIALTY_CONTEXT[cls]?.pvp?.[name]?.[breakKey]:null);
 if(!preferred)return null;
 const count=effective>=20?3:effective>=12?2:1;
 const eligible=n=>options?.[n]&&effective>=(n<=3?8:n===4?12:16);
 if(preferred.length>count||preferred.some(n=>!eligible(n)))return null;
 return preferred;
}
