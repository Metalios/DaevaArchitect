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
  // A tiny fire starter is useful before Frost Burst unlocks. From Lv 10,
  // Sorcerer has meaningful setup/proc chains and should not be squeezed into
  // the generic one-column melee-style leveling recommendation.
  stack:['Firestorm','Bittercold Wind','Blaze'],
  upgradedAt:10,
  upgradedStacks:[
    {key:'E',label:'Apply marks and cooldown damage',
      stack:["Winter's Shackles",'Bittercold Wind','Frost','Firestorm']},
    {key:'Q',label:'Spend Fire Mark / Frost',
      stack:['Blaze','Frost Burst']}
  ],
  noCooldown:[],
  manual:['Hellfire','Wish of Concentration','Ice Chain','Flame Scattershot',"Winter's Shackles",'Frost Burst'],
  focus:'Keep Flame Arrow available as your repeat attack. At Lv 10, split setup and conditional follow-ups into two key stacks instead of one giant rotation. Charge Hellfire and time Wish of Concentration manually.'
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
 const candidates=macroUnlocked
   ?(plan.upgradedStacks&&level>=plan.upgradedAt?plan.upgradedStacks:
      [{key:plan.key,label:'Cooldown damage',stack:plan.stack}])
   :[];
 const stacks=candidates.map(group=>({
   key:group.key,label:group.label,
   stack:group.stack.filter(name=>{
     if(!available(name)||name===plan.weave)return false;
     // Warding Strike protects the group: avoid consuming it automatically.
     if(cls==='templar'&&context==='party'&&name==='Warding Strike')return false;
     // Only one Chanter trigger until the cooldown-removal option is equipped.
     if(cls==='chanter'&&name==='Spinning Strike'&&!specialtyEnabled('Dark Crush',5))return false;
     return true;
   }).slice(0,4)
 })).filter(group=>group.stack.length);
 const stack=stacks[0]?.stack||[];
 const stacked=new Set(stacks.flatMap(group=>group.stack));
 const manual=plan.manual.filter(name=>available(name)&&!stacked.has(name));
 const stigma=(stigmaNames||[]).filter(name=>(stigmaLevels||{})[name]>0);
 const next=Object.entries(unlocks).filter(([name,at])=>at>level&&!name.includes('Defiance'))
  .filter(([name])=>plan.stack.includes(name)||plan.manual.includes(name)||
   plan.upgradedStacks?.some(group=>group.stack.includes(name)))
  .sort((a,b)=>a[1]-b[1])[0];
 const noCooldown=plan.noCooldown;
 // Row zero must ALWAYS be the highest priority, at the bottom visually.
 // A no-cooldown fallback can be used only after ALL conditional/cooldown skills.
 for(const group of stacks)if(group.stack.some((name,index)=>
   noCooldown.includes(name)&&group.stack.slice(index+1).some(other=>!noCooldown.includes(other))))
  throw new Error('Leveling macro priority invalid for '+cls);
 return {cls,level,stage,macroUnlocked,weave:plan.weave,weaveKey:plan.weaveKey||'LMB',key:plan.key,
   stack,stacks:stacks.map(group=>({...group,rows:group.stack.map((name,row)=>({name,row}))})),
   manual,stigmas:stigma,focus:plan.focus,
   next:next?{name:next[0],level:next[1]}:null,
   rows:stack.map((name,row)=>({name,row})),steps:stacks.map(group=>group.key)};
}

function renderLevelingCombatMarkup(plan,macroKey){
 const iconFor=name=>gameSkillIconMarkup(plan.cls,name,'leveling-skill-icon');
 const skill=name=>'<span class="leveling-skill">'+iconFor(name)+'<strong>'+esc(name)+'</strong></span>';
 const stackPanels=(plan.stacks||[]).map(group=>{
  const rows=[...group.rows].reverse().map(({row,name})=>
   '<div class="leveling-stack-row'+(row===0?' is-priority':'')+'" data-leveling-skill="'+esc(name)+'" data-row="'+row+'">'+
   '<span class="leveling-row-number">Row '+row+'</span>'+skill(name)+
   (row===0?'<span class="leveling-first">1st priority</span>':'')+'</div>').join('');
  return '<section class="leveling-stack-panel" data-stack-key="'+esc(group.key)+'">'+
   '<span class="leveling-stack-label"><kbd>'+esc(group.key)+'</kbd> '+esc(group.label)+'</span>'+
   '<div '+(group.key===plan.key?'id="leveling-stack" ':'')+'class="leveling-stack-rows">'+rows+'</div></section>';
 }).join('');
 const manual=plan.manual.slice(0,5).map(name=>'<li>'+skill(name)+'</li>').join('');
 const stigma=plan.stigmas.length?'<p class="leveling-stigmas"><b>Learned Stigmas:</b> '+esc(plan.stigmas.join(' · '))+
  '. Keep buffs, protection and situational Stigmas manual.</p>':
  plan.level>=22?'<p class="leveling-stigmas">Stigma slots open while leveling; only use Stigmas after assigning earned points.</p>':'';
 const next=plan.next?'<span class="leveling-up-next">Next combat unlock: Lv '+plan.next.level+' · '+esc(plan.next.name)+'</span>':'';
 const weave='<div class="leveling-basic">'+
  '<span class="leveling-phase-label">01 / Your repeat attack</span>'+skill(plan.weave)+
  '<p>Hold or press <b>'+esc(plan.weaveKey)+'</b> when attacking safely. This is separate from the macro.</p></div>';
 const starter=plan.macroUnlocked?'<div class="leveling-skill-column">'+
  '<div class="leveling-phase-label">02 / '+(plan.steps.length===1?'ONE damage stack':'Two focused damage stacks')+
  '<span>'+esc(plan.steps.join(' + '))+'</span></div>'+
  '<p class="leveling-short-note">Arrange each stack as it appears in game: <b>Row 0 is at the bottom and fires first.</b> Cooldown/condition priorities must sit below filler skills.</p>'+
  '<div id="leveling-stacks" class="leveling-stack-panels">'+stackPanels+'</div></div>'+
  '<div class="leveling-macro-callout"><span class="leveling-phase-label">03 / In-game macro</span>'+
  '<div id="leveling-macro-step"><b>'+(plan.steps.length===1?'ONE step:':'TWO steps:')+'</b> '+
  plan.steps.map((key,i)=>'<span class="leveling-macro-entry">Step '+(i+1)+': <kbd>'+esc(key)+'</kbd> · 10 ms</span>').join('')+'</div>'+
  '<p>Bind the game Macro key to <kbd>'+esc(macroKey)+'</kbd> and hold it alongside '+
  '<kbd>'+esc(plan.weaveKey)+'</kbd> while damage is safe. The macro <b>presses the hotbar stack keys</b>, not individual skills; step timing is not a guaranteed attack order. '+
  'Release it for movement, mechanics, healing or charged attacks.</p></div>':
  '<div class="leveling-no-macro" id="leveling-macro-step"><b>Macro not available yet.</b>'+
  '<p>The Skills menu and presets unlock at level 4. Until then, use your repeat attack and newly unlocked skills manually.</p></div>';
 return '<div class="leveling-combat-heading"><div><span class="eyebrow">LEVEL '+plan.level+' · '+(plan.stage==='starter'?'EARLY COMBAT':plan.stage==='core'?'CORE COMBAT':'STIGMA PROGRESSION')+'</span>'+
  '<h3>Starter combat setup</h3><p>'+esc(plan.focus)+'</p></div>'+next+'</div>'+
  '<div class="leveling-combat-layout'+(plan.steps.length>1?' leveling-multi-stack':'')+'">'+weave+starter+'</div>'+
  '<div class="leveling-manual-summary"><div><span class="leveling-phase-label">Keep these manual</span>'+
  (manual?'<ul id="leveling-manual">'+manual+'</ul>':'<p>Use your repeat attack while the next combat skill unlocks.</p>')+
  (plan.level>=16?'<p class="leveling-defiance">Defiance (Space) is a manual control-break, not a damage-loop step.</p>':'')+
  stigma+'</div><div class="leveling-setup-instructions"><span class="leveling-phase-label">Set it up in game</span>'+
  (plan.macroUnlocked?'<p><b>Skills (K)</b> → stack the shown skills on '+esc(plan.steps.join(' and '))+'. Add '+(plan.steps.length===1?'one Macro step':'one Macro step for each of those two keys')+'. '+
  'Bind Macro under <b>Settings → Key Settings → General → Macro</b>. 10 ms is a starting delay, not a guaranteed cast order or optimal timing.</p>':
  '<p>Skills (K) becomes available at level 4. No key remapping or macro setup needed yet.</p>')+
  '<p class="leveling-setup-warning">Use only the game’s built-in macro. Manual inputs take priority; mouse-bound macros do not work in AION 1 control mode. '+
  'Test each new skill and Specialty on a training target—this is a leveling starting point, not a measured maximum-DPS rotation.</p>'+
  '</div></div>';
}
