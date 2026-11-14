// No DOM/browser dependency: offline multi-stage model regression.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const memory=new Map();let ids=0;
const makeAccount=()=>({buildMode:'custom',boardMode:'custom',context:'party',journey:'endgame',
  mastery:285,stigma:90,crystals:218,azphel:44,ariel:0,gearRating:2530,
  manualMastery:{Pummel:8},manualStigma:{'Doom Shield':10},
  customStigmas:['Doom Shield',null,null,null],customNodes:[111,112],customAzphelNodes:[],
  customArielNodes:[],equipment:{weapon:{name:'Longsword',enhancement:15,stones:[{stat:'Attack',value:10}]}},
  customMacros:{'endgame:party':{stacks:{Q:['Judgment']},steps:[{key:'Q',delay:50}]}},
  customSpecialties:{Pummel:[1]},titlesOwned:{title1:true},cpAnchor:{secret:true}});
const context=vm.createContext({
  console,Date,Math,JSON,crypto:{randomUUID:()=>`uuid-${++ids}`},
  localStorage:{getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)},
  document:{readyState:'loading',addEventListener(){},querySelectorAll(){return[]}},
  CLASS_ORDER:['templar','sorcerer'],PROFILES:{templar:{name:'Templar'},sorcerer:{name:'Sorcerer'}},
  GEAR_SLOTS:[{id:'weapon',name:'Weapon'},{id:'ring1',name:'Ring 1'}],
  DEFAULT_ACCOUNT:()=>makeAccount(),
  state:{class:'templar',accounts:{templar:makeAccount()},tab:'overview',board:'Nezekan'},
  previewRecommendedBuild:()=>({mastery:{Pummel:16},stigma:{'Doom Shield':10},stigmas:['Doom Shield',null,null,null],
    specialties:{Pummel:[1]},customNodes:[123],customAzphelNodes:[],customArielNodes:[]}),
  render(){},window:{},
  setTimeout(){}
});
vm.runInContext(read('js/build_library.js')+'\nglobalThis.library=DaevaBuildLibrary;',context);
const {library,state}=context;
assert.equal(library.getData().builds.length,0);
const main=library.addBuild('Templar tank');
assert.equal(library.getData().builds.length,1);
assert.equal(library.activeFor('templar').stage.name,'Current setup');
assert.equal(library.activeFor('templar').stage.account.cpAnchor,undefined,'Private CP anchor leaked into snapshot');
const first=main.stages[0].id;
state.accounts.templar.manualMastery.Pummel=12;
state.accounts.templar.equipment.weapon.enhancement=16;
library.onWorkspaceSave();
assert.equal(library.getData().builds[0].stages[0].account.manualMastery.Pummel,12,'Auto-save missed manual edit');
const second=library.addStage(main.id,'Nightmare DPS');
assert.equal(library.activeFor('templar').stage.id,second.id);
state.accounts.templar.manualMastery.Pummel=20;
state.accounts.templar.equipment.weapon.stones[0].value=20;
state.accounts.templar.customMacros['endgame:party'].steps[0].delay=100;
library.onWorkspaceSave();
library.load(main.id,first);
assert.equal(state.accounts.templar.manualMastery.Pummel,12,'Stage did not restore independently');
assert.equal(state.accounts.templar.equipment.weapon.stones[0].value,10);
assert.equal(state.accounts.templar.customMacros['endgame:party'].steps[0].delay,50);
const snapshot=library.getData().builds[0];
const changes=library.differences(snapshot.stages[0].account,snapshot.stages[1].account,'templar');
assert(changes.some(x=>x.section==='Mastery'&&x.label==='Pummel'));
assert(changes.some(x=>x.section==='Equipment'&&x.label.includes('socket')));
assert(changes.some(x=>x.section==='Macros'&&x.label==='endgame:party'));
const copy=library.duplicateBuild(main.id);
assert.equal(copy.stages.length,2);
assert.notEqual(copy.id,main.id);
assert.notEqual(copy.stages[0].id,first);
library.renameBuild(copy.id,'Templar PvP');
library.renameStage(copy.id,copy.stages[0].id,'Arena');
assert.equal(library.getData().builds.find(x=>x.id===copy.id).stages[0].name,'Arena');
library.updateNotes(main.id,first,{notes:'Defensive Arcana first',targetGearRating:'2800'});
assert.equal(library.getData().builds.find(x=>x.id===main.id).stages[0].targetGearRating,2800);
library.detach('templar');
assert.equal(library.activeFor('templar'),null);
library.load(copy.id,copy.stages[0].id);
library.removeStage(copy.id,copy.stages[1].id);
assert.equal(library.getData().builds.find(x=>x.id===copy.id).stages.length,1);
library.removeBuild(copy.id);
assert.equal(library.activeFor('templar'),null);
const legacy=makeAccount();legacy.buildMode='recommended';legacy.boardMode='recommended';
state.accounts.templar=legacy;
const saved=library.addBuild('Explicit recommendation snapshot');
assert.equal(saved.stages[0].account.buildMode,'custom');
assert.equal(saved.stages[0].account.manualMastery.Pummel,16);
assert.equal(saved.stages[0].account.customNodes[0],123);
assert.deepEqual(Object.keys(saved.stages[0].account).includes('cpAnchor'),false);
console.log('PASS build library: autosave, multi-stage isolation, full equipment/macro/board snapshots, diff, notes, duplicate, rename, delete, privacy and frozen recommendations.');