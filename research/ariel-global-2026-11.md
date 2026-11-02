# Ariel Global progression correction — November 1, 2026

The Daevanion board unlocks at level 45, but the **Ariel crystal acquisition route** is Hard Conquest. Reaching 45 alone does not grant crystals.

## Verified Global entry gates

| Hard Conquest | GR / item-level entry gate | Patch |
|---|---:|---|
| Krao Cave | 2,600 | October 21 |
| Draupnir | 2,600 | October 21 |
| Urugugu Canyon | 2,700 | October 28 |
| Vakron Sky Island | 2,700 | October 28 |

Ariel Fragments are converted in Substance Morph under Special → Daevanion, 100 fragments for one crystal. The currently documented limit is 30 morphs **per dungeon per character**. Four sources account for 120 obtainable crystals, while the full board costs 232. The planner retains its 232-point planning ceiling, but warns if a user records more than the documented sources presently explain. Neither GR nor completion of Hard mode is inferred from an estimated CR value.

Entering a lower GR after farming **must never delete previously earned Ariel crystals**. The board remains visible in the interface for future progression.

## Corrected Global Ariel board values

The old import overstated some PvE stat nodes and omitted Critical Hit and Critical Hit Resist nodes. Against the Global client node listing, the corrected total for a complete board is:

| Statistic | Total |
|---|---:|
| PvE Damage Boost / Tolerance | +6% each |
| Boss Damage Boost / Tolerance | +4% each |
| PvE Attack / Boss Attack | +72 each |
| PvE Defense / Boss Defense | +720 each |
| PvE Accuracy / Evasion | +120 each |
| Critical Hit / Resist | +40 each |
| HP / MP | +400 / +200 |

Topological limits remain 153 board positions (one free start, 152 purchased nodes) and 232 crystals. The graph is verified against the Global listing at an aggregate level; a fully optimized path still requires individual node cost, adjacency, and combat-value validation.

## Implementation

- Optional in-game GR input supplies Hard Conquest eligibility guidance.
- Keep Ariel visible at level 45 but indicate where crystals become obtainable.
- Separate actual earned crystals from eligibility. CR estimates do not determine GR.
- Include entered GR in shared builds.
- CI tests cover the 2,600 and 2,700 gates, preservation of previously earned crystals and complete Global board-stat totals.

## Sources

- https://aion2hub.com/updates/aion-2-global-update-2026-10-21
- https://aion2hub.com/updates
- https://wikily.gg/aion-2/game-data-changes
- https://aion2data.com/daevanion/templar
