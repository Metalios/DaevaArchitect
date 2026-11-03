// Deterministic PvP matchup policy regression: 8 classes x 4 modes x 8 foes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
const json = path => JSON.parse(read(path));
const DATA=json('classes_data.json'), STIGMAS=json('stigmas.json'),
  SPECS=json('specialties.json'), evidence=json('research/pvp-observations.json');
const ctx={SPECS,STIGMAS,console};
vm.createContext(ctx);
vm.runInContext(read('js/engine/global_actions.js')+
  '\n'+read('js/engine/pvp_models.js')+'\nglobalThis.PVP=PvpCombatModels;',ctx);
const pvp=ctx.PVP;
const modes=['pvp','pvp-arena','pvp-abyss-solo','pvp-abyss-group'];
assert.equal(evidence.observations.length,17);
assert.equal(Object.keys(pvp.OPPONENTS).length,8);
const expected=new Set(Object.keys(DATA));
assert.deepEqual(new Set(Object.keys(pvp.KITS)),expected);
const build=(cls,stigmas,opponent='all')=>({
  mastery:Object.fromEntries(Object.values(DATA[cls].skills).map(s=>[s.name,10])),
  boardSkills:{},gearSkills:{},boardStats:{},gearStats:{},
  equippedStigmas:stigmas,stigma:Object.fromEntries(stigmas.map(n=>[n,10])),
  availableSkills:Object.values(DATA[cls].skills).map(s=>s.name),
  pvpOpponent:opponent
});
let evaluations=0;
for(const cls of Object.keys(DATA)){
  const sample=evidence.observations.find(x=>x.classId===cls);
  assert(sample,'Missing Global PvP sample '+cls);
  assert.equal(sample.performanceValidated,false);
  for(const s of sample.stigmas)assert(STIGMAS[cls][s],'Unknown sample '+cls+' '+s);
  const state=build(cls,sample.stigmas);
  for(const mode of modes){
    for(const foe of Object.keys(pvp.OPPONENTS)){
      const result=pvp.evaluate({classId:cls,context:mode,build:{...state,pvpOpponent:foe}});
      assert(Number.isFinite(result.score)&&result.score>0,cls+' '+mode+' '+foe);
      assert.equal(result.scenarios.length,1);
      assert.equal(result.scenarios[0].opponent,foe);
      assert(!/win rate/i.test(result.classification.split(';')[0]),'Uncalibrated model must not claim win-rate');
      evaluations++;
    }
    const all=pvp.evaluate({classId:cls,context:mode,build:state});
    const ranged=pvp.evaluate({classId:cls,context:mode,build:{...state,pvpOpponent:'ranged'}});
    assert.equal(all.scenarios.length,8);
    assert.equal(ranged.scenarios.length,4);
    assert(pvp.evaluate({classId:cls,context:mode,build:{...state,boardStats:{PvPAmplifyDamage:500}}}).score>all.score,
      cls+' '+mode+' offense board should matter');
    assert(pvp.evaluate({classId:cls,context:mode,build:{...state,boardStats:{PvPDecreaseDamage:500}}}).score>all.score,
      cls+' '+mode+' defense board should matter');
  }
}
// A melee Templar cannot be treated as having unchanged contact against a
// kiting ranged target; mobility and control perks must affect the projection.
const templar=build('templar',['Doom Shield','Grapple','Shield of Protection','Second Skin'],'ranger');
const tScore=pvp.evaluate({classId:'templar',context:'pvp-arena',build:templar});
const versusMelee=pvp.evaluate({classId:'templar',context:'pvp-arena',
  build:{...templar,pvpOpponent:'gladiator'}});
assert(tScore.scenarios[0].components.contact<versusMelee.scenarios[0].components.contact);
const withoutGrapple={...templar,equippedStigmas:['Doom Shield','Nezekan\'s Shield','Shield of Protection','Second Skin'],
  stigma:{...templar.stigma,Grapple:0,'Nezekan\'s Shield':10}};
assert(pvp.evaluate({classId:'templar',context:'pvp-arena',build:withoutGrapple}).scenarios[0].components.contact<
  tScore.scenarios[0].components.contact);
const options=pvp.evaluate({classId:'templar',context:'pvp-arena',build:templar,
  selectedSpecs:{'Debilitating Smash':[3]}});
const noOption=pvp.evaluate({classId:'templar',context:'pvp-arena',build:templar,
  selectedSpecs:{'Debilitating Smash':[2]}});
assert(options.metrics.antiheal>noOption.metrics.antiheal,
  'Templar anti-healing specialty must be valued');
// PvP support and pet pressure are not free substitutes for raw survivability.
const cleric=build('cleric',['Salvation','Absolution','Light of Protection',"Yustiel's Power"]);
assert(pvp.evaluate({classId:'cleric',context:'pvp-abyss-group',build:cleric}).metrics.team>0);
const spirit=build('spiritmaster',["Enhance: Spirit's Benediction",'Summon: Ancient Spirit','Seize Magic','Command: Proxy']);
const withPet=pvp.evaluate({classId:'spiritmaster',context:'pvp-arena',build:spirit});
const noPet=pvp.evaluate({classId:'spiritmaster',context:'pvp-arena',
  build:{...spirit,stigma:{...spirit.stigma,'Summon: Ancient Spirit':0}}});
assert(withPet.metrics.pressure>noPet.metrics.pressure);
assert(pvp.skillPriority('templar','pvp-arena','ranger','Poach')>
  pvp.skillPriority('templar','pvp-arena','templar','Poach'));
assert(pvp.statPriority('templar','pvp-arena','ranger','AbnormalAccuracy')>
  pvp.statPriority('templar','pvp-arena','gladiator','AbnormalAccuracy'));
for(const mode of modes)assert(pvp.isPvp(mode));
assert.equal(pvp.isPvp('party'),false);
console.log('Validated '+evaluations+' class/mode/foe scenarios, gear stats, skills, anti-heal, pet pressure and melee contact.');
