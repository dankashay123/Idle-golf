/* The Mythic Favour and the Hole of the Week run (the user asked for both,
 * from the menu).
 *
 * The Mythic Favour is a caddie perk only the three dearest caddies wear:
 *   - with a plain caddie it cannot be bought or worn, its row says whose it
 *     is and its button is greyed; worn and then the caddie changed, it
 *     waits (its clock stands still) and its row says so
 *   - with the Divine, Demonic or Ascended caddie it goes off every 30s as
 *     three lifts at once, power, tempo and prize money, each its number
 *     for its seconds, and the stats really move
 *   - its light comes down in that caddie's own colour, and the caddie casts
 *     it into him: pixels in the caddie's colours between the two of them
 *     as it flies, and about the golfer's chest as it lands, gone by 0.8s
 *   - it does not count toward Full Staff (every ordinary perk)
 *   - the burst about him is drawn once the stream has landed
 * The Hole of the Week run:
 *   - the signature hole of the week played three real weeks running pays
 *     15 sovereigns, and again each week the run goes on; twice in a week
 *     counts once; a week missed starts it again; another kind of
 *     signature hole, or a plain hole, does not count
 *   - the Tour tab's band shows the run, and a junk run in a save is dropped
 */
'use strict';
module.exports = {
  name: 'favour',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, keep = { step: window.step };
      const f = m => o.fails.push(m);
      try {
        hideSheet(); window.step = () => {}; QUIET = false; OFFLINE = false;
        const pk = cperkDef('myth');
        if (!pk || !pk.myth) { f('no Mythic Favour among the caddie perks'); return o; }
        // ---- a plain caddie ----
        S.sov = 5000; S.caddie = 'bib'; S.cperkOwn = {}; S.cperk = 'book';
        cperkPick('myth');
        if (S.cperkOwn.myth || S.cperk === 'myth') f('bought or worn with a plain caddie');
        rangeSub = 'cad'; renderCadPerks();
        const row = () => [...document.querySelectorAll('#cadRows .row')].find(e => /Mythic Favour/.test(e.textContent));
        let R = row();
        if (!R || !/Divine, Demonic or Ascended caddie only/.test(R.textContent) || !R.querySelector('.buy.no')) f('its row with a plain caddie: ' + (R ? R.textContent : 'none'));
        // ---- worn with a Mythic caddie ----
        S.caddie = 'demonic'; cperkPick('myth');
        if (S.cperk !== 'myth' || !S.cperkOwn.myth) f('not worn with the Demonic caddie');
        const sov = S.sov;
        if (sov !== 5000 - pk.cost) f('it cost ' + (5000 - sov) + ', not ' + pk.cost);
        S.buff = {}; S.yards = S.yardsMax * 0.5;
        const D0 = derive();
        S.cperkT = B.CPERK_EVERY - 0.001; tickCaddie(0.01);
        for (const k of ['cPow', 'cSpd', 'cGold']) { const b = S.buff[k]; if (!b || b.v !== 20 || b.t !== 8) f('its ' + k + ': ' + JSON.stringify(b)); }
        const D1 = derive();
        o.pow = D1.pow / D0.pow; o.spd = D1.spd / D0.spd;
        if (Math.abs(o.pow - 1.2) > 0.01 || Math.abs(o.spd - 1.2) > 0.01) f('power x' + o.pow.toFixed(3) + ', tempo x' + o.spd.toFixed(3) + ', not x1.2');
        if (!Scene.bless || Scene.bless.col !== MYTH_PAL.demonic[1]) f('its light came down in ' + (Scene.bless && Scene.bless.col));
        if (!Scene.fairyCast || Scene.fairyCast.myth !== 'demonic') f('the caddie did not cast it');
        // ---- the cast, drawn ----
        const D = derive(), c = Scene.b;
        for (const cd of MYTH_CADDIES) {
          S.caddie = cd; buildSprites();
          const PAL = new Set(MYTH_PAL[cd]);
          const at = (T) => {
            Scene.t = 50; Scene.fairyCast = { t0: 50 - T, word: 'FAVOUR', myth: cd }; Scene.bless = null; Scene.fairyMove = null;
            Scene.draw(0, D);
            const fb = Scene._fairy, g = Scene.golferPose();
            const d = c.getImageData(0, 0, VW, VH).data;
            const cnt = (x0, y0, x1, y1) => { let n = 0; for (let y = Math.max(0, y0 | 0); y < Math.min(VH, y1); y++) for (let x = Math.max(0, x0 | 0); x < Math.min(VW, x1); x++) {
              const i = (y * VW + x) * 4, h = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase(); if (PAL.has(h)) n++; } return n; };
            return { fb, g, cnt };
          };
          const diffAt = (T, box) => {
            const A = at(T); const a = A.cnt(...box(A));
            // the same frame with only the favour taken away (the ordinary
            // cast's sparkle is white too, like the Divine's)
            const fav = Scene.drawFavour; Scene.drawFavour = () => {};
            Scene.fairyCast = { t0: 50 - T, word: 'FAVOUR', myth: cd }; Scene.draw(0, D);
            Scene.drawFavour = fav;
            const d = c.getImageData(0, 0, VW, VH).data, PAL2 = PAL; let n = 0; const [x0, y0, x1, y1] = box(A);
            for (let y = Math.max(0, y0 | 0); y < Math.min(VH, y1); y++) for (let x = Math.max(0, x0 | 0); x < Math.min(VW, x1); x++) {
              const i = (y * VW + x) * 4, h = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase(); if (PAL2.has(h)) n++; }
            return a - n;
          };
          // between them, above: in flight
          const mid = diffAt(0.22, A => [A.fb.x + A.fb.w, A.fb.y - A.g.h * 0.6, A.g.x + A.g.w * 0.3, A.g.y + A.g.h * 0.5]);
          // about his chest, once the stream has landed
          const land = diffAt(0.72, A => [A.g.x - A.g.w * 0.3, A.g.y, A.g.x + A.g.w * 1.3, A.g.y + A.g.h * 0.8]);
          const gone = diffAt(0.85, A => [0, 0, VW, VH]);
          o[cd] = mid + '/' + land + '/' + gone;
          if (mid < 4) f(cd + '\'s favour in flight: ' + mid + ' pixels between them');
          if (land < 4) f(cd + '\'s favour landing: ' + land + ' pixels about him');
          if (gone > 0) f(cd + '\'s favour still drawn at 0.85s: ' + gone + ' pixels');
        }
        Scene.fairyCast = null;
        // ---- worn, then a plain caddie: it waits ----
        S.caddie = 'bib'; S.cperkT = 3; S.buff = {};
        tickCaddie(B.CPERK_EVERY);
        if (S.cperkT !== 3 || S.buff.cPow) f('with a plain caddie it went on (clock ' + S.cperkT + ')');
        renderCadPerks(); R = row();
        if (!R || !/waits for a Mythic caddie/.test(R.textContent)) f('worn with a plain caddie, its row: ' + (R ? R.textContent : 'none'));
        // ---- Full Staff ----
        S.cperkOwn = {}; for (const p of B.CPERKS) S.cperkOwn[p.id] = 1;
        if (achMetric('cperks') !== B.ACH.find(a => a.id === 'staff').v) f('Full Staff wants the Mythic Favour too');

        // ---- the Hole of the Week run ----
        DAY_FORCE = 3000 * 7; const next = n => { DAY_FORCE += 7 * n; };
        const course = B.COURSE.findIndex(cs => cs.slot === 'home'); DEV.course(course); hideSheet();
        const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
        const holes = []; for (let h = first; h < first + B.ROUND; h++) holes.push(h);
        const hOf = k => holes.find(h => sigKind(h) === k);
        const plain = holes.find(h => !sigKind(h));
        o.log = [];
        const play = (k) => { const h = k ? hOf(k) : plain; if (h === undefined) return 'no ' + k;
          const was = S.hole; S.hole = h; const s0 = S.sov; sigScore({ d: 0 }); S.hole = was; return S.sov - s0; };
        SIGWEEK_FORCE = 'island';
        S.hotw = undefined; delete S.hotw; S.sov = 0;
        const p = [];
        p.push(play('island')); // week 1
        p.push(play('island')); // same week
        next(1); p.push(play('island')); // week 2
        next(1); p.push(play('canyon')); // another kind: not counted
        p.push(play(null));            // a plain hole
        p.push(play('island')); // week 3: pays
        next(1); p.push(play('island')); // week 4: pays again
        p.push(play('island')); // and again that week: once a week
        o.run1 = S.hotw && S.hotw.n;
        next(2); p.push(play('island')); // a week missed: starts again
        o.pays = p;
        const want = [0, 0, 0, 0, 0, B.HOTW_SOV, B.HOTW_SOV, 0, 0];
        if (JSON.stringify(p) !== JSON.stringify(want)) f('the run paid ' + JSON.stringify(p) + ', not ' + JSON.stringify(want));
        if (o.run1 !== 4 || S.hotw.n !== 1) f('the run read ' + o.run1 + ' then ' + (S.hotw && S.hotw.n) + ', not 4 then 1');
        // the band
        S.hotw = { wk: weekNow() - 1, n: 3 }; renderSigWeek();
        const lbl = [...$('sigBox').querySelectorAll('.lb')].map(l => l.children[1].textContent + '=' + l.children[2].textContent).find(x => /Hole of the Week Run/.test(x));
        o.band = lbl;
        if (!lbl || !/3 weeks/.test(lbl)) f('the band: ' + lbl);
        next(3); renderSigWeek();
        const lbl2 = [...$('sigBox').querySelectorAll('.lb')].map(l => l.children[2].textContent).pop();
        if (!/^0 of 3/.test(lbl2)) f('a run long lapsed reads ' + lbl2);
        // a junk run dropped, a good one kept
        S.hotw = { wk: 'x', n: -2 }; initState(); if (S.hotw !== undefined) f('a junk run kept: ' + JSON.stringify(S.hotw));
        S.hotw = { wk: 3001, n: 2 }; initState(); if (!S.hotw || S.hotw.n !== 2) f('a good run dropped');
      } finally {
        DAY_FORCE = null; SIGWEEK_FORCE = null; window.step = keep.step;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['Mythic Favour: greyed with a plain caddie, and waits there; with a Mythic one +20% power, tempo and purse for 8s (power x' + r.pow.toFixed(2) + ', tempo x' + r.spd.toFixed(2) + ')',
            'the cast, in flight/landing/at 0.85s: divine ' + r.divine + ', demonic ' + r.demonic + ', ascended ' + r.ascended,
            'Hole of the Week run paid ' + JSON.stringify(r.pays) + '; the band reads "' + r.band + '"'];
  }
};
