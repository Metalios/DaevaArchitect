// End-to-end joint recommendation contract: real app with all six boards
// and actual browser state. Run after python build.py:
// node joint_progression_smoke.mjs
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1365,height:900}});
  const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
  const result=await page.evaluate(()=>{
    const problems=[],classes=['templar','gladiator','assassin','ranger',
      'sorcerer','spiritmaster','cleric','chanter'];
    const testModes=['party','solo','pvp-arena','pvp-abyss-group'];
    const names=()=>skillNames();
    let checked=0,improved=0;
    for(const cls of classes){
      for(const context of testModes){
        state.class=cls;
        const a=account();
        a.journey='endgame';a.context=context;a.pveObjective='performance';
        a.mastery=285;a.stigma=61;a.crystals=218;a.azphel=50;a.ariel=50;
        a.manualMastery=null;a.manualStigma=null;
        a.customStigmas=null;a.customSpecialties={};a.boardMode='recommended';
        a.obtainedNodes=[];a.gear={};a.equipment={};
        a.recommendedRouteSnapshot=null;
        const m=model();
        const masteryPoints=Object.values(m.mastery.levels).reduce((sum,level)=>{
          for(let r=2;r<=level;r++)sum+=masteryCost(r);
          return sum;
        },0);
        const stigmaPoints=Object.values(m.stigma.levels).reduce((sum,level)=>{
          for(let r=1;r<=level;r++)sum+=stigmaCost(r);
          return sum;
        },0);
        if(masteryPoints!==m.mastery.spent||masteryPoints>285)
          problems.push(cls+' '+context+' invalid Mastery spend');
        if(stigmaPoints!==m.stigma.spent||stigmaPoints>61)
          problems.push(cls+' '+context+' invalid Stigma spend');
        if(names().some(name=>m.mastery.levels[name]>10||
          m.mastery.levels[name]<1))
          problems.push(cls+' '+context+' invalid purchased rank');
        if(m.boards.spent>218||m.ariel.spent>50||m.azphel.spent>50)
          problems.push(cls+' '+context+' cross-currency overspend');
        if(m.joint&&!m.joint.error){
          if(m.joint.scoreAfter+1e-8<m.joint.scoreBefore)
            problems.push(cls+' '+context+' optimizer reduced its objective');
          if(m.joint.mastery?.spent>285||m.joint.stigma?.spent>61)
            problems.push(cls+' '+context+' illegal joint trade');
          improved+=Number(m.joint.scoreAfter>m.joint.scoreBefore+1e-8);
        }
        if(m.ariel.owned.size!==0&&a.ariel===0)problems.push('Ariel inserted free allocation');
        if(m.azphel.owned.size!==0&&a.azphel===0)problems.push('Azphel inserted free allocation');
        renderRotation(m);
        const selected=new Set(activeStigmas().filter(name=>(m.stigma.levels[name]||0)>0));
        const legal=new Set([...Object.values(data().skills).slice(0,12).map(x=>x.name),...selected]);
        for(const entry of document.querySelectorAll('#macro-stacks .macro-stack-auto .stack-row')){
          const name=entry.dataset.skill;
          if(name&&!legal.has(name))problems.push(cls+' '+context+' invalid macro skill '+name);
        }
        checked++;
      }
    }
    // Separate Ariel/Azphel purchases must not enter the connected optimizer
    // for Nezekan/Zikel/Vaizel/Triniel (different graph and currencies).
    state.class='templar';
    const specialAccount=account();
    specialAccount.context='party';
    specialAccount.customStigmas=null;
    specialAccount.manualMastery=null;
    specialAccount.manualStigma=null;
    specialAccount.obtainedNodes=[arielRoute()[0].id,azphelRoute()[0].id];
    specialAccount.recommendedRouteSnapshot=null;
    const specialModel=model();
    if(specialAccount.lastObjectiveAnalysis?.error)
      problems.push('Obtained Ariel/Azphel nodes broke the four-board search: '+
        specialAccount.lastObjectiveAnalysis.error);
    if(specialModel.boards.spent>specialAccount.crystals)
      problems.push('Four-board optimizer exceeded its own independent budget');
    state.class='templar';const a=account();
    a.context='party';a.manualMastery={...model().mastery.levels};
    a.manualStigma={...model().stigma.levels};
    const owned=a.obtainedNodes.slice();
    const before={...a.manualMastery},stigmaBefore={...a.manualStigma};
    const pinned=model();
    if(JSON.stringify(pinned.mastery.levels)!==JSON.stringify(before))
      problems.push('Manual Mastery ranks replaced');
    if(JSON.stringify(pinned.stigma.levels)!==JSON.stringify(stigmaBefore))
      problems.push('Manual Stigma ranks replaced');
    if(JSON.stringify(a.obtainedNodes)!==JSON.stringify(owned))
      problems.push('Obtained board marks changed');
    return {checked,improved,problems};
  });
  assert.deepEqual(pageErrors,[],'Browser errors: '+pageErrors.join('; '));
  assert.deepEqual(result.problems,[],'Joint progression browser checks failed');
  assert.equal(result.checked,32);
  console.log('Validated '+result.checked+' class/context builds, '+
    result.improved+' objective improvements and manual/obtained-node preservation.');
}finally{await browser.close()}
