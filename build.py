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

out_dir = root / 'dist'
(out_dir / 'js').mkdir(parents=True, exist_ok=True)
(out_dir / 'css').mkdir(parents=True, exist_ok=True)
(out_dir / 'assets').mkdir(parents=True, exist_ok=True)
for name in ('profiles.js', 'titles.js', 'gear.js', 'cp.js', 'board_optimizer.js', 'icon_catalog.js', 'recommendations.js', 'progression.js', 'leveling_rotation.js', 'app.js', 'share.js', 'v2.js'):
    shutil.copy2(root / 'js' / name, out_dir / 'js' / name)
shutil.copy2(root / 'js' / 'board_budget.js', out_dir / 'js' / 'board_budget.js')
shutil.copy2(root / 'js' / 'mastery_budget.js', out_dir / 'js' / 'mastery_budget.js')
(out_dir / 'js' / 'engine').mkdir(parents=True, exist_ok=True)
shutil.copy2(root / 'js' / 'engine' / 'combat.js', out_dir / 'js' / 'engine' / 'combat.js')
shutil.copy2(root / 'css' / 'styles.css', out_dir / 'css' / 'styles.css')
shutil.copy2(root / 'css' / 'v2.css', out_dir / 'css' / 'v2.css')
shutil.copy2(root / 'css' / 'leveling.css', out_dir / 'css' / 'leveling.css')
shutil.copy2(root / 'css' / 'fidelity.css', out_dir / 'css' / 'fidelity.css')
for asset in (root / 'assets').rglob('*'):
    if asset.is_file():
        destination = out_dir / 'assets' / asset.relative_to(root / 'assets')
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(asset, destination)
(out_dir / 'js' / 'data.js').write_text(js_data, encoding='utf8')
out = out_dir / 'index.html'
out.write_text(template, encoding='utf8')
print(out, len(template), 'chars; external CSS and JavaScript copied to dist')
