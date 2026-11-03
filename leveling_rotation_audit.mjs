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
  const expectedSteps=level<4?0:cls==='sorcerer'&&level>=10?(groundEquipped?3:2):cls==='ranger'&&level>=10?2:1;
  assert.equal(plan.steps.length,expectedSteps,cls+' Lv'+level+': expected '+expectedSteps+' macro step(s)');
  for(const group of plan.stacks){
    assert(group.stack.length>=1&&group.stack.length<=4,cls+' '+level+': invalid stack size');
    assert(group.stack.every(name=>(u[name]!==undefined&&u[name]<=level)||(stigmas[cls][name]&&equipped.includes(name)&&earned[name]>0)),cls+' '+level+': locked in '+group.key);
    assert(group.rows.every((row,i)=>row.row===i&&row.name===group.stack[i]));
  }
  assert.equal(new Set(plan.steps).size,plan.steps.length,'duplicate macro hotbar key');
  for(const group of plan.stacks)
    assert.equal(plan.steps.includes(group.key),group.macro,cls+' '+level+' wrong manual/automatic stack classification');
  assert(plan.manualKeys.length<=(cls==='sorcerer'||cls==='ranger'?8:4)&&
    plan.manualKeys.every(x=>x.name===null&&cls==='ranger'||
      (u[x.name]!==undefined&&u[x.name]<=level)||
      (stigmas[cls][x.name]&&earned[x.name]>0)),
    cls+' '+level+': unlearned manual ability');
  assert.equal(new Set(plan.manualKeys.map(x=>x.key)).size,plan.manualKeys.length,
    cls+' '+level+': duplicate manual key assignment');
  if(cls==='ranger')assert.deepEqual(
    Array.from(plan.manualKeys.slice(0,4).map(x=>x.key)),['1','2','3','4'],
    'Ranger must show reserved manual slots 1-4 without shifting learned actions');
  if(cls==='ranger'){
    const e=plan.stacks.find(group=>group.key==='E');
    const q=plan.stacks.find(group=>group.key==='Q');
    if(level>=4){
      assert(e,'Ranger must have an automatic E damage column at Lv'+level);
      assert.deepEqual(Array.from(e.stack),
        ['Gale Arrow','Drill Dart','Tempest Shot'].filter(name=>u[name]<=level),
        'Ranger E must preserve priority with repeatable Tempest last');
      assert.equal(e.stack.at(-1),'Tempest Shot','Ranger must never starve cooldown attacks with Tempest');
    }
    if(level>=10){
      assert(q,'Ranger must add Slow/condition stack at level 10');
      assert.deepEqual(Array.from(q.stack),['Snare Shot','Burst Arrow']);
      assert.equal(q.stack[0],'Snare Shot','Ranger slow must be attempted before Burst');
      assert(!q.stack.includes('Explosive Arrow'),'Unequipped Explosive Arrow must not be automated');
    }
    for(const name of ['Deadshot','Marking Shot','Arrow Scattershot'])
      assert(!plan.stacks.some(group=>group.stack.includes(name)),
        'Ranger manual charge/precision/stagger action automated: '+name);
    const binds={'Deadshot':'1','Marking Shot':'2','Arrow Scattershot':'3'};
    for(const [name,key] of Object.entries(binds))if(u[name]<=level)
      assert.equal(plan.manualKeys.find(entry=>entry.name===name)?.key,key,
        'Ranger '+name+' must retain its manual key as levels change');
  }
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
const rangerStigma=buildLevelingCombat('ranger',30,'solo',unlocks.ranger,
 ['Explosive Arrow',"Vaizel's Authority",'Bow of Blessing'],
 {'Explosive Arrow':5,"Vaizel's Authority":5,'Bow of Blessing':5});
assert.deepEqual(Array.from(rangerStigma.steps),['E','Q']);
assert.deepEqual(Array.from(rangerStigma.stacks[1].stack),
 ['Snare Shot','Explosive Arrow','Burst Arrow']);
assert(!rangerStigma.stacks.flatMap(group=>group.stack).includes('Deadshot'));
assert(rangerStigma.manualKeys.some(entry=>entry.name==="Vaizel's Authority"&&entry.key==='4'));
const rangerEarly=buildLevelingCombat('ranger',4,'solo',unlocks.ranger,[],{});
assert.deepEqual(Array.from(rangerEarly.steps),['E']);
assert.deepEqual(Array.from(rangerEarly.stack),['Drill Dart','Tempest Shot']);
const rangerTen=buildLevelingCombat('ranger',10,'solo',unlocks.ranger,[],{});
assert.deepEqual(Array.from(rangerTen.steps),['E','Q']);
const chanter=buildLevelingCombat('chanter',14,'solo',unlocks.chanter,[],{});
assert(!chanter.stack.includes('Spinning Strike'),'pre-reset Chanter must not waste trigger');
const chanterReset=buildLevelingCombat('chanter',44,'solo',unlocks.chanter,[],{},(name,opt)=>name==='Dark Crush'&&opt===5);
assert(chanterReset.stack.includes('Spinning Strike'),'Chanter should incorporate new trigger only after the Specialty');
console.log('Leveling macro policy: '+checks+' class/context/level cases passed; class-aware macro step counts and bottom-row priority verified.');
