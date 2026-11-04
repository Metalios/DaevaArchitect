/* DaevaArchitect progression policy — Global client, reviewed 2026-10-22.
 * Our ranked allocation policy, not a transcription of another site's build.
 * Class-specific targets are grounded in Global tooltip effects and community
 * reports. No claim of simulator-proven best-in-slot or optimal rotation timing.
 * See docs/recommendation-methodology.md for dated research and limitations.
 */
const PROGRESSION_PLANS={
 gladiator:{
  leveling:['Keen Strike','Rending Blow','Overhead Slam','Ruinous Blow','Leaping Slam'],
  endgame:['Overhead Slam','Rending Blow','Keen Strike','Ruinous Blow','Leaping Slam','Sword Aura Rampage'],
  breakpoints:[['Overhead Slam',16],['Rending Blow',16],['Overhead Slam',20]],
  stigma:[['Rage Burst',5],['Focused Block',5],["Zikel's Blessing",5],['Lunge Stance',20],["Zikel's Blessing",10]]
 },
 templar:{
  leveling:['Pummel','Vicious Strike','Judgment','Shield Smite','Warding Strike','Punishment','Enhance Health'],
  endgame:['Judgment','Warding Strike','Vicious Strike','Pummel','Shield Smite','Punishment','Annihilate'],
  breakpoints:[['Judgment',16],['Warding Strike',16],['Vicious Strike',16],['Judgment',20]],
  stigma:[['Shield of Protection',5],['Doom Shield',5],['Taunt',5],['Noble Armor',5],['Noble Armor',15],['Taunt',15],['Taunt',20]]
 },
 assassin:{
  leveling:['Quick Slice','Heart Gore','Insignia Explosion','Savage Roar','Ambush'],
  endgame:['Heart Gore','Insignia Explosion','Quick Slice','Savage Roar','Storm Rampage','Whirlwind Slice'],
  breakpoints:[['Heart Gore',16],['Quick Slice',16],['Insignia Explosion',16],['Heart Gore',20]],
  stigma:[['Swift Contract',10],["Triniel's Dagger",10],['Illusive Clone',20],['Savage Fang',10]]
 },
 ranger:{
  leveling:['Snipe','Deadshot','Gale Arrow','Tempest Shot','Drill Dart'],
  endgame:['Deadshot','Gale Arrow','Snipe','Tempest Shot','Drill Dart','Burst Arrow'],
  breakpoints:[['Deadshot',16],['Gale Arrow',16],['Snipe',16],['Tempest Shot',16]],
  stigma:[["Vaizel's Authority",20],['Bow of Blessing',10],['Supporting Fire',10],['Griffon Arrow',5]]
 },
 sorcerer:{
  leveling:['Flame Arrow','Firestorm','Blaze','Bittercold Wind','Hellfire','Wish of Concentration'],
  endgame:['Firestorm','Bittercold Wind','Hellfire','Blaze','Wish of Concentration','Flame Arrow',"Winter's Shackles"],
  breakpoints:[['Firestorm',12],['Hellfire',16],['Wish of Concentration',16],['Firestorm',16],['Hellfire',20]],
  stigma:[['Element Enhancement',10],['Delayed Explosion',10],['Fire Wall',5],['Cold Storm',5]]
 },
 spiritmaster:{
  leveling:['Cold Shock','Combustion','Summon: Fire Spirit','Jointstrike: Curse','Elemental Fusion'],
  endgame:['Combustion','Elemental Fusion','Summon: Fire Spirit','Cold Shock','Jointstrike: Curse','Summon: Water Spirit'],
  breakpoints:[['Combustion',20],['Elemental Fusion',20],['Summon: Fire Spirit',16],['Cold Shock',16]],
  stigma:[['Summon: Ancient Spirit',10],["Enhance: Spirit's Benediction",10],['Jointstrike: Corrode',10],['Flame Blessing',5]]
 },
 cleric:{
  leveling:["Earth's Retribution",'Judgment Thunder','Condemnation','Chain of Torment','Healing Light'],
  endgame:['Condemnation','Judgment Thunder','Chain of Torment','Light of Regeneration','Healing Light','Bolt'],
  breakpoints:[['Condemnation',12],['Judgment Thunder',16],['Condemnation',16]],
  stigma:[['Light of Protection',10],['Noble Aura',10],['Summon Resurrection',5],['Earth Punishment',20]]
 },
 chanter:{
  leveling:['Onslaught','Incandescent Blow','Spinning Strike','Dark Crush','Impactful Crush'],
  endgame:['Dark Crush','Spinning Strike','Onslaught','Incandescent Blow','Impactful Crush','Recuperation'],
  breakpoints:[['Dark Crush',16],['Onslaught',16],['Spinning Strike',16],['Incandescent Blow',16]],
  stigma:[['Undefeated Mantra',20],['Power of the Storm',15],["Marchutan's Wrath",5],['Sprint Mantra',10]]
 }
};
const PROGRESSION_ITEM_LEVEL=[
 {level:1200,description:'Exploration: Deus Research Base / Shattered Arkanis (not a Combat Power requirement)'},
 {level:1400,description:'Conquest Tier 2: Urugugu Canyon / Vakron Sky Island'},
 {level:1600,description:'Transcendence stage 1'},
 {level:1900,description:'Transcendence stage 2'},
 {level:2000,description:'Ascension Trial Hard (not a Conquest tier)'},
 {level:2100,description:'Conquest Tier 3: Fire Temple / Ferocious Horn Den'},
 {level:2200,description:'Transcendence stage 3'},
 {level:2600,description:'Hard expedition Krao Cave / Draupnir, patch Oct 21'}
];
// Global 2026-10-21 PvE Sorcerer timing/eligibility ledger. Instant activation
// is NOT a verified animation duration. Per-skill animation cancel windows and
// frame counts have not been measured in the Global client, so they are null.
// See docs/sorcerer-mastery-combat-audit-2026-10-24.md for sources and limits.
const SORCERER_EASY_COMBAT={
 'Flame Arrow':{cd:0,cast:'instant',animationMs:null,role:'LMB MP-restoring filler and Fire Mark enabler',control:'hold',tier:2},
 'Ice Chain':{cd:0,cast:'instant',animationMs:null,role:'MP-consuming control with Cold Wave follow-up; exclude from routine damage macro',control:'situational',tier:0},
 'Firestorm':{cd:5,cast:'instant',animationMs:null,role:'Five-hit main cooldown DPS; level 12 Specialty reduces Hellfire cooldown',control:'macro',tier:5},
 'Bittercold Wind':{cd:15,cast:'instant',animationMs:null,role:'Seven-hit area damage over 2s; can miss moving targets',control:'macro',tier:4},
 'Blaze':{cd:5,cast:'instant',animationMs:null,role:'Fire Mark dependent, restores MP, repeatable 5s damage',control:'macro',tier:4},
 'Flame Scattershot':{cd:0,cast:'instant',animationMs:null,role:'Only usable on Stagger; not an unconditional filler',control:'conditional-macro',tier:1},
 'Frost':{cd:30,cast:'instant',animationMs:null,role:'Frost application enables Frost Burst and control',control:'macro',tier:2},
 "Winter's Shackles":{cd:45,cast:'instant',animationMs:null,role:'Slows and can grant short PvE damage boost; easy preset sacrifices burst precision',control:'macro',tier:3},
 'Frost Burst':{cd:10,cast:'instant',animationMs:null,role:'Only fires into Frost window (rare immunities exception)',control:'conditional-macro',tier:2},
 'Wish of Concentration':{cd:60,cast:'instant',animationMs:null,role:'Manual Attack buff; effective-level 16 Specialty reduces remaining cooldowns',control:'manual-buff',tier:5},
 'Hellfire':{cd:45,cast:'charged',animationMs:null,role:'Fully charged manual burst; rank 16 cooldown Specialty',control:'manual-charge',tier:5},
 'Defiance':{cd:51,cast:'instant',animationMs:null,role:'Emergency crowd-control cleanse and immunity; never macro',control:'manual-defense',tier:0},
 'Fire Mark':{cd:null,cast:'passive',animationMs:null,role:'Fire hit debuff that powers Blaze and extra damage',control:'passive',tier:4},
 'Robe of Earth':{cd:null,cast:'passive',animationMs:null,role:'MP/regen plus critical hit above 50% MP',control:'passive',tier:3},
 'Cold Snap':{cd:null,cast:'passive',animationMs:null,role:'Extra hit against Slowed targets; conditional uptime',control:'passive',tier:2},
 'Robe of Flame':{cd:null,cast:'passive',animationMs:null,role:'Persistent accuracy and PvE damage boost',control:'passive',tier:5},
 'Absorb Essence':{cd:null,cast:'passive',animationMs:null,role:'MP sustain and ailment chance',control:'passive',tier:2},
 'Grace of Resistance':{cd:null,cast:'passive',animationMs:null,role:'Mental/impact resistance, defensive',control:'passive',tier:0},
 'Robe of Cold':{cd:null,cast:'passive',animationMs:null,role:'Defense and reactive slow, survival utility',control:'passive',tier:0},
 'Grace of Enhancement':{cd:null,cast:'passive',animationMs:null,role:'PvE damage boost above 25% MP and proc damage',control:'passive',tier:5},
 'Revitalization Contract':{cd:null,cast:'passive',animationMs:null,role:'Status resistance and emergency healing',control:'passive',tier:1},
 'Vitality Evaporation':{cd:null,cast:'passive',animationMs:null,role:'Extra damage while target is above 61% HP',control:'passive',tier:2}
};
function sorcererEasyMasteryStages(level,leveling,unlocks,skillNames,adjust){
 const known=new Set(skillNames),stages=[];
 const add=(names,target)=>names.forEach(name=>{if(known.has(name)&&(unlocks[name]||1)<=level)
   stages.push([name,Math.max(1,Math.min(10,Number(adjust(name,target))||1))])});
 const invest=(names,target)=>names.forEach(name=>{if(known.has(name)&&(unlocks[name]||1)<=level)
   stages.push([name,target])});
 // A low-input rotation still needs intentional spend on manual Hellfire and
 // Wish: they are large contributors to sustained DPS over boss-length fights.
 const repeat=['Firestorm','Bittercold Wind','Blaze'];
 const burst=['Hellfire','Wish of Concentration'];
 const baseline=['Flame Arrow','Fire Mark','Robe of Flame','Grace of Enhancement','Robe of Earth'];
 if(leveling){
   add(['Flame Arrow','Firestorm','Blaze','Bittercold Wind'],5);
   add(['Robe of Flame','Fire Mark','Robe of Earth'],5);
   add([...repeat,...burst,'Flame Arrow'],8);
   add(['Frost','Frost Burst',"Winter's Shackles"],5);
   add(['Robe of Flame','Grace of Enhancement','Fire Mark'],8);
   add(['Firestorm','Hellfire','Wish of Concentration'],12);
   invest([...repeat,...burst,...baseline],10);
 }else{
   // First make the automated core, manual boss cooldowns and permanent
   // passives worthwhile. Then target effective specialty breakpoints using
   // the actual purchased/previewed board bonus and recorded gear.
   add(['Firestorm','Bittercold Wind','Blaze','Hellfire','Wish of Concentration',
     'Robe of Flame','Grace of Enhancement','Fire Mark','Flame Arrow'],8);
   add(['Firestorm','Hellfire','Wish of Concentration',
     "Winter's Shackles",'Bittercold Wind'],12);
   add(['Hellfire','Wish of Concentration','Firestorm','Blaze'],16);
   add(['Hellfire','Wish of Concentration'],20);
   invest(['Firestorm','Bittercold Wind','Hellfire','Wish of Concentration',
     'Blaze','Robe of Flame','Grace of Enhancement','Fire Mark','Flame Arrow'],10);
   add(['Frost','Frost Burst',"Winter's Shackles",'Robe of Earth',
     'Absorb Essence','Cold Snap'],8);
 }
 invest(['Flame Scattershot','Vitality Evaporation','Frost','Frost Burst',
   "Winter's Shackles",'Absorb Essence','Robe of Earth','Cold Snap'],10);
 return stages;
}
// Fresh-45 and later Sorcerer plans are content-specific. In particular,
// Solo is Nightmare/Ascension endgame, NOT another pass through the leveling
// rotation. Rank purchases and the order that they consume the 203+ budget
// must reflect the actual objective, including defensive passive thresholds.
function sorcererEndgameMasteryStages(mode,advice,unlocks,skillNames,adjust){
 const known=new Set(skillNames), unique=names=>[...new Set(names||[])].filter(name=>known.has(name)&&(unlocks[name]||1)<=45);
 const core=unique(advice?.core),support=unique(advice?.support);
 const rest=unique(skillNames.filter(name=>!core.includes(name)&&!support.includes(name)));
 const stages=[];
 const add=(names,target)=>names.forEach(name=>stages.push([name,Math.max(1,Math.min(10,Number(adjust(name,target))||1))]));
 // Equip useful boss attacks, first passive defenses/MP sustainability,
 // then push real rank-8/10 specialty milestones. They may be reached by
 // Mastery + actually recorded gear + funded Daevanion skill levels.
 add(core.slice(0,3),8);
 add(core.slice(3,5),5);
 add(support.slice(0,2),5);
 add(core.slice(0,3),10);
 add(core.slice(3,6),8);
 add(support.slice(0,3),8);
 add(core.slice(3,6),10);
 add(support.slice(0,3),10);
 add(core.slice(6),8);
 add(rest.slice(0,8),5);
 add(core.slice(6),10);
 add(support.slice(3),8);
 add(rest,8);
 add(support.slice(3),10);
 add(rest,10);
 return stages;
}
function progressionMasteryStages(cls,mode,level,leveling,advice,unlocks,skillNames,adjust){
 if(cls==='sorcerer'&&!isPvpContext(mode)){
  if(leveling)return sorcererEasyMasteryStages(level,true,unlocks,skillNames,adjust);
  return sorcererEndgameMasteryStages(mode,advice,unlocks,skillNames,adjust);
 }
 const policy=PROGRESSION_PLANS[cls];if(!policy)return null;
 const names=new Set(skillNames),known=name=>names.has(name)&&(unlocks[name]||1)<=level;
 const unique=sequence=>[...new Set(sequence)].filter(known);
 // Combine DaevaArchitect's class engine with the selected context, rather
 // than silently applying the same Group PvE priorities to Solo and PvP.
 const context=unique(advice.core||[]),base=unique(leveling?policy.leveling:policy.endgame);
 const support=unique(advice.support||[]);
 const isGroupHealer=mode==='party'&&cls==='cleric';
 const healOrder=unique(['Light of Regeneration','Radiant Recovery','Healing Light']);
 const principal=isGroupHealer?unique([...healOrder,...context,...base])
  :isPvpContext(mode)?context
  :mode==='solo'?unique([...base.slice(0,2),...context,...base])
  :unique([...context.slice(0,3),...base,...context]);
 const rest=unique(skillNames.filter(name=>!principal.includes(name)&&!support.includes(name)));
 const stages=[],add=(items,target)=>items.forEach(name=>stages.push([name,adjust(name,target)]));
 if(leveling){
  // Establish an immediate usable kit. Healing group Clerics get access to
  // core heals first; solo Clerics retain the quest damage engine.
  const early=isGroupHealer?principal:unique([...base.slice(0,3),...principal]);
  add(early.slice(0,3),5);
  add(early.slice(3,6),4);
  add(support.slice(0,2),4);
  if(level>=16){add(early.slice(0,3),8);add(principal.slice(0,3),5)}
  if(level>=30){add(principal.slice(0,4),8);add(support.slice(0,3),7)}
 }else{
  add(principal.slice(0,3),8);
  add(principal.slice(3,6),5);
  add(support.slice(0,3),5);
  add(principal.slice(0,3),10);
  add(principal.slice(3,6),8);
 }
 add(principal,10);
 add(support,10);
 add(rest,5);
 add(rest,10);
 return stages;
}
// First four active slots must become usable, then the most valuable early
// *perk* should receive the available points. An even 5/5/5/5 baseline
// leaves 29 points without a level-10 milestone; 10/5/5/4 is preferable for
// many solo and damage builds. No presumption of 75 points at fresh level 45.
const STIGMA_STARTER={
 gladiator:{party:['Rage Burst','Lunge Stance'],solo:['Lifestealing Blade','Lunge Stance']},
 templar:{party:['Doom Shield','Noble Armor'],solo:['Doom Shield','Noble Armor']},
 assassin:{party:['Illusive Clone'],solo:['Illusive Clone']},
 ranger:{party:["Vaizel's Authority"],solo:["Vaizel's Authority"]},
 sorcerer:{party:['Element Enhancement'],solo:['Element Enhancement']},
 spiritmaster:{party:['Summon: Ancient Spirit'],solo:['Summon: Ancient Spirit']},
 cleric:{party:['Earth Punishment','Light of Protection'],solo:['Earth Punishment']},
 chanter:{party:['Undefeated Mantra'],solo:['Undefeated Mantra']}
};
function progressionStigmaStages(cls,mode,equipped,advice){
 const policy=PROGRESSION_PLANS[cls];if(!policy)return null;
 const selected=new Set(equipped),priority=[...(advice.stigmaPriority||[]).filter(name=>selected.has(name)),
  ...equipped.filter(name=>!(advice.stigmaPriority||[]).includes(name))];
 const startup=(advice.buildObjective&&advice.buildObjective!=='performance'?priority:
  (STIGMA_STARTER[cls]?.[mode]||priority)).filter(name=>selected.has(name));
 const first=startup[0]||priority[0];
 const second=startup[1]||priority.find(name=>name!==first);
 const stages=equipped.map(name=>[name,1]);
 if(first){
  stages.push([first,5]);
  if(second && second!==first)stages.push([second,5]);
  // Group Cleric requires Earth Punishment's level-5 critical synergy;
  // Light of Protection is the next useful 10-point support breakpoint.
  const next10=cls==='cleric'&&mode==='party'&&second?second:first;
  stages.push([next10,10]);
 }
 for(const name of priority)if(name!==first&&name!==second)stages.push([name,5]);
 const preference=(mode==='party'&&cls==='templar'&&Array.isArray(advice.stigmaMilestones))
  ?advice.stigmaMilestones
  :!isPvpContext(mode)?policy.stigma:[];
 for(const [name,rank] of preference)if(selected.has(name))stages.push([name,rank]);
 for(const rank of [10,15,20])for(const name of priority)stages.push([name,rank]);
 return stages;
}
// Keep all checkpoints. Object.fromEntries keyed only by skill incorrectly
// overwrote intermediate Lv16 objectives with the eventual Lv20 objective.
function progressionBreakpoints(cls,mode,objective='performance'){
 const policy=PROGRESSION_PLANS[cls];if(!policy||isPvpContext(mode))return [];
 if(cls==='sorcerer'){
  const solo=mode==='solo';
  if(objective==='survivability')return solo?[
   ['Robe of Earth',8],['Absorb Essence',8],['Grace of Resistance',8],
   ['Robe of Earth',12]]:[
   ['Robe of Earth',8],['Grace of Resistance',8],['Absorb Essence',8]];
  if(objective==='control')return [
   ["Winter's Shackles",8],['Frost',12],['Ice Chain',12]];
  if(objective==='burst')return [
   ['Hellfire',16],['Wish of Concentration',16],
   ["Winter's Shackles",8],['Hellfire',20]];
  if(objective==='sustained')return [
   ['Firestorm',12],['Firestorm',16],['Blaze',12],
   ['Bittercold Wind',16],['Wish of Concentration',16]];
  if(solo)return [
   ['Hellfire',12],['Robe of Earth',8],['Wish of Concentration',12],
   ['Firestorm',12],['Hellfire',16]];
  return policy.breakpoints;
 }
 if(cls==='cleric'&&mode==='party')return [
  ['Light of Regeneration',16],['Radiant Recovery',16],['Healing Light',16]];
 return policy.breakpoints;
}
function progressionBoardTargets(cls,mode,objective='performance'){
 const result={};
 progressionBreakpoints(cls,mode,objective).forEach(([name,rank],index)=>{
  const milestone={rank,weight:Math.max(1.1,2.3-index*0.28)};
  (result[name]??={milestones:[]}).milestones.push(milestone);
 });
 for(const target of Object.values(result)){
  target.milestones.sort((a,b)=>a.rank-b.rank);
 }
 return result;
}
function progressionNextBreakpoint(cls,mode,effectiveLevel,ownedCrystals,objective='performance'){
 const p=PROGRESSION_PLANS[cls];
 if(!p)return '';
 if(isPvpContext(mode))return 'PvP priorities depend on matchup; verify your defensive Stigma and control tools.';
 const next=progressionBreakpoints(cls,mode,objective).find(([name,rank])=>effectiveLevel(name)<rank);
 if(!next)return 'Key damage breakpoints reached. Recheck your chosen Specialties and combat rotation.';
 const [name,rank]=next,gap=rank-effectiveLevel(name);
 return name+' effective Lv '+rank+' next ('+gap+' level'+(gap===1?'':'s')+
  ' remaining through Mastery, connected Daevanion nodes and recorded equipment). '+
  (ownedCrystals>=327?'Recheck the remaining route with your 327+ crystal budget.':'Keep recording earned and purchased Daevanion nodes.');
}
// Generate real manual hotbar slots from the FOUR equipped Global Stigmas,
// not the generic Sorcerer preset. Skills already cast by a macro stack are
// shown there instead. This prevents a selected ground Stigma from silently
// vanishing when the moving-boss macro intentionally excludes it.
function sorcererPveManualHotbar(equippedStigmas=[],automaticSkills=[],available=null){
 const auto=new Set(automaticSkills);
 const known=available?new Set(available):null;
 const usable=name=>!known||known.has(name);
 const choices=[...new Set(equippedStigmas)].filter(name=>
   usable(name)&&!auto.has(name)).slice(0,4);
 const stigmaCue=name=>{
   if(name==='Element Enhancement')return 'Damage buff — manual burst alignment';
   if(name==='Delayed Explosion')return 'Manual 4-second damage-amplification window before charged Hellfire';
   if(name==='Fire Wall'||name==='Cold Storm')
     return 'Manual ground placement ONLY while the boss stays inside its area';
   if(name==='Divine Burst'||name==='Glacial Smite')
     return 'Manual stagger damage when the boss presents a safe attack window';
   if(['Steel Barrier','Arctic Armor','Hibernation'].includes(name))
     return 'Emergency defensive skill — never spend automatically';
   return 'Situational Stigma — timing and target selection remain manual';
 };
 const tone=name=>['Element Enhancement','Delayed Explosion'].includes(name)?'buff':
   ['Steel Barrier','Arctic Armor','Hibernation'].includes(name)?'defense':
   ['Fire Wall','Cold Storm','Divine Burst','Glacial Smite'].includes(name)?'attack':'utility';
 const rows=[
  [['Hellfire'],'Full-charge Hellfire manually; release RMB while charging to avoid a clipped release','attack'],
  ...(!auto.has('Wish of Concentration')&&usable('Wish of Concentration')
    ?[[['Wish of Concentration'],'Manual Attack buff / -10s cooldown window for a coordinated burst','buff']]
    :[]),
  ...choices.map(name=>[[name],stigmaCue(name),tone(name)])
 ];
 const used=new Set(rows.flatMap(([skills])=>skills));
 for(const [name,cue] of [
  ["Winter's Shackles",'Manual PvE damage window: align with Delayed Explosion and Hellfire'],
  ['Bittercold Wind','Use when the boss will remain inside the summon area'],
  ['Frost Burst','Conditional Frost hit: manually use only when Frost is active'],
  ['Frost','Manual Frost setup when target is susceptible'],
  ['Ice Chain','Optional mobile MP-cost attack; choose only when it fits the fight']
 ]){
  if(rows.length>=8)break;
  if(!usable(name)||auto.has(name)||used.has(name))continue;
  rows.push([[name],cue,'attack']);
  used.add(name);
 }
 while(rows.length<8)rows.push([[],'Free manual key','utility']);
 return rows.map(([skills,cue,tone],i)=>[
   skills,skills.length?(i+1)+': '+cue:cue,tone
 ]);
}
function progressionRotationProfile(base,cls,mode,effectiveLevel,equippedStigmas=[],specialtyEnabled=()=>false,objective='performance'){
 const p={...base,stacks:base.stacks.map(s=>({...s,skills:[...s.skills]})),
  hotbar:base.hotbar.map(([skills,cue,tone])=>[[...skills],cue,tone])};
 // One canonical class profile supplies the main combat engine. Context
 // changes cues and selected Stigmas, never invents a different active skill.
 if(cls==='gladiator'){
  p.stacks=p.stacks.filter(s=>s.key!=='Q'&&s.key!=='E');
  p.stacks.unshift({key:'E',title:'Rending / Ruinous',skills:['Rending Blow','Ruinous Blow']});
  p.stacks.unshift({key:'Q',title:'Overhead Slam — separate priority',skills:['Overhead Slam']});
  p.macro=['Q','E'];
  p.rule='Keep Overhead Slam separate from Rending Blow; hold Keen Strike to weave and restore MP. At Overhead Slam 16, watch MP consumption.';
 }else if(cls==='cleric'){
  if(equippedStigmas.includes('Earth Punishment')){
   p.stacks=p.stacks.map(stack=>stack.key==='E'
    ?{...stack,title:'Earth Punishment → Condemnation',skills:['Earth Punishment','Condemnation','Chain of Torment']}
    :stack);
   p.rule='Use Earth Punishment before Condemnation for the level-5 critical synergy; keep all emergency and regular heals manual.';
  }
 }else if(cls==='templar'){
  p.rule=effectiveLevel('Judgment')>=16&&specialtyEnabled('Judgment',5)
   ?'Judgment cooldown-removal Specialty is selected: prioritize it in the trigger stack; keep charged Punishment manual.'
   :'Until Judgment Lv 16, trigger one Judgment per shield-skill window; keep charged Punishment manual.';
 }else if(cls==='ranger'){
  // Only attach the optional Slow-sensitive Stigma if the build has learned
  // and equipped it. Keep Snare in Row 0, before either damage spender.
  const explosive=equippedStigmas.includes('Explosive Arrow');
  p.stacks=p.stacks.map(stack=>stack.key==='Q'
   ?{...stack,skills:['Snare Shot',...(explosive?['Explosive Arrow']:[]),'Burst Arrow']}
   :stack);
  p.rule='Marking Shot supplies Precision. E prioritizes Gale and Drill before Tempest; Q applies Snare before Burst and equipped Explosive Arrow. Charge Deadshot manually.';
 }else if(cls==='sorcerer'){
  if(isPvpContext(mode)){
   // PvP is reactive: never automate Seal, polymorph, emergency immunity,
   // Frost/Slow windows or damage Stigmas that should be aimed at the target.
   // Q is intentionally the safe pressure loop, not a pre-scripted CC opener.
   p.stacks=[{key:'Q',title:'PvP safe fire pressure',skills:['Blaze','Firestorm']}];
   p.macro=['Q'];
   p.stigmas=[...equippedStigmas];
   p.hotbar=[
    [['Hellfire'],'1: Fully charge ONLY when the target cannot escape','attack'],
    [['Wish of Concentration'],'2: Manual offensive/reset window','buff'],
    ...equippedStigmas.map(name=>[[name],'PvP Stigma — manual timing / targeting',
       /Element Enhancement/.test(name)?'buff':'defense']),
    [["Winter's Shackles"],'Manual Slow and damage-buff opener','utility'],
    [['Frost'],'Manual Frost application, control and follow-up setup','utility']
   ].slice(0,8);
   while(p.hotbar.length<8)p.hotbar.push([[],'Free situational PvP key','utility']);
   p.rule='PvP: use Q only for safe fire pressure. Keep Soul Freeze, Lumiel, barriers, Hibernation, Frost and Winter\'s Shackles reactive; charge Hellfire only after a confirmed safe control window.';
   p.opener=['Approach with cover, conserving Defiance (Space) and defensive Stigmas.',
    'Manually apply Frost, Winter\'s Shackles or an equipped control Stigma when its timing matters.',
    'Use Wish and fully charged Hellfire only after verifying the target cannot escape or interrupt.'];
   p.loop=['Maintain Flame Arrow with Q fire pressure only during safe stationary attack windows.',
    'Manually time Soul Freeze or other CC around the enemy Defiance, immunity and escapes.',
    'Save Arctic Armor, Steel Barrier or Hibernation for the actual incoming burst; disengage instead of greedily channeling.'];
  }else if(mode==='solo'||mode==='party'){
   // Fallback and modified endgame builds must use the same safe PvE
   // policy as the Sorcerer simulator. No timed Delayed Explosion in RMB.
   const mobile=mode==='solo';
   const q=[
     ...(!mobile&&objective!=='burst'?['Bittercold Wind']:[]),
     'Blaze','Firestorm'
   ];
   const e=mobile?[
     ...(specialtyEnabled('Bittercold Wind',2)?['Bittercold Wind']:[]),
     ...(specialtyEnabled('Frost Burst',2)?['Frost Burst','Frost']:[])
   ]:objective==='burst'||objective==='survivability'?[]:
     ['Fire Wall','Cold Storm'].filter(name=>equippedStigmas.includes(name));
   const r=[
     ...(objective==='sustained'&&equippedStigmas.includes('Element Enhancement')
       ?['Element Enhancement']:[]),
     ...(objective==='sustained'&&!specialtyEnabled('Wish of Concentration',5)
       ?['Wish of Concentration']:[])
   ];
   p.stacks=[
     {key:'Q',title:mobile?'Mobile fire damage':'Conquest damage and repeatable fire',skills:q},
     ...(e.length?[{key:'E',title:mobile?'Owned mobile follow-ups':'Stable-boss ground damage',skills:e}]:[]),
     ...(r.length?[{key:'R',title:'Optional sustained auto-buffs',skills:r}]:[])
   ];
   p.macro=p.stacks.map(stack=>stack.key);
   p.stigmas=[...equippedStigmas];
   p.rule=mobile
     ?'Nightmare Solo: hold LMB Flame Arrow + RMB for mobile fire damage. Keep Hellfire fully charged and short burst buffs timed manually.'
     :'Conquest Group: hold LMB + RMB for Firestorm, Blaze, Bittercold Wind and stationary-boss ground damage. Time short Hellfire buffs manually.';
   p.summary=mobile
     ?'Mobile Solo damage with a manual Hellfire burst and optional shields.'
     :'Group boss damage, ground-effect uptime, and manual Hellfire amplification.';
   p.hotbarNote='Do not automatically cast Delayed Explosion; its damage window is only four seconds. With the Wish cooldown-reset Specialty selected, press Wish after major skills enter cooldown. Stop ground automation on moving bosses.';
  }else{
   p.rule='Keep Hellfire fully charged on a manual key; place persistent ground effects only where targets remain.';
  }
 }else if(cls==='chanter'){
  p.rule=effectiveLevel('Dark Crush')>=16&&specialtyEnabled('Dark Crush',5)
   ?'Dark Crush cooldown-removal Specialty is selected: let each available trigger flow to Dark Crush.'
   :'Before Dark Crush Lv 16, use its trigger carefully; keep the remaining triggers available for later windows.';
 }
 if(mode==='solo'){
  p.opener=cls==='sorcerer'
   ?['Hold LMB Flame Arrow + RMB for safe mobile damage. Keep ground spells manual when the Nightmare boss is moving.',
     'Activate Element Enhancement, then manually time Delayed Explosion and the PvE buff from Winter\'s Shackles close to a fully charged Hellfire hit.',
     'With the Wish cooldown-reset Specialty, use Wish after major attacks are already cooling down. Hold emergency shields for actual danger.']
   :['Enter with the available damage buffs; save a defensive skill if the target can punish the pull.',
     'Start the main damage engine; do not automate movement or charged casts.',
     'Use self-healing or mitigation when needed instead of blindly maintaining macro uptime.'];
  p.loop=cls==='sorcerer'
   ?['Keep short fire attacks running on LMB + RMB through safe movement.',
     'Pause the macro for a fully charged Hellfire and timed buffs; never waste Delayed Explosion.',
     'Only place ground damage on bosses that will remain inside its area.']
   :['Prioritize short time-to-kill without losing core cooldown windows.',
     'Release held attacks for dodge, charge, recovery or repositioning.',
     'Recheck your Specialties after reaching an effective-level breakpoint.'];
 }else if(mode==='party'){
  if(cls==='sorcerer'){
   p.opener=['Maintain LMB + RMB fire attacks and Bittercold Wind when the Conquest boss is stable.',
     'Use ground Stigmas only if their area will connect; manually coordinate Element Enhancement, Delayed Explosion and a fully charged Hellfire.',
     'Use Wish after key cooldowns are running when its reset Specialty is equipped.'];
   p.loop=['Keep Q repeatable damage and E ground effects on stationary targets.',
     'Release RMB for full Hellfire charge and dangerous boss mechanics.',
     'Switch off the ground stack or cast those skills manually when the boss moves.'];
  }
  if(cls==='cleric'||cls==='chanter'){
   p.rule+=' Keep healing and emergency decisions manual; never put critical heals in a spam macro.';
  }
 }
 return p;
}
