// v2 unified workspace. Reuses the original rendering, catalog and calculators.
(function(){
'use strict';
const $=id=>document.getElementById(id);
const make=(tag,cls,html='')=>{const e=document.createElement(tag);e.className=cls;e.innerHTML=html;return e};
let skill='',skillTab='active',specialtyOpen=false,stigmaSlotOpen=-1,lastClass='',zoom=window.innerWidth>=2500?52:window.innerWidth>=1900?44:40,message='';
const ARCHETYPE_WEAPONS={
 gladiator:'Greatsword',templar:'Longsword + shield',assassin:'Daggers',ranger:'Bow',
 sorcerer:'Spellbook',spiritmaster:'Orb',cleric:'Mace + shield',chanter:'Staff'
};
const quick=make('div','v2-quickbar',`
 <div class="v2-brand"><b>Daeva<span>Architect</span></b><small>AION 2 GLOBAL · BUILD PLANNER</small></div>
 <label>Class<select id="v2-class"></select></label>
 <label>Level<input id="v2-level" type="number" min="1" max="45"></label>
 <label>Stage<select id="v2-stage"><option value="leveling">Leveling</option><option value="endgame">Fresh 45 / Endgame</option></select></label>
 <label>Content<select id="v2-context"><option value="solo">Solo PvE</option><option value="party">Group PvE</option><option value="pvp">PvP</option></select></label>
 <div id="v2-status" role="status"></div>
 <button id="v2-save" type="button">Save</button><button id="v2-share" type="button" class="v2-gold">Share build</button>`);
const nav=make('nav','v2-nav',`<button type="button" data-v2-tab="workspace">Build workspace</button><button type="button" data-v2-tab="rotation">Rotation & macro</button><button type="button" data-v2-tab="titles">Titles</button><button type="button" data-v2-tab="sources">Research notes</button><button type="button" id="v2-reset-allocations">Restore recommended allocations</button>`);
const work=make('div','v2-workspace');work.id='v2-workspace';
const left=make('div','v2-left v2-column'),center=make('div','v2-center v2-column'),right=make('div','v2-right v2-column');
const footer=make('div','v2-footer'),next=make('div','v2-next'),note=make('div','v2-gear-note');
const combatEvidence=make('section','v2-combat-evidence');combatEvidence.id='v2-combat-evidence';
const full=make('details','v2-full-overview','<summary>Full build recommendations, targets, and collection guidance</summary>');
const gearDetails=make('details','v2-gear-advanced','<summary>Arcana, wings & detailed equipment calculations</summary>');
const extra=make('div','v2-extra');extra.id='v2-extra';
const master=make('div','v2-master-editor',`
 <div class="v2-skill-toolbar" role="group" aria-label="Mastery skill category"><button type="button" id="v2-active-filter" class="active" aria-pressed="true">Active skills (12)</button><button type="button" id="v2-passive-filter" aria-pressed="false">Passive (10)</button><span class="v2-skill-search-label">Find a skill</span></div>
 <div class="v2-source-legend" role="note"><b>Skill levels:</b> Invest Mastery + planned board bonus + recorded gear = final planned level. Obtained board bonuses are separate.</div>
 <div class="v2-editor-title"><b>Skill</b><span>Invest</span><span>Board +</span><span>Gear +</span><span>Final Lv</span></div>
 <div id="v2-skill-list" class="v2-skill-list"></div>
 <div class="v2-mastery-hint">Invest shows the <b>Mastery rank to level manually</b>. Board shows <b>obtained / planned</b> bonuses, and Final Lv includes invested rank + planned board + recorded gear. Only tiles marked obtained count as acquired. Unspent points and missing gear are not assumed spent/equipped. Select a skill for its exact breakdown and Specialties.</div>
 <div id="v2-spec-panel" class="v2-in-panel-flyout" role="region" aria-label="Selected skill specialty choices" hidden></div>
 <details class="v2-advanced-skills"><summary>Advanced skill cards & bonus adjustments</summary></details>`);
const stigmas=make('div','v2-stigmas',`<div id="v2-stigma-list" class="v2-stigma-cards"></div><div class="v2-stigma-summary"><span>13 class Stigmas in catalog · select a card to edit</span><strong id="v2-stigma-remaining"></strong></div><div class="v2-stigma-breakpoints">Perk levels <span>⑤ First</span><span>⑩ Second</span><span>⑮ Third</span><span>⑳ Fourth</span></div><button type="button" id="v2-stigma-reset">Restore recommended Stigmas</button><div id="v2-stigma-panel" class="v2-in-panel-flyout" role="region" aria-label="Stigma loadout editor" hidden></div>`);
const boardControls=make('div','v2-board-controls',`
 <div class="v2-board-callout"><b>Original Global board coordinates</b><span><b>Blue</b> = recommended; <b>gold</b> = obtained. Single-click previews a tile; double-click marks it obtained. Use the Mark obtained button on touch. Your planned amounts remain in each board tab.</span></div>
 <button type="button" id="v2-board-toggle">Edit selected node</button><button type="button" id="v2-board-restore" title="Evaluate the recommendation again using the current build and explain whether it changed.">Recalculate recommended path</button>
 <button type="button" id="v2-board-clear-obtained" title="Reset PvE gold obtained marks, not your earned crystal budget">Clear obtained gold tiles…</button>
 <button type="button" id="v2-mark-obtained">Mark tile obtained</button>
 <button type="button" id="v2-zoom-minus" aria-label="Zoom out">−</button><span id="v2-zoom-label">40px</span><button type="button" id="v2-zoom-plus" aria-label="Zoom in">+</button><button type="button" id="v2-board-expand">Expand board</button>
 <p id="v2-board-notice" role="status"></p>`);
const ariel=make('button','v2-ariel-pending','Ariel · pending');
ariel.type='button';ariel.disabled=true;ariel.title='Ariel arrived in the October 21 Global update. Client-verified node positions, effects and separate currency data must be imported before this board is editable.';
const modal=make('dialog','v2-comparison',`<div class="v2-compare-head"><h2>Your build vs. recommended</h2><button type="button" id="v2-comparison-close">✕</button></div><p>Compared at the same class, level, play context, and point totals. Equipment does not affect the recommended route.</p><div id="v2-comparison-body"></div><button type="button" id="v2-comparison-reset">Restore recommended allocations (keep gear)</button>`);modal.id='v2-comparison';
const archetype=make('p','v2-archetype');
const slim=make('div','v2-slim-heading',`<span id="v2-master-status"></span><button type="button" id="v2-master-restore">Restore ranks</button>`);
const stigmaStatus=make('span','v2-stigma-status');stigmaStatus.id='v2-stigma-status';
function mount(){
 const p=$('planner-content');p.classList.add('v2-planner');
 p.insertBefore(quick,p.firstChild);quick.after(nav);
 const tabs=p.querySelector('.tabs');tabs.after(work);work.append(left,center,right);
 left.append($('gear'));center.append($('mastery'),$('stigma'));right.append($('boards'));
 $('gear-class-heading').after(archetype);
 // Keep the twenty editable equipment slots visible, but don't force the
 // optional Arcana/Wings/CP and fine-grained stat summaries to make every
 // workspace page several screens tall. Their original controls stay live.
 $('gear').append(gearDetails);
 if(window.innerWidth<1700&&!state.gearView)state.gearView='inventory';
 const earned=p.querySelector('.controls');
 if(earned)$('gear').append(earned);
 const gearMain=$('gear').querySelector('.gear-main');
 const gearExtras=gearMain?.querySelector('.gear-side');
 if(gearExtras)gearDetails.append(gearExtras);
 for(const extra of ['.gear-cp','#gear>.notice','.gear-credit']){
   const part=$('gear').querySelector(extra);
   if(part)gearDetails.append(part);
 }
 work.after(footer);footer.append(next,combatEvidence,note,full);full.append($('overview'));
 footer.after(extra);extra.append($('rotation'),$('titles'),$('sources'));
 $('mastery').insertBefore(master,$('mastery-visible'));
 master.querySelector('.v2-advanced-skills').append($('skill-grid'));
 const search=$('mastery').querySelector('.mastery-search');
 if(search)master.querySelector('.v2-skill-toolbar').append(search);
 master.querySelector('.v2-mastery-hint').append(slim);
 $('stigma').append(stigmas);$('stigma').querySelector('.section-title').append(stigmaStatus);
 $('board-tabs').after(boardControls);
 const side=$('boards').querySelector('.board-side');
 if(side){
  const extras=make('details','v2-board-extra','<summary>Board bonuses, purchase order & next key nodes</summary>');
  const current=side.querySelector('.board-effects-panel');
  const purchases=$('purchase-list')?.closest('.panel');
  const upcoming=$('board-next')?.closest('.panel');
  side.firstElementChild.append(extras);
  for(const item of [current,purchases,upcoming])if(item)extras.append(item);
 }

 document.body.append(modal);
 $('v2-class').innerHTML=CLASS_ORDER.map(c=>`<option value="${c}">${PROFILES[c].name}</option>`).join('');
 document.body.classList.add('v2-active');
 bind();
}
function skillsView(m){
 const a=account(),catalog=Object.values(data().skills),names=skillNames(),hint=typeof adviceFor==='function'?adviceFor(state.class,a.context):null;
 const priority=[...(hint?.core||[]),...(hint?.support||[]),...names];
 const order=new Map([...new Set(priority)].map((name,i)=>[name,i]));
 const query=(state.masterySearch||'').toLowerCase().trim();
 const rows=catalog.map((item,i)=>({item,i}))
   .filter(({item,i})=>(skillTab==='active'?i<12:i>=12)
     &&item.name.toLowerCase().includes(query)
     &&(!isLeveling()||(SKILL_UNLOCKS[state.class][item.name]||1)<=currentLevel()))
   .sort((x,y)=>(order.get(x.item.name)??99)-(order.get(y.item.name)??99)||x.i-y.i);
 $('v2-skill-list').innerHTML=rows.map(({item,i})=>{
   const name=item.name,parts=skillLevelBreakdown(name,m),
     rank=parts.mastery,board=parts.boardPlanned,boardOwned=parts.boardOwned,
     gear=parts.gear,cap=masteryRankCap(name),level=parts.withPlan,ownedLevel=parts.withOwned;
   const picks=specPicks(name,level);
   const summary=!SPECS[state.class]?.[name]?'Rank & bonuses':level<8?'Specialties unlock at effective Lv 8':
     `${picks.length} of ${specialtySlots(level)} Specialties chosen`;
   return `<div class="v2-skill ${specialtyOpen&&skill===name?'chosen':''}" role="group">
    <button type="button" data-v2-select-skill="${esc(name)}" class="v2-skill-label" aria-expanded="${specialtyOpen&&skill===name}"
      aria-controls="v2-spec-panel" title="View ${esc(name)} effects and Specialty choices">
      ${gameSkillIconMarkup(state.class,name,'v2-skill-art')}
      <span><b>${esc(name)}</b><small>${esc(summary)}</small></span><span class="v2-open-caret" aria-hidden="true">›</span>
    </button>
    <div class="v2-rank"><button type="button" data-v2-rank="${esc(name)}" data-dir="-1" ${rank<=1?'disabled':''} aria-label="Decrease ${esc(name)} Mastery rank">−</button><b>${rank}<small>/10</small></b><button type="button" data-v2-rank="${esc(name)}" data-dir="1" ${rank>=cap||m.mastery.spent+masteryCost(rank+1)>budget('mastery')?'disabled':''} aria-label="Increase ${esc(name)} Mastery rank">+</button></div>
    <span class="v2-green v2-board-delta" data-board-owned="${boardOwned}" data-board-planned="${board}" title="Board obtained +${boardOwned}; planned +${board}"><small>+${boardOwned} owned</small><small>+${board} plan</small></span><span class="v2-green" title="Recorded equipment/Arcana bonuses"> ${gear?'+'+gear:'—'}</span><b class="v2-effective v2-level-delta" data-effective-owned="${ownedLevel}" data-effective-planned="${level}" title="Invest ${rank} + planned board ${board} + gear ${gear} = final Lv ${level}"><span>Lv ${level}</span><small>${ownedLevel} obtained</small></b>
   </div>`;
 }).join('')||'<p class="v2-muted">No unlocked skills match this filter.</p>';
 $('v2-active-filter').classList.toggle('active',skillTab==='active');
 $('v2-passive-filter').classList.toggle('active',skillTab==='passive');
 $('v2-active-filter').setAttribute('aria-pressed',String(skillTab==='active'));
 $('v2-passive-filter').setAttribute('aria-pressed',String(skillTab==='passive'));
 const panel=$('v2-spec-panel');
 if(!specialtyOpen||!names.includes(skill)){panel.hidden=true;panel.innerHTML=''}
 else{
   const level=effective(skill,m),spec=SPECS[state.class]?.[skill],picks=specPicks(skill,level),
         recommended=recommendedSpecPicks(skill,level),slots=specialtySlots(level);
   panel.hidden=false;
   panel.innerHTML=`<header class="v2-flyout-head"><span class="v2-flyout-eyebrow">SELECTED MASTERY POWER</span>
       <button type="button" class="v2-flyout-close" id="v2-spec-close" aria-label="Close Specialties">✕</button>
       <div class="v2-flyout-skill-title">${gameSkillIconMarkup(state.class,skill,'v2-flyout-art')}<div><h3>${esc(skill)}</h3>
          <small>Planned Lv ${level} · ${slots} of 3 potential Specialty slots</small></div></div>
     </header>
     <div class="v2-flyout-content">
     <p class="v2-flyout-guidance"><b>Skill level sources:</b> Invest Mastery rank ${skillLevelBreakdown(skill,m).mastery}; Board obtained +${skillLevelBreakdown(skill,m).boardOwned}; Board planned +${skillLevelBreakdown(skill,m).boardPlanned}; Gear +${skillLevelBreakdown(skill,m).gear}. Final planned Lv ${skillLevelBreakdown(skill,m).withPlan}; with obtained board Lv ${skillLevelBreakdown(skill,m).withOwned}. ${skillLevelBreakdown(skill,m).withRecorded===null?'Current purchased rank not entered.':'Recorded actual Lv '+skillLevelBreakdown(skill,m).withRecorded+'.'} Mark board tiles obtained to unlock their bonuses in-game. ${esc((hint?.core||[]).includes(skill)?hint.why:'Choose the bonuses that fit your selected context. Recommendations are guide-based, not combat-simulated.')}</p>
     ${!spec?'<p class="v2-muted">No verified Specialty effects available for this power.</p>':`
     <div class="v2-spec-slots">${[0,1,2].map(i=>`<div class="${i>=slots?'locked':''}"><small>Slot ${i+1}${i>=slots?` · unlocks at Lv ${[8,12,20][i]}`:''}</small><strong>${i<slots&&picks[i]?esc(spec.options[picks[i]]):i>=slots?'Locked':'Choose an option'}</strong></div>`).join('')}</div>
     <div class="v2-flyout-subhead"><b>Specialty effects</b><small>Recommended picks: ${recommended.length?recommended.join(', '):'none unlocked'}</small></div>
     <div class="v2-spec-options">${Object.entries(spec.options).map(([id,description])=>{
       const n=Number(id),gate=n<=3?8:n===4?12:16,locked=level<gate,
         selected=picks.includes(n),advisedPick=recommended.includes(n);
       return `<button type="button" data-v2-spec="${n}" class="${selected?'chosen':''}" ${locked?'disabled':''} aria-pressed="${selected}">
         <span class="v2-spec-number">${id}</span><span><b>${esc(description)}</b><small>${locked?`Opens at effective Lv ${gate}`:selected?'In this plan':advisedPick?'Recommended for this stage':'Available'}</small></span>
         <strong>${selected?'✓':locked?'🔒':'+'}</strong></button>`;
     }).join('')}</div>`}
     <div class="v2-flyout-foot"><button type="button" id="v2-spec-restore" ${a.customSpecialties?.[skill]?'':'disabled'}>Use recommended Specialties</button><button type="button" id="v2-spec-done">Done</button></div>
     </div>`;
 }
 const masteryLeft=Math.max(0,budget('mastery')-m.mastery.spent);
 const masteryReason=a.manualMastery?' · custom ranks (remaining points left by your choices)':
   !masteryLeft?' · all earned points allocated':
   m.mastery.next?` · next rank costs ${m.mastery.next.cost} (need ${m.mastery.next.need} more)`:
     ' · all legal skill ranks capped';
 $('v2-master-status').textContent=`Mastery: ${m.mastery.spent} / ${budget('mastery')} points allocated · ${masteryLeft} unspent${masteryReason}`;
 $('v2-master-restore').disabled=!a.manualMastery;
}
function stigmasView(m){
 const slots=isLeveling()?levelReward().slots:4,load=activeStigmas(),names=Object.keys(STIGMAS[state.class]),
       advised=typeof adviceFor==='function'?adviceFor(state.class,account().context):null;
 $('v2-stigma-list').innerHTML=[0,1,2,3].map(i=>{
  if(i>=slots)return `<div class="v2-stigma-card locked"><span class="v2-stigma-locked-art">🔒</span><strong>Slot ${i+1}</strong><small>Opens at Lv ${[22,27,32,37][i]}</small></div>`;
  const name=load[i],level=m.stigma.levels[name]||0;
  return `<button type="button" data-v2-open-stigma="${i}" class="v2-stigma-card ${stigmaSlotOpen===i?'chosen':''}" aria-expanded="${stigmaSlotOpen===i}" aria-controls="v2-stigma-panel">
    ${gameSkillIconMarkup(state.class,name,'v2-stigma-art')}<strong>${esc(name)}</strong><small>Lv ${level} / 20</small>
    <span class="v2-stigma-card-action">${stigmaSlotOpen===i?'Editing':'Edit loadout ›'}</span>
   </button>`;
 }).join('');
 $('stigma-heading').textContent='Stigma loadout';
 $('v2-stigma-status').textContent=`${slots}/4 slots · ${m.stigma.spent}/${budget('stigma')} planned`;
 $('v2-stigma-remaining').textContent=`${Math.max(0,budget('stigma')-m.stigma.spent)} points unspent`;
 $('v2-stigma-reset').disabled=!account().manualStigma&&!account().customStigmas;
 const panel=$('v2-stigma-panel');
 if(stigmaSlotOpen<0||stigmaSlotOpen>=slots){panel.hidden=true;panel.innerHTML='';return}
 const selected=load[stigmaSlotOpen],lv=m.stigma.levels[selected]||0,
       stigma=STIGMAS[state.class][selected],perks=stigma?.perks||{};
 const used=new Map(load.slice(0,slots).map((name,i)=>[name,i]));
 panel.hidden=false;
 panel.innerHTML=`<header class="v2-flyout-head"><span class="v2-flyout-eyebrow">EDIT STIGMA · SLOT ${stigmaSlotOpen+1}</span>
   <button type="button" class="v2-flyout-close" id="v2-stigma-close" aria-label="Close Stigma editor">✕</button>
   <div class="v2-flyout-skill-title">${gameSkillIconMarkup(state.class,selected,'v2-flyout-art')}<div><h3>${esc(selected)}</h3><small>${slots} unlocked Stigma slots · ${budget('stigma')-m.stigma.spent} unspent points</small></div></div></header>
   <div class="v2-flyout-content">
     <p class="v2-flyout-guidance">${esc(advised?.why||'Stigma loadout is based on the selected class and context.')}</p>
     <div class="v2-stigma-level-editor"><span>Equipped Stigma rank</span>
        <button type="button" data-v2-stigma-rank="${stigmaSlotOpen}" data-dir="-1" ${lv<=0?'disabled':''} aria-label="Decrease Stigma rank">−</button>
        <strong>Lv ${lv} / 20</strong>
        <button type="button" data-v2-stigma-rank="${stigmaSlotOpen}" data-dir="1" ${lv>=20||m.stigma.spent+stigmaCost(lv+1)>budget('stigma')?'disabled':''} aria-label="Increase Stigma rank">+</button>
     </div>
     <p class="v2-stigma-base">${esc(stigma?.base||'Check Global client tooltip for this Stigma effect.')}</p>
     <div class="v2-stigma-milestones">${[5,10,15,20].map(rank=>`<div class="${lv>=rank?'on':''}"><b>Lv ${rank} ${lv>=rank?'✓':''}</b><span>${esc(perks[rank]||'No verified effect text')}</span></div>`).join('')}</div>
     <div class="v2-flyout-subhead"><b>Change equipped Stigma</b><small>13 catalog choices · duplicates are swapped</small></div>
     <div class="v2-stigma-picker">${names.map(name=>{
       const idx=used.get(name),isCurrent=name===selected,inOther=idx!==undefined&&!isCurrent;
       const desc=STIGMAS[state.class][name]?.base||'';
       return `<button type="button" data-v2-stigma-choice="${stigmaSlotOpen}" data-stigma="${esc(name)}" class="${isCurrent?'chosen':''}" aria-pressed="${isCurrent}">
          ${gameSkillIconMarkup(state.class,name,'v2-stigma-picker-art')}<span><b>${esc(name)}</b>
          <small>${inOther?`Equipped slot ${idx+1} · swaps positions`:isCurrent?'Currently equipped':esc(desc.slice(0,86))}</small></span></button>`;
     }).join('')}</div>
     <div class="v2-flyout-foot"><button type="button" id="v2-stigma-restore">Use recommended Stigmas</button><button type="button" id="v2-stigma-done">Done</button></div>
   </div>`;
}
function actionsView(m){
 const combat=m.combat;
 combatEvidence.hidden=!combat||state.class!=='sorcerer'||account().context==='pvp';
 if(!combatEvidence.hidden){
   const variance=Number.isFinite(combat.baselineScore)&&combat.baselineScore>0
     ?Math.max(0,(combat.score/combat.baselineScore-1)*100):0;
   const scenarios=(combat.scenarios||[]).map(row=>
     '<span>'+esc(row.scenario)+': '+row.score.toFixed(3)+'</span>').join('');
   combatEvidence.innerHTML='<div class="v2-combat-title"><b>Global PvE · easy sustained combat estimate</b><small>Research-based model, not measured DPS</small></div>'+
     '<div class="v2-combat-numbers"><span><b>'+combat.score.toFixed(3)+'</b><small>relative robust damage score</small></span>'+
     '<span><b>'+combat.manualPerMinute.toFixed(1)+'</b><small>estimated manual actions/min</small></span>'+
     '<span><b>'+variance.toFixed(1)+'%</b><small>vs fixed Specialty preset</small></span></div>'+
     '<p><b>Macro:</b> '+esc(combat.macro?.label||'Q / E / R')+' · '+esc((combat.macro?.steps||[]).join(' → '))+
     '. Use RMB for automatic steps; keep LMB filler and manual Hellfire/buffs.</p>'+
     '<p>Uses your funded Mastery, board levels, Stigma ranks and selected Specialties. '+
     'Includes the LMB filler, RMB automatic core, manual Hellfire and buffs, Combat Speed, '+
     'charge occupancy, cooldown reductions and MP conditions.</p>'+
     '<div class="v2-combat-scenarios">'+scenarios+'</div>'+
     '<small class="v2-combat-disclaimer">Relative scores depend on historical Global damage proportions and '+
     'partially estimated animations. KR/TW charge timing is a transferable hypothesis; '+
     'actual Global DPS, cancellation frames and speed breakpoints are unverified.</small>';
 }
 const first=masteryStages().find(([name,wanted])=>(m.mastery.levels[name]||1)<Math.min(wanted,masteryRankCap(name)));
 const route=routeSteps(activeRoute(),nodeMap()),nextBoard=route.find(n=>!obtainedNodes().has(n.id)),gear=Object.values(gearEquipment()).filter(Boolean).length;
 const parts=[
 ['Mastery',first?`Increase ${first[0]} toward rank ${Math.min(first[1],masteryRankCap(first[0]))}`:m.mastery.next?`Earn ${m.mastery.next.need} more points for ${m.mastery.next.name}`:'Inspect skill specialties','mastery'],
 ['Stigma',m.stigma.next?`Earn ${m.stigma.next.need} points for ${m.stigma.next.name}`:'Inspect levels & unlocked effects','stigma'],
 ['Daevanion',nextBoard?`${nextBoard.board} · ${effectText(nextBoard.node)}`:'Review connected purchase path','boards']
 ];
 const breakpoint=typeof progressionNextBreakpoint==='function'?progressionNextBreakpoint(state.class,account().context,name=>effective(name,m),budget('crystals')):'';
 next.innerHTML=`<div class="v2-next-heading"><b>Next recommended upgrades</b><small>Guidance only, not assumed equipment</small></div>`+(breakpoint?`<p class="v2-next-progress">${esc(breakpoint)}</p>`:'')+parts.map(([name,detail,target],i)=>`<button data-v2-focus="${target}"><em>${i+1}</em><span><b>${name}</b><small>${esc(detail)}</small></span><span>→</span></button>`).join('');
 $('v2-status').innerHTML=modifiedBuild()?'<b class="modified">● Modified progression</b><small>Custom allocation</small>':'<b>● Following recommended</b><small>Your own gear stays separate</small>';
 $('v2-reset-allocations').hidden=!modifiedBuild();
 $('v2-board-notice').textContent=lastBoardRecalculation?.message||message||'';
 $('v2-board-notice').hidden=!$('v2-board-notice').textContent;
 const n=nodeMap().get(state.node);
 $('v2-mark-obtained').disabled=!n||!n.node[5]||!boardOpen(n.board);
 $('v2-mark-obtained').textContent=n&&obtainedNodes().has(n.node[0])?'Unmark obtained':'Mark tile obtained';
 note.innerHTML=`<span>${gear?`${gear} equipment pieces recorded.`:'No gear assumed.'} ${esc((typeof adviceFor==='function'?adviceFor(state.class,account().context)?.why:null)||'Class/context progression priorities.')} Actual equipped bonuses affect breakpoint advice; no gear is invented.</span><button type="button" id="v2-open-comparison">Compare builds</button>`;
}
function sync(m){
 if(!state.class)return;
 document.body.classList.add('v2-has-class');
 if(lastClass!==state.class){lastClass=state.class;specialtyOpen=false;stigmaSlotOpen=-1;skillTab='active';skill=''}
 const a=account();
 $('v2-class').value=state.class;$('v2-level').value=currentLevel();$('v2-level').disabled=!isLeveling();
 $('v2-stage').value=a.journey;$('v2-context').value=a.context;
 archetype.textContent=PROFILES[state.class].role+' · '+ARCHETYPE_WEAPONS[state.class];
 archetype.setAttribute('aria-label',PROFILES[state.class].name+' class and weapon');
 $('v2-context').querySelector('option[value=pvp]').disabled=isLeveling();
 $('board-grid').style.setProperty('--v2-node',zoom+'px');$('v2-zoom-label').textContent=zoom+'px';
 // Ariel is a newly added separate PvE board. Show that it exists, but do
 // not invent nodes, costs, or claim support without verified Global data.
 if(!$('board-tabs').querySelector('.v2-ariel-pending'))$('board-tabs').append(ariel);
 m ||= model();skillsView(m);stigmasView(m);actionsView(m);
 const secondary=['rotation','titles','sources'].includes(state.tab);
 document.body.classList.toggle('v2-secondary',secondary);
 nav.querySelectorAll('[data-v2-tab]').forEach(b=>b.classList.toggle('active',b.dataset.v2Tab===(secondary?state.tab:'workspace')));
}
function restore(){
 const a=account();a.manualMastery=null;a.manualStigma=null;a.customStigmas=null;a.customSpecialties={};
 recalculateRecommendedBoards();
 message='Recommended allocations recalculated. Your earned points, equipment and obtained Daevanion tiles were preserved.';render();
}
function compare(){
 const m=model(),baseline=allocate(masteryStages(),budget('mastery'),masteryCost,skillNames(),1,masteryRankCap),
 names=skillNames(),diff=names.filter(n=>m.mastery.levels[n]!==baseline.levels[n]);
 const picked=activeStigmas(),stig=allocate(stigmaStages(),budget('stigma'),stigmaCost,picked,0);
 const changes=picked.filter(n=>(m.stigma.levels[n]||0)!==(stig.levels[n]||0));
 const recommendedLoadout=recommendedStigmas();
 const loadoutChanged=picked.some((n,i)=>n!==recommendedLoadout[i]);
 const reason=(typeof adviceFor==='function'?adviceFor(state.class,account().context)?.why:null)||'Balance damage and survival according to class.';
 $('v2-comparison-body').innerHTML=`<h3>Mastery</h3>${diff.length?diff.map(n=>`<p>${esc(n)} · Recommended ${baseline.levels[n]} → Your ${m.mastery.levels[n]}</p>`).join(''):'<p>No Mastery rank differences.</p>'}
 <h3>Stigmas</h3><p>Guide-based loadout (${esc(account().context)}): ${recommendedLoadout.map(esc).join(' · ')}</p>
 ${loadoutChanged?`<p>Your equipped Stigmas: ${picked.map(esc).join(' · ')}</p>`:'<p>Your Stigma choices match the recommended loadout.</p>'}
 ${changes.length?changes.map(n=>`<p>${esc(n)} · Suggested investment Lv ${stig.levels[n]||0} → Your Lv ${m.stigma.levels[n]||0}</p>`).join(''):'<p>No equipped Stigma level differences.</p>'}
 <h3>Why this context?</h3><p>${esc(reason)}</p>
 <h3>Daevanion</h3><p>${account().boardMode==='custom'?'Custom connected route; recommended tile highlights remain available.':'Following the recommended connected route.'}</p>`;
 modal.showModal();
}
function bind(){
 $('v2-class').addEventListener('change',e=>$('class-buttons').querySelector(`[data-class="${e.target.value}"]`)?.click());
 $('v2-level').addEventListener('change',e=>setLevel(e.target.value));
 $('v2-stage').addEventListener('change',e=>$(e.target.value==='leveling'?'leveling-mode':'endgame-mode').click());
 $('v2-context').addEventListener('change',e=>$(e.target.value==='solo'?'solo-button':e.target.value==='pvp'?'pvp-button':'party-button').click());
 $('v2-save').addEventListener('click',()=>{save();message='Saved to this browser.';$('v2-board-notice').textContent=message});
 $('v2-share').addEventListener('click',()=>$('share-build-button').click());
 nav.addEventListener('click',e=>{const b=e.target.closest('[data-v2-tab]');if(!b)return;state.tab=b.dataset.v2Tab==='workspace'?'mastery':b.dataset.v2Tab;render();if(state.tab!=='mastery')extra.scrollIntoView({block:'start',behavior:'smooth'})});
 $('v2-reset-allocations').addEventListener('click',restore);
 $('v2-master-restore').addEventListener('click',()=>{account().manualMastery=null;render()});
 for(const [id,tab] of [['v2-active-filter','active'],['v2-passive-filter','passive']]){
  $(id).addEventListener('click',()=>{skillTab=tab;specialtyOpen=false;sync(model())});
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){
  if(specialtyOpen){specialtyOpen=false;sync(model())}
  if(stigmaSlotOpen>=0){stigmaSlotOpen=-1;sync(model())}
 }});
 next.addEventListener('click',e=>{const b=e.target.closest('[data-v2-focus]');if(!b)return;state.tab='mastery';render();$(b.dataset.v2Focus)?.scrollIntoView({behavior:'smooth',block:'nearest'})});
 note.addEventListener('click',e=>{if(e.target.closest('#v2-open-comparison'))compare()});
 $('v2-comparison-close').addEventListener('click',()=>modal.close());
 $('v2-comparison-reset').addEventListener('click',()=>{modal.close();restore()});
 $('v2-skill-list').addEventListener('click',e=>{
 const b=e.target.closest('[data-v2-rank]');
 if(b){const name=b.dataset.v2Rank,dir=Number(b.dataset.dir),m=model(),a=account(),old=m.mastery.levels[name]||1,target=old+dir;
 if(target<1||target>masteryRankCap(name)||dir>0&&m.mastery.spent+masteryCost(target)>budget('mastery'))return;
 a.manualMastery ||= {...m.mastery.levels};a.manualMastery[name]=target;message='Changed '+name+' Mastery rank.';render();return}
 const target=e.target.closest('[data-v2-select-skill]');
 if(target){const selected=target.dataset.v2SelectSkill;specialtyOpen=!(specialtyOpen&&skill===selected);skill=selected;sync(model());if(specialtyOpen)$('v2-spec-close')?.focus()}
 });
 $('v2-spec-panel').addEventListener('click',e=>{
 if(e.target.closest('#v2-spec-close')||e.target.closest('#v2-spec-done')){specialtyOpen=false;sync(model());return}
 if(e.target.closest('#v2-spec-restore')){delete account().customSpecialties?.[skill];render();return}
 const b=e.target.closest('[data-v2-spec]');if(!b)return;
 const n=Number(b.dataset.v2Spec),level=effective(skill,model()),min=n<=3?8:n===4?12:16;if(level<min)return;
 const a=account();a.customSpecialties ||= {};
 const selections=[...(a.customSpecialties[skill]||recommendedSpecPicks(skill,level))],index=selections.indexOf(n);
 if(index>=0)selections.splice(index,1);else if(selections.length<specialtySlots(level))selections.push(n);else {selections.shift();selections.push(n)}
 a.customSpecialties[skill]=selections;message='Edited '+skill+' specializations.';render();
 });
 $('v2-stigma-list').addEventListener('click',e=>{
  const b=e.target.closest('[data-v2-open-stigma]');if(!b)return;
  const pos=Number(b.dataset.v2OpenStigma);stigmaSlotOpen=stigmaSlotOpen===pos?-1:pos;
  sync(model());if(stigmaSlotOpen>=0)$('v2-stigma-close')?.focus();
 });
 $('v2-stigma-panel').addEventListener('click',e=>{
  if(e.target.closest('#v2-stigma-close')||e.target.closest('#v2-stigma-done')){stigmaSlotOpen=-1;sync(model());return}
  if(e.target.closest('#v2-stigma-restore')){account().manualStigma=null;account().customStigmas=null;render();return}
  const select=e.target.closest('[data-v2-stigma-choice]');
  if(select){
   const index=Number(select.dataset.v2StigmaChoice),name=select.dataset.stigma;
   if(!STIGMAS[state.class]?.[name])return;
   const a=account(),chosen=[...activeStigmas()],other=chosen.indexOf(name),old=chosen[index];
   if(other>=0&&other!==index)chosen[other]=old;
   chosen[index]=name;a.customStigmas=chosen;
   // Changing the skill does not silently assign the previous skill's ranks.
   message='Equipped '+name+' in Stigma slot '+(index+1)+'.';render();return;
  }
  const b=e.target.closest('[data-v2-stigma-rank]');if(!b)return;
  const name=activeStigmas()[Number(b.dataset.v2StigmaRank)],m=model(),dir=Number(b.dataset.dir),
    rank=(m.stigma.levels[name]||0)+dir,a=account();
  if(rank<0||rank>20||dir>0&&m.stigma.spent+stigmaCost(rank)>budget('stigma'))return;
  a.manualStigma ||= {...m.stigma.levels};a.manualStigma[name]=rank;
  message='Adjusted '+name+' to Stigma rank '+rank+'.';render();
 });
 $('v2-stigma-reset').addEventListener('click',()=>{account().manualStigma=null;account().customStigmas=null;stigmaSlotOpen=-1;render()});
 $('v2-board-toggle').addEventListener('click',()=>{
 const entry=nodeMap().get(state.node);if(!entry||!entry.node[5]){message='Select a purchasable node first.';sync(model());return}
 if(!boardOpen(entry.board)){message='This board is not unlocked.';sync(model());return}
 const a=account();if(!customMode()){
 const map=nodeMap();a.customNodes=routeSteps(activeRoute(),map).filter(x=>x.total<=budget('crystals')).map(x=>x.id);
 a.customAzphelNodes=routeSteps(ROUTES[state.class].azphel,map).filter(x=>x.total<=(a.azphel||0)).map(x=>x.id);
 a.boardMode='custom';}
 setCustomNode(entry.node[0]);message=boardEditNotice;render();
 });
 $('v2-board-restore').addEventListener('click',()=>{
   const report=recalculateRecommendedBoards();
   message=report.message;
   render();
 });
 $('v2-board-clear-obtained').addEventListener('click',()=>{
   const count=[...obtainedNodes()].filter(id=>nodeMap().get(id)?.board!=='Azphel').length;
   if(!count){message='No obtained PvE tiles are marked; nothing to clear.';render();return}
   if(!window.confirm(`Clear ${count} obtained PvE Daevanion tile${count===1?'':'s'}? This removes your gold purchase marks, but keeps earned crystals, equipment and Mastery. Azphel is unaffected.`))return;
   const valid=nodeMap();
   storeObtained(new Set([...obtainedNodes()].filter(id=>valid.get(id)?.board==='Azphel')));
   account().recommendedRouteSnapshot=null;
   lastBoardRecalculation=null;
   boardRecalculationNotice='';
   message=`Cleared ${count} obtained PvE tile${count===1?'':'s'}. Your crystals are unchanged. Use Recalculate recommended path to review a new plan.`;
   render();
 });
 $('v2-mark-obtained').addEventListener('click',()=>{
  // Same crystal-budget protection and obtained state as the board's
  // double-click and the legacy selected-node button.
  if(toggleBoardObtained(state.node))render();else renderBoards(model());
 });
 $('v2-board-expand').addEventListener('click',()=>{const expanded=document.body.classList.toggle('v2-board-expanded');$('v2-board-expand').textContent=expanded?'Exit expanded':'Expand board'});
 for(const [id,step] of [['v2-zoom-minus',-4],['v2-zoom-plus',4]])$(id).addEventListener('click',()=>{zoom=Math.min(52,Math.max(32,zoom+step));$('board-grid').style.setProperty('--v2-node',zoom+'px');$('v2-zoom-label').textContent=zoom+'px'});
 $('mastery-search').addEventListener('input',()=>sync(model()));
 $('board-tabs').addEventListener('click',()=>setTimeout(()=>sync(model()),0));
 $('board-grid').addEventListener('click',()=>setTimeout(()=>sync(model()),0));
}
window.syncV2=sync;
mount();if(state.class){renderGear(model());sync(model())}
})();