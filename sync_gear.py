"""Refresh the compact Global equipment index used by the static planner.

Source: https://aion2data.com/search.json (Global client extraction).
Item icons and data are © NCSOFT. See https://aion2data.com/creators.
"""
from datetime import datetime, timezone
from pathlib import Path
import json
import urllib.request

ROOT = Path(__file__).parent
SUBTYPES = {
    'Longsword', 'Greatsword', 'Dagger', 'Bow', 'Spellbook', 'Orb', 'Mace',
    'Staff', 'Guard', 'Helm', 'Pauldrons', 'Top', 'Legs', 'Gloves', 'Shoes',
    'Cloak', 'Necklace', 'Earrings', 'Ring', 'Bracelet', 'Amulet', 'Belt',
    'Rune', 'Chalice', 'Parchment', 'Compass', 'Bell', 'Mirror',
}
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
items.sort(key=lambda item: (item['type'], item['name'].casefold(), item['href']))
result = {
    'source': 'https://aion2data.com/search.json',
    'retrieved': datetime.now(timezone.utc).date().isoformat(),
    'clientVersion': client_version,
    'items': items,
}
path = ROOT / 'gear_catalog.json'
path.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'{len(items)} searchable Global equipment and wing entries -> {path}')
