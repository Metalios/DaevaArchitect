// Global Templar PvP: defend the short-kill objective, accurate Specialty
// breakpoints, and bounded joint rank exchange against regression.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const json=p=>JSON.parse(read(p));
const DATA=json('classes_data.json');
const STIGMAS=json('stigmas.json');
const SPECS=json('specialties.json');
const ctx=vm.createContext({SPECS,STIGMAS,console});
vm.runInContext(read('js/engine/global_actions.js')+'\n'+
  read('js/engine/pvp_models.js')+'\n'+
  read('js/optimizer/joint.js')+'\n'+
  'globalThis.api={PvpCombatModels,JointProgression};',ctx);
const {PvpCombatModels:pvp,JointProgression:joint}=ctx.api;
const names=['Doom Shield','Grapple','Executing Blade','Shield of Protection'];
const rankMap=Object.fromEntries(Object.values(DATA.templar.skills).map(skill=>[skill.name,8]));
const state={
 mastery:rankMap,boardSkills:{},gearSkills:{},boardStats:{},gearStats:{},
 equippedStigmas:names,
 stigma:Object.fromEntries(names.map(name=>[name,5])),
 availableSkills:Object.values(DATA.templar.skills).map(skill=>skill.name),
 pvpOpponent:'ranged'
};
const score=(build,opts={})=>pvp.evaluate({
 classId:'templar',context:'pvp-abyss-solo',build,selectedSpecs:opts
}).score;
assert(pvp.MODES['pvp-abyss-solo'].burst>.4,
 'Solo Abyss must prioritize first burst over sustained recovery');
const baseline=score(state);
const blade10=score({...state,stigma:{...state.stigma,'Executing Blade':10}});
const blade15=score({...state,stigma:{...state.stigma,'Executing Blade':15}});
assert(blade10>baseline,'Executing Blade Exposed milestone must improve kill opportunity');
assert(blade15>blade10,'Executing Blade guaranteed Critical milestone must improve burst');
const exposedOnly=score({...state,equippedStigmas:names.filter(name=>name!=='Grapple')});
assert(baseline>exposedOnly,'Grapple must increase access against ranged opponents');
const skillBonus=score({...state,mastery:{...rankMap,'Shield Rush':12}},
 {'Shield Rush':[2,4]});
const withoutReach=score({...state,mastery:{...rankMap,'Shield Rush':12}},
 {'Shield Rush':[1,3]});
assert(skillBonus>withoutReach,'Shield Rush +10m/cooldown choices must matter against ranged');
const killAntiheal=score(state,{'Debilitating Smash':[3]});
const noAntiheal=score(state,{'Debilitating Smash':[1]});
assert(killAntiheal>noAntiheal,'Healing denial must matter during short kill windows');
assert(score({...state,boardStats:{PvPAmplifyDamage:250,AbnormalAccuracy:250}})>baseline,
 'Offensive PvP board nodes must contribute to the score');
assert(score({...state,boardStats:{PvPDecreaseDamage:250,AbnormalResistance:250}})>baseline,
 'Survival/CC-resist nodes must contribute to the score');

const mc=rank=>rank<=4?1:rank<=7?2:4;
const sc=rank=>rank<=5?1:rank<=10?2:rank<=15?4:8;
const masteryNames=['Poach','Judgment'];
const initialMastery={Poach:5,Judgment:10};
const masteryBudget=joint.spend(initialMastery,masteryNames,mc,1);
const master=joint.improveRanks({
 names:masteryNames,initial:initialMastery,budget:masteryBudget,
 cost:mc,cap:()=>10,breakpoints:[8,10],maxPasses:3,
 score:levels=>(levels.Poach>=8?100:0)+levels.Judgment*.01
});
assert.equal(master.levels.Poach>=8,true,
 'Joint search must trade complete Mastery breakpoint bundles');
assert(master.spent<=masteryBudget);
const stigmaNames=['Executing Blade','Grapple'];
const initialStigmas={'Executing Blade':5,Grapple:15};
const stigmaBudget=joint.spend(initialStigmas,stigmaNames,sc,0);
const stigmas=joint.improveRanks({
 names:stigmaNames,initial:initialStigmas,budget:stigmaBudget,
 cost:sc,cap:()=>20,minimum:0,minRanks:{'Executing Blade':5,Grapple:5},
 breakpoints:[5,10,15,20],maxPasses:3,
 score:levels=>(levels['Executing Blade']>=10?100:0)+levels.Grapple*.01
});
assert(stigmas.levels['Executing Blade']>=10,
 'Full Stigma breakpoints must be considered, not just one rank at a time');
assert(stigmas.levels.Grapple>=5&&stigmas.spent<=stigmaBudget);

const masteryBudget2=joint.spend(rankMap,Object.keys(rankMap),mc,1);
for(const points of [30,60,80,120,180,300]){
 const startingStigma=Object.fromEntries(names.map(name=>[name,5]));
 if(points>=30)startingStigma['Shield of Protection']=10;
 const candidate=joint.optimizeCombined({
  classId:'templar',context:'pvp-abyss-solo',objective:'burst',
  mastery:{levels:rankMap,spent:masteryBudget2},
  stigma:{levels:startingStigma,spent:joint.spend(startingStigma,names,sc,0)},
  masteryNames:Object.keys(rankMap),stigmaNames:names,
  masteryBudget:masteryBudget2,stigmaBudget:points,
  masteryCost:mc,stigmaCost:sc,masteryCap:()=>10,
  scoreBuild:(mastery,stigma)=>score({...state,mastery,stigma}),
  pinMastery:true,stigmaFloors:Object.fromEntries(names.map(name=>[name,5]))
 });
 assert(candidate.stigma.spent<=points,'Overspent Stigma at '+points);
 assert(names.every(name=>candidate.stigma.levels[name]>=5&&candidate.stigma.levels[name]<=20));
 assert(candidate.scoreAfter>=candidate.scoreBefore-1e-7,'Degraded PvP score '+points);
 assert.equal(candidate.stigma.spent,joint.spend(candidate.stigma.levels,names,sc,0));
}
console.log('Global Templar solo Abyss: ranged burst, Blade 5/10/15, anti-heal, connected-stat sensitivity, and 30–300 Stigma breakpoint exchanges passed. No win-rate claim.');
