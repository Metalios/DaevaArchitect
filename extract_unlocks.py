"""Refresh class skill unlock levels from Aion2Data's Global client tables."""
from pathlib import Path
import json
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).parent
classes = json.loads((ROOT / 'classes_data.json').read_text(encoding='utf8'))
result = {}
for slug, cls in classes.items():
    url = f'https://aion2data.com/classes/{slug}'
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, 'html.parser')
    unlocks = {}
    for row in soup.find('table').find_all('tr')[1:]:
        cells = row.find_all('td', recursive=False)
        if len(cells) < 2:
            continue
        name = cells[0].select_one('span.font-semibold')
        if name:
            unlocks[name.get_text(' ', strip=True)] = int(cells[1].get_text(' ', strip=True))
    expected = {skill['name'] for skill in cls['skills'].values()}
    if expected - unlocks.keys():
        raise ValueError(f'{slug}: missing {sorted(expected - unlocks.keys())}')
    result[slug] = {name: unlocks[name] for name in sorted(expected)}
    print(slug, len(result[slug]), 'skill unlocks')
(ROOT / 'skill_unlocks.json').write_text(json.dumps(result, indent=2, ensure_ascii=False) + '\n', encoding='utf8')

response = requests.get('https://aion2data.com/leveling', timeout=30)
response.raise_for_status()
table = BeautifulSoup(response.text, 'html.parser').find_all('table')[1]
rewards = {}
for row in table.find_all('tr')[1:]:
    cells = [cell.get_text(' ', strip=True) for cell in row.find_all('td', recursive=False)]
    if len(cells) < 7:
        continue
    level = int(cells[0])
    rewards[level] = dict(zip(('mastery', 'stigma', 'slots', 'crystals'),
                              (int(cells[index].replace(',', '')) for index in (3, 4, 5, 6))))
if len(rewards) != 45 or rewards[45] != {'mastery': 203, 'stigma': 29, 'slots': 4, 'crystals': 136}:
    raise ValueError('Unexpected Global level reward table')
(ROOT / 'level_rewards.json').write_text(json.dumps(rewards, indent=2) + '\n', encoding='utf8')
print('level rewards:', len(rewards), 'levels')
