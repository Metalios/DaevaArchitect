# Global combat optimizer — implementation and evidence

Scope: AION 2 **Global PvE Sorcerer**. This file is the implementation record for `js/engine/combat.js`, loaded by `build.py` before `js/app.js`. All other classes keep the existing legal allocation/rotation system.

## Research boundary

- **Authoritative Global**: AION 2 client 2.0.8.0, 2026-10-21, rank costs, cooldowns, Specialty options and Stigma perk thresholds. Game data remains in `classes_data.json`, `specialties.json`, `stigmas.json`, `skill_unlocks.json` and `level_rewards.json`.
- **Transferable, not proven identical**: KR/TW Sorcerer animation and Hellfire charge-stage research (full charge 1.5 seconds, 1.05 seconds with +30% Skill Speed). Timing sources must retain region/version and are **not** Global balance data.
- **Unmeasured / inferred**: release animation, other animation occupancy, input buffering, target hit chance, ground-DoT uptime, MP costs not contained in imported data, absolute ability damage, server caps, exact Combat Speed stacking formula and animation-cancel minimums. Those fields are **scenario assumptions** and are labeled accordingly.
- **Not used**: KR/TW damage coefficients, balance changes or precomputed build priority lists.

Sources:
- [Firestorm Global 2.0.8.0 — Skill and Specialty records](https://aion2.gaming.tools/skills/15040000)
- [Global Sorcerer damage coefficient ranking](https://aion2data.com/best/sorcerer-skills)
- [Global Sorcerer build and skill-level interactions](https://aion2data.com/builds/sorcerer)
- [Sorcerer Companion primer — charge timing and regional differences](https://aion2.grimvane.app/companion/wiki/sorcerer-primer/)
- [Sorcerer Companion skills — full options](https://aion2.grimvane.app/companion/wiki/sorcerer-skills/)

## How recommendations work

1. The original Global rank/board/gear rules remain authoritative for **legal feasibility**. No rank exceeds the unlock-level cap and no funded board exceeds the crystal budget.
2. If the user is on **Global PvE Sorcerer**, compare the existing connected route against a Combat-Speed/CDR-biased alternative at the **actual funded crystal count**. Preserve all marked obtained nodes as locked; the recommended route remains stable through a crystal spending cycle.
3. Starting with the funded recommended ranks, try bounded cost-safe rank exchanges, optimizing the same comparative combat score. Manual Mastery edits are **never** overwritten.
4. For unlocked active skills, search all legal Specialty option combinations that fit the actual equipped slot count. Manual Specialty picks remain locked.
5. Evaluate 180-second stationary/mobile and 30-second short scenarios. Include the availability of Fire Mark/Frost/Stagger, basic Flame Arrow MP recovery, manual charged Hellfire and offensive buffs, macro attempts, speed and cooldown feedback. The objective weighs average output and worst-scenario resilience.
6. Display relative damage/second, estimated manual actions/minute and scenario results. These numbers are **not actual Global DPS**.

The simulator uses *normalized* damage units and transparent timing hypotheses until calibrated Global log records supply same-patch, same-skill execution counts. It should not be used to claim that a configuration is mathematically optimal or has a specific DPS.

## Core safety and compatibility guarantees

- The saved account, board coordinates and V2 layouts are unchanged.
- Existing actual gold/obtained node marks and custom board selections remain the source of truth.
- Existing manually invested ranks and manual Specialty choices take precedence over recommendations.
- Global AION 2 action mode is retained: **LMB basic attack**, **RMB the in-game Macro**, manual **1–8**, automatic **Q/E/R**, with T remapped to R.
- All uncalibrated metrics carry an explicit qualifier in the UI.
- Other seven classes and PvP are deliberately **not routed through a Sorcerer damage model**; existing proven mechanical safeguards stay active.

## Regression suite

`combat_engine_regression.mjs` validates mechanics, Specialty unlocks, speed sensitivity, cooldowns, MP, legal rank exchange and locked skills. `combat_optimizer_smoke.mjs` verifies the real application from Sorcerer level 36 → 37, including the 153 Mastery / 104-crystal level-37 budget and the fourth Stigma slot. Existing workflows additionally validate all eight classes, layouts and progression.

## Outstanding work before an all-class release

This PR is the first functioning vertical slice of the overhaul, **not** a completion claim for the entire roadmap:

- Add validated action timing and damage scaling for all eight classes; support server-side damage calibration.
- Import Global Ariel board coordinates/effects and its separate budget when trustworthy Global data is available.
- Replace provisional occupancy, MP and movement assumptions with versioned measured values.
- Add global macro scheduling alternatives and stronger bounded/exact comparisons to avoid local rank-exchange traps.
- Add background/worker-based search for expensive full-build workloads.
- Preserve candidate search provenance and show per-upgrade marginal simulated benefit and uncertainty ranges.
