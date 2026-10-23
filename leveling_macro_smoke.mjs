// Pre-45 leveling regression. The leveling UI must NOT reuse an endgame
// multi-stack rotation. Only classes with verified proc dependencies add steps.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 const result=await page.evaluate(()=>{
  const failures=[],classes=['templar','gladiator','assassin','ranger','sorcerer','spiritmaster','cleric','chanter'];
  let checked=0;
  for(const cls of classes)for(const context of ['solo','party'])for(const level of [1,3,4,7,8,11,14,16,22,23,27,32,37,44,45]){
   state.class=cls;const a=account();a.journey='leveling';a.context=context;leveling().level=level;
   render();
   const m=model(),r=document.querySelector('#rotation');
   const plan=buildLevelingCombat(cls,level,context,SKILL_UNLOCKS[cls],activeStigmas().slice(0,levelReward().slots),
     m.stigma.levels,(name,option)=>specPicks(name,effective(name,m)).includes(option));
   if(!r.classList.contains('leveling-view'))failures.push(cls+' '+level+': no leveling view');
   const oldMacro=document.querySelector('#macro-stacks');
   if(getComputedStyle(oldMacro).display!=='none')failures.push(cls+' '+level+': endgame macro still displayed');
   const shownRows=[...document.querySelectorAll('#leveling-stacks [data-leveling-skill]')];
   const groups=[...document.querySelectorAll('#leveling-stacks [data-stack-key]')];
   if(level<4){
    if(shownRows.length||groups.length||document.querySelector('#leveling-macro-step')?.textContent.includes('ONE step'))
      failures.push(cls+' '+level+': macro before Skills unlock');
   }else{
    const expected=cls==='sorcerer'&&level>=10?2:1;
    if(groups.length!==expected)failures.push(cls+' '+level+': expected '+expected+' key stacks');
    if(plan.steps.length!==expected)failures.push(cls+' '+level+': wrong step count');
    const stepCopy=document.querySelector('#leveling-macro-step')?.textContent||'';
    if(!stepCopy.includes(expected===1?'ONE step:':'TWO steps:'))
      failures.push(cls+' '+level+': macro description mismatch');
    for(const group of groups){
     const key=group.dataset.stackKey;
     const rows=[...group.querySelectorAll('[data-leveling-skill]')];
     const specified=plan.stacks.find(g=>g.key===key);
     if(!specified)failures.push(cls+' '+level+': unknown stack key '+key);
     if(!rows.length||rows.length>4)failures.push(cls+' '+level+': illegal '+key+' stack length');
     if(rows.some((el,i)=>Number(el.dataset.row)!==rows.length-i-1))
       failures.push(cls+' '+level+': '+key+' physical row order incorrect');
     if(rows.at(-1)?.dataset.levelingSkill!==specified?.stack[0])
       failures.push(cls+' '+level+': '+key+' bottom skill mismatch');
    }
   }
   const shownSkills=shownRows.map(el=>el.dataset.levelingSkill);
   const manual=[...document.querySelectorAll('#leveling-manual .leveling-skill strong')].map(el=>el.textContent);
   for(const name of [...shownSkills,...manual,plan.weave])
    if((SKILL_UNLOCKS[cls][name]||Infinity)>level)
      failures.push(cls+' '+context+' '+level+': locked '+name);
   if(shownSkills.includes(plan.weave))failures.push(cls+' '+level+': repeat attack in macro');
   const noCd=LEVELING_COMBAT[cls].noCooldown||[];
   if(plan.stacks.some(group=>group.stack.some((name,i)=>noCd.includes(name)&&group.stack.slice(i+1).some(above=>!noCd.includes(above)))))
    failures.push(cls+' '+level+': no-cooldown skill starves higher row');
   const expectedStigmas=activeStigmas().slice(0,levelReward().slots).filter(name=>(m.stigma.levels[name]||0)>0);
   if(expectedStigmas.some(name=>!document.querySelector('#leveling-rotation').textContent.includes(name)))
    failures.push(cls+' '+context+' '+level+': learned Stigma missing');
   checked++;
  }
  state.class='templar';let a=account();a.journey='leveling';a.context='solo';leveling().level=8;render();
  const templar=[...document.querySelectorAll('#leveling-stack [data-leveling-skill]')].map(e=>e.dataset.levelingSkill);
  if(templar.at(-1)!=='Judgment'||templar[0]!=='Pummel')failures.push('Templar level 8: Judgment not bottom, or Pummel not top fallback');
  state.class='sorcerer';a=account();a.journey='leveling';a.context='solo';leveling().level=11;render();
  if(!document.querySelector('#leveling-stack')?.textContent.includes('Firestorm')||
     document.querySelector('#leveling-stack')?.textContent.includes('Hellfire'))
    failures.push('Sorcerer level 11: wrong locked damage sequence');
  state.class='sorcerer';a=account();a.journey='leveling';a.context='solo';leveling().level=31;render();
  if(document.querySelectorAll('#leveling-stacks [data-stack-key]').length!==2||
     !document.querySelector('#leveling-macro-step')?.textContent.includes('TWO steps:'))
    failures.push('Sorcerer Lv31 should have Q/E elemental setup and proc stacks');
  if(document.querySelector('#leveling-stacks')?.textContent.includes('Hellfire'))
    failures.push('Sorcerer Lv31: charged Hellfire incorrectly placed in macro');
  state.class='chanter';a=account();a.journey='leveling';a.context='solo';leveling().level=14;render();
  if(document.querySelector('#leveling-stack')?.textContent.includes('Spinning Strike'))
    failures.push('Chanter pre-cooldown-reset stack used a second trigger');
  // The advanced level-45 UI must still return after leaving Leveling mode.
  state.class='templar';a=account();a.journey='endgame';a.context='party';render();
  if(document.querySelector('#rotation').classList.contains('leveling-view'))
    failures.push('Switching to Fresh 45 failed to restore the advanced rotation');
  if(getComputedStyle(document.querySelector('#macro-stacks')).display==='none')
    failures.push('Fresh 45 macro editor remained hidden after leaving Leveling mode');
  if(!document.querySelector('#macro-stacks').textContent.includes('Judgment'))
    failures.push('Fresh 45 Templar endgame macro was not restored');
  return {checked,failures,overflow:document.documentElement.scrollWidth-innerWidth};
 });
 assert.deepEqual(errors,[],'browser runtime errors');
 assert.deepEqual(result.failures,[],result.failures.join('\n'));
 assert(result.overflow<=8,'mobile horizontal overflow '+result.overflow+'px');
 console.log('Verified '+result.checked+' leveling class/context/level layouts with class-aware macro steps, bottom-first stacks and no locked skills.');
}finally{await browser.close()}
