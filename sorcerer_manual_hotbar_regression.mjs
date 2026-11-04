// Validate complete Sorcerer Global PvE manual hotbars independent of
// simulator score or hardcoded default Stigma names.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const ctx=vm.createContext({});
vm.runInContext(read('js/progression.js')+
  '\nglobalThis.makeSorcererHotbar=sorcererPveManualHotbar;',ctx);
const compose=ctx.makeSorcererHotbar;
const stigmaNames=Object.keys(JSON.parse(read('stigmas.json')).sorcerer);
const skillNames=Object.keys(JSON.parse(read('skill_unlocks.json')).sorcerer);
const available=new Set([...stigmaNames,...skillNames]);

const loadouts={
 performance:['Element Enhancement','Delayed Explosion','Steel Barrier','Fire Wall'],
 sustained:['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm'],
 burst:['Element Enhancement','Delayed Explosion','Divine Burst','Steel Barrier'],
 survivability:['Element Enhancement','Steel Barrier','Arctic Armor','Hibernation'],
 control:['Hibernation','Curse: Tree','Cold Storm','Steel Barrier']
};
function check(label,equipped,automated=[]){
 const rows=compose(equipped,automated,available);
 assert.equal(rows.length,8,label+': 1–8 key count');
 const manual=rows.flatMap(([names])=>Array.from(names));
 const automatically=new Set(automated);
 assert.equal(rows[0][0][0],'Hellfire',label+': charged Hellfire must be manually slot 1');
 if(!automatically.has('Wish of Concentration'))
  assert.equal(rows[1][0][0],'Wish of Concentration',
    label+': manual Wish must retain its own key');
 else assert(!manual.includes('Wish of Concentration'),
    label+': automatic Wish duplicated on manual bar');
 assert.equal(new Set(manual).size,manual.length,label+': duplicate manual skill');
 assert(manual.every(name=>available.has(name)),label+': unlearned/unavailable skill');
 for(const name of equipped){
  assert(manual.includes(name)||automatically.has(name),
   label+': equipped Stigma missing from both hotbar and macro: '+name);
 }
 for(const name of equipped.filter(name=>!automatically.has(name)))
  assert.equal(manual.filter(value=>value===name).length,1,
   label+': every unautomated equipped Stigma must appear exactly once: '+name);
 for(const name of manual.filter(name=>stigmaNames.includes(name)))
  assert(equipped.includes(name),label+': unequipped Stigma in manual hotbar: '+name);
 for(const [names,cue,tone] of rows)
  assert(Array.isArray(names)&&typeof cue==='string'&&
   ['attack','buff','defense','utility'].includes(tone));
 return rows;
}
for(const [goal,loadout] of Object.entries(loadouts)){
 const bar=check('Solo '+goal,loadout);
 assert.equal(bar.slice(2,6).flatMap(([names])=>Array.from(names)).length,4);
 assert.equal(bar[6][0][0],"Winter's Shackles");
 assert.equal(bar[7][0][0],'Bittercold Wind');
}
// When the auto macro owns Wish, it must NOT reappear on a manual
// key. Burst remains an intentional manual-Wish layout.
for(const [goal,loadout] of Object.entries(loadouts)){
 const auto=goal==='burst'?[]:['Wish of Concentration'];
 const automated=goal==='burst'?[]:[
  'Wish of Concentration',...'Element Enhancement,Delayed Explosion'.split(',')
    .filter(name=>loadout.includes(name))
 ];
 const bar=check('Continuous '+goal,loadout,automated);
 const names=bar.flatMap(([skills])=>Array.from(skills));
 assert.equal(names.includes('Wish of Concentration'),goal==='burst',
  goal+': auto Wish must not waste a manual button');
 if(goal==='burst')assert.equal(bar[1][0][0],'Wish of Concentration');
}
check('Group sustained with automated stationary boss AoE',
 loadouts.sustained,['Fire Wall','Cold Storm']);
check('Group balanced with one ground skill automated',
 loadouts.performance,['Fire Wall']);
check('User custom conditional Stigmas',
 ['Element Enhancement','Glacial Smite','Soul Freeze','Steel Barrier']);
const partial=compose(['Element Enhancement'],[],new Set([
 'Hellfire','Wish of Concentration','Element Enhancement','Firestorm','Blaze'
]));
assert.equal(partial[2][0][0],'Element Enhancement');
assert(partial.slice(3).every(([names])=>names.length===0));
console.log('Sorcerer manual hotbars: all five Solo objectives, Group auto ground effects, custom Stigmas, partial unlocks and eight unique manual keys passed.');
