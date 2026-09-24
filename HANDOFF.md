# Handoff — Mythic Mulligan

Last updated 2026-09-24, at commit `b0e7b8f` on `main`. Read this with
`CLAUDE.md`, which holds the standing rules. `test/README.md` says what each
check is for.

---

## 1. Where things stand

- Everything is committed and pushed to `main` (and mirrored on the session
  branch `claude/golf-sounds-dn0l4w`). Nothing is half-built.
- `node test/run.js` passes all **30 checks** (about 6 minutes; `pacing` now
  runs sixteen seeds and takes ~40s on its own).
- The user asked for **items 3, 4, 5 and 6** of the menu. All four are done:
  recorded sounds, the battery pass, more for the fairy caddie, and six new
  honours. Details are in §5. Along the way a real auto-climb stall was found
  and fixed (§5, "Auto-climb").
- The user usually ends a task by asking **"What's next?"** Reply with a short
  plain-language menu, give a recommendation, and wait for them to choose.
  Open ideas are listed in §8.
- **Strike and cup turned right down** at the user's request (strike 0.09,
  pure 0.12, cup 0.15, about a third of before). Keep them subtle.
- **Background music**: "Town Theme RPG" by cynicmusic (CC0, OpenGameArt),
  mono 40 kbps, embedded as `rec-music` (~650 KB of the file). `Sfx.musicTick`
  loops it by overlapping plays by `MUS_XF`; volume `MUS_VOL` 0.14. Its own
  Music switch in Settings (`S.music`). Chosen unheard; ask the user if it
  fits. Other CC0 candidates: Meadow Thoughts, The Field Of Dreams, Summer
  Park 8bit, Apple Cider, Sunset Plains.
- **Applause removed** at the user's request (it never stopped when holes
  end every few seconds). Only the strike and cup recordings remain; an event
  win keeps its fanfare. Don't bring a crowd back without asking.
- **Sound had never worked on the user's iPhone** (Home Screen app). Audio was
  only unlocked on pointerdown, which iOS does not count, and an
  'interrupted' context was never resumed. Fixed in the commit after
  `52f0f86`: unlock on touchend/click too, resume any non-running state, and
  play a silent sample in the tap. Unverified on a real iPhone; ask whether
  they hear it now. If not, next suspects: `navigator.audioSession.type =
  'ambient'` in a Home Screen app, and MP3 decoding.
- **Ask the user how the sounds sound.** The sessions cannot listen to audio:
  the recordings were chosen by measuring and by looking at spectrograms,
  and the levels were matched by rendering. If any sounds wrong on the
  iPhone, §5 lists the other candidates.

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
  Claude-Session: https://claude.ai/code/session_01MKaizokfiN7G1KiqhJymcv
  ```
  Never put a model name in a commit, a code comment or any file.

## 3. The project

- **The whole game is `index.html`** (about 13.6k lines, 770 KB with the sounds): markup, CSS and one
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
| Tour tab | `renderTour`, `renderMajor` |
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

## 5. What the last features do (for debugging them)

### Recorded sounds
- Three CC0 recordings from OpenGameArt, cut and mixed with a static ffmpeg
  (from the `imageio-ffmpeg` pip wheel; there is no system ffmpeg), saved as
  32 kHz mono MP3 and embedded as base64 in `<script type="text/plain"
  id="rec-…">` blocks just above the main script. An HTML comment there says
  where each came from. Total about 76 KB.
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
    label is worked out four times a second (`renderHonBtn(true)` from the
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

Items 1-6 of the last menu are all done. When the user asks "What's next?",
offer a fresh short menu. Candidates, in rough order of value:

1. **Tune the sounds by ear.** Ask how the strike, the cup and the applause
   sound on the phone; swap in another candidate from §5 if one is off.
   Recorded birdsong is available. (No crowd sounds: the user removed them.)
2. **A trophy cabinet** for the majors won and the jackets, and a season
   calendar showing which course is coming up.
3. **Signature holes on home courses**, such as an island-green par 3 (see
   the caution below).
4. **Home course variety past Card X** (they repeat every ten cards).
5. **A battery saver setting** that halves the frame rate when the phone is
   left idle (the game still runs 60 frames a second; this would roughly
   halve what is left).

### Further ideas, not yet offered to the user

- **Signature holes on home courses**, such as an island-green par 3. Be
  careful: shots are drawn landing where the yardage says, so an island hole
  needs landing positions that are never in the water. The Depths "island"
  mode has a moat you can study.
- **A trophy cabinet view** for the majors won and the jackets, and a season
  calendar showing which course is coming up.
- **Home course variety past Card X** (they repeat every ten cards). Could
  add more home courses, or vary the palette of later repeats.
