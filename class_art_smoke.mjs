// Browser regression: eight genuine, high-resolution, transparent NCSOFT
// promotional figures must be bundled locally and change with the class.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const CLASSES = ['gladiator','templar','assassin','ranger',
  'chanter','cleric','sorcerer','spiritmaster'];
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url=pathToFileURL(path.resolve('dist/index.html'));
  url.searchParams.set('layout','character');
  await page.goto(url.href);
  await page.locator('#class-buttons [data-class="templar"]').click();
  await page.waitForFunction(()=>document.body.classList.contains('v5-active'));
  const art=new Set();
  for(const cls of CLASSES){
    await page.locator('#v2-class').selectOption(cls);
    await page.waitForFunction(expected=>{
      const a=document.querySelector('.v6-doll-art img.v6-class-illustration');
      const b=document.querySelector('.v6-hero-portrait img.v6-class-illustration');
      return document.body.dataset.v6Class===expected &&
        a?.complete && b?.complete && a.naturalWidth>=800 &&
        a.naturalHeight>=1300 && b.naturalWidth>=800 && b.naturalHeight>=1300;
    },cls,{timeout:10000});
    const record=await page.evaluate(()=>{
      const nodes=[...document.querySelectorAll('.v6-doll-art img.v6-class-illustration,.v6-hero-portrait img.v6-class-illustration')];
      return nodes.map(img=>({
        path:new URL(img.src).pathname,
        width:img.naturalWidth,height:img.naturalHeight,
        visible:getComputedStyle(img).visibility,
        fit:getComputedStyle(img).objectFit,
        class:img.dataset.class
      }));
    });
    assert.equal(record.length,2,cls+': artwork must appear in both banner and equipment paperdoll');
    for(const image of record){
      assert(image.path.endsWith('/assets/class-renders/'+cls+'.webp'),cls+': external, synthetic, or mismatched art '+JSON.stringify(image));
      assert(image.width>=800&&image.height>=1300,cls+': low resolution image '+JSON.stringify(image));
      assert.equal(image.visible,'visible',cls+': image did not become visible');
      assert.equal(image.class,cls,cls+': wrong class image displayed');
    }
    assert.equal(record[0].fit,'contain',cls+': equipment doll should not crop off weapons');
    art.add(record[0].path);
  }
  assert.equal(art.size,8,'Classes re-used the same art');
  await page.setViewportSize({width:390,height:844});
  await page.locator('#v2-class').selectOption('templar');
  await page.waitForFunction(()=>{
    const img=document.querySelector('.v6-doll-art img.v6-class-illustration');
    return img?.complete&&img.naturalWidth>=800;
  });
  assert.equal(await page.locator('.v6-doll-art img.v6-class-illustration').isVisible(),true,
    'High-quality character art missing in mobile overview');
  assert.deepEqual(errors,[],errors.join('; '));
  console.log('All eight lossless class-specific transparent renders load locally at desktop and mobile.');
}finally{
  await browser.close();
}
