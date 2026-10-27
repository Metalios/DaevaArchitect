# PvE objective optimizer (initial research-driven implementation)

## Purpose and supported behavior

The objective search is a deterministic *candidate optimizer*, not an AI model or a verified best-in-slot solver. It runs in the user's browser and requires no paid inference endpoint. Its inputs are the character class, Solo/Group context, objective, level/unlocked boards, earned Daevanion crystals, already obtained nodes, Mastery, equipped skills and recorded gear skill bonuses.

Four objectives are available in both PvE contexts:
- Maximum PvE performance: mixed damage, consistency, movement and defense.
- Maximum survivability: effective defensive-stat proxy and minimum offensive utility.
- Maximum sustained DPS: high sustained damage through passive, speed and cooldown synergies.
- Maximum burst DPS: high short-window impact.

The existing PvP flow is unchanged.

## Knowledge model

`js/optimizer/objectives.js` contains versioned *source pointers* and class-synergy hypotheses. Source pointers are not bulk-imported combat logs, nor are they a validated player-build training set. The engine always distinguishes proxy scores from evaluated combat estimates. It does not claim actual server DPS or guaranteed global optimality.

Current verified node topology, resource costs, effective levels, level gates and stat IDs remain in the imported Global client dataset. Reference routes and community guides are seeds, not enforced end results.

## Search

1. Build all unlocked PvE board graphs from authentic node coordinates and costs.
2. Insert known free roots and reconnect protected purchased tiles.
3. Expand affordable shortest connected routes, retaining a bounded collection of distinct candidate configurations.
4. Evaluate candidates against whole-route skill/rank breakpoints, proxy stat utility and class-specific synergy hypotheses.
5. Compare against several conventional candidate seeds as guardrails.
6. For Sorcerer, re-rank finalists by the existing comparative combat simulator: short encounters for Burst, longer encounters for Sustained, blended scenarios for Performance. The other seven classes use research-backed skill-interaction and role projections in `js/engine/class_models.js`, incorporating objective, solo/group context, effective rank and equipped Stigma breakpoints. Survivability remains a structural scenario proxy, not an incoming-damage simulator.
7. Complete the selected funded path with the remaining connected nodes, ensuring future crystal increases have legal purchase options.

The search is bounded; it can miss globally optimal solutions and never reports numerical optimality guarantees. The funded path is ranked at the *current budget*, not simply the first N nodes of a universal route.

## What remains to make this truly evidence-trained

- Normalize public Global builds into deduplicated patch- and region-tagged evidence records. Observe source licensing/robots and do not mistake build popularity for empirical DPS.
- Obtain measured Global encounter data for exact skill proc probabilities, damage scaling, mitigation, interrupt/movement effects, buff windows, animation canceling and armor/resistance.
- Replace tentative Sorcerer coefficients with measurements and provide error bars.
- Calibrate the seven new class-specific interaction models with measured, event-based Global attack/heal logs; their current outputs remain comparative projections, not verified DPS/HPS.
- Replace survival proxies with enemy damage timelines, cooldown timing, expected healing and risk of death.
- Add measured CP and performance correlation without optimizing CP blindly over damage.
- Add Ariel from confirmed Global source data as a separately budgeted board.
- Evaluate quality on reserved public build/encounter datasets; compare baseline and new optimizer, test multiple budgets/gears, and profile performance on mobile.

## Verification

`node recommendations_audit.mjs` also executes `objective_optimizer_audit.mjs`, including four objective variants, connected legal paths and preservation of purchased node IDs. Continue to run existing browser smoke tests. Do not merge the feature until CI and human in-game validation both pass.

## Evidence ingestion and conservative learning

`research/pve-observations.json` is an explicitly versioned source table.
The initial seven entries represent **seven guide summaries**, not seven measured
character fights or an imported sample of thousands of independent characters.
Each record contains a unique ID, region, patch, source URL, type, skill priority
ranks, selected Stigmas and an explicit `measured: false` flag.

`build.py` validates skill/Stigma identifiers against the bundled Global game
catalog, rejects duplicate evidence IDs per patch, and compiles `RESEARCH_PRIORS`
into the static build. Guide adoption is capped at an **8% modifier** of
candidate-search weights; it cannot overcome crystal costs, graph connectivity,
class mechanics or recorded gear. These are intentionally modest starting priors,
not a combat model trained on actual logs.

To expand this corpus, import lawfully accessible, deduplicated and appropriately
licensed public build observations with their source, patch and region. Do not
mislabel an aggregated guide as an independent player sample; obtain compatible
fight/rotation measurements before treating a high-CP build as best DPS.
