/* A hole never ends before he gets to the green (the user asked).
 *
 * The round is played in the game's own step while the course is drawn,
 * frame by frame, and a hole used to move on the moment its ball was down:
 * with him still out on the fairway (twelve short of the pin on average), or
 * never off the tee on a strong bag, whose holes last about a second.
 *
 *   - played in frames on a home course (its signature holes and their
 *     crossings included), a normal bag and a strong one: every hole moves
 *     on with him up on the green, within 1.5 of the pin; the wait after the
 *     ball is down is short, and never runs to the cap
 *   - the score is the ball's: each hole is carded from when its ball was
 *     down, not from when it moved on
 *   - the cup's sound, the score's banner and the caddie's cheer come as the
 *     ball drops, once, not when the hole moves on
 *   - nothing is played on a hole that is waiting: no swing, no perk
 *   - no wait where nobody sees it: in a catch-up, or behind the saver (the
 *     course not being drawn), the hole moves on as its ball drops
 *   - the wait is paid for: the same hole on the same dice, finished after a
 *     wait, pays its gold and its experience in proportion to the time it
 *     took, and its gear luck the same, so watching earns what being away
 *     does
 */
'use strict';
module.exports = {
  name: 'green',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}, SNAP = JSON.stringify(S), mr = Math.random, raf = window.requestAnimationFrame;
      const pn = performance.now.bind(performance);
      const keep = { fh: window.finishHole, os: window.oneSwing, fs: window.fireSkill, holed: Scene.holed, play: Sfx.play };
      try {
        hideSheet(); window.requestAnimationFrame = () => 0; S.autoClimb = 0; S.saver = 0;
        let fake = pn(); performance.now = () => fake;
        let seed = 4242; Math.random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        // played in frames, the clock driven here; every hole's end noted
        const play = (secs, watch, stop) => {
          const H = [];
          let rec = null, waitingPlays = 0, said = [];
          window.finishHole = function (D) {
            H.push({ h: S.hole, hr: holeInRound(S.hole), par: S.parTime, short: LEN - Scene.camD, done: S.doneT, el: S.elapsed, wait: S.elapsed - S.doneT, cap: S.elapsed - S.doneT >= B.ISLE_HOLD - 0.02,
                     sig: sigKind(S.hole) || '', said: said.filter(x => x.h === S.hole && B.SCORE.some(z => z.n === x.n)) });
            const res = keep.fh.apply(this, arguments);
            const last = H[H.length - 1];
            last.want = scoreFor(last.done / last.par).d;
            // carded: the score the hole's own banner showed (the nine's
            // banner at its end is told apart by its words)
            const own = said.filter(x => x.h === last.h && B.SCORE.some(z => z.n === x.n)).concat(saidLate.filter(x => x.h === last.h));
            last.carded = own.length ? own[own.length - 1].d : null;
            return res;
          };
          window.oneSwing = function () { if (S.doneT != null && S.yards <= 0) waitingPlays++; return keep.os.apply(this, arguments); };
          window.fireSkill = function () { if (S.doneT != null && S.yards <= 0) waitingPlays++; return keep.fs.apply(this, arguments); };
          const saidLate = [];
          Scene.holed = function (sc) { said.push({ h: S.hole, n: sc.n, d: sc.d, down: S.doneT != null && S.yards <= 0, el: S.elapsed, done: S.doneT }); return keep.holed.apply(this, arguments); };
          const dt = 1 / 60;
          for (let i = 0; i < 60 * secs; i++) {
            fake += dt * 1000;
            const D = derive();
            step(dt, D);
            if (watch) Scene.draw(dt, D);
            if (stop && H.length >= stop) break;
          }
          window.finishHole = keep.fh; window.oneSwing = keep.os; window.fireSkill = keep.fs; Scene.holed = keep.holed;
          return { H, waitingPlays };
        };

        // ---- a normal bag on a home course, watched ----
        DEV.course(B.COURSE.findIndex(c => c.slot === 'home')); hideSheet(); Scene.announce = null;
        o.normal = play(150, true);
        // ---- a strong bag, watched ----
        for (const u of B.UPG) S.upg[u.id] = Math.min(capOf(u), 30);
        startHole();
        o.strong = play(50, true);
        // ---- nobody watching: in a catch-up, and behind the saver ----
        // (each from a fresh hole: the last one watched may be part way through its wait)
        QUIET = true; startHole(); o.quiet = play(30, true, 6); QUIET = false;
        startHole(); o.saver = play(30, false, 6);

        // ---- the wait paid for: the same hole, the same dice, with and without ----
        {
          const D = derive();
          let h = S.hole + 1; while (sigKind(h) || isClosing(h)) h++;
          S.hole = h; startHole();
          S.yards = 0; S.holeGold = S.purse * 0.3;
          const T = S.parTime * 0.7, SNAP2 = JSON.stringify(S);
          const fin = (wait, luckAt) => {
            Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP2));
            S.doneT = T; S.elapsed = T + wait;
            const g0 = S.gold;
            // the experience it gives, and the gear roll landing at luckAt
            // times the hole's luck
            let xp = 0; const ax = window.addXp; window.addXp = function (v) { xp += v; return ax.apply(this, arguments); };
            const luck = D.drop;
            Math.random = (() => { let n = 0; return () => (n++ === 0 ? Math.min(0.999, luck * luckAt) : 0.5); })();
            const bagAdd0 = window.bagAdd; let dropped = 0;
            window.bagAdd = function () { dropped++; return false; };
            const hole0 = S.hole;
            try { keep.fh(D); } finally { window.bagAdd = bagAdd0; window.addXp = ax; }
            return { gold: S.gold - g0, xp, dropped, moved: S.hole !== hole0 };
          };
          // Scene.holed and the rest draw their own numbers; the roll wanted is
          // the gear one, so only it is fed (the caddie's word is said first)
          Scene.holed = () => {}; Sfx.play = () => {};
          // the whole hole's gold: what its swings paid before it finished,
          // and what finishing paid
          const sw = S.holeGold;
          const a = fin(0, 1.3), b = fin(T * 0.5, 1.3);
          o.paid = { T, ratio: (sw + b.gold) / (sw + a.gold), xpRatio: a.xp > 0 ? b.xp / a.xp : null, dropNo: a.dropped, dropYes: b.dropped, moved: a.moved && b.moved };
          Scene.holed = keep.holed; Sfx.play = keep.play;
        }
      } finally {
        window.finishHole = keep.fh; window.oneSwing = keep.os; window.fireSkill = keep.fs; Scene.holed = keep.holed; Sfx.play = keep.play;
        performance.now = pn; Math.random = mr; window.requestAnimationFrame = raf;
        QUIET = false; OFFLINE = false; SEASON_FORCE = -1;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    const avg = a => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
    for (const k of ['normal', 'strong']) {
      const H = r[k].H;
      if (H.length < (k === 'normal' ? 10 : 12)) f('only ' + H.length + ' holes were played with a ' + k + ' bag');
      const far = H.filter(h => h.short > 1.5 + 1e-6);
      if (far.length) f('with a ' + k + ' bag ' + far.length + ' of ' + H.length + ' holes moved on with him short of the green: '
        + far.slice(0, 3).map(h => 'hole ' + h.hr + (h.sig ? ' (' + h.sig + ')' : '') + ' ' + h.short.toFixed(1) + ' short').join('; '));
      if (H.some(h => h.cap)) f('with a ' + k + ' bag a hole ran to the wait\'s cap');
      // on a plain hole the rest of his swing, the walk up and a moment
      // there; a signature hole adds its crossing (a flight, a bridge, the
      // stones, a train going by)
      const plain = H.filter(h => !h.sig), mw = avg(plain.map(h => h.wait));
      if (!(mw < (k === 'normal' ? 1.5 : 2.5))) f('with a ' + k + ' bag the wait on a plain hole after the ball was down was ' + mw.toFixed(2) + 's on average: '
        + H.map(h => (h.sig ? h.sig + ' ' : '') + h.wait.toFixed(2)).join(', '));
      const bad = H.filter(h => h.carded !== h.want);
      if (bad.length) f('with a ' + k + ' bag ' + bad.length + ' holes were not carded from when the ball was down');
      if (r[k].waitingPlays) f('with a ' + k + ' bag ' + r[k].waitingPlays + ' swings or perks were played on a hole that was waiting');
      const late = H.filter(h => h.said.length !== 1 || !h.said[0].down || Math.abs(h.said[0].el - h.said[0].done) > 0.02);
      if (late.length) f('with a ' + k + ' bag the score\'s banner came ' + (late[0].said.length !== 1 ? late[0].said.length + ' times' : 'late') + ' on ' + late.length + ' holes');
    }
    const sigs = [...new Set(r.normal.H.map(h => h.sig).filter(Boolean))];
    if (sigs.length < 2) f('the normal bag met only ' + (sigs.join(', ') || 'no') + ' signature holes');
    for (const k of ['quiet', 'saver']) {
      const H = r[k].H;
      if (H.length < 6 || H.some(h => h.wait > 1e-9)) f((k === 'quiet' ? 'in a catch-up' : 'behind the saver') + ' a hole waited: ' + H.map(h => h.wait.toFixed(2)).join(', '));
    }
    const P = r.paid;
    if (!P.moved) f('the hole did not finish in the paid-for test');
    if (Math.abs(P.ratio - 1.5) > 1e-6) f('a hole that waited half as long again as it took paid ' + P.ratio.toFixed(4) + 'x, not 1.5x');
    if (P.xpRatio !== null && Math.abs(P.xpRatio - 1.5) > 1e-6) f('its experience came to ' + P.xpRatio.toFixed(4) + 'x, not 1.5x');
    if (P.dropNo !== 0 || P.dropYes !== 1) f('the gear roll at 1.3 times the hole\'s luck dropped ' + P.dropNo + ' without the wait and ' + P.dropYes + ' with it (want none, then one)');
    const N = r.normal.H, St = r.strong.H;
    const pw = H => avg(H.filter(h => !h.sig).map(h => h.wait)).toFixed(2);
    return ['a normal bag: ' + N.length + ' holes (' + sigs.join(', ') + ' among them), each moved on with him up by the pin; the wait after the ball was down '
        + pw(N) + 's on a plain hole (at most ' + Math.max(...N.map(h => h.wait)).toFixed(2) + 's, a train going by)',
      'a strong bag: ' + St.length + ' holes, each walked from the tee to the pin; wait ' + pw(St) + 's on a plain hole',
      'the score and the banner as the ball drops, nothing played while it waits, no wait unwatched; a wait of half the hole pays 1.5x, experience and gear luck alike'];
  }
};
