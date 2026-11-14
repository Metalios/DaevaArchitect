# AION 2 Global rotation and in-game macro audit — November 14, 2026

## Scope and confidence
This is a **safety / workflow correctness audit** of the eight Global classes, not a proof of highest DPS or PvP win rate. The planner ships to Global and must not silently import Korean/Taiwanese November balance changes. On November 11 the region-specific class reworks reported by third-party sites are not independently verified as enabled on Global. Animation locks, server queueing, critical/proc rates and user equipment breakpoints remain insufficiently measured for a robust mathematical optimum.

## Sources reviewed
1. [AION2 Data: macro game-client text](https://aion2data.com/macros) — directly quotes the client: manual input always wins; macro key runs while held; attempts continue and **step order is not guaranteed**; delay must be **10–9,900 ms**. 2026.10.28 Global extraction.
2. [AION2 Vault: 7,200 public Global skill builds](https://aion2vault.com/builds/macros/) — aggregates usage and reports charge and mobility skills overwhelmingly kept out of macros. Adoption is **not** proof of combat superiority. Reviewed 2026-11-02.
3. [AION2 Companion](https://aion2.grimvane.app/companion/wiki/macros-guide/) — rows 0–3, row 0 bottom; the slot stack is a priority chooser and a macro step presses that slot. Some community guidance about queueing/cancel timing conflicts.
4. [AION 2 Global Gaming Tools build layouts](https://aion2.gaming.tools/builds) — Global version 2.0.11.0, updated November 11. Examples are community suggestions, not verified class-by-class DPS results.
5. [AION2 class macro comparison](https://aion2builder.com/macros/) and [Vi.ki skill/macro guide](https://aion2.vi.ki/skills-stigmas-and-macros) — confirms multiple contested ordering conventions; no objective universal best rotation was inferred.
6. [AION2 November 11 balance summary](https://aion2hub.com/updates/aion-2-update-2026-11-11) — **region applicability unverified**. Do not transplant reworked effects, renamed skills or changed cooldowns into Global optimization without current Global client corroboration.

## Confirmed mechanics vs estimates
- **Client-confirmed:** macro input is held, manual presses take precedence, macro steps are not deterministic, accepted delays are 10–9,900 ms, and mouse-bound Macro does not work in AION 1 control mode.
- **Repeated guide consensus:** one hotbar column holds up to four priority skills, row 0 at the bottom is tried first, unusable skills are skipped; place truly always-ready fillers behind cooldown/conditional attacks.
- **Widely observed player practice, not measured output:** charge skills should be held manually to avoid an early first-stage release. Buffs, defensive abilities, healing, movement, toggle effects and PvP CC are usually timed by the player.
- **Unknown:** exact current Global action-occupied times for all eight classes, optimum step delay by latency/skill queue/attack speed, matchup-specific win rates, DPS gains from individual specialties, and whether a KR November class rework has reached Global.

## Per-class findings and conservative fixes
| Class | Reliable mechanical priority / risk | Corrective policy |
| --- | --- | --- |
| Gladiator | Rending Blow shows 0 base cooldown in the current Global catalog; placing it before Ruinous Blow (45s) can mask the latter when ready. Slam windows are conditional. | Prefer Ruinous ahead of the filler when both are on one PvE stack; use PvP gap closers and anti-burst tools manually |
| Templar | Pummel is an always-ready filler. Punishment is charged, and a Q stack is not a guaranteed Grapple → Blade → Punishment sequence. | Keep Punishment on a direct held key. Only suggest manual Q Grapple/Executing Blade when the two Stigmas are equipped, not in automatic steps |
| Assassin | Savage Roar is a filler; spending Insignias blindly during PvP can waste a target-locked burst. Mobility must not automatically move behind/into danger. | PvP macro may run repeatable Heart Gore/Roar pressure, but the Insignia spender, positioning and escape remain manual |
| Ranger | Tempest Shot as filler can starve Gale/Drill. Deadshot charge, Marking Shot's position/Precision, slows and control are contextual. | Keep Tempest last. Deadshot and mark/control stay manual; use separate PvP repeat pressure rather than auto-snaring targets |
| Sorcerer | Blaze has a Fire Mark condition, Firestorm repeats, Hellfire needs a full charge; Delayed Explosion/Wish timing differs by specialty. Ground effect uptime depends on enemy movement. | Maintain skill eligibility and manually time short amplification/charge windows; do not call a priority order a measured DPS rotation |
| Spiritmaster | Elemental Fusion depends on Four Elements and can be charged with a Specialty; pet summoning and CC can change the fight. | Automate only safe curse/Combustion pressure in PvP; summon, control and Fusion are manual |
| Cleric | Heals, cleanses, and Light of Protection toggle cannot be part of a blind repeated DPS macro; Bolt is charged. | Safe DPS only in spare windows. Healing and protection stay on direct manual keys |
| Chanter | Incandescent Blow is a ready filler; the Dark Crush chain has conditions. Mantras toggle; Recuperation/heals and group bursts require timing. | Keep Incandescent last and mantras, recovery and control on manual keys |

## Why PvP differs
The 1v1 Arena, general PvP, solo Abyss and group Abyss have very different engagement, survival and support windows. All eight classes now have a **safe repeatable pressure** proposal for these contexts, with encounter and enemy-class guidance. This does not mean all modes should have unrelated filler spells: the reliable low-input attacks may reasonably be identical while **manual engagement, target timing, counter-CC and burst priorities differ**.

## Testing requirements before calling a recommendation 'best'
1. In the **current Global client**, record actual equipped Stigmas, Mastery + Daevanion + gear/Arcana effective skill levels, Specialties, buff state, Combat Speed, cooldown reduction and whether the target is moving/immune.
2. In controlled training trials, use Combat Analysis and timestamps; record at least 5 comparable runs (same boss or dummy, duration, latency and setup) for each two candidate sequences.
3. Compare damage per second, animation clipping, cast counts, missed charges, idle time, deaths/interrupts and available manual buttons, not just simulated action coefficients.
4. Validate per class **and** class role (group healer/tank, solo Nightmare, group Conquest, each PvP venue), then check each opponent class for manual CC/positioning advice. Report confidence and source patch, and exclude KR-only observations from Global balances.
5. Include concrete evidence when labeling a measured winner; absent measurements, label the result **recommended starting point**, not optimized maximum DPS or a guaranteed winning macro.

## Implemented with this audit
- A single source-controlled **GlobalRotationPolicy** for all eight classes and four PvP venues.
- Proposed macro guards for charged movement/healing/control/toggle abilities, priority filler normalization, and user-authored macro safety warnings without overwriting custom selections.
- Custom leveling macros with unlock filtering, per-mode saves, and the full documented delay range.
- Regression checks for 352 class / venue / opponent combinations plus Chromium smoke tests of opt-in copy, manual columns and persisted customization.
