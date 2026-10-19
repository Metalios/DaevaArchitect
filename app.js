const $ = id => document.getElementById(id);
const CLASS_ORDER = ['templar','gladiator','assassin','ranger','sorcerer','spiritmaster','cleric','chanter'];
const BOARD_NAMES = ['Nezekan','Zikel','Vaizel','Triniel'];
const FRESH_45 = {mastery:203,stigma:29,crystals:136};
const TEMPLAR_STAGES = [
  ['Vicious Strike',10],['Pummel',10],
  ['Judgment',8],['Punishment',8],['Warding Strike',8],['Annihilate',8],
  ['Fury',10],['Punishing Benediction',10],['Insulting Roar',10],['Enhance Health',8],
  ['Shield Smite',8],['Poach',8],['Defiance',8],['Debilitating Smash',8],
  ['Judgment',10],['Punishment',10],['Warding Strike',10],['Annihilate',10],['Shield Smite',10],['Impact Hit',10],['Ironclad Defense',3],
  ['Enhance Health',10],['Ironclad Defense',10],['Shield Rush',8],
  ['Block Pain',8],['Warding Shield',8],['Guarding Seal',8],['Survival Willpower',8],['Flash Rampage',8],
  ['Poach',10],['Defiance',10],['Debilitating Smash',10],['Shield Rush',10],['Block Pain',10],['Warding Shield',10],['Guarding Seal',10],['Survival Willpower',10],['Flash Rampage',10]
];
const DEFAULT_ACCOUNT = (cls='templar') => ({...FRESH_45,context:'party',gear:{},currentRanks:{},titlesOwned:{},faction:'elyos',macroBind:'RMB',goalTarget:['cleric','chanter'].includes(cls)?0:cls==='templar'?60000:100000,goalObserved:0});
let saved = {};
try { saved = JSON.parse(localStorage.getItem('aion2-pathfinder-all-v3') || '{}') || {}; } catch (_) {}
let state = {class:CLASS_ORDER.includes(saved.class)?saved.class:null,accounts:saved.accounts||{},tab:'overview',board:'Nezekan',preview:FRESH_45.crystals,node:null};
function account(){ if(!state.accounts[state.class]) state.accounts[state.class]=DEFAULT_ACCOUNT(state.class); return state.accounts[state.class]; }
function data(){return DATA[state.class]}
function profile(){return PROFILES[state.class]}
function esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function clamp(v,min,max){v=Number(v);return Number.isFinite(v)?Math.max(min,Math.min(max,Math.floor(v))):min}
function save(){try{localStorage.setItem('aion2-pathfinder-all-v3',JSON.stringify({class:state.class,accounts:state.accounts}))}catch(_){}}
function skillNames(){return Object.values(data().skills).map(s=>s.name)}
function nodeMap(){return new Map(data().boards.flatMap(b=>b.nodes.map(n=>[n[0],{board:b.name,node:n}]))) }
function masteryCost(rank){return rank<=4?1:rank<=7?2:4}
function masteryTotal(rank){let points=0;for(let n=2;n<=rank;n++)points+=masteryCost(n);return points}
function stigmaCost(rank){return rank<=5?1:rank<=10?2:rank<=15?4:8}
function masteryStages(){
  if(state.class==='templar') return TEMPLAR_STAGES;
  const names=skillNames(); const weights=data().skillWeights;
  const order=names.map((name,i)=>({name,i,weight:weights[name]||0})).sort((a,b)=>b.weight-a.weight||a.i-b.i).map(x=>x.name);
  const first=order.slice(0,8), second=order.slice(8,16), third=order.slice(16);
  return [...first.map(n=>[n,8]),...first.map(n=>[n,10]),...second.map(n=>[n,8]),...second.map(n=>[n,10]),...third.map(n=>[n,8]),...third.map(n=>[n,10])];
}
function stigmaStages(){const s=profile().stigmas;return [5,10,15,20].flatMap(rank=>s.map(name=>[name,rank]))}
function allocate(stages,budget,costFn,names,base){
  const levels=Object.fromEntries(names.map(n=>[n,base]));let spent=0,next=null;
  for(const [name,target] of stages){if(!(name in levels))continue;while(levels[name]<target){const cost=costFn(levels[name]+1);if(spent+cost>budget){next={name,rank:levels[name]+1,cost,need:spent+cost-budget};return {levels,spent,next}}levels[name]++;spent+=cost}}
  return {levels,spent,next};
}
function boardPlan(budget){
  const nodes=nodeMap(), owned=new Set(),perBoard=Object.fromEntries(BOARD_NAMES.map(n=>[n,0]));let spent=0,next=null;
  for(const item of data().route){const n=nodes.get(item.id).node;if(spent+n[5]>budget){next={...item,cost:n[5],need:spent+n[5]-budget};break}spent+=n[5];owned.add(item.id);perBoard[item.board]+=n[5]}
  return {spent,owned,perBoard,next};
}
function effects(owned){const skills={},stats={},nodes=nodeMap();for(const id of owned){const n=nodes.get(id).node;for(const [key,v] of n[6]){if(typeof key==='number'){const name=data().skills[key]?.name||String(key);skills[name]=(skills[name]||0)+v}else stats[key]=(stats[key]||0)+v}}return {skills,stats}}
function effectText(n){if(!n||!n[6]?.length)return 'Start node';return n[6].map(([key,v])=>{if(typeof key==='number')return `${data().skills[key]?.name||key} +${v} level`;const meta=data().stats[key];return `${meta?.name||key} +${v/(meta?.div||1)}${meta?.pct?'%':''}`}).join(' · ')}
function nodeShort(n){if(n[5]===0||n[5]===4)return '✦';if(typeof n[6]?.[0]?.[0]==='number')return n[5]===2?'P':'S';return ({FixingDamage:'ATK',Critical:'CR',Defense:'DEF',HPMax:'HP',MPMax:'MP',HealBoost:'HEAL'})[n[6]?.[0]?.[0]]||'·'}
function model(){const a=account(),mastery=allocate(masteryStages(),a.mastery,masteryCost,skillNames(),1),stigma=allocate(stigmaStages(),a.stigma,stigmaCost,profile().stigmas,0),boards=boardPlan(a.crystals);return {mastery,stigma,boards,effects:effects(boards.owned)}}
function effective(name,m){return Math.min(40,(m.mastery.levels[name]||1)+(m.effects.skills[name]||0)+(account().gear[name]||0))}
function render(){
  const selected=CLASS_ORDER.includes(state.class);
  $('class-buttons').innerHTML=CLASS_ORDER.map(c=>`<button type="button" data-class="${c}" class="${state.class===c?'active':''}" aria-pressed="${state.class===c}"><span>${PROFILES[c].name}</span><small>${PROFILES[c].role}</small></button>`).join('');
  $('welcome-panel').hidden=selected;$('planner-content').hidden=!selected;
  $('class-role').textContent=selected?profile().role:'Select a class';
  if(!selected){$('hero-description').textContent='Choose a class to plan Mastery, Stigmas, Daevanion boards, titles, specialties and rotation from a fresh Global level 45.';save();return}
  const a=account(),m=model(),p=profile();
  $('hero-description').textContent=p.summary+' Change your point totals to see what to buy now and next.';
  $('class-role').textContent=p.role;$('overview-role').textContent=p.role;
  $('mastery-input').value=a.mastery;$('stigma-input').value=a.stigma;$('crystal-input').value=a.crystals;
  $('fresh-45-button').classList.toggle('active',Object.entries(FRESH_45).every(([key,value])=>a[key]===value));
  for(const [id,ctx] of [['party-button','party'],['solo-button','solo']]){$(id).classList.toggle('active',a.context===ctx);$(id).setAttribute('aria-pressed',a.context===ctx)}
  document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===state.tab);b.setAttribute('aria-current',b.dataset.tab===state.tab?'page':'false')});
  document.querySelectorAll('.tab-panel').forEach(el=>el.classList.toggle('active',el.id===state.tab));
  renderOverview(m);renderMastery(m);renderStigma(m);renderRotation(m);renderBoards(m);renderTitles();renderSources();save();
}
function renderOverview(m){
  const a=account(),p=profile(),ordered=masteryStages().map(x=>x[0]).filter((v,i,s)=>s.indexOf(v)===i),top=ordered.slice(0,4);
  $('overview-title').textContent=`${p.name}: recommended path`;$('overview-subtitle').textContent=p.summary;
  const kpis=[['Top target',top[0]?`Lv ${effective(top[0],m)}`:'—',top[0]||''],['Board crystals',`${m.boards.spent} / ${a.crystals}`,`${m.boards.perBoard.Nezekan} Nezekan · ${m.boards.perBoard.Zikel} Zikel`],['Stigma bar',`${m.stigma.spent} / ${a.stigma}`,'Four class-specific slots'],['Ready points',`${a.mastery-m.mastery.spent} · ${a.stigma-m.stigma.spent} · ${a.crystals-m.boards.spent}`,'Unspent in recommended plan']];
  $('kpis').innerHTML=kpis.map(([label,value,detail])=>`<div class="kpi"><div class="k-label">${esc(label)}</div><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`).join('');
  const mode=p.kind==='healer'?'healing':'damage';
  const steps=[`<b>Mastery:</b> ${top.map(n=>`${esc(n)} Lv ${m.mastery.levels[n]||1}`).join(' · ')}. Open the Mastery tab for every rank and specialty.`,
    `<b>Stigmas:</b> ${p.stigmas.map(n=>`${esc(n)} Lv ${m.stigma.levels[n]||0}`).join(' · ')}. ${esc(p.swap)}`,
    `<b>Boards:</b> ${BOARD_NAMES.map(n=>`${n} ${m.boards.perBoard[n]}`).join(' · ')}. The grid gives the connected click order at ${a.crystals} crystals.`,
    `<b>${mode==='healing'?'Healing':'Fight'} priority:</b> ${esc(p.rule)}`];
  if(a.context==='solo')steps.push(`<b>Solo adjustment:</b> Keep recovery and defensives available. Use the damage loop only when safe; the board route is the same PvE path.`);
  $('now-steps').innerHTML=steps.map((v,i)=>`<li><span class="step-num">${i+1}</span><span>${v}</span></li>`).join('');
  const next=[];if(m.mastery.next)next.push([`+${m.mastery.next.need} mastery`,`${m.mastery.next.name} rank ${m.mastery.next.rank}`]);if(m.stigma.next)next.push([`+${m.stigma.next.need} stigma`,`${m.stigma.next.name} rank ${m.stigma.next.rank}`]);if(m.boards.next)next.push([`+${m.boards.next.need} crystals`,`${m.boards.next.board}: ${effectText(nodeMap().get(m.boards.next.id).node)}`]);
  const needs=top.map(n=>({name:n,level:effective(n,m)})).find(x=>x.level<16);if(needs)next.push(['Lv 16 specialty',`${needs.name}: ${16-needs.level} more effective levels from mastery, board or gear`]);
  $('next-unlocks').innerHTML=next.length?next.map(([label,detail])=>`<div class="next-unlock"><strong>${esc(label)}</strong><span>${esc(detail)}</span></div>`).join(''):'<p>All planned ranks and nodes are funded.</p>';
  renderGoal();
}
function renderGoal(){
  const a=account(),heal=profile().kind==='healer',tank=state.class==='templar';
  $('goal-title').textContent=heal?'Effective healing & survival':tank?'Tank Combat Power goal':'Damage Combat Power goal';
  $('goal-explainer').textContent=heal?'Enter an effective HPS target for your group if you have one. Record healing actually needed, and judge it with deaths and missed mechanics.':`The ${tank?'60k tank':'100k damage'} starting goal is editable. Enter the Combat Power shown in game to track progress. Gear and other systems affect it; point totals alone cannot predict the score.`;
  $('target-label').textContent=heal?'Target effective HPS':'Target Combat Power';$('observed-label').textContent=heal?'Measured effective HPS':'Current Combat Power';
  $('goal-target').value=a.goalTarget||'';$('goal-observed').value=a.goalObserved||'';
  const target=Number(a.goalTarget)||0,observed=Number(a.goalObserved)||0;
  if(!target){$('goal-status').innerHTML=heal?'Set a target when your group has a useful effective HPS benchmark. Prioritize timely heals and survival now.':'Set a Combat Power target to track progress.';return}
  if(!observed){$('goal-status').innerHTML=`Target: <b>${target.toLocaleString()}</b> ${heal?'effective HPS':'Combat Power'} · add your current in-game value to see the gap.`;return}
  const percent=Math.min(100,Math.round(observed/target*100)),gap=Math.max(0,target-observed);
  $('goal-status').innerHTML=`<b>${percent}% of target</b> · ${gap?`${gap.toLocaleString()} to go`:'target reached'}<div class="progress"><span style="width:${percent}%"></span></div>`;
}
function specPicks(name,eff){const spec=SPECS[state.class]?.[name];if(!spec)return [];let key=eff>=20?'20':eff>=16?'16':eff>=12?'12':eff>=8?'8':null;if(!key)return [];let picks=spec.picks[key]||[];if(state.class==='templar'&&account().context==='party'&&name==='Judgment'){picks=eff>=20?[3,4,5]:eff>=16?[4,5]:eff>=12?[3,4]:[3]}return picks}
function renderMastery(m){
  const a=account(),order=masteryStages().map(x=>x[0]).filter((v,i,s)=>s.indexOf(v)===i);$('mastery-spent').textContent=`${m.mastery.spent} / ${a.mastery} planned`;
  $('skill-grid').innerHTML=order.map((name,i)=>{
    const base=m.mastery.levels[name]||1,board=m.effects.skills[name]||0,gear=a.gear[name]||0,bonus=board+gear,eff=effective(name,m),current=a.currentRanks?.[name],currentLevel=current?Math.min(40,current+bonus):null,spec=SPECS[state.class]?.[name],picks=specPicks(name,eff);
    const chips=spec?`<div class="specs"><div class="specs-title">${eff<8?'First specialty at Lv 8':`Equip now · ${picks.length} choice${picks.length===1?'':'s'}`}</div><div class="spec-row">${Object.entries(spec.options).map(([num,label])=>{const required=+num<=3?8:+num===4?12:16;return `<span class="spec ${picks.includes(+num)?'on':eff<required?'future':''}" title="Option ${num} · level ${required}">#${num} ${esc(label)}${eff<required?` · Lv ${required}`:''}</span>`}).join('')}</div></div>`:'';
    return `<article class="skill-card ${i<4?'highlight':''}"><div class="skill-head"><div><h3>${esc(name)}</h3><div class="sub">Priority ${i+1}${spec?' · specialty choices':''}</div></div><div class="lv"><strong>Target Rank ${base}</strong><small>Target in-game Lv ${eff}</small></div></div><div class="build-parts"><span>${masteryTotal(base)} Mastery to reach target</span><span>Board +${board}</span><span>Other +${gear}</span></div><div class="baseline-level"><b>In-game green bonus: (+${bonus})</b><span> ${board} board + ${gear} other</span>${currentLevel?`<div>On this board route: current rank ${current} → Lv ${currentLevel}; target rank ${base} → Lv ${eff}.</div>`:''}</div>${chips}<label class="gear-row">Other bonus levels (gear / Arcana) <input type="number" data-gear="${esc(name)}" min="0" max="30" value="${gear}" aria-label="Other bonus levels for ${esc(name)}"></label><label class="gear-row">Your current Mastery rank (optional) <input type="number" data-current-rank="${esc(name)}" min="1" max="10" placeholder="—" value="${current||''}" aria-label="Current Mastery rank for ${esc(name)}"></label></article>`
  }).join('');
}
function renderStigma(m){
  const p=profile(),a=account();$('stigma-spent').textContent=`${m.stigma.spent} / ${a.stigma} spent`;$('loadout-title').textContent=`${p.name} ${p.kind==='healer'?'support':'PvE'} bar`;$('loadout-text').textContent=p.swap;
  $('loadout-tags').innerHTML=p.stigmas.map(n=>`<span class="tag ${m.stigma.levels[n]>=5?'green':''}">${esc(n)} · Lv ${m.stigma.levels[n]||0}</span>`).join('');
  $('stigma-grid').innerHTML=p.stigmas.map(name=>{const info=STIGMAS[state.class]?.[name],lv=m.stigma.levels[name]||0,perks=info?.perks||{};
    return `<article class="stigma-card"><div class="stigma-head"><div><h3>${esc(name)}</h3><div class="sub">Equipped · ${esc(info?.base||'Class stigma')}</div></div><div class="lv">Lv ${lv}</div></div><div class="spec-row">${Object.entries(perks).map(([rank,label])=>`<span class="spec ${lv>=+rank?'on':'future'}">Lv ${rank}: ${esc(label)}</span>`).join('')}</div><div class="milestone">${lv<20?`Next perk at Lv ${[5,10,15,20].find(x=>x>lv)}`:'All four perks unlocked'}</div></article>`}).join('');
}
function numbered(items){return items.map((v,i)=>`<li><span class="rotation-num">${String(i+1).padStart(2,'0')}</span><span>${esc(v)}</span></li>`).join('')}
function renderRotation(m){
  const p=profile(),a=account(),main=masteryStages()[0][0],macroKey=['RMB','Mouse 4','MMB','M'].includes(a.macroBind)?a.macroBind:'RMB',weaveKey=p.weaveKey||'LMB';$('rotation-level').textContent=`${main} Lv ${effective(main,m)}`;$('rotation-rule-title').textContent=p.rule;$('rotation-rule-text').textContent=p.summary;
  const fusionCharged=state.class==='spiritmaster'&&specPicks('Elemental Fusion',effective('Elemental Fusion',m)).includes(4);
  const stacks=fusionCharged?p.stacks.filter(s=>s.key!=='E'):p.stacks;
  const macroSteps=fusionCharged?p.macro.filter(key=>key!=='E'):p.macro;
  const hotbar=p.hotbar.map(([skills,cue,tone])=>[skills,cue,tone]);
  if(fusionCharged)hotbar[6]=[['Elemental Fusion'],'Fully charge when Four Elements is ready','attack'];
  $('rotation-gate').textContent=state.class==='templar'?`Judgment is effective Lv ${effective('Judgment',m)}. ${effective('Judgment',m)>=16?'With its cooldown-removal Specialty selected, the E stack can spend repeated casts during one proc.':'Before its Lv 16 cooldown-removal Specialty, expect one Judgment cast per available proc and space manual Doom Shield around its cooldown.'} The macro spends Judgment first within E. The timing caution applies to extra manual Punishment or shield-trigger casts, which can interrupt or overlap that proc.`:p.kind==='healer'?'Heals, toggles and emergency buttons remain manual. Use the macro only while the group is stable.':`Current first priority: ${main} effective Lv ${effective(main,m)}. Keep charged and movement skills on their own keys.`;
  $('rotation-opener-title').textContent=a.context==='party'?'Group opener':'Solo opener';$('rotation-opener').innerHTML=numbered(p.opener);$('rotation-loop').innerHTML=numbered(p.loop);
  $('macro-bind').value=macroKey;$('weave-basic-key').textContent=weaveKey;$('weave-macro-key').textContent=macroKey;
  $('weave-guide').textContent=`Hold ${weaveKey} (${p.weave}) with ${macroKey} (the in-game Macro bind) as your default safe-damage state. Press manual keys over the held loop; they take priority.`;
  $('rhythm-base-keys').textContent=`${weaveKey} + ${macroKey}`;
  $('rhythm-base-note').textContent=`Keep ${p.weave} held while Macro attempts ${macroSteps.join(' and ')}. Maintain this through safe damage uptime.`;
  $('rhythm-weave-note').textContent=state.class==='templar'?'E handles Judgment and Pummel automatically. Time Punishment, Doom Shield and Shield of Protection by hand between Judgment windows or for boss mechanics.':p.kind==='healer'?'Press the needed 1–8 heal or support key; manual input wins. Shift fully to healing when the group is in danger.':'Press or hold a 1–8 skill at its cue. During safe uptime, keep the base held; manual input wins over the macro.';
  $('rhythm-pause-note').textContent=p.kind==='healer'?`Release ${macroKey} and ${weaveKey} for healing triage or mechanics. Restart both when damage is safe.`:`Release ${macroKey} to stop Macro; release ${weaveKey} too when all attacks must stop. Pause Macro if a charge gets clipped.`;
  $('hotbar-grid').innerHTML=hotbar.map(([skills,cue,tone],i)=>`<article class="hotbar-card tone-${esc(tone)}"><div class="hotbar-top"><span class="hotbar-number">${i+1}</span><small>${esc(tone)}</small></div><div class="hotbar-skills">${skills.length?skills.map(name=>`<strong>${esc(name)}</strong>`).join(''):'<strong>Flex slot</strong>'}</div><p>${esc(cue)}</p></article>`).join('');
  $('hotbar-note').textContent=`Defiance shares Space with jump/glide by default for every class; it does not consume a number-bar slot. Optional: turn on Separate Defiance Hotkey and give it a dedicated nearby key to avoid accidental glides. ${fusionCharged?'Elemental Fusion has a charge specialty at this level, so put it on 7 and remove it from macro E. Keep Wind Spirit on a secondary row.':p.hotbarNote}`;
  const stackHtml=stacks.map(s=>`<div class="macro-stack"><div class="stack-heading"><span class="keycap">${esc(s.key)}</span><div><strong>${esc(s.title)}</strong><small>${s.manual?'Manual key':'Macro hotbar key'}</small></div></div>${s.skills.map((name,i)=>`<div class="stack-row"><b>Row ${i}</b><span>${esc(name)}</span></div>`).join('')}</div>`).join('');
  const script=`<div class="macro-stack macro-script"><div class="stack-heading"><span class="keycap">${esc(macroKey)}</span><div><strong>In-game Macro steps</strong><small>Bind Macro to ${esc(macroKey)}</small></div></div>${macroSteps.map((key,i)=>`<div class="stack-row"><b>Step ${i+1}</b><span>${esc(key)} · 10 ms</span></div>`).join('')}<div class="stack-row"><b>Hold</b><span>${esc(fusionCharged?'Hold Cold Shock with the Macro key; charge Elemental Fusion on 7 by hand.':p.hold)}</span></div></div>`;
  $('macro-stacks').innerHTML=stackHtml+script;
  $('setup-list').innerHTML=[`Settings (O) → Key Settings → General → Macro: bind ${macroKey}; it is unbound by default. In AION 1 control mode, use a keyboard key instead of a mouse button.`,`Put ${p.weave} on ${weaveKey}. Set manual powers on 1–8 as shown. Defiance is on Space by default, shared with jump/glide; a separate Defiance key is optional.`,`Skills (K): make the labeled stacks. Then add only the listed hotbar keys to Macro, in order, starting each step at 10 ms.`,`Hold ${weaveKey} and ${macroKey} through safe damage, pressing or holding 1–8 at their cues. Manual input takes priority. Release ${macroKey} to stop Macro, and ${weaveKey} too when all attacks must stop.`].map(x=>`<li>${esc(x)}</li>`).join('');
  $('manual-keys').innerHTML=p.manual.map(v=>`<div class="manual-key"><b>${esc(v.split(' — ')[0])}</b><small>${esc(v.split(' — ')[1]||'Manual timing')}</small></div>`).join('');
}
function renderBoards(m){
  const a=account(),nodes=nodeMap();$('board-spent').textContent=`${m.boards.spent} / ${a.crystals} spent`;
  const wanted=profile().kind==='healer'?[['Defense','Defense'],['HPMax','Max HP'],['CombatSpeed','Combat Speed'],['CoolTimeDecrease','Cooldown Reduction']]:[['AmplifyAllDamage','Damage Boost'],['DecreaseDamage','Damage Tolerance'],['CombatSpeed','Combat Speed'],['CoolTimeDecrease','Cooldown Reduction']];
  $('board-summary').innerHTML=wanted.map(([key,label])=>{const meta=data().stats[key],v=m.effects.stats[key]||0;return `<div><b>+${v/(meta?.div||1)}${meta?.pct?'%':''}</b><span>${label}</span></div>`}).join('');
  $('board-tabs').innerHTML=data().boards.map(b=>`<button type="button" data-board="${b.name}" class="${state.board===b.name?'active':''}">${b.name}<small>${m.boards.perBoard[b.name]} / ${b.totalCost}</small></button>`).join('');
  $('route-slider').max=a.crystals;state.preview=Math.min(state.preview,a.crystals);$('route-slider').value=state.preview;$('route-slider-value').textContent=state.preview;
  const preview=boardPlan(state.preview),board=data().boards.find(b=>b.name===state.board),grid=new Map(board.nodes.map(n=>[`${n[1]}:${n[2]}`,n]));let html='';
  for(let r=1;r<=15;r++)for(let c=1;c<=15;c++){const n=grid.get(`${r}:${c}`);if(!n){html+='<span></span>';continue}const owned=preview.owned.has(n[0])||n[5]===0,kind=n[5]===0?'start':n[5]===4?'unique':typeof n[6]?.[0]?.[0]==='number'?'skill':'stat';html+=`<button type="button" class="node ${kind} ${owned?'owned':''} ${preview.next?.id===n[0]?'next':''} ${state.node===n[0]?'selected':''}" data-node="${n[0]}" title="${esc(effectText(n))}" aria-label="${esc(effectText(n))}; row ${r}, column ${c}; ${owned?'owned':'future'}"><span>${nodeShort(n)}</span></button>`}
  $('board-grid').innerHTML=html;const selected=state.node&&nodes.get(state.node)?.board===state.board?nodes.get(state.node).node:null;
  $('selected-node').innerHTML=selected?`<strong>${esc(effectText(selected))}</strong><small>Row ${selected[1]}, column ${selected[2]} · ${selected[5]} crystal${selected[5]===1?'':'s'} · ${preview.owned.has(selected[0])||selected[5]===0?'In preview':'Future'}</small>`:`<strong>${state.board}</strong><small>Tap any node. Green and gold nodes are in the route; the outlined node is next.</small>`;
  const boardSkills={},boardStats={};for(const n of board.nodes){if(!preview.owned.has(n[0]))continue;for(const [key,value] of n[6]){if(typeof key==='number'){const name=data().skills[key]?.name||String(key);boardSkills[name]=(boardSkills[name]||0)+value}else boardStats[key]=(boardStats[key]||0)+value}}
  $('board-effect-intro').textContent=`${state.board} totals from the selected route at ${state.preview} crystals.`;
  const statLabel={FixingDamage:'Attack Bonus',Defense:'Defense Bonus',HPMax:'HP',MPMax:'MP'};
  const effectRows=[...Object.entries(boardSkills).map(([name,value])=>[name,`+${value}`]),...Object.entries(boardStats).map(([key,value])=>{const meta=data().stats[key];return [statLabel[key]||meta?.name||key,`+${value/(meta?.div||1)}${meta?.pct?'%':''}`]})];
  $('board-effect-list').innerHTML=effectRows.length?effectRows.map(([name,value])=>`<div><span>${esc(name)}</span><b>${esc(value)}</b></div>`).join(''):'<span class="empty">No purchased effects yet.</span>';
  let spent=0,number=0,boardSpent=0;const rows=[];for(const x of data().route){const n=nodes.get(x.id).node;spent+=n[5];if(x.board!==state.board)continue;number++;if(spent<=state.preview)boardSpent+=n[5];rows.push({number,spent,cost:n[5],label:effectText(n),id:x.id,row:n[1],col:n[2]})}
  $('purchase-intro').textContent=`${boardSpent} crystals on ${state.board} at preview ${state.preview}. Click a purchase to locate it on the grid.`;
  $('purchase-list').innerHTML=rows.map(x=>`<button type="button" data-purchase="${x.id}" class="purchase ${x.spent<=state.preview?'current':''}"><span class="n">${x.number}.</span><span>${esc(x.label)}<small>r${x.row} · c${x.col} · total ${x.spent}</small></span><span class="c">${x.cost} ✧</span></button>`).join('');
  const priority=new Set(masteryStages().slice(0,12).map(x=>x[0]));let total=0;const upcoming=[];for(const x of data().route){const n=nodes.get(x.id).node;total+=n[5];if(total<=m.boards.spent)continue;if(n[5]===4||typeof n[6]?.[0]?.[0]==='number'&&priority.has(data().skills[n[6][0][0]]?.name))upcoming.push({total,board:x.board,label:effectText(n)});if(upcoming.length>=5)break}
  $('board-next').innerHTML=upcoming.length?upcoming.map(x=>`<div class="next-unlock"><strong>${x.total} total</strong><span>${x.board}: ${esc(x.label)}</span></div>`).join(''):'<p>All key nodes on this route are funded.</p>';
  const starter=data().starterCost;$('route-footnote').textContent=starter?`The first ${starter} crystals follow a published connected ${profile().name} PvE path. Later clicks are generated using that guide’s skill and stat priorities. This is a recommended route, not a measured performance optimum.`:'This Chanter route is generated from published healer skill and stat priorities. It is a connected recommendation, not the source’s published damage route or a measured healing optimum.';
}
function titleName(t,faction){return typeof t.name==='string'?t.name:t.name[faction]}
function titlePriority(slot){
  if(slot==='Attack')return ['unbound','guardian','nice','cube'];
  if(slot==='Defense')return state.class==='templar'?['rule','dominator','saint','hello']:['dominator','saint','rule','hello'];
  return state.class==='templar'||profile().kind==='healer'?['through','closet','episode','legion']:['closet','through','episode','legion'];
}
function renderTitles(){
  const a=account(),owned=a.titlesOwned ||= {},faction=a.faction==='asmodian'?'asmodian':'elyos';
  $('faction-select').value=faction;
  const count=TITLES.filter(t=>owned[t.id]).length;
  $('titles-count').textContent=`${count} / ${TITLES.length} tracked earned`;
  $('titles-role-note').textContent=state.class==='templar'?'Templar: prioritize boss tolerance and a cooldown/HP Other title while retaining an Attack title for threat and damage.':profile().kind==='healer'?'Healer: the Attack title supports damage between heals; Defense and Other improve survival and cooldown uptime. These titles do not directly add a verified heal multiplier.':'Damage class: the Attack slot is your PvE damage title; Defense and Other preserve uptime and survivability.';
  const previews=[];
  $('title-grid').innerHTML=['Attack','Defense','Other'].map(slot=>{
    const priority=titlePriority(slot),items=priority.map(id=>TITLES.find(t=>t.id===id)),pick=items.find(t=>owned[t.id]),pickIndex=pick?priority.indexOf(pick.id):priority.length;
    const upgrade=items.slice(0,pickIndex).reverse().find(t=>!owned[t.id]);
    const collection=items.slice().reverse().find(t=>!owned[t.id]);
    const next=upgrade||collection;
    previews.push(`${slot}: ${pick?titleName(pick,faction):'none marked earned'}`);
    return `<article class="title-column"><div class="title-slot">${slot} slot</div><h3>${pick?esc(titleName(pick,faction)):'No earned title marked'}</h3><p class="title-current">${pick?`Equip now · ${esc(pick.equip)}`:'Mark a title below when your character earns it.'}</p><div class="title-next"><b>${upgrade?pick?'Next upgrade':'First title to earn':next?'Next collection':'Path complete'}</b><span>${next?`${esc(titleName(next,faction))} · ${esc(next.earn)}`:'Every title on this curated path is marked earned.'}</span></div><div class="title-options">${items.slice().reverse().map(t=>`<div class="title-option ${owned[t.id]?'earned':''}"><label><input type="checkbox" data-title="${t.id}" ${owned[t.id]?'checked':''}><strong>${esc(titleName(t,faction))}</strong></label><small><b>Equipped:</b> ${esc(t.equip)}</small><small><b>Owned:</b> ${esc(t.owned)}</small><small><b>Earn:</b> ${esc(t.earn)}</small><a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">Check source ↗</a></div>`).join('')}</div></article>`
  }).join('');
  $('title-preview').textContent=`${previews.join(' · ')}. Owned effects from all earned titles stay active after a swap. Open the path to mark what this character owns.`;
}
function renderSources(){
  const d=data(),p=profile();const cards=[
    ['Fresh Global 45 totals','The Global client leveling tables give 203 Mastery points, 29 Stigma points, four slots and 136 Daevanion crystals by level 45. Other rewards are additional.',`https://metabot.gg/en/aion-2/leveling`,'Open level table'],
    ['Combat Power calculation','The game calculates Combat Power server-side. Gear, boards and other permanent systems contribute; the client files do not provide a formula for predicting your final score.',`https://aion2data.com/get-stronger`,'Open stat sources'],
    ['Global client nodes','Board positions, costs, effects and skill names from Aion2Data Global client tables. Compare tooltips after a patch.',d.sources.nodes,'Open board data'],
    ['Connected route & weights',state.class==='chanter'?'Healer skill and stat weights guide the generated connected route.':'The published early route is preserved; the continuation follows class skill and stat priorities.',d.sources.route,'Open class route'],
    ['Specialty choices','Aion2Codex class guide PvE picks and option text; gear or Arcana can unlock later choices. Compare live tooltips.',`https://aion2codex.com/guides/${state.class}`,'Open specialties'],
    ['Stigmas and skills','Global class skill and stigma effects; the four chosen slots prioritize this planner’s role.',`https://aion2.grimvane.app/companion/wiki/${state.class}-skills/`,'Open class skills'],
    ['Macro setup','The in-game macro uses hotbar keys, up to four skills per stack and delays per step. The layouts are starting points.',state.class==='templar'?`https://mobalytics.gg/gamebase/guides/aion-2-templar-pve-build`:`https://aion2.grimvane.app/companion/wiki/macros-guide/`,'Open macro guide'],
    ['1–8 key layout','The number-key placement is this planner’s ergonomic recommendation. Defiance shares Space with jump/glide by default; the separate Defiance key setting is optional.',`https://couga54.github.io/aion2-guides/en/settings/`,'Open control settings'],
    ['Titles to earn and equip','Global title equip and collection effects, acquisition paths, and the three title slots. The curated title path uses owned checkboxes; it does not assume a fresh 45 already owns any title.',`https://metabot.gg/en/aion-2/guides/titles-guide`,'Open Global title guide'],
    ['Class build context',`${p.name} is planned as ${p.role.toLowerCase()}. Compare alternate damage or support presets before swapping roles.`,`https://metabot.gg/en/aion-2/guides/class-builds-guide`,'Open all-class guide']
  ];$('source-cards').innerHTML=cards.map(([title,body,url,label])=>`<div class="source-card"><b>${esc(title)}</b><p>${esc(body)}</p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a></div>`).join('');
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;render()}));
$('class-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-class]');if(!b)return;state.class=b.dataset.class;state.board='Nezekan';state.preview=account().crystals;state.node=null;render()});
function useBudget(values){Object.assign(account(),values);state.preview=account().crystals;state.node=null;render()}
$('fresh-45-button').addEventListener('click',()=>useBudget(FRESH_45));
for(const [id,key,max] of [['mastery-input','mastery',462],['stigma-input','stigma',300],['crystal-input','crystals',570]])$(id).addEventListener('change',e=>{account()[key]=clamp(e.target.value,0,max);if(key==='crystals')state.preview=account().crystals;render()});
for(const [id,ctx] of [['party-button','party'],['solo-button','solo']])$(id).addEventListener('click',()=>{account().context=ctx;render()});
$('macro-bind').addEventListener('change',e=>{account().macroBind=e.target.value;render()});
$('title-open').addEventListener('click',()=>{state.tab='titles';render();document.querySelector('.tabs').scrollIntoView({behavior:'smooth',block:'start'})});
$('faction-select').addEventListener('change',e=>{account().faction=e.target.value==='asmodian'?'asmodian':'elyos';render()});
$('title-grid').addEventListener('change',e=>{const id=e.target.dataset.title;if(!id||!TITLES.some(t=>t.id===id))return;account().titlesOwned ||= {};account().titlesOwned[id]=e.target.checked;render()});
$('reset-button').addEventListener('click',()=>{state.accounts[state.class]=DEFAULT_ACCOUNT(state.class);state.preview=FRESH_45.crystals;state.node=null;render()});
for(const [id,key] of [['goal-target','goalTarget'],['goal-observed','goalObserved']])$(id).addEventListener('change',e=>{account()[key]=clamp(e.target.value,0,1000000000);render()});
$('skill-grid').addEventListener('change',e=>{
  if(e.target.dataset.gear){account().gear[e.target.dataset.gear]=clamp(e.target.value,0,30);render()}
  if(e.target.dataset.currentRank){
    account().currentRanks ||= {};
    const name=e.target.dataset.currentRank;
    if(e.target.value==='')delete account().currentRanks[name];
    else account().currentRanks[name]=clamp(e.target.value,1,10);
    render();
  }
});
$('board-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-board]');if(b){state.board=b.dataset.board;state.node=null;renderBoards(model())}});
$('board-grid').addEventListener('click',e=>{const b=e.target.closest('[data-node]');if(b){state.node=Number(b.dataset.node);renderBoards(model())}});
$('purchase-list').addEventListener('click',e=>{const b=e.target.closest('[data-purchase]');if(b){state.node=Number(b.dataset.purchase);renderBoards(model())}});
$('route-slider').addEventListener('input',e=>{state.preview=clamp(e.target.value,0,account().crystals);renderBoards(model())});
state.preview=state.class?account().crystals:FRESH_45.crystals;render();
