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
  a.gear={};
  a.equipment={};
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
   const build=engineBuild(m.mastery.levels,
     {skills:m.effects.skills,stats:{...m.effects.stats,...m.azphelEffects.stats}},
     m.stigma.levels,chosen);
   const picks=templarPvpSpecialtySeed(build,a.customSpecialties);
   const result=PvpCombatModels.evaluate({
      classId:'templar',context:a.context,build,selectedSpecs:picks
   });
   const progression=progressionBoardTargets('templar',a.context);
   outcomes.push({
    points,elapsed,stigmas:chosen,ranks:m.stigma.levels,
    totalStigma:m.stigma.spent,totalMastery:m.mastery.spent,
    board:m.boards.spent,crystals:a.crystals,azphel:m.azphel.spent,
    score:result.score,specialties:picks,levels:Object.fromEntries(
      Object.keys(progression).map(name=>[name,level(name)])),
    manualPin:m.joint?.trace?.some(x=>x.area==='stigma')===false
   });
  }
  // The user may pin a manual Mastery, Stigma or Specialty selection.
  // A recommendation must NEVER overwrite it.
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
  return {outcomes,preserved};
 });
 assert.deepEqual(errors,[],errors.join('\n'));
 const {outcomes,preserved}=checks;
 for(const row of outcomes){
  assert.deepEqual(row.stigmas,['Doom Shield','Grapple','Executing Blade','Shield of Protection']);
  assert(row.totalStigma<=row.points&&row.totalMastery<=285);
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
