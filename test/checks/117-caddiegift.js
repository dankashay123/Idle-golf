/* Caddie gifts (the user picked them from the menu): once the bond with the
 * caddie reaches Close, now and then after a birdie or better the caddie
 * hands over a few sovereigns, or a sponsor ticket or two.
 *
 *   - from the hole's hash: about one birdie in 25 at Close and one in 15
 *     at Inseparable; never below Close, on a par or worse, away, in a
 *     catch-up or in a wager
 *   - 2 to 5 sovereigns, or 1 to 2 tickets; counted; a short line naming
 *     the caddie
 *   - a hole played to a birdie gives it (through the hole's own finish)
 *   - the bond row says so on the way to Close; a broken save is repaired
 */
'use strict';
module.exports = {
  name: 'caddiegift',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet();
        const id = caddieNow().id, at = k => { S.bond = S.bond || {}; if (k) S.bond[id] = B.BOND[k - 1].v; else delete S.bond[id]; };
        // the odds, at each step of the bond, over many holes
        const N = 6000, rate = (k, d) => { at(k); let n = 0; const keep = JSON.stringify(S);
          // (the day's cap of ten (exploits) lifted, to read the odds alone)
          for (let h = 1; h <= N; h++){ S.giftDay = undefined; if (caddieGift(h, d)) n++; }
          Object.keys(S).forEach(x => delete S[x]); Object.assign(S, JSON.parse(keep)); return n / N; };
        o.close = rate(4, -1); o.insep = rate(5, -2);
        if (o.close < 1 / 35 || o.close > 1 / 18) f('one birdie in ' + (1 / o.close).toFixed(1) + ' at Close');
        if (o.insep < 1 / 21 || o.insep > 1 / 11) f('one birdie in ' + (1 / o.insep).toFixed(1) + ' at Inseparable');
        if (rate(3, -1)) f('a gift at Trusted');
        if (rate(5, 0)) f('a gift on a par');
        at(5);
        const none = (why, set, unset) => { set(); let n = 0; for (let h = 1; h < 400; h++) if (caddieGift(h, -1)) n++; unset(); if (n) f(n + ' gifts ' + why); };
        none('away', () => { OFFLINE = true; }, () => { OFFLINE = false; });
        none('in a catch-up', () => { QUIET = true; }, () => { QUIET = false; });
        none('in a wager', () => { S.dgnRun = { id: B.DGN[0].id }; }, () => { S.dgnRun = null; });
        // what it gives, and the line
        { let sov = 0, tick = 0, lo = 99, hi = 0, tlo = 99, thi = 0; S.tickets = 0;
          for (let h = 1; h < 3000; h++) {
            const s0 = S.sov || 0, t0 = S.tickets || 0, g0 = S.gifts || 0; S.giftDay = undefined;
            if (!caddieGift(h, -1)) continue;
            if ((S.gifts || 0) !== g0 + 1) f('a gift not counted');
            const ds = (S.sov || 0) - s0, dt = (S.tickets || 0) - t0;
            if (ds) { sov++; lo = Math.min(lo, ds); hi = Math.max(hi, ds); }
            else if (dt) { tick++; tlo = Math.min(tlo, dt); thi = Math.max(thi, dt); }
            else f('a gift of nothing on hole ' + h);
            S.tickets = 0;
          }
          o.sov = sov + ' of ' + lo + ' to ' + hi; o.tick = tick + ' of ' + tlo + ' to ' + thi;
          if (lo < 2 || hi > 5 || hi === lo) f('sovereigns from ' + lo + ' to ' + hi);
          if (!tick || tick > sov || tlo < 1 || thi > 3) f(tick + ' ticket gifts of ' + tlo + ' to ' + thi + ' (to ' + sov + ' of sovereigns)');
          document.getElementById('toasts').innerHTML = ''; Scene.announce = null;   // (the course's name holds pop-ups: toastwait)
          caddieGift(1, -1, true);
          const t = document.getElementById('toasts').lastElementChild;
          o.toast = t ? t.textContent.replace(/\s+/g, ' ').trim() : '';
          if (!t || !o.toast.includes(caddieNow().n) || !/A gift/.test(o.toast) || o.toast.length > 40) f('the line reads "' + o.toast + '"');
        }
        // through the hole's own finish: a birdie on a hole the hash gives
        { let h = S.hole + 1; while (hr(h, 710) >= 1 / GIFT_ODDS[1] && h < S.hole + 5000) h++;
          S.hole = h; S.scores = []; startHole(); hideSheet();
          const i = B.SCORE.findIndex(s => s.d === -1);
          S.doneT = (B.SCORE[i].r + B.SCORE[i - 1].r) / 2 * S.parTime;
          const g0 = S.gifts || 0; S.giftDay = undefined; finishHole(derive());
          if ((S.gifts || 0) !== g0 + 1) f('a birdie on hole ' + h + ' gave no gift');
          S.doneT = null; }
        // the bond row on the way to Close
        at(3); S.ctab = 'caddie'; renderCadPerks();
        { const row = document.querySelector('#cadRows .bondrow'); o.row = row ? row.textContent : '';
          if (!/gift/.test(o.row)) f('the bond row at Trusted reads "' + o.row + '"'); }
        // save repair
        S.gifts = -1; migrate(); if (S.gifts !== undefined) f('-1 gifts kept');
        S.gifts = 3.9; migrate(); if (S.gifts !== 3) f('3.9 gifts repaired to ' + S.gifts);
      } finally {
        OFFLINE = false; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole(); renderCadPerks();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['one birdie in ' + (1 / r.close).toFixed(1) + ' at Close, one in ' + (1 / r.insep).toFixed(1) + ' at Inseparable; none at Trusted, on a par, away, in a catch-up or a wager',
      'sovereign gifts ' + r.sov + ', ticket gifts ' + r.tick + '; "' + r.toast + '"',
      'a birdie played through the hole\'s finish gives it; the bond row says so; a broken save repaired'];
  }
};
