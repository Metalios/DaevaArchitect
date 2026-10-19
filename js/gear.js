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
const GEAR_INSPECT_LEFT=['weapon','guard','helm','pauldrons','top','gloves','legs','shoes','cloak','belt'];
const GEAR_INSPECT_RIGHT=['necklace','amulet','earring1','earring2','ring1','ring2','bracelet1','bracelet2','rune1','rune2'];
const GEAR_TILE_LABELS={weapon:'Weapon',pauldrons:'Shoulder',earring1:'Ear I',earring2:'Ear II',bracelet1:'Brace I',bracelet2:'Brace II'};
const GEAR_GRADES=['Unique','Epic','Rare','Common','Special'];
const STONE_SLOTS_BY_GRADE={Common:1,Rare:2,Epic:3,Unique:4};
const STONE_ARMOR_IDS=new Set(['weapon','guard','helm','pauldrons','top','legs','gloves','shoes','cloak']);
const STONE_ACCESSORY_IDS=new Set(['necklace','earring1','earring2','ring1','ring2','bracelet1','bracelet2']);
const STONE_STATS=['HP','MP','Attack','Defense','Accuracy Bonus','Evasion Bonus','Critical Hit','Critical Hit Resist','Block','Damage Boost','Weapon Damage Boost','Critical Damage Boost','Back Attack Damage Boost','Front Attack Damage Boost','PvE Damage Boost','PvP Damage Boost','Boss Damage Boost','Boss Defense','Damage Tolerance','Penetration','Multi-hit Chance','Combat Speed'];
const THEOSTONE_FAMILIES=[
  ['Blind',"Kaisinel's Vestige","Bollvig's Tragedy","Fregion's Schemes"],
  ['Seal',"Perion's Tragedy","Khrudgelmir's Silence","Beritra's Conspiracy"],
  ['Root',"Heladrir's Chains","Charna's Root","Nezekan's March"],
  ['Stun',"Aulak's Roar","Fasimedes's Dignity","Meslamtaeda's Greed"],
  ['Paralyze',"Nua's Scheme","Vidar's Dignity","Ereshkigal's Honor"],
  ['Move Speed down',"Reda's Tenacity","Deltras's Loyalty","Kaisinel's Reverie"],
  ['Combat Speed down',"Notun's Craft","Io's Sadness","Lumiel's Interference"],
  ['Poison',"Santras's Secret","Orissan's Blood","Zikel's Arrogance"],
  ['Bleed',"Feruk's Instinct","Mahisha's Wrath","Fregion's Strategy"],
  ['Fire',"Zikel's Vestige","Traufnir's Courage","Tiamat's Rage"],
  ['Water',"Tassin's Command","Sif's Knowledge","Triniel's Rationality"],
  ['Earth',"Ulgorn's Will","Freyr's Wisdom","Vaizel's Oath"],
  ['Wind',"Aultross's Promise","Sigyn's Brilliance","Meslamtaeda's Regret"],
  ['Fire AoE',"Bargott's Ember","Boreas's Encouragement","Tiamat's Counterstrike"],
  ['Water AoE',"Aulvicar's Sorcery","Charna's Acumen","Marchutan's Justice"],
  ['Earth AoE',"Gartua's Strength","Thrasymedes's Wisdom","Yustiel's Compassion"],
  ['Wind AoE',"Rathman's Greed","Jumentis's Dexterity","Beritra's Selfishness"],
];
const THEOSTONES=THEOSTONE_FAMILIES.flatMap(([effect,...names])=>names.map((name,i)=>({name,effect,grade:['Rare','Epic','Unique'][i]})));
const GEAR_CATALOG_BY_HREF=new Map(GEAR_CATALOG.items.map(item=>[item.href,item]));
let gearDraft=null,gearSlotId=null,gearQuery='',gearGradeFilter='all',gearLevelFilter='usable',gearFactionFilter='own',gearEditorDirty=false;
const gearSlot=id=>GEAR_SLOTS.find(slot=>slot.id===id);
const gearEquipment=()=>{
  const equipment=account().equipment ||= {};
  for(const item of Object.values(equipment)){
    const catalog=GEAR_CATALOG_BY_HREF.get(item?.href);if(!catalog)continue;
    item.grade ||= catalog.grade||'';
    item.itemLevel ??= catalog.itemLevel||null;
    item.requiredLevel ??= catalog.requiredLevel||null;
    item.faction ??= catalog.faction||'';
    item.fixedStats ||= catalog.fixedStats||[];
  }
  return equipment;
};
const gearAllowedType=slot=>slot.type==='weapon'?GEAR_WEAPONS[state.class]:slot.type;
const gearIsActive=(slot,item)=>!!item&&(!item.requiredLevel||currentLevel()>=Number(item.requiredLevel))&&(slot.area!=='arcana'||currentLevel()>=45);
const gearGrade=item=>GEAR_GRADES.includes(item?.grade)?item.grade.toLowerCase():'none';
const gearItemId=item=>item.href?.split('/').pop().split('-')[0]||'';
const gearFactionLabel=item=>item.faction?item.faction[0].toUpperCase()+item.faction.slice(1):'Both factions';
const gearStoneFamily=slot=>STONE_ARMOR_IDS.has(slot.id)?'Manastone':STONE_ACCESSORY_IDS.has(slot.id)?'Soulstone':'';
function gearStoneSlots(slot,item){
  if(!gearStoneFamily(slot))return 0;
  if(item?.manastoneSlots!==null&&item?.manastoneSlots!==undefined)return clamp(item.manastoneSlots,0,4);
  return STONE_SLOTS_BY_GRADE[item?.grade]||0;
}
function gearTheostoneEligible(slot,item){
  if(!['weapon','guard'].includes(slot.id))return false;
  if(item?.theostoneSlots!==null&&item?.theostoneSlots!==undefined)return Number(item.theostoneSlots)>0;
  return ['Epic','Unique'].includes(item?.grade)||!item?.grade;
}
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
  const grade=gearGrade(item);
  return `<button type="button" class="gear-slot ${item?'filled':''} grade-${grade} ${locked?'locked':''} ${item&&!active?'inactive':''}" data-gear-slot="${slot.id}" aria-label="${esc(slot.name)}: ${item?esc(item.name):'empty'}"><span class="gear-slot-icon">${gearIcon(item)}</span><span class="gear-slot-copy"><small>${esc(slot.name)}${locked?' · Lv 45':''}</small><b>${item?esc(item.name):'Empty slot'}</b><em>${item?`${item.enhancement?`+${item.enhancement} · `:''}${esc(item.grade||item.type||gearAllowedType(slot))}${!active?' · inactive':''}`:esc(gearAllowedType(slot))}</em></span></button>`;
}
function gearTileHTML(id){
  const slot=gearSlot(id),item=gearEquipment()[id],active=gearIsActive(slot,item),grade=gearGrade(item);
  return `<button type="button" class="gear-tile ${item?'filled':''} grade-${grade} ${item&&!active?'inactive':''}" data-gear-slot="${id}" title="${esc(slot.name)}${item?`: ${esc(item.name)}`:' · empty'}" aria-label="${esc(slot.name)}: ${item?esc(item.name):'empty; select to search Global gear'}"><span class="gear-tile-art">${gearIcon(item)}</span>${item?.enhancement?`<strong class="gear-tile-enhancement">+${clamp(item.enhancement,0,30)}</strong>`:''}<span class="gear-tile-slot-label">${esc(GEAR_TILE_LABELS[id]||slot.name)}</span></button>`;
}
function gearTileGroup(ids){return ids.map(gearTileHTML).join('')}
function gearFixedTotals(){
  const totals=new Map();let pieces=0;
  for(const slot of GEAR_SLOTS){
    const item=gearEquipment()[slot.id];if(!gearIsActive(slot,item)||!item.fixedStats?.length)continue;
    pieces++;
    for(const stat of item.fixedStats){
      const value=String(stat.value||'').replace(/,/g,'').trim(),match=value.match(/^([+-]?\d+(?:\.\d+)?)(%)?$/);
      if(!match)continue;
      const key=`${stat.name}|${match[2]||''}`;
      totals.set(key,(totals.get(key)||0)+Number(match[1]));
    }
  }
  return {pieces,stats:[...totals].map(([key,value])=>{const [name,unit]=key.split('|');return {name,value,unit}}).sort((a,b)=>{
    const priority=['Max Attack','Min Attack','Attack','HP','Defense','Accuracy','Critical Hit','PvE Damage Boost'];
    return (priority.indexOf(a.name)<0?99:priority.indexOf(a.name))-(priority.indexOf(b.name)<0?99:priority.indexOf(b.name))||a.name.localeCompare(b.name);
  })};
}
function gearSocketTotals(){
  const totals=new Map();let filled=0,available=0;const theostones=[];
  for(const slot of GEAR_SLOTS){
    const item=gearEquipment()[slot.id];if(!gearIsActive(slot,item))continue;
    const count=gearStoneSlots(slot,item);available+=count;
    for(const stone of (item.stones||[]).slice(0,count)){
      if(!stone?.kind&&!stone?.stat)continue;filled++;
      const value=Number(stone.value);if(!stone.stat||!Number.isFinite(value)||!value)continue;
      const key=`${stone.stat}|${stone.unit==='%'?'%':''}`;totals.set(key,(totals.get(key)||0)+value);
    }
    if(gearTheostoneEligible(slot,item)&&item.theostone)theostones.push({slot:slot.name,name:item.theostone});
  }
  return {filled,available,theostones,stats:[...totals].map(([key,value])=>{const [name,unit]=key.split('|');return {name,value,unit}}).sort((a,b)=>a.name.localeCompare(b.name))};
}
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
  $('gear-doll-grid').innerHTML=view==='inventory'?`<div class="gear-inventory-backdrop"><span aria-hidden="true">✦</span><div class="gear-inventory-tiles">${gearTileGroup(GEAR_INVENTORY_ORDER)}</div></div>`:`<div class="gear-inspect-layout"><div class="gear-inspect-group"><span>WEAPONS & ARMOR</span><div class="gear-inspect-tiles gear-inspect-left">${gearTileGroup(GEAR_INSPECT_LEFT)}</div></div><div class="gear-inspect-center" aria-hidden="true"><div class="gear-aether-ring"><span>✦</span></div><b>${esc(profile().name)}</b><small>Equipped loadout</small></div><div class="gear-inspect-group"><span>ACCESSORIES</span><div class="gear-inspect-tiles gear-inspect-right">${gearTileGroup(GEAR_INSPECT_RIGHT)}</div></div></div>`;
  $('gear-arcana-grid').innerHTML=arcana.map(gearSlotHTML).join('');
  $('gear-wing-slot').innerHTML=gearSlotHTML(gearSlot('wings'));
  const bonuses=Object.entries(gearSkillLevels()).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
  $('gear-skill-summary').innerHTML=bonuses.length?bonuses.map(([name,levels])=>`<div class="gear-bonus"><span>${esc(name)}</span><b>+${levels}</b></div>`).join(''):'<p>No item skill levels recorded yet. Edit a slot and add the roll shown on your item.</p>';
  const fixed=gearFixedTotals();
  $('gear-fixed-stats').innerHTML=fixed.stats.length?`<p>Base stats from ${fixed.pieces} active piece${fixed.pieces===1?'':'s'}; personal rolls and upgrades excluded.</p>${fixed.stats.slice(0,9).map(stat=>`<div class="gear-bonus"><span>${esc(stat.name)}</span><b>+${Number(stat.value.toFixed(1)).toLocaleString()}${stat.unit}</b></div>`).join('')}`:'<p>Equip catalog items to see their known fixed stats here.</p>';
  const sockets=gearSocketTotals(),duplicate=sockets.theostones.length>1&&sockets.theostones[0].name===sockets.theostones[1].name;
  $('gear-socket-summary').innerHTML=`<p>${sockets.filled} / ${sockets.available} stone sockets recorded on active gear. Enter the actual rolled stats in each item.</p>${sockets.stats.length?sockets.stats.map(stat=>`<div class="gear-bonus"><span>${esc(stat.name)}</span><b>+${Number(stat.value.toFixed(2)).toLocaleString()}${stat.unit}</b></div>`).join(''):'<p>No socketed stat values recorded yet.</p>'}${sockets.theostones.map(stone=>`<div class="gear-bonus"><span>${esc(stone.slot)} Theostone</span><b>${esc(stone.name)}</b></div>`).join('')}${duplicate?'<p class="gear-stone-warning">Identical Theostone effects do not stack.</p>':''}`;
  const a=account(),healer=profile().kind==='healer',cp=Number(healer?a.gearCombatPower:a.goalObserved)||0,target=Number(healer?a.gearCpTarget:a.goalTarget)||0;
  $('gear-cp-input').value=cp||'';$('gear-cp-target').value=target||'';
  const percent=target?Math.round(cp/target*100):0,gap=Math.max(0,target-cp);
  $('gear-cp-status').innerHTML=target?`<b>${cp.toLocaleString()} / ${target.toLocaleString()} CP · ${percent}% of target</b><span>${cp?gap?`${gap.toLocaleString()} CP to go`:`Target reached · ${Math.max(0,cp-target).toLocaleString()} CP above target`:'Enter your current in-game CP to measure the gap.'}</span><div class="progress" role="progressbar" aria-label="Combat Power target progress" aria-valuenow="${Math.min(100,percent)}" aria-valuemin="0" aria-valuemax="100"><span style="width:${Math.min(100,percent)}%"></span></div>`:'<span>Set a target and enter the CP shown on your character sheet.</span>';
}
function gearResults(){
  const slot=gearSlot(gearSlotId),type=gearAllowedType(slot),query=gearQuery.trim().toLocaleLowerCase();
  const matches=GEAR_CATALOG.items.filter(item=>item.type===type
    &&(!query||`${item.name} ${gearItemId(item)}`.toLocaleLowerCase().includes(query))
    &&(gearGradeFilter==='all'||item.grade===gearGradeFilter)
    &&(gearLevelFilter==='all'||!item.requiredLevel||item.requiredLevel<=currentLevel())
    &&(gearFactionFilter==='all'||!item.faction||item.faction===account().faction));
  matches.sort((a,b)=>(GEAR_GRADES.indexOf(a.grade)<0?99:GEAR_GRADES.indexOf(a.grade))-(GEAR_GRADES.indexOf(b.grade)<0?99:GEAR_GRADES.indexOf(b.grade))||(b.itemLevel||0)-(a.itemLevel||0)||a.name.localeCompare(b.name)||a.href.localeCompare(b.href));
  $('gear-results').innerHTML=`<p class="gear-results-count">${matches.length} Global ${esc(type)} items · sorted by grade and item level</p><div class="gear-result-grid">${matches.map(item=>`<button type="button" class="gear-result grade-${gearGrade(item)} ${gearDraft?.href===item.href?'selected':''}" data-gear-result="${esc(item.href)}" aria-label="${esc(item.name)}, ${esc(item.grade||'unknown grade')}, item level ${item.itemLevel||'unknown'}"><span class="gear-result-icon">${gearIcon(item)}</span><span class="gear-result-grade">${esc(item.grade||'Unlisted')}</span><b>${esc(item.name)}</b><small>iLv ${item.itemLevel||'—'} · Req ${item.requiredLevel||'—'} · ${esc(gearFactionLabel(item))}</small><small class="gear-result-id">#${esc(gearItemId(item))}</small></button>`).join('')}</div>${matches.length?'':'<div class="gear-no-results">No matching item in this Global snapshot. Change a filter or enter the item manually in the preview.</div>'}`;
}
function gearStonesEditor(slot,item){
  const host=$('gear-editor'),family=gearStoneFamily(slot);
  const count=gearStoneSlots(slot,item),stones=Array.isArray(item.stones)?item.stones:[];
  if(family){
    const kinds=['Lesser','Intermediate','Superior','Lesser Abyssal','Intermediate Abyssal','Superior Abyssal'];
    const options=(value,values)=>values.map(option=>`<option value="${esc(option)}" ${value===option?'selected':''}>${esc(option)}</option>`).join('');
    const rows=Array.from({length:4},(_,i)=>{const stone=stones[i]||{};return `<div class="gear-stone-row" data-stone-row="${i}"><b>${i+1}</b><select name="stoneKind${i}" aria-label="${family} ${i+1} type"><option value="">Empty</option>${options(stone.kind,kinds)}</select><input name="stoneStat${i}" list="gear-stone-stat-list" value="${esc(stone.stat||'')}" placeholder="Rolled stat" aria-label="${family} ${i+1} rolled stat"><input name="stoneValue${i}" type="number" step="any" value="${stone.value??''}" placeholder="Value" aria-label="${family} ${i+1} stat value"><select name="stoneUnit${i}" aria-label="${family} ${i+1} unit"><option value="" ${stone.unit!=='%'?'selected':''}>flat</option><option value="%" ${stone.unit==='%'?'selected':''}>%</option></select></div>`}).join('');
    host.insertAdjacentHTML('beforeend',`<section class="gear-stones-editor"><div class="gear-stones-head"><div><b>${family} sockets</b><p>Record the stone and the stat that actually rolled. A socket can be empty.</p></div><label>Slots on item<input name="stoneSlots" type="number" min="0" max="4" value="${count}" aria-label="${family} socket count"></label></div><div class="gear-stone-rows">${rows}</div><datalist id="gear-stone-stat-list">${STONE_STATS.map(stat=>`<option value="${esc(stat)}">`).join('')}</datalist><small>Socket count comes from the item tooltip when available; adjust it if yours differs.</small></section>`);
    updateGearStoneRows();
  }
  if(['weapon','guard'].includes(slot.id)){
    const eligible=gearTheostoneEligible(slot,item),stone=THEOSTONES.find(entry=>entry.name===item.theostone);
    host.insertAdjacentHTML('beforeend',`<section class="gear-stones-editor gear-theostone-editor"><b>Theostone engraving</b>${eligible?`<p>One Theostone on this ${slot.name.toLowerCase()}. Search by name; suggestions show each effect. Record the one engraved in game.</p><input name="theostone" type="search" list="gear-theostone-list" value="${esc(item.theostone||'')}" placeholder="Search 51 Global Theostones" aria-label="Engraved Theostone"><datalist id="gear-theostone-list">${THEOSTONES.map(entry=>`<option value="${esc(entry.name)}" label="${esc(entry.grade)} · ${esc(entry.effect)}">`).join('')}</datalist><small>${stone?`${esc(stone.grade)} · ${esc(stone.effect)} effect`:'Epic and Unique weapons and guards have one slot. Identical effects do not stack.'}</small>`:`<p>This ${esc(item.grade||'item')} ${slot.name.toLowerCase()} has no Theostone slot in the Global item data. Epic and Unique weapons and guards have one.</p>`}</section>`);
  }
  const skills=host.querySelector('.gear-skill-fields');
  if(skills)host.querySelectorAll('.gear-stones-editor').forEach(section=>skills.before(section));
}
function updateGearStoneRows(){
  const count=clamp($('gear-editor').querySelector('[name="stoneSlots"]')?.value??0,0,4);
  $('gear-editor').querySelectorAll('[data-stone-row]').forEach(row=>{const active=Number(row.dataset.stoneRow)<count;row.hidden=!active;row.querySelectorAll('input,select').forEach(input=>input.disabled=!active)});
}
function gearEditor(){
  const item=gearDraft||{},type=gearAllowedType(gearSlot(gearSlotId)),skills=skillNames();
  const source=item.href?.startsWith('/')?`<a href="https://aion2data.com${esc(item.href)}" target="_blank" rel="noopener noreferrer">Open Global item data ↗</a>`:'<span>Manual entry</span>';
  const base=(item.baseStats?.length?item.baseStats:(item.fixedStats||[]).map(stat=>`${stat.name} ${stat.value}`)).slice(0,9).map(line=>`<span>${esc(line)}</span>`).join('');
  $('gear-editor').innerHTML=`<div class="gear-selected"><span class="gear-selected-icon">${gearIcon(item)}</span><div><b>${esc(item.name||'Choose an item or enter one below')}</b><small>${esc(item.grade||type)}${item.requiredLevel?` · Required Lv ${item.requiredLevel}`:''}</small>${source}</div></div>${base?`<div class="gear-base-stats"><b>Base tooltip</b><div>${base}</div></div>`:''}<div class="gear-fields"><label>Item name<input name="name" value="${esc(item.name||'')}" required placeholder="Choose from search or type a name"></label><div class="gear-field-row"><label>Enhancement +<input name="enhancement" type="number" min="0" max="30" value="${clamp(item.enhancement||0,0,30)}"></label><label>Required level<input name="requiredLevel" type="number" min="1" max="45" value="${item.requiredLevel||''}" placeholder="—"></label></div><label>Item level <small>From tooltip; separate from Combat Power</small><input name="itemLevel" type="number" min="0" value="${item.itemLevel||''}" placeholder="—"></label><label>Potential / Soul Binding stats <small>Write your actual rolls</small><textarea name="statNotes" rows="3" placeholder="e.g. Attack +15, Critical Hit +20">${esc(item.statNotes||'')}</textarea></label><div class="gear-skill-fields"><b>Rolled skill levels</b><p>Only add the +levels actually shown on this item. These update effective Mastery levels.</p>${[0,1,2].map(i=>{const bonus=item.skillBonuses?.[i]||{};return `<div class="gear-skill-row"><select name="skill${i}" aria-label="Skill bonus ${i+1}"><option value="">No skill</option>${skills.map(skill=>`<option value="${esc(skill)}" ${bonus.skill===skill?'selected':''}>${esc(skill)}</option>`).join('')}</select><input name="levels${i}" type="number" min="0" max="30" value="${bonus.levels||''}" placeholder="+" aria-label="Bonus levels ${i+1}"></div>`}).join('')}</div><label>Other equipment notes<textarea name="notes" rows="2" placeholder="Set piece, source, or future replacement">${esc(item.notes||'')}</textarea></label></div>`;
  gearStonesEditor(gearSlot(gearSlotId),item);
}
function openGearSlot(id){
  const slot=gearSlot(id);if(!slot)return;gearSlotId=id;gearQuery='';gearGradeFilter='all';gearLevelFilter='usable';gearFactionFilter='own';gearEditorDirty=false;gearDraft=JSON.parse(JSON.stringify(gearEquipment()[id]||{}));
  $('gear-dialog-title').textContent=`Choose ${slot.name}`;$('gear-query').value='';$('gear-grade-filter').value=gearGradeFilter;$('gear-level-filter').value=gearLevelFilter;$('gear-faction-filter').value=gearFactionFilter;gearResults();gearEditor();$('gear-dialog').showModal();$('gear-query').focus();
}
async function selectGearResult(href){
  const item=GEAR_CATALOG.items.find(x=>x.href===href&&x.type===gearAllowedType(gearSlot(gearSlotId)));if(!item)return;
  const prior=gearDraft||{},sameItem=prior.href===item.href;
  gearEditorDirty=false;gearDraft={...prior,name:item.name,icon:item.icon,href:item.href,type:item.type,grade:item.grade||'',faction:item.faction||'',fixedStats:item.fixedStats||[],baseStats:[],requiredLevel:item.requiredLevel||null,itemLevel:item.itemLevel||null,manastoneSlots:sameItem?prior.manastoneSlots:null,theostoneSlots:sameItem?prior.theostoneSlots:null,stones:sameItem?prior.stones:[],theostone:sameItem?prior.theostone:''};gearResults();gearEditor();
  try{
    const res=await fetch(`https://aion2data.com/tooltip${item.href}`);
    if(!res.ok)throw Error(`HTTP ${res.status}`);
    const tooltip=await res.json();
    if(gearDraft?.href!==item.href)return;
    const fields=(tooltip.groups||[]).flat().filter(x=>x.k==='p');
    const find=name=>fields.find(x=>x.t===name)?.v;
    const grade=(tooltip.kind||tooltip.sub||'').match(/\b(Common|Rare|Epic|Unique|Special)\b/i)?.[1];
    gearDraft.grade=grade?grade[0].toUpperCase()+grade.slice(1).toLowerCase():gearDraft.grade||'';
    gearDraft.requiredLevel=Number(find('Required level'))||null;
    gearDraft.itemLevel=Number(find('Item level'))||null;
    gearDraft.manastoneSlots=find('Manastone slots')!==undefined?clamp(find('Manastone slots'),0,4):null;
    gearDraft.theostoneSlots=find('Theostone slots')!==undefined?clamp(find('Theostone slots'),0,1):null;
    gearDraft.baseStats=fields.filter(x=>!['Item level','Required level','Class'].includes(x.t)).slice(0,12).map(x=>`${x.t} ${x.v}`);
    if(!gearEditorDirty)gearEditor();
  }catch(_){$('gear-editor').insertAdjacentHTML('afterbegin','<p class="gear-fetch-note">Live tooltip unavailable. The item and icon are saved from the Global catalog; enter its level and your rolls manually.</p>')}
}
function initGear(){
  $('gear').addEventListener('click',e=>{const slot=e.target.closest('[data-gear-slot]');if(slot)openGearSlot(slot.dataset.gearSlot)});
  document.querySelector('.gear-view-switch').addEventListener('click',e=>{const button=e.target.closest('[data-gear-view]');if(!button)return;state.gearView=button.dataset.gearView;save();renderGear()});
  $('gear-dialog-close').addEventListener('click',()=>$('gear-dialog').close());
  $('gear-query').addEventListener('input',e=>{gearQuery=e.target.value;gearResults()});
  $('gear-grade-filter').addEventListener('change',e=>{gearGradeFilter=e.target.value;gearResults()});
  $('gear-level-filter').addEventListener('change',e=>{gearLevelFilter=e.target.value;gearResults()});
  $('gear-faction-filter').addEventListener('change',e=>{gearFactionFilter=e.target.value;gearResults()});
  $('gear-cp-input').addEventListener('change',e=>{const a=account(),value=clamp(e.target.value,0,1000000000);if(profile().kind==='healer')a.gearCombatPower=value;else a.goalObserved=value;render()});
  $('gear-cp-target').addEventListener('change',e=>{const a=account(),value=clamp(e.target.value,0,1000000000);if(profile().kind==='healer')a.gearCpTarget=value;else a.goalTarget=value;render()});
  $('gear-results').addEventListener('click',e=>{const result=e.target.closest('[data-gear-result]');if(result)selectGearResult(result.dataset.gearResult)});
  $('gear-editor').addEventListener('input',e=>{gearEditorDirty=true;if(e.target.name==='stoneSlots')updateGearStoneRows();if(e.target.name==='theostone'){const stone=THEOSTONES.find(entry=>entry.name.toLowerCase()===e.target.value.trim().toLowerCase()),hint=$('gear-editor').querySelector('.gear-theostone-editor small');if(hint)hint.textContent=stone?`${stone.grade} · ${stone.effect} effect`:'Choose a Global Theostone or enter its exact in-game name.'}});
  $('gear-editor').addEventListener('change',()=>{gearEditorDirty=true});
  $('gear-remove').addEventListener('click',()=>{delete gearEquipment()[gearSlotId];$('gear-dialog').close();render()});
  $('gear-form').addEventListener('submit',e=>{
    e.preventDefault();const values=new FormData(e.currentTarget),name=String(values.get('name')||'').trim();if(!name)return;
    const slot=gearSlot(gearSlotId),socketCount=gearStoneFamily(slot)?clamp(values.get('stoneSlots'),0,4):0;
    const stones=Array.from({length:socketCount},(_,i)=>({kind:String(values.get(`stoneKind${i}`)||''),stat:String(values.get(`stoneStat${i}`)||'').trim().slice(0,80),value:values.get(`stoneValue${i}`)===''?null:clamp(values.get(`stoneValue${i}`),-1000000,1000000),unit:values.get(`stoneUnit${i}`)==='%'?'%':''}));
    const theostone=gearTheostoneEligible(slot,gearDraft)?String(values.get('theostone')||'').trim().slice(0,100):'';
    gearDraft={...(gearDraft||{}),name,type:gearAllowedType(slot),enhancement:clamp(values.get('enhancement'),0,30),requiredLevel:values.get('requiredLevel')?clamp(values.get('requiredLevel'),1,45):null,itemLevel:values.get('itemLevel')?clamp(values.get('itemLevel'),0,999):null,manastoneSlots:gearStoneFamily(slot)?socketCount:null,stones,theostone,statNotes:String(values.get('statNotes')||''),notes:String(values.get('notes')||''),skillBonuses:[0,1,2].map(i=>({skill:String(values.get(`skill${i}`)||''),levels:clamp(values.get(`levels${i}`),0,30)})).filter(x=>x.skill&&x.levels)};
    gearEquipment()[gearSlotId]=gearDraft;$('gear-dialog').close();render();
  });
}
