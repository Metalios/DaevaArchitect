import {useLegacyRecommendations} from './legacy_recommendation_test_setup.mjs';
// Regression for user-owned per-mode macro state and tier-validated stone rolls.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 await useLegacyRecommendations(page);
  const initial=await page.evaluate(()=>{
    state.class='templar';
    const a=account();
    a.journey='endgame';a.context='solo';a.equipment={};
    a.customMacros={};
    state.tab='rotation';render();
    const button=document.querySelector('#custom-macro-editor [data-cmacro-action="enable"]');
    if(!button)throw Error('Missing macro customization entry point');
    button.click();
    const key=CustomMacroEditor.contextKey(account());
    if(key!=='endgame:solo'||!a.customMacros[key])throw Error('Custom macro setup not stored for Solo mode');
    if(!document.querySelector('#custom-macro-editor [data-cmacro-field="step-key"]'))
      throw Error('Missing editable macro step');
    const add=document.querySelector('#custom-macro-editor [data-cmacro-action="add"][data-cmacro-kind="step"]');
    const before=a.customMacros[key].steps.length;
    add.click();
    if(a.customMacros[key].steps.length!==before+1)throw Error('Adding macro step did not persist');
    const delay=document.querySelector('#custom-macro-editor [data-cmacro-field="delay"]');
    delay.value='150';delay.dispatchEvent(new Event('change',{bubbles:true}));
    if(a.customMacros[key].steps[0].delay!==150)throw Error('Macro delay edit was not stored');
    const hotbarAdd=document.querySelector('#custom-macro-editor [data-cmacro-action="add"][data-cmacro-kind="hotbar"][data-cmacro-key="0"]');
    if(!hotbarAdd)throw Error('Missing manually editable hotbar');
    hotbarAdd.click();
    if(a.customMacros[key].hotbar[0].length<1)throw Error('Manual hotbar edit did not persist');
    const soloSteps=a.customMacros[key].steps.length;
    a.context='party';render();
    if(a.customMacros['endgame:party'])throw Error('Solo macro was copied into Group mode');
    if(!document.querySelector('#custom-macro-editor [data-cmacro-action="enable"]'))
      throw Error('Group context did not display its own recommended macro');
    a.context='solo';render();
    if(a.customMacros[key].steps.length!==soloSteps)
      throw Error('Returning to Solo discarded custom macro');
    return {key,soloSteps,hotbar:a.customMacros[key].hotbar[0]};
  });
  assert.equal(initial.key,'endgame:solo');

  const stone=await page.evaluate(()=>{
    const assertions=[
      ['Lesser','Attack',[1,3]],
      ['Intermediate','Attack',[2,4,8]],
      ['Superior','Attack',[3,5,10]],
      ['Superior','Damage Boost',[0.1,0.3,1]],
      ['Superior Abyssal','PvP Damage Boost',[0.2,0.6,2]]
    ];
    for(const [tier,stat,expected] of assertions){
      if(JSON.stringify(StoneRollRules.values(tier,stat))!==JSON.stringify(expected))
        throw Error('Incorrect roll table for '+tier+' '+stat);
    }
    if(StoneRollRules.values('Intermediate','Damage Boost').length)
      throw Error('Intermediate stone incorrectly offers Damage Boost');
    if(StoneRollRules.outcome('Superior','Damage Boost',15,'%'))
      throw Error('Invalid stone roll was accepted');
    state.tab='gear';render();
    openGearSlot('weapon');
    gearDraft={
      name:'Custom recorded sword',type:gearAllowedType(gearSlot('weapon')),
      grade:'Unique',enhancement:0,manastoneSlots:4,stoneType:'',stones:[],skillBonuses:[]
    };
    gearEditor();
    const type=document.querySelector('#gear-editor [name="stoneType"]');
    if(!type)throw Error('Missing tier selector');
    type.value='Superior';type.dispatchEvent(new Event('change',{bubbles:true}));
    const stat=document.querySelector('#gear-editor [name="stoneStat0"]');
    stat.value='Damage Boost';stat.dispatchEvent(new Event('change',{bubbles:true}));
    const value=document.querySelector('#gear-editor [name="stoneValue0"]');
    if(![...value.options].some(opt=>opt.value==='0.3'))
      throw Error('Superior Damage Boost roll choices missing');
    value.value='0.3';value.dispatchEvent(new Event('change',{bubbles:true}));
    if(document.querySelector('[data-stone-row="0"] .gear-stone-quality').textContent!=='Epic')
      throw Error('Stone grade not derived from selected value');
    document.querySelector('#gear-form').requestSubmit();
    const recorded=account().equipment?.weapon?.stones?.[0];
    if(!recorded||recorded.stat!=='Damage Boost'||recorded.value!==0.3||
      recorded.unit!=='%'||recorded.grade!=='Epic')
      throw Error('Tier-validated socket roll was not saved');
    return recorded;
  });
  assert.equal(stone.value,0.3);
  await page.reload();
  const restored=await page.evaluate(()=>{
    state.class='templar';state.tab='rotation';render();
    const a=account();
    const steps=a.customMacros?.['endgame:solo']?.steps||[];
    const roll=a.equipment?.weapon?.stones?.[0];
    return {steps:steps.length,delay:steps[0]?.delay,
      roll:roll?.value,grade:roll?.grade};
  });
  assert.equal(restored.steps,initial.soloSteps);
  assert.equal(restored.delay,150);
  assert.equal(restored.roll,0.3);
  assert.equal(restored.grade,'Epic');
  assert.deepEqual(errors,[],errors.join('; '));
  console.log('Custom macros, context isolation, hotbar editing, stone tier validation and persistence passed.');
}finally{
  await browser.close();
}
