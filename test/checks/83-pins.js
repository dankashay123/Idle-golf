/* The pin moves round the green (the user asked: "every flag/hole on the
 * green is in the exact same spot every time ... add 9 different pin
 * positions and have the courses cycle through them"):
 *
 *   - nine positions, all different: front, middle and back, each left,
 *     middle and right, every one well inside the green's edge and none on
 *     his line (he would stand on the cup)
 *   - over a round every hole of the nine gets each in turn: all nine used,
 *     never the same on two holes running, and the same hole on the next
 *     day of the event somewhere else
 *   - the flag is drawn where the cup is, the putt rolls to it, and an ace
 *     goes in there
 *   - a wager's green keeps its pin in the middle, on his line
 */
'use strict';
module.exports = {
  name: 'pins',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], used: 0, flags: 0 }, keep = window.step;
      const f = m => { if (o.fails.length < 12) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        const key = p => p.join(',');
        if (new Set(PINS.map(key)).size !== 9) f('the nine pin positions are not all different');
        for (const [dd, x] of PINS) {
          const gw = 2.35 * Math.sqrt(Math.max(0, 1 - (dd / 7.5) * (dd / 7.5)));
          if (Math.abs(x) > gw - 0.6 || Math.abs(dd) > 7.5 - 2.5) f('a pin at ' + dd + ', ' + x + ' is by the green\'s edge');
          if (Math.abs(x) < 0.4) f('a pin at ' + dd + ', ' + x + ' is on his line');
        }
        const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
        const seen = new Set();
        for (let h = first; h < first + B.ROUND; h++) {
          const a = pinFor(h), b = pinFor(h + 1), next = pinFor(h + B.ROUND);
          seen.add(key(a));
          if (h + 1 < first + B.ROUND && key(a) === key(b)) f('holes ' + holeInRound(h) + ' and ' + holeInRound(h + 1) + ' have the same pin');
          if (key(a) === key(next)) f('hole ' + holeInRound(h) + ' has the same pin the next day');
        }
        o.used = seen.size;
        if (seen.size < 9) f('a round uses only ' + seen.size + ' of the nine pins');
        // drawn and played where it is
        S.outfit = 'classic'; buildSprites(); FROST_FORCE = 0;
        const D = derive();
        for (let i = 0; i < 9; i++) {
          S.hole = first + i; startHole(); Scene.announce = null;
          const P = Scene.pin, pd = Scene.pinD(), px = Scene.pinX();
          if (pd !== LEN + P[0] || px !== P[1]) f('hole ' + (i + 1) + ': the cup is not at its pin');
          Scene.camD = pd - 14; Scene.walkTo = Scene.camD; Scene.swingT = 0; Scene.balls = []; Scene.restBall = null; Scene.cupT = 0;
          Scene.draw(0, D);
          // the flag: its red about the top of the pole at the pin
          const p = Scene.proj(pd, px), h = Math.max(4, Math.round(B_FLAG * US * p.s)), c = Scene.b;
          // (either side of the pole: it flies the way the wind blows)
          const a = c.getImageData(Math.round(p.x - h * 0.8) - 2, Math.round(p.y - h) - 1, Math.round(h * 1.6) + 4, Math.round(h * 0.5) + 2).data;
          let red = 0; for (let k = 0; k < a.length; k += 4) if (a[k] > 180 && a[k + 1] < 110 && a[k + 2] < 110) red++;
          if (red >= 3) o.flags++; else f('hole ' + (i + 1) + ': no flag at its pin (' + red + ' red pixels)');
          // the putt ends in the cup; an ace's ball goes to it
          Scene.putt = { t0: 0, d0: pd - B_GREEN_STAND, hit: 1 };
          const e = Scene.puttBall(PUTT_HIT + PUTT_ROLL);
          if (Math.abs(e.d - pd) > 0.01 || Math.abs(e.lat - px) > 0.01) f('hole ' + (i + 1) + ': the putt stops at ' + e.d.toFixed(2) + ', ' + e.lat.toFixed(2) + ', the cup at ' + pd + ', ' + px);
          Scene.putt = null;
          S.doneT = S.parTime * 0.05; S.yards = 0; Scene.camD = 0; Scene.walkTo = 0;
          Scene.balls.push({ d0: 0, dist: 12, t: 0.2, dur: 0.6, el: null, crit: false, seed: 1, lat0: 0.42, lat: 0, cup: 0, tee: 1 });
          Scene.drawBalls(0); const bl = Scene.balls[0];
          if (!bl.cup || Math.abs(bl.d0 + bl.dist - pd) > 0.01 || bl.lat !== px) f('hole ' + (i + 1) + ': an ace went to ' + (bl.d0 + bl.dist).toFixed(2) + ', ' + bl.lat);
          Scene.balls = []; S.doneT = null;
        }
        // a wager's green: the middle, on his line
        const dg = B.DGN.find(x => x.id === 'twilight'); S.dgnKeys[dg.id] = 3; setView('dgn'); startDgn(dg); hideSheet();
        if (Scene.pinD() !== LEN || Scene.pinX() !== 0) f('a wager\'s pin is not in the middle');
        delete S.dgnRun;
      } finally {
        window.step = keep; FROST_FORCE = null; delete S.dgnRun;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['nine pins, all inside the green and off his line; a round uses all ' + r.used + ', never the same twice running or on the same hole the next day',
      'the flag at the pin on ' + r.flags + ' of 9 holes, the putt and an ace into the cup there; a wager\'s pin in the middle'];
  }
};
