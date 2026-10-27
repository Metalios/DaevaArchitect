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
    for(const [name,w] of Object.entries(base.skills||{})){
      const defensive=research?.defensive.includes(name)||/Shield|Protection|Health|Healing|Armor|Resist|Guard/i.test(name);
      const passive=research?.offensive.includes(name)&&['Robe of Flame','Fire Mark'].includes(name);
      const boost=research?.offensive.includes(name)?1.20:1;
      skills[name]=max(w)*(defensive?p.defense:passive?p.passive:p.attack)*boost;
    }
    if(classId==='sorcerer'){
      const focus=[null,'Robe of Flame','Fire Mark','Hellfire','Firestorm'][variant]||null;
      if(focus)skills[focus]=max(skills[focus],38)*2;
      for(const name of ['Robe of Flame','Fire Mark'])skills[name]=max(skills[name],goal==='survivability'?12:36);
    }
    for(const [name,w] of Object.entries(base.stats||{})){
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
      value+=amount*(weights.stats[name]||1.5);
    // These are transparent structural synergy hypotheses for candidate search.
    // Final Sorcerer damage candidates are also evaluated by the combat model.
    if(classId==='sorcerer'&&goal!=='survivability'){
      const eff=name=>(ranks[name]||1)+(gear[name]||0)+(levels[name]||0);
      value+=(eff('Hellfire')-1)*Math.sqrt(max(eff('Firestorm')-1))*2.8;
      value+=(eff('Robe of Flame')-1)*(eff('Hellfire')+eff('Blaze')+eff('Firestorm'))*.65;
      value+=(eff('Fire Mark')-1)*(eff('Blaze')+eff('Firestorm'))*.9;
    }
    return value;
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
    const width=8,branches=5,maxRounds=Math.min(150,graphs.reduce((sum,g)=>sum+g.nodes.size,0));
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
    const candidates=[best,...beam].filter((s,i,a)=>a.findIndex(x=>stateKey(x.selected)===stateKey(s.selected))===i);
    // The legacy route remains a legal full-board fallback and provides a
    // comparison candidate, but can no longer dictate the funded prefix.
    const variantRoutes=[];
    for(let variant=0;variant<(classId==='sorcerer'?5:2);variant++){
      const w=weightsFor(baseWeights,classId,context,objective,variant);
      const legacy=optimizeBoardRoute(classData,w,mastery,gear,0,null,mandatory,characterLevel,skillTargets);
      const fitted=fitConnectedBoardBudget(classData,legacy.route,budget);
      const ids=new Set([...roots,...fitted.route.filter((entry,i)=>i>=0).map(x=>x.id)]);
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
    const seeded=winner.route,used=new Set(seeded.map(x=>x.id));
    const complete=optimizeBoardRoute(classData,base,mastery,gear,0,null,mandatory,characterLevel,skillTargets);
    const tail=complete.route.filter(x=>!used.has(x.id));
    // Downstream budget fit safely reconnects every extension after the
    // optimized funded prefix without silently changing obtained marks.
    return {route:[...seeded,...tail],initialFocus:0,baseCp:null,
      diagnostics:{objective,context,crystals:budget,planned:winner.spent,
        candidates:all.length,evaluations:evaluated,score:finalEvidence,
        evidence:classId==='sorcerer'?'modeled-combat-and-synergy':'structural-synergy-proxy',
        sources:PVE_RESEARCH_PRIORS[classId]?.sources||[]}};
  }
  return Object.freeze({optimize,weightsFor,buildGraph,PVE_RESEARCH_PRIORS});
})();
