/* The words for talents, heirlooms and honours say what the game does (the
 * user asked for each list checked against what it does):
 *
 *   - a talent's figure at every rank is the one the game adds up for it
 *     (Rhythm said "30% faster" for 30% less time; Sweet Contact read
 *     "+56.0%")
 *   - an attribute's total has no trailing noughts ("+72.0%")
 *   - an heirloom's figure is the one the game multiplies by, to within a
 *     hundredth, and changes on screen with every level up to its top (one
 *     place of decimals left most of the small ones reading the same from
 *     one level to the next)
 *   - an honour's reward reads the same in its toast as on the list; the
 *     Tour Card bar counts the card as its number (Card 1 of 10 is a tenth);
 *     Every Door counts its wagers; Course Record shows its minus sign; Better
 *     Season shows no count of one */
'use strict';
module.exports = {
  name: 'wordsmatch',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), fl = [], f = m => { if (fl.length < 12) fl.push(m); }, tw0 = window.toast, o = {};
      try {
        hideSheet(); QUIET = true;
        // ---- talents ----
        let tal = 0;
        for (const tr of B.TREES) for (const t of tr.t) {
          if (t.max === 1) continue;
          for (let n = 1; n <= t.max; n++) {
            Object.keys(S.tal).forEach(k => S.tal[k] = 0); S.tal[t.id] = n;
            const v = career()[t.k], txt = talDesc(t, n), num = +(txt.match(/[\d.]+/) || [NaN])[0];
            const want = t.k === 'dfloor' ? v : t.k === 'reson' ? Math.round((B.DAMPEN + v) * 100) : t.k === 'shave' ? Math.round(Math.min(0.9, v) * 100)
              : t.k === 'cdr' ? Math.round(Math.min(0.75, v) * 100) : Math.round(v * 100);
            if (num !== want) f(t.n + ' at rank ' + n + ' reads "' + txt + '", the game adds ' + v);
            if (/\.0\b|faster/.test(txt) && t.k === 'cdr') f(t.n + ' reads "' + txt + '"');
            tal++;
          }
        }
        Object.keys(S.tal).forEach(k => S.tal[k] = 0);
        o.tal = tal;
        // ---- attributes ----
        for (const s of B.STATS) for (const n of [1, 7, 60]) { const t = statTotal(s.v, n); if (/\d\.\d*0%/.test(t)) f(s.n + ' at ' + n + ' points reads "' + t + '"'); }
        // ---- heirlooms ----
        let hl = 0;
        for (const t of B.TROPHY) {
          if (t.g) {
            let prev = null;
            for (let lv = 1; lv <= trTop(t); lv++) {
              const txt = trophyEff(t, lv), m = trophyMultAt(t, lv);
              if (m < 10) { const shown = +txt.replace(/[^\d.]/g, ''); if (Math.abs(shown - m) > 0.0051) f(t.n + ' at level ' + lv + ' reads ' + txt + ', multiplies by ' + m.toFixed(4)); }
              if (txt === prev) f(t.n + ' reads ' + txt + ' at levels ' + (lv - 1) + ' and ' + lv);
              prev = txt; hl++;
            }
          } else for (const lv of [1, trTop(t)]) { const txt = trophyEff(t, lv); if (!txt || txt === '—' || /cards of purse|\(all\)/.test(txt)) f(t.n + ' at level ' + lv + ' reads "' + txt + '"'); }
        }
        o.hl = hl;
        // ---- honours ----
        const seen = []; window.toast = m => seen.push(String(m));
        const done0 = S.achDone; S.achDone = {}; B.ACH.forEach(a => S.achDone[a.id] = 1);
        let toasts = 0;
        for (const a of B.ACH.filter(a => !['tick', 'grit', 'shard', 'scroll', 'legacy'].includes(a.r.k))) {
          delete S.achDone[a.id]; const keep = window.achMetric; seen.length = 0;
          S.achSov = 1; const mv = achMetric; window.achMetric = m => m === a.m ? a.v : mv(m);
          try { checkAch(); } finally { window.achMetric = keep; }
          const said = seen.join(' ').replace(/<[^>]+>/g, '').replace(/ /g, ' ');
          if (!said.includes(achReward(a).replace(/ /g, ' '))) f(a.n + ': the toast says "' + said.slice(0, 120) + '", the list "' + achReward(a) + '"');
          S.achDone[a.id] = 1; toasts++;
        }
        o.toasts = toasts; S.achDone = done0 || {};
        window.toast = tw0;
        const t10 = B.ACH.find(a => a.id === 't10'); S.bestTier = 0;
        if (!(achRatio(t10) > 0.09)) f('on Card 1 the Card 10 bar reads ' + achRatio(t10));
        const door = B.ACH.find(a => a.id === 'all4'); B.DGN.forEach((d, i) => S.dgnFloor[d.id] = i < 2 ? 12 : 0);
        S.bestRound = -123; delete S.achDone.all4; delete S.achDone.rec;
        const w = document.createElement('div'); honRows(w);
        const row = n => [...w.querySelectorAll('.row')].find(e => e.querySelector('.nm').textContent.includes(n));
        const rd = row('Every Door'), rr = row('Course Record'), bs = [...w.querySelectorAll('.lb.rep')].find(e => /Better Season/.test(e.textContent));
        if (!rd || !/2 \/ 6/.test(rd.textContent)) f('Every Door reads ' + (rd && rd.querySelector('.mt').textContent));
        if (!rr || !/−123 \/ −200/.test(rr.textContent)) f('Course Record reads ' + (rr && rr.querySelector('.mt').textContent));
        if (!bs || /\//.test(bs.querySelector('.s').textContent)) f('Better Season reads ' + (bs && bs.querySelector('.s').textContent));
      } finally { window.toast = tw0; QUIET = false; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return [r.o.tal + ' talent ranks read as the game adds them up; attributes without trailing noughts', r.o.hl + ' heirloom levels read as they multiply, each different from the last; ' + r.o.toasts + ' honour toasts worded as the list; the Card bar, Every Door, Course Record and Better Season read right'];
  }
};
