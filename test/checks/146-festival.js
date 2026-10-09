/* The weekend festival (the user picked it from the menu): every other
 * weekend, Saturday and Sunday, a festival of the season with one twist to
 * play; ribbons for birdies or better played live; five prizes, the last the
 * festival's tee markers.
 *
 *   - on on the weekend of an even week only, by the game's clock; the
 *     festival of the real month's season (each season swept)
 *   - each twist where it says: pace, gear luck, wager entries, the albatross
 *   - ribbons a stroke under par, live only (not away, quietly, in a wager);
 *     a prize at each mark, once; sovereigns wait on Today; the tee markers
 *     won wearable; a new festival starts again from none
 *   - Today says it, on and off; a broken save repaired */
'use strict';
module.exports = {
  name: 'festival',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m), SNAP = JSON.stringify(S), tw = window.toast, keepD = DAY_FORCE, fd = window.featDay, was = SOV_AUTO;
      try {
        hideSheet(); window.toast = () => {}; FEST_FORCE = null; delete S.fest; delete S.festMk;
        // ---- when: the days of a year ----
        const day0 = Math.floor(Date.UTC(2026, 0, 1) / 864e5), seen = {}; let on = 0;
        for (let d = day0; d < day0 + 365; d++) { DAY_FORCE = d; const F = festNow(); const dow = festDow();
          if (F) { on++; if (dow < 5) f('a festival on a weekday ' + d); if (weekNow() % 2) f('a festival in an odd week ' + d);
            const want = FEST[MONTH_SEASON[new Date(d * 864e5).getUTCMonth()]]; if (F.id !== want.id) f('day ' + d + ': ' + F.id + ' not ' + want.id); seen[F.id] = 1; }
          else if (dow >= 5 && weekNow() % 2 === 0) f('no festival on day ' + d); }
        if (on < 48 || on > 56) f(on + ' festival days a year');
        if (Object.keys(seen).length !== 4) f('festivals in a year: ' + Object.keys(seen).join(','));
        // ---- the twists ----
        DAY_FORCE = day0 + 2; FEST_FORCE = null; const D0 = derive();
        FEST_FORCE = 'mid'; if (Math.abs(derive().spdRaw / D0.spdRaw - 1.25) > 1e-6) f('Midsummer pace x' + derive().spdRaw / D0.spdRaw);
        FEST_FORCE = 'harvest'; if (Math.abs(derive().drop - Math.min(1, D0.drop + 0.2 * relMult('drp'))) > 1e-6) f('Harvest gear luck ' + derive().drop + ' from ' + D0.drop);
        FEST_FORCE = 'frost'; { const d = B.DGN[0]; S.dgnKeys[d.id] = 0; S.dgnKeyT[d.id] = 0; regenKeys(keyInterval(d) / 2 + 1); if (S.dgnKeys[d.id] !== 1) f('Frost Fair entries: ' + S.dgnKeys[d.id] + ' after half an interval'); }
        FEST_FORCE = 'bloom'; { let t = 0; for (let i = 0; i < 40; i++) { albGo(); t += LUCKY.wait; } LUCKY.a = null; if (t / 40 > (ALB_GAP[0] + ALB_GAP[1]) / 2 * 0.65) f('Blossom albatross waits ' + (t / 40)); }
        // ---- ribbons and prizes ----
        SOV_AUTO = false; S.owed = [];
        FEST_FORCE = 'harvest'; delete S.fest; QUIET = false; OFFLINE = false;
        festHole(-2); if (festState().n !== 2) f('an eagle gave ' + festState().n + ' ribbons');
        festHole(0); festHole(1); if (festState().n !== 2) f('par or worse gave ribbons');
        OFFLINE = true; festHole(-3); OFFLINE = false; QUIET = true; festHole(-3); QUIET = false;
        S.dgnRun = { id: B.DGN[0].id }; festHole(-3); S.dgnRun = null;
        if (festState().n !== 2) f('ribbons away, quietly or in a wager: ' + festState().n);
        const sov0 = S.sov || 0, sh0 = S.shard;
        for (let i = 0; i < 700; i++) festHole(-2);
        const st = festState(); if (st.got !== 5) f('prizes at ' + st.n + ' ribbons: ' + st.got);
        if (!(S.shard > sh0)) f('the shards prize not paid');
        if ((S.sov || 0) !== sov0) f('sovereigns paid at once, not waiting');
        if (owedSum('today') !== 21) f('waiting on Today: ' + owedSum('today'));
        if (!teeMarkOk(TEE_MARKS.find(m => m.id === 'f_pk'))) f('the Harvest markers not won');
        if (teeMarkOk(TEE_MARKS.find(m => m.id === 'f_flake'))) f('the Frost Fair markers won with the Harvest');
        festHole(-4); if (st.got !== 5 || owedSum('today') !== 21) f('a prize twice');
        // ---- a new festival ----
        S.fest.wk -= 2; if (festState().n) f('a new festival kept ' + festState().n + ' ribbons');
        // ---- Today ----
        trophyRoom('today'); if (!/Harvest Festival/.test(document.getElementById('roomBody').textContent)) f('Today does not say the festival');
        FEST_FORCE = null; DAY_FORCE = day0 + 1; trophyRoom('today'); if (!/Next festival/.test(document.getElementById('roomBody').textContent)) f('Today does not say the next festival');
        hideSheet();
        // ---- repair ----
        S.fest = { wk: 'x' }; S.festMk = { f_pk: 1, red: 1, nope: 1 }; migrate();
        if (S.fest !== undefined) f('a broken festival kept'); if (JSON.stringify(S.festMk) !== '{"f_pk":1}') f('markers repaired to ' + JSON.stringify(S.festMk));
      } finally { window.toast = tw; FEST_FORCE = null; DAY_FORCE = keepD; QUIET = false; OFFLINE = false; SOV_AUTO = was; hideSheet(); const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); }
      return fails;
    });
    if (r.length) throw new Error(r.slice(0, 8).join('; '));
    return ['every other weekend, the season\'s festival, swept over a year; each twist; ribbons live only, prizes once, sovereigns waiting, its tee markers; Today says it; repaired'];
  }
};
