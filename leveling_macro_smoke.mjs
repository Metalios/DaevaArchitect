// Pre-45 leveling regression. The leveling UI must NOT reuse an endgame
// multi-stack rotation. Each suggested macro has at most one step (a hotbar key).
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
   const shownRows=[...document.querySelectorAll('#leveling-stack [data-leveling-skill]')];
   if(level<4){
    if(shownRows.length||document.querySelector('#leveling-macro-step')?.textContent.includes('ONE step'))
      failures.push(cls+' '+level+': macro before Skills unlock');
   }else{
    if(!shownRows.length)failures.push(cls+' '+level+': missing simple stack');
    if(shownRows.length>4)failures.push(cls+' '+level+': more than four stack skills');
    if(!document.querySelector('#leveling-macro-step')?.textContent.includes('ONE step:'))
      failures.push(cls+' '+level+': macro is not single step');
    const rows=shownRows.map(e=>Number(e.dataset.row));
    if(rows.some((row,i)=>row!==shownRows.length-i-1))
      failures.push(cls+' '+level+': visual order not highest physical row at top');
    const atBottom=shownRows.at(-1);
    if(atBottom?.dataset.row!=='0'||atBottom?.dataset.levelingSkill!==plan.stack[0])
      failures.push(cls+' '+level+': row zero not bottom/highest priority');
   }
   const shownSkills=[...document.querySelectorAll('#leveling-stack [data-leveling-skill]')].map(el=>el.dataset.levelingSkill);
   const manual=[...document.querySelectorAll('#leveling-manual .leveling-skill strong')].map(el=>el.textContent);
   for(const name of [...shownSkills,...manual,plan.weave])
    if((SKILL_UNLOCKS[cls][name]||Infinity)>level)
      failures.push(cls+' '+context+' '+level+': locked '+name);
   if(shownSkills.includes(plan.weave))failures.push(cls+' '+level+': repeat attack in macro');
   const noCd=LEVELING_COMBAT[cls].noCooldown||[];
   if(plan.stack.some((name,i)=>noCd.includes(name)&&plan.stack.slice(i+1).some(above=>!noCd.includes(above))))
    failures.push(cls+' '+level+': no-cooldown skill starves higher row');
   if(plan.steps.length>1)failures.push(cls+' '+level+': unnecessary multi-step macro');
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
 console.log('Verified '+result.checked+' leveling class/context/level layouts with one macro step, bottom-first stack priority and no locked skills.');
}finally{await browser.close()}
