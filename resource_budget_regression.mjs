// Regression for affordable unspent resources. Earned budgets are not
// synonymous with manual allocations: only recommended builds auto-spend.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const classes=JSON.parse(read('classes_data.json'));
const routes=JSON.parse(read('context_routes.json'));
const source=read('js/board_optimizer.js');
const context=vm.createContext({});
vm.runInContext(source+'\nglobalThis.fund=fundConnectedBoardRoute;',context);
let cases=0;
for(const [cls,data] of Object.entries(classes))
 for(const mode of ['solo','party'])
  for(const budget of [0,1,2,3,4,57,100,104,136,218,285,327,400,570]){
    const original=routes[cls][mode];
    const before=original.map(x=>x.id);
    const first=context.fund(data,original,budget);
    const costById=new Map(data.boards.flatMap(b=>b.nodes.map(n=>[n[0],n[5]])));
    const coords=new Map(data.boards.flatMap(b=>b.nodes.map(n=>[n[0],[b.name,n[1],n[2]]])));
    const connected=new Set(data.boards.flatMap(b=>b.nodes.filter(n=>n[5]===0).map(n=>n[0])));
    let spent=0;
    for(const entry of first.route){
      const cost=costById.get(entry.id);
      if(spent+cost>budget)break;
      const pos=coords.get(entry.id),near=[...connected].some(id=>{
        const near=coords.get(id);
        return near[0]===pos[0]&&Math.abs(near[1]-pos[1])+Math.abs(near[2]-pos[2])===1;
      });
      assert(near,cls+' '+mode+' '+budget+': disconnected selected node '+entry.id);
      connected.add(entry.id);spent+=cost;
    }
    assert.equal(spent,first.spent);
    assert.equal(first.remaining,budget-spent);
    assert.equal(new Set(first.route.map(x=>x.id)).size,before.length,'route contains duplicate');
    assert.deepEqual([...first.route].map(x=>x.id).sort(),before.sort(),'route lost original tiles');
    assert.equal(spent,Math.min(budget,570),cls+' '+mode+' '+budget+' should fund all affordable crystals');
    const second=context.fund(data,first.route,budget+1);
    assert.equal(second.spent,Math.min(budget+1,570));
    cases++;
  }
// A costly next recommended tile must not block a cheap, connected branch.
const synthetic={boards:[{name:'Nezekan',nodes:[
 [0,0,0,0,0,0,[]],[1,0,1,0,0,4,[]],
 [2,1,0,0,0,1,[]],[3,2,0,0,0,1,[]]]}]};
const packed=context.fund(synthetic,[1,2,3].map(id=>({board:'Nezekan',id})),2);
assert.equal(packed.spent,2);
assert.deepEqual(Array.from(packed.route.slice(0,2).map(x=>x.id)),[2,3]);
console.log('Validated '+cases+' all-class connected Daevanion budget completions, stable full route membership and cheap-tile bypass.');
