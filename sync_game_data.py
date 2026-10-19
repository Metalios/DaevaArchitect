"""Refresh the compact Global class/board tables and connected PvE routes.

The four PvE boards come from Aion2Data's client 2.0.6.0 hotfix 1 tables.
Starter routes and per-node editorial weights come from Grimvane's class pages.
The continuation after each published starter budget is a greedy weighted route,
not a simulation or a measured optimum.
"""
from __future__ import annotations

from collections import defaultdict
from pathlib import Path
import heapq
import json
import re

from bs4 import BeautifulSoup
import requests


ROOT = Path(__file__).parent
CLASSES = ('gladiator', 'templar', 'assassin', 'ranger', 'sorcerer', 'spiritmaster', 'cleric', 'chanter')
BOARD_NAMES = ('Nezekan', 'Zikel', 'Vaizel', 'Triniel')
STAT_KEYS = {
    'Attack Bonus': 'FixingDamage', 'Critical Hit': 'Critical',
    'Critical Hit Resist': 'CriticalResist', 'Defense Bonus': 'Defense',
    'HP': 'HPMax', 'MP': 'MPMax', 'Combat Speed': 'CombatSpeed',
    'Cooldown Reduction': 'CoolTimeDecrease', 'Damage Boost': 'AmplifyAllDamage',
    'Damage Tolerance': 'DecreaseDamage',
    'Critical Damage Boost': 'AmplifyCriticalDamage',
    'Critical Damage Tolerance': 'DecreaseCriticalDamage',
    'Multi-Hit Chance': 'AdditionalHitRate',
    'Multi-Hit Resist': 'AdditionalHitResistRate',
}


def get(url: str) -> str:
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    return response.text


def client_data(slug: str) -> dict:
    html = get(f'https://aion2data.com/daevanion/{slug}')
    pieces = re.findall(r'self\.__next_f\.push\(\[1,("(?:\\.|[^"\\])*")\]\)</script>', html)
    text = ''.join(json.loads(piece) for piece in pieces)
    decoder = json.JSONDecoder()
    result = {}
    for field in ('boards', 'stats', 'skills'):
        start = text.index(f'"{field}":') + len(field) + 3
        result[field], _ = decoder.raw_decode(text[start:])
    result['boards'] = result['boards'][:4]
    assert [b['name'] for b in result['boards']] == list(BOARD_NAMES)
    assert sum(b['totalCost'] for b in result['boards']) == 570
    return result


def guide_data(slug: str, boards: list[dict]) -> tuple[list[dict], dict, dict, int]:
    soup = BeautifulSoup(get(f'https://aion2.grimvane.app/companion/wiki/daevanion-{slug}/'), 'html.parser')
    node_by_position = {
        board['name']: {(node[1], node[2]): node for node in board['nodes']}
        for board in boards
    }
    route = []
    totals = {}
    for heading in soup.find_all(['h2', 'h3', 'h4']):
        title = heading.get_text(' ', strip=True)
        match = re.match(r'^(Nezekan|Zikel|Vaizel|Triniel)(?:\s+takes|:)\s+(\d+)\s+points?\s+in\s+(\d+)\s+clicks?', title)
        if not match:
            continue
        board, total, count = match.group(1), int(match.group(2)), int(match.group(3))
        table = heading.find_next('table')
        assert table is not None
        rows = table.find_all('tr')[1:]
        assert len(rows) == count, (slug, board, len(rows), count)
        subtotal = 0
        for number, row in enumerate(rows, 1):
            cells = [cell.get_text(' ', strip=True) for cell in row.find_all(['td', 'th'])]
            assert int(cells[0]) == number, (slug, board, cells)
            cost = int(cells[2])
            offset = dict.fromkeys(('up', 'down', 'left', 'right'), 0)
            for steps, direction in re.findall(r'(\d+)\s+(up|down|left|right)', cells[4]):
                offset[direction] = int(steps)
            position = (8 + offset['down'] - offset['up'], 8 + offset['right'] - offset['left'])
            node = node_by_position[board].get(position)
            assert node is not None and node[5] == cost, (slug, board, number, cells, position, node)
            route.append({'board': board, 'id': node[0]})
            subtotal += cost
        assert subtotal == total, (slug, board, subtotal, total)
        totals[board] = total
    assert set(totals) == set(BOARD_NAMES), (slug, totals)

    weights = {'skills': {}, 'stats': {}}
    column = 2 if slug == 'chanter' else 1
    for table in soup.find_all('table'):
        rows = table.find_all('tr')
        if not rows:
            continue
        first = rows[0].get_text(' ', strip=True)
        kind = 'skills' if first.startswith('Skill (per level)') else 'stats' if first.startswith('Stat (per typical node)') else None
        if kind is None:
            continue
        for row in rows[1:]:
            cells = [cell.get_text(' ', strip=True) for cell in row.find_all(['td', 'th'])]
            if len(cells) <= column:
                continue
            try:
                weight = float(cells[column])
            except ValueError:
                continue
            key = cells[0]
            if kind == 'stats':
                key = next((value for name, value in STAT_KEYS.items() if key.startswith(name + ' +')), None)
            if key:
                weights[kind][key] = weight
    assert len(weights['skills']) >= 20, (slug, weights)
    assert len(weights['stats']) >= 10, (slug, weights)
    return route, weights['skills'], weights['stats'], sum(totals.values())


def connected_route(boards: list[dict], starter: list[dict], skill_names: dict, skill_weights: dict, stat_weights: dict) -> list[dict]:
    board_names = tuple(board['name'] for board in boards)
    board_by_name = {board['name']: board for board in boards}
    node_by_id = {node[0]: node for board in boards for node in board['nodes']}
    graphs = {}
    owned = {name: set() for name in board_names}
    for board in boards:
        nodes = {node[0]: node for node in board['nodes']}
        positions = {(node[1], node[2]): node[0] for node in board['nodes']}
        adjacency = {
            node[0]: [positions[p] for p in ((node[1]-1, node[2]), (node[1]+1, node[2]), (node[1], node[2]-1), (node[1], node[2]+1)) if p in positions]
            for node in board['nodes']
        }
        graphs[board['name']] = (nodes, adjacency)
        owned[board['name']].update(node[0] for node in board['nodes'] if node[5] == 0)

    def validate(item: dict, step: int):
        name, node_id = item['board'], item['id']
        nodes, adjacency = graphs[name]
        assert node_id not in owned[name] and any(parent in owned[name] for parent in adjacency[node_id]), (name, step, node_id)
        owned[name].add(node_id)

    for index, item in enumerate(starter, 1):
        validate(item, index)

    def value(node: list) -> float:
        if not node[6]:
            return 0
        key = node[6][0][0]
        if isinstance(key, int):
            return skill_weights.get(skill_names.get(str(key), ''), 0.5)
        return stat_weights.get(key, 0.25)

    def paths(name: str):
        nodes, adjacency = graphs[name]
        frontier = [(0, node_id) for node_id in owned[name]]
        heapq.heapify(frontier)
        distance = {node_id: 0 for node_id in owned[name]}
        parent = {}
        while frontier:
            cost, node_id = heapq.heappop(frontier)
            if cost != distance[node_id]:
                continue
            for neighbor in adjacency[node_id]:
                new_cost = cost + (0 if neighbor in owned[name] else nodes[neighbor][5])
                if new_cost < distance.get(neighbor, 10**9):
                    distance[neighbor] = new_cost
                    parent[neighbor] = node_id
                    heapq.heappush(frontier, (new_cost, neighbor))
        for target in nodes:
            if target in owned[name]:
                continue
            path = []
            node_id = target
            while node_id in parent:
                if node_id not in owned[name]:
                    path.append(node_id)
                node_id = parent[node_id]
            yield target, list(reversed(path))

    route = list(starter)
    while any(len(owned[name]) < len(graphs[name][0]) for name in board_names):
        best = None
        for name in board_names:
            for target, path in paths(name):
                if not path:
                    continue
                cost = sum(node_by_id[node_id][5] for node_id in path)
                reward = sum(value(node_by_id[node_id]) for node_id in path)
                score = reward / cost + value(node_by_id[target]) / (cost * 20)
                candidate = (score, -cost, -target, name, path)
                if best is None or candidate[:3] > best[:3]:
                    best = candidate
        assert best is not None
        name, path = best[3], best[4]
        for node_id in path:
            if node_id not in owned[name]:
                item = {'board': name, 'id': node_id}
                validate(item, len(route)+1)
                route.append(item)
    assert sum(node_by_id[item['id']][5] for item in route) == sum(board['totalCost'] for board in boards)
    return route


def main():
    result = {}
    for slug in CLASSES:
        data = client_data(slug)
        if slug == 'templar':
            # Preserve the existing reviewed 149-point hybrid route and continuation.
            starter = json.loads((ROOT / 'route149.json').read_text(encoding='utf8'))
            route = json.loads((ROOT / 'route.json').read_text(encoding='utf8'))
            skill_weights = {}
            stat_weights = {}
            starter_cost = 149
        else:
            starter, skill_weights, stat_weights, starter_cost = guide_data(slug, data['boards'])
            if slug == 'chanter':
                # The published first route is a damage path. Build the healer
                # route from the healer skill/stat weights instead.
                starter, starter_cost = [], 0
            names = {key: value['name'] for key, value in data['skills'].items()}
            route = connected_route(data['boards'], starter, names, skill_weights, stat_weights)
        result[slug] = {
            'boards': data['boards'], 'skills': data['skills'], 'stats': data['stats'],
            'route': route, 'starterCost': starter_cost,
            'skillWeights': skill_weights, 'statWeights': stat_weights,
            'sources': {
                'nodes': f'https://aion2data.com/daevanion/{slug}',
                'route': f'https://aion2.grimvane.app/companion/wiki/daevanion-{slug}/',
            },
        }
        print(slug, len(data['skills']), len(route), starter_cost, '->', 570)
    (ROOT / 'classes_data.json').write_text(json.dumps(result, separators=(',', ':'), ensure_ascii=False), encoding='utf8')


if __name__ == '__main__':
    main()
