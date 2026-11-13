import {useLegacyRecommendations} from './legacy_recommendation_test_setup.mjs';
// Check measured Global cohort and local calibration controls in the
// actual static browser build. Synthetic recordings test plumbing only.
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 await useLegacyRecommendations(page);
  const state=await page.evaluate(()=>{
    const target=document.getElementById('global-cohort-summary');
    return {
      cohortLoaded:!!GlobalCohortBenchmarks?.valid(),
      classCount:Object.keys(GLOBAL_COMBAT_COHORT.classes).length,
      sampleTotal:GLOBAL_COMBAT_COHORT.sourceTotalPlayerSamples,
      hasBenchmark:!!target,
      hasUpload:!!document.getElementById('matched-calibration-files')
    };
  });
  assert(state.cohortLoaded&&state.classCount===8&&state.sampleTotal===13441);
  assert(state.hasBenchmark&&state.hasUpload);
  await page.evaluate(()=>{
    state.class='templar';
    account().journey='endgame';
    account().context='party';
    render();
  });
  const benchmark=await page.locator('#global-cohort-summary').innerText();
  assert(benchmark.includes('1,633')&&benchmark.includes('18,820'));
  const baseline={
    region:'Global',clientVersion:'2.0.9.0',classId:'templar',durationSeconds:60,
    benchmark:{buildLabel:'baseline',bossId:'Krao',difficulty:'Hard',
      targetScope:'boss',gearFingerprint:'test-gear',combatPower:100000,
      gearRating:2600,pingMs:55},
    events:[{timeMs:0,skill:'Pummel',type:'cast'},
      {timeMs:200,skill:'Pummel',type:'hit',damage:1000},
      {timeMs:1000,skill:'Punishment',type:'cast'},
      {timeMs:1400,skill:'Punishment',type:'hit',damage:2000}]
  };
  const files=Array.from({length:12},(_,i)=>{
    const candidate=i>=6,variant=i%6;
    const r=JSON.parse(JSON.stringify(baseline));
    r.benchmark.buildLabel=candidate?'candidate':'baseline';
    r.events[1].damage+=(candidate?500:0)+variant*10;
    r.events[3].damage+=(candidate?1000:0)+variant*20;
    return {name:'fight-'+i+'.json',mimeType:'application/json',
      buffer:Buffer.from(JSON.stringify(r))};
  });
  await page.locator('#matched-calibration-files').setInputFiles(files);
  await page.waitForFunction(()=>
    document.getElementById('matched-calibration-status').textContent.includes('12')||
    document.getElementById('matched-calibration-status').textContent.includes('6 baseline'));
  const result=await page.locator('#matched-calibration-status').innerText();
  assert(result.includes('6 baseline and 6 candidate'),result);
  assert(result.includes('90% resampled interval'),result);
  assert(result.includes('No build was automatically changed'),result);
  assert.deepEqual(errors,[]);
  console.log('Verified Global measured benchmark (13,441 samples) and offline 6+6 matched recording UI in Chromium.');
}finally{
  await browser.close();
}
