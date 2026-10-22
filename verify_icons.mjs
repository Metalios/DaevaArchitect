import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=name=>JSON.parse(fs.readFileSync(new URL(name,import.meta.url),'utf8'));
const classes=read('classes_data.json'),stigmas=read('stigmas.json');
const source=fs.readFileSync(new URL('js/icon_catalog.js',import.meta.url),'utf8');
const sandbox={};
vm.runInNewContext('const DATA='+JSON.stringify(classes)+';\n'+source+'\nglobalThis.catalog={GAME_STIGMA_ART,gameSkillIconFile,gameSkillIconUrl,gameSkillIconMarkup};',sandbox);
const {GAME_STIGMA_ART,gameSkillIconUrl,gameSkillIconFile,gameSkillIconMarkup}=sandbox.catalog;
let checked=0;
for(const cls of Object.keys(classes)){
  const expected=Object.keys(stigmas[cls]);
  const actual=Object.keys(GAME_STIGMA_ART[cls]);
  assert.equal(actual.length,13,cls+' needs 13 original Stigma icons');
  assert.deepEqual(actual.sort(),expected.sort(),cls+' Stigma names not mapped exactly');
  const ids=new Set();
  for(const name of expected){
    const [id,file]=GAME_STIGMA_ART[cls][name];
    assert(Number.isInteger(id)&&id>0,cls+' '+name+': bad client skill id');
    assert(!ids.has(id),cls+' '+name+': duplicate client skill ID');
    ids.add(id);
    assert.match(file,/^ICON_[A-Z]+_SKILL_[A-Za-z0-9_]+\.png$/,cls+' '+name+': invalid icon filename');
    assert.equal(gameSkillIconFile(cls,name),file);
    assert.equal(gameSkillIconUrl(cls,name),'https://assets.playnccdn.com/static-aion2-gamedata/resources/'+file);
    assert.match(gameSkillIconMarkup(cls,name),/<img src=/);
    checked++;
  }
  for(const skill of Object.values(classes[cls].skills)){
    const file=gameSkillIconFile(cls,skill.name);
    assert.match(file,/^ICON_[A-Z]+_SKILL_[A-Za-z0-9_]+\.png$/,cls+' '+skill.name+': missing client artwork');
    checked++;
  }
}
for(const [cls,name,id,file] of [
  ['templar','Doom Shield',12070000,'ICON_TE_SKILL_007.png'],
  ['templar','Armor of Balance',12200000,'ICON_GL_SKILL_013.png'],
  ['gladiator','Wrath Wave',11240000,'ICON_GL_SKILL_007.png'],
  ['assassin',"Triniel's Dagger",13300000,'ICON_AS_SKILL_028.png'],
  ['chanter','Undefeated Mantra',18190000,'ICON_CH_SKILL_019.png']
]){
  assert.equal(GAME_STIGMA_ART[cls][name][0],id,cls+' '+name+': wrong game skill');
  assert.equal(GAME_STIGMA_ART[cls][name][1],file,cls+' '+name+': wrong client artwork');
}
assert.equal(checked,280,'All 104 Stigmas and 176 Mastery skills must have original icon files');
console.log('Validated '+checked+' original skill-icon mappings (104 Stigma, 176 Mastery) across all eight classes.');
