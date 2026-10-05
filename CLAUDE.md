# Mythic Mulligan

An idle golf game in one file: `index.html` holds the markup, styles and
script. No build step.

**New session: read `HANDOFF.md` whole first** (where things stand, the
rules that cost time, what to offer next). Don't read `docs/` or
`test/README.md` through; search them for what you need. Update the notes
only when the user asks; then make `HANDOFF.md` and this file true to the
game as it is, short, and move detail into `docs/`.

## Standing instructions

- **Work on `main`**; commit and push without asking. If the session names
  a branch, push there too. On a session branch with a stale `main`, push
  with `git push origin HEAD:main`.
- **Fix what's broken** when you find it, then and there.
- **Plain language** in every summary: no function names, paths or jargon;
  say what changed on screen and why it is better.
- **Short text on screen.** Anything long goes behind a `?` fold. "%" not
  "per cent"; keep a figure with its unit (`nb()`).
- **The user plays on an iPhone.** Check anything on screen at 320 to 440
  wide and on its side, and screenshot it yourself.
- **The game's own words**: clubs are *scrapped*; legacy finds are
  *heirlooms*; the medal opens the *Trophy Room*; row titles in Title
  Case; Tour Cards are plain numbers ("Card 23"), never Roman.
- **Ask when a request reads two ways**, but when he asked for action, act
  on the likely reading and say which. Where a change leaves a real choice
  (how hard to cut a reward, which look), show a short plain proposal.
- **End ready for "What's next?"**: when things are finished, at least
  five questions or suggestions and a recommendation (`HANDOFF.md` §6):
  features, optimisation, bug passes and the like; a bug or optimisation
  pass only when something done needs a look over, or after a few
  commits. Never offer a photo mode, a weather forecast or fireworks;
  don't raise the dog until he does.
- **Pacing**: a free player gets a full Mythic set in about six weeks at an
  hour a day; no wall below Card 200 to 250 (maxed walls at 220); nothing
  game-breaking at max, every heirloom has a top. Simulate a free player
  before changing anything that pays.
- **Sovereigns earned wait for a GET tap** at their place (Today, Honours,
  the Guide), with GET ALL where there is more than one; new rewards use
  `earnSov`. Purchases pay at once. Rewards for *seeing* things are earned
  live only (never away, in a catch-up or a wager).
- **Developer menu**: a developer copy only (this computer, a file, or a
  phone that once opened the game with `?dev`). Old `MM1` codes load only
  there.
- **No clipping, no floating, no visual bugs.** Screenshot new scenery from
  several places down the hole; extend `sigview` to anything over the
  field: nothing through a hill, nothing on a bridge or pier cut away
  while he stands on it. Body parts never cross the body: what passes
  behind him is drawn behind (`poses`).
- **Nothing new on the Tour tab** (it is split into sub tabs).
- **The real clock never forces day or night.** Dawn and Dusk (off by
  default) is the only setting that follows it: on, it warms dawn and dusk
  and makes every hole night 9pm to 5am; it never takes a course's own
  night. Frost on cold mornings stays as it is. No other course-look
  options.
- **No new sounds except ambience** (birdsong, crickets, animal calls).
  The grandstand's soft cheer on an event's last putt is the one crowd
  sound; a new skin's moment is silent.
- **Effects stay short and close**: a skin's moment only on an albatross
  or an ace, half a second, bursting from his outline; nothing climbs the
  sky. Wings follow his profile (side on swinging, from behind walking),
  never a solid shape.
- **New skins**: draw him alone at real sizes in every pose and look at it
  scaled up (rule 36), then at about 30px (rule 57). A skin from the
  user's pictures follows the latest picture (the Divine shows no skin: a
  long-nosed crimson mask, a gold crown, jade gauntlets); restyle the
  whole set with it (caddie, driver, wake, ball, cup moment, blessing,
  tiles).
- **His address stance** is the user's picture: tall, legs straight and
  together (rule 58).
- **Everyone is bulky, effects prominent**: drawn wider from his own
  picture (`bulkRow`), thicker arms; never a plate or rim behind him;
  grounds and blessings filled and solid.
- **An ace is played from the tee** (no walk, no putt, ACE held a second).
  **Nothing on the course is bare**; no hole seen from the green.
- **No names from real events**: invented names for majors, courses,
  jackets, prizes; old ids stay so saves carry over.
- **A sovereign is a purple gem**, the same everywhere.
- No model name in a commit, comment or file. The commit co-author line
  reads `Co-Authored-By: Claude <noreply@anthropic.com>`; keep the session
  link line.

## Checks

`node test/run.js` runs all (about 35 minutes: background, on a copy of
the repo in the scratchpad, machine quiet); `node test/run.js <name>` runs
every check whose name contains it. Setup: `npm install --no-save
playwright@1.56.1`; never `playwright install`. Don't edit `index.html` or
add a check file while a full run reads them. Never `pkill -f "node
test/run.js"` from a command containing that text. The local server stops
between commands: start `node test/serve.js` with `run_in_background` and
check it answers.

Rules that cost real time (detail in `HANDOFF.md` §4):

- **A check that fails once is not a flake.** Chase it; often it is the
  check's own clock, date or setup. Pin them, then sweep them.
- **Sweep, never one sample**; report a geometric mean and its spread.
  `chaosFor`/`courseElFor` hash on the tier: pin the weather both sides.
- **Dated things** (seasons by the real month, December's lights,
  pumpkins from 24 October, the Check-In's month, frost by the hour): run
  with the month pinned to each season and `HOUR_FORCE` at 8 and 15, in a
  copy.
- **Skins**: bake big shapes, solid pixels, ground things in `ground`.
- **Measure the thing, not the frame**: draw it alone after a frame of its
  own hole, count by its colours, give every comparison a floor.
- Lines across the stage are drawn in rows (`pxLine` stops at 400 steps).
- What is painted into the ground is under every prop (`_forOcc`).
- "Is anyone watching" is counted in steps, never wall time.
- Try every reward at its top and with the clock moved both ways
  (`heirlooms`, `exploits`). The harness is a developer copy: set
  `DEV_OFF = true` to see what a player sees; it also pays sovereigns at
  once (`window.__sovAuto`), which only `getsov` turns off.
- Every cache of canvases has a bound and frees what it drops (`cvFree`):
  the phone's memory for pictures ran out and the sky went black (77).
- Far things by true scale on a grid; anything over the far field is cut
  where trees stand (`overTrees`).

Every new check gets a negative test (break the game, watch it fail, put
it back). New things on the course are laid from a hash (`Scene.layNight`,
tagged `extra`), never the hole's own `rnd`; something rare is rolled
after the hole is laid and only flags (`golden`).
