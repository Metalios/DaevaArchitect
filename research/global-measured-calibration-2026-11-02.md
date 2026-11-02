# Global combat calibration — real measured cohort and repeat-fight protocol

**Snapshot:** November 2, 2026. **Game rules:** AION 2 Global (NA, SA, EU and Asia; KR/TW are not used for build progression). **Status:** measured class-level encounter cohort integrated; no individually authenticated player recordings or frame-accurate skill animation samples yet.

## What was actually measured and integrated

Primary source: [A2Tools public Global class damage statistics](https://a2tools.app/stats?inline=1&lang=en&region=global).

Its published default, unfiltered Global view reports **3,031 included encounter logs** and **13,441 player samples** across eight classes. The provider says repeated pull uploads are deduplicated, an uploader's contribution to a boss is capped at their most recent 10 fights, and highly imbalanced carried parties are omitted. The percentages beside skills are **used-by rates**, not damage share percentages. Per-class medians combine players of different equipment, target, team support and encounters.

| Class | Player samples | Median observed DPS | Middle 50% of observed DPS | Median recorded CP | Median GR |
|---|---:|---:|---:|---:|---:|
| Chanter | 2,653 | 20,520 | 8,510–29,520 | 106,781 | 2,212 |
| Spiritmaster | 1,148 | 19,440 | 7,470–28,910 | 110,022 | 2,243 |
| Sorcerer | 1,206 | 19,440 | 7,160–29,080 | 112,720 | 2,282 |
| Templar | 1,633 | 18,820 | 9,720–27,190 | 108,651 | 2,252 |
| Gladiator | 1,888 | 17,510 | 6,030–27,130 | 112,432 | 2,271 |
| Ranger | 1,740 | 17,370 | 6,000–27,190 | 113,676 | 2,254 |
| Assassin | 765 | 16,960 | 5,060–26,460 | 112,825 | 2,281 |
| Cleric | 2,408 | 10,800 | 4,980–17,070 | 104,525 | 2,235 |

The exact per-skill use percentages and modal Specialty IDs for 10 source-listed skills per class are in [global_combat_cohort_2026-11-02.json](global_combat_cohort_2026-11-02.json). Triggered/derived skills remain identified by their original source names; unknown IDs are not guessed into unrelated Mastery names.

**What this DOES measure:** real observed DPS at the source's encounter scope, use frequency of displayed abilities, and cohort distribution.

**What this DOES NOT measure:** optimal player damage, class balance at identical gear, individual ability damage coefficient, target mitigation, first-frame cancel window, the player's own ping/latency adjusted action lock, buff causality or PvP wins. Therefore the cohort is **diagnostic evidence**, not a factor that arbitrarily multiplies estimated DPS or forces build changes. Neither an extremely high best parse nor a commonly used Specialty is proof that every character should select it.

## Public records and independent reproducibility

- [A2Tools public encounter logs](https://a2tools.app/logs?inline=1&lang=en&region=global) show many shareable Global encounters. Individual full traces could not be retrieved as validated machine-readable event histories during this research session, so **none were fabricated or silently imported**.
- [Abyss Logs](https://abysslogs.com/) supports NA/EU/SA/Asia region selection and cast/buff timelines. Public skill timelines can be used for separate validation where shareable, but packet/event gaps alone are **not** minimum animation times.
- [Spike Global combat meter](https://github.com/EnzoCx/Spike) supports local exported name-redacted JSON v2; that format is **NOT** currently accepted directly by DaevaArchitect, whose file input requires the normalized schema below. Spike's README explicitly separates hit counts from cast counts and notes buff uptime was not exposed in its earlier release.
- [A2Tools DPS meter](https://www.a2tools.app/?lang=en) has Global skill timelines and recorded ping per fight; check game terms and provider privacy controls before using third-party packet capture software.

## How to produce a fair character-specific comparison

Perform a repeatable baseline/candidate test, preferably on a stable boss or practice target with the same incoming conditions. Use **at least five complete fights of each candidate**. Keep:
1. Character, class, weapon, item enhancements, Arcana rolls, equipment and title **unchanged** (represent changes only in Mastery/Stigmas/Daevanion/Specialties under test).
2. Exact boss ID, difficulty, target scope, fight mechanics, companion/pet, group composition, party buffs, movement assumptions, client patch and meter configuration fixed as closely as possible.
3. Record each encounter's in-game Combat Power, Gear Rating, ping, duration, skill casts, hits and effects.
4. Alternate baseline and candidate test order when possible to reduce practice effects. Avoid comparing a great crit streak against a single poor baseline.
5. Prefer manual video at known stable 60/120 FPS for **animation**: capture input frame, damage registration frame, next usable action/input frame, observed cancel/failure rate, ping, skill/combat speed and which skills/stigmas/modifiers were in use. Server cast intervals alone cannot determine animation lock.

**Normalization:** DaevaArchitect's local JSON input is a *custom interoperable schema*, not an existing meter's native output. Convert source event records with their documented cast/hit meanings. Do **not** invent cast packets from hits or turn the skill's listed zero cast-bar field into an action lock.

Illustrative structure (the damage values are deliberately fictitious test data):

```json
{
  "region": "Global",
  "clientVersion": "2.0.9.0",
  "classId": "templar",
  "durationSeconds": 60,
  "benchmark": {
    "buildLabel": "baseline",
    "bossId": "Krao",
    "difficulty": "Hard",
    "targetScope": "boss",
    "gearFingerprint": "same-equipped-gear",
    "combatPower": 115100,
    "gearRating": 2600,
    "pingMs": 55
  },
  "events": [
    {"timeMs": 0, "skill": "Pummel", "type": "cast"},
    {"timeMs": 150, "skill": "Pummel", "type": "hit", "damage": 1000},
    {"timeMs": 500, "skill": "Judgment", "type": "cast"},
    {"timeMs": 730, "skill": "Judgment", "type": "hit", "damage": 2100}
  ]
}
```

Use `buildLabel: "candidate"` for the changed build, with the **same gear fingerprint**. Select all JSON files together in Rotation → Compare Global combat evidence → Matched fight comparison. File data are processed in local browser memory and are not uploaded or included in share links.

The strict comparator requires:
- >=5 baseline and >=5 candidate fights, 20+ seconds each.
- Same Global class, client version, boss, difficulty, boss-only target scope and gear fingerprint.
- GR range at most 1%; CP range at most 12% (rank/board changes legitimately alter CP).
- Ping range at most 40ms; fight duration ratio at most 1.65.
- All event names recognized, no identical normalized fight-summary signatures.

It reports median observed DPS for both variants, a deterministic resampled **90% interval**, and whether the interval is entirely positive, entirely negative, or inconclusive. This is **observational**, not causal confidence; even a positive interval may reflect practice, party buffs, fight RNG, or unrecorded conditions. No build gets automatically changed, and no absolute-optimum claim is made.

## Integration and CI

- `js/engine/cohort_analysis.js`: cohort coverage, used-by skill and modal Specialty comparison, class median diagnostic and explicit non-comparability of unmatched fight records.
- `js/engine/combat_evidence.js`: normalized cast/hit/buff events, optional matched-fight fields and source identity labels; privacy preserving.
- `js/engine/matched_calibration.js`: strict baseline-versus-candidate observational comparison with 90% bootstrap range; no network, no estimated game effects.
- `research/global_combat_cohort_2026-11-02.json`: versioned, auditable source measurements and sample limitations, compiled into static `js/data.js`.
- `global_cohort_regression.mjs` and `matched_calibration_regression.mjs`: verify all eight samples (13,441), 80 recorded skill use observations, validation gates and deterministic uncertainty range.

**The empirical constraint:** We did not run AION 2 in the client or collect raw frame-capture videos in this environment. Therefore the all-class per-skill action-lock table and actual per-rank damage corrections remain unknown. This release is a measured cohort and repeatable calibration workflow, **not fabricated full calibration**.
