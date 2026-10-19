"""Score Global specialty option text for the planner's default PvE role.

This is an explainable text heuristic. It deliberately avoids importing another
creator's selected options; interactions that the client data cannot quantify
still require an in-game check.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from optimize_board_progression import load_profiles

ROOT = Path(__file__).parent


def role_for_skill(profile: dict, skill_name: str) -> str:
    if skill_name == profile['weave']:
        return 'damage'
    for names, _, tone in profile['hotbar']:
        if skill_name in names:
            return 'healing' if tone == 'heal' else 'defense' if tone in ('defense', 'emergency') else 'damage'
    lower = skill_name.lower()
    if any(word in lower for word in ('heal', 'recovery', 'regeneration', 'recuperation')):
        return 'healing'
    if any(word in lower for word in ('armor', 'barrier', 'shield', 'protection', 'block')):
        return 'defense'
    return 'damage'


def score(text: str, role: str) -> float:
    t = text.lower()
    points = 0.0
    if 'remove cooldown' in t or 'reset cooldown' in t:
        points += 20
    elif 'cooldown' in t and any(x in t for x in ('-', 'reduce', 'decrease', 'shorten')):
        seconds = re.search(r'(\d+(?:\.\d+)?)\s*s\b', t)
        points += 8 + min(5, float(seconds.group(1)) / 3) if seconds else 8
    if 'consecutive use' in t or 'additional use' in t or 'extra use' in t:
        points += 12
    if 'skill speed' in t or 'casting speed' in t:
        points += 11
    if 'combat speed' in t or 'attack speed' in t:
        points += 7
    if 'multi-hit' in t or 'multihit' in t:
        points += 7
    if 'critical hit' in t or 'critical damage' in t:
        points += 6
    if 'damage' in t and not any(x in t for x in ('incoming damage', 'damage taken', 'damage tolerance')):
        points += 6 if role == 'damage' else 3
    if 'attack' in t and not 'attacking a target' in t:
        points += 4 if role == 'damage' else 2
    if 'damage over time' in t:
        points += 2
    if any(x in t for x in ('heal', 'hp restored', 'restores hp', 'absorbs hp')):
        points += 11 if role == 'healing' else 7 if role == 'defense' else 3
    if any(x in t for x in ('shield', 'barrier', 'block')):
        points += 8 if role in ('healing', 'defense') else 4
    if any(x in t for x in ('incoming damage', 'damage taken', 'damage tolerance', 'damage reduction')):
        points += 9 if role in ('healing', 'defense') else 5
    if 'remove' in t and ('debuff' in t or 'status effect' in t):
        points += 6 if role == 'healing' else 3
    if 'duration' in t:
        points += 3
    if 'mobile' in t or 'movement' in t:
        points += 2
    if 'mp cost' in t or 'mp restored' in t:
        points += 2
    if 'trigger' in t or 'chain skill' in t:
        points += 9
    if 'party members' in t:
        points += 3
    if 'afflicted with' in t:
        points -= 5
    if 'when more targets' in t or 'when less targets' in t:
        points -= 3
    if 'pvp' in t:
        points -= 2
    if any(x in t for x in ('when hp is', 'below 50%', '50% or less', 'on knockdown')):
        points -= 2
    return points


def recommend_all(specialties: dict, profiles: dict) -> dict:
    for slug, class_skills in specialties.items():
        profile = profiles[slug]
        for name, entry in class_skills.items():
            role = role_for_skill(profile, name)
            ranked = sorted(range(1, 6), key=lambda index:
                            (-score(entry['options'][str(index)], role), index))
            entry['picks'] = {
                '8': [next(index for index in ranked if index <= 3)],
                '12': [index for index in ranked if index <= 4][:2],
                '16': ranked[:2],
                '20': ranked[:3],
            }
    return specialties


def main():
    path = ROOT / 'specialties.json'
    specialties = json.loads(path.read_text(encoding='utf8'))
    recommend_all(specialties, load_profiles())
    path.write_text(json.dumps(specialties, ensure_ascii=False, separators=(',', ':')),
                    encoding='utf8')
    print('Calculated default specialties for', len(specialties), 'classes')


if __name__ == '__main__':
    main()
