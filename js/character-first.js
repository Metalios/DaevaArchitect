// Character-first preview. Existing planner editors/calculators remain authoritative.
// Opt in with ?layout=character; no fake character import or unverified performance gains.
(() => {
  'use strict';
  const url = new URL(location.href);
  const $ = id => document.getElementById(id);
  const preview = url.searchParams.get('layout') === 'character';
  const a = (cls, text, href) => {
    const el = document.createElement('a');
    el.className = cls;
    el.textContent = text;
    el.href = href;
    return el;
  };
  const escapeText = value => String(value ?? '').replace(/[&<>"']/g, c =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&#39;'}[c]));
  const originalUrl = new URL(location.href);
  originalUrl.searchParams.delete('layout');
  const previewUrl = new URL(location.href);
  previewUrl.searchParams.set('layout', 'character');

  if (!preview) {
    const quickbar = document.querySelector('.v2-quickbar');
    if (quickbar) quickbar.append(a('v5-launch', 'Preview new design', previewUrl.href));
    return;
  }

  let ready = false;
  let view = 'overview';
  let internalEditorClick = false;
  const shell = () => document.querySelector('#planner-content');
  const views = ['overview','equipment','skills','stigma','arcana','boards','rotation','titles','sources'];
  const titleByContext = {
    solo:'Solo PvE', party:'Group PvE', pvp:'General PvP',
    'pvp-arena':'Arena PvP', 'pvp-abyss-solo':'Solo Abyss PvP',
    'pvp-abyss-group':'Group Abyss PvP'
  };
  const safeSkin = value => ['aether','abyss','solar'].includes(value) ? value : 'aether';

  function selectedTheme() {
    try { return safeSkin(localStorage.getItem('daeva-architect-v5-skin')); }
    catch { return 'aether'; }
  }
  function setTheme(value) {
    const skin = safeSkin(value);
    document.body.dataset.v5Skin = skin;
    if ($('v5-theme')) $('v5-theme').value = skin;
    try { localStorage.setItem('daeva-architect-v5-skin', skin); } catch {}
  }
  function switchContext(next) {
    const input = $('v2-context');
    if (!input || ![...input.options].some(option => option.value === next && !option.disabled)) return;
    input.value = next;
    input.dispatchEvent(new Event('change', {bubbles:true}));
  }
  function switchView(next) {
    if (!views.includes(next)) return;
    view = next;
    document.body.classList.remove(...views.map(v => 'v5-view-'+v));
    document.body.classList.add('v5-view-'+next);
    if (typeof window.syncV7==='function') window.syncV7();
    document.querySelectorAll('[data-v5-view]').forEach(button => {
      const active = button.dataset.v5View === next;
      button.classList.toggle('active', active);
      button.setAttribute('aria-current', active ? 'page' : 'false');
    });
    if (next === 'rotation' || next === 'titles' || next === 'sources') {
      document.querySelector('[data-v2-tab="'+next+'"]')?.click();
      requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}));
      return;
    }
    if (document.body.classList.contains('v2-secondary')) {
      document.querySelector('[data-v2-tab="workspace"]')?.click();
    }
    const editor = next === 'boards' ? 'boards' :
      next === 'skills' ? 'mastery' : next === 'stigma' ? 'stigma' : 'gear';
    // The original editor rail remains the internal source of truth at every
    // breakpoint, not just on mobile. Otherwise CSS selected Gear at 1280px
    // while the new navigation claimed to show Skills or Stigmas.
    if (next !== 'overview') {
      internalEditorClick = true;
      try { document.querySelector('[data-v3-editor="'+editor+'"]')?.click(); }
      finally { internalEditorClick = false; }
    }
    if (next === 'arcana') {
      const details = document.querySelector('#gear .v2-gear-advanced');
      if (details) details.open = true;
    }
    if (next === 'boards') {
      $('v2-board-fit')?.click();
    }
    if (next === 'overview') {
      const tabs = document.querySelector('.v5-page-tabs');
      if (tabs) tabs.scrollLeft = 0;
    }
    update();
    // Every detailed section is a page-like workspace. Preserve its controls
    // but reset the document viewport on tab changes, not the internal board
    // canvas scroll position or the saved character data.
    requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'instant'}));
  }
  function button(label, target, icon) {
    return '<button type="button" data-v5-view="'+target+'"><span aria-hidden="true">'+icon+
      '</span><span>'+label+'</span></button>';
  }
  function mount() {
    if (ready || !state?.class || !shell() || !$('v2-workspace')) return;
    ready = true;
    document.body.classList.add('v5-active','v5-view-overview');
    setTheme(selectedTheme());
    const host = shell();
    const app = document.createElement('div'); app.className = 'v5-main';
    const sidebar = document.createElement('aside'); sidebar.className = 'v5-sidebar';
    sidebar.setAttribute('aria-label','Character workspace navigation');
    sidebar.innerHTML = '<div class="v5-sidebar-brand"><span class="v5-brand-mark" aria-hidden="true">✧</span>'+
      '<strong>DaevaArchitect</strong><small>AION 2 · GLOBAL</small></div>'+
      '<nav class="v5-side-nav" aria-label="Main navigation">'+
      button('Overview','overview','⌂')+
      button('Equipment','equipment','◇')+
      button('Mastery & skills','skills','✧')+
      button('Stigmas','stigma','✦')+
      button('Arcana','arcana','◈')+
      button('Daevanian','boards','⬡')+
      button('Rotation / macro','rotation','↝')+
      button('Titles','titles','♛')+
      button('Research notes','sources','◉')+
      '<button type="button" id="v5-open-compare"><span aria-hidden="true">⇆</span><span>Compare build</span></button>'+
      '</nav><div class="v5-sidebar-divider"></div>'+
      '<div class="v5-side-context"><h2>Build scenarios</h2>'+
      '<button data-v5-context="party">Group PvE</button>'+
      '<button data-v5-context="solo">Solo PvE</button>'+
      '<button data-v5-context="pvp-abyss-solo">Solo Abyss PvP</button>'+
      '<button data-v5-context="pvp-arena">Arena PvP</button></div>'+
      '<a class="v5-import-link" href="https://github.com/Metalios/DaevaArchitect/issues/55" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">↓</span><span>Character import <small>Planned · view scope</small></span></a>';
    host.insertBefore(sidebar,host.firstChild);
    for (const el of [...host.children]) if (el !== sidebar) app.append(el);
    host.append(app);
    const quick = app.querySelector('.v2-quickbar');
    quick?.append(a('v5-back-link','Classic layout',originalUrl.href));
    const mast = document.createElement('header');mast.className='v5-masthead';
    mast.innerHTML = '<div class="v5-character-crest" aria-hidden="true"><span>✧</span></div>'+
      '<div class="v5-character-copy"><span class="v5-overline">CHARACTER WORKSPACE · GLOBAL</span>'+
      '<h1 id="v5-character-title">Character builder</h1><p id="v5-character-line"></p></div>'+
      '<div class="v5-masthead-actions"><label for="v5-theme">Appearance</label>'+
      '<select id="v5-theme" aria-label="Preview color theme"><option value="aether">Aether · Teal</option>'+
      '<option value="abyss">Abyss · Violet</option><option value="solar">Solar · Gold</option></select>'+
      '<div class="v5-availability"><span class="v5-availability-dot" aria-hidden="true"></span>Manual build · import pending</div></div>';
    quick.after(mast);
    const tabs = document.createElement('nav');tabs.className='v5-page-tabs';
    tabs.setAttribute('aria-label','Character editor');
    tabs.innerHTML = '<button data-v5-view="overview">Overview</button>'+
      '<button data-v5-view="equipment">Equipment</button>'+
      '<button data-v5-view="skills">Skills</button>'+
      '<button data-v5-view="stigma">Stigmas</button>'+
      '<button data-v5-view="arcana">Arcana</button>'+
      '<button data-v5-view="boards">Daevanian boards</button>'+
      '<button data-v5-view="rotation">Rotation / macro</button>'+
      '<button data-v5-view="titles">Titles</button>'+
      '<button data-v5-view="sources">Research</button>'+
      '<button id="v5-tab-compare">Compare</button>';
    mast.after(tabs);
    // Keep the existing editable budget inputs as the single source of truth.
    // They were previously trapped inside Equipment, which is hidden on Overview
    // and on other character-first pages. Move (never clone) them above every tab.
    const resourcePanel = document.createElement('section');
    resourcePanel.id = 'v5-resources';
    resourcePanel.className = 'v5-resources';
    resourcePanel.setAttribute('aria-labelledby','v5-resources-title');
    resourcePanel.innerHTML = '<header class="v5-resources-head"><div>'+
      '<span class="v5-overline">YOUR EARNED CURRENCY</span>'+
      '<h2 id="v5-resources-title">Available progression points</h2>'+
      '<p>Enter total earned, including already spent. Skill ranks and purchased board tiles are tracked separately.</p></div>'+
      '<button type="button" id="v5-resource-jump" data-v5-edit-resources>Update point totals</button></header>';
    tabs.after(resourcePanel);
    const inputs = $('planner-content').querySelector('#gear .controls');
    if (inputs) {
      inputs.id = 'v5-resource-inputs';
      resourcePanel.append(inputs);
      // Existing input events, validation, leveling budgets, and share/save logic
      // stay attached to the original DOM elements.
      const masteryLabel = inputs.querySelector('label[for="mastery-input"]');
      const stigmaLabel = inputs.querySelector('label[for="stigma-input"]');
      const crystalLabel = inputs.querySelector('label[for="crystal-input"]');
      if(masteryLabel)masteryLabel.textContent='Mastery points';
      if(stigmaLabel)stigmaLabel.textContent='Stigma points';
      if(crystalLabel)crystalLabel.textContent='PvE Daevanian crystals';
    }
    const rail = document.createElement('section');rail.className='v5-recommendations';
    rail.setAttribute('aria-label','Recommendations and progression');
    rail.innerHTML = '<div class="v5-rail-head"><div><span class="v5-overline">BUILD INTELLIGENCE</span>'+
      '<h2>Recommendations</h2></div><button type="button" id="v5-compare-rail">Compare →</button></div>'+
      '<div class="v5-rec-hero"><span class="v5-rec-symbol" aria-hidden="true">✦</span>'+
      '<div><strong id="v5-recommend-title"></strong><p id="v5-recommend-why"></p>'+
      '<small>Evidence-based suggestions, not a measured DPS guarantee</small></div></div>'+
      '<section class="v5-budget-section"><h3>Allocated progression</h3>'+
      '<div id="v5-budget-rows"></div></section>'+
      '<section class="v5-board-card"><div class="v5-board-ornament" aria-hidden="true">✧</div>'+
      '<div><h3>Daevanian board planner</h3><p>Nezekan · Zikel · Vaizel · Triniel · Ariel · Azphel</p>'+
      '<button type="button" data-v5-view="boards">Open full boards <span aria-hidden="true">→</span></button></div></section>'+
      '<section class="v5-progress-note"><h3>Data quality</h3>'+
      '<p>Manual equipment and purchased-node tracking are retained. PLAYNC import and verified server CP are not yet available.</p></section>';
    $('v2-workspace').querySelector('.v2-right')?.prepend(rail);
    const compare = document.createElement('section');compare.className='v5-compare-strip';
    compare.setAttribute('aria-label','Current plan and recommendations');
    compare.innerHTML = '<div class="v5-compare-heading"><span class="v5-compare-ornament" aria-hidden="true">⇆</span>'+
      '<div><span class="v5-overline">CHARACTER PROGRESSION</span><h2>Build overview & comparison</h2>'+
      '<p>Actual purchases, current custom edits, and non-destructive recommendations.</p></div></div>'+
      '<div class="v5-compare-cards"><article><span>Recorded character</span><strong id="v5-recorded-count">—</strong>'+
      '<small>Items entered · not a live import</small></article>'+
      '<article><span>Current build</span><strong id="v5-current-cp">—</strong>'+
      '<small id="v5-current-cp-caption">Planning estimate</small></article>'+
      '<article><span>Recommended route</span><strong id="v5-planned-spend">—</strong>'+
      '<small id="v5-planned-spend-caption">Crystal investment</small></article></div>'+
      '<button class="v5-compare-action" type="button" id="v5-compare-bottom">Compare allocations →</button>';
    $('v2-workspace').after(compare);
    // The existing comparison dialog is authoritative; we do not fabricate
    // a measured actual-vs-optimized combat score before the data exists.
    const openCompare = () => {
      if (document.body.classList.contains('v2-secondary'))
        document.querySelector('[data-v2-tab="workspace"]')?.click();
      $('v2-open-comparison')?.click();
    };
    host.addEventListener('click', event => {
      const legacyEditor = event.target.closest('[data-v3-editor]');
      if (legacyEditor && !internalEditorClick) {
        const mapped = {gear:'equipment',mastery:'skills',stigma:'stigma',boards:'boards'}[legacyEditor.dataset.v3Editor];
        if (mapped) switchView(mapped);
        return;
      }
      if (event.target.closest('[data-v5-edit-resources]')) {
        const panel=$('v5-resources');
        panel?.scrollIntoView({behavior:'smooth',block:'start'});
        $('mastery-input')?.focus({preventScroll:true});
        return;
      }
      const target = event.target.closest('[data-v5-view]');
      if (target) { switchView(target.dataset.v5View);return; }
      const context = event.target.closest('[data-v5-context]');
      if (context) {switchContext(context.dataset.v5Context);return;}
      if (event.target.closest('#v5-open-compare,#v5-tab-compare,#v5-compare-bottom,#v5-compare-rail'))
        openCompare();
    });
    // Opening Compare can horizontally scroll compact top navigation.
    // Restore the selected Overview tab after the dialog closes.
    $('v2-comparison-close')?.addEventListener('click', () => {
      if (view === 'overview') requestAnimationFrame(() => {
        const tabs = document.querySelector('.v5-page-tabs');
        if (tabs) tabs.scrollLeft = 0;
      });
    });
    $('v5-theme').addEventListener('change', event => setTheme(event.target.value));
    setTheme(selectedTheme());
    update(model());
  }

  function update(m) {
    if (!ready || !state?.class) return;
    const build = account(), profile = PROFILES[state.class];
    const level = currentLevel();
    const display = profile?.name || state.class;
    const editing = modifiedBuild();
    $('v5-character-title').textContent = display+' · Level '+level;
    $('v5-character-line').textContent =
      [profile?.role,titleByContext[build.context]||build.context,
       editing?'Customized allocations':'Recommended allocations'].filter(Boolean).join('  ·  ');
    document.querySelectorAll('[data-v5-context]').forEach(button => {
      button.classList.toggle('active',button.dataset.v5Context===build.context);
      button.setAttribute('aria-pressed',String(button.dataset.v5Context===build.context));
    });
    const objectives = adviceFor(state.class,build.context,build.pveObjective);
    $('v5-recommend-title').textContent = titleByContext[build.context] || 'Class recommendations';
    $('v5-recommend-why').textContent = (objectives?.why || 'Review Mastery, Stigmas, and connected Daevanian path.') .slice(0,350);
    // Model is already calculated by render(); don't force another optimizer run.
    const rows = [
      {name:'Mastery',spent:m?.mastery?.spent||0,total:budget('mastery')},
      {name:'Stigmas',spent:m?.stigma?.spent||0,total:budget('stigma')},
      {name:'PvE Daevanian',spent:m?.boards?.spent||0,total:budget('crystals')},
      {name:'Azphel',spent:m?.azphel?.spent||0,total:build.azphel||0},
      {name:'Ariel',spent:m?.ariel?.spent||0,total:build.ariel||0}
    ];
    $('v5-budget-rows').replaceChildren(...rows.map(({name,spent,total})=>{
      const row=document.createElement('div');row.className='v5-meter-row';
      const text=document.createElement('div');text.className='v5-meter-label';
      const label=document.createElement('span');label.textContent=name;
      const amount=document.createElement('span');amount.textContent=spent.toLocaleString()+' / '+total.toLocaleString();
      text.append(label,amount);
      const meter=document.createElement('progress');meter.value=Math.min(spent,Math.max(1,total));meter.max=Math.max(1,total);
      meter.setAttribute('aria-label',name+' points allocated');
      row.append(text,meter);return row;
    }));
    const equipmentCount=Object.values(build.equipment||{}).filter(Boolean).length;
    $('v5-recorded-count').textContent=equipmentCount+' / '+GEAR_SLOTS.length+' slots';
    $('v5-current-cp').textContent=$('gear-cp-estimate')?.textContent?.trim()||'—';
    $('v5-current-cp-caption').textContent='Estimated CP · not the server value';
    $('v5-planned-spend').textContent=(m?.boards?.spent||0)+' / '+budget('crystals');
    $('v5-planned-spend-caption').textContent=build.boardMode==='custom'?'Custom connected board route':'Recommended connected board route';
    document.querySelectorAll('[data-v5-view]').forEach(button => {
      const active=button.dataset.v5View===view;
      button.classList.toggle('active',active);
      button.setAttribute('aria-current',active?'page':'false');
    });
  }
  window.syncV5 = update;
  if (state?.class) mount();
  document.querySelector('#class-buttons')?.addEventListener('click', () => requestAnimationFrame(mount));
})();
