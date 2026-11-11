// Regression: character-first budgets remain editable on every page, and the
// six Daevanion boards clearly distinguish recommendations from purchases.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  const url=pathToFileURL(path.resolve('dist/index.html'));
  url.searchParams.set('layout','character');
  await page.goto(url.href);
  if(!await page.locator('body.v5-active').count()){
    await page.locator('#class-buttons [data-class="templar"]').click();
  }
  await page.waitForFunction(()=>document.body.classList.contains('v5-active'));
  const panel=page.locator('#v5-resources');
  assert(await panel.isVisible(),'Resource editor is missing from new layout');
  for(const id of ['mastery-input','stigma-input','crystal-input','azphel-input','ariel-input']){
    assert(await page.locator('#v5-resource-inputs #'+id).isVisible(),id+' is hidden');
  }
  const values=[
    ['mastery-input',285,'mastery'],
    ['stigma-input',80,'stigma'],
    ['crystal-input',416,'crystals'],
    ['azphel-input',44,'azphel'],
    ['ariel-input',20,'ariel']
  ];
  for(const [id,value,key] of values){
    await page.locator('#'+id).fill(String(value));
    await page.locator('#'+id).blur();
    const actual=await page.evaluate(key=>account()[key],key);
    assert.equal(actual,value,id+' was not saved as the earned budget');
  }
  await page.locator('.v5-page-tabs [data-v5-view="boards"]').click();
  assert(await panel.isVisible(),'Progression point inputs disappeared in board view');
  const board=await page.evaluate(()=>{
    const legend=document.querySelector('.board-map-head .board-legend');
    if(!legend||getComputedStyle(legend).display==='none')
      throw Error('Board legend moved into hidden More tools');
    const grid=document.querySelector('#board-grid');
    const recommended=grid.querySelector('.node.board-suggested:not(.obtained)');
    const ordinary=grid.querySelector('.node.stat:not(.obtained)');
    if(!recommended||!ordinary)throw Error('No rendered board route and stat tile');
    const rect=el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height});
    const statArt=ordinary.querySelector('.node-stat-game-icon');
    const statLabel=ordinary.querySelector('.node-stat-fallback');
    if(!statArt||getComputedStyle(statArt).display!=='none')
      throw Error('Decorative brown art is obscuring the compact stat label');
    if(!statLabel||getComputedStyle(statLabel).display==='none')
      throw Error('Stat abbreviation hidden');
    if(getComputedStyle(recommended).outlineStyle==='none')
      throw Error('Recommended nodes missing blue outline');
    if(rect(recommended).width<35)throw Error('Node size too small');
    return {legend:legend.textContent,recommended:recommended.dataset.node};
  });
  assert(board.legend.includes('Recommended')||board.legend.includes('Blue'),'Board legend is missing recommended meaning');
  // Mark a legal recommended tile, then verify purchased status remains distinct.
  await page.evaluate(()=>{
    const candidate=document.querySelector('#board-grid .node.board-suggested:not(.obtained)');
    candidate.dispatchEvent(new MouseEvent('dblclick',{bubbles:true}));
  });
  const marked=await page.evaluate(()=>{
    const node=document.querySelector('#board-grid .node.obtained');
    if(!node)return false;
    const color=getComputedStyle(node).outlineColor;
    return getComputedStyle(node).outlineWidth==='3px'&&color!=='rgb(57, 174, 255)';
  });
  assert(marked,'Purchased tile is not clearly distinguished from planned blue tiles');
  await page.reload();
  await page.evaluate(()=>{state.class='templar';render();});
  await page.waitForFunction(()=>document.body.classList.contains('v5-active'));
  for(const [id,value,key] of values)assert.equal(await page.evaluate(k=>account()[k],key),value,id+' was lost on reload');
  await page.setViewportSize({width:390,height:844});
  await page.locator('#v5-resource-inputs #mastery-input').waitFor({state:'visible'});
  const mobile=await page.evaluate(()=>{
    const card=document.querySelector('#v5-resources');
    const input=document.querySelector('#stigma-input');
    return {visible:!!card&&card.getBoundingClientRect().width>0,
      inputWidth:input.getBoundingClientRect().width,
      horizontalOverflow:card.scrollWidth-card.clientWidth};
  });
  assert(mobile.visible&&mobile.inputWidth>=60,'Mobile resource controls collapsed');
  assert(mobile.horizontalOverflow<=5,'Resource panel overflows horizontally');
  assert.deepEqual(errors,[],errors.join('; '));
  console.log('Character resources, save/reload, visible board legend, route contrast and mobile controls passed.');
}finally{
  await browser.close();
}
