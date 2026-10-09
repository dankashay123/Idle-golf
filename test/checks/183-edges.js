/* Edge cases of what money buys (the user asked for a sweep of them):
 *
 *   - a month gone with Tour Pass rewards reached and not taken: they are
 *     given as the new pass starts (they were lost), the paid row's only if
 *     bought, the old month's look (not the new one's), none twice, nothing
 *     beyond the tier reached; a pass with nothing waiting gives nothing
 *   - Club Membership running out while he is away pays the days it covered
 *     and none after (it paid nothing for any of them); one for good pays
 *     every day; none, nothing
 *   - a save from before each bag kept its own count to a Mythic loads with
 *     every count at nought, and nonsense counts are mended
 *   - GET ALL with every tier waiting takes them all at once, once */
'use strict';
module.exports = {
  name: 'edges',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = {}, tw = window.toast, RN = Date.now; let T = Date.now();
      window.toast = () => {};
      try {
        hideSheet(); QUIET = false;
        // ---- the pass across a month ----
        const day0 = Math.floor(Date.UTC(2026, 9, 20) / 86400000);
        DAY_FORCE = day0; S.pass = null; S.styleOwn = {};
        let P = passNow(); P.paid = 1; P.pts = 22 * PASS.PER + 10; P.got = ['f1', 'p1', 'p2'];
        const sov0 = S.sov, bag0 = S.bagsOpened || 0;
        DAY_FORCE = Math.floor(Date.UTC(2026, 10, 2) / 86400000);
        P = passNow();
        o.newPass = P.m === ciMonth(DAY_FORCE) && P.pts === 0 && P.got.length === 0;
        o.sovGot = S.sov - sov0;
        // paid row tiers 3..22 less look(20), bag(15), boosts(5): sovereigns at PASS.SOV; free row every fifth 10
        let want = 0; for (let t = 1; t <= 22; t++) { if (t > 2) { const rr = passReward('p', t, { m: ciMonth(day0), got: [] }); if (rr.k === 'sov') want += rr.v; }
          if (t > 1) { const rf = passReward('f', t, { m: ciMonth(day0), got: [] }); if (rf.k === 'sov') want += rf.v; } }
        o.sovWant = want;
        o.oldLook = !!(S.styleOwn['o:pass9']); o.newLook = !!(S.styleOwn['o:pass10']);
        o.bagOpened = (S.bagsOpened || 0) - bag0;
        const sov1 = S.sov; passNow(); passNow(); o.twice = S.sov - sov1;
        // unbought: the free row only
        DAY_FORCE = Math.floor(Date.UTC(2026, 10, 20) / 86400000); S.pass = null; P = passNow(); P.paid = 0; P.pts = 5 * PASS.PER; P.got = [];
        const sov2 = S.sov; DAY_FORCE = Math.floor(Date.UTC(2026, 11, 3) / 86400000); passNow(); o.freeOnly = S.sov - sov2;
        // nothing waiting: nothing
        S.pass = null; P = passNow(); P.pts = 3 * PASS.PER; P.paid = 1; P.got = ['f1', 'f2', 'f3', 'p1', 'p2', 'p3'];
        const sov3 = S.sov; DAY_FORCE = Math.floor(Date.UTC(2027, 0, 3) / 86400000); passNow(); o.nothing = S.sov - sov3;
        // ---- GET ALL ----
        S.pass = null; P = passNow(); P.paid = 1; P.pts = PASS.TIERS * PASS.PER; P.got = [];
        const sov4 = S.sov; passGetAll(); o.allGot = P.got.length; const sov5 = S.sov; passGetAll(); o.allTwice = S.sov - sov5; o.allPaid = sov5 - sov4;
        DAY_FORCE = null;
        // ---- membership away ----
        Date.now = () => T;
        const away = (days, member, endIn) => {
          S.member = member; S.memberEnd = T + endIn * 86400000; S.memberT = 0; S.t = T / 1000;
          const s0 = S.sov; T += days * 86400000; S.owed = []; const q = QUIET; QUIET = true;
          try { tickShop(days * 86400); } finally { QUIET = q; }
          return S.sov - s0 + (S.owed || []).filter(x => x.k === 'member').reduce((a, x) => a + x.n, 0);
        };
        o.mExpired = away(5, 2, 3.5);   // ran out 3.5 days into 5 away: 3 days paid
        o.mCovered = away(3, 2, 10);    // all 3 covered
        o.mGood = away(4, 1, 0);        // for good: 4
        o.mNone = away(4, 0, 0);
        Date.now = RN;
        // ---- an old save's bag counts ----
        const old = JSON.parse(SNAP); delete old.pityB; old.pity = 9;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, old); initState(); migrate();
        o.oldPity = JSON.stringify(S.pityB) + ':' + ('pity' in S);
        S.pityB = { range: 99, tour: -3, champ: 'x' }; initState(); migrate(); o.junkPity = JSON.stringify(S.pityB);
      } finally { Date.now = RN; DAY_FORCE = null; window.toast = tw; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); }
      return o;
    });
    const fl = [], f = m => fl.push(m);
    if (!r.newPass) f('the new month did not start a new pass');
    if (r.sovGot !== r.sovWant) f('last month\'s untaken rewards paid ' + r.sovGot + ' sovereigns, not ' + r.sovWant);
    if (!r.oldLook || r.newLook) f('last month\'s look: old ' + r.oldLook + ', new ' + r.newLook);
    if (r.bagOpened !== 1) f(r.bagOpened + ' Legend Bags opened from last month (tier 15 reached)');
    if (r.twice) f('last month\'s rewards paid twice: ' + r.twice);
    if (r.freeOnly !== 10) f('an unbought pass\'s free row to tier 5 paid ' + r.freeOnly + ', not 10');
    if (r.nothing) f('a pass with nothing waiting paid ' + r.nothing);
    if (r.allGot !== 60 || r.allTwice) f('GET ALL took ' + r.allGot + ' of 60, then ' + r.allTwice + ' more');
    if (r.mExpired !== 3 * 60) f('membership out 3.5 days into 5 away paid ' + r.mExpired + ', not 180');
    if (r.mCovered !== 3 * 60) f('membership covering 3 days away paid ' + r.mCovered);
    if (r.mGood !== 4 * 60) f('membership for good, 4 days away, paid ' + r.mGood);
    if (r.mNone) f('no membership paid ' + r.mNone);
    if (r.oldPity !== '{"range":0,"tour":0,"champ":0}:false') f('an old save\'s bag counts: ' + r.oldPity);
    if (r.junkPity !== '{"range":0,"tour":0,"champ":0}') f('nonsense bag counts kept: ' + r.junkPity);
    if (fl.length) throw new Error(fl.join('\n'));
    return ['last month\'s untaken pass rewards given (' + r.sovGot + ' sovereigns, its look, its bag), once; membership away pays only the days it covered (' + r.mExpired + '); old and junk bag counts mended; GET ALL takes all 60 once'];
  }
};
