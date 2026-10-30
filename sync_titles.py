"""Snapshot the public AION 2 Global title table for the offline planner."""

import json
from pathlib import Path

import requests
from bs4 import BeautifulSoup

SOURCE = "https://metabot.gg/en/aion-2/titles"
root = Path(__file__).parent
response = requests.get(SOURCE, timeout=30)
response.raise_for_status()
soup = BeautifulSoup(response.text, "html.parser")
tables = soup.find_all("table")
groups = ["Adventure", "Quest", "Challenge", "Dungeon", "Item", "Growth"]
assert len(tables) >= 7
titles = []
for group, table in zip(groups, tables[1:7]):
    for row in table.find_all("tr")[1:]:
        link = row.find("th").find("a", href=True)
        cells = [cell.get_text(" ", strip=True) for cell in row.find_all("td")]
        assert link and len(cells) == 6
        grade, faction, role, equipped, owned, source = cells
        href = link["href"]
        assert href.startswith("/en/aion-2/titles/")
        titles.append({
            "id": href.rsplit("/", 1)[-1],
            "name": link.get_text(" ", strip=True),
            "group": group,
            "grade": grade,
            "faction": faction,
            "slot": {"Offensive": "Attack", "Defensive": "Defense", "Utility": "Other"}.get(role),
            "equip": equipped if equipped != "—" else "No stat effect",
            "owned": owned if owned != "—" else "No stat effect",
            "source": source,
            "url": "https://metabot.gg" + href,
        })

assert len(titles) == 528, f"Expected 528 titles, got {len(titles)}"
assert len({title["id"] for title in titles}) == 528
assert sum(title["slot"] is None for title in titles) == 80
out = root / "titles_catalog.json"
out.write_text(json.dumps(titles, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(f"{len(titles)} Global titles saved to {out}")
