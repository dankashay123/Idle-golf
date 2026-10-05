# Handoff — Mythic Mulligan

Last updated 2026-10-04, second session (pushed to `main`). `CLAUDE.md` holds the standing
rules and is loaded by itself; this file is what a new session needs on
top. Read this file whole. The rest is for looking up, never for reading
through:

- `docs/map.md`: where things are in `index.html` (search it for a name).
- `docs/features.md`: how each feature works, newest first, and every older
  request in one line. Grep its `### ` headings and read the one you need.
- `test/README.md`: what each check holds and what bug it was written
  after. It is the most exact record of what a feature must do.

## 1. Where things stand

- Everything is committed and **no request is waiting**. The last ones
  (4 October, third session; the user said "do them all" to an idle-game
  menu): the Lucky Albatross, errands (the caddie's runner), Range
  milestones (never stronger than before; the wall is now Card 220),
  loadouts, auto-wagers from Card 100, Trials (Range > Trials), weekend
  festivals, and wager medals with Bank on the Island Green. Then: a bar
  to the next milestone on every Range row, rare visitors (a gold star),
  fox cubs in spring, and the canyon in layered sandstone with a river.
  Then the Harvest Moon (an autumn night in four, a Guide entry) and the
  island's lake and the stepping-stone river with depth, reeds and lily
  pads. Last (from a photograph of a gorge): the canyon three times as
  deep in stepped cliffs and ledges with spurs; the albatross's feather
  burst made real feathers; the ponds given depth, reeds and pads (and the
  pond by the path laid level, with no tree of the woods in it); the
  course dog on, seen from behind with its tail wagging. The full run
  caught a frame over its drawing budget and reeds through a slope: fixed.
  Then: the medal's green hunt dot repeated on the Guide tab and by its
  Weekly Hunt; flying, both arms one colour; his arms a pixel thicker.
  Last: the canyon drawn by the screen's pixel (from the bridge it broke
  into blocks that jittered); a tap on the dog opens its breeds (they are
  in Cabinet > Course Wildlife); a frog on a lily pad now and then (a Guide
  entry); mist in the canyon on cold mornings; the dog waits on the bank
  while he crosses. Then ("still jitters like crazy"): the canyon steadied
  as he walks (each row of rock coloured by its own depth on a grid fixed
  to the course, never by where the ground's slices fall; a flicker check
  in `canyonlook`); **the dog put aside** ("we will come back to it
  later": `DOG_ON = false`, nothing drawn or offered); dragonflies over
  reeds and pads on summer days (they count for the Guide's
  Dragonfly, which was already there). Then ("Canyon is beautiful"):
  fireflies over the reeds, doubled in the water; ripples
  where a dragonfly dips and round the frog's pad; a bug sweep (the Harvest
  Moon carried into a wager; the canyon's first frame; mist on a home
  course in summer; summer dragonflies not ticking a course's rare
  Dragonfly). What lives by the season asks `lookSeason`: a course's own,
  the Snowline winter and the Blossom spring all year, else the month.
  Then: fireflies glow up and fade like real ones (`ffGlow`), on one night
  hole in two in any season (`fireflyAt`: the rough, the reeds and the
  stones' river alike). Then: the Harvest Moon's path on the water orange;
  fish leaping in the lakes and ponds (a splash, a ring where they land;
  the Guide's Fish). Then: thunderstorms (one rainy hole in three: a dark
  sky, heavier rain, lightning behind the hills with a flash, thunder after)
  and airplanes crossing high now and then (a contrail by day, lights at
  night); both on the Guide's Course shelf. Then: hot-air balloons low
  over the far hills on calm mornings, ducklings behind a hen on the
  island's lake in spring, steam off the water on cold mornings; a speed
  pass (rain as three sliding sheets: 12 canvas calls a frame, was 300;
  dragonflies, the plane and steam baked; heaviest frames 1,400 to 1,850
  calls, 3 to 5ms on the computer). Then (6 October): puddles taken off
  the fairway; the developer menu's **Scenery Switches** (an on/off
  button for each of twenty things on the course, kept over holes and a
  reload until switched off: how the user tests what he hasn't seen);
  frost on the reeds and lily pads; the rainbow reflected on the water;
  mist pooled in the hollows on autumn and frosty mornings. He asked to
  hold off on new animals for a while. Then: the sea stack's ring of rocks
  taken out; a bug pass (stripes in the dips' mist, ducklings, thunder,
  the switches); pins either side of the green (they all stood right);
  wind you can see (reeds, tufts, the flag); leaves on the water in
  autumn; "Storm Affinity -" on the readout; the thunder quieter.
  Fixed on the way: a Vault floor played again after a gust was never
  called; the Spotted tag sat over a wager's name. Earlier the same day:
  cherry trees, the kingfisher, course collections, the monthly hunt, and
  the phone's picture memory (the black sky).
- `node test/run.js` has **161 checks**, about 35 minutes: run it in the
  background, on a copy in the scratchpad, with the machine quiet. After
  weather, colours or anything dated, also run it with `HOUR_FORCE` 8 and
  15 and the month pinned (rules 20 and 70).
- `skins` timed its trails against a fixed budget and failed now and then;
  it now times them against the plain ball. If it fails again, chase it.
- **Not yet heard back on** (ask one when it fits, never as a list): the
  albatross (redrawn side on, its wings beating); errands; Trials;
  festivals; wager medals; the
  cherry trees; the kingfisher; the monthly hunt; course collections; the
  GET buttons; the redrawn celebrations; alligators; the Wager Book
  animals; the weekly hunt and its streak; the gold mountain; golden
  animals; the heirloom prices and the wall at Card 220.
- Settled, in case it comes up: swing speed still matters fully (a hole's
  time is when the ball drops); Fast Walker only shortens a hole's least
  time; every caddie has a trick (don't offer caddie tricks); Dawn and
  Dusk is built (a setting, off by default); Golden Hour is the gold
  mountain hole, one in 100.
- The user ends most tasks with **"What's next?"**: at least five plain
  questions or suggestions with a recommendation (§6), then wait.

### Things the user asked for that must stay (beyond `CLAUDE.md`)

- **Honours stay in the medal** (left column: settings, shop, medal,
  star). The Trophy Room's tabs: Today, Cabinet, Honours, Guide. The
  Check-In's calendar sits right of the cog; the right side is the pull
  tab, then the map. The wind and weather words sit small inside the
  readout, in the interface's sans serif.
- **The Bag tab** opens on the clubs: slot bar held at the top, tiles two
  to a row, sets on their own sub tab.
- **Sounds**: the strike, putt and cup are the user's own recordings,
  subtle, with a Shot Sounds slider; the cup never runs into the next
  hole. Ambience by the course, quiet and now and then; animal calls have
  their own switch. Sessions cannot listen: pick sounds by measuring and
  ask. Music: "Town Theme RPG" (day) and "Meadow Thoughts" (night,
  wagers), CC0 from OpenGameArt.
- **The gallery's jump** on an eagle or better is silent, 1.5s, gone at
  the next hole. **No score or celebration is ever up when a new hole
  starts.**
- **The plain caddie has no wings**; he floats and now and then takes a
  turn. A caddie in a set's look follows it.
- **The six sets keep one order** everywhere: Psychedelic, The Dread,
  Ascended, The Void, Divine, Demonic (`SET_ORDER`); a set's one tap wears
  all five pieces, the ball included. Anything worn reads UNEQUIP.
- **The female golfer** (Settings) has her own figure, lines and poses;
  every Legendary and Mythic skin goes down her legs, no bare skin. Her
  ace: a hand behind her head, the club spun flat over it in the other.
- **The course**: other holes both sides with golfers on them, woods,
  lakes, a cart path, nothing bare, no two greens side by side, nine pin
  spots. The island crossing (flying on the spinning club) was their idea.
- **The shop's "Nothing here is charged" notice** stays on every tab in
  one line. **The far ranges turn only "very slightly".**
- **Sovereigns earned wait to be taken** at their place (Today, Honours,
  the Guide) with GET, and GET ALL where there is more than one. A
  purchase pays at once. Anything new that pays sovereigns uses `earnSov`.

## 2. Working with this user

- Not a coder; plays on an iPhone and sends screenshots. Every summary is
  plain: what changed on screen and why it is better.
- Full permission to act: commit and push to `main` without asking; fix
  what is broken when found and say so in a line.
- When a request leaves a real choice (how hard to cut, which look), show
  a short plain proposal; when they asked for action, take the likely
  reading and say which. Do what the latest message says (they change
  their mind now and then).
- Looks: they like the dearest skins elaborate but compact, and send
  pictures to follow. Send close-ups (and a short clip for motion).
- Commits: the co-author line reads `Co-Authored-By: Claude
  <noreply@anthropic.com>` and the session link line stays as given. No
  model name in any commit, comment or file.

## 3. The project

- **The whole game is `index.html`** (about 29k lines, 3.2 MB): markup, CSS
  and one classic script, no build step. Play it over http (`node
  test/serve.js`, port 8080); from disk it never saves.
- Checks are Playwright scripts in `test/checks/NN-name.js`, run by
  `test/run.js`, a fresh page each; any console error fails the check.
  The harness sets `window.__sovAuto` before the page loads, so
  sovereigns are paid at once there (only `getsov` turns it off).
- Globals: `S` the save, `B` the constants, `QUIET` (fast-forwards: no
  toasts, no sheets), `OFFLINE` (a catch-up), `DAY_FORCE`, `PREVIEW`,
  `DEV_OFF` (play as a player), many `*_FORCE` pins. `VW`/`VH` the drawing
  buffer: 318x284 on a 320 phone, 388x422 at 390, 438x478 at 440, 460x261
  on its side; the golfer is 49 to 71px tall there.

## 4. Rules that have cost real time

Numbered so `CLAUDE.md` and the checks can point at them.

1. A check that fails once is not a flake: chase it (it once exposed a
   real line across the screen).
2. Measure across a sweep; report a geometric mean with its spread.
3. `chaosFor`/`courseElFor` hash on the tier: pin the weather both sides.
4. Negative-test every new check: patch a backup, see it fail, restore.
5. A check that changes `S` snapshots and restores it (`SNAP`, and reset
   `QUIET`, `OFFLINE`, `DAY_FORCE` in `finally`).
6. Helpers each session rewrites (the scratchpad is not kept): a server;
   a pose sheet (`paintGolfer` onto a small canvas at real sizes, scaled
   up with smoothing off: `HER_POSE = {kind, t}` for a celebration); a
   zoom sheet (PIL works: `python3 -c "from PIL import Image"`); the
   negative-test runner (exact replacements, each must match once,
   restore in `finally`); a clip (`recordVideo`, then ffmpeg to a GIF).
7. Eight seeds can be lucky: try a balance check with the seed offset
   changed. Cosmetic `Math.random` in the simulation shifts seeded runs.
8. Patching with a split separator: use one that cannot be in code.
9. Playwright: `npm install --no-save playwright@1.56.1`; never `playwright
   install`; never commit a lockfile.
10. Screenshots: `hideSheet()`, `DEV.course(i)` for a course, clip to
    `#stage`, phone sizes with `deviceScaleFactor` 2 or 3.
11. A box sized to its words moves its neighbour: anchor the neighbour.
12. Test clubs need their affixes cleared (`it.aff = []`).
13. A long away session hides locker bugs: measure half an hour.
14. Never `pkill -f "node test/run.js"` from a command containing that.
15. Check the stage at 320, 360, 390, 430 and on its side (740x360,
    844x390).
16. A check that freezes the round cannot see how a hole ends.
17. Frame-time checks take the quickest of several blocks.
18. Read a live number and its expectation in one `page.evaluate`.
19. Anything drawn over the field keeps to the ground's clip line
    (`fillClip`, `pxLineClip`, `Scene.clipAt(d)`); long lines in short
    lengths. `sigview` diffs it.
20. Seasons follow the real month: run with `featDay` pinned to 20833,
    20923, 21014, 20741 in a copy. Don't pin `monthNow`.
21. Don't write a check file during a full run.
22. Some checks count rows (`smoke` counts the Record's).
23. The signature hole of the week moves money: after touching pay, run
    with `sigWeek` patched to each kind in a copy.
24. A hole is priced as played: weather first, then `derive()`.
25. A hole waits for him while the course is drawn (`holeWait` counts
    steps): play frames, or set `QUIET`.
26. A constant `Math.random` silences noise bursts: feed a seeded stream.
27. Skins: bake big shapes (`fxBake`, `crispen`); thin edged shapes read
    as wires at his size. Measure a part by drawing with and without it.
28. Time a look against the plain golfer, not the clock; keep the caddie
    still while timing.
29. What a skin lays on the ground goes in `ground` (under the pin).
30. A wash of light turns grey over grass: solid pixels; `fxDot` leaves
    `globalAlpha` set.
31. Cutting between two markers: assert the second comes after the first.
32. Clip both ways: nothing through a hill, nothing on a bridge or pier cut
    away while he stands on it.
33. The frame last drawn owns the clip line: draw the hole first; give
    every comparison a floor.
34. A whole-frame diff measures more than the thing: count by its own
    colours, alone; clear `Scene.clubArc`; stub one function.
35. The local server dies between commands (see 48).
36. Look at a new skin or pose at 8x, at real sizes (30, 48, 60), every
    pose, before showing it.
37. A random setup in a check is seeded.
38. Home courses' 18ths are signature holes.
39. `pxLine` stops after 400 steps: span the stage in rows.
40. The harness's stage is small (199 to 329px): bring the camera closer.
41. Rounding each part of something small up to a pixel makes it big.
42. A name that matches another check runs both.
43. Never judge "is anyone watching" by wall time: count steps.
44. A full run on a busy machine finds timing bugs: drive a large `dt`.
45. A check is only as steady as its clock and date: pin `Scene.t` and
    `Date`, then sweep them to find the case.
46. Measure what is inside a box, not whether two boxes meet.
47. A throwing check hides console errors: trace into `window.__`.
48. Start the server with `run_in_background` (`node test/serve.js`) and
    `curl localhost:8080` before a screenshot; distrust old pictures.
49. Things flat on the green in front of the cup are nearer than the pin.
50. A size in a check records a choice; keep the footprint limits.
51. A setup can look like an ace: set `S.elapsed` to a share of par.
52. Holding him for an ace is predictive (`aceHold`).
53. `hitsHazard` is a box with its pad on both axes.
54. `showSheet` does nothing while `QUIET`.
55. Measure bare ground by coverage (`course`).
56. What is painted into the ground is under every prop (`_forOcc`).
57. Look at a skin at the check's size too (about 30px).
58. Changing the stance moves everything anchored to it.
59. Credit a pixel to the thing drawn on top.
60. Far things: true scale, anchored to a grid (`steady`).
61. Anything over the far field goes through `overTrees`.
62. `battery` counts canvas calls (under 1000 a frame).
63. A fix reaching into neighbouring rows can paint over them.
64. Something lying ahead of him is drawn before him; something struck
    beside him after (`drawRestBall`, `puttLate`).
65. Stopping the suite mid-run gives "browser closed" cascades: rerun.
66. Try every reward at its top and with the clock moved both ways
    (`heirlooms`, `exploits`), and simulate a free player.
67. A comparison with an unread number (`NaN`) is false both ways.
68. A rare thing is rolled after the hole is laid and only flags.
69. Pick a kind from its own hash, not its group's.
70. Anything dated follows the real date: pin it and sweep the months.
71. The harness is a developer copy: set `DEV_OFF = true` to see what a
    player sees.
72. A long number reaches the screen: everything through `fmt`.
73. Celebrations live on the finish picture's grid (`herPoseAt`, `at`);
    what passes behind him is drawn before the body (`farBack`,
    `clubBack`). `poses` measures every held frame against his pixels;
    a pose sheet at 58px, scale 6, shows what it cannot.
74. Sovereigns: anything earned goes through `earnSov` with a place;
    `grantSov` is purchases only. The game earns things as the page loads
    (a first sighting), so never assume `S.owed` starts empty.
75. A wager's scene: `R.floor` is undefined outside floor modes and a bare
    scene's `camD` can be NaN; guard both.
76. Frost (by the player's clock, 5 to 11) puts off a Golden Hour, whose
    hole is laid out its own way: a check comparing layouts pins
    `FROST_FORCE` (`seasons` failed on a golden hole every morning).
77. The phone has a fixed memory for pictures (canvases), freed late: a
    cache of canvases without a bound turns the sky black and the Guide's
    pictures to "?" after hours of play. Bound every new cache, free what
    it drops (`cvFree`), and measure live canvas memory across thirty
    courses (a probe hooking `createElement('canvas')` with `WeakRef`s and
    `gc()` under `--js-flags=--expose-gc`); it should level off.

## 5. Environment

- Reachable for sounds: opengameart.org, kenney.nl (most other sound sites
  are blocked). CC0 only; note the source beside the data.
- No system ffmpeg: `pip3 download imageio-ffmpeg --no-deps`, unzip, use
  its static binary from the scratchpad.
- A session may start on its own branch with a stale local `main`: push
  with `git push origin HEAD:main` and to the session branch.

## 6. What to offer next

Turned down, don't offer: a station on the railway, a photo mode, a
weather forecast, fireworks, trail flourishes, caddie tricks. Nothing for
the Tour tab, no new sound but ambience.

Five at least (CLAUDE.md); don't raise the dog until he does; no new
animals for now (he asked to hold off).

1. **Try the Scenery Switches on the phone** and say what to tune.
2. **Trees swaying in a gale**, as the reeds and grass now do.
3. **Dew glinting on the fairway** on summer mornings.
4. **Ice on the ponds cracking and thawing** across a spring morning.
5. **Cloud shadows** drifting across the fairway on sunny days.
6. **A bug pass** once a few more go in.

Recommend 1.
