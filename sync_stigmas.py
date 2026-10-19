"""Extract current stigma descriptions and 5/10/15/20 breakpoints."""
from pathlib import Path
import json

from bs4 import BeautifulSoup
import requests

ROOT = Path(__file__).parent
CLASSES = ('gladiator', 'assassin', 'ranger', 'sorcerer', 'spiritmaster', 'cleric', 'chanter')
TEMPLAR = {
    'Noble Armor': {'base': 'HP and Defense buff; amplifies the tank support loop', 'perks': {'5': '+5% Defense', '10': 'Insulting Roar ×1.5', '15': 'Fury ×1.5', '20': '+10% Incoming Heal'}},
    'Shield of Protection': {'base': 'Active Block for a planned heavy hit and Fury trigger', 'perks': {'5': '+1 consecutive use', '10': 'Move while active', '15': '+20% Move Speed after Block', '20': 'Restore 10% HP on Block'}},
    'Taunt': {'base': 'Threat and Shrink debuff', 'perks': {'5': 'Shrink cuts PvE Damage Tolerance 10%', '10': 'Shrink cuts Attack 10% more', '15': '-5s cooldown', '20': 'Longer Taunt and Shrink'}},
    'Doom Shield': {'base': 'Shield charge, knockdown and Judgment trigger', 'perks': {'5': 'Resets Annihilate on hit', '10': '+200 Block for 5s on hit', '15': 'Resets cooldown on kill', '20': '+25% Knockdown Chance'}},
    'Battlefield Banner': {'base': 'Damage buff converting Defense into Attack', 'perks': {'5': '+10% Multi-Hit Chance', '10': '+10% Weapon Damage Boost', '15': '+20% Attack from Defense', '20': '-30s cooldown'}},
}


def main():
    result = {'templar': TEMPLAR}
    for slug in CLASSES:
        response = requests.get(f'https://aion2.grimvane.app/companion/wiki/{slug}-skills/', timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        tables = []
        for table in soup.find_all('table'):
            first = table.find('tr')
            if first and first.get_text(' ', strip=True).startswith('Stigma'):
                tables.append(table)
        assert tables
        stigmas = {}
        for row in tables[0].find_all('tr')[1:]:
            cells = [cell.get_text(' ', strip=True) for cell in row.find_all(['td', 'th'])]
            name = cells[0]
            if slug == 'gladiator':
                base, perks = cells[3], cells[5].split(' / ')
            elif slug in ('ranger', 'sorcerer'):
                base, perks = cells[2], cells[3].split(' / ')
            elif slug == 'chanter':
                base, perks = cells[3], []
            else:
                base, perks = cells[3], cells[4:8]
            if perks:
                assert len(perks) == 4, (slug, name, perks)
            stigmas[name] = {'base': base, 'perks': dict(zip(('5', '10', '15', '20'), perks))}
        if slug == 'chanter':
            assert len(tables) >= 2
            for row in tables[1].find_all('tr')[1:]:
                cells = [cell.get_text(' ', strip=True) for cell in row.find_all(['td', 'th'])]
                assert cells[0] in stigmas
                stigmas[cells[0]]['perks'] = dict(zip(('5', '10', '15', '20'), cells[1:5]))
        assert len(stigmas) == 13 and all(len(item['perks']) == 4 for item in stigmas.values()), (slug, len(stigmas))
        result[slug] = stigmas
        print(slug, len(stigmas), 'stigmas')
    (ROOT / 'stigmas.json').write_text(json.dumps(result, separators=(',', ':'), ensure_ascii=False), encoding='utf8')


if __name__ == '__main__':
    main()
