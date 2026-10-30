// Guard the independent leveling rules without requiring a browser.
// Macro rows must be ordered by readiness, stay within four slots, and respect
// the actual Global client's per-class unlock metadata.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const unlocks=JSON.parse(read('skill_unlocks.json')),rewards=JSON.parse(read('level_rewards.json'));
const stigmas=JSON.parse(read('stigmas.json'));
const ctx=vm.createContext({});
vm.runInContext(read('js/leveling_rotation.js')+'\nglobalThis.api={LEVELING_COMBAT,buildLevelingCombat};',ctx);
const {LEVELING_COMBAT,buildLevelingCombat}=ctx.api;
let checks=0;
for(const [cls,u] of Object.entries(unlocks)){
 const config=LEVELING_COMBAT[cls];
 assert(config,cls+': missing leveling config');
 assert.equal(u[config.weave],1,cls+': repeat attack unavailable initially');
 for(const name of [...config.stack,...config.manual,...(config.upgradedStacks||[]).flatMap(group=>group.stack)])assert(name in u||name in (stigmas[cls]||{}),cls+': skill not in class or Stigma data '+name);
 for(const context of ['solo','party'])for(let level=1;level<=45;level++){
  const earned=Object.fromEntries(Object.keys(stigmas[cls]).map(name=>[name,level>=23?1:0]));
  const slots=Number(rewards[level].slots);
  const equipped=Object.keys(stigmas[cls]).slice(0,slots);
  const plan=buildLevelingCombat(cls,level,context,u,equipped,earned,()=>false);
  assert.equal(plan.macroUnlocked,level>=4);
  const groundEquipped=cls==='sorcerer'&&equipped.some(name=>['Fire Wall','Cold Storm'].includes(name)&&earned[name]>0);
  const expectedSteps=level<4?0:cls==='sorcerer'&&level>=10?(groundEquipped?3:2):1;
  assert.equal(plan.steps.length,expectedSteps,cls+' Lv'+level+': expected '+expectedSteps+' macro step(s)');
  for(const group of plan.stacks){
    assert(group.stack.length>=1&&group.stack.length<=4,cls+' '+level+': invalid stack size');
    assert(group.stack.every(name=>(u[name]!==undefined&&u[name]<=level)||(stigmas[cls][name]&&equipped.includes(name)&&earned[name]>0)),cls+' '+level+': locked in '+group.key);
    assert(group.rows.every((row,i)=>row.row===i&&row.name===group.stack[i]));
  }
  assert.equal(new Set(plan.steps).size,plan.steps.length,'duplicate macro hotbar key');
  for(const group of plan.stacks)
    assert.equal(plan.steps.includes(group.key),group.macro,cls+' '+level+' wrong manual/automatic stack classification');
  assert(plan.manualKeys.length<=(cls==='sorcerer'?8:4)&&plan.manualKeys.every(x=>(u[x.name]!==undefined&&u[x.name]<=level)||(stigmas[cls][x.name]&&earned[x.name]>0)),cls+' '+level+': unlearned manual ability');
  if(cls==='sorcerer'){
   const automated=new Set(plan.stacks.filter(group=>group.macro).flatMap(group=>group.stack));
   for(const buff of ['Wish of Concentration','Element Enhancement','Delayed Explosion','Hellfire'])
    assert(!automated.has(buff),'Sorcerer Lv'+level+': buff or charged attack automated: '+buff);
   if(level>=8&&level>=10)assert(automated.has("Winter's Shackles"),'Shackles should cast automatically');
   if(level>=10)assert(automated.has('Flame Scattershot'),'Stagger finisher should cast automatically');
   if(level>=14)assert.equal(plan.manualKeys[0]?.name,'Hellfire','Sorcerer Hellfire should be key 1');
   if(level>=12)assert(plan.manualKeys.some(x=>x.name==='Wish of Concentration'),'Sorcerer Wish buff not manual');
  }
  assert(plan.manual.every(name=>u[name]<=level));
  assert(plan.rows.every((r,index)=>r.row===index&&r.name===plan.stack[index]));
  assert(!plan.stacks.flatMap(group=>group.stack).includes(plan.weave));
  const noCD=config.noCooldown||[];
  for(const group of plan.stacks)
    assert(!group.stack.some((name,i)=>noCD.includes(name)&&group.stack.slice(i+1).some(next=>!noCD.includes(next))),cls+' '+level+': no-CD shadowing');
  assert(plan.stigmas.length<=slots);
  checks++;
 }
}
const templar=buildLevelingCombat('templar',8,'solo',unlocks.templar,[],{});
assert.deepEqual(Array.from(templar.stack),['Judgment','Shield Smite','Warding Strike','Pummel']);
assert.deepEqual(Array.from(buildLevelingCombat('templar',8,'party',unlocks.templar,[],{}).stack),['Judgment','Shield Smite','Pummel']);
const sorc31=buildLevelingCombat('sorcerer',31,'solo',unlocks.sorcerer,[],{});
assert.deepEqual(Array.from(sorc31.steps),['Q','E']);
assert.deepEqual(Array.from(sorc31.stacks[0].stack),["Winter's Shackles",'Bittercold Wind','Frost','Firestorm']);
assert.deepEqual(Array.from(sorc31.stacks[1].stack),['Blaze','Frost Burst','Flame Scattershot']);
assert(sorc31.stacks.every(group=>group.macro));
assert.deepEqual(Array.from(sorc31.manualKeys.slice(0,2).map(x=>x.name)),['Hellfire','Wish of Concentration']);
assert(!sorc31.stacks.flatMap(x=>x.stack).includes('Hellfire'));
const sorcWithStigmas=buildLevelingCombat('sorcerer',34,'solo',unlocks.sorcerer,
 ['Element Enhancement','Delayed Explosion','Fire Wall'],
 {'Element Enhancement':1,'Delayed Explosion':1,'Fire Wall':1});
assert.deepEqual(Array.from(sorcWithStigmas.steps),['Q','E','R']);
assert(sorcWithStigmas.stacks[2].stack.includes('Fire Wall'));
assert(sorcWithStigmas.manualKeys.some(x=>x.name==='Element Enhancement'));
assert(sorcWithStigmas.manualKeys.some(x=>x.name==='Delayed Explosion'));
assert(!sorcWithStigmas.manualKeys.some(x=>x.name==='Fire Wall'));
assert(!sorcWithStigmas.stacks.flatMap(g=>g.stack).includes('Delayed Explosion'));
const sorcNoFields=buildLevelingCombat('sorcerer',36,'solo',unlocks.sorcerer,
 ['Element Enhancement','Delayed Explosion','Steel Barrier'],
 {'Element Enhancement':1,'Delayed Explosion':1,'Steel Barrier':1});
assert.deepEqual(Array.from(sorcNoFields.steps),['Q','E'],'No ground attacks equipped: no phantom R step');
const sorcReset=buildLevelingCombat('sorcerer',45,'solo',unlocks.sorcerer,[],{},
 (name,option)=>name==='Wish of Concentration'&&option===5);
assert.deepEqual(Array.from(sorcReset.steps),['Q','E']);
assert(!sorcReset.stacks.some(g=>g.stack.includes('Wish of Concentration')),
 'Actual cooldown-reset Specialty never auto-casts Wish');
const chanter=buildLevelingCombat('chanter',14,'solo',unlocks.chanter,[],{});
assert(!chanter.stack.includes('Spinning Strike'),'pre-reset Chanter must not waste trigger');
const chanterReset=buildLevelingCombat('chanter',44,'solo',unlocks.chanter,[],{},(name,opt)=>name==='Dark Crush'&&opt===5);
assert(chanterReset.stack.includes('Spinning Strike'),'Chanter should incorporate new trigger only after the Specialty');
console.log('Leveling macro policy: '+checks+' class/context/level cases passed; class-aware macro step counts and bottom-row priority verified.');
