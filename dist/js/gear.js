const GEAR_WEAPONS={templar:'Longsword',gladiator:'Greatsword',assassin:'Dagger',ranger:'Bow',sorcerer:'Spellbook',spiritmaster:'Orb',cleric:'Mace',chanter:'Staff'};
const GEAR_SLOTS=[
  {id:'weapon',name:'Main weapon',type:'weapon',area:'left'},
  {id:'guard',name:'Guard',type:'Guard',area:'right'},
  {id:'helm',name:'Helm',type:'Helm',area:'left'},
  {id:'pauldrons',name:'Pauldrons',type:'Pauldrons',area:'right'},
  {id:'top',name:'Chest',type:'Top',area:'left'},
  {id:'legs',name:'Legs',type:'Legs',area:'right'},
  {id:'gloves',name:'Gloves',type:'Gloves',area:'left'},
  {id:'shoes',name:'Shoes',type:'Shoes',area:'right'},
  {id:'cloak',name:'Cloak',type:'Cloak',area:'left'},
  {id:'necklace',name:'Necklace',type:'Necklace',area:'right'},
  {id:'earring1',name:'Earring I',type:'Earrings',area:'left'},
  {id:'earring2',name:'Earring II',type:'Earrings',area:'right'},
  {id:'ring1',name:'Ring I',type:'Ring',area:'left'},
  {id:'ring2',name:'Ring II',type:'Ring',area:'right'},
  {id:'bracelet1',name:'Bracelet I',type:'Bracelet',area:'left'},
  {id:'bracelet2',name:'Bracelet II',type:'Bracelet',area:'right'},
  {id:'amulet',name:'Amulet',type:'Amulet',area:'left'},
  {id:'belt',name:'Belt',type:'Belt',area:'right'},
  {id:'rune1',name:'Rune I',type:'Rune',area:'left'},
  {id:'rune2',name:'Rune II',type:'Rune',area:'right'},
  {id:'chalice',name:'Chalice',type:'Chalice',area:'arcana'},
  {id:'parchment',name:'Parchment',type:'Parchment',area:'arcana'},
  {id:'compass',name:'Compass',type:'Compass',area:'arcana'},
  {id:'bell',name:'Bell',type:'Bell',area:'arcana'},
  {id:'mirror',name:'Mirror',type:'Mirror',area:'arcana'},
  {id:'wings',name:'Wings',type:'Wing',area:'wings'},
];
// The inventory order mirrors the two-column in-game inventory strip.
// Inspect separates equipment and accessories around the central aether field.
const GEAR_INVENTORY_ORDER=['weapon','guard','helm','pauldrons','top','belt','legs','gloves','cloak','shoes','necklace','earring1','earring2','amulet','ring1','ring2','bracelet1','bracelet2','rune1','rune2'];
const GEAR_INSPECT_LEFT=['weapon','guard','helm','pauldrons','top','belt','legs','gloves','cloak','shoes','rune1','rune2'];
const GEAR_INSPECT_RIGHT=['bracelet1','bracelet2','earring1','amulet','ring1','ring2','earring2','necklace'];
const GEAR_TILE_LABELS={weapon:'Weapon',pauldrons:'Shoulder',earring1:'Ear I',earring2:'Ear II',bracelet1:'Brace I',bracelet2:'Brace II'};
let gearDraft=null,gearSlotId=null,gearQuery='';
const gearSlot=id=>GEAR_SLOTS.find(slot=>slot.id===id);
const gearEquipment=()=>{account().equipment ||= {};return account().equipment};
const gearAllowedType=slot=>slot.type==='weapon'?GEAR_WEAPONS[state.class]:slot.type;
const gearIsActive=(slot,item)=>!!item&&(!item.requiredLevel||currentLevel()>=Number(item.requiredLevel))&&(slot.area!=='arcana'||currentLevel()>=45);
function gearSkillLevels(){
  const total={};
  for(const slot of GEAR_SLOTS){const item=gearEquipment()[slot.id];if(!gearIsActive(slot,item))continue;
    for(const bonus of item.skillBonuses||[]){if(!skillNames().includes(bonus.skill))continue;total[bonus.skill]=(total[bonus.skill]||0)+clamp(bonus.levels,0,30)}
  }
  return total;
}
function gearIcon(item){return item?.icon?.startsWith('/game/')?`<img src="https://aion2data.com${esc(item.icon)}" alt="" loading="lazy">`:'<span class="gear-empty-icon" aria-hidden="true">✧</span>'}
function gearSlotHTML(slot){
  const item=gearEquipment()[slot.id],active=gearIsActive(slot,item),locked=slot.area==='arcana'&&currentLevel()<45;
  const grade=['Common','Rare','Epic','Unique'].includes(item?.grade)?item.grade.toLowerCase():'none';
  return `<button type="button" class="gear-slot ${item?'filled':''} grade-${grade} ${locked?'locked':''} ${item&&!active?'inactive':''}" data-gear-slot="${slot.id}" aria-label="${esc(slot.name)}: ${item?esc(item.name):'empty'}"><span class="gear-slot-icon">${gearIcon(item)}</span><span class="gear-slot-copy"><small>${esc(slot.name)}${locked?' · Lv 45':''}</small><b>${item?esc(item.name):'Empty slot'}</b><em>${item?`${item.enhancement?`+${item.enhancement} · `:''}${esc(item.grade||item.type||gearAllowedType(slot))}${!active?' · inactive':''}`:esc(gearAllowedType(slot))}</em></span></button>`;
}
function gearTileHTML(id){
  const slot=gearSlot(id),item=gearEquipment()[id],active=gearIsActive(slot,item),grade=['Common','Rare','Epic','Unique'].includes(item?.grade)?item.grade.toLowerCase():'none';
  return `<button type="button" class="gear-tile ${item?'filled':''} grade-${grade} ${id.startsWith('rune')?'rune':''} ${item&&!active?'inactive':''}" data-gear-slot="${id}" title="${esc(slot.name)}${item?`: ${esc(item.name)}`:' · empty'}" aria-label="${esc(slot.name)}: ${item?esc(item.name):'empty; select to search Global gear'}"><span class="gear-tile-art">${gearIcon(item)}</span>${item?.enhancement?`<strong class="gear-tile-enhancement">+${clamp(item.enhancement,0,30)}</strong>`:''}${!item?`<span class="gear-tile-empty-label">${esc(GEAR_TILE_LABELS[id]||slot.name)}</span>`:''}<span class="gear-tile-slot-label">${esc(slot.name)}</span></button>`;
}
function gearTileGroup(ids){return ids.map(gearTileHTML).join('')}
function renderGear(){
  const equipment=gearEquipment(),regular=GEAR_SLOTS.filter(s=>['left','right'].includes(s.area)),arcana=GEAR_SLOTS.filter(s=>s.area==='arcana');
  const active=GEAR_SLOTS.filter(s=>gearIsActive(s,equipment[s.id])),gearCount=regular.filter(s=>equipment[s.id]).length;
  $('gear-count').textContent=`${gearCount} / 20 gear slots`;
  $('gear-class-heading').textContent=`${profile().name} · ${GEAR_WEAPONS[state.class]} and Guard`;
  $('gear-level-note').textContent=`${profile().name} · level ${currentLevel()}`;
  $('gear-snapshot').textContent=`${GEAR_CATALOG.clientVersion} · retrieved ${GEAR_CATALOG.retrieved}`;
  $('gear-summary').innerHTML=`<div><strong>${gearCount}<small>/ 20</small></strong><span>Equipment</span></div><div><strong>${arcana.filter(s=>equipment[s.id]).length}<small>/ 5</small></strong><span>Arcana</span></div><div><strong>${equipment.wings?'1':'0'}<small>/ 1</small></strong><span>Wings</span></div><div><strong>${active.length}</strong><span>Active now</span></div>`;
  const view=state.gearView||((window.matchMedia&&window.matchMedia('(max-width: 700px)').matches)?'inventory':'inspect');
  document.querySelectorAll('[data-gear-view]').forEach(button=>{const selected=button.dataset.gearView===view;button.classList.toggle('active',selected);button.setAttribute('aria-pressed',String(selected))});
  $('gear-doll-grid').className=`gear-doll-grid ${view}`;
  $('gear-doll-grid').innerHTML=view==='inventory'?`<div class="gear-inventory-backdrop"><span aria-hidden="true">✦</span><div class="gear-inventory-tiles">${gearTileGroup(GEAR_INVENTORY_ORDER)}</div></div>`:`<div class="gear-inspect-layout"><div class="gear-inspect-wing left" aria-hidden="true">⚔</div><div class="gear-inspect-wing right" aria-hidden="true">♧</div><div class="gear-inspect-tiles gear-inspect-left">${gearTileGroup(GEAR_INSPECT_LEFT)}</div><div class="gear-inspect-center" aria-hidden="true"><div class="gear-aether-ring"><span>✦</span></div><i></i></div><div class="gear-inspect-tiles gear-inspect-right">${gearTileGroup(GEAR_INSPECT_RIGHT)}</div></div>`;
  $('gear-arcana-grid').innerHTML=arcana.map(gearSlotHTML).join('');
  $('gear-wing-slot').innerHTML=gearSlotHTML(gearSlot('wings'));
  const bonuses=Object.entries(gearSkillLevels()).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
  $('gear-skill-summary').innerHTML=bonuses.length?bonuses.map(([name,levels])=>`<div class="gear-bonus"><span>${esc(name)}</span><b>+${levels}</b></div>`).join(''):'<p>No item skill levels recorded yet. Edit a slot and add the roll shown on your item.</p>';
}
function gearResults(){
  const slot=gearSlot(gearSlotId),type=gearAllowedType(slot),query=gearQuery.trim().toLocaleLowerCase();
  const matches=GEAR_CATALOG.items.filter(item=>item.type===type&&(!query||`${item.name} ${item.href.split('/').pop().split('-')[0]}`.toLocaleLowerCase().includes(query)));
  const shown=matches.slice(0,60);
  $('gear-results').innerHTML=`<p>${matches.length} Global ${esc(type)} items${matches.length>shown.length?` · showing first ${shown.length}`:''}</p>${shown.map(item=>`<button type="button" data-gear-result="${esc(item.href)}"><span class="gear-result-icon">${gearIcon(item)}</span><span><b>${esc(item.name)}</b><small>${esc(item.href.split('/').pop().split('-')[0])}</small></span></button>`).join('')||'<div class="gear-no-results">No matching item in this Global snapshot. You can enter an item manually below.</div>'}`;
}
function gearEditor(){
  const item=gearDraft||{},type=gearAllowedType(gearSlot(gearSlotId)),skills=skillNames();
  const source=item.href?.startsWith('/')?`<a href="https://aion2data.com${esc(item.href)}" target="_blank" rel="noopener noreferrer">Open Global item data ↗</a>`:'<span>Manual entry</span>';
  const base=(item.baseStats||[]).slice(0,9).map(line=>`<span>${esc(line)}</span>`).join('');
  $('gear-editor').innerHTML=`<div class="gear-selected"><span class="gear-selected-icon">${gearIcon(item)}</span><div><b>${esc(item.name||'Choose an item or enter one below')}</b><small>${esc(item.grade||type)}${item.requiredLevel?` · Required Lv ${item.requiredLevel}`:''}</small>${source}</div></div>${base?`<div class="gear-base-stats"><b>Base tooltip</b><div>${base}</div></div>`:''}<div class="gear-fields"><label>Item name<input name="name" value="${esc(item.name||'')}" required placeholder="Choose from search or type a name"></label><div class="gear-field-row"><label>Enhancement +<input name="enhancement" type="number" min="0" max="30" value="${clamp(item.enhancement||0,0,30)}"></label><label>Required level<input name="requiredLevel" type="number" min="1" max="45" value="${item.requiredLevel||''}" placeholder="—"></label></div><label>Item level <small>From tooltip; separate from Combat Power</small><input name="itemLevel" type="number" min="0" value="${item.itemLevel||''}" placeholder="—"></label><label>Potential / manastones / soul binding stats <small>Write your actual rolls</small><textarea name="statNotes" rows="3" placeholder="e.g. Attack +15, Critical Hit +20, 4 manastones">${esc(item.statNotes||'')}</textarea></label><div class="gear-skill-fields"><b>Rolled skill levels</b><p>Only add the +levels actually shown on this item. These update effective Mastery levels.</p>${[0,1,2].map(i=>{const bonus=item.skillBonuses?.[i]||{};return `<div class="gear-skill-row"><select name="skill${i}" aria-label="Skill bonus ${i+1}"><option value="">No skill</option>${skills.map(skill=>`<option value="${esc(skill)}" ${bonus.skill===skill?'selected':''}>${esc(skill)}</option>`).join('')}</select><input name="levels${i}" type="number" min="0" max="30" value="${bonus.levels||''}" placeholder="+" aria-label="Bonus levels ${i+1}"></div>`}).join('')}</div><label>Other equipment notes<textarea name="notes" rows="2" placeholder="Set piece, source, or future replacement">${esc(item.notes||'')}</textarea></label></div>`;
}
function openGearSlot(id){
  const slot=gearSlot(id);if(!slot)return;gearSlotId=id;gearQuery='';gearDraft=JSON.parse(JSON.stringify(gearEquipment()[id]||{}));
  $('gear-dialog-title').textContent=slot.name;$('gear-query').value='';gearResults();gearEditor();$('gear-dialog').showModal();$('gear-query').focus();
}
async function selectGearResult(href){
  const item=GEAR_CATALOG.items.find(x=>x.href===href&&x.type===gearAllowedType(gearSlot(gearSlotId)));if(!item)return;
  const prior=gearDraft||{};gearDraft={...prior,name:item.name,icon:item.icon,href:item.href,type:item.type,grade:'',baseStats:[],requiredLevel:null,itemLevel:null};gearEditor();
  try{
    const res=await fetch(`https://aion2data.com/tooltip${item.href}`);
    if(!res.ok)throw Error(`HTTP ${res.status}`);
    const tooltip=await res.json();
    if(gearDraft?.href!==item.href)return;
    const fields=(tooltip.groups||[]).flat().filter(x=>x.k==='p');
    const find=name=>fields.find(x=>x.t===name)?.v;
    const grade=(tooltip.kind||tooltip.sub||'').match(/\b(Common|Rare|Epic|Unique)\b/i)?.[1];
    gearDraft.grade=grade?grade[0].toUpperCase()+grade.slice(1).toLowerCase():'';
    gearDraft.requiredLevel=Number(find('Required level'))||null;
    gearDraft.itemLevel=Number(find('Item level'))||null;
    gearDraft.baseStats=fields.filter(x=>!['Item level','Required level','Class'].includes(x.t)).slice(0,12).map(x=>`${x.t} ${x.v}`);
    gearEditor();
  }catch(_){$('gear-editor').insertAdjacentHTML('afterbegin','<p class="gear-fetch-note">Live tooltip unavailable. The item and icon are saved from the Global catalog; enter its level and your rolls manually.</p>')}
}
function initGear(){
  $('gear').addEventListener('click',e=>{const slot=e.target.closest('[data-gear-slot]');if(slot)openGearSlot(slot.dataset.gearSlot)});
  document.querySelector('.gear-view-switch').addEventListener('click',e=>{const button=e.target.closest('[data-gear-view]');if(!button)return;state.gearView=button.dataset.gearView;save();renderGear()});
  $('gear-dialog-close').addEventListener('click',()=>$('gear-dialog').close());
  $('gear-query').addEventListener('input',e=>{gearQuery=e.target.value;gearResults()});
  $('gear-results').addEventListener('click',e=>{const result=e.target.closest('[data-gear-result]');if(result)selectGearResult(result.dataset.gearResult)});
  $('gear-remove').addEventListener('click',()=>{delete gearEquipment()[gearSlotId];$('gear-dialog').close();render()});
  $('gear-form').addEventListener('submit',e=>{
    e.preventDefault();const values=new FormData(e.currentTarget),name=String(values.get('name')||'').trim();if(!name)return;
    gearDraft={...(gearDraft||{}),name,type:gearAllowedType(gearSlot(gearSlotId)),enhancement:clamp(values.get('enhancement'),0,30),requiredLevel:values.get('requiredLevel')?clamp(values.get('requiredLevel'),1,45):null,itemLevel:values.get('itemLevel')?clamp(values.get('itemLevel'),0,999):null,statNotes:String(values.get('statNotes')||''),notes:String(values.get('notes')||''),skillBonuses:[0,1,2].map(i=>({skill:String(values.get(`skill${i}`)||''),levels:clamp(values.get(`levels${i}`),0,30)})).filter(x=>x.skill&&x.levels)};
    gearEquipment()[gearSlotId]=gearDraft;$('gear-dialog').close();render();
  });
}
