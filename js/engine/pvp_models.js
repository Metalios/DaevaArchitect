 'use strict';
/**
 * AION 2 Global PvP comparative evaluator (2026-11).
 *
 * No sampled win rates, action frames, guaranteed CC probabilities or server
 * damage formulas are asserted here. All coefficients below are transparent
 * scenario sensitivities. Compare legal builds under the SAME scenario;
 * never display the returned score as DPS, win rate or target-contact time.
 */
const PvpCombatModels = (() => {
  const VERSION = 'global-pvp-matchup-proxy-2026-11-03';
  const MODES = Object.freeze({
    pvp: {pressure:.25,burst:.18,contact:.16,control:.12,mitigation:.13,recovery:.09,team:.03,escape:.04},
    'pvp-arena': {pressure:.22,burst:.22,contact:.18,control:.17,mitigation:.12,recovery:.07,team:0,escape:.02},
    'pvp-abyss-solo': {pressure:.20,burst:.17,contact:.18,control:.11,mitigation:.12,recovery:.10,team:0,escape:.12},
    'pvp-abyss-group': {pressure:.21,burst:.14,contact:.10,control:.13,mitigation:.12,recovery:.08,team:.19,escape:.03}
  });
  const OPPONENTS = Object.freeze({
    gladiator:{ranged:0,burst:1.1,control:.8,recovery:.45,defense:1.1},
    templar:{ranged:0,burst:.65,control:.75,recovery:.65,defense:1.35},
    assassin:{ranged:0,burst:1.45,control:.7,recovery:.3,defense:.7},
    ranger:{ranged:1,burst:1.05,control:.85,recovery:.35,defense:.65},
    sorcerer:{ranged:1,burst:1.4,control:1.4,recovery:.25,defense:.6},
    spiritmaster:{ranged:1,burst:.85,control:1.5,recovery:.65,defense:.85},
    cleric:{ranged:1,burst:.65,control:.75,recovery:1.6,defense:1.0},
    chanter:{ranged:0,burst:.85,control:.8,recovery:1.1,defense:1.05}
  });
  // This is an explicit role map, NOT a keyword search through tooltips.
  const KITS = Object.freeze({
    gladiator:{melee:true,pressure:['Overhead Slam','Rending Blow','Ruinous Blow','Keen Strike'],
      burst:['Ruinous Blow','Overhead Slam'],contact:['Rush Strike','Leaping Slam','Ankle Slice'],
      control:['Ankle Slice','Leaping Slam','Aerial Snare'],mitigation:['Protection Armor','Survival Willpower'],
      recovery:['Blood Absorption'],escape:['Rush Strike'],team:['Crushing Wave']},
    templar:{melee:true,pressure:['Judgment','Pummel','Punishment','Debilitating Smash'],
      burst:['Judgment','Punishment'],contact:['Poach','Shield Rush'],
      control:['Poach','Shield Smite'],antiheal:['Debilitating Smash'],
      mitigation:['Warding Strike','Block Pain','Survival Willpower'],
      recovery:['Enhance Health','Warding Shield'],team:['Warding Strike','Guarding Seal'],escape:['Poach']},
    assassin:{melee:true,pressure:['Heart Gore','Quick Slice','Insignia Explosion','Shadowstrike'],
      burst:['Insignia Explosion','Heart Gore','Ambush'],contact:['Ambush','Shadowstrike','Infiltrate'],
      control:['Shadow Fall','Ambush'],mitigation:['Determination','Heightened Sixth Sense'],
      recovery:['Revitalization Contract'],escape:['Infiltrate','Shadowstrike']},
    ranger:{melee:false,pressure:['Deadshot','Gale Arrow','Snipe','Drill Dart'],
      burst:['Deadshot','Snipe'],contact:['Snare Shot','Wind Vigor'],
      control:['Suppressing Arrow','Snare Shot','Explosion Trap'],
      mitigation:['Unyielding Resolve','Vigilant Eye'],recovery:['Revitalization Contract'],
      escape:['Wind Vigor','Snare Shot'],team:['Suppressing Arrow']},
    sorcerer:{melee:false,pressure:['Hellfire','Firestorm','Blaze','Flame Arrow'],
      burst:['Hellfire','Firestorm'],contact:['Ice Chain',"Winter's Shackles"],
      control:['Frost',"Winter's Shackles",'Ice Chain'],
      mitigation:['Grace of Resistance','Robe of Earth'],
      recovery:['Absorb Essence'],escape:['Ice Chain',"Winter's Shackles"],team:['Frost']},
    spiritmaster:{melee:false,pressure:['Combustion','Elemental Fusion','Jointstrike: Curse','Summon: Fire Spirit'],
      burst:['Elemental Fusion','Combustion'],contact:['Cold Shock','Dimensional Control'],
      control:["Soul's Cry",'Dimensional Control','Cold Shock'],
      mitigation:['Spirit Protection'],recovery:['Spirit Revitalization'],
      escape:["Soul's Cry"],team:['Jointstrike: Curse','Dimensional Control']},
    cleric:{melee:false,pressure:['Condemnation','Judgment Thunder','Chain of Torment'],
      burst:['Condemnation','Judgment Thunder'],contact:['Debilitating Mark'],
      control:['Debilitating Mark'],antiheal:['Debilitating Mark'],
      mitigation:['Immortal Veil','Defiance'],recovery:['Healing Light','Radiant Recovery','Light of Regeneration'],
      escape:['Debilitating Mark'],team:['Healing Light','Radiant Recovery','Light of Regeneration']},
    chanter:{melee:true,pressure:['Dark Crush','Spinning Strike','Onslaught','Impactful Crush'],
      burst:['Dark Crush','Spinning Strike'],contact:['Rushing Smash','Onslaught'],
      control:['Rushing Smash','Impactful Crush'],mitigation:['Protection Circle','Crossguard'],
      recovery:['Recuperation','Blessing of Life'],escape:['Rushing Smash'],team:['Inspiring Spell','Recuperation']}
  });
  const STIGMA = Object.freeze({
    gladiator:{
      'Lunge Stance':{pressure:.6,burst:.75,contact:1.15}, "Zikel's Blessing":{pressure:1.15,burst:1.35},
      'Rage Burst':{pressure:1,burst:1.15},'Blade Toss':{antiheal:1.3,control:.65,contact:.45},
      'Forced Restraint':{control:1.2,contact:.55},'Tenaciousness':{mitigation:1.25,contact:.45},
      'Focused Block':{mitigation:1.45},'Lifestealing Blade':{pressure:.5,recovery:1},
      'Fracturing Rush':{contact:1.3,escape:.65},'Wrath Wave':{control:.95,team:.75},
      'Armor of Balance':{mitigation:1.1},'Wave Armor':{mitigation:.9}},
    templar:{
      'Doom Shield':{pressure:.8,burst:.6,mitigation:.6},'Grapple':{contact:1.35,control:1.1},
      'Second Skin':{mitigation:1.3,escape:.35},'Shield of Protection':{mitigation:1.4,pressure:.25},
      "Nezekan's Shield":{mitigation:1.3,team:1.25},
      'Battlefield Banner':{pressure:1.1,burst:.9,team:.55},
      "Empyrean Lord's Punishment":{burst:1.2,control:.85,contact:.45},
      'Comrade in Arms':{mitigation:.55,team:1.65},
      'Noble Armor':{pressure:.65,team:.4},'Taunt':{control:.2}},
    assassin:{
      'Illusive Clone':{pressure:1.1,burst:1.8}, "Triniel's Dagger":{pressure:1.15,burst:1.25},
      'Spiral Slice':{pressure:.85,burst:.7,contact:.5},
      'Shadowstep':{contact:1.3,escape:1.1},'Shadow Walk':{contact:.8,escape:1.25},
      'Evasion Contract':{mitigation:1.3,escape:.4},'Aerial Bind':{control:1.3,contact:.7},
      'Smoke Bomb':{control:1.2,mitigation:.6,team:.5},
      'Assault Ambush':{contact:1,control:.75,team:.6},
      'Evasion Stance':{mitigation:1.35},'Swift Contract':{pressure:.8,burst:1.05},
      'Savage Fang':{pressure:.9}},
    ranger:{
      "Vaizel's Authority":{pressure:1.3,burst:1.1},
      'Bow of Blessing':{pressure:1.05,burst:1.25},
      'Supporting Fire':{pressure:1.15,team:.55},
      'Griffon Arrow':{pressure:1.05,burst:1.0},
      'Sealing Arrow':{control:1.25,team:.55},'Ensnaring Trap':{control:1.2,escape:.75},
      "Mother Nature's Breath":{mitigation:.55,recovery:1.25},
      'Ambush Kick':{control:1.05,escape:.75},
      'Stealth':{contact:.65,escape:1.1},'Explosive Arrow':{burst:1.1},
      'Arrow Storm':{control:.65,pressure:.75,team:.75}},
    sorcerer:{
      'Element Enhancement':{pressure:1.35,burst:1.25},
      'Arctic Armor':{mitigation:1.25,escape:.4},
      'Hibernation':{mitigation:1.05,recovery:.6,escape:1.1},
      'Soul Freeze':{control:1.4,team:.55},
      'Steel Barrier':{mitigation:1.25},
      'Curse: Tree':{control:1.35,escape:.65},
      'Cold Storm':{pressure:.65,control:.8},
      'Fire Wall':{pressure:.65,control:.75,team:.7},
      "Lumiel's Space":{control:.95,team:1.05},
      'Delayed Explosion':{pressure:.9,burst:1}},
    spiritmaster:{
      "Enhance: Spirit's Benediction":{pressure:1.1,mitigation:.55,recovery:.75},
      'Summon: Ancient Spirit':{pressure:1.4,burst:1.2},
      'Seize Magic':{control:1.05,team:.8},
      'Command: Proxy':{mitigation:1.35,escape:.4},
      'Magic Block':{control:1.1,mitigation:.8},
      'Cry of Terror':{control:1.45,escape:.85,team:.65},
      'Siphon':{recovery:1.15,pressure:.5},
      "Kaisinel's Power":{team:1.2,control:.7},
      'Jointstrike: Corrode':{pressure:1.0},'Cursed Cloud':{team:.7,pressure:.65}},
    cleric:{
      'Earth Punishment':{pressure:1.5,burst:1.2},
      'Noble Aura':{pressure:.7,recovery:.6},
      'Light of Protection':{mitigation:1.25,team:.75},
      'Salvation':{mitigation:.9,recovery:1.25,team:1.05},
      'Absolution':{control:.3,recovery:1.05,team:1.5},
      "Yustiel's Power":{mitigation:.8,team:1.2},
      'Voice of Doom':{control:1.1,antiheal:.6},
      'Root':{control:1.15,escape:.7},
      'Prayer of Amplification':{pressure:.85}},
    chanter:{
      'Undefeated Mantra':{pressure:.75,mitigation:.45,team:1.4},
      "Marchutan's Wrath":{pressure:1.2,burst:1.15},
      'Power of the Storm':{pressure:1.25,burst:.95,team:.65},
      'Fracturing Blow':{pressure:1,antiheal:.9},
      'Guardian Blessing':{mitigation:1.05,recovery:.4,team:.45},
      'Sprint Mantra':{contact:.65,escape:1.2},
      'Healing Touch':{recovery:1.0,team:1.2},
      'Impeding Authority':{control:.8,team:1.0},
      'Barrier Spell':{mitigation:1.3,team:.6},
      'Focused Defense':{mitigation:1.4},
      'Ensnaring Mark':{control:1.2,contact:.5}}
  });
  // Verified tooltip options in specialties.json; each modifier requires the
  // effective rank unlock and the option to be actually selected.
  const OPTIONS = Object.freeze({
    templar:{Poach:{1:{contact:.7},2:{control:.6},5:{control:.7}},
      'Debilitating Smash':{3:{antiheal:1.25},4:{pressure:.5},1:{control:.45}},
      'Shield Smite':{1:{control:.45},3:{antiheal:.3},5:{team:.25}},
      'Warding Strike':{4:{mitigation:.5},5:{mitigation:.35,team:.75}}},
    gladiator:{'Rush Strike':{2:{contact:.7},4:{contact:.5},5:{control:.45}},
      'Ankle Slice':{1:{control:.45},3:{contact:.75},4:{pressure:.35}},
      'Leaping Slam':{2:{control:.35},5:{control:.5,team:.25}}},
    assassin:{Ambush:{1:{burst:.6},3:{pressure:.55},5:{burst:.6}},
      'Shadow Fall':{2:{burst:.35},3:{control:.3},4:{control:.5}}},
    ranger:{'Snare Shot':{1:{control:.3},3:{escape:.5},5:{control:.55}},
      'Suppressing Arrow':{2:{control:.4},4:{control:.65}},
      'Gale Arrow':{3:{escape:.4},4:{pressure:.65},5:{pressure:.45}}},
    sorcerer:{"Winter's Shackles":{1:{escape:.4},2:{control:.5},3:{pressure:.55},5:{control:.5}},
      'Ice Chain':{2:{escape:.35},4:{control:.35}}},
    spiritmaster:{'Dimensional Control':{1:{control:.3},4:{team:.4},5:{control:.65}},
      "Soul's Cry":{2:{control:.6},3:{escape:.35},5:{control:.5}}},
    cleric:{Condemnation:{2:{pressure:.4},3:{control:.4},4:{pressure:.65}},
      'Debilitating Mark':{2:{pressure:.25},3:{control:.45},4:{mitigation:.3},5:{pressure:.45}}},
    chanter:{'Rushing Smash':{1:{control:.4},2:{burst:.5},5:{pressure:.4}},
      Recuperation:{1:{recovery:.4},2:{recovery:.5,team:.5},5:{recovery:.35}}}
  });
  const KEYS = ['pressure','burst','contact','control','antiheal','mitigation','recovery','team','escape'];
  const cap = (n,a,b) => Math.max(a,Math.min(b,Number(n)||0));
  const isPvp = mode => Object.prototype.hasOwnProperty.call(MODES,mode);
  const opponents = selected => OPPONENTS[selected]?[selected]:
    selected==='ranged'?Object.keys(OPPONENTS).filter(x=>OPPONENTS[x].ranged):
    selected==='melee'?Object.keys(OPPONENTS).filter(x=>!OPPONENTS[x].ranged):
    Object.keys(OPPONENTS);
  const statsOf = build => {
    const result={};
    for(const part of [build.boardStats||{},build.gearStats||{}])
      for(const [key,value] of Object.entries(part))
        result[key]=(result[key]||0)+(Number(value)||0);
    return result;
  };
  const effectiveRank = (build,name) => cap(
    (build.mastery?.[name]||1)+(build.boardSkills?.[name]||0)+(build.gearSkills?.[name]||0),1,40);
  const selectedOptions = (classId,build,name,selectedSpecs) => {
    const rank=effectiveRank(build,name);
    const entry=typeof SPECS!=='undefined'?SPECS[classId]?.[name]:null;
    if(!entry||rank<8)return [];
    const tier=rank>=20?'20':rank>=16?'16':rank>=12?'12':'8';
    const count=rank>=20?3:rank>=12?2:1;
    const selected=selectedSpecs?.[name]??entry.picks?.[tier]??[];
    return selected.slice(0,count).filter(n=>entry.options?.[n]&&rank>=(n<=3?8:n===4?12:16));
  };
  function contributions(classId,build,selectedSpecs){
    const kit=KITS[classId],tags=STIGMA[classId];
    if(!kit)throw Error('Unknown Global class: '+classId);
    const m=Object.fromEntries(KEYS.map(key=>[key,0]));
    for(const key of KEYS){
      const names=kit[key]||[];
      if(!names.length)continue;
      let total=0;
      for(const name of names){
        if(Array.isArray(build.availableSkills)&&!build.availableSkills.includes(name))continue;
        const rank=effectiveRank(build,name);
        const cd=typeof GlobalActionData!=='undefined'?GlobalActionData.lookup(classId,name):null;
        const readiness=cd===null?1:cd===0?1:.58+.42*25/(25+cd);
        total+=(.6+.045*Math.min(20,rank-1))*readiness;
      }
      m[key]+=total/Math.sqrt(names.length);
    }
    for(const name of build.equippedStigmas||[]){
      const rank=cap(build.stigma?.[name],0,20);
      if(rank<=0)continue;
      const roles=tags?.[name]||{pressure:.25};
      const utility=.48+.047*rank+[5,10,15,20].filter(t=>rank>=t).length*.075;
      for(const [key,value] of Object.entries(roles))m[key]+=(Number(value)||0)*utility;
    }
    for(const [name,optionEffects] of Object.entries(OPTIONS[classId]||{}))
      for(const id of selectedOptions(classId,build,name,selectedSpecs)){
        const effects=optionEffects[id]||{};
        for(const [key,value] of Object.entries(effects))m[key]+=(Number(value)||0);
      }
    return m;
  }
  function statPriority(classId,context,opponent,key){
    if(!isPvp(context))return 1;
    const melee=!!KITS[classId]?.melee,selected=opponents(opponent);
    const ranged=selected.filter(c=>OPPONENTS[c].ranged).length/selected.length;
    const team=context==='pvp-abyss-group';
    if(/PvE|BossNpc/.test(key))return .02;
    if(/AbnormalAccuracy|StatusEffectAccuracy/.test(key))return 1.1+(melee?ranged*.55:0)+(team?.1:0);
    if(/AbnormalResistance|Willpower/.test(key))return 1.1+selected.reduce((a,c)=>a+OPPONENTS[c].control,0)/selected.length*.15;
    if(/PvPAccuracy|CombatSpeed/.test(key))return 1.1+(melee?ranged*.30:.1);
    if(/PvPAmplifyDamage|PvPAddDamage|Critical/.test(key))return team?1.12:1.25;
    if(/PvPDamageDefense|PvPDecreaseDamage|HPMax/.test(key))return team?1.3:context==='pvp-abyss-solo'?1.14:1;
    if(/CoolTimeDecrease/.test(key))return team?1.4:1.12;
    return 1;
  }
  function skillPriority(classId,context,opponent,name){
    if(!isPvp(context))return 1;
    const kit=KITS[classId];
    if(!kit)return 1;
    const selected=opponents(opponent),ranged=selected.filter(c=>OPPONENTS[c].ranged).length/selected.length;
    const group=context==='pvp-abyss-group';
    if(kit.contact?.includes(name))return 1.15+(kit.melee?ranged*.55:.1);
    if(kit.control?.includes(name))return 1.1+(kit.melee?ranged*.25:.15);
    if(kit.antiheal?.includes(name))return 1.2;
    if(group&&kit.team?.includes(name))return 1.65;
    if(kit.pressure?.includes(name)||kit.burst?.includes(name))return 1.18;
    if(kit.mitigation?.includes(name))return group?1.25:1.08;
    return 1;
  }
  function stigmaUtility(classId,context,opponent,name,rank){
    if(rank<=0)return 0;
    const roles=STIGMA[classId]?.[name]||{pressure:.25},w=MODES[context]||MODES.pvp;
    let weight=0;
    for(const [role,value] of Object.entries(roles)){
      const normalized=role==='antiheal'?.12:(w[role]||0.03);
      weight+=normalized*value*100;
    }
    const ranged=opponents(opponent).filter(c=>OPPONENTS[c].ranged).length/opponents(opponent).length;
    if(KITS[classId]?.melee)weight+=((roles.contact||0)*ranged*.15)*100;
    // At thresholds a known equipped Stigma gets a distinct perk. This
    // compares breakpoint investments, not invented per-rank damage.
    return weight*(.44+.032*Math.min(rank,20)+[5,10,15,20].filter(x=>rank>=x).length*.085);
  }
  function evaluate({classId,context,build,selectedSpecs={},opponent=null}){
    if(!isPvp(context))throw Error('PvP model requires a PvP context');
    const kit=KITS[classId],m=contributions(classId,build,selectedSpecs);
    const stats=statsOf(build);
    const stat=k=>Math.max(0,stats[k]||0);
    const power=1+cap(stat('PvPAmplifyDamage')/10000,0,.6)*1.6+
      cap(stat('PvPAddDamage')/500,0,.5)+
      cap(stat('PvPAccuracy')/3000,0,.25)*.3+
      cap(stat('CombatSpeed')/10000,0,.6)*.45;
    const defense=1+cap(stat('PvPDecreaseDamage')/10000,0,.5)*1.25+
      cap(stat('PvPDamageDefense')/4000,0,.7)*.65+
      cap(stat('HPMax')/25000,0,.5)*.5;
    const cc=1+cap(stat('AbnormalAccuracy')/3000,0,.7)*.45;
    const resist=1+cap(stat('AbnormalResistance')/3000,0,.7)*.45;
    const move=1+cap(stat('MoveSpeed')/10000,0,.5);
    const chosen=opponent||build.pvpOpponent||'all';
    const weights=MODES[context];
    const rows=opponents(chosen).map(name=>{
      const enemy=OPPONENTS[name];
      const needsEngage=kit.melee&&enemy.ranged;
      // Contact is a normalized matchup index, not measured target uptime.
      const contact=cap((needsEngage?.44:.85)+m.contact*(needsEngage?.115:.045)+
        m.control*.045+(!kit.melee?m.escape*.035:0)-
        (needsEngage?enemy.control*.065:0),.35,1.1)*move;
      const control=m.control*cc/(1+enemy.defense*.08);
      const offense=m.pressure*power*(kit.melee?contact:.9+contact*.1);
      const healPressure=1+Math.min(.4,m.antiheal*.12*enemy.recovery);
      const pressure=offense*healPressure/(1+enemy.defense*.14);
      const burst=(m.burst*.8+m.pressure*.2)*power*healPressure*
        (kit.melee?contact:.96)/(1+enemy.defense*.13);
      const mit=(defense*(1+.17*m.mitigation)*(1+.05*control))/
        (1+.18*enemy.burst+.08*enemy.control/resist);
      const recovery=m.recovery*(1+.10*m.mitigation)/(1+.06*enemy.burst);
      const safeEscape=m.escape*(context==='pvp-abyss-solo'?1.1:1)+m.contact*.13;
      const team=m.team*(context==='pvp-abyss-group'?1.25:.5)+
        (context==='pvp-abyss-group'?control*.25:0);
      const components={pressure,burst,contact:contact*2,control,mitigation:mit,
        recovery,team,escape:safeEscape};
      const score=Object.entries(weights).reduce(
        (sum,[key,weight])=>sum+weight*Math.max(0,components[key]||0),0);
      return {opponent:name,score,components};
    });
    const mean=rows.reduce((sum,row)=>sum+row.score,0)/rows.length;
    const worst=rows.reduce((a,b)=>a.score<=b.score?a:b);
    const score=mean*.75+worst.score*.25;
    return {score,mean,worst:worst.opponent,scenarios:rows,metrics:m,
      classification:'Comparative Global PvP matchup proxy; not win rate, DPS, crowd-control probability or measured engagement uptime',
      provenance:{version:VERSION,assumptions:'Equal opponent scenarios, bounded sensitivity parameters, unmeasured action and CC timing'}};
  }
  return Object.freeze({VERSION,isPvp,OPPONENTS,MODES,KITS,STIGMA,OPTIONS,
    evaluate,opponents,statPriority,skillPriority,stigmaUtility});
})();
