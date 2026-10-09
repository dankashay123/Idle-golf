/* Finds by the tee (the user picked it from the menu): now and then a lost
 * ball, an old coin, a tee peg or a ball marker lies in the rough just off
 * the tee, and he picks it up for a few sovereigns.
 *
 *   - about one live hole in forty, from the hole's hash, about 2.5
 *     sovereigns over forty holes; never away, in a wager, before his first
 *     hole, on another hole or twice on one hole
 *   - laid in the rough on his left, clear of hazards, woods, water and
 *     other holes, and on the field where it can be seen: not under the
 *     buttons or the hole map, on a phone upright or on its side
 *   - drawn as a few pixels, never under the ground's line; gone with a
 *     short burst of light close to where it lay, and nothing in a wager
 *   - a broken save is repaired
 */
'use strict';
const SIZES = [[320, 640], [390, 844], [440, 956], [844, 390]];
module.exports = {
  name: 'teefinds',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet(); HOUR_FORCE = 14; S.totalHoles = Math.max(5, S.totalHoles || 0);
        const lay = (h, force) => { S.hole = h; S.chaos = { n: 'Fair' }; S.findHole = 0; FIND_FORCE = force ? h : null; Scene.newHole(h, S.tier); FIND_FORCE = null;
          return Scene.props.find(p => p.kind === 19); };
        // how often, and what it comes to (from the hash: the same numbers
        // the holes draw)
        let n = 0, sov = 0; const N = 40000; // (per FIND_ODDS holes: one find in 67, 40 before the 9 October cut)
        for (let h = 1; h <= N; h++) if (hr(h, 700) < 1 / FIND_ODDS) { n++; sov += findOf(h).sov; }
        o.per40 = (n / N * FIND_ODDS).toFixed(2); o.sov40 = (sov / N * FIND_ODDS).toFixed(2);
        if (n / N * FIND_ODDS < 0.8 || n / N * FIND_ODDS > 1.25) f(o.per40 + ' finds every ' + FIND_ODDS + ' holes');
        if (FIND_ODDS !== 67) f('one find in ' + FIND_ODDS + ' holes, not 67');
        if (sov / N * FIND_ODDS < 0.9 || sov / N * FIND_ODDS > 2) f(o.sov40 + ' sovereigns every ' + FIND_ODDS + ' holes');
        const kinds = new Set(); for (let h = 1; h < 4000; h++) kinds.add(findOf(h).id);
        if (kinds.size !== FINDS.length) f('only ' + [...kinds].join(', ') + ' are ever found');
        // played live: a find on the holes the hash gives, and only there
        { const h0 = S.hole; let seen = 0, want = 0;
          for (let h = h0; h < h0 + 400; h++) { const p = lay(h); const w = hr(h, 700) < 1 / FIND_ODDS; if (w) want++; if (p) seen++;
            if (p && !w) f('a find on hole ' + h + ', which the hash does not give'); }
          if (seen < want * 0.85) f('found on ' + seen + ' of the ' + want + ' holes the hash gives');
          o.live = seen + ' of ' + want; }
        // where it lies, over many holes on every home course and a few others
        o.laid = 0; o.tried = 0;
        const courses = COURSE_HOME.concat(B.COURSE.filter(c => c.slot === 'event').slice(0, 3));
        o.spots = [];
        for (const cs of courses) {
          DEV.course(B.COURSE.indexOf(cs)); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let hh = first; hh < first + 18; hh++) {
            o.tried++; const p = lay(hh, 1); if (!p) continue; o.laid++;
            const at = cs.id + ' hole ' + holeInRound(hh) + ' at ' + p.d.toFixed(1) + ', ' + p.x.toFixed(1);
            if (p.x >= 0) f('on his right: ' + at);
            if (Scene.onPlay(p.d, p.x, 0.1)) f('on the short grass: ' + at);
            if (Scene.hitsHazard(p.d, p.x, 0.2)) f('in a hazard: ' + at);
            if (Scene.onNbr(p.d, p.x, 0)) f('on another hole: ' + at);
            if (Scene.inFill(p.d, p.x, 0, 'wood') || Scene.inFill(p.d, p.x, 0, 'lake') || Scene.inPond(p.d, p.x, 0.2)) f('in a wood or the water: ' + at);
            if (p.d < 2.4 || p.d > 6) f('not by the tee: ' + at);
            if (Scene.props.some(q => q !== p && (q.kind === 0 || q.kind === 2 || q.kind === 3 || q.kind >= 10) && Math.abs(q.d - p.d) < 0.5 && Math.abs(q.x - p.x) < 0.5)) f('on top of something: ' + at);
            if (o.spots.length < 40) o.spots.push([p.d, p.x]);
          }
        }
        if (o.laid < o.tried * 0.85) f('laid on only ' + o.laid + ' of ' + o.tried + ' holes it was asked for');
        // paid once, and never away, in a wager, before his first hole or
        // on a hole he is not playing
        DEV.course(0); hideSheet();
        { const h = S.hole + 1, s0 = S.sov || 0, n0 = S.finds || 0; lay(h, 1); const F = findOf(h);
          if ((S.sov || 0) - s0 !== F.sov) f('a ' + F.n + ' paid ' + ((S.sov || 0) - s0) + ', not ' + F.sov);
          if ((S.finds || 0) !== n0 + 1) f('a find was not counted');
          if (S.findHole !== h) f('the hole found on was not kept');
          const s1 = S.sov; FIND_FORCE = h; Scene.newHole(h, S.tier); FIND_FORCE = null;
          if (S.sov !== s1 || Scene.props.some(p => p.kind === 19)) f('the same hole paid or laid a find twice');
          const none = (why, set, unset) => { const s2 = S.sov; set(); const p = lay(h + 5, 1); unset(); if (p || S.sov !== s2) f('a find ' + why); };
          none('away', () => { OFFLINE = true; }, () => { OFFLINE = false; });
          none('in a catch-up', () => { QUIET = true; }, () => { QUIET = false; });
          none('in a wager', () => { S.dgnRun = { id: B.DGN[0].id }; }, () => { S.dgnRun = null; });
          const th = S.totalHoles; none('before his first hole', () => { S.totalHoles = 0; }, () => { S.totalHoles = th; });
          { const s2 = S.sov; S.hole = h + 7; S.findHole = 0; FIND_FORCE = h + 8; Scene.newHole(h + 8, S.tier); FIND_FORCE = null;
            if (S.sov !== s2 || Scene.props.some(p => p.kind === 19)) f('a find on a hole he is not playing'); }
        }
        // drawn: alone over a blank, it shows; never under the ground's line
        // from where he stands or a little on; gone once picked up, after a
        // burst close to it; nothing in a wager
        { const D = derive(), c = Scene.b, keep = window.step; window.step = () => {};
          const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
          const drawn = Q => { const was = Scene.props; blank(); Scene.props = [Q]; Scene.drawProps(); Scene.props = was;
            const d = c.getImageData(0, 0, VW, VH).data, px = []; for (let i = 0; i < d.length; i += 4) if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) px.push([(i / 4) % VW, Math.floor(i / 4 / VW)]); return px; };
          o.views = 0; o.pix = 0; o.far = 0;
          for (const cs of COURSE_HOME) {
            DEV.course(B.COURSE.indexOf(cs)); hideSheet();
            const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
            for (let hh = first; hh < first + 6; hh++) {
              const Q = lay(hh, 1); if (!Q) continue; Scene.announce = null;
              for (const cam of [0, 1, 2.5]) {
                Scene.camD = cam; Scene.walkTo = cam; Scene.find.t0 = Scene.t = 5; Scene.draw(0, D); Scene.find.t0 = Scene.t = 5; o.views++;
                const lim = Math.floor(Scene.clipAt(Q.d) + 1), px = drawn(Q); o.pix += px.length;
                if (cam === 0 && !px.length) f(cs.id + ' hole ' + holeInRound(hh) + ': nothing drawn from the tee');
                const under = px.find(([x, y]) => y > lim);
                if (under) f(cs.id + ' hole ' + holeInRound(hh) + ', camera at ' + cam + ': shows at row ' + under[1] + ', under the line ' + lim);
                // picked up: a burst near it, then nothing
                if (cam === 0) {
                  const pr = Scene.proj(Q.d, Q.x);
                  Scene.t = 5 + FIND_PICK + 0.2; const b = drawn(Q);
                  if (!b.length) f(cs.id + ' hole ' + holeInRound(hh) + ': no burst as it is picked up');
                  for (const [x, y] of b) o.far = Math.max(o.far, Math.hypot(x - pr.x, y - pr.y));
                  Scene.t = 5 + FIND_PICK + 0.55; if (drawn(Q).length) f(cs.id + ' hole ' + holeInRound(hh) + ': still there once picked up');
                  Scene.t = 5; S.dgnRun = { id: B.DGN[0].id }; if (drawn(Q).length) f('drawn in a wager'); S.dgnRun = null;
                }
              }
            }
          }
          window.step = keep;
          if (o.far > 14) f('the burst reaches ' + o.far.toFixed(0) + ' pixels from it');
          if (o.pix < 10) f('only ' + o.pix + ' pixels over ' + o.views + ' views');
        }
        // save repair
        S.finds = 'x'; S.findHole = -3; migrate();
        if (S.finds !== undefined || S.findHole !== undefined) f('repaired to ' + S.finds + ', ' + S.findHole);
        S.finds = 4.6; migrate(); if (S.finds !== 4) f('4.6 finds repaired to ' + S.finds);
      } finally {
        FIND_FORCE = null; HOUR_FORCE = null; OFFLINE = false; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    // on the field where it can be seen, at every phone size: nothing over
    // it but the course
    const seen = [];
    const vp = page.viewportSize();
    try {
      for (const [w, h] of SIZES) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(150);
        const q = await page.evaluate(() => {
          const out = { bad: [], n: 0 };
          const SNAP = JSON.stringify(S);
          try {
            hideSheet(); HOUR_FORCE = 14; S.totalHoles = Math.max(5, S.totalHoles || 0);
            const cv = document.getElementById('hole');
            for (const cs of COURSE_HOME) {
              DEV.course(B.COURSE.indexOf(cs)); hideSheet();
              const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
              for (let hh = first; hh < first + 6; hh++) {
                S.hole = hh; S.chaos = { n: 'Fair' }; S.findHole = 0; FIND_FORCE = hh; Scene.newHole(hh, S.tier); FIND_FORCE = null; Scene.camD = 0;
                const p = Scene.props.find(x => x.kind === 19); if (!p) continue; out.n++;
                const pr = Scene.proj(p.d, p.x), R = cv.getBoundingClientRect();
                const X = R.left + pr.x / VW * R.width, Y = R.top + (pr.y - 1) / VH * R.height;
                const el = document.elementFromPoint(X, Y);
                if (el !== cv) out.bad.push(cs.id + ' hole ' + holeInRound(hh) + ' at ' + Math.round(X) + ', ' + Math.round(Y) + ' under ' + (el ? el.id || el.className || el.tagName : 'nothing'));
              }
            }
          } finally {
            FIND_FORCE = null; HOUR_FORCE = null;
            Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
          }
          return out;
        });
        if (q.bad.length) throw new Error(w + 'x' + h + ': ' + q.bad.slice(0, 6).join('; '));
        seen.push(w + 'x' + h + ' ' + q.n);
      }
    } finally { await page.setViewportSize(vp); }
    return [r.per40 + ' finds and ' + r.sov40 + ' sovereigns every 67 holes; every kind found; live on ' + r.live + ' holes the hash gives',
      'laid on ' + r.laid + ' of ' + r.tried + ' holes asked, all in the rough on his left, clear of play, hazards, woods, water and other holes',
      'paid once; none away, in a catch-up, in a wager, before his first hole or on another hole',
      r.views + ' views, ' + r.pix + ' pixels, none under the ground\'s line; a burst within ' + r.far.toFixed(0) + ' pixels, then gone; none in a wager',
      'on the field, nothing over it: ' + seen.join(', '),
      'a broken save repaired'];
  }
};
