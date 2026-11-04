# Sorcerer PvE differentiation: Nightmares at level 45
Reviewed: 2026-11-03 (Global Season 1)

## Why this change exists

The old application passed the same fire-focused Mastery purchase ladder to
Performance, Maximum Sustained DPS and Maximum Burst DPS and often equipped the
same four offensive Stigmas. A different scalar optimizer objective did not
create different feasible endgame loadouts. Level-45 Solo PvE was described
like leveling, even though it includes Nightmare bosses and Ascension Trials.

**At level 45, Solo PvE now means progressing solo Nightmare boss ladders and
Ascension Trials.** Leveling uses a separate stage and retains its existing
macro progression.

## Deliberate endgame tradeoffs

These are Global four-slot **research-informed loadout policies**, not claims
of a statistically proven #1 DPS build.

| Goal | Solo 45+ (Nightmare / Ascension) | Group 45+ |
|---|---|---|
| Balanced performance | Element Enhancement, Delayed Explosion, Steel Barrier, Fire Wall | Element Enhancement, Delayed Explosion, Fire Wall, Steel Barrier |
| Sustained DPS | Element Enhancement, Delayed Explosion, Fire Wall, Cold Storm | Element Enhancement, Delayed Explosion, Fire Wall, Cold Storm |
| Burst DPS | Element Enhancement, Delayed Explosion, Divine Burst, Steel Barrier | Element Enhancement, Delayed Explosion, Divine Burst, Fire Wall |
| Survivability | Element Enhancement, Steel Barrier, Arctic Armor, Hibernation | Element Enhancement, Steel Barrier, Arctic Armor, Hibernation |
| Control / Kiting | Hibernation, Curse: Tree, Cold Storm, Steel Barrier | Hibernation, Curse: Tree, Cold Storm, Steel Barrier |

The **balanced** solo path retains a manually timed shield rather than
pretending the damage-stigma dummy optimum is safe in every Nightmare.
The **sustained** path removes that protection for two ground-damage effects
and must be treated as higher-risk boss farming, not a safe progression path.
The **burst** path drops persistent ground damage for a short fully charged
Hellfire / Delayed Explosion / Divine Burst opportunity while retaining the
shield in Solo. Divine Burst has a Global 60s cooldown and 50 Stagger Gauge
damage, but no guaranteed boss stagger or crowd-control is assumed.
The **survivability** path buys real defensive passives and mitigation.
**Control / Kiting** is primarily useful in Ascension Trial packs and
movable targets; bosses may resist crowd-control effects.

Even where two contexts share the same Stigma identities, their **Mastery
purchase orders, objective risks, encounter modeling and Daevanion weighting**
can differ. No difference is fabricated solely to make two loadouts appear
unique; each of the five **within-context** goals has a distinct Stigma bar.

## Investment planning

- Fresh Global 45 defaults remain 203 Mastery, 30 Stigma, and 136
  ordinary Daevanion crystals; no points or gear are invented.
- Actual selected objective now drives the purchased Mastery order at 45.
  Leveling and PvP have separate progression logic.
- A survivability goal's first ordinary-board targets include Robe of Earth,
  Absorb Essence and Grace of Resistance, not damage-only milestones.
- A Solo balanced goal includes a Robe of Earth breakpoint; sustained
  targets Firestorm/Blaze and cooldown uptime; burst targets Hellfire/Wish
  and Winter's Shackles.
- Solo endgame ordinary-board defensive weights rise for balanced and
  survival goals; sustained explicitly relinquishes that bias.
- Existing obtained nodes, actual gear skills, Arcana, user-set specialities,
  manual Mastery/Stigma decisions and custom loadouts remain authoritative.
- The recommended-route snapshot version changes so existing blue paths
  are recomputed once for these policy changes, then retain the usual stable
  purchased-tile behavior.

## Movement-first Nightmare combat (clarified objective)

The user's Solo endgame priority is **damage delivered per real elapsed combat
second while moving**, not maximum stationary dummy damage or the fewest
seconds of theoretical cast time in a zero-movement arena. Fast attacks and
mobility are the first offense constraints; shield/mitigation spending serves
the chosen risk tolerance.

**Verified Global movement mechanics** from the Global Sorcerer skill catalog:

- **Mobile by default:** Flame Arrow (LMB), Firestorm (5s cooldown), Blaze
  (Fire Mark required; 5s cooldown), Frost and the primary offensive buffs
  Wish of Concentration, Element Enhancement and Delayed Explosion.
- **Hellfire:** always fully charged manually. At effective level 8, there
  is only **one** Specialty slot: choose **option 1, +30% Skill Speed** first,
  instead of the previous rule that forced mobile option 3 and made charges
  sluggish. Effective level 12 unlocks the second slot: for mobile Nightmare
  play, use **options 1 + 3** (+30% Skill Speed and mobile). At effective
  level 20, a third slot permits combining these with another legal effect
  such as the option-5 cooldown reduction. Player-pinned alternatives
  remain authoritative.
- **Bittercold Wind:** level-8 Specialty **option 2** changes to mobile.
- **Winter's Shackles:** level-8 Specialty **option 1** changes to mobile.
- **Frost Burst / Flame Scattershot:** level-8 mobile Specialties
  **options 2 / 3** respectively, but are conditional on Frost / Stagger;
  they are not unconditional boss-fight filler.
- **Fire Wall, Cold Storm, Divine Burst:** do not enter the automatic
  moving-damage macro. They remain deliberate casts in safe stationary
  windows; their ground fields lose value on relocating bosses.

The planner scores **positioning/stop opportunity cost** in movement-heavy
Nightmare scenarios rather than assuming all casts can be continuously used
while moving. Its **Q stack now tries conditional Blaze first
(bottom row 0), then Firestorm (row 1)**; LMB Flame Arrow provides
repeatable Fire Mark and MP recovery when the cooldown skills are unavailable.
A possible **E** stack contains Bittercold Wind and/or Winter's Shackles
**only if the matching mobile Specialty is actually earned and selected**.
The visible macro checks obtained-board skill levels (not just future blue
planned nodes), preserving the real unlock gate.

The 1–8 hotbar is rebuilt from the **actual four equipped Stigmas**:
1 = manual full-charge Hellfire, 2 = manual Wish of Concentration;
then all equipped Stigmas not already in the automatic macro get their own
manual keys, with unused slots assigned to deliberate follow-up attacks.
For example, Solo Sustained DPS now displays Element Enhancement,
Delayed Explosion, Fire Wall and Cold Storm on the manual bar. Ground spells
remain manually timed for stationary windows, not cast automatically on
moving bosses. No equipped but unautomated Stigma is silently omitted.

To reduce perceived lag, enable **Skill Queue** in the game's
**Settings > Combat > Controls** (when available in the Global client).
In-game Macro steps use a minimum 10 ms delay, but the game explicitly
does **not** guarantee deterministic keypress order. Do not confuse
macro delay with actual cast animation or cooldown time.

The stop-cost coefficient, base action occupancy, boss movement schedule,
actual interruptions, Firestorm fireball count and server animation cancels
are not measured. The relative damage-per-elapsed-second result is a
**sensitivity ranking**, not a claim of absolute DPS or an exact Nightmare
clear time. User-pinned Specialties always win over this policy.

Source references:
- [Global Sorcerer movement and cooldown overview](https://aion2.grimvane.app/companion/wiki/sorcerer-primer/)
- [Global Firestorm 5s cooldown and Skill Speed](https://aion2.gaming.tools/skills/15040000)
- [Global Bittercold Wind mobile Specialty](https://aion2.gaming.tools/skills/15280000)
- [Global Winter's Shackles mobile Specialty](https://aion2.gaming.tools/skills/15110000)
- [Global PvE Sorcerer mobility and Hellfire Specialty](https://metaroad.gg/aion2/build-guides/sorcerer-pve-dps-build)

## Scenario assumptions

The dedicated Sorcerer relative-damage engine compares group scenarios
separately from modeled Nightmare boss movement and short manual burst
windows. The movement/animation sensitivity figures in
`GlobalCombatEngine.NIGHTMARE_ENCOUNTERS` are **not verified client timing**.
They are explicit uncertainty inputs to compare safer versus greedier damage
recommendations, not real DPS, a guarantee of full Hellfire charge, or
measured odds of clearing a boss.

The engine includes a separate manual Divine Burst event for the corresponding
loadout. Its Global tooltip's 60s base cooldown and 50 Stagger are sourced,
but its relative damage/occupancy still use hypothetical normalized
coefficients until same-version fight recordings can calibrate them.

## Sources and provenance

- [Global Sorcerer PvE 4-Stigma and alternate safety/stagger setups](https://aion2.grimvane.app/companion/wiki/sorcerer-guide/)
- [Global solo/party recommendations and level-45 Stigma budget](https://aion2.gg/guides/sorcerer-pve-build)
- [Nightmare as a one-on-one boss ladder](https://corpus.gg/blog/aion-2/nightmare-guide)
- [Global Ascension and Nightmare solo endgame categories](https://aion2.gg/guides/solo-and-ranked-endgame)
- [Global Divine Burst 60s/50 Stagger, version 2.0.9.0](https://aion2.gaming.tools/skills/15360000)
- [Sorcerer current commonly sampled four-Stigma bars](https://aion2builds.com/builds/sorcerer/)

Community usage is **not** independent performance validation. A large
majority of sampled endgame Sorcerers still use the same all-damage core;
it would be misleading to claim every new variant is proven superior at
every gear score, boss and movement rate.

## Validation gates

- `node sorcerer_nightmare_regression.mjs`: ten endgame goal/context
  policies, five distinct Stigma bars per context, budget-safe actual
  fresh45 Mastery ranks, defensive/burst breakpoints and Solo scenarios.
- `node sorcerer_mobile_damage_regression.mjs`: verified movement
  gates, forced-stop time, Hellfire's faster first Specialty followed by
  mobile second Specialty, Blaze-first priority, manual overrides and Q/E.
- `node sorcerer_manual_hotbar_regression.mjs`: asserts that all equipped
  unautomated Stigmas have unique manual keys for every Solo PvE role,
  with automatic Group PvE ground Stigmas accounted for separately.
- `node sorcerer_nightmare_smoke.mjs`: executes the real application
  model in Chromium for five fresh45 Solo paths, asserts distinct
  **purchased** Mastery/stigma loadouts, non-identical funded board prefixes,
  budget integrity, visible Nightmare context and manual overrides.
- Existing class-role, all-board connectivity, progression, combat,
  budget, preview and browser smoke checks must remain green.

**Scope:** This change fixes the Sorcerer PvE paths and clarifies level-45
Solo content. Other classes may also need a separate class-specific endgame
objective study rather than copying these Sorcerer policies.
