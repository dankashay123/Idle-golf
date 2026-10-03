/* Card milestones (the user picked them from the menu): every 25 Tour Cards
 * a new pair of tee markers, to Card 200 (a golfer with everything walls at
 * 222).
 *
 *   - which are open follows the best card ever opened, a retirement
 *     included; the newest is worn by itself, one picked in the Cabinet is
 *     kept, one not yet open can never be worn
 *   - opening a card past a milestone says so once, never quietly or away
 *   - each pair is drawn on the tee in its own colours and each looks
 *     different from every other (drawn alone, pixel for pixel)
 *   - the Cabinet's Tee Markers fold: every pair with its picture, the open
 *     ones tapped to wear, the rest saying their card
 *   - a broken save is repaired
 */
'use strict';
module.exports = {
  name: 'teemarks',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); }, keep = window.step, tw = window.toast;
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        if (TEE_MARKS.length !== 9 || TEE_MARKS.some((m, i) => i && m.at !== i * 25)) f('the markers do not come every 25 cards: ' + TEE_MARKS.map(m => m.at).join(','));
        if (TEE_MARKS[TEE_MARKS.length - 1].at > 222) f('a marker past the wall at Card 222');
        // ---- open by the best card ever ----
        S.cardPaid = 0; S.tierMax = 0; S.bestTier = 0; delete S.teeMk;
        if (teeMarkNow().id !== 'red') f('a new golfer wears ' + teeMarkNow().id);
        S.cardPaid = 24; if (teeMarkNow().id !== 'blue') f('at Card 25 he wears ' + teeMarkNow().id);
        S.cardPaid = 0; S.bestTier = 99; if (teeMarkNow().id !== 'gold') f('a best card of 100 wears ' + teeMarkNow().id);
        S.bestTier = 0; S.tierMax = 0; S.tier = 0; S.cardPaid = 130;    // (after a retirement: the cards paid stay)
        if (teeMarkNow().id !== 'oak') f('after a retirement from Card 131 he wears ' + teeMarkNow().id);
        S.teeMk = 'pearl'; if (teeMarkNow().id !== 'pearl') f('the picked Pearl was not worn');
        S.teeMk = 'crown'; if (teeMarkNow().id !== 'oak') f('the Crown, not yet open, was worn: ' + teeMarkNow().id);
        delete S.teeMk;
        // ---- said once, live only ----
        const said = []; window.toast = (m) => { said.push(String(m)); };
        S.cardPaid = 23; S.tierMax = 24; QUIET = false; cardPay();
        if (!said.some(m => /Card 25/.test(m) && /Blue tee markers/.test(m))) f('Card 25 opened said: ' + JSON.stringify(said));
        said.length = 0; S.tierMax = 25; cardPay(); if (said.some(m => /tee markers/.test(m))) f('Card 26 spoke of tee markers again');
        said.length = 0; QUIET = true; S.tierMax = 49; cardPay(); QUIET = false; if (said.some(m => /tee markers/.test(m))) f('said while quiet');
        said.length = 0; OFFLINE = true; S.tierMax = 74; cardPay(); OFFLINE = false; if (said.some(m => /tee markers/.test(m))) f('said while away');
        QUIET = true; window.toast = tw;
        // ---- drawn on the tee, each its own ----
        const c = Scene.b, D = derive(); S.cardPaid = 300; S.chaos = { n: 'Fair' }; Scene.newHole(S.hole, S.tier); Scene.announce = null;
        Scene.camD = 0; Scene.draw(0, D);
        const pics = {};
        for (const m of TEE_MARKS) {
          S.teeMk = m.id; c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); Scene.drawTee(true);
          const d = c.getImageData(0, 0, VW, VH).data; let n = 0, own = 0, key = '';
          const C = [m.col, lite(m.col, 0.4), dark(m.col, 0.25), dark(m.col, 0.28), dark(m.col, 0.5), lite(m.col, 0.45)].map(x => x.toUpperCase());
          for (const sx of [-1, 1]) { const p = Scene.proj(TEE_DECK.mark, sx * TEE_DECK.markLat, TEE_DECK.lift), R = Math.ceil(Math.max(2, 0.11 * LAT * p.s)) + 2;
            for (let y = Math.round(p.y) - 2 * R; y <= Math.round(p.y) + 1; y++) for (let x = Math.round(p.x) - R; x <= Math.round(p.x) + R; x++) {
              if (x < 0 || y < 0 || x >= VW || y >= VH) continue; const i = (y * VW + x) * 4;
              const hx = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
              key += hx; if (C.includes(hx)) own++; n++; } }
          pics[m.id] = key; o[m.id] = own;
          if (own < 6) f(m.n + ' drew ' + own + ' pixels of its colours on the tee');
        }
        const ids = Object.keys(pics);
        for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) if (pics[ids[i]] === pics[ids[j]]) f(ids[i] + ' and ' + ids[j] + ' look the same');
        // ---- the Cabinet ----
        S.cardPaid = 130; delete S.teeMk; QUIET = false; trophyRoom('case'); recOpen.tmk = 1; renderTeeMarks();
        const tiles = [...document.querySelectorAll('#markRows .tmk')];
        if (tiles.length !== TEE_MARKS.length) f(tiles.length + ' tiles for ' + TEE_MARKS.length + ' pairs');
        if (tiles.some(t => { const im = t.querySelector('img'); return !im || !im.getAttribute('src').startsWith('data:image'); })) f('a tile without a picture');
        const locked = tiles.filter(t => t.classList.contains('un'));
        if (locked.length !== 3 || !locked.every((t, i) => t.textContent.includes('Card ' + (150 + i * 25)))) f('the locked tiles: ' + locked.map(t => t.textContent).join(' | '));
        const worn = tiles.filter(t => t.classList.contains('on')); if (worn.length !== 1 || !/Oak/.test(worn[0].textContent)) f('worn: ' + worn.map(t => t.textContent).join('|'));
        tiles.find(t => t.dataset.m === 'stone').click();
        if (S.teeMk !== 'stone' || teeMarkNow().id !== 'stone') f('tapping Stone wore ' + S.teeMk);
        const lk = document.querySelector('#markRows .tmk[data-m="jade"]'); if (lk) lk.click();
        if (S.teeMk !== 'stone') f('tapping the locked Jade changed the pick to ' + S.teeMk);
        hideSheet(); QUIET = true;
        // ---- repair ----
        S.teeMk = 'nope'; migrate(); if (S.teeMk !== undefined) f('a made-up marker kept: ' + S.teeMk);
      } finally {
        window.step = keep; window.toast = tw; OFFLINE = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); QUIET = false; hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('\n'));
    return ['nine pairs, one every 25 cards to 200, open by the best card ever (a retirement kept); the newest worn, a pick kept, a locked one never',
      'a milestone said once, not quietly or away',
      'each drawn on the tee in its colours and unlike the others (' + ['red', 'stone', 'oak', 'crystal', 'crown'].map(k => k + ' ' + r[k]).join(', ') + ' pixels)',
      'the Cabinet\'s fold: every pair pictured, the open tapped to wear, the rest at their card; a broken save repaired'];
  }
};
