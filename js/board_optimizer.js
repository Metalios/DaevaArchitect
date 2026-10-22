// Connected, goal-aware progression across all four PvE boards. Every crystal
// budget uses a prefix of this route; the score is a planning heuristic because
// the game's exact CP and combat formulas are not public.
function optimizeBoardRoute(classData, weights, masteryRanks, gearRanks, targetCp, baseCp, lockedIds = [], characterLevel = 45) {
  const unlocks = {Nezekan:12,Zikel:20,Vaizel:30,Triniel:40};
  const graphs = classData.boards.filter(board => characterLevel >= (unlocks[board.name] ?? Infinity)).map(board => {
    const nodes = new Map(board.nodes.map(node => [node[0], node]));
    const positions = new Map(board.nodes.map(node => [`${node[1]}:${node[2]}`, node[0]]));
    const adjacent = new Map(board.nodes.map(node => [node[0],
      [[node[1]-1,node[2]],[node[1]+1,node[2]],[node[1],node[2]-1],[node[1],node[2]+1]]
        .map(([r,c]) => positions.get(`${r}:${c}`)).filter(id => id !== undefined)]));
    return {name:board.name,nodes,adjacent,owned:new Set(board.nodes.filter(node => node[5] === 0).map(node => node[0]))};
  });
  const locked = new Set(lockedIds), bonuses = {}, route = [];
  const skillName = key => classData.skills[key]?.name;
  const initialFocus = targetCp > 0 ? baseCp === null
    ? Math.min(1.5,targetCp / 100000)
    : Math.min(1.5,Math.max(0,(targetCp-baseCp) / Math.max(5000,targetCp*0.25))) : 0;
  let boardCp = 0;
  function score(path,graph,focus) {
    let value = 0, cp = 0, lockedCount = 0;
    const added = {};
    for(const id of path) {
      const node = graph.nodes.get(id);
      if(locked.has(id)) lockedCount++;
      for(const [key,amount] of node[6]) {
        if(typeof key === 'number') {
          const name = skillName(key);
          value += (weights.skills[name] || 1.5)*amount;
          cp += CP_MODEL.mastery*amount;
          const before = (masteryRanks[name] || 1)+(gearRanks[name] || 0)+(bonuses[name] || 0)+(added[name] || 0);
          for(const [gate,extra] of [[8,7],[12,9],[16,13],[20,6]]) if(before < gate && gate <= before+amount) value += extra;
          added[name] = (added[name] || 0)+amount;
        } else {
          value += weights.stats[key] || 1.5;
          const meta = classData.stats[key];
          if(meta) cp += (CP_STAT_WEIGHTS[meta.name] || 0)*amount/(meta.div || 1);
        }
      }
    }
    // A marked purchase is a lock: reconnect it first, then optimize what is
    // still unowned. This keeps a player's already followed path useful.
    if(locked.size) value += lockedCount*100000;
    return {value:value+focus*cp*0.15,cp};
  }
  function shortestPaths(graph) {
    const distance = new Map(),parent = new Map(),visited = new Set();
    for(const id of graph.owned) distance.set(id,0);
    while(visited.size < graph.nodes.size) {
      let id=null,best=Infinity;
      for(const [candidate,d] of distance) if(!visited.has(candidate) && d<best) {id=candidate;best=d}
      if(id===null) break;
      visited.add(id);
      for(const near of graph.adjacent.get(id)) {
        const distanceTo = best+(graph.owned.has(near)?0:graph.nodes.get(near)[5]);
        if(distanceTo < (distance.get(near) ?? Infinity)) {distance.set(near,distanceTo);parent.set(near,id)}
      }
    }
    const paths=[];
    for(const id of graph.nodes.keys()) {
      if(graph.owned.has(id) || !distance.has(id)) continue;
      const path=[];let cursor=id;
      while(!graph.owned.has(cursor)) {path.push(cursor);cursor=parent.get(cursor);if(cursor===undefined) throw new Error('Disconnected board route')}
      paths.push(path.reverse());
    }
    return paths;
  }
  const totalNodes=graphs.reduce((sum,g)=>sum+g.nodes.size-g.owned.size,0);
  for(let step=0;step<totalNodes;) {
    const focus=baseCp === null ? initialFocus : targetCp>0
      ? Math.min(1.5,Math.max(0,(targetCp-baseCp-boardCp)/Math.max(5000,targetCp*0.25))) : 0;
    let best=null;
    for(const graph of graphs) for(const path of shortestPaths(graph)) {
      const cost=path.reduce((sum,id)=>sum+graph.nodes.get(id)[5],0);
      const reward=score(path,graph,focus);
      const ratio=reward.value/cost;
      if(!best || ratio>best.ratio+1e-9 || Math.abs(ratio-best.ratio)<1e-9 && (cost<best.cost || cost===best.cost && path.at(-1)<best.path.at(-1)))
        best={graph,path,cost,ratio};
    }
    if(!best) throw new Error('No connected board tile remains');
    const goal=best.path.at(-1);
    for(const id of best.path) {
      const node=best.graph.nodes.get(id);
      best.graph.owned.add(id);locked.delete(id);step++;
      for(const [key,amount] of node[6]) {
        if(typeof key==='number') {const name=skillName(key);bonuses[name]=(bonuses[name] || 0)+amount;boardCp+=CP_MODEL.mastery*amount}
        else {const meta=classData.stats[key];if(meta)boardCp+=(CP_STAT_WEIGHTS[meta.name] || 0)*amount/(meta.div || 1)}
      }
      route.push({board:best.graph.name,id,goal});
    }
  }
  return {route,initialFocus,baseCp};
}
