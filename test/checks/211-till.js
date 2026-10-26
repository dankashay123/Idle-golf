/* The till: everything sold for money goes through one doorway, ready for
 * the iPhone app's store (the user chose to make the game ready for it).
 *
 *   - on the web nothing is charged: a pack, the Starter Pack, Membership
 *     and the Tour Pass are given at once, priced in dollars, "free" under
 *     each and the shop's "Nothing here costs real money" line on show
 *   - in the app with a store (a stand-in here): prices as the store gives
 *     them, no "free" and no "nothing charged"; each buy asks the store for
 *     its own product and gives nothing until the store says it is paid; a
 *     cancelled buy gives nothing; a transaction paid twice gives once
 *   - Restore Purchases on the Offers tab and Membership's renewal said,
 *     only in the app with a store; a restore on a new phone gives back the
 *     Starter Pack's place and Membership's days, never sovereigns; a lapsed
 *     Membership restored gives nothing */
'use strict';
module.exports = {
  name: 'till',
  async run(page) {
    await page.setViewportSize({ width: 390, height: 844 });
    const r = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), fl = [], f = m => fl.push(m), o = {};
      const tick = () => new Promise(res => setTimeout(res, 0));
      const shopText = sub => { QUIET = false; openShop(sub); const t = document.getElementById('sheet').innerText; hideSheet(); return t; };
      try {
        hideSheet(); DEV_OFF = true;
        // ---- the web: given at once ----------------------------------------
        const fresh = () => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); S.starter = 0; S.member = 0; S.memberEnd = 0; S.packsTaken = {}; S.firstPack = 1; S.txSeen = []; };
        fresh();
        let t = shopText('offers');
        if (!/Nothing here costs real money/.test(t)) f('on the web the shop does not say nothing is charged');
        if (!/\$4\.99/.test(t) || !/FREE/i.test(t)) f('on the web the prices or "free" are missing');
        if (/Restore Purchases/i.test(t)) f('on the web there is a Restore Purchases button');
        let s0 = S.sov; buyPack(B.SOV_PACKS[1]); if (S.sov - s0 !== B.SOV_PACKS[1].c) f('on the web a pack gave ' + (S.sov - s0));
        buyStarter(); if (!S.starter) f('on the web the Starter Pack was not given');
        buyMember(); if (!isMember()) f('on the web Membership was not given');
        passBuy(); if (!passNow().paid) f('on the web the Tour Pass was not given');

        // ---- the app with a store ------------------------------------------
        fresh();
        const asked = []; let answer = { ok: true }, txN = 0;
        window.__inApp = 1;
        window.MMStore = {
          products: ids => Promise.resolve(ids.map(id => ({ id, price: '£' + (id.length % 9 + 0.99).toFixed(2) }))),
          buy: id => { asked.push(id); return Promise.resolve(answer.ok ? { ok: true, tx: 'tx' + (++txN), end: answer.end } : { ok: false }); },
          restore: () => Promise.resolve([{ id: 'mm.starter', tx: 'old1' }, { id: 'mm.member.month', tx: 'old2', end: Date.now() + 9 * 86400000 }, { id: 'mm.sov.p3', tx: 'old3' }])
        };
        STORE.prices = {}; STORE.load(); await tick(); await tick();
        t = shopText('offers');
        if (/Nothing here costs real money/.test(t)) f('in the app the shop still says nothing is charged');
        if (!/£/.test(t)) f('in the app the prices are not the store\'s');
        if (/\$\d/.test(t)) f('in the app a price is still in dollars');
        if (!/Restore Purchases/i.test(t)) f('in the app there is no Restore Purchases');
        if (!/renews each month/i.test(t)) f('in the app Membership\'s renewal is not said');
        const tp = shopText('pass'); if (/nothing charged/i.test(tp)) f('in the app the Tour Pass says nothing charged');
        // each buy asks for its own product, and gives only once paid
        s0 = S.sov; buyPack(B.SOV_PACKS[1]);
        if (S.sov !== s0) f('a pack gave sovereigns before the store said it was paid');
        await tick(); await tick();
        o.pack = S.sov - s0; if (o.pack !== B.SOV_PACKS[1].c * (firstPackOn() ? 2 : 1) && o.pack !== B.SOV_PACKS[1].c) f('a paid pack gave ' + o.pack);
        s0 = S.sov; STORE.paid('mm.sov.' + B.SOV_PACKS[1].id, 'tx1'); if (S.sov !== s0) f('the same transaction paid twice');
        answer = { ok: false }; s0 = S.sov; buyPack(B.SOV_PACKS[0]); await tick(); await tick(); if (S.sov !== s0) f('a cancelled buy gave ' + (S.sov - s0));
        answer = { ok: true };
        buyStarter(); await tick(); await tick(); if (!S.starter) f('a paid Starter Pack was not given');
        buyMember(); await tick(); await tick(); if (!isMember()) f('a paid Membership was not given');
        passBuy(); await tick(); await tick(); if (!passNow().paid) f('a paid Tour Pass was not given');
        o.asked = asked.join(' ');
        for (const want of ['mm.sov.' + B.SOV_PACKS[1].id, 'mm.sov.' + B.SOV_PACKS[0].id, 'mm.starter', 'mm.member.month', 'mm.pass.month'])
          if (!asked.includes(want)) f('the store was never asked for ' + want);
        // a restore on a new phone
        fresh(); s0 = S.sov; STORE.restore(); await tick(); await tick(); await tick();
        if (!S.starter) f('a restore did not give back the Starter Pack\'s place');
        if (!isMember()) f('a restore did not give back Membership\'s days');
        if (S.sov !== s0) f('a restore gave ' + (S.sov - s0) + ' sovereigns');
        // a lapsed Membership restored gives nothing
        fresh(); PRODUCTS[PROD_MEMBER].keep(Date.now() - 86400000);
        if (isMember() || S.member) f('a lapsed Membership, restored, made him a member');
      } finally {
        delete window.MMStore; delete window.__inApp; STORE.prices = {}; STORE.busy = null; DEV_OFF = false; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet();
      }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['on the web given at once, nothing charged; in the app the store\'s prices, nothing given till paid, once a transaction, a cancel nothing; asked: ' + r.o.asked + '; restore gives back the Starter Pack\'s place and Membership, no sovereigns'];
  }
};
