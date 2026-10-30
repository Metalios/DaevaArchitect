"""Extract Global skill options and calculate default PvE choices locally.

Names are reconciled to the Global board tables. Option text and unlock levels
should be checked against the live tooltip after a patch.
"""
from pathlib import Path
import json

from bs4 import BeautifulSoup
import requests
from optimize_specialties import recommend_all
from optimize_board_progression import load_profiles


ROOT = Path(__file__).parent
DATA = json.loads((ROOT / 'classes_data.json').read_text(encoding='utf8'))
RENAMES = {
    'gladiator': {'Leaping Strike': 'Leaping Slam', 'Ankle Slash': 'Ankle Slice', 'Shock Release': 'Defiance'},
    'templar': {'Shock Release': 'Defiance'},
    'assassin': {'Heartcore': 'Heart Gore', 'Shadow Strike': 'Shadowstrike', 'Shock Release': 'Defiance'},
    'ranger': {'Dead Shot': 'Deadshot', 'Arrow Scatter Shot': 'Arrow Scattershot', 'Shock Release': 'Defiance'},
    'sorcerer': {'Bitter Cold Wind': 'Bittercold Wind', 'Flame Barrage': 'Flame Scattershot', 'Freeze': 'Frost', "Winter Shackles": "Winter's Shackles", 'Shock Release': 'Defiance'},
    'spiritmaster': {'Summon Water Spirit': 'Summon: Water Spirit', 'Summon Fire Spirit': 'Summon: Fire Spirit', 'Joint Curse': 'Jointstrike: Curse', 'Summon Wind Spirit': 'Summon: Wind Spirit', 'Rapid Scatter': 'Rapid Scattershot', 'Summon Earth Spirit': 'Summon: Earth Spirit', 'Soul Cry': "Soul's Cry", 'Shock Release': 'Defiance'},
    'cleric': {'Thunderbolt': 'Judgment Thunder', 'Judgment': 'Bolt', 'Lightning Barrage': 'Lightning Strike Scattershot', 'Shock Release': 'Defiance'},
    'chanter': {'Slaughter': 'Onslaught', 'Inexorable Blow': 'Incandescent Blow', 'Backdraft Crush': 'Impactful Crush', 'Headlong Blow': 'Heat Wave Blow', 'Tremor Crash': 'Tremor Crush', 'Shock Release': 'Defiance'},
}

def main():
    result = {}
    for slug, class_data in DATA.items():
        response = requests.get(f'https://aion2codex.com/guides/{slug}', timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        known = {value['name'] for value in class_data['skills'].values()}
        specs = {}
        for card in soup.select('article.guide-active-card'):
            heading = card.find('h4')
            if not heading:
                continue
            original_name = heading.get_text(' ', strip=True)
            name = RENAMES[slug].get(original_name, original_name)
            assert name in known, (slug, original_name, name)
            options = {}
            for option in card.select('li[data-guide-option]'):
                number = option.get('data-guide-option')
                text_span = option.find_all('span')[-1]
                text = ''.join(text_span.find_all(string=True, recursive=False)).strip()
                options[number] = text
            assert len(options) == 5, (slug, name, options)
            specs[name] = {'options': options}
        assert len(specs) == 12, (slug, len(specs))
        result[slug] = specs
        print(slug, len(specs), 'active specialties')
    recommend_all(result, load_profiles())
    (ROOT / 'specialties.json').write_text(json.dumps(result, separators=(',', ':'), ensure_ascii=False), encoding='utf8')


if __name__ == '__main__':
    main()
