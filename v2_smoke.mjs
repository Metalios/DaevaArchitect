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
  assert.equal(await page.locator('#gear-doll-grid').count(),1);
  assert.equal(await page.locator('#board-grid .node').count(),89,width+': Nezekan shape mismatch');
  assert((await page.locator('#board-grid .node.recommended').count())>0,width+': missing recommendation overlay');
  assert.match(await page.locator('#v2-status').innerText(),/Following recommended/);
  // Inputs are not a build decision.
  await page.locator('#mastery-input').fill('220');
  await page.locator('#mastery-input').press('Tab');
  assert.match(await page.locator('#v2-status').innerText(),/Following recommended/,width+': points marked custom');
  await page.locator('#v2-skill-list [data-v2-select-skill="Pummel"]').click();
  assert.equal(await page.locator('#v2-spec-panel [data-v2-spec]').count(),5);
  assert.match(await page.locator('#v2-spec-panel').innerText(),/MP consumed/);
  // Explicit rank change becomes customized; restore returns to recommended.
  await page.locator('#v2-skill-list [data-v2-rank="Pummel"][data-dir="-1"]').click();
  assert.match(await page.locator('#v2-status').innerText(),/Modified progression/);
  await page.locator('#v2-reset-allocations').click();
  assert.match(await page.locator('#v2-status').innerText(),/Following recommended/);
  // Stigma level edits must affect the actual allocation and build status.
  await page.locator('#v2-stigma-list [data-v2-stigma-rank][data-dir="-1"]').first().click();
  assert.match(await page.locator('#v2-status').innerText(),/Modified progression/);
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
  fs.mkdirSync('v2-previews',{recursive:true});
  await page.screenshot({path:'v2-previews/workspace-'+width+'.png',fullPage:true});
  // Leveling mode must keep the game's progression budgets and slot gates.
  await page.locator('#v2-stage').selectOption('leveling');
  await page.locator('#v2-level').fill('32');
  await page.locator('#v2-level').press('Tab');
  assert.equal(await page.locator('#mastery-input').inputValue(),'123');
  assert.equal(await page.locator('#stigma-input').inputValue(),'10');
  assert.equal(await page.locator('#crystal-input').inputValue(),'84');
  assert.match(await page.locator('#v2-stigma-status').innerText(),/3\/4 slots/);
  assert.equal(await page.locator('#board-tabs [data-board="Triniel"]').isDisabled(),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+8),true,width+': horizontal page overflow');
  await page.close();
  console.log('v2 browser smoke passed at '+width+'×1080');
 }
 assert.equal(errors.length,0,errors.join('\n'));
 console.log('v2 browser errors:',errors.length);
}finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
