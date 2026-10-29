// Browser smoke test for the v2 build composer. Requires: npm install playwright
// and npx playwright install chromium. No changes to the user's saved browser data.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium} from 'playwright';

const root=path.resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
const server=http.createServer((req,res)=>{
 const clean=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const file=path.resolve(root,'.'+(clean==='/'?'/index.html':clean));
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return}
 res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});
 fs.createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
async function verifyAdvancedCards(page,width){
 const details=page.locator('.v2-advanced-skills');
 await details.evaluate(el=>{el.open=true});
 const result=await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('#mastery .v2-advanced-skills #skill-grid .skill-card')].slice(0,6);
   return cards.map(card=>{
     const name=card.querySelector('h3'),identity=card.querySelector('.mastery-identity'),
       target=card.querySelector('.mastery-target'),specialty=card.querySelector('.mastery-picked li'),
       nameRect=name.getBoundingClientRect(),identityRect=identity.getBoundingClientRect(),
       targetRect=target.getBoundingClientRect();
     const intersection=Math.max(0,Math.min(identityRect.right,targetRect.right)-Math.max(identityRect.left,targetRect.left))*
       Math.max(0,Math.min(identityRect.bottom,targetRect.bottom)-Math.max(identityRect.top,targetRect.top));
     const lineHeight=parseFloat(getComputedStyle(name).lineHeight)||24;
     return {title:name.textContent.trim(),cardWidth:card.getBoundingClientRect().width,
       titleWidth:nameRect.width,titleLines:nameRect.height/lineHeight,intersection,
       specialtyWidth:specialty?.getBoundingClientRect().width||0,
       overflow:card.scrollWidth-card.clientWidth};
   });
 });
 assert(result.length>=3,width+': advanced Mastery cards absent');
 for(const card of result){
   assert(card.titleWidth>=100,width+': skill title collapsed into vertical letters: '+JSON.stringify(card));
   assert(card.titleLines<=3.25,width+': title wrapped excessively: '+JSON.stringify(card));
   assert(card.intersection<2,width+': name and target rank overlap: '+JSON.stringify(card));
   assert(card.specialtyWidth===0||card.specialtyWidth>=140,
     width+': specialty is too narrow: '+JSON.stringify(card));
   assert(card.overflow<=3,width+': card content clipped: '+JSON.stringify(card));
 }
 await details.evaluate(el=>{el.open=false});
}
try{
 for(const width of [1280,1920,3440]){
  const page=await browser.newPage({viewport:{width,height:1080},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(width+': '+error.message));
  const port=server.address().port;
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#class-buttons [data-class="templar"]').click();
  await page.locator('#v2-skill-list .v2-skill').first().waitFor();
  assert.equal(await page.locator('.v2-workspace').isVisible(),true,width+': unified workspace hidden');
  // Board tabs and routine commands are a single compact dock over the map.
  const dock=page.locator('.v2-board-dock');
  assert.equal(await dock.count(),1,width+': compact board dock is missing');
  const boardGeometry=await page.evaluate(()=>{
    const tabs=document.querySelector('#board-tabs').getBoundingClientRect();
    const map=document.querySelector('.board-map-head').getBoundingClientRect();
    const options=document.querySelector('#v2-board-options');
    return {gap:map.top-tabs.bottom,expanded:options.open};
  });
  assert(boardGeometry.gap>=0&&boardGeometry.gap<160,
    width+': oversized controls separate tabs from map '+JSON.stringify(boardGeometry));
  assert.equal(boardGeometry.expanded,false,width+': destructive tools expanded by default');
  const more=page.locator('#v2-board-options');
  await more.locator(':scope > summary').click();
  assert.equal(await more.evaluate(el=>el.open),true,width+': More tools inaccessible');
  assert.equal(await page.locator('#v2-board-reset-selections').isVisible(),true,
    width+': destructive reset missing from More tools');
  await more.locator(':scope > summary').click();
  assert.equal(await more.evaluate(el=>el.open),false);
  await page.locator('#board-tabs [data-board="Zikel"]').click();
  assert.match(await page.locator('#board-map-title').innerText(),/Zikel/,width+': board switch failed');
  await page.locator('#v2-board-fit').click();
  const fitZoom=Number((await page.locator('#v2-zoom-label').innerText()).replace('px',''));
  assert(fitZoom>=40&&fitZoom<=52,width+': Fit must never shrink below readable node size');
  if(width===1280){
    const sticky=await page.evaluate(()=>{
      const right=document.querySelector('.v2-right'),nav=document.querySelector('.v2-board-dock');
      right.scrollTop=250;
      const rect=right.getBoundingClientRect(),dock=nav.getBoundingClientRect();
      const result={scroll:right.scrollTop,top:dock.top-rect.top};
      right.scrollTop=0;
      return result;
    });
    assert(sticky.scroll<10||Math.abs(sticky.top)<16,
      width+': board navigation escapes independent scroll column '+JSON.stringify(sticky));
  }

  if(width===1920||width===3440){
    const rects=await page.evaluate(()=>['.v2-left','.v2-center','.v2-right'].map(selector=>{
      const {top,left,width}=document.querySelector(selector).getBoundingClientRect();return {top,left,width}
    }));
    assert(Math.max(...rects.map(r=>r.top))-Math.min(...rects.map(r=>r.top))<20,
      width+': all three panels should share one desktop row');
    assert(rects[0].left<rects[1].left&&rects[1].left<rects[2].left);
  }
  assert.equal(await page.locator('#gear-doll-grid').count(),1);
  assert.equal(await page.locator('#board-grid .node').count(),89,width+': Nezekan shape mismatch');
  assert((await page.locator('#board-grid .node .node-game-icon').count())>0,width+': missing actual class skill artwork');
  const square=await page.locator('#board-grid .node').first().evaluate(el=>Math.abs(el.getBoundingClientRect().width-el.getBoundingClientRect().height)<1);
  assert(square,width+': Daevanion tiles must be square');
  assert((await page.locator('#board-grid .node.recommended').count())>0,width+': missing recommendation overlay');
  assert.match(await page.locator('#v2-status').innerText(),/Following recommended/);
  // Advanced equipment details must not dominate the main screen.
  const advanced=page.locator('.v2-gear-advanced');
  assert.equal(await advanced.evaluate(el=>el.open),false);
  await advanced.locator(':scope > summary').click();
  assert.equal(await advanced.evaluate(el=>el.open),true);
  assert.equal(await page.locator('#gear-arcana-grid').count(),1);
  await advanced.locator(':scope > summary').click();
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  await page.waitForFunction(()=>window.scrollY===0);
  fs.mkdirSync('v2-previews',{recursive:true});
  await page.screenshot({path:'v2-previews/workspace-'+width+'.png',fullPage:true});
   await verifyAdvancedCards(page,width);
   if(width===1920){
     await page.evaluate(()=>{state.class='sorcerer';state.tab='mastery';render()});
     await verifyAdvancedCards(page,width);
     await page.locator('.v2-advanced-skills').evaluate(el=>{el.open=true});
     await page.locator('#mastery .skill-card').first().screenshot({
       path:'v2-previews/advanced-mastery-sorcerer-1920.png'
     });
     await page.evaluate(()=>{state.class='templar';state.tab='mastery';render()});
   }
  // Inputs are not a build decision.
  await page.locator('#mastery-input').fill('220');
  await page.locator('#mastery-input').press('Tab');
  assert.match(await page.locator('#v2-status').innerText(),/Following recommended/,width+': points marked custom');
  if(width>=1920){
    const cardColumns=await page.locator('#v2-stigma-list').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert.equal(cardColumns,4,'Stigmas must show four icon cards across in the desktop mock');
  }
  assert.equal(await page.locator('#v2-stigma-list .v2-stigma-art img').count(),4,
    width+': all four equipped Stigmas need their actual icons');
  const stigmaArt=await page.locator('#v2-stigma-list .v2-stigma-art img').first().getAttribute('src');
  assert.match(stigmaArt,/assets\.playnccdn\.com\/static-aion2-gamedata\/resources\/ICON_[A-Z]+_SKILL_\d+\.png/,
    width+': Stigma image is not the official client icon');
  assert.equal(await page.locator('#v2-spec-panel').isVisible(),false,
    width+': Specialties must not stay open by default');
  await page.locator('#v2-skill-list [data-v2-select-skill="Pummel"]').click();
  assert.equal(await page.locator('#v2-spec-panel').isVisible(),true);
  assert.equal(await page.locator('#v2-spec-panel [data-v2-spec]').count(),5);
  assert.match(await page.locator('#v2-spec-panel').innerText(),/MP consumed/);
  if(width===1920)await page.screenshot({path:'v2-previews/specialties-flyout-1920.png',fullPage:true});
  await page.locator('#v2-spec-close').click();
  assert.equal(await page.locator('#v2-spec-panel').isVisible(),false);
  await page.locator('#v2-passive-filter').click();
  assert.equal(await page.locator('#v2-skill-list .v2-skill').count(),10);
  await page.locator('#v2-active-filter').click();
  // Explicit rank change becomes customized; restore returns to recommended.
  await page.locator('#v2-skill-list [data-v2-rank="Pummel"][data-dir="-1"]').click();
  assert.match(await page.locator('#v2-status').innerText(),/Modified progression/);
  await page.locator('#v2-reset-allocations').click();
  assert.match(await page.locator('#v2-status').innerText(),/Following recommended/);
  // Stigma level edits must affect the actual allocation and build status.
  assert.equal(await page.locator('#v2-stigma-panel').isVisible(),false);
  await page.locator('#v2-stigma-list [data-v2-open-stigma="0"]').click();
  assert.equal(await page.locator('#v2-stigma-panel').isVisible(),true);
  assert.equal(await page.locator('#v2-stigma-panel [data-v2-stigma-choice]').count(),13);
  if(width===1920)await page.screenshot({path:'v2-previews/stigma-flyout-1920.png',fullPage:true});
  await page.locator('#v2-stigma-panel [data-v2-stigma-rank][data-dir="-1"]').click();
  assert.match(await page.locator('#v2-status').innerText(),/Modified progression/);
  await page.locator('#v2-stigma-done').click();
  assert.equal(await page.locator('#v2-stigma-panel').isVisible(),false);
  await page.locator('#v2-stigma-reset').click();
  // Equipment slots still invoke the catalog and item editor.
  await page.locator('#gear-doll-grid [data-gear-slot]').first().click();
  assert.equal(await page.locator('#gear-dialog').evaluate(el=>el.open),true);
  await page.locator('#gear-dialog-close').click();
  // Existing share modal remains live.
  await page.locator('#v2-share').click();
  await page.locator('#share-dialog').waitFor({state:'visible'});
  assert.equal(await page.locator('#share-dialog').evaluate(el=>el.open),true);
  await page.locator('#share-dialog-close').click();
  // Leveling mode must keep the game's progression budgets and slot gates.
  await page.locator('#v2-stage').selectOption('leveling');
  await page.locator('#v2-level').fill('32');
  await page.locator('#v2-level').press('Tab');
  assert.equal(await page.locator('#mastery-input').inputValue(),'123');
  assert.equal(await page.locator('#stigma-input').inputValue(),'10');
  assert.equal(await page.locator('#crystal-input').inputValue(),'84');
  assert.match(await page.locator('#v2-stigma-status').innerText(),/3\/4 slots/);
  assert.equal(await page.locator('#board-tabs [data-board="Triniel"]').isDisabled(),true);
  assert.equal(await page.locator('#v2-stigma-list .v2-stigma-card.locked').count(),1);
  await page.locator('#v2-context').selectOption('party');
  assert.equal(await page.locator('#v2-spec-panel').isVisible(),false);
  const overflow=await page.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth,offenders:[...document.querySelectorAll('body *')].filter(el=>{const box=el.getBoundingClientRect(),style=getComputedStyle(el);return style.display!=='none'&&box.right>innerWidth+8&&box.width>0}).sort((a,b)=>b.getBoundingClientRect().right-a.getBoundingClientRect().right).slice(0,8).map(el=>({tag:el.tagName,className:String(el.className).slice(0,90),id:el.id,right:Math.round(el.getBoundingClientRect().right)}))}));
  assert(overflow.documentWidth<=overflow.width+8,width+': horizontal page overflow '+JSON.stringify(overflow));
  await page.close();
  console.log('v2 browser smoke passed at '+width+'×1080');
 }
 // Additional layout sanity checks for portrait and 4K displays.
 for(const [width,height] of [[390,844],[800,1280],[3840,2160]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(width+': '+error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#class-buttons [data-class="templar"]').click();
  await page.locator('#v2-skill-list .v2-skill').first().waitFor();
   await verifyAdvancedCards(page,width);
  assert.equal(await page.locator('#board-grid .node').count(),89,width+': board geometry changed');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+8),true,width+': page overflow');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  fs.mkdirSync('v2-previews',{recursive:true});
  await page.screenshot({path:'v2-previews/workspace-'+width+'.png',fullPage:true});
  await page.close();
  console.log('v2 layout checked at '+width+'×'+height);
 }

 // Verify that a short desktop shows a usable board without page scrolling.
 for(const [width,height] of [[1280,720],[1920,768],[1920,1080]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(width+'x'+height+': '+error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#class-buttons [data-class="templar"]').click();
  await page.waitForFunction(()=>document.querySelector('#v2-board-fit')?.getAttribute('aria-pressed')==='true');
  const initial=await page.evaluate(()=>{
   const work=document.querySelector('.v2-workspace').getBoundingClientRect();
   const view=document.querySelector('#boards .board-scroll').getBoundingClientRect();
   const grid=document.querySelector('#board-grid').getBoundingClientRect();
   return {bottom:work.bottom,boardHeight:view.height,gridHeight:grid.height,
     boardPanelHeight:document.querySelector('#boards').getBoundingClientRect().height,
     rightHeight:document.querySelector('.v2-right').getBoundingClientRect().height,
     rightDisplay:getComputedStyle(document.querySelector('.v2-right')).display,
     rightCSSHeight:getComputedStyle(document.querySelector('.v2-right')).height,
     workHeight:work.height,
     workRows:getComputedStyle(document.querySelector('.v2-workspace')).gridTemplateRows,
     boardDisplay:getComputedStyle(document.querySelector('#boards')).display,
     boardFlex:getComputedStyle(document.querySelector('#boards')).flex,
     boardCSSHeight:getComputedStyle(document.querySelector('#boards')).height,
     layoutHeight:document.querySelector('#boards .board-layout').getBoundingClientRect().height,
     canvasHeight:document.querySelector('#boards .board-layout>div:first-child').getBoundingClientRect().height,
     canvasChildren:[...document.querySelector('#boards .board-layout>div:first-child').children]
       .map(el=>({tag:el.tagName,cls:el.className,height:el.getBoundingClientRect().height,
         display:getComputedStyle(el).display,flex:getComputedStyle(el).flex})),
     dockHeight:document.querySelector('.v2-board-dock').getBoundingClientRect().height,
     tile:+document.querySelector('#v2-zoom-label').textContent.replace('px','')};
  });
  console.log('Auto-fit '+width+'x'+height+': '+JSON.stringify(initial));
  assert(initial.bottom<=height+16,'Workspace beyond viewport: '+JSON.stringify(initial));
  assert(initial.boardHeight>=220,'Board viewport too short: '+JSON.stringify(initial));
  assert(initial.tile>=40&&initial.tile<=52,
    'Daevanion tiles became illegibly small: '+JSON.stringify(initial));
  const boardScroll=await page.locator('#boards .board-scroll').evaluate(el=>({
    clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,
    clientWidth:el.clientWidth,scrollWidth:el.scrollWidth
  }));
  if(initial.gridHeight>boardScroll.clientHeight+4){
    assert(boardScroll.scrollHeight>boardScroll.clientHeight,
      'Keep readable nodes and scroll, rather than shrinking: '+JSON.stringify({initial,boardScroll}));
  }
  if(width===1280){
   const inspect=page.locator('#v2-inspector-toggle');
   assert.equal(await inspect.isVisible(),true,'Short desktop needs an accessible tile inspector');
   await inspect.click();
   assert.equal(await page.locator('#v2-board-inspector').isVisible(),true,
     'Tile inspector drawer failed to open');
   await inspect.click();
   assert.equal(await page.locator('#v2-board-inspector').isVisible(),false,
     'Tile inspector drawer failed to close');
  }
  if(height>=900)assert(initial.gridHeight<=initial.boardHeight+3,
    'Board should fit vertically in 1080p: '+JSON.stringify(initial));
  await page.locator('#v2-zoom-plus').click();
  assert.equal(await page.locator('#v2-board-fit').getAttribute('aria-pressed'),'false');
  await page.locator('#v2-board-fit').click();
  assert.equal(await page.locator('#v2-board-fit').getAttribute('aria-pressed'),'true');
  await page.locator('#v2-board-expand').click();
  const focus=await page.locator('.v2-right').evaluate(el=>{
   const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom};
  });
  assert(focus.top<=1&&focus.bottom>=height-1,'Focus does not fill viewport: '+JSON.stringify(focus));
  await page.waitForFunction(()=>Number(document.querySelector('#v2-zoom-label')?.textContent.replace('px',''))>=40);
  const focusedTile=Number((await page.locator('#v2-zoom-label').innerText()).replace('px',''));
  assert(focusedTile>=40,'Focus mode must preserve legible tiles');
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.body.classList.contains('v2-board-expanded')),false);
  if(width===1920&&height===768){
   fs.mkdirSync('v2-previews',{recursive:true});
   await page.screenshot({path:'v2-previews/viewport-first-1920x768.png'});
   await page.locator('#v2-board-expand').click();
   await page.screenshot({path:'v2-previews/board-focus-1920x768.png'});
  }
  await page.close();
 }
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('v2 browser errors:',errors.length);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
