/* The small pixel face.
 *
 * Text at the base size on the field (the weather in the corner, the fairy,
 * the numbers off a swing) is set in a condensed face; the bold one is kept
 * for words drawn larger. The corner's lines ran as wide as the picture in the
 * bold face and the user asked for it condensed.
 *
 *   - every character the bold face has, the small one has too (a missing one
 *     is drawn as "?")
 *   - every glyph is a clean box: all rows one width, eight rows
 *   - no two characters are drawn the same
 *   - the small face sets the game's weather lines in at most 70% of the
 *     bold face's width, and the base size picks the small face
 */
'use strict';
module.exports = {
  name: 'font',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = { missing: [], ragged: [], twins: [] };
      for (const ch of Object.keys(GLYPH)) if (!GLYPH_S[ch]) o.missing.push(ch);
      const seen = {};
      for (const [ch, rows] of Object.entries(GLYPH_S)) {
        if (rows.length !== FHS || rows.some(x => x.length !== rows[0].length)) o.ragged.push(ch);
        const k = rows.join('/');
        if (ch !== ' ' && seen[k]) o.twins.push(seen[k] + '=' + ch); else seen[k] = ch;
      }
      let bold = 0, small = 0;
      for (const c of B.CHAOS) {
        const s = c.n.toUpperCase();
        small += textW(s, TSC);
        bold += s.length * (FW + FGAP) * TSC - FGAP * TSC;
      }
      o.ratio = +(small / bold).toFixed(2);
      o.face = faceOf(TSC) + faceOf(TSC * 2);
      return o;
    });
    const f = m => { throw new Error(m); };
    if (r.missing.length) f('the small face has no ' + r.missing.join(' '));
    if (r.ragged.length) f('glyphs that are not a clean box: ' + r.ragged.join(' '));
    if (r.twins.length) f('characters drawn the same: ' + r.twins.join(', '));
    if (r.face !== 'sb') f('the base size is set in ' + r.face[0] + ' and twice it in ' + r.face[1] + ', not small then bold');
    if (r.ratio > 0.7) f('the weather lines take ' + Math.round(r.ratio * 100) + '% of the bold face\'s width, not 70% or less');
    return ['every character, clean boxes, none alike; the weather lines at ' + Math.round(r.ratio * 100) + '% of the bold width'];
  }
};
