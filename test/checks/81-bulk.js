/* Everyone built out (the user asked: "make the skins bulkier like the void
 * skin", then the other skins, the plain outfits and the Majors' jackets,
 * "so everyone's broader", then the caddies; then, of the dark plate it was
 * built out in: "it just looks like a weird darker outline. I want it to
 * blend well with the player"):
 *
 *   - drawn on the course, every look and every caddie is drawn built out
 *     (his rows stretched: bulkRow), and the skins' arms are a pixel thicker
 *   - built out for real: at his chest he is at least two pixels wider each
 *     side than his own picture
 *   - blended: every pixel at his chest is a colour his own row there
 *     already has, and his edge is the colour it was (no plate, no rim);
 *     his head and his feet as they were
 */
'use strict';
module.exports = {
  name: 'bulk',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], wide: {}, cads: 0 }, keep = window.bulkRow;
      const f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true;
        if (B.OUTFITS.filter(x => x.fx && STYLEFX[x.fx]).length < 15) f('fewer than 15 skins with an effect');
        const cv = document.createElement('canvas'); cv.width = 160; cv.height = 120;
        const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
        const row = y => { const d = c.getImageData(0, y, cv.width, 1).data, P = [];
          for (let x = 0; x < cv.width; x++) if (d[x * 4 + 3] >= 128) P.push([x, d[x * 4] + ',' + d[x * 4 + 1] + ',' + d[x * 4 + 2]]); return P; };
        const spied = test => { let n = 0; window.bulkRow = function (spr, x, w, bulk) { if (bulk && test(bulk)) n++; return keep.apply(this, arguments); }; return () => { window.bulkRow = keep; return n; }; };
        for (const O of B.OUTFITS) {
          S.styleOwn['o:' + O.id] = 1; S.outfit = O.id; buildSprites();
          startHole(); Scene.announce = null; Scene.swingT = 0; Scene.walkOn = false;
          const done = spied(b => b.chest > 2); Scene.draw(0, derive());
          if (!done()) f(O.n + ': not built out on the course');
          if (O.fx && STYLEFX[O.fx] && !outfitNow().bulk) f(O.n + ': his arms are not thicker');
          // his picture alone, with and without, measured at his chest, his head, his feet
          const spr = SPRITE.gAddr, h = 58, w = Math.round(h * spr.w / spr.h), x = 50, y = 40, bulk = bulkOf(h, false);
          const at = fy => Math.round(y + h * fy);
          c.clearRect(0, 0, cv.width, cv.height); blitShear(c, spr, x, y, w, h, () => 0, null);
          const plain = { chest: row(at(0.4)), head: row(at(0.1)), feet: row(at(0.97)) };
          c.clearRect(0, 0, cv.width, cv.height); blitShear(c, spr, x, y, w, h, () => 0, bulk);
          const built = { chest: row(at(0.4)), head: row(at(0.1)), feet: row(at(0.97)) };
          const P = plain.chest, Q = built.chest;
          if (!P.length || !Q.length) { f(O.n + ': nothing at his chest'); continue; }
          const l = P[0][0] - Q[0][0], rr = Q[Q.length - 1][0] - P[P.length - 1][0];
          o.wide[O.id] = l + '/' + rr;
          if (l < 2 || rr < 2) f(O.n + ': at his chest he is ' + l + ' and ' + rr + ' pixels wider');
          const cols = new Set(P.map(p => p[1]));
          const odd = Q.filter(p => !cols.has(p[1])).length;
          if (odd) f(O.n + ': ' + odd + ' pixels at his chest in colours not his own');
          if (Q[0][1] !== P[0][1] || Q[Q.length - 1][1] !== P[P.length - 1][1]) f(O.n + ': his edge at the chest changed colour');
          for (const k of ['head', 'feet']) if (JSON.stringify(plain[k]) !== JSON.stringify(built[k])) f(O.n + ': his ' + k + ' changed');
        }
        // and every caddie, plain ones too
        for (const C of B.CADDIES) {
          S.styleOwn['c:' + C.id] = 1; S.caddie = C.id; S.outfit = 'classic'; buildSprites();
          startHole(); Scene.announce = null; Scene.fairyMove = null; Scene.moveT = 999;
          const done = spied(b => b.chest < 2); Scene.draw(0, derive());
          if (!done()) f(C.n + ': the caddie is not built out'); else o.cads++;
        }
      } finally {
        window.bulkRow = keep; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [Object.keys(r.wide).length + ' looks and ' + r.cads + ' caddies, every one drawn built out (the skins thicker in the arm too), in his own colours with his own edge, his head and feet untouched; at his chest, pixels added either side: '
      + Object.entries(r.wide).map(([k, v]) => k + ' ' + v).join(', ')];
  }
};
