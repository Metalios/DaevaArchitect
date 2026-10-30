// Validate that visible current-level rotation skills agree with the actual
// recommended equipped Stigmas and data skill unlocks. No DPS claims.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 const result=await page.evaluate(()=>{
  const failures=[],classes=['templar','gladiator','assassin','ranger','sorcerer','spiritmaster','cleric','chanter'];
  let checked=0;
  for(const cls of classes)for(const mode of ['solo','party','pvp'])for(const crystals of [136,327]){
   state.class=cls;
   const a=account();
   a.journey='endgame';a.context=mode;a.mastery=203;a.stigma=29;a.crystals=crystals;
   a.manualStigma=null;a.manualMastery=null;a.customStigmas=null;a.customSpecialties={};
   a.boardMode='recommended';a.obtainedNodes=[];a.gear={};a.equipment={};
   const m=model();renderRotation(m);
   const selected=new Set(activeStigmas().filter(name=>(m.stigma.levels[name]||0)>0));
   const active=new Set(Object.values(data().skills).slice(0,12).map(skill=>skill.name));
   const known=new Set([...active,...selected]);
   const names=[...document.querySelectorAll('#macro-stacks .macro-stack:not(.macro-script) .stack-row span, #hotbar-grid .hotbar-skills strong')]
     .map(node=>node.textContent.trim()).filter(name=>name&&name!=='Flex slot');
   for(const name of names)if(!known.has(name))failures.push(cls+' '+mode+' '+crystals+': rotation shows unlearned or unequipped '+name);
   if(Math.max(...Object.values(m.stigma.levels))<10)failures.push(cls+' '+mode+' '+crystals+': no Stigma Lv10 at fresh baseline');
   if(cls==='cleric'&&mode==='party'){
    const damageStack=[...document.querySelectorAll('#macro-stacks .macro-stack:not(.macro-script) .stack-row span')].map(n=>n.textContent.trim());
    if(selected.has('Earth Punishment')&&!damageStack.includes('Earth Punishment'))
      failures.push('Cleric Group: Earth Punishment crit debuff missing from macro');
   }
   checked++;
  }
  return {checked,failures};
 });
 assert.deepEqual(errors,[],errors.join('\n'));
 assert.deepEqual(result.failures,[],result.failures.join('\n'));
 console.log('Checked '+result.checked+' class/context/crystal budget combinations for rotation-Stigma coherence.');
 await page.close();
}finally{await browser.close()}
