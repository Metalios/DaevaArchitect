from pathlib import Path
from urllib.request import Request, urlopen
import re, json, html, sys

target=Path('wikily_probe')
target.mkdir(exist_ok=True)
for name,url in [
  ('templar-stigma','https://wikily.gg/aion-2/classes/templar/stigma'),
  ('doom-shield','https://wikily.gg/aion-2/skills/doom-shield'),
  ('templar-active','https://wikily.gg/aion-2/classes/templar/active')
]:
 try:
  req=Request(url,headers={'User-Agent':'Mozilla/5.0 (compatible; DaevaArchitectIconAudit/1.0)', 'Accept':'text/html'})
  with urlopen(req,timeout=18) as r: content=r.read().decode('utf-8','replace')
  (target/(name+'.html')).write_text(content,encoding='utf8')
  print(name,'length',len(content),'images',len(re.findall(r'<img\\b',content)), 'wikily media',content.count('media.wikily.gg'))
  for term in ['Doom Shield','Noble Armor','Stigma','icon_te_skill_']:
   at=content.lower().find(term.lower())
   if at>=0:print(' TERM',term,'sample',re.sub(r'\\s+',' ',content[max(0,at-230):at+280])[:480])
  srcs=re.findall(r'<img\\b[^>]*>',content)
  print(' IMAGE_TAGS:',json.dumps(srcs[:10])[:2500])
 except Exception as e:
  print(name,'ERROR',type(e).__name__,str(e)[:250],file=sys.stderr)
