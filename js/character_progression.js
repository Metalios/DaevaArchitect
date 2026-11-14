/* Character-wide progress editor for AION 2 Global.
 * User-owned collection choices are stored in the complete character account,
 * included in build library stages, share links and offline JSON export.
 * Do not treat tracked collection counts/rolls as verified server CP.
 */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const DATASET=CHARACTER_COLLECTION_DATA;
const G=(Object.keys(DATASET.genusTotals));
const STATS=['Damage Boost','PvE Damage Boost','PvP Damage Boost','Boss Damage Boost','Critical Damage Boost',
  'Double Chance','Perfect Chance','Attack','Attack Bonus','Might','Accuracy','Critical Hit',
  'Critical Hit Resist','Damage Tolerance','PvP Damage Tolerance','Status Effect Resist','Other'];
const RARITIES=['Not recorded','Common','Rare','Epic','Unique','Heroic'];
const CATEGORIES=17;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const int=(value,min,max)=>{const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.floor(n))):min};
const clone=value=>JSON.parse(JSON.stringify(value));
let panel='pets',query='',filter='all',ownership='all',page=0,windowLimit=32;
const validIds=new Set(DATASET.pets.map(p=>String(p.id)));
const wingsCatalog=new Set(DATASET.wings);
const genusCategories=new Set(G);
function defaultState(){
  return {version:1,pets:{},extraPets:[],genus:{},
    wings:{owned:{},equipped:''},
    monolith:{faction:0,reshanta:0,other:0,notes:''},
    pantheon:{slots:{}},
    skins:{collectionPoints:0,registered:0,categories:{},notes:''}};
}
function normalize(raw){
  const output=defaultState();
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return output;
  for(const [id,level] of Object.entries(raw.pets||{})){
    if(validIds.has(id)&&int(level,0,3)>0)output.pets[id]=int(level,0,3);
  }
  if(Array.isArray(raw.extraPets))output.extraPets=raw.extraPets.slice(0,64)
    .filter(p=>p&&typeof p==='object'&&genusCategories.has(p.genus)&&String(p.name||'').trim())
    .map((p,i)=>({id:'custom-'+i,name:String(p.name).trim().slice(0,80),genus:p.genus,level:int(p.level,0,3)}));
  for(const g of G){
    const record=raw.genus?.[g]||{};
    const lines=Array.isArray(record.lines)?record.lines:[];
    output.genus[g]={level:int(record.level,0,10),lines:Array.from({length:9},(_,i)=>{
      const row=lines[i]||{};
      return {stat:String(row.stat||'').slice(0,80),value:String(row.value||'').slice(0,36),
        grade:RARITIES.includes(row.grade)?row.grade:'Not recorded'};
    })};
  }
  for(const [name,record] of Object.entries(raw.wings?.owned||{}).slice(0,100)){
    const label=String(name).trim().slice(0,100);
    if(!label)continue;
    output.wings.owned[label]={enhancement:int(record?.enhancement,0,10)};
  }
  const equipped=String(raw.wings?.equipped||'');
  output.wings.equipped=output.wings.owned[equipped]?equipped:'';
  for(const key of ['faction','reshanta','other'])
    output.monolith[key]=int(raw.monolith?.[key],0,30);
  output.monolith.notes=String(raw.monolith?.notes||'').slice(0,500);
  for(let i=1;i<=17;i++){
    const slot=raw.pantheon?.slots?.[i]||{};
    output.pantheon.slots[i]={name:String(slot.name||'').slice(0,100),
      owned:slot.owned===true,equipped:slot.equipped===true&&slot.owned===true};
  }
  output.skins.collectionPoints=int(raw.skins?.collectionPoints,0,1000000);
  output.skins.registered=int(raw.skins?.registered,0,100000);
  output.skins.notes=String(raw.skins?.notes||'').slice(0,500);
  for(let i=1;i<=CATEGORIES;i++){
    const value=raw.skins?.categories?.[i]||{};
    output.skins.categories[i]={name:String(value.name||'').slice(0,80),complete:value.complete===true};
  }
  return output;
}
function current(){
  if(!state?.class)return null;
  const a=account();
  // Sanitize older imports, while retaining a stable normalized object on
  // subsequent renders; operations only modify the selected character.
  if(!a.characterProgression||a.characterProgression.version!==1)
    a.characterProgression=normalize(a.characterProgression);
  return a.characterProgression;
}
function ownedPets(s){
  const indexed=DATASET.pets.filter(p=>(s.pets[p.id]||0)>0);
  const extra=s.extraPets.filter(p=>p.level>0);
  return {indexed,extra,count:indexed.length+extra.length};
}
function overview(s){
  const pets=ownedPets(s),pantheon=Object.values(s.pantheon.slots);
  const wingCount=Object.keys(s.wings.owned).length,
    equipped=pantheon.filter(x=>x.equipped).length,
    ownPantheon=pantheon.filter(x=>x.owned).length,
    completed=Object.values(s.skins.categories).filter(c=>c.complete).length;
  return '<div class="ca-summary">'+
    [['Pets',pets.count+'/'+DATASET.pets.length,'Registered companions'],
     ['Wings',wingCount,'Owned in collection'],
     ['Monolith',s.monolith.faction+s.monolith.reshanta+s.monolith.other,'Recorded levels'],
     ['Pantheon',equipped+'/'+DATASET.pantheonSlots,'Equipped artworks'],
     ['Skins',completed+'/17','Completed categories']].map(([name,value,note])=>
      '<div class="ca-metric"><small>'+esc(name)+'</small><strong>'+esc(value)+'</strong><span>'+esc(note)+'</span></div>').join('')+
    '</div>';
}
function petData(s){
  const base=DATASET.pets.map(p=>({...p,level:int(s.pets[p.id],0,3),extra:false}));
  const extras=s.extraPets.map(p=>({...p,extra:true}));
  return [...base,...extras].filter(p=>{
    const q=(query||'').trim().toLowerCase();
    return (filter==='all'||p.genus===filter)&&
      (ownership==='all'||ownership==='owned'&&p.level>0||ownership==='missing'&&p.level===0)&&
      (!q||p.name.toLowerCase().includes(q)||String(p.id).includes(q));
  }).sort((a,b)=>a.name.localeCompare(b.name));
}
function genusCard(s,g){
  const own=DATASET.pets.filter(p=>p.genus===g&&(s.pets[p.id]||0)>0).length+
    s.extraPets.filter(p=>p.genus===g&&p.level>0).length;
  const rec=s.genus[g];
  return '<article class="ca-genus-card"><div class="ca-genus-heading"><b>'+esc(g)+'</b><span>'+own+' / '+DATASET.genusTotals[g]+' indexed</span></div>'+
    '<label>Genus Insight level <input type="number" min="0" max="10" step="1" data-ca-genus-level="'+g+'" value="'+rec.level+'"></label>'+
    '<details><summary>Analysis options · 9 slots</summary><div class="ca-genus-lines">'+
    rec.lines.map((line,i)=>'<div class="ca-line"><b>'+(i+1)+'</b>'+
      '<label>Stat<input data-ca-genus-stat="'+g+'" data-ca-line="'+i+'" value="'+esc(line.stat)+'" list="ca-stat-list" maxlength="80"></label>'+
      '<label>Roll<input data-ca-genus-value="'+g+'" data-ca-line="'+i+'" value="'+esc(line.value)+'" maxlength="36" placeholder="In-game value"></label>'+
      '<label>Grade<select data-ca-genus-grade="'+g+'" data-ca-line="'+i+'">'+
      RARITIES.map(v=>'<option value="'+esc(v)+'"'+(v===line.grade?' selected':'')+'>'+esc(v)+'</option>').join('')+
      '</select></label></div>').join('')+
    '</div></details></article>';
}
function renderPets(s){
  const all=petData(s),maxPage=Math.max(0,Math.ceil(all.length/windowLimit)-1);
  page=Math.min(page,maxPage);
  const rows=all.slice(page*windowLimit,(page+1)*windowLimit);
  const own=ownedPets(s);
  return '<div class="ca-utilities"><div><b>Pet collection</b><p>Choose the exact Insight level on your Global character. Levels 1–3 require 5 / 30 / 105 cumulative Souls. Your collection stays editable.</p></div>'+
    '<a href="'+DATASET.knownSources.pets+'" target="_blank" rel="noopener noreferrer">Source: Global pet roster</a></div>'+
    '<div class="ca-filters"><label>Find a pet<input id="ca-pet-search" type="search" value="'+esc(query)+'" placeholder="Name or pet ID" autocomplete="off"></label>'+
    '<label>Genus<select id="ca-genus-filter">'+
    ['all',...G].map(g=>'<option value="'+esc(g)+'"'+(filter===g?' selected':'')+'>'+esc(g==='all'?'All genera':g)+'</option>').join('')+
    '</select></label><label>Ownership<select id="ca-owner-filter">'+
    [['all','All'],['owned','Registered'],['missing','Missing']].map(([v,n])=>
      '<option value="'+v+'"'+(ownership===v?' selected':'')+'>'+n+'</option>').join('')+
    '</select></label></div>'+
    '<div class="ca-pet-meter" role="group" aria-label="Collection summary"><span><strong>'+own.count+'</strong> registered</span><span>'+DATASET.pets.length+' indexed Global pets</span>'+
    '<span>'+Math.max(0,DATASET.pets.length-own.indexed.length)+' indexed remaining</span></div>'+
    '<div class="ca-pet-list">'+rows.map(p=>'<div class="ca-pet-row" data-ca-pet-id="'+esc(p.id)+'">'+
      '<div class="ca-pet-avatar" aria-hidden="true">✦</div><div class="ca-pet-copy"><strong>'+esc(p.name)+'</strong><span>'+esc(p.genus)+
      (p.extra?' · manually added':' · #'+p.id)+'</span></div>'+
      '<div class="ca-levels" role="group" aria-label="'+esc(p.name)+' Insight level">'+
      [0,1,2,3].map(level=>'<button type="button" data-ca-pet="'+esc(p.id)+'" data-ca-level="'+level+'" aria-pressed="'+(p.level===level)+'"'+
        (p.level===level?' class="selected"':'')+' title="'+(level?'Insight '+level:'Not registered')+'">'+
        (level?'Lv '+level:'—')+'</button>').join('')+'</div></div>').join('')+
    (rows.length?'':'<p class="ca-empty">No pets match these filters.</p>')+'</div>'+
    '<div class="ca-page"><button type="button" data-ca-page="-1"'+(!page?' disabled':'')+'>Previous</button><span>Page '+(page+1)+' / '+(maxPage+1)+' · '+all.length+' matches</span>'+
    '<button type="button" data-ca-page="1"'+(page>=maxPage?' disabled':'')+'>Next</button></div>'+
    '<form id="ca-add-pet" class="ca-add-row"><label>New Global pet not in this snapshot <input name="name" maxlength="80" placeholder="Exact in-game pet name" required></label>'+
    '<label>Genus <select name="genus">'+G.map(g=>'<option value="'+g+'">'+g+'</option>').join('')+'</select></label>'+
    '<button type="submit">Add to my list</button></form>'+
    '<p class="ca-note">The indexed roster includes 211 client-derived pets. Manually added entries are identified separately. Pet Insight owned bonuses and Genus analysis lines are recorded, but are not yet included in calculated CP.</p>'+
    '<h3 class="ca-subtitle">Genus Insight & Analysis</h3>'+
    '<div class="ca-genus-grid">'+G.map(g=>genusCard(s,g)).join('')+'</div>'+
    '<datalist id="ca-stat-list">'+STATS.map(n=>'<option value="'+esc(n)+'">').join('')+'</datalist>';
}
function renderWings(s){
 const catalog=[...new Set([...DATASET.wings,...Object.keys(s.wings.owned)])].sort((a,b)=>a.localeCompare(b));
 return '<div class="ca-utilities"><div><b>Wings collection</b><p>Owned effects count even when a wing is not equipped. Record each wing’s enhancement level and which pair you wear.</p></div>'+
   '<a href="'+DATASET.knownSources.wings+'" target="_blank" rel="noopener noreferrer">Global wing source</a></div>'+
   '<div class="ca-wing-controls"><label>Equipped wings <select data-ca-equipped-wing><option value="">None recorded</option>'+
   Object.keys(s.wings.owned).sort().map(name=>'<option value="'+esc(name)+'"'+(s.wings.equipped===name?' selected':'')+'>'+esc(name)+'</option>').join('')+
   '</select></label><button type="button" data-ca-open-wing>Edit actual wing equipment and stat rolls</button></div>'+
   '<div class="ca-wing-grid">'+catalog.map(name=>{
     const owned=!!s.wings.owned[name],level=s.wings.owned[name]?.enhancement||0;
     return '<article class="ca-wing'+(owned?' owned':'')+'"><div class="ca-wing-mark" aria-hidden="true">◇</div>'+
       '<b>'+esc(name)+'</b><small>'+(wingsCatalog.has(name)?'Global catalog':'Custom entry')+'</small>'+
       '<label><input type="checkbox" data-ca-wing-owned="'+esc(name)+'"'+(owned?' checked':'')+'> Owned</label>'+
       '<label>Enhancement <input type="number" min="0" max="10" data-ca-wing-enh="'+esc(name)+'" value="'+level+'"'+(!owned?' disabled':'')+'></label></article>';
   }).join('')+'</div>'+
   '<form id="ca-add-wing" class="ca-add-row"><label>Additional wing name <input name="name" placeholder="Exact in-game wing name" maxlength="100" required></label><button type="submit">Record wing</button></form>'+
   '<p class="ca-note">This collection record does not fabricate equipped or owned combat stats. Use the existing equipment editor for real item stats, enchantments and roll data.</p>';
}
function renderMonolith(s){
 const cfg=[['faction','Faction-region Monolith','Your Elyos or Asmodian main progression'],
   ['reshanta','Ereshkigal · Reshanta','Record the current Global level; regional caps may change'],
   ['other','Other regional Monolith levels','Only levels actually unlocked for your character']];
 return '<div class="ca-utilities"><div><b>Monolith progression</b><p>Keep your actual Trace investment and regional progression recorded per character. Rewards are not assumed from level alone.</p></div></div>'+
   '<div class="ca-monolith-grid">'+cfg.map(([key,name,desc])=>'<article><small>'+esc(name)+'</small><strong>Lv '+s.monolith[key]+'</strong>'+
   '<p>'+esc(desc)+'</p><label>Recorded level <input type="number" min="0" max="30" data-ca-monolith="'+key+'" value="'+s.monolith[key]+'"></label></article>').join('')+'</div>'+
   '<label class="ca-notes">Monolith notes<textarea data-ca-monolith-notes maxlength="500" rows="3" placeholder="Trace sources, remaining upgrades, unlocked rewards...">'+esc(s.monolith.notes)+'</textarea></label>'+
   '<p class="ca-note">No hard-coded cap is imposed beyond the input range; Global Monolith availability has differed across patches. This tracker does not award unverified passive stats automatically.</p>';
}
function renderPantheon(s){
 const all=Object.values(s.pantheon.slots),owned=all.filter(x=>x.owned).length,used=all.filter(x=>x.equipped).length;
 return '<div class="ca-utilities"><div><b>Pantheon & artwork</b><p>Track up to 17 artwork positions. Name each card or statue as displayed in your Global client; record ownership and whether it is equipped.</p></div></div>'+
   '<div class="ca-pet-meter"><span>'+owned+' / 17 owned</span><span>'+used+' / 17 equipped</span><span>Names optional</span></div>'+
   '<div class="ca-pantheon-grid">'+Array.from({length:17},(_,idx)=>{
     const i=idx+1,c=s.pantheon.slots[i];
     return '<article class="ca-pantheon-card'+(c.equipped?' selected':'')+'"><small>Artwork slot '+i+'</small>'+
       '<input type="text" data-ca-pantheon-name="'+i+'" value="'+esc(c.name)+'" maxlength="100" placeholder="In-game name" aria-label="Artwork '+i+' name">'+
       '<label><input type="checkbox" data-ca-pantheon-owned="'+i+'"'+(c.owned?' checked':'')+'> Owned</label>'+
       '<label><input type="checkbox" data-ca-pantheon-equipped="'+i+'"'+(c.equipped?' checked':'')+(c.owned?'':' disabled')+'> Equipped</label></article>';
   }).join('')+'</div>'+
   '<p class="ca-note">This is a factual record of the artworks you enter, not an invented 17-card recommendation or an automatic Pantheon stat calculation.</p>';
}
function renderSkins(s){
 const count=Object.values(s.skins.categories).filter(c=>c.complete).length;
 return '<div class="ca-utilities"><div><b>Skin & closet collection</b><p>Record your collection points and category progress. Names can be filled from the in-game Collection window.</p></div></div>'+
   '<div class="ca-skin-inputs"><label>Collection points <input type="number" min="0" max="1000000" data-ca-skin-points value="'+s.skins.collectionPoints+'"></label>'+
   '<label>Registered skins <input type="number" min="0" max="100000" data-ca-skin-count value="'+s.skins.registered+'"></label>'+
   '<p>'+count+' / 17 categories completed</p></div>'+
   '<div class="ca-skin-grid">'+Array.from({length:CATEGORIES},(_,idx)=>{
     const i=idx+1,c=s.skins.categories[i];
     return '<div class="ca-skin-card"><label><input type="checkbox" data-ca-skin-complete="'+i+'"'+(c.complete?' checked':'')+'> Category '+i+'</label>'+
       '<input type="text" data-ca-skin-name="'+i+'" value="'+esc(c.name)+'" maxlength="80" aria-label="Category '+i+' name" placeholder="Category name"></div>';
   }).join('')+'</div>'+
   '<label class="ca-notes">Collection notes<textarea data-ca-skin-notes maxlength="500" rows="3">'+esc(s.skins.notes)+'</textarea></label>';
}
function render(){
 const root=$('collections');if(!root)return;
 const ready=!!state?.class;
 root.querySelector('#ca-body').innerHTML=!ready?'<p>Select a class first.</p>':(()=>{
   const s=current();
   return overview(s)+'<nav class="ca-nav" aria-label="Character collection systems">'+
     [['pets','Pets & Genus'],['wings','Wings'],['monolith','Monolith'],['pantheon','Pantheon'],['skins','Skins']].map(([id,name])=>
       '<button type="button" data-ca-view="'+id+'" aria-current="'+(panel===id?'page':'false')+'"'+(panel===id?' class="active"':'')+'>'+name+'</button>').join('')+
     '</nav><div class="ca-panel">'+({pets:renderPets,wings:renderWings,monolith:renderMonolith,pantheon:renderPantheon,skins:renderSkins}[panel])(s)+'</div>';
 })();
}
function update(target){
 const s=current();if(!s)return;
 const d=target.dataset;
 if(d.caPet!==undefined){
   const level=int(d.caLevel,0,3);
   if(String(d.caPet).startsWith('custom-')){
     const pet=s.extraPets.find(x=>x.id===d.caPet);if(pet)pet.level=level;
   }else if(validIds.has(d.caPet)){
     if(level===0)delete s.pets[d.caPet];else s.pets[d.caPet]=level;
   }
 }else if(d.caGenusLevel!==undefined&&genusCategories.has(d.caGenusLevel)){
   s.genus[d.caGenusLevel].level=int(target.value,0,10);
 }else if(d.caGenusStat!==undefined&&genusCategories.has(d.caGenusStat)){
   s.genus[d.caGenusStat].lines[int(d.caLine,0,8)].stat=String(target.value).slice(0,80);
 }else if(d.caGenusValue!==undefined&&genusCategories.has(d.caGenusValue)){
   s.genus[d.caGenusValue].lines[int(d.caLine,0,8)].value=String(target.value).slice(0,36);
 }else if(d.caGenusGrade!==undefined&&genusCategories.has(d.caGenusGrade)){
   s.genus[d.caGenusGrade].lines[int(d.caLine,0,8)].grade=RARITIES.includes(target.value)?target.value:'Not recorded';
 }else if(d.caWingOwned!==undefined){
   if(target.checked)s.wings.owned[d.caWingOwned] ||= {enhancement:0};
   else {delete s.wings.owned[d.caWingOwned];if(s.wings.equipped===d.caWingOwned)s.wings.equipped='';}
 }else if(d.caWingEnh!==undefined){
   if(s.wings.owned[d.caWingEnh])s.wings.owned[d.caWingEnh].enhancement=int(target.value,0,10);
 }else if(d.caEquippedWing!==undefined){
   s.wings.equipped=s.wings.owned[target.value]?target.value:'';
 }else if(d.caMonolith!==undefined&&['faction','reshanta','other'].includes(d.caMonolith)){
   s.monolith[d.caMonolith]=int(target.value,0,30);
 }else if(d.caMonolithNotes!==undefined)s.monolith.notes=String(target.value).slice(0,500);
 else if(d.caPantheonName!==undefined)s.pantheon.slots[int(d.caPantheonName,1,17)].name=String(target.value).slice(0,100);
 else if(d.caPantheonOwned!==undefined){
   const c=s.pantheon.slots[int(d.caPantheonOwned,1,17)];
   c.owned=target.checked;if(!c.owned)c.equipped=false;
 }else if(d.caPantheonEquipped!==undefined){
   const c=s.pantheon.slots[int(d.caPantheonEquipped,1,17)];
   c.equipped=c.owned&&target.checked;
 }else if(d.caSkinPoints!==undefined)s.skins.collectionPoints=int(target.value,0,1000000);
 else if(d.caSkinCount!==undefined)s.skins.registered=int(target.value,0,100000);
 else if(d.caSkinComplete!==undefined)s.skins.categories[int(d.caSkinComplete,1,CATEGORIES)].complete=target.checked;
 else if(d.caSkinName!==undefined)s.skins.categories[int(d.caSkinName,1,CATEGORIES)].name=String(target.value).slice(0,80);
 else if(d.caSkinNotes!==undefined)s.skins.notes=String(target.value).slice(0,500);
 else return;
 save();
 // Preserve open details, focused field, and internal scroll while updating
 // the overview metrics; don't rerun combat optimization for a checkbox.
 if(target.matches('input[type="text"],textarea,input[type="number"]')){
   const summary=$('collections').querySelector('.ca-summary');
   if(summary){const fresh=overview(s);summary.outerHTML=fresh;}
 }else render();
}
function mount(){
 const root=$('collections');if(!root)return;
 root.addEventListener('click',event=>{
   const target=event.target.closest('button');if(!target)return;
   if(target.dataset.caView){panel=target.dataset.caView;page=0;render();return}
   if(target.dataset.caPage){page=Math.max(0,page+Number(target.dataset.caPage));render();return}
   if(target.dataset.caPet!==undefined){update(target);return}
   if(target.dataset.caOpenWing!==undefined&&typeof openGearSlot==='function'){openGearSlot('wings');return}
 });
 root.addEventListener('change',event=>{
   const target=event.target;
   if(target.id==='ca-genus-filter'){filter=target.value;page=0;render();return}
   if(target.id==='ca-owner-filter'){ownership=target.value;page=0;render();return}
   if(target.id==='ca-pet-search')return;
   update(target);
 });
 root.addEventListener('input',event=>{
   if(event.target.id==='ca-pet-search'){
     query=event.target.value;page=0;
     const list=root.querySelector('.ca-pet-list'),paging=root.querySelector('.ca-page');
     // Delay full repaint until the user confirms; live search keeps focus
     // by replacing only search results and pagination.
     const s=current(),html=renderPets(s);
     const temporary=document.createElement('div');temporary.innerHTML=html;
     if(list)list.replaceWith(temporary.querySelector('.ca-pet-list'));
     if(paging)paging.replaceWith(temporary.querySelector('.ca-page'));
     const meter=root.querySelector('.ca-pet-meter');
     if(meter&&temporary.querySelector('.ca-pet-meter'))meter.replaceWith(temporary.querySelector('.ca-pet-meter'));
   }
 });
 root.addEventListener('submit',event=>{
   if(event.target.id==='ca-add-pet'){
     event.preventDefault();const values=new FormData(event.target);
     const name=String(values.get('name')||'').trim().slice(0,80),
       genus=String(values.get('genus')||'');
     const s=current();
     if(!name||!genusCategories.has(genus)||s.extraPets.length>=64)return;
     if(s.extraPets.some(x=>x.name.toLowerCase()===name.toLowerCase()&&x.genus===genus)||DATASET.pets.some(x=>x.name.toLowerCase()===name.toLowerCase()))return;
     s.extraPets.push({id:'custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name,genus,level:1});
     save();render();
   }else if(event.target.id==='ca-add-wing'){
     event.preventDefault();const name=String(new FormData(event.target).get('name')||'').trim().slice(0,100),s=current();
     if(!name||Object.keys(s.wings.owned).length>=100)return;
     s.wings.owned[name] ||= {enhancement:0};save();render();
   }
 });
 render();
}
window.CharacterProgression=Object.freeze({defaultState,normalize,render,mount,summary:()=>{
 const s=current();if(!s)return null;
 return {pets:ownedPets(s).count,petTotal:DATASET.pets.length,wings:Object.keys(s.wings.owned).length,
   pantheonOwned:Object.values(s.pantheon.slots).filter(x=>x.owned).length};
}});
mount();
})();
