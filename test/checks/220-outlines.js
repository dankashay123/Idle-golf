/* What a tree, a spectator or anything standing covers, worked out once a
 * size and kept (found going over what still warms the phone, after the
 * rain): eight sizes a picture were kept, and the woods' hundred trees at a
 * dozen sizes each built some eighteen outlines again every frame.
 *
 *   - with nothing moved, a second frame builds no outline again
 *   - each picture keeps no more than SH_MAX sizes
 *   - an outline kept is the one built fresh, every pixel */
'use strict';
module.exports = {
  name: 'outlines',
  async run(page) {
    const r = await page.evaluate(() => {
      const fl = [], f = m => fl.push(m), o = {}, sa = Scene.solidAt;
      try {
        hideSheet();
        // the hole and place where one picture is drawn at the most sizes
        // (more than the eight that used to be kept)
        const D = derive(); let best = null;
        for (let h = S.hole; h < S.hole + 40; h++) { Scene.newHole(h, S.tier);
          for (const cam of [0, 6, 20]) { Scene.camD = cam; Scene.walkTo = cam; const per = new Map();
            Scene.solidAt = function (spr, w, hh) { const e = per.get(spr) || new Set(); e.add(w + 'x' + hh); per.set(spr, e); return sa.apply(this, arguments); };
            Scene.draw(0, D); Scene.solidAt = sa; const most = Math.max(0, ...[...per.values()].map(x => x.size));
            if (!best || most > best.most) best = { h, cam, most }; } }
        o.sizes = best.most; if (!(best.most > 8)) f('no frame draws one picture at more than 8 sizes (' + best.most + ')');
        Scene.newHole(best.h, S.tier); Scene.camD = best.cam; Scene.walkTo = best.cam;
        for (const spr of [SPRITE.oak, SPRITE.pine, (Scene.treeSpr || {}).oak, (Scene.treeSpr || {}).pine]) if (spr) delete spr._sol;
        let built = 0, asked = 0; const sprs = new Set();
        Scene.solidAt = function (spr, w, hh) { asked++; sprs.add(spr); const C = spr._sol; if (!C || !C.has(w * 4096 + hh)) built++; return sa.apply(this, arguments); };
        Scene.draw(0, D); o.first = built; built = 0; asked = 0;
        Scene.draw(0, D); o.second = built; o.asked = asked;
        if (!(o.asked > 40)) f('only ' + o.asked + ' outlines asked for in a frame of a wooded hole');
        if (o.second) f('a second frame with nothing moved built ' + o.second + ' outlines again (' + o.asked + ' asked)');
        o.most = 0; for (const s of sprs) { const n = s._sol ? s._sol.size : 0; o.most = Math.max(o.most, n); if (n > SH_MAX) f('a picture keeps ' + n + ' outlines, over ' + SH_MAX); }
        // kept against fresh
        let checked = 0;
        for (const s of sprs) { if (!s._sol || !s.rows) continue;
          for (const [k, M] of s._sol) { const w = Math.floor(k / 4096), hh = k % 4096, keep = s._sol; s._sol = new Map(); const F = sa.call(Scene, s, w, hh); s._sol = keep;
            for (let i = 0; i < M.length; i++) if (M[i] !== F[i]) { f('an outline kept differs from one built fresh at ' + w + 'x' + hh); break; } checked++; } }
        o.checked = checked; if (checked < 10) f('only ' + checked + ' outlines compared');
      } finally { Scene.solidAt = sa; Scene.newHole(S.hole, S.tier); }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['a wooded hole with one picture at ' + r.o.sizes + ' sizes: ' + r.o.first + ' outlines built on the first frame, none on the second (' + r.o.asked + ' asked); at most ' + r.o.most + ' kept a picture; ' + r.o.checked + ' kept, each the same as built fresh'];
  }
};
