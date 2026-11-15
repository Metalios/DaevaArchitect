// End-to-end character progression editor: real Global pets, collections,
// build library isolation, share-link sanitizer and desktop/mobile layout.
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 await page.evaluate(()=>{state.class='templar';render()});
 assert.equal(await page.locator('[data-v2-tab="collections"]').count(),1);
 await page.locator('[data-v2-tab="collections"]').click();
 assert.equal(await page.locator('#collections').isVisible(),true);
 assert.match(await page.locator('#collections').innerText(),/Pets & Genus/);
 await page.locator('#ca-pet-search').fill('Krall laborer');
 await page.locator('button[data-ca-pet="1002"][data-ca-level="3"]').click();
 let current=await page.evaluate(()=>account().characterProgression);
 assert.equal(current.pets['1002'],3);
 await page.locator('button[data-ca-view="wings"]').click();
 await page.locator('input[data-ca-wing-owned="Dark Veil Wings"]').check();
 await page.locator('input[data-ca-wing-enh="Dark Veil Wings"]').fill('5');
 await page.locator('input[data-ca-wing-enh="Dark Veil Wings"]').dispatchEvent('change');
 await page.locator('select[data-ca-equipped-wing]').selectOption('Dark Veil Wings');
 await page.locator('button[data-ca-view="pantheon"]').click();
 await page.locator('input[data-ca-pantheon-owned="1"]').check();
 await page.locator('input[data-ca-pantheon-equipped="1"]').check();
 await page.locator('input[data-ca-pantheon-name="1"]').fill('Artwork Recorded');
 await page.locator('input[data-ca-pantheon-name="1"]').dispatchEvent('change');
 await page.locator('button[data-ca-view="monolith"]').click();
 await page.locator('input[data-ca-monolith="reshanta"]').fill('16');
 await page.locator('input[data-ca-monolith="reshanta"]').dispatchEvent('change');
 await page.locator('button[data-ca-view="skins"]').click();
 await page.locator('input[data-ca-skin-points]').fill('450');
 await page.locator('input[data-ca-skin-points]').dispatchEvent('change');
 await page.locator('input[data-ca-skin-complete="1"]').check();
 current=await page.evaluate(()=>account().characterProgression);
 assert.equal(current.wings.equipped,'Dark Veil Wings');
 assert.equal(current.wings.owned['Dark Veil Wings'].enhancement,5);
 assert.equal(current.pantheon.slots[1].equipped,true);
 assert.equal(current.pantheon.slots[1].name,'Artwork Recorded');
 assert.equal(current.monolith.reshanta,16);
 assert.equal(current.skins.collectionPoints,450);
 assert.equal(current.skins.categories[1].complete,true);
 assert.deepEqual(errors,[],errors.join('\n'));
 const source=await page.evaluate(()=>DaevaBuildSanitizer.safeAccount(account(),'templar'));
 assert.equal(source.characterProgression.pets['1002'],3,'Shared-build sanitizer lost collection');
 assert.equal(source.characterProgression.wings.equipped,'Dark Veil Wings');
 const library=await page.evaluate(()=>{
   const b=DaevaBuildLibrary.addBuild('Templar collection test');
   const stageId=b.stages[0].id;
   const second=DaevaBuildLibrary.addStage(b.id,'Solo Abyss');
   const a=account();a.characterProgression.pets['1002']=1;save();
   return {buildId:b.id,firstId:stageId,secondId:second.id,
     firstPet:DaevaBuildLibrary.getData().builds[0].stages[0].account.characterProgression.pets['1002']};
 });
 assert.equal(library.firstPet,3,'Mutating new stage altered prior collection');
 const diff=await page.evaluate(({buildId,firstId,secondId})=>{
  const b=DaevaBuildLibrary.getData().builds.find(x=>x.id===buildId);
  const a=b.stages.find(x=>x.id===firstId),c=b.stages.find(x=>x.id===secondId);
  return DaevaBuildLibrary.differences(a.account,c.account,'templar');
 },library);
 assert(diff.some(x=>x.section==='Collections'), 'Stage comparison missing collections');
 await page.reload();
 assert.equal(await page.evaluate(()=>account().characterProgression.pets['1002']),1,'Progression lost after reload');
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{state.tab='collections';render()});
 assert.equal(await page.locator('#collections').count(),1,'Mobile collections panel missing');
 assert.deepEqual(errors,[],errors.join('\n'));
 console.log('PASS Global collection browser: pet search/Insight, wings, Monolith, Pantheon, skins, saved stages, compare, sanitized share and reload.');
}finally{await browser.close()}
