// Browser integration: full custom snapshot, stage switching, comparison,
// backup import and isolation from share links and blank builds.
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
  await page.evaluate(()=>{
    state.class='templar';
    const a=account();
    a.buildMode='custom';a.boardMode='custom';a.context='party';
    a.mastery=285;a.stigma=90;a.crystals=218;a.azphel=44;
    a.manualMastery={Judgment:6,Pummel:8};
    a.customStigmas=['Doom Shield','Noble Armor','Taunt','Shield of Protection'];
    a.manualStigma={'Doom Shield':10,'Noble Armor':10,Taunt:5,'Shield of Protection':10};
    a.customSpecialties={Judgment:[1,4]};
    a.customMacros={'endgame:party':{stacks:{Q:['Judgment'],E:['Pummel'],R:[]},
      steps:[{key:'Q',delay:50},{key:'E',delay:10}],hotbar:[['Taunt'],[],[],[],[],[],[],[]],weave:'Vicious Strike'}};
    render();
  });
  const trigger=page.locator('.v2-quickbar .db-launch');
  assert.equal(await trigger.count(),1,'Library launcher missing from workspace');
  await trigger.click();
  assert.equal(await page.locator('#db-dialog').isVisible(),true);
  await page.locator('#db-new-name').fill('Templar · Group Tank');
  await page.locator('#db-create-current').click();
  assert.equal(await page.locator('#db-dialog').isVisible(),false);
  const original=await page.evaluate(()=>{
    const lib=DaevaBuildLibrary.getData(),build=lib.builds[0];
    return {buildId:build.id,stageId:build.stages[0].id,count:lib.builds.length,
      mastery:build.stages[0].account.manualMastery.Judgment,
      macro:build.stages[0].account.customMacros['endgame:party'].steps[0].delay};
  });
  assert.equal(original.count,1);
  assert.equal(original.mastery,6);
  assert.equal(original.macro,50);
  // Real edit automatically updates only the active stage.
  const stage=await page.evaluate(buildId=>{
    const a=account();a.manualMastery.Judgment=8;
    a.equipment={weapon:{name:'Test Longsword',enhancement:15,
      stones:[{stat:'Attack',value:10,unit:'',grade:'Unique'}]}};
    render();
    const stage=DaevaBuildLibrary.addStage(buildId,'Nightmare DPS');
    const updated=account();
    updated.manualMastery.Judgment=10;
    updated.equipment.weapon.stones[0].value=20;
    render();
    return {id:stage.id,active:DaevaBuildLibrary.activeFor('templar')?.stage.id};
  },original.buildId);
  assert.equal(stage.id,stage.active);
  await trigger.click();
  assert.match(await page.locator('#db-build-list').innerText(),/Nightmare DPS/);

  // Stage details, rename and ordering all work without modifying build data.
  await page.locator(`[data-db-action="edit"][data-stage="${stage.id}"]`).click();
  await page.locator('#db-detail-name').fill('Nightmare Burst');
  await page.locator('#db-detail-rating').fill('2800');
  await page.locator('#db-detail-notes').fill('Preserve charge windows; prioritize CR upgrades.');
  await page.locator('#db-detail-save').click();
  assert.equal(await page.evaluate(id=>{
    const stage=DaevaBuildLibrary.getData().builds[0].stages.find(x=>x.id===id);
    return stage.name;
  },stage.id),'Nightmare Burst');
  await page.locator(`[data-db-action="move-up"][data-stage="${stage.id}"]`).click();
  assert.equal(await page.evaluate(()=>DaevaBuildLibrary.getData().builds[0].stages[0].name),'Nightmare Burst');
  await page.locator(`[data-db-action="move-down"][data-stage="${stage.id}"]`).click();
  // Compare must include Mastery, sockets and actual applied macro details.
  await page.locator('#db-compare-panel > summary').click();
  await page.locator('#db-left').selectOption(`${original.buildId}::${original.stageId}`);
  await page.locator('#db-right').selectOption(`${original.buildId}::${stage.id}`);
  assert.match(await page.locator('#db-difference').innerText(),/Judgment/);
  assert.match(await page.locator('#db-difference').innerText(),/socket lines/);
  // Open original stage and make sure edits in Nightmare did not propagate.
  await page.locator(`[data-db-action="load"][data-stage="${original.stageId}"]`).click();
  const restored=await page.evaluate(()=>({
    level:account().manualMastery.Judgment,
    stone:account().equipment.weapon.stones[0].value,
    name:DaevaBuildLibrary.activeFor('templar').stage.name
  }));
  assert.equal(restored.level,8);
  assert.equal(restored.stone,10);
  assert.equal(restored.name,'Current setup');
  // A new blank workspace must not clear the saved multi-stage library.
  await page.evaluate(()=>beginBlankBuild());
  assert.equal(await page.evaluate(()=>DaevaBuildLibrary.activeFor('templar')),null);
  assert.equal(await page.evaluate(()=>DaevaBuildLibrary.getData().builds[0].stages.length),2);
  const serialized=await page.evaluate(()=>JSON.stringify({
    format:'DaevaArchitectBuildLibrary',version:1,builds:DaevaBuildLibrary.getData().builds
  }));
  await trigger.click();
  await page.locator('#db-import').setInputFiles({name:'daeva-builds.json',mimeType:'application/json',buffer:Buffer.from(serialized)});
  await page.waitForFunction(()=>document.querySelector('#db-message')?.textContent.includes('Imported 1 build'));
  assert.equal(await page.evaluate(()=>DaevaBuildLibrary.getData().builds.length),2);
  await page.locator('#db-close').click();
  // All stage data survive browser reload.
  await page.reload();
  assert.equal(await page.evaluate(()=>DaevaBuildLibrary.getData().builds.length),2);
  assert.equal(await page.evaluate(()=>DaevaBuildLibrary.getData().builds[0].stages[1].account.manualMastery.Judgment),10);
  assert.deepEqual(errors,[],errors.join('\n'));
  console.log('PASS local multi-build library: UI create, stage autosave/switch, full diff, blank isolation, validated JSON import and reload persistence.');
} finally {await browser.close()}