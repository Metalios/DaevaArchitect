/* Build-owned macro customization. Suggested rotations remain read-only seeds,
 * while per-context user overrides survive re-optimization and shared imports. */
const CustomMacroEditor = (() => {
  'use strict';
  const KEYS = ['Q', 'E', 'R'];
  const CONTEXTS = ['party', 'solo', 'pvp', 'pvp-arena', 'pvp-abyss-solo', 'pvp-abyss-group'];
  const MAX_ROW = 4, MAX_STEPS = 20;
  let suggested = null;
  let available = new Set();
  let bound = false;

  function contextKey(a) {
    const journey = a.journey === 'leveling' ? 'leveling' : 'endgame';
    const context = CONTEXTS.includes(a.context) ? a.context : 'party';
    return journey + ':' + context;
  }
  function skillsFor(cls) {
    return new Set([
      ...Object.values(DATA[cls]?.skills || {}).map(skill => skill.name),
      ...Object.keys(STIGMAS[cls] || {})
    ]);
  }
  function normalize(raw, cls) {
    const allowed = skillsFor(cls);
    const filterNames = list => Array.isArray(list)
      ? list.slice(0, MAX_ROW).filter(name => typeof name === 'string' && allowed.has(name))
      : [];
    const stacks = Object.fromEntries(KEYS.map(key => [key, filterNames(raw?.stacks?.[key])]));
    const steps = Array.isArray(raw?.steps) ? raw.steps.slice(0, MAX_STEPS)
      .map(step => typeof step === 'string' ? {key: step, delay: 10} : step)
      .filter(step => step && KEYS.includes(step.key))
      .map(step => ({key: step.key, delay: Math.min(1000, Math.max(10, Math.round(Number(step.delay) || 10)))})) : [];
    const hotbar = Array.from({length: 8}, (_, i) => filterNames(raw?.hotbar?.[i]));
    return {stacks, steps, hotbar, weave: allowed.has(raw?.weave) ? raw.weave : ''};
  }
  function sanitizeCollection(raw, cls) {
    const clean = {};
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;
    for (const [key, value] of Object.entries(raw).slice(0, CONTEXTS.length * 2)) {
      const [stage, mode, extra] = key.split(':');
      if (extra || !['leveling', 'endgame'].includes(stage) || !CONTEXTS.includes(mode)
        || !value || typeof value !== 'object' || Array.isArray(value)) continue;
      clean[key] = normalize(value, cls);
    }
    return clean;
  }
  function current() {
    return account().customMacros?.[contextKey(account())] || null;
  }
  function seed(stacks, steps, hotbar, weave) {
    return normalize({
      stacks: Object.fromEntries(KEYS.map(key =>
        [key, stacks.find(s => s.key === key && !s.manual)?.skills || []])),
      steps: steps.map(key => ({key, delay: 10})),
      hotbar: hotbar.map(slot => slot[0]),
      weave
    }, state.class);
  }
  function apply(stacks, steps, hotbar, weave, usableSkills) {
    const custom = current();
    suggested = seed(stacks, steps, hotbar, weave);
    available = new Set(usableSkills);
    if (!custom && account().buildMode === 'custom')
      return {stacks:[],steps:[],
        hotbar:Array.from({length:8},()=>[[],'Unassigned','utility']),
        weave,delays:[],custom:false};
    if (!custom) return {stacks, steps, hotbar, weave,
      delays: steps.map(() => 10), custom: false};
    const saved = normalize(custom, state.class);
    const auto = KEYS.map(key => ({
      key, title: key + ' · Custom priority', manual: false,
      skills: saved.stacks[key].filter(name => available.has(name))
    })).filter(s => s.skills.length);
    const manual = saved.hotbar.map((names, i) => ({
      key: String(i + 1), title: 'Custom manual slot', manual: true,
      skills: names.filter(name => available.has(name))
    })).filter(s => s.skills.length > 1);
    const actualSteps = saved.steps.filter(step => auto.some(stack => stack.key === step.key));
    const actualHotbar = saved.hotbar.map(names =>
      [names.filter(name => available.has(name)), 'Custom manual hotbar', 'utility']);
    return {
      stacks: [...auto, ...manual], steps: actualSteps.map(step => step.key),
      delays: actualSteps.map(step => step.delay), hotbar: actualHotbar,
      weave: available.has(saved.weave) ? saved.weave : weave, custom: true
    };
  }
  function optionList(currentName, includeEmpty = true) {
    const all = skillsFor(state.class);
    const list = [...all].sort((a, b) => a.localeCompare(b));
    const empty = includeEmpty ? '<option value="">Empty</option>' : '';
    return empty + list.map(name =>
      '<option value="' + esc(name) + '"' +
        (name === currentName ? ' selected' : '') +
        (!available.has(name) ? ' data-unavailable="true"' : '') +
        '>' + esc(name) + (available.has(name) ? '' : ' (not equipped/unlocked)') + '</option>'
    ).join('');
  }
  function moveButtons(kind, key, index, size) {
    const attrs = ' data-cmacro-kind="' + kind + '" data-cmacro-key="' + key +
      '" data-cmacro-index="' + index + '"';
    return '<button type="button" data-cmacro-action="up"' + attrs +
      (index ? '' : ' disabled') + ' aria-label="Move priority up">↑</button>' +
      '<button type="button" data-cmacro-action="down"' + attrs +
      (index < size - 1 ? '' : ' disabled') + ' aria-label="Move priority down">↓</button>' +
      '<button type="button" data-cmacro-action="remove"' + attrs +
      ' aria-label="Remove">×</button>';
  }
  function skillRows(kind, key, skills) {
    const rows = skills.map((name, i) =>
      '<div class="custom-macro-row"><span class="custom-macro-index">' + i + '</span>' +
      '<select aria-label="' + esc(key) + ' priority ' + (i + 1) +
      '" data-cmacro-field="skill" data-cmacro-kind="' + kind +
      '" data-cmacro-key="' + key + '" data-cmacro-index="' + i + '">' +
      optionList(name) + '</select>' + moveButtons(kind, key, i, skills.length) + '</div>').join('');
    const add = skills.length < MAX_ROW
      ? '<button type="button" class="custom-macro-add" data-cmacro-action="add" data-cmacro-kind="' +
        kind + '" data-cmacro-key="' + key + '">+ Add skill</button>' : '';
    return rows + add;
  }
  function render() {
    const host = document.getElementById('custom-macro-editor');
    if (!host) return;
    const user = current();
    if (!user) {
      host.innerHTML = '<div class="custom-macro-heading"><div><h3>Editable macro & hotbar</h3>' +
        '<p>No macro is saved for this scenario. The rotation panel shows an optional suggested setup, not a recorded selection. Start empty or copy the suggestion to edit.</p>' +
        '</div><button type="button" data-cmacro-action="enable-blank">Start empty macro</button><button type="button" class="primary" data-cmacro-action="enable">Copy suggested macro</button></div>';
      return;
    }
    const data = normalize(user, state.class);
    const unavailable = [...new Set([
      ...KEYS.flatMap(key => data.stacks[key]), ...data.hotbar.flat(), data.weave
    ].filter(name => name && !available.has(name)))];
    host.innerHTML =
      '<div class="custom-macro-heading"><div><h3>Custom macro · ' + esc(contextKey(account())) +
      '</h3><p>Changes save immediately. Each game stack tries row 0 first; macro steps press stack keys, not skills.</p>' +
      '</div><button type="button" data-cmacro-action="reset">Clear saved macro</button></div>' +
      '<p class="custom-macro-warning">Custom timing and automation are not combat-simulated. Charges, movement, healing and defensive skills may require manual control. Test in game.</p>' +
      (unavailable.length ? '<p class="custom-macro-warning">Not currently equipped/unlocked (kept in the saved setup but omitted from active macro): ' +
        esc(unavailable.join(', ')) + '</p>' : '') +
      '<label class="custom-macro-weave">Held basic / weave skill <select data-cmacro-field="weave">' +
        optionList(data.weave) + '</select></label>' +
      '<div class="custom-macro-grid">' + KEYS.map(key =>
        '<section class="custom-macro-column"><h4>' + key + ' stack</h4>' +
        '<small>Row 0 is the first attempted skill</small>' +
        skillRows('stack', key, data.stacks[key]) + '</section>').join('') + '</div>' +
      '<section class="custom-macro-steps"><h4>In-game macro steps</h4>' +
      data.steps.map((step, i) =>
        '<div class="custom-macro-row"><span class="custom-macro-index">' + (i + 1) + '</span>' +
        '<select aria-label="Step ' + (i + 1) + ' stack" data-cmacro-field="step-key" data-cmacro-index="' + i + '">' +
        KEYS.map(key => '<option value="' + key + '"' + (key === step.key ? ' selected' : '') + '>' + key + '</option>').join('') +
        '</select><label class="custom-macro-delay">Delay <input aria-label="Step ' + (i + 1) +
        ' delay milliseconds" type="number" min="10" max="1000" step="10" value="' + step.delay +
        '" data-cmacro-field="delay" data-cmacro-index="' + i + '"> ms</label>' +
        moveButtons('step', '', i, data.steps.length) + '</div>').join('') +
      (data.steps.length < MAX_STEPS ? '<button type="button" class="custom-macro-add" data-cmacro-action="add" data-cmacro-kind="step">+ Add macro step</button>' : '') +
      '</section><details class="custom-macro-manual"><summary>Edit manual hotbar keys 1–8</summary>' +
      '<div class="custom-macro-grid">' +
      data.hotbar.map((names, i) => '<section class="custom-macro-column"><h4>Key ' + (i + 1) +
        '</h4>' + skillRows('hotbar', String(i), names) + '</section>').join('') +
      '</div></details>';
  }
  function modify(kind, key, index, action, entry) {
    const data = normalize(current(), state.class);
    const array = kind === 'step' ? data.steps :
      kind === 'stack' ? data.stacks[key] : data.hotbar[Number(key)];
    if (!array) return;
    if (action === 'add') {
      if (array.length >= (kind === 'step' ? MAX_STEPS : MAX_ROW)) return;
      array.push(kind === 'step' ? {key: 'Q', delay: 10} : [...skillsFor(state.class)].find(name => available.has(name) && !array.includes(name)) || [...skillsFor(state.class)][0]);
    } else if (action === 'remove') array.splice(index, 1);
    else if (action === 'up' && index > 0) [array[index - 1], array[index]] = [array[index], array[index - 1]];
    else if (action === 'down' && index < array.length - 1) [array[index + 1], array[index]] = [array[index], array[index + 1]];
    else if (action === 'set' && index >= 0 && index < array.length) array[index] = entry;
    account().customMacros[contextKey(account())] = data;
    save(); renderApplication();
  }
  function renderApplication() {
    // The app's renderer recreates the macro preview and this editor together.
    window.render();
  }
  function listen() {
    if (bound) return;
    const host = document.getElementById('custom-macro-editor');
    if (!host) return;
    bound = true;
    host.addEventListener('click', event => {
      const button = event.target.closest('[data-cmacro-action]');
      if (!button) return;
      const action = button.dataset.cmacroAction;
      if (action === 'enable-blank') {
        account().customMacros ||= {};
        account().customMacros[contextKey(account())] = normalize({
          stacks:{Q:[],E:[],R:[]},steps:[],
          hotbar:Array.from({length:8},()=>[]),weave:''
        },state.class);
        save();renderApplication();return;
      }
      if (action === 'enable') {
        account().customMacros ||= {};
        account().customMacros[contextKey(account())] = normalize(suggested, state.class);
        save(); renderApplication(); return;
      }
      if (action === 'reset') {
        delete account().customMacros?.[contextKey(account())];
        save(); renderApplication(); return;
      }
      modify(button.dataset.cmacroKind, button.dataset.cmacroKey || '',
        Number(button.dataset.cmacroIndex), action);
    });
    host.addEventListener('change', event => {
      const target = event.target, field = target.dataset.cmacroField;
      if (!field || !current()) return;
      const data = normalize(current(), state.class);
      if (field === 'weave') data.weave = target.value;
      else if (field === 'skill') {
        const arr = target.dataset.cmacroKind === 'stack'
          ? data.stacks[target.dataset.cmacroKey] : data.hotbar[Number(target.dataset.cmacroKey)];
        if (!arr) return;
        arr[Number(target.dataset.cmacroIndex)] = target.value;
      } else if (field === 'step-key') data.steps[Number(target.dataset.cmacroIndex)].key = target.value;
      else if (field === 'delay') data.steps[Number(target.dataset.cmacroIndex)].delay =
        Math.max(10, Math.min(1000, Math.round(Number(target.value) || 10)));
      else return;
      account().customMacros[contextKey(account())] = data;
      save(); renderApplication();
    });
  }
  return {apply, render, listen, normalize, sanitizeCollection, contextKey};
})();
