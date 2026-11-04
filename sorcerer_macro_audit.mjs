// Endgame AION 2 Global Sorcerer macro safety and encounter regression tests.
// These are policy assertions, NOT a claim of measured DPS superiority.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const ctx=vm.createContext({isPvpContext: mode=>String(mode).startsWith('pvp')});
vm.runInContext(fs.readFileSync('js/engine/combat.js','utf8')+
  '\nglobalThis.engine=GlobalCombatEngine;',ctx);
vm.runInContext(fs.readFileSync('js/profiles.js','utf8')+
  '\nglobalThis.profile=PROFILES.sorcerer;',ctx);
vm.runInContext(fs.readFileSync('js/progression.js','utf8')+
  '\nglobalThis.rotation=progressionRotationProfile;',ctx);
const engine=ctx.engine;
const available=Object.keys(engine.ACTIONS).filter(name=>
  !['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm',
    'Divine Burst'].includes(name));
const stigma={
  'Element Enhancement':15,'Delayed Explosion':10,
  'Fire Wall':10,'Cold Storm':10,'Steel Barrier':5
};
const all=['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm'];
const makeBuild=(context,objective='performance',equippedStigmas=all)=>({
  context,objective,availableSkills:available,mastery:{
    'Flame Arrow':10,'Firestorm':12,'Blaze':10,'Hellfire':20,
    'Bittercold Wind':10,"Winter's Shackles":16,'Wish of Concentration':16,
    'Robe of Flame':10,'Grace of Enhancement':10,'Fire Mark':10
  },boardSkills:{},gearSkills:{},boardStats:{},gearStats:{},
  stigma,equippedStigmas,macroLayout:'flow',autoWish:false
});
const flatten=layout=>layout.stacks.flatMap(stack=>stack.skills);
const row=(layout,key)=>layout.stacks.find(stack=>stack.key===key)?.skills||[];
const locked=['Hellfire','Delayed Explosion','Defiance','Steel Barrier','Arctic Armor','Hibernation'];
const specs={
  'Firestorm':[4], // Five-projectile Hellfire cooldown reduction
  'Bittercold Wind':[2],
  'Frost Burst':[2],
  'Wish of Concentration':[5]
};
for(const objective of ['performance','sustained','burst','survivability']){
  const solo=engine.flowLayout(makeBuild('solo',objective),specs);
  const group=engine.flowLayout(makeBuild('party',objective),specs);
  assert(row(solo,'Q').includes('Firestorm'),'Solo must have fire core');
  assert(row(group,'Q').includes('Firestorm'),'Group must have fire core');
  assert(!row(solo,'E').includes('Fire Wall'),'Solo must not blindly auto-place ground damage');
  assert(!row(solo,'E').includes('Cold Storm'),'Solo ground storm must stay manual');
  for(const layout of [solo,group]){
    assert(layout.steps.length<=3,'Only Q/E/R supported');
    for(const stack of layout.stacks)assert(stack.skills.length>0&&stack.skills.length<=4);
    for(const name of locked)assert(!flatten(layout).includes(name),
      name+' must never enter repeated macro');
    assert(!flatten(layout).includes('Wish of Concentration'),
      'Reset Specialty always requires manual Wish');
  }
  if(objective==='performance'||objective==='sustained'){
    assert(row(group,'E').includes('Fire Wall'),
      'Conquest must retain equipped Fire Wall on E');
    assert(row(group,'E').includes('Cold Storm'),
      'Conquest must retain equipped Cold Storm on E');
    assert(row(group,'Q').includes('Bittercold Wind'),
      'Conquest must retain Bittercold Wind');
  }
  if(objective==='burst')
    assert(!row(group,'E').includes('Fire Wall'),
      'Conquest burst keeps ground placement manual');
}
const noMobile=engine.flowLayout(makeBuild('solo'),{});
assert(!flatten(noMobile).includes('Bittercold Wind'),
  'Unowned mobility Specialty must not auto-cast Bittercold in Nightmare');
assert(!flatten(noMobile).includes('Frost Burst'),
  'Unowned mobile Frost Burst must not enter Nightmare stack');
assert(!flatten(noMobile).includes("Winter's Shackles"),
  'Short burst debuff must stay manual');
const partial=engine.flowLayout(makeBuild('party','performance',
  ['Element Enhancement','Delayed Explosion','Steel Barrier']),{});
assert(!flatten(partial).includes('Fire Wall')&&!flatten(partial).includes('Cold Storm'),
  'No phantom unequipped Stigmas');
const sustained=engine.flowLayout(makeBuild('party','sustained'),{
  'Wish of Concentration':[]
});
assert(!flatten(sustained).includes('Wish of Concentration'),
  'Wish must not auto-cast unless policy decision explicitly enables it');
const auto=engine.flowLayout({...makeBuild('party','sustained'),autoWish:true},{
  'Wish of Concentration':[]
});
assert(flatten(auto).includes('Wish of Concentration'),
  'A reset-free sustained build can deliberately automate Wish');
const reset=engine.flowLayout({...makeBuild('party','sustained'),autoWish:true},specs);
assert(!flatten(reset).includes('Wish of Concentration'),
  'Reset Wish must remain manual even when auto is requested');
const chosen=engine.chooseMacro(makeBuild('party'),specs,[
  {id:'conquest-stationary',duration:30,movement:0,animation:1,weight:1}
]);
assert.equal(chosen.mode,'flow');
assert.equal(chosen.autoWish,false);
assert(!flatten(chosen).includes('Delayed Explosion'));
assert(flatten(chosen).includes('Fire Wall'));
assert(flatten(chosen).includes('Cold Storm'));
const fallback=ctx.rotation(ctx.profile,'sorcerer','party',()=>20,all,
  (name,option)=>name==='Wish of Concentration'&&option===5,'performance');
assert(fallback.stacks.some(stack=>stack.skills.includes('Fire Wall')));
assert(!fallback.stacks.some(stack=>stack.skills.includes('Delayed Explosion')));
const soloFallback=ctx.rotation(ctx.profile,'sorcerer','solo',()=>20,all,
  ()=>false,'performance');
assert(!soloFallback.stacks.some(stack=>stack.skills.includes('Fire Wall')));
console.log('Sorcerer Solo Nightmare / Group Conquest macro policy audit passed.');
