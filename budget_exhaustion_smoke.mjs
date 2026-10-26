// Test real app budget changes and visible funded results with saved
// obtained nodes. Complements the pure mathematical exhaustion tests.
import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
 const output=await page.evaluate(()=>{
   state.class='sorcerer';const a=account();
   a.context='party';a.journey='endgame';a.mastery=285;a.crystals=119;
   a.manualMastery=null;a.manualStigma=null;a.boardMode='recommended';
   a.customNodes=[];a.obtainedNodes=[];a.recommendedRouteSnapshot=null;
   a.customSpecialties={};a.gear={};a.equipment={};
   const errors=[];
   function audit(){
     const m=model(),crystals=budget('crystals'),points=budget('mastery');
     const map=nodeMap(),funded=m.boards.owned;
     const starts=new Set(data().boards.flatMap(board=>
       board.nodes.filter(n=>n[5]===0).map(n=>n[0])));
     const purchased=new Set([...funded,...starts]);
     let cheapest=Infinity;
     for(const board of data().boards){
       if(!boardOpen(board.name))continue;
       const positions=new Map(board.nodes.map(n=>[`${n[1]}:${n[2]}`,n[0]]));
       for(const n of board.nodes){
         if(purchased.has(n[0])||!n[5])continue;
         if([[n[1]-1,n[2]],[n[1]+1,n[2]],[n[1],n[2]-1],[n[1],n[2]+1]]
            .some(([r,c])=>purchased.has(positions.get(`${r}:${c}`))))
           cheapest=Math.min(cheapest,n[5]);
       }
     }
     const free=crystals-m.boards.spent;
     if(cheapest<=free)errors.push('Budget-fit route left affordable connected Daevanion tile');
     if(m.mastery.spent>points||m.boards.spent>crystals)errors.push('Overspent budgets');
     const affordable=skillNames().some(name=>
       m.mastery.levels[name]<masteryRankCap(name)&&
       masteryCost(m.mastery.levels[name]+1)<=points-m.mastery.spent);
     if(affordable)errors.push('Mastery optimizer left affordable purchased rank');
     return {points,crystals,masterySpent:m.mastery.spent,
       boardSpent:m.boards.spent,boardUnused:free,
       snapshotBudget:a.recommendedRouteSnapshot?.budget,
       route:a.recommendedRouteSnapshot?.route?.map(n=>n.id)||[]};
   }
   const initial=audit();
   const acquired=plannedRoute()[0].id;
   toggleBoardObtained(acquired);
   a.crystals=150;
   const updated=audit();
   if(updated.snapshotBudget!==150)errors.push('Budget change failed to refresh saved board route');
   if(!a.obtainedNodes.includes(acquired))errors.push('Earned-crystal edit discarded purchased tile');
   if(updated.masterySpent!==initial.masterySpent)errors.push('Unchanged Mastery budget altered Mastery point total');
   if(updated.boardSpent<initial.boardSpent)errors.push('More crystals reduced funded board spending');
   render();
   if(!document.querySelector('#global-route-budget')?.textContent.includes('/ 150'))
     errors.push('Updated crystal budget missing from board UI');
   if(!document.querySelector('#v2-master-status')?.textContent.includes('/ 285'))
     errors.push('Updated Mastery budget missing from skill UI');
   a.journey='leveling';leveling().level=36;a.recommendedRouteSnapshot=null;
   const lvl36=audit();
   leveling().level=37;
   const lvl37=audit();
   if(lvl36.crystals!==100||lvl37.crystals!==104||lvl37.snapshotBudget!==104)
     errors.push('Level 36 to 37 did not refresh funded board budget');
   return {initial,updated,lvl36,lvl37,errors};
 });
 assert.deepEqual(errors,[],errors.join('\n'));
 assert.deepEqual(output.errors,[],output.errors.join('\n'));
 console.log('Verified endgame 285-Mastery/119→150-crystal update and 36→37 leveling budget exhaustion:',JSON.stringify(output));
}finally{await browser.close()}
