// AION 2 Global, October 28 2026 client skill pools (Aion2Data /arcana/<class>).
// Each slot has disjoint pools; Chalice may roll any of the 22 mastery skills.
const ARCANA_GRADES = Object.freeze({
  Common:{base:1,max:2}, Rare:{base:2,max:3},
  Epic:{base:3,max:4}, Unique:{base:4,max:5}
});
const ARCANA_SKILL_POOLS = {
  gladiator:{
    parchment:['Keen Strike','Leaping Slam','Overhead Slam','Ankle Slice','Aerial Snare','Ruinous Blow'],
    compass:['Rending Blow','Mocking Blade','Rush Strike','Crushing Wave','Sword Aura Rampage','Defiance'],
    bell:['Survival Stance','Blood Absorption','Attack Preparation','Destructive Impulse','Survival Willpower'],
    mirror:['Protection Armor','Identify Weakness','Impact Hit','Experienced Counterstrike','Murderous Burst']
  },
  templar:{
    parchment:['Vicious Strike','Poach','Annihilate','Judgment','Debilitating Smash','Punishment'],
    compass:['Pummel','Shield Smite','Shield Rush','Warding Strike','Flash Rampage','Defiance'],
    bell:['Enhance Health','Punishing Benediction','Guarding Seal','Insulting Roar','Fury'],
    mirror:['Warding Shield','Ironclad Defense','Impact Hit','Survival Willpower','Block Pain']
  },
  assassin:{
    parchment:['Quick Slice','Shadowstrike','Heart Gore','Whirlwind Slice','Shadow Fall','Insignia Explosion'],
    compass:['Ambush','Savage Roar','Infiltrate','Flash Slice','Storm Rampage','Defiance'],
    bell:['Heightened Sixth Sense','Apply Poison','Assault Stance','Ambush Stance','Revitalization Contract'],
    mirror:['Exploit Weakness','Rear Smite','Impact Hit','Defense Break','Determination']
  },
  ranger:{
    parchment:['Snipe','Snare Shot','Drill Dart','Burst Arrow','Explosion Trap','Tempest Shot'],
    compass:['Deadshot','Marking Shot','Suppressing Arrow','Gale Arrow','Arrow Scattershot','Defiance'],
    bell:['Vigilant Eye','Wind Vigor',"Hunter's Resolve",'Rooting Eye','Revitalization Contract'],
    mirror:['Concentrated Fire','Focused Eye','Unyielding Resolve','Melee Fire',"Hunter's Soul"]
  },
  sorcerer:{
    parchment:['Flame Arrow','Firestorm','Blaze','Frost Burst','Wish of Concentration','Hellfire'],
    compass:['Ice Chain','Bittercold Wind','Frost',"Winter's Shackles",'Flame Scattershot','Defiance'],
    bell:['Fire Mark','Cold Snap','Robe of Cold','Grace of Resistance','Revitalization Contract'],
    mirror:['Robe of Earth','Robe of Flame','Absorb Essence','Grace of Enhancement','Vitality Evaporation']
  },
  spiritmaster:{
    parchment:['Cold Shock','Summon: Fire Spirit','Jointstrike: Curse','Summon: Earth Spirit','Dimensional Control','Elemental Fusion'],
    compass:['Combustion','Summon: Water Spirit',"Soul's Cry",'Summon: Wind Spirit','Rapid Scattershot','Defiance'],
    bell:['Spirit Strike',"Spirit's Descent",'Spirit Revitalization','Spirit Communion','Element Unification'],
    mirror:['Spirit Protection','Corrode','Mental Focus','Consecutive Countercurrent','Revitalization Contract']
  },
  cleric:{
    parchment:["Earth's Retribution",'Debilitating Mark','Chain of Torment','Condemnation','Radiant Recovery','Bolt'],
    compass:['Judgment Thunder','Divine Aura','Light of Regeneration','Healing Light','Lightning Strike Scattershot','Defiance'],
    bell:['Warm Benediction',"Empyrean Lord's Grace",'Immortal Veil','Prayer of Concentration','Survival Willpower'],
    mirror:["Empyrean Lords' Benediction",'Healing Enhancement','Heal Block','Radiant Benediction',"Earth's Grace"]
  },
  chanter:{
    parchment:['Onslaught','Rushing Smash','Wave Blow','Heat Wave Blow','Dark Crush','Spinning Strike'],
    compass:['Incandescent Blow','Impactful Crush','Tremor Crush','Recuperation','Gust Rampage','Defiance'],
    bell:['Blessing of Life','Protection Circle','Attack Preparation','Raging Spell','Survival Willpower'],
    mirror:['Crossguard','Inspiring Spell','Impact Hit',"Earth's Promise","Wind's Promise"]
  }
};
function arcanaSkillPool(cls,slotId) {
  if(slotId==='chalice')return Object.values(ARCANA_SKILL_POOLS[cls]||{}).flat();
  return ARCANA_SKILL_POOLS[cls]?.[slotId]||[];
}
function arcanaMaxEnhancement(grade){return ARCANA_GRADES[grade]?.max??0}
function arcanaLineCapacity(grade,enhancement){
  const rules=ARCANA_GRADES[grade];return rules?Math.min(4,rules.base+Math.max(0,Math.min(rules.max,Math.floor(Number(enhancement)||0)))):0;
}
// Enhancements first reveal missing lines, then distribute +1 to existing lines.
function arcanaUpgradeBudget(grade,enhancement){
  const rules=ARCANA_GRADES[grade];return rules?Math.max(0,Math.min(rules.max,Math.floor(Number(enhancement)||0))-(4-rules.base)):0;
}
function arcanaValidBonuses(cls,slotId,grade,enhancement,bonuses){
  const pool=new Set(arcanaSkillPool(cls,slotId)),capacity=arcanaLineCapacity(grade,enhancement);
  if(!Array.isArray(bonuses)||bonuses.length>capacity)return false;
  const seen=new Set();let upgrades=0;
  for(const bonus of bonuses){
    if(!pool.has(bonus?.skill)||seen.has(bonus.skill)||!Number.isInteger(Number(bonus.levels))||Number(bonus.levels)<1||Number(bonus.levels)>4)return false;
    seen.add(bonus.skill);upgrades+=Number(bonus.levels)-1;
  }
  return upgrades<=arcanaUpgradeBudget(grade,enhancement);
}

/**
 * Global Arcana carries a fixed Empyrean Lord stat by card slot and set.
 * Keep the 8/12/16/20 base points separate from the (unverified) enhancement
 * stat increase. One point means a 0.1% modifier to each listed derived stat.
 * Vigor/Magic 2/4-card bonuses are PvE only; never treat them as PvP Attack.
 */
const ARCANA_DIVINE_BY_SET=Object.freeze({
  Vigor:Object.freeze({chalice:'Time',parchment:'Life',compass:'Freedom',
    bell:'Justice',mirror:'Illusion'}),
  Magic:Object.freeze({chalice:'Space',parchment:'Destiny',compass:'Death',
    bell:'Destruction',mirror:'Wisdom'})
});
const ARCANA_GRADE_POINTS=Object.freeze({Common:8,Rare:12,Epic:16,Unique:20});
function arcanaRecordedSet(item){
  if(item?.arcanaSet==='Vigor'||item?.arcanaSet==='Magic')return item.arcanaSet;
  const name=String(item?.name||'');
  if(/\b(?:of|primal) vigor\b/i.test(name))return 'Vigor';
  if(/\b(?:of )?magic(?: armor)?\b/i.test(name))return 'Magic';
  return null;
}
function arcanaDivineTotals(equipment,active=()=>true){
  const stats={},sets={Vigor:0,Magic:0},unidentified=[];
  for(const slot of ['chalice','parchment','compass','bell','mirror']){
    const item=equipment?.[slot];
    if(!item||!active(slot,item))continue;
    const set=arcanaRecordedSet(item),amount=ARCANA_GRADE_POINTS[item.grade]||0;
    if(!set||!amount){unidentified.push(slot);continue}
    sets[set]++;
    const divine=ARCANA_DIVINE_BY_SET[set][slot];
    stats[divine]=(stats[divine]||0)+amount;
  }
  return {stats,sets,unidentified};
}
