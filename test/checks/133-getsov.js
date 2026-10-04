/* Sovereigns wait to be taken (the user: "I don't want sovereigns to be
 * automatically added, I want to have to go to its respective place and
 * tap a GET button. Make sure anywhere there are awards to get, there is a
 * GET ALL button as well").
 *
 *   - earned ones (an honour, a first sighting, a hunt, a find by the tee,
 *     a new Tour Card, the members' allowance) add nothing until taken, and
 *     wait in their place: Honours, the Guide, or Today
 *   - each place shows them with a GET each, GET ALL when there is more
 *     than one, and a GET pays its row once; GET ALL pays the place and no
 *     other; Today points to the others
 *   - the Trophy Room's button calls while anything waits; a purchase is
 *     paid at once; a broken save is repaired
 */
'use strict';
module.exports = {
  name: 'getsov',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const wasAuto = SOV_AUTO, tw = window.toast;
      try {
        SOV_AUTO = false; hideSheet(); window.toast = () => {}; S.owed = []; S.sov = 100; S.freeT = 0; S.caseGot = {};
        B.CASE.forEach(c => { S.caseGot[c.id] = c.at.length; });
        const room = (tab) => { hideSheet(); trophyRoom(tab); return document.querySelector('#roomBody'); };
        const btns = (w, re) => [...w.querySelectorAll('button')].filter(b => re.test(b.textContent));
        // earned: nothing added, each in its place
        const a = B.ACH.find(x => x.sov > 0);
        S.achDone = {}; B.ACH.forEach(x => { if (x !== a) S.achDone[x.id] = 1; }); S.achSov = 1; S.achRep = {}; B.ACH_REP.forEach(x => { S.achRep[x.id] = 1e300; });
        const met = achMetric; window.achMetric = m => m === a.m ? 1e300 : met(m);
        try { checkAch(); } finally { window.achMetric = met; }
        S.guide = {}; guideAdd([GUIDE.find(g => g.g === 'w').id]);
        payFind(S.hole, FINDS[3]);
        S.cardPaid = S.tierMax - 1; cardPay();
        if (S.sov !== 100) f('earning added ' + (S.sov - 100) + ' at once');
        const wantP = { hon: a.sov, guide: B.GUIDE_SOV, today: FINDS[3].sov + B.FREE_CARD };
        for (const p in wantP) if (owedSum(p) !== wantP[p]) f(p + ' holds ' + owedSum(p) + ', not ' + wantP[p]);
        if (!document.getElementById('roomBtn').classList.contains('ready')) { renderStageBtns(); if (!document.getElementById('roomBtn').classList.contains('ready')) f('the Trophy Room does not call'); }
        // Honours: one row, a GET and no GET ALL; it pays once
        let w = room('hon');
        if (btns(w, /^GET ALL/).length) f('Honours offers GET ALL for one thing');
        let g = btns(w, /^GET \+/);
        if (g.length !== 1) f('Honours shows ' + g.length + ' GET buttons');
        else { g[0].click(); if (S.sov !== 100 + a.sov) f('GET on Honours paid ' + (S.sov - 100)); }
        w = room('hon'); if (btns(w, /^GET/).length) f('Honours still offers a GET after taking it');
        const s1 = S.sov; getOwed('hon'); if (S.sov !== s1) f('a taken row paid again');
        // Today: the find and the card, GET ALL for the two and a pointer to
        // the Guide; GET ALL leaves the Guide's waiting
        w = room('today');
        if (btns(w, /^GET \+/).length !== 2) f('Today shows ' + btns(w, /^GET \+/).length + ' GET buttons, not 2');
        const all = btns(w, /^GET ALL/);
        if (all.length !== 1) f('Today offers ' + all.length + ' GET ALL');
        if (!btns(w, /^Open$/).some(b => b.dataset.room === 'guide')) f('Today does not point to the Guide');
        const s2 = S.sov; if (all[0]) all[0].click();
        if (S.sov - s2 !== wantP.today) f('Today\'s GET ALL paid ' + (S.sov - s2) + ' of ' + wantP.today);
        if (owedSum('guide') !== wantP.guide) f('Today\'s GET ALL took the Guide\'s');
        // the Guide: a second row (a hunt) brings GET ALL, which takes both
        const H = huntNow(); H.paid = 0; huntPay(H);
        w = room('guide'); const ga = btns(w, /^GET ALL/);
        if (ga.length !== 1 || btns(w, /^GET \+/).length !== 2) f('the Guide shows ' + btns(w, /^GET \+/).length + ' GET and ' + ga.length + ' GET ALL');
        const s3 = S.sov, want3 = owedSum('guide'); if (ga[0]) ga[0].click();
        if (S.sov - s3 !== want3 || owedIn().length) f('the Guide\'s GET ALL paid ' + (S.sov - s3) + ' of ' + want3 + ', left ' + owedIn().length);
        hideSheet(); renderStageBtns(); renderStageBtns();
        // the members' allowance waits too; a pack is paid at once
        S.member = 1; S.memberT = 86400 - 1; tickShop(2);
        if (owedSum('today') !== B.MEMBER_DAILY) f('the allowance waits ' + owedSum('today'));
        const s4 = S.sov, pk = B.SOV_PACKS[0]; if (pk) { buyPack(pk); if (S.sov - s4 !== pk.c) f('a pack paid ' + (S.sov - s4) + ' at once, not ' + pk.c); }
        o.rows = { hon: a.n, today: 'find, card, allowance', guide: 'first sighting, hunt' };
        // save repair
        S.owed = [{ p: 'today', k: 'x', n: 3.7, t: 'ok' }, { p: 'nowhere', k: 'y', n: 2 }, { p: 'hon', k: 'x', n: 5 }, { p: 'guide', k: 'z', n: -1 }, null, { p: 'guide', k: 'w', n: 1e12 }];
        migrate(); if (JSON.stringify(S.owed) !== '[{"p":"today","k":"x","n":3,"t":"ok"}]') f('repaired to ' + JSON.stringify(S.owed));
        S.owed = 'x'; migrate(); if (S.owed !== undefined) f('a string kept for the rows');
      } finally {
        SOV_AUTO = wasAuto; window.toast = tw;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['earned sovereigns add nothing until taken: an honour (' + r.rows.hon + ') waits in Honours, a sighting and the hunt in the Guide, a find, a card and the allowance on Today',
      'a GET each pays once; GET ALL when there is more than one, for its place alone; Today points to the others; a pack is paid at once; a broken save repaired'];
  }
};
