/* Course records (the user picked them from the menu): each course keeps
 * the best card posted on it, with the real date, shown in the Trophy
 * Room's Cabinet.
 *
 *   - an event's card posted live sets the course's record when it is the
 *     best there, with the day; a worse card leaves it; an event resolved
 *     away never posts one
 *   - the Cabinet shows a Course Records fold of its own under the Record
 *     (the Record's own rows are not touched): a row for each course with
 *     a record, its card and its date, on one line at a phone's width
 *   - a broken save is repaired
 */
'use strict';
module.exports = {
  name: 'courserecords',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const day = (y, m, d) => Math.round(Date.UTC(y, m, d) / 86400000);
      try {
        hideSheet(); delete S.courseBest;
        // an event's card: the event before the hole he is on, scored so
        const post = (score, d, away) => {
          const per = B.ROUND * B.DAYS, t = tournamentOf(S.hole) + 1;
          S.hole = t * per + 1; S.tourScore = score; DAY_FORCE = d; OFFLINE = !!away;
          endTournament(); OFFLINE = false; DAY_FORCE = null; hideSheet();
          return courseFor(t).id;
        };
        const d1 = day(2026, 9, 3), d2 = day(2026, 9, 9);
        const id = post(-7, d1), R = () => (S.courseBest || {})[id] || {};
        if (R().s !== -7 || R().d !== d1) f('a first card set ' + JSON.stringify(R()));
        // the same course again: one later event on it
        const again = (score, d, away) => { const per = B.ROUND * B.DAYS; let t = tournamentOf(S.hole) + 1;
          while (courseFor(t).id !== id && t < tournamentOf(S.hole) + 5000) t++;
          S.hole = (t - 2) * per + 1; return post(score, d, away); };
        again(-3, d2); if (R().s !== -7 || R().d !== d1) f('a worse card replaced the record: ' + JSON.stringify(R()));
        again(-12, d2, 1); if (R().s !== -7) f('an event away posted a record: ' + JSON.stringify(R()));
        again(-9, d2); if (R().s !== -9 || R().d !== d2) f('a better card did not set the record: ' + JSON.stringify(R()));
        const id2 = post(2, d1);
        o.n = Object.keys(S.courseBest || {}).length;
        if (id2 !== id && o.n !== 2) f(o.n + ' records after two courses');
        // the Cabinet
        trophyRoom('case');
        const rec0 = document.querySelectorAll('#statRows .lb').length;
        const box = document.getElementById('courseRows');
        if (!box) f('no Course Records in the Cabinet');
        else {
          const fold = box.querySelector('.rfold'), head = fold && fold.querySelector('.rfh');
          if (!head || !/Course Records/.test(head.textContent)) f('the fold is not headed Course Records');
          if (head && !fold.classList.contains('open')) head.click();
          const rows = [...document.querySelectorAll('#courseRows .lb')];
          if (rows.length !== o.n) f(rows.length + ' rows for ' + o.n + ' records');
          const row = rows.find(x => x.textContent.includes(courseById(id).n));
          if (!row) f('no row for ' + courseById(id).n);
          else {
            o.row = row.textContent.replace(/\s+/g, ' ').trim();
            if (!/-9/.test(o.row) || !/9\sOct\s2026/.test(o.row)) f('the row reads "' + o.row + '"');
          }
          if (!rows.every(x => x.offsetParent)) f('rows not shown once the fold is open');
        }
        if (document.querySelectorAll('#statRows .lb').length !== rec0) f('the Record\'s rows changed');
        hideSheet();
        // none yet
        delete S.courseBest; trophyRoom('case');
        if (!/None yet/.test((document.getElementById('courseRows') || {}).textContent || '')) f('no word when there are none yet');
        hideSheet();
        // save repair
        S.courseBest = { [id]: { s: -4.4, d: d1 + 0.5 }, nope: { s: 1, d: d1 }, [id2]: { s: 'x', d: d1 } }; migrate();
        if (JSON.stringify(S.courseBest) !== JSON.stringify({ [id]: { s: -4, d: d1 } })) f('repaired to ' + JSON.stringify(S.courseBest));
        S.courseBest = [1]; migrate(); if (S.courseBest !== undefined) f('a list for the records was kept');
      } finally {
        DAY_FORCE = null; OFFLINE = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    // each row on one line at a phone's width, upright and on its side
    const vp = page.viewportSize(), lines = [];
    try {
      for (const [w, h] of [[320, 640], [390, 844], [844, 390]]) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(120);
        const q = await page.evaluate(() => {
          const SNAP = JSON.stringify(S), out = { bad: [] };
          try {
            S.courseBest = {}; const d = Math.round(Date.UTC(2026, 11, 28) / 86400000);
            for (const cs of B.COURSE) S.courseBest[cs.id] = { s: -18, d };
            recOpen.crec = 1; trophyRoom('case');
            const rows = [...document.querySelectorAll('#courseRows .lb')];
            out.n = rows.length;
            for (const x of rows) {
              const sp = x.children[2], nm = x.children[1];
              if (sp.getClientRects().length > 1 || sp.getBoundingClientRect().height > 26) out.bad.push('"' + sp.textContent + '" breaks');
              if (nm.getBoundingClientRect().right > sp.getBoundingClientRect().left + 1) out.bad.push(nm.textContent + ' runs into its card');
              if (x.scrollWidth > x.clientWidth + 1) out.bad.push(nm.textContent + ' overflows');
            }
          } finally {
            recOpen.crec = 0; hideSheet();
            Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
          }
          return out;
        });
        if (q.bad.length) throw new Error(w + 'x' + h + ': ' + q.bad.slice(0, 5).join('; '));
        lines.push(w + 'x' + h + ' ' + q.n + ' rows');
      }
    } finally { await page.setViewportSize(vp); }
    return ['a live card sets its course\'s record with the day; a worse one or one away leaves it',
      'the Cabinet\'s Course Records fold: one row a course, "' + r.row + '"; the Record\'s rows untouched; "None yet" when empty',
      'every course\'s row on one line: ' + lines.join(', '),
      'a broken save repaired'];
  }
};
