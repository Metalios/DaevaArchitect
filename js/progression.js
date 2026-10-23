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
  breakpoints:[['Heart Gore',16],['Insignia Explosion',16],['Quick Slice',16],['Heart Gore',20]],
  stigma:[['Swift Contract',10],["Triniel's Dagger",10],['Illusive Clone',20],['Savage Fang',10]]
 },
 ranger:{
  leveling:['Snipe','Deadshot','Gale Arrow','Tempest Shot','Drill Dart'],
  endgame:['Deadshot','Gale Arrow','Snipe','Tempest Shot','Drill Dart','Burst Arrow'],
  breakpoints:[['Deadshot',16],['Gale Arrow',16],['Snipe',16],['Tempest Shot',16]],
  stigma:[["Vaizel's Authority",20],['Bow of Blessing',10],['Supporting Fire',10],['Griffon Arrow',5]]
 },
 sorcerer:{
  leveling:['Flame Arrow','Ice Chain','Firestorm','Hellfire','Wish of Concentration','Blaze'],
  endgame:['Hellfire','Wish of Concentration','Flame Arrow','Blaze','Firestorm',"Winter's Shackles"],
  breakpoints:[['Hellfire',16],['Wish of Concentration',16],['Hellfire',20]],
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
function progressionMasteryStages(cls,mode,level,leveling,advice,unlocks,skillNames,adjust){
 const policy=PROGRESSION_PLANS[cls];if(!policy)return null;
 const names=new Set(skillNames),known=name=>names.has(name)&&(unlocks[name]||1)<=level;
 const unique=sequence=>[...new Set(sequence)].filter(known);
 // PvP does not inherit PvE-specific level-16 damage objectives.
 const early=mode==='pvp'?unique(advice.core):unique(policy.leveling);
 const late=mode==='pvp'?unique(advice.core):mode==='party'&&cls==='cleric'
  ?unique(['Healing Light','Radiant Recovery','Light of Regeneration',...policy.endgame])
  :unique(policy.endgame);
 const support=unique(advice.support||[]);
 const rest=unique(skillNames.filter(name=>!late.includes(name)&&!early.includes(name)&&!support.includes(name)));
 const stages=[],add=(items,target)=>items.forEach(name=>stages.push([name,adjust(name,target)]));
 if(leveling){
  // At low level, guarantee an immediately usable kit before spending on
  // abilities not yet unlocked. At higher levels move toward breakpoints.
  add(early.slice(0,3),5);
  add(early.slice(3,5),4);
  add(support.slice(0,2),4);
  if(level>=16){add(early.slice(0,3),8);add(late.slice(0,3),5)}
  if(level>=30){add(late.slice(0,4),8);add(support.slice(0,3),7)}
 }else{
  // Fresh 45 buys the class's principal engine, then a functional support
  // baseline. Boards and actual equipped +skill bonuses supply levels > 10.
  add(late.slice(0,3),8);
  add(late.slice(3,6),5);
  add(support.slice(0,3),5);
  add(late.slice(0,3),10);
  add(late.slice(3,6),8);
 }
 add(late,10);
 add(support,10);
 add(early,10);
 add(rest,5);
 add(rest,10);
 return stages;
}
function progressionStigmaStages(cls,mode,equipped,advice){
 const policy=PROGRESSION_PLANS[cls];if(!policy)return null;
 const selected=new Set(equipped);
 const preference=(mode==='party'&&cls==='templar'&&Array.isArray(advice.stigmaMilestones))
  ?advice.stigmaMilestones
  :mode==='party'||mode==='solo' ? policy.stigma : [];
 // PvP first works from the chosen PvP loadout, not a mismatched PvE list.
 const priority=[...(advice.stigmaPriority||[]).filter(name=>selected.has(name)),
  ...equipped.filter(name=>!(advice.stigmaPriority||[]).includes(name))];
 const stages=[...equipped.map(name=>[name,5])];
 const already=new Map(equipped.map(name=>[name,5]));
 for(const [name,rank] of preference){
  if(!selected.has(name)||rank<=already.get(name))continue;
  stages.push([name,rank]);already.set(name,rank);
 }
 for(const rank of [10,15,20])for(const name of priority)
  if(rank>(already.get(name)||0)){stages.push([name,rank]);already.set(name,rank)}
 return stages;
}
function progressionBoardTargets(cls,mode){
 const p=PROGRESSION_PLANS[cls];
 if(!p||mode==='pvp')return {};
 return Object.fromEntries(p.breakpoints.map(([name,rank],index)=>[name,{rank,weight:Math.max(1.1,2.3-index*0.28)}]));
}
function progressionNextBreakpoint(cls,mode,effectiveLevel,ownedCrystals){
 const p=PROGRESSION_PLANS[cls];
 if(!p)return '';
 if(mode==='pvp')return 'PvP priorities depend on matchup; verify your defensive Stigma and control tools.';
 const next=p.breakpoints.find(([name,rank])=>effectiveLevel(name)<rank);
 if(!next)return 'Key damage breakpoints reached. Recheck your chosen Specialties and combat rotation.';
 const [name,rank]=next,gap=rank-effectiveLevel(name);
 return name+' effective Lv '+rank+' next ('+gap+' level'+(gap===1?'':'s')+
  ' remaining through Mastery, connected Daevanion nodes and recorded equipment). '+
  (ownedCrystals>=327?'Recheck the remaining route with your 327+ crystal budget.':'Keep recording earned and purchased Daevanion nodes.');
}
function progressionRotationProfile(base,cls,mode,effectiveLevel){
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
 }else if(cls==='templar'){
  p.rule=effectiveLevel('Judgment')>=16
   ?'Judgment Lv 16: use its cooldown-removal Specialty and prioritize it in the trigger stack; keep charged Punishment manual.'
   :'Until Judgment Lv 16, trigger one Judgment per shield-skill window; keep charged Punishment manual.';
 }else if(cls==='ranger'){
  p.rule='Charge Deadshot and apply Marking Shot manually. Keep ranged filler on the macro; never cut short the charged shot.';
 }else if(cls==='sorcerer'){
  p.rule='Keep Hellfire fully charged on a manual key; place persistent ground effects only where targets remain.';
 }else if(cls==='chanter'){
  p.rule=effectiveLevel('Dark Crush')>=16
   ?'Dark Crush Lv 16: with its cooldown-removal Specialty selected, let each available trigger flow to Dark Crush.'
   :'Before Dark Crush Lv 16, use its trigger carefully; keep the remaining triggers available for later windows.';
 }
 if(mode==='solo'){
  p.opener=['Enter with the available damage buffs; save a defensive skill if the target can punish the pull.',
   'Start the main damage engine; do not automate movement or charged casts.',
   'Use self-healing or mitigation when needed instead of blindly maintaining macro uptime.'];
  p.loop=['Prioritize short time-to-kill without losing core cooldown windows.',
   'Release held attacks for dodge, charge, recovery or repositioning.',
   'Recheck your Specialties after reaching an effective-level breakpoint.'];
 }else if(mode==='party'){
  if(cls==='cleric'||cls==='chanter'){
   p.rule+=' Keep healing and emergency decisions manual; never put critical heals in a spam macro.';
  }
 }
 return p;
}
