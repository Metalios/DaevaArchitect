# DaevaArchitect: Global-only eight-class combat and progression audit
**Research cut:** 2026-11-01 | **Region:** AION 2 **Global** (NA East, NA West, EU and other explicitly Global regions) | **Status:** benchmarked inputs and first engine correction, NOT validated optimal builds.

## Evidence coverage and source reliability

- [AION2Tierlist Global build snapshots](https://aion2tierlist.com/builds): about **100 strongest characters per class**, 99 reported for Gladiator at capture. Read all eight class pages. Data are published **per-class aggregates**, not 799 independent raw character exports. Stored in `global_top100_summary_2026-11-01.json`. Numbers vary as the site refreshes.
- [Aion2Builds official-armory-sample methodology](https://aion2builds.com/stats/): reports **200 fully read level-45 characters per class** (1,600 total), selected from 400 candidates per class; only aggregated numbers are published. Selection is not random, strongly biased toward Combat Power; not a rotation-performance cohort. Cannot deduplicate with the top-100 index without the original records.
- [MetaBot Global client skill index](https://metabot.gg/en/aion-2/skills): 8 classes, 96 active skills, 80 passives and 104 Stigmas; source labels client version `0.0.4387.0`. Base cooldowns for 96 actives now captured in `js/engine/global_actions.js`. Cooldowns are **not** cast/animation timings.
- [MetaBot Global builds](https://metabot.gg/en/aion-2/guides/class-builds-guide): class mechanics and editorial rotations from its Global client data. Editorial builds are corroborating hypotheses, not independent combat measurements.
- All Korean/Taiwanese character builds, patches, ninth class data and transferred animation measurements are **excluded** from this evidence set. Guides containing mixed-region anecdotes are not admitted as verified Global timing evidence.
- **Critical data-quality issue:** The top-100 page reports learned/used Stigma percentages for five Stigmas that sum above 400%, despite the four-equipped-Stigma limit. Those rates cannot all represent a single contemporaneous four-slot loadout. Treat them as noisy **presence/prevalence**, not proof that a player equipped five or a conditional probability of a four-slot combination.
- Most actives appear at or near 100% on top-player pages, which does not prove they are cast in an optimized rotation. Combat Power does not measure DPS, healing, arena wins or survivability.

## Evidence-based class audit

These are *high-priority comparisons* for the existing optimizer, not replacement static prescriptions. They come from class-specific Global top-player summaries. In all cases compare each candidate against the **same budget, equipment, level, game mode and skill-breakpoint state**.

| Class | Top-ranked active skill levels in the observed cohort | Current-engine risk to investigate | Combat events to model |
|---|---|---|---|
| Gladiator | Overhead Slam, Rending Blow, Ruinous Blow, Rush Strike, Leaping Slam, Keen Strike | Static priorities can overvalue less-used Sword Aura Rampage compared with mobility and Ruinous Blow buff uptime | Overhead Slam conditional resets, Rending filler, 45s Ruinous buff, critical triggers and stuns |
| Templar | Judgment, Pummel, Punishment, Vicious Strike, Warding Strike, Annihilate | Fixed support/offense ordering may undervalue Pummel/Punishment; Shield of Protection has material top-player presence, but its value depends on encounters | Judgment trigger chain, Punishment PvE boost, shield block, Defiance, Taunt/enmity and party mitigation |
| Assassin | Heart Gore, Quick Slice, Insignia Explosion, Shadowstrike, Flash Slice, Infiltrate | Existing class offense list omits Shadowstrike/Flash Slice/Infiltrate in favor of AoE and lower-prevalence options | Insignia stack cap/spend, critical-triggered resets, Illusive Clone window, back-attack uptime |
| Ranger | Deadshot, Tempest Shot, Drill Dart, Gale Arrow, Snipe, Burst Arrow | A simple 20s Deadshot DPS denominator ignores charge/release, movement and interruption | Charge duration, movement uptime, Snipe/Gale cooldown modifiers, crit-dependent Vaizel effects |
| Sorcerer | Hellfire, Wish of Concentration, Bittercold Wind, Blaze, Firestorm, Flame Arrow | Specialized event simulator used stale 25–30s Stigma cooldowns, non-Global timing hypotheses and uncalibrated MP costs | Fire Mark, Robe of Flame, Hellfire charged manual cast, buff/debuff windows, grounded spells, macro skips |
| Spiritmaster | Elemental Fusion, Combustion, Water Spirit, Cold Shock, Dimensional Control, Jointstrike: Curse | Existing structural score assumes a four-spirit variant with extra uptime even though summon switching value is unresolved | Summon/recast times, four-elements generation, Fusion spend/refund, pet availability and status effects |
| Cleric | Condemnation, Judgment Thunder, Radiant Recovery, Divine Aura, Regeneration, Healing Light | DPS-only scoring penalizes healing needed in group play; raw CP cohort conflates heal/support and solo roles | Condemnation resets, effective healing, overheal, cleanses, incoming spike damage and party survival |
| Chanter | Dark Crush, Onslaught, Spinning Strike, Incandescent Blow, Recuperation, Impactful Crush | Triggered Dark Crush cooldown removal is not an unconditional damage multiplier; support role should not be evaluated as personal DPS alone | Trigger availability, Recuperation usage, mantra exclusivity/uptime, party-wide DPS and survivability |

### Immediate findings

1. **All-class cooldown data was missing as an authoritative versioned layer.** The structural class evaluator used a generic cooldown reduction multiplier and assumed animation-time model. The new `GlobalActionData` supplies Global-reported cooldowns and an *upper bound* for ready-to-use opportunities.
2. **Sorcerer simulation had data drift:** Global skill index reports **Cold Storm 60s**, **Fire Wall 60s** and **Delayed Explosion 30s**, while the previous event model used 30s, 30s and 25s. Corrected with matching indexed MP costs in this branch; future independent cross-check needed.
3. **Animation cancel evidence is not sufficiently Global-measured.** The existing Sorcerer event durations and 75/25 execution-recovery assumption in the other class evaluator remain sensitivity scenarios. Neither can presently justify an “absolute best DPS” claim. Do not import KR/TW action frames.
4. **Ariel and Azphel are independent currencies, but always-active character progression can affect CP/CR.** They must be included in relevant character scoring for any PvE/PvP context; their PvE/PvP-specific damage stats must not falsely count as effective damage against the wrong target class.
5. **Total Mastery rank is not the same as purchased rank.** Gear/Arcana, Daevanion skills and Stigma-related levels have to be recomputed before evaluating every candidate's effective-8/12/16/20 Specialty thresholds. Reject impossible level/slot combinations.
6. **The 100-highest-CP cohort is a prior, not a training ground truth.** Separate goals by player level, role, encounter, gear tier, availability and skill execution. If all top-ranked characters have maximum gear, that does not mean a fresh-45 or 200-crystal character should mimic their skill allocation.

## Engineering target: deterministic, free, inspectable optimizer

Use a **constraint solver + event simulation + robust multi-objective scoring**, not a paid API or a supposedly trained AI hosted alongside GitHub Pages.

**Inputs**
- Class, character level, unlocks, earned Mastery/Stigma/base PvE/Ariel/Azphel crystals, actually obtained nodes, desired goal, encounter duration, targets, solo/group/PvP environment.
- Actual gear items, enhancement and sockets, equipment stats, real Arcana skill rolls, equipped Stigmas and Specialty picks.
- Real skill cooldowns, conditional resets, durations, damage coefficients, status applicability, buffs/debuffs, MP/stamina/resource generation, known motion data, latency/ping, macro/manual preferences.

**Hard constraints**
- Exactly legal purchased ranks, point budgets and Specialty unlock slots; at most four equipped Stigmas; connected purchased board graphs with each distinct board currency; known Global class skills only.
- No reset or secondary attack available before its trigger; movement/casting restrictions, remaining MP, range/target validity and accessible macro keys.
- Never overwrite manually pinned or obtained choices to manufacture a higher score.

**Candidate generation**
1. Establish current recorded baseline and all actually owned permanent bonuses.
2. Create legal Mastery, Stigma, Specialty and connected-board choices. Treat any skill bonus earned from a candidate board as a new effective level and rescore.
3. Iterate board and skill allocations **jointly** rather than optimizing boards with provisional ranks and later buying leftover Mastery. Use bounded beam search for board paths, constrained neighborhood moves for Mastery/Stigma/Specs and Pareto pruning.
4. Score feasible candidates using an **event timeline**: cooldown eligibility, observed or explicitly uncertain action time, buff expiry, damage, healing, interrupts, attacks absorbed, resource constraints, resets and position changes.
5. Evaluate across encounter scenarios: short burst, 180s stationary, 180s mobile, boss mechanics, multi-target, PvP duel, Arena, solo Abyss, group Abyss. Prioritize user's selected mode and preferences, not a universal leaderboard rank.
6. Evaluate a range of uncertain parameters (animation/cancel/crit/proc rates). Prefer candidates that perform well **across the range**, rather than exploiting an assumed faster animation that has no measurements.
7. Compare candidate against baseline and independent contenders. Return projected delta with uncertainty, skill/buff event counts, actual budget spend, next most valuable purchases, and an explanation of tradeoffs. Never label uncalibrated proxy scores as measured DPS.

**Separate optimization objectives**
- **Solo PvE:** sustained damage and time-to-kill under a survival floor, plus low manual complexity.
- **Group PvE:** personal damage plus group output/mitigation (tank enmity, healer HPS and effective shields, Chanter buffs).
- **Burst PvE / sustained PvE / survival:** independent scoring with proper encounter windows.
- **General PvP, Arena, Solo Abyss, Group Abyss:** separate probability-weighted opponent matchups, disengage, CC and anti-CC, uptime, survivability and team value. Raw CR is a tracked output, **not** a substitute for win rate or burst reliability.

**Animation-cancel validation still required**
- For each Global skill and relevant follow-up, capture a frame-stamped client sample at known FPS, Combat Speed and Skill Speed, known ping and buff state. Separate input -> damage registration -> cancellable time -> next ability execution.
- Record median, variance and failed cancel rate. Distinguish manual from macro sequences. Measure enough repeated trials to estimate timing uncertainty; until then keep cancel values **unknown** and report scenario sensitivity rather than inserting Korean/Taiwanese values.
- A reproducible combat recording dataset is required to calibrate damage/MP/uptime predictions; no such complete all-class Global set was available in these public summaries.

## Acceptance criteria for “recommended”

- All 8 classes × all 4 PvE objectives × all 4 PvP modes × multiple levels and point budgets, including 0, 29, 61 and endgame Stigma points, pass legality/connectivity tests.
- Every class gets at least three gear contexts (fresh 45, mid-tier, endgame), both exact/no-Arcana-roll contexts, and both pre/post-major-Specialty breakpoints.
- Run tests with both partial and complete Ariel/Azphel graphs, and ensure CR still includes both as appropriate in PvE mode.
- Predict cooldown counts and actual abilities from the same Global metadata version. Fail CI on unexpected cooldown drift, unknown skill IDs or illegal rank/gear assumptions.
- A candidate may claim **measured DPS superiority** only when validated Global logs show improved results against comparable real encounters with no unacceptable survival regression.
- Display provenance, patch version, data completeness and uncertainty; top-player consensus alone never establishes mathematical global optimum.

## Sources

- https://aion2tierlist.com/builds and eight per-class pages, reviewed Nov 1
- https://aion2builds.com/stats/, official-armory aggregate sample, Nov 1
- https://metabot.gg/en/aion-2/skills, client-reported skill cooldowns
- https://metabot.gg/en/aion-2/guides/class-builds-guide, editorial Global class mechanics
- Repository: `js/engine/class_models.js`, `js/engine/combat.js`, `js/optimizer/objectives.js`, `js/app.js`, `js/recommendations.js`.
