// Global full-build legality: actual Soul Bind +1, Arcana +1..4, rank
// thresholds, fixed divine stats and all twelve Templar Specialty effects.
// Model weights are comparative, not measured PvP time-to-kill.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const DATA=JSON.parse(read('classes_data.json'));
const SPECS=JSON.parse(read('specialties.json'));
const STIGMAS=JSON.parse(read('stigmas.json'));
const state={class:'templar'};
const accountData={equipment:{
  weapon:{grade:'Unique',skillBonuses:[{skill:'Judgment',levels:2}]},
  ring1:{grade:'Unique',skillBonuses:[{skill:'Judgment',levels:1}]},
  helm:{grade:'Unique',statNotes:'Attack +15, PvP Damage Boost 2%',
    skillBonuses:[{skill:'Judgment',levels:1},{skill:'Fury',levels:1}]},
  chalice:{name:'Arcana: Chalice of Vigor',grade:'Unique',enhancement:0,
    skillBonuses:[{skill:'Judgment',levels:1},{skill:'Poach',levels:1}]},
  parchment:{name:'Arcana: Parchment of Magic',grade:'Unique',enhancement:0,
    skillBonuses:[{skill:'Judgment',levels:1}]},
  bell:{name:'Arcana: Bell of Magic',grade:'Unique',enhancement:0,
    skillBonuses:[{skill:'Punishing Benediction',levels:1}]}
}};
const ctx=vm.createContext({
  DATA,SPECS,STIGMAS,GEAR_CATALOG:{items:[]},state,
  account:()=>accountData,currentLevel:()=>45,
  clamp:(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0)),
  gearAmplificationCap:()=>0,gearAmplificationLevel:()=>0,
  data:()=>DATA.templar,console
});
vm.runInContext(read('js/arcana_rules.js')+'\n'+read('js/gear.js')+
  '\n'+read('js/engine/global_actions.js')+
  '\n'+read('js/engine/pvp_models.js')+
  '\nglobalThis.check={gearSkillLevels,gearRolledStatTotals,gearSlotSkillPool,'+
  'arcanaDivineTotals,PvpCombatModels,arcanaValidBonuses};',ctx);
const {gearSkillLevels,gearRolledStatTotals,gearSlotSkillPool,
  arcanaDivineTotals,PvpCombatModels:pvp,arcanaValidBonuses}=ctx.check;
const skills=gearSkillLevels();
assert.equal(skills.Judgment,5,
  'Recorded weapon +2, ring +1 and valid Chalice/Parchment +1 must add; invalid helmet Judgment excluded');
assert.equal(skills.Fury,1);
assert.equal(skills.Poach,1);
assert.equal(skills['Punishing Benediction'],1);
accountData.equipment.ring1.skillBonuses=[{skill:'Judgment',levels:3}];
assert.equal(gearSkillLevels().Judgment,7,
 'Gear item with recorded +3 must preserve all three levels (not flatten to +1)');
accountData.equipment.ring1.skillBonuses=[{skill:'Judgment',levels:1}];
assert.equal(gearSkillLevels().Judgment,5,
 'Replacing item bonus with +1 must decrease the effective rank by exactly 2');

const rolls=gearRolledStatTotals().stats;
assert(rolls.some(row=>row.name==='Attack'&&row.value===15));
assert(rolls.some(row=>row.name==='PvP Damage Boost'&&row.unit==='%'&&row.value===2));
const divine=arcanaDivineTotals(accountData.equipment);
assert.equal(divine.stats.Time,20);
assert.equal(divine.stats.Destiny,20);
assert.equal(divine.stats.Destruction,20);
assert.equal(divine.sets.Magic,2);
assert.equal(gearSlotSkillPool({id:'helm',area:'left'}).includes('Judgment'),false);
assert.equal(gearSlotSkillPool({id:'weapon',area:'left'}).includes('Fury'),false);
const duplicate=[
  {skill:'Judgment',levels:1},{skill:'Judgment',levels:1}
];
assert(!arcanaValidBonuses('templar','chalice','Unique',0,duplicate),
  'A full card may not contain the same skill twice');
accountData.equipment.chalice.skillBonuses=duplicate;
assert.equal(gearSkillLevels().Judgment,4,
  'An invalid whole Arcana must give ZERO skill levels, not two line-by-line successes');
accountData.equipment.chalice.skillBonuses=[
 {skill:'Judgment',levels:1},{skill:'Poach',levels:1}
];

const active=Object.values(DATA.templar.skills).map(s=>s.name);
const skillRanks=Object.fromEntries(active.map(name=>[name,10]));
const stigmas=['Doom Shield','Grapple','Executing Blade','Shield of Protection'];
const baseline={mastery:skillRanks,boardSkills:{Judgment:4},
  gearSkills:{},boardStats:{},gearStats:{},
  equippedStigmas:stigmas,stigma:Object.fromEntries(stigmas.map(name=>[name,10])),
  availableSkills:active,pvpOpponent:'ranged'};
const score=(build,specialties={})=>pvp.evaluate({
  classId:'templar',context:'pvp-abyss-solo',
  build,selectedSpecs:specialties
}).score;
assert.equal(Object.keys(pvp.OPTIONS.templar).length,12,
 'Every active Templar skill needs a modeled Specialty set');
assert(score({...baseline,arcanaDivine:divine.stats})>score(baseline),
 'Actual Global Arcana divine multipliers must affect burst');
const withGear={...baseline,gearSkills:{Judgment:2}};
assert(score(withGear,{'Judgment':[5]})>score(baseline,{'Judgment':[5]}),
 'Judgment Lv16 Specialty may activate from +gear or Arcana; Lv14 may not');
assert(score(withGear,{'Judgment':[3,5]})>score(withGear,{'Judgment':[3,1]}),
 'Judgment cooldown-removal option matters in burst evaluation');
assert(score(withGear,{'Punishment':[3,5]})>score(withGear,{'Punishment':[1,2]}),
 'Punishment speed and guaranteed critical/ignore-block must be rewarded');
assert(score({...withGear,gearSkills:{...withGear.gearSkills,
   'Shield Rush':6}}, {'Shield Rush':[2,4]})>
 score({...withGear,gearSkills:{...withGear.gearSkills,
   'Shield Rush':6}}, {'Shield Rush':[1,3]}),
 'Gear-induced ranged charge Specialty must count');
console.log('Global Arcana divine & full skill effects, Soul Binding rolls, 12 Templar Specialty sets and effective gates pass.');
