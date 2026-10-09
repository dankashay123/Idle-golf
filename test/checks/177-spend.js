/* What money buys (the user: "I want incentive for people to spend money"),
 * nothing charged in this build:
 *
 *   - the Tour Pass: a season a calendar month, points from the dailies
 *     (30 each, 30 for all three), the Check-In (20) and every 10 holes
 *     played live (none away); 80 a tier (150 until the simulated player never reached the top), 30 tiers; the free row taken as
 *     reached, the paid row only once bought and then back to tier one;
 *     each reward once; the month's own look only from the paid row's tier
 *     20, never sold for sovereigns (its top the Cyber-Drive: 178-cyber); a new month a new pass; the shop's
 *     dot while one waits; a broken pass repaired
 *   - Club Membership by the month: 30 days, again adds 30, then over; one
 *     bought for good before stays
 *   - the shop-only looks: never sold for sovereigns, owned once bought */
'use strict';
module.exports = {
  name: 'spend',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => { if (fails.length < 14) fails.push(m); }, o = {}, SNAP = JSON.stringify(S);
      const keepDay = DAY_FORCE, keepNow = Date.now, tw = window.toast;
      window.toast = () => {}; QUIET = true;
      try {
        hideSheet(); const day = dayNow(); DAY_FORCE = day;
        delete S.pass; const P = passNow();
        if (P.pts !== 0 || P.paid || P.got.length) f('a new pass not empty');
        // points
        passAdd(PASS.DAILY); passAdd(PASS.ALL); if (P.pts !== 60) f('dailies gave ' + P.pts);
        S.checkin = { m: ciMonth(day), n: 0, last: day - 1 }; const p0 = P.pts; checkinClaim(); if (P.pts - p0 !== PASS.CHECKIN) f('the Check-In gave ' + (P.pts - p0));
        { const D = derive(), q0 = P.pts; S.passH = 0; OFFLINE = false; for (let i = 0; i < 20; i++) finishHole(D); const live = P.pts - q0;
          OFFLINE = true; const q1 = P.pts; for (let i = 0; i < 20; i++) finishHole(D); OFFLINE = false; const away = P.pts - q1;
          o.holes = live + '/' + away; if (live !== 2) f('20 live holes gave ' + live + ' points'); if (away !== 0) f('20 away holes gave ' + away + ' points'); }
        // tiers and rows
        P.pts = 5 * PASS.PER + 10; if (passTier() !== 5) f('at ' + P.pts + ' points tier ' + passTier());
        if (!passCan('f', 5) || passCan('f', 6)) f('the free row not as reached');
        if (passCan('p', 1)) f('the paid row open before it was bought');
        const sv = S.sov || 0; passGive('f', 5); if ((S.sov || 0) - sv !== 5) f('tier 5 free paid ' + ((S.sov || 0) - sv));
        if (passGive('f', 5)) f('a reward taken twice');
        passBuy(); if (!passCan('p', 1) || !passCan('p', 4)) f('bought, the paid row not back to tier one');
        // the look: only the paid row's tier 20
        const mo = passMonth(), id = 'pass' + mo;
        if (styleOwned('o', id)) f('the month\'s look owned before it was earned');
        const sv2 = S.sov = 99999; styleBuy('o', id); if (styleOwned('o', id) || S.sov !== sv2) f('the month\'s look bought for sovereigns');
        P.pts = PASS.TIERS * PASS.PER; for (let t = 1; t <= PASS.TIERS; t++) { passGive('f', t, true); passGive('p', t, true); }
        if (!styleOwned('o', id) || !styleOwned('c', id)) f('the paid row did not give the look and its caddie');
        o.sov = { paid: 0 }; for (let t = 1; t <= PASS.TIERS; t++) { const rr = passReward('p', t); if (rr.k === 'sov') o.sov.paid += rr.v; }
        // (1,500: the user raised a paid tier from 40 to 60, so the pass alone is clearly quicker)
        if (o.sov.paid < 1300 || o.sov.paid > 1700) f('the paid row pays ' + o.sov.paid + ' sovereigns');
        if (passClaimable()) f('something left after taking everything');
        // the dot
        P.got = []; renderStageBtns(); if (!document.getElementById('shopBtn').classList.contains('new')) f('no dot on the shop with rewards waiting');
        // a new month
        DAY_FORCE = day + 40; if (passNow().pts !== 0 || passNow().paid) f('the next month kept the pass'); DAY_FORCE = day;
        // repaired
        S.pass = 'junk'; migrate(); passNow(); if (typeof S.pass !== 'object') f('a broken pass not repaired');
        S.pass = { m: ciMonth(day), pts: 'x', paid: 1, got: 5 }; const PP = passNow(); if (!(PP.pts === 0 && Array.isArray(PP.got))) f('a broken pass\'s points or rewards not repaired');
        // membership by the month
        S.member = 0; delete S.memberEnd; const t0 = Date.now(); Date.now = () => t0;
        buyMember(); if (!isMember() || memberDaysLeft() !== 30) f('membership not 30 days (' + memberDaysLeft() + ')');
        buyMember(); if (memberDaysLeft() !== 60) f('membership again not 60 days (' + memberDaysLeft() + ')');
        Date.now = () => t0 + 61 * 86400000; if (isMember()) f('membership still on after 61 days');
        S.member = 1; if (!isMember()) f('a membership for good lost'); Date.now = keepNow;
        // shop-only looks
        for (const [k, list] of [['o', B.OUTFITS], ['c', B.CADDIES], ['k', B.CLUBS]]) for (const d of list.filter(x => x.usd)) {
          delete S.styleOwn[k + ':' + d.id]; S.sov = 99999; const s0 = S.sov;
          if (styleOwned(k, d.id)) f(d.n + ' owned without buying');
          styleBuy(k, d.id); if (!styleOwned(k, d.id)) f(d.n + ' not owned once bought'); if (S.sov !== s0) f(d.n + ' took sovereigns'); }
        o.shopOnly = B.OUTFITS.filter(x => x.usd).length + B.CADDIES.filter(x => x.usd).length + B.CLUBS.filter(x => x.usd).length;
      } finally { DAY_FORCE = keepDay; Date.now = keepNow; window.toast = tw; OFFLINE = false; QUIET = false; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); Scene.newHole(S.hole, S.tier); }
      return { fails, o };
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the Tour Pass: points from dailies, the Check-In and live holes (' + r.o.holes + ' live/away for 20 holes), tiers, the free row as reached, the paid row once bought and back to tier one (' + r.o.sov.paid + ' sovereigns), the month\'s look only at its top, a new month a new pass, the dot, repaired; Membership 30 days, again 60, over after; ' + r.o.shopOnly + ' shop-only looks never for sovereigns'];
  }
};
