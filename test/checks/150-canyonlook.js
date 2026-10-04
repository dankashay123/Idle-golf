/* The canyon looks like a canyon. First (the user: "instead of just a
 * solid color") its walls in bands of sandstone; then, with a photograph of
 * a gorge from its rim ("It needs depth"): far deeper, its walls stepped in
 * sheer cliffs and pale ledges, spurs and bays along it, darker and hazier
 * the deeper it goes, a river winding along the floor.
 *
 *   - stepped: going down from either rim, cliff, ledge, cliff, ledge...
 *   - spurs: at one distance the depth differs from one stretch of wall
 *     to the next
 *   - colour: cliffs in many colours, ledges lighter than cliffs, the deep
 *     darker than the top; the river's line wanders across the floor
 *   - drawn: from the rim the far wall stands a fifth of the view tall, and
 *     neither from the rim nor from the middle of the bridge does any grass
 *     show through it (it did, in stripes, and from the bridge the floor
 *     under him was taken for hidden) */
'use strict';
module.exports = {
  name: 'canyonlook',
  async run(page) {
    const r = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m), out = [];
      const P = P_CANYON;
      // stepped: count the cliffs going down from the rim
      let cliffs = 0, was = false;
      for (let t = 0.001; t < CANYON_RIM; t += 0.002) { const steep = P.slope(t) > 2.5; if (steep && !was) cliffs++; was = steep; }
      out.push(cliffs + ' cliffs down each wall');
      if (cliffs < 3) f('the wall goes down in ' + cliffs + ' cliffs, not terraces');
      // spurs: one distance, many depths along the wall
      const deps = new Set(); for (let i = 200; i < 280; i++) deps.add(P.colProf(0.86, i).toFixed(2));
      out.push(deps.size + ' depths along the wall at one distance');
      if (deps.size < 6) f('the wall at one distance is ' + deps.size + ' depths: ruled straight across');
      for (const id of ['mesa', 'highlands', 'willow']) {
        const T = buildTheme(courseById(id), 'day'), lum = c => { const v = parseInt(c.slice(1), 16); return ((v >> 16) & 255) * 0.3 + ((v >> 8) & 255) * 0.59 + (v & 255) * 0.11; };
        const cols = new Set();
        for (let i = 0; i < 300; i += 3) for (let k = 2; k < 98; k++) cols.add(P.tone(T, k / 100, HZ_LZ, 0.5, 3, i, 0.8));
        if (cols.size < 40) f(id + ': its walls in ' + cols.size + ' colours');
        const C = T._cns, avg = L => L.reduce((a, c) => a + lum(c), 0) / L.length;
        if (!(avg(C.ledge[0].slice(0, 2)) > avg(C.wall.map(b => b[0][1])))) f(id + ': the ledges are no lighter than the cliffs');
        if (!(avg(C.wall.map(b => b[C.Z - 1][0])) < avg(C.wall.map(b => b[0][0])) * 0.8)) f(id + ': the deep is not darker than the top');
        // the river: water only near its line, and the line wanders
        let at = [];
        for (let i = 0; i < 480; i += 4) { let lo = 1, hi = 0; for (let t = 0.3; t < 0.7; t += 0.002) if (C.river.includes(P.tone(T, 0.99, HZ_LZ, 0.5, 0, i, t))) { lo = Math.min(lo, t); hi = Math.max(hi, t); }
          if (hi < lo) { f(id + ': no river on the floor at column ' + i); break; } at.push((lo + hi) / 2);
          if (hi - lo > 0.08) { f(id + ': the river ' + (hi - lo).toFixed(2) + ' wide'); break; } }
        const wander = Math.max(...at) - Math.min(...at);
        if (wander < 0.05) f(id + ': the river runs dead straight (' + wander.toFixed(3) + ')');
        out.push(id + ' ' + cols.size + ' colours, the river wandering ' + wander.toFixed(2));
      }
      return { fails, out };
    });
    // drawn: the far wall's height and no grass through it, from the rim and
    // from the bridge, the canyon painted one flat colour so anything else
    // inside it shows
    const d = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m), SNAP = JSON.stringify(S), keepTone = P_CANYON.tone, keepCad = Scene.drawCaddie, raf = window.requestAnimationFrame;
      const out = {};
      try {
        QUIET = true; window.requestAnimationFrame = () => 0;
        DEV.course(0); hideSheet(); S.chaos = { n: 'Fair' }; DEV.canyon(); hideSheet(); Scene.announce = null;
        const I = Scene.isle, W = Scene.water, D = derive();
        P_CANYON.tone = (T, fz) => fz < 0.005 ? T.lip : '#FF00FF';
        // (nothing else in the way: the caddie floats by the bridge, and the
        // scenery and the people stand where they stand)
        Scene.drawCaddie = () => {}; Scene.props = [];
        for (const [name, cam] of [['rim', I.bank - 1.5], ['onto', I.bank + 1.2], ['bridge', (I.bank + I.land) / 2], ['far', I.land - 1.5]]) {
          for (let k = 0; k < 2; k++) { Scene.camD = cam; Scene.draw(0, D); }
          const px = Scene.buf.getContext('2d').getImageData(0, 0, VW, VH).data;
          const mag = (x, y) => { const i = (y * VW + x) * 4; return px[i] > 200 && px[i + 1] < 90 && px[i + 2] > 200; };
          // the canyon's rows: from the topmost magenta row to the lowest
          let y0 = VH, y1 = -1;
          for (let y = 0; y < VH; y++) for (let x = 0; x < VW; x += 3) if (mag(x, y)) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
          if (y1 < 0) { f(name + ': no canyon in view'); continue; }
          // grass inside: canyon above it and below it in its own column,
          // away from the bridge down the middle and the weather's word in
          // the corner (the rims' own ragged edge is not inside)
          const pb = Scene.proj(W.d, 0), bw = Math.max(8, Math.round(VW * 0.16));
          let green = 0, all = 0;
          for (let x = 0; x < VW; x++) {
            if (Math.abs(x - pb.x) < bw) continue;
            let a = -1, b = -1; for (let y = y0; y <= y1; y++) if (mag(x, y)) { if (a < 0) a = y; b = y; }
            for (let y = a + 1; a >= 0 && y < b; y++) { if (x < VW * 0.3 && y > VH * 0.75) continue; all++; const i = (y * VW + x) * 4;
              if (!mag(x, y) && px[i + 1] > px[i] + 15 && px[i + 1] > px[i + 2]) green++; }
          }
          out[name] = { tall: y1 - y0, green, all }; if (name === 'bridge') out.img = Scene.buf.toDataURL();
          if (green > all * 0.004) f(name + ': ' + green + ' pixels of grass through the canyon of ' + all);
          if (name === 'rim' && y1 - y0 < VH * 0.2) f('from the rim the canyon stands ' + (y1 - y0) + ' rows of ' + VH);
          // (from over it, nothing nearer hides it: from below its far rim
          // to the foot of the view it is all gorge, bar the bridge; drawn
          // as from the ground, grass lay under him as he crossed)
          if (Scene.camD - CAM_BACK > W.d - W.rd) { let under = 0;
            for (let y = y0 + 3; y < VH; y++) for (let x = 0; x < VW; x++) { if (Math.abs(x - pb.x) < bw * 1.6 || (x < VW * 0.3 && y > VH * 0.75)) continue;
              const i = (y * VW + x) * 4; if (!mag(x, y) && px[i + 1] > px[i] + 15 && px[i + 1] > px[i + 2]) under++; }
            out[name].under = under;
            if (under > 20) f(name + ': from over the gorge, ' + under + ' pixels of grass under its far rim'); }
        }
      } finally {
        P_CANYON.tone = keepTone; Scene.drawCaddie = keepCad; window.requestAnimationFrame = raf; QUIET = false;
        CANYON_FORCE = 0; Object.assign(S, JSON.parse(SNAP)); Scene.newHole(S.hole, S.tier);
      }
      return { fails, out };
    });
    if (process.env.CLDUMP) require('fs').writeFileSync(process.env.CLDUMP, Buffer.from(d.out.img.split(',')[1], 'base64'));
    const fails = r.fails.concat(d.fails);
    if (fails.length) throw new Error(fails.join('; '));
    return [r.out.join('; '),
      'drawn: from the rim ' + d.out.rim.tall + ' rows tall, grass through it ' + d.out.rim.green + ' of ' + d.out.rim.all + '; stepping on ' + d.out.onto.green + ' of ' + d.out.onto.all + '; from the middle of the bridge ' + d.out.bridge.green + ', its far end ' + d.out.far.green + ' of ' + d.out.bridge.all];
  }
};
