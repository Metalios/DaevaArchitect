"""Refresh Azphel's Global client nodes, then calculate every class route.

The recommendation generator uses only the local class nodes, rotation profiles,
role values, and specialty gates. It does not copy third-party build routes.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import requests

from optimize_board_progression import main as calculate_routes

ROOT = Path(__file__).parent
CLASSES = ('gladiator', 'templar', 'assassin', 'ranger', 'sorcerer',
           'spiritmaster', 'cleric', 'chanter')


def main():
    azphel = {}
    for slug in CLASSES:
        response = requests.get(f'https://aion2data.com/daevanion/{slug}', timeout=30)
        response.raise_for_status()
        pieces = re.findall(
            r'self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)</script>',
            response.text,
        )
        text = ''.join(json.loads(piece) for piece in pieces)
        pos = text.index('"boards":') + len('"boards":')
        boards = json.JSONDecoder().raw_decode(text[pos:])[0]
        fifth = boards[4]
        assert fifth['name'] == 'Azphel' and fifth['totalCost'] == 232
        azphel[slug] = fifth
    (ROOT / 'azphel_data.json').write_text(
        json.dumps(azphel, ensure_ascii=False, separators=(',', ':')),
        encoding='utf8',
    )
    calculate_routes()


if __name__ == '__main__':
    main()
