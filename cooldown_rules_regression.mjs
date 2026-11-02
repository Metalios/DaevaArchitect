// Global rules come from the project's imported game-client Specialty and
// Stigma tooltips. Test conditional outcomes, not invented proc probabilities.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const classes=JSON.parse(read('classes_data.json'));
const specs=JSON.parse(read('specialties.json'));
const stigma=JSON.parse(read('stigmas.json'));
const ctx=vm.createContext({});
vm.runInContext(read('js/engine/cooldown_rules.js')+'\n'+
  read('js/engine/global_actions.js')+'\n'+
  read('js/engine/combat_timeline.js')+
  '\nglobalThis.api={GlobalCooldownRules,GlobalActionData,GlobalTimelineEngine};',ctx);
const {GlobalCooldownRules:rules,GlobalActionData:actions,GlobalTimelineEngine:timeline}=ctx.api;
let analyzed=0,recognized=0;
for(const [cls,powers] of Object.entries(specs)){
  for(const [skill,detail] of Object.entries(powers)){
    assert(Object.values(classes[cls].skills).some(s=>s.name===skill));
    for(const [option,tooltip] of Object.entries(detail.options||{})){
      if(!/cooldown|resets?/i.test(tooltip))continue;
      analyzed++;
      const effect=rules.compileSpecialty(tooltip,cls,skill,option);
      if(effect)recognized++;
    }
  }
}
assert(analyzed>=60&&recognized>=40,
  'Unexpected drop in source-based cooldown rule extraction');
const selected={
  classId:'templar',
  effectiveLevels:{Pummel:12,'Vicious Strike':12,Judgment:20,'Shield Smite':12},
  specialties:{Pummel:[4],'Vicious Strike':[4],Judgment:[5],'Shield Smite':[4]},
  stigmaLevels:{'Doom Shield':5},equippedStigmas:['Doom Shield'],
  specData:specs.templar,stigmaData:stigma.templar
};
const t=rules.fromBuild(selected);
const p=t.effects.find(e=>e.skill==='Pummel'&&e.option===4);
assert.equal(p.type,'reduce');
assert.equal(p.target,'Punishment');
assert.equal(p.seconds,1);
assert.equal(p.event,'hit');
const doom=t.effects.find(e=>e.skill==='Doom Shield'&&e.rank===5);
assert.equal(doom.target,'Annihilate');
assert.equal(doom.type,'reset');
assert.equal(doom.event,'hit');
assert.equal(actions.cooldownWithSpecialties('templar','Shield Smite',12,
  {'Shield Smite':[4]},specs),8);
assert.equal(actions.cooldownWithSpecialties('templar','Shield Smite',12,
  {'Shield Smite':[5]},specs),10,
  'Do not treat a rank-gated/other option as a self cooldown reduction');
assert.equal(actions.cooldownWithSpecialties('templar','Pummel',12,
  {Pummel:[4]},specs),0,'Cross-skill cooldown reduction does not modify Pummel');
const noFree=rules.effectiveCooldown(5,'Judgment',t.effects);
assert.equal(noFree,5,
  'Removing the Judgment cooldown cannot remove its trigger requirement');
assert(t.warnings.some(w=>w.skill==='Judgment'));
assert(rules.eventRules('Pummel',t.effects).some(e=>e.target==='Punishment'));
const assassin=rules.fromBuild({
  classId:'assassin',effectiveLevels:{'Heart Gore':20},specialties:{'Heart Gore':[5]},
  specData:specs.assassin,stigmaData:stigma.assassin
});
assert(assassin.effects.some(e=>e.skill==='Heart Gore'&&e.event==='crit'&&e.type==='reset'));
const ranger=rules.fromBuild({
  classId:'ranger',effectiveLevels:{'Arrow Scattershot':20},
  specialties:{'Arrow Scattershot':[5]},specData:specs.ranger,stigmaData:stigma.ranger
});
assert(rules.eventRules('Arrow Scattershot',ranger.effects).some(e=>e.target==='*'));
const chance=rules.fromBuild({
  classId:'assassin',effectiveLevels:{'Whirlwind Slice':20},
  specialties:{'Whirlwind Slice':[5]},specData:specs.assassin,stigmaData:stigma.assassin
});
assert.equal(chance.effects.find(e=>e.skill==='Whirlwind Slice').probability,.25);
const action=(id,cd)=>({id,cooldown:cd,lockSeconds:.5,
  flatDamage:100,attackCoefficient:0,hits:1,timingSource:'scenario',damageSource:'scenario'});
{
  const base=timeline.simulate({abilities:[action('Pummel',0),action('Punishment',15)],
    priority:['Punishment','Pummel'],duration:22,attack:0});
  const enhanced=timeline.simulate({abilities:[action('Pummel',0),action('Punishment',15)],
    priority:['Punishment','Pummel'],duration:22,attack:0,cooldownRules:t.effects});
  assert.equal(base.ok,true);
  assert.equal(enhanced.ok,true);
  assert(enhanced.metrics.reductions>0,
    'On-hit Pummel Specialty must reduce the OTHER skill remaining cooldown');
  assert(enhanced.bySkill.Punishment.casts>base.bySkill.Punishment.casts);
}
{
  const ab=[action('A',10),action('B',10),action('C',10)];
  const r={skill:'A',type:'reduce',target:'*',seconds:2,
    event:'hit',conditional:false};
  const sim=timeline.simulate({abilities:ab,priority:['A','B','C'],
    duration:20,attack:0,cooldownRules:[r]});
  assert.equal(sim.ok,true);
  assert(sim.metrics.reductions>0,'All-skills on-hit reduction must update other skill cooldowns');
}
{
  const ab=[action('Reset',10),action('Burst',10)];
  const probability={skill:'Reset',target:'Burst',type:'reset',
    event:'crit',probability:.25};
  const unknown=timeline.simulate({abilities:ab,priority:['Burst','Reset'],
    duration:15,attack:0,cooldownRules:[probability]});
  assert.equal(unknown.ok,true);
  assert.equal(unknown.metrics.resets,0);
  const observed=timeline.simulate({abilities:ab,priority:['Burst','Reset'],
    duration:15,attack:0,cooldownRules:[probability],
    outcomes:{Reset:[{critical:true,procs:['Burst']}]}});
  assert(observed.metrics.resets>=1,
    'Only an explicitly observed random proc can cause a reset');
}
console.log('Validated '+recognized+'/'+analyzed+' tooltip cooldown matches across all 8 classes, plus cross-skill resets, caps and deterministic event order.');
