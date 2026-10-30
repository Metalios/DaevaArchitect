'use strict';
/* Client-side, budget-constrained PvE board search.
 * Research supplies candidate priors, never invented combat measurements.
 * A connected graph and the character's earned currency are hard constraints.
 * Non-Sorcerer scores are structural proxies, not measured DPS.
 */
const PVE_OBJECTIVES=Object.freeze({
  performance:{label:'Maximum PvE performance',description:'Damage, reliable burst, mobility and sufficient defense'},
  survivability:{label:'Maximum survivability',description:'Mitigation, effective health and reliable damage'},
  sustained:{label:'Maximum sustained DPS',description:'Long-fight damage, passives and cooldown uptime'},
  burst:{label:'Maximum burst DPS',description:'Highest modeled damage in short buff windows'}
});
const PVE_RESEARCH_PRIORS=Object.freeze({
  sorcerer:{
    offensive:['Hellfire','Firestorm','Blaze','Fire Mark','Robe of Flame','Wish of Concentration'],
    defensive:['Robe of Earth','Absorb Essence','Cold Snap','Grace of Resistance'],
    sources:[
      {url:'https://aion2data.com/guides/sorcerer',region:'Global',reviewed:'2026-10-26',kind:'guide'},
      {url:'https://aion2.gg/guides/sorcerer-pve-build',region:'Global',reviewed:'2026-10-26',kind:'mechanics'},
      {url:'https://aion2.gaming.tools/builds/sorcerer/pve',region:'Global',reviewed:'2026-10-26',kind:'build-examples'}
    ]
  }
});
const PveBuildOptimizer=(()=>{
  const max=(v,min=0)=>Math.max(min,Number(v)||0);
  const distinct=arr=>[...new Set(arr)];
  const SURVIVAL=/Defense|Resist|HPMax|Evasion|Block|DecreaseDamage|Guard|Shield/i;
  const SPEED=/CombatSpeed|CoolTimeDecrease/i;
  function parameters(goal){
    switch(goal){
      case 'survivability':return {attack:.55,defense:3.2,speed:.70,passive:.8};
      case 'sustained':return {attack:1.15,defense:.65,speed:1.4,passive:1.55};
      case 'burst':return {attack:1.4,defense:.48,speed:1.0,passive:1.1};
      default:return {attack:1,defense:1.15,speed:1.15,passive:1.2};
    }
  }
  function weightsFor(base,classId,context,goal,variant=0){
    const p=parameters(goal),skills={},stats={};
    const research=PVE_RESEARCH_PRIORS[classId];
    const classProfile=typeof ClassCombatModels==='undefined'?null:ClassCombatModels.profile(classId);
    for(const [name,w] of Object.entries(base.skills||{})){
      const defensive=research?.defensive.includes(name)||classProfile?.defense.includes(name)||/Shield|Protection|Health|Healing|Armor|Resist|Guard/i.test(name);
      const passive=(research?.offensive.includes(name)&&['Robe of Flame','Fire Mark'].includes(name))||classProfile?.support.includes(name);
      const boost=(research?.offensive.includes(name)||classProfile?.offense.includes(name))?1.20:1;
      const adoption=typeof RESEARCH_PRIORS!=='undefined'?
        Math.max(0,Math.min(1,RESEARCH_PRIORS[classId]?.skills[name]||0)):0;
      // Dated guide summaries only suggest promising paths. Their influence
      // is capped to 8% and cannot override verified mechanics or constraints.
      skills[name]=max(w)*(defensive?p.defense:passive?p.passive:p.attack)*boost*(1+.08*adoption);
    }
    if(classId==='sorcerer'){
      const focus=[null,'Robe of Flame','Fire Mark','Hellfire','Firestorm'][variant]||null;
      if(focus)skills[focus]=max(skills[focus],38)*2;
      for(const name of ['Robe of Flame','Fire Mark'])skills[name]=max(skills[name],goal==='survivability'?12:36);
    }
    for(const [name,w] of Object.entries(base.stats||{})){
      if(/^PvP/i.test(name)){stats[name]=0;continue}
      stats[name]=max(w)*(SURVIVAL.test(name)?p.defense:SPEED.test(name)?p.speed:p.attack);
    }
    if(context==='solo')for(const name of Object.keys(stats))if(SURVIVAL.test(name))stats[name]*=1.25;
    return {skills,stats};
  }
  function buildGraph(classData,level){
    const unlocks={Nezekan:12,Zikel:20,Vaizel:30,Triniel:40};
    return classData.boards.filter(b=>level>=(unlocks[b.name]??Infinity)).map(board=>{
      const nodes=new Map(board.nodes.map(n=>[n[0],n]));
      const position=new Map(board.nodes.map(n=>[`${n[1]}:${n[2]}`,n[0]]));
      const adjacent=new Map(board.nodes.map(n=>[n[0],
        [[n[1]-1,n[2]],[n[1]+1,n[2]],[n[1],n[2]-1],[n[1],n[2]+1]]
          .map(([r,c])=>position.get(`${r}:${c}`)).filter(id=>id!==undefined)]));
      return {name:board.name,nodes,adjacent,roots:new Set(board.nodes.filter(n=>n[5]===0).map(n=>n[0]))};
    });
  }
  // Multi-source shortest paths: each currently funded node (or free root)
  // provides a legal entry into that board. Each path's cost is exact.
  function paths(graph,selected){
    const cost=new Map(),parent=new Map(),visited=new Set();
    for(const id of graph.nodes.keys())if(graph.roots.has(id)||selected.has(id))cost.set(id,0);
    while(true){
      let id=null,best=Infinity;
      for(const [candidate,d] of cost)if(!visited.has(candidate)&&d<best){best=d;id=candidate}
      if(id===null)break;
      visited.add(id);
      for(const near of graph.adjacent.get(id)||[]){
        const distance=best+(selected.has(near)?0:graph.nodes.get(near)[5]);
        if(distance<(cost.get(near)??Infinity)){cost.set(near,distance);parent.set(near,id)}
      }
    }
    const result=[];
    for(const id of graph.nodes.keys()){
      if(selected.has(id)||graph.roots.has(id)||!cost.has(id))continue;
      const route=[];let current=id;
      while(!selected.has(current)&&!graph.roots.has(current)){
        route.push(current);current=parent.get(current);
        if(current===undefined)throw new Error('Disconnected Daevanion target');
      }
      result.push({path:route.reverse(),cost:cost.get(id),goal:id,board:graph.name});
    }
    return result;
  }
  function scoreState(selected,classData,graphs,ranks,gear,weights,targets,classId,goal){
    const levels={},stats={};let value=0;
    for(const graph of graphs)for(const id of selected){
      const node=graph.nodes.get(id);if(!node||node[5]===0)continue;
      for(const [key,amount] of node[6]){
        if(typeof key==='number'){
          const name=classData.skills[key]?.name;
          if(name)levels[name]=(levels[name]||0)+amount;
        }else stats[key]=(stats[key]||0)+amount;
      }
    }
    for(const [name,added] of Object.entries(levels)){
      const current=(ranks[name]||1)+(gear[name]||0),weight=weights.skills[name]||1.5;
      value+=added*weight;
      for(const threshold of [8,12,16,20]){
        if(current<threshold&&current+added>=threshold)value+=weight*.9+(threshold===16?25:12);
      }
      for(const milestone of targets[name]?.milestones||[]){
        if(current<milestone.rank&&current+added>=milestone.rank)
          value+=20*(milestone.weight||1);
      }
    }
    for(const [name,amount] of Object.entries(stats))
      value+=amount*(weights.stats[name]??1.5);
    // These are transparent structural synergy hypotheses for candidate search.
    // Final Sorcerer damage candidates are also evaluated by the combat model.
    if(classId==='sorcerer'&&goal!=='survivability'){
      const eff=name=>(ranks[name]||1)+(gear[name]||0)+(levels[name]||0);
      value+=(eff('Hellfire')-1)*Math.sqrt(max(eff('Firestorm')-1))*2.8;
      value+=(eff('Robe of Flame')-1)*(eff('Hellfire')+eff('Blaze')+eff('Firestorm'))*.65;
      value+=(eff('Fire Mark')-1)*(eff('Blaze')+eff('Firestorm'))*.9;
    }
    const evidence=typeof ClassCombatModels==='undefined'?null:ClassCombatModels.profile(classId);
    if(evidence){
      const eff=name=>(ranks[name]||1)+(gear[name]||0)+(levels[name]||0);
      for(const [name,gates] of Object.entries(evidence.milestones)){
        // Hard milestones receive a completion bonus, not a universal
        // incentive to add ranks to skills that have already crossed them.
        for(const threshold of gates){
          const base=(ranks[name]||1)+(gear[name]||0);
          if(base<threshold&&eff(name)>=threshold)
            value+=(goal==='survivability'?10:35);
        }
      }
      if(goal!=='survivability'){
        const drivers=evidence.offense.slice(0,4).map(name=>Math.max(1,eff(name)));
        value+=Math.sqrt(drivers.reduce((v,x)=>v*x,1))*.65;
      }else {
        value+=evidence.defense.reduce((v,name)=>v+(levels[name]||0)*12,0);
      }
    }
    return value;
  }
  /**
   * Take a promising connected seed to the actual earned-crystal budget.
   * The earlier search only produces a bounded set of high-quality seed paths;
   * comparing incomplete eight-purchase seeds against a fully spent legacy
   * route would otherwise always favor the old optimizer.
   *
   * Rank affordable, immediately connected nodes by dynamic marginal reward.
   * Connectivity is enforced on EVERY insertion, not fixed up afterward.
   */
  function finishAtBudget(state,graphs,budget,weights,ranks,gear,targets,classData,classId,goal,grade){
    const chosen=new Set(state.selected),route=state.route.slice();
    let spent=state.spent;
    const ranksAdded={};
    for(const graph of graphs)for(const id of chosen){
      const node=graph.nodes.get(id);
      if(!node||!node[5])continue;
      for(const [key,amount] of node[6])
        if(typeof key==='number'){
          const name=classData.skills[key]?.name;
          if(name)ranksAdded[name]=(ranksAdded[name]||0)+amount;
        }
    }
    const evidence=typeof ClassCombatModels==='undefined'?null:ClassCombatModels.profile(classId);
    const marginal=node=>{
      let score=0;
      for(const [key,amount] of node[6]){
        if(typeof key!=='number'){score+=amount*(weights.stats[key]??1.5);continue}
        const name=classData.skills[key]?.name;
        if(!name)continue;
        const before=(ranks[name]||1)+(gear[name]||0)+(ranksAdded[name]||0),
          after=before+amount;
        score+=amount*(weights.skills[name]??1.5);
        for(const threshold of [8,12,16,20])
          if(before<threshold&&after>=threshold)score+=22;
        for(const mark of targets[name]?.milestones||[])
          if(before<mark.rank&&after>=mark.rank)score+=22*(mark.weight||1);
        for(const mark of evidence?.milestones[name]||[])
          if(before<mark&&after>=mark)score+=goal==='survivability'?10:37;
        if(goal==='survivability'&&evidence?.defense.includes(name))score+=amount*12;
      }
      return score;
    };
    for(let iterations=0;iterations<400;iterations++){
      let winner=null;
      for(const graph of graphs)for(const [id,node] of graph.nodes){
        if(chosen.has(id)||!node[5]||spent+node[5]>budget)continue;
        if(!graph.adjacent.get(id).some(near=>chosen.has(near)))continue;
        const score=marginal(node),efficiency=score/node[5];
        if(!winner||efficiency>winner.efficiency+1e-10||
           Math.abs(efficiency-winner.efficiency)<1e-10&&
           (score>winner.score||score===winner.score&&id<winner.id))
          winner={graph,id,node,score,efficiency};
      }
      if(!winner)break;
      chosen.add(winner.id);spent+=winner.node[5];
      route.push({board:winner.graph.name,id:winner.id,goal:winner.id});
      for(const [key,amount] of winner.node[6])if(typeof key==='number'){
        const name=classData.skills[key]?.name;
        if(name)ranksAdded[name]=(ranksAdded[name]||0)+amount;
      }
    }
    return {selected:chosen,route,spent,score:grade(chosen)};
  }
  function stateKey(set){return [...set].sort((a,b)=>a-b).join(',')}
  function optimize({classData,classId,context,objective='performance',baseWeights,mastery,gear={},locked=[],
    crystalBudget=136,characterLevel=45,skillTargets={},scoreFinal=null}){
    if(!['party','solo'].includes(context))throw Error('PvE optimizer requires solo or party context');
    if(!PVE_OBJECTIVES[objective])throw Error('Unknown PvE objective');
    const graphs=buildGraph(classData,characterLevel),budget=max(crystalBudget);
    const roots=new Set(graphs.flatMap(g=>[...g.roots]));
    const mandatory=distinct([...locked].map(Number)).filter(id=>graphs.some(g=>g.nodes.has(id)&&!roots.has(id)));
    const base=weightsFor(baseWeights,classId,context,objective);
    const grade=selected=>scoreState(selected,classData,graphs,mastery,gear,base,skillTargets,classId,objective);
    let selected=new Set(roots),route=[],spent=0;
    for(const id of mandatory){
      const graph=graphs.find(g=>g.nodes.has(id));
      const connection=paths(graph,selected).find(p=>p.goal===id);
      if(!connection)throw Error('Cannot connect previously obtained Daevanion node');
      for(const nodeId of connection.path)if(!selected.has(nodeId)){
        selected.add(nodeId);route.push({board:graph.name,id:nodeId,goal:id});
        spent+=graph.nodes.get(nodeId)[5];
      }
    }
    if(spent>budget)throw Error('Recorded purchased nodes cannot be connected within entered crystal budget');
    let beam=[{selected,route,spent,score:grade(selected)}],best=beam[0],evaluated=0;
    const width=2,branches=3,maxRounds=Math.min(8,Math.ceil(budget/2)+1);
    for(let round=0;round<maxRounds;round++){
      const expanded=[],seen=new Set();
      for(const state of beam){
        const choices=[];
        for(const graph of graphs)for(const p of paths(graph,state.selected)){
          if(p.cost<=0||p.cost>budget-state.spent)continue;
          const next=new Set(state.selected);p.path.forEach(id=>next.add(id));
          const score=grade(next);evaluated++;
          choices.push({...p,selected:next,score,efficiency:(score-state.score)/p.cost});
        }
        // Preserve strong complete states AND explore efficient, longer
        // connector packages. Sorting uses whole-build score, not a node rank.
        choices.sort((a,b)=>b.efficiency-a.efficiency||b.score-a.score||a.goal-b.goal);
        for(const choice of choices.slice(0,branches)){
          const key=stateKey(choice.selected);
          if(seen.has(key))continue;seen.add(key);
          const next={selected:choice.selected,spent:state.spent+choice.cost,
            route:state.route.concat(choice.path.map(id=>({board:choice.board,id,goal:choice.goal}))),
            score:choice.score};
          expanded.push(next);
          if(next.score>best.score+1e-8||Math.abs(next.score-best.score)<1e-8&&next.spent>best.spent)best=next;
        }
      }
      if(!expanded.length)break;
      expanded.sort((a,b)=>b.score-a.score||b.spent-a.spent);
      beam=expanded.slice(0,width);
    }
    const seeds=[best,...beam].filter((s,i,a)=>
      a.findIndex(x=>stateKey(x.selected)===stateKey(s.selected))===i);
    const candidates=seeds.map(s=>finishAtBudget(s,graphs,budget,base,mastery,gear,
      skillTargets,classData,classId,objective,grade));
    // The legacy route remains a legal full-board fallback and provides a
    // comparison candidate, but can no longer dictate the funded prefix.
    const variantRoutes=[];
    for(let variant=0;variant<(classId==='sorcerer'?2:1);variant++){
      const w=weightsFor(baseWeights,classId,context,objective,variant);
      const legacy=optimizeBoardRoute(classData,w,mastery,gear,0,null,mandatory,characterLevel,skillTargets);
      const fitted=fitConnectedBoardBudget(classData,legacy.route,budget);
      const eligible=fitted.route.filter(entry=>entry.id!==undefined);
      let cost=0,legal=[];
      for(const entry of eligible){
        const g=graphs.find(x=>x.name===entry.board),n=g?.nodes.get(entry.id);
        if(!n||cost+n[5]>budget)break;
        cost+=n[5];legal.push(entry);
      }
      const fundedSet=new Set([...roots,...legal.map(x=>x.id)]);
      if(mandatory.every(id=>fundedSet.has(id)))
        variantRoutes.push({selected:fundedSet,route:legal,spent:cost,score:grade(fundedSet)});
    }
    const all=[...candidates,...variantRoutes];
    let winner=all[0],finalEvidence=null;
    for(const option of all){
      const metric=typeof scoreFinal==='function'?scoreFinal(option):option.score;
      const score=Number.isFinite(metric)?metric:-Infinity;
      if(finalEvidence===null||score>finalEvidence+1e-9){winner=option;finalEvidence=score}
    }
    const seeded=winner.route,used=new Set([...roots,...seeded.map(x=>x.id)]);
    const complete=optimizeBoardRoute(classData,base,mastery,gear,0,null,mandatory,characterLevel,skillTargets);
    const rank=new Map(complete.route.map((entry,i)=>[entry.id,i]));
    const tail=[],pending=new Map(complete.route.filter(x=>!used.has(x.id)).map(x=>[x.id,x]));
    while(pending.size){
      let next=null;
      for(const item of pending.values()){
        const graph=graphs.find(g=>g.name===item.board);
        if(!(graph?.adjacent.get(item.id)||[]).some(id=>used.has(id)))continue;
        if(!next||(rank.get(item.id)??Infinity)<(rank.get(next.id)??Infinity))next=item;
      }
      if(!next)throw Error('Optimized board has an unreachable continuation');
      tail.push(next);pending.delete(next.id);used.add(next.id);
    }
    return {route:[...seeded,...tail],initialFocus:0,baseCp:null,
      diagnostics:{objective,context,crystals:budget,planned:winner.spent,
        candidates:all.length,evaluations:evaluated,score:finalEvidence,
        evidence:classId==='sorcerer'?'comparative-sorcerer-combat':'class-specific-mechanics-projection',
        sources:PVE_RESEARCH_PRIORS[classId]?.sources||
          (typeof ClassCombatModels!=='undefined'&&ClassCombatModels.profile(classId)
          ?[{url:ClassCombatModels.profile(classId).evidence,region:'Global',reviewed:'2026-10-27',kind:'guide'}]:[])}};
  }
  return Object.freeze({optimize,weightsFor,buildGraph,PVE_RESEARCH_PRIORS});
})();
