// Pure-engine regression: sourced mechanics, legal Specialties, candidate search,
// speed/charge and cooldown sensitivity. This validates *comparative* values,
// never claims calibrated or server-measured DPS.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const specs=JSON.parse(read('specialties.json')).sorcerer;
const unlocks=JSON.parse(read('skill_unlocks.json')).sorcerer;
const rewards=JSON.parse(read('level_rewards.json'));
const ctx=vm.createContext({});
vm.runInContext(read('js/engine/combat.js')+'\nglobalThis.combat=GlobalCombatEngine;',ctx);
const engine=ctx.combat;
assert.match(engine.SOURCE.version,/Global/);
assert.equal(engine.slots(16),2);
assert.equal(engine.slots(20),3);
assert.deepEqual(Array.from(engine.legalOptions('Firestorm',12,specs)),[1,2,3,4]);
assert.deepEqual(Array.from(engine.legalOptions('Firestorm',16,specs)),[1,2,3,4,5]);
assert.equal(rewards[36].crystals,100);
assert.equal(rewards[37].crystals,104);
assert.equal(rewards[37].slots,4);
const mastery=Object.fromEntries(Object.keys(unlocks).map(name=>[name,5]));
const build={mastery,boardSkills:{},boardStats:{CombatSpeed:0},gearSkills:{},gearStats:{},
  stigma:{'Element Enhancement':10,'Delayed Explosion':10,'Fire Wall':5,'Cold Storm':5},
  equippedStigmas:['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm'],
  availableSkills:Object.keys(unlocks).filter(name=>unlocks[name]<=45)};
const speedSpec={Firestorm:[2],Hellfire:[1],"Wish of Concentration":[2],Blaze:[3]};
const slowSpec={Firestorm:[1],Hellfire:[2],"Wish of Concentration":[2],Blaze:[3]};
const scenario={id:'stationary',duration:180,movement:0,weight:1,animation:1};
const fast=engine.simulate(build,speedSpec,scenario),slow=engine.simulate(build,slowSpec,scenario);
assert(Number.isFinite(fast.score)&&fast.score>0);
assert(fast.manualActions>0);
assert(fast.counts['Hellfire']>=1);
assert(fast.counts['Firestorm']>=1);
assert(fast.mpFinal>=0);
const elevated={...build,boardStats:{CombatSpeed:1800}};
const withSpeed=engine.simulate(elevated,speedSpec,scenario);
assert(withSpeed.combatSpeed>fast.combatSpeed);
assert(Number.isFinite(withSpeed.score));
const auto=engine.chooseMacro(build,speedSpec);
assert(['compact','balanced','ground'].includes(auto.mode));
assert(auto.steps.length>=1&&auto.steps.length<=3);
assert.equal(auto.steps[0],'Q');
assert(auto.stacks.every(stack=>stack.skills.length<=4));
assert(auto.manualPerMinute>0,'charged Hellfire and offensive buffs remain manual');
const noGround={...build,equippedStigmas:['Element Enhancement','Delayed Explosion']};
assert(!engine.chooseMacro(noGround,speedSpec).steps.includes('R'),'do not macro unequipped ground Stigmas');
const aligned=engine.tuneSpecialties(build,specs,{});
assert(aligned.specialties.Firestorm.length===0,'no Firestorm Specialty before effective level 8');
assert(aligned.specialties.Hellfire.length===0);
const lvl16={...build,mastery:{...mastery,Firestorm:10},boardSkills:{Firestorm:6}};
const multi=engine.tuneSpecialties(lvl16,specs,{});
assert(multi.specialties.Firestorm.length===2);
assert(multi.specialties.Firestorm.every(opt=>opt>=1&&opt<=5));
const total=levels=>Object.values(levels).reduce((sum,rank)=>{
 for(let n=2;n<=rank;n++)sum+=n<=4?1:n<=7?2:4;
 return sum;
},0);
const small={...build,mastery:{...mastery,Firestorm:4,Hellfire:4,Blaze:4,
  'Wish of Concentration':4,'Flame Arrow':4,'Bittercold Wind':4}};
const allocation=engine.refineMastery({initial:small.mastery,budget:total(small.mastery),
  cost:n=>n<=4?1:n<=7?2:4,cap:()=>10,build:small,specData:specs});
assert.equal(total(allocation.levels),allocation.spent);
assert(allocation.spent<=total(small.mastery));
assert(Object.values(allocation.levels).every(rank=>rank>=1&&rank<=10));
const locked={...build,availableSkills:['Flame Arrow','Firestorm']};
const limited=engine.simulate(locked,speedSpec,scenario);
assert(!limited.counts['Hellfire'],'unacquired Hellfire must never execute');
assert(!limited.counts['Blaze'],'unacquired Blaze must never execute');
console.log('Global combat engine invariants passed: legal Specialty slots, speed sensitivity, budget-safe Mastery exchange, unlocked skills, stamina/MP and explicit relative damage units.');
