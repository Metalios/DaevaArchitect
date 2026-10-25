// Global Daevanion UI: keep planned allocations in tabs while tracking real
// spent crystals separately. Single click previews; native double-click buys.
// Blue suggestions do not shuffle until the entered budget is fully recorded.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 const initial=await page.evaluate(()=>{
   state.class='templar';
   const a=account();a.journey='endgame';a.context='solo';a.crystals=119;
   a.obtainedNodes=[];a.boardMode='recommended';a.recommendedRouteSnapshot=null;
   a.goalTarget=0;state.tab='boards';state.preview=119;
   model();const first=plannedRoute()[0];
   state.board=first.board;render();
   return {id:first.id,cost:nodeMap().get(first.id).node[5],
     firstBoard:first.board,route:plannedRoute().map(n=>n.id),
     tabs:[...document.querySelectorAll('#board-tabs [data-board]')].map(el=>el.textContent),
     planned:model().boards.perBoard,
     counter:document.querySelector('#board-crystal-value')?.textContent,
     previewValue:state.preview};
 });
 assert.equal(initial.counter,'0 / 119');
 const tile=()=>page.locator('#board-grid [data-node="'+initial.id+'"]');
 await tile().click();
 const onlyPreview=await page.evaluate(id=>({
  obtained:account().obtainedNodes.includes(id),
  selected:state.node===id,
  effect:document.querySelector('#selected-node')?.textContent,
  counter:document.querySelector('#board-crystal-value')?.textContent,
  route:plannedRoute().map(x=>x.id),
  outline:getComputedStyle(document.querySelector('#board-grid [data-node="'+id+'"]')).outlineColor
 }),initial.id);
 assert.equal(onlyPreview.obtained,false,'single-click must not obtain');
 assert(onlyPreview.selected&&onlyPreview.effect.includes(effectTextDummy(initial.id)||''),'single-click must show node preview');
 assert.equal(onlyPreview.counter,'0 / 119');
 assert.deepEqual(onlyPreview.route,initial.route,'route changed on preview');
 assert.equal(onlyPreview.outline,'rgb(49, 158, 255)','unobtained recommended tile should have blue ring');
 await tile().dblclick();
 const after=await page.evaluate(id=>({
  obtained:account().obtainedNodes.includes(id),
  counter:document.querySelector('#board-crystal-value')?.textContent,
  route:plannedRoute().map(x=>x.id),
  tabs:[...document.querySelectorAll('#board-tabs [data-board]')].map(el=>el.textContent),
  planned:model().boards.perBoard,
  outline:getComputedStyle(document.querySelector('#board-grid [data-node="'+id+'"]')).outlineColor,
  snapshot:account().recommendedRouteSnapshot?.completedBudget,
  button:document.querySelector('#board-grid [data-node="'+id+'"]')?.getAttribute('aria-pressed')
 }),initial.id);
 assert.equal(after.obtained,true,'double-click must mark obtained');
 assert.equal(after.counter,initial.cost+' / 119','counter must count tile CRYSTAL COST, not count nodes');
 assert.equal(after.outline,'rgb(255, 203, 88)','obtained tile should have gold ring');
 assert.equal(after.button,'true','obtained aria-pressed');
 assert.deepEqual(after.route,initial.route,'blue planned route reshuffled before spending budget');
 assert.deepEqual(after.tabs,initial.tabs,'planned amounts in board tabs changed after marking obtained');
 assert.deepEqual(after.planned,initial.planned,'planned budget allocations changed after marking obtained');
 await page.reload();
 const persisted=await page.evaluate(id=>({
   marked:account().obtainedNodes.includes(id),
   spent:obtainedCrystalSpend(false),
   route:plannedRoute().map(x=>x.id),
   snapshot:account().recommendedRouteSnapshot?.route?.map(x=>x.id)
 }),initial.id);
 assert(persisted.marked&&persisted.spent===initial.cost,'obtained marks did not persist across reload');
 assert.deepEqual(persisted.snapshot,initial.route,'persisted recommended blue path changed');
 await page.evaluate(board=>{state.tab='boards';state.board=board;render()},initial.firstBoard);
 await tile().dblclick();
 const unmarked=await page.evaluate(id=>({
  obtained:account().obtainedNodes.includes(id),
  counter:document.querySelector('#board-crystal-value').textContent,
  route:plannedRoute().map(x=>x.id)
 }),initial.id);
 assert.equal(unmarked.obtained,false,'second double-click must undo');
 assert.equal(unmarked.counter,'0 / 119');
 assert.deepEqual(unmarked.route,initial.route);

 // On exhausting a very small crystal budget, the next cycle is computed
 // once, then stays stable until new crystals are earned.
 const cycle=await page.evaluate(id=>{
  const a=account();a.crystals=nodeMap().get(id).node[5];
  a.recommendedRouteSnapshot=null;a.obtainedNodes=[];state.preview=a.crystals;
  state.board=nodeMap().get(id).board;render();
  return {budget:a.crystals,first:plannedRoute()[0].id};
 },initial.id);
 await page.locator('#board-grid [data-node="'+cycle.first+'"]').dblclick();
 const full=await page.evaluate(()=>({
   count:document.querySelector('#board-crystal-value').textContent,
   completed:account().recommendedRouteSnapshot?.completedBudget,
   spent:obtainedCrystalSpend(false)
 }));
 assert.equal(full.spent,cycle.budget);
 assert.equal(full.completed,cycle.budget,'full budget must trigger one replan');
 assert.equal(full.count,cycle.budget+' / '+cycle.budget);
 const next=await page.evaluate(()=>{
   const a=account();a.crystals+=5;render();
   return {total:budget('crystals'),completed:a.recommendedRouteSnapshot.completedBudget,
     count:document.querySelector('#board-crystal-value').textContent};
 });
 assert.equal(next.count,cycle.budget+' / '+next.total);
 assert.equal(next.completed,null,'new earned crystals should start next stable spending cycle');
 // Budget protection is shared with the v2 button.
 await page.evaluate(()=>{account().crystals=obtainedCrystalSpend(false);render()});
 const declined=await page.evaluate(()=>{
  const id=plannedRoute().find(x=>!obtainedNodes().has(x.id)).id;
  return {ok:toggleBoardObtained(id),spent:obtainedCrystalSpend(false),
    notice:boardPurchaseNotice};
 });
 assert.equal(declined.ok,false);
 assert.match(declined.notice,/Cannot mark/);
 assert.equal(declined.spent,cycle.budget);

 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{
  account().crystals=119;account().obtainedNodes=[];
  account().recommendedRouteSnapshot=null;state.tab='boards';
  state.board='Nezekan';state.preview=119;render();
 });
 const mobileId=await page.evaluate(()=>plannedRoute().find(x=>x.board===state.board).id);
 await page.locator('#board-grid [data-node="'+mobileId+'"]').click();
 assert.equal(await page.evaluate(()=>obtainedCrystalSpend(false)),0,'touch-friendly preview should not buy');
 await page.locator('#v2-mark-obtained').click();
 assert.equal(await page.evaluate(()=>obtainedCrystalSpend(false)>0),true,'touch-accessible Mark obtained failed');
 assert.deepEqual(errors,[],'page errors');
 console.log('Daevanion stable blue/gold path, 74/119-style actual crystal counter, single/double click, completion cycle, persistence, and mobile accessibility passed.');
}finally{await browser.close()}

function effectTextDummy(){return '';}
