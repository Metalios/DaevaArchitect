# Cross-region animation evidence policy — AION 2 Global planner
**Reviewed:** 2026-11-01. **Player build region:** Global only. **Animation evidence:** Global first, patch-compatible KR/TW second.

## Key finding

The original recommendation engine was too restrictive when it rejected Korean/Taiwanese **animation evidence** outright. Combat motion, client skill metadata and many attack-weaving mechanics overlap across clients, but the KR/TW client may be ahead in balance and animation-cancel patches. We must compare **mechanics and versions**, not assume matching motion locks from the skill's English name or both regions' release dates.

A global rank/currency/stigma/gear recommendation **always follows the Global rules** regardless of where a timing observation originated.

## What the available sources actually measure

| Source | Region / what is observable | Timing evidence quality | Appropriate use |
|---|---|---|---|
| [Abyss Logs](https://abysslogs.com/) | Separate NA/SA/EU/Asia and KR/TW combat encounters; skill/cast and buff timelines, opener, player gear/CP | Real combat-event sequences; delays include player choice, latency and mechanics | Measure actual action frequency, buff uptime, cooldown availability and **observed hit gaps**; do **not** infer exact minimum animation locks solely from adjacent hit timestamps |
| [Aion 2 Companion: Sorcerer](https://aion2.grimvane.app/companion/wiki/sorcerer-primer/) | Community KR/TW Hellfire 3-charge stages | Regional charge 0.5/1.0/1.5 seconds; with Skill Speed Specialty 0.35/0.70/1.05 seconds | A transferable **charge-stage hypothesis**, NOT the total skill action lock (release and recovery remain unmeasured) |
| [Aion 2 Maps: Macro and weaving](https://aion2maps.com/guides/auto-attack-cancel-and-macros/) | Game/client macro mechanism with historical KR/TW tests and Global context | Cancel exists; comparative rotation timing and region-specific patch details | Model normal and LMB-weave/held-macro separately. Numeric example delays and comparative DPS are not universally valid for a Global user |
| [Aion 2 Companion: Combat](https://aion2.grimvane.app/companion/wiki/combat-and-systems/) | KR Aug 26 minimum cancel time | Dated regional rule change | Cross-region parity gate: cancel measurements after this patch may not describe Global |
| [Templar skill mechanics and cancel history](https://aion2.akunito.com/en/classes/templar-skills-guide/) | KR Sep 16 Templar+Assassin cancel delay change | Dated historical patch with significant skills affected | Specifically flag Judgment, Pummel/Punishing Strike and affected Assassin skills; do not transfer these measured rotations unchanged |
| [Aion 2 Companion research](https://github.com/jonboy648/aion2-companion/blob/main/research/sorcerer_skills_notes.md) | Client field `casting_time` reportedly zero for every skill in the dump | Structured source documents no visible cast bar, not motion recovery | **Never** use a database `casting_time=0` as `lockSeconds=0` |
| [Aion 2 Companion simulator](https://aion2.grimvane.app/simulator/) | User-adjustable action animation, cancel minimum, latency and attack speed; KR Templar sample fights | The published default values (e.g. 0.8s basic and 1.0s skill) are simulator assumptions, NOT established Global measurements | Compare sensitivity scenarios and fit observations only; do not automatically import defaults as exact action durations |
| [Global built-in Combat Analysis](https://aion2help.com/en/tools/dps-meter/) | Global self-only damage/fight history, reported Ctrl+X | Damage totals and skill shares, not frame-level motion | Cross-check relative DPS outcomes after consistent dummy tests; verify in-client feature availability |
| [DaevaMeter](https://daevameter.online/features) | Claims Global per-skill rotation order and inter-skill timing in live fights | Observed combat event timing with external capture limitations | Potential Global source of action sequences and cast gaps, never per-skill minimum cancel alone |

## Evidence precedence and constraints

1. **Global frame-measured action locks** (same class, skill variant, macro mode, Combat Speed, Skill Speed, ping and client patch) win.
2. **KR/TW frame-measured locks with documented Global cancel-rule parity** are transferable as **regional-validated-transfer**, still separate from native Global evidence.
3. **KR/TW frame measurements without verified patch parity** can be tested as **regional-sensitivity-only**; run low/base/high uncertainty scenarios and do not describe their numerical output as known Global timing or publish it as definitive build rankings.
4. **Global server event intervals** are useful for observed scheduling/uptime and compare after taking ping and movement into account. Event gaps alone **cannot** prove client animation recovery or minimum cancel.
5. A regional charge timing can inform charge timing, but cannot substitute for whole action lock. A numerical attack duration is valid only for its exact measurement kind.
6. KR/TW unique Stigma levels/extra slots, additional boards, class rank caps and mechanics from later regional patches are **not** Global character rules.

## Measurement record contract

Each frame-timing sample should carry at least:
- `region`, `clientVersion`, `classId`, `skill` (stable game identifier preferred), `skillVariant`, `mode` (`normal`, `basic-weave`, `held-macro`)
- `kind`: `input-to-next-usable` vs `observed-hit-gap` vs `charge-stage`
- `seconds`, `samples`, `combatSpeedPct`, `skillSpeedPct`, `cancelSpecialty`, `source` (link to evidence)
- When transferred regionally: `rulesMatchGlobal` supported by a patch/mechanics comparison; do not default it to true.
- Recommended additions in source dataset: 30–60 FPS/120 FPS frame capture details, timestamp quality, ping, FPS/frame pacing, recording date, 5th/50th/95th percentile, target distance, ability state, speed buffs, cooldown effects and damage event IDs.

Do **not** use a skill named the same across regions as sufficient parity proof. Do not infer an attack's theoretical minimum animation time from the minimum interval between two different skills without proving whether there were button-buffer, basic-weave, server lockout or latency effects.

## Implementation

- `js/engine/animation_evidence.js`: Global-first resolver; validates sample metadata, requires compatible action type/variant/speed and at least three samples for inclusion, prevents `observed-hit-gap` being accepted as an action-lock measurement. Regional transfer requires an explicit option. Unknown parity is only permitted under a second sensitivity-scenario option, and the result remains clearly marked.
- `js/engine/combat_timeline.js`: accepts timing records plus a timing context, uses the resolver before timeline validation and returns exact per-action provenance and regional transfer cautions. Missing locks are **not** fabricated.
- `animation_evidence_regression.mjs`: covers Global precedence, unknown-patch regional transfer, speed mismatch, hit-gap rejection, Hellfire charge-versus-lock separation, and timeline uncertainty output.

**Not yet implemented:** a frame/video/packet importer, complete per-skill animation records for all eight classes, measured timing confidence intervals, and the joint all-class recommendation solver. The source pages do not publish reliable, standardized full-animation locks for every class; do not claim those numbers exist or are in the planner.

## Next validation path

Gather paired 1/3/5-minute test-dummy parses per class with the same gear/build and (a) macro only, (b) macro+LMB, (c) chosen manual skill; collect client video at fixed FPS for a few signature actions. Use the in-game Combat Analysis values to sanity-check derived output, and use timestamped Global fight logs to validate cast frequency, buff uptime and event order. Where Global timing frames are missing, use regionally measured frames as sensitivity bounds **only after patch-parity review**. This is enough to fit a meaningful event simulator incrementally without claiming an unmeasured absolute optimum.
