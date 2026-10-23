/* AION 2 Global leveling combat: intentionally independent of endgame profiles.
 * Hotbar row 0 is the BOTTOM (highest priority) skill, and a macro step
 * presses one hotbar column rather than typing sequential skill commands.
 * Class active unlocks are supplied by skill_unlocks.json, not estimated.
 * Research: https://aion2data.com/macros (Global client 2026.10.21),
 * https://aion2.grimvane.app/companion/wiki/macros-guide/ .
 */
const LEVELING_COMBAT={
 gladiator:{
  weave:'Keen Strike',key:'Q',
  stack:['Overhead Slam','Rending Blow'],noCooldown:['Rending Blow'],
  manual:['Leaping Slam','Ruinous Blow','Crushing Wave','Rush Strike'],
  focus:'Hold Keen Strike for MP and animation weaving. Overhead Slam takes priority; Rending Blow only fills gaps. Use mobility and longer damage windows yourself.'
 },
 templar:{
  weave:'Vicious Strike',key:'E',
  stack:['Judgment','Shield Smite','Warding Strike','Pummel'],noCooldown:['Pummel'],
  manual:['Punishment','Warding Strike','Annihilate','Poach','Shield Rush','Debilitating Smash'],
  focus:'Judgment is the first choice when available, while Pummel is the last fallback. Charge Punishment and time shield defenses yourself.'
 },
 assassin:{
  weave:'Quick Slice',key:'E',
  stack:['Insignia Explosion','Heart Gore','Savage Roar'],noCooldown:['Savage Roar'],
  manual:['Ambush','Storm Rampage','Shadowstrike','Whirlwind Slice','Flash Slice','Infiltrate'],
  focus:'Keep Quick Slice on your basic key. The stack favors Insignia spending and critical-hit Heart Gore; choose position and burst windows manually.'
 },
 ranger:{
  weave:'Snipe',key:'E',
  stack:['Drill Dart','Burst Arrow','Gale Arrow'],noCooldown:[],
  manual:['Deadshot','Marking Shot','Arrow Scattershot','Snare Shot','Explosion Trap'],
  focus:'Keep Snipe going for MP and Precision. Charge Deadshot fully by hand; use Marking Shot only when you intend to move.'
 },
 sorcerer:{
  weave:'Flame Arrow',weaveKey:'R',key:'E',
  stack:['Firestorm','Bittercold Wind','Blaze'],noCooldown:[],
  manual:['Hellfire','Ice Chain',"Winter's Shackles",'Frost Burst','Flame Scattershot'],
  focus:'Hold Flame Arrow to recover MP between cooldowns. Let the stack repeat short damage skills; fully charge Hellfire manually at level 14.'
 },
 spiritmaster:{
  weave:'Cold Shock',key:'Q',
  stack:['Jointstrike: Curse'],noCooldown:[],
  manual:['Combustion','Summon: Fire Spirit','Summon: Water Spirit','Summon: Earth Spirit','Elemental Fusion','Dimensional Control'],
  focus:'Keep your spirit summoned. Cold Shock and manual Combustion are your early repeatable attacks; use Jointstrike when ready and save Elemental Fusion for its actual condition.'
 },
 cleric:{
  weave:"Earth's Retribution",key:'E',
  stack:['Divine Aura','Condemnation','Chain of Torment'],noCooldown:[],
  manual:['Healing Light','Light of Regeneration','Radiant Recovery','Bolt','Debilitating Mark'],
  focus:'Damage only while safe. Keep routine heals, recovery and group protection off the damage macro—even when leveling with a party.'
 },
 chanter:{
  weave:'Onslaught',key:'E',
  stack:['Dark Crush','Impactful Crush','Spinning Strike'],noCooldown:[],
  manual:['Recuperation','Spinning Strike','Rushing Smash','Wave Blow','Heat Wave Blow'],
  focus:'Onslaught stays outside the macro. Dark Crush needs a trigger; before its cooldown-removal Specialty, use one trigger and time other triggers manually.'
 }
};
function buildLevelingCombat(cls,level,context,unlocks,stigmaNames,stigmaLevels,specialtyEnabled=()=>false){
 const plan=LEVELING_COMBAT[cls];if(!plan)return null;
 const available=name=>typeof unlocks[name]==='number'&&unlocks[name]<=level;
 const stage=level<4?'starter':level<22?'core':'stigmas';
 const macroUnlocked=level>=4;
 const stack=macroUnlocked?plan.stack.filter(name=>{
  if(!available(name)||name===plan.weave)return false;
  // Warding Strike protects the group: avoid consuming it automatically.
  if(cls==='templar'&&context==='party'&&name==='Warding Strike')return false;
  // Only one Chanter trigger until the cooldown-removal option is equipped.
  if(cls==='chanter'&&name==='Spinning Strike'&&!specialtyEnabled('Dark Crush',5))return false;
  return true;
 }).slice(0,4):[];
 const manual=plan.manual.filter(name=>available(name)&&(!stack.includes(name)||(
  (cls==='templar'&&name==='Warding Strike')||
  (cls==='chanter'&&name==='Spinning Strike')
 ))).filter(name=>!stack.includes(name));
 const stigma=(stigmaNames||[]).filter(name=>(stigmaLevels||{})[name]>0);
 const next=Object.entries(unlocks).filter(([name,at])=>at>level&&!name.includes('Defiance'))
  .filter(([name])=>plan.stack.includes(name)||plan.manual.includes(name))
  .sort((a,b)=>a[1]-b[1])[0];
 const noCooldown=plan.noCooldown;
 // Row zero must ALWAYS be the highest priority, at the bottom visually.
 // A no-cooldown fallback can be used only after ALL conditional/cooldown skills.
 if(stack.some((name,index)=>noCooldown.includes(name)&&stack.slice(index+1).some(other=>!noCooldown.includes(other))))
  throw new Error('Leveling macro priority invalid for '+cls);
 return {cls,level,stage,macroUnlocked,weave:plan.weave,weaveKey:plan.weaveKey||'LMB',key:plan.key,
   stack,manual,stigmas:stigma,focus:plan.focus,
   next:next?{name:next[0],level:next[1]}:null,
   rows:stack.map((name,row)=>({name,row})),steps:stack.length?[plan.key]:[]};
}

function renderLevelingCombatMarkup(plan,macroKey){
 const iconFor=name=>gameSkillIconMarkup(plan.cls,name,'leveling-skill-icon');
 const skill=name=>'<span class="leveling-skill">'+iconFor(name)+'<strong>'+esc(name)+'</strong></span>';
 const rows=[...plan.rows].reverse().map(({row,name})=>
  '<div class="leveling-stack-row'+(row===0?' is-priority':'')+'" data-leveling-skill="'+esc(name)+'" data-row="'+row+'">'+
  '<span class="leveling-row-number">Row '+row+'</span>'+skill(name)+
  (row===0?'<span class="leveling-first">1st priority</span>':'')+'</div>').join('');
 const manual=plan.manual.slice(0,5).map(name=>'<li>'+skill(name)+'</li>').join('');
 const stigma=plan.stigmas.length?'<p class="leveling-stigmas"><b>Learned Stigmas:</b> '+esc(plan.stigmas.join(' · '))+
  '. Keep buffs, protection and situational Stigmas manual.</p>':
  plan.level>=22?'<p class="leveling-stigmas">Stigma slots open while leveling; only use Stigmas after assigning earned points.</p>':'';
 const next=plan.next?'<span class="leveling-up-next">Next combat unlock: Lv '+plan.next.level+' · '+esc(plan.next.name)+'</span>':'';
 const weave='<div class="leveling-basic">'+
  '<span class="leveling-phase-label">01 / Your repeat attack</span>'+skill(plan.weave)+
  '<p>Hold or press <b>'+esc(plan.weaveKey)+'</b> when attacking safely. This is separate from the macro.</p></div>';
 const starter=plan.macroUnlocked?'<div class="leveling-skill-column">'+
  '<div class="leveling-phase-label">02 / ONE damage stack <span>Hotbar '+esc(plan.key)+'</span></div>'+
  '<p class="leveling-short-note">Arrange the stack as it appears in the game: <b>Row 0 is at the bottom and fires first.</b> A no-cooldown fallback belongs at the top.</p>'+
  '<div id="leveling-stack" class="leveling-stack-rows">'+rows+'</div></div>'+
  '<div class="leveling-macro-callout"><span class="leveling-phase-label">03 / In-game macro</span>'+
  '<div id="leveling-macro-step"><b>ONE step:</b> hotbar <kbd>'+esc(plan.key)+'</kbd> <span>· start at 10 ms</span></div>'+
  '<p>Bind the game Macro key to <kbd>'+esc(macroKey)+'</kbd> and hold it alongside '+
  '<kbd>'+esc(plan.weaveKey)+'</kbd> while damage is safe. The macro <b>presses this stack’s hotkey</b>; it is not a list of individual skills. '+
  'Release it for movement, mechanics, healing or charged attacks.</p></div>':
  '<div class="leveling-no-macro" id="leveling-macro-step"><b>Macro not available yet.</b>'+
  '<p>The Skills menu and presets unlock at level 4. Until then, use your repeat attack and newly unlocked skills manually.</p></div>';
 return '<div class="leveling-combat-heading"><div><span class="eyebrow">LEVEL '+plan.level+' · '+(plan.stage==='starter'?'EARLY COMBAT':plan.stage==='core'?'CORE COMBAT':'STIGMA PROGRESSION')+'</span>'+
  '<h3>Starter combat setup</h3><p>'+esc(plan.focus)+'</p></div>'+next+'</div>'+
  '<div class="leveling-combat-layout">'+weave+starter+'</div>'+
  '<div class="leveling-manual-summary"><div><span class="leveling-phase-label">Keep these manual</span>'+
  (manual?'<ul id="leveling-manual">'+manual+'</ul>':'<p>Use your repeat attack while the next combat skill unlocks.</p>')+
  (plan.level>=16?'<p class="leveling-defiance">Defiance (Space) is a manual control-break, not a damage-loop step.</p>':'')+
  stigma+'</div><div class="leveling-setup-instructions"><span class="leveling-phase-label">Set it up in game</span>'+
  (plan.macroUnlocked?'<p><b>Skills (K)</b> → stack the shown skills on '+esc(plan.key)+'. Add exactly one Macro step targeting that key. '+
  'Bind Macro under <b>Settings → Key Settings → General → Macro</b>. 10 ms is a starting delay, not a guaranteed cast order or optimal timing.</p>':
  '<p>Skills (K) becomes available at level 4. No key remapping or macro setup needed yet.</p>')+
  '<p class="leveling-setup-warning">Use only the game’s built-in macro. Manual inputs take priority; mouse-bound macros do not work in AION 1 control mode. '+
  'Test each new skill and Specialty on a training target—this is a leveling starting point, not a measured maximum-DPS rotation.</p>'+
  '</div></div>';
}
