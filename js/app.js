const $ = id => document.getElementById(id);
const CLASS_ORDER = ['templar','gladiator','assassin','ranger','sorcerer','spiritmaster','cleric','chanter'];
const BOARD_NAMES = ['Nezekan','Zikel','Vaizel','Triniel'];
const ALL_BOARD_NAMES = [...BOARD_NAMES,'Azphel'];
const FRESH_45 = {mastery:203,stigma:29,crystals:136};
const BOARD_UNLOCKS = {Nezekan:12,Zikel:20,Vaizel:30,Triniel:40,Azphel:45};
const LEVEL_MILESTONES = [[4,'First point'],[12,'Nezekan'],[20,'Zikel'],[22,'Stigma I'],[23,'Stigma points'],[27,'Stigma II'],[30,'Vaizel'],[32,'Stigma III'],[37,'Stigma IV'],[40,'Triniel'],[45,'Endgame']];
// The first purchases during leveling go to skills available and useful in the
// opening rotation. Higher targets are still limited by SkillAcquireData gates.
// Verified Global passive-rank exception (2.0.7.0): level 21/23/25 passives
// can be trained to rank 10 immediately on acquisition.
const UNGATED_MASTERY_PASSIVES = {
  templar:['Fury','Survival Willpower','Block Pain'],
  gladiator:['Experienced Counterstrike','Survival Willpower','Murderous Burst'],
  assassin:['Defense Break','Revitalization Contract','Determination'],
  ranger:['Melee Fire','Revitalization Contract',"Hunter's Soul"],
  sorcerer:['Grace of Enhancement','Revitalization Contract','Vitality Evaporation'],
  spiritmaster:['Spirit Communion','Revitalization Contract','Element Unification'],
  cleric:["Earth's Grace",'Survival Willpower','Radiant Benediction'],
  chanter:["Earth's Promise",'Survival Willpower',"Wind's Promise"]
};
const LEVELING_PASSIVE_PRIORITY = {
  templar:['Fury','Insulting Roar','Enhance Health'],
  gladiator:['Experienced Counterstrike','Identify Weakness'],
  assassin:['Defense Break','Apply Poison'],
  ranger:['Focused Eye',"Hunter's Resolve",'Melee Fire'],
  sorcerer:['Grace of Enhancement','Fire Mark'],
  spiritmaster:['Spirit Communion','Mental Focus'],
  cleric:['Healing Enhancement',"Earth's Grace"],
  chanter:['Attack Preparation',"Earth's Promise"]
};
const LEVELING_MASTERY_CORE = {
  templar:[['Pummel',5],['Judgment',5],['Vicious Strike',5],['Enhance Health',5],['Insulting Roar',5],['Fury',5],['Punishment',5],['Annihilate',5]],
  gladiator:[['Keen Strike',5],['Rending Blow',5],['Overhead Slam',5],['Sword Aura Rampage',5],['Leaping Slam',4]],
  assassin:[['Quick Slice',5],['Savage Roar',5],['Heart Gore',5],['Ambush',5],['Shadowstrike',4]],
  ranger:[['Snipe',5],['Tempest Shot',5],['Snare Shot',5],['Drill Dart',5],['Marking Shot',4]],
  sorcerer:[['Flame Arrow',5],['Ice Chain',5],['Firestorm',5],['Blaze',4],['Bittercold Wind',3]],
  spiritmaster:[['Cold Shock',5],['Combustion',5],['Spirit Strike',5],['Summon: Fire Spirit',5],['Jointstrike: Curse',4]],
  cleric:[["Earth's Retribution",5],['Judgment Thunder',5],['Warm Benediction',5],['Divine Aura',5],['Chain of Torment',4]],
  chanter:[['Onslaught',5],['Incandescent Blow',5],['Rushing Smash',5],['Impactful Crush',5],['Blessing of Life',4]]
};
const LEVELING_MASTERY_NEXT = {
  templar:['Pummel','Judgment','Punishment','Annihilate','Vicious Strike','Enhance Health','Insulting Roar','Fury'],
  gladiator:['Overhead Slam','Rending Blow','Ruinous Blow','Keen Strike','Crushing Wave'],
  assassin:['Heart Gore','Quick Slice','Insignia Explosion','Savage Roar','Ambush'],
  ranger:['Snipe','Deadshot','Tempest Shot','Drill Dart','Gale Arrow'],
  sorcerer:['Firestorm','Blaze','Hellfire','Flame Arrow','Ice Chain','Bittercold Wind'],
  spiritmaster:['Combustion','Elemental Fusion','Cold Shock','Summon: Fire Spirit','Jointstrike: Curse'],
  cleric:['Radiant Recovery','Condemnation',"Earth's Retribution",'Healing Light','Chain of Torment'],
  chanter:['Dark Crush','Onslaught','Recuperation','Spinning Strike','Incandescent Blow']
};
const DEFAULT_ACCOUNT = (cls='templar') => ({...FRESH_45,azphel:0,context:'party',journey:'endgame',endgameContext:'party',levelingContext:'solo',leveling:{level:1,extraByLevel:{}},gear:{},equipment:{},currentRanks:{},manualMastery:null,manualStigma:null,customStigmas:null,customSpecialties:{},obtainedNodes:[],boardMode:'recommended',customNodes:[],customAzphelNodes:[],titlesOwned:{},faction:'elyos',macroBind:'RMB',goalTarget:['cleric','chanter'].includes(cls)?0:cls==='templar'?60000:100000,goalObserved:0,gearCpTarget:0});
let saved = {};
try { saved = JSON.parse(localStorage.getItem('daeva-architect-all-v1') || localStorage.getItem('aion2-pathfinder-all-v3') || '{}') || {}; } catch (_) {}
let state = {class:CLASS_ORDER.includes(saved.class)?saved.class:null,accounts:saved.accounts||{},gearView:['inventory','inspect'].includes(saved.gearView)?saved.gearView:null,tab:'overview',board:'Nezekan',preview:FRESH_45.crystals,node:null,titleSearch:'',titleSlot:'all',titleOwnership:'all',titleFaction:'all'};
let theme = 'aether';
try { const storedTheme=localStorage.getItem('daeva-architect-theme')||localStorage.getItem('aion2-pathfinder-theme');if(['aether','sanctum','abyss'].includes(storedTheme))theme=storedTheme; } catch (_) {}
function applyTheme(){document.body.dataset.theme=theme;document.querySelectorAll('.theme-picker [data-theme]').forEach(b=>{b.classList.toggle('active',b.dataset.theme===theme);b.setAttribute('aria-pressed',b.dataset.theme===theme)});document.querySelector('meta[name="theme-color"]').content=theme==='sanctum'?'#eaf2f0':theme==='abyss'?'#160f25':'#0b1c2c'}
function account(){
  if(!state.accounts[state.class])state.accounts[state.class]=DEFAULT_ACCOUNT(state.class);
  const a=state.accounts[state.class];
  delete a.gearCombatPower; // Legacy manually entered CP is no longer a build input.
  if(PROFILES[state.class]?.kind!=='healer')delete a.goalObserved;
  return a;
}
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
let liveRoute=null,liveRouteKey='',liveRouteBasis=null;
function activeRoute(){const route=liveRoute||ROUTES[state.class][account().context];return isLeveling()?route.filter(x=>boardOpen(x.board)):route}
function customMode(){return account().boardMode==='custom'}
function customIds(azphel=false){const valid=nodeMap();return (azphel?account().customAzphelNodes||[]:account().customNodes||[]).filter(id=>valid.has(id)&&(azphel?valid.get(id).board==='Azphel':valid.get(id).board!=='Azphel')&&(!isLeveling()||boardOpen(valid.get(id).board)))}
function plannedRoute(azphel=false){return customMode()?customIds(azphel).map(id=>({board:nodeMap().get(id).board,id})):azphel?ROUTES[state.class].azphel:activeRoute()}
function connectedToEarlier(ids){const nodes=nodeMap(),seen=new Set();for(const id of ids){const entry=nodes.get(id);if(!entry)return false;const n=entry.node,board=entry.board,neighbors=allBoards().find(b=>b.name===board).nodes.filter(x=>Math.abs(x[1]-n[1])+Math.abs(x[2]-n[2])===1);if(!neighbors.some(x=>x[5]===0||seen.has(x[0])))return false;seen.add(id)}return true}
function setCustomNode(id){
  const entry=nodeMap().get(id);if(!entry||entry.node[5]===0)return;
  const azphel=entry.board==='Azphel',key=azphel?'customAzphelNodes':'customNodes',ids=[...(account()[key]||[])],at=ids.indexOf(id);
  if(at>=0){ids.splice(at,1);if(!connectedToEarlier(ids)){boardEditNotice='Remove dependent tiles first, starting at the end of that branch.';return}account()[key]=ids;boardEditNotice='Tile removed from your custom plan.'}
  else {const next=[...ids,id],spent=ids.reduce((sum,x)=>sum+nodeMap().get(x).node[5],0)+entry.node[5],limit=azphel?account().azphel||0:budget('crystals');if(!connectedToEarlier(next)){boardEditNotice='Choose a tile touching the start or an already planned tile on this board.';return}if(spent>limit){boardEditNotice=`This plan needs ${spent} ${azphel?'Azphel':'PvE'} crystals; you have ${limit}. Increase your total first.`;return}account()[key]=next;boardEditNotice='Tile added to your custom plan.'}
  save();
}
let boardEditNotice='';
function activeWeights(){
  const base=ROUTES[state.class].weights[account().context];
  const advised=typeof adviceFor==='function'?adviceFor(state.class,account().context):null;
  if(!advised)return base;
  const skills={...base.skills};
  // Strongest supported class/core skill recommendations lead board optimization,
  // rather than relying only on the previous generic DPS coefficient weights.
  (advised.core||[]).forEach((name,i)=>{skills[name]=Math.max(skills[name]||0,64-i*6)});
  (advised.support||[]).forEach((name,i)=>{skills[name]=Math.max(skills[name]||0,28-i*3)});
  return {...base,skills};
}
function recommendedStigmas(){
  const standard=profile().stigmas;
  const variants={templar:{solo:['Doom Shield','Noble Armor',"Empyrean Lord's Punishment",'Executing Blade'],pvp:['Noble Armor','Doom Shield','Taunt','Second Skin']},cleric:{solo:['Earth Punishment','Noble Aura','Prayer of Amplification','Light of Protection'],pvp:['Prayer of Amplification','Light of Protection',"Yustiel's Power",'Absolution']},sorcerer:{pvp:['Element Enhancement','Steel Barrier','Soul Freeze','Hibernation']},gladiator:{pvp:["Zikel's Blessing",'Focused Block','Lifestealing Blade','Armor of Balance']},assassin:{pvp:['Evasion Contract','Smoke Bomb','Swift Contract','Illusive Clone']},ranger:{pvp:["Vaizel's Authority",'Mother Nature\'s Breath','Ensnaring Trap','Stealth']},spiritmaster:{pvp:['Summon: Ancient Spirit',"Enhance: Spirit's Benediction",'Seize Magic','Cry of Terror']},chanter:{solo:['Undefeated Mantra','Sprint Mantra','Power of the Storm',"Marchutan's Wrath"],pvp:['Undefeated Mantra','Barrier Spell','Healing Touch','Focused Defense']}};
  const advised=typeof adviceFor==='function'?adviceFor(state.class,account().context):null;
  const result=advised?.stigmas||variants[state.class]?.[account().context]||standard;
  return result.length===4&&new Set(result).size===4&&result.every(name=>STIGMAS[state.class]?.[name])?result:standard;
}
function activeStigmas(){
  const chosen=account().customStigmas;
  if(Array.isArray(chosen)&&chosen.length===4&&new Set(chosen).size===4&&chosen.every(n=>STIGMAS[state.class]?.[n]))return chosen;
  return recommendedStigmas();
}
function modifiedBuild(){
  const a=account();
  return a.boardMode==='custom'||a.manualMastery!==null&&a.manualMastery!==undefined||
    a.manualStigma!==null&&a.manualStigma!==undefined||
    !!a.customStigmas||Object.keys(a.customSpecialties||{}).length>0;
}
function specialtySlots(level){return level>=20?3:level>=12?2:level>=8?1:0}
function manualAllocation(raw,names,budget,costOfRank,minimum,maximum){
  const values=Object.fromEntries(names.map(name=>[name,clamp(raw[name]??minimum,minimum,typeof maximum==='function'?maximum(name):maximum)]));
  let spent=names.reduce((sum,name)=>{
    for(let rank=minimum+1;rank<=values[name];rank++)sum+=costOfRank(rank);
    return sum;
  },0);
  // A level or point-budget reduction must never produce illegal projections.
  // Drop lowest-priority investments in the rendered plan, not from the saved
  // manual snapshot, so they can return when the user's budget rises again.
  let adjusted=false;
  while(spent>budget){
    let reduced=false;
    for(const name of names.slice().reverse())if(values[name]>minimum){
      spent-=costOfRank(values[name]);values[name]--;reduced=true;adjusted=true;break;
    }
    if(!reduced)break;
  }
  return {levels:values,spent,next:null,adjusted};
}
function stigmaTotal(rank){let value=0;for(let r=1;r<=rank;r++)value+=stigmaCost(r);return value}
function masteryCost(rank){return rank<=4?1:rank<=7?2:4}
function masteryTotal(rank){let points=0;for(let n=2;n<=rank;n++)points+=masteryCost(n);return points}
function stigmaCost(rank){return rank<=5?1:rank<=10?2:rank<=15?4:8}
function masteryRankCap(name){
  if(!isLeveling())return 10;
  const unlocked=SKILL_UNLOCKS[state.class][name];
  if(!unlocked||currentLevel()<unlocked)return 1;
  if(UNGATED_MASTERY_PASSIVES[state.class]?.includes(name))return 10;
  return Math.min(10,2+Math.floor((currentLevel()-unlocked)/3));
}
function masteryStages(){
  const advised=typeof adviceFor==='function'?adviceFor(state.class,account().context):null;
  if(advised){
    const a=account(),skillSet=new Set(skillNames()),unlocks=SKILL_UNLOCKS[state.class];
    const pick=names=>(names||[]).filter((name,i)=>skillSet.has(name)&&(unlocks[name]||1)<=currentLevel()&&(names.indexOf(name)===i));
    const core=pick(advised.core),support=pick(advised.support),rest=pick(skillNames().filter(name=>!core.includes(name)&&!support.includes(name)));
    const bonuses=effects(obtainedNodes()).skills,equipped=gearSkillLevels();
    // A character's ACTUAL equipment is optional input, never invented gear.
    // Use those bonuses to avoid wasting scarce purchased ranks on thresholds
    // already attained by the player. This changes a recommendation, not its
    // modified-build flag.
    const threshold=(name,target)=>Math.max(1,Math.min(10,target-(bonuses[name]||0)-(equipped[name]||0)-(a.gear[name]||0)));
    const researched=typeof progressionMasteryStages==='function' ? progressionMasteryStages(state.class,a.context,currentLevel(),isLeveling(),advised,unlocks,skillNames(),threshold) : null;
    if(researched)return researched;
    const stages=[];
    const add=(names,level)=>names.forEach(name=>stages.push([name,threshold(name,level)]));
    const early=isLeveling()&&currentLevel()<=15;
    if(early){
      const foundation=(LEVELING_MASTERY_CORE[state.class]||[]).filter(([name])=>core.includes(name)||support.includes(name));
      for(const [name,wanted] of foundation)stages.push([name,Math.min(5,threshold(name,wanted))]);
    }
    // Explicit priority: establish the class's skill engine, hit real
    // 8/12/16 specialty gates, then build defensive and passive support.
    // Additional board ranks take skills beyond purchasable rank 10.
    add(core.slice(0,4),5);
    add(core.slice(4,7),5);
    add(support.slice(0,3),5);
    add(core.slice(0,3),8);
    add(core.slice(3),8);
    add(support.slice(0,3),8);
    add(core.slice(0,3),12);
    add(core.slice(3),12);
    add(support.slice(0,3),10);
    add(core.slice(0,3),16);
    add(core.slice(3),16);
    add(support.slice(3),8);
    add(rest,5);
    add(support,10);
    add(rest,10);
    return stages;
  }
  const available=stages=>isLeveling()?stages.filter(([name])=>(SKILL_UNLOCKS[state.class][name]||1)<=currentLevel()):stages;
  if(isLeveling()){
    const core=LEVELING_MASTERY_CORE[state.class],next=LEVELING_MASTERY_NEXT[state.class];
    const weights=activeWeights().skills;
    const rest=skillNames().map((name,i)=>({name,i,weight:weights[name]||0})).sort((a,b)=>b.weight-a.weight||a.i-b.i).map(x=>x.name);
    const support=account().context!=='party'?[]:state.class==='cleric'?[['Healing Light',5],['Light of Regeneration',5],['Radiant Recovery',5]]:state.class==='chanter'?[['Recuperation',5],['Protection Circle',5]]:[];
    const passives=(LEVELING_PASSIVE_PRIORITY[state.class]||[]).filter(name=>(SKILL_UNLOCKS[state.class][name]||Infinity)<=currentLevel());
    // Count only obtained nodes and equipped skill bonuses when planning the
    // next breakpoint: a projected (unbought) board tile is not a current rank.
    const ownedSkillBonuses=effects(obtainedNodes()).skills;
    // Gear is never assumed or used to choose recommended Mastery purchases.
    const target=(name,threshold)=>Math.max(1,Math.min(10,threshold-(ownedSkillBonuses[name]||0)));
    return available([...support,...core,...passives.map(name=>[name,5]),...next.map(name=>[name,target(name,8)]),...rest.map(name=>[name,target(name,8)]),...passives.map(name=>[name,10]),...next.map(name=>[name,target(name,12)]),...rest.map(name=>[name,target(name,12)])]);
  }
  const names=skillNames(); const weights=activeWeights().skills;
  const order=names.map((name,i)=>({name,i,weight:weights[name]||0})).sort((a,b)=>b.weight-a.weight||a.i-b.i).map(x=>x.name);
  const active=new Set(Object.values(data().skills).slice(0,12).map(skill=>skill.name));
  const rotationCore=[profile().weave,...profile().stacks.filter(stack=>!stack.manual).flatMap(stack=>stack.skills),...profile().hotbar.filter(([,cue,tone])=>tone==='heal'||tone==='attack'&&/charg/i.test(cue)).flatMap(([skills])=>skills)].filter(name=>active.has(name));
  const first=[...new Set([...rotationCore,...order.slice(0,8)])];
  const second=order.filter(name=>!first.includes(name)).slice(0,8), third=order.filter(name=>!first.includes(name)&&!second.includes(name));
  return available([...first.map(n=>[n,8]),...first.map(n=>[n,10]),...second.map(n=>[n,8]),...second.map(n=>[n,10]),...third.map(n=>[n,8]),...third.map(n=>[n,10])]);
}
function stigmaStages(){
  const s=activeStigmas().slice(0,isLeveling()?levelReward().slots:4);
  const advised=typeof adviceFor==='function'?adviceFor(state.class,account().context):null;
  if(advised){
    const researched=typeof progressionStigmaStages==='function' ? progressionStigmaStages(state.class,account().context,s,advised) : null;
    if(researched)return researched;
    if(Array.isArray(advised.stigmaMilestones)){
      const milestones=advised.stigmaMilestones.filter(([name,rank])=>s.includes(name)&&[5,10,15,20].includes(rank));
      // Explicit research milestones (e.g. Taunt 15, Noble Armor 15 and
      // Shield of Protection 5) take precedence over generic equal leveling.
      // Finish with legal rank-20 targets for customized loadouts.
      return [...milestones,...s.map(name=>[name,20])];
    }
    const priority=[...(advised.stigmaPriority||[]).filter(name=>s.includes(name)),...s.filter(name=>!(advised.stigmaPriority||[]).includes(name))];
    // Slot order follows a verified recommendation, then prioritize the
    // character's most meaningful milestones instead of blindly leveling
    // every skill to each shared bracket first.
    return [...s.map(name=>[name,5]),
      ...priority.slice(0,2).map(name=>[name,10]),
      ...priority.slice(2).map(name=>[name,10]),
      ...priority.slice(0,2).map(name=>[name,15]),
      ...priority.slice(2).map(name=>[name,15]),
      ...priority.slice(0,2).map(name=>[name,20]),
      ...priority.slice(2).map(name=>[name,20])];
  }
  if(state.class==='templar'){
    // Reach each equipped skill's first breakpoint, then its context-defining breakpoints.
    const priority=account().context==='solo'?['Doom Shield','Noble Armor',"Empyrean Lord's Punishment",'Executing Blade']:account().context==='pvp'?['Noble Armor','Doom Shield','Taunt','Second Skin']:['Noble Armor','Taunt','Doom Shield','Shield of Protection'];
    const equipped=priority.filter(name=>s.includes(name));
    return [...equipped.map(name=>[name,5]),...([10,15,20].flatMap(rank=>equipped.map(name=>[name,rank])))];
  }
  return [5,10,15,20].flatMap(rank=>s.map(name=>[name,rank]));
}
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
  const route=plannedRoute(azphel);
  for(const item of route){const n=nodes.get(item.id).node;if(spent+n[5]>budget){next={...item,cost:n[5],need:spent+n[5]-budget};break}spent+=n[5];owned.add(item.id);perBoard[item.board]+=n[5]}
  return {spent,owned,perBoard,next};
}
function routeSteps(route,nodes){let total=0;return route.map((item,index)=>{const node=nodes.get(item.id).node;total+=node[5];return {...item,number:index+1,total,cost:node[5],node}})}
function renderGlobalBoardRoute(m,nodes){
  const actual=obtainedNodes(),steps=routeSteps(plannedRoute(),nodes),upcoming=steps.filter(x=>!actual.has(x.id)),first=upcoming[0],switchBoard=first&&upcoming.find(x=>x.board!==first.board),crystals=budget('crystals');
  const marked=steps.filter(x=>actual.has(x.id)),markedCost=marked.reduce((sum,x)=>sum+x.cost,0),unmarkedWithinBudget=upcoming.filter(x=>x.total<=crystals).length;
  const banked=crystals-m.boards.spent;
  $('global-route-budget').textContent=`${m.boards.spent} / ${crystals} crystals planned${banked&&m.boards.next?` · save ${banked} for the next ${m.boards.next.cost}-crystal tile`:''}`;
  $('obtained-status').textContent=`${markedCost} crystals marked obtained across ${marked.length} chosen nodes · ${unmarkedWithinBudget} planned tiles still unmarked`;
  $('global-route-caption').textContent=customMode()?`You choose connected tiles on each board. The board grid shows your selected path and updates skill bonuses from the ${m.boards.spent} funded crystals.${markedCost>crystals?` Obtained marks total ${markedCost}, above your entered budget; check the total.`:''}`:first?`Your obtained marks are skipped in the shared ${isLeveling()?'unlocked':'four-board'} route. ${first.board} is the first unmarked tile at ${first.total} planned crystals${switchBoard?`; the next board switch is ${switchBoard.board} at ${switchBoard.total}`:''}.${markedCost>crystals?` Marked nodes cost ${markedCost}, above the entered ${crystals} crystals; check your total.`:''}`:isLeveling()&&currentLevel()<12?'Nezekan opens at level 12. Your crystals are saved until then.':'All currently available PvE nodes are marked obtained.';
  $('global-board-allocation').innerHTML=BOARD_NAMES.map(name=>{const spent=m.boards.perBoard[name],share=m.boards.spent?Math.round(spent/m.boards.spent*100):0,next=upcoming.find(x=>x.board===name),obtained=marked.filter(x=>x.board===name).reduce((sum,x)=>sum+x.cost,0),locked=!boardOpen(name);return `<button type="button" data-board-jump="${name}" class="global-board-card ${state.board===name?'active':''} ${locked?'locked':''}" ${locked?'disabled':''}><span>${name}</span><b>${locked?`Opens at Lv ${BOARD_UNLOCKS[name]}`:`${spent} planned · ${obtained} obtained`}</b><small>${locked?'Future board':`${share}% of planned PvE crystals`}</small><em>${locked?'Locked':next?`Next unmarked at ${next.total} ✧`:customMode()?spent?'All selected tiles obtained':'Choose tiles':'Board complete'}</em><i style="width:${share}%"></i></button>`}).join('');
  $('global-route-next').innerHTML=first?`<button type="button" data-route-node="${first.id}" data-route-board="${first.board}" class="route-jump"><span class="route-step-icon">${nodeVisual(first.node)}</span><span><b>Show next highlighted tile on ${first.board}</b><small>${esc(effectText(first.node))}${first.goal&&first.goal!==first.id?` · connects toward ${esc(effectText(nodes.get(first.goal).node))}`:''} · row ${first.node[1]}, column ${first.node[2]} · ${first.total} total crystals</small></span><strong aria-hidden="true">→</strong></button>`:customMode()?'<p>Select connected tiles on a board to begin your custom route.</p>':'<p>All planned tiles at this level are marked obtained.</p>';
}
function effects(owned){const skills={},stats={},nodes=nodeMap();for(const id of owned){const n=nodes.get(id).node;for(const [key,v] of n[6]){if(typeof key==='number'){const name=data().skills[key]?.name||String(key);skills[name]=(skills[name]||0)+v}else stats[key]=(stats[key]||0)+v}}return {skills,stats}}
function effectText(n){if(!n||!n[6]?.length)return 'Start node';return n[6].map(([key,v])=>{if(typeof key==='number')return `${data().skills[key]?.name||key} +${v} level`;const meta=data().stats[key];return `${meta?.name||key} +${v/(meta?.div||1)}${meta?.pct?'%':''}`}).join(' · ')}
function nodeShort(n){if(n[5]===0||n[5]===4)return '✦';if(typeof n[6]?.[0]?.[0]==='number')return n[5]===2?'P':'S';return ({FixingDamage:'ATK',Critical:'CR',Defense:'DEF',HPMax:'HP',MPMax:'MP',HealBoost:'HEAL'})[n[6]?.[0]?.[0]]||'·'}
function nodeVisual(n){
  const key=n[6]?.[0]?.[0],name=typeof key==='number'?data().skills[key]?.name:null;
  const icon=name?gameSkillIconUrl(state.class,name):'';
  if(!icon)return `<span>${nodeShort(n)}</span>`;
  const backup='https://aion2.app/db-item-icons/'+gameSkillIconFile(state.class,name).replace(/\.png$/i,'.webp');
  return `<span class="node-icon-fallback" aria-hidden="true">${nodeShort(n)}</span><img class="node-game-icon" src="${icon}" alt="" loading="lazy" decoding="async" data-backup="${backup}" onerror="if(!this.dataset.triedBackup){this.dataset.triedBackup='1';this.src=this.dataset.backup}else{this.hidden=true}">`;
}
function model(){
  const a=account(),names=skillNames(),recommendedMastery=allocate(masteryStages(),budget('mastery'),masteryCost,names,1,isLeveling()?masteryRankCap:null),
    mastery=a.manualMastery?manualAllocation(a.manualMastery,names,budget('mastery'),masteryCost,1,masteryRankCap):recommendedMastery,
    stigmas=activeStigmas(),recommendedStigma=allocate(stigmaStages(),budget('stigma'),stigmaCost,stigmas,0),
    stigma=a.manualStigma?manualAllocation(a.manualStigma,stigmas,budget('stigma'),stigmaCost,0,20):recommendedStigma;
  {
    // Recalculate the connected route with verified owned skill bonuses,
    // selected context, researched skill weights and actual equipped items.
    // Owned gear alters advice but never marks the build manually modified.
    const target=profile().kind==='healer'?0:Number(a.goalTarget)||0;
    const gearRanks={...gearSkillLevels()};
    for(const [name,n] of Object.entries(a.gear||{}))gearRanks[name]=(gearRanks[name]||0)+Number(n||0);
    const key=JSON.stringify([state.class,a.context,currentLevel(),mastery.levels,stigma.levels,gearRanks,target,a.obtainedNodes,gearEquipment(),a.cpAnchor]);
    if(key!==liveRouteKey){
      // A CP goal is meaningful only with a recorded level-45 equipment
      // baseline; otherwise it must not arbitrarily bias Daevanion choices.
      const actual=obtainedNodes();
      const reference={mastery,stigma,boards:{owned:actual},effects:effects(actual)};
      const estimated=estimateCombatPower(reference);
      const baseCp=estimated.ready?estimated.value:null;
      liveRouteBasis=optimizeBoardRoute(data(),activeWeights(),mastery.levels,gearRanks,baseCp===null?0:target,baseCp,actual,currentLevel(),typeof progressionBoardTargets==='function'?progressionBoardTargets(state.class,a.context):{});
      liveRoute=liveRouteBasis.route;liveRouteKey=key;
    }
  }
  const boards=boardPlan(budget('crystals')),azphel=boardPlan(isLeveling()?0:a.azphel||0,true);
  return {mastery,stigma,boards,azphel,
    // `effects` is the route funded by the player's entered crystal
    // budget. Obtained marks are a separate source of CURRENT bonuses. A
    // projected route must not be described as an already acquired rank.
    effects:effects(boards.owned),acquiredEffects:effects(new Set([...obtainedNodes()].filter(id=>boardOpen(nodeMap().get(id).board)))),
    azphelEffects:effects(azphel.owned)};
}
function skillLevelBreakdown(name,m){
  const mastery=m.mastery.levels[name]||1,
    purchased=m.acquiredEffects?.skills[name]||0,
    projected=m.effects.skills[name]||0,
    gear=(account().gear[name]||0)+(gearSkillLevels()[name]||0);
  return {mastery,boardOwned:purchased,boardPlanned:projected,gear,
    // Values combine the selected Mastery rank PLAN with either marked-owned
    // or planned board nodes. Actual in-game rank may differ when the user's
    // manually entered purchases do not match the recommendation.
    withOwned:Math.min(40,mastery+purchased+gear),
    withPlan:Math.min(40,mastery+projected+gear)};
}
function effective(name,m){return skillLevelBreakdown(name,m).withPlan}
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
  $('intro-copy').innerHTML=isLeveling()?`Enter <b>total points earned</b>, including spent and unspent. The level-only points are the baseline; extra rewards apply from the level where you enter them onward. Mastery skills, Stigma slots, and boards obey Global level gates. The Rotation & macro tab shows a setup for your current level.`:'Enter <b>total points earned, including spent and unspent</b>. Recommended ranks are a reset plan; displayed in-game skill levels can also include board, gear and Arcana bonuses. Each class saves its own inputs. Research reviewed October 19, 2026.';
  $('reset-button').textContent=isLeveling()?'Reset class progress':'Reset class to fresh 45';
  if(isLeveling())renderLevelControls();
  $('fresh-45-button').classList.toggle('active',Object.entries(FRESH_45).every(([key,value])=>a[key]===value)&&!(a.azphel||0));
  for(const [id,ctx] of [['party-button','party'],['solo-button','solo'],['pvp-button','pvp']]){$(id).classList.toggle('active',a.context===ctx);$(id).setAttribute('aria-pressed',a.context===ctx)}
  $('azphel-input').value=a.azphel||0;
  document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===state.tab);b.setAttribute('aria-current',b.dataset.tab===state.tab?'page':'false')});
  $('mobile-more-button').classList.toggle('active',['stigma','rotation','titles','sources'].includes(state.tab));
  document.querySelectorAll('.tab-panel').forEach(el=>el.classList.toggle('active',el.id===state.tab));
  renderOverview(m);renderMobileNext(m);renderMastery(m);renderStigma(m);renderRotation(m);renderBoards(m);renderGear(m);renderTitles();renderSources();save();if(typeof syncV2==='function')syncV2(m);
}
function renderMobileNext(m){
  const el=$('mobile-next');el.hidden=false;
  const first=isLeveling()?LEVELING_MASTERY_CORE[state.class].find(([name,target])=>(m.mastery.levels[name]||1)<Math.min(target,masteryRankCap(name))):null;
  const filled=GEAR_SLOTS.filter(slot=>['left','right'].includes(slot.area)&&gearEquipment()[slot.id]).length;
  const gearFirst=false,boardsNext=!isLeveling()&&!obtainedNodes().size;
  const choice=boardsNext?{title:'Follow your Daevanion route',detail:'Mark the connected nodes you already own; board skill levels combine with Mastery and gear.',tab:'boards'}:first?{title:`Raise ${first[0]} to rank ${Math.min(first[1],masteryRankCap(first[0]))}`,detail:`Current plan: rank ${m.mastery.levels[first[0]]||1}. This skill's next rank is available at your character level.`,tab:'mastery'}:m.mastery.next?{title:`Plan ${m.mastery.next.name} rank ${m.mastery.next.rank}`,detail:`Earn ${m.mastery.next.need} more Mastery point${m.mastery.next.need===1?'':'s'} for this step.`,tab:'mastery'}:m.boards.next?{title:`Open ${m.boards.next.board} next`,detail:`${effectText(nodeMap().get(m.boards.next.id).node)} · ${m.boards.next.need} more crystals for the next connected node.`,tab:'boards'}:{title:'Review your current build',detail:'Your available points are allocated. Check skill specialties and the next board route.',tab:'mastery'};
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
  const gearCount=GEAR_SLOTS.filter(slot=>['left','right'].includes(slot.area)&&gearEquipment()[slot.id]).length;
  $('build-flow').hidden=false;
  $('build-flow').innerHTML=`<button type="button" data-flow-tab="gear"><small>01 / establish your loadout</small><b>Equipment</b><span>${gearCount} / 20 slots recorded · grades, stats and skill rolls</span></button><button type="button" data-flow-tab="boards"><small>02 / route your crystals</small><b>Daevanion</b><span>${m.boards.spent} / ${a.crystals} PvE crystals in the plan</span></button><button type="button" data-flow-tab="mastery"><small>03 / finish the kit</small><b>Mastery & Stigmas</b><span>Use gear and board bonuses to check specialty levels</span></button>`;
  const mode=p.kind==='healer'?'healing':'damage';
  const steps=[`<b>Gear:</b> ${gearCount} / 20 slots recorded. Equip current pieces first; fixed stats, enhancement and rolled skill levels change the final build.`,
    `<b>Daevanion:</b> ${BOARD_NAMES.map(n=>`${n} ${m.boards.perBoard[n]}`).join(' · ')}. Follow the connected ${a.context==='pvp'?'PvP-oriented':'PvE'} route at ${a.crystals} crystals.`,
    `<b>Mastery:</b> ${top.map(n=>`${esc(n)} Lv ${m.mastery.levels[n]||1}`).join(' · ')}. Check specialty unlocks using gear and board bonuses.`,
    `<b>Stigmas:</b> ${activeStigmas().map(n=>`${esc(n)} Lv ${m.stigma.levels[n]||0}`).join(' · ')}. ${esc(p.swap)}`,
    `<b>${mode==='healing'?'Healing':'Fight'} priority:</b> ${esc(p.rule)}`];
  if(a.context==='solo')steps.push(`<b>Solo route:</b> Mastery, Stigmas and the board order favor personal damage and self-sustain. The board route differs from Group PvE.`);
  if(a.context==='pvp')steps.push(`<b>PvP route:</b> Mastery, Stigmas and PvE crystal clicks prioritize control, escape and survival. Azphel uses a separate ${a.azphel||0}-crystal budget; it has no skill-level nodes.`);
  $('now-steps').innerHTML=steps.map((v,i)=>`<li><span class="step-num">${i+1}</span><span>${v}</span></li>`).join('');
  const next=[];if(m.mastery.next)next.push([`+${m.mastery.next.need} mastery`,`${m.mastery.next.name} rank ${m.mastery.next.rank}`]);if(m.stigma.next)next.push([`+${m.stigma.next.need} stigma`,`${m.stigma.next.name} rank ${m.stigma.next.rank}`]);if(m.boards.next)next.push([`+${m.boards.next.need} PvE crystals`,`${m.boards.next.board}: ${effectText(nodeMap().get(m.boards.next.id).node)}`]);if(a.context==='pvp'&&m.azphel.next)next.push([`+${m.azphel.next.need} Azphel crystals`,effectText(nodeMap().get(m.azphel.next.id).node)]);
  const needs=top.map(n=>({name:n,level:effective(n,m)})).find(x=>x.level<16);if(needs)next.push(['Lv 16 specialty',`${needs.name}: ${16-needs.level} more effective levels from mastery, board or gear`]);
  $('next-unlocks').innerHTML=next.length?next.map(([label,detail])=>`<div class="next-unlock"><strong>${esc(label)}</strong><span>${esc(detail)}</span></div>`).join(''):'<p>All planned ranks and nodes are funded.</p>';
  renderGoal(m);
}
function renderLevelingOverview(m){
  $('build-flow').hidden=true;
  const p=profile(),level=currentLevel(),r=levelReward(),solo=account().context==='solo',next=LEVEL_MILESTONES.find(([at])=>at>level),names=masteryStages().map(([name])=>name).filter((v,i,s)=>s.indexOf(v)===i),top=names.slice(0,4),unlocks=Object.entries(SKILL_UNLOCKS[state.class]).filter(([,at])=>at>level).sort((a,b)=>a[1]-b[1]).slice(0,3);
  const band=level<12?'Learn the core loop':level<22?'Build your first board':level<30?'Add Stigmas':level<40?'Expand your kit':'Finish the campaign';
  $('overview-title').textContent=`${p.name} · Level ${level} path`;$('overview-subtitle').textContent=`${solo?'Solo':'Group'} leveling priorities through level 45. Recommendations use skills and systems available at your selected level.`;
  $('leveling-guide').innerHTML=`<div class="leveling-guide-heading"><span class="eyebrow">${solo?'SOLO':'GROUP'} LEVELING · ${esc(band)}</span><h3>${solo?'Keep damage moving and recover between pulls.':'Advance the campaign together and keep roles clear.'}</h3></div><div class="leveling-guide-grid"><div><b>Quest route</b><p>Follow the main story first. Add nearby regional quests and one-time Sealed Dungeon clears when the next chapter needs more EXP or points.</p></div><div><b>${solo?'In combat':'In a party'}</b><p>${solo?'Use your core weave on safe targets, pull a size your defenses and healing can cover, and save escapes for bad pulls.':p.kind==='healer'?'Keep the group alive first, then weave damage when healing is stable.':state.class==='templar'?'Hold enemy attention and face attacks away from allies; use defensive skills for dangerous casts.':'Maintain damage uptime, avoid avoidable hits, and use your control or support when it helps the group.'}</p></div><div><b>Next milestone</b><p>${next?`Level ${next[0]} opens ${esc(next[1])}. Your level-only points will update automatically.`:'Level 45 is ready. Switch to the Level 45 build stage when you finish the campaign.'}</p></div></div>`;
  const kpis=[['Mastery',`${m.mastery.spent} / ${budget('mastery')}`,`${top[0]||'Core skills'} first`],['Stigma slots',`${r.slots} / 4`,level<22?'First slot at level 22':`${m.stigma.spent} / ${budget('stigma')} points planned`],['Boards open',`${BOARD_NAMES.filter(boardOpen).length} / 4`,`${m.boards.spent} / ${budget('crystals')} crystals planned`],['Next unlock',next?`Lv ${next[0]}`:'Lv 45',next?.[1]||'Move to endgame']];
  $('kpis').innerHTML=kpis.map(([label,value,detail])=>`<div class="kpi"><div class="k-label">${esc(label)}</div><strong>${esc(value)}</strong><small>${esc(detail)}</small></div>`).join('');
  const steps=[`<b>Mastery:</b> ${top.length?top.map(n=>`${esc(n)} rank ${m.mastery.levels[n]||1}`).join(' · '):'Skill points start at level 4.'} The Mastery tab shows only skills unlocked by this level.`,`<b>Stigmas:</b> ${r.slots?activeStigmas().slice(0,r.slots).map(n=>`${esc(n)} Lv ${m.stigma.levels[n]||0}`).join(' · '):'First slot unlocks at level 22; first leveling point arrives at 23.'}`,`<b>Daevanion:</b> ${BOARD_NAMES.filter(boardOpen).length?BOARD_NAMES.filter(boardOpen).map(n=>`${n} ${m.boards.perBoard[n]}`).join(' · '):'Nezekan opens at level 12.'} The route uses unlocked boards only.`,`<b>Fight:</b> Hold ${esc(p.weave)} on ${esc(p.weaveKey||'LMB')} with the current-level Macro during safe damage. Use the Rotation & macro tab for unlocked stacks and manual keys.`];
  $('now-steps').innerHTML=steps.map((v,i)=>`<li><span class="step-num">${i+1}</span><span>${v}</span></li>`).join('');
  const future=[];for(const [name,at] of unlocks)future.push([`Lv ${at} skill`,name,at]);if(next)future.push([`Lv ${next[0]}`,next[1],next[0]]);future.sort((x,y)=>x[2]-y[2]);if(m.mastery.next)future.push([`+${m.mastery.next.need} Mastery`,`${m.mastery.next.name} rank ${m.mastery.next.rank}`]);if(m.boards.next)future.push([`+${m.boards.next.need} crystals`,`${m.boards.next.board}: ${effectText(nodeMap().get(m.boards.next.id).node)}`]);
  $('next-unlocks').innerHTML=future.length?future.slice(0,6).map(([label,detail])=>`<div class="next-unlock"><strong>${esc(label)}</strong><span>${esc(detail)}</span></div>`).join(''):'<p>Level 45 progression is ready.</p>';
}
function renderGoal(m){
  const a=account(),heal=profile().kind==='healer',tank=state.class==='templar';
  $('goal-title').textContent=heal?'Effective healing & survival':tank?'Tank Combat Power goal':'Damage Combat Power goal';
  $('goal-explainer').textContent=heal?'Enter an effective HPS target for your group if you have one. Record healing actually needed, and judge it with deaths and missed mechanics.':`The ${tank?'60k tank':'100k damage'} starting goal is editable. It influences the connected board route: below the target, estimated CP gains receive more weight; after reaching it, role priorities take over. Recorded gear makes this comparison more personal. The CP estimate is not the in-game score.`;
  $('target-label').textContent=heal?'Target effective HPS':'Target Combat Power';
  $('observed-field').hidden=!heal;$('goal-observed').value=heal?a.goalObserved||'':'';
  document.querySelector('.goal-inputs').classList.toggle('single-target',!heal);$('goal-target').value=a.goalTarget||'';
  const target=Number(a.goalTarget)||0;
  if(!heal){
    const estimate=estimateCombatPower(m);
    if(!estimate.ready){$('goal-status').textContent=estimate.reason;return}
    const baseline=estimate.exactBaseline,approx=baseline?'':'≈';
    if(!target){$('goal-status').innerHTML=`${baseline?'Saved in-game baseline':'Estimated planned CP'}: <b>${approx}${estimate.value.toLocaleString()}</b>. Set a target to compare.`;return}
    const percent=Math.min(100,Math.round(estimate.value/target*100)),gap=Math.max(0,target-estimate.value);
    const range=baseline?'Saved in-game CP for the build at calibration.':estimate.calibrated?`Projection from ${estimate.baseline.toLocaleString()} in-game CP · estimated change ${estimate.change>=0?'+':''}${estimate.change.toLocaleString()} CP`:`Planning range ${estimate.low.toLocaleString()}–${estimate.high.toLocaleString()} CP`;
    $('goal-status').innerHTML=`<b>${approx}${percent}% of target</b> · ${gap?`${baseline?'':'estimated '}gap ${approx}${gap.toLocaleString()} CP`:`${baseline?'Baseline':'Estimate'} meets target`}<small>${range}</small><div class="progress"><span style="width:${percent}%"></span></div>`;
    return;
  }
  const observed=Number(a.goalObserved)||0;
  if(!target){$('goal-status').textContent='Set a target when your group has a useful effective HPS benchmark. Prioritize timely heals and survival now.';return}
  if(!observed){$('goal-status').innerHTML=`Target: <b>${target.toLocaleString()}</b> effective HPS · record measured healing to see the gap.`;return}
  const percent=Math.min(100,Math.round(observed/target*100)),gap=Math.max(0,target-observed);
  $('goal-status').innerHTML=`<b>${percent}% of target</b> · ${gap?`${gap.toLocaleString()} to go`:'target reached'}<div class="progress"><span style="width:${percent}%"></span></div>`;
}
function recommendedSpecPicks(name,eff){const spec=SPECS[state.class]?.[name];if(!spec)return [];let key=eff>=20?'20':eff>=16?'16':eff>=12?'12':eff>=8?'8':null;if(!key)return [];
  const contextual=typeof adviceSpecialtyChoices==='function'?adviceSpecialtyChoices(state.class,account().context,name,eff,spec.options):null;
  if(contextual)return contextual;
  let picks=spec.picks[key]||[];if(state.class==='templar'&&account().context==='pvp'&&name==='Poach'&&eff>=12)picks=eff>=20?[2,4,3]:[2,4];if(state.class==='templar'&&account().context==='pvp'&&name==='Defiance'&&eff>=12)picks=eff>=20?[1,3,5]:eff>=16?[1,3]:[1,3];return picks}
function specPicks(name,eff){
  const spec=SPECS[state.class]?.[name],manual=account().customSpecialties?.[name];
  if(!spec||!Array.isArray(manual))return recommendedSpecPicks(name,eff);
  return [...new Set(manual.map(Number))].filter(option=>spec.options[option]&&eff>=(option<=3?8:option===4?12:16)).slice(0,specialtySlots(eff));
}
function renderMastery(m){
  const a=account(),order=masteryStages().map(x=>x[0]).filter((v,i,s)=>s.indexOf(v)===i),query=(state.masterySearch||'').trim().toLocaleLowerCase();
  const opened=new Set([...$('skill-grid').querySelectorAll('details[open][data-detail-id]')].map(el=>el.dataset.detailId));
  const invested=order.filter(name=>(m.mastery.levels[name]||1)>1);
  const shown=order.map((name,i)=>({name,i})).filter(({name})=>name.toLocaleLowerCase().includes(query)&&(!isLeveling()||query||(m.mastery.levels[name]||1)>1));
  $('mastery-search').value=state.masterySearch||'';
  $('mastery-spent').textContent=`${m.mastery.spent} / ${budget('mastery')} Mastery points allocated · ${Math.max(0,budget('mastery')-m.mastery.spent)} unspent`;
  $('mastery-visible').textContent=query?`${shown.length} of ${order.length} unlocked skills match “${state.masterySearch}”`:isLeveling()?`${invested.length} recommended upgrades · ${order.length} skills unlocked at level ${currentLevel()}`:`${order.length} skills · highest priority first`;
  const levelContext=$('mastery-level-context');levelContext.hidden=!isLeveling();
  if(isLeveling()){
    const extra=activeLevelingExtra().mastery||0;
    levelContext.innerHTML=`<div><b>Level ${currentLevel()} Mastery plan</b><span>${levelReward().mastery} points from levels + ${extra} extra earned by this level. Only skills receiving Mastery points appear below; search to inspect any other unlocked skill.</span></div>${extra?'<button type="button" data-reset-level-mastery>Use level-only points</button>':''}`;
  }
  $('mastery-icon-source').href=`https://aion2data.com/classes/${state.class}`;
  $('skill-grid').innerHTML=shown.map(({name,i})=>{
    const breakdown=skillLevelBreakdown(name,m),base=breakdown.mastery,board=breakdown.boardPlanned,boardOwned=breakdown.boardOwned,manualGear=a.gear[name]||0,itemGear=gearSkillLevels()[name]||0,gear=breakdown.gear,bonus=board+gear,ownedBonus=boardOwned+gear,eff=breakdown.withPlan,ownedEff=breakdown.withOwned,current=a.currentRanks?.[name],currentEffectiveLevel=current?Math.min(40,current+ownedBonus):null,spec=SPECS[state.class]?.[name],picks=specPicks(name,eff);
    const skillIcon=gameSkillIconMarkup(state.class,name,'mastery-game-icon');
    const cap=masteryRankCap(name),nextGate=cap<10?(SKILL_UNLOCKS[state.class][name]||1)+3*(cap-1):null;
    const choices=spec?Object.entries(spec.options):[];
    const selected=picks.filter(num=>spec?.options[num]);
    const specialty=spec?`<div class="mastery-specialty"><div class="mastery-specialty-head"><span>Specialties in this plan</span><small>${eff<8?`Opens at projected Lv 8`:`${selected.length} ${selected.length===1?'pick':'picks'} at projected Lv ${eff}`}</small></div>${selected.length?`<ul class="mastery-picked">${selected.map(num=>`<li><span>${num}</span><b>${esc(spec.options[num])}</b></li>`).join('')}</ul>`:`<p class="mastery-pick-empty">${eff<8?'Raise the effective level to 8 to unlock the first specialty.':'No verified specialty picks for this level. Check the skill tooltip in game.'}</p>`}<details class="mastery-disclosure" data-detail-id="${esc(name)}:options" ${opened.has(name+':options')?'open':''}><summary>Compare all ${choices.length} options</summary><ol class="mastery-option-list">${choices.map(([num,label])=>{const required=+num<=3?8:+num===4?12:16,chosen=selected.includes(+num);return `<li class="${chosen?'chosen':''} ${eff<required?'locked':''}"><span class="mastery-option-number">${num}</span><span>${esc(label)}</span><em>${chosen?'Selected':eff<required?`Lv ${required}`:'Available'}</em></li>`}).join('')}</ol></details></div>`:`<div class="mastery-specialty mastery-specialty-none"><span>Specialty guidance</span><p>No verified specialty options for this skill. Check its tooltip in game.</p></div>`;
    return `<article class="skill-card ${i<4?'highlight':''}"><div class="mastery-card-head"><div class="mastery-identity"><span class="mastery-skill-icon">${skillIcon}</span><div><div class="mastery-priority">Priority ${String(i+1).padStart(2,'0')}${isLeveling()?` · Unlocked Lv ${SKILL_UNLOCKS[state.class][name]||1}`:''}</div><h3>${esc(name)}</h3></div></div><div class="mastery-target"><span>Target rank</span><strong>${base}</strong><small>With obtained Lv ${ownedEff} · with plan Lv ${eff}</small></div></div><div class="mastery-rank-track" role="meter" aria-label="${esc(name)} target Mastery rank" aria-valuemin="1" aria-valuemax="10" aria-valuenow="${base}"><span style="width:${base*10}%"></span></div><div class="mastery-numbers"><div><span>Mastery cost</span><strong>${masteryTotal(base)} <small>pts total</small></strong></div><div><span>Board obtained / planned</span><strong>+${boardOwned} / +${board}</strong></div><div><span>Gear / Arcana</span><strong>+${gear}</strong></div><div class="mastery-green"><span>Bonuses obtained / projected</span><strong>+${ownedBonus} / +${bonus}</strong></div></div>${isLeveling()?`<p class="mastery-gate">Rank cap at level ${currentLevel()}: ${cap}${nextGate?` · rank ${cap+1} opens at character Lv ${nextGate}`:''}</p>`:''}${specialty}<details class="mastery-disclosure mastery-adjust" data-detail-id="${esc(name)}:adjust" ${opened.has(name+':adjust')?'open':''}><summary>Adjust bonuses & compare your rank</summary><div class="mastery-adjust-fields"><label>Other bonus levels <small>Manual adjustment; slotted gear adds +${itemGear}</small><input type="number" data-gear="${esc(name)}" min="0" max="30" value="${manualGear}" aria-label="Other bonus levels for ${esc(name)}"></label><label>Your current Mastery rank <small>Optional</small><input type="number" data-current-rank="${esc(name)}" min="1" max="10" placeholder="—" value="${current||''}" aria-label="Current Mastery rank for ${esc(name)}"></label></div>${currentEffectiveLevel?`<p class="mastery-comparison">Your entered rank ${current} + marked-obtained board/gear bonus (+${ownedBonus}) = Lv ${currentEffectiveLevel}. Target rank ${base} + funded board/gear bonus (+${bonus}) = projected Lv ${eff}.</p>`:''}</details></article>`;
  }).join('')||(query?`<div class="mastery-empty">No unlocked skills match “${esc(state.masterySearch)}” at level ${currentLevel()}. Clear the search or choose a higher level.</div>`:isLeveling()?`<div class="mastery-empty">No Mastery upgrades are available at level ${currentLevel()}. Mastery points begin at level 4; your unlocked skills start at rank 1.</div>`:'');
}
function renderStigma(m){
  const p=profile(),a=account(),slots=isLeveling()?levelReward().slots:4,selected=activeStigmas().slice(0,slots),mode={party:'Group PvE',solo:'Solo',pvp:'PvP'}[a.context];$('stigma-spent').textContent=`${m.stigma.spent} / ${budget('stigma')} spent`;$('loadout-title').textContent=isLeveling()?`${p.name} · ${slots} of 4 slots open`:`${p.name} ${mode} bar`;$('loadout-text').textContent=slots?selected.join(', ')+'. '+(a.context==='party'?p.swap:'This is a context-specific starting set; compare your live tooltips and matchups.'):'Stigmas open at level 22. The first Stigma point comes at level 23; more slots open at 27, 32 and 37.';
  $('stigma-heading').textContent=isLeveling()?`Stigmas · ${slots} of 4 slots open`:'Four stigma slots';$('stigma-description').textContent=isLeveling()?'Slots open at levels 22, 27, 32 and 37. Leveling points start at 23.':'Points advance the four equipped choices to their 5, 10, 15 and 20 breakpoints.';
  $('loadout-tags').innerHTML=selected.map(n=>`<span class="tag ${m.stigma.levels[n]>=5?'green':''}">${esc(n)} · Lv ${m.stigma.levels[n]||0}</span>`).join('');
  $('stigma-grid').innerHTML=selected.map(name=>{const info=STIGMAS[state.class]?.[name],lv=m.stigma.levels[name]||0,perks=info?.perks||{};
    return `<article class="stigma-card"><div class="stigma-head">${gameSkillIconMarkup(state.class,name,'stigma-card-game-icon')}<div><h3>${esc(name)}</h3><div class="sub">Equipped · ${esc(info?.base||'Class stigma')}</div></div><div class="lv">Lv ${lv}</div></div><div class="spec-row">${Object.entries(perks).map(([rank,label])=>`<span class="spec ${lv>=+rank?'on':'future'}">Lv ${rank}: ${esc(label)}</span>`).join('')}</div><div class="milestone">${Object.keys(perks).length?lv<20?`Next perk at Lv ${[5,10,15,20].find(x=>x>lv)}`:'All four perks unlocked':'Compare the level perks in game; this planner has not verified their text.'}</div></article>`}).join('');
}
function numbered(items){return items.map((v,i)=>`<li><span class="rotation-num">${String(i+1).padStart(2,'0')}</span><span>${esc(v)}</span></li>`).join('')}
function renderRotation(m){
  const a=account(),p=typeof progressionRotationProfile==='function' ? progressionRotationProfile(profile(),state.class,a.context,name=>skillLevelBreakdown(name,m).withOwned,activeStigmas().filter(name=>(m.stigma.levels[name]||0)>0),(name,option)=>specPicks(name,skillLevelBreakdown(name,m).withOwned).includes(option)) : profile(),level=currentLevel(),levelingMode=isLeveling(),main=masteryStages()[0]?.[0]||skillNames()[0],macroKey=['RMB','Mouse 4','MMB','M'].includes(a.macroBind)?a.macroBind:'RMB',weaveKey=p.weaveKey||'LMB';
  // Leveling is a distinct, deliberately small combat setup, not an
  // endgame stack with unavailable skills deleted. It uses one macro step.
  if(levelingMode && typeof buildLevelingCombat==='function'){
    const plan=buildLevelingCombat(state.class,level,a.context,SKILL_UNLOCKS[state.class],
      activeStigmas().slice(0,levelReward().slots),m.stigma.levels,
      (name,option)=>specPicks(name,skillLevelBreakdown(name,m).withOwned).includes(option));
    $('rotation').classList.add('leveling-view');
    $('rotation-level').textContent='Lv '+level+' · starter combat';
    $('leveling-rotation').hidden=false;
    $('leveling-rotation').innerHTML=renderLevelingCombatMarkup(plan,macroKey);
    return;
  }
  const classActive=new Set(Object.values(data().skills).slice(0,12).map(s=>s.name));
  const unlockedClass=new Set([...classActive].filter(name=>!levelingMode||(SKILL_UNLOCKS[state.class][name]||1)<=level));
  const slots=levelingMode?levelReward().slots:4;
  const equippedStigmas=activeStigmas().slice(0,slots).filter(name=>!levelingMode||(m.stigma.levels[name]||0)>0);
  const usableSkills=new Set([...unlockedClass,...equippedStigmas]);
  $('rotation-level').textContent=levelingMode?`Lv ${level} · ready to use`:`${main} Lv ${skillLevelBreakdown(main,m).withOwned} (with obtained boards)`;
  $('rotation-rule-title').textContent=levelingMode?`Your level ${level} combat loop`:p.rule;
  $('rotation-rule-text').textContent=levelingMode?'The stacks and 1–8 keys below contain only skills available at this level. Add new skills as they unlock; keep charges, healing, movement and defensive timing manual.':p.summary;
  $('rotation').classList.toggle('leveling-view',levelingMode);$('leveling-rotation').hidden=!levelingMode;
  if(levelingMode){
    const available=masteryStages().map(([name])=>name).filter((name,i,all)=>unlockedClass.has(name)&&all.indexOf(name)===i),next=Object.entries(SKILL_UNLOCKS[state.class]).filter(([name,at])=>classActive.has(name)&&at>level).sort((x,y)=>x[1]-y[1])[0];
    $('leveling-rotation').innerHTML=`<span class="eyebrow">CURRENT LEVEL COMBAT</span><h3>Hold the weave and safe Macro</h3><p>Use <b>${esc(p.weave)}</b> on ${esc(weaveKey)} with the unlocked Macro stack while safe. Stop both for mechanics or urgent healing.</p><div class="leveling-rotation-grid"><div><b>Available priorities</b><span>${esc(available.slice(0,6).join(' · ')||p.weave)}</span></div><div><b>Stigma access</b><span>${slots?`${slots} slot${slots===1?'':'s'} · ${equippedStigmas.length?esc(equippedStigmas.join(' · ')):'No Stigma points assigned yet'}`:'First slot at level 22'}</span></div><div><b>Next attack unlock</b><span>${next?`Lv ${next[1]} · ${esc(next[0])}`:'Core class skills unlocked'}</span></div></div><div class="notice">This is your current-level setup. The hotbar and Macro below update when you change level or earned points. Skill order is a safe starting point; test timing and cancel windows in game.</div>`;
  }
  const fusionCharged=state.class==='spiritmaster'&&specPicks('Elemental Fusion',skillLevelBreakdown('Elemental Fusion',m).withOwned).includes(4);
  let stacks=p.stacks.filter(s=>(!levelingMode||!s.manual)&&(!fusionCharged||s.key!=='E')).map(s=>({...s,skills:s.skills.filter(name=>usableSkills.has(name))})).filter(s=>s.skills.length);
  const chanterReset=state.class==='chanter'&&specPicks('Dark Crush',skillLevelBreakdown('Dark Crush',m).withOwned).includes(5);
  // Before cooldown removal, avoid spending two Dark Crush triggers in one window.
  if(state.class==='chanter'&&!chanterReset)stacks=stacks.map(s=>s.key==='E'?{...s,skills:s.skills.filter(name=>name!=='Impactful Crush')}:s).filter(s=>s.skills.length);
  const macroSteps=p.macro.filter(key=>stacks.some(s=>s.key===key&&!s.manual));
  let hotbar=p.hotbar.map(([skills,cue,tone])=>[[...skills],cue,tone]);
  if(state.class==='chanter'&&!chanterReset)hotbar[7]=[['Impactful Crush'],'Manual Dark Crush trigger until cooldown removal','attack'];
  // Reconcile manual Stigma keys for every context (including Group PvE),
  // not just Solo/PvP. An unequipped Stigma must never appear as usable.
  if(equippedStigmas.length){
    const chosen=equippedStigmas,missing=chosen.filter(name=>!p.stigmas.includes(name)&&!hotbar.some(([skills])=>skills.includes(name)));
    for(const slot of hotbar){const replaced=slot[0].some(name=>p.stigmas.includes(name)&&!chosen.includes(name));slot[0]=slot[0].map(name=>p.stigmas.includes(name)&&!chosen.includes(name)?missing.shift()||null:name).filter(Boolean);if(replaced){slot[1]=`${a.context==='pvp'?'PvP':a.context==='party'?'Group':'Solo'} Stigma · use manually`;slot[2]='defense'}if(!slot[0].length){slot[1]='Available for a matchup-specific skill';slot[2]='utility'}}
    for(const name of missing){const index=hotbar.findLastIndex(([skills])=>skills.length===0);const target=index>=0?index:hotbar.length-1;hotbar[target]=[[name],`${a.context==='pvp'?'PvP':a.context==='party'?'Group':'Solo'} Stigma · use manually`,'defense']}
  }
  if(fusionCharged)hotbar[6]=[['Elemental Fusion'],'Fully charge when Four Elements is ready','attack'];
  if(levelingMode){
    // Keep the currently usable manual powers together on 1–8. Future skills
    // are omitted rather than shown as if a new player could bind them now.
    hotbar=hotbar.map(([skills,cue,tone])=>[skills.filter(name=>usableSkills.has(name)),cue,tone]).filter(([skills])=>skills.length);
    while(hotbar.length<8)hotbar.push([[],'Available for a future unlock','utility']);
  }
  if(levelingMode){
    stacks=[...stacks,...hotbar.flatMap(([skills,cue],i)=>skills.length>1?[{key:String(i+1),title:cue,skills,manual:true}]:[])];
  }else for(const stack of stacks)if(stack.manual&&/^[1-8]$/.test(stack.key))stack.skills=[...hotbar[Number(stack.key)-1][0]];
  $('rotation-gate').textContent=levelingMode?`Level ${level}: Macro uses only ${macroSteps.length?macroSteps.join(' then '):'the weave skill for now'}. ${slots?`${equippedStigmas.length} equipped Stigma skill${equippedStigmas.length===1?'':'s'} currently usable.`:'Stigmas open at level 22.'} ${level<16?'Defiance opens at level 16; reserve Space for it.':'Defiance is available on Space.'} Keep healing, charged attacks and defensive timing manual.`:state.class==='templar'?`Judgment is Lv ${skillLevelBreakdown('Judgment',m).withOwned} with obtained boards. ${specPicks('Judgment',skillLevelBreakdown('Judgment',m).withOwned).includes(5)?'The cooldown-removal Specialty is selected, so the E stack can spend repeated Judgment casts during trigger windows.':'The cooldown-removal Specialty is not selected yet; expect a single Judgment cast for each available proc.'} The macro tries Judgment first within E. Fully charge Punishment manually, then use Doom Shield when that interaction is available; pause the held macro if it clips the charge or trigger.`:p.kind==='healer'?'Heals, toggles and emergency buttons remain manual. Use the macro only while the group is stable.':`Current first priority: ${main} Lv ${skillLevelBreakdown(main,m).withOwned} with obtained boards. Keep charged and movement skills on their own keys.`;
  const macroRanks=stacks.filter(stack=>!stack.manual).flatMap(stack=>stack.skills).map(name=>name in m.mastery.levels?`${name} Lv ${skillLevelBreakdown(name,m).withOwned} with obtained boards`:name in m.stigma.levels?`${name} Stigma Lv ${m.stigma.levels[name]}`:name);
  $('macro-rank-summary').textContent=`Macro skill levels at your current point and gear totals: ${macroRanks.join(' · ')}. Change crystals, Mastery, Stigma or gear to update these ranks.`;
  $('rotation-opener-title').textContent={party:'Group opener',solo:'Solo opener',pvp:'PvP engage'}[a.context];
  const manualNow=hotbar.flatMap(([skills])=>skills),buffNow=hotbar.filter(([, ,tone])=>tone==='buff').flatMap(([skills])=>skills),healNow=hotbar.filter(([, ,tone])=>tone==='heal').flatMap(([skills])=>skills);
  const opener=levelingMode?[buffNow.length?`Use ${buffNow.slice(0,2).join(' and ')} before the pull when ready.`:'Approach a manageable target and watch its first attack.',`Hold ${weaveKey} (${p.weave}) with ${macroKey} to cycle ${macroSteps.join(' then ')||'your unlocked damage key'} while safe.`,healNow.length?`Keep ${healNow.slice(0,2).join(' and ')} available for recovery.`:manualNow.length?`Use ${manualNow.slice(0,2).join(' and ')} manually when their timing helps.`:'Add manual skills to 1–8 as they unlock.']:a.context==='pvp'?['Approach with cover and keep your escape or control break available.','Open with a manual control or gap close after the opponent commits.','Use the damage macro only while your target is in range and you can safely finish the cast.']:p.opener;
  const loop=levelingMode?[`Keep ${p.weave} and the unlocked Macro cycling during safe damage.`,healNow.length?'Release Macro to heal; restart it only when health is stable.':'Release Macro for enemy mechanics, movement, or a charge window.',level>=16?'Use Defiance on Space when control or a dangerous hit calls for it.':'Keep the manual keys visible as new powers unlock.']:a.context==='pvp'?['Use manual control, defensive Stigmas and Defiance (Space) around enemy burst.','Weave your safe damage skills when the target is in range; stop the macro during a chase or disengage.','Keep a mobility or peel skill ready instead of spending every cooldown for damage.']:p.loop;
  $('rotation-opener').innerHTML=numbered(opener);$('rotation-loop').innerHTML=numbered(loop);
  $('macro-bind').value=macroKey;$('weave-basic-key').textContent=weaveKey;$('weave-macro-key').textContent=macroKey;
  $('weave-guide').textContent=a.context==='pvp'?`Tap ${weaveKey} + ${macroKey} only during safe pressure windows. Release the macro to move, peel, or answer an opponent's burst; manual control takes priority.`:`Hold ${weaveKey} (${p.weave}) with ${macroKey} (the in-game Macro bind) as your default safe-damage state. Press manual keys over the held loop; they take priority.`;
  $('rhythm-base-keys').textContent=`${weaveKey} + ${macroKey}`;
  $('rhythm-base-note').textContent=macroSteps.length?`Keep ${p.weave} held while Macro attempts ${macroSteps.join(' and ')}. Maintain this through safe damage uptime.`:`Use ${p.weave} alone until an unlocked damage skill can be added to Macro.`;
  $('rhythm-weave-note').textContent=levelingMode?`The 1–8 bar below contains ${manualNow.length} currently available manual power${manualNow.length===1?'':'s'}. Press healing, movement, charges and defenses yourself; release Macro when timing matters.`:a.context==='pvp'?'Keep control, escape and defensive keys manual. Use the Stigmas tab for this PvP loadout; press the macro only for safe pressure.':state.class==='templar'?'E handles Judgment and Pummel during safe uptime. Fully charge Punishment manually, follow with Doom Shield when ready, and time Shield of Protection for a blockable hit. Pause the macro if it interrupts that sequence.':p.kind==='healer'?'Press the needed 1–8 heal or support key; manual input wins. Shift fully to healing when the group is in danger.':'Press or hold a 1–8 skill at its cue. During safe uptime, keep the base held; manual input wins over the macro.';
  $('rhythm-pause-note').textContent=p.kind==='healer'?`Release ${macroKey} and ${weaveKey} for healing triage or mechanics. Restart both when damage is safe.`:`Release ${macroKey} to stop Macro; release ${weaveKey} too when all attacks must stop. Pause Macro if a charge gets clipped.`;
  $('hotbar-grid').innerHTML=hotbar.map(([skills,cue,tone],i)=>`<article class="hotbar-card tone-${esc(tone)}"><div class="hotbar-top"><span class="hotbar-number">${i+1}</span><small>${esc(tone)}</small></div><div class="hotbar-skills">${skills.length?skills.map(name=>`<span class="game-hotbar-entry">${gameSkillIconMarkup(state.class,name,'hotbar-game-icon')}<strong>${esc(name)}</strong></span>`).join(''):'<strong>Flex slot</strong>'}</div><p>${esc(cue)}</p></article>`).join('');
  $('hotbar-note').textContent=levelingMode?`Only unlocked skills appear here. Empty slots are free for future unlocks; update the layout when your level or Stigma points change. ${level>=16?'Defiance is on Space by default, shared with jump/glide.':'Defiance opens at level 16 and uses Space by default.'}`:`Defiance shares Space with jump/glide by default for every class; it does not consume a number-bar slot. Optional: turn on Separate Defiance Hotkey and give it a dedicated nearby key to avoid accidental glides. ${a.context==='pvp'?'The 1–8 bar includes this PvP Stigma set. Place matchup-specific control and defense where your hand can reach them.':a.context==='solo'?'The 1–8 bar includes the Solo Stigma set; keep its recovery and movement keys manual.':fusionCharged?'Elemental Fusion has a charge specialty at this level, so put it on 7 and remove it from macro E. Keep Wind Spirit on a secondary row.':p.hotbarNote}`;
  // One physical stack diagram is one hotbar KEY, not a list of sequential
  // actions. Draw the actual in-game position: row 3 at the TOP and row 0
  // (first attempted skill) at the BOTTOM. Previous UI inverted this.
  const macroColumns=stacks.filter(s=>!s.manual),
    manualColumns=stacks.filter(s=>s.manual);
  const drawStack=s=>`<div class="macro-stack ${s.manual?'macro-stack-manual':'macro-stack-auto'}" data-macro-key="${esc(s.key)}"><div class="stack-heading"><span class="keycap">${esc(s.key)}</span><div><strong>${esc(s.title)}</strong><small>${s.manual?'Press this key when needed':'Macro repeatedly presses this key'}</small></div></div>
   <div class="macro-priority-note">TOP · lower priority / fallback</div>
   <div class="macro-physical-stack" role="list" aria-label="Hotbar ${esc(s.key)} stack from top to bottom">
   ${s.skills.map((name,i)=>({name,row:i})).reverse().map(({name,row})=>`<div class="stack-row ${row===0?'macro-first':''}" role="listitem" data-row="${row}" data-skill="${esc(name)}"><b>Row ${row}</b><img class="macro-skill-art" src="${gameSkillIconUrl(state.class,name)}" alt="" loading="lazy" onerror="this.hidden=true"><span>${esc(name)}</span>${row===0?'<strong class="macro-first-tag">First tried</strong>':''}</div>`).join('')}
   </div><div class="macro-priority-note bottom">BOTTOM · Row 0 tried first</div></div>`;
  const stackHtml=[...macroColumns,...manualColumns].map(drawStack).join('');
  const script=`<div class="macro-stack macro-script"><div class="stack-heading"><span class="keycap">${esc(macroKey)}</span><div><strong>Macro key: ${esc(macroKey)}</strong><small>It presses stack keys, NOT individual skills.</small></div></div>
   ${macroSteps.map((key,i)=>`<div class="stack-row macro-step" data-macro-step="${i+1}"><b>Step ${i+1}</b><span>Press <strong class="macro-step-key">${esc(key)}</strong> · begin at 10 ms</span></div>`).join('')}
   <p class="macro-execution-note">While held, the in-game macro keeps trying these hotbar keys. The game can skip unavailable actions, and the timing/order is not guaranteed. Do not manually press each skill in sequence.</p></div>`;
  $('macro-stacks').innerHTML=stackHtml+script;
  $('rotation-quick-guide').innerHTML=`<h3>Easy combat setup · ${esc(p.name)}</h3>
   <p>Set up the stacks once. During a safe fight you only need your <strong>Macro key</strong>; add the repeat attack if comfortable, and press important manual abilities when needed.</p>
   <div class="rotation-quick-steps">
    <div><span class="rotation-quick-number">1</span><b>Build ${macroColumns.length} damage stack${macroColumns.length===1?'':'s'}</b><p>Open Skills (K). Place each column below on its matching key${macroColumns.length?': '+esc(macroColumns.map(s=>s.key).join(' + ')):''}. Put <strong>Row 0 at the bottom</strong>, never the top.</p></div>
    <div><span class="rotation-quick-number">2</span><b>Bind one in-game Macro key</b><p>Use <strong>${esc(macroKey)}</strong>. Add ${macroSteps.length} Macro step${macroSteps.length===1?'':'s'}: ${esc(macroSteps.join(' → ')||'no steps yet')}. Start at 10 ms and test on a dummy.</p></div>
    <div><span class="rotation-quick-number">3</span><b>Play without memorizing a long sequence</b><p>Hold <strong>${esc(macroKey)}</strong> for safe damage; optionally hold <strong>${esc(weaveKey)}</strong> (${esc(p.weave)}) too. Use charges, healing, movement and defense on direct keys; release Macro for mechanics.</p></div>
   </div>
   <p class="rotation-quick-caveat">This is an accessible, class-specific starting arrangement, not a measured fastest-DPS claim. In AION 1 control mode choose the keyboard Macro bind (M); manual input always takes precedence.</p>`;
  $('setup-list').innerHTML=[`Settings (O) → Key Settings → General → Macro: bind ${macroKey}; it is unbound by default. In AION 1 control mode, use a keyboard key instead of a mouse button.`,`Put ${p.weave} on ${weaveKey}. Set currently available manual powers on 1–8 as shown.${levelingMode&&level<16?' Defiance unlocks at level 16.':' Defiance is on Space by default, shared with jump/glide; a separate Defiance key is optional.'}`,`Skills (K): make ${macroSteps.length?`the ${macroSteps.join(' and ')} stack${macroSteps.length===1?'':'s'}`:'a safe damage stack after the next unlock'}. Add only those hotbar keys to Macro, in order, starting each step at 10 ms.`,`Hold ${weaveKey} and ${macroKey} through safe damage, pressing or holding 1–8 at their cues. Manual input takes priority. Release ${macroKey} to stop Macro, and ${weaveKey} too when all attacks must stop.`].map(x=>`<li>${esc(x)}</li>`).join('');
  $('manual-keys').innerHTML=levelingMode?hotbar.flatMap(([skills,cue],i)=>skills.length?[`<div class="manual-key"><b>${i+1} · ${esc(skills.join(' / '))}</b><small>${esc(cue)}</small></div>`]:[]).join('')+(level>=16?'<div class="manual-key"><b>Space · Defiance</b><small>Break control or answer danger manually.</small></div>':''):p.manual.map(v=>`<div class="manual-key"><b>${esc(v.split(' — ')[0])}</b><small>${esc(v.split(' — ')[1]||'Manual timing')}</small></div>`).join('');
}
function renderBoards(m){
  const a=account(),nodes=nodeMap(),actual=obtainedNodes(),isAz=state.board==='Azphel',crystalBudget=isAz?(a.azphel||0):budget('crystals'),route=plannedRoute(isAz),plan=isAz?m.azphel:m.boards,steps=routeSteps(route,nodes),pendingSteps=steps.filter(x=>!actual.has(x.id)),queue=new Map(pendingSteps.slice(0,16).map((x,i)=>[x.id,i+1])),boardNext=pendingSteps.find(x=>x.board===state.board);
  $('board-icon-source').href=`https://aion2data.com/daevanion/${state.class}`;
  for(const [id,on] of [['board-mode-recommended',!customMode()],['board-mode-custom',customMode()]]){$(id).classList.toggle('active',on);$(id).setAttribute('aria-pressed',String(on))}
  $('custom-board-tools').hidden=!customMode();$('custom-board-status').textContent=customMode()?boardEditNotice:'';
  $('global-route-heading').textContent=customMode()?'Your custom plan · all four PvE boards':isLeveling()?`Level ${currentLevel()} · unlocked PvE boards`:'All four PvE boards · route overview';
  $('board-section-description').textContent=customMode()?`Select connected tiles on each unlocked board. The planned effects flow into Mastery; Azphel uses its own PvP crystals.`:isLeveling()?`Only boards unlocked by level ${currentLevel()} are included. Nezekan opens at 12, Zikel at 20, Vaizel at 30 and Triniel at 40. Tap a planned node to mark it obtained.`:'One connected purchase order spans Nezekan, Zikel, Vaizel and Triniel. The board tabs below show each part of that route. Azphel appears in PvP and uses its own currency.';
  renderGlobalBoardRoute(m,nodes);
  $('board-spent').textContent=a.context==='pvp'&&!isLeveling()?`${m.boards.spent}/${budget('crystals')} PvE · ${m.azphel.spent}/${a.azphel||0} Azphel`:`${m.boards.spent} / ${budget('crystals')} PvE crystals`;
  const wanted=isAz?[['PvPAmplifyDamage','PvP Damage Boost'],['PvPDecreaseDamage','PvP Damage Tolerance'],['AbnormalResistance','Status Resist'],['PvPAddDamage','PvP Attack']]:profile().kind==='healer'?[['Defense','Defense'],['HPMax','Max HP'],['CombatSpeed','Combat Speed'],['CoolTimeDecrease','Cooldown Reduction']]:[['AmplifyAllDamage','Damage Boost'],['DecreaseDamage','Damage Tolerance'],['CombatSpeed','Combat Speed'],['CoolTimeDecrease','Cooldown Reduction']];
  const shownEffects=isAz?m.azphelEffects:m.effects;
  $('board-summary').innerHTML=wanted.map(([key,label])=>{const meta=data().stats[key],v=shownEffects.stats[key]||0;return `<div><b>+${v/(meta?.div||1)}${meta?.pct?'%':''}</b><span>${label}</span></div>`}).join('');
  const available=a.context==='pvp'?allBoards():data().boards;
  $('board-tabs').innerHTML=available.map(b=>`<button type="button" data-board="${b.name}" class="${state.board===b.name?'active':''}" ${boardOpen(b.name)?'':`disabled title="Opens at level ${BOARD_UNLOCKS[b.name]}"`}>${b.name}<small>${boardOpen(b.name)?`${(b.name==='Azphel'?m.azphel:m.boards).perBoard[b.name]} / ${b.totalCost}`:`Opens Lv ${BOARD_UNLOCKS[b.name]}`}</small></button>`).join('');
  $('route-slider').max=crystalBudget;state.preview=Math.min(state.preview,crystalBudget);$('route-slider').value=state.preview;$('route-slider-value').textContent=state.preview;
  const preview=boardPlan(state.preview,isAz),board=available.find(b=>b.name===state.board),grid=new Map(board.nodes.map(n=>[`${n[1]}:${n[2]}`,n]));let html='';
  const boardSteps=steps.filter(x=>x.board===state.board),boardMarked=boardSteps.filter(x=>actual.has(x.id)).length,boardPlanned=boardSteps.filter(x=>preview.owned.has(x.id)).length;
  const recommendedTiles=new Set(routeSteps(isAz?ROUTES[state.class].azphel:activeRoute(),nodes).filter(x=>x.total<=crystalBudget).map(x=>x.id));
  $('board-map-title').textContent=`${state.board} · choose tiles on the board`;
  $('board-map-progress').textContent=`${boardPlanned} in preview · ${boardMarked} obtained. ${customMode()?'Click to edit connected planned path; mark obtained in the selected-node panel.':'Click any unlocked non-start tile to mark obtained; click again to undo.'}`;
  for(let r=1;r<=15;r++)for(let c=1;c<=15;c++){const n=grid.get(`${r}:${c}`);if(!n){html+='<span></span>';continue}const planned=preview.owned.has(n[0])||n[5]===0,obtained=actual.has(n[0]),order=queue.get(n[0]),kind=n[5]===0?'start':n[5]===4?'unique':typeof n[6]?.[0]?.[0]==='number'?'skill':'stat';html+=`<button type="button" class="node ${kind} ${planned?'planned':''} ${recommendedTiles.has(n[0])?'recommended':''} ${obtained?'obtained':''} ${order?'queued':''} ${order&&!planned?'queued-later':''} ${boardNext?.id===n[0]?'next':''} ${state.node===n[0]?'selected':''}" data-node="${n[0]}" title="${esc(effectText(n))}${order?` · upcoming click ${order} across boards`:''}${n[5]&&boardOpen(state.board)?` · click to ${customMode()?'edit custom plan':'mark obtained'}`:''}" aria-label="${esc(effectText(n))}; row ${r}, column ${c}; ${obtained?'obtained':planned?'planned':'later'}${order?`; upcoming click ${order}`:''}" aria-pressed="${customMode()?!!planned:obtained}" ${boardOpen(state.board)?'': 'disabled'}>${nodeVisual(n)}${order?`<span class="queue-badge" aria-hidden="true">${order}</span>`:''}</button>`}
  $('board-grid').innerHTML=html;const selected=state.node&&nodes.get(state.node)?.board===state.board?nodes.get(state.node).node:null;
  $('selected-node').innerHTML=selected?`<div class="selected-icon">${nodeVisual(selected)}</div><div><strong>${esc(effectText(selected))}</strong><small>Row ${selected[1]}, column ${selected[2]} · ${selected[5]} crystal${selected[5]===1?'':'s'} · ${selected[5]===0?'Start node':actual.has(selected[0])?'Obtained':preview.owned.has(selected[0])?'Planned within budget':'Unplanned'}. ${selected[5]?customMode()?'Click the tile to add or remove it from your custom plan.':'Click the tile to '+(actual.has(selected[0])?'unmark':'mark')+' obtained.':''}</small></div>`:`<strong>${state.board}</strong><small>${boardOpen(state.board)?customMode()?'Click a connected tile to plan it. Numbered badges show the order of your next selected tiles.':'Teal = planned path · gold fill = marked obtained · outlined = next unmarked node on this board. Click a node to mark or unmark it.':`Locked until level ${BOARD_UNLOCKS[state.board]}. Nodes become selectable then.`}</small>`;
  $('selected-node-obtained').hidden=!selected||selected[5]===0;
  $('selected-node-obtained').textContent=selected&&actual.has(selected[0])?'Unmark tile obtained':'Mark tile obtained';
  const boardSkills={},boardStats={};for(const n of board.nodes){if(!preview.owned.has(n[0]))continue;for(const [key,value] of n[6]){if(typeof key==='number'){const name=data().skills[key]?.name||String(key);boardSkills[name]=(boardSkills[name]||0)+value}else boardStats[key]=(boardStats[key]||0)+value}}
  $('board-effect-intro').textContent=boardOpen(state.board)?`${state.board} projected totals from the planned route at ${state.preview} crystals. Gold nodes are those you marked obtained.`:`${state.board} opens at level ${BOARD_UNLOCKS[state.board]}. This board has no purchasable path yet.`;
  const statLabel={FixingDamage:'Attack Bonus',Defense:'Defense Bonus',HPMax:'HP',MPMax:'MP'};
  const skillRows=Object.entries(boardSkills).map(([name,value])=>[name,`+${value}`]);
  const statRows=Object.entries(boardStats).map(([key,value])=>{const meta=data().stats[key];return [statLabel[key]||meta?.name||key,`+${value/(meta?.div||1)}${meta?.pct?'%':''}`]});
  const effectGroup=(label,rows)=>rows.length?`<h4>${label}</h4>${rows.map(([name,value])=>`<div><span>${esc(name)}</span><b>${esc(value)}</b></div>`).join('')}`:'';
  $('board-effect-list').innerHTML=skillRows.length||statRows.length?effectGroup('Skill levels',skillRows)+effectGroup('Stats',statRows):'<span class="empty">No planned effects yet.</span>';
  let spent=0,number=0,boardSpent=0;const rows=[];for(const x of route){const n=nodes.get(x.id).node;spent+=n[5];if(x.board!==state.board)continue;number++;if(spent<=state.preview)boardSpent+=n[5];rows.push({number,spent,cost:n[5],label:effectText(n),id:x.id,goal:x.goal,row:n[1],col:n[2]})}
  $('purchase-intro').textContent=`${boardSpent} ${isAz?'Azphel':'PvE'} crystals on ${state.board} at preview ${state.preview}. Click a purchase to locate it on the grid.`;
  $('purchase-list').innerHTML=rows.map(x=>`<button type="button" data-purchase="${x.id}" class="purchase ${x.spent<=state.preview?'current':''} ${actual.has(x.id)?'obtained':''}"><span class="n">${x.number}.</span><span class="route-step-icon">${nodeVisual(nodes.get(x.id).node)}</span><span>${esc(x.label)}<small>r${x.row} · c${x.col} · total ${x.spent}${x.goal&&x.goal!==x.id?` · leads to ${esc(effectText(nodes.get(x.goal).node))}`:''}${actual.has(x.id)?' · obtained':''}</small></span><span class="c">${x.cost} ✧</span></button>`).join('');
  const priority=new Set(masteryStages().slice(0,12).map(x=>x[0]));let total=0;const upcoming=[];for(const x of route){const n=nodes.get(x.id).node;total+=n[5];if(total<=plan.spent)continue;if(n[5]===4||typeof n[6]?.[0]?.[0]==='number'&&priority.has(data().skills[n[6][0][0]]?.name))upcoming.push({total,board:x.board,label:effectText(n)});if(upcoming.length>=5)break}
  $('board-next-heading').textContent=customMode()?'Your custom route':'Next key nodes';
  $('board-next').innerHTML=customMode()?`<p>${boardSteps.length} tiles selected on ${state.board}. ${crystalBudget-plan.spent} ${isAz?'Azphel':'PvE'} crystals remain unassigned. Select a connected tile to extend your plan.</p>`:upcoming.length?upcoming.map(x=>`<div class="next-unlock"><strong>${x.total} total</strong><span>${x.board}: ${esc(x.label)}</span></div>`).join(''):'<p>All key nodes on this route are funded.</p>';
  const method=isAz?ROUTES[state.class].methods.azphel:ROUTES[state.class].methods[a.context];
  const cpRoute=profile().kind!=='healer'&&Number(a.goalTarget)>0;
  const cpBasis=cpRoute?(liveRouteBasis?.baseCp===null?'Your gear is not recorded fully enough for CP calibration, so this route follows class/context mechanics without CP weighting.':'A complete recorded loadout can give a secondary CP-goal influence after class/context priorities.'):'The route follows researched class and context priorities using only gear bonuses you entered.';
  $('route-footnote').textContent=customMode()?`Custom mode uses the connected tiles you selected, in click order. Raising your crystal total lets you add more; lowering it makes later tiles unfunded until the budget returns. Marked obtained tiles are recorded separately from planned tiles. Azphel has its own currency and no skill levels.`:`${method}. The planner recalculates a connected route across ${isLeveling()?'unlocked boards':'all four PvE boards'} when your CP goal, Mastery, Stigma, context, obtained tiles, or recorded skill bonuses change. No equipment is assumed. Each crystal total funds a prefix; save crystals when the next tile costs more than you have. ${cpBasis} Marked tiles are carried into the route first, using connecting nodes where needed. This is an approximate scoring model, not a proven combat optimum. Azphel has its own currency and no skill levels.`;
  const weights=isAz?{skills:{},stats:activeWeights()?.stats||{}}:activeWeights();
  const topSkills=Object.entries(weights.skills||{}).sort((x,y)=>y[1]-x[1]).slice(0,3).map(x=>x[0]);
  const topStats=Object.entries(weights.stats||{}).filter(([key])=>isAz?key.startsWith('PvP')||key.startsWith('Abnormal'):!key.startsWith('PvP')).sort((x,y)=>y[1]-x[1]).slice(0,3).map(([key])=>data().stats[key]?.name||key);
  const boardPurpose={Nezekan:'Combat Speed and Cooldown Reduction corners support faster actions; inner branches give early skill ranks.',Zikel:'Damage Boost and Damage Tolerance corners trade offensive pressure against damage taken.',Vaizel:'Critical Damage Boost and Critical Damage Tolerance support burst and burst defense.',Triniel:'Multi-Hit Chance and Multi-Hit Resist support repeated hits and defense.',Azphel:'PvP Damage Boost, PvP Damage Tolerance and status resistance are the dedicated PvP gains.'};
  const bought=rows.filter(x=>x.spent<=state.preview&&x.cost>=2).slice(-3).map(x=>x.label);
  const nextRows=rows.filter(x=>x.spent>state.preview).slice(0,2).map(x=>x.label);
  const previewEffects=effects(preview.owned),bonusFromGear=!isAz?gearSkillLevels():{};
  const breakpointNames=Object.entries(weights.skills||{}).sort((x,y)=>y[1]-x[1]).slice(0,4).map(x=>x[0]);
  const breakpointCheck=!isAz?breakpointNames.map(name=>{const boardBonus=previewEffects.skills[name]||0,level=Math.min(40,(m.mastery.levels[name]||1)+boardBonus+(a.gear[name]||0)+(bonusFromGear[name]||0));const nextGate=[12,16].find(gate=>gate>level);return `${name}: +${boardBonus} board → effective ${level}${nextGate?` (${nextGate-level} to ${nextGate})`:''}`}).join(' · '):'';
  const routeSource=`Scored from Global node effects, your CP goal and recorded build, plus rotation, healing, and survival priorities. ${cpBasis} No creator route is copied. This is a heuristic, not measured DPS or a proven optimum.`;
  $('board-rationale').innerHTML=customMode()?`<h3>Your ${esc(state.board)} path</h3><p>You selected ${boardSteps.length} connected tiles here. ${boardPlanned} are funded at the preview budget. The colored board tiles and purchase order show your own route.</p><p><b>How to edit:</b> Click a tile touching your selected path. Remove branch-end tiles before an earlier tile that supports them. Mark obtained from the selected tile panel.</p><p><b>Effects:</b> Mastery uses the funded custom skill nodes. Your selected plan is saved with this class and included in a share link.</p>`:`<h3>Why this ${esc(state.board)} path?</h3><p><b>${esc({party:'Group PvE',solo:'Solo',pvp:'PvP'}[a.context])}:</b> ${esc(boardPurpose[state.board])}</p><p><b>Priority skills:</b> ${esc(topSkills.join(', ')||'Azphel has no skill nodes')}. <b>Priority stats:</b> ${esc(topStats.join(', '))}.</p><p><b>At ${state.preview} crystals:</b> ${esc(bought.join(' · ')||'follow the connected approach to the first key node')}.</p>${breakpointCheck?`<p><b>Across all four boards at ${state.preview} crystals:</b> ${esc(breakpointCheck)}. Effective levels include planned Mastery and entered gear bonuses.</p>`:''}<p><b>Next on this board:</b> ${esc(nextRows.join(' → ')||'this board is fully planned')}.</p><p><b>Route basis:</b> ${esc(method)}. ${esc(routeSource)}</p><a href="${esc(data().sources.nodes)}" target="_blank" rel="noopener noreferrer">Check the Global board data ↗</a>`;
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
    ['Gear sockets and Theostones','Global item tooltips list stone and Theostone sockets. The editor uses those counts when available and lets you record the stone, rolled stat and value. Weapons and guards can carry one Theostone at Epic or Unique grade; identical effects do not stack. Valid stone rolls add a conservative amount to the planner’s approximate CP estimate.',`https://metabot.gg/en/aion-2/guides/gear-enhancement-guide`,'Open Global socket rules'],
    ['Levels 1–45 point table','The Global client level table supplies the level-only Mastery, Stigma, slot and crystal baseline. Quest, Sealed Dungeon and other rewards are additional. This planner carries user-entered extras forward as the level changes.',`https://aion2data.com/leveling`,'Open level table'],
    ['Skill and board level gates',`The Global class table supplies each ${p.name} skill's unlock level. Nezekan, Zikel, Vaizel and Triniel open at 12, 20, 30 and 40; Stigma slots open at 22, 27, 32 and 37.`, `https://aion2data.com/classes/${state.class}`,'Open class unlocks'],
    ['Mastery rank gates','SkillAcquireData limits rank 2 to the unlock level, then adds one purchasable rank every three character levels. The leveling plan respects that gate and buys usable early skills before chasing rank 8. Point costs are 1 for ranks 2–4, 2 for 5–7, and 4 for 8–10.',`https://aion2data.com/skills/${firstSkill.slug}`,'Open skill rank table'],
    ['Combat Power estimate','The game calculates exact Combat Power server-side. The planner provides a level-45 build estimate fitted to public NA East profiles and uses reverse-engineered weights for supported board stats. It is a planning range, and unrecorded systems can move the real score outside it.',`https://aion2data.com/get-stronger`,'Open stat sources'],
    ['Global client nodes','Board positions, costs, effects and skill names from Aion2Data Global client tables. Compare tooltips after a patch.',d.sources.nodes,'Open board data'],
    ['Calculated board progression',`Group, Solo and PvP use connected routes recalculated from class rotations, role stat scores, current Mastery/gear skill ranks, recorded purchases and skill level breakpoints. Damage and tank classes also weigh estimated CP gain against the entered CP target, without assuming player equipment. The full 570-point PvE route supplies a recommendation for every crystal total; a costly next tile can require saving points. Azphel uses its own 232-point PvP route. These scores are planning assumptions, not measured combat results.`,d.sources.nodes,'Check Global board nodes'],
    ['Specialty choices','Option text is reconciled to Global skill names. Daeva Architect scores damage, healing, defense, cooldown and skill-trigger effects for its default PvE choices; gear or Arcana can unlock later choices. This text heuristic cannot model every interaction, so compare live tooltips.',`https://aion2codex.com/guides/${state.class}`,'Check option effects'],
    ['Stigmas and skills','Global class skill and stigma effects; the four chosen slots prioritize this planner’s role.',`https://aion2.grimvane.app/companion/wiki/${state.class}-skills/`,'Open class skills'],
    ['Macro setup','The in-game macro uses hotbar keys, up to four skills per stack and delays per step. The layouts are starting points.',state.class==='templar'?`https://mobalytics.gg/gamebase/guides/aion-2-templar-pve-build`:`https://aion2.grimvane.app/companion/wiki/macros-guide/`,'Open macro guide'],
    ['1–8 key layout','The number-key placement is this planner’s ergonomic recommendation. Defiance shares Space with jump/glide by default; the separate Defiance key setting is optional.',`https://couga54.github.io/aion2-guides/en/settings/`,'Open control settings'],
    ['All Global titles','The searchable catalog includes 528 Global titles in the current source, including cosmetic titles and both faction variants. Equipped recommendations use earned titles and a simple role heuristic.',`https://metabot.gg/en/aion-2/titles`,'Open Global title catalog'],
    ['Class build context',`${p.name} is planned as ${p.role.toLowerCase()}. Compare alternate damage or support presets before swapping roles.`,`https://metabot.gg/en/aion-2/guides/class-builds-guide`,'Open all-class guide']
  ];
  if(state.class==='templar')cards.push(
    ['Templar creator cross-check','The linked Questlog build has separate leveling, offensive and tank presets with different macros. It is an endgame comparison, not a route copied into this planner; evaluate its effective skill levels against your actual crystal and gear budgets.','https://questlog.gg/aion-2/en/character-builder/TheNetherImpaleOfElements?build-id=10500','Open Questlog build'],
    ['Templar rotation cross-check','The video demonstrates a charged Punishment and manual Doom Shield sequence. Its skill and Stigma priorities are one player’s recommendations, so use them to test the planner’s mechanics rather than treating them as an optimum.','https://www.youtube.com/watch?v=RtVBVKIkee8&t=33s','Open video']
  );
  $('source-cards').innerHTML=cards.map(([title,body,url,label])=>`<div class="source-card"><b>${esc(title)}</b><p>${esc(body)}</p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a></div>`).join('');
}
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{state.tab=b.dataset.tab;$('mobile-more-menu').hidden=true;$('mobile-more-button').setAttribute('aria-expanded','false');render()}));
$('build-flow').addEventListener('click',e=>{const button=e.target.closest('[data-flow-tab]');if(!button)return;state.tab=button.dataset.flowTab;render();document.querySelector('.tab-panel.active')?.scrollIntoView({behavior:'smooth',block:'start'})});
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
for(const [id,key] of [['goal-target','goalTarget'],['goal-observed','goalObserved']])$(id).addEventListener('change',e=>{if(key==='goalObserved'&&profile().kind!=='healer')return;account()[key]=clamp(e.target.value,0,1000000000);render()});
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
$('board-mode-recommended').addEventListener('click',()=>{account().boardMode='recommended';boardEditNotice='';render()});
$('board-mode-custom').addEventListener('click',()=>{account().boardMode='custom';boardEditNotice='Select a connected tile on any unlocked board, or copy the current recommendation.';render()});
$('copy-recommended-board').addEventListener('click',()=>{const nodes=nodeMap();account().customNodes=routeSteps(activeRoute(),nodes).filter(x=>x.total<=budget('crystals')).map(x=>x.id);account().customAzphelNodes=routeSteps(ROUTES[state.class].azphel,nodes).filter(x=>x.total<=(account().azphel||0)).map(x=>x.id);boardEditNotice='Copied the funded recommended route. Click tiles to customize it.';render()});
$('clear-custom-board').addEventListener('click',()=>{account().customNodes=[];account().customAzphelNodes=[];boardEditNotice='Custom plan cleared. Obtained marks are kept separately.';state.node=null;render()});
$('global-board-allocation').addEventListener('click',e=>{const b=e.target.closest('[data-board-jump]');if(!b||!boardOpen(b.dataset.boardJump))return;state.board=b.dataset.boardJump;state.preview=budget('crystals');state.node=null;renderBoards(model())});
$('global-route-next').addEventListener('click',e=>{const b=e.target.closest('[data-route-node]');if(!b)return;state.board=b.dataset.routeBoard;state.preview=budget('crystals');state.node=Number(b.dataset.routeNode);renderBoards(model());document.querySelector('.node.selected')?.scrollIntoView({behavior:'smooth',block:'center',inline:'center'})});
$('board-grid').addEventListener('click',e=>{
  const b=e.target.closest('[data-node]');if(!b||!boardOpen(state.board))return;
  const id=Number(b.dataset.node),entry=nodeMap().get(id);
  if(!entry||entry.board!==state.board)return;
  state.node=id;
  if(entry.node[5]===0){renderBoards(model());return}
  // The v2 change accidentally turned a tile click into inspect-only.
  // Restore the pre-v2 one-click toggle in Recommended mode. Custom mode
  // continues to use tile clicks for planning connected paths, with the
  // existing explicit Obtained control for marking purchases separately.
  if(customMode()){setCustomNode(id);render();return}
  const marked=obtainedNodes();
  if(marked.has(id))marked.delete(id);else marked.add(id);
  storeObtained(marked);
  // Re-evaluate the complete model: acquired board bonuses, Mastery ranks,
  // Specials and macro suggestions must refresh on the SAME interaction.
  render();
});
$('selected-node-obtained').addEventListener('click',()=>{const entry=nodeMap().get(state.node);if(!entry||entry.node[5]===0||!boardOpen(entry.board))return;const marked=obtainedNodes();if(marked.has(state.node))marked.delete(state.node);else marked.add(state.node);storeObtained(marked);render()});
$('mark-planned-button').addEventListener('click',()=>{const marked=obtainedNodes(),nodes=nodeMap();for(const step of routeSteps(plannedRoute(),nodes))if(step.total<=budget('crystals'))marked.add(step.id);storeObtained(marked);renderBoards(model())});
$('clear-obtained-button').addEventListener('click',()=>{const nodes=nodeMap();storeObtained(new Set([...obtainedNodes()].filter(id=>nodes.get(id).board==='Azphel')));renderBoards(model())});
$('purchase-list').addEventListener('click',e=>{const b=e.target.closest('[data-purchase]');if(b){state.node=Number(b.dataset.purchase);renderBoards(model())}});
$('route-slider').addEventListener('input',e=>{state.preview=clamp(e.target.value,0,state.board==='Azphel'?(account().azphel||0):budget('crystals'));renderBoards(model())});
initGear();state.preview=state.class?budget('crystals'):FRESH_45.crystals;render();
