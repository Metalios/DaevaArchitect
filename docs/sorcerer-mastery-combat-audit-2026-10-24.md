# Sorcerer Global: sustained DPS with minimum manual input

Reviewed 2026-10-24. Scope: PvE only; PvP priorities are intentionally unchanged.

## Gameplay contract
- Hold LMB for Flame Arrow as filler / MP recovery.
- Hold RMB with the game's in-game Macro for automatic Q/E/R priority stacks; skill queue and server execution remain conditional.
- Cast Hellfire manually and fully charged, and cast buffs such as Wish of Concentration and Element Enhancement manually.
- Do not add unconditional no-cooldown Ice Chain to the repeat macro: it can spend MP and animation uptime.
- Frost Burst, Blaze, and Flame Scattershot are gated by their relevant debuff or Stagger state.
- Stationary ground skills can lose damage against moving targets; remove the optional ground stack when movement makes it wasteful.
- No animation-cancel frame counts or verified per-skill animation lockout timings are available in the imported data. Instant activation does not imply a zero-duration animation.

## Mastery allocation principles
- Recommended *invested* Mastery rank is at most 10. Skill level may exceed 10 because of Daevanion board and gear.
- Route funding is evaluated first, then the planner recalculates its suggested invested ranks against board + gear bonuses to avoid redundant purchases at specialty thresholds.
- Actual obtained board bonuses and previewed board bonuses are independent; never show a planned bonus as acquired.
- Sorcerer PvE spends on the sustained low-input core (Firestorm, Bittercold Wind, Blaze), meaningful repeat buffs/passives (Robe of Flame, Grace of Enhancement, Fire Mark), and the manual Hellfire/Wish cycle. Frost application/finishing remains automated. Ice Chain/control remains situational.
- Specialty breakpoints are effective levels 8, 12, 16 and 20; on the planned path, required invested ranks are reduced by planned board and recorded gear bonuses. Remaining investment toward 10 can still be worthwhile for ability scaling, which cannot be reliably scored without actual comparative Global damage testing.

## Skill audit scope and limits
The source ledger in `js/progression.js` covers all 22 class Mastery skills with roles, macro/manual assignment and selected published cooldowns. Cast types and timings were cross-checked as available using these sources:

- https://aion2.gaming.tools/skills/15040000 — Firestorm
- https://aion2.gg/database/skills/flame-scattershot-15010000 — Flame Scattershot
- https://aion2.gaming.tools/skills/15110000 — Winter's Shackles
- https://aion2data.com/macros/sorcerer — Macro behavior
- https://aion2vault.com/builds/sorcerer/macro/ — Three-line community macro and buff separation
- https://mobalytics.gg/gamebase/guides/aion-2-sorcerer-hellfire-pve-build — Hellfire and buff timing
- https://corpus.gg/blog/aion-2/sorcerer-pve-build — alternate conditional follow-up grouping

These are guides and client records, **not** an observed per-action simulator. The recommended policy is a practical heuristic. There is no measured basis to label this precise rank allocation max DPS or claim an optimal animation-cancel sequence. Verification still requires same-gear Global target-dummy parses, cast count, MP starvation, macro-input loss, cooldown uptime, and controlled short/mobile/long encounter comparisons.

## Regression scenarios to run
1. Sorcerer, fresh 45: verify recommended invested ranks do not exceed 10, total cost never exceeds entered Mastery points, and Final Lv = invested + planned board + gear.
2. Sorcerer, level 34: only eligible skill/board bonuses count; obtained counter differs from planned route; early class ranks respect unlock caps.
3. Own one recommended skill-granting board tile: acquired displayed level rises, planned target still separately shown.
4. Add/clear a recorded +N gear bonus: recompute recommended threshold ranks and final level; avoid double counting.
5. Keep buffs and fully charged Hellfire manual in leveling/macro views.
6. Run `python build.py`, `node verify.mjs`, `node audit_leveling.mjs`, `node recommendations_audit.mjs`, and browser smoke suites including `mastery_board_gear_smoke.mjs`.

No gameplay benchmark or end-to-end browser verification is claimed by this change.