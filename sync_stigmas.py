"""Extract current stigma descriptions and 5/10/15/20 breakpoints."""
from pathlib import Path
import json
import re
from concurrent.futures import ThreadPoolExecutor

from bs4 import BeautifulSoup
import requests

ROOT = Path(__file__).parent
CLASSES = ('gladiator', 'assassin', 'ranger', 'sorcerer', 'spiritmaster', 'cleric', 'chanter')


def fetch_templar_stigmas():
    """Read all 13 Stigmas and their level perks from Global client tables."""
    root = 'https://aion2data.com'
    page = BeautifulSoup(requests.get(f'{root}/classes/templar', timeout=30).text, 'html.parser')
    links = [(a.get_text(' ', strip=True).removesuffix(' Stigma'), root + a['href'])
             for a in page.select('a[href^="/skills/"]')
             if a.get_text(' ', strip=True).endswith('Stigma')]
    assert len(links) == 13 and len({name for name, _ in links}) == 13, links

    def read_skill(item):
        name, url = item
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        sections = {h.get_text(' ', strip=True).split(' (')[0]: h.parent for h in soup.select('h2')}
        description = sections['Description'].find('div', recursive=False).find('div').get_text(' ', strip=True)
        description = re.sub(r'^Skill level \d+ / \d+ ', '', description)
        description = re.sub(r'\s+', ' ', description).replace('Ã—', '×').strip()
        cards = sections['Specializations'].find('div', recursive=False).find('div').find_all('div', recursive=False)
        assert len(cards) == 4, (name, len(cards))
        perks = {str(rank): re.sub(r'^Skill level \d+ ', '', card.get_text(' ', strip=True))
                 for rank, card in zip((5, 10, 15, 20), cards)}
        return name, {'base': description, 'perks': perks}

    with ThreadPoolExecutor(max_workers=5) as pool:
        result = dict(pool.map(read_skill, links))
    return result


def main():
    result = {'templar': fetch_templar_stigmas()}
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
