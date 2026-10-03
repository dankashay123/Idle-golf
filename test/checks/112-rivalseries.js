/* The rival across a season (the user picked "a named rival whose scores
 * you chase across a season" from the menu): the same golfer every event of
 * a season, a series between you, and a line on the final day as the lead
 * changes hands.
 *
 *   - one rival all season, and a new one now and then as seasons turn
 *   - the series: a win or a loss each event (a tie or an event resolved
 *     away is neither); won outright by the season's last event it pays
 *     RIVAL_SERIES once, lost it pays nothing; the event's sheet shows it
 *   - on the final day a line as you go past them and as they come back,
 *     none on the days before and none for holding a lead
 *   - a mangled series in a save is thrown away
 */
'use strict';
module.exports = {
  name: 'rivalseries',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); }, SNAP = JSON.stringify(S);
      try {
        hideSheet();
        // one all season
        const names = [];
        for (let sn = 0; sn < 8; sn++) {
          const set = new Set();
          for (let e = 1; e <= B.SEASON; e++) { const t = sn * B.SEASON + e; S.rival = null; S.hole = (t - 1) * B.ROUND * B.DAYS + 1; set.add(rivalNow().n); }
          if (set.size !== 1) f('season ' + sn + ' had ' + set.size + ' rivals: ' + [...set].join(', '));
          names.push([...set][0]);
        }
        o.names = new Set(names).size;
        if (o.names < 3) f('only ' + o.names + ' rivals over eight seasons');
        // the series, through whole seasons
        S.tier = 0; S.tierMax = 5; QUIET = true;
        const season = (sn, res) => {
          let paid = 0, sheet = '';
          res.forEach((x, i) => {
            const t = sn * B.SEASON + i + 1;
            S.rival = { t, n: B.RIVALS[0], total: -40 }; S.hole = t * B.ROUND * B.DAYS + 1;
            S.tourScore = x === 'w' ? -50 : x === 'l' ? -30 : -40;
            const s0 = S.sov || 0; OFFLINE = x === 'a';
            QUIET = i < res.length - 1;
            try { endTournament(); } finally { OFFLINE = false; QUIET = true; }
            paid += (S.sov || 0) - s0 - (x === 'w' ? B.RIVAL_SOV : 0);
            if (i === res.length - 1) sheet = (document.getElementById('sheet') || {}).textContent || '';
            hideSheet();
          });
          return { paid, sheet, R: S.rivalSer };
        };
        const A = season(10, ['w', 'w', 'l', 'w', 't', 'w']);
        if (!A.R || A.R.w !== 4 || A.R.l !== 1) f('4 wins, a loss and a tie came to ' + JSON.stringify(A.R));
        if (A.paid !== B.RIVAL_SERIES) f('a series won paid ' + A.paid + ', not ' + B.RIVAL_SERIES);
        if (!/Season series: 4–1/.test(A.sheet) || !/won/.test(A.sheet)) f('the last event\'s sheet does not show the series won: ' + A.sheet.slice(0, 200));
        const L = season(11, ['l', 'w', 'l', 'a', 'a', 'l']);
        if (!L.R || L.R.w !== 1 || L.R.l !== 3) f('a series with two away came to ' + JSON.stringify(L.R));
        if (L.paid !== 0) f('a series lost paid ' + L.paid);
        if (!/Season series: 1–3/.test(L.sheet)) f('the sheet does not show the series lost');
        const N = season(12, ['w']);
        if (!N.R || N.R.s !== 12 || N.R.w !== 1 || N.R.l !== 0) f('a new season did not start a new series: ' + JSON.stringify(N.R));
        // the final day's lines
        QUIET = false; hideSheet();
        const said = () => [...document.querySelectorAll('#toasts .toast')].map(e => e.textContent).filter(s => /Rival/.test(s));
        const day = (d) => { const t = 40, h0 = (t - 1) * B.ROUND * B.DAYS + d * B.ROUND + 1;
          S.rival = { t, n: B.RIVALS[2], total: -36 }; S.hole = h0; document.getElementById('toasts').innerHTML = '';
          // level, then three under them, then back over
          const go = sc => { S.tourScore = sc; rivalChase(); S.hole++; };
          go(Math.round(-36 * (d * B.ROUND + 1) / 72)); go(-60); go(-61); go(0);
          return said(); };
        const fin = day(B.DAYS - 1), first = day(0);
        if (fin.length !== 2 || !/Past/.test(fin[0]) || !/back in front/.test(fin[1])) f('the final day said ' + JSON.stringify(fin));
        if (first.length) f('the first day said ' + JSON.stringify(first));
        o.lines = fin;
        // a mangled series
        for (const bad of [5, [1], { s: 'x', w: 1, l: 0 }, { s: 3, w: -1, l: 0 }]) { S.rivalSer = bad; migrate(); if (S.rivalSer !== undefined) f('kept ' + JSON.stringify(bad)); }
        S.rivalSer = { s: 3.5, w: 2.2, l: 1 }; migrate(); if (JSON.stringify(S.rivalSer) !== '{"s":3,"w":2,"l":1}') f('repaired to ' + JSON.stringify(S.rivalSer));
      } finally {
        QUIET = false; OFFLINE = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['one rival each season, ' + r.names + ' over eight',
      'the series: won 4–1 pays ' + 'once at the season\'s end, lost pays nothing, a tie and an event away count neither way; the sheet shows it',
      'the final day: ' + r.lines.map(s => s.replace(/^Rival/, '')).join(' / ') + '; nothing on the first day; a mangled series thrown away'];
  }
};
