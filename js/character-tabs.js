/* Consistent context header for the character-first detailed editors.
 * Does not duplicate editor state or alter class/points/gear.
 */
(() => {
  'use strict';
  const pages = {
    equipment:{
      kicker:'CHARACTER GEAR · GLOBAL',title:'Equipment & Stats',
      description:'Equip real Global items, update enhancements, recorded rolls, stones and gear skill bonuses. Changes stay in your custom character.'},
    skills:{
      kicker:'CLASS MASTERY · GLOBAL',title:'Mastery & Specialties',
      description:'Review invested Mastery ranks and effective skill levels. Open any skill to configure unlocked Specialties and inspect board and equipment bonuses.'},
    stigma:{
      kicker:'STIGMA SYSTEM · GLOBAL',title:'Stigma Loadout',
      description:'Manage exactly four equipped Stigmas, their ranks and perk breakpoints. Spent points cannot exceed the earned Global budget.'},
    arcana:{
      kicker:'ARCANA · GLOBAL',title:'Arcana Cards',
      description:'Edit the five Global Arcana slots and their recorded enhancements or effects. Unknown randomized bonuses are not assumed.'},
    boards:{
      kicker:'DAEVANIAN · GLOBAL',title:'Daevanian Boards',
      description:'Six connected boards including Azphel and Ariel. Compare Custom and Recommended routes without erasing purchased gold-marked nodes.'},
    rotation:{
      kicker:'COMBAT WORKFLOW',title:'Rotation & Macro',
      description:'Class and context-specific skill priorities, button bindings, timing caveats and quick-use recommendations.'},
    titles:{
      kicker:'CHARACTER PROGRESSION',title:'Titles & Collection',
      description:'Track and select confirmed character titles; only available bonuses contribute to the planner model.'},
    sources:{
      kicker:'GAME DATA & RESEARCH',title:'Evidence & Methodology',
      description:'Review the game-data snapshots, measured mechanics, known uncertainties and optimization evidence behind your build.'}
  };
  let header;
  function mount(){
    if (header || !document.body.classList.contains('v5-active')) return;
    const tabs=document.querySelector('.v5-page-tabs');
    if (!tabs) return;
    header=document.createElement('section');
    header.className='v7-editor-header';
    header.setAttribute('aria-label','Current build editor');
    header.innerHTML=
      '<div class="v7-editor-title-block">'+
        '<span class="v7-editor-eyebrow" id="v7-kicker"></span>'+
        '<h2 id="v7-editor-title"></h2>'+
        '<p id="v7-editor-description"></p>'+
      '</div>'+
      '<div class="v7-editor-actions">'+
        '<button type="button" data-v5-view="overview">← Overview</button>'+
        '<button type="button" class="v7-compare" id="v7-editor-compare">Compare build</button>'+
      '</div>';
    tabs.after(header);
    header.querySelector('#v7-editor-compare').addEventListener('click',()=>
      document.querySelector('#v5-tab-compare')?.click()
    );
    update();
  }
  function update(){
    if(!header) mount();
    if(!header)return;
    const page=Object.keys(pages).find(v=>document.body.classList.contains('v5-view-'+v));
    if(!page) {header.hidden=true; return;}
    header.hidden=false;
    const data=pages[page];
    document.getElementById('v7-kicker').textContent=data.kicker;
    document.getElementById('v7-editor-title').textContent=data.title;
    document.getElementById('v7-editor-description').textContent=data.description;
    header.dataset.editor=page;
  }
  const previous=window.syncV5;
  window.syncV5 = function(m){
    if(typeof previous==='function') previous(m);
    update();
  };
  if(document.body.classList.contains('v5-active')) mount();
  document.querySelector('#class-buttons')?.addEventListener('click',()=>requestAnimationFrame(update));
  // Nav changes are internal UI updates and need not force a complete optimizer
  // render just to display the correct detail-workspace heading.
  document.querySelector('#planner-content')?.addEventListener('click',event=>{
    if(event.target.closest('[data-v5-view]')){
      queueMicrotask(update);
    }
  });
})();
