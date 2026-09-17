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
| `economy` | The affinity cap holds on **both** channels. Affinity feeds damage and prize money, and the cap was once applied to only one of them, so a stacked build multiplied gold without limit. |
| `menus` | Five tabs, both sub-navs, the folds, the pull tab, and the skill cooldown bars. The shot book and trophy room lost their own tabs, so the old view names still have to route — and the cooldown bars are driven off the view name, which is exactly how they stopped ticking when the shot book moved. |
| `devmenu` | The dev menu writes straight to state with no cost and no undo. It must not be reachable by a tap: the course name is the most prominent text on screen and the easiest thing on it to hit by accident. |
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
