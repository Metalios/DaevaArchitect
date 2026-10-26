// Integration: Global Sorcerer recommendations must remain legal at real
// character-level budgets and react to funded boards and owned tiles.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
  const result=await page.evaluate(()=>{
    const failures=[];
    state.class='sorcerer';const a=account();
    a.journey='leveling';a.context='solo';
    a.leveling={level:36,extraByLevel:{}};
    a.obtainedNodes=[];a.manualMastery=null;a.manualStigma=null;
    a.customSpecialties={};a.boardMode='recommended';
    a.gear={};a.equipment={};a.recommendedRouteSnapshot=null;
    const audit=()=>{
      const m=model(),spent=m.mastery.spent;
      if(spent>budget('mastery'))failures.push('Mastery overspent at level '+currentLevel());
      if(m.boards.spent>budget('crystals'))failures.push('Board overspent at level '+currentLevel());
      if(!m.combat||!Number.isFinite(m.combat.score))
        failures.push('Global combat evaluation unavailable at level '+currentLevel());
      for(const [name,rank] of Object.entries(m.mastery.levels)){
        if(rank>masteryRankCap(name)||rank<1)failures.push(name+' illegal rank '+rank);
        const lv=skillLevelBreakdown(name,m);
        if(lv.withPlan!==Math.min(40,lv.mastery+lv.boardPlanned+lv.gear))
          failures.push(name+' derived level mismatch');
        const opts=specPicks(name,lv.withPlan);
        if(opts.length>specialtySlots(lv.withPlan))failures.push(name+' illegal Specialty slots');
      }
      return m;
    };
    let m=audit();
    const at36={mastery:budget('mastery'),crystals:budget('crystals'),
      stigma:budget('stigma'),slots:levelReward().slots,score:m.combat?.score};
    setLevel(37);
    m=audit();
    const at37={mastery:budget('mastery'),crystals:budget('crystals'),
      stigma:budget('stigma'),slots:levelReward().slots,score:m.combat?.score};
    if(at36.mastery!==147||at37.mastery!==153)failures.push('Lv 36-37 Mastery budget incorrect');
    if(at36.crystals!==100||at37.crystals!==104)failures.push('Lv 36-37 crystal budget incorrect');
    if(at36.slots!==3||at37.slots!==4)failures.push('Lv 37 Stigma slot did not unlock');
    if(at36.stigma!==14||at37.stigma!==15)failures.push('Lv 37 stigma points wrong');
    if(!document.querySelector('#v2-combat-evidence')?.textContent.includes('not measured DPS'))
      failures.push('Evidence label should disclose modeled/unverified nature');
    if(!document.querySelector('#rotation-control-status')?.textContent.includes('Q/E/R'))
      failures.push('AION 2 R-remap control layout disappeared');
    a.manualMastery={...m.mastery.levels};
    m=audit();
    if(m.mastery.spent>budget('mastery'))failures.push('Manual Mastery over budget');
    a.manualMastery=null;
    state.class='templar';
    const other=model();
    if(other.combat!==null)failures.push('Unvalidated class should use legal legacy recommendation');
    return {failures,at36,at37};
  });
  assert.deepEqual(errors,[],errors.join('\n'));
  assert.deepEqual(result.failures,[],result.failures.join('\n'));
  console.log('Global Sorcerer 36 -> 37 model, V2 evidence, board funding and rank caps pass:',JSON.stringify(result.at36),JSON.stringify(result.at37));
}finally{await browser.close()}
