# AION 2 Global: low-interaction combat controls and in-game macros

Updated 2026-10-24. Applies to DaevaArchitect's leveling and endgame rotation screens for all eight classes. The planner assumes the **AION 2 action control mode**, not the AION 1 legacy cursor mode.

## Physical key layout

| Physical key | Function | Notes |
| --- | --- | --- |
| **LMB** | Basic attack / MP-generating class filler | Sorcerer: Flame Arrow; keep held during safe damage |
| **RMB** | **In-game Macro hotkey** | Explicitly bind under Settings → Key Settings → General → Macro; no third-party scripting |
| **1–8** | Manual abilities | Hellfire, buffs, defensive responses, positioning, movement, healing, as relevant to the class |
| **Q, E** | Skill-stack quickslots | Macro presses Q/E only when they are among the planned steps |
| **R (remapped from T)** | **Quick Use 2**, a skill-stack slot | Optional automatic third Macro step for a learned ground-damage Stigma, or another appropriate class skill |

### Why R is not another LMB attack in this layout

The **unmodified Global client** assigns Quick Use 1 to **LMB** (keyboard alternate **R**) and Quick Use 2 to **RMB** (keyboard alternate **T**). To free **RMB** for the in-game Macro while keeping the full skill-key count:

1. Select **AION 2** control mode.
2. Keep **Quick Use 1 = LMB** for the repeat/basic attack. **Clear R** from its alternate key.
3. **Bind the built-in Macro to RMB** under General → Gameplay → Macro.
4. **Assign Quick Use 2 to R instead of T** under Key Settings → Quickslot.
5. Use **Q / E / R** as quickslot stacks in the planner, with **1–8** for manual decisions.

In the planner's Rotation & Macro controls, choose **Quick Use 2 = R** (recommended, your layout) or **T** (original keyboard alternate). That selector changes the physical key labels and macro-step diagrams; it does not change which skills are recommended or the logical Quick Use 2 slot. Per-character bindings save in the browser.

The original R alternate for LMB is a *default keyboard assignment*, not proof that the player is in AION 1 mode. AION 1 mode is **not** the supported rotation target. Mouse-bound Macro hotkeys are incompatible with AION 1 mode; this planner targets AION 2 mode.

## Sorcerer: practical easy sustained PvE

- **Hold LMB** for Flame Arrow basic attacks / MP recovery.
- **Hold RMB** for the built-in Macro. Its routine damage stacks are **Q** and **E**; include **R** only if a damage ground Stigma is learned and equipped. When the T selection is active the same third step is displayed as **T**.
- **Manual key 1:** Hellfire; fully charge yourself.
- **Other manual 1–8 keys:** Wish of Concentration, Element Enhancement, and other learned offensive buffs; defensive responses and situational control stay manual.
- No unconditional Ice Chain spam in automatic stacks. Flame Scattershot remains a Stagger-only conditional follow-up.
- **Row 0, physically at the bottom of a stack, is attempted first.** The in-game Macro presses *hotbar keys*, not a guaranteed sequential list of spells.
- Start Macro steps at 10 ms; that is a press interval, not a measured skill animation cancel delay. Global input latency, ability animation locks and boss movement may change the result.

## Other classes

All eight class layouts use the same baseline: LMB basic attack, RMB held Macro, 1–8 manual keys, Q/E/R physical stacks where appropriate. The number of automatic Macro steps differs by class, level, learned abilities, and selected Specialties. Never interpret a visible R skill-stack slot as a mandatory R macro step or a second basic attack.

## References

- [AION 2 Global default keybinds](https://aion2data.com/controls), Global client 2026.10.21: LMB/R Quick Use 1; RMB/T Quick Use 2; Macro unbound by default
- [AION 2 Companion macro guide](https://aion2.grimvane.app/companion/wiki/macros-guide/): stack hotkeys, priority and AION 1 mouse-binding limitation
- [Global Sorcerer low-input Macro research](./sorcerer-auto-damage-minimum-input.md)
- [Sorcerer 22-skill mastery combat audit](./sorcerer-mastery-combat-audit-2026-10-24.md)

## Regression coverage

- `leveling_macro_smoke.mjs` checks the T/R selector in leveling mode, visible AION 2 controls, and physical third-step labeling.
- `board_macro_usability_smoke.mjs` verifies the same remap for endgame automatic Sorcerer Q/E/R/T stacks.
- `leveling_rotation_audit.mjs` continues to validate logical class stacks and ability unlocks separately from physical keybinding labels.
