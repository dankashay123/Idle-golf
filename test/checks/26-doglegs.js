/* Holes bend, and the ball follows them.
 *
 * Every hole used to run dead straight from tee to green. Each has a centre
 * line now -- a dogleg on most par fours, an S on a par five, a drift on a
 * par three -- and everything is laid out across it, the ball included.
 *
 *   - the shape: over the 72 holes of an event, at least 60% of par fours and
 *     fives turn by 8 units or more (the fairway is about 6 wide), and no par
 *     three turns by more than 5.5
 *   - the ball lands on the fairway round the corner: on every bent hole,
 *     from four places along it, eight shots of the game's own spread are
 *     projected to where they come down, and the frame is read there with
 *     the fairway painted a marker colour and the haze off. Of the landings
 *     that show ground (not behind a rise, not behind a tree or a spectator
 *     standing nearer), at least 98% have to be fairway. It measured 99.4%;
 *     the rest are a pond's edge at a sharp corner. Take the bend out of the
 *     ball's projection but leave it on the ground and it falls to about 30%.
 *   - a wager is played dead straight
 */
'use strict';
module.exports = {
  name: 'doglegs',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = { p45: 0, bent: 0, p3max: 0, cls: {}, hidden: 0, n: 0 };
      const SNAP = JSON.stringify(S), realHaze = Scene.buildHaze;
      let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      QUIET = true;
      try {
        hideSheet();
        for (let h = 1; h <= 72; h++) {
          Scene.newHole(h, 0);
          const par = parOf(h), turn = Math.abs(Scene.curve.segs.reduce((a, g) => a + g.a, 0));
          let most = 0; for (let d = 0; d <= LEN; d += 2) most = Math.max(most, Math.abs(Scene.curveAt(d)));
          if (par === 3) o.p3max = Math.max(o.p3max, most);
          else { o.p45++; if (Scene.curve.segs.some(g => Math.abs(g.a) >= 8)) o.bent++; }
          if (!Scene.curve.segs.length) continue;
          for (const cd of [0, 12, 24, 36]) {
            Scene.camD = cd; Scene.balls.length = 0;
            Scene.draw(0, derive());                       // builds the theme's ramps
            const T = Scene.theme, keep = {};
            for (const k of ['_fw', '_rg', '_sd', '_sdb', '_wt', '_bk', '_arim']) keep[k] = T[k];
            keep.apron = T.apron; keep.lip = T.lip;
            T._fw = T._fw.map(() => '#ff00ff'); T._rg = T._rg.map(() => '#00ff00');
            T._sd = T._sd.map(() => '#ffff00'); T._sdb = T._sdb.map(() => '#ffff00'); T.lip = '#ffff00';
            T._wt = T._wt.map(() => '#0000ff'); T._bk = T._bk.map(() => '#0000ff');
            T.apron = '#00ffff'; T._arim = ['#00ffff', '#00ffff'];
            Scene.buildHaze = function(){ this.haze = null; };
            Scene.draw(0, derive());
            Scene.buildHaze = realHaze; Object.assign(T, keep); Scene.hazeKey = null;
            const img = Scene.b.getImageData(0, 0, VW, VH).data;
            for (let k = 0; k < 8; k++) {
              const dist = 14 + rnd() * 9, lat = -0.15 + (rnd() - 0.5) * 0.30, d = cd + dist;
              if (d > LEN - 9) continue;                   // the green and its apron
              const q = Scene.proj(d, lat); o.n++;
              if (q.y >= Scene.clipAt(d) || q.x < 0 || q.x >= VW || q.y < 0 || q.y >= VH) { o.hidden++; continue; }
              const i = (q.y * VW + q.x) * 4, rgb = img[i] + ',' + img[i + 1] + ',' + img[i + 2];
              const c = { '255,0,255': 'fairway', '0,255,0': 'rough', '255,255,0': 'sand', '0,0,255': 'water',
                          '0,255,255': 'apron' }[rgb] || 'nearer';
              o.cls[c] = (o.cls[c] || 0) + 1;
            }
          }
        }
        // a wager is straight
        const R = { id: 'water', floor: 3 };
        Scene.newDepthsHole(R); o.wager = Scene.curve;
      } finally {
        Scene.buildHaze = realHaze; Scene.hazeKey = null; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });

    const share = r.bent / r.p45;
    if (!(share >= 0.6)) throw new Error('only ' + r.bent + ' of ' + r.p45 + ' par fours and fives turn by 8 or more');
    if (r.p3max > 5.5) throw new Error('a par three turns by ' + r.p3max.toFixed(1) + ', over 5.5');
    const ground = ['fairway', 'rough', 'sand', 'water', 'apron'].reduce((a, k) => a + (r.cls[k] || 0), 0);
    const fw = (r.cls.fairway || 0) / Math.max(1, ground);
    if (!(ground > 200)) throw new Error('only ' + ground + ' landings showed ground, so this measured nothing');
    if (!(fw >= 0.98)) throw new Error('on bent holes only ' + Math.round(fw * 1000) / 10 + '% of landings are on the fairway ('
      + JSON.stringify(r.cls) + '): the ball is not following the hole round the corner');
    if (r.wager) throw new Error('a wager hole bends: ' + JSON.stringify(r.wager));
    return [r.bent + ' of ' + r.p45 + ' par fours and fives turn by 8 or more; no par three past ' + r.p3max.toFixed(1),
      'on bent holes ' + (fw * 100).toFixed(1) + '% of ' + ground + ' visible landings are fairway ('
        + Object.entries(r.cls).map(([k, v]) => k + ' ' + v).join(', ') + '; ' + r.hidden + ' behind a rise)',
      'wagers play straight'];
  }
};
