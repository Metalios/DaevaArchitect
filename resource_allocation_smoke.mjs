// Verify that recommended Mastery and Daevanion budgets are exhausted
// wherever another legal purchase exists. Manual edits remain intentional.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 const result=await page.evaluate(()=>{
  const errors=[],rows=[];
  for(const cls of ['templar','gladiator','assassin','ranger','sorcerer','spiritmaster','cleric','chanter']){
   state.class=cls;
   const a=account();
   a.journey='endgame';a.context='party';a.mastery=285;a.crystals=327;a.stigma=29;
   a.boardMode='recommended';a.obtainedNodes=[];a.recommendedRouteSnapshot=null;
   a.manualMastery=null;a.manualStigma=null;a.customSpecialties={};
   a.gear={};a.equipment={};
   let m=model();
   if(m.mastery.spent!==285)errors.push(cls+' Mastery '+m.mastery.spent+'/285');
   if(m.boards.spent!==327)errors.push(cls+' PvE boards '+m.boards.spent+'/327');
   if(Object.entries(m.mastery.levels).some(([name,rank])=>rank>masteryRankCap(name)||rank<1))
    errors.push(cls+' Mastery cap violated');
   const prefix=plannedRoute().filter((entry,i)=>i<20).map(x=>x.id).join(',');
   a.crystals=328;
   m=model();
   if(m.boards.spent!==328)errors.push(cls+' increased budget '+m.boards.spent+'/328');
   if(plannedRoute().slice(0,20).map(x=>x.id).join(',')!==prefix)
     errors.push(cls+' spending one new crystal unexpectedly shuffled earlier recommendations');
   rows.push({cls,mastery:m.mastery.spent,crystals:m.boards.spent});
  }
  state.class='sorcerer';
  const a=account();a.journey='leveling';a.context='party';
  a.leveling={level:36,extraByLevel:{}};a.obtainedNodes=[];a.boardMode='recommended';
  a.manualMastery=null;a.recommendedRouteSnapshot=null;
  let m=model();
  const budget36=budget('mastery'),crystal36=budget('crystals');
  if(m.mastery.spent!==budget36||m.boards.spent!==crystal36)
    errors.push('Sorcerer Lv36 '+m.mastery.spent+'/'+budget36+' Mastery; '+m.boards.spent+'/'+crystal36+' crystals');
  leveling().level=37;m=model();
  if(m.mastery.spent!==budget('mastery')||m.boards.spent!==budget('crystals'))
    errors.push('Sorcerer Lv37 resource completion wrong');
  a.journey='endgame';a.mastery=285;a.crystals=327;a.recommendedRouteSnapshot=null;
  a.manualMastery=null;m=model();
  const normalSpent=m.mastery.spent,chosen={...m.mastery.levels};
  chosen.Firestorm=1;
  a.manualMastery=chosen;
  const manual=model();
  if(manual.mastery.spent>=normalSpent)errors.push('Custom Mastery was filled without consent');
  a.manualMastery=null;a.boardMode='custom';a.customNodes=[];
  if(model().boards.spent!==0)errors.push('Custom board was filled without consent');
  a.boardMode='recommended';
  return {errors,rows};
 });
 assert.deepEqual(errors,[],'runtime errors');
 assert.deepEqual(result.errors,[],result.errors.join('\n'));
 console.log('All eight classes spent 285 Mastery and 327/328 crystals; level 36->37 growth and custom allocations preserved.');
}finally{await browser.close()}
