import {useLegacyRecommendations} from './legacy_recommendation_test_setup.mjs';
// Browser integration: class-aware role goals actually change the displayed
// four Stigmas, Mastery emphasis, and the active role objective.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1360,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 await useLegacyRecommendations(page);
 const catalog=await page.evaluate(()=>{
  const result={};
  for(const cls of CLASS_ORDER){
   state.class=cls;const a=account();
   a.journey='endgame';a.context='party';a.pveObjective='performance';
   render();
   result[cls]=[...document.querySelectorAll('#v2-objective option')]
     .map(o=>({value:o.value,label:o.textContent}));
  }
  return result;
 });
 assert.equal(Object.keys(catalog).length,8);
 assert(catalog.cleric.some(x=>x.value==='healing'&&x.label.includes('Healer')));
 assert(catalog.cleric.some(x=>x.value==='debuff'));
 assert(catalog.chanter.some(x=>x.value==='support'));
 assert(catalog.templar.some(x=>x.value==='tank'));
 assert(catalog.gladiator.some(x=>x.value==='offtank'));
 assert(catalog.spiritmaster.some(x=>x.value==='pet'));
 assert(!catalog.assassin.some(x=>x.value==='healing'));
 const result=await page.evaluate(()=>{
  state.class='cleric';const a=account();a.journey='endgame';a.context='party';
  a.manualStigma=null;a.customStigmas=null;a.manualMastery=null;
  a.mastery=203;a.stigma=30;a.crystals=136;a.obtainedNodes=[];
  a.pveObjective='performance';render();
  const balanced={stigmas:activeStigmas(),objective:a.pveObjective};
  a.pveObjective='healing';render();
  const healer={stigmas:activeStigmas(),objective:a.pveObjective,
    selected:document.getElementById('v2-objective').value,
    text:document.getElementById('macro-rank-summary').textContent,
    advice:adviceFor('cleric','party','healing').core};
  a.pveObjective='debuff';render();
  const debuff={stigmas:activeStigmas(),objective:a.pveObjective,
    advice:adviceFor('cleric','party','debuff').core};
  setContext('solo');
  const solo={goal:account().pveObjective,
    options:[...document.getElementById('v2-objective').options].map(o=>o.value)};
  return {balanced,healer,debuff,solo};
 });
 assert.deepEqual(Array.from(result.healer.stigmas),
   ['Light of Protection','Absolution',"Yustiel's Power",'Benevolence']);
 assert(result.healer.advice.includes('Radiant Recovery'));
 assert(result.healer.text.includes('Selected class role'));
 assert.equal(result.healer.selected,'healing');
 assert(result.debuff.advice.includes('Debilitating Mark'));
 assert.notDeepEqual(Array.from(result.healer.stigmas),Array.from(result.debuff.stigmas));
 assert(result.solo.options.includes('debuff'));
 assert(!result.solo.options.includes('healing'));
 assert.deepEqual(errors,[]);
 console.log('Verified eight-class dynamic build goals and actual Cleric healing/debuff allocations in Chromium.');
}finally{await browser.close()}
