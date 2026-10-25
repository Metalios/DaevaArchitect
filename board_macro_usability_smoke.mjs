// Regression: clicking a recommended Global Daevanion tile toggles ownership
// immediately in v2; macro stacks render their PHYSICAL rows bottom-first.
// Uses real browser DOM and saved user state, not synthetic button labels.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 const board=await page.evaluate(()=>{
  state.class='sorcerer';const a=account();a.journey='leveling';a.context='solo';
  leveling().level=34;a.boardMode='recommended';a.obtainedNodes=[];a.manualMastery=null;
  state.board='Nezekan';state.tab='boards';render();
  const failures=[],button=document.querySelector('#board-grid .node.queued');
  if(!button)throw Error('No recommended queued tiles at Global level 34');
  const id=Number(button.dataset.node),entry=nodeMap().get(id),node=entry.node;
  button.click();
  const stored=account().obtainedNodes.includes(id),rendered=document.querySelector('[data-node="'+id+'"]');
  if(!stored||!rendered?.classList.contains('obtained')||rendered.getAttribute('aria-pressed')!=='true')
   failures.push('Click did not immediately mark an obtained tile in v2');
  if(!model().acquiredEffects)failures.push('Acquired effects were not recalculated');
  rendered.click();
  if(account().obtainedNodes.includes(id)||document.querySelector('[data-node="'+id+'"]')?.classList.contains('obtained'))
   failures.push('Click again did not unmark tile');
  if(!document.querySelector('#v2-master-status')?.textContent.includes('Mastery'))
   failures.push('Mastery panel was not rendered after click');
  // Custom mode still means edit the connected planned path, not record a buy.
  a.boardMode='custom';a.customNodes=[];a.obtainedNodes=[];render();
  const start=data().boards[0].nodes.find(n=>n[5]===0);
  const adjacent=data().boards[0].nodes.find(n=>n[5]>0&&Math.abs(n[1]-start[1])+Math.abs(n[2]-start[2])===1);
  document.querySelector('[data-node="'+adjacent[0]+'"]').click();
  if(!a.customNodes.includes(adjacent[0])||a.obtainedNodes.length)
   failures.push('Custom mode must edit plan only, not silently mark ownership');
  return {failures,id};
 });
 assert.deepEqual(board.failures,[],board.failures.join('\n'));
 const rotations=await page.evaluate(()=>{
  const failures=[];
  for(const cls of ['gladiator','templar','assassin','ranger','sorcerer','spiritmaster','cleric','chanter']){
   state.class=cls;const a=account();a.journey='endgame';a.context='solo';a.boardMode='recommended';
   state.tab='rotation';render();
   const summary=document.querySelector('#rotation-quick-guide')?.textContent||'';
   if(!summary.includes('Row 0 at the bottom')||!summary.includes('in-game Macro hotkey')||!summary.includes('two mouse buttons'))
    failures.push(cls+': missing simple directions');
   const advanced=document.querySelector('#rotation .rotation-advanced');
   if(!advanced||advanced.open)failures.push(cls+': advanced controls should be available but initially collapsed');
   if(!document.querySelector('#hotbar-grid')||!document.querySelector('#setup-list'))
    failures.push(cls+': collapsible advanced hotbar and setup not available');
   const stacks=[...document.querySelectorAll('#macro-stacks .macro-stack-auto')];
   if(!document.querySelector('#rotation-quick-guide .rotation-easy-buttons')||
      !document.querySelector('#rotation-quick-guide .rotation-easy-manual-grid'))
     failures.push(cls+': missing visible mouse/manual control diagram');
   if(!stacks.length)failures.push(cls+': missing macro stacks');
   for(const stack of stacks){
    const rows=[...stack.querySelectorAll('.macro-physical-stack .stack-row')],counts=rows.map(el=>Number(el.dataset.row));
    if(!counts.length||counts.some((n,i)=>n!==counts.length-i-1))
     failures.push(cls+': physical macro row order inverted');
    if(rows.at(-1)?.dataset.row!=='0'||!rows.at(-1)?.classList.contains('macro-first'))
     failures.push(cls+': bottom priority not marked correctly');
   }
   const macroKeys=[...document.querySelectorAll('#macro-stacks .macro-script .macro-step')]
    .map(el=>el.textContent);
   if(macroKeys.some(step=>!step.includes('10 ms')))failures.push(cls+': missing explicit step delay');
   if(!document.querySelector('#macro-stacks .macro-script')?.textContent.includes('NOT individual skills'))
    failures.push(cls+': macro step / stack difference obscured');
  }
  state.class='sorcerer';account().journey='endgame';render();
  const sorc=document.querySelector('#rotation-quick-guide')?.textContent||'';
  if(!sorc.includes('Flame Arrow')||!sorc.includes('Hellfire')||!sorc.includes('LMB')||!sorc.includes('RMB'))
    failures.push('Sorcerer mouse/macro/manual setup not clear');
  const macro=[...document.querySelectorAll('#macro-stacks .macro-step')].map(x=>x.textContent);
  if(macro.length!==2||!macro[0].includes('Q')||!macro[1].includes('E'))
    failures.push('Sorcerer must use one held RMB macro with two Q/E damage steps');
  if(!document.querySelector('#macro-stacks [data-macro-key="E"].macro-stack-auto'))
    failures.push('Sorcerer E conditional follow-ups not automatically handled');
  const autoSkills=[...document.querySelectorAll('#macro-stacks .macro-stack-auto .macro-physical-stack [data-skill]')].map(node=>node.dataset.skill);
  for(const manualOnly of ['Hellfire','Wish of Concentration',"Winter's Shackles",'Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm'])
    if(autoSkills.includes(manualOnly))failures.push('Sorcerer manual skill included in RMB macro: '+manualOnly);
  const manualKeys=[...document.querySelectorAll('#rotation-quick-guide [data-easy-key]')].map(el=>el.textContent);
  if(!manualKeys[0]?.includes('Hellfire')||!manualKeys[2]?.includes('Wish of Concentration'))
    failures.push('Sorcerer manual Hellfire and Wish assignments missing');
  return failures;
 });
 assert.deepEqual(errors,[],'Browser runtime errors');
 assert.deepEqual(rotations,[],rotations.join('\n'));
 await page.setViewportSize({width:390,height:844});
 const mobile=await page.evaluate(()=>{
  state.class='templar';account().journey='endgame';state.tab='rotation';render();
  return {overflow:document.documentElement.scrollWidth-innerWidth,guide:document.querySelector('#rotation-quick-guide')?.textContent||''};
 });
 assert(mobile.overflow<=8,'Mobile macro view overflows by '+mobile.overflow+'px');
 assert(mobile.guide.includes('Build'),'Macro guide missing at mobile width');
 console.log('Board tile obtained toggle/custom semantics and 8 endgame physical hotbar layouts verified at desktop + mobile.');
}finally{await browser.close()}
