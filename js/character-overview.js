// Faithful character-first overview: summary cards use live Global planner state.
// Detailed editors remain mounted; no invented gear/CR/DPS or imported profile.
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v||0).toLocaleString('en-US',{maximumFractionDigits:2});
const contexts={solo:'Solo PvE',party:'Group PvE',pvp:'General PvP','pvp-arena':'Arena PvP','pvp-abyss-solo':'Solo Abyss PvP','pvp-abyss-group':'Group Abyss PvP'};
const CLASS_PORTRAITS=Object.freeze(Object.fromEntries(
 ['gladiator','templar','assassin','ranger','sorcerer','spiritmaster','cleric','chanter']
 .map(key=>[key,'https://aion2pilot.com/images/'+key+'-portrait.webp'])
));
// Official AION 2 class artwork mirrored by Aion2Pilot, © NCSOFT.
// These are class *representatives*, not the user's imported avatar.
function updateClassArt(){
 const cls=state?.class;
 if(!CLASS_PORTRAITS[cls])return;
 document.body.dataset.v6Class=cls;
 for(const selector of ['.v6-doll-art','.v6-hero-portrait']){
  const parent=document.querySelector(selector);
  if(!parent)continue;
  let img=parent.querySelector('img.v6-class-illustration');
  if(!img){
   img=document.createElement('img');img.className='v6-class-illustration';
   img.decoding='async';img.loading='eager';
   img.addEventListener('load',()=>parent.classList.toggle('v6-art-loaded',img.naturalWidth>0));
   img.addEventListener('error',()=>parent.classList.remove('v6-art-loaded'));
   parent.append(img);
  }
  if(img.dataset.class!==cls){
   img.dataset.class=cls;
   parent.classList.remove('v6-art-loaded');
   img.alt=selector==='.v6-doll-art'?profile().name+' — AION 2 class illustration':'';
   img.src=CLASS_PORTRAITS[cls];
  }
 }
 const doll=document.querySelector('.v6-doll-art');
 if(doll)doll.setAttribute('aria-label',profile().name+' class artwork (illustration, not actual character appearance)');
}
let dashboard;
const btn=(target,label)=>'<button type="button" data-v5-view="'+target+'" class="v6-link">'+label+' <span aria-hidden="true">↗</span></button>';
function mount(){
 if(dashboard||!document.body.classList.contains('v5-active')||!$('v2-workspace'))return;
 dashboard=document.createElement('section');
 dashboard.id='v6-overview';dashboard.className='v6-overview';dashboard.setAttribute('aria-label','Character overview');
 dashboard.innerHTML=
 '<section class="v6-panel v6-gear" aria-label="Equipment and stats overview">'+
  '<header class="v6-heading"><h2><span>♜</span> Equipment &amp; Stats</h2>'+btn('equipment','Edit equipment')+'</header>'+
  '<div class="v6-gear-grid"><div class="v6-doll">'+
    '<div class="v6-doll-ring" aria-hidden="true"></div><div class="v6-doll-art" role="img" aria-label="Decorative Daevanion guardian portrait"></div>'+
    '<div class="v6-doll-left" id="v6-left-slots"></div><div class="v6-doll-right" id="v6-right-slots"></div>'+
    '<div class="v6-doll-caption"><b id="v6-class">Templar</b><small id="v6-gear-count"></small></div>'+
   '</div><div class="v6-stats"><h3>Recorded Gear Stats <span title="Only known equipment bonuses, not full in-game totals">ⓘ</span></h3>'+
    '<div id="v6-stat-rows"></div><small class="v6-stats-foot">Known equipment bonuses only. Full character totals require verified data.</small></div></div>'+
  '<footer class="v6-gear-footer"><div><small>Estimated Combat Power</small><strong id="v6-cp">—</strong><span>Planner estimate · not game-server CP</span></div>'+
   '<div><small>In-game Gear Rating</small><strong id="v6-gr">—</strong><span>From your recorded GR</span></div></footer>'+
 '</section>'+
 '<section class="v6-panel v6-abilities" aria-label="Build abilities overview">'+
  '<div class="v6-ability-tabs">'+btn('skills','⚔ Skills')+btn('stigma','✧ Stigmas')+btn('arcana','◈ Arcana')+'</div>'+
  '<section class="v6-group"><header><h2>Active Skills</h2>'+btn('skills','Edit')+'</header><div class="v6-skill-row" id="v6-active"></div></section>'+
  '<section class="v6-group"><header><h2>Passive Skills</h2><small>Global Mastery</small></header><div class="v6-skill-row v6-passives" id="v6-passive"></div></section>'+
  '<section class="v6-group"><header><h2>Stigma Set</h2>'+btn('stigma','Edit')+'</header><div class="v6-stigma-row" id="v6-stigma"></div></section>'+
  '<section class="v6-group"><header><h2>Arcana</h2>'+btn('arcana','Edit')+'</header><div class="v6-arcana-row" id="v6-arcana"></div></section>'+
 '</section>'+
 '<aside class="v6-insights" aria-label="Recommendations and progression">'+
  '<section class="v6-panel"><header class="v6-heading"><h2><span>✦</span> Recommendation Insights</h2>'+btn('skills','Details')+'</header>'+
   '<div class="v6-reco-highlight"><span class="v6-crown">♛</span><div><b id="v6-reco-title">Group PvE</b>'+
    '<p id="v6-reco-text"></p></div>'+btn('skills','Review plan')+'</div>'+
   '<p class="v6-honest-note">Evidence-weighted advice; not a measured damage or survival gain.</p></section>'+
  '<section class="v6-panel"><header class="v6-heading"><h2><span>◎</span> Progression Targets</h2><small id="v6-goals"></small></header>'+
   '<div id="v6-progress" class="v6-progress"></div>'+
   '<p class="v6-target-context" id="v6-target-context"></p></section>'+
  '<section class="v6-panel"><header class="v6-heading"><h2><span>⚖</span> Build Comparison</h2><button id="v6-compare" type="button" class="v6-link">Open compare ↗</button></header>'+
   '<div class="v6-comparison-head"><span>System</span><span>Invested</span><span>Earned</span></div><div id="v6-diff" class="v6-diff"></div></section>'+
 '</aside>';
 $('v2-workspace').before(dashboard);
 const dock=document.createElement('section');dock.className='v6-compare-dock';dock.id='v6-compare-dock';
 dock.innerHTML='<div class="v6-dock-title"><span class="v6-dock-icon" aria-hidden="true">⚖</span><div>'+
    '<h2>Build Comparison &amp; Recommendations</h2><p>Recorded character, custom plan and recommended route.</p></div></div>'+
   '<article><small>Recorded character</small><b id="v6-observed"></b><span id="v6-observed-note"></span></article>'+
   '<article><small>Editable custom build</small><b id="v6-custom"></b><span id="v6-custom-note"></span></article>'+
   '<article class="v6-dock-recommended"><small>Recommended route</small><b id="v6-recommended"></b><span id="v6-recommended-note"></span></article>'+
   '<button type="button" id="v6-compare-dock-btn">Compare allocations ↗</button>';
 dashboard.after(dock);
 const hero=document.querySelector('.v5-masthead');hero?.classList.add('v6-masthead');
 if(hero){
  const portrait=document.createElement('div');portrait.className='v6-hero-portrait';portrait.setAttribute('aria-hidden','true');hero.prepend(portrait);
  const stats=document.createElement('div');stats.className='v6-hero-values';
  stats.innerHTML='<span>Combat Power <b id="v6-hero-cp">—</b></span><span>Gear Rating <b id="v6-hero-gr">—</b></span>';
  hero.querySelector('.v5-character-copy')?.append(stats);
 }
 const openCompare=()=>document.querySelector('#v5-tab-compare')?.click();
 $('v6-compare').addEventListener('click',openCompare);
 $('v6-compare-dock-btn').addEventListener('click',openCompare);
 dashboard.addEventListener('click',e=>{
  const slot=e.target.closest('[data-v6-slot]');if(!slot)return;
  document.querySelector('.v5-page-tabs [data-v5-view="equipment"]')?.click();
  requestAnimationFrame(()=>document.querySelector('#gear [data-gear-slot="'+slot.dataset.v6Slot+'"]')?.click());
 });
 update(model());
}
function slotMarkup(ids,eq){
 return ids.map(id=>{
   const slot=gearSlot(id),item=eq[id],lv=item?.enhancement||0;
   return '<button type="button" data-v6-slot="'+esc(id)+'" class="v6-slot grade-'+esc(gearGrade(item))+
     '" title="'+esc(slot?.name||id)+': '+esc(item?.name||'Empty')+'" aria-label="Edit '+
     esc(slot?.name||id)+'">'+gearIcon(item)+(lv?'<strong>+'+num(lv)+'</strong>':'')+
     '<small>'+esc(slot?.name||id)+'</small></button>';
 }).join('');
}
function skillMarkup(skills,m){
 return skills.map(s=>'<button type="button" data-v5-view="skills" class="v6-skill" title="'+esc(s.name)+'">'+
   gameSkillIconMarkup(state.class,s.name,'v6-ability-icon')+
   '<small>Lv '+(m.mastery.levels[s.name]||1)+'</small></button>').join('');
}
function mergedStats(){
 const combined=new Map();
 for(const source of [gearFixedTotals().stats,gearSocketTotals().stats,gearRolledStatTotals().stats])
  for(const s of source){const key=String(s.name||'').toLowerCase()+'|'+(s.unit||'');
    combined.set(key,(combined.get(key)||0)+(Number(s.value)||0));}
 const lookup=names=>{for(const name of names){for(const [k,v] of combined)if(k.split('|')[0]===name.toLowerCase())return {value:v,unit:k.split('|')[1]};}return null;};
 return [
  ['♡','HP',lookup(['Max HP','HP'])],['⚔','Attack',lookup(['Attack','Max Attack'])],
  ['◇','Defense',lookup(['Defense','Physical Defense'])],['⊕','Accuracy',lookup(['Accuracy','Accuracy Bonus'])],
  ['✧','Critical Hit',lookup(['Critical Hit'])],['✦','Damage Boost',lookup(['Damage Boost'])],
  ['↝','Combat Speed',lookup(['Combat Speed'])],['◈','PvE Damage',lookup(['PvE Damage Boost'])]
 ];
}
// A milestone is meaningful only when its source and type are explicit:
// projected effective Mastery vs actually purchased Stigma/Daevanion nodes.
function nextMasteryMilestone(m,a){
 const targets=typeof progressionBreakpoints==='function'
  ?progressionBreakpoints(state.class,a.context,a.pveObjective||'performance'):[];
 for(const [name,goal] of targets){
  if(!data().skills.some?.(x=>x.name===name) && !Object.values(data().skills).some(x=>x.name===name))continue;
  const level=skillLevelBreakdown(name,m).withPlan;
  if(level<goal)return {label:name+' Lv '+goal,detail:(goal-level)+' projected effective level'+(goal-level===1?'':'s')+' to go',target:'skills'};
 }
 return {label:'Key skill breakpoints planned',detail:'Check purchased bonuses and equipped Specialties.',target:'skills'};
}
function nextStigmaMilestone(m,a){
 const equipped=activeStigmas();
 const stages=typeof progressionStigmaStages==='function'
  ?progressionStigmaStages(state.class,a.context,equipped,adviceFor(state.class,a.context,a.pveObjective)):[];
 for(const [name,rank] of stages||[]){
  const owned=m.stigma.levels[name]||0;
  if(rank<=owned)continue;
  const need=stigmaTotal(rank)-stigmaTotal(owned);
  return {label:name+' Lv '+rank,detail:need+' additional Stigma point'+(need===1?'':'s')+' for this rank milestone',target:'stigma'};
 }
 return {label:'Stigma milestones planned',detail:'Review equipped choices and timing.',target:'stigma'};
}
function nextGearMilestone(a){
 const rating=Number(a.gearRating)||0;
 if(!rating)return {label:'Enter your Gear Rating',detail:'Unlock the next content-gate comparison.',target:'equipment'};
 const next=(typeof PROGRESSION_ITEM_LEVEL!=='undefined'?PROGRESSION_ITEM_LEVEL:[]).find(x=>x.level>rating);
 return next
  ?{label:'GR '+num(next.level),detail:num(next.level-rating)+' GR remaining · '+next.description,target:'equipment'}
  :{label:'Known GR milestones reached',detail:'Your current rating is '+num(rating)+'; verify current content gates in game.',target:'equipment'};
}
function targetCard(label,spent,total,detail,target,kind='planned'){
 const budgetValue=Math.max(0,Number(total)||0),invested=Math.max(0,Number(spent)||0);
 const remaining=Math.max(0,budgetValue-invested),percent=budgetValue?Math.min(100,Math.round(invested/budgetValue*100)):0;
 return '<div class="v6-meter v6-target" data-v6-target-kind="'+kind+'">'+
   '<div class="v6-target-top"><strong>'+esc(label)+'</strong>'+
   '<span>'+num(invested)+' / '+num(budgetValue)+'</span></div>'+
   '<progress value="'+invested+'" max="'+Math.max(1,budgetValue)+'" aria-label="'+esc(label)+(kind==='obtained'?' obtained':' allocated')+'"></progress>'+
   '<p>'+esc(detail)+'</p>'+
   '<button type="button" data-v5-view="'+target+'">'+
   (remaining?num(remaining)+' remaining':'Review '+label)+' ↗</button></div>';
}
function renderProgressTargets(m,a){
 const mastery=nextMasteryMilestone(m,a),stigma=nextStigmaMilestone(m,a),
  gear=nextGearMilestone(a);
 const purchased=typeof obtainedCrystalSpend==='function'?obtainedCrystalSpend('crystals'):0,
  azPurchased=typeof obtainedCrystalSpend==='function'?obtainedCrystalSpend('azphel'):0,
  arPurchased=typeof obtainedCrystalSpend==='function'?obtainedCrystalSpend('ariel'):0;
 const boardBudget=budget('crystals'),azBudget=isLeveling()?0:Number(a.azphel)||0,
  arBudget=isLeveling()?0:Number(a.ariel)||0;
 const levelNote=isLeveling()?'Unlocks at Lv 45':'';
 const cards=[
  targetCard('Mastery',m.mastery.spent,budget('mastery'),
   mastery.label+' · '+mastery.detail,'skills'),
  targetCard('Stigmas',m.stigma.spent,budget('stigma'),
   stigma.label+' · '+stigma.detail,'stigma'),
  targetCard('PvE Daevanian',purchased,boardBudget,
   'Actually obtained · '+num(m.boards.spent||0)+' crystals in planned route','boards','obtained'),
  targetCard('Azphel',azPurchased,azBudget,
   levelNote||'Actually obtained on PvP board','boards','obtained'),
  targetCard('Ariel',arPurchased,arBudget,
   levelNote||'Actually obtained on PvE board','boards','obtained')
 ];
 $('v6-progress').innerHTML=cards.join('')+
  '<div class="v6-next-gate"><div><small>GEAR / CONTENT MILESTONE</small>'+
  '<strong>'+esc(isLeveling()?'Next level':gear.label)+'</strong><p>'+
  esc(isLeveling()?'Level '+Math.min(45,currentLevel()+1)+' progression · available rewards and board unlocks depend on level.':gear.detail)+
  '</p></div><button type="button" data-v5-view="'+(isLeveling()?'skills':'equipment')+'">Review ↗</button></div>';
 const nextGaps=[
  Math.max(0,budget('mastery')-(m.mastery.spent||0)),
  Math.max(0,budget('stigma')-(m.stigma.spent||0)),
  Math.max(0,boardBudget-purchased)
 ];
 $('v6-goals').textContent=nextGaps.every(x=>!x)?'Core budgets accounted for':'Next upgrades';
 $('v6-target-context').textContent=
  'Gold = purchased Daevanian nodes; planned routes are not assumed purchased. Skill levels include projected bonuses.';
}
function progress(label,spent,total){
 const max=Math.max(1,total);return '<div class="v6-meter"><div><span>'+esc(label)+'</span>'+
  '<span>'+num(spent)+' / '+num(total)+'</span></div><progress max="'+max+'" value="'+Math.min(max,spent)+
  '" aria-label="'+esc(label)+' allocated points"></progress></div>';
}
function update(m){
 if(!dashboard||!state?.class)return;m||=model();
 const a=account(),eq=gearEquipment(),recorded=GEAR_SLOTS.filter(s=>['left','right'].includes(s.area)&&eq[s.id]).length;
 $('v6-class').textContent=profile().name+' · Lv '+currentLevel();
 updateClassArt();
 $('v6-gear-count').textContent=recorded+' / 20 recorded pieces';
 $('v6-left-slots').innerHTML=slotMarkup(['weapon','helm','top','gloves','shoes'],eq);
 $('v6-right-slots').innerHTML=slotMarkup(['necklace','earring1','ring1','bracelet1','amulet'],eq);
 $('v6-stat-rows').innerHTML=mergedStats().map(([icon,name,s])=>'<div class="v6-stat"><i aria-hidden="true">'+icon+
  '</i><span>'+name+'</span><b>'+ (s?'+ '+num(s.value)+(s.unit||''):'—')+'</b></div>').join('');
 const cp=$('gear-cp-estimate')?.textContent?.trim()||'—',gr=Number(a.gearRating)>0?num(a.gearRating):'—';
 $('v6-cp').textContent=$('v6-hero-cp').textContent=cp;
 $('v6-gr').textContent=$('v6-hero-gr').textContent=gr;
 const catalog=Object.values(data().skills);
 const core=adviceFor(state.class,a.context,a.pveObjective)?.core||[];
 const active=catalog.slice(0,12).sort((p,q)=>{let l=core.indexOf(p.name),r=core.indexOf(q.name);return (l<0?99:l)-(r<0?99:r);});
 $('v6-active').innerHTML=skillMarkup(active.slice(0,8),m);
 $('v6-passive').innerHTML=skillMarkup(catalog.slice(12,18),m);
 const stigmaNames=activeStigmas(),slots=isLeveling()?levelReward().slots:4;
 $('v6-stigma').innerHTML=Array.from({length:4},(_,i)=>{
  if(i>=slots)return '<div class="v6-stigma-tile locked"><span>🔒</span><small>Locked</small></div>';
  const name=stigmaNames[i],rank=m.stigma.levels[name]||0;
  return '<button type="button" data-v5-view="stigma" class="v6-stigma-tile" title="'+esc(name)+'">'+
   gameSkillIconMarkup(state.class,name,'v6-ability-icon')+
   '<strong>'+esc(name)+'</strong><small>Lv '+rank+'</small></button>';
 }).join('');
 $('v6-arcana').innerHTML=GEAR_SLOTS.filter(s=>s.area==='arcana').map(slot=>{
  const item=eq[slot.id];return '<button type="button" data-v5-view="arcana" class="v6-arcana-tile">'+
   '<span>'+gearIcon(item)+'</span><small>'+esc(item?.name||slot.name)+'</small></button>';
 }).join('');
 const rows=[['Mastery',m.mastery.spent,budget('mastery')],['Stigmas',m.stigma.spent,budget('stigma')],
  ['Daevanian',m.boards.spent||0,budget('crystals')],['Azphel',m.azphel?.spent||0,a.azphel||0],['Ariel',m.ariel?.spent||0,a.ariel||0]];
 renderProgressTargets(m,a);
 $('v6-diff').innerHTML=rows.map(([n,s,t])=>'<div><span>'+esc(n)+'</span><b>'+num(s)+'</b><small>'+num(t)+'</small></div>').join('');
 $('v6-reco-title').textContent=(contexts[a.context]||'Current context')+' · Recommended';
 $('v6-reco-text').textContent=(adviceFor(state.class,a.context,a.pveObjective)?.why||
  'Review Mastery, Stigmas and connected Daevanian routes.').slice(0,160);
 $('v6-observed').textContent=recorded+' gear items';
 $('v6-observed-note').textContent=(a.obtainedNodes?.length||0)+' nodes marked obtained · PLAYNC not imported';
 $('v6-custom').textContent=a.boardMode==='custom'?'Custom boards':'Editable character';
 $('v6-custom-note').textContent='Manual allocations and gear selections preserved';
 $('v6-recommended').textContent=num(m.boards.spent||0)+' / '+num(budget('crystals'))+' crystals';
 $('v6-recommended-note').textContent='Connected recommendation, not a verified CP gain';
}
const prev=window.syncV5;
window.syncV5=function(m){if(typeof prev==='function')prev(m);if(!dashboard)mount();if(dashboard)update(m);};
if(state?.class)mount();
document.querySelector('#class-buttons')?.addEventListener('click',()=>requestAnimationFrame(mount));
})();