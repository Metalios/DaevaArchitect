#!/usr/bin/env python3
"""Import source-verified AION 2 skill/Stigma/Specialty art from Wikily.

Creates assets/icons/manifest.json and locally stored client art. Does not
modify allocation mechanics, node coordinates, item data or game formulas.
Copyright: game art © NCSOFT. Source and attribution: wikily.gg/aion-2.
The build should not silently substitute fabricated artwork.
"""
from __future__ import annotations
import argparse, base64, concurrent.futures, html, json, re, sys, time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parent.parent
DEST=ROOT/'assets'/'icons'
CLASSES=('gladiator','templar','assassin','ranger','sorcerer','spiritmaster','cleric','chanter')
CATEGORIES=('active','passive','stigma')
BASE='https://wikily.gg/aion-2'
AGENT='Mozilla/5.0 (compatible; DaevaArchitectAssetAudit/1.0; skill art research)'
def request(url, max_size=800000):
    req=Request(url,headers={'User-Agent':AGENT,'Accept':'image/avif,image/webp,image/png,image/*;q=0.8,text/html;q=0.7'})
    with urlopen(req,timeout=22) as response:
        data=response.read(max_size+1)
        if len(data)>max_size:
            raise ValueError('asset larger than expected')
        return data

class SkillCards(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.current=None
        self.title=False
        self.items=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=='a' and 'ds-rcard--aeskill' in attrs.get('class',''):
            href=attrs.get('href','')
            if href.startswith('/aion-2/skills/'):
                self.current={'slug':href.rsplit('/',1)[-1],'name':'','img':None}
        if not self.current:return
        if tag=='b' and 'ds-rcard-title' in attrs.get('class',''):
            self.title=True
        if tag=='img' and not self.current['img']:
            self.current['img']=attrs.get('src','')
    def handle_data(self,data):
        if self.title and self.current:self.current['name']+=data
    def handle_endtag(self,tag):
        if tag=='b':self.title=False
        if tag=='a' and self.current is not None:
            if self.current['img'] and self.current['name']:
                self.items.append(self.current)
            self.current=None
def full_source(src):
    src=html.unescape(src)
    if src.startswith('https://media.wikily.gg/'):
        return src
    if src.startswith('https://img.wikily.gg/unsafe/'):
        encoded=src.split('/')[-1]
        try:
            decoded=base64.urlsafe_b64decode(encoded+'===').decode('utf-8')
        except Exception as e:
            raise ValueError('image proxy path cannot be decoded') from e
        if decoded.startswith('https://media.wikily.gg/'):
            return decoded
    raise ValueError('untrusted image URL')
def category_page(cls,category):
    url=f'{BASE}/classes/{cls}/{category}'
    markup=request(url,1500000).decode('utf-8','replace')
    p=SkillCards();p.feed(markup)
    # The expanded selected skill's five Specialty choices carry distinct
    # real game icon art, shared between this class's Active skill options.
    special=re.findall(r'class="ds-cat-inspector-lineicon"[^>]*>\s*<img[^>]*src="([^"]+)"',markup)
    return p.items,special,url,markup
def write_asset(job):
    dst,url=job
    if dst.exists() and dst.stat().st_size>1000:return True, str(dst), 'cached'
    try:
        data=request(url,1000000)
        if not (data.startswith(b'\x89PNG\r\n\x1a\n') or data.startswith(b'RIFF') or data.startswith(b'\xff\xd8')):
            raise ValueError('non-image response')
        dst.parent.mkdir(parents=True,exist_ok=True)
        dst.write_bytes(data)
        return True,str(dst),str(len(data))
    except Exception as e:
        return False,str(dst),str(e)[:160]
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--strict',action='store_true',help='fail when icon coverage is incomplete')
    args=ap.parse_args()
    DEST.mkdir(parents=True,exist_ok=True)
    manifest={'source':BASE,'attribution':'AION 2 game artwork © NCSOFT; source reference Wikily',
              'classes':{}}
    jobs={}
    for cls in CLASSES:
        class_data={'skills':{},'specialties':{},'counts':{}}
        for category in CATEGORIES:
            try:
                items,special,url,markup=category_page(cls,category)
            except Exception as e:
                print('WARNING',cls,category,'page failed:',e,file=sys.stderr)
                items,special,markup=[],[],''
            class_data['counts'][category]=len(items)
            if category=='stigma' and 'markup' in locals():
                emblem=re.search(r'https://media\.wikily\.gg/[^"<> ]+-ut_class_'+re.escape(cls)+r'_large\.png',markup)
                if emblem:
                    dest=DEST/cls/'emblem.png'
                    jobs[dest]=emblem.group(0)
                    class_data['emblem']='./assets/icons/'+cls+'/emblem.png'
            for entry in items:
                try:img_url=full_source(entry['img'])
                except ValueError:continue
                # Name lookup uses exact game-display names; duplicate slugs
                # (such as shared Defiance) are unique within class folders.
                slug=re.sub('[^a-z0-9-]','',entry['slug'].lower())
                dest=DEST/cls/(slug+'.png')
                jobs[dest]=img_url
                class_data['skills'][entry['name']]='./assets/icons/'+cls+'/'+slug+'.png'
            if category=='active':
                for idx,src in enumerate(special[:5],start=1):
                    try:source=full_source(src)
                    except ValueError:continue
                    dest=DEST/cls/f'specialty-{idx}.png'
                    jobs[dest]=source
                    class_data['specialties'][str(idx)]='./assets/icons/'+cls+f'/specialty-{idx}.png'
        manifest['classes'][cls]=class_data
    failures=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for success,dst,result in pool.map(write_asset,jobs.items()):
            if not success:failures.append((dst,result))
    # No manifest entries for missing images. A missing file should never
    # be presented as an image placeholder masquerading as game art.
    for cls,entry in manifest['classes'].items():
        if entry.get('emblem') and not (ROOT/entry['emblem'].replace('./','')).is_file():
            del entry['emblem']
        for name,src in list(entry['skills'].items()):
            if not (ROOT/src.replace('./','')).is_file():
                del entry['skills'][name]
        for number,src in list(entry['specialties'].items()):
            if not (ROOT/src.replace('./','')).is_file():
                del entry['specialties'][number]
    (DEST/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
    skillcount=sum(len(x['skills']) for x in manifest['classes'].values())
    stigmacheck=[]
    for cls,entry in manifest['classes'].items():
        stigmacheck.append(f'{cls} {entry["counts"]["stigma"]}/13')
    specialtycount=sum(len(x['specialties']) for x in manifest['classes'].values())
    print(f'Wikily icons: {skillcount}/280 skills, {specialtycount}/40 class option icons, failures={len(failures)}')
    print('Stigma pages:',', '.join(stigmacheck))
    for dst,err in failures[:12]:print('WARNING downloading',dst,err,file=sys.stderr)
    if args.strict and (skillcount<260 or specialtycount<36):
        print('ERROR: too many missing Wikily assets',file=sys.stderr)
        return 1
    return 0
if __name__=='__main__':
    sys.exit(main())
