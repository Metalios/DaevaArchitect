# Recommendation quality review — AION 2 Global, 22 October 2026

**PR:** #4, `feature/research-grounded-progression`. **Decision:** conditional quality approval for a research-backed beta only; not certified highest DPS or fastest rotation. Must have passing CI and class-specific in-game testing before a claim of optimality.

## Evidence and review standards

Game-client-derived skill ranks, class unlocks, Stigma perk levels, and Specialty option IDs outrank anecdotal recommendations. Community consensus supplies the objective (relevant damage loop, debuffs, survival), not unquestioned priority tables. All Global references below are dated October 2026; Korean/Taiwanese guides sometimes use different patches, Stigma caps and critical caps.

| Class | DaevaArchitect class-specific checkpoint | Rotation and caveat | Relevant Global discussion |
| --- | --- | --- | --- |
| Gladiator | Overhead Slam 16; Rending Blow 16; then Overhead Slam 20. Lunge Stance 20 eventually. | Keep Overhead Slam separate from the Rending/Ruinous button group. Early Lunge rank targets are expensive; a 29-Stigma-point fresh 45 cannot have rank 20. | [Gladiator PvE](https://aion2data.com/guides/gladiator/pve) |
| Templar | Judgment 16 → Warding Strike 16 → Vicious Strike 16. Party support includes Noble Armor, Taunt, Doom Shield and Shield of Protection. | Judgment cooldown removal **requires equipping** its actual Specialty, not merely reaching 16. Manual Punishment and block timing remain essential. | [Templar PvE](https://aion2data.com/guides/templar/pve) |
| Assassin | Heart Gore 16, Quick Slice 16, Insignia Explosion 16; Illusive Clone 20 later. | Burst buffs during safe rear-positioned windows, Quick Slice held, spender and proc line in macro. Damage can change with critical-hit chance. | [Assassin PvE](https://aion2data.com/guides/assassin/pve) |
| Ranger | Deadshot 16, Gale Arrow 16, Snipe/Tempest 16; Vaizel's Authority 20. | Fully charge Deadshot manually, keep Marking Shot manual, hold ranged filler. Some variants value passive investment earlier. | [Ranger PvE](https://aion2data.com/guides/ranger/pve) |
| Sorcerer | Hellfire 16 + Wish of Concentration 16 first, then Hellfire 20. | Charged Hellfire stays manual; 2026.10.21 Global corrected Cold Storm and Fire Wall effects. Ground placement is encounter-dependent. | [Sorcerer](https://aion2data.com/guides/sorcerer), [Global patch](https://aion2t.com/news/53) |
| Spiritmaster | Combustion 20 + Elemental Fusion 20; then summons and Cold Shock. | Summon timing, Corrode, pet-trigger effects and charge choice matter; measured rotation ordering is disputed. | [Spiritmaster PvE](https://aion2data.com/guides/spiritmaster/pve-spirit-cycle) |
| Cleric | **Solo:** Condemnation 12/16 damage loop. **Group:** Light of Regeneration 16, Radiant Recovery 16, Healing Light 16. | If Earth Punishment is equipped, put its critical-enabling debuff before Condemnation; keep heals manual. Heavy-heal vs damage preset is an encounter choice. | [Cleric damage](https://aion2data.com/guides/cleric), [Heavy heal](https://aion2data.com/guides/cleric/pve-heavy-heal) |
| Chanter | Dark Crush 16, Onslaught 16, Spinning Strike 16; Undefeated Mantra 20 later. | Dark Crush is trigger-dependent; without cooldown-removal Specialty, chaining multiple trigger skills into the macro wastes windows. | [Chanter PvE](https://aion2data.com/guides/chanter/pve) |

## Problems identified and fixed in this review

1. **Uniform Stigma investment:** formerly raised all four to level 5 first; now ensures slotted skills reach usable rank 1, focuses the high-value early Stigma perk(s), then broadens investment. Baseline 29-point allocations are tested to reach at least one rank 10 across all classes and contexts. This is a milestone heuristic, not a proof that exactly 10/5/5/4 is universally ideal.
2. **Context loss:** Mastery progression now includes selected Solo/Party/PvP recommendations in addition to the researched class engine, rather than using one endgame array for all PvE contexts.
3. **Lost breakpoints:** repeat milestones for a skill now remain ordered (e.g. Overhead Slam 16 then 20), instead of a last-write-wins object.
4. **Candidate double-scoring:** Daevanion heuristic now subtracts the bonus already present along the candidate path before scoring remaining levels to a target. Scores are a reproducible priority aid; they are **not** frame-accurate DPS.
5. **Cleric rotation coherence:** Earth Punishment is included in the damage macro when and only when learned/equipped, ahead of Condemnation. Group healing priority is reflected in board targets.
6. **False unlock advice:** Templar Judgment label now checks whether the level-16 cooldown-removal Specialty is selected rather than only testing effective level.
7. **Validation gap:** new regression uses real class/context advice, cost-aware Stigma funding, actual breakpoints and endgame rotation/hotbar compatibility, rather than only synthetic priority arrays.

## Limitations and approval conditions

- **Not empirically fastest:** no standardized Global combat logs, animation timings, latency or cooldown simulation. Avoid “strongest”, “best”, “fastest”, “optimal” absolute labels.
- **Current benchmark targets:** 1/11/22/32/45 leveling, fresh45 (203 Mastery/29 Stigma/136 crystals), and 327+ earned crystals with actual marked purchases. Verify options and performance in the 2026.10.21 client, separately for single-target, pack clear, resource use, heals and survival.
- **Ariel:** October 21 Global added a separately funded Ariel Daevanion board. The official node graph is not in this repo. Do not generate guessed nodes or mix its crystals into the 570-point first-four-board total. [Global update](https://aion2t.com/news/53)
- **Item Level vs CP:** Item Level thresholds such as 1200, 1400 and 1600 are not numeric Combat Power thresholds. The current engine does not select acquisition paths for missing gear or automatically assert dungeon eligibility.
- **Recommendation confidence:** PvP is less well verified than PvE and sometimes draws from KR/TW. Treat it as a starting preset.

## Decision

Suitable for **draft PR / research-backed beta** after CI passes; **not approved as proven endgame meta optimization** or ready to advertise class-competitive fastest DPS. Future work should compare in-game results and add the Global Ariel data and gear milestone system.
