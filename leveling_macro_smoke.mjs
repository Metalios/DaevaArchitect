import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
const result=await page.evaluate(()=>{
  const failures=[],classes=['templar','gladiator','assassin','ranger','sorcerer','spiritmaster','cleric','chanter'];
  let checked=0;
  for(const cls of classes)for(const context of ['solo','party'])for(const level of [1,4,11,14,16,22,23,27,45]){
    state.class=cls;const a=account();a.journey='leveling';a.context=context;leveling().level=level;render();
    const m=model(),active=new Set(Object.values(data().skills).slice(0,12).map(s=>s.name));
    const stigma=new Set(activeStigmas().slice(0,levelReward().slots).filter(name=>(m.stigma.levels[name]||0)>0));
    const usable=name=>active.has(name)?(SKILL_UNLOCKS[cls][name]||1)<=level:stigma.has(name);
    const listed=[...document.querySelectorAll('#macro-stacks .macro-stack:not(.macro-script) .stack-row span, #hotbar-grid .hotbar-skills strong')].map(el=>el.textContent).filter(name=>name!=='Flex slot');
    for(const name of listed)if(!usable(name))failures.push(`${cls} ${context} Lv ${level}: locked ${name}`);
    const macroKeys=[...document.querySelectorAll('#macro-stacks .macro-stack:not(.macro-script) .stack-heading .keycap')].map(el=>el.textContent);
    const steps=[...document.querySelectorAll('#macro-stacks .macro-script .stack-row')].filter(el=>el.firstElementChild.textContent.startsWith('Step')).map(el=>el.querySelector('span').textContent.split(' · ')[0]);
    for(const key of steps)if(!macroKeys.includes(key))failures.push(`${cls} ${context} Lv ${level}: missing stack ${key}`);
    if(document.querySelectorAll('#hotbar-grid .hotbar-card').length!==8)failures.push(`${cls} ${context} Lv ${level}: incomplete 1–8 bar`);
    if(getComputedStyle(document.querySelector('.macro-title')).display==='none')failures.push(`${cls} ${context} Lv ${level}: macro hidden`);
    checked++;
  }
  state.class='templar';account().journey='leveling';account().context='solo';leveling().level=1;render();
  const early=document.querySelector('#macro-stacks').textContent;
  if(!early.includes('Pummel')||early.includes('Doom Shield'))failures.push('Templar Lv 1 setup includes an unavailable Stigma or misses Pummel');
  state.class='sorcerer';account().journey='leveling';account().context='solo';leveling().level=11;render();
  const sorcerer=document.querySelector('#macro-stacks').textContent;
  if(!sorcerer.includes('Firestorm')||sorcerer.includes('Hellfire'))failures.push('Sorcerer Lv 11 macro has wrong skill unlocks');
  return {checked,failures,scroll:document.documentElement.scrollWidth,viewport:innerWidth};
});
assert.deepEqual(errors,[],'page errors');
assert.deepEqual(result.failures,[],'leveling macro and hotbar gates');
if(result.scroll>result.viewport){
  const offenders=await page.evaluate(()=>[...document.querySelectorAll('body *')].map(e=>{
    const r=e.getBoundingClientRect(),style=getComputedStyle(e);
    return {tag:e.tagName.toLowerCase(),id:e.id,cls:String(e.className).slice(0,100),x:Math.round(r.x),right:Math.round(r.right),width:Math.round(r.width),overflow:style.overflowX};
  }).filter(x=>x.right>innerWidth+12&&x.x<innerWidth+10).sort((a,b)=>b.right-a.right).slice(0,22));
  console.log('MOBILE OVERFLOW NODES',JSON.stringify(offenders));
}
assert.equal(result.scroll,result.viewport,'mobile horizontal overflow');
console.log(`Checked ${result.checked} class, context, and level combinations for visible, unlocked macros and 1–8 bars.`);
await browser.close();
