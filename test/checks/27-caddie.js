/* The caddie: a fairy at the golfer's shoulder, and the perks he gives.
 *
 *   - the fairy never overlaps the golfer: through every phase of a swing,
 *     at address and walking, the box he is drawn in stays clear of every
 *     pixel of the golfer, club included. He was a man on the ground, who
 *     walked into bunkers, ponds and the golfer himself; the first fairy sat
 *     where the club reaches on its way up, which is further left than the
 *     top of the backswing
 *   - caddie perks: bought once with sovereigns, one worn at a time, and
 *     changing between owned ones is free; ten sovereigns buy nothing
 *   - the worn perk goes off every CPERK_EVERY seconds on the course and
 *     moves the stat it names by what it says, for as long as it says; not
 *     during a catch-up, and not with none worn
 *   - a save wearing a perk it does not own, or one that does not exist,
 *     loads with none
 *   - the Range has a Caddie rack with a row for every perk
 *   - he does not glide: while a swing is still going, the camera holds,
 *     however far the yardage has already moved (it chased the yardage the
 *     moment the simulation swung, and carried him on in his backswing)
 */
'use strict';
module.exports = {
  name: 'caddie',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}; const SNAP = JSON.stringify(S);
      hideSheet(); QUIET = true;
      const D = derive();
      try {
        // ---- the fairy keeps clear of the golfer ---------------------------
        const bbox = () => { const g = Scene.b.getImageData(0, 0, VW, VH).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
          for (let i = 3; i < g.length; i += 4) if (g[i]) { const p = i >> 2, x = p % VW, y = (p / VW) | 0;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
          return x1 < 0 ? null : { x0, x1, y0, y1 }; };
        o.hits = []; o.poses = 0;
        const keep = SPRITE.caddie;
        const pose = (walking, ph) => {
          Scene.walkOn = walking; Scene.walkPh = 0.3;
          Scene.swingT = ph > 0 ? Scene.swingDur * (1 - ph) : 0;
          // the golfer alone, painted, then where the fairy goes beside him
          SPRITE.caddie = null; Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D);
          const g = bbox(); SPRITE.caddie = keep;
          Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D);
          const f = Scene._fairy; o.poses++;
          if (g && f && f.x + f.w > g.x0 && f.x < g.x1 && f.y + f.h > g.y0 && f.y < g.y1)
            o.hits.push((walking ? 'walking' : 'swing ' + ph.toFixed(2)) + ': fairy ' + f.x + '-' + (f.x + f.w) + ', golfer from ' + g.x0);
        };
        for (const outfit of ['classic', 'divine']) {
          S.styleOwn['o:' + outfit] = 1; S.outfit = outfit; buildSprites();
          for (let ph = 0; ph <= 1.0001; ph += 0.02) pose(false, ph);
          pose(true, 0);
        }
        S.outfit = 'classic'; buildSprites(); Scene.walkOn = false; Scene.swingT = 0;

        // ---- perks: bought once, one worn, free to change ------------------
        S.cperkOwn = {}; S.cperk = null; S.sov = 10;
        cperkPick('tempo'); o.poor = S.cperk + ' ' + S.sov;
        S.sov = 1000; cperkPick('tempo'); const s1 = S.sov; cperkPick('book'); const s2 = S.sov;
        cperkPick('tempo'); o.back = S.cperk + ' ' + (s2 - S.sov) + ' ' + (1000 - s1);
        o.book = 1000 - s1 + (s1 - s2);
        o.want = B.CPERKS.find(p => p.id === 'tempo').cost + B.CPERKS.find(p => p.id === 'book').cost;

        // ---- it goes off every CPERK_EVERY seconds, and does what it says ---
        S.buff = {}; S.cperkT = 0; QUIET = false; OFFLINE = false;
        const spd0 = derive().spd;
        tickCaddie(B.CPERK_EVERY - 1); o.early = !!S.buff.cSpd;
        tickCaddie(1.5); o.fired = S.buff.cSpd ? S.buff.cSpd.v + '/' + S.buff.cSpd.t : null;
        o.spdUp = derive().spd / spd0;
        QUIET = true; S.buff = {}; S.cperkT = 0; tickCaddie(B.CPERK_EVERY * 2); o.quiet = !!S.buff.cSpd; QUIET = false;
        S.cperk = null; S.cperkT = 0; tickCaddie(B.CPERK_EVERY * 2); o.none = Object.keys(S.buff).length;
        QUIET = true; S.buff = {};

        // ---- repaired on load ------------------------------------------------
        S.cperkOwn = {}; S.cperk = 'chat'; initState(); o.unowned = S.cperk;
        S.cperkOwn = { nope: 1 }; S.cperk = 'nope'; initState(); o.unknown = S.cperk;

        // ---- the Range's Caddie rack -----------------------------------------
        QUIET = false; setView('upg'); rangeSub = 'cad'; renderRangeNav();
        o.rows = document.querySelectorAll('#cadRows .row').length;
        o.navs = [...document.querySelectorAll('#rangeNav .sub')].map(b => b.textContent).join('/');
        rangeSub = 'upg'; renderRangeNav(); QUIET = true;

        // ---- no gliding --------------------------------------------------------
        Scene.newHole(S.hole, S.tier); Scene.camD = 10;
        S.yardsMax = 1000; S.yards = 1000 * (1 - 14 / LEN);            // the sim has moved on four units
        Scene.swingT = Scene.swingDur; const c0 = Scene.camD; let moved = 0;
        while (Scene.swingT > Scene.swingDur * 0.2) { Scene.draw(0.016, D); moved = Math.max(moved, Math.abs(Scene.camD - c0)); }
        o.glide = moved;
        Scene.swingT = 0; for (let i = 0; i < 60; i++) Scene.draw(0.016, D);
        o.after = Scene.camD - c0;
      } finally {
        QUIET = false; OFFLINE = false; SPRITE.caddie = SPRITE.caddie || null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
      }
      o.n = B.CPERKS.length; o.every = B.CPERK_EVERY;
      return o;
    });

    if (r.hits.length) throw new Error('the fairy overlaps the golfer in ' + r.hits.length + ' of ' + r.poses + ' poses: ' + r.hits.slice(0, 3).join('; '));
    if (r.poor !== 'null 10') throw new Error('ten sovereigns bought a perk: ' + r.poor);
    if (r.book !== r.want) throw new Error('two perks and changing back cost ' + r.book + ', their prices are ' + r.want);
    if (!/^tempo 0 /.test(r.back)) throw new Error('changing back to an owned perk was not free: ' + r.back);
    if (r.early) throw new Error('the perk went off before ' + r.every + ' seconds');
    if (r.fired !== '20/8') throw new Error('Tempo Call did not give +20% tempo for 8s: ' + r.fired);
    if (!(r.spdUp > 1.15)) throw new Error('with Tempo Call live the tempo moved by x' + r.spdUp.toFixed(3));
    if (r.quiet) throw new Error('the perk went off during a catch-up');
    if (r.none) throw new Error('with no perk worn, ' + r.none + ' buffs went off');
    if (r.unowned !== null || r.unknown !== null) throw new Error('a save wearing an unowned or unknown perk loaded with ' + r.unowned + ' / ' + r.unknown);
    if (r.rows !== r.n || r.navs !== 'Upgrades/Caddie') throw new Error('the Range shows ' + r.rows + ' perk rows of ' + r.n + ' under ' + r.navs);
    if (r.glide > 0.001) throw new Error('the camera moved ' + r.glide.toFixed(2) + ' units while he was still swinging');
    if (!(r.after > 1)) throw new Error('after the swing the camera did not move on: ' + r.after.toFixed(2));
    return ['the fairy stays clear of the golfer in all ' + r.poses + ' poses, club and all',
      r.n + ' perks: bought once, one worn, free to change; +20% tempo for 8s every ' + r.every + 's, none in a catch-up',
      'no gliding: the camera holds through the swing and walks on after (' + r.after.toFixed(1) + ' units)'];
  }
};
