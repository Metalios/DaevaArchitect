'use strict';
/**
 * Global class-dependent PvE build jobs, separated from Solo/Group context.
 * These are comparative mechanics goals, not measured DPS/HPS or threat.
 * Each focus/Stigma name is present in the Global class catalog.
 */
const RoleBuildGoals=(()=>{
  const base=Object.freeze({
    performance:{label:'Balanced PvE performance',description:'Damage, uptime and sufficient defenses'},
    survivability:{label:'Maximum survivability',description:'Defenses, mitigation and recovery'},
    sustained:{label:'Maximum sustained DPS',description:'Long-fight damage and cooldown uptime'},
    burst:{label:'Maximum burst DPS',description:'Short damage windows and reliable finishers'}
  });
  const roles=Object.freeze({
    tank:{label:'Main Tank / Threat',description:'Hold boss attention, survive spikes, and maintain damage between mechanics',mix:[.20,.05,.52,.23],attack:.65,defense:2.3,speed:1.0,passive:1.3},
    offtank:{label:'Off-Tank / Bruiser',description:'Deal melee damage while protecting yourself during tank swaps',mix:[.35,.10,.43,.12],attack:1.0,defense:1.8,speed:1.1,passive:1.0},
    healing:{label:'Group Healing / Recovery',description:'Prioritize sustained healing, cleanses, shields and survival; damage in safe windows',mix:[.12,.04,.30,.54],attack:.65,defense:1.65,speed:1.1,passive:1.45},
    hybrid:{label:'Damage + Support Hybrid',description:'Contribute damage without sacrificing essential healing or group buffs',mix:[.38,.12,.20,.30],attack:1.0,defense:1.1,speed:1.25,passive:1.3},
    support:{label:'Party Buffs / Utility',description:'Keep group attack and defensive benefits available while contributing damage',mix:[.18,.05,.20,.57],attack:.8,defense:1.25,speed:1.2,passive:1.5},
    debuff:{label:'Debuff / DoT Utility',description:'Maintain valuable enemy debuffs while sustaining skill and DoT pressure',mix:[.27,.08,.12,.53],attack:1.0,defense:.8,speed:1.45,passive:1.35},
    pet:{label:'Spirit / Pet Damage',description:'Sustain elemental summons, spirit synergy and elemental-combo uptime',mix:[.53,.19,.10,.18],attack:1.25,defense:.8,speed:1.25,passive:1.35},
    control:{label:'Control / Kiting',description:'Maintain distance, slows and control uptime without losing all damage',mix:[.30,.08,.37,.25],attack:.85,defense:1.35,speed:1.4,passive:1.0}
  });
  const catalog=Object.freeze({
    templar:{
      order:['performance','tank','survivability','sustained','burst'],
      names:{performance:'Offensive Tank / Balanced'},
      tank:{focus:['Enhance Health','Warding Shield','Guarding Seal','Ironclad Defense','Insulting Roar','Block Pain'],
        stigma:['Taunt','Shield of Protection','Noble Armor','Doom Shield'],
        utility:['Insulting Roar','Warding Strike'],manual:'Keep Taunt and defensive Stigmas ready for threat and boss spikes; handle defensive timing manually.'}
    },
    gladiator:{
      order:['performance','offtank','survivability','sustained','burst'],
      offtank:{focus:['Protection Armor','Survival Stance','Blood Absorption','Experienced Counterstrike','Overhead Slam'],
        stigma:['Focused Block','Wave Armor','Lifestealing Blade','Lunge Stance'],
        utility:['Mocking Blade','Blood Absorption'],manual:'Reserve blocks and self-sustain for tank swaps; keep damage stacks moving when safe.'}
    },
    assassin:{
      order:['performance','sustained','burst','control','survivability'],
      control:{focus:['Shadow Fall','Ambush','Infiltrate','Heightened Sixth Sense','Exploit Weakness'],
        stigma:['Smoke Bomb','Shadowstep','Evasion Contract','Shadow Walk'],
        utility:['Shadow Fall','Infiltrate'],manual:'Movement, escapes and control should remain manually timed.'}
    },
    ranger:{
      order:['performance','sustained','burst','control','survivability'],
      control:{focus:['Snare Shot','Explosion Trap','Suppressing Arrow','Rooting Eye','Wind Vigor'],
        stigma:['Ensnaring Trap','Sealing Arrow','Mother Nature\'s Breath','Vaizel\'s Authority'],
        utility:['Snare Shot','Explosion Trap'],manual:'Keep traps and escape/spacing abilities manual; do not interrupt Deadshot charge unintentionally.'}
    },
    sorcerer:{
      order:['performance','sustained','burst','control','survivability'],
      control:{focus:['Ice Chain','Winter\'s Shackles','Frost','Frost Burst','Robe of Earth','Cold Snap'],
        stigma:['Hibernation','Curse: Tree','Cold Storm','Steel Barrier'],
        utility:['Ice Chain','Winter\'s Shackles'],manual:'Manually time freezes, CC and defenses; Hellfire charge remains manual.'}
    },
    spiritmaster:{
      order:['performance','pet','debuff','sustained','burst','survivability'],
      pet:{focus:['Summon: Fire Spirit','Summon: Water Spirit','Summon: Wind Spirit','Summon: Earth Spirit','Elemental Fusion','Element Unification'],
        stigma:['Summon: Ancient Spirit','Enhance: Spirit\'s Benediction','Jointstrike: Corrode','Flame Blessing'],
        utility:['Spirit Communion','Spirit Strike'],manual:'Manage spirit availability and Fusion charge timing; summoned damage is not equivalent to direct spell casts.'},
      debuff:{focus:['Corrode','Jointstrike: Curse','Combustion','Soul\'s Cry','Spirit Strike','Mental Focus'],
        stigma:['Jointstrike: Corrode','Cursed Cloud','Magic Block','Seize Magic'],
        utility:['Corrode','Jointstrike: Curse'],manual:'Apply long-lived debuffs before main damage windows; manually time control and dispels.'}
    },
    cleric:{
      order:['hybrid','healing','debuff','performance','survivability','sustained'],
      names:{performance:'Balanced Cleric PvE',hybrid:'Damage Healer (Hybrid)',healing:'Dedicated Group Healer',debuff:'Debuff + DoT Support'},
      hybrid:{focus:['Condemnation','Judgment Thunder','Chain of Torment','Healing Light','Radiant Recovery','Divine Aura'],
        stigma:['Earth Punishment','Light of Protection','Prayer of Amplification','Absolution'],
        utility:['Healing Light','Radiant Recovery'],manual:'Maintain the damage/debuff chain; keep emergency heals and cleanse outside the automatic macro.'},
      healing:{partyOnly:true,focus:['Healing Light','Radiant Recovery','Light of Regeneration','Healing Enhancement','Earth\'s Grace','Prayer of Concentration'],
        stigma:['Light of Protection','Absolution','Yustiel\'s Power','Benevolence'],
        utility:['Healing Light','Radiant Recovery','Light of Regeneration'],manual:'Keep direct heals, cleanses, shields and resurrection on manual keys. Do not optimize healing as personal DPS.'},
      debuff:{focus:['Chain of Torment','Debilitating Mark','Condemnation','Judgment Thunder','Divine Aura'],
        stigma:['Earth Punishment','Prayer of Amplification','Light of Protection','Absolution'],
        utility:['Chain of Torment','Debilitating Mark'],manual:'Maintain DoTs/debuff uptime; reserve manual recovery abilities for party damage.'}
    },
    chanter:{
      order:['hybrid','support','healing','performance','sustained','survivability'],
      names:{performance:'Balanced Chanter PvE',hybrid:'Support DPS (Hybrid)',support:'Party Buff Specialist',healing:'Support Healer'},
      hybrid:{focus:['Dark Crush','Spinning Strike','Onslaught','Recuperation','Inspiring Spell','Attack Preparation'],
        stigma:['Undefeated Mantra','Power of the Storm','Marchutan\'s Wrath','Healing Touch'],
        utility:['Inspiring Spell','Recuperation'],manual:'Keep mantras and emergency recovery available separately from damage stacks.'},
      support:{partyOnly:true,focus:['Inspiring Spell','Earth\'s Promise','Attack Preparation','Protection Circle','Blessing of Life','Recuperation'],
        stigma:['Undefeated Mantra','Power of the Storm','Healing Touch','Barrier Spell'],
        utility:['Inspiring Spell','Attack Preparation'],manual:'Maintain party mantras and buff uptime; use defensive support manually during spikes.'},
      healing:{partyOnly:true,focus:['Recuperation','Blessing of Life','Protection Circle','Inspiring Spell','Crossguard'],
        stigma:['Healing Touch','Barrier Spell','Guardian Blessing','Undefeated Mantra'],
        utility:['Recuperation','Blessing of Life'],manual:'Use emergency healing/defense manually while keeping the offensive engine available.'}
    }
  });
  const core=new Set(Object.keys(base));
  function available(classId,context='party'){
    const c=catalog[classId];if(!c)return [];
    return c.order.filter(id=>context==='party'||!c[id]?.partyOnly)
      .map(id=>({id,label:c.names?.[id]||roles[id]?.label||base[id]?.label,
        description:roles[id]?.description||base[id]?.description,
        specialized:!core.has(id)}));
  }
  function normalize(classId,context,selected){
    const values=available(classId,context).map(x=>x.id);
    if(values.includes(selected))return selected;
    if(values.includes('performance'))return 'performance';
    return values[0]||'performance';
  }
  function info(classId,objective){
    const selected=catalog[classId]?.[objective];
    return selected?{...roles[objective],...selected,id:objective}:null;
  }
  function mix(classId,objective,metrics,rank,stigma){
    const spec=info(classId,objective);
    if(!spec)return null;
    const [sustained,burst,survival,party]=spec.mix;
    // A level/rank proxy, not HPS, threat or debuff uptime measured in combat.
    const utility=spec.utility||[];
    const ranks=spec.focus||[];
    const avg=arr=>arr.length?arr.reduce((sum,name)=>sum+
      (Math.max(1,Number(rank(name))||1)-1)/19,0)/arr.length:0;
    const stigmaValue=(spec.stigma||[]).reduce((sum,name)=>{
      const n=Number(stigma(name))||0;
      return sum+(n>=10?.065:n>=5?.035:n>0?.012:0);
    },0);
    const focusScore=.20*avg(ranks)+.13*avg(utility)+stigmaValue;
    return sustained*metrics.sustained+burst*metrics.burst+
      survival*metrics.survival+party*metrics.party+focusScore;
  }
  function multipliers(classId,objective){
    return info(classId,objective)||null;
  }
  function roleStatBoost(key,classId,objective){
    const id=objective;
    if(!info(classId,id))return 1;
    const defense=/Defense|Resist|HPMax|Evasion|Block|DecreaseDamage|Shield/i.test(key);
    const cooldown=/CoolTimeDecrease|CombatSpeed/i.test(key);
    const resource=/MPMax|MPRecovery|Mana|Heal/i.test(key);
    const status=/AbnormalAccuracy|Accuracy/i.test(key);
    if(id==='healing')return resource?2.4:defense?1.65:cooldown?1.5:1;
    if(id==='tank'||id==='offtank')return defense?1.8:cooldown?1.25:1;
    if(id==='support'||id==='hybrid')return resource?1.6:cooldown?1.5:defense?1.2:1;
    if(id==='debuff'||id==='control')return status?1.7:cooldown?1.7:defense?1.2:1;
    if(id==='pet')return cooldown?1.4:1;
    return 1;
  }
  return Object.freeze({base,roles,catalog,available,normalize,info,mix,multipliers,roleStatBoost});
})();
