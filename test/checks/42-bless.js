/* The caddie's blessing, and the line by the cog that counts it down.
 *
 * When the caddie's perk goes off, he throws his arms up and a column of the
 * perk's own colour comes down on the golfer from above and fades; right of
 * the settings cog a line in the same colour says what it gives and for how
 * long ("+20% tempo for 8s"), counts the seconds down and fades out as they
 * run out.
 *
 *   - every perk has a colour of its own, and the light that comes down is
 *     that colour, over the golfer, and gone within two seconds
 *   - his arms go up
 *   - the line: the perk's words, its colour, the seconds read off the buff
 *     itself, faded over the last second, empty once it is spent; the next-
 *     hole perk says so and stays until the hole; Ready Golf shows two
 *     seconds, and not at all when it did nothing (the hole already down)
 *   - nothing is shown before any perk has gone off
 *   - the line sits right of the cog, on its row, whole at 320 wide
 */
'use strict';
module.exports = {
  name: 'bless',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { bad: [], cols: {}, lines: {} };
      const keep = window.step;
      try {
        hideSheet(); window.step = () => {};
        startHole(); Scene.announce = null;
        o.idle = { txt: $('buffTip').textContent, on: $('buffTip').classList.contains('on') };
        const D = derive(), c = Scene.b;
        const seen = new Set();
        const fire = id => { S.cperkOwn = { [id]: 1 }; S.cperk = id; S.cperkT = B.CPERK_EVERY; S.buff = {};
          QUIET = false; OFFLINE = false; S.yards = S.yardsMax * 0.5; tickCaddie(0); };
        for (const pk of B.CPERKS) {
          if (!/^#[0-9A-F]{6}$/i.test(pk.col || '')) o.bad.push(pk.id + ' has no colour of its own');
          else if (seen.has(pk.col)) o.bad.push(pk.id + ' shares its colour'); else seen.add(pk.col);
          fire(pk.id);
          if (!Scene.bless || Scene.bless.col !== pk.col) { o.bad.push(pk.id + ' blessed in ' + (Scene.bless && Scene.bless.col)); continue; }
          if (!Scene.fairyCast) o.bad.push(pk.id + ': the caddie did not cast');
          // the light a moment after it has landed, against the same frame without it
          const bl = Scene.bless;
          Scene.draw(0, D); bl.t0 = Scene.t - 0.35;
          const fc = Scene.fairyCast; Scene.fairyCast = null;
          Scene.draw(0, D);
          const a = c.getImageData(0, 0, VW, VH).data;
          Scene.bless = null;
          Scene.draw(0, D);
          const b = c.getImageData(0, 0, VW, VH).data;
          const g = Scene.proj(Scene.camD, 0);
          // how closely the change runs toward each perk's colour: the light
          // has to lean toward its own more than toward any other's
          const rgb = h => { const v = parseInt(h.slice(1), 16); return [v >> 16, v >> 8 & 255, v & 255]; };
          const all = B.CPERKS.map(p => ({ id: p.id, C: rgb(p.col || '#000000'), dot: 0, ww: 0 }));
          // (read on the column's flanks, above him: its middle is a white core)
          let n = 0, sx = 0, dd = 0, above = 0, x0 = VW, x1 = 0;
          const top = [];
          for (let i = 0; i < a.length; i += 4) {
            if (a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2]) continue;
            n++; const x = (i / 4) % VW, y = (i / 4 / VW) | 0; sx += x;
            if (y < g.y - 30) { above++; top.push(i); x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
          }
          const mid = (x0 + x1) / 2, core = (x1 - x0) * 0.25;
          for (const i of top) {
            if (Math.abs((i / 4) % VW - mid) < core) continue;
            for (let k = 0; k < 3; k++) {
              const d = a[i + k] - b[i + k]; dd += d * d;
              for (const q of all) { const w = q.C[k] - b[i + k]; q.dot += d * w; q.ww += w * w; }
            }
          }
          all.forEach(q => { q.cos = q.dot / Math.sqrt(dd * q.ww || 1); });
          all.sort((p, q) => q.cos - p.cos);
          const dot = all.find(q => q.id === pk.id).cos, len = 1;
          o.cols[pk.id] = { n, off: n ? Math.round(sx / n - g.x) : null, toward: +dot.toFixed(3), best: all[0].id, above };
          if (n && all[0].id !== pk.id) o.bad.push(pk.id + ': the light leans toward ' + all[0].id + '\'s colour, not its own');
          if (n < 40) o.bad.push(pk.id + ': the blessing changed ' + n + ' pixels');
          else {
            if (Math.abs(sx / n - g.x) > 12) o.bad.push(pk.id + ': the blessing came down ' + Math.round(sx / n - g.x) + ' pixels off the golfer');
            if (!(dot / len > 0.05)) o.bad.push(pk.id + ': the light is not its colour (' + (dot / len).toFixed(3) + ')');
            if (above < n * 0.3) o.bad.push(pk.id + ': the light does not come from above him');
          }
          // and it ends
          Scene.bless = bl; Scene.fairyCast = fc; bl.t0 = Scene.t - 2.1; Scene.draw(0, D);
          if (Scene.bless) o.bad.push(pk.id + ': the blessing was still on after two seconds');
        }

        // his arms: the caddie drawn casting and not, the rest the same
        fire('tempo'); Scene.bless = null;
        Scene.fairyCast.t = 0.5; Scene.draw(0, D); const up = c.getImageData(0, 0, VW, VH).data;
        const fc = Scene.fairyCast; Scene.fairyCast = null; Scene.draw(0, D); const dn = c.getImageData(0, 0, VW, VH).data;
        let arm = 0; for (let i = 0; i < up.length; i += 4) if (up[i] !== dn[i] || up[i + 1] !== dn[i + 1]) arm++;
        o.arms = arm;

        // ---- the line --------------------------------------------------------
        // (the caddie perk's own line in the stack by the cog)
        const L = () => { const el = $('buffTip').querySelector('[data-k="c"]'); return { txt: el ? el.textContent : '', col: el ? el.style.color : '',
          on: !!el, op: el ? el.style.opacity : '' }; };
        const hex = h => { const v = parseInt(h.slice(1), 16); return 'rgb(' + (v >> 16) + ', ' + (v >> 8 & 255) + ', ' + (v & 255) + ')'; };
        fire('tempo'); buffTip(0); o.lines.t8 = L();
        S.buff.cSpd.t = 3.2; buffTip(0); o.lines.t4 = L();
        S.buff.cSpd.t = 0.5; buffTip(0); o.lines.t1 = L();
        delete S.buff.cSpd; buffTip(0); o.lines.t0 = L();
        fire('scout'); buffTip(0); o.lines.scout = L();
        S.buff.cDrop.t -= 30; buffTip(0); o.lines.scout30 = L();
        fire('ready'); buffTip(0); o.lines.ready = L();
        buffTip(1.5); o.lines.ready15 = L();
        buffTip(0.6); o.lines.ready21 = L();
        S.yards = 0; S.cperkT = B.CPERK_EVERY; tickCaddie(0); o.lines.readyDone = L();
        o.want = { tempo: hex(B.CPERKS.find(p => p.id === 'tempo').col), scout: hex(B.CPERKS.find(p => p.id === 'scout').col) };

        // where it sits
        fire('towel'); buffTip(0);
        const s = $('setBtn').getBoundingClientRect(), first = () => $('buffTip').firstElementChild;
        const t = first().getBoundingClientRect();
        o.place = { gap: Math.round(t.left - s.right), mid: Math.round((t.top + t.bottom) / 2 - (s.top + s.bottom) / 2),
          cut: first().scrollWidth > first().clientWidth + 1,
          inside: t.right <= $('stage').getBoundingClientRect().right };

        // ---- the sponsor perks join it: a line each, in brass, stacked ----
        // (the user asked: their icons on the field sat behind the shop)
        const lines = () => [...$('buffTip').children].map(n => ({ k: n.dataset.k, txt: n.textContent, col: n.style.color, op: n.style.opacity,
          mid: Math.round((n.getBoundingClientRect().top + n.getBoundingClientRect().bottom) / 2 - (s.top + s.bottom) / 2) }));
        S.perkOn = { hot: 460 }; buffTip(0); o.stack = { two: lines() };
        // the caddie's runs out: the sponsor's moves up to the cog's row
        delete S.buff[B.CPERKS.find(p => p.id === 'towel').k]; buffTip(0); o.stack.up = lines();
        // a caddie perk goes off again: under the one already showing
        fire('tempo'); S.perkOn = { hot: 430 }; buffTip(0); o.stack.again = lines();
        // a second sponsor perk, a minute left on the first, and its last second
        S.perkOn = { hot: 59.2, coffee: 300 }; buffTip(0); o.stack.three = lines();
        S.perkOn = { hot: 0.5, coffee: 300 }; buffTip(0); o.stack.fade = lines();
        S.perkOn = {}; cperkShow = null; S.buff = {}; buffTip(0); o.stack.none = lines();
        o.brass = PX.brass;
        // nothing of them left on the field: a frame with a perk running is the
        // frame without one
        const Dd = derive(); Scene.t = 10; S.perkOn = {}; Scene.draw(0, Dd); const f0 = c.getImageData(0, 0, VW, VH).data;
        Scene.t = 10; S.perkOn = { hot: 400, patch: 200 }; Scene.draw(0, Dd); const f1 = c.getImageData(0, 0, VW, VH).data;
        let dif = 0; for (let i = 0; i < f0.length; i++) if (f0[i] !== f1[i]) dif++;
        o.fieldDiff = dif; S.perkOn = {};
      } finally {
        window.step = keep; QUIET = false; OFFLINE = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        cperkShow = null; Scene.bless = null; buffTip(0); startHole();
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    if (r.idle.txt || r.idle.on) f('before any perk went off the line by the cog read "' + r.idle.txt + '"');
    if (r.bad.length) f(r.bad.slice(0, 5).join('; '));
    if (!(r.arms > 3)) f('the caddie casting looked the same as standing (' + r.arms + ' pixels)');
    const L = r.lines;
    if (L.t8.txt !== '+20% tempo for 8s' || !L.t8.on || L.t8.col !== r.want.tempo) f('Tempo Call went off and the line read "' + L.t8.txt + '" in ' + L.t8.col);
    if (L.t4.txt !== '+20% tempo for 4s' || L.t4.op !== '1') f('3.2s left read "' + L.t4.txt + '" at ' + L.t4.op);
    if (L.t1.txt !== '+20% tempo for 1s' || L.t1.op !== '0.5') f('half a second left read "' + L.t1.txt + '" at ' + L.t1.op + ', not faded half way');
    if (L.t0.txt || L.t0.on) f('the buff spent, the line still read "' + L.t0.txt + '"');
    if (L.scout.txt !== '+10% gear luck next hole' || L.scout.col !== r.want.scout || L.scout30.txt !== L.scout.txt || L.scout30.op !== '1')
      f('Lost Ball Scout read "' + L.scout.txt + '" and 30s on "' + L.scout30.txt + '"');
    if (!/1s hole clock/.test(L.ready.txt) || L.ready15.op !== '0.5' || L.ready21.txt) f('Ready Golf read "' + L.ready.txt + '", then at ' + L.ready15.op + ', then "' + L.ready21.txt + '"');
    if (L.readyDone.txt) f('Ready Golf with the hole already down still said "' + L.readyDone.txt + '"');
    const St = r.stack, hx = h => { const v = parseInt(h.slice(1), 16); return 'rgb(' + (v >> 16) + ', ' + (v >> 8 & 255) + ', ' + (v & 255) + ')'; };
    const brass = hx(r.brass), rows = a => a.map(x => x.k + ' "' + x.txt + '" at ' + x.mid).join('; ');
    if (St.two.length !== 2 || St.two[0].k !== 'c' || St.two[1].k !== 'p:hot' || St.two[1].txt !== '5\u00d7 purse for 7:40' || St.two[1].col !== brass || Math.abs(St.two[0].mid) > 4 || !(St.two[1].mid > 8))
      f('a caddie perk and Hot Streak running read: ' + rows(St.two));
    if (St.up.length !== 1 || St.up[0].k !== 'p:hot' || Math.abs(St.up[0].mid) > 4) f('the caddie\'s line gone, the rest did not move up to the cog: ' + rows(St.up));
    if (St.again.map(x => x.k).join() !== 'p:hot,c' || St.again[1].txt !== '+20% tempo for 8s') f('a caddie perk going off again did not go under the one showing: ' + rows(St.again));
    if (St.three.map(x => x.k + ' ' + x.txt).join('|') !== 'p:hot 5\u00d7 purse for 60s|c +20% tempo for 8s|p:coffee 2\u00d7 tempo for 5:00' && St.three.map(x => x.k + ' ' + x.txt).join('|') !== 'p:hot 5\u00d7 purse for 59s|c +20% tempo for 8s|p:coffee 2\u00d7 tempo for 5:00')
      f('three running read: ' + rows(St.three));
    if (St.fade[0].k !== 'p:hot' || St.fade[0].op !== '0.5') f('a sponsor perk in its last half second: ' + rows(St.fade) + ' at ' + St.fade[0].op);
    if (St.none.length) f('with nothing running the stack still read: ' + rows(St.none));
    if (r.fieldDiff) f('a sponsor perk running still changed ' + r.fieldDiff + ' values of the field');
    const P = r.place;
    if (P.gap < 0 || P.gap > 16 || Math.abs(P.mid) > 4) f('the line sits ' + P.gap + 'px right of the cog and ' + P.mid + 'px off its row');
    if (P.cut || !P.inside) f('the longest line is cut off at 400 wide');
    const c = r.cols;
    return [Object.keys(c).length + ' perks, each a colour of its own coming down on the golfer: '
      + Object.entries(c).map(([k, v]) => k + ' ' + v.n + 'px').join(', '),
      'arms up (' + r.arms + ' pixels); the line counts 8s, 4s, 1s at half, then gone; next-hole and Ready Golf read right; beside the cog',
      'sponsor perks join it in brass ("' + St.two[1].txt + '"), stacked in the order they began, moving up as one ends; none on the field'];
  }
};
