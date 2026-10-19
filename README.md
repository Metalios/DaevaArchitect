# Daeva Architect

[Open the GitHub Pages planner](https://metalios.github.io/DaevaArchitect/)

An interactive, static build planner for all eight **AION 2 Global** classes. It covers level 1–45 progression, Mastery and specialties, Stigmas, connected Daevanion routes, rotations, titles, and a searchable equipment loadout. Taiwan and Korea use separate clients and are outside this data set.

## Board planning and sharing

The Daevanion page has **Recommended** and **Custom** modes. Recommended uses the class and context route; colored tiles mark its funded path, numbered badges show the next 16 unmarked clicks across boards, and one jump button opens the next tile. Click a recommended tile to mark it obtained. Custom starts empty: click connected tiles within your PvE or Azphel crystal budget to plan a route, or copy the current recommendation and edit it. In Custom mode, tile clicks edit the plan and the selected-tile button records obtained status. Funded custom nodes feed skill levels and board effects throughout the planner. Plans and obtained marks are saved separately for each class.

**Share this build** creates a static GitHub Pages link containing the active class's points, stage, board plan, equipped gear and notes, and other saved choices. The link uses the URL fragment, so its contents are not sent as part of the page request. Recipients must choose **Load shared build** before that class's browser save is replaced; their other classes are untouched. Anyone with the link can read the included build and notes.

## Equipment

The Equipment tab has the 20 gear slots, five Arcana slots, and wings. It starts with empty slots for every class. The compact **Inventory** view and wider **Inspect** view follow the game's two equipment presentations; you can switch between them, and the default adapts to screen size. Select a slot to search by item name or ID in the bundled Global index. The picker shows game icons, rarity frames, item and required levels, and filters for grade, level, and faction. Equipped items retain their rarity frames. The editor retrieves a base item tooltip when available and lets you record enhancement, required and item levels, soul binding notes, and up to three rolled skill bonuses. Recorded skill bonuses feed the effective Mastery level and specialty preview. Each class has its own browser-saved loadout.

The item index was extracted from [Aion2Data](https://aion2data.com/creators)'s Global client data and category pages and is stamped with the client version and retrieval date in the app. The 3,553 main gear entries include catalog grade, item level, required level, faction restriction, and known fixed stats. Wing entries currently have icons and names; their grade and fixed stats can be entered or checked from the live tooltip. Images and game data are © NCSOFT. Items from a newer patch might be absent until the catalog is refreshed. The Equipment tab sums known fixed stats from active equipped pieces, excluding personal rolls and upgrades. It lets players record their in-game Combat Power and compare it with an editable target, showing percent and remaining gap. For damage and tank builds, that score and target are shared with Build now. Healers have a separate optional CP target so their effective-healing goal remains independent. The planner does not calculate CP, because the client does not expose the game's formula.

## Build and publish

Run `python build.py` to generate the static `dist/` site. Source scripts live in `js/`, styles in `css/`, and static image assets belong in `assets/`. The build writes the bundled Global data to `dist/js/data.js` and copies the source scripts, styles, and static assets into matching folders. The site has no runtime server or build dependencies. `node verify.mjs` and `node audit_leveling.mjs` check the class and progression data. `python sync_gear.py` refreshes the searchable Global equipment snapshot from Aion2Data. For a browser interaction check, install Playwright and run `node gear_smoke.mjs`.

Push to `main` to build and deploy through `.github/workflows/pages.yml`. GitHub Pages must be configured with **GitHub Actions** as its publishing source. The HTML links to relative CSS and JavaScript files, so it also works at the `/DaevaArchitect/` project path. Game icons and optional live tooltips load from Aion2Data. `node board_smoke.mjs` and `node share_smoke.mjs` cover board modes and link import in a browser.

Existing Pathfinder browser saves migrate on first open. New saves use Daeva Architect storage keys.

## Research and limitations

The app's Research notes link to class, level, skill, board, title, and equipment sources. Build priorities and hotbar layouts are starting recommendations. Exact Combat Power is calculated by the game, and item rolls must be recorded from the player's own gear.
