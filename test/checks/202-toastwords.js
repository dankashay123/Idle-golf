/* The words of the toasts over a stretch of play, against the rules for
 * words on screen (the user: short, plain, a figure always with its unit,
 * never a shortened word, never "each"):
 *
 *   - a fresh game played on, every toast it shows read
 *   - no count over one with a singular word ("+3 attribute")
 *   - no figure standing bare where its unit belongs ("best nine, 655")
 *   - no shortened word, no "each", no "per cent", nothing broken
 *     (undefined, NaN, null, Infinity) */
'use strict';
module.exports = {
  name: 'toastwords',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), tt = window.toast, log = [], fails = [];
      const clean = h => String(h).replace(/<img[^>]*alt="([^"]*)"[^>]*>/g, ' [$1] ').replace(/<\/(span|div|b)>/g, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ').trim();
      try {
        hideSheet(); Scene.announce = null;
        window.toast = function(h){ log.push(clean(h)); return tt.apply(this, arguments); };
        // a new game from the start, played on, buying the cheapest upgrade as it goes
        loadSaveObject({}); startHole(); buildSprites(); Scene.announce = null;
        for (let i = 0; i < 12000; i++) {
          step(B.TICK_MAX, derive());
          if (i % 25 === 0) for (let g = 0; g < 40; g++) { let best = null, bc = Infinity; for (const u of B.UPG) { const lv = upgLv(u.id); if (lv >= capOf(u)) continue; const c = costBulk(u.base, u.r, lv, 1); if (c < bc) { bc = c; best = u; } } if (!best || S.gold < bc) break; S.gold -= bc; S.upg[best.id] = upgLv(best.id) + 1; }
          if (i % 200 === 0) { try { hideSheet(); } catch (e) {} }
        }
        // and a level gained several at once, and a best nine, said as they are
        S.xp = 0; addXp((xpNeed(S.lv) + xpNeed(S.lv + 1)) * 1.01);
        const U = [...new Set(log)];
        const words = 'talent|attribute|ticket|shard|scroll|point|hole|second|minute|hour|day|cup|major|bag|club|level|entry|time|sovereign|birdie|eagle|ace';
        for (const t of U) {
          const m = t.match(new RegExp('(?:^|[^\\d.,])(\\d{2,}|[2-9])(?:\\.\\d+)? (' + words + ')\\b', 'i'));
          if (m) fails.push('a count with a singular word: "' + t + '"');
          if (/, [\d.,]+[KMBTQ]?(?: ·|$)/.test(t)) fails.push('a figure without its unit: "' + t + '"');
          if (/\b(sec|secs|mins?|hrs?|lvl|lv|pts?|yds?|xp|avg|approx|req)\b/i.test(t)) fails.push('a shortened word: "' + t + '"');
          if (/\beach\b|per cent/i.test(t)) fails.push('"each" or "per cent": "' + t + '"');
          if (/undefined|NaN|null|\[object|Infinity/.test(t)) fails.push('something broken: "' + t + '"');
        }
        return { fails: fails.slice(0, 8), n: log.length, u: U.length, lv: S.lv, holes: S.totalHoles, q: QUIET, off: typeof OFFLINE !== 'undefined' && OFFLINE, ex: U.slice(0, 3) };
      } finally { window.toast = tt; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); hideSheet(); Scene.newHole(S.hole, S.tier); }
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    if (r.u < 20) throw new Error(JSON.stringify(r) + ' only ' + r.u + ' different toasts read in the stretch played: too few to judge');
    return ['the toasts of a new game played to Level ' + r.lv + ' (' + r.holes + ' holes; ' + r.n + ' toasts, ' + r.u + ' different): every count in the plural past one, every figure with its unit, no shortened word, no "each", nothing broken'];
  }
};
