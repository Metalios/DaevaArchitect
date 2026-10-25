# Sorcerer Global — minimum manual input, high sustained damage

## AION 2 control mode and R remap

**This is for AION 2 action mode, not AION 1 mode.** LMB is Quick Use 1 / Flame Arrow basic attack; bind **RMB to the built-in Macro**. Quick Use 2 defaults to RMB / alternate T. Since RMB is reserved for Macro, **clear R from Quick Use 1's alternate binding**, then **remap Quick Use 2's T to R**. Manual abilities use **1–8**; macro hotbar stacks use **Q, E, and R (only when learned ground-damage Stigmas require the third stack)**. The planner can display original T instead by changing Quick Use 2 binding. See [control layout](./easy-human-macro-layout-2026.md).

Reviewed 2026-10-24. This is the **Easy sustained PvE** preset. It is NOT a demonstrated frame-optimal DPS ranking.

## Only two routine mouse buttons

- **LMB:** hold Flame Arrow (MP recovery, Fire Mark).
- **RMB:** hold the **in-game Macro**; it repeatedly tries all equipped automatic damage stacks. The player does not manually press Q/E/R.
- **Manual 1:** hold Hellfire to maximum charge, release when safe.
- **Manual 2:** Wish of Concentration buff. With its *actually acquired* level-16 reset Specialty, use after spending important cooldowns.
- **Manual 3–4:** Element Enhancement and Delayed Explosion only if the Stigmas are actually learned/equipped. Other shields and emergency abilities remain manual.

No class skill with unrestricted zero cooldown (e.g. Ice Chain) is included as a macro fallback because it can drain MP and compete with Flame Arrow or higher-impact attacks. Defiance stays on Space.

### Automatic stack priority (row 0 is BOTTOM)

| Stack/key | Row 0 — first tried | Row 1 | Row 2 | Row 3 |
| --- | --- | --- | --- | --- |
| **Q**, damage/debuff | Winter's Shackles | Bittercold Wind | Frost | Firestorm |
| **E**, conditional | Blaze | Frost Burst | Flame Scattershot | — |
| **R**, *only if damage Stigmas equipped* | Fire Wall | Cold Storm | — | — |

R gets omitted entirely when neither Fire Wall nor Cold Storm is equipped. It is not a default phantom key at level 36 if the player has Element Enhancement, Delayed Explosion and Steel Barrier.

Flame Scattershot is a **Stagger-only** skill (Global skill ID 15010000) with no cooldown. On E it goes *after* Blaze and Frost Burst so it cannot starve the high-priority conditional attacks. It will be unusable outside a Stagger window, so it won't fire continuously.

Winter's Shackles is a **damage attack applying a debuff**, with an optional +20% PvE damage specialty. Automatically casting it reduces human button presses but sacrifices the ability to hold it for a perfectly timed Hellfire burst. For maximum manual burst control, omit it from Q and cast it before Hellfire; the *Easy sustained* preset accepts this timing tradeoff.

Fire Wall and Cold Storm deal ground damage. They are automatically attempted on R **only when learned and equipped**. On frequently moving bosses an automatic ground cast may be wasted; players can remove the R macro step for those encounters. Because the user wants minimum manual effort, damage Stigmas are included by default rather than requiring two more keys to press.

### Macro steps

1. Press Q
2. Press E
3. Press R **if and only if** one or both damaging ground Stigmas are equipped

Start at 10 ms per step. Delay is not cast time, execution order isn't guaranteed, and a held macro can't react to a moving boss as a player would. Use the client Skill Queue option if macro presses are being lost during casting.

### Human combat loop

- **Regular mobs:** hold LMB + RMB. Finish with manual Hellfire only if warranted.
- **Boss:** activate learned buffs manually, hold LMB + RMB for setup/conditional effects, fully charge Hellfire on 1 when ready. Use Wish manually around your actual reset Specialty. Stop macro for mechanics or when automatic ground effects would be wasted.

### Global sources (regional scope)

- [Global skill data — Flame Scattershot needs Stagger](https://aion2.gg/database/skills/flame-scattershot-15010000)
- [Global skill data — Winter's Shackles is damage with a 45s cooldown and PvE boost Specialty](https://aion2.gaming.tools/skills/15110000)
- [Global client macro rules: 10–9900ms delays, manual takes priority, macro step order not guaranteed](https://aion2data.com/macros/sorcerer)
- [October 2026 Global Sorcerer three-chain community setup](https://aion2vault.com/builds/sorcerer/macro/) — split buff line from attack/conditional lines
- [Corpus aLuckyRO PvE](https://corpus.gg/blog/aion-2/sorcerer-pve-build) — demonstrates conditional Scattershot as macro step
- [October Global Sorcerer endgame examples](https://aion2.gaming.tools/builds/sorcerer/pve) — alternative longer damage macro, motion-sensitive ground attacks and Skill Queue advice

The two/three-step Easy preset is an engineering compromise optimizing fewer manual inputs and strong sustained damage. Comparative Global target-dummy testing is needed to claim more damage than a one-step fire stack, especially during mobile boss phases.
