// Global rotations: 8 classes x 4 PvP venues x 11 enemy selections.
// These checks defend safe mechanics and user ownership, not optimal DPS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const json=p=>JSON.parse(read(p));
const DATA=json('classes_data.json'),STIGMAS=json('stigmas.json');
const ctx=vm.createContext({DATA,STIGMAS,console});
vm.runInContext(read('js/rotation_policy.js')+
 '\nglobalThis.policy=GlobalRotationPolicy;',ctx);
vm.runInContext(read('js/custom_macro.js')+
 '\nglobalThis.editor=CustomMacroEditor;',ctx);
const {policy,editor}=ctx;
const classes=Object.keys(DATA),modes=['pvp','pvp-arena','pvp-abyss-solo','pvp-abyss-group'];
const foes=['all','ranged','melee',...classes];
assert.equal(classes.length,8);
assert.equal(foes.length,11);
let checks=0;
for(const cls of classes){
 const skills=Object.values(DATA[cls].skills).slice(0,12).map(s=>s.name);
 const equipped=cls==='templar'?['Doom Shield','Grapple','Executing Blade','Shield of Protection']:
   Object.keys(STIGMAS[cls]).slice(0,4);
 const available=new Set([...skills,...equipped]);
 for(const mode of modes)for(const foe of foes){
   const base={weave:skills[0],stacks:[],macro:[],hotbar:[],stigmas:equipped};
   const p=policy.pvpProfile(base,cls,mode,foe,equipped,[...available]);
   assert(p.summary.length>30&&p.rule.length>30,cls+' '+mode+' no scenario rationale');
   assert(p.macro.length>=1,cls+' '+mode+' needs safe pressure column');
   assert(p.macro.every(key=>p.stacks.some(x=>!x.manual&&x.key===key)),
      cls+' '+mode+' references unassigned macro key');
   assert(!p.macro.includes('1')&&!p.macro.includes('2'),'PVP cannot loop direct manual keys');
   assert.equal(p.hotbar.length,8);
   assert(equipped.every(name=>p.hotbar.some(([names])=>names.includes(name))),
      cls+' '+mode+' dropped equipped Stigma');
   const unsafe=policy.manualSkills(cls,{pvp:true});
   for(const stack of p.stacks.filter(x=>!x.manual)){
     assert(stack.skills.length<=4);
     assert(stack.skills.every(name=>available.has(name)),cls+' unknown skill');
     assert(stack.skills.every(name=>!unsafe.has(name)),
       cls+' '+mode+' automatically uses unsafe charged/heal/movement/CC skill');
     assert.deepEqual([...stack.skills],Array.from(policy.prioritize(cls,stack.skills)),
       cls+' '+mode+' has filler starving cooldown action');
   }
   if(cls==='templar'&&mode==='pvp-abyss-solo'){
     assert(!p.macro.includes('Q'),'Manual Grapple may not be held');
     assert(p.stacks.some(x=>x.manual&&x.key==='Q'&&x.skills.join('|')==='Grapple|Executing Blade'));
     assert(!p.stacks.some(x=>x.skills.includes('Punishment')),
       'Charged Punishment must have its own held key');
   }
   checks++;
 }
}
const noCash=policy.cleanSuggestedStacks('gladiator','party',[
 {key:'E',skills:['Rending Blow','Ruinous Blow']},
 {key:'Q',skills:['Leaping Slam','Overhead Slam']}
],['Rending Blow','Ruinous Blow','Leaping Slam','Overhead Slam']);
assert.deepEqual(Array.from(noCash[0].skills),['Ruinous Blow','Rending Blow'],
 'Rending Blow zero-CD filler must not starve Ruinous Blow');
assert.deepEqual(Array.from(noCash[1].skills),['Overhead Slam']);
const odd=policy.cleanSuggestedStacks('ranger','party',[
 {key:'Q',skills:['Deadshot','Tempest Shot','Drill Dart','Tempest Shot']}
],['Deadshot','Tempest Shot','Drill Dart']);
assert.deepEqual(Array.from(odd[0].skills),['Drill Dart','Tempest Shot']);
const s=editor.normalize({stacks:{Q:['Hellfire']},
 steps:[{key:'Q',delay:9900},{key:'Q',delay:13000},{key:'Q',delay:1}],
 hotbar:[],weave:'Flame Arrow'},'sorcerer');
assert.deepEqual(Array.from(s.steps.map(x=>x.delay)),[9900,9900,10],
 'Macro delay must support documented 10–9900ms bound');
const markup=read('js/app.js');
assert.match(markup,/GlobalRotationPolicy\.pvpProfile\(/);
assert.match(markup,/GlobalRotationPolicy\.cleanSuggestedStacks\(/);
assert.match(markup,/CustomMacroEditor\.apply\(sourceStacks,plan\.steps,manual/);
assert.match(markup,/CustomMacroEditor\.render\(\);CustomMacroEditor\.listen\(\)/);
console.log('PASS '+checks+' class/venue/opponent policies, safer filler order, 10–9900ms macro delay, editable leveling integration.');
