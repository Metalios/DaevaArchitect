"""Generate distinct connected Global PvE/PvP routes from published class weights.

The published guide's first PvE route remains the group/default route. Other
routes are weighted planner recommendations, never claimed as game optima.
"""
from __future__ import annotations

import json
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from sync_game_data import CLASSES, STAT_KEYS, connected_route, client_data

ROOT = Path(__file__).parent
PVPS = {'PvP Attack':'PvPAddDamage','PvP Defense':'PvPDamageDefense',
        'PvP Critical Hit':'PvPCritical','PvP Critical Hit Resist':'PvPCriticalResist',
        'PvP Accuracy':'PvPAccuracy','PvP Evasion':'PvPEvasion',
        'Status Effect Chance':'AbnormalAccuracy','Status Effect Resist':'AbnormalResistance',
        'PvP Damage Boost':'PvPAmplifyDamage','PvP Damage Tolerance':'PvPDecreaseDamage'}

def weights(slug):
    response=requests.get(f'https://aion2.grimvane.app/companion/wiki/daevanion-{slug}/',timeout=30)
    response.raise_for_status()
    soup=BeautifulSoup(response.text,'html.parser')
    result={}
    for table in soup.find_all('table'):
        rows=table.find_all('tr')
        if not rows: continue
        header=[x.get_text(' ',strip=True) for x in rows[0].find_all(['th','td'])]
        if not header or not (header[0].startswith('Skill (per level)') or header[0].startswith('Stat (per typical node)')): continue
        kind='skills' if header[0].startswith('Skill') else 'stats'
        result[kind]={h:{} for h in header[1:]}
        for row in rows[1:]:
            cells=[x.get_text(' ',strip=True) for x in row.find_all(['th','td'])]
            if not cells: continue
            key=cells[0]
            if kind=='stats':
                key=next((value for label,value in {**STAT_KEYS,**PVPS}.items() if key.startswith(label+' +')),None)
            if not key: continue
            for col,h in enumerate(header[1:],1):
                try: result[kind][h][key]=float(cells[col])
                except (ValueError,IndexError): pass
    return result

def choose(slug, w):
    labels=list(w['skills'])
    pvp=next(x for x in labels if 'PvP' in x)
    if slug=='templar': return labels[1],labels[2]
    if slug=='gladiator': return labels[1],pvp
    if slug=='sorcerer': return labels[1],pvp
    if slug=='cleric': return labels[1],pvp
    if slug=='chanter': return labels[0],pvp
    return None,pvp

def adjust_solo(skills,stats):
    skills=dict(skills);stats=dict(stats)
    for key,boost in {'HPMax':2.0,'Defense':1.5,'CriticalResist':1.0,
                      'DecreaseDamage':5.0,'CoolTimeDecrease':1.5}.items():
        stats[key]=stats.get(key,0)+boost
    for name in skills:
        if any(word in name.lower() for word in ('heal','shield','defense','armor','survival','block','evasion','protection','recovery','guard')):
            skills[name]+=2.0
    return skills,stats

def main():
    existing=json.loads((ROOT/'classes_data.json').read_text(encoding='utf8'))
    azphel={};routes={}
    for slug in CLASSES:
        data=client_data(slug)
        response=requests.get(f'https://aion2data.com/daevanion/{slug}',timeout=30)
        response.raise_for_status()
        # client_data currently returns only the four PvE boards; get the fifth
        import re
        pieces=re.findall(r'self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)</script>',response.text)
        text=''.join(json.loads(piece) for piece in pieces)
        pos=text.index('"boards":')+len('"boards":')
        allboards=json.JSONDecoder().raw_decode(text[pos:])[0]
        fifth=allboards[4]
        assert fifth['name']=='Azphel' and fifth['totalCost']==232
        azphel[slug]=fifth
        w=weights(slug)
        solo_label,pvp_label=choose(slug,w)
        if slug=='templar':
            solo_skills,solo_stats=adjust_solo(w['skills'][list(w['skills'])[0]],w['stats'][list(w['stats'])[0]])
        elif solo_label:
            solo_skills=w['skills'][solo_label];solo_stats=w['stats'][solo_label]
        else:
            solo_skills,solo_stats=adjust_solo(existing[slug]['skillWeights'],existing[slug]['statWeights'])
        pvp_skills=w['skills'][pvp_label];pvp_stats=w['stats'][pvp_label]
        names={key:value['name'] for key,value in data['skills'].items()}
        # Keep the screenshot-reviewed Templar hybrid as the default Group path.
        group_route=existing[slug]['route']
        solo_route=connected_route(data['boards'][:4],[],names,solo_skills,solo_stats)
        pvp_route=connected_route(data['boards'][:4],[],names,pvp_skills,pvp_stats)
        az_stats={k:v for k,v in pvp_stats.items() if k.startswith('PvP') or k.startswith('Abnormal') or k in ('HPMax','MPMax')}
        az_route=connected_route([fifth],[],names,{},az_stats)
        routes[slug]={'party':group_route,'solo':solo_route,'pvp':pvp_route,'azphel':az_route,
                      'weights':{'party':{'skills':w['skills'][list(w['skills'])[0]],'stats':w['stats'][list(w['stats'])[0]]} if slug=='templar' else {'skills':existing[slug]['skillWeights'],'stats':existing[slug]['statWeights']},'solo':{'skills':solo_skills,'stats':solo_stats},'pvp':{'skills':pvp_skills,'stats':pvp_stats}},
                      'methods':{'party':'published tank/DPS hybrid route plus weighted continuation' if slug=='templar' else 'published PvE route plus weighted continuation',
                                 'solo':'generated from hybrid weights with personal survival adjustments' if slug=='templar' else ('generated from published solo/damage weights' if solo_label else 'generated from PvE weights with survival adjustments'),
                                 'pvp':'generated from published PvP weights','azphel':'generated from published PvP stat weights'}}
        print(slug,'done',flush=True)
    (ROOT/'azphel_data.json').write_text(json.dumps(azphel,separators=(',',':'),ensure_ascii=False),encoding='utf8')
    (ROOT/'context_routes.json').write_text(json.dumps(routes,separators=(',',':'),ensure_ascii=False),encoding='utf8')

if __name__=='__main__': main()
