# Handoff — Mythic Mulligan

Last updated 2026-09-25 on `main`. Read this with
`CLAUDE.md`, which holds the standing rules. `test/README.md` says what each
check is for.

---

## 1. Where things stand

- Everything is committed and pushed to `main` (mirrored on the session
  branch `claude/notes-review-dju532`). Nothing is half-built.
- `node test/run.js` passes all **54 checks** (about 10 minutes).
- **Last request**: "Let's get rid of the 'unlocks when you have…' text
  completely please". Done: it was only on the Range's upgrade rows; each
  row now reads its level and effect, the price is on the button (grey
  until affordable). `readouts` now requires that no rung says when it
  unlocks.
- **The request before**: "All 4 please and thank you" (the menu: life on the
  other signature holes, a happy dance on a great hole, a Record row for
  seasons seen, a fifth signature hole), and part way through: "Also please
  make sure the hole never ends before the golfer gets to the green". All
  five done, one commit each (§5, the five newest sections). The fifth
  signature hole is a **Railway Crossing** (my pick; the user left it open).
- **The request before**: "All of those please" (caddie perk upgrades, more
  caddie moves, life on the pier, a season chime). All four done.
- **The request before**: "get rid of the caddy wings, just have them
  float up and down a tiny bit; more animation too, like randomly will
  spin, dance, stuff like that for fun". Done (§5 "The caddie: no wings, a
  float, and turns").
- **The request before**: "read the notes and let's continue". Read as:
  build the item the last menu recommended, the **Signature Hole of the
  Week** (§5).
  Also fixed on the way (§5 "Fixed on the way"): the ember ball's burns
  replacing each other (an ember ball played at half its numbers and stalled
  players who play; new check `ember`), the first hole of every round being
  paid at the round before's weather, and the `settings` check's race with
  the second music track (it failed on untouched code).
  - The user has **not yet seen** this or the previous session's work
    (blessing, sliders, autumn on the regular stops, Sea Stack) on the phone.
- **Waiting on the user** (ask when it fits, one or two at a time):
  - Does the second music track (night and wagers) fit? Does the town theme?
  - Does the 2 min battery saver wait suit?
  - Is the auto-climb button's alignment right?
  - They are on about Card V, so they have not seen a home course season
    (from Card XI); the regular stops are in autumn now (September).
- The user usually ends a task by asking **"What's next?"**: a short plain
  menu with a recommendation (§8), then wait for the choice.

### Things the user asked for that must stay

- **Honours stay in the medal** (left column: settings, shop, medal, star).
  They stopped me putting a trophy back on the right.
- The right side, from the bottom up: pull tab, hole map, then the wind and
  weather words standing on the map.
- **Strike and cup sounds are turned right down** (strike 0.09, pure 0.12,
  cup 0.15). Keep them subtle.
- **No applause**: removed at their request (it never stopped when holes
  end every few seconds). Don't bring a crowd back without asking.
- The island crossing (flying on the spinning club) was **their idea**.
- **The caddie has no wings**: he floats, a little up and down, and now and
  then takes a turn (spin, dance, flip, wave, loop). Their request.
- The word is **scrap**, not salvage; old legacy finds are **heirlooms**.

### Sound and music

- Sound works on the iPhone (unlocked on touchend/click, an 'interrupted'
  context resumed).
- Music: "Town Theme RPG" by cynicmusic (`rec-music`) by day; "Meadow
  Thoughts" by ecrivain (`rec-music2`, first two minutes) at night and in
  wagers. Both CC0 from OpenGameArt, mono 40 kbps base64 (the file is
  ~2.2 MB because of them). Switches: Sound, Music, Night Music; sliders
  under Sound and Music.
- **Sessions cannot listen to audio.** Pick by measuring (spectrograms via a
  static ffmpeg, levels through an OfflineAudioContext) and ask the user.

## 2. Working with this user

- They are **not a coder**. Every summary is plain language: what changed on
  screen and why it is better. No function names, file paths or jargon. They
  play on an **iPhone** and often send screenshots.
- **Work on `main`, and commit and push without asking.** They have given
  full permission to act.
- **Fix what's broken the moment you find it.** Mention it afterwards in one
  line.
- **Keep on-screen text short.** Write "%", not "per cent". Keep a number and
  its unit together (the `nb()` helper puts a hard space between them).
  Anything long goes behind a `?` fold. Row titles are in Title Case, and the
  `titles` check enforces it.
- They sometimes change their mind. For example, they asked to rename the
  "Balls" shelf to "Auras" and then asked for it back. Do what the latest
  message says.
- Commit trailer: use exactly the one your own session's system prompt
  gives (it changes with each session). Never copy a model name into a code
  comment or any file, this one included.

## 3. The project

- **The whole game is `index.html`** (about 15k lines, 2.2 MB with the sounds and the music): markup, CSS and one
  classic script. There is no build step.
- Play it over http (`npm start`, then http://localhost:8080). Opening the
  file straight from disk blocks `localStorage`, so it never saves.
- Checks are Playwright scripts in `test/checks/NN-name.js`, run by
  `test/run.js`. Each check gets a fresh page. **Any console error fails the
  check that raised it.**
- Chromium is preinstalled. **Do not** run `playwright install`.

### Map of `index.html`

Line numbers are approximate and drift. Search for the name instead.

| What | Where (search for) |
|---|---|
| All tuning constants, data tables, courses, outfits, clubs, trails, caddie perks, honours | `const B = {` (~878) |
| Calendar helpers (`holeInRound`, `tournamentOf`, `parOf`, `slotOfEvent`) | `/* ---- the calendar ---- */` |
| **Which course an event is on** | `calendarCourse`, `courseFor`, `openEvent`, `homeFor`, `weekNow`, `weekMajor`, `isWeekMajor` (~3280–3345) |
| Weather per round (**hashes on tier**) | `chaosFor`, `courseElFor` |
| State: defaults, save repair, migration | `defaultState`, `initState`, `migrate` |
| Stats | `derive()` |
| Hole lifecycle | `startHole` → `finishHole` → `advanceHole` → `endTournament` |
| Course announcement banner | `announceCourse`, `Scene.drawAnnounce` |
| Tour Cards | `climb`, `eventsToUnlock`, `roundRatio`, `projectedRatio`, `climbLines` |
| Shop: four tabs, Offers (one-time offers, Double Purse as a wide tile, sovereign packs), Bags, Bench, Style. An old caller asking for `'buy'` gets Offers | `renderShop`, `shopCard` (`wide`), `styleDef`, `styleOwned`, `styleBuy`, `styleTry` |
| **Trophy Room** (the medal under the shop): Today, Cabinet, Honours; the case's rewards | `trophyRoom(tab)`, `roomToday`, `dailyBlock`, `roomCase`, `honRows`, `collect(id)`, `casePending`, `caseTrack`, `B.CASE`, `S.caseGot`, `roomWaiting` |
| Stage buttons (Trophy Room `#roomBtn`, perks, shop, settings, auto-climb): one renderer | `renderStageBtns` (was `renderHonBtn`); markup `#hudLeft` > `#rRow` (readout + `#hudClimb`), `#setBtn`, `#shopBtn`, `#roomBtn`, `#perkBtn`; the map alone on the right at 37% |
| **Scrapping**: the locker's Scrap button and sheet, auto-scrap on arrival | `scrapSheet`, `scrapKeeps`, `autoScraps`, `autoScrapTop`, `scrapList`, `sparesPastTwo`, `S.autoScrap` (-1 off, else a rarity); applied in `bagAdd` (which now returns whether the club was kept) and in `offline`'s `bagAddOff` |
| Heirlooms (Career > Legacy). **The code still calls them trophies** (`B.TROPHY`, `S.relic`, `discover`, `trophiesFound`); only the words on screen changed | `renderLegacy` |
| The Career tab's dot for "retiring now finds an heirloom" | `retireWorth` (worked out once a second), `renderXp`, `renderCareer` |
| Retirement | `retireCard`, `retire` |
| Offline catch-up (`OFFLINE` flag) | `offline()` |
| Sound: recordings `rec-strike`, `rec-cup` and `rec-music` (base64 MP3 near the top of the body; the applause was removed) with the synthesised sounds as stand-ins | `const Sfx`, `Sfx.rec`, `Sfx.load`, `Sfx.musicTick` |
| Ground painted by the pixel, reused while the camera is still | `const PixPaint`, `drawGround` (`_gKey`, `gGen`), `ripples`, `groundTail` |
| Live numbers written only when they change | `setText`, `setHTML`, `setCls`, `setSty` |
| Fairy reactions and quips | `fairyReact`, `fairyNow`, `fairyDy`, `tickQuip`, `Scene.holed`, `B.FAIRY_SAY` |
| Auto-climb judgement | `deriveStill`, `roundRatio`, `B.CLIMB_FIT` |
| Palettes built from a course | `buildTheme`, `courseTrees` |
| **Landmarks** | `drawLandmark` (called from `Scene.buildRidge`) |
| Renderer | `const Scene = {`. Key members: `newHole`, `newDepthsHole`, `proj`, `curveAt`/`bendOff` (doglegs), `layHazards`, `layProps`, `buildSky`, `buildRidge`, `buildWood`, `drawGround`, `drawGolfer`, `fairyBox`/`drawCaddie`, `swing`/`walking2ball`/`launch`, `drawBalls`, `drawLyingBall`, `drawMap` |
| **Season chime** | `seasonTurn` (from `startHole`), `S.seasonSeen`, `Sfx.season`, `Sfx.SEASON_CHIME`; dev menu Sound row "chime: …" |
| **Life on the pier** (spray, gulls, their cry) | `Scene.drawSpray`, `Scene.drawGulls` (both called at the end of `drawPier`), `Scene.gullOff`, `Sfx.gull`, `Sfx.GULL_VOL`, `Sfx.gullT` |
| **Caddie perk upgrades** (Lv 1-5) | `B.CPERK_LV_MAX`, `CPERK_LV_T`, `CPERK_LV_V`, `CPERK_LV_COST`, `cperkLv`, `cperkVal`, `cperkDur`, `cperkTxt`, `cperkUp`, `S.cperkLv`, `renderCadPerks` (the worn row's button), honour `headcad`; `DEV.cperkLv` |
| The caddie's turns (spin, dance, flip, wave, loop, cartwheel, juggle) | `FAIRY_MOVES`, `fairyPose`, `Scene.tickMove`, `fairyMoveNow`, `fairyMoveGo`, the offscreen `_fairyCv` in `drawCaddie`; `DEV.move` |
| Caddie perks (nine; `now:1` means instant, e.g. Ready Golf); each has `col` and a short line `s` | `tickCaddie`, `cperkPick`, `renderCadPerks`; the blessing `Scene.drawBless`, the countdown `buffTip` (`#buffTip` in `#setRow`) |
| Clipping to the ground in front | `Scene.clipAt(d)`, `fillClip`, `pxLineClip` |
| Volume | `Sfx.out`, `Sfx.master` (effects), `Sfx.musBus`, `Sfx.setVol`, `setVol`, `S.volFx`, `S.volMus` |
| Daily challenges | `dailyStart`, `dailyTick`, `dayNow` (`DAY_FORCE` overrides it in tests) |
| Tour tab: Tour Card, The Card, Season, Major of the Week | `renderTour`, `renderSeason`, `renderMajor` |
| **Seasons**: home courses by the card, six regular stops by the real month | `SEASONS`, `homeSeason`, `courseSeason`, `CAL_SEASONED`, `MONTH_SEASON`, `monthNow`, `seasonLook`, `LOOK_CACHE`, `SEASON_FORCE`, `Scene.look`, `Scene.snow` (drawn in `drawWeather`), the banner in `announceCourse` |
| **Signature holes** (island, canyon, stones, sea stack) | `sigHole`, `sigKind`, `SIG_NAME`, `B.SIG_HOLE`, `HOME_PIER`, the `*_FORCE` values, `drawBridge`, `drawStones`, `drawPier`, `isleWait` (the hold), `sigScore` (honours and `S.sigRec`), `renderRecord` |
| **The hole waits for him to reach the green** | `Scene.holeWait` (was `isleWait`), `B_GREEN_UP`, `B_GREEN_STAND`, `Scene.upT`, `holeSaid`, `Scene.saidHole`, the `waiting` guard and hold in `step`, `walk` in `finishHole` (the wait paid for) |
| **Railway Crossing** | `isRail`, `RAIL_FORCE`, `P_RAIL`, `Scene.tickRail`, `railAt`, `railHold`, `railLights`, `drawRail`, `drawTrain`, `RAIL_X`/`RAIL_V`/`RAIL_LEN`/`RAIL_MEET`, `railWait` in the camera code, `Sfx.whistle`/`chuff`/`ding`, `SIG_HOME_ROUND`; `DEV.rail` |
| **Life on the signature holes** | `DUCKS`, `Scene.duckAt`, `drawDucks`, `drawHawk` (from `drawBridge`), `fishAt`, `drawFish` (from `drawStones`), `Sfx.quack`/`hawk`/`plop` |
| Happy dance, Seasons Seen | `Scene.happyDance`, `fairyQueue`; `S.seasonsGot`, `seasonsSeen`, `seasonsAll` |
| **Signature hole of the week** | `SIG_KINDS`, `sigWeekOf`, `sigWeek`, `isSigWeek`, `holePurse`, `B.SIG_WEEK_MULT`, `SIGWEEK_FORCE`; the map's `mapStar` / `MAP_STAR` and `Scene.mapWk`; `DEV.sigWeek`, `DEV.reprice` |
| Island greens in particular | `isIsland`, `ISLE_FORCE`, `Scene.isle` (`bank`, `land`), `Scene.spot`, `Scene.heli`, `B_FLY`, `paintHeli`, `P_LAKE`, the `moat` in `newHole` and `layHazards` |
| **Battery saver** | `saverOn`, `saverOff`, `saverDue`, `saverDraw`, `saverStats`, `saverFrame`, `saverClub`, `SAVER`, `S.saver`, `SAVER_AUTO`, `touchedAt`; the loop's switch is in `frame`/`frameBody`; markup `#saver` |
| Golfer drawn at any size in the equipped look (the course and the saver share it) | `paintGolfer` |
| Developer menu (hold the course name still for 1.5s) | `const DEV = {`. `DEV.course(i)` pins any course to the next event (a major of the week is set up as the major). The read panel shows the audio state and the auto-climb judgement; rows for the major of the week, the season, the cabinet, sound and music, the fairy, caddie perks, the new honours, and a frame-time readout (`DEV_FPS`) |
| Main loop | `step()` |

### Globals worth knowing

- `S`: the save state.
- `B`: the constants.
- `QUIET`: set during test and dev fast-forwards. It suppresses toasts and
  also suppresses the weekly-major claim.
- `OFFLINE`: true during a catch-up.
- `DAY_FORCE`: pins the day for dailies and the weekly major.
- `PREVIEW`: a style being tried on.
- `VW` / `VH` / `HORIZON` / `CX`: the size of the drawing buffer. It is small,
  about 199×215 in portrait, and scaled up to fill the screen.

## 4. Rules that have cost real time

1. **A check that fails once is not a flake. Chase it.** Last session the
   render check failed because the suite reached the Blossom course on a
   different hole than before. That exposed a real hard line across the
   screen which had always been there on some holes.
2. **Measure across a sweep, never one sample.** Report a geometric mean with
   its spread.
3. **`chaosFor` / `courseElFor` hash on the tier.** Comparing two tiers
   quietly compares two different weather sequences, so pin the weather on
   both sides.
4. **Negative-test every new check.** Break the game on purpose (a
   `python3 -c "s.replace(...)"` patch on a backup of `index.html`), confirm
   the check fails, then restore. Last session two breaks slipped past the
   new check at first; one showed a real gap, which is now covered.
5. **Checks that change `S` must snapshot and restore it:**
   `const SNAP = JSON.stringify(S)` … `finally { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole(); }`.
   Also reset `QUIET`, `OFFLINE` and `DAY_FORCE` in the `finally`.
6. There is no Python PIL here. To combine screenshots into one sheet, write
   an HTML page of `<img>` tags and screenshot it with Playwright. There are
   example scripts in the session scratchpad, but it is not kept, so rewrite
   them as needed.
7. **Eight seeds can be lucky.** `pacing` passed on its eight seeds while
   three other sets of eight each held a player stuck at four times par.
   When a balance check passes, try it once with the seed offset changed
   (`seedN * 7919 + 1` in the check) before trusting it. Also: cosmetic code
   that calls `Math.random` inside the simulation (for example the fairy's
   word choice in `Scene.holed`) shifts the seeded sequence those checks use.
8. **Negative-test harness gotcha.** If you patch with a `python3 -c` split
   on a separator, pick one that cannot appear in code (`@@@`, not `|`): a
   `||` in the pattern silently wrote broken code and the page never loaded,
   which looked like a flaky timeout.
9. **Playwright version.** `npm install` fetches a newer Playwright whose
   browser is not installed here. Use `npm install --no-save
   playwright@1.56.1` (it matches `/opt/pw-browsers/chromium-1194`), and do
   not commit a `package-lock.json`.
10. To take a screenshot, open `file://…/index.html` in Playwright (fine when
   no saves are needed), call `hideSheet()`, use `DEV.course(i)` to change
   course, and clip to `#stage`.
11. **Sizing a box to its words moves whatever sits beside it.** The hole
   readout's width followed its text, which changes every second; putting a
   button after it made the button slide. Anchor the neighbour and let the
   box fill. The `shop` check writes the longest real words into the readout
   and requires the button not to move.
12. **Test clubs need their affixes cleared.** `makeItem(ilvl, 0, rar)` can
   roll a higher rarity with its affixes, and forcing `it.rar` afterwards
   keeps them; a stray purse affix made a far better club a trade-off and a
   check failed one run in three. `33-scrap.js` sets `it.aff = []`.
13. **An away session long enough to fill the locker hides locker bugs.**
   The overflow trim clears low clubs whatever else happened; measure over
   half an hour.
14. Don't `pkill -f "node test/run.js"` from a command that itself contains
   that text: it kills its own shell. Kill by PID.
15. Check on-stage changes at 320, 360, 390, 430 and on its side (740x360,
   844x390). The user's phone is an iPhone; 320 is the narrow edge case
   where the stage falls back (auto-climb drops under the readout).
16. **A check that freezes the round cannot see how a hole ends.** The
   island's first check stopped the round to film the flight, so the hole
   could never end early; in real play it ended with the tee shot and he
   never flew. Play anything tied to the end of a hole in real frames too.
17. **Frame-time checks time the quickest of several blocks.** `skins`
   averaged 300 frames against a 1.5ms budget with the typical frame at
   1.3ms; a browser pause put it over one run in three, on old code as much
   as new (measured over eight runs each). It now takes the quickest of five
   blocks, and still fails when a skin is made 0.4ms dearer.
18. **Read a live number and its expectation in the same instant.** The
   saver check read the tally, then worked out what it should say in a
   second call; the round kept earning in between and the two differed by a
   hole's purse one run in forty. Anything the running game changes is
   compared inside one `page.evaluate`.
19. **Anything drawn over the field keeps to the ground's clip line.** The
   bridge, stones, pier and rocks are drawn after the ground, so a hill in
   front does not hide them by itself. Use `fillClip` / `pxLineClip` with
   `Scene.clipAt(d)` of the thing's own distance; a long line (a rope, a
   rail) is drawn in short lengths, each cut at its own farther end, or its
   near half is lost. `sigview` diffs every such hole with and without them.
20. **The regular stops' season follows the real month**, so a check that
   draws them can pass in September and fail in December. After touching
   seasons or anything they colour, run the suite with **`featDay`** (the
   real day) pinned to a day in January, April, July and October: 20833,
   20923, 21014, 20741. Patch a copy of the game, not the working file, so
   runs can overlap and nothing needs restoring. Don't pin `monthNow`:
   `seasons` and `chime` walk the months by moving `DAY_FORCE`, and a pinned
   month ignores it (both fail, falsely). Only the "today" line of
   `seasons` should move.
21. **The suite picks up any check file present when it reaches it**: don't
   write a new check while a full run is going, or it runs half-built.
22. **Some checks count rows** (`smoke` counts the Record's): adding a row
   to a sheet means updating that count.
23. **The signature hole of the week follows the real week**, and it moves
   money, so a check that plays for money can pass this week and fail the
   next. After touching the purse, the pacing or anything paid per hole, run
   the suite with the week pinned to each kind: a temporary patch of
   `sigWeek` to return `'island'`, `'canyon'`, `'stones'`, `'pier'`,
   `'rail'` in turn (in a copy of the game, like rule 20). Only `sigweek`
   itself should fail then (its calendar part expects the week to turn).
24. **A hole is priced as it is played.** The purse carries the weather's
   gold multiplier, so `startHole` draws the weather before it reads the
   golfer (`derive()`); `sigweek` compares the away model's price with the
   live one and caught it the other way round.
25. **A hole waits for him while the course is drawn** (`Scene.holeWait`):
   a check that calls `step()` right after drawing, with `QUIET` off, will
   not see the hole end until he has walked up to the green. Play frames
   (`step` and `Scene.draw` together), or set `QUIET`. It is also why
   `performance.now` matters: the wait only holds while the last frame was
   drawn within 250ms.
26. **Measuring a sound with `Math.random` pinned to a constant silences
   every noise burst** (`Sfx.noise` fills its buffer from it). Feed it a
   seeded stream instead.

## 5. What the last features do (for debugging them)

### A hole never ends before he reaches the green (user asked, mid-task)

- Before: a hole moved on the step its ball was down, with him on average
  about 12 short of the pin (up to 30) and, on a strong bag (holes of about
  a second), never off the tee. Measured in frames with `greenwait2.js`
  (scratchpad; rewrite if lost: step + draw at 60 a second with
  `performance.now` driven by the script).
- Now `Scene.holeWait()` (was `isleWait`, which only covered the signature
  crossings) holds the hole's end in `step()` until he has walked up within
  `B_GREEN_UP` (1.5) of the pin and stood there 0.25s (`Scene.upT`), after
  any crossing. Only while the course is drawn (`drawnAt` within 250ms), not
  in `QUIET`/`OFFLINE`/a wager, not behind the saver; capped at `ISLE_HOLD`
  (8s). Once the ball is down (`S.yards <= 0`) the camera heads straight for
  `LEN - B_GREEN_STAND` (1.0) a little brisker (rate 6, was 4.5), whether
  or not the last ball is still in the air.
- The cup's sound, the banner, the caddie's word and the happy dance come as
  the ball drops (`holeSaid`, called once from `step` when the wait begins;
  `Scene.saidHole` stops `finishHole` repeating them). Unwatched, everything
  happens in `finishHole` in the old order, so seeded checks see the same
  random sequence.
- Nothing is played on a waiting hole: `step` skips `autoCast`, the burn and
  the swing timer while `S.doneT != null && S.yards <= 0`.
- **The wait is paid for**: `finishHole`'s `walk` = elapsed / doneT (1 when
  it did not wait). The hole's gold (its swings' `S.holeGold` and the
  finish), its experience and its gear-luck roll are scaled by it, so purse
  per second watched equals away. Measured on the same dice (the picture on
  its own random stream, no caddie perk): 3.81 against 3.67 a second on a
  fresh bag, 57.7 against 56.4 on a strong one; the difference is the two
  runs drifting apart (wall-clock buffs), not the wait. What is not paid:
  events simply take longer while watched (about 12% on a normal bag, 2.5x
  on a strong one), so per-event things (cheques, cups) come slower.
- Typical wait: 1.1-1.2s on a plain hole; island 2.5-3s, stones about 3s,
  a railway up to about 5.5s (the train).
- Check `green`. `dance` now plays its frames with `step` running.

### The Railway Crossing, the fifth signature hole (user asked, my design)

- Where: a home course's last par four of the front nine (hole 9 in all
  three par layouts; `sigHole` special case: `holeInRound <= 9`); regular
  courses `moorland`, `ironbark` (were stones and canyon) and the major
  `oldlinks` (was stones) in `B.SIG_HOLE`. So home rounds have five
  signature holes (`SIG_HOME_ROUND`); Signature Round needs all five.
- `newHole`: `rail` moat `{ rail: 1, d: 0.47 LEN, rd: 0.95, rx: 40 }` drawn
  by `P_RAIL` (level ballast in the course's rock), map colour rock, roll
  0.5. `Scene.isle` gets `{ bank, land, rail: 1 }`; balls never rest on the
  line (`spot`).
- The train (`tickRail`, `railAt`, `railHold`, `railLights`): sets off
  `RAIL_X` (34) out, runs at `RAIL_V` (11), `RAIL_LEN` 7.4 long; every
  20-35s on its own (`trainNext`, own `seeded` stream), and one meets him
  the first time he reaches the line on a hole (`trainMet`), setting off
  `RAIL_MEET` (20) out so the wait is about 3.6s. He does not step onto the
  line while a train is set off and not yet clear (`railWait` in the camera
  code clamps him to the bank; the first version let him fall through to
  his ordinary walk, and the check caught it).
- `drawRail` (after `drawDucks` in the frame): sleepers, the boarded
  crossing, far rail, far posts, the train (`drawTrain`: engine, two
  carriages with lit windows, round smoke puffs), near rail, near posts;
  posts carry crossed white boards and two lamps flashing while
  `railLights`. All clipped at their own distance.
- Sounds: `Sfx.whistle` (as it sets off, -45.7 dB), `chuff` (every 0.26s
  while it runs, about a bird), `ding` (every 0.45s while the lamps flash,
  under the plank). `WHISTLE_VOL`, `CHUFF_VOL`, `DING_VOL`.
- Week rotation is now plain `wk % 5` (`sigWeekOf`); week 2960 is still the
  island and 2961 the canyon, as before. Honour **All Aboard** (`sigRl`,
  tally `sigRail`). Dev menu: "railway" button, "railway birdies +25".
- Checks `rail` (new), `sigview` (plays rail holes with a train in every
  view), `sigweek`, `honours`, `island`, `smoke` updated for five kinds.

### Life on the other signature holes (user asked)

- `drawDucks` (island holes only, `isle.fly`): four ducks (`DUCKS`, two
  drakes with green heads, two hens) paddling slow rounds short of the
  island, kept inside the lake's outline (`duckAt` clamps to 0.7 of
  `hazSpan`), a pale wake, one tipping up now and then.
- `drawHawk` (from `drawBridge`, so canyon only): circling over the gorge,
  soaring with raised tips, three beats every 6.3s; not at night.
- `drawFish` (from `drawStones`): three fish on clocks of their own
  (`fishAt`), half their turns a leap out beside the stones and back, a
  splash and a ring; none on ice.
- Sounds from `Sfx.tick`: `quack` (island, not at night), `hawk` (canyon,
  not at night), `plop` (each fish that lands, off `fishAt`). Levels
  measured with real noise (a constant `Math.random` silences `hiss`: the
  first measurement read the chuff at -120 dB).
- All worked out from the clock (`hr` noise), no `Math.random`. Check
  `wildlife`; `sigview` now also plays island holes and moves the clock
  between views (a fish drawn through the ground was missed while it stood
  still).

### A happy dance on a great hole (user asked)

- `Scene.happyDance(d)`: an ace two flips and a cartwheel, an albatross a
  flip and a cartwheel, an eagle a cartwheel, one birdie in three a dance or
  a spin (his own `_moveRnd` stream). The turns queue in `fairyQueue` and
  `tickMove` starts each as the last ends; a perk going off or a wager
  drops the rest; no turn of his own for 12s after. Called from `holeSaid`
  (as the ball drops) or `finishHole`. Check `dance`.

### Seasons Seen on the Record (user asked)

- `S.seasonsGot[courseId]` is a bit a season (0 as built .. 3 blossom), set
  in `seasonTurn` for every hole played on a course that turns, catch-ups
  included, wagers not; `initState` repairs it and counts an old save's
  `S.seasonSeen`. The Record row "Seasons Seen" reads "n of 64"
  (`seasonsSeen`, `seasonsAll`). The Record's row titles went to Title
  Case. Checked in `chime`.

### Season chime (user asked, the last of four)

- `S.seasonSeen[courseId]` is the season (0 as built .. 3 blossom) each
  course that turns (home courses, `CAL_SEASONED`) was last seen in.
  `seasonTurn()`, called in `startHole` after the new hole is laid out,
  notes it; if it differs from what was noted, `Sfx.play('season', s)`.
  So it chimes with the banner when a course comes up in a new season, and
  on the next hole if the month turns part way through an event. Not the
  first look at a course, not in a catch-up (`QUIET`/`OFFLINE`) or a
  wager: the next live hole hears a turn passed there.
- `Sfx.season(s)`: autumn four falling notes (D6 B5 G5 E5), winter high
  sine bells (E7 G7 E7 B7), blossom five rising (C5..E6), as built two
  (G5 C6). Measured offline: -36.4 to -38.2 dB, against the coin jingle's
  -37.4 and the honour fanfare's -33.5. Dev menu Sound row plays each.
- Junk in `S.seasonSeen` is dropped on load. Check `chime`.

### Life on the pier (user asked, the third of four)

- **Spray** (`drawSpray`): on a Sea Stack hole with the wind at 6 mph or
  more, waves slap the windward posts and spray blows up and across the
  deck: 64 drop slots, as many used as the wind allows (all at 18 mph, a
  crosswind is 18-24). Each drop is a slot on its own clock (`hr` noise off
  `Scene.t`), so nothing is stored and `Math.random` is never touched; drops
  are a twentieth of a unit, streaked downwind, with a white burst at the
  foot of the post a wave hits. Cut at their own distance's ground line.
- **Gulls** (`drawGulls`): three wheel over the sea round the stack,
  flapping then gliding (a pixel "v", "^" or flat, white with grey tips,
  scaled with distance). One sits on the middle post of the pier (white
  body, grey back, yellow beak) until the camera comes within 7 of it
  (`Scene.gullOff`, reset per hole), then flies up and out to sea for 6s.
- **The cry** (`Sfx.gull`): a thin "kee" and a falling "ow", once or twice,
  every 6-15s on a Sea Stack hole, not at night. Measured offline (loudest
  300ms): -54.9 dB against a bird's chirp at -54.3 and a gust's -46.
- Both draw inside `drawPier`, so `sigview` holds them above the ground in
  front (pier holes are level anyway). Check `pierlife`.

### Caddie perk upgrades (user asked: "all of those", the first of four)

- The perk he wears can go up a level at a time to Lv 5, on the Range's
  Caddie rack: the worn row's button (it read "Worn") now reads "To Lv n"
  over the price, or "Top level" with a tick; its meta line says "Worn ·
  Lv n/5". A `?` above the rows says what a level does. Owned rows show
  their level once past 1.
- Each level: `CPERK_LV_T` (1s) longer and `CPERK_LV_V` (12.5%) of its own
  strength stronger (Ready Golf and Lost Ball Scout only stronger).
  Prices 100, 160, 250, 400 sovereigns (910 to the top). Values round to
  whole percents (tenths of a second for Ready Golf), so Lv 5 Tempo Call is
  +30% for 12s, Sponsor Chat +38% for 12s.
- `cperkTxt` makes a level's words from the perk's own (`s`, `d`) by
  swapping the numbers, so Lv 1 reads exactly as before (`bless` reads
  those lines).
- The blessing grows a little with the level: 6% wider, 8% brighter and
  0.1s longer a level (`Scene.bless.lv`).
- Honour **Head Caddie** (`headcad`, metric `cperkLv`: the highest level of
  an owned perk): a perk at Lv 5, 2 tickets and 10 sovereigns.
- `S.cperkLv` is repaired on load: levels 2-5 on owned, known perks only.
- Check `perkup`.

### The caddie: no wings, a float, and turns (user asked)

- The wings are gone (and the sideways drift with them). He floats up and
  down, `gh * 0.035` either way (about 2px on a phone), as before. The
  fairy dust still falls off him.
- **Turns**: `FAIRY_MOVES` (spin 1.0s, dance 2.6s, flip 0.9s, wave 1.8s,
  loop 1.4s, cartwheel 1.8s, juggle 2.6s; the last two added on request:
  over once away from the golfer with arms out and legs split, then a
  float back; three golf balls hand to hand in arcs that rise out of his
  hands and sink back at the end, drawn after him in `drawCaddie`). `Scene.tickMove` (called with `tickQuip` from the frame)
  starts one 8-18s after the course is first drawn, then 12-28s after each
  ends, never the same twice running; not while he has his say, while a
  perk goes off (a perk going off also ends one: its arms up come first) or
  in a wager. It draws its random numbers from its own `seeded` stream:
  `Math.random` is the round's, and the balance checks seed it.
- `fairyPose(kind, q, T, w, h)` gives the move as offsets and limbs: `dx`
  (never toward the golfer), `dy`, `sx` (a spin squashes him, and mirrors
  him below zero), `rot` (a flip rolls him), `armL`/`armR` (0..1 up; the
  cast's arms share the code), `waveL`, `legs` (a stride phase for
  `drawLegs`). Spin and flip draw him whole into `_fairyCv` and lay it down
  with nearest-neighbour scaling; a roll that takes more room takes it on
  the far side. `Scene._fairy` is the room he takes (standing box and turn
  together), which the `caddie` check holds clear of the golfer.
- A reaction's hop or droop sits a turn out (the word still shows).
- Dev menu, Fairy caddie row: a button per turn. Check `fairy` (pixel for
  pixel: none of his on the golfer's through every turn and swing stage;
  no wings; the float; the timing; no `Math.random`).

### Signature hole of the week (the menu's recommendation)

- **Which kind**: `sigWeekOf(wk)` = `SIG_KINDS[(wk + floor(wk/4)) % 4]`
  (`SIG_KINDS` is `SIG_NAME`'s order: island, canyon, stones, pier). Every
  block of four weeks has all four, never the same two weeks running, and
  the order slides a step each block so each major of the week (also
  `wk % 4`) meets each kind in turn; a plain `wk % 4` paired each major with
  the same kind for ever. `sigWeek()` reads `weekNow()` (so `DAY_FORCE`
  moves it); `SIGWEEK_FORCE` pins it (dev menu row "Signature hole of the
  week"). Week 2960 (from Monday 21 Sep 2026) is the island.
- **The money**: `holePurse(h, tier, gold)` = `purseFor` x `SIG_WEEK_MULT`
  (2) when `isSigWeek(h)`. Used for the hole (`startHole`'s `S.purse`, so
  every swing and the finish pay double) and by the away model
  (`roundRate`). Not in `purseFor` itself: the event's cheque, the nine-hole
  goals and the Vault's "holes worth" are priced off it and must not move.
  Measured over every course at five Tour Cards (geometric mean, range),
  on an event whose course has the week's kind: island +4% (home courses,
  two a round, +7%), sea stack +4%, stepping stones +9% (5% to 16%), canyon
  +15% (6% to 19%: the canyon is often the round's closing hole, which pays
  3.2x). A course without the kind gets nothing extra.
- **Marked where it is played**: the hole map's 1px frame goes brass and a
  7x7 sparkle (`mapStar`, gold with a pale centre and a dark edge, ebbing
  for 0.35s every 1.8s) sits in its top left corner, clear of the green (a
  signature hole is straight, so the green is always central). The corner's
  words read e.g. `CANYON CARRY ×2` (a `×` glyph was added to both
  pixel faces). The tee toasts "Hole of the Week · Canyon Carry · pays
  2×". The Trophy Room's Today page has a This Week row: "Canyon Carry —
  Signature Hole of the Week · pays 2×".
- On its side the map shows as it always has, when the corner's words
  leave it room (on a hole with a long forecast it gives way); the ×2 in
  the words shows either way.
- Check `sigweek`.

### Fixed on the way

- **The ember ball's burn** (check `ember`): each strike that took the
  ember affinity *replaced* the burn already going (`S.burn = dmg*v/3`), so
  at a quick tempo most of every burn was lost and a provisional's small
  burn could wipe out a pure strike's big one. derive() (and so auto-equip,
  the item sheet and the away model) credited every burn in full: an ember
  ball played at about half its numbers. Burns add up now: `S.burn` is the
  burn left to deal, spent evenly over `S.burnT` (3s from the last strike).
  How it was found: `pacing` failed with the week pinned to the Sea Stack.
  Over 200 seeds each, a player who plays sat 20 minutes under 40% par or
  better in 1 (old game, 38%), 2 (no week bonus), 1 (island) and 4 (sea
  stack, one at 0%) seeds; tracing the worst showed the gear sweep swapping
  a storm ball for an ember one it rated higher, then doubles for half an
  hour. Measured at that moment, same holes and numbers: the ember ball at
  2.14x par, the storm ball it dropped at 1.39x; with burns adding up the
  ember plays at 1.53x (what is still burning when a hole ends is lost,
  which is fair for damage over time). After the fix, 200 seeds each:
  island and canyon weeks no window under 40%, sea stack two (34%, 39%),
  no bonus one (28%: a storm ball on a verdant course, the affinity dip the
  `pacing` header already allows for). The sweep script is the `pacing`
  player with `SIGWEEK_FORCE` set per run; about 25 minutes for 200 seeds.
- **The weather and the purse**: `startHole` read the golfer (`derive()`,
  whose gold carries the weather's multiplier, 0.8x to 2.3x) before drawing
  the new hole's weather, so the first hole of every round was paid at the
  round before's weather. The away model drew it first, so the two
  disagreed on four holes an event. The weather is drawn first now.
- **The `settings` check** waited for three of the four recordings and then
  required exactly three, so it failed whenever the second music track
  decoded first (it did on untouched code this session). It waits for all
  four now.

### Caddie blessing and the countdown (user asked)

- Each caddie perk (`B.CPERKS`) has `col` (its colour) and `s` (its short
  line). When one goes off, `tickCaddie` sets `Scene.fairyCast` (the caddie's
  arms go up for 1.1s in `drawCaddie`) and `Scene.bless`; `Scene.drawBless`
  drops a column of that colour on the golfer (white core, motes, a ring at
  his feet), 1.5s in all.
- The line right of the cog is `#buffTip` in `#setRow`, absolutely placed so
  it never widens `#hudLeft` (the layout check caught that). `buffTip(dt)`
  runs every step from `tickCaddie`; it reads the seconds straight off
  `S.buff[pk.k].t`, so nothing extra is saved. The next-hole perk (Lost Ball
  Scout) says "next hole" and stays; Ready Golf shows 2s via `cperkShow`,
  and not at all if the hole was already down. Fades over the last second.
- Check `bless`.

### Volume sliders, calendar seasons, Sea Stack, record rows

- **Volume**: `Sfx.out` (0.35) -> destination; `Sfx.master` (effects: every
  sound but music, as before) and `Sfx.musBus` (music) feed it. `S.volFx`,
  `S.volMus` 0..1, left out at full; gain is the square. `setVol` rewrites
  only the % figure while dragging (a redraw drops the drag). Check `volume`.
- **Calendar seasons**: `CAL_SEASONED` (coastal, sandbelt, highlands,
  blackwater, riverbend, moorland) take `MONTH_SEASON[monthNow()]` (UTC month
  of `dayNow()`, so `DAY_FORCE` moves it); `courseSeason` replaces
  `homeSeason` at the two call sites. `SEASON_FORCE` also applies to them.
  The suite was run with the month pinned to Jan, Apr, Jul and Oct: only
  the "today" line of `seasons` moves. Check `seasons`.
- **Sea Stack** (`pier`): the Coastal Classic, the Seaside Open (both
  were island/canyon) and Harbour Lights' front nine (`HOME_PIER`; its back
  nine keeps the island). Laid out as an island (same lake, `spot`, hold),
  with `isle.pier = 1, fly = 0`: he walks at `B_BRIDGE`, planks knock.
  `drawPier`: deck a hand above the water, posts and a rail (drawn in short
  lengths, each cut at its own farther clip), and rocks round the green with
  a gap for the pier; rocks within 2.5 of the near cut are skipped (up close
  they filled the corners). `PIER_FORCE`, dev "sea stack". Honour Sea Legs
  (`sigPier`). Checks `pier`, `sigview` (now covers it), `island`.
- **Record rows**: `S.sigRec[kind] = {n, b}` from `sigScore`; `renderRecord`
  shows one row per kind ("12 played · best Eagle", or a dash). Check
  `honours`.

### The small pixel face (user asked)
- `GLYPH_S`: a proportional face, mostly 4 px wide with a 1 px gap (the bold
  `GLYPH` is 6 + 2), 7 rows of caps and a descender row (`FHS` 8). Text at
  the base size (`sc <= TSC`) uses it; anything larger keeps the bold face
  (`faceOf`), so scores and course names on the banner stay chunky.
  `textW`, `glyphCv`, `textCv` all go through `faceOf`; `LH` is now
  (FHS + 2) * TSC. The weather lines come out at about 61% of their old
  width. `font` checks it.

### The corner: pull tab, map, words (user asked)
- `placeMap` puts the map at the foot of the field on the right, its bottom
  a small gap above the pull tab (`#drawer`), its height what is left
  between the words above it and 37% of the stage (the toasts' corner), up
  to its full shape; under 0.8 of its width it is not shown. Placed again
  on every hole (`newHole` calls `mapHide`), since the lines above it
  (`hudLines`) change; `drawHud` places it before drawing the words, so they
  never stand on a stale map. Conversions use the canvas's exact scale.
- `hudBase()` / `hudRight()`: the words' lowest line stands on the map's top
  edge and lines up with its right edge; with no map they sit above the tab
  as before. `hudRoom()` is the room right of the golfer and the ball at his
  feet (it was 62% of the picture, which on its side ran a long forecast
  across him); a longer two-part forecast splits onto two lines.
- `layout` draws one real frame, requires the map on a 400 phone, and holds:
  words above the map, map just above the tab (within 24px), right edges in
  line, words above the tab when there is no map.

### Signature holes everywhere, and their honours
- `sigHole(h, kind, par, homeNine)` decides all three (`isIsland`,
  `isCanyon`, `isStones` call it; `lastOfPar` finds the last hole of a par
  in its round or nine). A home course has all three kinds, four holes a
  round; every other course has the one kind in `B.SIG_HOLE` (islands where
  there is water, canyons in rock and sand, stones where a river runs),
  once a round on the round's last hole of that par. `sigKind(h)` says which,
  `SIG_NAME` names it.
- The round's closing hole was labelled SIGNATURE in the corner (it plays
  harder: `S.armor`); it now reads CLOSING HOLE (CHAMPIONSHIP on Sunday),
  and a signature hole names itself there in brass (`hudLines` counts it).
- Honours (`sigScore`, called from `finishHole`): Signature Round (`sig4`,
  par or better on all four of a home round's signature holes, counted in
  `S.sigRound` as they are played; a bogey spoils it), Island Hopper (25
  island birdies), Rope Walker (10 canyon birdies), Sure-Footed (10 stone
  birdies), Ace on the Island. All pay tickets and sovereigns, nothing that
  moves the balance. Dev menu: Honours row buttons for each.

### Stepping Stones (the third signature hole)
- `isStones(h)`: the last par four of each round on a home course (one a
  round). Toast "Signature Hole · Stepping Stones"; dev menu "stepping
  stones" (`STONES_FORCE`). The three `*_FORCE` values exclude each other.
- A `river: 1` water band across the hole (d 0.44 LEN, rd 2.9, rx 40),
  drawn level with `P_LAKE` (frozen in winter: `P_ICEL`), on gentler ground
  (`roll` 0.5). `Scene.isle` has `hop: 1`, `stones` (evenly bank to bank)
  and `hopLen`; the crossing moves at `B_HOP` (2.6/s); `drawGolfer` lifts him
  by sin(pi x hop phase); `drawStones` draws flat rock tops with a foam line;
  `Sfx.hop` (a knock and a splash, no splash on ice) on each stone.
- Fixed on the way, for all three: `isleWait` now also waits while
  `Scene.crossing` is set; the last hundredth of a step before the far side
  used to read as neither and let the hole go. `ISLE_HOLD` is 8s.

### Canyon carry (option 2b, the second signature hole)
- `isCanyon(h)`: the last par five of each round on a home course (one a
  round, four an event). Toast "Signature Hole · Canyon Carry". Dev menu:
  "this hole a canyon" (`CANYON_FORCE`).
- The gorge is the hole's `water` with `canyon: 1`: d = 0.52 LEN, rd 4.2,
  rx 40 (wider than the view, so it cuts right across), drawn with
  `P_CANYON` (deep, walls from `T._cn`, a ramp of the course's rock into the
  dark). The hole is straight. `Scene.isle` holds its rims (`fly: 0`), so
  `spot`, the camera, the hold and the checks work as for the island: the
  crossing moves at `B_BRIDGE` (4.2/s, about 2.2s) and he walks it.
  `Scene.crossing` is how far across; `Scene.heli` is only the island's.
- Sounds (synthesised, levels measured through an OfflineAudioContext):
  `Sfx.rotor` (a low whup with a thump, every 0.11s while `Scene.heli`,
  louder at the top of the flight, about -54 dB against the strike's -48)
  and `Sfx.plank` (a wooden knock on each bridge step off `walkPh`, a creak
  one step in three, about -55 dB). Both from `Sfx.tick`. `canyon` checks
  they play, through a stand-in audio context.
- `drawBridge`: a solid deck of alternating planks with seams, sagging to the
  middle, posts at the corners, hand-ropes that thicken nearer the camera,
  all swaying a little; drawn after the tee, before the flag and golfer.

### Home course seasons (option 3, "home course variety past Card X")
- Ten home courses, one per card, so they repeat every ten cards. Now each
  pass is a season: `homeSeason(cs, tier)` = floor(tier / 10) mod 4: as
  built (I-X), Autumn (XI-XX), Winter (XXI-XXX), Blossom (XXXI-XL), round
  again. Only home courses; the season is read from the card being played.
- `seasonLook(cs, s)` is a copy of the course with its colours mixed toward
  the season's (turf, rough, sand, water, rock, sky, trees) and its id
  suffixed `~s`, so `buildTheme`/`courseTrees` cache it apart. `Scene.course`
  stays the real course (ids, honours, cabinet and checks see no change);
  `Scene.look` and `Scene.land` are the season's. Winter has 60% of the
  crowd and falling snow (`Scene.snow`, not in rain). A course already the
  season's tree colour takes its `alt` (Jade Pagoda: white blossom).
- The banner reads e.g. "Winter - Home of Tour Card XXIII".
- Sounds (`Sfx.gust`, `SEASON_VOL`, in `Sfx.tick` off `Scene.look.season`):
  autumn gusts through the leaves every 5-12s (about -55 dB, against the
  music's -45 average and a bird's -63); winter silences the birds and
  breathes a thin high air every 8-16s (-64 dB), the hush; blossom sings
  birds every 2-6s instead of 4-13s. `seasons` checks all three over five
  simulated minutes with a fixed random.
- Touches: autumn blows leaves across with the wind, blossom lets petals
  sink (`Scene.fall`, `Scene.fallCols`, drawn in `drawWeather`, none in
  rain); winter ponds are ice (`Scene.ice`, `P_ICE`, ramp `T._ic`, no
  ripples). `seasons` checks all three.
- Possible follow-ups: more home courses outright, or season touches beyond
  colour (frozen ponds, leaves blowing, blossom petals falling).

### Island greens (user asked; the flight was their idea)
- `isIsland(h)`: on a home course, the last par three of each nine (two a
  round, eight an event). The tee toasts "Signature Hole · Island Green".
  Dev menu: "Signature hole" > this hole an island (`ISLE_FORCE`).
- `newHole` on an island: no bend, level ground (`roll = 0`), one `lake`
  water centred at LEN+4 (rd 30, rx 6.4) passed to `layHazards` as `moat`.
  `Scene.isle = { bank, land }`: bank is the last dry ground on his line,
  land is LEN-6 on the green.
- **The lake is drawn level** (`P_LAKE`, depth 0, short banks). Sunk like a
  pond, far water lands lower on the screen than nearer ground, and at this
  size it painted the green out entirely. The green is drawn over the lake by
  the ground pass (it comes after hazards), and so is the hole map now (it
  used to draw the green first). Ripples skip the green.
- **Where balls lie**: `Scene.spot(progress)` is the drawn distance. On an
  island a spot inside the water snaps to the bank (first half) or the island
  (second half). Used for the shot's length in `launch` and the camera's goal.
  `shownYards` is unchanged: it can read a little long while a ball sits on
  the bank, and holds the real yardage while one sits on the island early.
- **The flight**: the camera stops at the bank, then while the goal is past
  it moves at a steady `B_FLY` (11 units/s, about 1.9s across) instead of
  easing. `Scene.heli` is how far across (0 when not flying);
  `drawGolfer` draws `paintHeli` instead: from behind, legs hanging, arms up,
  the club flat and spinning with a faint ring, a shadow on the water, and a
  lift of sin(pi x heli). The fairy flies alongside. No sound for it yet.
- **The hold** (after the user found he never got there): when the ball is
  down, `S.doneT` records the hole's time, and `step` waits while
  `Scene.isleWait()`: an island, he has not landed (plus 0.4s on the
  green), and the course was drawn in the last 250ms. Never in `QUIET` or
  `OFFLINE`, never behind a menu or the saver (nothing drawn), and never past
  `B.ISLE_HOLD` (6s). The score and the readout use `holeTime()`, so waiting
  never costs a score. On an island the old "carry a golfer far behind on
  through his swing" jump is off: it slid him off the tee to the bank
  mid-swing.
- The `hazards` check allows the lake and requires water all round the
  green; the `island` check holds the rest, including a hole finished by its
  tee shot played in real frames (the case the first version missed: its
  test froze the round, so the hole could never end early).

### Battery saver (user asked)
- Settings row **Battery Saver**: a button cycling Off / 1 / 2 / 5 min
  (`S.saver`, default 2 when unset; junk repaired in `initState`) and
  **Start**, which turns it on now (`saverNow`). Dev menu: "Battery saver"
  row, start now or in 5s.
- `touchedAt` is reset by any pointerdown, touchstart, keydown or wheel, and
  by the page coming back into view. The slow tick in `frameBody` calls
  `saverOn()` when `saverDue()`.
- While on, `frame` schedules itself by `setTimeout` every 100ms instead of
  `requestAnimationFrame`, and `frameBody` plays the gap out in `TICK_MAX`
  steps (up to 1s), skips `Scene.draw`, `renderLive` and `renderVitals`, and
  draws the saver instead. Measured: main thread busy about **3%** against
  about 31% on the course (390x844 at 3x). The strike sound is played by the
  scene, so the saver is silent apart from the music.
- **Hidden page**: timers keep firing when hidden where frames stop, so the
  saver skips stepping when `document.hidden` and leaves the time to
  `catchUp`; otherwise the same time would be paid twice.
- The tally is `S` now minus a snapshot taken when it came on (purse, holes,
  events, cups, levels, Tour Card, sovereigns, paragon), so it includes a
  catch-up paid while it was up. Clubs are counted by `saverClub` in
  `bagAdd` and the away loop's `bagAddOff`.
- The picture is a 96x36 canvas at a whole-number scale (`saverSize`, again
  on resize). `paintGolfer` is the course's own golfer drawing, pulled out of
  `Scene.drawGolfer` (138 outfit and pose combinations compared pixel for
  pixel against the old code: identical), so outfit effects, club looks and
  ball trails all match. The box drifts a few pixels every 30s against
  burn-in. On its side the picture and the tally sit in two columns.
- It wakes on **click**, not pointerdown: gone on the touch, the click after
  it landed on the button underneath (only a touch screen shows this; the
  check taps with one).
- `SAVER_AUTO` is off when `navigator.webdriver` (every Playwright page), or
  a long check would drop into the saver part way; the `saver` check turns
  it on.

### The yardage follows the ball (user asked)
- The readout's yards come from `shownYards()`: what was left when the last
  ball landed (`Scene.walkTo`), never less than the real `S.yards`. The sim
  still swings `D.spd` times a second and ends and pays the hole as before;
  only the number shown changed. Tempo still matters: carry is power x tempo.
  `readouts` checks it holds while walking and drops on landing.

### Stage buttons (moved at the user's request)
- Left column, top to bottom: the readout with **auto-climb** to its right
  (`#rRow`, centred on it: bottom-aligned looked dropped on the phone), then settings, the shop, and the **Trophy Room**
  as a medal (`medal` sprite; the trophy sprite stays with the heirlooms).
  The perks star is alone on the right at 37%, and the hole map sits under it.
- The readout **fills its row up to the button** instead of sizing to its
  words: its words change every second, and a button placed after a
  word-sized box slid about. The call (`#rTag`) now ellipsizes and the unit
  keeps to one line, or the longest late-game words ran out of the narrower
  box on a 360 phone.
- A container query on `#hudLeft` drops the button under the readout when the
  column is under 200px (a stage under ~357, the 320 phones).
- The `shop` check holds all of it, including writing the longest words into
  the readout and requiring the button not to move.

### Scrapping (auto-scrap and scrap by rarity)
- The locker band's button is **Scrap** (was Scrap dupes; reads "Scrap ·
  auto" and lights when auto-scrap is on). It opens `scrapSheet`: six choices
  for auto-scrap (Off, Common … Legendary; never Mythic), then a row per
  rarity in the locker with Scrap N and what it pays, and Spares (past the
  best two per slot, the old Scrap dupes). Legendary and Mythic rows take a
  second tap ("Tap again", 4s).
- Kept by every bulk path (`scrapKeeps`): set pieces, and the single best club
  for a slot when it beats the worn one. Not every "upgrade": with nothing
  worn every club beats nothing, and the first version kept them all.
- Auto-scrap runs in `bagAdd` after the auto-equip sweep and before the
  overflow trim, on the new club only; once-a-minute toast like the full
  locker. A drop scrapped on arrival is not announced; a wager's reward line
  and the shop bag's reveal mark it "scrapped". Away, `bagAddOff` scraps as the
  drops land (O(1) each via a best-score-per-slot map) and the card gets an
  "Auto-scrapped N" line.
- The auto-equip toggle in the locker head reads **Auto-equip on/off** (it
  was "Auto on", beside a Scrap button with an auto of its own); the head's
  count lost the words "in the locker" to make room.
- Dev menu: Gear > "drop 30 mixed" (`DEV.gearMix`).

### The Trophy Room, and the declutter
- **Why.** An audit found three different "trophy" things in three places
  (the honours on the stage, the cabinet at the foot of the Tour tab, the
  legacy Trophy Room in Career), today's challenges at the top of the
  honours list where nobody looks, the free sovereigns in the shop twice
  with nothing to say they were ready, three shop tiles that sold nothing,
  and nothing anywhere pointing at retiring.
- **The room.** The medal on the stage (it was the trophy on the right until
  the user asked for it under the shop) opens `trophyRoom()`: **Today**
  (a Collect button per thing waiting and Collect all when there are two or
  more; the free sovereigns every 8 hours; today's three challenges; this
  week's major and the wager of the day, and the Membership's daily when a
  member), **Cabinet** (the cabinet, with a reward line under the trophies, the
  cups and the best cards, and the Record rows under it), **Honours** (as before, minus the challenges).
  Nothing in it is bought or upgraded. `QUIET` shows nothing. The button
  carries a red dot (`#roomDot`, class `ready`) while `roomWaiting()`, and a
  tap opens Today when it does, the honours when a new one is done, else the
  last page.
- **The case's rewards** (`B.CASE`): three tracks, majors won (1 to 52),
  cups won (1 to 500) and best card (25 to 288 under, a perfect card). Each
  step waits in `casePending()` until collected, pays once, never expires.
  `S.caseGot[track]` is the number of steps taken, clamped on load.
  `collect('free')`, `collect('<track>')`, or `collect()` for everything.
- **Moved.** Cabinet and Record left the Tour tab. The free sovereigns left
  the shop (claimed only in the room now; `claimFree` is gone). The shop's
  Buy tab merged into Offers; the three tiles that sold nothing (free gift,
  members daily, Tour Card bounty) went, with their icons. The Career >
  Legacy band "Trophy Room" is **Heirlooms** in every word on screen, along
  with the honours "Find 15 heirlooms" and "The Whole Collection".
- **Retiring.** The Career tab's dot, and a dot on its Legacy sub-tab, show
  when `retireWorth()`: retiring is open and would find at least one more
  heirloom.
- Checks: `cabinet` (the rewards, the dot, the free button taking only the
  free sovereigns, Today opening on a dot, the retire dot), `challenges`
  (today's three by name on Today), and the room's three pages are swept by
  `layout`, `legibility` and `titles`.

### Trophy cabinet and season calendar
- Bands on the Tour tab: Tour Card, The Card, **Season N** (`renderSeason`),
  Major of the Week. The **cabinet** (`renderCabinet`) and the Record
  (`renderRecord`) are in the Trophy Room's Cabinet page. They render
  through `setHTML`, so a hole that changes nothing touches nothing.
- Records: `S.evLog` (last 24 events: `{t, id, s, b, w, c}`, `s` null when
  resolved away) and `S.bestCards` (best five, `{t, id, s, c}`), written in
  `endTournament`, repaired in `initState`; retiring clears `evLog` (the
  calendar restarts at event 1) and keeps `bestCards`.
- `upcomingCourse(e, t)` predicts future events with `openEvent`'s rules; the
  `cabinet` check plays each case through to the next event and compares.
- The weekly courses carry `trophy` (12x12 sprite id) and `trophyCol`; the
  cabinet also uses `cabJacket`, `cabCup`, `cabSlam`.

### Second review and polish (fixed)
- Fade row without a context when the picture is exactly 300 wide (frozen
  field). `deriveStill` now also clears timed lifts, sponsor perks and
  `S.stretched`, and `roundRatio` judges par fives with `PAR_JUDGE` (the
  `climb` check). Music fades on `visibilitychange`; a loop not yet started
  is stopped, not faded from 1.0. The course scene resets after every wager
  kind. Round the Corner is counted in `oneSwing` (`roundsCorner`). The canvas
  is sized from `getBoundingClientRect`, rounded up. Ready Golf only acts
  while the hole is in play. Matching Pair needs a look other than
  `classic`. `noteHome` credits a home course on a save that arrives
  mid-event. Words on the field are baked whole (`textCv`, `TCACHE`); trees
  wholly behind a crest are skipped. `achAmt` shows share honours as %.
- Soak: 90 minutes of accelerated play with drawing: heap 6-7 MB flat, ~1,350
  DOM nodes, save ~19 KB, no errors. Frame at 4x CPU slowdown ~15 ms.


### Recorded sounds
- Three CC0 recordings from OpenGameArt, cut and mixed with a static ffmpeg
  (from the `imageio-ffmpeg` pip wheel; there is no system ffmpeg), saved as
  32 kHz mono MP3 and embedded as base64 in `<script type="text/plain"
  id="rec-…">` blocks just above the main script. An HTML comment there says
  where each came from. The applause has since been removed at the user's
  request; its notes stay below in case they ask for a crowd again.
  - strike: "Thwack Sounds" thwack-01 over "Swishes Sound Pack" swish-9
  - cup: "100 CC0 SFX" other_01 (a small ball bouncing to rest) pitched to
    0.72, with a low-passed thwack-02 for the knock
  - applause: "Applause in a large hall or church", its first 2.6s crossfaded
    into its last 4.8s (the natural swell and dying away)
- Other CC0 candidates already found, if the user wants a change: Kenney
  "Impact Sounds" (impactMetal_light, impactGeneric_light), Kenney "Casino
  Audio" (die-throw-2 is a good rattle), "100 CC0 SFX" (hit_01, metal_02),
  OpenGameArt "OoOoOoOoOoOoOo" (a crowd "ooh"), "Park ambiences" (birds).
  Freesound, Pixabay, Wikimedia and archive.org are still blocked by the
  network policy; only OpenGameArt and Kenney are reachable.
- `Sfx.load` decodes them once the audio context exists; `Sfx.rec(k, t, vol,
  rate, len)` plays one and returns false if it is not ready, so every call
  falls back to the synthesised sound. Each play varies speed by ±5%.
- Levels were matched by rendering both through an OfflineAudioContext
  (loudest 300ms window): strike about -39 dB, cup -40, applause -48 (par)
  to -35 (albatross), against the old synth's chimes at about -45.

### Battery pass
- Measured on 390x844 at 3x, eight courses. At full speed the main thread
  was busy 74% of the time and is now 29%; with the CPU slowed 4x it went
  from 14 to 42 frames a second. What changed:
  - `PixPaint`: the ground march (~2,600 fillRects) writes into a Uint32
    buffer and is stamped once. `drawGround` reuses it while nothing in
    `_gKey` has changed (camera, size, theme and its colour ramps, `gGen`,
    which `newHole`, `newDepthsHole`, `layHazards` and `resize` bump). Pond
    ripples are recorded during the march and drawn live by `ripples`.
  - The page canvas is the picture's own size and the browser scales it by
    whole pixels (`#stage > #hole` is absolutely placed; its last part-pixel
    hangs over the stage edge and is clipped; `layout` allows exactly that).
    The resize observer watches `#stage`, not the canvas.
  - `drawFarFade` lifts one row into a 1-row canvas instead of drawing the
    canvas onto itself.
  - Live DOM numbers use `setText`/`setHTML`/`setSty`; the honours button
    label is worked out four times a second (`renderStageBtns(true)` from the
    frame); `renderLive(D)` reuses the frame's `derive()`.
- The `battery` check holds all of this (pixel identity of the two ground
  paths, fresh and reused, a canvas-call cap, the canvas size, no DOM writes
  when nothing changed).

### Fairy caddie
- Three perks: Course Notes (`cXp`, +30% xp 8s), Club Selection (`cCpw`,
  +20% pure strike power 8s), Ready Golf (`now:1`, 1s off `S.elapsed`,
  never below zero). New 12x12 icons `cpnotes`, `cpclub`, `cpready`.
- Reactions: `Scene.holed` calls `fairyReact('cheer'|'sigh', word)` for a
  birdie or better / bogey or worse. `fairyDy` makes him hop or droop
  (vertical only, so he never reaches the golfer). `tickQuip` (course only,
  every 50-110s, not mid-swing) picks a line, 60% of the time a contextual one
  when there is context (wind 12 mph+, rain, night, home course, weekly
  major). Lines live in `B.FAIRY_SAY`; the `caddie` check holds them to 16
  characters in the pixel font.

### Auto-climb (a real stall, now fixed)
- `roundRatio` judged the next card with this round's weather and course
  affinity in the golfer's strength. A frost ball on a frost course read
  four times his strength, he was climbed on it, and then took ~4x par for
  the rest of a session. Now `deriveStill()` judges him in still air with no
  course affinity, against `B.CLIMB_FIT = 0.90` (it used to borrow
  `RETIRE_FIT`). Swept over 32 careers: albatross or better 19-23%, and no
  twenty minutes below 56% par or better (was 0%). The sweep script is easy
  to rewrite: run the `scoring` player for 8 seeds at several seed offsets
  and several `CLIMB_FIT` values.

### Honours
- Six new ones at the end of `B.ACH`: `dogleg` (tally bumped in
  `Scene.launch`, not in `QUIET`), `windy` (tally `windBird`, bumped in
  `finishHole` when `Scene.windMph() >= 15`; only Crosswind rounds get
  there), `twin`, `homes` (`S.homes`, noted in `openEvent`), `major1`,
  `staff` (its `v` is written as 9, and the `honours` check fails if the
  number of caddie perks changes without it).

### Earlier: home courses and the Major of the Week
- See commit `eaa4caa`. `openEvent()` picks the course at the first hole of
  an event: the weekly major if unclaimed, else a home course on a season
  opener or a new card, else the calendar course. `S.weekly = {wk, t, id,
  done, won}`; majors are settled in `endTournament`. `majors` covers it.

## 6. Recent history (newest first, one line each)

- The Range's rows no longer say "unlocks when you have" (user asked).
- A hole never ends before he is up on the green (while watched; the wait
  is paid for, so watching earns what being away does).
- The fifth signature hole: the Railway Crossing, with its train.
- Ducks on the island lake, a hawk over the canyon, fish by the stones.
- A happy dance on a great hole.
- Seasons Seen on the Record; the Record's titles in Title Case.
- A short chime when a course comes up in a new season.
- Life on the pier: spray over the deck in the wind, wheeling gulls, one
  on a post that flies off as he comes, and a quiet gull cry.
- The caddie cartwheels and juggles too.
- Caddie perk upgrades: the worn perk to Lv 5, a second longer and 12.5%
  stronger a level; Head Caddie honour.
- The caddie's wings gone; he floats, and now and then spins, dances,
  flips, waves or loops.
- Signature hole of the week (double purse, brass map frame and sparkle,
  x2 in the corner, a Today row); ember burns add up instead of replacing
  each other; the first hole of a round paid at its own weather; the
  `settings` check's music race.
- Caddie blessing and countdown; volume sliders; six regular stops turn
  with the real month; Sea Stack, the fourth signature hole; Trophy Room
  record rows per signature kind; canyon bridge no longer shows through a
  hill.

- Home course seasons: every ten cards a home course comes back in autumn,
  winter (with snow) or blossom. The map is back a button's place below the
  star, and the medal is outlined so it shows at night.
- Island greens: the last par three of each nine on a home course, a level
  lake round the green, balls never land wet, and he flies across on his
  spinning club.
- Battery saver: black screen with a tally and a little golfer after a
  while untouched, a setting for the wait and a Start button; the golfer's
  drawing shared between the course and the saver (`paintGolfer`).
- `8433c8c`: the yardage holds while he walks and drops as each ball lands;
  auto-climb centred on the readout.
- `4609031`: the Trophy Room as a medal under the shop, auto-climb beside the
  readout, and scrapping: auto-scrap by rarity and a scrap-by-rarity sheet.
- `07ec78c`: the Trophy Room on the stage trophy (Today, Cabinet, Honours),
  rewards in the trophy case, free sovereigns and the challenges moved into
  it, shop Buy merged into Offers, legacy trophies renamed Heirlooms, and a
  dot for when retiring is worth it.
- `eba1392`: words on the field baked whole, hidden trees skipped, share
  honours as %, the cabinet's cup and slam unlit until won.
- `6337ec1`: fixes from the second review (frozen field at 300 wide, climb on
  a lucky moment, music in a hidden tab, wager scene, sliver, and polish).
- `3990143`: developer menu rows for everything added lately.
- `8a89f2c`: trophy cabinet and season calendar on the Tour tab.
- `42d122b` .. `65435b7`: strike and cup quieter, background music, no
  applause, sound on the iPhone at last.

- `b0e7b8f`: six honours for doglegs, wind, the matching pair, home
  courses, majors and caddie perks.
- `298b5ee`: three caddie perks, the fairy's reactions and quips; auto-climb
  judged in still air (`CLIMB_FIT`), `pacing` on sixteen seeds.
- `8de0110`: battery pass (pixel-painted, reused ground; picture-sized canvas;
  change-only DOM writes). New `battery` check.
- `42e86b4`: real recorded strike, cup and applause.

- `eaa4caa`: home courses with landmarks and the Major of the Week. Also:
  Blossom's far treeline now fades into the grass, and the hazards check
  finally tests every course.
- `48f7672`: he doesn't hit again until he reaches his ball (queued swing via
  `walking2ball`), and a new hole drops a swing still in progress. The
  resting ball is drawn 1.7× bigger.
- `78de17e`: the ball lying on the grass matches the equipped ball skin.
- `700f374`: shots land where the yardage says and he walks to them
  (`walkTo`). Lost Ball Scout lasts until the hole ends.
- `13be109` / `f0ccb00`: the caddie became a small fairy by his head (the
  walking caddie was distracting). Six caddie perks at 150 sovereigns each,
  one worn at a time, one lift every 30s; they sit on the Range's Caddie
  rack. Fixed him gliding mid-swing.
- `27fa8f0`: he walks away from the camera between shots with the club at
  his side. Club skins. The Style shop is split into racks: Golfer, Caddie,
  Clubs, Balls.
- `a3339ca`: a course announcement banner replaced the flyover (the user
  asked for the flyover to go).
- `ce13e69`: a caddie look for every golfer outfit, at 1/3 of the price.
- `729b965`: synthesised golf sounds; they follow the iPhone silent switch.
- `ee92aa9`, `a9d6e47`, `08a4e37`: wind bow, hole map, doglegs with designed
  corners. The ball always lands on the fairway.
- Earlier: trails and balls made easier to see, fixes after rotating the
  phone, Title Case everywhere, cheaper Bench, rival, skins, the scoring
  rebalance, pacing.

## 7. Environment notes

- Reachable: opengameart.org and kenney.nl. Blocked (403 from the proxy):
  freesound.org, pixabay.com, commons.wikimedia.org, upload.wikimedia.org,
  archive.org, bigsoundbank.com, zapsplat.com, mixkit.co, sonniss.com. Only
  use CC0 sounds, and record where each came from beside the data.
- No system ffmpeg. `pip3 download imageio-ffmpeg --no-deps`, unzip the
  wheel, and its `imageio_ffmpeg/binaries/ffmpeg-*` is a static ffmpeg with
  libmp3lame. Keep it in the scratchpad, never in the repo.
- There is no `gh` CLI. Use the GitHub MCP tools if GitHub is ever needed.
  Pushing straight to `main` has worked every time.

## 8. What to offer next

Everything asked for is done. First ask how the latest look on the phone:
the railway crossing (home courses' hole 9; the Moorland, Old Links and
Ironbark), the ducks, hawk and fish, the caddie's happy dance on an eagle,
Seasons Seen on the Record, and holes now finishing with him up on the
green. Still unseen before that: the caddie's turns, perk upgrades, the pier
on a windy day and the season chime.

The menu to offer next:
1. **He putts out** (recommended): now that every hole waits for him on
   the green, he taps the ball in when he gets there, a short putt and the
   ball dropping, paid for like the walk.
2. **Life on the railway**: other trains now and then (a goods train, an
   express, a night train with glowing windows), and the golfer and his
   caddie wave as it goes by.
3. **Weather on the signature holes**: rain rings on the island's lake,
   snow settling on the train and the bridge, spray thicker in a storm.
4. **A Signature Week honour**: all five kinds played in one real week.
