'use strict';
/**
 * Global client cooldown observations. "0" means the source displays no
 * cooldown; it does NOT establish an animation/GCD-free instant action.
 *
 * Source: https://metabot.gg/en/aion-2/skills
 * Client identified there as build 0.0.4387.0; checked 2026-11-01.
 * These are base cooldowns only. Triggered resets, Specialties, buff-window
 * changes and animation locks must be modeled separately.
 */
const GlobalActionData = (() => {
  const VERSION='global-client-0.0.4387.0-reviewed-2026-11-01';
  const COOLDOWNS=Object.freeze({
    gladiator:{
      'Keen Strike':0,'Rending Blow':0,'Leaping Slam':15,'Mocking Blade':20,
      'Overhead Slam':5,'Sword Aura Rampage':0,'Ankle Slice':10,
      'Crushing Wave':20,'Rush Strike':20,'Aerial Snare':45,'Ruinous Blow':45,'Defiance':60
    },
    templar:{
      'Vicious Strike':0,'Pummel':0,'Poach':15,'Shield Smite':10,
      'Judgment':5,'Flash Rampage':0,'Debilitating Smash':10,'Warding Strike':30,
      'Shield Rush':20,'Annihilate':20,'Punishment':30,'Defiance':60
    },
    assassin:{
      'Quick Slice':0,'Savage Roar':0,'Shadowstrike':20,'Ambush':10,
      'Heart Gore':5,'Storm Rampage':0,'Whirlwind Slice':10,'Flash Slice':10,
      'Infiltrate':20,'Shadow Fall':20,'Insignia Explosion':10,'Defiance':60
    },
    ranger:{
      'Snipe':0,'Tempest Shot':0,'Snare Shot':15,'Marking Shot':10,
      'Drill Dart':5,'Arrow Scattershot':0,'Gale Arrow':20,'Explosion Trap':20,
      'Burst Arrow':20,'Suppressing Arrow':20,'Deadshot':20,'Defiance':60
    },
    sorcerer:{
      'Flame Arrow':0,'Ice Chain':0,'Firestorm':5,'Bittercold Wind':15,
      'Blaze':5,'Flame Scattershot':0,'Frost':30,"Winter's Shackles":45,
      'Frost Burst':10,'Wish of Concentration':60,'Hellfire':45,'Defiance':60
    },
    spiritmaster:{
      'Cold Shock':0,'Combustion':0,'Summon: Fire Spirit':15,'Summon: Water Spirit':15,
      'Jointstrike: Curse':10,'Rapid Scattershot':0,'Summon: Earth Spirit':15,
      'Dimensional Control':0,'Summon: Wind Spirit':15,"Soul's Cry":45,
      'Elemental Fusion':0,'Defiance':60
    },
    cleric:{
      "Earth's Retribution":0,'Judgment Thunder':0,'Debilitating Mark':10,
      'Divine Aura':30,'Chain of Torment':20,'Lightning Strike Scattershot':0,
      'Light of Regeneration':30,'Condemnation':3,'Healing Light':6,
      'Radiant Recovery':12,'Bolt':45,'Defiance':60
    },
    chanter:{
      'Onslaught':0,'Incandescent Blow':0,'Rushing Smash':15,
      'Impactful Crush':15,'Dark Crush':5,'Gust Rampage':0,
      'Heat Wave Blow':10,'Recuperation':15,'Tremor Crush':20,
      'Wave Blow':20,'Spinning Strike':30,'Defiance':60
    }
  });
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,Number(v)||0));
  const lookup=(classId,name)=>{
    const value=COOLDOWNS[classId]?.[name];
    return Number.isFinite(value)?value:null;
  };
  /**
   * These are upper bounds on opportunities assuming immediate use at t=0
   * and no time occupied by casting. NOT actual cast counts or DPS.
   */
  function cooldownWithSpecialties(classId,name,rank,specialties={},specData={}){
    const base=lookup(classId,name);
    if(base===null||base===0)return base;
    // Resolve exact Global tooltip effects. The preceding implementation
    // required "Xs cooldown" and silently missed "-10s cooldown",
    // "Remove cooldown", and cross-skill on-hit reductions.
    const selected=Array.isArray(specialties[name])?specialties[name]:[];
    const slots=rank>=20?3:rank>=12?2:rank>=8?1:0;
    if(typeof GlobalCooldownRules!=='undefined'){
      const rules=[];
      for(const id of selected.slice(0,slots)){
        const text=specData?.[classId]?.[name]?.options?.[id]||'';
        const rule=GlobalCooldownRules.compileSpecialty(text,classId,name,id);
        if(rule&&rank>=(id<=3?8:id===4?12:16))rules.push(rule);
      }
      return GlobalCooldownRules.effectiveCooldown(base,name,rules);
    }
    return base;
  }
  function readyWindows(cooldown,duration,haste=0){
    if(!Number.isFinite(cooldown)||cooldown<0)return null;
    if(cooldown===0)return null;
    // Global Cooldown description caps cooldown reduction at 60%.
    const interval=Math.max(.1,cooldown*(1-clamp(haste,0,.60)));
    const length=clamp(duration,0,3600);
    return length===0?0:Math.min(36001,1+Math.floor((length-1e-9)/interval));
  }
  function relativeCooldownOpportunity(classId,name,duration,haste=0,rank=1,specialties={},specData={}){
    const cooldown=cooldownWithSpecialties(classId,name,rank,specialties,specData);
    if(cooldown===null||cooldown===0)return 1;
    const unmodified=readyWindows(cooldown,duration,0);
    const modified=readyWindows(cooldown,duration,haste);
    return unmodified>0?modified/unmodified:1;
  }
  return Object.freeze({VERSION,COOLDOWNS,lookup,readyWindows,
    cooldownWithSpecialties,relativeCooldownOpportunity});
})();
