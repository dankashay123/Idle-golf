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
          let rec = null, waitingPlays = 0, said = [], nearCup = 0;
          window.finishHole = function (D) {
            H.push({ h: S.hole, hr: holeInRound(S.hole), par: S.parTime, short: LEN - Scene.camD, done: S.doneT, el: S.elapsed, wait: S.elapsed - S.doneT, cap: S.elapsed - S.doneT >= B.ISLE_HOLD - 0.02,
                     sig: sigKind(S.hole) || '', said: said.filter(x => x.h === S.hole && B.SCORE.some(z => z.n === x.n)),
                     putt: !!(Scene.putt && Scene.putt.hit), tocks: tocks.filter(x => x === S.hole).length, cup: !!Scene.cupT,
                     cups: cups.filter(x => x.h === S.hole), puttDur: Scene.putt && Scene.cupT ? Scene.cupT - Scene.putt.t0 : null });
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
          Scene.holed = function (sc) { said.push({ h: S.hole, n: sc.n, d: sc.d, down: S.doneT != null && S.yards <= 0, el: S.elapsed, done: S.doneT,
            cupAgo: Scene.cupT ? Scene.t - Scene.cupT : null, up: Scene.camD >= LEN - B_GREEN_UP }); return keep.holed.apply(this, arguments); };
          const tocks = [];
          const cups = [];
          Sfx.play = function (k) { if (k === 'putt') tocks.push(S.hole);
            if (k === 'hole') cups.push({ h: S.hole, ago: Scene.cupT ? Scene.t - Scene.cupT : null });
            return keep.play.apply(this, arguments); };
          const dt = 1 / 60;
          for (let i = 0; i < 60 * secs; i++) {
            fake += dt * 1000;
            const D = derive();
            step(dt, D);
            if (watch) Scene.draw(dt, D);
            // no ball ever lies nearer the cup than where he putts from
            if (watch && Scene.restBall && Scene.restBall.d > LEN - B_GREEN_STAND - 0.4 + 0.01) nearCup++;
            if (stop && H.length >= stop) break;
          }
          window.finishHole = keep.fh; window.oneSwing = keep.os; window.fireSkill = keep.fs; Scene.holed = keep.holed; Sfx.play = keep.play;
          return { H, waitingPlays, nearCup, stand: B_GREEN_STAND, up: B_GREEN_UP, roll: PUTT_HIT + PUTT_ROLL };
        };

        // ---- a normal bag on a home course, watched ----
        DEV.course(B.COURSE.findIndex(c => c.slot === 'home')); hideSheet(); Scene.announce = null;
        o.normal = play(150, true);
        // ---- a strong bag, watched ----
        for (const u of B.UPG) S.upg[u.id] = Math.min(capOf(u), 30);
        startHole();
        o.strong = play(70, true);
        // ---- the putt, drawn: the ball seen on its way, never on him, and
        // the cup clear of him (again below, with the phone on its side) ----
        window.__puttDraw = () => {
          const o = {};
          startHole(); const D = derive();
          S.yards = 0; S.doneT = null;
          Scene.camD = LEN - B_GREEN_STAND; Scene.walkTo = LEN; Scene.swingT = 0; Scene.walkOn = false; Scene.restBall = null; Scene.balls.length = 0;
          Scene.upT = Scene.t - 1; Scene.cupT = 0; Scene.fairyMove = null; Scene.moveT = 999;
          const p = Scene.proj(Scene.camD, 0), gh = Math.round(B_GOLFER * US * p.s), gw = Math.round(gh * SPRITE.gAddr.w / SPRITE.gAddr.h);
          const body = { x0: p.x - gw * 0.42, x1: p.x + gw * 0.58, y0: p.y - gh, y1: p.y };
          const cup = Scene.proj(LEN, Scene.pinX());
          o.putDraw = { seen: 0, looked: 0, onHim: 0, cupHid: cup.x >= body.x0 - 1 && cup.x <= body.x1 + 1 && cup.y >= body.y0 - 1 && cup.y <= body.y1, size: VW + 'x' + VH };
          for (let T = PUTT_HIT + 0.05; T < PUTT_HIT + PUTT_ROLL - 0.02; T += 0.05) {
            Scene.putt = { t0: Scene.t - T, d0: Scene.camD, hit: 1 };
            const q = Scene.puttBall(T), bp = Scene.proj(q.d, q.lat);
            Scene.draw(0, D);
            // the ball's own pixel: white, where it rolls
            const px = Scene.b.getImageData(Math.round(bp.x), Math.round(bp.y) - 2, 3, 3).data;
            let white = 0; for (let i = 0; i < px.length; i += 4) if (px[i] > 225 && px[i + 1] > 225 && px[i + 2] > 225) white++;
            o.putDraw.looked++; if (white) o.putDraw.seen++;
            if (bp.x >= body.x0 && bp.x <= body.x1 && bp.y >= body.y0 && bp.y <= body.y1) o.putDraw.onHim++;
            if (Scene.cupT) break;
          }
          Scene.putt = null; Scene.cupT = 0;
          return o.putDraw;
        };
        o.putDraw = window.__puttDraw();

        // ---- a hole in one, watched: straight into the cup off the tee ----
        {
          startHole(); for (let k = 0; k < 30; k++) { fake += 1000 / 60; Scene.draw(1 / 60, derive()); }
          // the next swing finishes it, a tenth of the way through par
          S.parTime = 60; S.elapsed = 0.2; S.yards = 1e-9; S.swingT = 0.999;
          o.ace = play(12, true, 1);
        }

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
    // on its side: the cup must not hide behind him there either
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(300);
    r.putSide = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), raf = window.requestAnimationFrame;
      try { hideSheet(); window.requestAnimationFrame = () => 0; return window.__puttDraw(); }
      finally { window.requestAnimationFrame = raf; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole(); }
    });
    await page.setViewportSize({ width: 400, height: 860 });
    const f = m => { throw new Error(m); };
    const avg = a => a.reduce((s, x) => s + x, 0) / Math.max(1, a.length);
    for (const k of ['normal', 'strong']) {
      const H = r[k].H;
      if (H.length < (k === 'normal' ? 10 : 12)) f('only ' + H.length + ' holes were played with a ' + k + ' bag');
      // where he stands to putt: a little short of the cup, up on the green
      const far = H.filter(h => h.short > r[k].up + 1e-6 || h.short < r[k].stand - 0.3);
      if (far.length) f('with a ' + k + ' bag ' + far.length + ' of ' + H.length + ' holes moved on with him short of the green: '
        + far.slice(0, 3).map(h => 'hole ' + h.hr + (h.sig ? ' (' + h.sig + ')' : '') + ' ' + h.short.toFixed(1) + ' short').join('; '));
      if (H.some(h => h.cap)) f('with a ' + k + ' bag a hole ran to the wait\'s cap: ' + H.filter(h => h.cap).map(h => 'hole ' + h.hr + ' ' + h.sig + ' waited ' + h.wait.toFixed(2) + 's, putt ' + h.putt + ', short ' + h.short.toFixed(1)).join('; '));
      // on a plain hole the rest of his swing, the walk up and a moment
      // there; a signature hole adds its crossing (a flight, a bridge, the
      // stones, a train going by)
      const plain = H.filter(h => !h.sig), mw = avg(plain.map(h => h.wait));
      if (!(mw < (k === 'normal' ? 2.6 : 3.2))) f('with a ' + k + ' bag the wait on a plain hole after the ball was down was ' + mw.toFixed(2) + 's on average: '
        + H.map(h => (h.sig ? h.sig + ' ' : '') + h.wait.toFixed(2)).join(', '));
      const bad = H.filter(h => h.carded !== h.want);
      if (bad.length) f('with a ' + k + ' bag ' + bad.length + ' holes were not carded from when the ball was down');
      if (r[k].waitingPlays) f('with a ' + k + ' bag ' + r[k].waitingPlays + ' swings or perks were played on a hole that was waiting');
      // the cup's sound once, as the ball dropped; the banner once, as it
      // dropped with him up on the green after his putt, or for an ace the
      // moment its score was settled (it can drop before the hole's
      // shortest time is up)
      const late = H.filter(h => h.said.length !== 1 || !h.said[0].down || h.said[0].cupAgo === null
        || (h.putt ? h.said[0].cupAgo > 0.05 || !h.said[0].up : h.said[0].cupAgo > 0.05 && Math.abs(h.said[0].el - h.said[0].done) > 0.05)
        || h.cups.length !== 1 || h.cups[0].ago === null || h.cups[0].ago > 0.05);
      // he putted out every hole but an ace, whose tee shot went in; one
      // tock of the putter a putt
      const noPutt = H.filter(h => !h.cup || (h.want <= -4 ? h.putt : !h.putt) || h.tocks !== (h.putt ? 1 : 0));
      if (noPutt.length) f('with a ' + k + ' bag ' + noPutt.length + ' of ' + H.length + ' holes were not putted out as they should be: '
        + noPutt.slice(0, 3).map(h => 'hole ' + h.hr + ' (' + h.want + '): putt ' + h.putt + ', in the cup ' + h.cup + ', tocks ' + h.tocks).join('; '));
      if (late.length) f('with a ' + k + ' bag the score\'s banner came ' + (late[0].said.length !== 1 ? late[0].said.length + ' times' : 'late') + ' on ' + late.length + ' holes');
    }
    for (const k of ['normal', 'strong']) {
      if (r[k].nearCup) f('with a ' + k + ' bag a ball lay nearer the cup than his putting spot in ' + r[k].nearCup + ' frames');
      const slow = r[k].H.filter(h => h.putt && !(Math.abs(h.puttDur - r[k].roll) < 0.05));
      if (slow.length) f('with a ' + k + ' bag the putt dropped ' + slow.map(h => h.puttDur === null ? 'never' : h.puttDur.toFixed(2) + 's').join(', ') + ' after he addressed it, not ' + r[k].roll.toFixed(2) + 's');
    }
    for (const PD of [r.putDraw, r.putSide])
      if (PD.seen < PD.looked - 1 || PD.onHim || PD.cupHid) f('the putt at ' + PD.size + ': the ball seen in ' + PD.seen + ' of ' + PD.looked + ' frames, on him in ' + PD.onHim + (PD.cupHid ? ', and the cup behind him' : ''));
    const A = r.ace.H[0];
    if (!A || A.want > -4) f('the hole in one was not played as one: ' + JSON.stringify(A && { want: A.want, carded: A.carded }));
    else if (A.putt || !A.cup || A.said.length !== 1 || A.cups.length !== 1 || A.carded !== A.want)
      f('a hole in one: putt ' + A.putt + ', in the cup ' + A.cup + ', banners ' + A.said.length + ', cup sounds ' + A.cups.length + ', carded ' + A.carded);
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
      'putted out every hole (' + r.normal.H.filter(h => h.putt).length + ' of ' + N.length + '; a hole in one went straight in, as did '
        + St.filter(h => h.want <= -4).length + ' of the strong bag\'s), the cup\'s sound as the ball drops, the banner as the putt drops, nothing played while it waits, no wait unwatched; a wait of half the hole pays 1.5x, experience and gear luck alike'];
  }
};
