import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('.', import.meta.url);
const data = JSON.parse(fs.readFileSync(new URL('classes_data.json', root), 'utf8'));
const specs = JSON.parse(fs.readFileSync(new URL('specialties.json', root), 'utf8'));
const stigmas = JSON.parse(fs.readFileSync(new URL('stigmas.json', root), 'utf8'));
const profiles = vm.runInNewContext(fs.readFileSync(new URL('profiles.js', root), 'utf8')+'\nPROFILES');
const classes = ['templar','gladiator','assassin','ranger','sorcerer','spiritmaster','cleric','chanter'];
const assert = (okay, message) => {if(!okay) throw new Error(message)};

for(const slug of classes){
  const d=data[slug],p=profiles[slug],names=new Set(Object.values(d.skills).map(s=>s.name));
  assert(d&&p,`${slug}: missing data`);
  assert(d.boards.length===4&&Object.keys(d.skills).length===22,`${slug}: incomplete class tables`);
  assert(typeof p.weave==='string'&&p.weave.length>0,`${slug}: missing held weave skill`);
  assert(names.has(p.weave),`${slug}: held weave skill is absent from the class data`);
  assert(!p.stacks.some(s=>s.key==='RMB'),`${slug}: right mouse must be free for the default Macro bind`);
  assert(!p.macro.some(key=>key==='RMB'||key==='LMB'),`${slug}: do not put the Macro bind or held weave key in Macro steps`);
  for(const key of p.macro) assert(p.stacks.some(s=>s.key===key&&!s.manual),`${slug}: Macro key ${key} has no automatic skill stack`);
  for(const stack of p.stacks) assert(stack.skills.length>0&&stack.skills.length<=4,`${slug}: invalid ${stack.key} stack`);
  assert(p.stigmas.length===4&&new Set(p.stigmas).size===4,`${slug}: stigma slots`);
  for(const name of p.stigmas) assert(stigmas[slug][name],`${slug}: missing stigma ${name}`);
  for(const name of Object.keys(specs[slug])) assert(names.has(name),`${slug}: unknown specialty skill ${name}`);
  for(const [name,spec] of Object.entries(specs[slug])){
    for(const [level,picks] of Object.entries(spec.picks)){
      const unlocked=Number(level)>=20?3:Number(level)>=12?2:1;
      assert(picks.length<=unlocked,`${slug}: too many ${name} picks at ${level}`);
      for(const pick of picks) assert(spec.options[pick]&&pick<=(Number(level)>=16?5:Number(level)>=12?4:3),`${slug}: locked ${name} option ${pick} at ${level}`);
    }
  }
  const boards=Object.fromEntries(d.boards.map(b=>[b.name,b]));
  const owned=Object.fromEntries(d.boards.map(b=>[b.name,new Set(b.nodes.filter(n=>n[5]===0).map(n=>n[0]))]));
  const positions=Object.fromEntries(d.boards.map(b=>[b.name,new Map(b.nodes.map(n=>[`${n[1]}:${n[2]}`,n]))]));
  const nodes=Object.fromEntries(d.boards.map(b=>[b.name,new Map(b.nodes.map(n=>[n[0],n]))]));
  let cost=0;
  for(const [i,item] of d.route.entries()){
    const n=nodes[item.board]?.get(item.id);
    assert(n&&!owned[item.board].has(item.id),`${slug}: invalid route step ${i+1}`);
    const neighbors=[[n[1]-1,n[2]],[n[1]+1,n[2]],[n[1],n[2]-1],[n[1],n[2]+1]];
    assert(neighbors.some(([r,c])=>{const adjacent=positions[item.board].get(`${r}:${c}`);return adjacent&&owned[item.board].has(adjacent[0])}),`${slug}: disconnected step ${i+1}`);
    owned[item.board].add(item.id);cost+=n[5];
  }
  assert(cost===570,`${slug}: board cost ${cost}`);
  if(slug==='templar'){
    let spent=0;
    const bonuses={},byBoard={};
    for(const item of d.route){
      const node=nodes[item.board].get(item.id);
      if(spent+node[5]>218) break;
      spent+=node[5];
      const board=byBoard[item.board] ||= {};
      for(const [key,value] of node[6]){
        const name=typeof key==='number'?d.skills[key].name:key;
        board[name]=(board[name]||0)+value;
        if(typeof key==='number')bonuses[name]=(bonuses[name]||0)+value;
      }
    }
    assert(spent===218,'templar: 218-crystal route does not spend full budget');
    assert(bonuses['Insulting Roar']===4,'templar: board bonus for Insulting Roar should be +4 at 218 crystals');
    assert(bonuses['Impact Hit']===3,'templar: board bonus for Impact Hit should be +3 at 218 crystals');
    assert(byBoard.Nezekan.CombatSpeed===300&&byBoard.Nezekan.CoolTimeDecrease===300,'templar: Nezekan route disagrees with game screenshot');
    assert(byBoard.Zikel['Insulting Roar']===2&&byBoard.Zikel.Fury===2&&byBoard.Zikel.DecreaseDamage===300,'templar: Zikel route disagrees with game screenshot');
    assert(byBoard.Vaizel['Impact Hit']===1&&byBoard.Vaizel.HPMax===100,'templar: Vaizel route disagrees with game screenshot');
    assert(byBoard.Triniel.AdditionalHitRate===300&&byBoard.Triniel['Insulting Roar']===1,'templar: Triniel route disagrees with game screenshot');
  }
  console.log(`${slug}: 22 skills, 4 stigmas, ${d.route.length} connected purchases, 570 crystals`);
}
