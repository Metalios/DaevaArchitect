// Regression for recalculation behavior after a shared-build import.
// The optimizer may return identical tiles; the UI must report that fact,
// not make the button appear inert. Actual gold purchases remain separate.
import {chromium} from 'playwright';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
  const first=await page.evaluate(()=>{
    state.class='templar';
    const a=account();
    a.journey='endgame';a.context='party';a.crystals=119;
    a.recommendedRouteSnapshot=null;a.boardMode='recommended';a.obtainedNodes=[];
    a.customNodes=[];a.customAzphelNodes=[];
    state.tab='boards';state.board='Nezekan';state.preview=119;
    render();
    const step=plannedRoute()[0];
    if(!toggleBoardObtained(step.id))throw Error('Cannot record initial gold tile');
    render();
    return {id:step.id,cost:nodeMap().get(step.id).node[5],route:plannedRoute().map(x=>x.id)};
  });
  // Recalculate with identical inputs. The expected behavior is NOT to
  // generate a random new path, but to provide a meaningful report.
  await page.locator('#v2-board-restore').click();
  const unchanged=await page.evaluate(()=>({
    report:lastBoardRecalculation,
    status:document.querySelector('#v2-board-notice').textContent,
    route:plannedRoute().map(x=>x.id),
    gold:account().obtainedNodes.slice()
  }));
  assert.equal(unchanged.report.changed,false);
  assert.match(unchanged.report.message,/unchanged/);
  assert(unchanged.report.message.includes('/119 crystals planned'));
  assert(unchanged.report.message.includes('marked obtained'));
  assert(unchanged.gold.includes(first.id));
  assert.deepEqual(unchanged.route,first.route);
  assert.match(unchanged.status,/unchanged/);

  // New actual input causes a new calculation, even if the ranked order
  // remains the same. It must describe updated budget and preserved gold.
  const revised=await page.evaluate(()=>{
    account().crystals=150;
    recalculateRecommendedBoards();render();
    return {
      report:lastBoardRecalculation,
      budget:budget('crystals'),
      gold:account().obtainedNodes.slice(),
      shown:document.querySelector('#v2-board-notice').textContent
    };
  });
  assert.equal(revised.report.crystals,150);
  assert.equal(revised.report.obtained,first.cost);
  assert(revised.gold.includes(first.id));
  assert.match(revised.shown,/150/);

  // A user-created custom selection is truly reset to the computed route.
  const restored=await page.evaluate(()=>{
    const a=account();a.boardMode='custom';a.customNodes=[];
    render();
    document.querySelector('#v2-board-restore').click();
    return {
      report:lastBoardRecalculation,
      mode:a.boardMode,
      route:plannedRoute().length,
      gold:a.obtainedNodes.includes(first.id)
    };
  });
  assert.equal(restored.mode,'recommended');
  assert.equal(restored.report.changed,true);
  assert(restored.report.added.length>0);
  assert(restored.gold);
  assert(restored.route>0);

  // The second, destructive action requires deliberate confirmation.
  const reset=await page.evaluate(()=>{
    window.confirm=()=>false;
    document.querySelector('#v2-board-clear-obtained').click();
    const canceled=obtainedNodes().has(first.id);
    window.confirm=()=>true;
    document.querySelector('#v2-board-clear-obtained').click();
    return {
      canceled,
      removed:!obtainedNodes().has(first.id),
      crystals:budget('crystals'),
      status:document.querySelector('#v2-board-notice').textContent
    };
  });
  assert(reset.canceled&&reset.removed);
  assert.equal(reset.crystals,150);
  assert.match(reset.status,/Cleared 1 obtained PvE tile/);
  assert.deepEqual(errors,[]);

  // Shared builds arrive without the cached recommendation. Loading
  // their account and pressing Recalculate should remain responsive.
  await page.locator('#share-build-button').click();
  await page.locator('#share-url').waitFor();
  const shared=await page.locator('#share-url').inputValue();
  assert(shared.includes('#build='));
  const second=await browser.newPage({viewport:{width:1280,height:900}});
  try{
    await second.goto(shared);
    await second.locator('#shared-build-load').click();
    await second.locator('#v2-board-restore').click();
    assert.match(await second.locator('#v2-board-notice').innerText(),/Recalculated:/);
  }finally{await second.close()}
  console.log('PASS: unchanged route explained; increased budget re-evaluated; custom plan reset; obtained marks preserved until confirmed clear; shared build recalculation works.');
}finally{await browser.close()}
