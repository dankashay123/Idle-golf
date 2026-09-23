# Handoff — Mythic Mulligan

Last updated 2026-09-23, at commit `eaa4caa` on `main`. Read this with
`CLAUDE.md`, which holds the standing rules. `test/README.md` says what each
check is for.

---

## 1. Where things stand

- Everything is committed and pushed to `main`. Nothing is half-built.
- `node test/run.js` passes all **28 checks** (about 4–5 minutes for the full run).
- The user's last request, "do 1 and 2 for now", is finished: a home course for every
  Tour Card, and the Major of the Week. Details are in §5.
- **Outstanding: items 3, 4, 5 and 6 from the menu the user was given**
  (real sounds, phone performance pass, more for the fairy caddie,
  achievements). See §8.
- The user usually ends a task by asking **"What's next?"** Reply with a short
  plain-language menu, give a recommendation, and wait for them to choose.
  Open ideas are listed in §8.

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
- Commit trailer, exactly:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01EUmZfotZvYS3BWjEFzg2M8
  ```
  Never put a model name in a commit, a code comment or any file.

## 3. The project

- **The whole game is `index.html`** (about 12.9k lines): markup, CSS and one
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
| Shop (sovereigns, style racks) | `renderShop`, `styleDef`, `styleOwned`, `styleBuy`, `styleTry` |
| Retirement | `retireCard`, `retire` |
| Offline catch-up (`OFFLINE` flag) | `offline()` |
| Sound (synthesised, no files) | `const Sfx` |
| Palettes built from a course | `buildTheme`, `courseTrees` |
| **Landmarks** | `drawLandmark` (called from `Scene.buildRidge`) |
| Renderer | `const Scene = {`. Key members: `newHole`, `newDepthsHole`, `proj`, `curveAt`/`bendOff` (doglegs), `layHazards`, `layProps`, `buildSky`, `buildRidge`, `buildWood`, `drawGround`, `drawGolfer`, `fairyBox`/`drawCaddie`, `swing`/`walking2ball`/`launch`, `drawBalls`, `drawLyingBall`, `drawMap` |
| Caddie perks | `tickCaddie`, `cperkPick`, `renderCadPerks` |
| Daily challenges | `dailyStart`, `dailyTick`, `dayNow` (`DAY_FORCE` overrides it in tests) |
| Tour tab | `renderTour`, `renderMajor` |
| Developer menu (tap the title) | `const DEV = {`. `DEV.course(i)` pins any course to the next event |
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
7. To take a screenshot, open `file://…/index.html` in Playwright (fine when
   no saves are needed), call `hideSheet()`, use `DEV.course(i)` to change
   course, and clip to `#stage`.

## 5. What the last feature does (for debugging it)

### Home courses

- There are ten courses in `B.COURSE` with `slot:'home'`. Each has `lm`, the
  landmark kind, and `lmc`, its three colours. The home course for card N is
  `homeFor(tier) = COURSE_HOME[tier % 10]`.
- `openEvent()` runs at the top of every `startHole()`. It acts only on the
  **first hole of an event**, writing `S.evCourse = {t, id}` so the course
  never changes mid-event. A save loaded mid-event keeps the calendar course.
- It picks, in this order:
  1. The weekly major, if it is still unclaimed this week.
  2. A home course, if the calendar slot is a regular `'event'` **and** either
     it is the season opener (`(t-1) % B.SEASON === 0`) or you have arrived on
     a new card (`S.homeSeen !== S.tier`; this one is skipped during a
     catch-up).
  3. Otherwise the calendar course.
- Calendar majors and finales are never replaced.
- `courseFor(t)` returns the pinned course if `S.evCourse.t === t`, and
  `calendarCourse(t)` otherwise.
- Landmarks are drawn once into the cached ridge canvas, so they cost nothing
  per frame. Their position is seeded per hole. At night `L.lamp` lights the
  windows and the lighthouse beam.
- There are 12 landmark kinds: windmill, lighthouse, castle, stones, arch,
  pagoda, tower, volcano, dome, spire, clock and obelisk.

### Major of the Week

- There are four courses with `slot:'weekly'`: masters, crown, sovereign and
  starfall. Each has a `prize` (an outfit id) and a `short` name.
- Weeks run Monday to Sunday: `weekNow() = floor((dayNow()+3)/7)`, and
  `weekMajor(wk)` rotates through the four.
- `S.weekly = {wk, t, id, done, won}`.
- **When it is claimed:** at a fresh event start, only if the game is not
  offline, not `QUIET` and not in a wager, and `S.eventsPlayed >= 1`.
  `slotOfEvent(t)` then returns `'major'`, so it pays a major's purse
  (×1.5) and a major's cup points.
- **How it is settled, in `endTournament`:**
  - Resolved offline: `W.t = 0`, which releases it to be claimed again.
  - Won (target beaten on the highest card): the jacket unlocks as
    `o:<prize>` and `c:<prize>`, plus `WEEK_WIN_SOV = 60` and
    `S.majorWins[id]++`.
  - Otherwise: `WEEK_PLAY_SOV = 10`.
- **Jackets:** they are the outfits with `cat:'major', major:<id>, cost:0`.
  `styleOwned` treats `cost:0 && major` as *not* free, and `styleBuy` refuses
  them. The shop shows them on a "Major Winners" shelf with "WIN IT".
- **Grand Slam:** an honour (`id:'slam'`, metric `slam` = number of distinct
  majors won).
- **Retirement:** `retire()` clears `evCourse` and `homeSeen`, and releases an
  unfinished major.
- **Save repair:** `initState` validates `evCourse`, `weekly` and
  `majorWins`.
- **Check:** `test/checks/28-majors.js` covers all of the above.

## 6. Recent history (newest first, one line each)

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

- **Sound sites: the user has now set up network access for the new
  session's environment**, so it should be able to reach the free sound
  sites. The old session's environment blocked freesound, opengameart, kenney
  and pixabay. Check first with a quick `curl -sI https://opengameart.org`
  and `curl -sI https://kenney.nl`. If they are still blocked, tell the user
  plainly which address was refused, rather than working around it. Only
  use sounds with a CC0 licence (Kenney's packs are all CC0), and record in
  the file where each came from. All sound in the game today is
  synthesised.
- There is no `gh` CLI. Use the GitHub MCP tools if GitHub is ever needed.
  Pushing straight to `main` has worked every time.

## 8. Still to do: items 3, 4, 5 and 6 from the user's menu

The user was offered a menu of six items and chose **"1 and 2 for now"**. Those
two are done (§5). **Items 3, 4, 5 and 6 are still outstanding.** The user has
already seen them, so when they ask "What's next?", offer them first under
their original numbers:

3. **Real recorded golf sounds.** Today every sound is synthesised by the
   game. Recorded ones would be a club strike, the ball dropping in the cup
   and crowd applause. **Now unblocked**: the user has set up network access
   for the new session (verify it first, see §7). Kenney and OpenGameArt
   both have CC0 packs, so no credit is needed. The
   sounds would then have to be embedded in `index.html` (for example as
   base64), because the game is a single file. Keep the iPhone silent-switch
   behaviour, and keep sound quiet during a catch-up (the `settings` check
   enforces this).
4. **Phone battery and smoothness pass.** Measure frame cost and idle CPU on
   a phone-sized page and cut waste. Players don't see it but feel it. This
   was the recommended one.
5. **More for the fairy caddie.** A few more perks (stay in the spirit of
   "nothing overpowered", 150 each, one worn at a time). Small reactions
   too: a cheer on a birdie, a sigh at a bogey, the occasional one-line quip,
   kept short on screen.
6. **Achievements for the new features.** For example: land 10 drives round
   a dogleg, hole out in a strong wind, or wear a matching golfer, caddie and
   ball set. Now there are also home courses and majors, so "play all ten
   home courses" fits too.

### Further ideas, not yet offered to the user

- **Signature holes on home courses**, such as an island-green par 3. Be
  careful: shots are drawn landing where the yardage says, so an island hole
  needs landing positions that are never in the water. The Depths "island"
  mode has a moat you can study.
- **A trophy cabinet view** for the majors won and the jackets, and a season
  calendar showing which course is coming up.
- **Home course variety past Card X** (they repeat every ten cards). Could
  add more home courses, or vary the palette of later repeats.
