/* Ace plaques (the user picked them from the menu): a small board by the tee
 * that says how many aces you have had on that hole, the course and its
 * number in the round.
 *
 *   - an ace finished on a hole counts on that hole (its course and number),
 *     every one, live or away; a birdie does not, nor an ace in a wager
 *   - the plaque stands on that hole when it is played again, on no other,
 *     and none before the first ace; none in a wager
 *   - it says it: "1 ACE", "3 ACES", a big count in words that fit, drawn
 *     alone over a blank in its own lettering, at 320, 390, 440 and on its
 *     side, from the tee, clear of the buttons down the stage's left
 *   - nothing of it under the ground's line in front of it, the camera
 *     walking from the tee
 *   - a broken save is repaired
 */
'use strict';
module.exports = {
  name: 'aceplaques',
  async run(page) {
    const one = () => page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); }, keep = window.step;
      const hex = (d, i) => '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
      try {
        hideSheet(); QUIET = true; window.step = () => {}; HOUR_FORCE = 14; FROST_FORCE = 0; S.dawnDusk = 0; S.aceAt = {};
        const c = Scene.b, D = derive();
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        const alone = props => { const was = Scene.props; blank(); Scene.props = props; Scene.drawProps(); Scene.props = was; };
        const lit = () => { const d = c.getImageData(0, 0, VW, VH).data; let n = 0, txt = 0, x0 = VW, y0 = VH, x1 = -1, y1 = -1;
          for (let i = 0; i < d.length; i += 4) { if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue; n++;
            const x = (i / 4) % VW, y = (i / 4 / VW) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
            const hx = hex(d, i); if (hx === '#FFE9A8' || hx === '#F2C21E') txt++; }
          return { n, txt, box: [x0, y0, x1, y1] }; };
        // ---- an ace counts on its hole ----
        const ai = B.SCORE.findIndex(s => s.d === -4), bi = B.SCORE.findIndex(s => s.d === -1);
        const finish = (h, i, away) => { S.hole = h; S.scores = []; startHole(); hideSheet(); S.chaos = { n: 'Fair' };
          S.doneT = (i === ai ? B.SCORE[i].r * 0.5 : (B.SCORE[i].r + B.SCORE[i - 1].r) / 2) * S.parTime; OFFLINE = !!away;
          finishHole(D); OFFLINE = false; S.doneT = null; };
        const h0 = S.hole + 3, k0 = aceKey(h0);
        finish(h0, ai); finish(h0, ai, true); finish(h0, bi);
        if (S.aceAt[k0] !== 2) f('two aces (one live, one away) and a birdie on hole ' + h0 + ' counted ' + S.aceAt[k0]);
        if (Object.keys(S.aceAt).length !== 1) f('aces counted on other holes: ' + JSON.stringify(S.aceAt));
        // (the same hole played again)
        const h1 = h0;
        { S.dgnRun = { id: B.DGN[0].id }; finish(h0, ai); S.dgnRun = null; startHole();
          if (S.aceAt[k0] !== 2) f('an ace in a wager counted (' + S.aceAt[k0] + ')'); }
        // ---- standing on that hole, none on another, none before ----
        const plaq = () => Scene.props.filter(p => p.kind === 24);
        const view = (h, cam) => { S.hole = h; S.chaos = { n: 'Fair' }; Scene.newHole(h, S.tier); Scene.announce = null; Scene.balls = []; Scene.restBall = null;
          Scene.camD = cam || 0; Scene.walkTo = Scene.camD; Scene.draw(1 / 30, D); alone(plaq()); return lit(); };
        o.at = view(h1);
        if (!(o.at.n > 30)) f('the plaque on hole ' + h1 + ' drew ' + o.at.n + ' pixels');
        if (!(o.at.txt >= 8)) f('the plaque on hole ' + h1 + ' showed ' + o.at.txt + ' pixels of its words');
        const other = view(h1 + 1); if (other.n) f('a plaque on a hole never aced: ' + other.n + ' pixels');
        { const was = S.aceAt; S.aceAt = {}; const none = view(h1); S.aceAt = was; if (none.n) f('a plaque before any ace: ' + none.n + ' pixels'); }
        { view(h1); S.dgnRun = { id: B.DGN[0].id }; alone(plaq()); const w = lit(); S.dgnRun = null; if (w.n) f('a plaque in a wager: ' + w.n + ' pixels'); }
        // ---- it says it, at any count ----
        for (const n of [1, 3, 47, 1234]) {
          S.aceAt[k0] = n; view(h1);
          const P = plaq()[0]; if (!P) { f('no plaque laid'); break; }
          // (the words picked, drawn as the board draws them)
          const want = n === 1 ? '1 ACE' : n + ' ACES';
          const tl = Scene.proj(P.d, P.x - 0.5, 1.0), br = Scene.proj(P.d, P.x + 0.5, 0.4), w = Math.round(br.x - tl.x);
          // (on a stage too small for the words, a gold pip an ace: the
          // harness's stage is half a phone's)
          const r = lit(), d = c.getImageData(0, 0, VW, VH).data; let pip = 0; for (let i = 0; i < d.length; i += 4) if (hex(d, i) === '#F2C21E') pip++;
          const fits = textW(String(n), 1) <= w - 4 && Math.round(br.y - tl.y) - 2 >= FHS - 1;
          if (fits && !(r.txt - pip >= 8)) f(n + ' aces on a board ' + w + ' wide showed ' + (r.txt - pip) + ' pixels of words');
          if (!fits && !(pip >= Math.min(5, n))) f(n + ' aces on a board too small for words showed ' + pip + ' pixels of pips');
          if (textW(want, 1) <= w - 4 && Math.round(br.y - tl.y) - 2 >= FHS - 1 && n < 1000 && !(r.txt - pip >= textW(want, 1))) f('"' + want + '" fits a board ' + w + ' wide but showed ' + (r.txt - pip) + ' pixels of words');
          o['n' + n] = (fits ? 'words ' : 'pips ') + (r.txt) + ' (' + w + ' wide)';
        }
        S.aceAt[k0] = 3;
        // ---- clear of the buttons down the left ----
        { view(h1); const r = lit(), cv = Scene.cv, cr = cv.getBoundingClientRect(), k = cr.height / VH;
          for (const id of ['setBtn', 'calBtn', 'shopBtn', 'roomBtn', 'perkBtn', 'hudClimb', 'holeMap']) {
            const e = document.getElementById(id); if (!e || !e.offsetParent) continue; const b = e.getBoundingClientRect();
            const bx = [(b.left - cr.left) / k, (b.top - cr.top) / k, (b.right - cr.left) / k, (b.bottom - cr.top) / k];
            if (bx[0] < r.box[2] && bx[2] > r.box[0] && bx[1] < r.box[3] && bx[3] > r.box[1]) f('at ' + VW + 'x' + VH + ' the plaque from the tee lies under ' + id);
          }
          o.box = r.box; }
        // ---- nothing under the ground's line ----
        o.views = 0;
        for (let hh = h1, m = 0; m < 6; hh += B.ROUND, m++) {
          const k = aceKey(hh); S.aceAt[k] = 5;
          for (const cam of [0, 0.6, 1.2, 1.8, 2.4]) {
            const r = view(hh, cam), P = plaq()[0]; if (!P) continue; o.views++;
            const lim = Scene.clipAt(P.d) + 1;
            if (r.n && r.box[3] > lim) f('hole ' + hh + ' from ' + cam + ': the plaque reaches row ' + r.box[3] + ', below the ground\'s line ' + Math.round(lim));
          }
        }
        // ---- save repair ----
        S.aceAt = { 'x:3': 2, 'bad key': 4, 'y:4': -1, 'z:5': 2.6 }; migrate();
        if (JSON.stringify(S.aceAt) !== '{"x:3":2,"z:5":2}') f('repaired to ' + JSON.stringify(S.aceAt));
        S.aceAt = [1]; migrate(); if (S.aceAt !== undefined) f('a list for the aces was kept');
      } finally {
        HOUR_FORCE = null; FROST_FORCE = null; OFFLINE = false; window.step = keep; delete S.dgnRun;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); QUIET = false; hideSheet(); startHole();
      }
      return o;
    });
    const out = [];
    for (const [w, h] of [[320, 640], [390, 844], [440, 956], [844, 390]]) {
      await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(250);
      const r = await one();
      if (r.fails.length) throw new Error(w + 'x' + h + ': ' + r.fails.join('\n'));
      out.push(w + 'x' + h + ' ' + r.at.n + ' pixels, ' + [r.n1, r.n3, r.n47, r.n1234].join('/'));
    }
    return ['two aces (live and away) counted on their hole, a birdie and a wager\'s ace not',
      'the plaque on that hole when played again, none elsewhere, before an ace or in a wager',
      'it reads at every count, clear of the left buttons: ' + out.join('; '),
      'never under the ground\'s line walking from the tee; a broken save repaired'];
  }
};
