// Browser integration: opt-in suggested macros use all-class PvP safety,
// remain editable by scenario, and leveling macros can be customized too.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1360,height:900}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 const result=await page.evaluate(()=>{
  const fail=[],matrix=[];
  for(const cls of CLASS_ORDER){
   state.class=cls;
   const a=account();
   a.buildMode='custom';a.boardMode='custom';
   a.journey='endgame';a.mastery=203;a.stigma=80;
   a.manualMastery={};a.manualStigma={};a.customSpecialties={};a.customMacros={};
   a.customStigmas=cls==='templar'?
     ['Doom Shield','Grapple','Executing Blade','Shield of Protection']:
     Object.keys(STIGMAS[cls]).slice(0,4);
   for(const name of a.customStigmas)a.manualStigma[name]=5;
   a.context='pvp-arena';a.pvpOpponent='ranger';
   render();
   const before=JSON.stringify({
     mastery:a.manualMastery,stigma:a.manualStigma,loadout:a.customStigmas,
     boards:a.customNodes
   });
   const copy=document.querySelector('#custom-macro-editor [data-cmacro-action="enable"]');
   if(!copy){fail.push(cls+' no opt-in suggestion');continue}
   copy.click();
   const edited=a.customMacros['endgame:pvp-arena'];
   if(!edited||!edited.steps.length)fail.push(cls+' copied macro empty');
   const all=Object.values(edited?.stacks||{}).flat();
   if(all.some(name=>GlobalRotationPolicy.manualSkills(cls,{pvp:true}).has(name)))
     fail.push(cls+' unsafe macro class skill');
   if(JSON.stringify({
     mastery:a.manualMastery,stigma:a.manualStigma,loadout:a.customStigmas,
     boards:a.customNodes
   })!==before)fail.push(cls+' copying suggestion overwrote progression');
   a.context='pvp-abyss-solo';a.pvpOpponent='cleric';
   render();
   if(!a.customMacros['endgame:pvp-arena']||a.customMacros['endgame:pvp-abyss-solo'])
     fail.push(cls+' PvP scenario macro overwritten');
   if(!document.querySelector('#custom-macro-editor [data-cmacro-action="enable-blank"]'))
     fail.push(cls+' no empty macro workflow in new scenario');
   if(cls==='templar'){
     document.querySelector('#custom-macro-editor [data-cmacro-action="enable"]')?.click();
     const second=a.customMacros['endgame:pvp-abyss-solo'];
     if(!second?.stacks?.Q?.includes('Grapple')||
        !second?.stacks?.Q?.includes('Executing Blade')||
        second.steps.some(step=>step.key==='Q'))
       fail.push('Templar manual Q catch stack incorrectly added to held macro');
   }
   matrix.push(cls);
  }
  state.class='ranger';const a=account();
  a.journey='leveling';a.context='solo';a.leveling={level:31,extraByLevel:{}};
  a.customMacros={};
  a.manualMastery={};a.manualStigma={};a.customStigmas=[null,null,null,null];
  render();
  if(!document.querySelector('#custom-macro-editor [data-cmacro-action="enable"]'))
    fail.push('Leveling has no editable macro');
  document.querySelector('#custom-macro-editor [data-cmacro-action="enable"]')?.click();
  if(!a.customMacros['leveling:solo'])fail.push('Leveling suggestion did not save');
  a.leveling.level=32;render();
  if(!a.customMacros['leveling:solo'])fail.push('Leveling edit lost on level change');
  return {fail,matrix};
 });
 assert.deepEqual(result.fail,[],result.fail.join('\n'));
 assert.deepEqual(errors,[],errors.join('\n'));
 assert.equal(result.matrix.length,8);
 console.log('PASS eight PvP macro copy/edit scenario isolation and editable level-gated macros');
}finally{await browser.close()}
