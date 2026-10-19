import {pathToFileURL} from 'node:url';
import path from 'node:path';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1200,height:850}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(process.env.GEAR_BASE_URL||pathToFileURL(path.resolve('dist/index.html')).href);
await page.locator('[data-class="templar"]').click();
await page.locator('[data-tab="gear"]').click();
await page.locator('[data-gear-slot="top"]').click();
await page.locator('#gear-query').fill('Abyssal');
await page.locator('[data-gear-result]').first().click();
await page.locator('.gear-base-stats').waitFor({timeout:10000});
await page.locator('[name="skill0"]').selectOption({label:'Insulting Roar'});
await page.locator('[name="levels0"]').fill('1');
await page.locator('.gear-save').click();
if(!await page.locator('[data-gear-slot="top"].filled').count())throw Error('Gear slot did not save');
if(!await page.locator('#gear-skill-summary').getByText('Insulting Roar').count())throw Error('Skill bonus missing from gear summary');
if(process.env.GEAR_SCREENSHOT){await page.screenshot({path:process.env.GEAR_SCREENSHOT,fullPage:true})}
if(process.env.GEAR_MOBILE_SCREENSHOT){await page.setViewportSize({width:390,height:844});await page.screenshot({path:process.env.GEAR_MOBILE_SCREENSHOT,fullPage:true});await page.setViewportSize({width:1200,height:850})}
await page.locator('[data-tab="mastery"]').click();
await page.locator('#mastery-search').fill('Insulting Roar');
if(!(await page.locator('#skill-grid .mastery-numbers > div').nth(2).textContent()).includes('+1'))throw Error('Mastery did not add the equipped +1');
await page.reload();
await page.locator('[data-tab="gear"]').click();
if(!await page.locator('[data-gear-slot="top"].filled').count())throw Error('Gear did not persist');
await page.locator('[data-class="sorcerer"]').click();
await page.locator('[data-tab="gear"]').click();
if(await page.locator('[data-gear-slot="top"].filled').count())throw Error('Templar gear leaked into Sorcerer loadout');
await page.locator('[data-gear-slot="weapon"]').click();
if(!await page.locator('#gear-results').getByText('Spellbook',{exact:false}).count())throw Error('Sorcerer weapon search is not class-specific');
if(errors.length)throw Error(`Browser errors: ${errors.join('; ')}`);
console.log('Gear search, save, skill bonus, persistence and class-specific weapons passed.');
await browser.close();
