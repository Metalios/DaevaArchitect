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
- `node sorcerer_nightmare_smoke.mjs`: executes the real application
  model in Chromium for five fresh45 Solo paths, asserts distinct
  **purchased** Mastery/stigma loadouts, non-identical funded board prefixes,
  budget integrity, visible Nightmare context and manual overrides.
- Existing class-role, all-board connectivity, progression, combat,
  budget, preview and browser smoke checks must remain green.

**Scope:** This change fixes the Sorcerer PvE paths and clarifies level-45
Solo content. Other classes may also need a separate class-specific endgame
objective study rather than copying these Sorcerer policies.
