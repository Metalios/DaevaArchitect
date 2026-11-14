/* AION 2 Global rotation policy — conservative, client-safe suggestions.
 * Skill priorities are mechanical hypotheses, not measured best-in-slot DPS.
 * Stacks are recorded in row-0-first order (bottom of in-game column).
 * Macro steps press columns, never guarantee a fixed cast sequence.
 *
 * Evidence: https://aion2data.com/macros (Global client excerpts)
 *           https://aion2vault.com/builds/macros/ (public Global loadouts)
 *           https://aion2.grimvane.app/companion/wiki/macros-guide/
 */
const GlobalRotationPolicy=(()=>{
  'use strict';
  const MODES=new Set(['pvp','pvp-arena','pvp-abyss-solo','pvp-abyss-group']);
  const CHARGED=new Set(['Hellfire','Deadshot','Punishment','Bolt','Jointstrike: Destructive Attack']);
  const TOGGLES=new Set(['Undefeated Mantra','Sprint Mantra','Light of Protection']);
  const NEEDS_MANUAL=Object.freeze({
    gladiator:['Leaping Slam','Rush Strike','Focused Block','Mocking Blade'],
    templar:['Poach','Shield Rush','Doom Shield','Grapple','Executing Blade','Shield of Protection','Taunt'],
    assassin:['Ambush','Shadowstrike','Flash Slice','Infiltrate','Shadow Fall','Swift Contract','Illusive Clone'],
    ranger:['Marking Shot','Suppressing Arrow','Arrow Scattershot','Explosion Trap'],
    sorcerer:['Flame Scattershot','Divine Burst','Steel Barrier','Arctic Armor','Hibernation','Soul Freeze'],
    spiritmaster:['Summon: Fire Spirit','Summon: Water Spirit','Summon: Earth Spirit','Summon: Wind Spirit','Summon: Ancient Spirit',"Soul's Cry",'Rapid Scattershot'],
    cleric:['Healing Light','Light of Regeneration','Radiant Recovery','Absolution',"Yustiel's Power",'Benevolence','Salvation','Summon Resurrection'],
    chanter:['Recuperation','Healing Touch','Wave Blow','Rushing Smash','Power of the Storm','Barrier Spell']
  });
  // Specific continuously-ready fillers must never shadow cooldown actions.
  // The class action catalog's zero-second entries alone do not establish
  // unconditional availability: some are reactive follow-ups.
  const FILLERS=Object.freeze({
    gladiator:['Rending Blow'],
    templar:['Pummel'],
    assassin:['Savage Roar'],
    ranger:['Tempest Shot'],
    sorcerer:[],
    spiritmaster:['Combustion'],
    cleric:['Judgment Thunder'],
    chanter:['Incandescent Blow']
  });
  const PVP=Object.freeze({
    gladiator:{stacks:[['Q','Overhead Slam','Rending Blow']],
      manual:['Rush Strike','Leaping Slam','Ankle Slice','Ruinous Blow'],
      rule:'Use manual approaches to establish contact and the right knockdown window; hold the damage column only during contact.'},
    templar:{stacks:[['E','Judgment','Pummel']],
      manual:['Poach','Shield Rush','Debilitating Smash','Punishment'],
      rule:'Preserve chase tools and defense; spend Debilitating Smash and Punishment deliberately rather than in a held macro.'},
    assassin:{stacks:[['E','Heart Gore','Savage Roar']],
      manual:['Ambush','Shadowstrike','Insignia Explosion','Flash Slice'],
      rule:'Build pressure from behind; manually spend Insignia Explosion when the target cannot evade the burst.'},
    ranger:{stacks:[['E','Gale Arrow','Drill Dart','Tempest Shot']],
      manual:['Marking Shot','Deadshot','Snare Shot','Suppressing Arrow'],
      rule:'Keep Marking Shot Precision and the charged Deadshot window manual; reserve Snare and silence for an actual chase or interrupt.'},
    sorcerer:{stacks:[['Q','Blaze','Firestorm']],
      manual:['Hellfire',"Winter's Shackles",'Frost','Wish of Concentration'],
      rule:'Maintain short, safe fire pressure; time control and charged Hellfire by hand after enemy movement/interrupts are spent.'},
    spiritmaster:{stacks:[['Q','Jointstrike: Curse','Combustion']],
      manual:['Elemental Fusion',"Soul's Cry",'Dimensional Control','Summon: Fire Spirit'],
      rule:'Retain spirit control and Fusion for a real setup window; automate only repeatable pressure.'},
    cleric:{stacks:[['E','Chain of Torment','Condemnation']],
      manual:['Healing Light','Radiant Recovery','Light of Regeneration','Bolt'],
      rule:'Healing/cleansing and control survival always outrank damage pressure; damage macro only while teammates are safe.'},
    chanter:{stacks:[['E','Dark Crush','Incandescent Blow']],
      manual:['Recuperation','Rushing Smash','Wave Blow','Power of the Storm'],
      rule:'Toggle mantras manually, retain healing and engage tools; auto-cycle only safe damage between support decisions.'}
  });
  const RANGED=new Set(['ranged','ranger','sorcerer','spiritmaster']);
  const HEALERS=new Set(['cleric','chanter']);
  const MELEE=new Set(['gladiator','templar','assassin','chanter']);
  function manualSkills(cls,{pvp=false}={}){
    const skills=new Set([...CHARGED,...TOGGLES,...(NEEDS_MANUAL[cls]||[])]);
    if(pvp){
      if(cls==='ranger')skills.add('Snare Shot');
      if(cls==='assassin')skills.add('Insignia Explosion');
      if(cls==='spiritmaster')skills.add('Elemental Fusion');
      if(cls==='chanter')skills.add('Spinning Strike');
    }
    return skills;
  }
  function prioritize(cls,skills){
    const fillers=new Set(FILLERS[cls]||[]);
    return [...skills.filter(name=>!fillers.has(name)),
      ...skills.filter(name=>fillers.has(name))];
  }
  /** Filter proposed automation, leaving explicit saved user macros untouched.
   * Use mode-specific allowed skills and actual unlocked/equipped abilities. */
  function cleanSuggestedStacks(cls,mode,stacks,available){
    const usable=new Set(available||[]);
    const excluded=manualSkills(cls,{pvp:MODES.has(mode)});
    const proposed=(stacks||[]).filter(s=>!s.manual).map(stack=>{
      const dedup=[...new Set((stack.skills||[]).filter(name=>
        usable.has(name)&&!excluded.has(name)))].slice(0,4);
      return {...stack,skills:prioritize(cls,dedup)};
    });
    return proposed.filter(s=>s.skills.length);
  }
  function pvpProfile(base,cls,mode,opponent,equippedStigmas,available){
    if(!MODES.has(mode))return base;
    const policy=PVP[cls];if(!policy)return base;
    const usable=new Set(available||[]);
    const stacks=policy.stacks.map(([key,...skills])=>({
      key,title:'PvP repeatable pressure · situational',skills:prioritize(cls,
        skills.filter(name=>usable.has(name)))
    })).filter(s=>s.skills.length);
    // Templar Solo Abyss can use a manually tapped catch stack when the
    // player actually owns both Stigmas. Never put charged Punishment in
    // this stack: row priority cannot hold its charge to completion.
    if(cls==='templar'&&mode==='pvp-abyss-solo'&&
      ['Grapple','Executing Blade'].every(name=>(equippedStigmas||[]).includes(name)&&usable.has(name)))
      stacks.push({key:'Q',title:'MANUAL catch · confirm range/CC',
        skills:['Grapple','Executing Blade'],manual:true});
    const manual=[...new Set([...policy.manual,...(equippedStigmas||[])])]
      .filter(name=>usable.has(name));
    // Four equipped Stigmas have priority over flexible manual damage if
    // there are more than eight skills to bind.
    const equipped=(equippedStigmas||[]).filter(name=>usable.has(name));
    const ordered=[...new Set([...equipped,...manual])].slice(0,8);
    const hotbar=ordered.map(name=>[[name],
      equipped.includes(name)?'Equipped Stigma · activate when its effect is needed':
        CHARGED.has(name)?'Hold to full charge during a safe burst opportunity':
        'Manual timing / engagement / control','utility']);
    while(hotbar.length<8)hotbar.push([[],'Available for a situational manual skill','utility']);
    const modeCopy={
      pvp:'General PvP: prepare for mixed opponents and keep an escape available.',
      'pvp-arena':'Arena 1v1: probe defenses, draw out Defiance, then execute a short burst.',
      'pvp-abyss-solo':'Solo Abyss: pick one target and retain a second movement or disengage option.',
      'pvp-abyss-group':'Group Abyss: coordinate control and protection with allies before committing.'
    }[mode];
    const foe=String(opponent||'all').toLowerCase();
    const matchup=HEALERS.has(foe)?'Against a healer, save control for recovery windows and avoid wasting burst into protection.':
      RANGED.has(foe)&&MELEE.has(cls)?'Against a ranged opponent, do not consume every gap closer on the initial approach.':
      foe==='assassin'?'Against Assassin, retain a break/peel response for the first burst.':
      RANGED.has(foe)?'Against ranged pressure, keep line-of-sight and interrupt timing under manual control.':
      'Adjust control, defense and manual burst to the opponent; the macro is only your safe filler.';
    return {...base,stacks,macro:stacks.filter(x=>!x.manual).map(x=>x.key),hotbar,
      stigmas:[...equipped],
      rule:policy.rule,
      summary:modeCopy+' '+matchup,
      opener:[modeCopy,matchup,'Manually prepare any buffs, control or target switch; use the held macro only for repeatable pressure.'],
      loop:[policy.rule,'Release the macro during escape, dodge, charge, CC and recovery decisions.',
        'Use any equipped Stigma on its manual hotkey when its effect will actually connect.'],
      hold:'Hold basic attack + in-game macro only in a safe damage window. Do not treat macro steps as a deterministic PvP combo.',
      hotbarNote:'The 1–8 slots are manual decisions and include only equipped, learned Stigmas. This is a comparative PvP control policy, not a measured matchup win-rate or guaranteed rotation.'};
  }
  return Object.freeze({isPvp:mode=>MODES.has(mode),manualSkills,
    prioritize,cleanSuggestedStacks,pvpProfile,CHARGED,FILLERS,PVP});
})();