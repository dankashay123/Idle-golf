/* Names, and the fact that this file is one file.
 *
 * Everything lives in index.html: the markup, the styles, the script, and the
 * markup the script writes as strings. So a name is global three times over,
 * and the same name meaning two things has cost this file a day on three
 * separate occasions -- #crest, .empty, and then #hud, which is the one this
 * check exists for.
 *
 * #hud was a rule with inset:0 on it, left behind when the old stage HUD was
 * taken out. Nothing carried id="hud" any more, so the rule did nothing and
 * nobody noticed. Then a new left-hand column was added under that name and
 * silently inherited right:0 and bottom:0, which stretched it over the whole
 * stage and put the pro shop button at 91% down the screen. The rule was not
 * broken; it was waiting.
 *
 * Two rules, both of which that would have caught:
 *
 *   1. A #id rule in the stylesheet has to match an element somewhere. A rule
 *      with nothing under it is not dead weight, it is a trap primed for the
 *      next element to take the name.
 *   2. An id the script asks for has to exist. $$ returns a null-object stub
 *      for a missing element, on purpose, so that a removed element does not
 *      take the frame loop down with it -- which also means a write to
 *      something that is gone succeeds silently forever.
 *
 * Ids written by the script into template strings count as existing: they are
 * `id="..."` in the source like any other, which is the whole point of scanning
 * the file rather than the DOM.
 */
'use strict';
const fs = require('fs');
const path = require('path');

// Hex colours live in declarations, never in selectors, so selectors are taken
// from the text before each { and the { } bodies are thrown away. Comments go
// first: a comment explaining which rules were removed is not a rule, and this
// check reported the names in its own explanation on the first run.
function selectorIds(css) {
  const out = new Set();
  for (const chunk of css.replace(/\/\*[\s\S]*?\*\//g, ' ').split('}')) {
    const sel = chunk.split('{')[0];
    if (!sel) continue;
    const m = sel.match(/#([A-Za-z][\w-]*)/g);
    if (m) for (const x of m) out.add(x.slice(1));
  }
  return out;
}

module.exports = {
  name: 'names',
  async run(page) {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');

    const styles = (src.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || [])
      .map(b => b.replace(/<\/?style[^>]*>/g, '')).join('\n');
    if (!styles.trim()) throw new Error('found no stylesheet to read');

    // every id that exists, static markup and script-written markup alike
    const exists = new Set();
    for (const m of src.match(/id="([A-Za-z][\w-]*)"/g) || []) exists.add(m.slice(4, -1));
    // and the ones only ever set from script
    for (const m of src.match(/\.id\s*=\s*'([A-Za-z][\w-]*)'/g) || [])
      exists.add(m.split("'")[1]);
    if (exists.size < 20) throw new Error('only found ' + exists.size + ' ids, so the scan is wrong');

    // 1. no styled id without an element
    const styled = selectorIds(styles);
    const orphanRules = [...styled].filter(id => !exists.has(id));
    if (orphanRules.length)
      throw new Error('the stylesheet styles ' + orphanRules.map(x => '#' + x).join(', ')
        + ', which nothing in the document carries. A rule with nothing under it is not '
        + 'dead weight, it is the name waiting for the next element that takes it -- which '
        + 'is exactly what #hud did to the pro shop button.');

    // 2. no id asked for that does not exist
    const asked = new Map();
    const re = /\$\$?\(\s*'([A-Za-z][\w-]*)'\s*\)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      const line = src.slice(0, m.index).split('\n').length;
      if (!asked.has(m[1])) asked.set(m[1], line);
    }
    if (asked.size < 20) throw new Error('only found ' + asked.size + ' lookups, so the scan is wrong');
    const missing = [...asked.keys()].filter(id => !exists.has(id));
    if (missing.length)
      throw new Error('the script asks for ' + missing.map(x => x + ' (line ' + asked.get(x) + ')').join(', ')
        + ', which is in no markup anywhere. $$ hands back a stub for a missing element so a '
        + 'frame does not die on it, which means this writes into nothing every time it runs '
        + 'and will keep doing so.');

    // 3. and the live document agrees: no id on two elements at once
    const dupes = await page.evaluate(() => {
      const seen = {}, out = [];
      for (const e of document.querySelectorAll('[id]')) {
        if (seen[e.id]) out.push(e.id); else seen[e.id] = 1;
      }
      return out;
    });
    if (dupes.length)
      throw new Error('two elements share the id ' + [...new Set(dupes)].join(', ')
        + '. getElementById returns the first, so the second is unreachable.');

    return ['ids: ' + exists.size + ' carried, ' + styled.size + ' styled, ' + asked.size
      + ' asked for by name, none orphaned and none missing',
      'no id on two elements in the live document'];
  }
};
