# Global Templar PvP full-build integration audit — November 5, 2026

## Prior blind spots confirmed in source code

1. The old `gearSkillLevels()` checked **each Arcana skill line in isolation**, so a malformed card with duplicate or over-budget lines could partially contribute despite failing the whole-card limits.
2. Normal Soul Binding skill bonuses could be entered at **+30 levels per line**, even though Global normal gear lines are +1 each. The equipment editor only exposed **three lines** where higher-grade pieces can carry more, and it did not distinguish active-only from passive-only eligible slots.
3. The Mastery point spender received `{...gearSkillLevels(),...account.gear}`, so a manually recorded skill bonus **overwrote** rather than **added to** an Arcana/gear bonus on the same named skill. This could lead to spending Mastery without considering the player's actual effective rank.
4. Recorded Arcana's Vigor/Magic identity and fixed divine stat weren't included in PvP scoring at all. Other recorded equipment stats from player-entered Soul Binding numbers and Amplification stars also did not feed the combat scoring projection.
5. Only some of the Templar's twelve active skills had Specialty roles in the PvP model, and important offensive passive skill ranks (Fury, Impact Hit, Insulting Roar, Punishing Benediction) were omitted.
6. The two standard-board candidates were graded at their **initial** Mastery/Stigma and contextual Specialty seed, before the later joint optimization could reassign ranks or Specialties. The chosen route could therefore lose to another connected route after funding and final skill optimization.
7. The board snapshot deliberately avoided recalculation after the first purchased node, but it also **ignored subsequent real equipment and Arcana changes**, including a different Arcana divine stat.

## Implemented corrections

- Recognize all five Global Arcana slots, their recorded **Vigor or Magic** set and main Empyrean Lord stat at the **8/12/16/20 grade base points**. A point contributes 0.1% to each of two derived stats. Keep these multiplicative *divine* modifiers separate from flat Attack, Critical and other regular gear stat fields. Current PvP scoring includes Time, Space, Death, Destruction, Justice, Life, Freedom, Illusion, Wisdom and Destiny with bounded sensitivity coefficients. This is not an invented final-damage formula.
- Do **not** add Arcana's conditional two/four-piece **PvE-only set bonuses** to PvP Attack or PvP Defense. Actual enhancement-derived divine stat increases are unverified from Global and are not silently assumed.
- Validate each complete card once, against the Global class/slot pool, no duplicate skill names and its grade/enhancement line budget. A normal Soul Binding skill line contributes exactly +1, with active skills from weapon/guard/rings and passives from armor/necklace/earrings. A wrong-slot skill is ignored. Larger rare-item line counts can be entered.
- Replace overwriting of manually recorded and item-granted skill ranks with additive combination in Mastery budgeting, effective-level display, joint optimization and PvP scoring. Effective rank = purchased Mastery + obtained/projected standard Daevanion skill nodes + equipped normal gear + recorded Arcana + any additional explicitly entered skill bonuses.
- Count known fixed equipment stats, entered socketed stones, recognized numeric Soul Binding stat notes and recorded Amplification stars. Arbitrary free-text notes are **not** interpreted as authoritative bonuses.
- Model all twelve Templar active Specialty sets and offensive/defensive passives. Every selected effect is gated by the resulting actual projected skill level, including the Global 8/12/16 option gates and 8/12/20 equipped-slot count. A level reached through Arcana or gear really can activate an additional Specialty option or slot.
- Compare the two connected Daevanian candidates **after** their own bounded Mastery/Stigma rank exchanges and legal Specialty search, then perform the final higher-budget joint optimization. Preserve manual ranks, equipment, Specialty selections and acquired tile connectivity.
- Refresh the recommended board route after changing equipment/Arcana, **even after the player purchased a few nodes**, but do not reshuffle it on each ordinary obtained-node click.

## Boundaries still requiring evidence

The output is a ranked, legal, **bounded comparative** build, not an exhaustive proof of the mathematically strongest Solo Abyss PvP character. The model does not have verified opponent combat logs, movement-range success rates, frame-accurate animation timing or a server damage formula.

Arcana UI now records the **actual** Global set. If an old saved card lacks an identifiable Vigor/Magic set, the planner shows a warning rather than inventing its divine stat. Set identity is preserved in shared links. The fixed Empyrean Lord stat from card grade is counted; enhancement-derived divine increments are deliberately not assumed without a verified rule.

A free-form Soul Binding field supports known numeric rolls such as `Attack +15` or `PvP Damage Boost 2%`. Invalid or ambiguous text is left unscored. The most reliable input remains exact equipment lines visible in game. A card's four available rolled skill lines are independent of the **three Specialty slots** on a character's active skill.

## Validation

- `node arcana_gear_templar_pvp_regression.mjs`: 12 active Specialty mappings, correct non-Arcana +1 levels, complete Arcana validation, actual divine multipliers, passive and offensive gear rank effects and legal effective-rank Specialty gates.
- Existing `node arcana_ariel_regression.mjs` for grade/slot/line rules.
- Extended `node templar_pvp_burst_smoke.mjs` in Chromium: budgets 285 Mastery / 218 standard Daevanion / 82 Azphel / 80–120 Stigma, with named Soul Binding rolls, 3 Arcana, Arcana main stats, additive manual skill bonuses and stable-then-refreshed board route snapshots.
- Updated `gear_swap_board_recalculate_smoke.mjs` to test +1 Soul Binding lines, consistent with the Global rules.

## Sources

- [NCSOFT NCER Global active Specialty unlock guide](https://lounge.plaync.com/feed/82766?country=US&locale=en-US) (official-party but explicitly AI-labelled; corroborate with Global datasets).
- [Aion2Data skill levels](https://aion2data.com/skill-levels): Mastery + board + Arcana + gear.
- [Aion2Data Arcana](https://aion2data.com/arcana): Global Arcana slot pools.
- [Aion2.gg Global/EU Arcana](https://aion2.gg/guides/arcana-system-explained): Vigor/Magic sets, base divine stats, conditional PvE set bonuses and 0.1% per divine point.
- [Aion2Data Templar skills](https://aion2data.com/classes/templar): passive effects and actual active options.
- In-repository `classes_data.json`, `specialties.json`, `arcana_rules.js`, `js/gear.js` and `js/engine/pvp_models.js`.
