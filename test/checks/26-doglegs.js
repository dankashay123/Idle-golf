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
 *   - corners are designed: water at a corner sits on its outside, where a
 *     shot hit straight runs out, and the outside holds water or sand on
 *     nine corners in ten (the first bunker goes there, unless the pond has
 *     taken the spot); the trees crowd the inside, so cutting the corner is
 *     the gamble
 *   - the hole map is shown on an upright phone and marks the golfer
 *   - a new event announces its course across the field, once: not again
 *     on the next hole, and not during a catch-up (the flyover this
 *     replaced is gone)
 *   - the wind carries a ball downwind while it is up and moves neither end
 *     of its flight, so it still lands on the fairway; a wager is calm
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
        // designed corners: water and the first bunker outside, trees inside
        o.wOut = 0; o.wAll = 0; o.bOut = 0; o.bAll = 0; o.tIn = 0; o.tOut = 0;
        for (let h = 1; h <= 72; h++) {
          Scene.newHole(h, 0);
          const g = Scene.curve.segs.filter(q => Math.abs(q.a) >= 6).sort((p, q) => q.w - p.w)[0];
          if (!g) continue;
          const out = g.a > 0 ? -1 : 1, near = d => Math.abs(d - g.c) < g.w * 1.2;
          if (Scene.water && near(Scene.water.d)) { o.wAll++; if (Math.sign(Scene.water.x) === out) o.wOut++; }
          // the outside holds the water or, where there is none, the first bunker
          o.bAll++;
          if ((Scene.water && near(Scene.water.d) && Math.sign(Scene.water.x) === out)
              || Scene.bunkers.some(b => Math.sign(b.x) === out && near(b.d))) o.bOut++;
          for (const p of Scene.props) if (p.kind === 0 && near(p.d) && Math.abs(p.x) < 7.5)
            Math.sign(p.x) === -out ? o.tIn++ : o.tOut++;
        }
        // the map: shown on a phone upright, and it marks where he is
        Scene.newHole(S.hole, S.tier); Scene.mapOn = false; Scene._mapTry = null; Scene.t += 1; Scene.drawMap();
        const mc = document.getElementById('holeMap');
        o.map = { shown: getComputedStyle(mc).display !== 'none', w: mc.width, h: mc.height };
        if (o.map.shown) {
          Scene.t += 1; Scene.drawMap();
          const [mx, my] = Scene.mapXY(Scene.camD, -0.30), px = mc.getContext('2d').getImageData(Math.round(mx) - 1, Math.round(my) - 1, 1, 1).data;
          o.map.marker = px[0] + ',' + px[1] + ',' + px[2];
        }
        // the course announcement: when play reaches a new event, once; not
        // on the next hole, not during a catch-up
        {
          const keepH = S.hole, seen = S.courseSeen;
          const at = h => { Scene.announce = null; S.hole = h - 1; startHole();
            S.elapsed = 5; finishHole(derive()); return Scene.announce ? Scene.announce.name : null; };
          QUIET = false;
          S.courseSeen = tournamentOf(72);
          o.ann = { next: at(73), again: at(74) };
          QUIET = true; o.ann.quiet = at(145); QUIET = false;
          o.ann.want = courseFor(tournamentOf(73)).n;
          o.ann.fly = typeof Scene.flyStart;
          QUIET = true; S.courseSeen = seen; S.hole = keepH; startHole();
        }
        // the wind: a bow downwind, and the ball still lands where it was going
        {
          const b = { lat0: 0.42, lat: -0.15, dist: 18 };
          Scene.wind = 0; const calm = [0, 0.5, 1].map(u => Scene.ballLat(b, u));
          Scene.wind = 0.8; const right = [0, 0.5, 1].map(u => Scene.ballLat(b, u));
          Scene.wind = -0.8; const left = [0, 0.5, 1].map(u => Scene.ballLat(b, u));
          o.wind = { ends: Math.max(Math.abs(right[0] - calm[0]), Math.abs(right[2] - calm[2]), Math.abs(left[2] - calm[2])),
                     bowR: right[1] - calm[1], bowL: left[1] - calm[1], mph: (Scene.wind = 0.8, Scene.windMph()) };
          let x = 0; for (let h = 1; h <= 72; h++) { Scene.newHole(h, 0); x = Math.max(x, Math.abs(Scene.wind)); }
          o.wind.most = x;
          Scene.newDepthsHole({ id: 'sand', floor: 2 }); o.wind.wager = Scene.wind;
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
    if (!(r.wOut >= r.wAll * 0.8)) throw new Error('water at a corner sits on its outside on only ' + r.wOut + ' of ' + r.wAll + ' holes');
    if (!(r.bOut >= r.bAll * 0.9)) throw new Error('the outside of the corner holds water or sand on only ' + r.bOut + ' of ' + r.bAll + ' holes');
    if (!(r.tIn > r.tOut * 1.5)) throw new Error('the trees round a corner are not on its inside: ' + r.tIn + ' inside, ' + r.tOut + ' outside');
    if (!r.map.shown || !(r.map.w >= 20 && r.map.h >= 30)) throw new Error('the hole map is not shown on an upright phone: ' + JSON.stringify(r.map));
    if (!/^(255,214,107|26,31,26)$/.test(r.map.marker)) throw new Error('the hole map does not mark the golfer: ' + r.map.marker);
    const A = r.ann;
    if (!A.next || A.next.replace(/ /g, '') !== A.want.toUpperCase().replace(/[^A-Z0-9]/g, ''))
      throw new Error('reaching a new event did not announce its course: ' + A.next + ' for ' + A.want);
    if (A.again) throw new Error('the course was announced again on the next hole: ' + A.again);
    if (A.quiet) throw new Error('a catch-up announced a course: ' + A.quiet);
    if (A.fly !== 'undefined') throw new Error('the flyover is still in the game');
    const W = r.wind;
    if (W.ends > 1e-9) throw new Error('the wind moved where the ball leaves the club or lands, by ' + W.ends.toFixed(3));
    if (!(W.bowR > 0.3 && W.bowL < -0.3)) throw new Error('the wind does not carry the ball downwind mid-flight: ' + W.bowR.toFixed(2) + ' / ' + W.bowL.toFixed(2));
    if (!(W.mph > 0)) throw new Error('a 0.8 wind reads ' + W.mph + ' mph');
    if (W.wager) throw new Error('a wager is played in a wind of ' + W.wager);
    if (r.wager) throw new Error('a wager hole bends: ' + JSON.stringify(r.wager));
    return [r.bent + ' of ' + r.p45 + ' par fours and fives turn by 8 or more; no par three past ' + r.p3max.toFixed(1),
      'on bent holes ' + (fw * 100).toFixed(1) + '% of ' + ground + ' visible landings are fairway ('
        + Object.entries(r.cls).map(([k, v]) => k + ' ' + v).join(', ') + '; ' + r.hidden + ' behind a rise)',
      'corners designed: water outside on ' + r.wOut + '/' + r.wAll + ', water or sand outside on ' + r.bOut + '/' + r.bAll
        + ', trees ' + r.tIn + ' inside to ' + r.tOut + ' outside',
      'hole map ' + r.map.w + 'x' + r.map.h + ' shown, golfer marked',
      'wind carries the ball ' + W.bowR.toFixed(2) + ' downwind mid-flight and moves neither end of it; calm on wagers',
      'a new event announces its course once, on the field; not on the next hole or in a catch-up',
      'wagers play straight'];
  }
};
