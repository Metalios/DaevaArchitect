import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.resolve('dist/index.html')).href);
for(const cls of ['templar','gladiator','assassin','ranger','sorcerer','spiritmaster','cleric','chanter']){
  await page.locator(`[data-class="${cls}"]`).click();
  const result=await page.evaluate(()=>{
    const a=account();a.mastery=203;a.stigma=29;a.crystals=136;a.obtainedNodes=[];a.context='party';
    a.goalTarget=0;let start=model(),role=plannedRoute().map(x=>x.id);
    a.goalTarget=100000;let focused=model(),cp=plannedRoute().map(x=>x.id);
    a.mastery=285;a.stigma=60;a.crystals=233;let grown=model(),grownRoute=plannedRoute();
    const connected=['party','solo','pvp'].every(context=>{
      a.context=context;model();const seen={};
      return plannedRoute().every(step=>{
        const node=nodeMap().get(step.id).node,board=data().boards.find(b=>b.name===step.board);
        const touching=board.nodes.some(other=>(other[5]===0||seen[other[0]])&&Math.abs(other[1]-node[1])+Math.abs(other[2]-node[2])===1);
        seen[step.id]=true;return touching;
      });
    });
    return {baseline:[start.mastery.spent,start.stigma.spent,start.boards.spent],
      grown:[grown.mastery.spent,grown.stigma.spent,grown.boards.spent],
      role:role.slice(0,30),cp:cp.slice(0,30),routeLength:grownRoute.length,
      total:grownRoute.reduce((sum,x)=>sum+nodeMap().get(x.id).node[5],0),connected};
  });
  assert(result.baseline[0]<=203&&result.baseline[1]<=29&&result.baseline[2]<=136,`${cls}: fresh level 45 overspent`);
  assert(result.grown[0]<=285&&result.grown[1]<=60&&result.grown[2]<=233,`${cls}: earned points overspent`);
  assert.equal(result.routeLength,380,`${cls}: incomplete full progression`);
  assert.equal(result.total,570,`${cls}: incorrect full crystal total`);
  assert(result.connected,`${cls}: a context route contains disconnected tiles`);
  assert.deepEqual(result.cp,result.role,`${cls}: without recorded gear, an arbitrary CP target must not alter the board route`);
}
await page.locator('[data-class="templar"]').click();
const personal=await page.evaluate(()=>{
  const a=account();a.goalTarget=60000;a.equipment={};
  for(const slot of GEAR_SLOTS.filter(x=>['left','right'].includes(x.area)))a.equipment[slot.id]={itemLevel:50,enhancement:0};
  const m=model(),estimate=estimateCombatPower(m),baseline=liveRouteBasis.baseCp;
  a.goalTarget=100000;model();const higher=liveRouteBasis.initialFocus;
  a.goalTarget=60000;model();const lower=liveRouteBasis.initialFocus;
  return {ready:estimate.ready,baseline,higher,lower};
});
assert(personal.ready&&Number.isFinite(personal.baseline),'complete recorded gear should supply a personal CP baseline');
assert(personal.higher>personal.lower,'a higher CP goal should increase CP emphasis');
const owned=await page.evaluate(()=>{
  const a=account();a.obtainedNodes=[];model();
  const picked=plannedRoute()[100].id;
  a.obtainedNodes=[picked];model();
  return plannedRoute().findIndex(step=>step.id===picked);
});
assert(owned>=0&&owned<20,'an already obtained tile should be reconnected before later recommendations');
assert.deepEqual(errors,[],'page errors');
console.log('All eight classes: fresh-45 budgets, earned-point budgets, 570-crystal progression, and target-aware routes passed.');
await browser.close();
