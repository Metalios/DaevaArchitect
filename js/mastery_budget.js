// Fill the residual Mastery budget after the class/combination optimizer.
// A stage list may stop at preset targets, and the combat local-search used
// to have an arbitrary 20-rank limit. Every final suggested purchase must
// be legal; only leave points unused if no remaining rank is affordable.
// Manual allocations are excluded by the caller.
function spendAvailableMastery(initial, totalBudget, rankCost, rankCap, names, stages, skillWeights={},boardBonuses={},gearBonuses={}) {
  const levels={...initial.levels};
  const budget=Math.max(0,Math.floor(Number(totalBudget)||0));
  const order=new Map();
  for(const [name] of stages)if(!order.has(name))order.set(name,order.size);
  for(const name of names)if(!order.has(name))order.set(name,order.size);
  let spent=names.reduce((total,name)=>{
    for(let rank=2;rank<=(levels[name]||1);rank++)total+=rankCost(rank);
    return total;
  },0);
  if(spent>budget)throw Error('Mastery base allocation already exceeds earned points');
  let added=0;
  while(true){
    let best=null;
    for(const name of names){
      const current=levels[name]||1,cap=Math.max(1,Math.min(10,rankCap(name)));
      if(current>=cap)continue;
      const next=current+1,cost=rankCost(next);
      if(cost>budget-spent)continue;
      const before=current+(boardBonuses[name]||0)+(gearBonuses[name]||0);
      const after=before+1,threshold=[8,12,16,20].includes(after)?8:0;
      const priority=1+(names.length-(order.get(name)??names.length))/names.length;
      const weight=Math.max(0,Number(skillWeights[name])||0);
      // Prefer meaningful damage/specialty upgrades, and account for the
      // actual cost of the next purchased rank. Not a measured DPS formula.
      const score=(priority+Math.min(50,weight)*.25+threshold)/cost;
      if(!best||score>best.score+1e-9||(Math.abs(score-best.score)<1e-9&&name<best.name))
        best={name,next,cost,score};
    }
    if(!best)break;
    levels[best.name]=best.next;spent+=best.cost;added++;
  }
  let cheapest=null;
  for(const name of names){
    const current=levels[name]||1;
    if(current>=Math.max(1,Math.min(10,rankCap(name))))continue;
    const cost=rankCost(current+1);
    if(!cheapest||cost<cheapest.cost)cheapest={name,rank:current+1,cost};
  }
  return {levels,spent,added,
    next:cheapest?{...cheapest,need:Math.max(0,cheapest.cost-(budget-spent))}:null,
    unspent:budget-spent};
}
