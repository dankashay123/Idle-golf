# Handoff — Mythic Mulligan

Last updated 2026-10-09 (pushed to `main`). `CLAUDE.md` holds the standing
rules and is loaded by itself; this file is what a new session needs on
top. Read this file whole. The rest is for looking up, never for reading
through:

- `docs/map.md`: where things are in `index.html` (search it for a name).
- `docs/features.md`: how each feature works, newest first, and every older
  request in one line. Grep its `### ` headings and read the one you need.
- `test/README.md`: what each check holds and what bug it was written
  after. It is the most exact record of what a feature must do.

## 1. Where things stand

- Everything is committed and **no request is waiting**.
- Last done (8 to 9 October; detail in `docs/features.md`'s newest
  section): a **polish round, no new features** (he asked: nail down
  what is there). The Tour Pass page made to look worth paying for; bags
  with their own Mythic counts; pace settled by simulation (free about
  ten and a half weeks to a Mythic set, paying clearly quicker); gear
  earned slower; frames quicker and long play bounded; an event's result
  waits for an open sheet; an ace's ball never vanishes; the far-off
  clubhouse at night stands in the treeline (it floated); **every word
  plain, short and never shortened** (seconds, minutes, Level); padlocks
  on gear rolls; the figures themselves on the Bench and Attributes.
  Before that (8 October): the hole's bar, the button column, the fonts,
  the loading screen, sound on open.
- **The iPhone app: everything is in `docs/ios-app.md`** (read it whole
  when the app comes up). **Don't suggest it for now** (he asked, 8
  October): polish what is there first. In short: `index.html` wrapped unchanged with
  **Capacitor**; built from his **Mac's Claude Code** (Xcode needs a
  Mac), in his clone; the free Apple account first, $99 only for
  TestFlight and the store; ask him before choosing the bundle ID; sound
  on open and the silent switch kept. Nothing of the shell is built yet.
  Game work can carry on in cloud sessions: the Mac pulls `main` and
  rebuilds. The game is ready for it: the developer menu is off in the
  app (`inApp()`), no Add to Home Screen asks there, the fonts inside the
  file. Write how to build and run it in `docs/ios-app.md` once it exists.
- The scenery of 4 to 6 October (canyon, ponds, dragonflies, fireflies,
  fish, storms, planes, balloons, ducklings, steam, mist, frost, the
  rainbow's reflection, wind, leaves on the water, pins either side,
  trees in a gale, cloud shadows, the thaw) is a section of
  `docs/features.md`. **The dog is put aside** (`DOG_ON =
  false`) until he raises it. He tests scenery with the developer menu's
  **Scenery Switches** (one each, kept until switched off): give anything
  new a switch. Earlier work: the sections under it.
- What lives by the season asks `lookSeason`: a course's own, the Snowline
  winter and the Blossom spring all year, else the month.
- `node test/run.js` has **193 checks** (all passed 9 October), about 35 minutes: run it in the
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
  animals; the weekly hunt and its streak; the gold mountain (now a
  rounded heap, not tiers); golden
  animals; the heirloom prices and the wall at Card 220; the Tour Pass,
  Membership and the Founder's Collection on his phone; the hole's bar
  and the condition by the cog, the smaller pop-ups and the loading screen
  on his phone (all 8 October); the redesigned Tour Pass page, the gear
  padlocks, the house in the treeline (9 October).
- Settled, in case it comes up: swing speed still matters fully (a hole's
  time is when the ball drops); Fast Walker only shortens a hole's least
  time; every caddie has a trick (don't offer caddie tricks); Dawn and
  Dusk is built (a setting, off by default); Golden Hour is the gold
  mountain hole, one in 100.
- The user ends most tasks with **"What's next?"**: at least five plain
  questions or suggestions with a recommendation (§6), then wait.

### Things the user asked for that must stay (beyond `CLAUDE.md`)

- **The hole's bar** runs the field's width right under the scorecard:
  the hole, the yards held in the middle, the clock; the yardage bar the
  whole width; the wind and the rest on one line under it, each in a
  fixed place that never moves with its words, the bar one height
  always; the day's condition small beside the cog. **The buttons go in one
  column down the left** under it: settings, check-in, shop, medal
  (Honours stay in it), star, auto-climb. The Trophy Room's tabs: Today,
  Cabinet, Honours, Guide. The right side is the pull tab, then the map.
- **Fonts**: Libre Caslon for names and titles, Josefin Sans for all
  else (both built into the file); no blocky monospace. **Plain words**
  anyone can follow, no filler, "%" never "pp". **Career opens on
  Legacy.**
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
- **Words**: simple and straight to the point, no filler line anywhere
  (no "birdie here, par there", no "at once", no "entries full", nothing
  after "Pays Grit"); **never a shortened word** (seconds, minutes, hours,
  Level, experience, yards) except the hole's bar, "purse/sec" and "MPH";
  never "each" where the number itself can be shown (`fullwords`).
- **Gear rolls lock with a padlock** to tap, open until tapped.
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

- **The whole game is `index.html`** (about 34k lines, 3.6 MB, its fonts inside): markup, CSS
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
78. Heat shimmer slides the far rows a pixel on summer afternoons, so a
    check measuring pixels by the horizon passed or failed by the clock:
    the harness sets `window.__noShimmer` (`SHIMMER_DEF` false); a check
    that wants it sets `SHIMMER_FORCE` and resets it to `SHIMMER_DEF`.
79. Josefin Sans's lines run about a fifth taller than the old font's at
    `line-height:normal`: where room counts (the top bars, a row's date)
    give a line height, or the course loses pixels (`rareweather` caught
    7px on its side) and boxes break at 320.
80. A check that counts sovereigns paid away counts only its own reward
    (hook `earnSov` by its key): a rare club found away can earn an honour
    by luck (`readouts` failed once in a full run on it).
81. The hole's bar keeps its line under the yardage even when empty (so it
    never changes size), except in a wager (`#stage.wager`), whose Leave
    sits just under the bar (`wagerplay`).

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
animals for now (he asked to hold off). **No scenery work at all until he
brings it up again** (he asked to stop, 6 October): offer other things.

Every idea offered and not yet done, so none is lost:

1. **A look on his phone** at the redesigned Tour Pass page, the gear
   padlocks, the Bench and Attributes figures and the house in the trees.
2. **A bug pass on the wagers** at their top levels and with the clock
   moved, now their pay is cut.
3. **Battery on a long session**: an hour of real frames on a phone-sized
   page, watching memory and frame time.
4. **Old saves**: load the oldest kinds of save and check nothing is lost
   or doubled since the pace changes.
5. **A new pass set every few months**, each from a character sheet he
   sends, built as the Cyber-Drive was.
6. **The iPhone app** (`docs/ios-app.md`), only once he brings it up again.

Held for when he raises scenery again (he asked to stop): look at the new
things on the phone (soft cloud shadows, the score call, the gold
mountain), the other special holes for bunkers under them, snow falling
heavier, frost melting through a round, a fog bank thinning, gusts of
leaves, glints and variety on the gold heap, a speed pass at its foot.

Recommend 1, then 2.
