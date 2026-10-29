# DaevaArchitect visual UX audit — 29 October 2026

**Scope:** Current `main` as rendered by the v2 Playwright/Chromium pipeline. Captured **390×844, 800×1000, 1280×720, 1920×1080**, plus existing 1920×768, 3440 and 3840 previews. Class: Templar, default fresh 45 / Group PvE, no recorded gear. Tested Build workspace, Board Focus, Gear picker, Mastery and advanced skill cards, Stigmas, Specialty/Stigma flyouts, Rotation & macro, Titles, Research, Share and Compare modals.

**Evidence:** CI artifact `mock-fidelity-screenshots` from [visual audit workflow run](https://github.com/Metalios/DaevaArchitect/actions/runs/40904566774) includes screenshots named `audit-{viewport}-{screen}.png`; screenshots generated from the same app source as `main`. Browsers can render CDN art differently; empty catalog thumbnails in test captures **require a live-network verification** before declaring a production image outage. This is a visual/structural audit, not a claim that all game formulas are accurate.

## Critical / high priority

| ID | Surface | Observed defect | Recommendation / acceptance criterion |
|---|---|---|---|
| V01 · Critical | 390px build workspace | Equipment → Mastery → Stigmas → boards stack into a ~5,000px full-page image. Expanded advanced Mastery produces a ~14,700px page. Users cannot move between high-value editors without repeated long swipes. | Give mobile/tablet **persistent Equipment / Mastery / Stigmas / Daevanion editor tabs** with exactly one primary panel shown; preserve state. Put Daevanion one tap away everywhere. |
| V02 · High | Secondary screens | Clicking Rotation, Titles or Research executes `extra.scrollIntoView()`, scrolling the quickbar and navigation *offscreen*. Screenshot top shows only truncated navigation bottoms. | Keep navigation visible with a sticky responsive header or avoid scrolling the app's shell out of view. Test tab switches from top, bottom and after returning to workspace. |
| V03 · High | 1280px Mastery | The CSS forces a 475px-wide skill row into a Mastery column around 340px, requiring **horizontal scrolling inside the list**. Invest/Board/Gear/Final cannot be read together. | Reflow to a compact responsive row showing skill name, actual invested rank, and effective rank; reveal board/gear breakdown with inline details instead of horizontal scrolling. |
| V04 · High | 1280px Stigmas | Browser geometry shows four Stigma cards at **74px wide** (135px tall). Multiword names and ranks are difficult to scan/edit. | Use a 2×2 grid or responsive strips with at least ~145px/card. Do not keep four columns when each item is <110px. |
| V05 · High | Mastery/Stigma flyouts | Specialty/Stigma overlays crowd the same narrow column and can visually overlap neighboring content; clicking the advanced Mastery disclosure was **intercepted by a Stigma subtree** in the visual-capture run. | Use one anchored, mutually exclusive editor drawer/popover at a time, within a reliably positioned layer. Preserve focus, keyboard escape, and scroll anchoring; no input interception. |
| V06 · High | Daevanion | Focus mode makes the map larger vertically but leaves large unused horizontal space. On desktop, tiles can remain 40px even when more room is available; at mobile the board pans without a clear recenter/minimap affordance. | Prioritize **readable 44–52px tiles when there is room**, allow intentional pan/scroll, add center-on-recommended/selected and a mini overview or viewport position indicator. Preserve persistent board tab access and board-specific position. |
| V07 · High | 390px header/nav | Global navigation extends past right edge (Research notes visibly truncated) with no strong overflow cue; header actions wrap into several rows. | Render scroll affordance or compact navigation menu; preserve an always-visible one-tap Daevanion entry and primary Save action. |

## Medium priority

| ID | Surface | Observation | Proposed improvement |
|---|---|---|---|
| V08 | Gear | Full 20-slot paperdoll takes excessive height on tablet/mobile before other editors. | Condensed equipment overview by category with expandable slots; keep full inventory in Equipment-focused view. |
| V09 | Gear picker | 135-item list shows **blank icon frames in Chromium CI** (may reflect external CDN restrictions); search and facet controls are cramped at 390px and item details are separated from search results by nested scroll. | Verify CDN under live conditions, add reliable locally available placeholder/fallback, make filters responsive and add a list/grid toggle and selected-item summary. |
| V10 | Rotation & macro | Good substantive instructions, but repeated LMB/RMB guidance and separate rule/opener/loop/setup sections produce ~5,400px mobile page. The `Q · E · R` keycap crowds its adjacent text at 390px. | Summarize one primary **Do this** macro/rotation with persistent copy controls; move advanced rebind warnings and detailed explanation into one expandable section. |
| V11 | Titles | Three well-organized categories on desktop, but mobile traverses 3 long recommendations plus a 528-title catalog. | Pin owned/recommended titles and search, lazily render or virtualize catalog, collapse collection guidance by default. |
| V12 | Research | Legible two-column reference cards on desktop; very long mobile feed and some source dates lag current patch. | Group into Mechanics / Data / Sources, collapse long explanations, show last-reviewed patch. |
| V13 | Comparison modal | Plain paragraph-style differences are difficult to scan, and the mobile dialog fills ~80vh without a visible sticky close/return affordance. | Use Mastery/Stigma/Daevanion change rows with aligned Current vs Recommended columns, sticky header/footer, accessible scrolling. |
| V14 | Typography/contrast | 10–12px captions and very dark unselected nodes appear repeatedly; ultrawide resolutions don't substantially enlarge key text. | Component-level typography scale (body 13–15px min desktop, 14–16 mobile for primary interaction), focus/contrast checks and meaningful selection labels beyond color. |
| V15 | Data hierarchy | Board tracker, tab plan counts, route text, and progress labels repeat values at different levels, while Equipment card shows multiple small zero counters. | One clear planned/obtained summary with concise editable totals. Put explanatory text in tooltips rather than persistent paragraphs. |
| V16 | CSS maintainability | `css/v2.css` grew to >1,300 lines with competing media queries and later overrides for the same components. This allowed a two-row 1280px layout and repeated sizing regressions. | Consolidate responsive rules per component, add viewport-size regression screenshots, remove outdated overrides and use container queries for nested editors. |

## What looks solid

- Consistent dark-blue/gold/aqua palette and class-appropriate iconography.
- Desktop Titles grouping, general card border/spacing, and desktop Rotation instruction hierarchy are functional.
- Board blue-route/gold-acquired semantics and toolbar actions are clear when viewed near the board.
- Equipment, Mastery and Daevanion are visible together at wide desktop resolutions.
- Share dialog content is reasonably concise and self-contained; no need for broad redesign.

## Recommended execution

1. **Navigation and mobile information architecture**: V01, V02, V07. Preserve 3-editor desktop view; give small screens editor-focused navigation without 5,000px scroll paths.
2. **Narrow desktop usability and popover ownership**: V03–V05. Fix the actual 1280px horizontal Mastery scroll, 74px Stigma cards, and overlapping drawers.
3. **Board-first polish**: V06, V15. Preserve 40px minimum; spend surplus space on legible nodes, orientation and viewport recentering rather than shrinking board or adding explanations.
4. **Secondary views, gear and maintainability**: V08–V14, V16. Consolidate CSS and update screenshot/interaction tests before another broad visual redesign.

## Acceptance criteria

- 390/800/1280/1920/3440/3840 viewports and 720/768/1080px heights.
- No global navigation item inaccessible without an obvious overflow control.
- Daevanion accessible within one action on all mobile screens; preserve node size ≥40px and blue/gold status after board switches.
- No horizontal scrolling to read core Mastery rank information at 1280px.
- Stigma cards ≥140px width at narrow desktop.
- No overlapping/inaccessible flyout buttons; Escape and focus restore work.
- No accidental lost selected nodes, gear rolls, crystal marks or custom allocations.
- Capture non-workspace screens, dialogs, both empty/equipped gear, Solo/Group, and all eight class sizes—not only the Templar default.

**Out of scope:** Combat effectiveness and class optimization accuracy; requires separate mechanics validation.
