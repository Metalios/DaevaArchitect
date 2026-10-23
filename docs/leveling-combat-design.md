# Dedicated leveling combat recommendations (AION 2 Global)
Reviewed 2026-10-22; uses October 21 Global client skill and macro data. This is a **starting layout**, not proven fastest DPS.

## Why this differs from the level-45 rotation

AION 2's macro is not a deterministic skill-by-skill script. Each step presses a hotbar key; a key can own a stack of up to four skills. The **bottom slot (row 0)** has highest priority, then rows 1, 2, 3 moving upward. A no-cooldown attack below an on-cooldown skill can starve that skill. The client warns that macro step order is not guaranteed, manual input overrides it, and macro hotkeys tied to mouse actions are unsupported in AION 1 Control Mode.

The Skills menu and presets open at **character level 4**. Levels 1–3 therefore display only attacks the player can press, with no fictitious macro setup. Levels 4–44 (and level 45 while explicitly in *Leveling* mode) start with **one hotbar stack and one macro step**. **Sorcerer switches at level 10 to two purposeful stacks**: an elemental setup/cooldown column and a conditional Fire Mark/Frost spender column, each represented by one macro step. The "Fresh 45 / Endgame" mode keeps the existing advanced rotation builder and macro customization.

## Implementation

- `js/leveling_rotation.js`: separately authored class policies, current-level unlock gates, row-0-first order, class/context exceptions and an independent guide renderer. It never filters `PROFILES[*].stacks`.
- `js/app.js`: routes leveling mode directly to the compact guide, leaving all existing endgame output unchanged.
- `css/leveling.css`: hides the legacy multi-stack/hotbar/instruction blocks while in leveling mode and renders the minimal guide at 390px mobile, portrait and desktop widths.
- **Chanter:** before Dark Crush's cooldown-removal Specialty is **actually selected**, only one trigger is used in the macro. Further triggers remain manual. Once selected, Spinning Strike joins the damage stack.
- **Templar:** Judgment goes in bottom Row 0; the repeatable Pummel stays in the *top* fallback row. Group PvE keeps Warding Strike manual for defensive timing.
- **Spiritmaster:** summons and Elemental Fusion stay manual, rather than placing pets and cooldown-free fusion in an automatic loop.
- **Sorcerer:** At Lv10+, E uses Winter's Shackles → Bittercold Wind → Frost → Firestorm (row 0 first); Q uses Blaze → Frost Burst (row 0 first). These represent setup and condition-dependent payoffs, rather than a single filler stack. Hellfire, Wish of Concentration, Flame Scattershot and Ice Chain remain manual; equipped Stigmas require earned points and can be positioned to the player's preference. At Lv31 only two Stigma slots are open, so do not show the four-Stigma level-45 macro. The user's screenshot also demonstrates a valid manual-fire/Q/E organization, but icon-only evidence is insufficient to claim these are the user's exact assignments.
- **Ranger:** charged attacks remain manual; repeat attacks stay outside the macro.
- **Cleric:** heals never join the damage stack.

## Sources and confidence

- [Aion2Data Global client 2026.10.21 macros](https://aion2data.com/macros), which includes the client's own macro strings, delays of 10–9,900 ms, and class active skill cooldowns. The website's attack/cooldown ordering is a *heuristic*, not live combat measurement.
- [Aion 2 Companion macro mechanics](https://aion2.grimvane.app/companion/wiki/macros-guide/), especially bottom-up stack priority and the distinction between a hotbar skill column and a macro step.
- [Aion2.gg unlock table](https://aion2.gg/guides/what-unlocks-when), Skills menu opens at level 4.
- [Community explanation](https://www.reddit.com/r/Aion2/comments/1wzlnlf/macros/), individual hotbar stack key per macro step.
- [Chanter PvE guide](https://aion2data.com/guides/chanter/pve), Dark Crush trigger condition and pre-16 restrictions.

## Regression acceptance

`node leveling_rotation_audit.mjs` tests **720** policy states (8 classes × 2 contexts × 45 levels). `node leveling_macro_smoke.mjs` covers 240 representative browser layouts, class-dependent one or two macro steps, no locked moves, visual Row 0 at the bottom, early-level absence of a macro, class exceptions and horizontal overflow. Other v2 and level-45 regression suites still run in CI.

Neither test simulates the game server's animation cancels, ping, PvP timing or DPS, and no macro is guaranteed "best". Trial runs on actual Global characters are still recommended.

## 22 October Sorcerer level-31 correction

Sorcerer is not inherently a one-stack class even while leveling. The research-supported Global PvE pattern separates an elemental **setup** stack from **Blaze / Frost Burst conditional follow-ups**, with fully charged Hellfire manual and Flame Arrow used for repeat attacks. Community builds disagree on whether to macro buffs and ground spells, especially when moving targets and animation lock are relevant. The two-stack recommendation is a **starting suggestion**, not an assertion that a screenshot's unlabeled icons or bind choices have been identified exactly. See [October 20 three-chain comparison](https://aion2vault.com/builds/sorcerer/macro/), [Sorcerer Global macros](https://aion2data.com/macros/sorcerer), and [player discussion about manual ground effects](https://www.reddit.com/r/Aion2/comments/1x8z8jy/help_with_sorcerer_build_and_macro/).
