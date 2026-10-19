import {pathToFileURL} from 'node:url';
import path from 'node:path';

const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1200,height:850}});
const errors=[];page.on('pageerror',error=>errors.push(error.message));
await page.goto(process.env.CP_BASE_URL||pathToFileURL(path.resolve('dist/index.html')).href);
await page.locator('[data-class="templar"]').click();
await page.locator('[data-tab="gear"]').click();
if(await page.locator('#gear-cp-input').count())throw Error('Current CP still has a manual input');
if(await page.locator('#gear-cp-estimate').textContent()!=='—')throw Error('Empty gear produced a CP estimate');

const setup=await page.evaluate(()=>{
  const slots=GEAR_SLOTS.filter(slot=>['left','right'].includes(slot.area));
  for(const slot of slots){
    const type=gearAllowedType(slot);
    const options=GEAR_CATALOG.items.filter(item=>item.type===type&&item.itemLevel>=30&&(!item.requiredLevel||item.requiredLevel<=45)&&item.faction!=='asmodian');
    if(!options.length)throw Error(`No Global item for ${slot.id}`);
    const item=options[Math.floor(options.length/2)];
    gearEquipment()[slot.id]={...item,enhancement:3,manastoneSlots:2,stones:[],skillBonuses:[]};
  }
  render();
  return estimateCombatPower(model());
});
if(!setup.ready||setup.value<=0)throw Error(`Complete level 45 gear gave no CP estimate: ${JSON.stringify(setup)}`);
if(!(await page.locator('#gear-cp-estimate').textContent()).includes(setup.value.toLocaleString()))throw Error('Gear estimate did not render');
if(process.env.CP_DESKTOP_SCREENSHOT)await page.locator('.gear-cp').screenshot({path:process.env.CP_DESKTOP_SCREENSHOT});
if(process.env.CP_MOBILE_SCREENSHOT){await page.setViewportSize({width:390,height:844});await page.locator('.gear-cp').screenshot({path:process.env.CP_MOBILE_SCREENSHOT});await page.setViewportSize({width:1200,height:850})}
await page.locator('#gear-cp-target').fill('100000');await page.locator('#gear-cp-target').blur();
if(!(await page.locator('#gear-cp-status').textContent()).includes('100,000'))throw Error('Target was not compared with estimate');
await page.locator('[data-tab="overview"]').click();
if(await page.locator('#goal-target').inputValue()!=='100000')throw Error('Overview target differs from Equipment');
if(!(await page.locator('#goal-status').textContent()).includes('Planning range'))throw Error('Overview lacks estimated planning range');

const changes=await page.evaluate(()=>{
  const read=()=>estimateCombatPower(model()).value;
  const base=read();
  gearEquipment().weapon.enhancement+=5;render();const enhancement=read();
  account().crystals+=60;render();const board=read();
  account().mastery+=40;render();const mastery=read();
  account().stigma+=20;render();const stigma=read();
  gearEquipment().weapon.stones=[{stat:'Attack',value:5,unit:'',grade:'Epic'}];render();const stone=read();
  const cosmetic=TITLE_CATALOG.find(t=>t.owned==='No stat effect');
  account().titlesOwned[cosmetic.id]=true;render();const cosmeticTitle=read();
  const statTitle=TITLE_CATALOG.find(t=>t.owned!=='No stat effect');
  account().titlesOwned[statTitle.id]=true;render();const title=read();
  return {base,enhancement,board,mastery,stigma,stone,cosmeticTitle,title};
});
for(const [earlier,later] of [['base','enhancement'],['enhancement','board'],['board','mastery'],['mastery','stigma'],['stigma','stone'],['stone','title']]){
  if(changes[later]<changes[earlier])throw Error(`${later} lowered estimated CP: ${JSON.stringify(changes)}`);
}
if(changes.enhancement===changes.base||changes.board===changes.enhancement||changes.mastery===changes.board||changes.stigma===changes.mastery||changes.stone===changes.stigma||changes.cosmeticTitle!==changes.stone||changes.title===changes.cosmeticTitle)throw Error(`Estimate did not respond properly to a build change: ${JSON.stringify(changes)}`);

await page.reload();
await page.locator('[data-tab="gear"]').click();
if(await page.locator('#gear-cp-target').inputValue()!=='100000')throw Error('Target CP did not persist');
if((await page.locator('#gear-cp-estimate').textContent())==='—')throw Error('Build estimate did not persist');
const classEstimates=await page.evaluate(()=>{
  const result={};
  for(const cls of CLASS_ORDER){
    state.class=cls;
    for(const slot of GEAR_SLOTS.filter(s=>['left','right'].includes(s.area))){
      const type=gearAllowedType(slot),item=GEAR_CATALOG.items.find(i=>i.type===type&&i.itemLevel>=30&&(!i.requiredLevel||i.requiredLevel<=45)&&i.faction!=='asmodian');
      if(!item)throw Error(`No Global item for ${cls} ${slot.id}`);
      gearEquipment()[slot.id] ||= {...item,enhancement:3,manastoneSlots:2,stones:[],skillBonuses:[]};
    }
    render();
    const estimate=estimateCombatPower(model());
    if(!estimate.ready)throw Error(`${cls}: ${estimate.reason}`);
    result[cls]=estimate.value;
  }
  state.class='templar';render();
  return result;
});
if(Object.keys(classEstimates).length!==8||Object.values(classEstimates).some(value=>value<=0))throw Error(`Incomplete all-class CP coverage: ${JSON.stringify(classEstimates)}`);
await page.locator('[data-class="cleric"]').click();
await page.locator('[data-tab="gear"]').click();
await page.locator('#gear-cp-target').fill('80000');await page.locator('#gear-cp-target').blur();
await page.locator('[data-tab="overview"]').click();
if(await page.locator('#goal-target').inputValue()==='80000'||!await page.locator('#observed-field').isVisible())throw Error('Healer CP target changed the healing goal');
if(errors.length)throw Error(`Browser errors: ${errors.join('; ')}`);
console.log(`CP estimate responds to build changes, persists, covers eight classes, and keeps healer goals separate. ${JSON.stringify(changes)}`);
await browser.close();
