# Mythic Mulligan

An idle golf game. The whole thing is one file: `index.html` holds the markup,
the styles and the script. There is no build step — open the file and it runs.

**Starting a new session? Read `HANDOFF.md` first.** It has where things
stand, **a request waiting to be picked up** (§1), a map of the file, what the
recent features do and ideas to offer next.
Update it only when the user asks (they said so: "You don't need to update
the handoff notes until I tell you to").

## Standing instructions

- **Work on `main`.** Commit and push without asking. If the session names a
  branch of its own, push there as well. A session may start on its own
  branch with a stale local `main`: push with `git push origin HEAD:main` (a
  plain `git push origin main` sends the old one and is refused).
- **Fix what needs fixing.** If something comes up mid-task that is broken or
  wrong, fix it then and there rather than reporting it and waiting.
- **Explain changes in plain language.** Assume the reader is not a coder: no
  function names, no file paths, no jargon in the summary. Say what changed on
  screen and why it is better.
- **Keep the text on screen short.** Necessary information only. No paragraphs
  explaining the game to someone who is already playing it; put anything that
  really needs saying behind a `?` fold. Prefer "%" to "per cent" and bind a
  figure to the unit it carries, so a narrow column cannot break them apart.
- **The user plays on an iPhone** and often sends screenshots. Check anything
  on screen at phone widths (320 to 440, and on its side) before calling it
  done, and screenshot it yourself.
- **Use the game's own words.** Clubs are *scrapped* (not salvaged); the
  legacy finds are *heirlooms*; the medal on the course opens the *Trophy
  Room*. Row titles are Title Case.
- **Ask when a request can be read two ways**, but act on the likely reading
  when the user has asked for action, and say which reading you took.
- **End a finished task ready for "What's next?"**: the user usually asks it.
  Answer with a short plain menu and a recommendation (ideas in `HANDOFF.md`).
- **New scenery must never show through the ground or float.** The user
  looks closely and asked for "no clipping anywhere and no visual bugs".
  Screenshot every new thing on the course from several places down the
  hole, and extend the `sigview` check to anything drawn over the field.
  It holds both ways: nothing through a hill in front, and nothing on a
  bridge, pier or crossing cut away while he stands on it (the user saw
  the canyon bridge as slats).
- **Don't add anything new to the Tour tab.** The user finds it cluttered;
  what is there is to be split into sub tabs, not added to.
- **Anything new that changes a course's look is an option.** The user
  asked for dawn and dusk as a setting "because this could override the
  course designs": ask for, or build, a switch for anything like it.
- **Effects stay short and close.** A skin's moment on a great hole comes
  only on an albatross or an ace, lasts half a second and bursts out from
  his outline; nothing climbs the sky. A fast bag aces every hole, so
  anything long never goes away. Wings follow his profile (side on as he
  swings, from behind as he walks) and are never a solid shape.
- Never put a model name in a commit, a code comment or a file. In a commit
  the co-author line reads `Co-Authored-By: Claude <noreply@anthropic.com>`
  whatever the session suggests; keep its session link line.
- **At the end of a session** the user may ask for `HANDOFF.md` and this
  file to be brought up to date "for another handoff": make both true to
  the game as it is now, not just longer.

## Checks

`node test/run.js` runs all of them; `node test/run.js <name>` runs every
check whose name contains `<name>` (only the first name given counts).
`test/README.md` says what each one is for and what bug it was written after.

Setup: `npm install --no-save playwright@1.56.1` (it matches the Chromium
already installed; never run `playwright install`). A full run takes about
ten minutes, so start it in the background. Don't write a new check file or
edit `index.html` while a full run is going (it reads both as it reaches
them): run the suite on a copy of the repo in the scratchpad if you want to
keep working, and never `pkill -f "node test/run.js"` from a command that
contains that text (it kills its own shell).

Rules that have cost real time here:

- **Measure across a sweep, never one sample.** Weather, gear rolls and Tour
  Cards all vary, and a single run reports noise as a result. Compare many
  configurations and report a geometric mean with its spread.
- **`chaosFor` and `courseElFor` hash on the tier.** Comparing two tiers
  silently compares two different weather sequences. Pin the weather on both
  sides of any before/after.
- **Some regular courses follow the real month's season.** A change to
  seasons or colours can pass today and fail in December: run the suite with
  the month pinned to each season (`HANDOFF.md` §4, rule 20).
- **Frost follows the player's own clock** (5 to 11 on a cold course).
  After touching it, run the suite with `HOUR_FORCE` pinned to 8 and to 15
  in a copy of the game.
- **Skins: bake the big shapes, draw in solid pixels, and put what lies on
  the ground in `ground`.** A wash of light over the grass turns grey, thin
  edged shapes read as wires at his size, and a ground drawn with him
  covered the pin (`HANDOFF.md` §4, rules 27 to 30).
- **Measure the thing, not the frame.** A whole-frame before/after picks up
  whatever else changed (night relights the sky; a swing's trail grows each
  draw), and a check drawing straight after another hole uses that hole's
  ground line. Draw the part alone after a frame of its own hole, count by
  its own colours, and give every comparison a floor (`HANDOFF.md` §4,
  rules 32 to 34).

A check that fails once is not a flake. Chase it: three times it has been
the check's own random setup (most lately `dance`, which played on into an
unseeded next hole), and that needs fixing as much as a game bug does.

New things on the course are laid from a hash (`Scene.layNight`, tagged
`extra`), never from the hole's own `rnd`: changing how many numbers a hole
draws moves its hills and everything after them. `nightholes` holds it.

Every new check gets a negative test: break the game on purpose, watch the
check fail, put it back. `HANDOFF.md` §4 has the harness and its gotchas;
rule 6 there lists the helpers each session rewrites (the scratchpad is not
kept): a server, a look in a pose, a zoom sheet, the harness, a clip. The
local server tends to stop between long runs: restart it when a screenshot
gets "connection refused", and don't trust a picture older than the run.
