# Handoff — Mythic Mulligan

Last updated 2026-09-24 on `main`. Read this with
`CLAUDE.md`, which holds the standing rules. `test/README.md` says what each
check is for.

---

## 1. Where things stand

- Everything is committed and pushed to `main` (and mirrored on the session
  branch `claude/funny-davinci-7ik9ge`). Nothing is half-built.
- `node test/run.js` passes all **33 checks** (about 7 minutes; `pacing` runs
  sixteen seeds and takes ~40s on its own).
- The latest session only picked up: it read the notes, ran every check,
  screenshotted the auto-climb button at 320, 360, 390, 430 and on its side
  (centred on the readout everywhere but 320, where it drops under it by
  design), moved five stray rules back into §4, and asked the user the two
  questions in §8. **Their answers are still to come.**
- The last request before that was "update the notes for another handoff" (this file,
  `CLAUDE.md`, `test/README.md`). Before it, in order:
  - "Why does the yardage tick down when the ball isn't being hit, and does
    tempo still do anything?" Answered (tempo does: carry is power x tempo;
    the number followed the swings underneath, not the picture), then fixed
    at their request: the yardage now follows the ball on screen (§5).
  - "Fix the alignment of the auto-climb button": it is now centred on the
    readout. They sent a screenshot; I read it as "looks dropped below the
    box". **Not yet confirmed by the user**, so ask if it looks right.
  - "Trophy Room as an icon under the shop (not a trophy), auto-climb to the
    right of the readout, and a button in the gear area to auto salvage and
    mass salvage by rarity". Done (§5, "Stage buttons" and "Scrapping"). The
    game's word is **scrap**, not salvage; the button and sheet say Scrap.
- The request before it was "go through everything for clutter and things buried
  in menus; consolidate; stage icons are fine (like a trophy room: things to
  look at and rewards, no upgrades); and add rewards to the trophy case".
  Done (§5, "The Trophy Room"): the trophy on the course opens a **Trophy
  Room** (Today, Cabinet, Honours) with a red dot when something is waiting,
  the case pays sovereigns, the free sovereigns and today's challenges moved
  there, the shop lost its Buy tab, the old legacy "Trophy Room" is now
  **Heirlooms**, and the Career tab points at retiring when it is worth it.
- Before that: the trophy cabinet and season calendar, a polish pass and the
  dev menu rows (§5).
- The user usually ends a task by asking **"What's next?"** Reply with a short
  plain-language menu, give a recommendation, and wait for them to choose.
  Open ideas are listed in §8.
- **Sound works on the user's iPhone now** (they confirmed). It had never
  worked: audio was only unlocked on pointerdown, which iOS does not count,
  and an 'interrupted' context was never resumed.
- **Strike and cup are turned right down** at the user's request (strike
  0.09, pure 0.12, cup 0.15). Keep them subtle.
- **Applause was removed** at the user's request (it never stopped when holes
  end every few seconds). Don't bring a crowd back without asking.
- **Background music**: "Town Theme RPG" by cynicmusic (CC0, OpenGameArt),
  mono 40 kbps, `rec-music` (~650 KB of the file). `Sfx.musicTick` loops it by
  overlapping plays by `MUS_XF`; volume `MUS_VOL` 0.14; its own Music switch
  (`S.music`). Chosen unheard; the user has not said whether it fits. Other
  CC0 candidates: Meadow Thoughts, The Field Of Dreams, Summer Park 8bit,
  Apple Cider, Sunset Plains.
- **The sessions cannot listen to audio.** Pick by measuring (spectrograms
  via the static ffmpeg, levels by rendering through an OfflineAudioContext)
  and ask the user.

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
- Commit trailer: use the one your own session's system prompt gives. This
  session's was, exactly (the session link changes with each session):
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01MKaizokfiN7G1KiqhJymcv
  ```
  Never put a model name in a commit, a code comment or any file.

## 3. The project

- **The whole game is `index.html`** (about 14.1k lines, 1.4 MB with the sounds and the music): markup, CSS and one
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
| Stage buttons (Trophy Room `#roomBtn`, perks, shop, settings, auto-climb): one renderer | `renderStageBtns` (was `renderHonBtn`); markup `#hudLeft` > `#rRow` (readout + `#hudClimb`), `#setBtn`, `#shopBtn`, `#roomBtn`; `#perkBtn` alone on the right |
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
| Caddie perks (nine; `now:1` means instant, e.g. Ready Golf) | `tickCaddie`, `cperkPick`, `renderCadPerks` |
| Daily challenges | `dailyStart`, `dailyTick`, `dayNow` (`DAY_FORCE` overrides it in tests) |
| Tour tab: Tour Card, The Card, Season, Major of the Week | `renderTour`, `renderSeason`, `renderMajor` |
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

## 5. What the last features do (for debugging them)

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

Everything asked for is done. The two questions put to the user (answers
still to come): does the auto-climb button now sit where they wanted, and are
the Trophy Room (medal, red dot) and the Scrap sheet easy to find. The open
menu, under the numbers it was offered with:

2. **Signature holes on home courses**, such as an island-green par 3. Be
   careful: shots are drawn landing where the yardage says, so an island hole
   needs landing positions that are never in the water. The Depths "island"
   mode has a moat you can study.
3. **Home course variety past Card X** (they repeat every ten cards). Could
   add more home courses, or vary the palette of later repeats.
4. **A battery saver setting** that runs the field at a lower frame rate
   when the phone is left idle. Recommended in the latest session: an idle
   game spends most of its life running untouched on the phone.
5. **A second music track**: a calmer one for night rounds, another for
   wagers. Ask first whether the current track fits.

Also worth offering: a short tour of what the Season list shows, if the user
seems unsure what "Next" means there.
