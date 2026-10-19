import fs from 'node:fs';
import vm from 'node:vm';

const root = new URL('.', import.meta.url);
const data = JSON.parse(fs.readFileSync(new URL('classes_data.json', root), 'utf8'));
const specs = JSON.parse(fs.readFileSync(new URL('specialties.json', root), 'utf8'));
const stigmas = JSON.parse(fs.readFileSync(new URL('stigmas.json', root), 'utf8'));
const profiles = vm.runInNewContext(fs.readFileSync(new URL('profiles.js', root), 'utf8')+'\nPROFILES');
const titles = vm.runInNewContext(fs.readFileSync(new URL('titles.js', root), 'utf8')+'\nTITLES');
const catalog = JSON.parse(fs.readFileSync(new URL('titles_catalog.json', root), 'utf8'));
const routes = JSON.parse(fs.readFileSync(new URL('context_routes.json', root), 'utf8'));
const azphel = JSON.parse(fs.readFileSync(new URL('azphel_data.json', root), 'utf8'));
const unlocks = JSON.parse(fs.readFileSync(new URL('skill_unlocks.json', root), 'utf8'));
const rewards = JSON.parse(fs.readFileSync(new URL('level_rewards.json', root), 'utf8'));
const classes = ['templar','gladiator','assassin','ranger','sorcerer','spiritmaster','cleric','chanter'];
const assert = (okay, message) => {if(!okay) throw new Error(message)};
assert(Object.keys(rewards).length===45,'leveling: expected rewards for every level');
for(let level=1;level<=45;level++){
  const row=rewards[level],prior=rewards[level-1]||{mastery:0,stigma:0,slots:0,crystals:0};
  assert(row&&['mastery','stigma','slots','crystals'].every(key=>Number.isInteger(row[key])&&row[key]>=prior[key]),`leveling: invalid reward row ${level}`);
}
assert(JSON.stringify(rewards[45])===JSON.stringify({mastery:203,stigma:29,slots:4,crystals:136}),'leveling: fresh 45 totals changed');
assert([22,27,32,37].every((level,index)=>rewards[level].slots===index+1&&rewards[level-1].slots===index),'leveling: stigma gates changed');

for(const slug of classes){
  const d=data[slug],p=profiles[slug],names=new Set(Object.values(d.skills).map(s=>s.name));
  assert(d&&p,`${slug}: missing data`);
  assert(d.boards.length===4&&Object.keys(d.skills).length===22,`${slug}: incomplete class tables`);
  assert(Object.keys(unlocks[slug]||{}).length===22,`${slug}: expected 22 skill unlock levels`);
  for(const name of names)assert(Number.isInteger(unlocks[slug][name])&&unlocks[slug][name]>=1&&unlocks[slug][name]<=45,`${slug}: invalid ${name} unlock level`);
  assert(typeof p.weave==='string'&&p.weave.length>0,`${slug}: missing held weave skill`);
  assert(names.has(p.weave),`${slug}: held weave skill is absent from the class data`);
  assert(!p.stacks.some(s=>s.key==='RMB'),`${slug}: right mouse must be free for the default Macro bind`);
  assert(!p.macro.some(key=>key==='RMB'||key==='LMB'),`${slug}: do not put the Macro bind or held weave key in Macro steps`);
  for(const key of p.macro) assert(p.stacks.some(s=>s.key===key&&!s.manual),`${slug}: Macro key ${key} has no automatic skill stack`);
  for(const stack of p.stacks) assert(stack.skills.length>0&&stack.skills.length<=4,`${slug}: invalid ${stack.key} stack`);
  assert(p.hotbar.length===8,`${slug}: expected a complete 1–8 hotbar`);
  const available=new Set([...Object.values(d.skills).slice(0,12).map(s=>s.name),...p.stigmas]);
  const automatic=new Set(p.stacks.filter(s=>!s.manual).flatMap(s=>s.skills));
  for(const [index,[skills,cue,tone]] of p.hotbar.entries()){
    assert(skills.length<=4&&typeof cue==='string'&&cue.length>0,`${slug}: incomplete key ${index+1}`);
    if(!skills.length)assert(index===7&&['sorcerer','spiritmaster'].includes(slug),`${slug}: unexpected empty key ${index+1}`);
    assert(['attack','buff','heal','defense','movement','utility','emergency'].includes(tone),`${slug}: invalid key ${index+1} role`);
    for(const skill of skills){
      assert(available.has(skill),`${slug}: key ${index+1} uses unavailable ${skill}`);
      assert(skill!=='Defiance'&&!automatic.has(skill),`${slug}: key ${index+1} duplicates automatic or Space-bound ${skill}`);
    }
    const stack=p.stacks.find(s=>s.key===String(index+1));
    if(stack)assert(stack.manual&&JSON.stringify(stack.skills)===JSON.stringify(skills),`${slug}: key ${index+1} disagrees with its manual stack`);
  }
  assert(p.manual.some(x=>x.includes('Defiance (Space)')),`${slug}: default Space Defiance bind is missing`);
  if(slug==='templar'){
    assert(JSON.stringify(p.macro)===JSON.stringify(['Q','E']),'templar: macro step order should be Q then E');
    assert(JSON.stringify(p.stacks.find(s=>s.key==='E').skills)===JSON.stringify(['Judgment','Shield Smite','Warding Strike','Pummel']),'templar: Judgment stack must include last-row Pummel');
    assert(JSON.stringify(p.stacks.find(s=>s.key==='Q').skills)===JSON.stringify(['Annihilate','Debilitating Smash']),'templar: Q must not steal Pummel casts from Judgment');
  }
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
  function checkRoute(boards,route,expected,mode){
    const boardMap=Object.fromEntries(boards.map(b=>[b.name,b]));
    const seen=Object.fromEntries(boards.map(b=>[b.name,new Set(b.nodes.filter(n=>n[5]===0).map(n=>n[0]))]));
    const at=Object.fromEntries(boards.map(b=>[b.name,new Map(b.nodes.map(n=>[`${n[1]}:${n[2]}`,n]))]));
    const byId=Object.fromEntries(boards.map(b=>[b.name,new Map(b.nodes.map(n=>[n[0],n]))]));
    let total=0;
    for(const [index,item] of route.entries()){
      const n=byId[item.board]?.get(item.id);
      assert(n&&!seen[item.board].has(item.id),`${slug} ${mode}: invalid node ${index+1}`);
      assert([[n[1]-1,n[2]],[n[1]+1,n[2]],[n[1],n[2]-1],[n[1],n[2]+1]].some(([r,c])=>{const adj=at[item.board].get(`${r}:${c}`);return adj&&seen[item.board].has(adj[0])}),`${slug} ${mode}: disconnected node ${index+1}`);
      seen[item.board].add(item.id);total+=n[5];
    }
    assert(total===expected,`${slug} ${mode}: route cost ${total}`);
    assert(route.length===Object.values(boardMap).reduce((n,b)=>n+b.nodes.filter(x=>x[5]>0).length,0),`${slug} ${mode}: incomplete route`);
  }
  for(const mode of ['party','solo','pvp'])checkRoute(d.boards,routes[slug][mode],570,mode);
  if(slug==='templar')assert(JSON.stringify(routes[slug].party)===JSON.stringify(d.route),'templar: Group route must preserve screenshot-reviewed hybrid');
  assert(azphel[slug].name==='Azphel'&&azphel[slug].totalCost===232,`${slug}: missing Azphel`);
  checkRoute([azphel[slug]],routes[slug].azphel,232,'Azphel');
  assert(JSON.stringify(routes[slug].party.slice(0,100))!==JSON.stringify(routes[slug].solo.slice(0,100)),`${slug}: group/solo route unchanged`);
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
    const spentByBoard=Object.fromEntries(['Nezekan','Zikel','Vaizel','Triniel'].map(name=>[name,0]));
    let totalAtStep=0;const nextAfter218=[];
    for(const item of d.route){const node=nodes[item.board].get(item.id);totalAtStep+=node[5];if(totalAtStep<=218)spentByBoard[item.board]+=node[5];else if(nextAfter218.length<8)nextAfter218.push([item.board,totalAtStep]);}
    assert(JSON.stringify(spentByBoard)===JSON.stringify({Nezekan:67,Zikel:77,Vaizel:30,Triniel:44}),'templar: 218-crystal route must span all four boards');
    assert(nextAfter218[0][0]==='Vaizel'&&nextAfter218[0][1]===219&&nextAfter218[7][0]==='Nezekan'&&nextAfter218[7][1]===233,'templar: cross-board continuation at 218 is wrong');
    assert(bonuses['Insulting Roar']===4,'templar: board bonus for Insulting Roar should be +4 at 218 crystals');
    assert(bonuses['Impact Hit']===3,'templar: board bonus for Impact Hit should be +3 at 218 crystals');
    assert(byBoard.Nezekan.CombatSpeed===300&&byBoard.Nezekan.CoolTimeDecrease===300,'templar: Nezekan route disagrees with game screenshot');
    assert(byBoard.Zikel['Insulting Roar']===2&&byBoard.Zikel.Fury===2&&byBoard.Zikel.DecreaseDamage===300,'templar: Zikel route disagrees with game screenshot');
    assert(byBoard.Vaizel['Impact Hit']===1&&byBoard.Vaizel.HPMax===100,'templar: Vaizel route disagrees with game screenshot');
    assert(byBoard.Triniel.AdditionalHitRate===300&&byBoard.Triniel['Insulting Roar']===1,'templar: Triniel route disagrees with game screenshot');
  }
  console.log(`${slug}: 22 skills, 4 stigmas, ${d.route.length} connected purchases, 570 crystals`);
}
assert(titles.length===12&&new Set(titles.map(t=>t.id)).size===titles.length,'titles: expected 12 unique curated titles');
for(const t of titles){
  assert(['Attack','Defense','Other'].includes(t.slot),`titles: invalid slot for ${t.id}`);
  assert(typeof t.equip==='string'&&typeof t.owned==='string'&&typeof t.earn==='string'&&t.url.startsWith('https://'),`titles: incomplete ${t.id}`);
  assert(typeof t.name==='string'||t.name.elyos&&t.name.asmodian,`titles: missing faction variant for ${t.id}`);
}
console.log('titles: 12 curated, faction-aware progression entries');
assert(catalog.length===528&&new Set(catalog.map(t=>t.id)).size===528,'titles: incomplete or duplicate Global catalog');
for(const t of titles)for(const name of typeof t.name==='string'?[t.name]:Object.values(t.name))assert(catalog.some(x=>x.name===name),`titles: curated ${name} missing from catalog`);
console.log('titles: 528 searchable Global catalog entries');
