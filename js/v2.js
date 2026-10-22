// v2 unified workspace. Reuses the original rendering, catalog and calculators.
(function(){
'use strict';
const $=id=>document.getElementById(id);
const make=(tag,cls,html='')=>{const e=document.createElement(tag);e.className=cls;e.innerHTML=html;return e};
let skill='',zoom=40,message='';
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
const full=make('details','v2-full-overview','<summary>Full build recommendations, targets, and collection guidance</summary>');
const extra=make('div','v2-extra');extra.id='v2-extra';
const master=make('div','v2-master-editor',`
 <div class="v2-editor-title"><b>Purchased rank</b><span>Board</span><span>Gear</span><span>Effective</span></div>
 <div id="v2-skill-list" class="v2-skill-list"></div><div id="v2-spec-panel"></div>
 <details class="v2-advanced-skills"><summary>Advanced skill cards & bonus adjustments</summary></details>`);
const stigmas=make('div','v2-stigmas',`<p>Four selectable Stigma slots. Edit each equipped skill's level using − / +. Perk breakpoints: 5, 10, 15 and 20.</p><div id="v2-stigma-list"></div><button type="button" id="v2-stigma-reset">Restore recommended Stigmas</button>`);
const boardControls=make('div','v2-board-controls',`
 <div class="v2-board-callout"><b>Original AION 2 board coordinates</b><span>The board is never stretched; pan within the canvas or adjust tile size.</span></div>
 <button type="button" id="v2-board-toggle">Edit selected node</button><button type="button" id="v2-board-restore">Recommended path</button>
 <button type="button" id="v2-mark-obtained">Mark tile obtained</button>
 <button type="button" id="v2-zoom-minus" aria-label="Zoom out">−</button><span id="v2-zoom-label">40px</span><button type="button" id="v2-zoom-plus" aria-label="Zoom in">+</button><button type="button" id="v2-board-expand">Expand board</button>
 <p id="v2-board-notice" role="status"></p>`);
const modal=make('dialog','v2-comparison',`<div class="v2-compare-head"><h2>Your build vs. recommended</h2><button type="button" id="v2-comparison-close">✕</button></div><p>Compared at the same class, level, play context, and point totals. Equipment does not affect the recommended route.</p><div id="v2-comparison-body"></div><button type="button" id="v2-comparison-reset">Restore recommended allocations (keep gear)</button>`);modal.id='v2-comparison';
const slim=make('div','v2-slim-heading',`<span id="v2-master-status"></span><button type="button" id="v2-master-restore">Restore ranks</button>`);
const stigmaStatus=make('span','v2-stigma-status');stigmaStatus.id='v2-stigma-status';
function mount(){
 const p=$('planner-content');p.classList.add('v2-planner');
 p.insertBefore(quick,p.firstChild);quick.after(nav);
 const tabs=p.querySelector('.tabs');tabs.after(work);work.append(left,center,right);
 left.append($('gear'));center.append($('mastery'),$('stigma'));right.append($('boards'));
 work.after(footer);footer.append(next,note,full);full.append($('overview'));
 footer.after(extra);extra.append($('rotation'),$('titles'),$('sources'));
 $('mastery').insertBefore(master,$('mastery-visible'));
 master.querySelector('.v2-advanced-skills').append($('skill-grid'));
 $('mastery').querySelector('.section-title').append(slim);
 $('stigma').append(stigmas);$('stigma').querySelector('.section-title').append(stigmaStatus);
 $('board-tabs').after(boardControls);
 document.body.append(modal);
 $('v2-class').innerHTML=CLASS_ORDER.map(c=>`<option value="${c}">${PROFILES[c].name}</option>`).join('');
 document.body.classList.add('v2-active');
 bind();
}
function skillsView(m){
 const a=account(),items=Object.values(data().skills),names=skillNames();
 if(!names.includes(skill))skill=names.find(n=>SPECS[state.class]?.[n])||names[0];
 const query=(state.masterySearch||'').toLowerCase();
 $('v2-skill-list').innerHTML=items.map((item,i)=>({item,i})).filter(({item})=>item.name.toLowerCase().includes(query)&&(!isLeveling()||(SKILL_UNLOCKS[state.class][item.name]||1)<=currentLevel())).map(({item,i})=>{
 const name=item.name,lv=m.mastery.levels[name]||1,board=m.effects.skills[name]||0,gear=(a.gear[name]||0)+(gearSkillLevels()[name]||0),cap=masteryRankCap(name);
 const art=item.icon?.startsWith('/game/skills/')?`<img src="https://aion2data.com${esc(item.icon)}" loading="lazy" alt="">`:'✦';
 return `<div class="v2-skill ${skill===name?'chosen':''}" data-skill="${esc(name)}"><button type="button" data-v2-select-skill="${esc(name)}" class="v2-skill-label">${art}<span><b>${esc(name)}</b><small>${i<12?'Active':'Passive'} · ${SPECS[state.class]?.[name]?'View specialties':'Rank & effects'}</small></span></button>
 <div class="v2-rank"><button type="button" data-v2-rank="${esc(name)}" data-dir="-1" ${lv===1?'disabled':''} aria-label="Decrease ${esc(name)}">−</button><b>${lv}<small>/10</small></b><button type="button" data-v2-rank="${esc(name)}" data-dir="1" ${lv>=cap||m.mastery.spent+masteryCost(lv+1)>budget('mastery')?'disabled':''} aria-label="Increase ${esc(name)}">+</button></div>
 <span class="v2-green">+${board}</span><span class="v2-green">${gear?'+'+gear:'—'}</span><b class="v2-effective">Lv ${effective(name,m)}</b></div>`;
 }).join('')||'<div class="v2-muted">No currently unlocked skills match.</div>';
 const def=items.find(s=>s.name===skill),eff=effective(skill,m),s=SPECS[state.class]?.[skill],chosen=specPicks(skill,eff),slots=specialtySlots(eff);
 $('v2-spec-panel').innerHTML=`<header class="v2-spec-title"><b>${esc(skill)} · Specialties</b><span>Effective Lv ${eff} · ${slots}/3 slots</span><button type="button" id="v2-spec-restore" ${a.customSpecialties?.[skill]?'':'disabled'}>Restore</button></header>`+
 (!s?'<p class="v2-muted">No verified specialization effects available for this skill.</p>':`
 <div class="v2-spec-slots">${[0,1,2].map(i=>`<div class="${i>=slots?'locked':''}"><small>Slot ${i+1}${i>=slots?` · opens Lv ${[8,12,20][i]}`:''}</small><strong>${i<slots&&chosen[i]?esc(s.options[chosen[i]]):'—'}</strong></div>`).join('')}</div>
 <div class="v2-spec-options">${Object.entries(s.options).map(([id,description])=>{
 const n=Number(id),required=n<=3?8:n===4?12:16,locked=eff<required,isSelected=chosen.includes(n);
 return `<button type="button" data-v2-spec="${n}" class="${isSelected?'chosen':''}" ${locked?'disabled':''}><span class="v2-spec-id">${n}</span><span><b>${esc(description)}</b><small>${locked?`Needs effective Lv ${required}`:isSelected?'Equipped · click to remove':'Available · click to equip'}</small></span><strong>${isSelected?'✓':locked?'🔒':'+'}</strong></button>`;
 }).join('')}</div>`);
 $('v2-master-status').textContent=`${m.mastery.spent} / ${budget('mastery')} Mastery spent`;
 $('v2-master-restore').disabled=!a.manualMastery;
}
function stigmasView(m){
 const slots=isLeveling()?levelReward().slots:4,load=activeStigmas(),names=Object.keys(STIGMAS[state.class]);
 $('v2-stigma-list').innerHTML=[0,1,2,3].map(i=>{
 if(i>=slots)return `<div class="v2-stigma-item unavailable"><b>Slot ${i+1}</b><span>Locked · character Lv ${[22,27,32,37][i]}</span></div>`;
 const name=load[i],lv=m.stigma.levels[name]||0,perks=STIGMAS[state.class][name]?.perks||{};
 const unlocked=Object.entries(perks).filter(([rank])=>+rank<=lv).at(-1),upcoming=[5,10,15,20].find(n=>n>lv);
 return `<div class="v2-stigma-item"><label>Slot ${i+1}<select data-v2-stigma-choice="${i}">${names.map(n=>`<option value="${esc(n)}" ${n===name?'selected':''}>${esc(n)}</option>`).join('')}</select></label><div class="v2-stigma-rank">
 <button type="button" data-v2-stigma-rank="${i}" data-dir="-1" ${lv===0?'disabled':''}>−</button><b>Lv ${lv} <small>/20</small></b><button type="button" data-v2-stigma-rank="${i}" data-dir="1" ${lv>=20||m.stigma.spent+stigmaCost(lv+1)>budget('stigma')?'disabled':''}>+</button></div>
 <small class="v2-stigma-effect">${esc(unlocked?.[1]||(upcoming?'Next perk at Lv '+upcoming:'All milestones unlocked'))}</small></div>`;
 }).join('');
 $('v2-stigma-status').textContent=`${m.stigma.spent} / ${budget('stigma')} spent · ${slots}/4 slots`;
 $('v2-stigma-reset').disabled=!account().manualStigma&&!account().customStigmas;
}
function actionsView(m){
 const first=masteryStages().find(([name,wanted])=>(m.mastery.levels[name]||1)<Math.min(wanted,masteryRankCap(name)));
 const route=routeSteps(activeRoute(),nodeMap()),nextBoard=route.find(n=>!obtainedNodes().has(n.id)),gear=Object.values(gearEquipment()).filter(Boolean).length;
 const parts=[
 ['Mastery',first?`Increase ${first[0]} toward rank ${Math.min(first[1],masteryRankCap(first[0]))}`:m.mastery.next?`Earn ${m.mastery.next.need} more points for ${m.mastery.next.name}`:'Inspect skill specialties','mastery'],
 ['Stigma',m.stigma.next?`Earn ${m.stigma.next.need} points for ${m.stigma.next.name}`:'Inspect levels & unlocked effects','stigma'],
 ['Daevanion',nextBoard?`${nextBoard.board} · ${effectText(nextBoard.node)}`:'Review connected purchase path','boards']
 ];
 next.innerHTML=`<div class="v2-next-heading"><b>Next recommended upgrades</b><small>Guidance only, not assumed equipment</small></div>`+parts.map(([name,detail,target],i)=>`<button data-v2-focus="${target}"><em>${i+1}</em><span><b>${name}</b><small>${esc(detail)}</small></span><span>→</span></button>`).join('');
 $('v2-status').innerHTML=modifiedBuild()?'<b class="modified">● Modified progression</b><small>Custom allocation</small>':'<b>● Following recommended</b><small>Your own gear stays separate</small>';
 $('v2-reset-allocations').hidden=!modifiedBuild();
 $('v2-board-notice').textContent=message;
 const n=nodeMap().get(state.node);
 $('v2-mark-obtained').disabled=!n||!n.node[5]||!boardOpen(n.board);
 $('v2-mark-obtained').textContent=n&&obtainedNodes().has(n.node[0])?'Unmark obtained':'Mark tile obtained';
 note.innerHTML=`<span>${gear?`${gear} equipment slots entered.`:'No gear assumed.'} Equipment only affects actual effective levels and estimates, not the recommended route.</span><button type="button" id="v2-open-comparison">Compare builds</button>`;
}
function sync(m){
 if(!state.class)return;
 document.body.classList.add('v2-has-class');
 const a=account();
 $('v2-class').value=state.class;$('v2-level').value=currentLevel();$('v2-level').disabled=!isLeveling();
 $('v2-stage').value=a.journey;$('v2-context').value=a.context;
 $('v2-context').querySelector('option[value=pvp]').disabled=isLeveling();
 $('board-grid').style.setProperty('--v2-node',zoom+'px');$('v2-zoom-label').textContent=zoom+'px';
 m ||= model();skillsView(m);stigmasView(m);actionsView(m);
 const secondary=['rotation','titles','sources'].includes(state.tab);
 document.body.classList.toggle('v2-secondary',secondary);
 nav.querySelectorAll('[data-v2-tab]').forEach(b=>b.classList.toggle('active',b.dataset.v2Tab===(secondary?state.tab:'workspace')));
}
function restore(){
 const a=account();a.manualMastery=null;a.manualStigma=null;a.customStigmas=null;a.customSpecialties={};a.boardMode='recommended';
 message='Recommended allocations restored; point totals and equipment remain intact.';render();
}
function compare(){
 const m=model(),baseline=allocate(masteryStages(),budget('mastery'),masteryCost,skillNames(),1,masteryRankCap),
 names=skillNames(),diff=names.filter(n=>m.mastery.levels[n]!==baseline.levels[n]);
 const picked=activeStigmas(),stig=allocate(stigmaStages(),budget('stigma'),stigmaCost,picked,0);
 const changes=picked.filter(n=>(m.stigma.levels[n]||0)!==(stig.levels[n]||0));
 $('v2-comparison-body').innerHTML=`<h3>Mastery</h3>${diff.length?diff.map(n=>`<p>${esc(n)} · Recommended ${baseline.levels[n]} → Your ${m.mastery.levels[n]}</p>`).join(''):'<p>No Mastery rank differences.</p>'}
 <h3>Stigmas</h3>${changes.length?changes.map(n=>`<p>${esc(n)} · Recommended Lv ${stig.levels[n]||0} → Your Lv ${m.stigma.levels[n]||0}</p>`).join(''):'<p>No equipped Stigma level differences.</p>'}
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
 if(target){skill=target.dataset.v2SelectSkill;sync(model())}
 });
 $('v2-spec-panel').addEventListener('click',e=>{
 if(e.target.closest('#v2-spec-restore')){delete account().customSpecialties?.[skill];render();return}
 const b=e.target.closest('[data-v2-spec]');if(!b)return;
 const n=Number(b.dataset.v2Spec),level=effective(skill,model()),min=n<=3?8:n===4?12:16;if(level<min)return;
 const a=account();a.customSpecialties ||= {};
 const selections=[...(a.customSpecialties[skill]||recommendedSpecPicks(skill,level))],index=selections.indexOf(n);
 if(index>=0)selections.splice(index,1);else if(selections.length<specialtySlots(level))selections.push(n);else {selections.shift();selections.push(n)}
 a.customSpecialties[skill]=selections;message='Edited '+skill+' specializations.';render();
 });
 $('v2-stigma-list').addEventListener('change',e=>{
 const b=e.target.closest('[data-v2-stigma-choice]');if(!b)return;
 const pos=Number(b.dataset.v2StigmaChoice),a=account(),load=[...activeStigmas()],old=load[pos],other=load.indexOf(b.value);
 if(other>=0)load[other]=old;load[pos]=b.value;
 a.manualStigma ||= {...model().stigma.levels};a.customStigmas=load;message='Edited Stigma loadout.';render();
 });
 $('v2-stigma-list').addEventListener('click',e=>{
 const b=e.target.closest('[data-v2-stigma-rank]');if(!b)return;
 const name=activeStigmas()[Number(b.dataset.v2StigmaRank)],m=model(),dir=Number(b.dataset.dir),rank=(m.stigma.levels[name]||0)+dir,a=account();
 if(rank<0||rank>20||dir>0&&m.stigma.spent+stigmaCost(rank)>budget('stigma'))return;
 a.manualStigma ||= {...m.stigma.levels};a.manualStigma[name]=rank;message='Set '+name+' Stigma level '+rank+'.';render();
 });
 $('v2-stigma-reset').addEventListener('click',()=>{account().manualStigma=null;account().customStigmas=null;render()});
 $('v2-board-toggle').addEventListener('click',()=>{
 const entry=nodeMap().get(state.node);if(!entry||!entry.node[5]){message='Select a purchasable node first.';sync(model());return}
 if(!boardOpen(entry.board)){message='This board is not unlocked.';sync(model());return}
 const a=account();if(!customMode()){
 const map=nodeMap();a.customNodes=routeSteps(activeRoute(),map).filter(x=>x.total<=budget('crystals')).map(x=>x.id);
 a.customAzphelNodes=routeSteps(ROUTES[state.class].azphel,map).filter(x=>x.total<=(a.azphel||0)).map(x=>x.id);
 a.boardMode='custom';}
 setCustomNode(entry.node[0]);message=boardEditNotice;render();
 });
 $('v2-board-restore').addEventListener('click',()=>{account().boardMode='recommended';message='Recommended Daevanion route restored.';render()});
 $('v2-mark-obtained').addEventListener('click',()=>{const n=nodeMap().get(state.node);if(!n||!n.node[5]||!boardOpen(n.board))return;const marks=obtainedNodes();if(marks.has(state.node))marks.delete(state.node);else marks.add(state.node);storeObtained(marks);render()});
 $('v2-board-expand').addEventListener('click',()=>{const expanded=document.body.classList.toggle('v2-board-expanded');$('v2-board-expand').textContent=expanded?'Exit expanded':'Expand board'});
 for(const [id,step] of [['v2-zoom-minus',-4],['v2-zoom-plus',4]])$(id).addEventListener('click',()=>{zoom=Math.min(52,Math.max(32,zoom+step));$('board-grid').style.setProperty('--v2-node',zoom+'px');$('v2-zoom-label').textContent=zoom+'px'});
 $('mastery-search').addEventListener('input',()=>sync(model()));
 $('board-tabs').addEventListener('click',()=>setTimeout(()=>sync(model()),0));
 $('board-grid').addEventListener('click',()=>setTimeout(()=>sync(model()),0));
}
window.syncV2=sync;
mount();if(state.class)sync(model());
})();