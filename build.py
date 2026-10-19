from pathlib import Path
import json

root = Path(__file__).parent
template = (root / 'index.template.html').read_text(encoding='utf8')
styles = (root / 'styles.css').read_text(encoding='utf8')
app = (root / 'app.js').read_text(encoding='utf8')
data = {
    'boards': json.loads((root / 'boards.json').read_text(encoding='utf8'))[:4],
    'skills': json.loads((root / 'skills.json').read_text(encoding='utf8')),
    'stats': json.loads((root / 'stats.json').read_text(encoding='utf8')),
    'route': json.loads((root / 'route.json').read_text(encoding='utf8')),
}
js_data = 'const DATA=' + json.dumps(data, separators=(',',':'), ensure_ascii=False).replace('</','<\\/') + ';'
page = template.replace('/*STYLES*/', styles).replace('/*DATA*/', js_data).replace('/*APP*/', app)
out = root / 'dist' / 'index.html'
out.write_text(page, encoding='utf8')
print(out, len(page), 'chars')
