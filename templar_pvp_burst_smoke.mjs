// Full compiled-client smoke: Templar Solo Abyss ranks, gear-sensitive
// Daevanion, independent Azphel and conditional Specialties at two budgets.
// This does NOT claim to measure real player DPS, TTK, CC landing or win rate.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1360,height:900}});
 page.setDefaultTimeout(90000);
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 const checks=await page.evaluate(()=>{
  state.class='templar';
  const a=account();
  a.journey='endgame';
  a.context='pvp-abyss-solo';
  a.pvpOpponent='ranged';
  a.boardMode='recommended';
  a.manualMastery=null;
  a.manualStigma=null;
  a.customStigmas=null;
  a.customSpecialties={};
  a.customNodes=[];
  a.customAzphelNodes=[];
  a.obtainedNodes=[];
  a.currentRanks={};
  a.gear={Judgment:2};
  a.equipment={
   weapon:{name:'Recorded Longsword',grade:'Unique',skillBonuses:[{skill:'Judgment',levels:1}]},
   ring1:{name:'Recorded Ring',grade:'Unique',skillBonuses:[{skill:'Judgment',levels:1}]},
   top:{name:'Recorded Chest',grade:'Unique',skillBonuses:[{skill:'Fury',levels:1}],
     statNotes:'Attack +15; PvP Damage Boost 2%'},
   chalice:{name:'Chalice of Vigor',arcanaSet:'Vigor',grade:'Unique',
     enhancement:0,skillBonuses:[{skill:'Judgment',levels:1}]},
   parchment:{name:'Parchment of Magic',arcanaSet:'Magic',grade:'Unique',
     enhancement:0,skillBonuses:[{skill:'Judgment',levels:1}]},
   bell:{name:'Bell of Magic',arcanaSet:'Magic',grade:'Unique',
     enhancement:0,skillBonuses:[{skill:'Punishing Benediction',levels:1}]}
  };
  a.ariel=0;
  a.azphel=82;
  a.crystals=218;
  a.mastery=285;
  const requested=['Doom Shield','Grapple','Executing Blade','Shield of Protection'];
  const outcomes=[];
  for(const points of [80,120]){
   a.stigma=points;
   a.recommendedRouteSnapshot=null;
   const t=performance.now(),m=model();
   const elapsed=Math.round(performance.now()-t);
   const chosen=activeStigmas();
   const level=name=>(m.mastery.levels[name]||1)+(m.effects.skills[name]||0)+
       (gearSkillLevels()[name]||0)+(a.gear[name]||0);
   const combinedStats={...m.effects.stats};
   for(const extra of [m.arielEffects,m.azphelEffects])
    for(const [key,value] of Object.entries(extra.stats||{}))
     combinedStats[key]=(combinedStats[key]||0)+value;
   const build=engineBuild(m.mastery.levels,
     {skills:m.effects.skills,stats:combinedStats},
     m.stigma.levels,chosen);
   const picks=templarPvpSpecialtySeed(build,a.customSpecialties);
   const result=PvpCombatModels.evaluate({
      classId:'templar',context:a.context,build,selectedSpecs:picks
   });
   const progression=progressionBoardTargets('templar',a.context);
   outcomes.push({
    points,elapsed,stigmas:chosen,ranks:m.stigma.levels,
    judgmentGear:build.gearSkills.Judgment,
    arcanaDivine:build.arcanaDivine,
    furyGear:build.gearSkills.Fury,
    pvpBoost:build.gearStats.PvPAmplifyDamage,
    recordedAttack:build.gearStats.FixingDamage,
    specialJudgment:specPicks('Judgment',level('Judgment')),
    totalStigma:m.stigma.spent,totalMastery:m.mastery.spent,
    board:m.boards.spent,crystals:a.crystals,azphel:m.azphel.spent,
    score:result.score,specialties:picks,levels:Object.fromEntries(
      Object.keys(progression).map(name=>[name,level(name)])),
    manualPin:m.joint?.trace?.some(x=>x.area==='stigma')===false
   });
  }
  // Following a connected tile must not reshuffle the recommendations.
  // Replacing actual Arcana later must refresh the equipment-dependent plan.
  const before=a.recommendedRouteSnapshot;
  const originalRoute=JSON.stringify(before.route);
  const first=before.route[0]?.id;
  if(first!==undefined)a.obtainedNodes=[first];
  model();
  const stableRoute=JSON.stringify(a.recommendedRouteSnapshot.route)===originalRoute;
  const oldEquipmentKey=a.recommendedRouteSnapshot.equipmentKey;
  a.equipment.bell={name:'Bell of Vigor',arcanaSet:'Vigor',
    grade:'Unique',enhancement:0,
    skillBonuses:[{skill:'Punishing Benediction',levels:1}]};
  model();
  const refreshed=a.recommendedRouteSnapshot.equipmentKey!==oldEquipmentKey;
  const obtainedKept=first===undefined||a.obtainedNodes.includes(first);
  // The user may pin a manual Mastery, Stigma or Specialty selection.
  // A recommendation must NEVER overwrite it.
  a.customStigmas=['Doom Shield','Grapple','Executing Blade','Shield of Protection'];
  a.manualStigma={'Doom Shield':5,Grapple:5,'Executing Blade':15,
    'Shield of Protection':10};
  a.customSpecialties={Poach:[2]};
  a.stigma=120;
  a.recommendedRouteSnapshot=null;
  const manual=model();
  const preserved={
   ranks:manual.stigma.levels,poach:specPicks('Poach',
    (manual.mastery.levels.Poach||1)+(manual.effects.skills.Poach||0))
  };
  return {outcomes,preserved,stableRoute,refreshed,obtainedKept};
 });
 assert.deepEqual(errors,[],errors.join('\n'));
 const {outcomes,preserved,stableRoute,refreshed,obtainedKept}=checks;
 assert(stableRoute,'Obtained tile clicks must not reshuffle the recommendation');
 assert(refreshed,'Arcana changes must refresh cached board recommendations');
 assert(obtainedKept,'Replacing gear must preserve obtained board tiles');
 for(const row of outcomes){
  assert.equal(row.stigmas.length,4,'Four Global Stigma slots required');
  assert.equal(new Set(row.stigmas).size,4,'No duplicate Stigmas');
  assert(row.stigmas.includes('Grapple')&&row.stigmas.includes('Executing Blade'),
    'A ranged Solo Abyss catch-and-kill bar needs Grapple and Executing Blade');
  assert(row.totalStigma<=row.points&&row.totalMastery<=285);
  assert.equal(row.judgmentGear,6,
    'Manual Judgment +2 and four +1 item/Arcana rolls must add');
  assert.equal(row.furyGear,1,'Passive soulbind level must count');
  assert.equal(row.arcanaDivine.Time,20);
  assert.equal(row.arcanaDivine.Destiny,20);
  assert.equal(row.arcanaDivine.Destruction,20);
  assert(row.recordedAttack>=15,'Recorded Soul Binding Attack must count');
  assert(row.pvpBoost>=200,'Recorded 2% PvP Damage Boost must count');
  assert(row.board<=218&&row.azphel<=82);
  assert(Object.values(row.ranks).every(rank=>Number.isInteger(rank)&&rank>=5&&rank<=20));
  assert(Number.isFinite(row.score)&&row.score>0);
  assert(row.specialties.Poach?.every(id=>Number.isInteger(id)&&id>=1&&id<=5));
  assert(Object.values(row.levels).every(n=>Number.isFinite(n)&&n>=1));
 }
 assert(outcomes[1].totalStigma>=outcomes[0].totalStigma,
  'Increasing Stigma budget must not reduce total legal spending');
 assert.deepEqual(preserved.ranks,{
  'Doom Shield':5,Grapple:5,'Executing Blade':15,'Shield of Protection':10
 });
 assert.deepEqual(preserved.poach,[2]);
 console.log('Templar solo Abyss complete-model 285 Mastery / 218 crystals / 82 Azphel / 80 and 120 Stigma:',JSON.stringify(outcomes));
 await page.close();
}finally{await browser.close()}
