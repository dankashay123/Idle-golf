/* Fallen leaves for the frost, shapes for what drifts across, and the
 * flag and the ball behind what stands nearer (the user: "What are the
 * white things on the ground in the coastal classic? ... make them fallen
 * leaves, but not a ton of them. Just here and there"; the falling leaves
 * "are just squares right now"; "I am still sometimes seeing the flag
 * clipping through trees"):
 *
 *   - an autumn course on a frosty morning: no frost specks, a few fallen
 *     leaves lying near him and none far off; winter keeps its frost
 *   - the leaves, petals and flakes drawn in the air are shapes, not
 *     blocks: a near leaf is a pointed shape in two colours, a near flake
 *     a cross
 *   - over the regular courses, from the tee to the green, no pixel of the
 *     hole's flag or of the ball lying out there is drawn where a tree, a
 *     spectator or a tree of the forest nearer than it stands; and some
 *     views do hide them (the check has something to catch)
 */
'use strict';
module.exports = {
  name: 'leaves',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const keepStep = window.step, keepPin = Scene.pinBody;
      try {
        hideSheet(); QUIET = true; window.step = () => {}; const D = derive();
        const coastal = B.COURSE.findIndex(c => c.id === 'coastal');
        // a tree set down between him and the green, in front of the
        // flag: the flag goes behind it (the standing scenery, not only the
        // forest painted into the ground)
        // (from short of the green, where nothing else is between)
        { const ci = B.COURSE.findIndex(c => c.id === 'sandbelt'); DEV.course(ci); hideSheet(); Scene.announce = null;
          // (a hole where, from there, the flag is in view and nothing hides it)
          const h0 = S.hole; let P = 0, d = 0;
          for (let k = 0; k < 18; k++) { S.hole = h0 + k; Scene.newHole(S.hole, S.tier); Scene.announce = null;
            P = Scene.pinD(); d = P - 6; Scene.camD = Scene.walkTo = P - 22; Scene.swingT = 0; Scene.restBall = null; Scene.t = 40; Scene.draw(0, D);
            if (!Scene._pinHid && Scene.proj(P, Scene.pinX()).y <= Scene.clipAt(P) + 1) break; }
          const tree = { kind: 0, d, x: Scene.pinX() * 0.45 + (Scene.bendOff ? 0 : 0), s: 1.4, k: 1, extra: 1 };
          // (where the flag is seen from here, at the tree's distance)
          const pp = Scene.proj(P, Scene.pinX()); let best = 0, bx = 1e9; for (let x = -40; x <= 40; x += 0.1) { const q = Scene.proj(d, x); if (Math.abs(q.x - pp.x) < bx) { bx = Math.abs(q.x - pp.x); best = x; } }
          tree.x = best; const L = Scene.props, at = L.findIndex(p => p.d < d); L.splice(at < 0 ? L.length : at, 0, tree);
          // (what the tree adds to what was hidden already)
          Scene.t = 40; Scene.draw(0, D); const with1 = Scene._pinHid || 0; L.splice(L.indexOf(tree), 1);
          Scene.draw(0, D); o.tree = with1 - (Scene._pinHid || 0);
          if (!(o.tree > 3)) f('a tree set down in front of the flag hid ' + o.tree + ' of its pixels'); }
        const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
        const count = (d, cols) => { const C = cols.map(hex); let n = 0; for (let i = 0; i < d.length; i += 4) if (C.some(q => q[0] === d[i] && q[1] === d[i + 1] && q[2] === d[i + 2])) n++; return n; };
        // ---- frost or leaves, the props alone ----
        FROST_FORCE = 1; HOUR_FORCE = 8;
        const ground = (seas) => { SEASON_FORCE = seas; DEV.course(coastal); hideSheet(); Scene.announce = null; Scene.fall = null;
          let frost = 0, laid = 0, far = 0; const DP = Scene.drawProp;
          Scene.drawProp = function (c, T, ni, p, pr) { if (p.kind === 6) { const before = c.getImageData(0, 0, VW, VH).data; DP.apply(this, arguments);
            const after = c.getImageData(0, 0, VW, VH).data; let n = 0; for (let i = 0; i < after.length; i += 4) if (after[i] !== before[i] || after[i + 1] !== before[i + 1] || after[i + 2] !== before[i + 2]) n++;
            if (n) { laid++; if (p.d - Scene.camD > 40) far++; } return; } return DP.apply(this, arguments); };
          try { for (const fq of [0.2, 0.5, 0.8]) { Scene.camD = Scene.holeLen() * fq; Scene.walkTo = Scene.camD; Scene.swingT = 0; Scene.t = 30; Scene.draw(0, D);
            const d = Scene.b.getImageData(0, 0, VW, VH).data; frost += count(d, ['#EEF6FA']);
          } }
          finally { Scene.drawProp = DP; }
          return { frost, laid, far, leafy: Scene.leafy }; };
        const au = ground(1), wi = ground(2);
        o.ground = 'autumn ' + JSON.stringify(au) + ', winter frost ' + wi.frost;
        if (!au.leafy) f('the Coastal Classic in autumn is not leafy');
        if (au.frost) f('an autumn morning drew ' + au.frost + ' pixels of frost specks');
        if (au.laid < 1) f('no fallen leaves lie on the autumn hole');
        if (au.laid > 7) f(au.laid + ' fallen leaves drawn over three views: a ton, not here and there');
        if (au.far) f(au.far + ' fallen leaves drawn far off, where they read as specks');
        if (wi.frost < 40) f('a winter morning lost its frost (' + wi.frost + ')');
        FROST_FORCE = null; HOUR_FORCE = null;
        // ---- the shapes in the air ----
        const shape = (k, len) => { const F = fallSprite(k, len, 0, 3, ['#E48A34', '#F0B070', '#7A3418']); const x = F.cv.getContext('2d').getImageData(0, 0, F.cv.width, F.cv.height).data;
          let n = 0, x0 = 99, y0 = 99, x1 = -1, y1 = -1; const cols = new Set();
          for (let i = 0; i < x.length; i += 4) if (x[i + 3]) { n++; const p = i >> 2, X = p % F.cv.width, Y = (p / F.cv.width) | 0; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); cols.add(x[i] + ',' + x[i + 1]); }
          return { n, box: (x1 - x0 + 1) * (y1 - y0 + 1), long: +((x1 - x0 + 1) / (y1 - y0 + 1)).toFixed(2), cols: cols.size }; };
        const L7 = shape('l', 7), P6 = shape('p', 6);
        o.shapes = 'leaf ' + JSON.stringify(L7) + ', petal ' + JSON.stringify(P6);
        // (lying lengthways: longer than it is wide, and not filling its box)
        if (L7.n < 10 || L7.n > L7.box * 0.75 || L7.long < 1.6 || L7.cols < 2) f('a near leaf is not a leaf: ' + JSON.stringify(L7));
        if (P6.n < 6 || P6.n > P6.box * 0.85 || P6.long < 1.2) f('a near petal is not a petal: ' + JSON.stringify(P6));
        // a near flake: a cross, its corners lighter than its arms
        SEASON_FORCE = 2; DEV.course(coastal); hideSheet(); Scene.announce = null;
        Scene.snow = true; Scene.rain = false; Scene.fall = null; Scene.t = 12;
        const cv = document.createElement('canvas'); cv.width = VW; cv.height = VH; const c = cv.getContext('2d'), kb = Scene.b; Scene.b = c;
        try { Scene.drawWeather(); } finally { Scene.b = kb; }
        { const d = c.getImageData(0, 0, VW, VH).data; let cross = 0, block = 0;
          for (let y = 2; y < VH - 2; y++) for (let x = 2; x < VW - 2; x++) { const a = i => d[((y + i[1]) * VW + x + i[0]) * 4 + 3];
            if (a([0, 0]) !== 255) continue;
            if (a([2, 0]) && a([-2, 0]) && a([0, 2]) && a([0, -2]) && a([1, 1]) < a([1, 0])) cross++;
            // (a block: its corners as solid as its arms)
            if (a([1, 0]) && a([1, 1]) >= a([1, 0]) && a([-1, -1]) >= a([-1, 0]) && a([1, -1]) >= a([0, -1]) && a([-1, 1]) >= a([0, 1])) block++; }
          o.flakes = cross; if (cross < 3) f('no near snowflake is drawn as a cross (' + cross + ')');
          if (block) f(block + ' snowflakes drawn as blocks'); }
        SEASON_FORCE = -1;
        // ---- the flag and the lying ball behind nearer things ----
        let views = 0, hidF = 0, hidB = 0, shown = 0;
        for (const id of ['sandbelt', 'highlands', 'blackwater', 'coastal', 'moorland']) {
          const ci = B.COURSE.findIndex(c => c.id === id); if (ci < 0) continue;
          DEV.course(ci); hideSheet(); const h0 = S.hole;
          for (let k = 0; k < 9; k++) {
            S.hole = h0 + k; Scene.newHole(S.hole, S.tier); Scene.announce = null;
            const LEN = Scene.holeLen(), P = Scene.pinD();
            for (const fq of [0, 0.15, 0.3, 0.45, 0.6]) {
              Scene.camD = LEN * fq; Scene.walkTo = Scene.camD; Scene.swingT = 0; Scene.balls.length = 0;
              const ball = { d: Math.min(P - 2, Scene.camD + 30 + k * 4), lat: (k % 3 - 1) * 1.5 };
              const shot = (pin, rb) => { Scene.t = 40; Scene.pinBody = pin ? keepPin : () => {}; Scene.restBall = rb ? ball : null;
                Scene.draw(0, D); return Scene.b.getImageData(0, 0, VW, VH).data; };
              const all = shot(true, true); shown += Scene._pinHid || 0; const noPin = shot(false, true), noBall = shot(true, false);
              views++;
              for (let i = 0; i < all.length; i += 4) {
                const px = i >> 2;
                if (all[i] !== noPin[i] || all[i + 1] !== noPin[i + 1] || all[i + 2] !== noPin[i + 2]) if (Scene.nearerAt(px, P - 0.3)) hidF++;
                if (all[i] !== noBall[i] || all[i + 1] !== noBall[i + 1] || all[i + 2] !== noBall[i + 2]) if (Scene.nearerAt(px, ball.d - 0.3)) hidB++;
              }
              Scene.pinBody = keepPin;
            }
          }
        }
        o.clip = views + ' views, ' + shown + ' flag pixels hidden behind them';
        if (!shown) f('over ' + views + ' views the flag was never behind anything: the sweep catches nothing');
        if (hidF) f(hidF + ' pixels of the flag drawn over something standing nearer than the green, over ' + views + ' views');
        if (hidB) f(hidB + ' pixels of the lying ball drawn over something standing nearer than it, over ' + views + ' views');
      } catch (e) { f('threw: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
      finally {
        Scene.pinBody = keepPin; window.step = keepStep; FROST_FORCE = null; HOUR_FORCE = null; SEASON_FORCE = -1;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; Scene.restBall = null; startHole(); hideSheet();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['on the ground: ' + r.ground, 'in the air: ' + r.shapes + ', ' + r.flakes + ' crossed flakes',
            'the flag and the lying ball never over a nearer thing, ' + r.clip + '; a tree set down in front of the flag hides ' + r.tree];
  }
};
