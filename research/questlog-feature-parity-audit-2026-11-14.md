# QuestLog feature-parity audit — AION 2 Global, November 14, 2026

## Evidence and comparison scope

QuestLog: [AION 2 tools](https://questlog.gg/aion-2/en), [Global skill planner](https://questlog.gg/aion-2/en/skill-builder/new), [multi-stage character example](https://questlog.gg/aion-2/en/character-builder/TheDevotionOfTheGoldenHead), [item/socket editor example](https://questlog.gg/aion-2/en/character-builder/ParalyzingTransportUnderTheSpirit), [skill macro example](https://questlog.gg/aion-2/en/skill-builder/ETAwyX1VQmEy?build-id=9287). Independent comparison: [Aion2help tool overview](https://aion2help.com/en/tools/build-platforms/), October 2026. DaevaArchitect: published GitHub Pages app and repository checked against the current main branch.

Comparison uses public page content and repository internals. Some QuestLog views require login or client-side interaction; this audit does **not** assert undocumented API access or live feature correctness.

| Area | Observed QuestLog | DaevaArchitect main before PR | PR #70 change | Remaining work |
| --- | --- | --- | --- | --- |
| Multiple character builds | Named published and personal builds | One editable account per class, share fragment | **Complete independent saved builds** per class, duplicate/rename/delete | Optional online gallery/login |
| Gear progression stages | Multi-stage path, equipment variants by target GR | No independent named stages | **24 complete stages per build** with named goals and notes | Cost-aware upgrade guide |
| Compare builds | Comparison section and character stats | Current plan versus recommended only | **Snapshot-to-snapshot differences** for equipment, stones, skill ranks, board nodes, macros, title choices, stage resources | Evaluate resulting full Global stats per stage from authoritative data |
| Skill editor | Skill priorities, Stigmas, Specialty, macros | Custom-first Mastery, Stigma, Specialties and editable macro | All included in stage save and compare, including macro delays | Validate more timing/rotation results with Global logs |
| Full equipment editor | Per-slot enhancement, potential, rolled substats, stones | Equipment catalog, enhancements, amplification, Soul Binding and stone rolls | All retained per independent stage; changes visible in comparison | More ergonomic socket preview and substat ranking |
| Daevanion | Multiple boards and skill changes | PvE/Az Phel/Ariel custom connected routes | Each stage has independent planned tiles and resource budgets | Full target delta and costs by board |
| Arcana | Gear card choice and stats | Recorded gear/Arcana and effective levels | Arcana sets and rolled skill lines included in comparison | Curated exact Global card set data and roll constraints |
| Collections | Pets, Genus Insight, Wings, Monolith, Titles, Pantheon, skins | Titles and partial gear/Arcana, but missing several collections | No new unverified collection fields | **High-priority separate implementation** using Global client dataset |
| Import | Shareable builds, character armory in some regions | Share fragment but no verified PLAYNC account import | Portable, validated local JSON backup/import | Verified supported Global profile imports, only with real API/CORS |
| Public social features | Published builds, likes and comments | Static GitHub Pages, browser storage | Private offline stage library | Optional free hosted gallery with moderation |
| Region fidelity | Global and KR/TW separately | Global-only mechanics, scenario optimizer | Remains Global-only | Patch tracking and explicit provenance |

## Product principles

1. **Custom first.** A recommended path is always a proposal, never a global default or an overwrite of user choices. A saved recommended plan must be frozen as editable allocations.
2. **Complete snapshots.** Gear, enhancements, socket results, Mastery, Stigmas, Specialties, PvE/Azphel/Ariel boards, macros, titles, currencies, and scenario must move together.
3. **No bogus stats.** A calculated CP/GR comparison is only shown if the exact model supports the relevant Global stats; otherwise compare recorded inputs and label unknowns.
4. **No locked login.** Core planning, library snapshots and JSON portability work offline and without registering.
5. **Cross-stage safety.** Loading a shared link or starting blank must not overwrite a saved named stage; import of a backup must not overwrite saved builds.
6. **Global-only confidence.** KR/TW patches and unverified community recommendations must never silently become Global mechanics.

## This PR delivers

An offline, responsive character build library with automatic per-stage persistence, independent variants, same-class detailed comparisons, local export/import reusing the validated shared-build account sanitizer, and regression tests.

## Not delivered; important and still open

QuestLog's full collections, public gallery and social features, verified PLAYNC character import, detailed manastone picker redesign, and full authoritative final stat calculation are **not** complete in PR #70. Avoid claiming overall QuestLog parity solely because this new library passes tests.
