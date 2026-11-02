import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(read('js/arcana_rules.js')+'\n'+read('js/ariel_data.js')+'\n'+read('js/ariel_progression.js')+'\nglobalThis.check={ARCANA_GRADES,ARCANA_SKILL_POOLS,arcanaLineCapacity,arcanaMaxEnhancement,arcanaValidBonuses,arcanaSkillPool,ARIEL,arielAccess,ARIEL_HARD_CONQUESTS};',ctx);
const {ARCANA_GRADES,ARCANA_SKILL_POOLS,arcanaLineCapacity,arcanaMaxEnhancement,arcanaValidBonuses,arcanaSkillPool,ARIEL,arielAccess,ARIEL_HARD_CONQUESTS}=ctx.check;
const classes=JSON.parse(read('classes_data.json'));
const expected={Common:[1,2,3],Rare:[2,3,4,4],Epic:[3,4,4,4,4],Unique:[4,4,4,4,4,4]};
for(const [grade,capacities] of Object.entries(expected)){
  assert.equal(arcanaMaxEnhancement(grade),capacities.length-1);
  for(let enhancement=0;enhancement<capacities.length;enhancement++)assert.equal(arcanaLineCapacity(grade,enhancement),capacities[enhancement]);
}
for(const [cls,skills] of Object.entries(classes)){
  const mastery=new Set(Object.values(skills.skills).map(x=>x.name));
  assert.equal(mastery.size,22);
  const pools=ARCANA_SKILL_POOLS[cls];
  assert.equal(Object.values(pools).flat().length,22);
  assert.equal(new Set(Object.values(pools).flat()).size,22);
  for(const card of ['parchment','compass','bell','mirror']){
    assert(pools[card].every(skill=>mastery.has(skill)));
    assert.equal(pools[card].length,card==='parchment'||card==='compass'?6:5);
  }
  assert.equal(arcanaSkillPool(cls,'chalice').length,22);
  const skill=pools.parchment[0],other=pools.compass[0];
  assert(arcanaValidBonuses(cls,'parchment','Rare',0,[{skill,levels:1}]));
  assert(arcanaValidBonuses(cls,'parchment','Rare',2,[{skill,levels:1}]));
  assert(!arcanaValidBonuses(cls,'parchment','Rare',0,[{skill:other,levels:1}]));
  assert(!arcanaValidBonuses(cls,'parchment','Rare',0,[{skill,levels:1},{skill,levels:1}]));
  assert(!arcanaValidBonuses(cls,'parchment','Rare',0,[{skill,levels:3}]));
  assert(arcanaValidBonuses(cls,'parchment','Unique',5,[{skill,levels:4}]));
  const board=ARIEL[cls];
  assert.equal(board.nodes.length,153);
  assert.equal(board.totalCost,232);
  assert.equal(board.nodes.reduce((a,n)=>a+n[5],0),232);
  assert.equal(board.nodes.filter(n=>n[5]===0).length,1);
  assert.equal(new Set(board.nodes.map(n=>n[0])).size,153);
  assert.equal(new Set(board.nodes.map(n=>n[1]+':'+n[2])).size,153);
}
// The latest Global client data uses +1.5% for Ariel's unique corners,
 // +3/+30 for flat attack/defense and four of each Critical and boss unique.
const globalTotals={PvEAmplifyDamage:600,PvEDecreaseDamage:600,
  PvEAddDamage:72,BossNpcAddDamage:72,PvEDamageDefense:720,BossNpcDefense:720,
  PvEAccuracy:120,PvEEvasion:120,Critical:40,CriticalResist:40,
  BossNpcAmplifyDamage:400,BossNpcDecreaseDamage:400,HPMax:400,MPMax:200};
for(const [cls,board] of Object.entries(ARIEL)){
  const totals={};
  for(const node of board.nodes)for(const [key,value] of node[6])totals[key]=(totals[key]||0)+value;
  assert.equal(JSON.stringify(Object.entries(totals).sort()),JSON.stringify(Object.entries(globalTotals).sort()),
    cls+': mismatched Global Ariel node effect magnitudes or distribution');
}
assert.equal(ARIEL_HARD_CONQUESTS.length,4);
assert.equal(arielAccess(2599,0,45).eligible,false);
assert.equal(arielAccess(2600,0,45).eligible,true);
assert.equal(arielAccess(2600,0,45).availableDungeons.length,2);
assert.equal(arielAccess(2700,0,45).availableDungeons.length,4);
assert.equal(arielAccess(2700,0,44).eligible,false);
assert.equal(arielAccess(0,12,45).owned,12,'Previously earned Ariel crystals must not disappear when GR is unknown');
assert.equal(arielAccess(2450,12,45).owned,12,'Lower GR must not erase historical Ariel purchases');
assert.equal(arielAccess('',0,45).known,false,'Unknown GR is not 0 or an invented eligibility claim');
// The board-tabs widget already renders the Ariel tab from allBoards().
// Never append a second disabled Ariel placeholder from the V2 overlay.
assert(!read('js/v2.js').includes('v2-ariel-pending'),
  'Remove obsolete Ariel pending UI rather than rendering a duplicate tab');
assert(read('js/app.js').includes('const available=allBoards();'),
  'Ariel and Azphel must be present in the board tab collection in every context');
console.log('Verified Arcana grade/line gates, all eight skill pools, and Ariel board shape/cost.');
