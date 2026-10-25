// Verify a skill's point-funded Mastery rank and two distinct board states
// on AION 2 Global's leveling and endgame budgets, plus narrow inspect view.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 const result=await page.evaluate(()=>{
  state.class='sorcerer';
  const a=account();a.journey='leveling';a.context='solo';a.leveling={level:34,extraByLevel:{}};
  a.manualMastery=null;a.obtainedNodes=[];a.boardMode='recommended';a.gear={};
  render();
  const failures=[],initial=model();
  if(budget('mastery')!==135)failures.push('Global Lv34 Mastery budget must be 135');
  if(initial.mastery.spent>budget('mastery'))failures.push('Allocated more Mastery than entered');
  if(Object.keys(initial.acquiredEffects.skills).length)failures.push('No board marked but acquired bonuses nonzero');
  const trial=[...initial.boards.owned].map(id=>({id,entry:nodeMap().get(id)}))
    .find(x=>x.entry.node[6].some(([key])=>typeof key==='number'));
  if(!trial)failures.push('Level-34 plan contains no skill node to test');
  let name='';
  if(trial){
   const [key,boost]=trial.entry.node[6].find(([key])=>typeof key==='number');
   name=data().skills[key]?.name;
   const before=skillLevelBreakdown(name,initial);
   if(before.boardOwned!==0||before.boardPlanned<1)failures.push('Projection not separate from unowned bonuses');
   const row=[...document.querySelectorAll('#v2-skill-list .v2-skill')]
     .find(el=>el.querySelector('.v2-skill-label b')?.textContent===name);
   if(row){
    const values=row.querySelector('.v2-board-delta');
    if(!values||Number(values.dataset.boardOwned)!==before.boardOwned||
      Number(values.dataset.boardPlanned)!==before.boardPlanned)
      failures.push('Mastery editor does not show acquired vs planned bonuses');
   }
   a.obtainedNodes=[trial.id];render();
   const after=skillLevelBreakdown(name,model());
   if(after.boardOwned!==boost)failures.push('Marking a node obtained did not affect acquired rank');
   if(after.withOwned!==Math.min(40,after.mastery+boost+after.gear))
     failures.push('Acquired skill level not summed from its sources');
   a.leveling.level=1;render();
   const earlier=skillLevelBreakdown(name,model());
   if(earlier.boardOwned!==0)failures.push('Board node stayed active before its character-level unlock');
  }
  if(!document.querySelector('#v2-master-status')?.textContent.includes('unspent'))
   failures.push('Mastery editor does not disclose unspent points');
  a.leveling.level=34;a.obtainedNodes=[];render();
  const boardHint=document.querySelector('.v2-mastery-hint')?.textContent||'';
  if(!boardHint.includes('obtained / planned'))failures.push('Missing acquired-vs-planned legend');
  return {failures,checkedNode:name};
 });
 assert.deepEqual(errors,[],'JS exceptions');
 assert.deepEqual(result.failures,[],result.failures.join('\n'));
 const layout=await page.evaluate(()=>{
  state.gearView='inspect';render();
  const root=document.querySelector('#gear-doll-grid.inspect');
  const boundary=root.getBoundingClientRect();
  const group=[...document.querySelectorAll('#gear-doll-grid.inspect .gear-tile')];
  return {panel:Math.round(boundary.width),tiles:group.length,overflow:group.filter(el=>{
   const r=el.getBoundingClientRect();
   return r.left<boundary.left-2||r.right>boundary.right+2;
  }).map(el=>el.getAttribute('aria-label'))};
 });
 assert.equal(layout.tiles,20,'Expected 20 editable equipment slots');
 assert.deepEqual(layout.overflow,[],'Gear slot groups clipped inside inspect view: '+JSON.stringify(layout));
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  state.gearView='inspect';render();
  const root=document.querySelector('#gear-doll-grid.inspect'),rect=root.getBoundingClientRect();
  return [...root.querySelectorAll('.gear-tile')].filter(el=>{
   const r=el.getBoundingClientRect();
   return r.left<rect.left-2||r.right>rect.right+2;
  }).map(el=>el.getAttribute('aria-label'));
 });
 assert.deepEqual(mobile,[],'Clipped gear slots on 390px viewport');
 console.log('Validated Global Lv34 '+result.checkedNode+' Mastery/Daevanion breakdown, marked-node level gate and inspect geometry at 1280px and 390px.');
}finally{await browser.close()}
