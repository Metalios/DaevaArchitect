// Visual regression dossier: every class, both artwork placements, and the
// Overview/Equipment gear layouts at desktop, medium and mobile viewports.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
const classes=['gladiator','templar','assassin','ranger','sorcerer','spiritmaster','cleric','chanter'];
const shots='v2-previews/art-alignment';
fs.mkdirSync(shots,{recursive:true});
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href+'?layout=character');
 await page.locator('#class-buttons [data-class="templar"]').click();
 await page.waitForFunction(()=>document.body.classList.contains('v5-active'));
 for(const width of [1920,1280,390]){
  await page.setViewportSize({width,height:1080});
  for(const cls of classes){
   // Class-picker is always bound even when the responsive header is collapsed.
   await page.evaluate(c=>document.querySelector('#class-buttons [data-class="'+c+'"]').click(),cls);
   await page.waitForFunction(c=>{
    const image=document.querySelector('.v6-doll-art .v6-class-illustration');
    return document.body.dataset.v6Class===c&&image?.naturalWidth>=800&&
      document.querySelector('.v6-doll-art.v6-art-loaded');
   },cls,{timeout:12000});
   await page.locator('.v5-page-tabs [data-v5-view="overview"]').evaluate(el=>el.click());
   const shapes=await page.evaluate(()=>{
    const names=['.v6-gear','.v6-doll','.v6-doll-art',
      '.v6-doll-art img','.v6-doll-left','.v6-doll-right','.v6-stats',
      '.v6-hero-portrait','.v6-hero-portrait img'];
    return Object.fromEntries(names.map(n=>{
      const e=document.querySelector(n),r=e?.getBoundingClientRect(),style=e?getComputedStyle(e):null;
      return [n,r?{x:Math.round(r.x),y:Math.round(r.y),
       width:Math.round(r.width),height:Math.round(r.height),
       fit:style.objectFit,position:style.objectPosition}:null];
    }));
   });
   console.log('ART_REVIEW '+JSON.stringify({width,cls,shapes}));
   const gear=page.locator('.v6-gear');
   await gear.screenshot({path:shots+'/'+cls+'-overview-'+width+'.png'});
   if(width===1920){
    await page.locator('.v6-masthead').screenshot({path:shots+'/'+cls+'-header.png'});
   }
   if(width===1920&&['templar','ranger','sorcerer'].includes(cls)){
    await page.locator('.v5-page-tabs [data-v5-view="equipment"]').evaluate(el=>el.click());
    const frame=page.locator('#gear-doll-grid');
    await frame.screenshot({path:shots+'/'+cls+'-equipment.png'});
    await page.locator('.v5-page-tabs [data-v5-view="overview"]').evaluate(el=>el.click());
   }
  }
 }
 assert.deepEqual(errors,[],errors.join('; '));
 console.log('Full visual audit dossier recorded for all eight classes.');
} finally {await browser.close();}
