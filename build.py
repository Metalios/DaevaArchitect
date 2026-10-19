from pathlib import Path
import json

root = Path(__file__).parent
template = (root / 'index.template.html').read_text(encoding='utf8')
styles = (root / 'styles.css').read_text(encoding='utf8')
app = (root / 'app.js').read_text(encoding='utf8')
profiles = (root / 'profiles.js').read_text(encoding='utf8')
data = json.loads((root / 'classes_data.json').read_text(encoding='utf8'))
specialties = json.loads((root / 'specialties.json').read_text(encoding='utf8'))
stigmas = json.loads((root / 'stigmas.json').read_text(encoding='utf8'))
js_data = 'const DATA=' + json.dumps(data, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const SPECS=' + json.dumps(specialties, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
js_data += 'const STIGMAS=' + json.dumps(stigmas, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
page = template.replace('/*STYLES*/', styles).replace('/*DATA*/', js_data).replace('/*PROFILES*/', profiles).replace('/*APP*/', app)
out = root / 'dist' / 'index.html'
out.write_text(page, encoding='utf8')
print(out, len(page), 'chars')
