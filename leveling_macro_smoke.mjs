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
   const modeGuide=document.querySelector('#rotation .rotation-control-mode');
   if(!modeGuide||getComputedStyle(modeGuide).display==='none')
     failures.push(cls+' '+level+': AION 2 control mode card hidden in leveling view');
   const plan=buildLevelingCombat(cls,level,context,SKILL_UNLOCKS[cls],activeStigmas().slice(0,levelReward().slots),
     m.stigma.levels,(name,option)=>specPicks(name,effective(name,m)).includes(option));
   if(cls==='sorcerer'&&m.combat?.macro){
     const available=new Set(plan.stacks.flatMap(group=>group.stack));
     plan.stacks=m.combat.macro.stacks.map(group=>{
       const stack=group.skills.filter(name=>available.has(name));
       return {key:group.key,stack};
     }).filter(group=>group.stack.length);
     plan.steps=plan.stacks.map(group=>group.key);
   }
   if(!r.classList.contains('leveling-view'))failures.push(cls+' '+level+': no leveling view');
   const oldMacro=document.querySelector('#macro-stacks');
   if(getComputedStyle(oldMacro).display!=='none')failures.push(cls+' '+level+': endgame macro still displayed');
   const shownRows=[...document.querySelectorAll('#leveling-stacks [data-leveling-skill]')];
   const groups=[...document.querySelectorAll('#leveling-stacks [data-stack-key]')];
   if(level<4){
    if(shownRows.length||groups.length||document.querySelector('#leveling-macro-step')?.textContent.includes('ONE step'))
      failures.push(cls+' '+level+': macro before Skills unlock');
   }else{
    const expected=plan.steps.length;
    if(groups.length!==expected)failures.push(cls+' '+level+': expected '+expected+' key stacks');
    if(cls==='sorcerer'&&level>=10&&expected<1)failures.push(cls+' '+level+': no automatic damage stack');
    const stepCopy=document.querySelector('#leveling-macro-step')?.textContent||'';
    if(!stepCopy.includes((['ZERO','ONE','TWO','THREE'][expected]||expected)+' step'+(expected===1?'':'s')+':'))
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
   for(const name of [...shownSkills,...manual,plan.weave]){
    const classReady=SKILL_UNLOCKS[cls][name]!==undefined&&SKILL_UNLOCKS[cls][name]<=level;
    const stigmaReady=(m.stigma.levels[name]||0)>0&&activeStigmas().slice(0,levelReward().slots).includes(name);
    if(!classReady&&!stigmaReady)failures.push(cls+' '+context+' '+level+': locked '+name);
   }
   if(shownSkills.includes(plan.weave))failures.push(cls+' '+level+': repeat attack in macro');
   if(level>=4&&!document.querySelector('#leveling-control-pair')&&!document.querySelector('.leveling-control-pair'))
     failures.push(cls+' '+level+': missing visible LMB + Macro controls');
   if(level>=4&&document.querySelector('#leveling-macro-bind')?.value!=='RMB')
     failures.push(cls+' '+level+': macro must default to RMB');
   const numbered=[...document.querySelectorAll('#leveling-manual [data-manual-key]')];
   if(numbered.length>4)failures.push(cls+' '+level+': more than four primary manual powers');
   if(numbered.some((n,i)=>n.dataset.manualKey!==String(i+1)))
     failures.push(cls+' '+level+': manual keys not clearly numbered');
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
  const expectedSorc=model().combat.macro.steps;
  const actualSorc=[...document.querySelectorAll('#leveling-stacks [data-stack-role="macro"]')].map(el=>el.dataset.stackKey);
  if(!actualSorc.length||actualSorc.length>3||
     actualSorc.some(key=>!expectedSorc.includes(key)))
    failures.push('Sorcerer Lv31 visible macro must use feasible optimized Q/E/R subset');
  if(!document.querySelector('#leveling-manual [data-manual-key="1"]')?.textContent.includes('Hellfire'))
    failures.push('Sorcerer Lv31 manual key 1 should charge Hellfire');
  if(['Hellfire','Wish of Concentration','Element Enhancement','Delayed Explosion'].some(name=>[...document.querySelectorAll('#leveling-stacks [data-leveling-skill]')].some(node=>node.dataset.levelingSkill===name)))
    failures.push('Sorcerer Lv31: charged Hellfire or buff included in macro');
  if(!document.querySelector('#leveling-manual [data-manual-key="2"]')?.textContent.includes('Wish of Concentration'))
    failures.push('Sorcerer Lv31: Wish buff should be manual on 2');
  if(!document.querySelector('#leveling-stacks')?.textContent.includes('Firestorm'))
    failures.push('Sorcerer Lv31: Firestorm missing from optimized automatic stacks');
  const bind=document.querySelector('#leveling-macro-bind');
  bind.value='M';bind.dispatchEvent(new Event('change',{bubbles:true}));
  if(account().macroBind!=='M'||document.querySelector('#leveling-macro-bind')?.value!=='M'||
     !document.querySelector('#leveling-rotation')?.textContent.includes('LMB + M'))
    failures.push('Changing macro hotkey to keyboard M does not update/survive a render');
  account().macroBind='RMB';render();
  // AION 2 mode has a separate Quick Use 2 key. The keyboard T -> R
  // remap is not an alternate basic attack and must update macro diagrams.
  const quickUse2=document.querySelector('#quick-use-2-bind');
  if(!quickUse2||quickUse2.value!=='R'||!document.querySelector('#rotation-control-status')?.textContent.includes('T → R'))
    failures.push('AION 2 mode default T-to-R Quick Use 2 guidance missing');
  quickUse2.value='T';quickUse2.dispatchEvent(new Event('change',{bubbles:true}));
  if(account().quickUse2Bind!=='T'||document.querySelector('#quick-use-2-bind').value!=='T'||
     !document.querySelector('#rotation-stack-bindings')?.textContent.includes('Q · E · T'))
    failures.push('Changing Quick Use 2 from remapped R to original T did not update/re-render');
  const groundPlan=buildLevelingCombat('sorcerer',45,'party',SKILL_UNLOCKS.sorcerer,
    ['Fire Wall'],{'Fire Wall':5});
  const sample=document.createElement('div');
  sample.innerHTML=renderLevelingCombatMarkup(groundPlan,'RMB',account().quickUse2Bind);
  if(!sample.querySelector('[data-stack-key="T"]')||
     ![...sample.querySelectorAll('#leveling-macro-step kbd')].some(k=>k.textContent==='T'))
    failures.push('Leveling R-based ground macro should display physical T when not remapped');
  const resetQuickUse2=document.querySelector('#quick-use-2-bind');
  resetQuickUse2.value='R';resetQuickUse2.dispatchEvent(new Event('change',{bubbles:true}));
  if(account().quickUse2Bind!=='R'||!document.querySelector('#rotation-control-status')?.textContent.includes('Q/E/R'))
    failures.push('Quick Use 2 R remap did not restore after original T was selected');
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
  const overflowing=[...document.querySelectorAll('body *')].filter(el=>{
    const st=getComputedStyle(el),rect=el.getBoundingClientRect();
    return st.display!=='none'&&st.visibility!=='hidden'&&rect.width>0&&
      (rect.right>innerWidth+8||rect.left< -8);
   }).slice(0,15).map(el=>({element:el.tagName,selector:el.id?('#'+el.id):('.'+String(el.className||'').trim().split(/\\s+/).slice(0,2).join('.')),right:Math.round(el.getBoundingClientRect().right),width:Math.round(el.getBoundingClientRect().width)}));
  return {checked,failures,overflow:document.documentElement.scrollWidth-innerWidth,overflowing};
 });
 assert.deepEqual(errors,[],'browser runtime errors');
 assert.deepEqual(result.failures,[],result.failures.join('\n'));
 assert(result.overflow<=8,'mobile horizontal overflow '+result.overflow+'px; offenders '+JSON.stringify(result.overflowing));
 console.log('Verified '+result.checked+' leveling class/context/level layouts with class-aware macro steps, bottom-first stacks and no locked skills.');
}finally{await browser.close()}
