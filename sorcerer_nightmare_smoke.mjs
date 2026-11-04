// Browser acceptance: actual DaevaArchitect model(), not just recommendations.
// Checks fresh45 Solo Nightmare goals change funded ranks, Stigmas and boards.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 const results=await page.evaluate(()=>{
  state.class='sorcerer';
  const a=account();
  Object.assign(a,{journey:'endgame',context:'solo',endgameContext:'solo',
   mastery:203,stigma:30,crystals:136,ariel:0,azphel:0,
   pvpOpponent:'all',goalTarget:0,
   customStigmas:null,manualStigma:null,manualMastery:null,
   customSpecialties:{},gear:{},equipment:{},obtainedNodes:[],
   boardMode:'recommended',customNodes:[],customAzphelNodes:[],
   recommendedRouteSnapshot:null});
  const goals=['performance','sustained','burst','survivability','control'];
  const cases={};
  for(const goal of goals){
   a.pveObjective=goal;
   a.recommendedRouteSnapshot=null;
   const m=model(),stigmas=activeStigmas(),route=plannedRoute();
   const effective=Object.fromEntries(Object.entries(m.mastery.levels)
      .filter(([,rank])=>rank>1)
      .sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))
      .map(([name,rank])=>[name,rank]));
   cases[goal]={
    stigmas,stigmaLevels:m.stigma.levels,
    spent:{mastery:m.mastery.spent,stigma:m.stigma.spent,board:m.boards.spent},
    mastery:effective,
    board:route.filter(row=>m.boards.owned.has(row.id)).map(row=>row.id),
    objective:a.pveObjective,
    error:a.lastObjectiveAnalysis?.error||null
   };
  }
  a.pveObjective='performance';
  a.recommendedRouteSnapshot=null;
  render();
  const visible={
   loadout:document.getElementById('loadout-text').textContent,
   title:document.getElementById('loadout-title').textContent,
   steps:document.getElementById('now-steps').textContent
  };
  a.customStigmas=['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm'];
  const manuallyEquipped=activeStigmas();
  a.customStigmas=null;
  return {cases,visible,manuallyEquipped};
 });
 const goals=['performance','sustained','burst','survivability','control'];
 for(const goal of goals){
  const item=results.cases[goal];
  assert.equal(item.objective,goal);
  assert.equal(item.stigmas.length,4);
  assert.equal(new Set(item.stigmas).size,4);
  assert(item.spent.mastery<=203&&item.spent.stigma<=30&&item.spent.board<=136,
   'Fresh45 Sorcerer overspent '+goal+': '+JSON.stringify(item.spent));
  assert(item.spent.mastery>=100,'Unspent Mastery despite affordable upgrades '+goal);
  assert(item.spent.board>90,'No coherent endgame board routing '+goal);
  assert(!item.error,'Objective board optimizer error on '+goal+': '+item.error);
  assert(item.board.length>0,'Missing purchased board recommendations '+goal);
 }
 const str=item=>JSON.stringify(item);
 assert.equal(new Set(goals.map(g=>str(results.cases[g].stigmas))).size,5,
  'Solo paths are still reusing an identical four-Stigma bar');
 assert.equal(new Set(goals.map(g=>str(results.cases[g].mastery))).size,5,
  'Solo paths are still reusing an identical purchased Mastery allocation');
 const boardVariety=new Set(goals.map(g=>str(results.cases[g].board.slice(0,70)))).size;
 assert(boardVariety>=2,
  'Every Solo endgame Daevanion funded route has the same leading nodes');
 assert(results.visible.title.includes('Nightmare'));
 assert(/Nightmare/.test(results.visible.loadout));
 assert(/Nightmare bosses/.test(results.visible.steps));
 assert.deepEqual(Array.from(results.manuallyEquipped),
  ['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm']);
 assert.deepEqual(errors,[],'Browser runtime errors');
 console.log('Sorcerer Solo fresh45 endgame: all five actual builds have distinct Stigmas and Mastery; '+boardVariety+
  ' funded Daevanion route variants; Nightmare UI and manual override passed.');
}finally{await browser.close()}
