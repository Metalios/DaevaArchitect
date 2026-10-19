const $ = id => document.getElementById(id);
const CLASS_ORDER = ['templar','gladiator','assassin','ranger','sorcerer','spiritmaster','cleric','chanter'];
const BOARD_NAMES = ['Nezekan','Zikel','Vaizel','Triniel'];
const ALL_BOARD_NAMES = [...BOARD_NAMES,'Azphel'];
const FRESH_45 = {mastery:203,stigma:29,crystals:136};
const BOARD_UNLOCKS = {Nezekan:12,Zikel:20,Vaizel:30,Triniel:40,Azphel:45};
const LEVEL_MILESTONES = [[4,'First point'],[12,'Nezekan'],[20,'Zikel'],[22,'Stigma I'],[23,'Stigma points'],[27,'Stigma II'],[30,'Vaizel'],[32,'Stigma III'],[37,'Stigma IV'],[40,'Triniel'],[45,'Endgame']];
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
const TEMPLAR_GROUP_STAGES = [['Judgment',10],['Vicious Strike',10],['Insulting Roar',10],['Fury',10],['Punishing Benediction',10],['Enhance Health',8],['Warding Strike',8],['Shield Smite',8],...TEMPLAR_STAGES];
// The first purchases during leveling go to skills available and useful in the
// opening rotation. Higher targets are still limited by SkillAcquireData gates.
const LEVELING_MASTERY_CORE = {
  templar:[['Vicious Strike',5],['Pummel',5],['Shield Smite',5],['Judgment',5],['Enhance Health',4],['Debilitating Smash',4]],
  gladiator:[['Keen Strike',5],['Rending Blow',5],['Overhead Slam',5],['Sword Aura Rampage',5],['Leaping Slam',4]],
  assassin:[['Quick Slice',5],['Savage Roar',5],['Heart Gore',5],['Ambush',5],['Shadowstrike',4]],
  ranger:[['Snipe',5],['Tempest Shot',5],['Snare Shot',5],['Drill Dart',5],['Marking Shot',4]],
  sorcerer:[['Flame Arrow',5],['Ice Chain',5],['Firestorm',5],['Blaze',4],['Bittercold Wind',3]],
  spiritmaster:[['Cold Shock',5],['Combustion',5],['Spirit Strike',5],['Summon: Fire Spirit',5],['Jointstrike: Curse',4]],
  cleric:[["Earth's Retribution",5],['Judgment Thunder',5],['Warm Benediction',5],['Divine Aura',5],['Chain of Torment',4]],
  chanter:[['Onslaught',5],['Incandescent Blow',5],['Rushing Smash',5],['Impactful Crush',5],['Blessing of Life',4]]
};
const LEVELING_MASTERY_NEXT = {
  templar:['Vicious Strike','Pummel','Judgment','Shield Smite','Warding Strike','Enhance Health'],
  gladiator:['Keen Strike','Rending Blow','Overhead Slam','Sword Aura Rampage','Ruinous Blow'],
  assassin:['Quick Slice','Savage Roar','Heart Gore','Ambush','Insignia Explosion'],
  ranger:['Snipe','Tempest Shot','Drill Dart','Gale Arrow','Deadshot'],
  sorcerer:['Flame Arrow','Ice Chain','Firestorm','Hellfire','Blaze','Bittercold Wind'],
  spiritmaster:['Cold Shock','Combustion','Spirit Strike','Summon: Fire Spirit','Elemental Fusion'],
  cleric:['Healing Light','Light of Regeneration','Radiant Recovery',"Earth's Retribution",'Chain of Torment'],
  chanter:['Onslaught','Incandescent Blow','Dark Crush','Recuperation','Protection Circle']
};
Object.assign(STIGMAS.templar,{
  'Executing Blade':{base:'Manual PvP pressure and stagger; pair with control openings',perks:{}},
  "Empyrean Lord's Punishment":{base:'High stagger damage and manual burst window',perks:{}},
  "Nezekan's Shield":{base:'Short protective shield for self or group survival',perks:{}}
});
const DEFAULT_ACCOUNT = (cls='templar') => ({...FRESH_45,azphel:0,context:'party',journey:'endgame',endgameContext:'party',levelingContext:'solo',leveling:{level:1,extraByLevel:{}},gear:{},equipment:{},currentRanks:{},obtainedNodes:[],titlesOwned:{},faction:'elyos',macroBind:'RMB',goalTarget:['cleric','chanter'].includes(cls)?0:cls==='templar'?60000:100000,goalObserved:0});
let saved = {};
try { saved = JSON.parse(localStorage.getItem('daeva-architect-all-v1') || localStorage.getItem('aion2-pathfinder-all-v3') || '{}') || {}; } catch (_) {}
let state = {class:CLASS_ORDER.includes(saved.class)?saved.class:null,accounts:saved.accounts||{},gearView:['inventory','inspect'].includes(saved.gearView)?saved.gearView:null,tab:'overview',board:'Nezekan',preview:FRESH_45.crystals,node:null,titleSearch:'',titleSlot:'all',titleOwnership:'all',titleFaction:'all'};
let theme = 'aether';
try { const storedTheme=localStorage.getItem('daeva-architect-theme')||localStorage.getItem('aion2-pathfinder-theme');if(['aether','sanctum','abyss'].includes(storedTheme))theme=storedTheme; } catch (_) {}
function applyTheme(){document.body.dataset.theme=theme;document.querySelectorAll('.theme-picker [data-theme]').forEach(b=>{b.classList.toggle('active',b.dataset.theme===theme);b.setAttribute('aria-pressed',b.dataset.theme===theme)});document.querySelector('meta[name="theme-color"]').content=theme==='sanctum'?'#eaf2f0':theme==='abyss'?'#160f25':'#0b1c2c'}
function account(){ if(!state.accounts[state.class]) state.accounts[state.class]=DEFAULT_ACCOUNT(state.class); return state.accounts[state.class]; }
function isLeveling(){return account().journey==='leveling'}
function leveling(){
  const a=account();a.leveling ||= {level:1,extraByLevel:{}};
  if(!a.leveling.extraByLevel){
    // Older saves had one extra-points value that incorrectly applied at every level.
    // Keep those earned points at 45; players can enter an earlier total at that level.
    const old=a.leveling.extra||{};
    a.leveling.extraByLevel=Object.values(old).some(Number)?{'45':{mastery:old.mastery||0,stigma:old.stigma||0,crystals:old.crystals||0}}:{};
  }
  return a.leveling;
}
function activeLevelingExtra(){
  const history=leveling().extraByLevel;
  const at=Object.keys(history).map(Number).filter(level=>level<=currentLevel()).sort((a,b)=>b-a)[0];
  return at===undefined?{mastery:0,stigma:0,crystals:0}:history[at];
}
function setLevelingBudget(key,total){
  const level=currentLevel(),extra={...activeLevelingExtra()};
  extra[key]=Math.max(0,total-levelReward()[key]);
  leveling().extraByLevel[level]=extra;
}
function currentLevel(){return isLeveling()?clamp(leveling().level,1,45):45}
function levelReward(){return LEVEL_REWARDS[currentLevel()]}
function budget(key){return isLeveling()?levelReward()[key]+(activeLevelingExtra()[key]||0):account()[key]}
function boardOpen(name){return !isLeveling()||currentLevel()>=BOARD_UNLOCKS[name]}
function pointLabels(){for(const key of ['mastery','stigma','crystals']){$(`${key==='crystals'?'crystal':key}-hint`).textContent=isLeveling()?`Level ${currentLevel()} baseline ${levelReward()[key]} + ${activeLevelingExtra()[key]||0} extra earned by this level`:{mastery:'Earned total, including spent points',stigma:'Four equipped stigmas',crystals:'Four PvE boards'}[key]}}
function data(){return DATA[state.class]}
function profile(){return PROFILES[state.class]}
function esc(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function clamp(v,min,max){v=Number(v);return Number.isFinite(v)?Math.max(min,Math.min(max,Math.floor(v))):min}
function save(){try{localStorage.setItem('daeva-architect-all-v1',JSON.stringify({class:state.class,accounts:state.accounts,gearView:state.gearView}))}catch(_){}}
function skillNames(){return Object.values(data().skills).map(s=>s.name)}
function allBoards(){return [...data().boards,AZPHEL[state.class]]}
function nodeMap(){return new Map(allBoards().flatMap(b=>b.nodes.map(n=>[n[0],{board:b.name,node:n}]))) }
function obtainedNodes(){const valid=nodeMap();return new Set((account().obtainedNodes||[]).filter(id=>valid.has(id)))}
function storeObtained(nodes){account().obtainedNodes=[...nodes];save()}
function activeRoute(){const route=ROUTES[state.class][account().context]||data().route;return isLeveling()?route.filter(x=>boardOpen(x.board)):route}
function activeWeights(){return ROUTES[state.class].weights[account().context]}
function activeStigmas(){
  const standard=profile().stigmas;
  const variants={templar:{solo:['Noble Armor','Battlefield Banner','Doom Shield',"Empyrean Lord's Punishment"],pvp:['Executing Blade',"Empyrean Lord's Punishment",'Doom Shield',"Nezekan's Shield"]},cleric:{solo:['Earth Punishment','Noble Aura','Prayer of Amplification','Light of Protection'],pvp:['Prayer of Amplification','Light of Protection',"Yustiel's Power",'Absolution']},sorcerer:{pvp:['Element Enhancement','Steel Barrier','Soul Freeze','Hibernation']},gladiator:{pvp:["Zikel's Blessing",'Focused Block','Lifestealing Blade','Armor of Balance']},assassin:{pvp:['Evasion Contract','Smoke Bomb','Swift Contract','Illusive Clone']},ranger:{pvp:["Vaizel's Authority",'Mother Nature\'s Breath','Ensnaring Trap','Stealth']},spiritmaster:{pvp:['Summon: Ancient Spirit',"Enhance: Spirit's Benediction",'Seize Magic','Cry of Terror']},chanter:{solo:['Undefeated Mantra','Sprint Mantra','Power of the Storm',"Marchutan's Wrath"],pvp:['Undefeated Mantra','Barrier Spell','Healing Touch','Focused Defense']}};
  const result=variants[state.class]?.[account().context]||standard;
  return result.every(name=>STIGMAS[state.class]?.[name])?result:standard;
}
function masteryCost(rank){return rank<=4?1:rank<=7?2:4}
function masteryTotal(rank){let points=0;for(let n=2;n<=rank;n++)points+=masteryCost(n);return points}
function stigmaCost(rank){return rank<=5?1:rank<=10?2:rank<=15?4:8}
function masteryRankCap(name){
  if(!isLeveling())return 10;
  const unlocked=SKILL_UNLOCKS[state.class][name];
  if(!unlocked||currentLevel()<unlocked)return 1;
  return Math.min(10,2+Math.floor((currentLevel()-unlocked)/3));
}
function masteryStages(){
  const available=stages=>isLeveling()?stages.filter(([name])=>(SKILL_UNLOCKS[state.class][name]||1)<=currentLevel()):stages;
  if(isLeveling()){
    const core=LEVELING_MASTERY_CORE[state.class],next=LEVELING_MASTERY_NEXT[state.class];
    const weights=activeWeights()?.skills||data().skillWeights;
    const rest=skillNames().map((name,i)=>({name,i,weight:weights[name]||0})).sort((a,b)=>b.weight-a.weight||a.i-b.i).map(x=>x.name);
    const support=account().context!=='party'?[]:state.class==='cleric'?[['Healing Light',5],['Light of Regeneration',5],['Radiant Recovery',5]]:state.class==='chanter'?[['Recuperation',5],['Protection Circle',5]]:[];
    return available([...support,...core,...next.map(name=>[name,8]),...rest.map(name=>[name,8]),...next.map(name=>[name,10]),...rest.map(name=>[name,10])]);
  }
  if(state.class==='templar'&&account().context==='party') return available(TEMPLAR_GROUP_STAGES);
  if(state.class==='templar'&&account().context==='solo') return available(TEMPLAR_STAGES);
  const names=skillNames(); const weights=activeWeights()?.skills||data().skillWeights;
  const order=names.map((name,i)=>({name,i,weight:weights[name]||0})).sort((a,b)=>b.weight-a.weight||a.i-b.i).map(x=>x.name);
  const first=order.slice(0,8), second=order.slice(8,16), third=order.slice(16);
  return available([...first.map(n=>[n,8]),...first.map(n=>[n,10]),...second.map(n=>[n,8]),...second.map(n=>[n,10]),...third.map(n=>[n,8]),...third.map(n=>[n,10])]);
}
function stigmaStages(){const s=activeStigmas().slice(0,isLeveling()?levelReward().slots:4);return [5,10,15,20].flatMap(rank=>s.map(name=>[name,rank]))}
function allocate(stages,budget,costFn,names,base,capFn=null){
  const levels=Object.fromEntries(names.map(n=>[n,base]));let spent=0,firstMiss=null;
  for(const [name,wanted] of stages){
    if(!(name in levels))continue;
    const target=Math.min(wanted,capFn?capFn(name):wanted);
    while(levels[name]<target){
      const cost=costFn(levels[name]+1);
      if(spent+cost>budget){firstMiss ||= {name,rank:levels[name]+1,cost};break}
      levels[name]++;spent+=cost;
    }
  }
  const next=firstMiss?{...firstMiss,need:Math.max(1,firstMiss.cost-(budget-spent))}:null;
  return {levels,spent,next};
}
function boardPlan(budget,azphel=false){
  const nodes=nodeMap(), owned=new Set(),perBoard=Object.fromEntries(ALL_BOARD_NAMES.map(n=>[n,0]));let spent=0,next=null;
  const route=azphel?ROUTES[state.class].azphel:activeRoute();
  for(const item of route){const n=nodes.get(item.id).node;if(spent+n[5]>budget){next={...item,cost:n[5],need:spent+n[5]-budget};break}spent+=n[5];owned.add(item.id);perBoard[item.board]+=n[5]}
  return {spent,owned,perBoard,next};
}
function routeSteps(route,nodes){let total=0;return route.map((item,index)=>{const node=nodes.get(item.id).node;total+=node[5];return {...item,number:index+1,total,cost:node[5],node}})}
function renderGlobalBoardRoute(m,nodes){
  const actual=obtainedNodes(),steps=routeSteps(activeRoute(),nodes),upcoming=steps.filter(x=>!actual.has(x.id)),first=upcoming[0],switchBoard=first&&upcoming.find(x=>x.board!==first.board),crystals=budget('crystals');
  const marked=steps.filter(x=>actual.has(x.id)),markedCost=marked.reduce((sum,x)=>sum+x.cost,0),unmarkedWithinBudget=upcoming.filter(x=>x.total<=crystals).length;
  $('global-route-budget').textContent=`${m.boards.spent} / ${crystals} crystals planned`;
  $('obtained-status').textContent=`${markedCost} crystals marked obtained across ${marked.length} nodes · ${unmarkedWithinBudget} planned clicks still unmarked at this budget`;
  $('global-route-caption').textContent=first?`Your obtained marks are skipped in the shared ${isLeveling()?'unlocked':'four-board'} route. ${first.board} is the first unmarked node at ${first.total} planned crystals${switchBoard?`; the next unmarked board switch is ${switchBoard.board} at ${switchBoard.total}`:''}.${markedCost>crystals?` Marked nodes cost ${markedCost}, above the entered ${crystals} crystals; check your total.`:''}`:isLeveling()&&currentLevel()<12?'Nezekan opens at level 12. Your crystals are saved until then.':'All currently available PvE nodes are marked obtained.';
  $('global-board-allocation').innerHTML=BOARD_NAMES.map(name=>{const spent=m.boards.perBoard[name],share=m.boards.spent?Math.round(spent/m.boards.spent*100):0,next=upcoming.find(x=>x.board===name),obtained=marked.filter(x=>x.board===name).reduce((sum,x)=>sum+x.cost,0),locked=!boardOpen(name);return `<button type="button" data-board-jump="${name}" class="global-board-card ${state.board===name?'active':''} ${locked?'locked':''}" ${locked?'disabled':''}><span>${name}</span><b>${locked?`Opens at Lv ${BOARD_UNLOCKS[name]}`:`${spent} planned · ${obtained} obtained`}</b><small>${locked?'Future board':`${share}% of planned PvE crystals`}</small><em>${locked?'Locked':next?`Next unmarked at ${next.total} ✧`:'Board complete'}</em><i style="width:${share}%"></i></button>`}).join('');
  $('global-route-next').innerHTML=upcoming.length?`<div class="global-next-label">Next 16 unmarked clicks across unlocked boards · tap to open its board</div><div class="global-next-grid">${upcoming.slice(0,16).map(x=>`<button type="button" data-route-node="${x.id}" data-route-board="${x.board}" class="global-next-step ${x.total<=crystals?'affordable':'later'}"><span class="global-step-number">${x.number}</span><span class="route-step-icon">${nodeVisual(x.node)}</span><span class="global-step-detail"><b>${x.board}${x.total<=crystals?' · within budget':' · later'}</b><small>${esc(effectText(x.node))} · r${x.node[1]} c${x.node[2]}</small></span><span class="global-step-total">${x.total} ✧</span></button>`).join('')}</div>`:'<p>No available next clicks at this level.</p>';
}
function effects(owned){const skills={},stats={},nodes=nodeMap();for(const id of owned){const n=nodes.get(id).node;for(const [key,v] of n[6]){if(typeof key==='number'){const name=data().skills[key]?.name||String(key);skills[name]=(skills[name]||0)+v}else stats[key]=(stats[key]||0)+v}}return {skills,stats}}
function effectText(n){if(!n||!n[6]?.length)return 'Start node';return n[6].map(([key,v])=>{if(typeof key==='number')return `${data().skills[key]?.name||key} +${v} level`;const meta=data().stats[key];return `${meta?.name||key} +${v/(meta?.div||1)}${meta?.pct?'%':''}`}).join(' · ')}
function nodeShort(n){if(n[5]===0||n[5]===4)return '✦';if(typeof n[6]?.[0]?.[0]==='number')return n[5]===2?'P':'S';return ({FixingDamage:'ATK',Critical:'CR',Defense:'DEF',HPMax:'HP',MPMax:'MP',HealBoost:'HEAL'})[n[6]?.[0]?.[0]]||'·'}
function nodeVisual(n){
  const key=n[6]?.[0]?.[0],icon=typeof key==='number'?data().skills[key]?.icon:null;
  return icon&&icon.startsWith('/game/skills/')?`<img class="node-game-icon" src="https://aion2data.com${esc(icon)}" alt="" loading="lazy">`:`<span>${nodeShort(n)}</span>`;
}
function model(){const a=account(),mastery=allocate(masteryStages(),budget('mastery'),masteryCost,skillNames(),1,isLeveling()?masteryRankCap:null),stigma=allocate(stigmaStages(),budget('stigma'),stigmaCost,activeStigmas(),0),boards=boardPlan(budget('crystals')),azphel=boardPlan(isLeveling()?0:a.azphel||0,true);return {mastery,stigma,boards,azphel,effects:effects(boards.owned),azphelEffects:effects(azphel.owned)}}
function effective(name,m){return Math.min(40,(m.mastery.levels[name]||1)+(m.effects.skills[name]||0)+(account().gear[name]||0)+(gearSkillLevels()[name]||0))}
function render(){
  applyTheme();
  const selected=CLASS_ORDER.includes(state.class);
  $('class-buttons').innerHTML=CLASS_ORDER.map(c=>`<button type="button" data-class="${c}" class="${state.class===c?'active':''}" aria-pressed="${state.class===c}"><span>${PROFILES[c].name}</span><small>${PROFILES[c].role}</small></button>`).join('');
  $('welcome-panel').hidden=selected;$('planner-content').hidden=!selected;
  $('class-role').textContent=selected?profile().role:'Select a class';
  if(!selected){$('hero-description').textContent='Choose a class to plan leveling from 1 to 45 or build from a fresh Global level 45.';save();return}
  const a=account(),m=model(),p=profile();
  document.body.classList.toggle('is-leveling',isLeveling());
  $('hero-description').textContent=isLeveling()?`${p.name} · Level ${currentLevel()} · ${a.context==='solo'?'Solo':'Group'} leveling. Follow the next unlocks and update your earned points as you play.`:p.summary+' Change your point totals to see what to buy now and next.';
  $('class-role').textContent=p.role;$('overview-role').textContent=p.role;
  for(const key of ['mastery','stigma','crystals'])$(`${key==='crystals'?'crystal':key}-input`).value=budget(key);
  pointLabels();$('leveling-controls').hidden=!isLeveling();$('fresh-preset').hidden=isLeveling();$('azphel-control').hidden=isLeveling();$('pvp-button').hidden=isLeveling();$('goal-panel').hidden=isLeveling();$('leveling-guide').hidden=!isLeveling();
  for(const [id,active] of [['leveling-mode',isLeveling()],['endgame-mode',!isLeveling()]]){$(id).classList.toggle('active',active);$(id).setAttribute('aria-pressed',active)}
  $('intro-copy').innerHTML=isLeveling()?`Enter <b>total points earned</b>, including spent and unspent. The level-only points are the baseline; extra rewards apply from the level where you enter them onward. Mastery skills, Stigma slots, and boards obey Global level gates. ${currentLevel()===45?'Use the transfer button to copy these totals into your level 45 build.':'The full macro becomes available in the level 45 build stage.'}`:'Enter <b>total points earned, including spent and unspent</b>. Recommended ranks are a reset plan; displayed in-game skill levels can also include board, gear and Arcana bonuses. Each class saves its own inputs. Research reviewed October 19, 2026.';
  $('reset-button').textContent=isLeveling()?'Reset class progress':'Reset class to fresh 45';
  if(isLeveling())renderLevelControls();
  $('fresh-45-button').classList.toggle('active',Object.entries(FRESH_45).every(([key,value])=>a[key]===value)&&!(a.azphel||0));
  for(const [id,ctx] of [['party-button','party'],['solo-button','solo'],['pvp-button','pvp']]){$(id).classList.toggle('active',a.context===ctx);$(id).setAttribute('aria-pressed',a.context===ctx)}
  $('azphel-input').value=a.azphel||0;
  document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===state.tab);b.setAttribute('aria-current',b.dataset.tab===state.tab?'page':'false')});
  $('mobile-more-button').classList.toggle('active',['stigma','rotation','titles','sources'].includes(state.tab));
  document.querySelectorAll('.tab-panel').forEach(el=>el.classList.toggle('active',el.id===state.tab));
  renderOverview(m);renderMobileNext(m);renderMastery(m);renderStigma(m);renderRotation(m);renderBoards(m);renderGear();renderTitles();renderSources();save();
}
function renderMobileNext(m){
  const el=$('mobile-next');el.hidden=false;
  const first=isLeveling()?LEVELING_MASTERY_CORE[state.class].find(([name,target])=>(m.mastery.levels[name]||1)<Math.min(target,masteryRankCap(name))):null;
  const choice=first?{title:`Raise ${first[0]} to rank ${Math.min(first[1],masteryRankCap(first[0]))}`,detail:`Current plan: rank ${m.mastery.levels[first[0]]||1}. This skill's next rank is available at your character level.`,tab:'mastery'}:m.mastery.next?{title:`Plan ${m.mastery.next.name} rank ${m.mastery.next.rank}`,detail:`Earn ${m.mastery.next.need} more Mastery point${m.mastery.next.need===1?'':'s'} for this step.`,tab:'mastery'}:m.boards.next?{title:`Open ${m.boards.next.board} next`,detail:`${effectText(nodeMap().get(m.boards.next.id).node)} · ${m.boards.next.need} more crystals for the next connected node.`,tab:'boards'}:{title:'Review your current build',detail:'Your available points are allocated. Check skill specialties and the next board route.',tab:'mastery'};
  $('mobile-next-title').textContent=choice.title;$('mobile-next-description').textContent=choice.detail;el.dataset.targetTab=choice.tab;
}
function renderLevelControls(){
  const level=currentLevel(),r=levelReward(),next=LEVEL_MILESTONES.find(([at])=>at>level);
  $('level-display').textContent=level;$('level-input').value=level;$('level-slider').value=level;
  $('handoff-button').hidden=level<45;
  $('leveling-summary').textContent=`${r.mastery} Mastery · ${r.stigma} Stigma · ${r.crystals} crystals from levels alone · ${r.slots} Stigma slot${r.slots===1?'':'s'}${next?` · Next: ${next[1]} at ${next[0]}`:''}`;
  $('level-milestones').innerHTML=LEVEL_MILESTONES.map(([at,label])=>`<button type="button" data-milestone="${at}" class="${level>=at?'reached':''} ${level===at?'current':''}"><b>${at}</b><small>${label}</small></button>`).join('');
}
function renderOverview(m){
  if(isLeveling()){renderLevelingOverview(m);return}
  const a=account(),p=profile(),ordered=masteryStages().map(x=>x[0]).filter((v,i,s)=>s.indexOf(v)===i),top=ordered.slice(0,4);
  $('overview-title').textContent=`${p.name}: recommended path`;$('overview-subtitle').textContent=p.summary;
  const kpis=[['Top target',top[0]?`Lv ${effective(top[0],m)}`:'—',top[0]||''],['PvE crystals',`${m.boards.spent} / ${a.crystals}`,`${m.boards.perBoard.Nezekan} Nezekan · ${m.boards.perBoard.Zikel} Zikel`],['Stigma bar',`${m.stigma.spent} / ${a.stigma}`,'Four context-specific slots'],['Ready points',`${a.mastery-m.mastery.spent} · ${a.stigma-m.stigma.spent} · ${a.crystals-m.boards.spent}`,'Unspent Mastery · Stigma · PvE crystals']];
  $('kpis').innerHTML=kpis.map(([label,value,detail])=>`<div class="kpi"><div class="k-label">${esc(label)}</div><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`).join('');
  const mode=p.kind==='healer'?'healing':'damage';
  const steps=[`<b>Mastery:</b> ${top.map(n=>`${esc(n)} Lv ${m.mastery.levels[n]||1}`).join(' · ')}. Open the Mastery tab for every rank and specialty.`,
    `<b>Stigmas:</b> ${activeStigmas().map(n=>`${esc(n)} Lv ${m.stigma.levels[n]||0}`).join(' · ')}. ${esc(p.swap)}`,
    `<b>PvE boards:</b> ${BOARD_NAMES.map(n=>`${n} ${m.boards.perBoard[n]}`).join(' · ')}. The grid gives a connected ${a.context==='pvp'?'PvP-oriented':'PvE'} click order at ${a.crystals} crystals.`,
    `<b>${mode==='healing'?'Healing':'Fight'} priority:</b> ${esc(p.rule)}`];
  if(a.context==='solo')steps.push(`<b>Solo route:</b> Mastery, Stigmas and the board order favor personal damage and self-sustain. The board route differs from Group PvE.`);
  if(a.context==='pvp')steps.push(`<b>PvP route:</b> Mastery, Stigmas and PvE crystal clicks prioritize control, escape and survival. Azphel uses a separate ${a.azphel||0}-crystal budget; it has no skill-level nodes.`);
  $('now-steps').innerHTML=steps.map((v,i)=>`<li><span class="step-num">${i+1}</span><span>${v}</span></li>`).join('');
  const next=[];if(m.mastery.next)next.push([`+${m.mastery.next.need} mastery`,`${m.mastery.next.name} rank ${m.mastery.next.rank}`]);if(m.stigma.next)next.push([`+${m.stigma.next.need} stigma`,`${m.stigma.next.name} rank ${m.stigma.next.rank}`]);if(m.boards.next)next.push([`+${m.boards.next.need} PvE crystals`,`${m.boards.next.board}: ${effectText(nodeMap().get(m.boards.next.id).node)}`]);if(a.context==='pvp'&&m.azphel.next)next.push([`+${m.azphel.next.need} Azphel crystals`,effectText(nodeMap().get(m.azphel.next.id).node)]);
  const needs=top.map(n=>({name:n,level:effective(n,m)})).find(x=>x.level<16);if(needs)next.push(['Lv 16 specialty',`${needs.name}: ${16-needs.level} more effective levels from mastery, board or gear`]);
  $('next-unlocks').innerHTML=next.length?next.map(([label,detail])=>`<div class="next-unlock"><strong>${esc(label)}</strong><span>${esc(detail)}</span></div>`).join(''):'<p>All planned ranks and nodes are funded.</p>';
  renderGoal();
}
function renderLevelingOverview(m){
  const p=profile(),level=currentLevel(),r=levelReward(),solo=account().context==='solo',next=LEVEL_MILESTONES.find(([at])=>at>level),names=masteryStages().map(([name])=>name).filter((v,i,s)=>s.indexOf(v)===i),top=names.slice(0,4),unlocks=Object.entries(SKILL_UNLOCKS[state.class]).filter(([,at])=>at>level).sort((a,b)=>a[1]-b[1]).slice(0,3);
  const band=level<12?'Learn the core loop':level<22?'Build your first board':level<30?'Add Stigmas':level<40?'Expand your kit':'Finish the campaign';
  $('overview-title').textContent=`${p.name} · Level ${level} path`;$('overview-subtitle').textContent=`${solo?'Solo':'Group'} leveling priorities through level 45. Recommendations use skills and systems available at your selected level.`;
  $('leveling-guide').innerHTML=`<div class="leveling-guide-heading"><span class="eyebrow">${solo?'SOLO':'GROUP'} LEVELING · ${esc(band)}</span><h3>${solo?'Keep damage moving and recover between pulls.':'Advance the campaign together and keep roles clear.'}</h3></div><div class="leveling-guide-grid"><div><b>Quest route</b><p>Follow the main story first. Add nearby regional quests and one-time Sealed Dungeon clears when the next chapter needs more EXP or points.</p></div><div><b>${solo?'In combat':'In a party'}</b><p>${solo?'Use your core weave on safe targets, pull a size your defenses and healing can cover, and save escapes for bad pulls.':p.kind==='healer'?'Keep the group alive first, then weave damage when healing is stable.':state.class==='templar'?'Hold enemy attention and face attacks away from allies; use defensive skills for dangerous casts.':'Maintain damage uptime, avoid avoidable hits, and use your control or support when it helps the group.'}</p></div><div><b>Next milestone</b><p>${next?`Level ${next[0]} opens ${esc(next[1])}. Your level-only points will update automatically.`:'Level 45 is ready. Switch to the Level 45 build stage when you finish the campaign.'}</p></div></div>`;
  const kpis=[['Mastery',`${m.mastery.spent} / ${budget('mastery')}`,`${top[0]||'Core skills'} first`],['Stigma slots',`${r.slots} / 4`,level<22?'First slot at level 22':`${m.stigma.spent} / ${budget('stigma')} points planned`],['Boards open',`${BOARD_NAMES.filter(boardOpen).length} / 4`,`${m.boards.spent} / ${budget('crystals')} crystals planned`],['Next unlock',next?`Lv ${next[0]}`:'Lv 45',next?.[1]||'Move to endgame']];
  $('kpis').innerHTML=kpis.map(([label,value,detail])=>`<div class="kpi"><div class="k-label">${esc(label)}</div><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`).join('');
  const steps=[`<b>Mastery:</b> ${top.length?top.map(n=>`${esc(n)} rank ${m.mastery.levels[n]||1}`).join(' · '):'Skill points start at level 4.'} The Mastery tab shows only skills unlocked by this level.`,`<b>Stigmas:</b> ${r.slots?activeStigmas().slice(0,r.slots).map(n=>`${esc(n)} Lv ${m.stigma.levels[n]||0}`).join(' · '):'First slot unlocks at level 22; first leveling point arrives at 23.'}`,`<b>Daevanion:</b> ${BOARD_NAMES.filter(boardOpen).length?BOARD_NAMES.filter(boardOpen).map(n=>`${n} ${m.boards.perBoard[n]}`).join(' · '):'Nezekan opens at level 12.'} The route uses unlocked boards only.`,`<b>Fight:</b> Keep ${esc(p.weave)} on ${esc(p.weaveKey||'LMB')} and weave unlocked attacks manually. Keep defenses, healing and charge timing manual.`];
  $('now-steps').innerHTML=steps.map((v,i)=>`<li><span class="step-num">${i+1}</span><span>${v}</span></li>`).join('');
  const future=[];for(const [name,at] of unlocks)future.push([`Lv ${at} skill`,name,at]);if(next)future.push([`Lv ${next[0]}`,next[1],next[0]]);future.sort((x,y)=>x[2]-y[2]);if(m.mastery.next)future.push([`+${m.mastery.next.need} Mastery`,`${m.mastery.next.name} rank ${m.mastery.next.rank}`]);if(m.boards.next)future.push([`+${m.boards.next.need} crystals`,`${m.boards.next.board}: ${effectText(nodeMap().get(m.boards.next.id).node)}`]);
  $('next-unlocks').innerHTML=future.length?future.slice(0,6).map(([label,detail])=>`<div class="next-unlock"><strong>${esc(label)}</strong><span>${esc(detail)}</span></div>`).join(''):'<p>Level 45 progression is ready.</p>';
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
  const a=account(),order=masteryStages().map(x=>x[0]).filter((v,i,s)=>s.indexOf(v)===i),query=(state.masterySearch||'').trim().toLocaleLowerCase();
  const opened=new Set([...$('skill-grid').querySelectorAll('details[open][data-detail-id]')].map(el=>el.dataset.detailId));
  const invested=order.filter(name=>(m.mastery.levels[name]||1)>1);
  const shown=order.map((name,i)=>({name,i})).filter(({name})=>name.toLocaleLowerCase().includes(query)&&(!isLeveling()||query||(m.mastery.levels[name]||1)>1));
  $('mastery-search').value=state.masterySearch||'';
  $('mastery-spent').textContent=`${m.mastery.spent} / ${budget('mastery')} planned`;
  $('mastery-visible').textContent=query?`${shown.length} of ${order.length} unlocked skills match “${state.masterySearch}”`:isLeveling()?`${invested.length} recommended upgrades · ${order.length} skills unlocked at level ${currentLevel()}`:`${order.length} skills · highest priority first`;
  const levelContext=$('mastery-level-context');levelContext.hidden=!isLeveling();
  if(isLeveling()){
    const extra=activeLevelingExtra().mastery||0;
    levelContext.innerHTML=`<div><b>Level ${currentLevel()} Mastery plan</b><span>${levelReward().mastery} points from levels + ${extra} extra earned by this level. Only skills receiving Mastery points appear below; search to inspect any other unlocked skill.</span></div>${extra?'<button type="button" data-reset-level-mastery>Use level-only points</button>':''}`;
  }
  $('mastery-icon-source').href=`https://aion2data.com/classes/${state.class}`;
  $('skill-grid').innerHTML=shown.map(({name,i})=>{
    const base=m.mastery.levels[name]||1,board=m.effects.skills[name]||0,manualGear=a.gear[name]||0,itemGear=gearSkillLevels()[name]||0,gear=manualGear+itemGear,bonus=board+gear,eff=effective(name,m),current=a.currentRanks?.[name],currentEffectiveLevel=current?Math.min(40,current+bonus):null,spec=SPECS[state.class]?.[name],picks=specPicks(name,eff);
    const icon=Object.values(data().skills).find(skill=>skill.name===name)?.icon;
    const skillIcon=icon?.startsWith('/game/skills/')?`<img src="https://aion2data.com${esc(icon)}" alt="" loading="lazy">`:'✦';
    const cap=masteryRankCap(name),nextGate=cap<10?(SKILL_UNLOCKS[state.class][name]||1)+3*(cap-1):null;
    const choices=spec?Object.entries(spec.options):[];
    const selected=picks.filter(num=>spec?.options[num]);
    const specialty=spec?`<div class="mastery-specialty"><div class="mastery-specialty-head"><span>Recommended specialties</span><small>${eff<8?`Unlocks at effective Lv 8`:`${selected.length} ${selected.length===1?'pick':'picks'} at effective Lv ${eff}`}</small></div>${selected.length?`<ul class="mastery-picked">${selected.map(num=>`<li><span>${num}</span><b>${esc(spec.options[num])}</b></li>`).join('')}</ul>`:`<p class="mastery-pick-empty">${eff<8?'Raise the effective level to 8 to unlock the first specialty.':'No verified specialty picks for this level. Check the skill tooltip in game.'}</p>`}<details class="mastery-disclosure" data-detail-id="${esc(name)}:options" ${opened.has(name+':options')?'open':''}><summary>Compare all ${choices.length} options</summary><ol class="mastery-option-list">${choices.map(([num,label])=>{const required=+num<=3?8:+num===4?12:16,chosen=selected.includes(+num);return `<li class="${chosen?'chosen':''} ${eff<required?'locked':''}"><span class="mastery-option-number">${num}</span><span>${esc(label)}</span><em>${chosen?'Selected':eff<required?`Lv ${required}`:'Available'}</em></li>`}).join('')}</ol></details></div>`:`<div class="mastery-specialty mastery-specialty-none"><span>Specialty guidance</span><p>No verified specialty options for this skill. Check its tooltip in game.</p></div>`;
    return `<article class="skill-card ${i<4?'highlight':''}"><div class="mastery-card-head"><div class="mastery-identity"><span class="mastery-skill-icon">${skillIcon}</span><div><div class="mastery-priority">Priority ${String(i+1).padStart(2,'0')}${isLeveling()?` · Unlocked Lv ${SKILL_UNLOCKS[state.class][name]||1}`:''}</div><h3>${esc(name)}</h3></div></div><div class="mastery-target"><span>Target rank</span><strong>${base}</strong><small>In-game Lv ${eff}</small></div></div><div class="mastery-rank-track" role="meter" aria-label="${esc(name)} target Mastery rank" aria-valuemin="1" aria-valuemax="10" aria-valuenow="${base}"><span style="width:${base*10}%"></span></div><div class="mastery-numbers"><div><span>Mastery cost</span><strong>${masteryTotal(base)} <small>pts total</small></strong></div><div><span>Daevanion board</span><strong>+${board}</strong></div><div><span>Gear / Arcana</span><strong>+${gear}</strong></div><div class="mastery-green"><span>Green bonus in game</span><strong>(+${bonus})</strong></div></div>${isLeveling()?`<p class="mastery-gate">Rank cap at level ${currentLevel()}: ${cap}${nextGate?` · rank ${cap+1} opens at character Lv ${nextGate}`:''}</p>`:''}${specialty}<details class="mastery-disclosure mastery-adjust" data-detail-id="${esc(name)}:adjust" ${opened.has(name+':adjust')?'open':''}><summary>Adjust bonuses & compare your rank</summary><div class="mastery-adjust-fields"><label>Other bonus levels <small>Manual adjustment; slotted gear adds +${itemGear}</small><input type="number" data-gear="${esc(name)}" min="0" max="30" value="${manualGear}" aria-label="Other bonus levels for ${esc(name)}"></label><label>Your current Mastery rank <small>Optional</small><input type="number" data-current-rank="${esc(name)}" min="1" max="10" placeholder="—" value="${current||''}" aria-label="Current Mastery rank for ${esc(name)}"></label></div>${currentEffectiveLevel?`<p class="mastery-comparison">Your rank ${current} + green bonus (+${bonus}) = Lv ${currentEffectiveLevel}. Target rank ${base} + green bonus (+${bonus}) = Lv ${eff}.</p>`:''}</details></article>`;
  }).join('')||(query?`<div class="mastery-empty">No unlocked skills match “${esc(state.masterySearch)}” at level ${currentLevel()}. Clear the search or choose a higher level.</div>`:isLeveling()?`<div class="mastery-empty">No Mastery upgrades are available at level ${currentLevel()}. Mastery points begin at level 4; your unlocked skills start at rank 1.</div>`:'');
}
function renderStigma(m){
  const p=profile(),a=account(),slots=isLeveling()?levelReward().slots:4,selected=activeStigmas().slice(0,slots),mode={party:'Group PvE',solo:'Solo',pvp:'PvP'}[a.context];$('stigma-spent').textContent=`${m.stigma.spent} / ${budget('stigma')} spent`;$('loadout-title').textContent=isLeveling()?`${p.name} · ${slots} of 4 slots open`:`${p.name} ${mode} bar`;$('loadout-text').textContent=slots?selected.join(', ')+'. '+(a.context==='party'?p.swap:'This is a context-specific starting set; compare your live tooltips and matchups.'):'Stigmas open at level 22. The first Stigma point comes at level 23; more slots open at 27, 32 and 37.';
  $('stigma-heading').textContent=isLeveling()?`Stigmas · ${slots} of 4 slots open`:'Four stigma slots';$('stigma-description').textContent=isLeveling()?'Slots open at levels 22, 27, 32 and 37. Leveling points start at 23.':'Points advance the four equipped choices to their 5, 10, 15 and 20 breakpoints.';
  $('loadout-tags').innerHTML=selected.map(n=>`<span class="tag ${m.stigma.levels[n]>=5?'green':''}">${esc(n)} · Lv ${m.stigma.levels[n]||0}</span>`).join('');
  $('stigma-grid').innerHTML=selected.map(name=>{const info=STIGMAS[state.class]?.[name],lv=m.stigma.levels[name]||0,perks=info?.perks||{};
    return `<article class="stigma-card"><div class="stigma-head"><div><h3>${esc(name)}</h3><div class="sub">Equipped · ${esc(info?.base||'Class stigma')}</div></div><div class="lv">Lv ${lv}</div></div><div class="spec-row">${Object.entries(perks).map(([rank,label])=>`<span class="spec ${lv>=+rank?'on':'future'}">Lv ${rank}: ${esc(label)}</span>`).join('')}</div><div class="milestone">${Object.keys(perks).length?lv<20?`Next perk at Lv ${[5,10,15,20].find(x=>x>lv)}`:'All four perks unlocked':'Compare the level perks in game; this planner has not verified their text.'}</div></article>`}).join('');
}
function numbered(items){return items.map((v,i)=>`<li><span class="rotation-num">${String(i+1).padStart(2,'0')}</span><span>${esc(v)}</span></li>`).join('')}
function renderRotation(m){
  const p=profile(),a=account(),main=masteryStages()[0]?.[0]||skillNames()[0],macroKey=['RMB','Mouse 4','MMB','M'].includes(a.macroBind)?a.macroBind:'RMB',weaveKey=p.weaveKey||'LMB';$('rotation-level').textContent=isLeveling()?currentLevel()===45?'Lv 45 · transfer ready':`Lv ${currentLevel()} · future setup`:`${main} Lv ${effective(main,m)}`;$('rotation-rule-title').textContent=p.rule;$('rotation-rule-text').textContent=p.summary;
  $('rotation').classList.toggle('leveling-view',isLeveling());$('leveling-rotation').hidden=!isLeveling();
  if(isLeveling()){
    const level=currentLevel(),active=new Set(Object.values(data().skills).slice(0,12).map(s=>s.name)),available=masteryStages().map(([name])=>name).filter((name,i,all)=>active.has(name)&&all.indexOf(name)===i),next=Object.entries(SKILL_UNLOCKS[state.class]).filter(([name,at])=>active.has(name)&&at>level).sort((x,y)=>x[1]-y[1])[0],slots=levelReward().slots;
    $('leveling-rotation').innerHTML=`<span class="eyebrow">CURRENT LEVEL COMBAT</span><h3>Keep the core loop simple</h3><p>Use <b>${esc(p.weave)}</b> on ${esc(weaveKey)} while safe. Weave unlocked skills manually as their triggers and cooldowns allow. Pause attacks to dodge or heal.</p><div class="leveling-rotation-grid"><div><b>Available priorities</b><span>${esc(available.slice(0,6).join(' · ')||p.weave)}</span></div><div><b>Stigma access</b><span>${slots?`${slots} slot${slots===1?'':'s'} · ${esc(activeStigmas().slice(0,slots).join(' · '))}`:'First slot at level 22'}</span></div><div><b>Next attack unlock</b><span>${next?`Lv ${next[1]} · ${esc(next[0])}`:'Core class skills unlocked'}</span></div></div><div class="notice">${level===45?'Use the transfer button in the level panel to carry your point totals into the full level 45 rotation and macro setup.':'The 1–8 and Macro setup is for level 45. Add each skill after it opens in game; keep defensive, healing, movement and charge timing manual.'}</div>`;
  }
  const fusionCharged=state.class==='spiritmaster'&&specPicks('Elemental Fusion',effective('Elemental Fusion',m)).includes(4);
  const stacks=fusionCharged?p.stacks.filter(s=>s.key!=='E'):p.stacks;
  const macroSteps=fusionCharged?p.macro.filter(key=>key!=='E'):p.macro;
  const hotbar=p.hotbar.map(([skills,cue,tone])=>[skills,cue,tone]);
  if(a.context!=='party'){
    const chosen=activeStigmas(),missing=chosen.filter(name=>!p.stigmas.includes(name)&&!hotbar.some(([skills])=>skills.includes(name)));
    for(const slot of hotbar){const replaced=slot[0].some(name=>p.stigmas.includes(name)&&!chosen.includes(name));slot[0]=slot[0].map(name=>p.stigmas.includes(name)&&!chosen.includes(name)?missing.shift()||null:name).filter(Boolean);if(replaced){slot[1]=`${a.context==='pvp'?'PvP':'Solo'} Stigma · use manually`;slot[2]='defense'}if(!slot[0].length){slot[1]='Available for a matchup-specific skill';slot[2]='utility'}}
    for(const name of missing){const index=hotbar.findLastIndex(([skills])=>skills.length===0);const target=index>=0?index:hotbar.length-1;hotbar[target]=[[name],`${a.context==='pvp'?'PvP':'Solo'} Stigma · use manually`,'defense']}
  }
  if(fusionCharged)hotbar[6]=[['Elemental Fusion'],'Fully charge when Four Elements is ready','attack'];
  $('rotation-gate').textContent=isLeveling()?`Level ${currentLevel()} preview: the full macro and 1–8 layout below are a level 45 setup. Use only skills already unlocked; the Build now and Mastery tabs show your current kit. Keep defensive and healing inputs manual.`:state.class==='templar'?`Judgment is effective Lv ${effective('Judgment',m)}. ${effective('Judgment',m)>=16?'With its cooldown-removal Specialty selected, the E stack can spend repeated casts during one proc.':'Before its Lv 16 cooldown-removal Specialty, expect one Judgment cast per available proc and space manual Doom Shield around its cooldown.'} The macro spends Judgment first within E. The timing caution applies to extra manual Punishment or shield-trigger casts, which can interrupt or overlap that proc.`:p.kind==='healer'?'Heals, toggles and emergency buttons remain manual. Use the macro only while the group is stable.':`Current first priority: ${main} effective Lv ${effective(main,m)}. Keep charged and movement skills on their own keys.`;
  $('rotation-opener-title').textContent={party:'Group opener',solo:'Solo opener',pvp:'PvP engage'}[a.context];
  const opener=a.context==='pvp'?['Approach with cover and keep your escape or control break available.','Open with a manual control or gap close after the opponent commits.','Use the damage macro only while your target is in range and you can safely finish the cast.']:p.opener;
  const loop=a.context==='pvp'?['Use manual control, defensive Stigmas and Defiance (Space) around enemy burst.','Weave your safe damage skills when the target is in range; stop the macro during a chase or disengage.','Keep a mobility or peel skill ready instead of spending every cooldown for damage.']:p.loop;
  $('rotation-opener').innerHTML=numbered(opener);$('rotation-loop').innerHTML=numbered(loop);
  $('macro-bind').value=macroKey;$('weave-basic-key').textContent=weaveKey;$('weave-macro-key').textContent=macroKey;
  $('weave-guide').textContent=a.context==='pvp'?`Tap ${weaveKey} + ${macroKey} only during safe pressure windows. Release the macro to move, peel, or answer an opponent's burst; manual control takes priority.`:`Hold ${weaveKey} (${p.weave}) with ${macroKey} (the in-game Macro bind) as your default safe-damage state. Press manual keys over the held loop; they take priority.`;
  $('rhythm-base-keys').textContent=`${weaveKey} + ${macroKey}`;
  $('rhythm-base-note').textContent=`Keep ${p.weave} held while Macro attempts ${macroSteps.join(' and ')}. Maintain this through safe damage uptime.`;
  $('rhythm-weave-note').textContent=a.context==='pvp'?'Keep control, escape and defensive keys manual. Use the Stigmas tab for this PvP loadout; press the macro only for safe pressure.':state.class==='templar'?'E handles Judgment and Pummel automatically. Time Punishment, Doom Shield and Shield of Protection by hand between Judgment windows or for boss mechanics.':p.kind==='healer'?'Press the needed 1–8 heal or support key; manual input wins. Shift fully to healing when the group is in danger.':'Press or hold a 1–8 skill at its cue. During safe uptime, keep the base held; manual input wins over the macro.';
  $('rhythm-pause-note').textContent=p.kind==='healer'?`Release ${macroKey} and ${weaveKey} for healing triage or mechanics. Restart both when damage is safe.`:`Release ${macroKey} to stop Macro; release ${weaveKey} too when all attacks must stop. Pause Macro if a charge gets clipped.`;
  $('hotbar-grid').innerHTML=hotbar.map(([skills,cue,tone],i)=>`<article class="hotbar-card tone-${esc(tone)}"><div class="hotbar-top"><span class="hotbar-number">${i+1}</span><small>${esc(tone)}</small></div><div class="hotbar-skills">${skills.length?skills.map(name=>`<strong>${esc(name)}</strong>`).join(''):'<strong>Flex slot</strong>'}</div><p>${esc(cue)}</p></article>`).join('');
  $('hotbar-note').textContent=`Defiance shares Space with jump/glide by default for every class; it does not consume a number-bar slot. Optional: turn on Separate Defiance Hotkey and give it a dedicated nearby key to avoid accidental glides. ${a.context==='pvp'?'The 1–8 bar includes this PvP Stigma set. Place matchup-specific control and defense where your hand can reach them.':a.context==='solo'?'The 1–8 bar includes the Solo Stigma set; keep its recovery and movement keys manual.':fusionCharged?'Elemental Fusion has a charge specialty at this level, so put it on 7 and remove it from macro E. Keep Wind Spirit on a secondary row.':p.hotbarNote}`;
  const stackHtml=stacks.map(s=>`<div class="macro-stack"><div class="stack-heading"><span class="keycap">${esc(s.key)}</span><div><strong>${esc(s.title)}</strong><small>${s.manual?'Manual key':'Macro hotbar key'}</small></div></div>${s.skills.map((name,i)=>`<div class="stack-row"><b>Row ${i}</b><span>${esc(name)}</span></div>`).join('')}</div>`).join('');
  const script=`<div class="macro-stack macro-script"><div class="stack-heading"><span class="keycap">${esc(macroKey)}</span><div><strong>In-game Macro steps</strong><small>Bind Macro to ${esc(macroKey)}</small></div></div>${macroSteps.map((key,i)=>`<div class="stack-row"><b>Step ${i+1}</b><span>${esc(key)} · 10 ms</span></div>`).join('')}<div class="stack-row"><b>Hold</b><span>${esc(fusionCharged?'Hold Cold Shock with the Macro key; charge Elemental Fusion on 7 by hand.':p.hold)}</span></div></div>`;
  $('macro-stacks').innerHTML=stackHtml+script;
  $('setup-list').innerHTML=[`Settings (O) → Key Settings → General → Macro: bind ${macroKey}; it is unbound by default. In AION 1 control mode, use a keyboard key instead of a mouse button.`,`Put ${p.weave} on ${weaveKey}. Set manual powers on 1–8 as shown. Defiance is on Space by default, shared with jump/glide; a separate Defiance key is optional.`,`Skills (K): make the labeled stacks. Then add only the listed hotbar keys to Macro, in order, starting each step at 10 ms.`,`Hold ${weaveKey} and ${macroKey} through safe damage, pressing or holding 1–8 at their cues. Manual input takes priority. Release ${macroKey} to stop Macro, and ${weaveKey} too when all attacks must stop.`].map(x=>`<li>${esc(x)}</li>`).join('');
  $('manual-keys').innerHTML=p.manual.map(v=>`<div class="manual-key"><b>${esc(v.split(' — ')[0])}</b><small>${esc(v.split(' — ')[1]||'Manual timing')}</small></div>`).join('');
}
function renderBoards(m){
  const a=account(),nodes=nodeMap(),actual=obtainedNodes(),isAz=state.board==='Azphel',crystalBudget=isAz?(a.azphel||0):budget('crystals'),route=isAz?ROUTES[state.class].azphel:activeRoute(),plan=isAz?m.azphel:m.boards,boardNext=routeSteps(route,nodes).find(x=>x.board===state.board&&!actual.has(x.id));
  $('board-icon-source').href=`https://aion2data.com/daevanion/${state.class}`;
  $('global-route-heading').textContent=isLeveling()?`Level ${currentLevel()} · unlocked PvE boards`:'All four PvE boards · what to buy next';
  $('board-section-description').textContent=isLeveling()?`Only boards unlocked by level ${currentLevel()} are included. Nezekan opens at 12, Zikel at 20, Vaizel at 30 and Triniel at 40. Tap a planned node to mark it obtained.`:'One connected purchase order spans Nezekan, Zikel, Vaizel and Triniel. The board tabs below show each part of that route. Azphel appears in PvP and uses its own currency.';
  renderGlobalBoardRoute(m,nodes);
  $('board-spent').textContent=a.context==='pvp'&&!isLeveling()?`${m.boards.spent}/${crystalBudget} PvE · ${m.azphel.spent}/${a.azphel||0} Azphel`:`${m.boards.spent} / ${crystalBudget} PvE crystals`;
  const wanted=isAz?[['PvPAmplifyDamage','PvP Damage Boost'],['PvPDecreaseDamage','PvP Damage Tolerance'],['AbnormalResistance','Status Resist'],['PvPAddDamage','PvP Attack']]:profile().kind==='healer'?[['Defense','Defense'],['HPMax','Max HP'],['CombatSpeed','Combat Speed'],['CoolTimeDecrease','Cooldown Reduction']]:[['AmplifyAllDamage','Damage Boost'],['DecreaseDamage','Damage Tolerance'],['CombatSpeed','Combat Speed'],['CoolTimeDecrease','Cooldown Reduction']];
  const shownEffects=isAz?m.azphelEffects:m.effects;
  $('board-summary').innerHTML=wanted.map(([key,label])=>{const meta=data().stats[key],v=shownEffects.stats[key]||0;return `<div><b>+${v/(meta?.div||1)}${meta?.pct?'%':''}</b><span>${label}</span></div>`}).join('');
  const available=a.context==='pvp'?allBoards():data().boards;
  $('board-tabs').innerHTML=available.map(b=>`<button type="button" data-board="${b.name}" class="${state.board===b.name?'active':''}" ${boardOpen(b.name)?'':`disabled title="Opens at level ${BOARD_UNLOCKS[b.name]}"`}>${b.name}<small>${boardOpen(b.name)?`${(b.name==='Azphel'?m.azphel:m.boards).perBoard[b.name]} / ${b.totalCost}`:`Opens Lv ${BOARD_UNLOCKS[b.name]}`}</small></button>`).join('');
  $('route-slider').max=crystalBudget;state.preview=Math.min(state.preview,crystalBudget);$('route-slider').value=state.preview;$('route-slider-value').textContent=state.preview;
  const preview=boardPlan(state.preview,isAz),board=available.find(b=>b.name===state.board),grid=new Map(board.nodes.map(n=>[`${n[1]}:${n[2]}`,n]));let html='';
  for(let r=1;r<=15;r++)for(let c=1;c<=15;c++){const n=grid.get(`${r}:${c}`);if(!n){html+='<span></span>';continue}const planned=preview.owned.has(n[0])||n[5]===0,obtained=actual.has(n[0]),kind=n[5]===0?'start':n[5]===4?'unique':typeof n[6]?.[0]?.[0]==='number'?'skill':'stat';html+=`<button type="button" class="node ${kind} ${planned?'planned':''} ${obtained?'obtained':''} ${boardNext?.id===n[0]?'next':''} ${state.node===n[0]?'selected':''}" data-node="${n[0]}" title="${esc(effectText(n))}${n[5]&&boardOpen(state.board)?' · click to mark obtained':''}" aria-label="${esc(effectText(n))}; row ${r}, column ${c}; ${obtained?'obtained':planned?'planned':'later'}" aria-pressed="${obtained}" ${boardOpen(state.board)?'': 'disabled'}>${nodeVisual(n)}</button>`}
  $('board-grid').innerHTML=html;const selected=state.node&&nodes.get(state.node)?.board===state.board?nodes.get(state.node).node:null;
  $('selected-node').innerHTML=selected?`<div class="selected-icon">${nodeVisual(selected)}</div><div><strong>${esc(effectText(selected))}</strong><small>Row ${selected[1]}, column ${selected[2]} · ${selected[5]} crystal${selected[5]===1?'':'s'} · ${selected[5]===0?'Start node':actual.has(selected[0])?'Obtained':preview.owned.has(selected[0])?'Planned within budget':'Planned later'}. ${selected[5]?'Click again to '+(actual.has(selected[0])?'unmark':'mark obtained')+'.':''}</small></div>`:`<strong>${state.board}</strong><small>${boardOpen(state.board)?'Teal = planned path · gold fill = marked obtained · outlined = next unmarked node on this board. Click a node to mark or unmark it.':`Locked until level ${BOARD_UNLOCKS[state.board]}. Nodes become selectable then.`}</small>`;
  const boardSkills={},boardStats={};for(const n of board.nodes){if(!preview.owned.has(n[0]))continue;for(const [key,value] of n[6]){if(typeof key==='number'){const name=data().skills[key]?.name||String(key);boardSkills[name]=(boardSkills[name]||0)+value}else boardStats[key]=(boardStats[key]||0)+value}}
  $('board-effect-intro').textContent=boardOpen(state.board)?`${state.board} projected totals from the planned route at ${state.preview} crystals. Gold nodes are those you marked obtained.`:`${state.board} opens at level ${BOARD_UNLOCKS[state.board]}. This board has no purchasable path yet.`;
  const statLabel={FixingDamage:'Attack Bonus',Defense:'Defense Bonus',HPMax:'HP',MPMax:'MP'};
  const skillRows=Object.entries(boardSkills).map(([name,value])=>[name,`+${value}`]);
  const statRows=Object.entries(boardStats).map(([key,value])=>{const meta=data().stats[key];return [statLabel[key]||meta?.name||key,`+${value/(meta?.div||1)}${meta?.pct?'%':''}`]});
  const effectGroup=(label,rows)=>rows.length?`<h4>${label}</h4>${rows.map(([name,value])=>`<div><span>${esc(name)}</span><b>${esc(value)}</b></div>`).join('')}`:'';
  $('board-effect-list').innerHTML=skillRows.length||statRows.length?effectGroup('Skill levels',skillRows)+effectGroup('Stats',statRows):'<span class="empty">No planned effects yet.</span>';
  let spent=0,number=0,boardSpent=0;const rows=[];for(const x of route){const n=nodes.get(x.id).node;spent+=n[5];if(x.board!==state.board)continue;number++;if(spent<=state.preview)boardSpent+=n[5];rows.push({number,spent,cost:n[5],label:effectText(n),id:x.id,row:n[1],col:n[2]})}
  $('purchase-intro').textContent=`${boardSpent} ${isAz?'Azphel':'PvE'} crystals on ${state.board} at preview ${state.preview}. Click a purchase to locate it on the grid.`;
  $('purchase-list').innerHTML=rows.map(x=>`<button type="button" data-purchase="${x.id}" class="purchase ${x.spent<=state.preview?'current':''} ${actual.has(x.id)?'obtained':''}"><span class="n">${x.number}.</span><span class="route-step-icon">${nodeVisual(nodes.get(x.id).node)}</span><span>${esc(x.label)}<small>r${x.row} · c${x.col} · total ${x.spent}${actual.has(x.id)?' · obtained':''}</small></span><span class="c">${x.cost} ✧</span></button>`).join('');
  const priority=new Set(masteryStages().slice(0,12).map(x=>x[0]));let total=0;const upcoming=[];for(const x of route){const n=nodes.get(x.id).node;total+=n[5];if(total<=plan.spent)continue;if(n[5]===4||typeof n[6]?.[0]?.[0]==='number'&&priority.has(data().skills[n[6][0][0]]?.name))upcoming.push({total,board:x.board,label:effectText(n)});if(upcoming.length>=5)break}
  $('board-next').innerHTML=upcoming.length?upcoming.map(x=>`<div class="next-unlock"><strong>${x.total} total</strong><span>${x.board}: ${esc(x.label)}</span></div>`).join(''):'<p>All key nodes on this route are funded.</p>';
  const method=isAz?ROUTES[state.class].methods.azphel:ROUTES[state.class].methods[a.context];
  $('route-footnote').textContent=`${method}. PvE crystal totals follow one precomputed, connected route across ${isLeveling()?'boards unlocked at this level':'all four boards'}; increasing the total extends its planned prefix. Obtained marks skip completed steps in the next-click list, but do not re-optimize the route if you buy different nodes or switch play context. The weighted order is a recommendation, not a measured combat optimum. Azphel has its own currency and no skill levels.`;
  const weights=isAz?{skills:{},stats:activeWeights()?.stats||{}}:activeWeights();
  const topSkills=Object.entries(weights.skills||{}).sort((x,y)=>y[1]-x[1]).slice(0,3).map(x=>x[0]);
  const topStats=Object.entries(weights.stats||{}).filter(([key])=>isAz?key.startsWith('PvP')||key.startsWith('Abnormal'):!key.startsWith('PvP')).sort((x,y)=>y[1]-x[1]).slice(0,3).map(([key])=>data().stats[key]?.name||key);
  const boardPurpose={Nezekan:'Combat Speed and Cooldown Reduction corners support faster actions; inner branches give early skill ranks.',Zikel:'Damage Boost and Damage Tolerance corners trade offensive pressure against damage taken.',Vaizel:'Critical Damage Boost and Critical Damage Tolerance support burst and burst defense.',Triniel:'Multi-Hit Chance and Multi-Hit Resist support repeated hits and defense.',Azphel:'PvP Damage Boost, PvP Damage Tolerance and status resistance are the dedicated PvP gains.'};
  const bought=rows.filter(x=>x.spent<=state.preview&&x.cost>=2).slice(-3).map(x=>x.label);
  const nextRows=rows.filter(x=>x.spent>state.preview).slice(0,2).map(x=>x.label);
  $('board-rationale').innerHTML=`<h3>Why this ${esc(state.board)} path?</h3><p><b>${esc({party:'Group PvE',solo:'Solo',pvp:'PvP'}[a.context])}:</b> ${esc(boardPurpose[state.board])}</p><p><b>Priority skills:</b> ${esc(topSkills.join(', ')||'Azphel has no skill nodes')}. <b>Priority stats:</b> ${esc(topStats.join(', '))}.</p><p><b>At ${state.preview} crystals:</b> ${esc(bought.join(' · ')||'follow the connected approach to the first key node')}.</p><p><b>Next on this board:</b> ${esc(nextRows.join(' → ')||'this board is fully planned')}.</p><p><b>Route basis:</b> ${esc(method)}. Stat and skill weights come from the linked class board guide.</p><a href="${esc(data().sources.route)}" target="_blank" rel="noopener noreferrer">See source route and weights ↗</a>`;
}
function titleName(t,faction){return typeof t.name==='string'?t.name:t.name[faction]}
const TITLE_BY_NAME=new Map(TITLE_CATALOG.map(t=>[t.name.toLowerCase(),t]));
const TITLE_BY_ID=new Map(TITLE_CATALOG.map(t=>[t.id,t]));
function titleKey(t,faction){return TITLE_BY_NAME.get(titleName(t,faction).toLowerCase())?.id||t.id}
function titleOwned(t,owned,faction){return !!(owned[titleKey(t,faction)]||owned[t.id])}
function eligibleTitle(t,faction){return t.faction==='Both factions'||t.faction.toLowerCase()===faction}
function titleScore(t,slot,context){
  const s=t.equip||'',n=(pattern)=>Number((s.match(pattern)?.[1]||'0').replace(/,/g,'')),pvp=context==='pvp',tank=state.class==='templar',healer=profile().kind==='healer';
  if(slot==='Attack')return (pvp?n(/PvP Damage Boost \+([\d.]+)%/)*140:n(/PvE Damage Boost \+([\d.]+)%/)*140)+n(/(?:^|, )Damage Boost \+([\d.]+)%/)*95+n(/Attack Bonus \+([\d.]+)/)*2+n(/Critical Hit \+([\d.]+)/)*.4+n(/PvP Attack \+([\d.]+)/)*2;
  if(slot==='Defense')return n(/Boss Damage Tolerance \+([\d.]+)%/)*(tank&&!pvp?160:55)+n(/PvE Damage Tolerance \+([\d.]+)%/)*(pvp?15:100)+n(/PvP Damage Tolerance \+([\d.]+)%/)*(pvp?150:10)+n(/(?:^|, )Damage Tolerance \+([\d.]+)%/)*90+n(/HP \+([\d,]+)/)*.08+n(/Defense Bonus \+([\d,]+)/)*.23+n(/Block \+([\d,]+)/)*.3;
  return n(/Cooldown Reduction \+([\d.]+)%/)*(healer?115:90)+n(/Combat Speed \+([\d.]+)%/)*75+n(/HP \+([\d,]+)/)*(tank||healer?0.1:0.05)+n(/Move Speed \+([\d.]+)%/)*25+n(/Stamina \+([\d,]+)/)*.05;
}
function titlePriority(slot){
  if(slot==='Attack')return ['unbound','guardian','nice','cube'];
  if(slot==='Defense')return state.class==='templar'?['rule','dominator','saint','hello']:['dominator','saint','rule','hello'];
  return state.class==='templar'||profile().kind==='healer'?['through','closet','episode','legion']:['closet','through','episode','legion'];
}
function renderTitles(){
  const a=account(),owned=a.titlesOwned ||= {},faction=a.faction==='asmodian'?'asmodian':'elyos';
  $('faction-select').value=faction;
  const count=TITLE_CATALOG.filter(t=>owned[t.id]&&eligibleTitle(t,faction)).length;
  $('titles-count').textContent=`${count} earned · ${TITLE_CATALOG.length} titles listed`;
  $('titles-role-note').textContent=a.context==='pvp'?'PvP: favor PvP Damage Boost, PvP Damage Tolerance and escape or cooldown uptime; equip picks use a simple effect heuristic, so compare the matchup.':state.class==='templar'?'Templar: prioritize boss tolerance and a cooldown/HP Other title while retaining an Attack title for threat and damage.':profile().kind==='healer'?'Healer: the Attack title supports damage between heals; Defense and Other improve survival and cooldown uptime. These titles do not directly add a verified heal multiplier.':'Damage class: the Attack slot is your PvE damage title; Defense and Other preserve uptime and survivability.';
  const previews=[];
  $('title-grid').innerHTML=['Attack','Defense','Other'].map(slot=>{
    const priority=titlePriority(slot),items=priority.map(id=>TITLES.find(t=>t.id===id)),available=TITLE_CATALOG.filter(t=>t.slot===slot&&eligibleTitle(t,faction)&&owned[t.id]);
    const pick=available.sort((x,y)=>titleScore(y,slot,a.context)-titleScore(x,slot,a.context))[0];
    const bestCurated=items.find(t=>titleOwned(t,owned,faction));
    const pickIndex=bestCurated?priority.indexOf(bestCurated.id):priority.length;
    const upgrade=items.slice(0,pickIndex).reverse().find(t=>!titleOwned(t,owned,faction));
    const collection=items.slice().reverse().find(t=>!titleOwned(t,owned,faction));
    const next=upgrade||collection;
    previews.push(`${slot}: ${pick?pick.name:'none marked earned'}`);
    return `<article class="title-column"><div class="title-slot">${slot} slot</div><h3>${pick?esc(pick.name):'No earned title marked'}</h3><p class="title-current">${pick?`Equip now · ${esc(pick.equip)}`:'Mark a title below or in the full catalog when earned.'}</p><div class="title-next"><b>${upgrade?pick?'Next path upgrade':'First path title':next?'Next collection':'Path complete'}</b><span>${next?`${esc(titleName(next,faction))} · ${esc(next.earn)}`:'Every title on this suggested path is marked earned.'}</span></div><div class="title-options">${items.slice().reverse().map(t=>`<div class="title-option ${titleOwned(t,owned,faction)?'earned':''}"><label><input type="checkbox" data-title="${esc(titleKey(t,faction))}" data-legacy-title="${t.id}" ${titleOwned(t,owned,faction)?'checked':''}><strong>${esc(titleName(t,faction))}</strong></label><small><b>Equipped:</b> ${esc(t.equip)}</small><small><b>Owned:</b> ${esc(t.owned)}</small><small><b>Earn:</b> ${esc(t.earn)}</small><a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">Check source ↗</a></div>`).join('')}</div></article>`
  }).join('');
  $('title-preview').textContent=`${previews.join(' · ')}. Every earned collection effect stays active. Search all ${TITLE_CATALOG.length} titles in the Titles tab.`;
  renderTitleCatalog();
}
function renderTitleCatalog(){
  const a=account(),owned=a.titlesOwned||{},query=state.titleSearch.trim().toLowerCase();
  $('title-search').value=state.titleSearch;$('title-slot-filter').value=state.titleSlot;$('title-owned-filter').value=state.titleOwnership;$('title-faction-filter').value=state.titleFaction;
  const items=TITLE_CATALOG.filter(t=>{
    if(state.titleSlot!=='all'&&(t.slot||'Cosmetic')!==state.titleSlot)return false;
    if(state.titleOwnership==='owned'&&!owned[t.id]||state.titleOwnership==='unowned'&&owned[t.id])return false;
    if(state.titleFaction==='character'&&!eligibleTitle(t,a.faction))return false;
    return !query||[t.name,t.group,t.grade,t.faction,t.slot||'Cosmetic',t.equip,t.owned,t.source].some(v=>String(v).toLowerCase().includes(query));
  });
  $('title-catalog-count').textContent=`Showing ${items.length} of ${TITLE_CATALOG.length} Global titles`;
  $('title-catalog-list').innerHTML=items.length?items.map(t=>`<article class="catalog-title ${owned[t.id]?'earned':''}"><label><input type="checkbox" data-catalog-title="${esc(t.id)}" ${owned[t.id]?'checked':''} aria-label="Earned ${esc(t.name)}"><strong>${esc(t.name)}</strong></label><div class="catalog-badges"><span>${esc(t.slot||'Cosmetic')}</span><span>${esc(t.grade)}</span><span>${esc(t.faction)}</span><span>${esc(t.group)}</span></div><p><b>Equipped:</b> ${esc(t.equip)} <b>Owned:</b> ${esc(t.owned)}</p><small><b>Earn:</b> ${esc(t.source)} · <a href="${esc(t.url)}" target="_blank" rel="noopener noreferrer">source ↗</a></small></article>`).join(''):'<p class="empty">No titles match those filters.</p>';
}
function renderSources(){
  const d=data(),p=profile(),firstSkill=Object.values(d.skills)[0];const cards=[
    ['Global service scope','Daeva Architect uses Global client data across Global regions. Taiwan and Korea have separate clients and progression rules; their items and point tables are outside this planner.',`https://aion2.gg/guides/global-vs-asia`,'Compare client rules'],
    ['Searchable Global equipment',`${GEAR_CATALOG.items.length} equipment, Arcana and wing entries from Aion2Data Global client ${GEAR_CATALOG.clientVersion}, retrieved ${GEAR_CATALOG.retrieved}. Item icons use game asset paths; live tooltips show base values. Newer Global patch items may be absent until the index is refreshed. Record your own soul binding and skill rolls. Game art © NCSOFT.`,`https://aion2data.com/creators`,'Open reuse and data source'],
    ['Levels 1–45 point table','The Global client level table supplies the level-only Mastery, Stigma, slot and crystal baseline. Quest, Sealed Dungeon and other rewards are additional. This planner carries user-entered extras forward as the level changes.',`https://aion2data.com/leveling`,'Open level table'],
    ['Skill and board level gates',`The Global class table supplies each ${p.name} skill's unlock level. Nezekan, Zikel, Vaizel and Triniel open at 12, 20, 30 and 40; Stigma slots open at 22, 27, 32 and 37.`, `https://aion2data.com/classes/${state.class}`,'Open class unlocks'],
    ['Mastery rank gates','SkillAcquireData limits rank 2 to the unlock level, then adds one purchasable rank every three character levels. The leveling plan respects that gate and buys usable early skills before chasing rank 8. Point costs are 1 for ranks 2–4, 2 for 5–7, and 4 for 8–10.',`https://aion2data.com/skills/${firstSkill.slug}`,'Open skill rank table'],
    ['Combat Power calculation','The game calculates Combat Power server-side. Gear, boards and other permanent systems contribute; the client files do not provide a formula for predicting your final score.',`https://aion2data.com/get-stronger`,'Open stat sources'],
    ['Global client nodes','Board positions, costs, effects and skill names from Aion2Data Global client tables. Compare tooltips after a patch.',d.sources.nodes,'Open board data'],
    ['Context routes & weights',`Group, Solo and PvP follow different connected routes. ${ROUTES[state.class].methods[account().context]}. Azphel is a separately funded PvP board.`,d.sources.route,'Open class route'],
    ['Specialty choices','Aion2Codex class guide PvE picks and option text; gear or Arcana can unlock later choices. Compare live tooltips.',`https://aion2codex.com/guides/${state.class}`,'Open specialties'],
    ['Stigmas and skills','Global class skill and stigma effects; the four chosen slots prioritize this planner’s role.',`https://aion2.grimvane.app/companion/wiki/${state.class}-skills/`,'Open class skills'],
    ['Macro setup','The in-game macro uses hotbar keys, up to four skills per stack and delays per step. The layouts are starting points.',state.class==='templar'?`https://mobalytics.gg/gamebase/guides/aion-2-templar-pve-build`:`https://aion2.grimvane.app/companion/wiki/macros-guide/`,'Open macro guide'],
    ['1–8 key layout','The number-key placement is this planner’s ergonomic recommendation. Defiance shares Space with jump/glide by default; the separate Defiance key setting is optional.',`https://couga54.github.io/aion2-guides/en/settings/`,'Open control settings'],
    ['All Global titles','The searchable catalog includes 528 Global titles in the current source, including cosmetic titles and both faction variants. Equipped recommendations use earned titles and a simple role heuristic.',`https://metabot.gg/en/aion-2/titles`,'Open Global title catalog'],
    ['Class build context',`${p.name} is planned as ${p.role.toLowerCase()}. Compare alternate damage or support presets before swapping roles.`,`https://metabot.gg/en/aion-2/guides/class-builds-guide`,'Open all-class guide']
  ];$('source-cards').innerHTML=cards.map(([title,body,url,label])=>`<div class="source-card"><b>${esc(title)}</b><p>${esc(body)}</p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a></div>`).join('');
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;$('mobile-more-menu').hidden=true;$('mobile-more-button').setAttribute('aria-expanded','false');render()}));
document.querySelectorAll('.theme-picker [data-theme]').forEach(b=>b.addEventListener('click',()=>{theme=b.dataset.theme;try{localStorage.setItem('daeva-architect-theme',theme)}catch(_){}applyTheme()}));
$('mobile-more-button').addEventListener('click',()=>{const open=$('mobile-more-menu').hidden;$('mobile-more-menu').hidden=!open;$('mobile-more-button').setAttribute('aria-expanded',String(open))});
$('mobile-more-menu').addEventListener('click',e=>{const b=e.target.closest('[data-more-tab]');if(!b)return;state.tab=b.dataset.moreTab;$('mobile-more-menu').hidden=true;$('mobile-more-button').setAttribute('aria-expanded','false');render()});
$('mobile-next-action').addEventListener('click',()=>{state.tab=$('mobile-next').dataset.targetTab||'mastery';render();document.querySelector('.tab-panel.active')?.scrollIntoView({behavior:'smooth',block:'start'})});
function clearMasterySearch(){state.masterySearch='';$('mastery-search').value=''}
$('class-buttons').addEventListener('click',e=>{const b=e.target.closest('[data-class]');if(!b)return;state.class=b.dataset.class;state.board='Nezekan';state.preview=budget('crystals');state.node=null;clearMasterySearch();render()});
function useBudget(values){Object.assign(account(),values);state.preview=account().crystals;state.node=null;render()}
$('fresh-45-button').addEventListener('click',()=>useBudget({...FRESH_45,azphel:0}));
function setLevel(value){leveling().level=clamp(value,1,45);if(!boardOpen(state.board))state.board='Nezekan';state.preview=budget('crystals');state.node=null;clearMasterySearch();render()}
$('leveling-mode').addEventListener('click',()=>{const a=account();if(!isLeveling()){a.endgameContext=a.context;a.context=a.levelingContext||'solo'}a.journey='leveling';state.board='Nezekan';state.preview=budget('crystals');state.tab='overview';clearMasterySearch();render()});
$('endgame-mode').addEventListener('click',()=>{const a=account();if(isLeveling()){a.levelingContext=a.context;a.context=a.endgameContext||'party'}a.journey='endgame';state.preview=budget('crystals');state.tab='overview';clearMasterySearch();render()});
$('level-input').addEventListener('change',e=>setLevel(e.target.value));
$('level-input').addEventListener('input',e=>{if(e.target.value!==''){leveling().level=clamp(e.target.value,1,45);save()}});
$('level-slider').addEventListener('input',e=>setLevel(e.target.value));
$('level-minus').addEventListener('click',()=>setLevel(currentLevel()-1));
$('level-plus').addEventListener('click',()=>setLevel(currentLevel()+1));
$('level-milestones').addEventListener('click',e=>{const b=e.target.closest('[data-milestone]');if(b)setLevel(b.dataset.milestone)});
$('handoff-button').addEventListener('click',()=>{if(!isLeveling()||currentLevel()<45)return;const a=account(),totals=Object.fromEntries(['mastery','stigma','crystals'].map(key=>[key,budget(key)]));Object.assign(a,totals);a.journey='endgame';a.context=a.endgameContext||'party';state.preview=a.crystals;state.tab='overview';render()});
for(const [id,key,max] of [['mastery-input','mastery',462],['stigma-input','stigma',300],['crystal-input','crystals',570]]){
  const update=e=>{const value=clamp(e.target.value,isLeveling()?levelReward()[key]:0,max);if(isLeveling())setLevelingBudget(key,value);else account()[key]=value;if(key==='crystals'&&state.board!=='Azphel')state.preview=budget('crystals');render()};
  $(id).addEventListener('input',e=>{if(e.target.value==='')return;const value=clamp(e.target.value,isLeveling()?levelReward()[key]:0,max);if(isLeveling())setLevelingBudget(key,value);else account()[key]=value;save()});
  $(id).addEventListener('change',update);
}
$('azphel-input').addEventListener('input',e=>{account().azphel=clamp(e.target.value,0,232);if(state.board==='Azphel')state.preview=account().azphel;save()});
$('azphel-input').addEventListener('change',e=>{account().azphel=clamp(e.target.value,0,232);if(state.board==='Azphel')state.preview=account().azphel;render()});
for(const [id,ctx] of [['party-button','party'],['solo-button','solo'],['pvp-button','pvp']])$(id).addEventListener('click',()=>{if(isLeveling()&&ctx==='pvp')return;account().context=ctx;account()[isLeveling()?'levelingContext':'endgameContext']=ctx;if(ctx!=='pvp'&&state.board==='Azphel')state.board='Nezekan';state.preview=state.board==='Azphel'?(account().azphel||0):budget('crystals');render()});
$('macro-bind').addEventListener('change',e=>{account().macroBind=e.target.value;render()});
$('title-open').addEventListener('click',()=>{state.tab='titles';render();document.querySelector('.tabs').scrollIntoView({behavior:'smooth',block:'start'})});
$('faction-select').addEventListener('change',e=>{account().faction=e.target.value==='asmodian'?'asmodian':'elyos';render()});
$('title-grid').addEventListener('change',e=>{const id=e.target.dataset.title;if(!id||!TITLE_BY_ID.has(id))return;account().titlesOwned ||= {};delete account().titlesOwned[e.target.dataset.legacyTitle];account().titlesOwned[id]=e.target.checked;render()});
$('title-catalog-list').addEventListener('change',e=>{const id=e.target.dataset.catalogTitle;if(!id||!TITLE_BY_ID.has(id))return;account().titlesOwned ||= {};account().titlesOwned[id]=e.target.checked;render()});
$('title-search').addEventListener('input',e=>{state.titleSearch=e.target.value;renderTitleCatalog()});
$('title-slot-filter').addEventListener('change',e=>{state.titleSlot=e.target.value;renderTitleCatalog()});
$('title-owned-filter').addEventListener('change',e=>{state.titleOwnership=e.target.value;renderTitleCatalog()});
$('title-faction-filter').addEventListener('change',e=>{state.titleFaction=e.target.value;renderTitleCatalog()});
$('mastery-search').addEventListener('input',e=>{state.masterySearch=e.target.value;renderMastery(model())});
$('mastery-level-context').addEventListener('click',e=>{if(!e.target.closest('[data-reset-level-mastery]'))return;setLevelingBudget('mastery',levelReward().mastery);render()});
$('reset-button').addEventListener('click',()=>{state.accounts[state.class]=DEFAULT_ACCOUNT(state.class);state.preview=FRESH_45.crystals;state.node=null;clearMasterySearch();render()});
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
$('board-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-board]');if(b&&boardOpen(b.dataset.board)){state.board=b.dataset.board;state.preview=state.board==='Azphel'?(account().azphel||0):budget('crystals');state.node=null;renderBoards(model())}});
$('global-board-allocation').addEventListener('click',e=>{const b=e.target.closest('[data-board-jump]');if(!b||!boardOpen(b.dataset.boardJump))return;state.board=b.dataset.boardJump;state.preview=budget('crystals');state.node=null;renderBoards(model())});
$('global-route-next').addEventListener('click',e=>{const b=e.target.closest('[data-route-node]');if(!b)return;state.board=b.dataset.routeBoard;state.preview=budget('crystals');state.node=Number(b.dataset.routeNode);renderBoards(model());document.querySelector('.node.selected')?.scrollIntoView({behavior:'smooth',block:'center',inline:'center'})});
$('board-grid').addEventListener('click',e=>{const b=e.target.closest('[data-node]');if(!b||!boardOpen(state.board))return;const id=Number(b.dataset.node),node=nodeMap().get(id)?.node;state.node=id;if(node?.[5]>0){const marked=obtainedNodes();if(marked.has(id))marked.delete(id);else marked.add(id);storeObtained(marked)}renderBoards(model())});
$('mark-planned-button').addEventListener('click',()=>{const marked=obtainedNodes(),nodes=nodeMap();for(const step of routeSteps(activeRoute(),nodes))if(step.total<=budget('crystals'))marked.add(step.id);storeObtained(marked);renderBoards(model())});
$('clear-obtained-button').addEventListener('click',()=>{const nodes=nodeMap();storeObtained(new Set([...obtainedNodes()].filter(id=>nodes.get(id).board==='Azphel')));renderBoards(model())});
$('purchase-list').addEventListener('click',e=>{const b=e.target.closest('[data-purchase]');if(b){state.node=Number(b.dataset.purchase);renderBoards(model())}});
$('route-slider').addEventListener('input',e=>{state.preview=clamp(e.target.value,0,state.board==='Azphel'?(account().azphel||0):budget('crystals'));renderBoards(model())});
initGear();state.preview=state.class?budget('crystals'):FRESH_45.crystals;render();
