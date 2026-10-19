from pathlib import Path
import json

root = Path(__file__).parent
template = (root / 'index.template.html').read_text(encoding='utf8')
styles = (root / 'styles.css').read_text(encoding='utf8')
app = (root / 'app.js').read_text(encoding='utf8')
profiles = (root / 'profiles.js').read_text(encoding='utf8')
titles = (root / 'titles.js').read_text(encoding='utf8')
data = json.loads((root / 'classes_data.json').read_text(encoding='utf8'))
specialties = json.loads((root / 'specialties.json').read_text(encoding='utf8'))
stigmas = json.loads((root / 'stigmas.json').read_text(encoding='utf8'))
title_catalog = json.loads((root / 'titles_catalog.json').read_text(encoding='utf8'))
context_routes = json.loads((root / 'context_routes.json').read_text(encoding='utf8'))
azphel_data = json.loads((root / 'azphel_data.json').read_text(encoding='utf8'))
skill_unlocks = json.loads((root / 'skill_unlocks.json').read_text(encoding='utf8'))
level_rewards = json.loads((root / 'level_rewards.json').read_text(encoding='utf8'))
js_data = 'const DATA=' + json.dumps(data, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const SPECS=' + json.dumps(specialties, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const STIGMAS=' + json.dumps(stigmas, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const TITLE_CATALOG=' + json.dumps(title_catalog, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const ROUTES=' + json.dumps(context_routes, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const AZPHEL=' + json.dumps(azphel_data, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const SKILL_UNLOCKS=' + json.dumps(skill_unlocks, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const LEVEL_REWARDS=' + json.dumps(level_rewards, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
page = template.replace('/*STYLES*/', styles).replace('/*DATA*/', js_data).replace('/*PROFILES*/', profiles).replace('/*TITLES*/', titles).replace('/*APP*/', app)
out = root / 'dist' / 'index.html'
out.write_text(page, encoding='utf8')
print(out, len(page), 'chars')
