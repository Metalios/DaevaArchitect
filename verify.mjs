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
  console.log(`${slug}: 22 skills, 4 stigmas, ${d.route.length} connected purchases, 570 crystals`);
}
