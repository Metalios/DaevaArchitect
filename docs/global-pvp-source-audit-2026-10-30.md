# AION 2 Global PvP evidence audit — October 30, 2026

**Research-only. Not a list of statistically proven top builds.** The published builds are player/creator reports and publicly shared loadouts, summarized in secondary sources. We have **not** confirmed that each creator holds a current Global arena rank or that a specific build caused that result. The corresponding structured records are in [`research/pvp-observations.json`](../research/pvp-observations.json); all 17 four-Stigma bars were validated against the repository's Global `stigmas.json`.

## Evidence standard

1. Confirm Global rather than Korean/Taiwanese mechanics (four equipped Stigma slots; 20 ranks per Stigma).
2. Keep creator, mode, snapshot date, originating page, observed equipped four Stigmas and any independently verifiable primary build URL together.
3. Keep **player popularity**, **public loadout adoption**, **player rank**, **class activity index** and **measured win rate** separate. A build's copies are not independent evidence.
4. Mark gear/point-budget requirements; compare **perks and Specialties**, not just four equipped names.
5. Revalidate every build against the October 28, 2026 Global patch before auto-generating recommendations.

## Highest-value class-specific corrections

| Class | Credible player or public Global pattern | Problem with merged PR #27 |
|---|---|---|
| Gladiator | Sen: Lunge Stance + Zikel's Blessing + Blade Toss/Forced Restraint + Focused Block/Tenaciousness | Arena excludes Lunge Stance; group excludes both main damage buffs and Blade Toss anti-heal |
| Templar | NoBS duel: Shield of Protection, Nezekan's Shield, Battlefield Banner, Doom Shield; Xia team: Grapple, Empyrean Lord's Punishment, Comrade in Arms, Doom Shield | Arena excludes Nezekan/Banner; group excludes Empyrean and Doom. Debilitating Smash healing reduction and Defiance bait are absent from decision logic |
| Assassin | J0EI/Keyba: Illusive Clone, Triniel's Dagger, Shadowstep, Spiral Slice; kaiwel 1v1 swaps last two for Evasion Contract, Aerial Bind | Arena excludes Triniel and Spiral; group excludes Illusive Clone. Post-Oct-28 Clone cooldown should be recalculated |
| Ranger | Most public PvP bars preserve Vaizel's Authority, Bow of Blessing, Supporting Fire, Griffon Arrow; whelps small-scale favors Vaizel + Breath + Sealing + Ambush Kick | Arena drops main Vaizel buff; group drops three common damage buffs, overweights generic crowd control |
| Sorcerer | shr1kn across gear brackets: Element Enhancement, Arctic Armor, Hibernation, Soul Freeze | Arena lacks Element Enhancement and Arctic Armor; group drops core damage and anti-burst |
| Spiritmaster | Common: Enhance: Spirit's Benediction, Summon: Ancient Spirit, Seize Magic, Command: Proxy; Carneiro switches Proxy to Magic Block vs casters | All three PvP modes drop the two pet-enhancing Stigmas, stripping away the class's core engine |
| Cleric | Th3Ruthless/BoredAF duel: Earth Punishment, Noble Aura, Light of Protection, Salvation; MrRosaPony open-world: Earth Punishment, Light of Protection, Salvation, Voice of Doom; group support: Salvation, Absolution, Light of Protection, Yustiel's Power | Arena/solo drop the main damage engine and anti-heal; group requires teammate aura coverage awareness |
| Chanter | notXeon solo Abyss: Undefeated Mantra, Marchutan's Wrath, Fracturing Blow, Guardian Blessing; ground arena swaps Fracturing to Sprint; group: Undefeated, Healing Touch, Impeding Authority, Power of the Storm | Arena misses Undefeated and Marchutan; solo Abyss wrongly includes ground-focused Sprint Mantra; group ignores cooldown and teammate buff overlap |

## Other mechanics that require explicit modeling

- **Survival:** Defiance CC break / immunity length, anti-stun/bind/Seal responses, manual defensive windows, potions and heal suppression.
- **Offense:** CC application probabilities against players rather than monsters, protection/Block bypass, target ability to dodge or glide, burst time inside confirmed hard-CC, cooldown alignment and anti-heal uptime.
- **Mobility:** on-ground Arena of Solitude versus aerial solo/group Abyss; terrain, initiation, disengage, flying stamina, target gap closure.
- **Group synergies:** Templar Comrade in Arms ally protection; Cleric Absolution cleanse and aura conflicts with Chanter Undefeated Mantra; coordinating anti-heal and status effects.
- **Stigma costs:** Cumulative 1–5 = 5, 6–10 = +10, 11–15 = +20, 16–20 = +40. At 61 points, four rank-15 Stigmas are not remotely affordable.
- **Azphel:** A separate 232-point board; optimize the connected, funded path for damage-versus-control-versus-defense weights **by role, mode, matchup and actual gear**. PR #27 still uses the same Azphel route in every PvP context.
- **Mastery / Specialties:** rank targets plus combined Daevanion, gear and Arcana levels determine the actual option unlocks. PvP Root, Stun, Debilitating Smash anti-heal, Shield-bypass, cleanse options must be evaluated as conditional interactions, not regex text keywords.

## Evidence sources (Global unless noted)

- **gladiator** — https://aion2vault.com/builds/gladiator/pvp/
- **templar** — https://aion2vault.com/builds/templar/pvp/
- **assassin** — https://aion2vault.com/builds/assassin/pvp/
- **ranger** — https://aion2vault.com/builds/ranger/pvp/
- **sorcerer** — https://aion2vault.com/builds/sorcerer/pvp/
- **spiritmaster** — https://aion2vault.com/builds/spiritmaster/pvp/
- **cleric** — https://aion2vault.com/builds/cleric/pvp/
- **chanter** — https://aion2vault.com/builds/chanter/pvp/
- Community PvP build hub / creator builds: https://questlog.gg/aion-2/en/skill-builder/ (original source; some pages require JavaScript).
- Global class activity indices, not individual win rates: https://aion2.gaming.tools/tier-list?activity=arena-single , https://aion2.gaming.tools/tier-list?activity=arena-team , https://aion2.gaming.tools/tier-list
- Secondary guide on Oct-28 Global patch: https://aion2builds.com/updates/patch-notes-2026-10-27/
- Official Global patch notes: https://aion2.plaync.com/en-us/board/update/view?articleId=6ae19668577e8c01355e0210
- Independent Cleric source discussion: https://aion2turkiye.com/en/blog/aion-2-cleric-pvp-guide-block-stigmas-macro/

## Known reliability and coverage gaps

- The eight Vault guides explicitly note they did not test all highlighted builds themselves. Many attributed Questlog records are not independently authenticated; creator ranks must be verified separately.
- Public counts include self-selected players; many copies of named builds repeat one idea, not independent successful outcomes.
- Global Arena of Solitude **1v1** is not Arena of Cooperation **5v5**, and neither equals airborne open-world Abyss. The current four UI paths include no separate 5v5 Arena; don't silently treat a 5v5 sample as proven Group Abyss.
- More data still required before approving **any** next automatic presets: primary Questlog build IDs (including points, individual Mastery, Specialties, Azphel purchase paths); Global arena match replays; matchup-specific class observations; group party compositions; controlled PvP damage/CC and healing experiments.
- **Do not use this research-only change to auto-apply replacements.** It should inform a separate audited implementation with measured or explicit confidence levels and regression tests of gameplay logic.
