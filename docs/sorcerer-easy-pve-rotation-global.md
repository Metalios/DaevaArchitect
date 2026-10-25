# Sorcerer Global: strong damage, Templar-level ease (Oct 24, 2026)

**Target:** keep human inputs very low for everyday PvE. Regular damage, Fire Mark, Frost and conditional follow-ups run automatically while the player holds **LMB + RMB**. No automatic buffs, charged Hellfire, crowd-control reactions, or manually placed ground spells. In-game macro only. *Not an in-game DPS benchmark.*

## Default Sorcerer controls

| Key | Player uses it for | Notes |
| --- | --- | --- |
| **LMB** | Flame Arrow | Hold for basic attack and MP recovery |
| **RMB** | ONE in-game Macro containing **Q then E** as two steps | Hold with LMB, 10 ms starting delay, not a guaranteed cast sequence |
| **Q stack** | Row 0 Bittercold Wind; row 1 Frost; row 2 Firestorm | Automatic effect setup and cooldown damage |
| **E stack** | Row 0 Blaze; row 1 Frost Burst | Automatic Fire Mark/Frost conditional follow-ups |
| **1** | Hellfire | **Charge fully yourself** |
| **2** | Winter's Shackles | Apply damage vulnerability before Hellfire during safe boss windows |
| **3** | Wish of Concentration | Manually time the offensive buff; if the selected effective-level-16 option reduces all cooldowns, use *after* major cooldowns |
| **4–7** | Element Enhancement / Delayed Explosion / Fire Wall / Cold Storm | Manual only **when learned and equipped**. Ground effects only when enemies will stay put |
| **8** | Flame Scattershot | Situational stagger attack |

At character level 34 Global only three Stigma slots are available. The planner must display only **actually learned/equipped** Stigma skills within those slots, not the full four-Stigma level-45 setup. Character levels 4–9 use a single Q core. From level 10, Frost Burst becomes available and the macro gains its E follow-up step. At levels 1–3 the game Macro setup is hidden.

## Actual player loop

**Normal quest enemy:** Target → hold LMB + RMB → dodge when necessary. The macro handles the Q/E priority choices. Full Hellfire not required to kill every small enemy.

**Elite / boss:** activate currently learned damage buffs manually (4–5); use Winter's Shackles (2) if a good damage window; fully charge Hellfire (1). When the manual burst is over, hold LMB + RMB for automatic Q/E damage. Place ground Stigmas manually only where the boss is stationary. Defiance stays manual on Space. If Wish's cooldown-reset Specialty is *actually selected*, use it after the major cooldowns have been used.

## Why two Macro steps?

The popular Global three-stack Sorcerer setup runs buffs/Stigmas, then damage effect setup, then conditional follow-ups. We **remove the entire buff/Stigma automation step** and retain only the two regular damage steps. The player still holds **one RMB key** for both. The game internally advances through the steps and can skip unavailable skills. It does not guarantee exact server-side order.

Two steps may reduce checks of Q compared with a one-step macro; **damage could be worse in some fights**. Conversely automating the E follow-ups avoids manual input and may improve practical sustained damage for people who don't perfectly track Fire Mark and Frost windows. We have no controlled DPS experiments or frame-by-frame Global in-game logs to prove the optimal choice. Hence label this **Easy sustained PvE**, not “absolute best DPS.”

### Global evidence and conflicting advice

- [Aion2 Vault, Oct 20, 2026](https://aion2vault.com/builds/sorcerer/macro/): 174/361 publicly surveyed Global macros use a three-line buff/setup/follow-up system, Blaze depends on Fire Mark, Frost Burst on Frost; Hellfire generally fully charged manually
- [Mobalytics Eutopia Sorcerer, Oct 24, 2026](https://mobalytics.gg/gamebase/guides/aion-2-sorcerer-hellfire-pve-build): fully charged Hellfire and manual Wish are reasonable; cooldown effects of Firestorm; longer macro alternative
- [Aion2Data, Global 2026.10.21 client](https://aion2data.com/macros/sorcerer): manual inputs supersede macro; 10–9,900 ms delays; step execution order not guaranteed; AION 1 control mode mouse exception
- [Corpus, Oct 4, 2026](https://corpus.gg/blog/aion-2/sorcerer-pve-build): use filler macro, manually time Hellfire and cooldown effects

Avoid unverified KR/TW regional level targets and their differing combat rules. Require real selected Specialty ranks before making Specialty-dependent claims. The split is designed to minimize human decisions, rather than clone an external guide's whole build.

## Regression tests

- `leveling_rotation_audit.mjs`: 720 class/context/level combinations, correct Macro step count (0/1/2), skill unlocks and earned Stigmas, never auto buffs/Hellfire
- `leveling_macro_smoke.mjs`: mobile 240 level samples, both automated stacks on Lv31 Sorcerer, manual Wish/Hellfire hotkeys, control selector
- `board_macro_usability_smoke.mjs`: eight endgame class hotbar diagrams, Sorcerer two-step macro and separation of manual buffs/charged skills
- Existing Global progression / gear / Daevanion browser suites remain unchanged
