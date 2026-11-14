// DaevaArchitect local-first, multi-build progression library.
// No account, network service or external script is required.
const DaevaBuildLibrary = (() => {
  'use strict';
  const STORAGE_KEY = 'daeva-architect-build-library-v1';
  const MAX_BUILDS = 40;
  const MAX_STAGES = 24;
  const MAX_IMPORT_BYTES = 3 * 1024 * 1024;
  const MAX_NAME = 90;
  const CONTEXTS = Object.freeze({
    party:'Group PvE',solo:'Solo PvE',pvp:'General PvP',
    'pvp-arena':'Arena', 'pvp-abyss-solo':'Solo Abyss PvP',
    'pvp-abyss-group':'Group Abyss PvP'
  });
  const clone = value => JSON.parse(JSON.stringify(value));
  const cleanText = (value,limit=MAX_NAME) => String(value ?? '').trim().slice(0,limit);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,character =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const now = () => Date.now();
  let sequence = 0;
  const uniqueId = () => typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID() : `local-${now()}-${++sequence}`;
  const empty = () => ({version:1,builds:[],activeByClass:{}});
  let data = empty();
  let isRestoring = false;
  let suppressSync = false;
  let dialog;
  let alertRegion;

  function read() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (stored?.version === 1 && Array.isArray(stored.builds) &&
          stored.builds.length <= MAX_BUILDS && stored.activeByClass &&
          typeof stored.activeByClass === 'object') {
        data = stored;
        return;
      }
    } catch (_) { /* Invalid or unavailable browser storage starts empty. */ }
    data = empty();
  }
  function report(message,problem=false) {
    if (!alertRegion) return;
    alertRegion.textContent = message;
    alertRegion.dataset.problem = String(problem);
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
      return true;
    } catch (_) {
      report('Could not save this library in browser storage. Export your builds to JSON and free storage before continuing.',true);
      return false;
    }
  }
  function findBuild(id) { return data.builds.find(build=>build.id===id) || null; }
  function findStage(build,id) { return build?.stages.find(stage=>stage.id===id) || null; }
  function activeFor(cls) {
    const entry = data.activeByClass[cls];
    const build = findBuild(entry?.buildId);
    const stage = findStage(build,entry?.stageId);
    return build && build.cls===cls && stage ? {build,stage} : null;
  }
  function capture(cls) {
    if (!CLASS_ORDER.includes(cls)) throw Error('Select a class first.');
    const original = state.accounts[cls] || DEFAULT_ACCOUNT(cls);
    const saved = clone(original);
    // A suggested plan must be frozen as actual editable values when stored
    // in the library, never kept attached to a live optimizer projection.
    if (cls===state.class && saved.buildMode==='recommended') {
      suppressSync = true;
      try {
        const suggestion = previewRecommendedBuild();
        Object.assign(saved,{
          manualMastery:suggestion.mastery,manualStigma:suggestion.stigma,
          customStigmas:suggestion.stigmas,customSpecialties:suggestion.specialties,
          customNodes:suggestion.customNodes,
          customAzphelNodes:suggestion.customAzphelNodes,
          customArielNodes:suggestion.customArielNodes
        });
      } finally { suppressSync = false; }
    }
    saved.buildMode='custom';
    saved.boardMode='custom';
    delete saved.cpAnchor;
    delete saved.recommendedRouteSnapshot;
    delete saved.gearCombatPower;
    return saved;
  }
  function syncActive() {
    if (suppressSync || isRestoring || !CLASS_ORDER.includes(state.class)) return;
    const linked = activeFor(state.class);
    if (!linked || state.accounts[state.class]?.buildMode!=='custom') return;
    linked.stage.account = capture(state.class);
    linked.stage.updatedAt = now();
    linked.build.updatedAt = linked.stage.updatedAt;
    persist();
    updateTrigger();
  }
  function detach(cls=state.class) {
    if (!CLASS_ORDER.includes(cls)) return;
    delete data.activeByClass[cls];
    persist();
    updateTrigger();
  }
  function requireClass() {
    if (!CLASS_ORDER.includes(state.class)) throw Error('Choose a class first.');
    return state.class;
  }
  function addBuild(name,{blank=false}={}) {
    const cls = requireClass();
    if (data.builds.length>=MAX_BUILDS) throw Error(`Maximum of ${MAX_BUILDS} saved builds. Export or delete one first.`);
    const label = cleanText(name);
    if (!label) throw Error('Enter a build name.');
    syncActive();
    const account = blank ? clone(DEFAULT_ACCOUNT(cls)) : capture(cls);
    const timestamp = now();
    const stage = {id:uniqueId(),name:blank?'Blank setup':'Current setup',
      notes:'',targetGearRating:null,account,createdAt:timestamp,updatedAt:timestamp};
    const build={id:uniqueId(),cls,name:label,description:'',
      stages:[stage],createdAt:timestamp,updatedAt:timestamp};
    data.builds.unshift(build);
    if (!persist()) {
      data.builds.shift();
      throw Error('Storage quota exceeded; export existing builds before creating more.');
    }
    load(build.id,stage.id);
    return build;
  }
  function load(buildId,stageId) {
    const build=findBuild(buildId),stage=findStage(build,stageId);
    if (!build || !stage) throw Error('Build stage was not found.');
    if (!CLASS_ORDER.includes(build.cls)) throw Error('Unsupported build class.');
    syncActive();
    isRestoring=true;
    try {
      data.activeByClass[build.cls]={buildId,stageId};
      state.class=build.cls;
      state.accounts[build.cls]=clone(stage.account);
      state.accounts[build.cls].buildMode='custom';
      state.accounts[build.cls].boardMode='custom';
      state.tab='overview';
      state.board='Nezekan';
      state.node=null;
      if(typeof liveRoute!=='undefined')liveRoute=null;
      if(typeof liveRouteKey!=='undefined')liveRouteKey='';
      if(typeof liveRouteBasis!=='undefined')liveRouteBasis=null;
      persist();
      render();
    } finally { isRestoring=false; }
    updateTrigger();
    report(`Loaded ${build.name} · ${stage.name}. All sections are editable and automatically saved to this stage.`);
    return stage;
  }
  function addStage(buildId,name,{sourceStageId=null}={}) {
    const build=findBuild(buildId);
    if (!build) throw Error('Build does not exist.');
    if(build.stages.length>=MAX_STAGES) throw Error(`Maximum ${MAX_STAGES} stages per build.`);
    const label=cleanText(name);
    if(!label) throw Error('Enter a stage name.');
    syncActive();
    const source=sourceStageId?findStage(build,sourceStageId)?.account:
      build.cls===state.class?capture(build.cls):build.stages[build.stages.length-1]?.account;
    if(!source)throw Error('No source stage available.');
    const time=now(),stage={id:uniqueId(),name:label,notes:'',targetGearRating:null,
      account:clone(source),createdAt:time,updatedAt:time};
    build.stages.push(stage);build.updatedAt=time;
    if(!persist()) {
      build.stages.pop();throw Error('Could not save this stage. Export to JSON to free space.');
    }
    load(build.id,stage.id);
    return stage;
  }
  function duplicateBuild(buildId) {
    const existing=findBuild(buildId);
    if(!existing)throw Error('Build not found.');
    if(data.builds.length>=MAX_BUILDS)throw Error('Maximum saved builds reached.');
    syncActive();
    const time=now(),copied={...clone(existing),id:uniqueId(),
      name:cleanText(`${existing.name} (Copy)`),createdAt:time,updatedAt:time,
      stages:existing.stages.map(stage=>({...clone(stage),id:uniqueId(),
        createdAt:time,updatedAt:time}))};
    data.builds.unshift(copied);
    if(!persist()){data.builds.shift();throw Error('Storage is full.');}
    return copied;
  }
  function renameBuild(buildId,newName) {
    const build=findBuild(buildId),label=cleanText(newName);
    if(!build || !label)throw Error('Enter a valid name.');
    build.name=label;build.updatedAt=now();persist();
  }
  function renameStage(buildId,stageId,newName) {
    const build=findBuild(buildId),stage=findStage(build,stageId),label=cleanText(newName);
    if(!stage || !label)throw Error('Enter a valid stage name.');
    stage.name=label;stage.updatedAt=now();build.updatedAt=stage.updatedAt;persist();
  }
  function removeBuild(buildId) {
    const index=data.builds.findIndex(build=>build.id===buildId);
    if(index<0)throw Error('Build does not exist.');
    const [removed]=data.builds.splice(index,1);
    for(const [cls,reference] of Object.entries(data.activeByClass))
      if(reference.buildId===removed.id)delete data.activeByClass[cls];
    persist();updateTrigger();
  }
  function removeStage(buildId,stageId) {
    const build=findBuild(buildId);
    if(!build || build.stages.length<=1)throw Error('Keep at least one stage per build.');
    const index=build.stages.findIndex(stage=>stage.id===stageId);
    if(index<0)throw Error('Stage not found.');
    build.stages.splice(index,1);
    const linked=data.activeByClass[build.cls];
    if(linked?.buildId===buildId && linked.stageId===stageId)
      delete data.activeByClass[build.cls];
    build.updatedAt=now();persist();updateTrigger();
  }
  function updateNotes(buildId,stageId,{notes,targetGearRating}) {
    const build=findBuild(buildId),stage=findStage(build,stageId);
    if(!stage)throw Error('Stage not found.');
    stage.notes=cleanText(notes,2500);
    stage.targetGearRating=targetGearRating===''||targetGearRating==null?null:
      Number.isFinite(Number(targetGearRating))?
        Math.min(10000,Math.max(0,Math.round(Number(targetGearRating)))):null;
    stage.updatedAt=now();build.updatedAt=stage.updatedAt;persist();
  }
  function summary(account) {
    const gear=Object.keys(account.equipment||{}).filter(key=>account.equipment[key]?.name).length;
    const equipped=(account.customStigmas||[]).filter(Boolean);
    return {gear,stigmas:equipped.length,
      context:CONTEXTS[account.context]||'Group PvE',
      crystals:Number(account.crystals||0),mastery:Number(account.mastery||0),
      rating:Number(account.gearRating||0)};
  }
  function differences(a,b,cls) {
    const rows=[];
    const toCount=values=>Array.isArray(values)?values.length:0;
    const skillMap=(record)=>record&&typeof record==='object'?record:{};
    const pair=(section,label,left,right)=>{
      const lv=left==null?'—':typeof left==='object'?JSON.stringify(left):String(left);
      const rv=right==null?'—':typeof right==='object'?JSON.stringify(right):String(right);
      if(lv!==rv)rows.push({section,label,left:lv,right:rv});
    };
    for(const [key,label] of [['context','Scenario'],['pveObjective','Role'],['journey','Stage type'],
      ['mastery','Earned Mastery'],['stigma','Earned Stigma'],['crystals','Daevanion Crystals'],
      ['azphel','Azphel Crystals'],['ariel','Ariel Crystals'],['gearRating','Recorded GR']])
      pair('Resources',label,a[key],b[key]);
    for(const [key,label] of [['manualMastery','Mastery'],['manualStigma','Stigma ranks']]){
      const left=skillMap(a[key]),right=skillMap(b[key]);
      for(const name of [...new Set([...Object.keys(left),...Object.keys(right)])].sort())
        pair(label,name,left[name]??(key==='manualMastery'?1:0),right[name]??(key==='manualMastery'?1:0));
    }
    for(let i=0;i<4;i++)pair('Stigma loadout',`Slot ${i+1}`,
      a.customStigmas?.[i]||'Empty',b.customStigmas?.[i]||'Empty');
    const specialtyA=skillMap(a.customSpecialties),specialtyB=skillMap(b.customSpecialties);
    for(const name of [...new Set([...Object.keys(specialtyA),...Object.keys(specialtyB)])].sort())
      pair('Specialties',name,(specialtyA[name]||[]).join(', ')||'None',
        (specialtyB[name]||[]).join(', ')||'None');
    for(const [key,label] of [['customNodes','PvE Daevanion'],['customAzphelNodes','Azphel'],
      ['customArielNodes','Ariel']]){
      const left=new Set(a[key]||[]),right=new Set(b[key]||[]);
      pair('Boards',label+' · selected tiles',left.size,right.size);
      const removed=[...left].filter(id=>!right.has(id));
      const added=[...right].filter(id=>!left.has(id));
      if(removed.length||added.length)pair('Boards',label+' · tile changes',
        removed.length?`${removed.length} removed from left`:'No removals',
        added.length?`${added.length} added to right`:'No additions');
    }
    const equipmentA=skillMap(a.equipment),equipmentB=skillMap(b.equipment);
    for(const slot of GEAR_SLOTS){
      const first=equipmentA[slot.id],second=equipmentB[slot.id];
      const present=item=>item?.name?`${item.name} +${item.enhancement||0} · Amp ${item.amplification||0}`:'Empty';
      pair('Equipment',slot.name,present(first),present(second));
      if(first || second){
        pair('Equipment',slot.name+' · socket lines',
          (first?.stones||[]).map(st=>[st.stat,st.value,st.unit,st.grade].join(' ')).join(' | ')||'None',
          (second?.stones||[]).map(st=>[st.stat,st.value,st.unit,st.grade].join(' ')).join(' | ')||'None');
        pair('Equipment',slot.name+' · bonus skills',
          (first?.skillBonuses||[]).map(x=>`${x.skill} +${x.levels}`).join(' | ')||'None',
          (second?.skillBonuses||[]).map(x=>`${x.skill} +${x.levels}`).join(' | ')||'None');
        pair('Equipment',slot.name+' · Soul Binding',first?.statNotes||'None',second?.statNotes||'None');
        pair('Equipment',slot.name+' · Theostone',first?.theostone||'None',second?.theostone||'None');
      }
    }
    const macroA=skillMap(a.customMacros),macroB=skillMap(b.customMacros);
    for(const mode of [...new Set([...Object.keys(macroA),...Object.keys(macroB)])].sort()){
      const format=entry=>entry?`Steps: ${(entry.steps||[]).map(s=>`${s.key}@${s.delay||10}ms`).join('→')||'None'}; `+
        `Q: ${(entry.stacks?.Q||[]).join('/')}; E: ${(entry.stacks?.E||[]).join('/')}; `+
        `R: ${(entry.stacks?.R||[]).join('/')}; `+
        `Manual 1–8: ${(entry.hotbar||[]).map((skills,i)=>skills?.length?`${i+1}:${skills.join('/')}`:'').filter(Boolean).join(' | ')||'None'}; `+
        `Weave: ${entry.weave||'Unassigned'}`:'None';
      pair('Macros',mode,format(macroA[mode]),format(macroB[mode]));
    }
    pair('Collectibles','Owned titles',Object.values(a.titlesOwned||{}).filter(Boolean).length,
      Object.values(b.titlesOwned||{}).filter(Boolean).length);
    return rows;
  }
  function findOption(value) {
    const [buildId,stageId]=String(value||'').split('::');
    const build=findBuild(buildId),stage=findStage(build,stageId);
    return build&&stage?{build,stage}:null;
  }
  function options(selected,onlyClass='') {
    return data.builds.filter(build=>!onlyClass||build.cls===onlyClass)
      .flatMap(build=>build.stages.map(stage=>{
        const key=`${build.id}::${stage.id}`;
        return `<option value="${escapeHtml(key)}" ${selected===key?'selected':''}>${escapeHtml(PROFILES[build.cls].name)} · ${escapeHtml(build.name)} / ${escapeHtml(stage.name)}</option>`;
      })).join('');
  }
  function renderComparison() {
    if(!dialog)return;
    const left=findOption(dialog.querySelector('#db-left')?.value);
    const right=findOption(dialog.querySelector('#db-right')?.value);
    const host=dialog.querySelector('#db-difference');
    if(!left||!right){host.innerHTML='<p>Select two saved stages to compare.</p>';return;}
    if(left.build.cls!==right.build.cls){
      host.innerHTML='<p class="db-warning">Choose two stages of the same class for an accurate equipment, skill and board comparison.</p>';
      return;
    }
    const rows=differences(left.stage.account,right.stage.account,left.build.cls);
    const groups=[...new Set(rows.map(x=>x.section))];
    host.innerHTML=`<p class="db-delta-summary"><strong>${rows.length}</strong> allocation or equipment differences · no hypothetical Combat Power calculated.</p>`+
      (groups.length?groups.map(group=>{
        const subset=rows.filter(row=>row.section===group);
        return `<details class="db-diff-group" open><summary>${escapeHtml(group)} <span>${subset.length} changes</span></summary>`+
          `<div class="db-diff-scroll"><table><thead><tr><th scope="col">Field</th><th scope="col">${escapeHtml(left.stage.name)}</th><th scope="col">${escapeHtml(right.stage.name)}</th></tr></thead>`+
          `<tbody>${subset.map(row=>`<tr><th scope="row">${escapeHtml(row.label)}</th><td>${escapeHtml(row.left)}</td><td>${escapeHtml(row.right)}</td></tr>`).join('')}</tbody></table></div></details>`;
      }).join(''):'<p>These two saved snapshots have no tracked differences.</p>');
  }
  function activeLabel() {
    const linked=activeFor(state.class);
    return linked?`${linked.build.name} · ${linked.stage.name}`:'Unsaved workspace';
  }
  function updateTrigger() {
    for(const button of document.querySelectorAll('[data-db-launch]')){
      button.title='Build library · '+activeLabel();
      const label=button.querySelector('[data-db-launch-label]');
      if(label)label.textContent=activeFor(state.class)?activeLabel():'Build library';
    }
  }
  function renderList() {
    if(!dialog)return;
    const filter=dialog.querySelector('#db-class-filter')?.value||'all';
    const visible=data.builds.filter(build=>filter==='all'||filter===build.cls);
    const root=dialog.querySelector('#db-build-list');
    root.innerHTML=visible.length?visible.map(build=>{
      const selected=activeFor(build.cls);
      const stages=build.stages.map(stage=>{
        const id=`${build.id}::${stage.id}`,active=selected?.build.id===build.id&&selected.stage.id===stage.id,
          info=summary(stage.account);
        return `<li class="db-stage ${active?'is-active':''}"><div class="db-stage-copy"><b>${escapeHtml(stage.name)}</b>`+
          `<small>${escapeHtml(info.context)} · ${info.gear} equipment · ${info.stigmas} Stigmas · ${info.rating} GR</small>`+
          `${stage.targetGearRating!=null?`<small>Goal: ${stage.targetGearRating.toLocaleString()} GR</small>`:''}`+
          `</div><div class="db-stage-actions"><button type="button" data-db-action="load" data-build="${build.id}" data-stage="${stage.id}" ${active?'aria-current="true"':''}>${active?'Editing':'Open'}</button>`+
          `<button type="button" data-db-action="compare" data-build="${build.id}" data-stage="${stage.id}">Compare</button>`+
          `<button type="button" data-db-action="edit" data-build="${build.id}" data-stage="${stage.id}">Details</button>`+
          `<button type="button" data-db-action="remove-stage" data-build="${build.id}" data-stage="${stage.id}" aria-label="Delete stage ${escapeHtml(stage.name)}">×</button></div></li>`;
      }).join('');
      return `<article class="db-build" data-db-build="${build.id}"><header><div><span class="db-class">${escapeHtml(PROFILES[build.cls].name)} · Global</span>`+
        `<h3>${escapeHtml(build.name)}</h3><small>${build.stages.length} stage${build.stages.length===1?'':'s'} · local browser save</small></div>`+
        `<div class="db-build-actions"><button type="button" data-db-action="rename" data-build="${build.id}">Rename</button>`+
        `<button type="button" data-db-action="duplicate" data-build="${build.id}">Duplicate</button>`+
        `<button type="button" data-db-action="remove-build" data-build="${build.id}" aria-label="Delete build ${escapeHtml(build.name)}">Delete</button></div></header>`+
        `<ol class="db-stages">${stages}</ol>`+
        `<details class="db-stage-create"><summary>Add progression stage</summary><div><label>Stage name<input type="text" maxlength="90" data-db-stage-name placeholder="e.g. Nightmare DPS / GR 2800"></label>`+
        `<button type="button" data-db-action="add-stage" data-build="${build.id}">Copy current setup into stage</button></div>`+
        `<small>${build.cls===state.class?'Copies your current class workspace, including gear, boards, macros and resources.':'Switch to this class first to copy its current setup. Otherwise, duplicates the final saved stage.'}</small></details></article>`;
    }).join(''):'<p class="db-empty">No saved builds for this filter. Create one from your current character setup to begin tracking its progression.</p>';
    const selectedLeft=dialog.querySelector('#db-left')?.value;
    const selectedRight=dialog.querySelector('#db-right')?.value;
    dialog.querySelector('#db-left').innerHTML=options(selectedLeft);
    dialog.querySelector('#db-right').innerHTML=options(selectedRight);
    if(!selectedRight && dialog.querySelector('#db-right').options.length>1)
      dialog.querySelector('#db-right').selectedIndex=1;
    renderComparison();updateTrigger();
  }
  function renderDetails(buildId,stageId){
    const build=findBuild(buildId),stage=findStage(build,stageId),host=dialog.querySelector('#db-stage-detail');
    if(!stage){host.hidden=true;return;}
    host.hidden=false;host.dataset.build=buildId;host.dataset.stage=stageId;
    host.querySelector('#db-detail-title').textContent=`${build.name} · ${stage.name}`;
    host.querySelector('#db-detail-notes').value=stage.notes||'';
    host.querySelector('#db-detail-rating').value=stage.targetGearRating??'';
    host.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  function handleAction(event){
    const button=event.target.closest('[data-db-action]');if(!button)return;
    const {dbAction:action,build:buildId,stage:stageId}=button.dataset;
    const build=findBuild(buildId),stage=findStage(build,stageId);
    try{
      switch(action){
        case 'load':load(buildId,stageId);dialog.close();return;
        case 'compare': {
          const dropdown=dialog.querySelector('#db-right');
          dropdown.value=`${buildId}::${stageId}`;
          dialog.querySelector('#db-compare-panel').open=true;
          renderComparison();
          dialog.querySelector('#db-compare-panel').scrollIntoView({block:'nearest',behavior:'smooth'});
          return;
        }
        case 'edit':renderDetails(buildId,stageId);return;
        case 'rename': {
          const value=window.prompt('Rename this build:',build.name);
          if(value!==null)renameBuild(buildId,value);break;
        }
        case 'duplicate':duplicateBuild(buildId);break;
        case 'remove-build':
          if(window.confirm(`Delete ${build.name} and all ${build.stages.length} saved stages? This does not delete an exported backup.`))removeBuild(buildId);
          break;
        case 'remove-stage':
          if(window.confirm(`Delete the saved stage "${stage.name}"?`))removeStage(buildId,stageId);
          break;
        case 'add-stage':{
          const input=button.closest('.db-stage-create').querySelector('[data-db-stage-name]');
          addStage(buildId,input.value);dialog.close();return;
        }
      }
      renderList();
    }catch(error){report(error.message,true);}
  }
  function exportJson(){
    syncActive();
    const payload={format:'DaevaArchitectBuildLibrary',version:1,
      exportedAt:new Date().toISOString(),builds:data.builds};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),anchor=document.createElement('a');
    anchor.href=url;anchor.download='daevaarchitect-build-library.json';
    document.body.append(anchor);anchor.click();anchor.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    report(`Exported ${data.builds.length} named builds. Keep this backup if you clear your browser data.`);
  }
  async function importJson(file){
    if(!file) return;
    if(file.size>MAX_IMPORT_BYTES)throw Error('Import is too large (maximum 3 MB).');
    const payload=JSON.parse(await file.text());
    if(payload?.format!=='DaevaArchitectBuildLibrary'||payload.version!==1||
      !Array.isArray(payload.builds)||payload.builds.length>MAX_BUILDS)
      throw Error('This is not a compatible DaevaArchitect build-library export.');
    if(data.builds.length+payload.builds.length>MAX_BUILDS)
      throw Error('Too many saved builds; export or remove an existing build first.');
    if(!window.DaevaBuildSanitizer?.safeAccount)
      throw Error('Build validation is unavailable. No data was imported.');
    const timestamp=now(),incoming=[];
    for(const old of payload.builds){
      if(!CLASS_ORDER.includes(old.cls)||!Array.isArray(old.stages)||
        !old.stages.length||old.stages.length>MAX_STAGES)
        throw Error('An imported build has an invalid class or stage list.');
      const name=cleanText(old.name);
      if(!name)throw Error('An imported build has no name.');
      const build={id:uniqueId(),cls:old.cls,name,description:cleanText(old.description,1000),
        stages:[],createdAt:timestamp,updatedAt:timestamp};
      for(const original of old.stages){
        if(!original?.account||typeof original.account!=='object')
          throw Error('An imported stage is missing its character data.');
        const sanitized=window.DaevaBuildSanitizer.safeAccount(original.account,old.cls);
        // Imported builds are independent editable snapshots.
        if(sanitized.buildMode==='recommended'){
          throw Error('This export contains a legacy live recommendation. Apply the recommendation as a custom build before exporting it.');
        }
        sanitized.buildMode='custom';sanitized.boardMode='custom';
        build.stages.push({id:uniqueId(),name:cleanText(original.name)||'Imported stage',
          notes:cleanText(original.notes,2500),
          targetGearRating:Number.isFinite(Number(original.targetGearRating))&&original.targetGearRating!==null?
            Math.min(10000,Math.max(0,Math.round(Number(original.targetGearRating)))):null,
          account:sanitized,createdAt:timestamp,updatedAt:timestamp});
      }
      incoming.push(build);
    }
    const original=[...data.builds];
    data.builds=[...incoming,...data.builds];
    if(!persist()){data.builds=original;throw Error('Import exceeds browser storage quota; no stages were loaded.');}
    renderList();report(`Imported ${incoming.length} build${incoming.length===1?'':'s'} without overwriting your current character or existing saved builds.`);
  }
  function mount(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.id='db-dialog';
    dialog.setAttribute('aria-labelledby','db-heading');
    dialog.innerHTML=`<div class="db-shell">
      <header class="db-header"><div><span class="db-eyebrow">DAEVA ARCHITECT · GLOBAL · OFFLINE BUILDS</span><h2 id="db-heading">My build library</h2><p>Keep multiple builds and progression stages. Every stage retains its complete custom setup and can be edited independently.</p></div>
        <button class="db-close" id="db-close" type="button" aria-label="Close build library">×</button></header>
      <div class="db-toolbar"><div class="db-create"><label>New build name<input type="text" id="db-new-name" maxlength="90" placeholder="e.g. Templar · Nightmare DPS"></label>
        <button id="db-create-current" type="button">Save current as new build</button><button id="db-create-blank" type="button">Create blank build</button></div>
        <div class="db-file-actions"><button id="db-export" type="button">Export JSON</button><label class="db-import">Import DaevaArchitect JSON<input id="db-import" type="file" accept=".json,application/json"></label></div></div>
      <p class="db-message" id="db-message" role="status" aria-live="polite">Saved locally in this browser. Export JSON for a portable backup.</p>
      <div class="db-filter"><label>Show class<select id="db-class-filter"><option value="all">All classes</option>${CLASS_ORDER.map(cls=>`<option value="${cls}">${escapeHtml(PROFILES[cls].name)}</option>`).join('')}</select></label>
        <span id="db-active-label"></span></div>
      <div class="db-build-list" id="db-build-list"></div>
      <section id="db-stage-detail" class="db-stage-detail" hidden><header><h3 id="db-detail-title"></h3><button id="db-detail-close" type="button">Close details</button></header>
        <label>Progression goal (Gear Rating)<input id="db-detail-rating" type="number" min="0" max="10000" placeholder="Optional target"></label>
        <label>Stage notes<textarea id="db-detail-notes" maxlength="2500" rows="3" placeholder="Upgrades, next goals, boss-specific changes, or matchup notes"></textarea></label>
        <button id="db-detail-save" type="button">Save stage details</button></section>
      <details id="db-compare-panel" class="db-compare-panel"><summary>Compare any two saved stages</summary>
        <div class="db-compare-selectors"><label>First stage<select id="db-left"></select></label><label>Second stage<select id="db-right"></select></label></div>
        <div id="db-difference" class="db-difference" aria-live="polite"></div>
      </details><footer class="db-footer"><span>No account required. Browser storage is device-specific; exported JSON is your backup.</span><button id="db-close-bottom" type="button">Done</button></footer>
    </div>`;
    document.body.append(dialog);
    alertRegion=dialog.querySelector('#db-message');
    const openButton=(content,container)=>{
      if(!container)return;
      const button=document.createElement('button');button.type='button';
      button.className='db-launch';button.dataset.dbLaunch='';
      button.innerHTML=content;button.addEventListener('click',open);
      container.append(button);
    };
    openButton('<span aria-hidden="true">▤</span> <span data-db-launch-label>Build library</span>',
      document.querySelector('.v2-quickbar'));
    // Alternate character-first layouts may hide the unified quickbar.
    openButton('<span aria-hidden="true">▤</span> <span data-db-launch-label>Build library</span>',
      document.querySelector('.v5-side-nav'));
    openButton('My saved builds',document.querySelector('.class-picker-head'));
    dialog.querySelector('#db-build-list').addEventListener('click',handleAction);
    for(const id of ['db-close','db-close-bottom'])
      dialog.querySelector('#'+id).addEventListener('click',()=>dialog.close());
    dialog.querySelector('#db-class-filter').addEventListener('change',renderList);
    dialog.querySelector('#db-left').addEventListener('change',renderComparison);
    dialog.querySelector('#db-right').addEventListener('change',renderComparison);
    for(const [id,blank] of [['db-create-current',false],['db-create-blank',true]])
      dialog.querySelector('#'+id).addEventListener('click',()=>{
        try {const input=dialog.querySelector('#db-new-name');
          addBuild(input.value,{blank});input.value='';dialog.close();}
        catch(error){report(error.message,true);}
      });
    dialog.querySelector('#db-export').addEventListener('click',exportJson);
    dialog.querySelector('#db-import').addEventListener('change',async event=>{
      try{await importJson(event.target.files?.[0]);}
      catch(error){report(error.message,true);}
      finally{event.target.value='';}
    });
    dialog.querySelector('#db-detail-close').addEventListener('click',()=>{
      dialog.querySelector('#db-stage-detail').hidden=true;
    });
    dialog.querySelector('#db-detail-save').addEventListener('click',()=>{
      const section=dialog.querySelector('#db-stage-detail');
      try{updateNotes(section.dataset.build,section.dataset.stage,{
        notes:section.querySelector('#db-detail-notes').value,
        targetGearRating:section.querySelector('#db-detail-rating').value
      });renderList();report('Saved stage goals and notes.');}
      catch(error){report(error.message,true);}
    });
    dialog.addEventListener('click',event=>{
      if(event.target===dialog)dialog.close();
    });
    updateTrigger();
  }
  function open(){
    if(!dialog)mount();
    dialog.querySelector('#db-active-label').textContent='Current: '+activeLabel();
    renderList();report('Saved locally in this browser. Export JSON for a portable backup.');
    dialog.showModal();
  }
  read();
  document.addEventListener('DOMContentLoaded',mount,{once:true});
  if(document.readyState!=='loading')mount();
  return Object.freeze({onWorkspaceSave:syncActive,detach,open,addBuild,
    addStage,load,removeBuild,removeStage,duplicateBuild,renameBuild,renameStage,
    updateNotes,differences,importJson,exportJson,getData:()=>clone(data),
    activeFor,summary});
})();