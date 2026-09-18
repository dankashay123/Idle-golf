# Checks

The game is one self-contained HTML file with no build step, so the suite
drives the real thing in a real browser rather than importing pieces of it.
Each check boots a fresh page, does something to it, and asserts on what came
back. Any console error or uncaught exception during a check fails it, whether
or not the check was looking for one.

## Running them

```sh
npm install
npx playwright install chromium     # once
npm test
```

```sh
npm test                 # everything
node test/run.js render  # only checks whose name contains "render"
node test/run.js --shots # also write PNGs to test/shots/
```

Non-zero exit on failure, so it drops into CI unchanged.

## Playing it locally

```sh
npm start                # http://localhost:8080
```

Open `index.html` straight off the disk and the browser treats `file://` as an
opaque origin, which blocks `localStorage`: the game runs but never saves, and
the failure is silent. Always play it over http.

## What is checked, and why

| check | what would break without it |
| --- | --- |
| `smoke` | The only check that asserts on the game as a whole: `derive()` returns finite non-negative numbers, the canvas paints something and keeps changing, all ten screens render the row counts their data tables say they should, the loop earns and cards a hole, a Depths contest starts and pays, and the result reaches the save. If this fails nothing below it means anything. |
| `render` | Every course in every weather and every Depths floor draws, and the ground pass stays in budget. Themes are authored as literal tables in places, so a colour the renderer newly depends on can be missing on exactly one course — which is how the Depths went down on its first frame once. |
| `hazards` | No bunker or pond touches a putting surface, and no hole is left without a bunker. Both are rejections that have to keep working, and they pull against each other. |
| `icons` | Every icon id a list asks for exists, every drawing is 12×12, and no two things in the game share one. Icons were once keyed off the stat each thing moved, so one golf ball stood for seventeen different things. |
| `economy` | The affinity cap holds on **both** channels. Affinity feeds damage and prize money, and the cap was once applied to only one of them, so a stacked build multiplied gold without limit. Also the cup target: it has to be harder every cup and may only stop moving at a card of nothing but Aces, or a card that beats it once beats it forever and cups become a free exponential into retirement legacy. |
| `menus` | Five tabs, both sub-navs, the folds, the pull tab, and the skill cooldown bars. The shot book and trophy room lost their own tabs, so the old view names still have to route — and the cooldown bars are driven off the view name, which is exactly how they stopped ticking when the shot book moved. |
| `devmenu` | The dev menu writes straight to state with no cost and no undo. It must not be reachable by a tap: the course name is the most prominent text on screen and the easiest thing on it to hit by accident. |
| `wagers` | Every reward in the wager book is priced off how far past its Tour Card a run gets, never off the raw floor number. The raw number climbs about two rungs a card on its own, and two of the four contests used to score themselves off their own last run, which is a loop rather than a drift. Also holds the away model to the live one: an away hole has to take as long as a live hole, handicap and all. |
| `progression` | The five progression systems do not repeat each other. The Range, the attributes, the talents, paragon and the trophy room all used to sell "+% swing power". Paragon may not name a stat another system sells, every paragon line has to be wired to something outside its own table, every trophy has to compound and cost more per level than it gains, and every attribute has to have a milestone at the end of it that a single career cannot afford four of. |
| `shop` | Every tab is a rack of tiles, each with art and a price. The pro shop is a storefront with no store behind it, and the first checks here keep it that way: it has to say so on every tab, it must never render an input, a form or an iframe, and a pack must grant without taking anything. Then the shop working: a bag honours the rarity floor and the pity counter it advertises, a bench line stops at ten and is read somewhere outside its own table, each pack is better value per dollar than the one below it, and nothing outside the shop ever pays a sovereign. |
| `save` | A save written by an older build still loads. `migrate()` is the only thing between a format change and somebody's progress, so it gets a save with junk in it, keys that no longer exist, and keys that never did. |

## Adding one

Drop a file in `test/checks/`. It is picked up by name order.

```js
module.exports = {
  name: 'thing',
  async run(page, ctx) {
    // page is already booted with the intro dismissed
    const n = await page.evaluate(() => S.gold);
    if (!(n >= 0)) throw new Error('gold came back as ' + n);
    return ['gold ' + n];          // shown next to PASS
  }
};
```

Throw to fail, with a message that says what the number actually was. Return an
array of short strings to report alongside a pass — a check that only ever
prints PASS teaches you nothing about the direction things are moving in.

`DEV` is the cheat namespace the game ships with (`DEV.gold`, `DEV.upg`,
`DEV.course`, `DEV.set`, …); use it to get to a state rather than playing to it.
Note that `Scene`, `S`, `B` and `DEV` are script-scope bindings, not properties
of `window`, so reference them bare inside `page.evaluate`.
