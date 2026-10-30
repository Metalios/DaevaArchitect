// Static GitHub Pages sharing: one class snapshot lives in the URL fragment.
// Recipients explicitly load it so opening a link never silently replaces a save.
(() => {
  let incoming=null;
  const short=(value,max=400)=>String(value??'').slice(0,max);
  const numeric=(value,max)=>clamp(value,0,max);
  const toBase64=bytes=>{
    let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  };
  const fromBase64=value=>{
    if(!/^[A-Za-z0-9_-]+$/.test(value)||value.length>60000)throw Error('Invalid or oversized build link');
    const binary=atob(value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4));
    return Uint8Array.from(binary,char=>char.charCodeAt(0));
  };
  async function encode(payload){
    let bytes=new TextEncoder().encode(JSON.stringify(payload)),format='j';
    if(typeof CompressionStream==='function'){
      bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());format='g';
    }
    return format+toBase64(bytes);
  }
  async function decode(token){
    if(!token||!['g','j'].includes(token[0]))throw Error('Unsupported build link');
    const bytes=fromBase64(token.slice(1));
    const value=token[0]==='g'&&typeof DecompressionStream==='function'?await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text():token[0]==='j'?new TextDecoder().decode(bytes):null;
    if(!value||value.length>250000)throw Error('Unsupported or oversized build data');
    const payload=JSON.parse(value);
    if(payload?.v!==1||!CLASS_ORDER.includes(payload.cls)||!payload.account||typeof payload.account!=='object'||Array.isArray(payload.account))throw Error('Invalid build data');
    return payload;
  }
  function safeAccount(raw,cls){
    const result=DEFAULT_ACCOUNT(cls),validSkills=new Set(Object.values(DATA[cls].skills).map(skill=>skill.name));
    for(const [key,max] of [['mastery',462],['stigma',300],['crystals',570],['azphel',232],['goalTarget',1000000000],['gearCpTarget',1000000000]])if(raw[key]!==undefined)result[key]=numeric(raw[key],max);
    if(PROFILES[cls].kind==='healer'&&raw.goalObserved!==undefined)result.goalObserved=numeric(raw.goalObserved,1000000000);
    result.context=['party','solo','pvp'].includes(raw.context)?raw.context:'party';
    result.pveObjective=['performance','survivability','sustained','burst'].includes(raw.pveObjective)
      ?raw.pveObjective:'performance';
    result.endgameContext=['party','solo','pvp'].includes(raw.endgameContext)?raw.endgameContext:result.context;
    result.levelingContext=['party','solo'].includes(raw.levelingContext)?raw.levelingContext:'solo';
    result.journey=raw.journey==='leveling'?'leveling':'endgame';
    result.faction=raw.faction==='asmodian'?'asmodian':'elyos';
    result.macroBind=['RMB','Mouse 4','MMB','M'].includes(raw.macroBind)?raw.macroBind:'RMB';
    result.boardMode=raw.boardMode==='custom'?'custom':'recommended';
    result.leveling={level:clamp(raw.leveling?.level??1,1,45),extraByLevel:{}};
    for(const [level,extra] of Object.entries(raw.leveling?.extraByLevel||{}))if(/^\d{1,2}$/.test(level)&&Number(level)>=1&&Number(level)<=45&&extra&&typeof extra==='object')result.leveling.extraByLevel[level]={mastery:numeric(extra.mastery,462),stigma:numeric(extra.stigma,300),crystals:numeric(extra.crystals,570)};
    const entries=[...DATA[cls].boards,AZPHEL[cls]].flatMap(board=>board.nodes.map(node=>({id:node[0],board:board.name,node}))),byId=new Map(entries.map(entry=>[entry.id,entry]));
    result.obtainedNodes=[...new Set((Array.isArray(raw.obtainedNodes)?raw.obtainedNodes:[]).map(Number).filter(id=>byId.has(id)))].slice(0,500);
    const safeRoute=(values,azphel)=>{
      const sequence=[],seen=new Set();for(const rawId of (Array.isArray(values)?values:[]).slice(0,500)){
        const id=Number(rawId),entry=byId.get(id);if(!entry||seen.has(id)||entry.node[5]===0||(entry.board==='Azphel')!==azphel)continue;
        const near=entries.some(other=>other.board===entry.board&&(other.node[5]===0||seen.has(other.id))&&Math.abs(other.node[1]-entry.node[1])+Math.abs(other.node[2]-entry.node[2])===1);
        if(near){sequence.push(id);seen.add(id)}
      }return sequence;
    };
    result.customNodes=safeRoute(raw.customNodes,false);result.customAzphelNodes=safeRoute(raw.customAzphelNodes,true);
    for(const [key,max] of [['gear',30],['currentRanks',10]]){result[key]={};for(const [name,value] of Object.entries(raw[key]||{}))if(validSkills.has(name))result[key][name]=clamp(value,key==='gear'?0:1,max)}
    // v2 shared builds preserve real manual allocations, Stigma loadout and
    // Specialty selections. Each field is validated against this class's
    // catalog so crafted URLs cannot install invalid skills or ranks.
    if(raw.manualMastery&&typeof raw.manualMastery==='object'&&!Array.isArray(raw.manualMastery)){
      result.manualMastery={};
      for(const [name,value] of Object.entries(raw.manualMastery))if(validSkills.has(name))result.manualMastery[name]=clamp(value,1,10);
    }
    if(raw.manualStigma&&typeof raw.manualStigma==='object'&&!Array.isArray(raw.manualStigma)){
      result.manualStigma={};
      for(const [name,value] of Object.entries(raw.manualStigma))if(STIGMAS[cls][name])result.manualStigma[name]=clamp(value,0,20);
    }
    if(Array.isArray(raw.customStigmas)&&raw.customStigmas.length===4&&new Set(raw.customStigmas).size===4&&raw.customStigmas.every(name=>typeof name==='string'&&STIGMAS[cls][name]))
      result.customStigmas=[...raw.customStigmas];
    result.customSpecialties={};
    for(const [name,choices] of Object.entries(raw.customSpecialties||{})){
      const options=SPECS[cls]?.[name]?.options;
      if(!validSkills.has(name)||!options||!Array.isArray(choices))continue;
      result.customSpecialties[name]=[...new Set(choices.map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=5&&options[n]))].slice(0,3);
    }
    result.titlesOwned={};for(const [id,owned] of Object.entries(raw.titlesOwned||{}))if(TITLE_BY_ID.has(id)&&owned===true)result.titlesOwned[id]=true;
    result.equipment={};
    for(const slot of GEAR_SLOTS){const item=raw.equipment?.[slot.id];if(!item||typeof item!=='object')continue;
      const type=slot.type==='weapon'?GEAR_WEAPONS[cls]:slot.type,catalog=GEAR_CATALOG_BY_HREF.get(item.href),source=catalog?.type===type?catalog:null,name=short(source?.name||item.name,140).trim();if(!name)continue;
      const grade=source?.grade||'',stoneFamily=gearStoneFamily(slot),socketCount=stoneFamily?clamp(item.manastoneSlots??STONE_SLOTS_BY_GRADE[grade]??0,0,4):0;
      const theostoneAllowed=['weapon','guard'].includes(slot.id)&&(['Epic','Unique'].includes(grade)||!source);
      const legacyType=(Array.isArray(item.stones)?item.stones:[]).find(stone=>STONE_KINDS.includes(stone?.kind))?.kind||'';
      result.equipment[slot.id]={name,type,href:source?.href||'',icon:source?.icon||'',grade,faction:source?.faction||'',fixedStats:source?.fixedStats||[],baseStats:(Array.isArray(item.baseStats)?item.baseStats:[]).slice(0,12).map(line=>short(line,140)),requiredLevel:source?.requiredLevel||clamp(item.requiredLevel||0,0,45)||null,itemLevel:source?.itemLevel||clamp(item.itemLevel||0,0,999)||null,enhancement:numeric(item.enhancement,30),manastoneSlots:socketCount,theostoneSlots:theostoneAllowed?1:0,theostone:theostoneAllowed?short(item.theostone,100):'',stoneType:STONE_KINDS.includes(item.stoneType)?item.stoneType:legacyType,stones:(Array.isArray(item.stones)?item.stones:[]).slice(0,socketCount).map(stone=>({stat:short(stone?.stat,80),value:stone?.value===null||stone?.value===undefined?null:clamp(stone.value,-1000000,1000000),unit:stone?.unit==='%'?'%':'',grade:STONE_LINE_GRADES.some(([name])=>name===stone?.grade)?stone.grade:''})),statNotes:short(item.statNotes,500),notes:short(item.notes,500),skillBonuses:(Array.isArray(item.skillBonuses)?item.skillBonuses:[]).slice(0,3).filter(bonus=>validSkills.has(bonus?.skill)).map(bonus=>({skill:bonus.skill,levels:clamp(bonus.levels,0,30)}))};
    }
    return result;
  }
  function clearSharedFragment(){if(location.hash.startsWith('#build='))history.replaceState(null,'',location.pathname+location.search)}
  async function inspectSharedFragment(){
    const token=new URLSearchParams(location.hash.slice(1)).get('build');if(!token)return;
    try{incoming=await decode(token);$('shared-build-title').textContent=`${PROFILES[incoming.cls].name} · ${incoming.account.journey==='leveling'?'leveling':'level 45'} build`;$('shared-build-description').textContent=`Load this shared snapshot to view it. This replaces the ${PROFILES[incoming.cls].name} build saved in this browser; other classes stay untouched.`;$('shared-build-load').hidden=false}
    catch(_){incoming=null;$('shared-build-title').textContent='This build link could not be read';$('shared-build-description').textContent='The link may be incomplete or from an incompatible planner version.';$('shared-build-load').hidden=true}
    $('shared-build-banner').hidden=false;
  }
  $('share-build-button').addEventListener('click',async()=>{
    const sharedAccount={...account()};delete sharedAccount.cpAnchor;
    const payload={v:1,cls:state.class,account:sharedAccount,tab:state.tab,board:state.board,theme,gearView:state.gearView};
    try{const token=await encode(payload),url=new URL(location.href);url.hash=`build=${token}`;$('share-url').value=url.href;$('share-status').textContent=url.href.length>12000?'Link created, but it is long because this browser lacks compression. Some apps may shorten it.':'Link ready to copy.';$('share-dialog').showModal();$('share-url').select()}
    catch(_){$('share-status').textContent='Could not create a link for this build.';$('share-dialog').showModal()}
  });
  $('share-dialog-close').addEventListener('click',()=>$('share-dialog').close());
  $('share-copy-button').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('share-url').value);$('share-status').textContent='Build link copied.'}catch(_){$('share-url').select();$('share-status').textContent='Select and copy the link from the field.'}});
  $('shared-build-load').addEventListener('click',()=>{if(!incoming)return;const cls=incoming.cls;state.class=cls;state.accounts[cls]=safeAccount(incoming.account,cls);state.gearView=['inventory','inspect'].includes(incoming.gearView)?incoming.gearView:null;state.tab=['overview','gear','boards','mastery','stigma','rotation','titles','sources'].includes(incoming.tab)?incoming.tab:'overview';state.board=ALL_BOARD_NAMES.includes(incoming.board)?incoming.board:'Nezekan';theme=['aether','sanctum','abyss'].includes(incoming.theme)?incoming.theme:'aether';try{localStorage.setItem('daeva-architect-theme',theme)}catch(_){}if(!boardOpen(state.board))state.board='Nezekan';state.preview=state.board==='Azphel'?account().azphel||0:budget('crystals');state.node=null;$('shared-build-banner').hidden=true;incoming=null;clearSharedFragment();render();document.querySelector('.tabs')?.scrollIntoView({behavior:'smooth',block:'start'})});
  $('shared-build-dismiss').addEventListener('click',()=>{incoming=null;$('shared-build-banner').hidden=true;clearSharedFragment()});
  window.addEventListener('hashchange',inspectSharedFragment);
  inspectSharedFragment();
})();
