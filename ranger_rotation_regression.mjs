// Ranger Global rotation acceptance: endgame profiles, optional Stigma,
// condition ordering, no repeatable-filler starvation, and manual charged DPS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=name=>fs.readFileSync(new URL(name,import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(read('js/profiles.js')+'\n'+read('js/progression.js')+
  '\nglobalThis.testApi={PROFILES,progressionRotationProfile};',ctx);
const {PROFILES,progressionRotationProfile}=ctx.testApi;
for(const mode of ['solo','party']){
 for(const equipped of [[],['Explosive Arrow'],['Griffon Arrow'],["Vaizel's Authority",'Explosive Arrow']]){
  const p=progressionRotationProfile(PROFILES.ranger,'ranger',mode,()=>16,equipped);
  assert.deepEqual(Array.from(p.macro),['E','Q']);
  const e=p.stacks.find(stack=>stack.key==='E');
  const q=p.stacks.find(stack=>stack.key==='Q');
  assert.deepEqual(Array.from(e.skills),['Gale Arrow','Drill Dart','Tempest Shot']);
  assert.deepEqual(Array.from(q.skills),['Snare Shot',
    ...(equipped.includes('Explosive Arrow')?['Explosive Arrow']:[]),'Burst Arrow']);
  assert(!p.stacks.filter(stack=>!stack.manual).flatMap(stack=>stack.skills)
    .some(skill=>['Deadshot','Marking Shot','Arrow Scattershot','Griffon Arrow'].includes(skill)));
  assert(p.hotbar.some(([skills])=>skills.includes('Deadshot')));
  assert(p.hotbar.some(([skills])=>skills.includes('Marking Shot')));
 }
}
console.log('Ranger endgame rotations: 8 context/equipment combinations passed.');
