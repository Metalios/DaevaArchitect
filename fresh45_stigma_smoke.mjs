// Global 45 Stigma total: 29 level-up shards plus the Ascension reward.
// Test actual client UI, reset button, leveling handoff and saved data safety.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
  const all=await page.evaluate(()=>{
    const classes=['templar','gladiator','assassin','ranger',
      'sorcerer','spiritmaster','cleric','chanter'];
    return classes.map(cls=>{
      state.class=cls;
      const reset=DEFAULT_ACCOUNT(cls);
      return {cls,preset:FRESH_45.stigma,stigma:reset.stigma,
        mastery:reset.mastery,crystals:reset.crystals};
    });
  });
  for(const row of all){
    assert.equal(row.preset,30,row.cls);
    assert.equal(row.stigma,30,row.cls);
    assert.equal(row.mastery,203);
    assert.equal(row.crystals,136);
  }
  await page.evaluate(()=>{
    state.class='templar';
    const a=account();
    a.journey='endgame';a.stigma=29;a.mastery=203;a.crystals=136;
    render();
  });
  assert.match(await page.locator('#stigma-hint').innerText(),/Saved 29 points/);
  assert.equal(await page.locator('#stigma-input').inputValue(),'29',
    'An old recorded 29-point account must not be silently changed');
  await page.locator('#fresh-45-button').click();
  assert.equal(await page.locator('#stigma-input').inputValue(),'30');
  await page.evaluate(()=>{
    const a=account();
    a.journey='leveling';a.context='solo';a.leveling={level:45,extraByLevel:{}};
    render();
  });
  assert.equal(await page.locator('#stigma-input').inputValue(),'30');
  assert.match(await page.locator('#leveling-summary').innerText(),/29|Ascension Shard/);
  await page.locator('#handoff-button').click();
  assert.equal(await page.locator('#stigma-input').inputValue(),'30',
    'Handoff from level 45 must preserve the quest-inclusive total');
  assert.deepEqual(errors,[]);
  console.log('Fresh-45 Global: eight class defaults, preserved legacy 29, corrected preset and quest-inclusive leveling handoff.');
}finally{await browser.close()}
