// Budget-fit connected Daevanion path, preserving the original scoring order.
// The full optimizer produces a legal route, but a simple route prefix can leave
// affordable tiles unused when an expensive tile appears before a cheap branch.
// We take the highest-ranked CONNECTED tile that fits the remaining budget,
// then append all other tiles in connected order for future point increases.
// Player-selected custom routes are deliberately not rearranged.
function fitConnectedBoardBudget(classData, rankedRoute, crystalBudget) {
  const all=new Map(),visited=new Set(),unselected=new Set(),position=new Map();
  for(const board of classData.boards) {
    const nodes=new Map(board.nodes.map(node=>[node[0],node]));
    const coords=new Map(board.nodes.map(node=>[`${node[1]}:${node[2]}`,node[0]]));
    for(const node of board.nodes) {
      if(node[5]===0)visited.add(node[0]);
      else {
        unselected.add(node[0]);
        all.set(node[0],{node,board:board.name,
          neighbors:[[node[1]-1,node[2]],[node[1]+1,node[2]],[node[1],node[2]-1],[node[1],node[2]+1]]
            .map(([r,c])=>coords.get(`${r}:${c}`)).filter(id=>id!==undefined)});
      }
    }
  }
  const priorities=new Map(rankedRoute.map((entry,index)=>[entry.id,{index,goal:entry.goal}]));
  const route=[];
  const limit=Math.max(0,Math.floor(Number(crystalBudget)||0));
  let spent=0,unaffordable=false;
  while(unselected.size) {
    let best=null;
    for(const id of unselected) {
      const entry=all.get(id);
      if(!entry.neighbors.some(neighbor=>visited.has(neighbor)))continue;
      const cost=entry.node[5];
      if(!unaffordable&&cost>limit-spent)continue;
      const priority=priorities.get(id)?.index??Number.MAX_SAFE_INTEGER;
      if(!best||priority<best.priority||(priority===best.priority&&id<best.id))
        best={id,cost,priority,board:entry.board};
    }
    if(!best) {
      if(!unaffordable){unaffordable=true;continue}
      throw new Error('Unreachable Daevanion tiles in connected budget planner');
    }
    if(!unaffordable)spent+=best.cost;
    visited.add(best.id);unselected.delete(best.id);
    route.push({board:best.board,id:best.id,goal:priorities.get(best.id)?.goal??best.id});
  }
  return {route,spent,unused:Math.max(0,limit-spent)};
}
