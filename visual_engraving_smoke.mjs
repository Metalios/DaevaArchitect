import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
// User-visible UI regression: accurate tier/roll rules, independent sockets,
// clear button, summary, persistence and narrow modal layout.
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1360,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 await page.evaluate(()=>{
   state.class='templar';account().equipment.weapon={
      name:'Recorded Global Longsword',type:'Longsword',grade:'Epic',
      manastoneSlots:3,stoneType:'Superior',enhancement:10,
      stones:[{stat:'Attack',value:10,unit:'',grade:'Unique'},
              {stat:'HP',value:100,unit:'',grade:'Epic'}]
   };
   render();openGearSlot('weapon');
 });
 assert.equal(await page.locator('[data-stone-row]').count(),4);
 assert.equal(await page.locator('[data-stone-row]:visible').count(),3);
 assert.match(await page.locator('#gear-stone-summary').textContent(),/2 \/ 3/);
 assert.match(await page.locator('#gear-stone-effects').textContent(),/Attack \+10/);
 assert.match(await page.locator('#gear-stone-effects').textContent(),/HP \+100/);
 assert.equal(await page.locator('[data-stone-row="0"]').getAttribute('data-grade'),'Unique');
 assert.equal(await page.locator('[data-stone-row="0"] .gear-stone-grade').textContent(),'Unique');
 await page.locator('[data-gear-clear-stone="0"]').click();
 assert.match(await page.locator('#gear-stone-summary').textContent(),/1 \/ 3/);
 assert.doesNotMatch(await page.locator('#gear-stone-effects').textContent(),/Attack/);
 await page.locator('[name="stoneSlots"]').fill('4');
 await page.locator('[name="stoneSlots"]').dispatchEvent('input');
 assert.equal(await page.locator('[data-stone-row]:visible').count(),4);
 await page.locator('[name="stoneStat2"]').selectOption('Critical Hit');
 await page.locator('[name="stoneValue2"]').selectOption('15');
 assert.match(await page.locator('#gear-stone-summary').textContent(),/2 \/ 4/);
 assert.equal(await page.locator('[data-stone-row="2"]').getAttribute('data-grade'),'Unique');
 await page.locator('.gear-save').click();
 const saved=await page.evaluate(()=>account().equipment.weapon);
 assert.equal(saved.manastoneSlots,4);
 assert.equal(saved.stones[0].stat,'');
 assert.equal(saved.stones[1].value,100);
 assert.equal(saved.stones[2].stat,'Critical Hit');
 assert.equal(saved.stones[2].grade,'Unique');
 await page.evaluate(()=>openGearSlot('weapon'));
 assert.match(await page.locator('#gear-stone-summary').textContent(),/2 \/ 4/);
 await page.setViewportSize({width:390,height:844});
 const boxes=await page.locator('[data-stone-row="2"] select').evaluateAll(fields=>fields.map(field=>{
   const bounds=field.getBoundingClientRect(),
     row=field.closest('.gear-stone-row').getBoundingClientRect();
   return {width:bounds.width,right:bounds.right,rowRight:row.right};
 }));
 assert(boxes.every(x=>x.width>=76&&x.right<=x.rowRight+1),'Narrow socket inputs overflow their card: '+JSON.stringify(boxes));
 await page.locator('#gear-dialog-close').click();
 await page.evaluate(()=>{
   account().equipment.ring1={name:'Recorded Global Ring',type:'Ring',
     grade:'Epic',manastoneSlots:3,stoneType:'Intermediate',
     stones:[{stat:'Critical Hit',value:13,unit:'',grade:'Epic'}]};
   render();openGearSlot('ring1');
 });
 assert.match(await page.locator('.gear-stones-head').textContent(),/Soulstone/);
 assert.match(await page.locator('#gear-stone-summary').textContent(),/1 \/ 3/);
 assert.equal(await page.locator('[data-stone-row="0"] .gear-stone-grade').textContent(),'Epic');
 assert.deepEqual(errors,[],errors.join('\n'));
 console.log('PASS visual Global engraving: independent Manastone/Soulstone sockets, real roll grade, live summary, clear, save, and 390px layout');
}finally{await browser.close()}
