# Mythic Mulligan

An idle golf game. The whole thing is one file: `index.html` holds the markup,
the styles and the script. There is no build step — open the file and it runs.

## Standing instructions

- **Work on `main`.** Commit and push without asking.
- **Fix what needs fixing.** If something comes up mid-task that is broken or
  wrong, fix it then and there rather than reporting it and waiting.
- **Explain changes in plain language.** Assume the reader is not a coder: no
  function names, no file paths, no jargon in the summary. Say what changed on
  screen and why it is better.

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

A check that fails once is not a flake. Chase it.
