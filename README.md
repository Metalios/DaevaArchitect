# Daeva Architect

[Open the GitHub Pages planner](https://metalios.github.io/DaevaArchitect/)

An interactive, static build planner for all eight **AION 2 Global** classes. A fresh level 45 starts with 136 Daevanion crystals, 203 Mastery points and 29 Stigma points; players can enter higher earned totals. It covers level 1–45 progression, Mastery and specialties, Stigmas, connected Daevanion routes, rotations, titles, and a searchable equipment loadout. Taiwan and Korea use separate clients and are outside this data set.

The **Rotation & macro** tab works while leveling. At each selected level it shows only unlocked class skills and Stigmas with assigned points, an available Q/E Macro sequence, and a compact 1–8 manual bar. The layout updates as levels, Stigma slots, and point totals change. Charged attacks, healing, movement, defenses, and Defiance remain manual. This is a safe starting layout to test with the current Global client and your input latency.

## v2 — unified character build workspace

The v2 prototype arranges Equipment, Mastery/Specialties, equipped Stigmas,
and the class's exact Daevanion board **in one responsive workspace**.
The game's node coordinates, grid shape, node costs, skill icons, gear search,
equippable slots, inventory/inspect layouts, title data, and legacy save keys
are preserved. Its zoom and board-expand controls do not distort tile geometry.
Rotation/Macro, Titles, and source research remain accessible from the toolbar.

Choose a class, character level, Solo/Group/PvP context and a Leveling or
Fresh 45 stage; **edit earned Mastery, Stigma, PvE and Azphel point totals
using the existing inputs**. Changing these inputs recalculates the
recommended plan but does not make it custom.

The planner becomes a **Modified progression** only when you manually
change a Mastery rank, equipped Stigma or Stigma level, Specialty, or
Daevanion route. Individual rank buttons enforce both point costs and
character-level unlocks. Stigma level costs follow the verified level
brackets, and Specialty options are unavailable until their effective-level
thresholds (8, 12, 16 for option 5; third equipped slot at 20). If later
switching to a lower level or reducing earned points invalidates a manual
allocation, the displayed plan is limited to the legal budget without
silently rewriting the saved intended ranks.

**Equipment is entirely user-supplied.** Empty gear slots remain empty;
click one to open the existing catalog/editor. Owned item bonuses affect
effective skill levels, optional CP estimates, and **recommended progression
breakpoints**. No equipment is automatically selected or invented. Recording
gear alone does not mark the build manually modified. Resyncing to recommended keeps
user-entered gear and earned-point totals unchanged. v2 shared links
include manual skills, equipped Stigma choices/levels and Specialty picks
as well as equipment and board nodes.

Tile clicks in v2 **inspect a node**; the explicit "Edit selected node"
action clones the funded recommended route and begins connected custom
editing. "Mark tile obtained" tracks actual purchases separately.
Recommended tiles remain outlined while customizing. A board-only
expanded view is available at smaller screen sizes.

To build locally:

```sh
git checkout v2
python build.py
python -m http.server 8000 --directory dist
```

Then visit `http://localhost:8000`. For validation, run
`node verify.mjs`, `node audit_leveling.mjs`, and
`node recommendations_audit.mjs`; the mock-fidelity GitHub Actions workflow runs
Playwright at 800 (portrait), 1280, 1920, 3440 and 3840 pixels and uploads
preview screenshots and compiled assets.

### Mock-fidelity editing and recommendation evidence

The new workspace keeps the game's **actual Daevanion board shape**,
including original node positions and gaps. The selected board node is always
visible; the bonus ledger and detailed connected purchase order are available
in an expandable section.

Mastery has Active (12) and Passive (10) views. **Specialties are not always
open**: select a power to open a flyout over that same panel. It shows the
actual unlocked Specialty slots at effective 8/12/20, the option-5 unlock at
16, game-verified option effects and the recommended choices. Close or
press Escape to return to the list.

Stigmas show four **icon-first slots**, with original game art. Select a card
to open the editor **within the Stigma section**, with rank +/-,
5/10/15/20 perk descriptions, and all 13 valid class choices. Replacing a
Stigma changes the loadout (and thus resets its recommended ranks); it does not
copy purchased rank levels from another ability. Duplicate-equipped Stigmas
are swapped rather than duplicated.

**Build advice is conditional, not a static all-classes priority table.**
`js/recommendations.js` contains 24 audited class/context profiles
(8 classes × Solo PvE/Group PvE/PvP). Each profile has core skills, support
passives, four equipped Stigmas, Stigma investment priorities, and a rationale.
Where the skill's *verified effect text* makes an unambiguous mode-specific
choice (e.g. PvP crowd control versus Solo self-healing), Specialty pick
overrides use actual option IDs and unlocks. Unsupported cases fall back to
documented Global Specialty recommendations. Manual customization always
takes precedence.

The recommendation engine prioritizes earned-point budgets, level gates,
effective-level breakpoints, already-purchased board nodes, owned gear bonus
levels, class synergy and requested play context, then uses a deterministic
connected-board heuristic. PvP and party needs are not assumed identical;
Templar group builds currently favor Taunt, Noble Armor, Doom Shield and
Shield of Protection, with Battlefield Banner as an encounter-dependent
damage alternative. The current recommendations are based on a synthesis of
client-confirmed effects and recent community guides, **not a controlled
rotation/DPS simulation proving a single best build**.

Relevant references (last reviewed October 22, 2026):

- [Aion2Data — Templar group PvE guide](https://aion2data.com/guides/templar/pve), including Lv16 Judgment/Warding Strike and Stigma milestones.
- [Aion2Data — Sorcerer Global guide](https://aion2data.com/guides/sorcerer), including Hellfire and Wish of Concentration breakpoints.
- [Wikily AION 2 skill catalog](https://wikily.gg/aion-2/skills), class skill/Stigma/Specialty option records.
- [Aion2 Reddit — hard dungeon Templar discussion](https://www.reddit.com/r/Aion2/comments/1xc25fi/to_templars_in_hard_dungeons/), practical block and Fury considerations.
- [Aion2Builds — Stigma selection snapshot](https://aion2builds.com/guides/stigma/), supplementary player selection information.

Validation: `node recommendations_audit.mjs` checks all class/context
profiles at ten character levels, and the responsive browser smoke test checks
flyout interactions, budget rules, Stigma icons, square board tiles and
share/build operation. Original `main` remains unchanged until code review.

### Original game skill and Stigma artwork

v2 now renders all **104 Stigma icons** (13 for each of eight classes)
alongside the 176 Mastery Active/Passive icons, selected Specialty
descriptions, game skill tiles on the Daevanion board, and macro/hotbar
entries. All icons are keyed to the **game's numerical skill IDs**, rather
than guessing from the order of a list. The icon inventory and resolver
are in `js/icon_catalog.js`. `node verify_icons.mjs` validates the
full 280-entry mapping for omissions and known cross-class icon reuse.

English skill names and IDs were cross-referenced with
[`austinsc/aion2-planner`](https://github.com/austinsc/aion2-planner),
while icon filenames and IDs were checked against the skill catalog
extracted from NC's public character data by
[`Aion2Meter`](https://github.com/a2meter/Aion2Meter).
[Wikily's AION 2 skills catalog](https://wikily.gg/aion-2/skills) was
used to confirm the game's Stigma/skill and Specialty breakdown.
The planner requests published game-art images directly from NCSOFT's
`assets.playnccdn.com` host, falling back to the community
`aion2.app` icon endpoint when necessary. **No Wikily-hosted media is
copied or distributed in this repository.** Game artwork and game
trademarks belong to NCSOFT; the project is an independent fan tool.

The five Specialty choices now display the source skill's **genuine
game icon** alongside each option's actual text, unlocked/equipped
state, and equip-slot display. Individual, option-specific game-art
icons are not claimed to be authenticated yet. Daevanion skill tiles
use the original icon for the corresponding skill ID; generic stat
tiles still use labels until their own game-art mapping is verified.

**Accuracy limitations:** The provided Global data supports exact
board coordinates, given node costs, level rewards, game skill IDs/icons
and item catalog records. The connected route is still a documented
greedy *recommendation*, not measured optimal combat output. Combat
Power is an empirical estimate, not the server formula. Generic
stat-tile glyphs remain where independently verified original icon
assets are unavailable. The new Ariel endgame board/currency has not
yet been imported into this repository's source dataset. Do not label
any of these elements "100% game-accurate" until checked against the
latest installed Global client.

## Board planning and sharing

The build workspace preserves the original connected recommended route, node list and funded preview. Game nodes remain in their exact board positions. The v2 "Edit selected node" control copies the recommended funded route when customization begins; selected tiles must remain connected to the starting tile and respect the user's available crystal points. "Mark tile obtained" is separate from planned route editing, so inspecting an icon does not change the build. The user can restore the recommended route without resetting equipment or the point budget.

`python optimize_board_progression.py` calculates reference Group, Solo and PvP routes from the Global node positions, costs and effects. In the browser, `js/board_optimizer.js` recalculates connected routes from class, context, level, earned points, Mastery/Stigma allocations, purchased board nodes and optional CP goal. Actual player-recorded gear skill levels are included when deciding what effective
rank is needed for a Specialty breakpoint; no hypothetical equipment is assumed.
CP-target weighting is used only when the planner has a sufficiently complete
real gear loadout to estimate a baseline. Exact rank availability follows Global skill unlocks, with the verified late-passive exceptions. The full first-four-board route uses 570 PvE points; Azphel has an independent 232-point PvP pool. A costly next tile can require saving up crystals. This is a reproducible, greedy progression heuristic, not a combat simulator or proof of the single best build. Creator guides are used for comparison and mechanical checks, not copied as the board purchase order.

`python optimize_specialties.py` scores Global option text for damage, healing, defense, cooldowns and triggered follow-ups. Default PvE picks are calculated from those scores at each skill-level gate. The options themselves are sourced from class skill data and should be checked against live tooltips after a patch. The rotation and hotbar profiles supply skill-use priorities to the board optimizer; their sequence still encodes class mechanics such as charged attacks, procs, healing decisions and positioning. They are not generated by a frame-accurate combat simulation.

**Share this build** creates a static GitHub Pages link containing the active class's points, stage, board plan, equipped gear and notes, and other saved choices. The link uses the URL fragment, so its contents are not sent as part of the page request. Recipients must choose **Load shared build** before that class's browser save is replaced; their other classes are untouched. Anyone with the link can read the included build and notes.

## Equipment

The Equipment tab has the 20 gear slots, five Arcana slots, and wings. It starts with empty slots for every class. The compact **Inventory** view and wider **Inspect** view follow the game's two equipment presentations; you can switch between them, and the default adapts to screen size. Select a slot to search by item name or ID in the bundled Global index. The picker shows game icons, rarity frames, item and required levels, and filters for grade, level, and faction. Equipped items retain their rarity frames. The editor retrieves a base item tooltip when available and lets you record enhancement, required and item levels, Soul Binding notes, and up to three rolled skill bonuses. Weapons and armor have structured Manastone sockets; eligible accessories use Soulstones. Epic and Unique weapons and guards can record one Theostone engraving. Socket counts come from the Global tooltip when available, with an editable grade-based fallback. Enter the stone type and actual rolled stat/value in each socket; the Equipment tab totals recorded stone stats and warns when weapon and guard use identical Theostones. Recorded skill bonuses feed the effective Mastery level and specialty preview. Each class has its own browser-saved loadout, including socketed stones in shared build links.

The item index was extracted from [Aion2Data](https://aion2data.com/creators)'s Global client data and category pages and is stamped with the client version and retrieval date in the app. The 3,553 main gear entries include catalog grade, item level, required level, faction restriction, and known fixed stats. Wing entries currently have icons and names; their grade and fixed stats can be entered or checked from the live tooltip. Images and game data are © NCSOFT. Items from a newer patch might be absent until the catalog is refreshed. The Equipment tab sums known fixed stats from active equipped pieces, excluding personal rolls and upgrades. Once at least 18 regular slots have level-45 gear and their catalog item levels total at least 500, the planner estimates **planned** CP from the recorded loadout and funded boards, Mastery and Stigmas. Obtained board marks preserve purchased tiles when the recommendation is recalculated; optional current Mastery ranks track progress. Damage and tank builds share the estimate and target with Build now. Healers have a separate optional CP target so their effective-healing goal remains independent.

The level-45 estimate is an empirical planning model in `js/cp.js`, not NCSOFT's server formula. It uses catalog base item levels, recorded enhancement, chosen Daevanion node effects, effective Mastery ranks, equipped Stigma ranks, recorded stat-bearing title count, and a conservative adjustment for valid socketed stone rolls. We fitted its baseline against 109 anonymized public NA East level-45 character profiles collected October 19, 2026. Five-fold holdout error was about 4,000 CP on average and 8,000 CP at the 90th percentile **for profiles with complete official data**. The displayed planning range is intentionally wider, but is not a confidence interval or guarantee. Missing pets, wings, Soul Binding rolls, attributes, collections, unrecorded titles, and other systems can put the in-game score outside the range. The weights for supported board stats are adapted from [AION2 Index's reverse-engineered per-stat estimates](https://aion2index.com/c/nae/nezekan/Bobdesu/upgrades); [Aion2Data](https://aion2data.com/get-stronger) notes that the exact CP formula is absent from client data. Stone bonuses are partial to avoid counting typical stone value twice in the fitted baseline. The model should be recalibrated after major Global progression changes. For a plan that matches an equipped character, the optional in-game CP baseline replaces the initial model number and projects later changes by the model's delta. That measured score stays in browser storage and is excluded from shared build links. NCSOFT's public character profile reports exact current CP but cannot score a hypothetical loadout; its API does not allow browser reads from GitHub Pages, so automatic profile sync would need a separate service.

## Build and publish

Run `python build.py` to generate the static `dist/` site. Source scripts live in `js/`, styles in `css/`, and static image assets belong in `assets/`. The build writes the bundled Global data to `dist/js/data.js` and copies the source scripts, styles, and static assets into matching folders. The site has no runtime server or build dependencies. `node verify.mjs` and `node audit_leveling.mjs` check the class and progression data. `python sync_gear.py` refreshes the searchable Global equipment snapshot from Aion2Data. For a browser interaction check, install Playwright and run `node gear_smoke.mjs`.

Push to `main` to build and deploy through `.github/workflows/pages.yml`. GitHub Pages must be configured with **GitHub Actions** as its publishing source. The HTML links to relative CSS and JavaScript files, so it also works at the `/DaevaArchitect/` project path. Game skill/Stigma art loads from the official NCSOFT asset CDN with a separate image fallback, and optional item tooltips load from Aion2Data. `node board_smoke.mjs` and `node share_smoke.mjs` cover board modes and link import in a browser.

Existing Pathfinder browser saves migrate on first open. New saves use Daeva Architect storage keys.

## October 2026 progression correctness update

Leveling Mastery now treats the 21/23/25 passive skills in all eight Global
classes as ungated after acquisition, rather than imposing the three-level
active-skill advancement rule. The recommended leveling priorities give selected
late passives explicit targets. Specialty recommendations preserve hand-verified
entries when the text-scoring helper is rerun. Chanter Dark Crush uses its
cooldown-removal option at effective level 16, and its recommended Macro
configuration changes before and after that milestone.

The interactive Daevanion optimizer considers only boards unlocked at the
selected character level and evaluates effective-level 8/12/16/20 thresholds.
It still uses weighted heuristics, not measured rotation DPS, and a route may
change when the character gains access to another board. Mark already purchased
nodes obtained to keep them protected during rerouting.

**Not yet covered by this change:** the Ariel endgame board/currency introduced
in the October Global update; full source-based rank acquisition metadata
for future classes or patches; validated optimized rotations for every
skill/specialty combination; and in-game DPS verification for all eight classes.
These recommendations must not be labeled proven optimal.

## Research and limitations

The app's Research notes link to class, level, skill, board, title, and equipment sources. Build priorities and hotbar layouts are starting recommendations. Exact Combat Power is calculated by the game, and item rolls must be recorded from the player's own gear.
