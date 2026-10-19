import {pathToFileURL} from 'node:url';
import path from 'node:path';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1100,height:850}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(process.env.STONE_BASE_URL||pathToFileURL(path.resolve('dist/index.html')).href);
await page.locator('[data-class="templar"]').click();
await page.locator('[data-tab="gear"]').click();

async function choose(slot,name){
  await page.locator(`[data-gear-slot="${slot}"]`).click();
  await page.locator('#gear-query').fill(name);
  await page.locator('.gear-result').filter({hasText:name}).first().click();
  await page.locator('.gear-base-stats').waitFor({timeout:10000});
  await page.waitForFunction(()=>gearDraft?.manastoneSlots!==null,null,{timeout:10000});
}
await choose('weapon','Anguish Longsword');
if(await page.locator('[name="stoneSlots"]').inputValue()!=='3')throw Error('Epic weapon should show three Manastone sockets');
if(!await page.locator('[name="theostone"]').count())throw Error('Epic weapon is missing Theostone engraving');
if(process.env.STONE_EDITOR_SCREENSHOT)await page.locator('.gear-stones-editor').first().screenshot({path:process.env.STONE_EDITOR_SCREENSHOT});
for(const [width,screenshot] of [[390,process.env.STONE_MOBILE_SCREENSHOT],[320,process.env.STONE_NARROW_SCREENSHOT]]){
  await page.setViewportSize({width,height:844});
  const unit=await page.locator('.gear-stone-row:not([hidden])').first().evaluate(row=>{const select=row.querySelector('[name^="stoneUnit"]'),a=select.getBoundingClientRect(),b=row.getBoundingClientRect();return {width:a.width,right:a.right,rowRight:b.right}});
  if(unit.width<76||unit.right>unit.rowRight-3)throw Error(`${width}px stone unit selector is clipped: ${JSON.stringify(unit)}`);
  if(screenshot)await page.locator('.gear-stones-editor').first().screenshot({path:screenshot});
}
await page.setViewportSize({width:1100,height:850});
await page.locator('[name="stoneKind0"]').selectOption('Superior');
await page.locator('[name="stoneStat0"]').fill('Attack');
await page.locator('[name="stoneValue0"]').fill('10');
await page.locator('[name="theostone"]').fill("Yustiel's Compassion");
if(await page.evaluate(()=>new FormData(document.querySelector('#gear-form')).get('theostone'))!=="Yustiel's Compassion")throw Error('Guard Theostone input is not in form');
await page.locator('.gear-save').click();
if(!(await page.locator('#gear-socket-summary').textContent()).includes('Attack'))throw Error('Rolled Manastone stat missing from summary');
if(!(await page.locator('#gear-socket-summary').textContent()).includes("Yustiel's Compassion"))throw Error('Weapon Theostone missing from summary');

await choose('guard','Anguish Guard');
if(!await page.locator('[name="theostone"]').count())throw Error('Epic guard is missing Theostone engraving');
await page.locator('[name="theostone"]').fill("Yustiel's Compassion");
if(await page.evaluate(()=>new FormData(document.querySelector('#gear-form')).get('theostone'))!=="Yustiel's Compassion")throw Error('Guard Theostone input is not in form');
await page.locator('.gear-save').click();
if(!(await page.locator('#gear-socket-summary').textContent()).includes('do not stack'))throw Error(`Identical Theostone warning missing: ${await page.locator('#gear-socket-summary').textContent()} :: ${JSON.stringify(await page.evaluate(()=>account().equipment.guard))}`);

await page.locator('[data-gear-slot="ring1"]').click();
await page.locator('#gear-query').fill('Anguish Ring');
await page.locator('.gear-result').first().click();
await page.locator('.gear-base-stats').waitFor({timeout:10000});
if(!(await page.locator('.gear-stones-head').textContent()).includes('Soulstone'))throw Error('Accessory should use Soulstone sockets');
if(await page.locator('[name="theostone"]').count())throw Error('Accessory should not offer Theostone');
await page.locator('[name="stoneKind0"]').selectOption('Intermediate');
await page.locator('[name="stoneStat0"]').fill('Critical Hit');
await page.locator('[name="stoneValue0"]').fill('13');
await page.locator('.gear-save').click();

await page.reload();
await page.locator('[data-tab="gear"]').click();
await page.locator('[data-gear-slot="weapon"]').click();
if(await page.locator('[name="theostone"]').inputValue()!=="Yustiel's Compassion")throw Error('Theostone did not persist');
if(await page.locator('[name="stoneValue0"]').inputValue()!=='10')throw Error('Manastone stat did not persist');
await page.locator('#gear-dialog-close').click();
if(!(await page.locator('#gear-socket-summary').textContent()).includes('Critical Hit'))throw Error('Soulstone stat did not persist');
await page.locator('#share-build-button').click();
await page.waitForFunction(()=>document.querySelector('#share-url').value.includes('#build='));
const shared=await browser.newPage();
await shared.goto(await page.locator('#share-url').inputValue());
await shared.locator('#shared-build-load').click();
if(await shared.evaluate(()=>account().equipment.weapon.theostone)!=="Yustiel's Compassion")throw Error('Weapon Theostone was not shared');
if(await shared.evaluate(()=>account().equipment.guard.theostone)!=="Yustiel's Compassion")throw Error('Guard Theostone was not shared');
if(await shared.evaluate(()=>account().equipment.ring1.stones?.[0]?.value)!==13)throw Error('Soulstone stat was not shared');
if(errors.length)throw Error(`Browser errors: ${errors.join('; ')}`);
console.log('Weapon and guard Theostones, Manastone and Soulstone stats, duplicate warning, persistence and sharing passed.');
await browser.close();
