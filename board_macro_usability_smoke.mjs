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
  if(account().obtainedNodes.includes(id)||document.querySelector('[data-node="'+id+'"]')?.classList.contains('obtained'))
    failures.push('Single click must preview, not purchase');
  if(!document.querySelector('#selected-node')?.textContent.includes(effectText(node)))
    failures.push('Single click did not preview selected node effects');
  document.querySelector('[data-node="'+id+'"]').dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));
  const stored=account().obtainedNodes.includes(id),rendered=document.querySelector('[data-node="'+id+'"]');
  if(!stored||!rendered?.classList.contains('obtained')||rendered.getAttribute('aria-pressed')!=='true')
   failures.push('Double click did not mark obtained in v2');
  if(!model().acquiredEffects)failures.push('Acquired effects were not recalculated');
  rendered.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));
  if(account().obtainedNodes.includes(id)||document.querySelector('[data-node="'+id+'"]')?.classList.contains('obtained'))
   failures.push('Double click again did not unmark tile');
  if(!document.querySelector('#v2-master-status')?.textContent.includes('Mastery'))
   failures.push('Mastery panel was not rendered after double click');
  // Custom mode: one click previews; the separate explicit plan button
  // edits the path, while double click still marks obtained.
  a.boardMode='custom';a.customNodes=[];a.obtainedNodes=[];render();
  const start=data().boards[0].nodes.find(n=>n[5]===0);
  const adjacent=data().boards[0].nodes.find(n=>n[5]>0&&Math.abs(n[1]-start[1])+Math.abs(n[2]-start[2])===1);
  document.querySelector('[data-node="'+adjacent[0]+'"]').click();
  if(a.customNodes.includes(adjacent[0])||a.obtainedNodes.length)
   failures.push('Custom single click must only preview');
  document.querySelector('#selected-node-plan').click();
  if(!a.customNodes.includes(adjacent[0])||a.obtainedNodes.length)
   failures.push('Explicit custom plan button must edit the path only');
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
  const chosen=model().combat.macro.steps;
  if(macro.length!==chosen.length||!macro[0]?.includes('Q')||
     chosen.some((key,i)=>!macro[i]?.includes(key)))
    failures.push('Sorcerer RMB macro steps disagree with selected combat-ranked stacks');
  if(chosen.includes('R')&&!activeStigmas().some(name=>['Fire Wall','Cold Storm'].includes(name)&&(model().stigma.levels[name]||0)>0))
    failures.push('Sorcerer must not use R ground macro without equipped ground Stigmas');
  if(chosen.includes('E')&&!document.querySelector('#macro-stacks [data-macro-key="E"].macro-stack-auto'))
    failures.push('Sorcerer selected E step missing from visible automatic stack');
  const autoSkills=[...document.querySelectorAll('#macro-stacks .macro-stack-auto .macro-physical-stack [data-skill]')].map(node=>node.dataset.skill);
  for(const manualOnly of ['Hellfire','Wish of Concentration','Element Enhancement','Delayed Explosion'])
    if(autoSkills.includes(manualOnly))failures.push('Sorcerer manual buff/charge included in RMB macro: '+manualOnly);
  for(const automated of ['Firestorm','Blaze'])
    if(!autoSkills.includes(automated))failures.push('Sorcerer core cooldown not automated: '+automated);
  const manualKeys=[...document.querySelectorAll('#rotation-quick-guide [data-easy-key]')].map(el=>el.textContent);
  if(!manualKeys[0]?.includes('Hellfire')||!manualKeys[1]?.includes('Wish of Concentration'))
    failures.push('Sorcerer manual Hellfire and Wish assignments missing');
  const a=account();
  a.context='party';a.quickUse2Bind='R';a.stigma=160;a.manualStigma=null;
  render();
  const quick2=document.querySelector('#quick-use-2-bind');
  if(quick2.value!=='R'||!document.querySelector('#rotation-control-status')?.textContent.includes('T → R'))
    failures.push('AION 2 mode must default to remapped Quick Use 2 = R');
  const usesGround=model().combat.macro.steps.includes('R');
  if(usesGround&&(!document.querySelector('#macro-stacks [data-macro-key="R"].macro-stack-auto')||
     ![...document.querySelectorAll('#macro-stacks .macro-step-key')].some(el=>el.textContent==='R')))
    failures.push('Remapped R ground stack should display whenever optimized macro uses R');
  quick2.value='T';quick2.dispatchEvent(new Event('change',{bubbles:true}));
  if(a.quickUse2Bind!=='T'||document.querySelector('#quick-use-2-bind').value!=='T'||
     (usesGround&&(!document.querySelector('#macro-stacks [data-macro-key="T"].macro-stack-auto')||
     ![...document.querySelectorAll('#macro-stacks .macro-step-key')].some(el=>el.textContent==='T'))))
    failures.push('Original T Quick Use 2 bind not reflected in endgame Macro stack, steps and instructions');
  document.querySelector('#quick-use-2-bind').value='R';
  document.querySelector('#quick-use-2-bind').dispatchEvent(new Event('change',{bubbles:true}));
  if(a.quickUse2Bind!=='R'||(usesGround&&!document.querySelector('#macro-stacks [data-macro-key="R"]')))
    failures.push('T to R rebind did not persist through endgame re-render');
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
