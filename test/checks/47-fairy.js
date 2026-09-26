/* The fairy caddie's look: no wings, a float, and a turn now and then.
 *
 * The user asked for the wings to go, for him to float a little up and a
 * little down, and for some fun: now and then he spins, dances, flips,
 * waves, or loops out to the side and back.
 *
 *   - no wings: standing idle, nothing of him is drawn beyond his own box
 *     across (the wings reached half his width past it), he no longer
 *     drifts from side to side, and he floats up and down a pixel or two
 *   - every turn, at every point of it, with the golfer at every stage of
 *     his swing and walking: not one of the caddie's pixels lands on one of
 *     the golfer's, and the box the game keeps for him holds all of him
 *     across (the caddie check holds that box clear of the golfer)
 *   - each turn shows: half way through he is drawn differently from
 *     standing, and he is back as he was at the end
 *   - they come round on their own: over twenty minutes on screen, every
 *     kind, never the same one twice running, and twelve to twenty eight
 *     seconds between one ending and the next; none starts while he has his
 *     say, during a wager, or while a perk goes off, and a perk going off
 *     ends one
 *   - chosen off a random stream of his own: drawing the course never calls
 *     Math.random, so the numbers the round is played on stay put
 *   - the developer menu starts any of them
 *   - every caddie look with an effect has a trick of its own (the user
 *     asked, after the dearest three): tried and held as below;
 *   - the three dearest caddies each have a trick of their own (the Divine
 *     soars, the Demonic blazes, the Ascended blinks through the void):
 *     tried as above in that caddie, never a pixel on the golfer (their
 *     wings and light always spread past the box kept for him); each comes round on its own for its caddie and never for
 *     another, and nobody else can be made to take it
 */
'use strict';
module.exports = {
  name: 'fairy',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}, SNAP = JSON.stringify(S), mr = Math.random;
      let keep = SPRITE.caddie;
      hideSheet(); QUIET = true;
      const D = derive();
      try {
        const px = () => Scene.b.getImageData(0, 0, VW, VH).data;
        // the golfer alone, then with his caddie: the caddie's pixels are
        // the ones that differ
        const shot = () => {
          SPRITE.caddie = null; Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); const g = px();
          SPRITE.caddie = keep; Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D); const a = px();
          return { g, a, f: Object.assign({}, Scene._fairy) };
        };
        // how many of his pixels, how many on the golfer, and how many out
        // past the box kept for him: none to the left (the side the wings
        // grew on), one to the right, where his dust can round up a pixel
        const his = (s, slack, edge, idle) => {
          let n = 0, on = 0, out = 0, near = 0;
          for (let i = 0; i < s.a.length; i += 4) {
            if (s.a[i] === s.g[i] && s.a[i + 1] === s.g[i + 1] && s.a[i + 2] === s.g[i + 2] && s.a[i + 3] === s.g[i + 3]) continue;
            const x = (i >> 2) % VW;
            n++;
            if (s.g[i + 3]) on++;
            if (x < s.f.x - (slack || 0) || x > s.f.x + s.f.w) out++;
            if (edge !== undefined && x > edge && !(idle && s.a[i] === idle.a[i] && s.a[i + 1] === idle.a[i + 1] && s.a[i + 2] === idle.a[i + 2] && s.a[i + 3] === idle.a[i + 3])) near++;
          }
          return { n, on, out, near };
        };
        const pose = (walking, ph) => {
          Scene.walkOn = walking; Scene.walkPh = 0.3;
          Scene.swingT = ph > 0 ? Scene.swingDur * (1 - ph) : 0;
        };
        Scene.fairySay = null; Scene.fairyCast = null; Scene.fairyMove = null; Scene.bless = null;

        // ---- no wings, no drift, a float ----
        pose(false, 0);
        const t0 = Scene.t, xs = [], ys = [];
        o.idleOut = 0;
        for (let i = 0; i < 60; i++) {
          Scene.t = t0 + i * 0.05;
          const s = shot(), h = his(s);
          o.idleOut = Math.max(o.idleOut, h.out);
          xs.push(s.f.x); ys.push(s.f.y); o.fh = s.f.h;
        }
        o.xRange = Math.max(...xs) - Math.min(...xs);
        o.yRange = Math.max(...ys) - Math.min(...ys);

        // ---- every turn, at every point, beside every pose of the golfer ----
        Scene.t = t0;
        const idle = shot();
        o.hits = []; o.lies = []; o.near = []; o.poses = 0; o.shows = {}; o.back = {};
        // (a caddie's own trick is tried in that caddie)
        const wear = id => { S.styleOwn['c:' + id] = 1; S.caddie = id; buildSprites(); keep = SPRITE.caddie; };
        // (a trick is its caddie look's: that look's effect names it)
        const whose = fx => fx ? (B.CADDIES.find(cd => cd.fx === fx) || {}).id : 'bib';
        for (const m of FAIRY_MOVES) {
          wear(whose(m.only));
          // (standing, in this caddie)
          pose(false, 0); Scene.fairyMove = null; Scene.t = t0; const idleM = shot();
          for (const [walking, ph] of [[false, 0], [false, 0.2], [false, 0.4], [false, 0.6], [false, 0.8], [false, 1], [true, 0]]) {
            pose(walking, ph);
            for (let k = 0; k < 24; k++) {
              const q = k / 24;
              Scene.t = t0; Scene.fairyMove = { kind: m.id, t0: t0 - q * m.dur, dur: m.dur };
              const s = shot(), h = his(s, 1);      // a rolled or squashed pixel can round out by one
              o.poses++;
              if (h.on) o.hits.push(m.id + ' at ' + q.toFixed(2) + (walking ? ' walking' : ' swing ' + ph) + ': ' + h.on + ' pixels on the golfer');
              // (the dearest caddies' own effects, wings and light, have always
              // spread past the box kept for him; for their tricks, never on
              // the golfer is what is held)
              if (h.out && !m.only) o.lies.push(m.id + ' at ' + q.toFixed(2) + ': ' + h.out + ' pixels outside the box it keeps');
            }
          }
          // a trick's own pieces, drawn alone: on his far side, never past his
          // own edge towards the golfer, whether or not they reach him
          if (FAIRY_MOVES.find(x => x.id === m.id).only) {
            const W = 40, H = 60, X = 60, Y = 40, cv = document.createElement('canvas'); cv.width = 200; cv.height = 200;
            const g = cv.getContext('2d');
            for (let k = 0; k < 48; k++) {
              const q = k / 48, T = q * m.dur, P = fairyPose(m.id, q, T, W, H);
              if (!P.bits) break;
              g.clearRect(0, 0, 200, 200); Scene.caddieBits(g, X + P.dx, Y + P.dy, W, H, P, { q, T });
              const d = g.getImageData(0, 0, 200, 200).data; let n = 0;
              for (let i = 3; i < d.length; i += 4) if (d[i] && ((i >> 2) % 200) >= X + W) n++;
              if (n) { o.near.push(m.id + ' at ' + q.toFixed(2) + ': ' + n + ' pixels past his edge towards the golfer'); break; }
            }
          }
          // half way, against standing, the golfer at address
          pose(false, 0);
          const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4)
            if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2] || a[i + 3] !== b[i + 3]) n++; return n; };
          Scene.t = t0; Scene.fairyMove = { kind: m.id, t0: t0 - 0.5 * m.dur, dur: m.dur };
          o.shows[m.id] = diff(shot().a, idleM.a);
          // and over at the end: as he was
          Scene.t = t0; Scene.fairyMove = { kind: m.id, t0: t0 - m.dur - 0.001, dur: m.dur };
          const n = diff(shot().a, idleM.a);
          o.back[m.id] = Scene.fairyMove ? 'still going' : n;
        }
        Scene.fairyMove = null; wear('bib'); pose(false, 0);

        // ---- they come round on their own, off his own random numbers ----
        let calls = 0;
        Math.random = function () { calls++; return mr(); };
        Scene.moveT = undefined; Scene._lastMove = undefined; Scene._moveRnd = undefined;
        const starts = []; let last = null, t = 0;
        for (let i = 0; i < 20 * 60 * 10; i++) {
          Scene.t += 0.1; t += 0.1;
          Scene.tickMove(0.1);
          const M = Scene.fairyMove;
          if (M && M !== last) { starts.push({ t, kind: M.kind, dur: M.dur }); last = M; }
        }
        Math.random = mr;
        o.calls = calls;
        o.starts = starts.map(x => x.kind);
        o.first = starts.length ? +starts[0].t.toFixed(1) : null;
        o.gaps = starts.slice(1).map((x, i) => +(x.t - starts[i].t - starts[i].dur).toFixed(1));
        o.kinds = [...new Set(o.starts)].sort().join();
        o.twice = o.starts.filter((k, i) => i && k === o.starts[i - 1]).length;
        o.plainKinds = fairyMoves().map(m => m.id).sort().join();
        // and each dearest caddie's own, for him and no one else
        o.own = {};
        for (const fx of [...new Set(FAIRY_MOVES.filter(m => m.only).map(m => m.only))]) {
          const id = fx;
          wear(whose(fx)); Scene.moveT = undefined; Scene._lastMove = undefined; Scene._moveRnd = undefined; Scene.fairyMove = null;
          const seen = new Set(); let lastM = null;
          for (let i = 0; i < 20 * 60 * 10; i++) { Scene.t += 0.1; Scene.tickMove(0.1); const M = Scene.fairyMove; if (M && M !== lastM) { seen.add(M.kind); lastM = M; } }
          o.own[id] = [...seen].filter(k => (FAIRY_MOVES.find(m => m.id === k) || {}).only).sort().join();
        }
        o.ownWant = {}; FAIRY_MOVES.filter(m => m.only).forEach(m => { o.ownWant[m.only] = m.id; });
        o.plainOwn = o.starts.some(k => (FAIRY_MOVES.find(m => m.id === k) || {}).only);
        wear('bib'); Scene.fairyMove = null;
        Scene.fairyMoveGo('soar'); o.plainSoar = !!Scene.fairyMove;
        Scene.fairyMove = null; Scene.fairyMoveGo('toss'); o.plainSoar = o.plainSoar || !!Scene.fairyMove;
        // (and one caddie cannot be made to take another's)
        wear(whose('disco')); Scene.fairyMove = null; Scene.fairyMoveGo('slip'); o.plainSoar = o.plainSoar || !!Scene.fairyMove;

        // ---- but not while he talks, in a wager, or with a perk going off ----
        const quiet = (setup, secs) => {
          Scene.fairyMove = null; Scene.moveT = 0.5; let started = 0;
          for (let i = 0; i < secs * 10; i++) { setup(); Scene.t += 0.1; Scene.tickMove(0.1); if (Scene.fairyMove) started++; }
          return started;
        };
        o.duringSay = quiet(() => { Scene.fairySay = { kind: 'quip', word: 'X', t0: Scene.t, dur: 5 }; }, 20);
        Scene.fairySay = null;
        o.duringCast = quiet(() => { Scene.fairyCast = { t: 0, t0: Scene.t, word: 'X' }; }, 20);
        Scene.fairyCast = null;
        S.dgnRun = { id: 'water' };
        o.duringWager = quiet(() => {}, 20);
        S.dgnRun = null;
        // a perk going off ends a turn
        Scene.fairyMoveGo('dance'); Scene.fairyCast = { t: 0, t0: Scene.t, word: 'X' };
        o.castEnds = Scene.fairyMoveNow() === null && Scene.fairyMove === null;
        Scene.fairyCast = null;

        // ---- the developer menu ----
        o.dev = FAIRY_MOVES.map(m => { wear(whose(m.only)); Scene.fairyMove = null; DEV.move(m.id); return Scene.fairyMove && Scene.fairyMove.kind; }).join();
        wear('bib');
        o.ids = FAIRY_MOVES.map(m => m.id).join();
      } finally {
        Math.random = mr; SPRITE.caddie = keep; QUIET = false;
        Scene.fairyMove = null; Scene.fairySay = null; Scene.fairyCast = null; Scene.walkOn = false; Scene.swingT = 0;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });

    const f = m => { throw new Error(m); };
    if (r.idleOut) f('standing idle, ' + r.idleOut + ' of the caddie\'s pixels are drawn out past his own box (wings?)');
    if (r.xRange) f('standing idle he moves ' + r.xRange + 'px from side to side; he is meant to float up and down only');
    if (!(r.yRange >= 1 && r.yRange <= Math.ceil(r.fh * 0.25)))
      f('he floats ' + r.yRange + 'px up and down, where a little is 1 to ' + Math.ceil(r.fh * 0.25) + ' (he is ' + r.fh + 'px tall)');
    if (r.hits.length) f('the caddie touches the golfer in ' + r.hits.length + ' of ' + r.poses + ' poses: ' + r.hits.slice(0, 20).join('; '));
    if (r.near.length) f('a turn reaches past his edge towards the golfer in ' + r.near.length + ' poses: ' + r.near.slice(0, 6).join('; '));
    if (r.lies.length) f('the box kept for the caddie does not hold him in ' + r.lies.length + ' poses: ' + r.lies.slice(0, 3).join('; '));
    for (const id of Object.keys(r.shows)) {
      if (!(r.shows[id] >= 10)) f('half way through the ' + id + ' he looks as he does standing (' + r.shows[id] + ' pixels differ)');
      if (r.back[id] !== 0) f('once the ' + id + ' is over he is not as he was: ' + r.back[id] + ' pixels differ');
    }
    if (r.calls) f('the caddie\'s turns called Math.random ' + r.calls + ' times, moving the numbers the round is played on');
    if (r.kinds !== r.plainKinds) f('in twenty minutes the turns taken were ' + r.kinds + ', not all of ' + r.plainKinds);
    if (r.plainOwn) f('a plain caddie took another caddie\'s trick: ' + r.kinds);
    for (const id in r.ownWant) if (r.own[id] !== r.ownWant[id]) f('in twenty minutes the ' + id + ' caddie\'s own tricks were "' + r.own[id] + '", not ' + r.ownWant[id]);
    if (r.plainSoar) f('a caddie could be made to take a trick that is not his');
    if (r.twice) f('the same turn came twice running ' + r.twice + ' times: ' + r.starts.join(' '));
    if (!(r.first >= 8 && r.first <= 18.2)) f('the first turn came after ' + r.first + 's, not 8 to 18');
    if (!r.gaps.length || r.gaps.some(g => g < 11.9 || g > 28.2)) f('between turns: ' + r.gaps.join(', ') + 's, not 12 to 28');
    if (r.duringSay || r.duringCast || r.duringWager)
      f('a turn started while he had his say (' + r.duringSay + '), during a perk (' + r.duringCast + ') or in a wager (' + r.duringWager + ')');
    if (!r.castEnds) f('a perk going off did not end his turn');
    if (r.dev !== r.ids) f('the developer menu started ' + r.dev + ', not ' + r.ids);
    return ['no wings: idle he stays in his box and in place across, floating ' + r.yRange + 'px up and down',
      r.poses + ' poses of ' + r.ids.split(',').length + ' turns (' + r.ids.replace(/,/g, ', ') + ') beside every stage of the swing and the walk: never a pixel on the golfer',
      'in twenty minutes: ' + r.starts.length + ' turns, all kinds, never twice running, ' + Math.min(...r.gaps) + '-' + Math.max(...r.gaps)
        + 's apart; none while he talks, in a wager or during a perk; no Math.random',
      'each look\'s own: ' + Object.entries(r.own).map(([k, v]) => k + ' ' + v).join(', ') + ', no one else\'s'];
  }
};
