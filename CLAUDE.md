# Mythic Mulligan

An idle golf game. The whole thing is one file: `index.html` holds the markup,
the styles and the script. There is no build step — open the file and it runs.

**Starting a new session? Read `HANDOFF.md` first.** It has where things
stand, a map of the file, what the recent features do and ideas to offer next.
Update it at the end of any sizeable piece of work.

## Standing instructions

- **Work on `main`.** Commit and push without asking.
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
- Never put a model name in a commit, a code comment or a file.

## Checks

`node test/run.js` runs all of them; `node test/run.js <name>` runs one.
`test/README.md` says what each one is for and what bug it was written after.

Two rules that have cost real time here:

- **Measure across a sweep, never one sample.** Weather, gear rolls and Tour
  Cards all vary, and a single run reports noise as a result. Compare many
  configurations and report a geometric mean with its spread.
- **`chaosFor` and `courseElFor` hash on the tier.** Comparing two tiers
  silently compares two different weather sequences. Pin the weather on both
  sides of any before/after.

A check that fails once is not a flake. Chase it: twice it has been the
check's own random setup, and that needs fixing as much as a game bug does.

Every new check gets a negative test: break the game on purpose, watch the
check fail, put it back. `HANDOFF.md` §4 has the harness and its gotchas.
