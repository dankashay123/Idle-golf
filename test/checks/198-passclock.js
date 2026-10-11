/* The Tour Pass and Membership with the clock moved (the user asked for a
 * pass over them at the month's end and with the clock moved both ways):
 * bought, ten tiers reached and two rewards taken, then
 *   - the clock back 40 days, across the month's start: the same pass,
 *     bought, its rewards and points kept; nothing paid; the membership
 *     not made longer
 *   - 40 days on: a new pass; the membership's allowance for its 30 days
 *     only, paid once
 *   - the clock back to the real day: nothing paid, nothing lost
 *   - on again past where it was: no second allowance for days paid
 *   - the clock back across the month before the game had saved: the
 *     bought pass kept, not swapped for a blank one of the month before
 *   - the same for the week: the Signature Week not paid twice and the
 *     week's major not opened again, the clock back a week and on again */
'use strict';
module.exports = {
  name: 'passclock',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), RN = Date.now, tw = window.toast, es = window.earnSov, fails = [], f = m => fails.push(m), o = {};
      let off = 0; const T0 = RN(); Date.now = () => T0 + off;
      const owed = () => (S.owed || []).reduce((a, x) => a + x.n, 0), wealth = () => (S.sov || 0) + owed();
      const go = () => { QUIET = true; catchUp(); QUIET = false; hideSheet(); };
      let dues = 0; window.earnSov = function (n, pl, key) { if (String(key).split(':')[0] === 'member') dues += n; return es.apply(this, arguments); };
      try {
        hideSheet(); window.toast = () => {};
        S.member = 0; delete S.memberEnd; delete S.pass; S.t = T0 / 1000;
        passBuy(); buyMember(); const P = passNow(); P.pts = 10 * PASS.PER; passGive('f', 3, true); passGive('p', 3, true);
        const m0 = P.m, w0 = wealth(), left0 = memberDaysLeft();
        // back 40 days
        off = -40 * 86400000; go();
        const P1 = passNow();
        if (P1.m !== m0 || !P1.paid || P1.got.length !== 2 || P1.pts !== 10 * PASS.PER) f('the clock back 40 days: the pass became month ' + P1.m + ', bought ' + P1.paid + ', ' + P1.got.length + ' taken, ' + P1.pts + ' points');
        if (wealth() !== w0) f('the clock back 40 days paid ' + (wealth() - w0));
        if (memberDaysLeft() > left0 + 1) f('the clock back made the membership ' + memberDaysLeft() + ' days, not ' + left0);
        // 40 days on
        off = 0; go(); S.t = Date.now() / 1000; save(); dues = 0;
        off = 40 * 86400000; go();
        o.dues = dues; if (dues !== 30 * B.MEMBER_DAILY) f('40 days away paid ' + dues + ' in allowance, not 30 days\' ' + 30 * B.MEMBER_DAILY);
        if (passNow().m === m0) f('40 days on, still last month\'s pass');
        const w2 = wealth();
        // back to the real day, then past it again
        off = 0; go(); if (wealth() !== w2) f('the clock back to the real day paid ' + (wealth() - w2));
        dues = 0; off = 40 * 86400000 + 3600e3; go(); if (dues) f('on again past it paid ' + dues + ' more allowance');
        // this month's pass bought, then the clock back across the month before
        // the game had saved (its stamp as old): the bought pass kept
        { const Pn = passNow(); if (!Pn.paid) passBuy(); Pn.pts = 4 * PASS.PER; const mN = Pn.m, tN = S.t;
          off = 0; S.t = T0 / 1000; const Pb = passNow(); o.stale = { m: Pb.m - mN, paid: Pb.paid, pts: Pb.pts };
          if (Pb.m !== mN || !Pb.paid || Pb.pts !== 4 * PASS.PER) f('the clock back before a save swapped the bought pass for a blank one: ' + JSON.stringify(o.stale));
          S.t = tN; }
        // the week's rewards the same way: the Signature Week and the week's
        // major, the clock back a week before a save and on again
        { const paid = () => (S.owed || []).reduce((a, x) => a + x.n, 0) + (S.sov || 0);
          const play = kind => { let hh = S.hole; while (sigKind(hh) !== kind) hh++; const keep = S.hole; S.hole = hh; sigScore({ d: -1, n: 'Birdie' }); S.hole = keep; };
          const qq = QUIET; QUIET = true; delete S.sigWk; const wk0 = weekNow(), tW = S.t, offW = off, s0 = paid();
          SIG_KINDS.forEach(play); const first = paid() - s0;
          off -= 8 * 86400000; S.t = (T0 + off) / 1000; SIG_KINDS.forEach(play);
          off = offW; S.t = tW; SIG_KINDS.forEach(play); const twice = paid() - s0 - first;
          S.weekly = { wk: wk0, t: 5, id: weekMajor(wk0).id, done: 1, won: 1 }; const h0 = S.hole, ev0 = S.evCourse, ep = S.eventsPlayed; S.eventsPlayed = Math.max(3, ep || 0);
          off -= 8 * 86400000; S.t = (T0 + off) / 1000; S.hole = tournamentOf(h0) * B.ROUND * B.DAYS + 1; S.evCourse = null; QUIET = false; openEvent();
          off = offW; S.t = tW; S.hole += B.ROUND * B.DAYS; S.evCourse = null; openEvent(); QUIET = true;
          o.week = { first, twice, major: { wk: S.weekly.wk - wk0, done: S.weekly.done } };
          if (!(first > 0) || twice !== 0) f('the Signature Week paid ' + first + ' and again ' + twice + ' with the clock back a week and on again');
          if (S.weekly.wk !== wk0 || !S.weekly.done) f('the week\'s major opened again with the clock back a week and on again: ' + JSON.stringify(o.week.major));
          S.hole = h0; S.evCourse = ev0; S.eventsPlayed = ep; QUIET = qq; }
      } finally { Date.now = RN; window.toast = tw; window.earnSov = es; QUIET = false; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the clock back across the month kept the bought pass and paid nothing; 40 days away paid 30 days\' allowance (' + r.o.dues + ') once; back and on again, nothing twice'];
  }
};
