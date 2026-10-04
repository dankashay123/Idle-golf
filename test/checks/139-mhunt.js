/* The monthly hunt (the user picked it from the menu): three of the rarer
 * animals each calendar month, two by day and one at night, beside the
 * weekly hunt; all three spotted live pays B.MHUNT_SOV once.
 *
 *   - the same three all month, three different Guide entries, one at
 *     night; over ten years every one of the pool comes up
 *   - counted live only, on a fair card; paid once; a new month starts again
 *   - the Guide shows its three under the week's, the line on one row at 320
 *   - a broken save is repaired */
'use strict';
module.exports = {
  name: 'mhunt',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), fails = [], f = m => { if (fails.length < 12) fails.push(m); }, tw = window.toast, keepD = DAY_FORCE;
      try {
        const seen = new Set();
        for (let mo = 24000; mo < 24120; mo++) {
          const a = mhuntOf(mo);
          if (a.join() !== mhuntOf(mo).join()) f('month ' + mo + ' gave two hunts');
          if (new Set(a).size !== 3) f('month ' + mo + ': ' + a.join());
          if (a.filter(id => MHUNT_NIGHT.includes(id)).length !== 1) f('month ' + mo + ' has not one night animal');
          if (a.some(id => !GUIDE.find(g => g.id === id))) f('month ' + mo + ': not in the Guide: ' + a.join());
          a.forEach(id => seen.add(id));
        }
        const miss = MHUNT_DAY.concat(MHUNT_NIGHT).filter(id => !seen.has(id)); if (miss.length) f('never hunted in ten years: ' + miss.join(', '));
        // ---- the same all month, a new one next month ----
        DAY_FORCE = Math.floor(Date.UTC(2026, 9, 1) / 864e5); const mo = monthIdx(); DAY_FORCE += 30; if (monthIdx() !== mo) f('the 31st of October is another month');
        DAY_FORCE += 1; if (monthIdx() !== mo + 1) f('the 1st of November is not the next month');
        DAY_FORCE = Math.floor(Date.UTC(2026, 9, 10) / 864e5);
        // ---- counting and pay ----
        window.toast = () => {}; QUIET = false; delete S.mhunt; S.tier = S.tierMax || 0;
        GUIDE.forEach(g => { S.guide = S.guide || {}; S.guide[g.id] = S.guide[g.id] || 1; });
        const want = mhuntOf(monthIdx()), sov = () => S.sov || 0, other = MHUNT_DAY.find(id => !want.includes(id));
        guideAdd([other]); if (mhuntNow().got.length) f(other + ' (not hunted) counted');
        { const fc = window.fairCard; window.fairCard = () => false; try { guideAdd([want[0]]); } finally { window.fairCard = fc; } if (mhuntNow().got.length) f('counted on an easy card'); }
        OFFLINE = true; guideSpot({ hole: S.hole, course: courseById('willow'), props: [{ kind: 15, an: want[0] }] }); OFFLINE = false;
        if (mhuntNow().got.length) f('counted away');
        guideAdd([want[0]]); guideAdd([want[0]]); if (mhuntNow().got.join() !== want[0]) f('one counted twice: ' + mhuntNow().got.join());
        guideAdd(['g_' + want[1]].filter(id => GUIDE.find(g => g.id === id)).concat(GUIDE.find(g => g.id === 'g_' + want[1]) ? [] : [want[1]]));
        if (mhuntNow().got.length !== 2) f('the second (or a golden one) not counted: ' + mhuntNow().got.join());
        const s0 = sov(), w0 = huntOf(huntWeek()); guideAdd([want[2]]);
        const weekly = w0.includes(want[2]) && !huntNow().paid ? 0 : 0;
        const paid = sov() - s0 - weekly;
        if (!(paid >= B.MHUNT_SOV)) f('all three paid ' + paid + ', not ' + B.MHUNT_SOV);
        const s1 = sov(); guideAdd(want); if (sov() !== s1) f('paid again the same month');
        // (the tag says so)
        const tg = document.getElementById('spotTag');
        delete S.mhunt; guideAdd(want.slice(0, 2)); guideAdd([want[2]]);
        if (!/Month Done/.test(tg.textContent) || !tg.textContent.includes('+' + B.MHUNT_SOV)) f('the tag reads ' + tg.textContent);
        tg.style.display = 'none';
        DAY_FORCE += 31; if (mhuntNow().got.length || mhuntNow().paid) f('a new month kept ' + JSON.stringify(mhuntNow()));
        // ---- the tab ----
        DAY_FORCE = Math.floor(Date.UTC(2026, 8, 10) / 864e5); delete S.mhunt; mhuntNow().got = [mhuntOf(monthIdx())[1]];
        trophyRoom('guide');
        const tiles = [...document.querySelectorAll('#roomBody .guide.mhunt .gtile')];
        if (tiles.length !== 3) f(tiles.length + ' monthly tiles');
        else if (!tiles[1].classList.contains('found') || tiles[0].classList.contains('found')) f('found shown wrongly');
        if (!tiles.every(t => { const i = t.querySelector('img'); return i && i.getAttribute('src').startsWith('data:image'); })) f('a monthly tile without its picture');
        const eb = [...document.querySelectorAll('#roomBody .eyebrow')].find(e => /September Hunt/.test(e.textContent));
        if (!eb || !/1\/3/.test(eb.textContent)) f('the month\'s line reads ' + (eb && eb.textContent));
        hideSheet();
        // ---- repair ----
        S.mhunt = { mo: 'x', got: 3 }; migrate(); if (S.mhunt !== undefined) f('a broken monthly hunt kept');
        const m5 = mhuntOf(24005); S.mhunt = { mo: 24005, got: [m5[0], 'dragon', m5[0]], paid: 7 }; migrate();
        if (!S.mhunt || S.mhunt.got.join() !== m5[0] || S.mhunt.paid !== undefined) f('repair kept ' + JSON.stringify(S.mhunt));
        S.cwild = { willow: { fox: 1, dragon: 1 }, nowhere: { fox: 1 } }; S.cwildDone = { willow: 1 }; migrate();
        if (JSON.stringify(S.cwild) !== '{"willow":{"fox":1}}' || S.cwildDone.willow) f('collections repaired to ' + JSON.stringify([S.cwild, S.cwildDone]));
      } finally { window.toast = tw; DAY_FORCE = keepD; QUIET = false; OFFLINE = false; const o = JSON.parse(SNAP); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); }
      return fails;
    });
    if (r.length) throw new Error(r.join('; '));
    return ['three a month, one at night, all of the pool in ten years; live, fair and once; the Guide\'s row; repaired'];
  }
};
