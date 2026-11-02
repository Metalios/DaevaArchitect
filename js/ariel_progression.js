'use strict';
// Global Hard Conquest entry gates and Ariel crystal acquisition,
// sourced from the October 21 and October 28 2026 Global patch notes.
// These gates limit where fragments are farmed; Ariel's board itself is
// level 45 and remains inspectable independently of Gear Rating.
const ARIEL_HARD_CONQUESTS=Object.freeze([
  Object.freeze({name:'Krao Cave',itemLevel:2600,patch:'2026-10-21'}),
  Object.freeze({name:'Draupnir',itemLevel:2600,patch:'2026-10-21'}),
  Object.freeze({name:'Urugugu Canyon',itemLevel:2700,patch:'2026-10-28'}),
  Object.freeze({name:'Vakron Sky Island',itemLevel:2700,patch:'2026-10-28'})
]);
const ARIEL_FRAGMENTS_PER_CRYSTAL=100;
// Each dungeon has its own morph limit; not a total cap of 30 crystals.
const ARIEL_MORPH_LIMIT_PER_DUNGEON=30;
function arielAccess(gearRating,earnedCrystals=0,characterLevel=45) {
  const input=Number(gearRating);
  const known=gearRating!==null&&gearRating!==undefined&&gearRating!==''&&Number.isFinite(input)&&input>0;
  const current=known?Math.floor(input):null;
  const owned=Math.max(0,Math.floor(Number(earnedCrystals)||0));
  const unlocked=Number(characterLevel)>=45;
  const eligible=known&&current>=2600&&unlocked;
  const options=eligible?ARIEL_HARD_CONQUESTS.filter(d=>current>=d.itemLevel):[];
  let message='';
  if(!unlocked)message='Ariel opens at level 45; its crystals come from Hard Conquests requiring at least 2,600 Gear Rating.';
  else if(!known)message='Ariel fragments come from Hard Conquests at 2,600 GR (Krao Cave / Draupnir) and 2,700 GR (Urugugu / Vakron). Enter your in-game GR to check access.';
  else if(current<2600)message=`Ariel crystal farming requires 2,600 GR: ${2600-current} more GR needed. Keep any previously earned crystals when changing gear.`;
  else if(current<2700)message='Eligible for Krao Cave and Draupnir Hard (2,600 GR). Urugugu Canyon and Vakron Sky Island require 2,700 GR.';
  else message='GR meets the published entry minimum for all four Ariel-fragment Hard Conquests. Other entry restrictions may still apply.';
  if(owned&&!eligible)message+=' Previously earned or future-planned Ariel crystals remain recorded.';
  return Object.freeze({unlocked,gearRating:current,known,eligible,
    availableDungeons:options,owned,message});
}
