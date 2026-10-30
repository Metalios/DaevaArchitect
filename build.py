from pathlib import Path
import json
import shutil

root = Path(__file__).parent
template = (root / 'index.template.html').read_text(encoding='utf8')
data = json.loads((root / 'classes_data.json').read_text(encoding='utf8'))
for class_data in data.values():
    # Legacy third-party paths and weights are retained only in the source
    # snapshot for migration audits. The shipped planner uses calculated routes.
    for obsolete in ('route', 'skillWeights', 'statWeights'):
        class_data.pop(obsolete, None)
    class_data['sources'].pop('route', None)
specialties = json.loads((root / 'specialties.json').read_text(encoding='utf8'))
stigmas = json.loads((root / 'stigmas.json').read_text(encoding='utf8'))
title_catalog = json.loads((root / 'titles_catalog.json').read_text(encoding='utf8'))
context_routes = json.loads((root / 'context_routes.json').read_text(encoding='utf8'))
azphel_data = json.loads((root / 'azphel_data.json').read_text(encoding='utf8'))
skill_unlocks = json.loads((root / 'skill_unlocks.json').read_text(encoding='utf8'))
level_rewards = json.loads((root / 'level_rewards.json').read_text(encoding='utf8'))
gear_catalog = json.loads((root / 'gear_catalog.json').read_text(encoding='utf8'))
js_data = 'const DATA=' + json.dumps(data, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const SPECS=' + json.dumps(specialties, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const STIGMAS=' + json.dumps(stigmas, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const TITLE_CATALOG=' + json.dumps(title_catalog, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const ROUTES=' + json.dumps(context_routes, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const AZPHEL=' + json.dumps(azphel_data, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const SKILL_UNLOCKS=' + json.dumps(skill_unlocks, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const LEVEL_REWARDS=' + json.dumps(level_rewards, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const GEAR_CATALOG=' + json.dumps(gear_catalog, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
# Research summaries are small, versioned observations, not assumed combat
# measurements. Aggregate low-confidence adoption priors during the static
# build so the browser never scrapes third-party pages or needs an API.
research = json.loads((root / 'research' / 'pve-observations.json').read_text(encoding='utf8'))
assert research['schemaVersion'] == 1
research_groups = {}
seen_evidence = set()
for observation in research['observations']:
    cls = observation['classId']
    if cls not in data:
        raise ValueError(f'Unknown research class: {cls}')
    identity = (observation['id'], observation['patch'])
    if identity in seen_evidence:
        raise ValueError(f'Duplicate evidence id / patch: {identity}')
    seen_evidence.add(identity)
    if not observation['source'].startswith('https://'):
        raise ValueError(f'Missing research provenance: {identity}')
    if observation.get('measured') is not False:
        raise ValueError(f'Cannot silently treat unverified research as measured: {identity}')
    valid_skills = {skill['name'] for skill in data[cls]['skills'].values()}
    if not set(observation['skills']).issubset(valid_skills):
        raise ValueError(f'Unknown research skill in {identity}')
    if not set(observation['stigmas']).issubset(stigmas[cls]):
        raise ValueError(f'Unknown research Stigma in {identity}')
    group = research_groups.setdefault(cls, {'observations': 0, 'totals': {}, 'totalWeight': 0})
    # A guide summary has very low empirical weight. A later, consented,
    # de-duplicated character observation may add signal but is not DPS proof.
    weight = 0.25 if observation['sourceType'] == 'guide_summary' else 0.5
    group['observations'] += 1
    group['totalWeight'] += weight
    for skill in observation['skills']:
        group['totals'][skill] = group['totals'].get(skill, 0) + weight
compiled_research = {
    cls: {
        'observations': group['observations'],
        'evidenceType': 'adoption_prior_not_performance',
        'skills': {
            skill: round(value / group['totalWeight'], 4)
            for skill, value in group['totals'].items()
        }
    }
    for cls, group in research_groups.items()
}
js_data += 'const RESEARCH_PRIORS=' + json.dumps(compiled_research, separators=(',',':'), ensure_ascii=False) + ';'



out_dir = root / 'dist'
(out_dir / 'js').mkdir(parents=True, exist_ok=True)
(out_dir / 'css').mkdir(parents=True, exist_ok=True)
(out_dir / 'assets').mkdir(parents=True, exist_ok=True)
for name in ('profiles.js', 'titles.js', 'gear.js', 'cp.js', 'board_optimizer.js', 'icon_catalog.js', 'recommendations.js', 'progression.js', 'leveling_rotation.js', 'app.js', 'share.js', 'v2.js'):
    shutil.copy2(root / 'js' / name, out_dir / 'js' / name)
shutil.copy2(root / 'js' / 'board_budget.js', out_dir / 'js' / 'board_budget.js')
(out_dir / 'js' / 'optimizer').mkdir(parents=True, exist_ok=True)
shutil.copy2(root / 'js' / 'optimizer' / 'objectives.js', out_dir / 'js' / 'optimizer' / 'objectives.js')
shutil.copy2(root / 'js' / 'mastery_budget.js', out_dir / 'js' / 'mastery_budget.js')
(out_dir / 'js' / 'engine').mkdir(parents=True, exist_ok=True)
shutil.copy2(root / 'js' / 'engine' / 'combat.js', out_dir / 'js' / 'engine' / 'combat.js')
shutil.copy2(root / 'js' / 'engine' / 'class_models.js', out_dir / 'js' / 'engine' / 'class_models.js')
shutil.copy2(root / 'css' / 'styles.css', out_dir / 'css' / 'styles.css')
shutil.copy2(root / 'css' / 'v2.css', out_dir / 'css' / 'v2.css')
shutil.copy2(root / 'css' / 'leveling.css', out_dir / 'css' / 'leveling.css')
shutil.copy2(root / 'css' / 'fidelity.css', out_dir / 'css' / 'fidelity.css')
shutil.copy2(root / 'css' / 'approved-target.css', out_dir / 'css' / 'approved-target.css')
for asset in (root / 'assets').rglob('*'):
    if asset.is_file():
        destination = out_dir / 'assets' / asset.relative_to(root / 'assets')
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(asset, destination)
(out_dir / 'js' / 'data.js').write_text(js_data, encoding='utf8')
out = out_dir / 'index.html'
out.write_text(template, encoding='utf8')
print(out, len(template), 'chars; external CSS and JavaScript copied to dist')
