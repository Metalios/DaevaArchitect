# DaevaArchitect: one character-aware progression and combat optimizer

**Scope:** AION 2 Global rules only; verified Global timings first and appropriately flagged KR/TW timing observations where the skills, speeds, cancel rules and patches match. All eight Global classes. Four PvE build goals, four distinct PvP contexts. Mastery, Stigma, base four PvE boards, Ariel, Azphel, gear/Arcana and in-game Macro.

**Quality rule:** Optimal means *best under the currently validated data and objective*, not an unsupported claim of globally proven maximum DPS, healing, survival or arena win rate. Do not relabel comparative proxy scores as measured DPS.

## Implemented in PR #34

1. **Unified input:** Class and role, Global level and active unlocks; entered Mastery/Stigma/base/Ariel/Azphel crystal budgets; currently obtained/locked board nodes; actual equipped gear, sockets, enhancement, Arcana levels, additional manual levels and selected Specialties. Missing gear is never generated.
2. **Legal joint Mastery/Stigma rank refinement:** Iterative bounded full-build comparisons on the actual character, including all six board bonuses, using class-specific combat models for seven classes. The Sorcerer retains its dedicated event simulator and Specialty/Macro tuning. A conservative four-slot Stigma loadout comparison considers class PvE/PvP alternatives but only replaces the original preset for a meaningful modeled improvement; Templar group protections remain anchored to its verified four-Stigma policy. Hard constraints: earned points, per-rank cost, unlock caps, four equipped Stigmas, manual pins. Show source uncertainty and cache by actual character input.
3. **Ariel/Azphel connected priority:** Choose the next funded node from a legal connected frontier, weighting marginal stats against gear already recorded and the selected role, PvE/PvP context and objective. Separate currencies are never exchanged. Old legal path remains a fallback. Keep obtained tiles and custom selections intact.
4. **Specialty and Macro adaptation:** Bound legal 8/12/16/20 effective-level Specialty combinations to the actual bought Mastery, gear/Arcana, and six-board skill bonuses, retaining every explicitly selected manual Specialty. For seven classes, compare class-model scores across legal combinations; Sorcerer retains its dedicated optimizer. Filter unavailable/unequipped/charged/manual abilities out of automatic stacks while preserving known trigger ordering, and label Global base cooldowns. Require manual buff, healing, defense and charge where appropriate.
5. **Tests:** Full eight-class × context pure tests, 153-node board legal-connection checks, individual point-budget legality, pinned changes, browser integration and CI gates.

These are **comparison improvements**, not the final calibrated all-class simulator. A class cannot be truthfully called fully optimized using only a list of high-CR characters and unmeasured relative skill coefficients.

## Remaining concrete completion gates

### Gate A — verified ability-event data (all eight classes)

Per active skill and relevant Stigma variant, collect:

- Stable client skill ID, active rank, Specialty option ID and text, effect condition; exact Global base cooldown and cooldown reduction caps.
- Rank-specific physical/magical damage coefficients, fixed damage, strikes/hits, resource costs and resource returns; target limits, range, AoE, immunities.
- Buff/debuff uptime, duration, stack limit and trigger type (hit, critical, successful status, another skill); explicit cooldown reset or fixed-seconds cooldown reduction and conditions; proc rates when known.
- Skill-speed, Combat Speed and cooldown scaling; minimum cancel time and animation lock measured by class/skill/speed/macro mode.
- Every numeric record stores Global client build/version, source, observation date, region and confidence. KR/TW animation measurements are allowed **only as cross-region timing inputs**, not as additional Stigma slots or Global skill mechanics.
- Reference: `js/engine/global_actions.js`, `js/engine/animation_evidence.js` and `js/engine/combat_timeline.js`.

**No fabricated values.** Unknown timings/damage must propagate to an uncertainty or missing-evidence report, not become “client verified.”

### Gate B — scenario-accurate timeline model

Before replacing the per-class comparative scores, validate:

- Actual cooldown start (cast beginning versus completion), exact CD reductions/resets, action-lock/cancel time, proc/crit probability, buff expiry, mana and hit registration.
- Global measured fight logs: buff uptime, number of casts of each skill, inter-event intervals and total damage; compare predicted and observed traces for controlled target dummies.
- Account for 20–40 ms or higher latency effects only when measured; evaluate multiple movement, target immunity and uptime scenarios, not one ideal stationary boss.
- For PvP, enemy class/range, focus-fire, crowd-control immunity and enemy burst mean a different optimal schedule from stationary PvE.

**Acceptance:** For complete measured Global datasets, simulation must reproduce cast counts and buff uptime within documented tolerances, and avoid illegal timing. For missing evidence, suppress any “measured DPS” claims.

### Gate C — global candidate search rather than local improvement

The browser-side legal optimizer needs:

- Expand the implemented conservative four-slot Stigma candidate comparison into broad, joint equipped-Stigma **and** rank optimization, including unusual but legal class options and matchup-specific PvP measurements.
- Joint optimization of all Mastery ranks, Stigma names/ranks, Specialty choices, connected nodes on Nezekan/Zikel/Vaizel/Triniel, and independent Ariel/Azphel crystals.
- Pareto search across PvE DPS, effective survivability, PvP utility, threat/healing and player-input complexity. Keep protected purchases as hard constraints.
- A bounded search that returns a reproducible best candidate under a known data snapshot and an explicit measure of search coverage; local coordinate improvements are **not proof** of a global optimum.
- Score gear/Arcana rolls and Specialty thresholds (8/12/16/20) jointly **after** candidate board choices, not using default Mastery as though every player has the same equipment.
- Correct character progression: Ariel crystal farming begins with 2,600-GR Hard Conquests; preserve historical crystals and preview access. PvP and Ariel permanent stat gains contribute to estimated CR with appropriate context, not fabricated PvE damage.

### Gate D — real rotation and in-game macro output

- Event scheduler decides priority from skill readiness, damage/charge time, buffs/debuffs, resource state, reset opportunities and target mechanics.
- Generate *actual in-game* Q/E/R (or Q/E/T) stack rows, in-game Macro key sequence, LMB weave, 1–8 manual keys, manual buff/defense/charge instructions. Never invent an external input script or guarantee client input order.
- Verify macro-skip and row priority behavior against client observations, including conditional skills and charged/cancellable spells; compare with manual throughput.
- If a manual action wins 1% in a model but requires 10x more input, surface the Pareto tradeoff and respect the player's selected simplicity preference.

### Gate E — validation and release

- All 8 classes × at least 8 contexts × 4 objectives where available × level 1–45 + endgame input budgets and three equipment tiers; include pinned and unpinned allocations.
- Independent legality: each rank/budget, four equipped Stigmas, legal Specialty unlock, 570 base board crystals and separate 232-point Ariel/Azphel caps; every purchased board path reaches its starting tile.
- Regression around user-reported Templar Shield of Protection rank choices, Sorcerer Hellfire manual behavior, Chanter Dark Crush trigger, Ranger Deadshot charge and Cleric group healing priorities.
- CI: syntax, data fidelity, class-model unit tests, optimizer property tests, mobile/desktop macro/board smoke checks. Actual calibrated DPS claims require in-client Global confirmation.

## Performance and deployment

The optimizer remains deterministic and free in the browser; it does not require running an AI model or paid inference on GitHub Pages. Cache by actual character inputs and use bounded neighborhood/beam search so the UI remains responsive at 1280×720 and larger. Preserve the current recommendation until a newly verified legal plan is ready, do not shuffle blue tiles after gold selections, and allow an explicit Recalculate.

## Release status

- **Implemented in this PR:** Local joint improvement for non-Sorcerer Mastery/Stigma ranks; Sorcerer-specific simulator retained; contextual independent-board routes; safe Macro alignment and tests.
- **Not completed in this PR:** Complete calibrated motion/damage dataset; all-class simulated rotation choice; exhaustive Stigma/Stigma-rank and board search; globally optimal six-board joint search; measured-DPS superiority certification.
- **Blocked on evidence:** Client-specific action locks, cancel parity and comprehensive combat-event logs. These are empirical requirements, not code-only tasks.
