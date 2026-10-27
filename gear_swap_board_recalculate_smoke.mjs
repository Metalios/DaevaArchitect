// Browser regression: a new equipment item owns new roll data. A requested
// board recalculation must invalidate the old route, but not purchased tiles.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
  await page.locator('[data-tab="gear"]').click();

  await page.locator('[data-gear-slot="top"]').first().click();
  const first=page.locator('#gear-results [data-gear-result]').first();
  const originalHref=await first.getAttribute('data-gear-result');
  await first.click();
  await page.locator('[name="enhancement"]').fill('11');
  await page.locator('[name="statNotes"]').fill('Attack +31 from Soul Binding');
  await page.locator('[name="notes"]').fill('Old armor annotations');
  await page.locator('[name="skill0"]').selectOption('Insulting Roar');
  await page.locator('[name="levels0"]').fill('4');
  await page.locator('[name="stoneSlots"]').fill('1');
  await page.locator('[name="stoneType"]').selectOption('Superior');
  await page.locator('[name="stoneStat0"]').fill('HP');
  await page.locator('[name="stoneValue0"]').fill('150');
  await page.locator('[name="stoneGrade0"]').selectOption('Epic');
  await page.locator('.gear-save').click();

  let current=await page.evaluate(()=>account().equipment.top);
  assert.equal(current.enhancement,11);
  assert.equal(current.skillBonuses[0].skill,'Insulting Roar');
  assert.equal(current.stones[0].stat,'HP');

  // Re-select the same catalog item: recorded rolls are still valid.
  await page.locator('[data-gear-slot="top"]').first().click();
  await page.locator('#gear-results [data-gear-result]').first().click();
  assert.equal(await page.locator('[name="enhancement"]').inputValue(),'11');
  assert.equal(await page.locator('[name="levels0"]').inputValue(),'4');
  assert.equal(await page.locator('[name="stoneValue0"]').inputValue(),'150');

  // Choose a distinct item in the same slot. Every old item-specific value
  // should be blank immediately, before any remote tooltip completes.
  const replacementHref=await page.locator('#gear-results [data-gear-result]')
    .evaluateAll((cards,href)=>cards.map(card=>card.dataset.gearResult)
      .find(id=>id!==href)||null,originalHref);
  assert(replacementHref,'Need two different Top catalog items for the regression');
  await page.locator('#gear-results [data-gear-result]').evaluateAll((cards,href)=>{
    const card=cards.find(node=>node.dataset.gearResult===href);
    if(!card)throw Error('Replacement gear option missing');
    card.click();
  },replacementHref);
  const fresh=await page.evaluate(()=>({
    item:structuredClone(gearDraft),
    enhancement:document.querySelector('[name="enhancement"]')?.value,
    skill:document.querySelector('[name="skill0"]')?.value,
    levels:document.querySelector('[name="levels0"]')?.value,
    statNotes:document.querySelector('[name="statNotes"]')?.value,
    notes:document.querySelector('[name="notes"]')?.value,
    stoneType:document.querySelector('[name="stoneType"]')?.value,
    stoneValue:document.querySelector('[name="stoneValue0"]')?.value
  }));
  assert.equal(fresh.item.href,replacementHref);
  assert.equal(fresh.item.enhancement,0);
  assert.deepEqual(fresh.item.skillBonuses,[]);
  assert.deepEqual(fresh.item.stones,[]);
  assert.equal(fresh.item.theostone,'');
  assert.equal(fresh.item.stoneType,'');
  assert.equal(fresh.item.statNotes,'');
  assert.equal(fresh.item.notes,'');
  assert.equal(fresh.enhancement,'0');
  assert.equal(fresh.skill,'');
  assert.equal(fresh.levels,'');
  assert.equal(fresh.statNotes,'');
  assert.equal(fresh.notes,'');
  assert.equal(fresh.stoneType,'');
  assert.equal(fresh.stoneValue,'');

  await page.locator('.gear-save').click();
  current=await page.evaluate(()=>account().equipment.top);
  assert.equal(current.href,replacementHref);
  assert.equal(current.enhancement,0);
  assert.deepEqual(current.skillBonuses,[]);
  assert(!current.stones.some(stone=>stone?.stat));
  assert(!await page.locator('#gear-skill-summary').getByText('Insulting Roar').count());

  await page.locator('[data-tab="boards"]').click();
  const board=await page.evaluate(()=>{
    const a=account();
    a.journey='endgame';a.context='party';a.crystals=119;
    a.boardMode='recommended';a.obtainedNodes=[];
    a.recommendedRouteSnapshot=null;state.tab='boards';state.board='Nezekan';
    render();
    const first=plannedRoute()[0];
    if(!toggleBoardObtained(first.id))throw Error('Cannot mark first recommended tile');
    const obtained=first.id;
    const poison=()=>{
      const snapshot=a.recommendedRouteSnapshot;
      if(!snapshot||snapshot.route.length<2)throw Error('Missing full route');
      a.recommendedRouteSnapshot={...snapshot,route:[snapshot.route[0]]};
      liveRoute=a.recommendedRouteSnapshot.route;
      a.customNodes=[first.id];
      a.customAzphelNodes=[-123];
    };
    poison();
    document.querySelector('#board-mode-recommended').click();
    const normal={
      recalculated:a.recommendedRouteSnapshot?.route.length>1,
      customCleared:!a.customNodes.length&&!a.customAzphelNodes.length,
      obtainedKept:a.obtainedNodes.includes(obtained),mode:a.boardMode
    };
    poison();
    a.boardMode='custom';render();
    document.querySelector('#v2-board-restore').click();
    const v2={
      recalculated:a.recommendedRouteSnapshot?.route.length>1,
      customCleared:!a.customNodes.length&&!a.customAzphelNodes.length,
      obtainedKept:a.obtainedNodes.includes(obtained),mode:a.boardMode
    };
    return {normal,v2};
  });
  for(const [label,result] of Object.entries(board)){
    assert(result.recalculated,label+' reused the stale route');
    assert(result.customCleared,label+' retained discarded custom planned nodes');
    assert(result.obtainedKept,label+' deleted an obtained tile');
    assert.equal(result.mode,'recommended');
  }
  assert.deepEqual(errors,[],'Browser runtime errors');
  console.log('Gear replacement clears prior rolls, same item preserves rolls, and both recommended board actions recalculate without deleting obtained tiles.');
} finally {
  await browser.close();
}
