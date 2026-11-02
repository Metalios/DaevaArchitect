import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(read('js/arcana_rules.js')+'\n'+read('js/ariel_data.js')+'\nglobalThis.check={ARCANA_GRADES,ARCANA_SKILL_POOLS,arcanaLineCapacity,arcanaMaxEnhancement,arcanaValidBonuses,arcanaSkillPool,ARIEL};',ctx);
const {ARCANA_GRADES,ARCANA_SKILL_POOLS,arcanaLineCapacity,arcanaMaxEnhancement,arcanaValidBonuses,arcanaSkillPool,ARIEL}=ctx.check;
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
console.log('Verified Arcana grade/line gates, all eight skill pools, and Ariel board shape/cost.');
