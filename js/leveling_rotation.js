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
  weave:'Flame Arrow',weaveKey:'LMB',key:'Q',
  // Global Easy PvE: RMB automates all routine class damage, attack debuffs
  // and conditional Stagger followups. Hellfire and real buffs remain manual.
  // Avoid Ice Chain as no-CD spam competing for MP/animation uptime.
  stack:['Bittercold Wind','Firestorm','Blaze'],
  upgradedAt:10,
  upgradedStacks:[
    {key:'Q',label:'Auto damage, Frost and debuff setup',macro:true,
      stack:["Winter's Shackles",'Bittercold Wind','Frost','Firestorm']},
    {key:'E',label:'Auto Fire Mark, Frost and Stagger finishers',macro:true,
      stack:['Blaze','Frost Burst','Flame Scattershot']},
    {key:'R',label:'Auto ground damage if equipped',macro:true,
      stack:['Fire Wall','Cold Storm']}
  ],
  // Scattershot has no cooldown but is usable only on a Staggered enemy;
  // place it after both ordinary conditional finishers. Ice Chain is left
  // out entirely because its unrestricted casts spend MP needed for damage.
  noCooldown:['Flame Scattershot'],
  manual:['Hellfire','Wish of Concentration'],
  focus:'Easy sustained Sorcerer: hold LMB + RMB and let the Macro handle damage, Frost, finishers and learned ground attacks. Only fully charged Hellfire and manual buffs need extra keys.'
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
 const stigma=(stigmaNames||[]).filter(name=>(stigmaLevels||{})[name]>0);
 const available=name=>(typeof unlocks[name]==='number'&&unlocks[name]<=level)||stigma.includes(name);
 const stage=level<4?'starter':level<22?'core':'stigmas';
 const macroUnlocked=level>=4;
 const candidates=(macroUnlocked
   ?(plan.upgradedStacks&&level>=plan.upgradedAt?plan.upgradedStacks:
      [{key:plan.key,label:'Automatic damage',macro:true,stack:plan.stack}])
   :[]).map(group=>({...group,stack:[...group.stack]}));
 // Wish of Concentration is an intentional manual buff. Its cooldown-reset
 // Specialty can alter WHEN the player presses it, but never auto-casts it.
 const stacks=candidates.map(group=>({
   key:group.key,label:group.label,macro:group.macro!==false,
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
 const next=Object.entries(unlocks).filter(([name,at])=>at>level&&!name.includes('Defiance'))
  .filter(([name])=>plan.stack.includes(name)||plan.manual.includes(name)||
   plan.upgradedStacks?.some(group=>group.stack.includes(name)))
  .sort((a,b)=>a[1]-b[1])[0];
 const noCooldown=plan.noCooldown;
 const manualChoices=cls==='sorcerer'
  ? ['Hellfire','Wish of Concentration','Element Enhancement',
     'Delayed Explosion','Steel Barrier','Arctic Armor','Ice Chain']
      .filter(name=>available(name)&&!stacked.has(name))
  : [...manual,...stigma].filter((name,i,list)=>list.indexOf(name)===i);
 const directKeys=manualChoices.slice(0,cls==='sorcerer'?8:4).map((name,i)=>({
   key:String(i+1),name,
   tip:name==='Hellfire'?'Hold to fully charge':
     name==='Wish of Concentration'?'Buff: after major cooldowns with reset Specialty':
     name==='Element Enhancement'?'Damage buff: use for elites/bosses':
     name==='Delayed Explosion'?'Manual burst debuff':
     name==='Fire Wall'||name==='Cold Storm'?'Ground spell: stable targets only':
     name==='Steel Barrier'||name==='Arctic Armor'?'Emergency defense only':
     name==='Ice Chain'?'Optional manual control, not part of damage loop':
     /Heal|Protection|Shield|Armor|Barrier/.test(name)?'Use when needed':'Press when needed'
 }));
 // Row zero must ALWAYS be the highest priority, at the bottom visually.
 // A no-cooldown fallback can be used only after ALL conditional/cooldown skills.
 for(const group of stacks)if(group.stack.some((name,index)=>
   noCooldown.includes(name)&&group.stack.slice(index+1).some(other=>!noCooldown.includes(other))))
  throw new Error('Leveling macro priority invalid for '+cls);
 return {cls,level,stage,macroUnlocked,weave:plan.weave,weaveKey:plan.weaveKey||'LMB',key:plan.key,
   stack,stacks:stacks.map(group=>({...group,rows:group.stack.map((name,row)=>({name,row}))})),
   manual,manualKeys:directKeys,stigmas:stigma,focus:plan.focus,
   next:next?{name:next[0],level:next[1]}:null,
   rows:stack.map((name,row)=>({name,row})),steps:stacks.filter(group=>group.macro).map(group=>group.key)};
}

function renderLevelingCombatMarkup(plan,macroKey){
 const iconFor=name=>gameSkillIconMarkup(plan.cls,name,'leveling-skill-icon');
 const skill=name=>'<span class="leveling-skill">'+iconFor(name)+'<strong>'+esc(name)+'</strong></span>';
 const stackPanels=(plan.stacks||[]).map(group=>{
  const rows=[...group.rows].reverse().map(({row,name})=>
   '<div class="leveling-stack-row'+(row===0?' is-priority':'')+'" data-leveling-skill="'+esc(name)+'" data-row="'+row+'">'+
   '<span class="leveling-row-number">Row '+row+'</span>'+skill(name)+
   (row===0?'<span class="leveling-first">1st priority</span>':'')+'</div>').join('');
  return '<section class="leveling-stack-panel" data-stack-key="'+esc(group.key)+'" data-stack-role="'+(group.macro?'macro':'manual')+'">'+
   '<span class="leveling-stack-label"><kbd>'+esc(group.key)+'</kbd> '+esc(group.label)+'</span>'+
   '<p class="leveling-stack-role">'+(group.macro?'RMB automatically tries this stack':'You press this stack yourself when needed')+'</p>'+
   '<div '+(group.key===plan.key?'id="leveling-stack" ':'')+'class="leveling-stack-rows">'+rows+'</div></section>';
 }).join('');
 const manualItem=({key,name,tip})=>'<li data-manual-key="'+esc(key)+'"><kbd>'+esc(key)+'</kbd>'+skill(name)+'<small>'+esc(tip)+'</small></li>';
 const coreManual=(plan.manualKeys||[]).slice(0,4).map(manualItem).join('');
 const extraManual=(plan.manualKeys||[]).slice(4).map(manualItem).join('');
 const manual=coreManual;
 const stigma=plan.stigmas.length?'<p class="leveling-stigmas"><b>Learned Stigmas:</b> '+esc(plan.stigmas.join(' · '))+
  '. Keep buffs, protection and situational Stigmas manual.</p>':
  plan.level>=22?'<p class="leveling-stigmas">Stigma slots open while leveling; only use Stigmas after assigning earned points.</p>':'';
 const next=plan.next?'<span class="leveling-up-next">Next combat unlock: Lv '+plan.next.level+' · '+esc(plan.next.name)+'</span>':'';
 const weave='<div class="leveling-basic">'+
  '<span class="leveling-phase-label">01 / Your left mouse button</span>'+skill(plan.weave)+
  '<p>Hold <b>'+esc(plan.weaveKey)+'</b> to keep your repeat attack going during safe damage. No macro setup is required on this button.</p></div>';
 const starter=plan.macroUnlocked?'<div class="leveling-skill-column">'+
  '<div class="leveling-phase-label">02 / Place spells in these stacks <span>'+esc(plan.stacks.map(g=>g.key).join(' + '))+'</span></div>'+
  '<p class="leveling-short-note">Arrange each stack as it appears in game: <b>Row 0 is at the bottom and fires first.</b> Cooldown/condition priorities must sit below filler skills.</p>'+
  '<div id="leveling-stacks" class="leveling-stack-panels">'+stackPanels+'</div></div>'+
  '<div class="leveling-macro-callout"><span class="leveling-phase-label">03 / In-game macro</span>'+
  '<div class="leveling-control-pair"><span><kbd>LMB</kbd> Hold '+esc(plan.weave)+'</span><b>+</b><span><kbd>'+esc(macroKey)+'</kbd> Hold in-game Macro</span></div>'+
  '<div id="leveling-macro-step"><b>'+(['ZERO','ONE','TWO','THREE'][plan.steps.length]||plan.steps.length)+' step'+(plan.steps.length===1?'':'s')+':</b> '+
  plan.steps.map((key,i)=>'<span class="leveling-macro-entry">Step '+(i+1)+': <kbd>'+esc(key)+'</kbd> · start at 10 ms</span>').join('')+'</div>'+
  '<label class="leveling-bind-control">Macro hotkey <select id="leveling-macro-bind"><option value="RMB"'+(macroKey==='RMB'?' selected':'')+'>Right Mouse Button (RMB)</option><option value="Mouse 4"'+(macroKey==='Mouse 4'?' selected':'')+'>Side mouse (Mouse 4)</option><option value="MMB"'+(macroKey==='MMB'?' selected':'')+'>Middle mouse (MMB)</option><option value="M"'+(macroKey==='M'?' selected':'')+'>Keyboard M</option></select></label>'+
  '<p>In <b>Skills (K) → Macro</b>, add the step(s) shown above. In <b>Settings → Key Settings → General → Macro</b>, bind the selected button. '+
  'You hold <b>LMB + '+esc(macroKey)+'</b> during safe damage. The macro presses all displayed automatic stack keys for you; do not repeatedly press Q/E/R yourself. It does not guarantee a scripted cast sequence. '+
  'Release it for movement, mechanics, healing or charged attacks.</p></div>':
  '<div class="leveling-no-macro" id="leveling-macro-step"><b>Macro not available yet.</b>'+
  '<p>The Skills menu and presets unlock at level 4. Until then, use your repeat attack and newly unlocked skills manually.</p></div>';
 return '<div class="leveling-combat-heading"><div><span class="eyebrow">LEVEL '+plan.level+' · '+(plan.stage==='starter'?'EARLY COMBAT':plan.stage==='core'?'CORE COMBAT':'STIGMA PROGRESSION')+'</span>'+
  '<h3>Starter combat setup</h3><p>'+esc(plan.focus)+'</p></div>'+next+'</div>'+
  '<div class="leveling-combat-layout'+(plan.steps.length>1?' leveling-multi-stack':'')+'">'+weave+starter+'</div>'+
  '<div class="leveling-manual-summary"><div><span class="leveling-phase-label">Keep these manual</span>'+
  (manual?'<ul id="leveling-manual" class="leveling-numbered-manual">'+manual+'</ul>':'<p>Use your repeat attack while the next combat skill unlocks.</p>')+
  (extraManual?'<details class="leveling-extra-manual"><summary>Other manual buffs and situational spells (5–8)</summary><ul class="leveling-numbered-manual">'+extraManual+'</ul></details>':'')+
  (plan.level>=16?'<p class="leveling-defiance">Defiance (Space) is a manual control-break, not a damage-loop step.</p>':'')+
  stigma+'</div><div class="leveling-setup-instructions"><span class="leveling-phase-label">Set it up in game</span>'+
  (plan.macroUnlocked?'<p><b>Skills (K)</b> → build the shown stacks on '+esc(plan.stacks.map(g=>g.key).join(' and '))+'. Add '+(plan.steps.length===1?'one Macro step':'one Macro step per automatic stack')+' for '+esc(plan.steps.join(' and '))+'. '+
  'Bind Macro under <b>Settings → Key Settings → General → Macro</b>. 10 ms is a starting delay, not a guaranteed cast order or optimal timing.</p>':
  '<p>Skills (K) becomes available at level 4. No key remapping or macro setup needed yet.</p>')+
  '<p class="leveling-setup-warning">Use only the game’s built-in macro. Manual inputs take priority; mouse-bound macros do not work in AION 1 control mode (choose keyboard M instead). '+
  'Test each new skill and Specialty on a training target—this is a leveling starting point, not a measured maximum-DPS rotation.</p>'+
  '</div></div>';
}
