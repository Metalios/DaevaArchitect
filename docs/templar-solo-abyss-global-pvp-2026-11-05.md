# AION 2 Global Templar Solo Abyss PvP — 5 November 2026

## Research correction: Executing Blade beats the default Banner for the catch-and-kill profile

The original Solo Abyss draft used **Doom Shield / Grapple / Shield of Protection / Battlefield Banner**. That build had engagement and defense but omitted the short-range Defense shred needed to convert Grapple into a kill. A November 2 comparison of 394 public Global Templar macros found player **riderastolfo** using **Grapple → Executing Blade → Punishment** once in a larger macro cycle; seven other public builds copied that layout. Community adoption is evidence of use, not measured win-rate superiority.

The default Solo Abyss (ranged-heavy) preset is now:

**Doom Shield / Grapple / Executing Blade / Shield of Protection.**

The fourth slot is matchup-dependent:
- **Executing Blade** (default): 4m range, 45s cooldown reduced to 30s at Stigma Lv5. Applies **-30% Defense for 5s**, Lv10 adds **Exposed for 5s**, Lv15 guarantees a Critical Hit, Lv20 adds damage against Impact-status targets. This gives a more frequent attack/debuff window than Battlefield Banner.
- **Battlefield Banner** (swap): Attack scaling with Defense, valuable for maximizing one planned damage window. Client and guide versions disagree on duration; validate actual Global client before promising a measured gain.
- **Second Skin** (survival swap): manual PvP tolerance if getting focused, at the cost of offensive Stigma damage.
- **Shield of Protection** (retain default): guaranteed Block during ranged pressure, two uses at Lv5 and mobile casting at Lv10.

### Context profiles remain distinct

| Venue | Recommended equipped Stigmas | Role |
| --- | --- | --- |
| Solo Abyss | Doom Shield, Grapple, Executing Blade, Shield of Protection | Re-engage, strip Defense, finish, survive |
| Arena 1v1 | Doom Shield, Shield of Protection, Battlefield Banner, Nezekan's Shield | Bait burst and counterattack; swap to Grapple against persistent kiting |
| Group Abyss | Grapple, Empyrean Lord's Punishment, Comrade in Arms, Doom Shield | Hook targets, area crowd control, protect allies |

Global equips **four**, not five, Stigmas. This is an evidence-grounded default, not universally proven best-in-slot.

## How the catch-and-finish sequence works

- **Grapple**: 20m target selection, pulls up to four enemies from a 7m area in front of the caster, 3s Root; **90s base cooldown**, Lv5 adds a 50% Stun chance, Lv10 a 20% Max HP Protective Shield, Lv15 reduces its cooldown 30s.
- **Executing Blade**: follows only if enemy was pulled within **4m**; its -30% Defense lasts 5s. At Lv10 Exposed improves the chance of landing follow-up attacks (additional exact Evasion/Block claims are community-reported, not independently verified from Global tooltip).
- **Punishment**: **20m charge skill, 30s cooldown**, grants Executor for 20s: **+200 Accuracy, +20% PvE Damage Boost and +10% PvP Damage Boost**. The PvP community often taps for Executor rather than charging because targets escape or interrupt. The fully charged version is a manual situational option.

**Important:** Q is a **manual, priority-ordered three-skill stack**, not a promise of deterministic sequencing. In-game stacks select the highest-priority ready skill; a 4m range gate, CC immunity, cooldown and skill-queue timing can interrupt or skip the intended order. **Do not put Q in the held RMB macro**: that would auto-spend a 90-second Grapple or release Punishment at minimum charge. The actual controlled PvP sequence may be `Q → Q → Q` while the target remains in range, using 8 for a deliberate charged Punishment. If the client disallows two Punishment bindings, use only Grapple / Executing Blade in Q and Punishment on 8.

The held safe-uptime macro remains **LMB Vicious Strike + RMB E (Judgment → Warding Strike → Pummel)**; no movement or control in the automatic stack. Manual number keys also expose Poach, Shield Rush, Doom Shield, Shield of Protection, Debilitating Smash, Shield Smite and Annihilate. Defiance (Space) is reactive. Keep **Debilitating Smash's -60% Incoming Heal** debuff active when in melee range. Wait out enemy Defiance immunity before trying to land Stun / Knockdown.

## Points and skill milestones

### Stigma Shards

A fresh Global level 45 after the required third Ascension begins with **30 Shards**. An example legal 30-point baseline is:

| Skill | Stigma level | Total cost |
| --- | ---: | ---: |
| Shield of Protection | 10 (mobile block) | 15 |
| Doom Shield | 5 (resets Annihilate) | 5 |
| Grapple | 5 (Stun chance) | 5 |
| Executing Blade | 5 (-15s cooldown) | 5 |
| **Total** | | **30** |

The default Solo Abyss rank policy now preserves these tested-cost milestones instead of letting a generic comparative proxy override them. It produces **all four Stigmas at Lv10 with 60 Shards**, then **Executing Blade Lv15 at 80 Shards**, respecting the actual cumulative brackets and any manual player customization. These are explicit strategic targets, not a measured optimal win-rate solution.

### Mastery / Daevanian effective-level goals

Purchasable Mastery caps at rank 10 per skill; effective skill 12/16/20 requires purchased connected boards or owned gear bonuses. Solo Abyss targets:
- Poach effective 8 option 2 (-20% enemy Status Effect Resist), 12 add option 4 (10% Max HP shield), 16 select option 5 (Stun chance).
- Shield Rush 8 option 2 (+10m range), 12 option 4 (-10s cooldown), 16 option 5 (+25% Stun chance).
- Debilitating Smash 8 option 3 (-60% Incoming Heal), 12 option 2 (+3s Debilitate) to keep anti-heal longer.
- Defiance 8 option 1 (Capture chain), 16 option 5 (+25% PvP Damage Tolerance during Tenacity).
- Shield Smite 8 option 1 (+1s Stun), 12 option 4 (-2s CD). Annihilate 8 option 2 (+20% Knockdown chance), 12 option 4 (-10s CD).
- Judgment 16 option 5 (cooldown removal), Punishment 8 option 3 (+30% skill speed), 12 option 4 (mobile).

Skill target ordering is a policy based on Global effect data and likely ranged encounters, not a per-opponent calibrated optimum. The four regular boards optimize connected +skill node routing; **Azphel** has a separate Battle Crystal budget and PvP accuracy/status/defense weighting. Preserving already obtained tiles remains mandatory.

## Research provenance and limits

- [Global skill data: Executing Blade](https://aion2.gaming.tools/skills/12410000), [Grapple](https://aion2.gaming.tools/skills/12220000) and [Punishment](https://aion2.gaming.tools/skills/12090000), Global 2.0.9.0 snapshot (Oct 29).
- [AION2 Vault Templar macro analysis](https://aion2vault.com/builds/templar/macro/), updated Nov 2, describes riderastolfo's three-skill sequence and its frequency in a public Global player build sample. A macro step in that source represents a hotkey or skill-stack chain; it does **not** certify frame-perfect activation.
- [AION2 Vault Templar PvP sample](https://aion2vault.com/builds/templar/pvp/) (Oct 18), includes contrasting defensive and group control presets from NoBS and Xia.
- Repository `specialties.json`, `stigmas.json`, `classes_data.json` and `azphel_data.json` provide the planner's Global tooltip, costs and topology.

Not measured: PvP combat hit chance, actual Root / Stun uptime, animation-cancel opportunities, connection/latency skips, effective DPS against moving players or matchup win rates. Those require same-patch Global combat testing.
