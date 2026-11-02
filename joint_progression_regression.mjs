// Verify joint progression legality for all eight Global classes, boards,
// Macro skill eligibility and all four PvP contexts. Scores here are
// illustrative unit fixtures, not measured in-game DPS or HPS.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const DATA=JSON.parse(read('classes_data.json'));
const STIGMAS=JSON.parse(read('stigmas.json'));
const AZPHEL=JSON.parse(read('azphel_data.json'));
const ctx=vm.createContext({});
vm.runInContext(read('js/engine/global_actions.js')+'\n'+
  read('js/optimizer/joint.js')+'\nglobalThis.api={JointProgression,GlobalActionData};',ctx);
const {JointProgression:joint,GlobalActionData:actions}=ctx.api;
const ARIEL=vm.runInNewContext(read('js/ariel_data.js')+'\nARIEL');
const masterCost=n=>n<=4?1:n<=7?2:4;
const stigmaCost=n=>n<=5?1:n<=10?2:n<=15?4:8;
const ctxs=['party','solo','pvp','pvp-arena','pvp-abyss-solo','pvp-abyss-group'];
let boards=0,builds=0;
for(const [cls,datum] of Object.entries(DATA)){
  const skills=Object.values(datum.skills).map(s=>s.name);
  assert.equal(skills.length,22);
  const stigmas=Object.keys(STIGMAS[cls]).slice(0,4);
  const base=Object.fromEntries(skills.map(s=>[s,1]));
  const zero=Object.fromEntries(stigmas.map(s=>[s,0]));
  const score=(m,s)=>skills.slice(0,9).reduce((x,k,i)=>
    x+(m[k]||1)*(10-i),0)+stigmas.reduce((x,k,i)=>
      x+(s[k]||0)*(5-i),0);
  for(const mode of ctxs){
    const initial={...base,[skills[21]]:4,[skills[20]]:4};
    const masterySpent=joint.spend(initial,skills,masterCost,1);
    const candidate=joint.optimizeCombined({
      classId:cls,context:mode,objective:'performance',
      mastery:{levels:initial,spent:masterySpent},
      stigma:{levels:zero,spent:0},masteryNames:skills,stigmaNames:stigmas,
      masteryBudget:90,stigmaBudget:61,
      masteryCost:masterCost,stigmaCost,masteryCap:()=>10,
      scoreBuild:score
    });
    assert(candidate.scoreAfter>=candidate.scoreBefore-1e-8,
      cls+' '+mode+' joint candidate degraded its score');
    assert(candidate.mastery.spent<=90&&candidate.stigma.spent<=61);
    assert.equal(joint.spend(candidate.mastery.levels,skills,masterCost,1),
      candidate.mastery.spent);
    assert.equal(joint.spend(candidate.stigma.levels,stigmas,stigmaCost,0),
      candidate.stigma.spent);
    assert(skills.every(k=>Number.isInteger(candidate.mastery.levels[k])&&
      candidate.mastery.levels[k]>=1&&candidate.mastery.levels[k]<=10));
    assert(stigmas.every(k=>Number.isInteger(candidate.stigma.levels[k])&&
      candidate.stigma.levels[k]>=0&&candidate.stigma.levels[k]<=20));
    const pinned=joint.optimizeCombined({
      classId:cls,context:mode,objective:'performance',
      mastery:{levels:initial,spent:masterySpent},
      stigma:{levels:zero,spent:0},masteryNames:skills,stigmaNames:stigmas,
      masteryBudget:90,stigmaBudget:61,
      masteryCost:masterCost,stigmaCost,masteryCap:()=>10,
      scoreBuild:score,pinMastery:true,pinStigma:true
    });
    assert.equal(JSON.stringify(pinned.mastery.levels),JSON.stringify(initial));
    assert.equal(JSON.stringify(pinned.stigma.levels),JSON.stringify(zero));
    builds++;
  }
  for(const board of [ARIEL[cls],AZPHEL[cls]]){
    for(const mode of ctxs){
      const route=joint.rankConnectedBoard({
        board,context:mode,objective:mode==='party'?'survivability':'performance',
        role:cls==='cleric'?'healer':'damage',stats:datum.stats
      });
      assert.equal(route.length,board.nodes.length-1);
      const byId=new Map(board.nodes.map(n=>[n[0],n]));
      const visited=new Set(board.nodes.filter(n=>n[5]===0).map(n=>n[0]));
      let cost=0;
      for(const selected of route){
        const n=byId.get(selected.id);
        assert(n&&selected.board===board.name&&!visited.has(selected.id));
        assert(board.nodes.some(other=>visited.has(other[0])&&
          Math.abs(other[1]-n[1])+Math.abs(other[2]-n[2])===1),
          cls+' '+board.name+' disconnected node '+selected.id);
        visited.add(selected.id);cost+=n[5];
      }
      assert.equal(cost,board.totalCost);
      boards++;
    }
  }
  // Only actual learned abilities can enter the recommended automatic stacks.
  const regular=skills.slice(0,12);
  const macro=joint.adviseMacro({
    classId:cls,context:'party',objective:'performance',
    profile:{stacks:[{key:'Q',skills:[...regular,'Unknown']},
      {key:'E',skills:regular.slice(0,3),manual:true}],
      hotbar:[[['Defiance'],'Defensive skill','defense']]},
    available:regular,stigma:[],levels:Object.fromEntries(regular.map(n=>[n,8]))
  });
  assert(!macro.stacks.some(x=>x.skills.includes('Unknown')));
  assert(macro.stacks.every(x=>x.skills.every(s=>regular.includes(s))));
  assert(macro.coverage.every(x=>x.seconds===null||
    x.seconds===actions.lookup(cls,x.name)));
}
{
  const names=['A','B'],levels={A:5,B:2};
  const pinned=joint.improveRanks({names,initial:levels,budget:30,cost:()=>1,
    cap:10,score:m=>m.B*50+m.A,pinned:['A']});
  assert.equal(pinned.levels.A,5);
  assert(pinned.levels.B>=2);
}
console.log('Checked '+builds+' all-class context builds and '+boards+
  ' full connected Ariel/Azphel routes with legal Mastery, Stigma and macro constraints.');
