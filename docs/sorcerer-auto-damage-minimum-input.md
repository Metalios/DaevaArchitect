# AION 2 Global Sorcerer — Solo Nightmare and Group Conquest PvE macro

Reviewed November 4, 2026. This document describes the **fresh-45/endgame**
macro policy, not leveling, PvP, or proven frame-optimal DPS. Combat animation
locks, cancel timings, and input scheduling remain unmeasured hypotheses.

## Controls

- **LMB:** hold Flame Arrow for repeatable basic damage and MP recovery.
- **RMB:** bind the game's built-in Macro; hold it to press the *hotbar keys*
  Q/E/R (only the steps actually shown in your current rotation).
- **Q/E/R:** skill-stack hotbars. Row 0 is the **bottom** row, first attempted
  when eligible. A step does not guarantee exact skill execution order.
- **1–8:** the rotation panel displays the currently equipped and accessible
  manual skills. **Hellfire stays on 1**, held to maximum charge and released
  without the macro clipping the charge. Defiance remains on Space.

In AION 2 control mode, clear the default Quick Use 1 secondary `R` binding,
then remap Quick Use 2 from T to R if you want the three-key Q/E/R layout.
You can also keep the original T binding in the planner.

## Endgame Solo Nightmare (moving bosses)

- **Q:** Blaze and Firestorm, ordered by the selected comparative fire
  priority. Both are repeatable mobile damage; Firestorm can reduce Hellfire's
  cooldown with its actually equipped level-12 Specialty.
- **E:** Bittercold Wind only with its **owned mobile Specialty**; Frost Burst
  plus Frost only when the required mobile follow-up is owned. If unavailable,
  E is omitted rather than showing a fictitious cast.
- **R:** optional *Sustained DPS* auto Element Enhancement. Reset-free Wish
  may also enter R if the performance/convenience comparison allows it.
- **Manual:** Hellfire, Delayed Explosion, Winter's Shackles, Wish when its
  cooldown-reset Specialty is equipped, defensive Stigmas, and ground
  placement on bosses that will remain inside the effect.

Do not assume a stationary ground cast or a 4-second damage-amplification
Stigma is safe to repeat on every cooldown in mobile Nightmare content.

## Endgame Group Conquest (relatively stable boss)

- **Q:** Bittercold Wind, Blaze and Firestorm in a single stack for
  Performance/Sustained; the Burst mode keeps Bittercold's timing manual.
- **E:** equipped Fire Wall and/or Cold Storm in Performance/Sustained
  builds. This stack is for a boss that will remain inside their ground
  effects; stop the E macro step or use another layout if it moves.
- **R:** optional sustained auto Element Enhancement / reset-free Wish.
  Delayed Explosion is never repeated automatically.
- **Manual:** charged Hellfire, coordinated burst buffs and resets, stagger
  response, emergency protection, and any ground effects you choose to
  position yourself.

Survivability and Burst modes deliberately differ from full sustained
ground-damage automation; no defensive Stigma or fully charged attack is
automated.

## Short Hellfire burst window

1. Apply Element Enhancement if equipped.
2. Use Delayed Explosion and Winter's Shackles close to the big hit when
   their short amplification effects are equipped and eligible.
3. **Fully charge** Hellfire and release before the damage window expires.
4. If Wish has the cooldown-reset Specialty, cast it **after** major spells
   enter cooldown. Without reset, its Attack buff may be useful before
   Hellfire instead.

This is an execution goal, not a claim that the entire sequence fits a
4-second window at every speed and latency. Verify when Hellfire actually
lands in Global combat. Prefer a missed-buff-safe order rather than
clipping its charge.

## Source and validation limitations

- Global skill and Specialty records:
  https://aion2.gaming.tools/skills/15040000
- AION 2 community macro and stack behavior:
  https://aion2.grimvane.app/companion/wiki/macros-guide/
- Skill guides and current references:
  https://aion2data.com/guides/sorcerer
- Original game macro control guide:
  https://aion2data.com/macros/sorcerer

`node sorcerer_macro_audit.mjs` guards policy invariants across Solo/Group
and all four PvE objectives. The `GlobalCombatEngine` uses explicit
**unmeasured action-time and damage sensitivity assumptions**. It does not
prove maximum DPS, perfect animation cancelling, or the ideal fire priority.
Compare candidate rotations using matched Global boss fight evidence.
