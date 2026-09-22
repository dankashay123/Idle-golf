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
| `smoke` | The only check that asserts on the game as a whole: `derive()` returns finite non-negative numbers, the canvas paints something and keeps changing, all ten screens render the row counts their data tables say they should, the loop earns and cards a hole, a wager starts and pays, and the result reaches the save. If this fails nothing below it means anything. |
| `render` | Every course in every weather and every wager book floor draws, and the ground pass stays in budget. Themes are authored as literal tables in places, so a colour the renderer newly depends on can be missing on exactly one course — which is how the wager book went down on its first frame once. Also that nothing draws a hard line across the frame: the sky and the ground have to meet at the horizon without a step, and the haze over them has to keep its shape on a tall buffer as well as a short one. |
| `hazards` | No bunker or pond touches a putting surface, and no hole is left without a bunker. Both are rejections that have to keep working, and they pull against each other. |
| `icons` | Every icon id a list asks for exists, every drawing is 12×12, and no two things in the game share one. Icons were once keyed off the stat each thing moved, so one golf ball stood for seventeen different things. And every drawing reaches the screen at a size it divides into: they are all 12×12, so 12, 24, 36 and 48 give every source pixel the same number of screen pixels and nothing else does. Seven other sizes were in use, and two were not even square — the locker's equip button squeezed its sprite to 7.8 wide by 13 tall, because the button is a flex row and the image had nothing holding its width. The locker shows one slot at a time and only draws that button on a club you are not carrying, so the setup opens enough bags to be sure of a spare and turns the locker to the slot holding the most of them; left to chance it swept an empty locker about one run in ten and proved nothing. |
| `economy` | The affinity cap holds on **both** channels. Affinity feeds damage and prize money, and the cap was once applied to only one of them, so a stacked build multiplied gold without limit. Also the cup target: it has to be harder every cup and may only stop moving at a card of nothing but Aces, or a card that beats it once beats it forever and cups become a free exponential into retirement legacy. |
| `menus` | Five tabs, both sub-navs, the folds, the pull tab, and the skill cooldown bars. The shot book and trophy room lost their own tabs, so the old view names still have to route — and the cooldown bars are driven off the view name, which is exactly how they stopped ticking when the shot book moved. |
| `devmenu` | The dev menu writes straight to state with no cost and no undo. It must not be reachable by a tap: the course name is the most prominent text on screen and the easiest thing on it to hit by accident. |
| `wagers` | Each of the four says what one entry is WORTH, in what that currency buys — and the check plays each contest out and compares, because a projection nobody has measured is just a number. The first cut of it was 5x over on the Island Green: it priced the pot at your bank target as though you always got there, and you reach it about one run in ten. Bounds are per contest and come off repeated runs, because the Long Drive settles at once and the Island Green needs seven hundred samples. Every reward in the wager book is priced off how far past its Tour Card a run gets, never off the raw floor number. The raw number climbs about two rungs a card on its own, and two of the four contests used to score themselves off their own last run, which is a loop rather than a drift. Also holds the away model to the live one: an away hole has to take as long as the average live hole, handicap and all, and — since the pace, the purse and the drop rate all used to be read off whichever hole you parked on, and each of them carries the par, the closing hole, the Sunday and the weather — every one of the seventy two holes of an event has to give the *same* away rate, measured across a 7.5× spread of single-hole purse. The measure walks the golfer over those holes, so it also has to put him back, including when it throws part way through. |
| `progression` | The five progression systems do not repeat each other. The Range, the attributes, the talents, paragon and the trophy room all used to sell "+% swing power". Paragon may not name a stat another system sells, every paragon line has to be wired to something outside its own table, every trophy has to compound and cost more per level than it gains, and every attribute has to have a milestone at the end of it that a single career cannot afford four of. The talent trees are held to the same rule, both ways round: no talent may name a stat sold on a ladder elsewhere, every talent key has to be read outside the tree, and every key `career()` hands out needs something that hands it out — which is how `cond` turned up, read every hole and granted by nothing since the trees were written. Seven talents are measured moving live and Sponsor Eye is measured on four hundred drops. Also that no id lives in two tables at once: five do, every one of them a key in somebody's save, so they are listed rather than forgiven and a sixth fails. |
| `shop` | Every tab is a rack of tiles, each with art and a price. The pro shop is a storefront with no store behind it, and the first checks here keep it that way: it has to say so on every tab, it must never render an input, a form or an iframe, and a pack must grant without taking anything. Then the shop working: a bag honours the rarity floor and the pity counter it advertises, a bench line stops at ten and is read somewhere outside its own table, each pack is better value per dollar than the one below it, and nothing outside the shop ever pays a sovereign. |
| `readouts` | The five places the game answers a question instead of listing numbers. The item sheet has to say what a club would do to the carry *before* it is swapped in, and the preview swaps the club in to measure it, so the one thing it may never do is leave it there — it is asserted across every spare in the bag and through a throw mid-measure. The away card has to show what came of the time rather than a wall of zeroes, and when you have been gone far longer than the caddie is good for it has to own up to both numbers — nine days away used to be reported as "12h away", which is not where the week went. The Range used to carry a summary line at the top naming the next rung in reach; that line is gone, so every rung you cannot afford has to say on its own row how long the purse needs, at the price the button is actually asking for — and a rung you can buy now, or one that is capped, has to say nothing. Every buy button, at every multiplier, has to charge for the number it names: on Max the quantity floors at zero while the price quotes one regardless, so a rung you could not afford read "×0" over a price of 1.20K — an offer to buy nothing for twelve hundred. The retirement screen has to show what a card is worth *before* retirement opens, what one more Tour Card and one more cup would each add, and what the result buys in a trophy room whose prices climb. The honours list has to open on what you are closest to rather than on whatever was typed first, and say so at the top and on the button. |
| `daily` | The two things that run without you. Auto-equip asks `derive()` rather than reading `itemScore`, which is a sort key that discounts the affixes it cannot price and knows nothing about sets. Measured over **two dozen** independent lockers of 120 drops each, the greedy sort key comes out behind on both axes every run — at one locker that figure changed sign between runs (greedy 136% ahead one time, 64% behind the next) and the printed number taught you nothing, which is the opposite of why it is printed. So it takes a swap only when it is better on one and worse on neither, it has to be genuinely inert when off, and it may never lose a club. The stake of the day rotates strictly off the wall clock: stored in the save, a reload would reroll it. Its multiplier is checked by running one contest twice off the same state and the same random sequence, so the gear roll, the ticket and the experience have to come back identical and only the money moves. |
| `layout` | Nothing sticks out past the edge it is inside, measured across five screens, four shop tabs and three sheets — about 1,500 boxes. A grid item will not shrink below its own min-content unless it is told it may, so a club with a long name pushed the locker row's middle column to 231px where only 222 was free: the row overran its own right padding and squeezed the button until the word UPGRADE was cut in half. Also that the away card's three tiles put their captions on one line — one of the three is in a bigger face, so left to flow from the top it set the row height and the other two sat above their own middles. Both are invisible to every other check here: the numbers are right, the rows are all present, nothing throws. You have to measure the boxes. |
| `names` | Everything lives in one file — markup, styles, script, and the markup the script writes as strings — so a name is global three times over, and the same name meaning two things has cost this file a day on three occasions: `#crest`, `.empty`, and `#hud`. `#hud` was the instructive one: a rule with `inset:0` left behind when the old stage HUD came out, doing nothing at all until a new left-hand column took the name, inherited `right:0` and `bottom:0`, and stretched itself over the whole stage. So: no `#id` rule without an element under it, no id the script asks for that is in no markup anywhere, and no id on two elements at once. It found seven live dead writes on its first run — four of them in `renderLive`, which runs every frame. |
| `save` | A save written by an older build still loads. `migrate()` is the only thing between a format change and somebody's progress, so it gets a save with junk in it, keys that no longer exist, and keys that never did. It also gets fifty points spent on the ten talents this build renamed: they have to come back as unspent points with the counter set, because deleting them silently is how a save loses a career to a balance patch. |

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
