/* The course round the hole (the user asked: "like an actual golf course,
 * like you can see other holes next to it, cart paths"):
 *
 * On the first four holes of every course:
 *   - both sides filled (the user: "there always needs to be holes around
 *     the hole being played ... make that space not empty"): the next hole
 *     on at least one, a wood or a lake at most on the other; a second hole
 *     beyond each next one; a cart path down one side; none on an island
 *     green or the sea stack, none in a wager
 *   - no other green or flag on a hazard or in a lake
 *   - laid clear: the other fairway and its green clear of the hole's own
 *     play; the path off the rough, clear of the other fairway, and of any
 *     pond or bunker; no tree, shrub or spectator on the other fairway or
 *     green, and no tree or shrub on the path
 *   - drawn: from the tee the path shows in its own colour, and the other
 *     green's flag shows somewhere down the hole
 *   - nothing bare (the user: "I just don't want to see any bare areas"):
 *     from the tee, across all of the view, down to the green, no stretch
 *     of plain rough wider than 5, 6.5 round the green where the gallery
 *     stands (the rough between the holes, past the
 *     outer one a wood, round a lake a wood); on every signature hole too,
 *     the island green and the sea stack a wood down each side
 *   - from the green nothing of another hole ahead (the user: "make the
 *     view from the greens forests, lakes with trees around it, etc.,
 *     instead of holes"): no other fairway, green, tee or flag past it;
 *     a forest right across behind it, a row of trees along its edge
 * (Nothing of it through a hill: the flag is tagged extra, and `scenery`
 * cuts every such piece at the ground's line; the fairways and the path
 * are painted in the ground's own march, which hides what is behind a rise.)
 */
'use strict';
module.exports = {
  name: 'course',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], holes: 0, both: 0, path: [], flags: 0, ponds: 0, sigs: {}, bare: 0, lakes: 0 }, keep = window.step;
      const f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        S.outfit = 'classic'; S.caddie = 'classic'; buildSprites(); FROST_FORCE = 0;
        const D = derive(), c = Scene.b;
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          const cs = B.COURSE[ci];
          DEV.course(ci); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          // the first four holes, and every signature hole of the round
          const list = [first, first + 1, first + 2, first + 3];
          for (let hh = first + 4; hh < first + B.ROUND; hh++) if (sigKind(hh)) list.push(hh);
          for (const hh of list) {
            S.hole = hh; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair'));
            Scene.newHole(S.hole, S.tier); Scene.announce = null; o.holes++;
            const where = cs.id + ' hole ' + holeInRound(hh), sk = sigKind(hh), N = Scene.nbrs || [];
            if (sk) o.sigs[sk] = (o.sigs[sk] || 0) + 1;
            // ---- nothing bare, from the tee, across the whole view ----
            { Scene.camD = 0; let worst = 0, at = null;
              const covered = (d, x) => Scene.onPlay(d, x, 1.2) || Scene.hitsHazard(d, x, 0.3) || Scene.onNbr(d, x, 1.0) || Scene.inFill(d, x, 0.6)
                || Scene.inBack(d, x, 0.5) || Scene.inBack(d, x, 0.5, 1) || Scene.inPond(d, x, 0.5) || Math.abs(x - Scene.cartX(d)) < 1.0;
              for (let d = 2; d <= LEN + 4; d += 1) {
                const p0 = Scene.proj(d, 0), k = Scene.proj(d, 1).x - p0.x, reach = Math.min(45, Math.max(Math.abs(p0.x), Math.abs(VW - p0.x)) / Math.max(1e-6, k));
                for (const sd of [-1, 1]) { let run = 0;
                  for (let x = 0; x <= reach; x += 0.25) { if (covered(d, sd * x)) run = 0; else { run += 0.25; if (run > worst) { worst = run; at = d + ', ' + (sd * x).toFixed(1); } } } }
              }
              o.bare = Math.max(o.bare, worst);
              // (the rough is wider round the green, where the gallery stands)
              if (worst > (+at.split(',')[0] > LEN - 8 ? 6.5 : 5)) f(where + (sk ? ' (' + sk + ')' : '') + ': bare rough ' + worst.toFixed(1) + ' wide at ' + at); }
            // ---- past the green: no other hole, a forest right across ----
            { const K = Scene.back;
              if (!K) f(where + ': no forest behind the green');
              else {
                if (K.lake) o.lakes++;
                let hit = null;
                // (from where he putts, a little short of the cup: nothing
                // of another hole from a pace short of the cup on, anywhere
                // across)
                for (let d = LEN - 1; d <= LEN + 70 && !hit; d += 0.5) for (let x = -45; x <= 45; x += 0.5) if (Scene.onNbr(d, x, 0)) { hit = d + ', ' + x; break; }
                if (hit) f(where + ': another hole past the green at ' + hit);
                if (Scene.props.some(q => q.kind === 12 && q.d > LEN - 7)) f(where + ': another flag by or past the green');
                if (Scene.inBack(LEN + 3, 0, 0) || Scene.inBack(LEN + 3, 0, 0, 1)) f(where + ': the forest or its lake on the green');
                let row = 0; for (let x = -20; x <= 20; x += 2) if (Scene.props.some(q => q.kind === 0 && Math.abs(q.x - x) < 1.6 && Math.abs(q.d - Scene.backEdge(q.x) - 0.6) < 1.2)) row++;
                if (row < 12) f(where + ': trees along the forest\'s edge in only ' + row + ' of 21 places');
                for (const q of Scene.props) if ((q.kind === 1 || q.kind === 8) && (Scene.inBack(q.d, q.x, -0.3) || Scene.inBack(q.d, q.x, 0, 1))) { f(where + ': a ' + (q.kind === 1 ? 'spectator' : q.sp) + ' in the forest or its lake'); break; }
                for (const q of Scene.props) if (q.kind === 0 && Scene.inBack(q.d, q.x, 0.3, 1)) { f(where + ': a tree in the lake behind the green'); break; }
              } }
            if (sk === 'island' || sk === 'pier') {
              if (N.length || Scene.cart) f(where + ' (' + sk + '): another hole or a path laid round the water');
              const F = Scene.fills || [];
              for (const sd of [-1, 1]) if (!F.some(x => x.sd === sd && x.kind === 'wood')) f(where + ' (' + sk + '): no wood on the ' + (sd < 0 ? 'left' : 'right'));
              for (const q of Scene.props) if (q.extra && q.kind === 0 && Scene.hitsHazard(q.d, q.x, 0.3)) { f(where + ' (' + sk + '): a tree in the water'); break; }
              continue;
            }
            if (!N.length || !Scene.cart) { f(where + ': no other hole or no path'); continue; }
            const ring1 = N.filter(n => !n.in), F = Scene.fills || [];
            for (const sd of [-1, 1]) if (!ring1.some(n => n.sd === sd) && !F.some(x => x.sd === sd)) f(where + ': nothing on the ' + (sd < 0 ? 'left' : 'right'));
            if (ring1.length > 1) o.both++;
            if (ring1.some(n => !N.some(m => m.in === n))) f(where + ': a next hole with nothing beyond it');
            for (const n of N) if (n.gd < LEN + 100) { const gx = Scene.nbrGX(n);
              if (Scene.hitsHazard(n.gd, gx, 1) || Scene.inFill(n.gd, gx, 0, 'lake') || Scene.inPond(n.gd, gx, 0)) f(where + ': another green on a hazard or in water at ' + n.gd.toFixed(1)); }
            for (let d = 0; d <= LEN + 6; d += 0.5) {
              const fw = Scene.fwWidth(d), cx = Scene.cartX(d);
              for (const n of N) {
                if (d > n.a && d < n.b && Math.abs(Scene.nbrX(n, d)) - Scene.nbrW(n, d) < fw + 1) { f(where + ': the other fairway comes within a pace of this one at ' + d); d = 1e9; break; }
                if (d > n.a && d < n.b && Math.abs(cx) > Math.abs(Scene.nbrX(n, d)) - Scene.nbrW(n, d) - 0.3 && Math.sign(cx) === n.sd) { f(where + ': the path runs on the other fairway at ' + d); d = 1e9; break; }
              }
              if (d > LEN + 6) break;
              if (Math.abs(cx) < fw + 1) { f(where + ': the path on the rough\'s edge at ' + d); break; }
              if (Scene.hitsHazard(d, cx, 0) && !(Scene.water && (Scene.water.canyon || Scene.water.rail || Scene.water.river) && Math.abs(d - Scene.water.d) < Scene.water.rd)) { f(where + ': the path through a hazard at ' + d.toFixed(1)); break; }
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
            { const C = Scene.cart; let end = C.club ? LEN + 15.5 : LEN + 60;
              // (it runs on into the forest, where the forest ends it)
              if (!C.club) for (let d = LEN; d <= end; d += 0.1) if (Scene.inBack(d, Scene.cartX(d), -0.2)) { end = null; break; }
              for (const at of [0, 20, 40, LEN - 3]) { Scene.camD = at; const pr = end === null ? null : Scene.proj(end, Scene.cartX(end));
                if (!C.club && pr && pr.x > -4 && pr.x < VW + 4) { f(where + ': the path\'s end in view from ' + at); break; }
                if (C.club && !Scene.props.some(q => q.kind === 11 && Math.abs(q.x - Scene.cartX(end)) < CLUB_W / 2 && Math.abs(q.d - end) < 2)) { f(where + ': the path does not end at the clubhouse'); break; } } }
            for (const q of Scene.props) {
              if (q.kind !== 0 && q.kind !== 1 && q.kind !== 8) continue;
              if (Scene.inFill(q.d, q.x, 0, 'lake')) { f(where + ': something standing in the lake at ' + q.d.toFixed(1)); break; }
              if (Scene.onNbr(q.d, q.x, 0.2)) { f(where + ': a ' + (q.kind === 1 ? 'spectator' : q.kind ? q.sp : 'tree') + ' on the other hole at ' + q.d.toFixed(1) + ', ' + q.x.toFixed(1)); break; }
              if (q.kind !== 1 && q.d > -3 && q.d < LEN + 7 && Math.abs(q.x - Scene.cartX(q.d)) < 0.5) { f(where + ': a ' + (q.kind ? q.sp : 'tree') + ' on the path at ' + q.d.toFixed(1)); break; }
            }
            // drawn: the path from the tee, in its own colour; a flag down the hole
            if (hh === first && !sk) {
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
        for (const k of ['island', 'pier', 'canyon', 'stones', 'rail']) if (!o.sigs[k]) f('no ' + k + ' hole was looked at');
        if (!o.lakes) f('no green had a lake before its forest');
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
    return [r.holes + ' holes over every course (' + Object.entries(r.sigs).map(([k, v]) => v + ' ' + k).join(', ') + ' among them), both sides filled, the next hole on one at least (' + r.both + ' with one each side), another beyond each, a cart path (' + r.ponds + ' with a pond); round an island or the sea stack a wood each side; none in a wager',
      'nothing bare from the tee (the widest plain rough ' + r.bare.toFixed(2) + '); past every green no other hole, a forest right across with its row of trees (' + r.lakes + ' with a lake before it)',
      'all laid clear of the play, the hazards and each other, nothing standing on them; the path ' + Math.min(...r.path) + ' pixels at least from the tee; the other flag seen on ' + r.flags + ' courses'];
  }
};
