// Regression: one PvP scoring policy drives all 8 class build components.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const json=path=>JSON.parse(read(path));
const DATA=json('classes_data.json'),STIGMAS=json('stigmas.json'),SPECS=json('specialties.json');
const app=read('js/app.js');
const pvpSource=read('js/engine/pvp_models.js');
const classSource=read('js/engine/class_models.js');
const ctx=vm.createContext({SPECS,STIGMAS,console});
vm.runInContext(read('js/engine/global_actions.js')+'\n'+pvpSource+'\n'+classSource+
 '\n'+app.slice(app.indexOf('/** One scoring policy'),app.indexOf('function templarPvpSpecialtySeed('))+
 '\nglobalThis.scoreBuild=contextCombatScore;globalThis.pvp=PvpCombatModels;',ctx);
const {scoreBuild,pvp}=ctx;
assert.equal(Object.keys(DATA).length,8);
const contexts=['pvp','pvp-arena','pvp-abyss-solo','pvp-abyss-group'];
let evaluated=0,scenarioSensitivity=0;
for(const classId of Object.keys(DATA)){
 const names=Object.values(DATA[classId].skills).map(skill=>skill.name);
 const equipped=Object.keys(STIGMAS[classId]).slice(0,4);
 const base={mastery:Object.fromEntries(names.map(name=>[name,8])),
  stigma:Object.fromEntries(equipped.map(name=>[name,10])),
  equippedStigmas:equipped,boardSkills:{},boardStats:{},gearSkills:{},gearStats:{},
  availableSkills:names,pvpOpponent:'all'};
 for(const context of contexts){
  const all=scoreBuild(classId,context,base),ranged=scoreBuild(classId,context,{...base,pvpOpponent:'ranger'});
  const melee=scoreBuild(classId,context,{...base,pvpOpponent:'gladiator'});
  for(const score of [all,ranged,melee])
   assert(Number.isFinite(score)&&score>0,classId+' '+context+' invalid PvP score');
  if(Math.abs(ranged-melee)>1e-8)scenarioSensitivity++;
  assert.equal(ranged,pvp.evaluate({classId,context,build:{...base,pvpOpponent:'ranger'}}).score);
  assert(scoreBuild(classId,context,{...base,boardStats:{PvPAmplifyDamage:300}})>all,
   classId+' '+context+' board offense ignored');
  evaluated++;
 }
}
assert.equal(evaluated,32);
assert(scenarioSensitivity>=24,'Opponent selection fails to affect most class/venue scores');
// Guard each connection point: these checks fail when a future refactor
// accidentally routes PvP back through the PvE-only combat proxy.
const uses=(app.match(/contextCombatScore\(/g)||[]).length;
assert(uses>=5,'Missing shared evaluator call sites');
assert.match(app,/score:\(names,levels\)=>\{[\s\S]*?contextCombatScore\(state\.class,a\.context,candidate,picks/);
assert.match(app,/const scoring=\(masteryRanks,stigmaRanks\)=>\{[\s\S]*?contextCombatScore\(state\.class,a\.context,proposed,picks/);
assert.match(app,/score:picks=>contextCombatScore\(state\.class,a\.context,fixed,picks/);
assert.match(app,/const alternate=optimizeBoardRoute\(data\(\),[\s\S]*?matchupSkills/);
assert.match(app,/const weights=activeWeights\(context\)\.stats/);
assert.match(app,/a\.pvpOpponent\|\|'all',BOARD_NAMES/);
assert.match(app,/a\.manualMastery\?manualAllocation/);
assert.match(app,/pinMastery:!!a\.manualMastery/);
assert.match(app,/pinStigma:!!a\.manualStigma/);
console.log('PASS: 8 classes x 4 PvP venues, opponent-aware shared scorer, board/gear sensitivity, and all component integration points.');
