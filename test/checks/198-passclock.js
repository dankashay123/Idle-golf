/* The Tour Pass and Membership with the clock moved (the user asked for a
 * pass over them at the month's end and with the clock moved both ways):
 * bought, ten tiers reached and two rewards taken, then
 *   - the clock back 40 days, across the month's start: the same pass,
 *     bought, its rewards and points kept; nothing paid; the membership
 *     not made longer
 *   - 40 days on: a new pass; the membership's allowance for its 30 days
 *     only, paid once
 *   - the clock back to the real day: nothing paid, nothing lost
 *   - on again past where it was: no second allowance for days paid */
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
      } finally { Date.now = RN; window.toast = tw; window.earnSov = es; QUIET = false; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the clock back across the month kept the bought pass and paid nothing; 40 days away paid 30 days\' allowance (' + r.o.dues + ') once; back and on again, nothing twice'];
  }
};
