import {pathToFileURL} from 'node:url';
import path from 'node:path';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1200,height:800}});
await page.goto(process.env.GEAR_BASE_URL||pathToFileURL(path.resolve('dist/index.html')).href);
await page.locator('[data-class="templar"]').click();
await page.locator('[data-tab="gear"]').click();
await page.locator('[data-gear-slot="weapon"]').click();
await page.locator('#gear-query').fill('Anguish Longsword');
await page.locator('.gear-result').first().click();
await page.waitForFunction(()=>gearDraft?.manastoneSlots!==null,null,{timeout:10000});
for(const [width,height] of [[1200,800],[1200,600],[390,800],[390,600]]){
  await page.setViewportSize({width,height});
  const selector=width>700?'.gear-preview-pane':'.gear-dialog-grid';
  const before=await page.locator(selector).evaluate(element=>({client:element.clientHeight,scroll:element.scrollHeight,overflow:getComputedStyle(element).overflowY}));
  if(before.scroll<=before.client||before.overflow!=='auto')throw Error(`${width}×${height} dialog has no scrollable details: ${JSON.stringify(before)}`);
  await page.locator(selector).evaluate(element=>{element.scrollTop=element.scrollHeight});
  const after=await page.evaluate(selector=>{
    const container=document.querySelector(selector),view=container.getBoundingClientRect(),skills=document.querySelector('.gear-skill-fields').getBoundingClientRect(),actions=document.querySelector('.gear-dialog-actions').getBoundingClientRect();
    return {top:container.scrollTop,skillsTop:skills.top,skillsBottom:skills.bottom,viewTop:view.top,viewBottom:view.bottom,actionsTop:actions.top};
  },selector);
  if(after.top<=0||after.skillsTop<after.viewTop||after.skillsBottom>Math.min(after.viewBottom,after.actionsTop))throw Error(`${width}×${height} rolled skills remain clipped: ${JSON.stringify(after)}`);
  if(process.env.DIALOG_SHOT_DIR&&height===800)await page.locator('#gear-dialog').screenshot({path:path.join(process.env.DIALOG_SHOT_DIR,`daeva-dialog-${width}.png`)});
}
console.log('Desktop and mobile equipment dialogs scroll to all rolled skill fields above the save controls.');
await browser.close();
