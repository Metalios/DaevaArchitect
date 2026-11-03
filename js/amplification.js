// AION 2 Global (2026-10-28): Amplification is a separate 0–5-star
// upgrade after +15 normal enhancement. A catalog item's level and crafting
// family usually determine its cap; a user-editable override covers exceptions.
// Verified per-item caps always take precedence over inferred bands.
const GEAR_AMP_MAX=5;
const GEAR_AMP_EXACT_CAP={'110230036':3}; // Aulamus Longsword, Global iLv70
const GEAR_AMP_ARMOR=new Set(['helm','pauldrons','top','legs','gloves','shoes','cloak']);
const GEAR_AMP_STAT_NAMES=new Set(['Attack','Min Attack','Max Attack','Defense','HP','MP','Damage Boost','Damage Tolerance','HP Increase','PvE Damage Boost','PvP Damage Boost']);
function gearAmplificationInferredCap(slot,item){
  if(!slot||!item||slot.area==='arcana'||slot.area==='wings'||item.grade!=='Unique')return 0;
  const exact=GEAR_AMP_EXACT_CAP[gearItemId(item)];if(exact!==undefined)return exact;
  const level=Number(item.itemLevel);
  if(!Number.isFinite(level)||level<54)return 0;
  // Global Oct 28 improved Dragon Lord craft caps, including iLv78 -> five.
  if(/\\b(?:True|Star|White|Dark|Wise|Ebony) Dragon Lord\\b/i.test(item.name||''))
    return level>=78?5:level>=62?3:1;
  return level>=86?5:level>=70?3:1;
}
function gearAmplificationCap(slot,item){
  const inferred=gearAmplificationInferredCap(slot,item);
  if(!item||!slot||item.grade!=='Unique'||slot.area==='arcana'||slot.area==='wings')return 0;
  if(GEAR_AMP_EXACT_CAP[gearItemId(item)]!==undefined)return inferred;
  return Number.isInteger(item.amplificationCap)&&item.amplificationCap>=0&&item.amplificationCap<=5?item.amplificationCap:inferred;
}
function gearAmplificationLevel(slot,item){
  return Number(item?.enhancement)>=15?clamp(item?.amplification||0,0,gearAmplificationCap(slot,item)):0;
}
function gearAmplificationVerifiedStats(slot,item,rank){
  if(!rank||!item)return [];
  const name=item.name||'',level=Number(item.itemLevel);
  const flat=(stat,value)=>({stat,value,unit:''}),pct=(stat,value)=>({stat,value,unit:'%'});
  // These families use observed Global client rank tables. Other items
  // require their own bonus lines rather than borrowing a different curve.
  if(slot.id==='weapon'&&level===70&&/^Aulamus /i.test(name))
    return [flat('Attack',10*rank),pct('Damage Boost',rank)];
  if(slot.id==='weapon'&&level===86&&/^Enraged Kromede /i.test(name))
    return [flat('Attack',[0,12,24,36,48,61][rank]),pct('Damage Boost',rank)];
  if(level===70&&['ring1','ring2','necklace'].includes(slot.id)&&/^Aulamus (Ring|Necklace)$/i.test(name))
    return [flat('Attack',rank*5),flat('Defense',rank*10),pct('Damage Boost',rank*.5)];
  if(level===70&&slot.id==='top'&&name==='Vakron Breastplate')
    return [flat('Defense',[0,20,40,61][rank]),flat('HP',[0,20,40,61][rank]),pct('Damage Tolerance',rank*.5),pct('HP Increase',rank*.5)];
  if(level===86&&GEAR_AMP_ARMOR.has(slot.id)&&/^Nuakum /i.test(name))
    return [flat('Defense',rank*25),flat('HP',rank*25),pct('Damage Tolerance',rank*.5),pct('HP Increase',rank*.5)];
  return [];
}
function gearParseAmplificationBonuses(lines){
  const stats=[],seen=new Set();
  for(const line of String(lines||'').split(/\\r?\\n/).slice(0,8)){
    const found=line.trim().match(/^([A-Za-z][A-Za-z -]{1,49}?)\\s*:?\\s*\\+?(\\d+(?:\\.\\d+)?)\\s*(%)?$/);
    if(!found)continue;
    const stat=found[1].trim(),value=Number(found[2]),unit=found[3]||'';
    if(!GEAR_AMP_STAT_NAMES.has(stat)||seen.has(stat)||!Number.isFinite(value)||value>1000000)continue;
    seen.add(stat);stats.push({stat,value,unit});
  }
  return stats;
}
function gearAmplificationStats(slot,item){
  const rank=gearAmplificationLevel(slot,item);if(!rank)return [];
  const stored=item?.amplificationBonuses?.[rank];
  if(Array.isArray(stored)&&stored.length)
    return stored.filter(b=>GEAR_AMP_STAT_NAMES.has(b?.stat)&&Number.isFinite(Number(b.value))&&['','%'].includes(b.unit)).slice(0,8);
  return gearAmplificationVerifiedStats(slot,item,rank);
}
function gearAmplificationDiamonds(slot,item){
  const cap=gearAmplificationCap(slot,item),rank=gearAmplificationLevel(slot,item);
  if(!cap||Number(item?.enhancement)<15)return '';
  return `<span class="gear-amp-diamonds" aria-label="Amplification ${rank} of ${cap}">${Array.from({length:cap},(_,i)=>`<span class="${i<rank?'filled':'empty'}" aria-hidden="true">◆</span>`).join('')}</span>`;
}
function gearAmplificationTotals(){
  const map=new Map();let levels=0,pieces=0,missing=0;
  for(const slot of GEAR_SLOTS){
    const item=gearEquipment()[slot.id];if(!gearIsActive(slot,item))continue;
    const rank=gearAmplificationLevel(slot,item);if(!rank)continue;
    levels+=rank;pieces++;
    const stats=gearAmplificationStats(slot,item);if(!stats.length)missing++;
    for(const bonus of stats){
      const key=`${bonus.stat}|${bonus.unit||''}`;map.set(key,(map.get(key)||0)+Number(bonus.value));
    }
  }
  return {levels,pieces,missing,gearRating:levels*5,stats:[...map].map(([key,value])=>{
    const [stat,unit]=key.split('|');return {stat,unit,value};
  }).sort((a,b)=>a.stat.localeCompare(b.stat))};
}
function gearAmplificationEditor(slot,item){
  if(slot.area==='arcana'||slot.area==='wings')return '';
  const cap=gearAmplificationCap(slot,item),rank=gearAmplificationLevel(slot,item),at15=Number(item.enhancement)>=15;
  const exact=GEAR_AMP_EXACT_CAP[gearItemId(item)]!==undefined,active=at15&&cap>0;
  const stats=gearAmplificationStats(slot,item);
  const lines=stats.map(b=>`${b.stat} ${b.value}${b.unit||''}`).join('\\n');
  const options=Array.from({length:6},(_,n)=>`<option value="${n}" ${n===cap?'selected':''}>${n}</option>`).join('');
  return `<section class="gear-amplification-editor" data-rank="${rank}">
    <b>Amplified Enhancement</b>
    <p>Stars are separate from normal +15 enhancement; each adds 5 gear-rating levels.</p>
    <div class="gear-amplification-controls">
      <label>Item maximum (0–5)<select name="amplificationCap" ${exact?'disabled':''} aria-label="Item Amplification cap">${options}</select></label>
      <label>Stars earned<input name="amplification" type="number" min="0" max="${cap}" step="1" value="${rank}" ${active?'':'disabled'} aria-label="Amplification stars earned"></label>
    </div>
    <div class="gear-amp-editor-stars">${gearAmplificationDiamonds(slot,item)||'<span>No active stars</span>'}</div>
    <small>${item.grade!=='Unique'?'Only eligible Unique gear supports Amplification.':!at15?'Normal enhancement must reach +15 first.':exact?'Verified Global item cap.':'Cap inferred from the item tier; correct it if this piece has a different in-game cap.'}</small>
    <label>Actual Amplification stat totals at this stage
      <textarea name="amplificationBonusLines" rows="3" ${active?'':'disabled'} placeholder="Attack 30&#10;Damage Boost 3%">${esc(lines)}</textarea>
    </label>
    <small>${stats.length?'Shown bonuses are cumulative at the selected rank.':'Enter the exact bonuses from your in-game Amplify panel if this item has no verified stat curve.'} One stat per line (e.g. Attack 20, Damage Boost 2%).</small>
  </section>`;
}
function gearStashAmplification(section){
  if(!section||!gearDraft)return;
  const rank=Number(section.dataset.rank);if(!rank)return;
  const parsed=gearParseAmplificationBonuses(section.querySelector('[name="amplificationBonusLines"]')?.value);
  const verified=gearAmplificationVerifiedStats(gearSlot(gearSlotId),gearDraft,rank);
  gearDraft.amplificationBonuses ||= {};
  if(parsed.length&&JSON.stringify(parsed)!==JSON.stringify(verified))gearDraft.amplificationBonuses[rank]=parsed;
  else delete gearDraft.amplificationBonuses[rank];
}
function gearRefreshAmplificationEditor(){
  const section=$('gear-editor').querySelector('.gear-amplification-editor');if(!section)return;
  gearStashAmplification(section);
  const enhancement=Number($('gear-editor').querySelector('[name="enhancement"]').value)||0;
  const capSelect=section.querySelector('[name="amplificationCap"]');
  const item={...gearDraft,enhancement,amplification:Number(section.querySelector('[name="amplification"]')?.value)||0};
  if(capSelect&&!capSelect.disabled)item.amplificationCap=Number(capSelect.value);
  section.outerHTML=gearAmplificationEditor(gearSlot(gearSlotId),item);
}
