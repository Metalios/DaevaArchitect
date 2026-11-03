# Global PvP matchup recommendation architecture — 2026-11-03

## Scope

The default **All classes** preference evaluates eight opposing class scenarios. Ranged and melee filters, or a named opponent class, narrow those scenarios. Every mode keeps its own scoring objectives:

- General PvP: flexible pressure, burst, contact, control and survival.
- Arena PvP: 1v1 ground combat with greater weight on control and burst.
- Solo Abyss: contact, disengagement, recoverability and airborne skirmish readiness.
- Group Abyss: ally protection, group damage/control contribution, and usable frontline pressure.

Arena of Cooperation 5v5 is **not** equivalent to Arena of Solitude, nor to aerial group Abyss; adding a fifth mode needs separate source validation.

## Versioned policy

`js/engine/pvp_models.js` maintains explicit Global class roles, opponent archetype threat scenarios, and hand-audited Specialty IDs. It uses available skill ranks, Daevanion and gear skill bonuses, recorded PvP-related board/gear stats, real four-Stigma slot choices, purchased Stigma ranks, and the Global action cooldown index for relative action-readiness sensitivity.

The output is a **comparative mechanics proxy**. It is *not* a real probability of winning, simulated server DPS, measured uptime, measured status chance or an animation-accurate duel. The opponent coefficients, class kits and mode weights are declared hypotheses. A worst-matchup penalty discourages all-or-nothing builds; it does not correspond to an observed win rate.

`ClassCombatModels.evaluate()` now delegates PvP scoring to the matchup model, including the joint Mastery/Stigma and Specialty optimizer. The initial connected board candidate search still uses heuristics; the Azphel node utility now includes PvP-mode and matchup-class priorities. Build-level search is not yet an exhaustive optimization across arbitrary Stigma bars, all purchased nodes, cooldown timelines, or team compositions.

`research/pvp-observations.json` provides dated public bars considered as **candidates** alongside existing presets. All 17 are marked `performanceValidated: false` and must never be presented as verified top-player win-rate evidence. `build.py` validates Global class identifiers and legal four-Stigma combinations before bundling them.

The in-game per-class tooltips and skills remain the authority for rank legality. PvE roles keep their existing scoring. Manually pinned selections remain respected.

## Important current limits

- **No independent Global opponent logs:** kill-window, CC-hit probability, immunity/Defiance event timing, actual contact duration and flight stamina remain unresolved. Cooldown readiness is not damage uptime. No false precision should be displayed.
- **No all-class PvP motion measurement:** KR/TW frame data require patch and behavior compatibility checks before use as Global values.
- **No exact status formula:** status-related scores are sensitivity coefficients and cannot prove guaranteed roots/stuns.
- **Gear:** only stats actually recorded in the user inventory are included; a missing gear field is not guessed.
- **PvP Stigma ranks:** real breakpoint costs are enforced; rank utility is research-informed rather than quantified from PvP combat logs.
- **Future work:** validated fights with frame-stamped actions, measured player-vs-player damage/healing, opponents with skill-specific Defiance immunity, shield behavior, aerial gap closure, group ally buff overlap and verified current Arena ranks. Do not overstate model fidelity until these samples exist.

## Regression gates

`pvp_matchup_regression.mjs` checks 8 classes × 4 modes × 8 named opposing classes, legal published four-Stigma bars, offense and defense board stat responsiveness, melee/ranged contact separation, Templar anti-heal, summon pressure and party support. Existing board, rank-budget, Specialty, macros and browser smoke tests must continue to pass.

## Source trail

- Imported Global `skills.json`, `classes_data.json`, `stigmas.json`, `specialties.json`, `azphel_data.json`, `context_routes.json`.
- `docs/global-pvp-source-audit-2026-10-30.md` and `research/pvp-observations.json` with attributed creator and original guide links.
- MetaBot Global client cooldown index: https://metabot.gg/en/aion-2/skills
- Official Global October 28 patch: https://aion2.plaync.com/en-us/board/update/view?articleId=6ae19668577e8c01355e0210
