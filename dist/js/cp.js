// A level-45 planning estimate, never the game's server-calculated Combat Power.
// Coefficients were fitted to 109 anonymized public NA East level-45 profiles
// (October 19, 2026). Board stat weights follow AION2 Index's published
// reverse-engineered per-stat model. See README for validation and limits.
const CP_STAT_WEIGHTS = {
  'Attack':50,'Attack Bonus':50,'Accuracy':7.7,'Accuracy Bonus':7.7,
  'Critical Hit':8.2,'Defense':1,'Defense Bonus':1,'HP':0.125,'Max HP':0.125,
  'MP':0.5,'Max MP':0.5,'Might':90.75,'Combat Speed':520,
  'PvE Damage Boost':340,'Damage Boost':330,'Weapon Damage Boost':283,
  'Critical Damage Boost':150,'Multi-hit Chance':150,'Multi-Hit Chance':150,
  'Cooldown Reduction':289,'Perfect Chance':100,'Strike Chance':500,
  'Damage Tolerance':160,'PvE Damage Tolerance':100,
  'Critical Damage Tolerance':80,'Multi-hit Resist':17,'Multi-Hit Resist':17,
  'Attack Increase':907.5
};
const CP_MODEL = {intercept:-11051.5268,gearBase:57.0352,enhance:61.5471,titles:17.9964,stigma:143.8335,mastery:15};
function cpFingerprint(m){
  return JSON.stringify([state.class,gearEquipment(),[...m.boards.owned].sort((a,b)=>a-b),m.mastery.levels,activeStigmas(),m.stigma.levels,account().titlesOwned]);
}

function estimateCombatPower(m){
  const equipment=gearEquipment();let gearBase=0,enhance=0,regular=0;
  for(const slot of GEAR_SLOTS){
    if(slot.id==='wings')continue; // Official equipment-list training does not include wings.
    const item=equipment[slot.id];
    if(!gearIsActive(slot,item))continue;
    if(['left','right'].includes(slot.area))regular++;
    gearBase+=Number(item.itemLevel)||0;
    enhance+=Number(item.enhancement)||0;
  }
  if(isLeveling())return {ready:false,reason:'The CP estimate is calibrated for level 45. Switch to your level 45 build to compare with a CP target.',regular};
  if(regular<18||gearBase<500)return {ready:false,reason:`Equip at least 18 of 20 regular gear slots with catalog items to estimate CP. ${regular} / 20 are recorded.`,regular};

  // A direct board stat score distinguishes routes with equal node counts.
  // Skill-level nodes also flow into the effective Mastery sum below.
  let boardScore=0;
  for(const [key,value] of Object.entries(m.effects.stats)){
    const meta=data().stats[key];
    if(meta)boardScore+=(CP_STAT_WEIGHTS[meta.name]||0)*value/(meta.div||1);
  }
  const mastery=skillNames().reduce((total,name)=>total+Math.max(0,effective(name,m)-1),0);
  const stigma=activeStigmas().reduce((total,name)=>total+(m.stigma.levels[name]||0),0);
  const titles=Object.entries(account().titlesOwned||{}).filter(([id,owned])=>owned&&TITLE_BY_ID.get(id)?.owned!=='No stat effect').length;

  // The public-profile fit already includes typical stone effects, so use a
  // conservative partial weight for recorded rolls. A valid roll must never
  // make the estimate go down. Unmodeled stats score zero.
  let stoneBonus=0,stones=0;
  const percentStats=new Set(['Combat Speed','PvE Damage Boost','Damage Boost','Weapon Damage Boost','Critical Damage Boost','Multi-hit Chance','Multi-Hit Chance','Cooldown Reduction','Perfect Chance','Strike Chance','Damage Tolerance','PvE Damage Tolerance','Critical Damage Tolerance','Multi-hit Resist','Multi-Hit Resist','Attack Increase']);
  for(const slot of GEAR_SLOTS){
    const item=equipment[slot.id];if(!gearIsActive(slot,item))continue;
    for(const stone of (item.stones||[]).slice(0,gearStoneSlots(slot,item))){
      if(!stone?.stat||!Number.isFinite(Number(stone.value))||!Number(stone.value))continue;
      const weight=CP_STAT_WEIGHTS[stone.stat]||0;
      if((stone.unit==='%')!==percentStats.has(stone.stat))continue;
      const value=Math.max(0,Math.min(2500,weight*Number(stone.value)*0.5));
      stoneBonus+=value;stones++;
    }
  }
  stoneBonus=Math.min(10000,stoneBonus);
  const raw=CP_MODEL.intercept+CP_MODEL.gearBase*gearBase+CP_MODEL.enhance*enhance+
    boardScore+CP_MODEL.titles*titles+CP_MODEL.stigma*stigma+CP_MODEL.mastery*mastery+stoneBonus;
  const rawValue=Math.max(0,Math.round(raw/10)*10);
  const anchor=account().cpAnchor;
  const calibrated=Number.isFinite(Number(anchor?.raw))&&Number.isFinite(Number(anchor?.observed))&&Number(anchor.observed)>0;
  const exactBaseline=calibrated&&anchor.fingerprint===cpFingerprint(m);
  const change=calibrated?rawValue-Number(anchor.raw):0;
  const value=calibrated?Math.max(0,Math.round(Number(anchor.observed)+change)):rawValue;
  // This is a display range, not a statistical confidence interval. The held-
  // out 90th-percentile error was about 8k with complete official inputs; build
  // records can omit more systems, so the displayed range is deliberately wider.
  const margin=calibrated?(exactBaseline?0:Math.max(8000,Math.ceil(Math.abs(change)*0.3/100)*100)):
    Math.max(10000,Math.ceil(value*0.15/100)*100)+(titles<25?3000:0);
  return {ready:true,value,low:Math.max(0,value-margin),high:value+margin,
    rawValue,calibrated,exactBaseline,change,baseline:calibrated?Number(anchor.observed):null,
    regular,gearBase,enhance,boardScore,mastery,stigma,titles,stones};
}
