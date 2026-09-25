/* Caddie perk upgrades: longer and stronger blessings, bought with sovereigns.
 *
 * On the Range's Caddie rack the perk he wears can be taken up a level at a
 * time, to Lv 5: each level lasts a second longer and is an eighth stronger
 * (Ready Golf and Lost Ball Scout only stronger: one acts at once, the other
 * lasts a hole), and its light comes down a little brighter.
 *
 *   - each step costs what the button says, and only with the sovereigns to
 *     pay for it; a perk not owned cannot be; Lv 5 is the top
 *   - every perk at every level, going off, moves its stat by what its words
 *     say and for as long; Lv 1 reads and works exactly as before
 *   - the line by the cog says the level's numbers
 *   - on the rack the worn row says its level and its button upgrades it, and
 *     the row keeps inside the screen on a 320 phone
 *   - a save with junk for levels loads clean; Head Caddie comes with a
 *     perk at Lv 5, once; the developer menu sets every owned perk's level
 *   - the blessing at Lv 5 is wider, brighter and lasts longer than at Lv 1
 */
'use strict';
module.exports = {
  name: 'perkup',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}, SNAP = JSON.stringify(S);
      hideSheet(); QUIET = false;
      try {
        // ---- buying ----
        S.cperkOwn = { tempo: 1 }; S.cperk = 'tempo'; S.cperkLv = {}; S.sov = 99;
        o.poor = [cperkUp('tempo'), cperkLv('tempo'), S.sov].join();
        // (Head Caddie already won, or its payout on reaching Lv 5 reads as a cheaper step)
        S.achDone.headcad = 1;
        // and any other honour already due paid before the prices are read
        S.sov = 100000; checkAch(); const paid = [];
        for (let i = 0; i < 6; i++) { const s0 = S.sov, ok = cperkUp('tempo'); paid.push(ok ? s0 - S.sov : 'no'); }
        o.paid = paid.join(); o.top = cperkLv('tempo');
        o.notOwned = [cperkUp('chat'), cperkLv('chat')].join();

        // ---- what each level does, going off ----
        o.bad = []; o.lv1 = [];
        const fire = (id, lv) => {
          S.cperkOwn = { [id]: 1 }; S.cperk = id; S.cperkLv = lv > 1 ? { [id]: lv } : {};
          S.buff = {}; S.yards = S.yardsMax; S.elapsed = 5; S.cperkT = B.CPERK_EVERY - 0.001; tickCaddie(0.01);
        };
        const pct = v => v < 1 ? Math.round(v * 100) : v;
        for (const pk of B.CPERKS) {
          o.lv1.push(cperkTxt(pk.s, pk, 1) === pk.s && cperkTxt(pk.d, pk, 1) === pk.d ? '' : pk.id);
          for (let lv = 1; lv <= B.CPERK_LV_MAX; lv++) {
            fire(pk.id, lv);
            const want = pk.v * (1 + B.CPERK_LV_V * (lv - 1));
            const wantT = pk.now || pk.next ? pk.t : pk.t + (lv - 1);
            if (pk.now) {
              const took = 5 - S.elapsed;
              if (Math.abs(took - want) > 0.051) o.bad.push(pk.id + ' Lv ' + lv + ' wound the clock back ' + took.toFixed(2) + 's, not ' + want.toFixed(2));
            } else {
              const b = S.buff[pk.k];
              if (!b || Math.abs(b.v - want) > Math.max(0.51, Math.abs(want) * 0.01 + (pk.v < 1 ? 0.0051 : 0)) || b.t !== wantT)
                o.bad.push(pk.id + ' Lv ' + lv + ' gave ' + (b ? b.v + ' for ' + b.t : 'nothing') + ', not ' + want + ' for ' + wantT);
              // and its words say the same numbers
              const words = cperkTxt(pk.d, pk, lv), num = String(pct(b ? b.v : 0));
              if (words.indexOf(num) < 0 || (!pk.next && words.indexOf(wantT + 's') < 0))
                o.bad.push(pk.id + ' Lv ' + lv + ' reads "' + words + '" for ' + (b ? b.v : 0) + ' over ' + wantT + 's');
            }
          }
        }
        // the stat really moves: tempo at Lv 5 against none
        S.buff = {}; const spd0 = derive().spd; fire('tempo', 5); o.spd5 = derive().spd / spd0;
        S.buff = {}; fire('tempo', 1); o.spd1 = derive().spd / spd0;

        // ---- the line by the cog ----
        fire('tempo', 3); cperkShow = { id: 'tempo', left: 2 }; buffTip(0);
        o.line3 = $('buffTip').textContent;
        fire('ready', 5); cperkShow = { id: 'ready', left: 2 }; buffTip(0);
        o.lineReady5 = $('buffTip').textContent;
        cperkShow = null; S.buff = {}; buffTip(0);

        // ---- the rack ----
        S.cperkOwn = { tempo: 1, chat: 1 }; S.cperk = 'tempo'; S.cperkLv = { tempo: 2, chat: 5 }; S.sov = 1000;
        setView('upg'); rangeSub = 'cad'; renderRangeNav();
        const row = n => [...document.querySelectorAll('#cadRows .row')].find(x => x.querySelector('.nm').textContent === n);
        const read = n => { const x = row(n), b = x.querySelector('.buy');
          return { mt: x.querySelector('.mt').textContent, lbl: b.children[0].textContent, amt: b.children[1].textContent,
                   ds: x.querySelector('.ds').textContent }; };
        o.worn = read('Tempo Call'); o.other = read('Sponsor Chat'); o.none = read('Green Reader');
        const s0 = S.sov; row('Tempo Call').querySelector('.buy').click();
        o.clicked = [cperkLv('tempo'), s0 - S.sov].join();
        S.cperkLv.tempo = 5; renderCadPerks(); o.atTop = read('Tempo Call');
        S.cperkLv.tempo = 2; renderCadPerks();

        // ---- a save with junk in it ----
        S.cperkOwn = { tempo: 1, chat: 1 };
        S.cperkLv = { tempo: 9, chat: 'x', book: 3, nope: 4, read: -2 };
        initState(); o.repaired = JSON.stringify(S.cperkLv);
        S.cperkLv = [3, 4]; initState(); o.repairedArr = JSON.stringify(S.cperkLv);
        S.cperkLv = { tempo: 2.6 }; initState(); o.repairedFrac = JSON.stringify(S.cperkLv);

        // ---- Head Caddie, and the developer menu ----
        const hc = B.ACH.find(a => a.id === 'headcad');
        delete S.achDone.headcad; S.cperkOwn = { tempo: 1 }; S.cperk = 'tempo'; S.cperkLv = { tempo: 4 }; checkAch();
        o.hc4 = !!S.achDone.headcad;
        const sov0 = S.sov; S.cperkLv = { tempo: 5 }; checkAch(); o.hc5 = !!S.achDone.headcad; o.hcPaid = S.sov - sov0;
        const sov1 = S.sov; checkAch(); o.hcAgain = S.sov - sov1;
        o.hcSov = hc && hc.sov;
        S.cperkOwn = { tempo: 1, book: 1 }; S.cperkLv = {};
        DEV.cperkLv(5); o.dev5 = JSON.stringify(S.cperkLv); DEV.cperkLv(1); o.dev1 = JSON.stringify(S.cperkLv);
        hideSheet();

        // ---- the blessing, brighter at the top level ----
        const count = (lv, t) => {
          Scene.bless = { col: '#FF0000', lv, t0: Scene.t - t };
          const c = Scene.b; c.clearRect(0, 0, VW, VH);
          Scene.drawBless(c, 100, 60, 40, 60, 140);
          const d = c.getImageData(0, 0, VW, VH).data; let n = 0, sum = 0, x0 = 1e9, x1 = -1;
          for (let i = 0; i < d.length; i += 4) if (d[i + 3] && d[i] > d[i + 1] + 40) { n++; sum += d[i + 3];
            const x = (i >> 2) % VW; x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
          return { n, sum, w: n ? x1 - x0 + 1 : 0, on: !!Scene.bless };
        };
        o.b1 = count(1, 0.2); o.b5 = count(5, 0.2);
        o.late1 = count(1, 1.55); o.late5 = count(5, 1.55);
        Scene.bless = null;
      } finally {
        QUIET = false; cperkShow = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });

    // the rack at 320 wide: the worn row and its button inside the screen
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(250);
    const fit = await page.evaluate(() => {
      const SNAP = JSON.stringify(S);
      try {
        S.cperkOwn = { club: 1 }; S.cperk = 'club'; S.cperkLv = { club: 4 }; S.sov = 50;
        setView('upg'); rangeSub = 'cad'; renderRangeNav();
        const row = [...document.querySelectorAll('#cadRows .row')].find(x => x.querySelector('.nm').textContent === 'Club Selection');
        const R = row.getBoundingClientRect(), b = row.querySelector('.buy').getBoundingClientRect();
        const lbl = row.querySelector('.buy .lbl');
        return { inside: b.right <= R.right + 0.5 && R.right <= innerWidth + 0.5 && b.left >= R.left,
                 cut: lbl.scrollWidth > lbl.clientWidth + 1, h: Math.round(b.height), no: row.querySelector('.buy').classList.contains('no') };
      } finally { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); setView('upg'); }
    });
    await page.setViewportSize({ width: 400, height: 860 });

    const f = m => { throw new Error(m); };
    if (r.poor !== 'false,1,99') f('with 99 sovereigns an upgrade went through: ' + r.poor);
    if (r.paid !== B_COST_STR || r.top !== 5) f('the steps cost ' + r.paid + ' and stopped at Lv ' + r.top + ', not ' + B_COST_STR + ' to Lv 5');
    if (r.notOwned !== 'false,1') f('a perk not owned was upgraded: ' + r.notOwned);
    if (r.lv1.some(Boolean)) f('at Lv 1 these no longer read as they did: ' + r.lv1.filter(Boolean).join(', '));
    if (r.bad.length) f(r.bad.length + ' perk levels do not do what they say: ' + r.bad.slice(0, 4).join('; '));
    if (!(Math.abs(r.spd5 - 1.30) < 0.02 && Math.abs(r.spd1 - 1.20) < 0.02)) f('Tempo Call moved tempo by x' + r.spd1.toFixed(3) + ' at Lv 1 and x' + r.spd5.toFixed(3) + ' at Lv 5, not 1.20 and 1.30');
    if (r.line3 !== '+25% tempo for 10s') f('Tempo Call at Lv 3 read "' + r.line3 + '" by the cog');
    if (!/1\.5s hole clock/.test(r.lineReady5)) f('Ready Golf at Lv 5 read "' + r.lineReady5 + '" by the cog');
    if (!/Worn · Lv 2\/5/.test(r.worn.mt) || r.worn.lbl !== 'To Lv 3' || r.worn.amt !== '160' || r.worn.ds !== '+23% tempo for 9s')
      f('the worn row reads ' + JSON.stringify(r.worn));
    if (r.other.mt !== 'Lv 5/5' || r.other.lbl !== 'Wear' || r.other.ds !== '+38% prize money for 12s') f('an owned Lv 5 row reads ' + JSON.stringify(r.other));
    if (r.none.lbl !== 'Sovereigns' || r.none.amt !== '150') f('a perk not owned reads ' + JSON.stringify(r.none));
    if (r.clicked !== '3,160') f('the worn row\'s button did not upgrade it for its price: ' + r.clicked);
    if (r.atTop.lbl !== 'Top level' || r.atTop.amt !== '✓') f('at Lv 5 the button reads ' + JSON.stringify(r.atTop));
    if (r.repaired !== '{"tempo":5}' || r.repairedArr !== '{}' || r.repairedFrac !== '{"tempo":3}')
      f('junk levels loaded as ' + r.repaired + ' / ' + r.repairedArr + ' / ' + r.repairedFrac);
    if (r.hc4 || !r.hc5 || r.hcPaid !== r.hcSov || r.hcAgain) f('Head Caddie: at Lv 4 ' + r.hc4 + ', at Lv 5 ' + r.hc5 + ', paid ' + r.hcPaid + ' then ' + r.hcAgain);
    if (r.dev5 !== '{"tempo":5,"book":5}' && r.dev5 !== '{"book":5,"tempo":5}') f('the developer menu set levels to ' + r.dev5);
    if (r.dev1 !== '{}') f('the developer menu\'s Lv 1 left ' + r.dev1);
    if (!(r.b5.w > r.b1.w && r.b5.sum > r.b1.sum * 1.2)) f('the Lv 5 blessing is no wider or brighter: ' + JSON.stringify([r.b1, r.b5]));
    if (r.late1.on || !r.late5.on) f('at 1.55s the Lv 1 blessing was ' + (r.late1.on ? 'still up' : 'gone') + ' and the Lv 5 ' + (r.late5.on ? 'still up' : 'gone'));
    if (!fit.inside || fit.cut || fit.h < 24) f('at 320 wide the worn row\'s upgrade button is out of its row or cut: ' + JSON.stringify(fit));
    if (!fit.no) f('with 50 sovereigns the upgrade button did not show it cannot be bought');
    return ['each step costs its price (' + r.paid + ') and stops at Lv 5; not without the sovereigns, not on a perk not owned',
      'all ' + (r.lv1.length) + ' perks at every level do and say what they should (Tempo Call x' + r.spd1.toFixed(2) + ' at Lv 1, x' + r.spd5.toFixed(2) + ' at Lv 5); Lv 1 unchanged',
      'the worn row reads "' + r.worn.mt + '", its button "' + r.worn.lbl + ' ' + r.worn.amt + '" upgrades it; fits at 320; junk levels repaired',
      'Head Caddie at Lv 5, paid once; the Lv 5 blessing ' + r.b5.w + 'px wide against ' + r.b1.w + ' and still up at 1.55s'];
  }
};
const B_COST_STR = '100,160,250,400,no,no';
