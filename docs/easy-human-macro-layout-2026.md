# Global: easy human-operated macro layout (October 24, 2026)

**Scope:** all eight AION 2 Global classes, leveling and fresh 45. In-game macros only. This is an accessible, efficient baseline for a human player—not a frame-accurate or measured top-DPS simulation. Players can customize bindings in game.

## Four concepts the UI must never conflate

1. **LMB:** hold a *repeat attack*, e.g. Sorcerer **Flame Arrow**. It is not a Macro step.
2. **RMB:** by default hold the actual **in-game Macro** hotkey, assigned under Settings → Key Settings → General → Macro. AION 1 Control Mode disallows mouse operation macro binds, so choose keyboard **M** there.
3. **Q/E:** hotbar skill *stacks*. A stack chooses an available skill, with **Row 0 at the bottom tried first**. Multiple visible stacks **do not** mean all of them must be included in Macro steps.
4. **1–4:** accessible **manual** abilities. The game gives manual presses precedence; release Macro for charged attacks, repositioning, defensive reactions, healing and enemy mechanics.

Use **10 ms** as a first in-game delay, not a magic performance setting. The client explicitly warns that macro-step order is not guaranteed. Do not suggest external software/hardware macros.

## Sorcerer / Global, around level 31–34

The default easy plan matches a common Global input style while avoiding a macro with excessive separate steps.

| Input | Recommended job | What the player does |
| --- | --- | --- |
| **LMB** | Flame Arrow | Hold during safe damage / MP recovery |
| **RMB** | In-game Macro containing **one step: Q** | Hold alongside LMB. The game attempts Q; the player does not repeatedly press Q |
| **Q stack** | Bottom/row 0 Bittercold Wind, then Blaze, Firestorm, Wish of Concentration at top/row 3 | Skills already available by this stage; only Q is automated |
| **E stack** | Bottom/row 0 Frost Burst, then Frost, Ice Chain | Manual ice/control when a situation warrants it. **E is not in Macro** |
| **1** | Hellfire | Hold to charge fully, release manually |
| **2** | Winter's Shackles | Manual burst setup |
| **3** | Flame Scattershot | Use at the relevant stagger window |
| **4** | An actually learned/equipped Stigma or other available manual ability | Only when unlocked and purchased |

At a real effective rank of 16 **with Wish of Concentration's option 5 actually selected**, the model moves Wish to row 0 on Q to prioritize the cooldown-reset interaction. Merely previewing a Daevanion route does not activate the Specialty.

The **endgame Sorcerer** uses the same two-mouse habit (Flame Arrow on LMB, Macro on RMB, automatic Q damage stack, optional/manual E ice stack). Existing manual defensive/ground-effect options remain inspectable under More options.

## All classes and accessibility

Every class in the advanced rotation guide starts with the same **three steps**: construct class-specific stack columns as physically positioned in the game, bind the in-game Macro to RMB, and hold LMB+RMB during safe damage. It displays numbered manual 1–4 actions, class names and skill icons instead of demanding memorization of all eight hotbar slots. The complete 1–8 bar and more involved strategy remain behind a user-controlled details flyout.

For all leveling classes, the guide shows the mouse-button pairing, explicitly lists automatic versus manually triggered stack columns, allocates up to four manual abilities to numeric keys, and offers a working selector for RMB / side mouse / middle mouse / keyboard M. The selection is stored on the character profile and refreshed immediately. Levels 1–3 correctly show no Macro setup.

## Evidence and limitations

- [Aion2Data — Global client macro text (2026.10.21)](https://aion2data.com/macros): held game Macro, manual input priority, 10–9,900 ms delays, mouse-binding exception, step-order warning
- [Daeva Guides — Sorcerer Global progression and skill bar](https://daevaguides.com/en/sorcerer/): LMB Flame Arrow, one Q damage macro step while leveling, a separate situational ice bar and manually charged Hellfire
- [Couga54 — Sorcerer Global](https://couga54.github.io/aion2-guides/en/sorcerer/): alternative RMB, LMB and side-button macro layouts; some players include more skills in the macro
- [Aion 2 Companion — macro mechanics](https://aion2.grimvane.app/companion/wiki/macros-guide/): Row 0 is the stack priority anchor and a hotbar column is not a sequence of guaranteed individual spell casts

**No numerical optimality claim.** A one-step Q macro is a deliberate low-effort/high-uptime recommendation based on Global community patterns. More steps, boss-specific buffs, motion and latency can change real results. Validate using training encounters on Global before advertising "fastest".

## Acceptance checks

- `leveling_rotation_audit.mjs`: 8 classes × 2 PvE contexts × 45 levels; unlocked-only skills, manual/automatic stack distinction, one Macro step, selected Wish level-16 special-case
- `leveling_macro_smoke.mjs`: physical stack priority, 1–4 manual keys, bound Macro selector (RMB to keyboard M), Sorcerer Lv31 E manual vs Q automatic, no Hellfire in automatic stacks, advanced 45 restore
- `board_macro_usability_smoke.mjs`: all eight endgame classes show physical stacks, clear mouse controls and ergonomic direct keys; one Sorcerer Q macro step with optional manual E; existing obtained-board click behavior remains intact
