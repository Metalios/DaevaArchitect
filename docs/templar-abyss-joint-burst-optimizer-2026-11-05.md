# Global Templar solo Abyss — budget-dependent, coordinated PvP optimization

Reviewed 5 November 2026. This is an explicit comparative policy, **not** a claim of measured Global PvP win rates, animation timings, hit probabilities, or mathematically guaranteed maximum DPS.

## Why the earlier planner was not consistent

1. Solo Abyss used **17% burst** and **20% long pressure** plus significant recovery/escape in the static matchup utility score, rather than focusing on a short catch-and-kill window.
2. `PvpCombatModels.STIGMA.templar` omitted **Executing Blade** completely. Its Defense debuff, Lv5 cooldown reduction, Lv10 Exposed and Lv15 guaranteed Critical Hit could not be valued by the final Stigma/board evaluator.
3. The four standard Daevanian board route was generated **before** purchased Mastery and Stigma refinement. Its own scoring used tile weights and effective-level milestones, but no combat-matched comparison of final funded builds.
4. The rank optimizer searched individual +1 and -1 exchanges. A rank-8/12/16 Specialty or Lv5/10/15/20 Stigma breakpoint may require multiple ranks to become useful; one-rank-only swaps can be trapped by an already fully allocated budget.
5. Mastery rank trades were scored with only manually selected Specialties, ignoring the intended Global Templar Solo Abyss Specialty choices unlocked by the candidate's **effective** level. Specialty tuning after rank allocation did not feed back into the scoring.
6. The previous Solo Abyss Stigma rank milestones were **hard-pinned** at every budget, including 120+, even where another legal allocation could score better.

## New bounded coordinated decision process

The ordinary Solo Abyss Templar preset remains **Doom Shield / Grapple / Executing Blade / Shield of Protection** (four slots, Global). Player-selected Stigmas, purchased Mastery ranks, Stigma ranks, Specialty options, gear and connected board purchases retain manual authority.

1. Start from the user's own total Mastery, Stigma, standard Daevanion, Ariel and Azphel budgets, recorded equipment and acquired node IDs. The app **does not assume gear or extra Stigma slots**.
2. Generate two full, connected standard-board route hypotheses: contextual control/survival and an offensive/fast Specialty-access variant. Each candidate is **fitted to the user's current crystals**, then combined with its own funded Mastery, recorded skill-bearing gear, the actual four Stigma ranks and the separately funded Ariel/Azphel stats. The comparison is made by the short-encounter Templar PvP evaluator against the selected opponents. Keep the better candidate. Routing still honors acquired tiles and the user's manual board mode. Existing route snapshots are invalidated by a new policy version and include independent board budgets in the fingerprint.
3. Score legal Mastery and Stigma reallocation **jointly**, using the candidate's purchased ranks plus board+gear effective level for each available Specialty and the Global context's policy. Search both individual trades and complete 5/8/10 Mastery or 5/10/15/20 Stigma rank-bundles; use bounded evaluation counts. At 30–300 Stigma points the automatic default can improve its allocation; all four equipped Stigmas remain at least Lv5 once funding allows it. Preserve manual rank pins and user Specialty overrides.
4. Optimize legal Specialty combinations at the final projected level, starting from Global-specific Solo Abyss preferred options rather than generic PvE options; manually set selections remain pinned.
5. Account for a short kill window: ranged re-engagement, crowd control, **Debilitating Smash -60% Incoming Heal**, Executing Blade's **-30% Defense for five seconds**, and follow-up Punishment / Judgment / Annihilate. Reward Blade's Lv5/10/15 breakpoints. Maintain a defensive survival floor because a glass-cannon melee build dying before contact deals no meaningful burst damage.

## Intentional limitations

This is **bounded, comparative** joint optimization—not an exhaustive global search over every route, skill allocation, Stigma, Specialty and item combination. Exact rank choices and connected tiles are selected from candidate neighbors under resource and manual constraints, so the result should not be advertised as the provably best possible build.

The ability-damage proxy is not grounded in measured frame locks or repeated Global 1v1 logs. A 30% *Defense reduction* is not equivalent to a 30% final damage multiplier. The model uses a deliberately bounded, disclosed comparative advantage when Blade is actually equipped and leveled, instead of inventing a damage formula. Enemy classes have differently weighted range, control and healing. Solo Abyss Templar is separately tuned; the other seven PvP classes' original context weights are unchanged.

The manual **Grapple → Executing Blade → Punishment** Q priority stack still requires player judgement. Root, Stun, immunity, 4m Blade range and charged Punishment cannot be guaranteed by a held RMB script. Holding LMB + RMB is reserved for safe, connected melee pressure. This change does **not** automate mobility or defensive skill timing.

## Regression scenarios

- Pure logic tests validate 5/10/15 Blade milestones, Poach/Shield Rush range and healing-denial choices, offensive and defensive board sensitivities and complete-rank exchanges that a +/-1 search misses.
- Run a compiled-client browser smoke at 285 Mastery, 218 regular Daevanion, 82 Azphel, and both 80 and 120 Stigma Shards. Verify legality, proposed effective rank, Stigma growth, user's custom/manual overrides and no browser errors. These are **representative budgets**, not a decoded assertion about any individual shared build URL.
- Existing all-class progression, budget, PvP opponent and browser regressions must continue passing.

## Public evidence cross-check

- [AION2 Vault Templar PvP: Global NoBS/Xia and Azphel differences](https://aion2vault.com/builds/templar/pvp/) — context and public choices, not demonstrated victory rates.
- [AION2.gg Solo PvP Templar](https://aion2.gg/builds/templar/pvp-solo) — alternate Daevanion route, not a mandatory optimized path.
- [Aion 2 Guides Templar mechanics](https://aion2.akunito.com/en/classes/templar-skills-guide/) — underlying cooldown and combo descriptions; regional timing must not be confused with current Global.
- Local repository `specialties.json`, `stigmas.json`, `classes_data.json`, `azphel_data.json`, and `js/engine/global_actions.js` are the legality and names used in source code.

The correct next calibration step is to collect and compare matched Global Templar catch-and-finish fights (same patch, gear, opponent archetype, latency and control outcomes), then tune these **proxies** to actual time-to-kill and survival-at-first-counterattack measurements.
