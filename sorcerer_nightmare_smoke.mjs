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
    hellfireRank:skillLevelBreakdown('Hellfire',m).withPlan,
    hellfireSpecialties:[...(m.combat?.specialties?.Hellfire||[])],
    firestormSpecialties:[...(m.combat?.specialties?.Firestorm||[])],
    macro:m.combat?.macro?{
      mode:m.combat.macro.mode,
      steps:[...m.combat.macro.steps],
      skills:m.combat.macro.stacks.flatMap(stack=>stack.skills),
      mobileHellfire:m.combat.specialties?.Hellfire?.includes(3)||false
    }:null,
    error:a.lastObjectiveAnalysis?.error||null
   };
  }
  a.pveObjective='performance';
  a.recommendedRouteSnapshot=null;
  render();
  const visible={
   loadout:document.getElementById('loadout-text').textContent,
   title:document.getElementById('loadout-title').textContent,
   steps:document.getElementById('now-steps').textContent,
   macroSkills:[...document.querySelectorAll(
    '#macro-stacks .macro-stack-auto [data-skill]')].map(row=>row.dataset.skill),
   qRowPriority:[...document.querySelectorAll(
    '#macro-stacks .macro-stack-auto[data-macro-key="Q"] [data-row][data-skill]')]
      .map(row=>({row:Number(row.dataset.row),name:row.dataset.skill}))
      .sort((a,b)=>a.row-b.row).map(row=>row.name),
   hotbarNames:[...document.querySelectorAll('#hotbar-grid .hotbar-skills strong')]
      .map(node=>node.textContent.trim()),
   equippedStigmas:[...activeStigmas()],
   macroKeys:[...document.querySelectorAll(
    '#macro-stacks .macro-stack-auto[data-macro-key]')].map(row=>row.dataset.macroKey)
  };
  const actualMobileSpecs=Object.fromEntries(
   ['Hellfire','Bittercold Wind',"Winter's Shackles",'Frost Burst','Frost'].map(name=>
    [name,specPicks(name,skillLevelBreakdown(name,model()).withOwned)]));
  visible.macroMobileSafe=visible.macroSkills.every(name=>
   GlobalCombatEngine.isMobile(name,actualMobileSpecs));
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
 for(const goal of ['performance','sustained','burst']){
   const result=results.cases[goal];
   assert(result.macro,'Offensive Nightmare goal must produce a mobile combat macro '+goal);
   assert.equal(result.macro.mode,'flow',
    'Nightmare macro must exclude stationary ground actions for '+goal);
   assert(!result.macro.skills.includes('Fire Wall')&&
     !result.macro.skills.includes('Cold Storm'),
    'Moving boss macro cannot automatically place stationary ground fields');
   if(result.hellfireRank>=8)
     assert(result.hellfireSpecialties.includes(1),
       'Hellfire first Specialty must grant +30% Skill Speed at '+goal);
   if(result.hellfireRank>=12)
     assert(result.hellfireSpecialties.includes(3),
       'Hellfire second Specialty must enable mobility at '+goal);
   else assert(!result.hellfireSpecialties.includes(3),
       'Hellfire rank8 must not sacrifice +30% speed for mobile at '+goal);
 }
 assert(results.visible.macroMobileSafe,
  'Visible Nightmare macro attempted an unearned stationary attack');
 assert(results.visible.macroKeys.includes('Q'),
  'Visible moving fire stack Q must remain bound');
 assert.deepEqual(results.visible.qRowPriority.slice(0,2),['Blaze','Firestorm'],
  'The moving Q stack must use ready conditional Blaze before Firestorm');
 for(const name of results.visible.equippedStigmas)
   assert(results.visible.hotbarNames.includes(name)||
          results.visible.macroSkills.includes(name),
    'Equipped Solo Nightmare Stigma missing from manual bar AND macro: '+name);
 assert(results.visible.macroSkills.includes('Element Enhancement'),
  'Balanced Nightmare macro must automatically refresh Element Enhancement');
 assert(results.visible.macroSkills.includes('Delayed Explosion'),
  'Balanced Nightmare macro must automatically apply Delayed Explosion');
 assert(!results.visible.hotbarNames.includes('Element Enhancement')&&
        !results.visible.hotbarNames.includes('Delayed Explosion'),
  'Automated offensive Stigmas should not waste additional manual hotkeys');
 assert(results.visible.macroKeys.includes('E'),
  'The macro must cover Frost and available follow-ups without extra manual presses');
 assert(new Set(results.visible.hotbarNames.filter(name=>name!=='Flex slot')).size===
   results.visible.hotbarNames.filter(name=>name!=='Flex slot').length,
   'Duplicate skills waste manual hotkeys');
 assert(results.visible.title.includes('Nightmare'));
 assert(/Nightmare/.test(results.visible.loadout));
 assert(/Nightmare bosses/.test(results.visible.steps));
 assert.deepEqual(Array.from(results.manuallyEquipped),
  ['Element Enhancement','Delayed Explosion','Fire Wall','Cold Storm']);
 assert.deepEqual(errors,[],'Browser runtime errors');
 console.log('Sorcerer Solo fresh45 endgame: all five actual builds have distinct Stigmas and Mastery; '+boardVariety+
  ' funded Daevanion route variants; Nightmare UI and manual override passed.');
}finally{await browser.close()}
