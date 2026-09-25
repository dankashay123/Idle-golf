/* A happy dance on a great hole (the user asked).
 *
 * When a hole goes down well the caddie celebrates with his turns, chosen
 * by the score: two flips and a cartwheel for an ace, a flip and a
 * cartwheel for an albatross, a cartwheel for an eagle, and for one birdie
 * in three a dance or a spin.
 *
 *   - each score, played out through the real loop (the hole ends in step,
 *     the frames are drawn): the turns in that order, each straight on from
 *     the last, and nothing for a par or worse
 *   - a birdie dances about one time in three (over 300), only a dance or a
 *     spin
 *   - none in a catch-up or a wager; a perk going off mid-dance ends the
 *     rest of it; no turn of his own for twelve seconds after
 *   - off his own random stream: the dance never calls Math.random, so the
 *     numbers the round is played on stay put
 */
'use strict';
module.exports = {
  name: 'dance',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}, SNAP = JSON.stringify(S), mr = Math.random;
      try {
        hideSheet(); QUIET = false; S.autoClimb = 0;
        const at = d => { for (let q = 0.01; q < 4; q += 0.005) if (scoreFor(q).d === d) return q; return null; };
        // a plain hole: no signature hole, whose crossing holds the end
        const plain = () => { let h = S.hole; while (sigKind(h)) h++; return h; };
        const clear = () => { Scene.fairyMove = null; Scene.fairyQueue = null; Scene.fairySay = null; Scene.fairyCast = null; Scene.moveT = 999; };
        // the hole ends in the loop at the time that cards d; then five
        // seconds of frames, noting each turn as it starts
        // (the dance comes as his putt drops; a turn of his own is made to fall
        // due just then: a dance puts it off, so none should show after it)
        const play = d => {
          S.hole = plain(); startHole(); clear();
          const D = derive();
          S.parTime = 1000; S.yards = 0; S.doneT = null; S.elapsed = S.parTime * at(d) - 0.001;
          // how often the hole's end asks for a dance, and how many of the
          // round's random numbers the dance takes (none)
          const hd = Scene.happyDance; let asked = 0, calls = 0;
          Scene.happyDance = function (dd) { if (S.hole === h0) asked++; Math.random = () => { calls++; return mr(); };
            try { return hd.call(this, dd); } finally { Math.random = mr; } };
          const h0 = S.hole;
          step(0.002, D);
          // (the hole now waits for him to walk up to the green, so the round
          // plays on in the frames: the dance starts as the ball drops)
          const seen = [];
          let ended = S.hole !== h0;
          let last = null;
          try {
          for (let i = 0; i < 160; i++) {
            if (d <= -2 && S.hole === h0 && Scene.putt && !Scene.cupT && Scene.t - Scene.putt.t0 > PUTT_HIT) Scene.moveT = 0.12;
            const Dn = derive(); step(0.05, Dn); Scene.draw(0.05, Dn);
            if (S.hole !== h0) ended = true;
            const M = Scene.fairyMove, key = M ? M.kind + '@' + M.t0.toFixed(3) : null;
            if (key && key !== last) seen.push(M.kind);
            last = key;
          }
          } finally { Scene.happyDance = hd; Math.random = mr; }
          return { seen: seen.join(','), ended, asked, calls, moveT: Scene.moveT };
        };
        o.ace = play(-4); o.alb = play(-3); o.eagle = play(-2); o.par = play(0); o.bogey = play(1);
        // the turns straight on from each other: the second flip of an ace
        // starts the frame the first ends
        {
          S.hole = plain(); startHole(); clear();
          Scene.happyDance(-4);
          const t0 = Scene.t, first = Scene.fairyMove.dur;
          let gap = null;
          for (let i = 1; i < 60 && gap === null; i++) {
            Scene.t = t0 + i * 0.05; Scene.tickMove(0.05);
            if (Scene.fairyMove && Scene.fairyMove.t0 > t0) gap = Scene.t - (t0 + first);
          }
          o.gap = gap;
        }
        // a birdie, 300 times
        {
          const kinds = {}; let n = 0;
          for (let i = 0; i < 300; i++) {
            clear(); Scene.happyDance(-1);
            if (Scene.fairyMove) { n++; kinds[Scene.fairyMove.kind] = 1; }
          }
          o.birdie = n; o.birdieKinds = Object.keys(kinds).sort().join(',');
          let calls = 0; Math.random = () => { calls++; return mr(); };
          try { for (let i = 0; i < 50; i++) { clear(); Scene.happyDance(-1); Scene.happyDance(-2); Scene.happyDance(-4); } }
          finally { Math.random = mr; }
          o.danceCalls = calls;
        }
        // not in a catch-up or a wager
        clear(); QUIET = true; Scene.happyDance(-2); o.quiet = !!Scene.fairyMove; QUIET = false;
        clear(); S.dgnRun = { id: 'water' }; Scene.happyDance(-2); o.wager = !!Scene.fairyMove;
        // and a dance begun before a wager goes no further in it
        S.dgnRun = null; clear(); Scene.happyDance(-4); S.dgnRun = { id: 'water' };
        Scene.fairyMove = null; Scene.tickMove(0.05); o.wagerQueue = !!Scene.fairyMove; S.dgnRun = null;
        // a perk going off ends the rest of it
        clear(); Scene.happyDance(-4);
        Scene.fairyCast = { t0: Scene.t }; Scene.fairyMoveNow();
        Scene.fairyCast = null; Scene.tickMove(0.05);
        o.perkEnds = !Scene.fairyMove && !(Scene.fairyQueue && Scene.fairyQueue.length);
      } finally {
        Math.random = mr; QUIET = false; OFFLINE = false; S.dgnRun = null;
        Scene.fairyMove = null; Scene.fairyQueue = null; Scene.fairyCast = null; Scene.moveT = undefined;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    const want = { ace: 'flip,flip,cartwheel', alb: 'flip,cartwheel', eagle: 'cartwheel', par: '', bogey: '' };
    for (const k in want) {
      const p = r[k];
      if (!p.ended) f('the ' + k + ' hole never ended in the loop');
      if (p.seen !== want[k]) f('a ' + k + ' got the turns "' + p.seen + '", not "' + want[k] + '"');
      if (p.asked !== 1 || p.calls) f('the ' + k + ' hole\'s end asked for ' + p.asked + ' dances, which called Math.random ' + p.calls + ' times');
    }
    if (!(r.gap !== null && r.gap >= -0.001 && r.gap <= 0.051)) f('the second flip of an ace came ' + r.gap + 's after the first ended');
    if (!(r.birdie >= 70 && r.birdie <= 130) || r.birdieKinds !== 'dance,spin') f('300 birdies danced ' + r.birdie + ' times, as ' + r.birdieKinds);
    if (r.danceCalls) f('the happy dance called Math.random ' + r.danceCalls + ' times');
    if (r.quiet || r.wager || r.wagerQueue) f('a dance in a catch-up (' + r.quiet + ') or a wager (' + r.wager + ', ' + r.wagerQueue + ')');
    if (!r.perkEnds) f('a perk going off did not end the rest of the dance');
    return ['an ace ' + r.ace.seen + ', an albatross ' + r.alb.seen + ', an eagle ' + r.eagle.seen + ', par and bogey nothing, each played out in the loop',
      r.birdie + ' dances in 300 birdies (' + r.birdieKinds + '); none in a catch-up or a wager; a perk ends it; Math.random untouched'];
  }
};
