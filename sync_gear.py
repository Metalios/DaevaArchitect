"""Refresh the compact Global equipment index used by the static planner.

Source: https://aion2data.com/search.json (Global client extraction).
Item icons and data are © NCSOFT. See https://aion2data.com/creators.
"""
from datetime import datetime, timezone
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
import json
import urllib.request

ROOT = Path(__file__).parent
SUBTYPES = {
    'Longsword', 'Greatsword', 'Dagger', 'Bow', 'Spellbook', 'Orb', 'Mace',
    'Staff', 'Guard', 'Helm', 'Pauldrons', 'Top', 'Legs', 'Gloves', 'Shoes',
    'Cloak', 'Necklace', 'Earrings', 'Ring', 'Bracelet', 'Amulet', 'Belt',
    'Rune', 'Chalice', 'Parchment', 'Compass', 'Bell', 'Mirror',
}


class ItemTableParser(HTMLParser):
    """Read the game's grade, level, faction and fixed stats from category rows."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.in_table = False
        self.in_head = False
        self.in_body = False
        self.cell = None
        self.headers = []
        self.row = None
        self.rows = []

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        if tag == 'table' and 'data' in attrs.get('class', '').split():
            self.in_table = True
        if not self.in_table:
            return
        if tag == 'thead':
            self.in_head = True
        elif tag == 'tbody':
            self.in_body = True
        elif tag == 'tr' and self.in_body:
            self.row = {'href': '', 'grade': '', 'faction': '', 'cells': []}
        elif tag in ('th', 'td') and (self.in_head or self.row is not None):
            self.cell = []
        if self.row is not None:
            if tag == 'a' and attrs.get('href', '').startswith('/items/'):
                self.row['href'] = attrs['href']
            elif tag == 'span' and attrs.get('data-grade'):
                self.row['grade'] = attrs['data-grade']
            elif tag == 'span':
                classes = attrs.get('class', '').split()
                if 'chip-elyos' in classes:
                    self.row['faction'] = 'elyos'
                elif 'chip-asmo' in classes or 'chip-asmodian' in classes:
                    self.row['faction'] = 'asmodian'

    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)

    def handle_endtag(self, tag):
        if tag in ('th', 'td') and self.cell is not None:
            value = ' '.join(''.join(self.cell).split())
            if self.in_head:
                self.headers.append(value.replace(' ↓', '').replace(' ↑', ''))
            elif self.row is not None:
                self.row['cells'].append(value)
            self.cell = None
        elif tag == 'tr' and self.row is not None:
            self.rows.append(self.row)
            self.row = None
        elif tag == 'thead':
            self.in_head = False
        elif tag == 'tbody':
            self.in_body = False
        elif tag == 'table':
            self.in_table = False


def item_details(subtype):
    url = f'https://aion2data.com/items/c/{subtype.lower()}'
    req = urllib.request.Request(url, headers={'User-Agent': 'DaevaArchitect/1.0 (static planner)'})
    with urllib.request.urlopen(req, timeout=30) as response:
        parser = ItemTableParser()
        parser.feed(response.read().decode('utf-8'))
    if parser.headers[2:5] != ['Grade', 'Item level', 'Req. level'] or not parser.rows:
        raise ValueError(f'Unexpected Global category table at {url}')
    result = {}
    for row in parser.rows:
        cells = row['cells']
        if not row['href'] or len(cells) < 5:
            continue
        stats = [{'name': name, 'value': value} for name, value in zip(parser.headers[5:], cells[5:]) if name and value and value != '—']
        result[row['href']] = {
            'grade': cells[2] or row['grade'],
            'itemLevel': int(cells[3].replace(',', '')),
            'requiredLevel': int(cells[4].replace(',', '')),
            'faction': row['faction'],
            'fixedStats': stats,
        }
    return result


req = urllib.request.Request('https://aion2data.com/search.json', headers={'User-Agent': 'DaevaArchitect/1.0 (static planner)'})
with urllib.request.urlopen(req, timeout=30) as response:
    search = json.load(response)
with urllib.request.urlopen('https://aion2data.com/tooltip/items/110120003-ludras-blade-of-extinction', timeout=30) as response:
    client_version = json.load(response).get('version', 'unknown')
items = []
for entry in search:
    href = entry.get('href', '')
    subtype = entry.get('sub', '')
    if (href.startswith('/items/') and subtype in SUBTYPES) or href.startswith('/wings/'):
        items.append({
            'name': entry['label'], 'type': 'Wing' if href.startswith('/wings/') else subtype,
            'href': href, 'icon': entry.get('icon', ''),
        })
with ThreadPoolExecutor(max_workers=3) as pool:
    category_details = {}
    for details in pool.map(item_details, sorted(SUBTYPES)):
        category_details.update(details)
enriched = 0
for item in items:
    details = category_details.get(item['href'])
    if details:
        item.update(details)
        enriched += 1
equipment_count = sum(item['type'] != 'Wing' for item in items)
if enriched < equipment_count * .98:
    raise ValueError(f'Only {enriched} of {equipment_count} Global equipment items had grade and level metadata')
items.sort(key=lambda item: (item['type'], item['name'].casefold(), item['href']))
result = {
    'source': 'https://aion2data.com/search.json',
    'metadataSource': 'https://aion2data.com/items/c/<type>',
    'retrieved': datetime.now(timezone.utc).date().isoformat(),
    'clientVersion': client_version,
    'items': items,
}
path = ROOT / 'gear_catalog.json'
path.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'{len(items)} searchable Global equipment and wing entries; {enriched} with grade and level metadata -> {path}')
