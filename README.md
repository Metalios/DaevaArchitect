# Daeva Architect

[Open the GitHub Pages planner](https://metalios.github.io/DaevaArchitect/)

An interactive, static build planner for all eight **AION 2 Global** classes. It covers level 1–45 progression, Mastery and specialties, Stigmas, connected Daevanion routes, rotations, titles, and a searchable equipment loadout. Taiwan and Korea use separate clients and are outside this data set.

## Equipment

The Equipment tab has the 20 gear slots, five Arcana slots, and wings. It starts with empty slots for every class. The compact **Inventory** view and wider **Inspect** view follow the game's two equipment presentations; you can switch between them, and the default adapts to screen size. Select a slot to search by item name or ID in the bundled Global index. Equipped items display their game icons when the source supplies them. The editor retrieves a base item tooltip when available and lets you record enhancement, required and item levels, soul binding notes, and up to three rolled skill bonuses. Recorded skill bonuses feed the effective Mastery level and specialty preview. Each class has its own browser-saved loadout.

The item index was extracted from [Aion2Data](https://aion2data.com/creators)'s Global client data and is stamped with the client version and retrieval date in the app. Images and game data are © NCSOFT. Items from a newer patch might be absent until the catalog is refreshed. The planner does not calculate Combat Power from item levels; enter the in-game score in Build now.

## Build and publish

Run `python build.py` to generate `dist/index.html`. The site has no runtime server or build dependencies. `node verify.mjs` and `node audit_leveling.mjs` check the class and progression data. `python sync_gear.py` refreshes the searchable Global equipment snapshot from Aion2Data. For a browser interaction check, install Playwright and run `node gear_smoke.mjs`.

Push to `main` to build and deploy through `.github/workflows/pages.yml`. GitHub Pages must be configured with **GitHub Actions** as its publishing source. All data and app code ship in the generated HTML, while game icons and optional live tooltips load from Aion2Data.

Existing Pathfinder browser saves migrate on first open. New saves use Daeva Architect storage keys.

## Research and limitations

The app's Research notes link to class, level, skill, board, title, and equipment sources. Build priorities and hotbar layouts are starting recommendations. Exact Combat Power is calculated by the game, and item rolls must be recorded from the player's own gear.
