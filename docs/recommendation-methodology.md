# DaevaArchitect recommendation methodology
Reviewed: **October 22, 2026**. Target: **AION 2 Global**. Scope: 8 classes; Solo PvE, Group PvE, PvP; levels 1–45 and earned-point continuation.

## Goals and acceptance criteria
1. **Legal now:** no unearned Mastery/Stigma ranks, no locked active skill in a suggested macro, no nonexistent class skill or Stigma, no disconnected Daevanion route.
2. **Internally consistent:** recommended Mastery, Specialties, Stigmas, connected boards and the displayed macro must reference the **same** class, play context, current earned point budgets and recorded gear.
3. **Progressive:** leveling prioritizes short practical rotations; fresh level 45 establishes an immediately usable damage/healing engine; increasing earned points raises breakpoints without inventing equipment.
4. **Explainable:** next breakpoint shows the skill, effective rank and distance; suggested expenditures use actual recorded owned board nodes and effective gear bonuses.
5. **Reviewable:** keep Global guidance, class-specific choices and uncertainty in one audited policy module; keep manual build editing unchanged.

## Implemented in this branch
- `js/progression.js`: class-specific leveling/fresh-45 priorities, Stigma milestones, skill breakpoint targets and rotation guidance. PVP uses its context loadout instead of blindly cloning PvE objectives.
- `js/app.js`: consumes progression stages, keeps the existing legal allocation engine, and now reconciles manual hotbar Stigma skills in **all** contexts (previously Group PvE was excluded).
- `js/board_optimizer.js`: weighs remaining effective-rank deficits for verified high-priority class objectives while maintaining its connected, budget-valid path construction.
- `js/v2.js`: exposes the next meaningful skill breakpoint without pretending exact CP, DPS or gear drops.
- `recommendation_regression.mjs`: pure progression policy invariants across eight classes and three contexts; existing browser checks remain a required pull-request gate.

## Community research and sources
Mechanics and client data are authoritative where available. Guides contribute priorities but are not copied as final builds. **Do not claim proven strongest or fastest** without practical Global-client validation.

- [Aion2Data class guides](https://aion2data.com/guides): solo/group, Stigma breakpoints, Templar Judgment/Warding Strike and the Sorcerer Hellfire/Wish of Concentration cooldowns.
- [Wikily skills and specialty catalog](https://wikily.gg/aion-2/skills): translated effects and effective-level Specialty gates.
- [Metabot class builds](https://metabot.gg/en/aion-2/guides/class-builds-guide): player-derived roles and priorities, not scientific DPS evidence.
- [Aion2 Reddit hard dungeon Templar discussion](https://www.reddit.com/r/Aion2/comments/1xc25fi/to_templars_in_hard_dungeons/): practical block/Fury decisions.
- In-repository `specialties.json`, `stigmas.json`, `skill_unlocks.json`, `level_rewards.json` and `classes_data.json` are source-of-truth for the current imported Global dataset.
- See `README.md` for original Global snapshot research and limitations.

## Important distinctions
**Item Level** (e.g. 1200/1400/1600/2000+) is not **Combat Power** (usually shown in the tens of thousands). The 327+ figure is **earned Daevanion crystals**, not Item Level. Never promote either number to a gate without an authoritative Global source. The planner's CP model remains an estimate and does not independently unlock content.

## Deliberately not claimed or shipped
- There is **no frame-accurate damage simulator** or in-client benchmark. Recommendations are mechanically coherent heuristic priorities; no universal optimality claim.
- No automated purchasing/acquisition of gear or retroactive point awards.
- The **Ariel** endgame board introduced in an October Global update is *not* in the existing dataset. Its nodes, currencies and route must be imported and checked separately; do not infer or auto-generate it from Nezekan/Zikel/Vaizel/Triniel.
- Rotation macro hold times and latency-sensitive animation timings are unverified. Charged casts, healing, buffs, emergency defenses and target repositioning remain manual.
- No automated Item Level unlock progression recommendation yet: that requires real equipment and verified acquisition metadata, not a made-up CP-to-Item-Level conversion.

## Follow-up acceptance work before claiming optimized builds
Benchmark each class at levels 11/22/32/45, fresh-45 budgets (203 Mastery, 29 Stigma, 136 crystals), and 327+ crystals with the current Global patch; record single-target sustained damage, multi-target quest clear time, resource sustainability and survival under comparable conditions. Test each Specialty's actual cooldown/reset behavior and loadout before assigning a confidence score. Extend the board graph only after Ariel Global data is sourced.
