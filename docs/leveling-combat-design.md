# Dedicated leveling combat recommendations (AION 2 Global)
Reviewed 2026-10-22; uses October 21 Global client skill and macro data. This is a **starting layout**, not proven fastest DPS.

## Why this differs from the level-45 rotation

AION 2's macro is not a deterministic skill-by-skill script. Each step presses a hotbar key; a key can own a stack of up to four skills. The **bottom slot (row 0)** has highest priority, then rows 1, 2, 3 moving upward. A no-cooldown attack below an on-cooldown skill can starve that skill. The client warns that macro step order is not guaranteed, manual input overrides it, and macro hotkeys tied to mouse actions are unsupported in AION 1 Control Mode.

The Skills menu and presets open at **character level 4**. Levels 1–3 therefore display only attacks the player can press, with no fictitious macro setup. Levels 4–44 (and level 45 while explicitly in *Leveling* mode) use **one hotbar stack and one macro step**. The "Fresh 45 / Endgame" mode keeps the existing advanced rotation builder and macro customization.

## Implementation

- `js/leveling_rotation.js`: separately authored class policies, current-level unlock gates, row-0-first order, class/context exceptions and an independent guide renderer. It never filters `PROFILES[*].stacks`.
- `js/app.js`: routes leveling mode directly to the compact guide, leaving all existing endgame output unchanged.
- `css/leveling.css`: hides the legacy multi-stack/hotbar/instruction blocks while in leveling mode and renders the minimal guide at 390px mobile, portrait and desktop widths.
- **Chanter:** before Dark Crush's cooldown-removal Specialty is **actually selected**, only one trigger is used in the macro. Further triggers remain manual. Once selected, Spinning Strike joins the damage stack.
- **Templar:** Judgment goes in bottom Row 0; the repeatable Pummel stays in the *top* fallback row. Group PvE keeps Warding Strike manual for defensive timing.
- **Spiritmaster:** summons and Elemental Fusion stay manual, rather than placing pets and cooldown-free fusion in an automatic loop.
- **Sorcerer and Ranger:** charged attacks remain manual; repeat attacks stay outside the macro.
- **Cleric:** heals never join the damage stack.

## Sources and confidence

- [Aion2Data Global client 2026.10.21 macros](https://aion2data.com/macros), which includes the client's own macro strings, delays of 10–9,900 ms, and class active skill cooldowns. The website's attack/cooldown ordering is a *heuristic*, not live combat measurement.
- [Aion 2 Companion macro mechanics](https://aion2.grimvane.app/companion/wiki/macros-guide/), especially bottom-up stack priority and the distinction between a hotbar skill column and a macro step.
- [Aion2.gg unlock table](https://aion2.gg/guides/what-unlocks-when), Skills menu opens at level 4.
- [Community explanation](https://www.reddit.com/r/Aion2/comments/1wzlnlf/macros/), individual hotbar stack key per macro step.
- [Chanter PvE guide](https://aion2data.com/guides/chanter/pve), Dark Crush trigger condition and pre-16 restrictions.

## Regression acceptance

`node leveling_rotation_audit.mjs` tests **720** policy states (8 classes × 2 contexts × 45 levels). `node leveling_macro_smoke.mjs` covers 240 representative browser layouts, a single macro step, no locked moves, visual Row 0 at the bottom, early-level absence of a macro, class exceptions and horizontal overflow. Other v2 and level-45 regression suites still run in CI.

Neither test simulates the game server's animation cancels, ping, PvP timing or DPS, and no macro is guaranteed "best". Trial runs on actual Global characters are still recommended.
