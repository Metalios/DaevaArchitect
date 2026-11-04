# Sorcerer Global cross-path correction — 2026-11-03

## Data authority and accuracy limits

This implementation uses **AION 2 Global** client descriptions (Global client
**2.0.9.0, updated 2026-10-29**) plus the repository's Global data. It is not
an assertion that proxy numerical scores are real damage, kill probability,
recovery, or animation timing. No independent same-patch Global combat logs
or confirmed full-charge frame timings were available to calibrate those.

Primary corroboration:
- [Firestorm, cooldown 5s, +2s Hellfire reduction per fireball Specialty](https://aion2.gaming.tools/skills/15040000)
- [Wish of Concentration, +10% Attack for 10s, optional +10% Attack and 10s cooldown reduction](https://aion2.gaming.tools/skills/15310000)
- [Delayed Explosion, +15% damage taken from caster during 4-second delay, impact at expiry](https://aion2.gaming.tools/skills/15320000)
- [Frost, 30s cooldown, Frost Burst reset on hit Specialty](https://aion2.gaming.tools/skills/15150000)
- [Frost Burst, 10s cooldown, Frost prerequisite](https://aion2.gaming.tools/skills/15220000)
- [Winter's Shackles, 45s cooldown, +20% PvE/+10% PvP for 5s Specialty](https://aion2.gaming.tools/skills/15110000)
- [Global PvP Sorcerer community four-Stigma example](https://aion2vault.com/builds/sorcerer/pvp/)
- [Global Sorcerer macro adoption and alternative layouts](https://aion2vault.com/builds/sorcerer/macro/)

The public PvP builds and copied macros are **candidate evidence**, not verified
top-ranked performance results. Full-accuracy claims require server-verified
damage, control hit rates, target movement, cooldown event traces and combat
animations. No KR/TW damage coefficients were imported.

## What changed

1. **Sorcerer can no longer disappear from the common class mechanics model.**
   The shared Mastery/Stigma/Specialty architecture now has explicit Sorcerer
   offense, defenses, passives, and milestone interactions. This is used for PvP,
   defensive PvE, and the Control/Kiting role. Offensive PvE remains on the
   independent damage event simulator and cannot be overwritten by an unrelated
   class-proxy rank exchange.
2. **All five Sorcerer PvE objectives remain distinct.** Performance, long
   sustained damage, short burst, survivability and Control/Kiting use the
   objective's priorities. Defensive planning no longer uses a purely offensive
   Master's initial build order or offensive board milestones. The event
   engine uses 30-second burst vs 180-second sustained/mobile comparison.
3. **PvP Stigma candidates vary by venue and opponent.** The Global
   Element Enhancement / Arctic Armor / Hibernation / Soul Freeze bar is an
   Arena candidate. Solo Abyss favors responsive shield and escape, while Group
   Abyss considers Lumiel's Space as situational area control. Public and
   cross-mode Stigma bars are compared, not assumed proved. Manual pinned
   Stigmas stay pinned.
4. **PvP rotation is not a PvE macro.** Q automatically attempts only safe
   Blaze / Firestorm damage. Hellfire remains fully charged and manual;
   Frost, Winter's Shackles, Soul Freeze, Curse: Tree, area control,
   Hibernation and protective Stigmas are all manual/reactive. Defiance stays
   manual on Space. No macro will spend an emergency immunity automatically.
5. **PvE simulator fixes:** independently timed Wish/Element buffs; a real
   pending four-second Delayed Explosion and its +15% (or +25% at rank 20)
   target debuff window; recurring Fire Wall/Cold Storm tick events rather
   than fictitious instant damage; Frost's cooldown-reset option; correctly
   timed Wish 10s base attack buff; reduced Frost/Delayed cooldown options;
   and separately attempted Q/E/R stacks instead of a flattened priority.
   Firestorm's Hellfire reduction is credited conservatively at one landed
   fireball per simulated action (2s) until actual hit counts are available.
   Relative damage coefficients, DoT retention on mobile targets and action
   occupancy remain **hypotheses**.
6. **Daevanion:** the connected PvE board search now tests all five defined
   Sorcerer focus candidate routes (including Fire Mark, Hellfire, Firestorm);
   the Azphel and Ariel special-board optimizer preserves actual recorded
   purchases as a connected required prefix within the entered independent
   currency budget.

## How to use

- **Leveling / routine PvE:** Flame Arrow on LMB, in-game Macro on RMB,
  upgraded Q/E (and equipped-ground R) chains. Charge Hellfire manually on 1.
  Wish and selected buffs remain manual. This is minimum input, not the
  universally highest measured DPS configuration.
- **Fresh 45:** the existing Global baseline remains 203 Mastery / 30 Stigma /
  136 ordinary crystals. The actual budget is always entered by the player.
- **Endgame:** re-optimize when Mastery, ordinary boards, gear skill rolls,
  equipped Stigmas or effective-level Specialties change. A planned +N board
  level is never assumed already obtained.
- **PvP:** use manual control to secure a safe full Hellfire. Do not spam
  Hibernation, Arctic Armor or Seal on the automatic damage macro.
- **Ariel/Azphel:** separate pools, full grid connectivity and pinned obtained
  nodes are preserved. A 232-point Azphel completion route is not a requirement
  or default for a fresh-45 Sorcerer.

## Validation

- `node sorcerer_full_path_regression.mjs`: all PvE goals, four PvP modes
  against eight opponents, legality of Stigma choices, control/anti-heal
  Specialty response, damage/event model, Ariel and Azphel recorded nodes.
- `node class_role_regression.mjs`: fail if Sorcerer is absent from the
  common class model again.
- Existing engine, board, rank-budget, cohort, PvP, rotation, browser and
  build checks must pass on the pull request.

## Known limitations and required calibration

- Multi-hit Firestorm hit count, client tick processing, Frost uptime on player
  targets, and frame-accurate macro scheduling are not verified. The simulator
  must not present its output as absolute Global DPS, exact cooldown uptime,
  or a mathematically guaranteed optimal build.
- No human reaction-time or PvP immunity/Defiance server events are modeled.
  Comparative PvP scores are not win-rate predictions.
- The five PvE route candidates and greedy-special-board algorithm are bounded
  searches, not exact integer programming over every 380-node choice and every
  party/opponent combination.
- Always retain manual overrides and do not replace obtained player data with
  predictive purchases.
