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
   // Visual integrity: same 20 IDs/order as Equipment Inspect, 2×5 tiles on
   // each side, vertically centered full-body figure and no clipped widgets.
   const geometry=await page.evaluate(()=>{
     const root=document.querySelector('.v6-gear'),
       doll=document.querySelector('.v6-doll'),
       image=doll.querySelector('img.v6-class-illustration');
     const left=[...document.querySelectorAll('#v6-left-slots .v6-slot')],
       right=[...document.querySelectorAll('#v6-right-slots .v6-slot')];
     const rect=el=>el.getBoundingClientRect();
     const center=el=>{const r=rect(el);return r.y+r.height/2};
     return {
       left:left.map(el=>el.dataset.v6Slot),
       right:right.map(el=>el.dataset.v6Slot),
       expectedLeft:[...GEAR_INSPECT_LEFT],
       expectedRight:[...GEAR_INSPECT_RIGHT],
       centerDelta:Math.abs(center(image)-center(doll)),
       imageHeight:rect(image).height,
       railCols:getComputedStyle(document.querySelector('.v6-doll-left')).gridTemplateColumns.split(' ').length,
       firstTileLeft:rect(left[0]).x,
       secondTileLeft:rect(left[1]).x,
       firstTileTop:rect(left[0]).y,
       thirdTileTop:rect(left[2]).y,
       figureHeight:rect(doll).height,
       statsCols:getComputedStyle(document.querySelector('#v6-stat-rows')).gridTemplateColumns.split(' ').length,
       statsCount:document.querySelector('#v6-stat-rows').children.length,
       overflow:root.scrollWidth-root.clientWidth,
       figureOverflow:rect(image).top<rect(doll).top-2||rect(image).bottom>rect(doll).bottom+2
     };
   });
   assert.deepEqual(geometry.left,geometry.expectedLeft,width+' '+cls+': Overview weapons/armor differ from Equipment tab');
   assert.deepEqual(geometry.right,geometry.expectedRight,width+' '+cls+': Overview accessories differ from Equipment tab');
   assert.equal(geometry.railCols,2,width+' '+cls+': each group must have 2 tile columns');
   assert(geometry.secondTileLeft>geometry.firstTileLeft+20,width+' '+cls+': tiles are still in a vertical list');
   assert(geometry.thirdTileTop>geometry.firstTileTop+20,width+' '+cls+': group should have five rows');
   assert(geometry.centerDelta<18,width+' '+cls+': full-body class art is not centered');
   assert(geometry.imageHeight>=350,width+' '+cls+': character image is scaled too small');
   assert(!geometry.figureOverflow,width+' '+cls+': full-body figure is cut off vertically');
   assert.equal(geometry.statsCols,2,width+' '+cls+': stats preview should be beneath figure in 2 columns');
   assert.equal(geometry.statsCount,8,width+' '+cls+': missing equipment stat rows');
   assert(geometry.overflow<=6,width+' '+cls+': Overview equipment card overflows horizontally');

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
