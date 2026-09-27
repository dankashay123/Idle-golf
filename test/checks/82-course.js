/* The course round the hole (the user asked: "like an actual golf course,
 * like you can see other holes next to it, cart paths"):
 *
 * On the first four holes of every course:
 *   - the next hole beside it (on some, both sides) and a cart path down one
 *     side; none on an island green or the sea stack, none in a wager
 *   - laid clear: the other fairway and its green clear of the hole's own
 *     play; the path off the rough, clear of the other fairway, and of any
 *     pond or bunker; no tree, shrub or spectator on the other fairway or
 *     green, and no tree or shrub on the path
 *   - drawn: from the tee the path shows in its own colour, and the other
 *     green's flag shows somewhere down the hole
 * (Nothing of it through a hill: the flag is tagged extra, and `scenery`
 * cuts every such piece at the ground's line; the fairways and the path
 * are painted in the ground's own march, which hides what is behind a rise.)
 */
'use strict';
module.exports = {
  name: 'course',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], holes: 0, both: 0, path: [], flags: 0, ponds: 0 }, keep = window.step;
      const f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        S.outfit = 'classic'; S.caddie = 'classic'; buildSprites(); FROST_FORCE = 0;
        const D = derive(), c = Scene.b;
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          const cs = B.COURSE[ci];
          DEV.course(ci); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let hh = first; hh < first + 4; hh++) {
            S.hole = hh; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair'));
            Scene.newHole(S.hole, S.tier); Scene.announce = null; o.holes++;
            const where = cs.id + ' hole ' + holeInRound(hh), sk = sigKind(hh), N = Scene.nbrs || [];
            if (sk === 'island' || sk === 'pier') { if (N.length || Scene.cart) f(where + ' (' + sk + '): the course laid round the water'); continue; }
            if (!N.length || !Scene.cart) { f(where + ': no other hole or no path'); continue; }
            if (N.length > 1) o.both++;
            for (let d = 0; d <= LEN + 6; d += 0.5) {
              const fw = Scene.fwWidth(d), cx = Scene.cartX(d);
              for (const n of N) {
                if (d > n.a && d < n.b && Math.abs(Scene.nbrX(n, d)) - Scene.nbrW(n, d) < fw + 1) { f(where + ': the other fairway comes within a pace of this one at ' + d); d = 1e9; break; }
                if (d > n.a && d < n.b && Math.abs(cx) > Math.abs(Scene.nbrX(n, d)) - Scene.nbrW(n, d) - 0.3 && Math.sign(cx) === n.sd) { f(where + ': the path runs on the other fairway at ' + d); d = 1e9; break; }
              }
              if (d > LEN + 6) break;
              if (Math.abs(cx) < fw + 1) { f(where + ': the path on the rough\'s edge at ' + d); break; }
              if (Scene.hitsHazard(d, cx, 0) && !(Scene.water && (Scene.water.canyon || Scene.water.rail))) { f(where + ': the path through a hazard at ' + d.toFixed(1)); break; }
            }
            for (const n of N) { const gx = Scene.nbrGX(n);
              if (Math.abs(gx) - 2.6 < Scene.fwWidth(n.gd) + 1 || (Math.abs(n.gd - LEN) < 9 && Math.abs(gx) - 2.6 < 3.2)) f(where + ': the other green by this hole\'s play'); }
            // a pond, where there is one: clear of this hole's play and hazards,
            // the path and the other hole
            const Pd = Scene.pond;
            if (Pd) { o.ponds = (o.ponds || 0) + 1;
              for (let t = -1; t <= 1; t += 0.25) { const d = Pd.d + t * Pd.rd;
                for (const x of [Pd.x - Pd.rx * 1.25, Pd.x, Pd.x + Pd.rx * 1.25]) {
                  if (Scene.onPlay(d, x, 0.3) || Scene.onNbr(d, x, 0.2) || Math.abs(x - Scene.cartX(d)) < 0.5) { f(where + ': the pond on the play, the other hole or the path at ' + d.toFixed(1)); t = 9; break; } } } }
            // the path never seen to end: from anywhere down the hole its far
            // end is off the side of the screen, or under the clubhouse
            { const C = Scene.cart, end = C.club ? LEN + 15.5 : LEN + 60;
              for (const at of [0, 20, 40, LEN - 3]) { Scene.camD = at; const pr = Scene.proj(end, Scene.cartX(end));
                if (!C.club && pr.x > -4 && pr.x < VW + 4) { f(where + ': the path\'s end in view from ' + at); break; }
                if (C.club && !Scene.props.some(q => q.kind === 11 && Math.abs(q.x - Scene.cartX(end)) < CLUB_W / 2 && Math.abs(q.d - end) < 2)) { f(where + ': the path does not end at the clubhouse'); break; } } }
            for (const q of Scene.props) {
              if (q.kind !== 0 && q.kind !== 1 && q.kind !== 8) continue;
              if (Scene.onNbr(q.d, q.x, 0.2)) { f(where + ': a ' + (q.kind === 1 ? 'spectator' : q.kind ? q.sp : 'tree') + ' on the other hole at ' + q.d.toFixed(1) + ', ' + q.x.toFixed(1)); break; }
              if (q.kind !== 1 && q.d > -3 && q.d < LEN + 7 && Math.abs(q.x - Scene.cartX(q.d)) < 0.5) { f(where + ': a ' + (q.kind ? q.sp : 'tree') + ' on the path at ' + q.d.toFixed(1)); break; }
            }
            // drawn: the path from the tee, in its own colour; a flag down the hole
            if (hh === first) {
              // (the frame with the path against the same frame without it;
              // the haze over the far field shifts its colour)
              Scene.camD = 0; Scene.walkTo = 0; Scene.swingT = 0; Scene.gGen++; Scene.draw(0, D);
              const a = c.getImageData(0, 0, VW, VH).data, cart = Scene.cart;
              Scene.cart = null; Scene.gGen++; Scene.draw(0, D);
              const a0 = c.getImageData(0, 0, VW, VH).data; Scene.cart = cart; Scene.gGen++;
              let n = 0; for (let i = 0; i < a.length; i += 4) if (a[i] !== a0[i] || a[i + 1] !== a0[i + 1] || a[i + 2] !== a0[i + 2]) n++;
              o.path.push(n);
              if (n < 40) f(where + ': the path shows ' + n + ' pixels from the tee');
              for (const at of [0, 15, 30, 45]) {
                Scene.camD = at; Scene.draw(0, D);
                const was = Scene.props; Scene.props = was.filter(q => q.kind === 12);
                c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); Scene.drawProps(); Scene.props = was;
                const b = c.getImageData(0, 0, VW, VH).data; let m = 0; for (let i = 0; i < b.length; i += 4) if (!(b[i] === 1 && b[i + 1] === 2 && b[i + 2] === 3)) m++;
                if (m) { o.flags++; break; }
              }
            }
          }
        }
        if (o.flags < B.COURSE.length * 0.6) f('the other green\'s flag showed on only ' + o.flags + ' of ' + B.COURSE.length + ' courses');
        if (!o.both) f('no hole had a hole each side');
        // a wager lays none
        const d = B.DGN.find(x => x.id === 'twilight'); S.dgnKeys[d.id] = 3; setView('dgn'); startDgn(d); hideSheet();
        keep(1 / 60, derive()); Scene.draw(1 / 60, derive());
        if ((Scene.nbrs || []).length || Scene.cart) f('a wager laid the course round it');
        delete S.dgnRun;
      } finally {
        window.step = keep; FROST_FORCE = null; delete S.dgnRun;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.holes + ' holes over every course, each with the next hole beside it and a cart path (' + r.both + ' with one each side, ' + r.ponds + ' with a pond), none round an island or the sea stack or in a wager',
      'all laid clear of the play, the hazards and each other, nothing standing on them; the path ' + Math.min(...r.path) + ' pixels at least from the tee; the other flag seen on ' + r.flags + ' courses'];
  }
};
