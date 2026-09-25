/* The gallery round the green, and scenery in the rough (the user asked: "the
 * audience ... are super far away", and for "more ambiance to the blank
 * areas to the left, right and behind the green ... everywhere").
 *
 * On the first four holes of every course:
 *   - a gallery round the green: at least six standing within a few paces of
 *     it (beside it, or close behind), none on the green, its apron, the
 *     fairway or in a hazard
 *   - a backdrop of trees behind the green
 *   - scenery in the rough down both sides and behind the green: shrubs,
 *     tufts and rocks, forty at least on a hole, none in a hazard or on the
 *     fairway or green, and every course's palette has all three drawn
 *   - drawn: from the tee and near the green the scenery shows, in view
 *   - nothing through a hill: each piece of scenery and each new spectator
 *     alone over a blank, from eight places on each home course's first four
 *     holes, every pixel on or above the ground's line at its distance
 */
'use strict';
module.exports = {
  name: 'scenery',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], holes: 0, near: [], sc: [], views: 0, pix: 0 }, keep = window.step;
      const f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        S.outfit = 'classic'; S.caddie = 'classic'; buildSprites(); FROST_FORCE = 0;
        const D = derive(), c = Scene.b;
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        const drawn = (props, t) => { const was = Scene.props; Scene.t = t; blank(); Scene.props = props; Scene.drawProps(); Scene.props = was;
          const d = c.getImageData(0, 0, VW, VH).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) n++; return { n, d }; };
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          const cs = B.COURSE[ci];
          DEV.course(ci); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let hh = first; hh < first + 4; hh++) {
            S.hole = hh; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair'));
            Scene.newHole(S.hole, S.tier); Scene.announce = null; o.holes++;
            const P = Scene.props, where = cs.id + ' hole ' + holeInRound(hh);
            const gal = P.filter(p => p.kind === 1 && p.extra && Math.abs(p.d - LEN) < 13);
            o.near.push(gal.length);
            if (gal.length < 6) f(where + ': ' + gal.length + ' of the gallery round the green');
            for (const p of P.filter(q => q.kind === 1 && q.extra)) {
              if (Scene.onPlay(p.d, p.x, 0.15) || Scene.hitsHazard(p.d, p.x, 0.3)) f(where + ': a spectator on the play or in a hazard at ' + p.d.toFixed(1) + ', ' + p.x.toFixed(1));
              if (Math.abs(p.d - LEN) < 8.6 && Math.abs(p.x) < 3.4) f(where + ': a spectator on the green\'s apron');
            }
            const back = P.filter(p => p.kind === 0 && p.d > LEN + 12);
            if (back.length < 3) f(where + ': ' + back.length + ' trees behind the green');
            const sc = P.filter(p => p.kind === 8);
            o.sc.push(sc.length);
            if (sc.length < 40) f(where + ': ' + sc.length + ' pieces of scenery');
            for (const p of sc) if (Scene.hitsHazard(p.d, p.x, 0.3) || Scene.onPlay(p.d, p.x, 0.3)) { f(where + ': scenery in a hazard or on the play at ' + p.d.toFixed(1) + ', ' + p.x.toFixed(1)); break; }
            if (!Scene.treeSpr || !Scene.treeSpr.bush || !Scene.treeSpr.tuft || !Scene.treeSpr.rock) f(where + ': the scenery\'s pictures are missing');
            // in view, from the tee and near the green
            if (hh === first) for (const at of [0, LEN - 10]) {
              Scene.camD = at; Scene.draw(0, D);
              const n = drawn(sc, 1).n;
              if (n < 60) f(where + ': scenery shows ' + n + ' pixels from ' + (at ? 'near the green' : 'the tee'));
            }
            // nothing through a hill, on the home courses
            if (cs.slot === 'home') for (let k = 0; k < 8; k++) {
              Scene.camD = LEN * k / 8; Scene.t = 1 + k * 0.7; Scene.walkTo = 0;
              Scene.draw(0, D); o.views++;
              for (const Q of P.filter(p => p.kind === 8 || p.extra)) {
                if (Q.d < Scene.camD - 5) continue;
                const lim = Scene.clipAt(Q.d) + 1, { n, d } = drawn([Q], Scene.t);
                o.pix += n;
                for (let y = Math.max(0, Math.floor(lim) + 1); y < VH; y++) for (let x = 0; x < VW; x++) {
                  const i = (y * VW + x) * 4;
                  if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue;
                  f(where + ', camera at ' + Scene.camD.toFixed(1) + ': ' + (Q.kind === 8 ? Q.sp : Q.kind ? 'a spectator' : 'a tree') + ' at ' + Q.d.toFixed(1) + ' shows at row ' + y + ', under the line ' + Math.round(lim));
                  y = VH; break;
                }
              }
            }
          }
        }
        if (o.pix < 5000) f('the scenery and the new gallery showed only ' + o.pix + ' pixels over ' + o.views + ' views');
      } finally {
        window.step = keep; FROST_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    const mn = a => Math.min(...a), avg = a => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
    return [r.holes + ' holes over every course: the gallery round the green ' + mn(r.near) + ' at least (' + avg(r.near) + ' on average), scenery ' + mn(r.sc) + ' at least (' + avg(r.sc) + '), trees behind every green',
      r.views + ' views on the home courses, ' + r.pix + ' pixels of scenery and gallery, none under the ground\'s line'];
  }
};
