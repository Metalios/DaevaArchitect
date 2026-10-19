"""Build connected board progressions for every Global class and play context.

The scores rank rotation skills, attainable specialty breakpoints, and role stats.
They are planning preferences, not measured DPS or a mathematical optimum. Each
crystal total uses a prefix of a full connected purchase order, so a 3-point
tile can require saving a crystal or two before the next click.
"""
from __future__ import annotations

import heapq
import json
import subprocess
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent

# Templar role adjustments supplement the class-agnostic rotation/hotbar model.
# No external build route or guide weight is an input to this optimizer.
SKILLS = {
    'party': {'Judgment': 35, 'Pummel': 32, 'Vicious Strike': 32, 'Punishment': 30,
              'Insulting Roar': 17, 'Fury': 17, 'Warding Strike': 12,
              'Shield Smite': 7, 'Impact Hit': 7, 'Annihilate': 7,
              'Punishing Benediction': 6, 'Warding Shield': 6},
    'solo': {'Pummel': 25, 'Judgment': 22, 'Punishment': 23,
             'Vicious Strike': 21, 'Annihilate': 18, 'Fury': 12,
             'Insulting Roar': 11, 'Warding Strike': 9,
             'Shield Smite': 7, 'Impact Hit': 6},
    'pvp': {'Judgment': 23, 'Pummel': 20, 'Vicious Strike': 20,
            'Punishment': 17, 'Insulting Roar': 12, 'Fury': 12,
            'Shield Rush': 16, 'Poach': 14, 'Warding Strike': 9},
}

# Typical one-node effects, not raw stat units. These are editable model weights.
STATS = {
    'party': {'FixingDamage': 4, 'AmplifyAllDamage': 48,
              'CoolTimeDecrease': 38, 'CombatSpeed': 34, 'DecreaseDamage': 48,
              'HPMax': 3, 'Defense': 3, 'Critical': 3,
              'CriticalResist': 2, 'AdditionalHitRate': 5,
              'AmplifyCriticalDamage': 4, 'HealBoost': 3, 'MPMax': .4},
    'solo': {'FixingDamage': 5, 'AmplifyAllDamage': 55,
             'CoolTimeDecrease': 35, 'CombatSpeed': 35, 'DecreaseDamage': 36,
             'HPMax': 3, 'Defense': 2, 'Critical': 4,
             'CriticalResist': 1, 'AdditionalHitRate': 5,
             'AmplifyCriticalDamage': 5, 'HealBoost': 2, 'MPMax': .4},
    'pvp': {'FixingDamage': 2, 'AmplifyAllDamage': 20,
            'CoolTimeDecrease': 36, 'CombatSpeed': 36, 'DecreaseDamage': 40,
            'HPMax': 4, 'Defense': 3, 'Critical': 2,
            'CriticalResist': 4, 'AdditionalHitRate': 3,
            'PvPAddDamage': 8, 'PvPDamageDefense': 9,
            'PvPCritical': 5, 'PvPCriticalResist': 6,
            'PvPAccuracy': 5, 'PvPEvasion': 5,
            'AbnormalAccuracy': 4, 'AbnormalResistance': 5,
            'PvPAmplifyDamage': 55, 'PvPDecreaseDamage': 58,
            'MPMax': .4},
}

def load_profiles():
    script = (
        "const fs=require('fs'),vm=require('vm');"
        "const text=fs.readFileSync('js/profiles.js','utf8');"
        "process.stdout.write(JSON.stringify(vm.runInNewContext(text+'\\nPROFILES')));"
    )
    output = subprocess.check_output(['node', '-e', script], cwd=ROOT, text=True)
    return json.loads(output)


def skill_weights(slug: str, profile: dict, skills: dict, context: str):
    names = [s['name'] for s in skills.values()]
    active = set(names[:12])
    values = {name: 4.0 if name in active else 5.0 for name in names}
    values[profile['weave']] += 20
    for stack_index, stack in enumerate(profile['stacks']):
        for position, name in enumerate(stack['skills']):
            if name in values:
                values[name] += (10 if stack.get('manual') else 20) - 2 * stack_index - position
    for slot_skills, _, tone in profile['hotbar']:
        for name in slot_skills:
            if name not in values:
                continue
            by_tone = {
                'heal': 29 if profile['kind'] == 'healer' and context == 'party' else 19,
                'attack': 16 if context != 'pvp' else 13,
                'buff': 12, 'defense': 13 if context != 'solo' else 9,
                'movement': 13 if context == 'pvp' else 5,
                'utility': 9 if context == 'pvp' else 5,
                'emergency': 15,
            }
            values[name] += by_tone.get(tone, 5)
    text = ' '.join([profile['summary'], profile['rule'], *profile['opener'], *profile['loop']]).lower()
    for name in names:
        values[name] += min(8, text.count(name.lower()) * 2)
        lower = name.lower()
        if name not in active:
            if profile['kind'] == 'healer' and any(word in lower for word in
                                                 ('heal','recovery','regeneration','protection','circle','blessing')):
                values[name] += 12 if context == 'party' else 7
            if slug in ('templar','gladiator') and any(word in lower for word in
                                                      ('health','shield','block','defense','roar','fury')):
                values[name] += 9 if context == 'party' else 5
            if any(word in lower for word in ('damage','critical','attack','concentration','fury','mark')):
                values[name] += 5
    if slug == 'templar':
        values = {name: SKILLS[context].get(name, min(value, 14))
                  for name, value in values.items()}
    return values


def stat_weights(slug: str, profile: dict, context: str):
    if slug == 'templar':
        return dict(STATS[context])
    healer = profile['kind'] == 'healer'
    off_tank = slug == 'gladiator'
    values = {
        'FixingDamage': 4 if not healer else 2,
        'Critical': 3 if not healer else 1,
        'CriticalResist': 2,
        'Defense': 3 if healer or off_tank else 2,
        'HPMax': 4 if healer or off_tank else 3,
        'MPMax': 1 if healer else .5,
        'CombatSpeed': 38 if not healer else 33,
        'CoolTimeDecrease': 40 if not healer else 45,
        'AmplifyAllDamage': 52 if not healer else 23,
        'DecreaseDamage': 38 if healer or off_tank else 25,
        'AmplifyCriticalDamage': 31 if not healer else 12,
        'DecreaseCriticalDamage': 22 if healer or off_tank else 12,
        'AdditionalHitRate': 27 if not healer else 13,
        'AdditionalHitResistRate': 22 if healer or off_tank else 12,
        'PvPAddDamage': 4, 'PvPDamageDefense': 5,
        'PvPCritical': 3, 'PvPCriticalResist': 4,
        'PvPAccuracy': 3, 'PvPEvasion': 4,
        'AbnormalAccuracy': 3, 'AbnormalResistance': 4,
        'PvPAmplifyDamage': 24, 'PvPDecreaseDamage': 28,
    }
    if context == 'solo':
        values['AmplifyAllDamage'] += 6
        values['DecreaseDamage'] -= 8
        values['HPMax'] -= 1
    elif context == 'pvp':
        values['AmplifyAllDamage'] = 22
        values['DecreaseDamage'] = 34
        values['CriticalResist'] += 2
        values['PvPAddDamage'] = 7
        values['PvPDamageDefense'] = 8
        values['PvPAmplifyDamage'] = 55
        values['PvPDecreaseDamage'] = 58
        values['AbnormalResistance'] = 7
    return values


def base_ranks(skill_weights_map: dict):
    ordered = sorted(skill_weights_map, key=lambda name: -skill_weights_map[name])
    result = {name: 10 if i < 8 else 8 if i < 16 else 6
              for i, name in enumerate(ordered)}
    return result


def calculate(boards: list[dict], skill_names: dict[str, str],
              skill_weights_map: dict, stat_weights_map: dict,
              ranks: dict) -> list[dict]:
    graphs = {}
    owned = {}
    by_id = {}
    for board in boards:
        nodes = {node[0]: node for node in board['nodes']}
        positions = {(node[1], node[2]): node[0] for node in board['nodes']}
        adjacent = {node[0]: [positions[p] for p in
                              ((node[1]-1, node[2]), (node[1]+1, node[2]),
                               (node[1], node[2]-1), (node[1], node[2]+1))
                              if p in positions] for node in board['nodes']}
        graphs[board['name']] = (nodes, adjacent)
        owned[board['name']] = {n[0] for n in board['nodes'] if n[5] == 0}
        by_id.update(nodes)
    bonuses = Counter()

    def routes(name):
        nodes, adjacent = graphs[name]
        queue = [(0, start) for start in owned[name]]
        heapq.heapify(queue)
        distance = {start: 0 for start in owned[name]}
        parent = {}
        while queue:
            cost, node_id = heapq.heappop(queue)
            if cost != distance[node_id]:
                continue
            for near in adjacent[node_id]:
                total = cost + (0 if near in owned[name] else nodes[near][5])
                if total < distance.get(near, 10**9):
                    distance[near] = total
                    parent[near] = node_id
                    heapq.heappush(queue, (total, near))
        for target in nodes:
            if target in owned[name]:
                continue
            path = []
            here = target
            while here not in owned[name]:
                path.append(here)
                here = parent[here]
            yield list(reversed(path))

    def reward(path):
        value = 0.0
        added = Counter()
        for node_id in path:
            for key, amount in by_id[node_id][6]:
                if isinstance(key, int):
                    name = skill_names[str(key)]
                    value += skill_weights_map.get(name, 1.5) * amount
                    before = ranks.get(name, 8) + bonuses[name] + added[name]
                    after = before + amount
                    # Effective 12 and 16 unlock important specialty choices.
                    for gate, bonus in ((12, 9), (16, 13)):
                        if before < gate <= after:
                            value += bonus
                    added[name] += amount
                else:
                    value += stat_weights_map.get(key, 1.5)
        return value

    route = []
    while any(len(owned[name]) < len(graphs[name][0]) for name in graphs):
        best = None
        for name in graphs:
            for path in routes(name):
                cost = sum(by_id[node_id][5] for node_id in path)
                score = reward(path) / cost
                # Stable preference for the shorter path when benefits tie.
                candidate = (score, -cost, -path[-1], name, path)
                if best is None or candidate[:3] > best[:3]:
                    best = candidate
        assert best is not None
        name, path = best[3:]
        goal = path[-1]
        for node_id in path:
            assert any(near in owned[name] for near in graphs[name][1][node_id])
            owned[name].add(node_id)
            for key, amount in by_id[node_id][6]:
                if isinstance(key, int):
                    bonuses[skill_names[str(key)]] += amount
            route.append({'board': name, 'id': node_id, 'goal': goal})
    assert sum(by_id[x['id']][5] for x in route) == sum(b['totalCost'] for b in boards)
    return route


def main():
    classes = json.loads((ROOT / 'classes_data.json').read_text(encoding='utf8'))
    routes = json.loads((ROOT / 'context_routes.json').read_text(encoding='utf8'))
    azphel = json.loads((ROOT / 'azphel_data.json').read_text(encoding='utf8'))
    profiles = load_profiles()
    method = ('calculated connected route from this planner’s rotation use, '
              'role stat values, and effective skill rank 12/16 breakpoints')
    for slug, data in classes.items():
        names = {key: value['name'] for key, value in data['skills'].items()}
        profile = profiles[slug]
        for context in ('party', 'solo', 'pvp'):
            skills = skill_weights(slug, profile, data['skills'], context)
            stats = stat_weights(slug, profile, context)
            ranks = base_ranks(skills)
            routes[slug][context] = calculate(data['boards'], names, skills, stats, ranks)
            routes[slug]['weights'][context] = {'skills': skills, 'stats': stats}
            routes[slug]['methods'][context] = method
        pvp_stats = stat_weights(slug, profile, 'pvp')
        routes[slug]['azphel'] = calculate([azphel[slug]], names, {}, pvp_stats, {})
        routes[slug]['methods']['azphel'] = 'calculated connected route from this planner’s PvP stat values'
        print(slug, 'party / solo / PvP: 570 points each; Azphel: 232 points', flush=True)
    (ROOT / 'context_routes.json').write_text(
        json.dumps(routes, ensure_ascii=False, separators=(',', ':')), encoding='utf8')


if __name__ == '__main__':
    main()
