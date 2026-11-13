// Browser regression: custom builder is default; recommendations are opt-in,
// preview cannot mutate a saved character, and applying creates an editable copy.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const browser=await chromium.launch({headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
  const result=await page.evaluate(()=>{
    const problems=[],summary={};
    for(const cls of CLASS_ORDER){
      state.class=cls;
      const a=account(),m=model();
      if(a.buildMode!=='custom'||a.boardMode!=='custom')problems.push(cls+' default mode');
      if(m.mastery.spent!==0||m.stigma.spent!==0||
        m.boards.spent!==0||m.azphel.spent!==0||m.ariel.spent!==0)
        problems.push(cls+' has automatic allocations');
      if(activeStigmas().some(Boolean))problems.push(cls+' nonempty Stigma slots');
    }
    state.class='ranger';const a=account();
    a.mastery=300;a.stigma=90;a.crystals=230;a.azphel=30;
    a.context='pvp-arena';a.pvpOpponent='sorcerer';
    a.manualMastery={'Deadshot':8};
    a.customStigmas=['Bow of Blessing',null,null,null];
    a.manualStigma={'Bow of Blessing':5};
    const before=JSON.stringify(a);
    const plan=previewRecommendedBuild();
    if(JSON.stringify(a)!==before)problems.push('Preview modified custom account');
    if(plan.stigmas.length!==4||plan.customNodes.length<1)
      problems.push('Recommendation preview incomplete');
    applyRecommendedBuild();
    const applied=account(),rank=applied.manualMastery.Deadshot;
    if(applied.buildMode!=='custom'||applied.boardMode!=='custom'||
       !applied.customStigmas.every(Boolean)||!applied.customNodes.length)
       problems.push('Apply did not produce fully editable snapshot');
    const saved=JSON.stringify({
      mastery:applied.manualMastery,stigma:applied.manualStigma,
      loadout:applied.customStigmas,nodes:applied.customNodes,
      azphel:applied.customAzphelNodes,ariel:applied.customArielNodes,
      specs:applied.customSpecialties
    });
    setContext('pvp-abyss-solo');
    applied.pvpOpponent='cleric';
    applied.mastery=310;applied.stigma=100;
    render();
    const after=JSON.stringify({
      mastery:applied.manualMastery,stigma:applied.manualStigma,
      loadout:applied.customStigmas,nodes:applied.customNodes,
      azphel:applied.customAzphelNodes,ariel:applied.customArielNodes,
      specs:applied.customSpecialties
    });
    if(saved!==after)problems.push('Scenario or budget silently changed applied snapshot');
    if(model().mastery.spent>applied.mastery||model().stigma.spent>applied.stigma)
      problems.push('Applied snapshot exceeds entered resource budgets');
    beginBlankBuild();
    const empty=model();
    if(empty.mastery.spent||empty.stigma.spent||empty.boards.spent||
       activeStigmas().some(Boolean)||Object.keys(applied.equipment).length)
      problems.push('Blank build did not clear allocations');
    return {problems,summary:{classes:CLASS_ORDER.length,proposedStigmas:plan.stigmas,
      selectedRouteTiles:plan.customNodes.length,initialDeadshot:rank}};
  });
  assert.deepEqual(result.problems,[],result.problems.join('\n'));
  assert.deepEqual(errors,[],errors.join('\n'));
  assert.equal(await page.locator('#v2-new-blank').count(),1);
  assert.equal(await page.locator('#v2-preview-recommended').count(),1);
  assert.equal(await page.locator('#v2-reset-allocations').innerText(),'Apply recommendation');
  console.log('PASS custom-first eight-class builds, preview transaction, editable apply, scenario isolation, and reset:',JSON.stringify(result.summary));
} finally {await browser.close()}
