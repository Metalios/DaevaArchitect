import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const slots=[
  {id:'weapon',area:'left'},
  {id:'top',area:'left'},
  {id:'ring1',area:'left'},
  {id:'chalice',area:'arcana'},
  {id:'wings',area:'wings'}
];
const equipment={};
const context=vm.createContext({
  GEAR_SLOTS:slots,
  gearItemId:item=>item.href?.split('/').pop()?.split('-')[0]||'',
  gearEquipment:()=>equipment,
  gearIsActive:(slot,item)=>Boolean(item),
  clamp:(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0)),
  esc:text=>String(text).replaceAll('&','&amp;').replaceAll('<','&lt;'),
});
vm.runInContext(readFileSync('js/amplification.js','utf8'),context);
const call=(name,...args)=>vm.runInContext(`${name}(...args)`,vm.createContext({...context,args}));
// Functions are loaded into the original VM context and evaluated there.
const test=(expression)=>vm.runInContext(expression,context);
context.weapon=slots[0];
context.top=slots[1];
context.ring=slots[2];
context.arcana=slots[3];
context.wings=slots[4];
context.aulamus={name:'Aulamus Longsword',href:'/weapons/110230036-aulamus-longsword',itemLevel:70,grade:'Unique',enhancement:15,amplification:2};
assert.equal(test('gearAmplificationCap(weapon,aulamus)'),3);
assert.equal(test('gearAmplificationLevel(weapon,aulamus)'),2);
assert.equal(test('gearAmplificationStats(weapon,aulamus)[0].value'),20);
assert.equal(test('gearAmplificationStats(weapon,aulamus)[1].value'),2);
assert.match(test('gearAmplificationDiamonds(weapon,aulamus)'),/filled/);
assert.equal(test('(gearAmplificationDiamonds(weapon,aulamus).match(/class="filled"/g)||[]).length'),2);
assert.equal(test('(gearAmplificationDiamonds(weapon,aulamus).match(/class="empty"/g)||[]).length'),1);
assert.equal(test('gearAmplificationCap(weapon,{...aulamus,amplificationCap:5})'),3);
assert.equal(test('gearAmplificationLevel(weapon,{...aulamus,enhancement:14})'),0);
assert.equal(test('gearAmplificationCap(weapon,{...aulamus,itemLevel:86,href:"/other",name:"Unknown Sword"})'),5);
assert.equal(test('gearAmplificationCap(weapon,{...aulamus,itemLevel:78,href:"/other",name:"True Dragon Lord Longsword"})'),5);
assert.equal(test('gearAmplificationCap(arcana,aulamus)'),0);
assert.equal(test('gearAmplificationCap(wings,aulamus)'),0);
assert.equal(test('gearAmplificationCap(top,{...aulamus,grade:"Epic"})'),0);
context.custom={...context.aulamus,href:'/other',name:'Unknown Sword',itemLevel:86,amplificationCap:5,amplification:5,amplificationBonuses:{5:[{stat:'Attack',unit:'',value:75},{stat:'Damage Boost',unit:'%',value:5}]}};
assert.equal(test('gearAmplificationStats(weapon,custom)[0].value'),75);
assert.equal(test('gearParseAmplificationBonuses("Attack 30\\nDamage Boost 3%").length'),2);
assert.equal(test('gearParseAmplificationBonuses("Attack -5\\nUnknown 100\\nDamage Boost 1%").length'),1);
equipment.weapon=context.aulamus;equipment.top=context.custom;
assert.equal(test('gearAmplificationTotals().levels'),7);
assert.equal(test('gearAmplificationTotals().gearRating'),35);
assert.equal(test('gearAmplificationTotals().stats.find(x=>x.stat==="Attack").value'),95);
console.log('Global Amplification cap, rank, stat, star and totals checks passed.');
