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
try{
 for(const width of [1280,1920,3440]){
  const page=await browser.newPage({viewport:{width,height:1080},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(width+': '+error.message));
  const port=server.address().port;
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#class-buttons [data-class="templar"]').click();
  await page.locator('#v2-skill-list .v2-skill').first().waitFor();
  assert.equal(await page.locator('.v2-workspace').isVisible(),true,width+': unified workspace hidden');
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
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+8),true,width+': horizontal page overflow');
  await page.close();
  console.log('v2 browser smoke passed at '+width+'×1080');
 }
 // Additional layout sanity checks for portrait and 4K displays.
 for(const [width,height] of [[800,1280],[3840,2160]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  page.on('pageerror',error=>errors.push(width+': '+error.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.locator('#class-buttons [data-class="templar"]').click();
  await page.locator('#v2-skill-list .v2-skill').first().waitFor();
  assert.equal(await page.locator('#board-grid .node').count(),89,width+': board geometry changed');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+8),true,width+': page overflow');
  await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
  fs.mkdirSync('v2-previews',{recursive:true});
  await page.screenshot({path:'v2-previews/workspace-'+width+'.png',fullPage:true});
  await page.close();
  console.log('v2 layout checked at '+width+'×'+height);
 }
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('v2 browser errors:',errors.length);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
