/* The train at full size, the hop over the stones, and the female golfer
 * (the user: the train was "shorter than the golfer"; on the stones "the
 * golfer isn't just moving up and down"; "create an option for the golfer
 * to be male or female ... and make the skins adjust to genders as well",
 * chosen in Settings with a box for each):
 *
 *   - the steam train across the line stands well over twice his height
 *     there, as a real one does over a man
 *   - over the stones he crouches on a stone, springs up and draws his legs
 *     up in the air, and lands into a crouch: shorter on the stones, higher
 *     and tucked in the air
 *   - Settings has a Male Golfer and a Female Golfer box, one ticked; a
 *     tick on one changes him or her and unticks the other, and is kept
 *   - her pictures carry her hair, his none of it; on a skin her ponytail
 *     is drawn over it, and on him nothing is
 */
'use strict';
module.exports = {
  name: 'herhop',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, f = m => { if (o.fails.length < 14) o.fails.push(m); };
      const raf = window.requestAnimationFrame, keepStep = window.step;
      try {
        hideSheet(); QUIET = true; window.step = () => {}; const D = derive();
        // ---- the train beside him ----
        DEV.course(B.COURSE.findIndex(cs => cs.slot === 'home')); hideSheet();
        let h = awayFirstHole(S.hole); while (!isRail(h)) h++;
        S.hole = h; startHole(); Scene.announce = null;
        const I = Scene.isle, W = Scene.water, K = TRAINS.steam;
        Scene.buildHaze = (bh => function () { this.haze = null; Scene.buildHaze = bh; })(Scene.buildHaze);
        Scene.camD = I.bank - 0.1; Scene.walkTo = Scene.camD; Scene.swingT = 0; Scene.trainMet = 1; Scene.trainNext = 1e9;
        Scene.train = { t0: Scene.t - (RAIL_X + K.len / 2) / K.v, dir: 1 }; Scene.draw(0, D);
        const cv = Scene.b.canvas, d = Scene.b.getImageData(0, 0, cv.width, cv.height).data, TR = [[0x8A, 0x32, 0x28], [0x6A, 0x24, 0x20]];
        let top = 1e9, bot = -1;
        for (let i = 0; i < d.length; i += 4) if (TR.some(q => q[0] === d[i] && q[1] === d[i + 1] && q[2] === d[i + 2])) { const y = (i >> 2) / cv.width | 0; top = Math.min(top, y); bot = Math.max(bot, y); }
        const him = Scene.golferPose(W.d).h, tall = bot - top + 1;
        o.train = tall + 'px against his ' + him;
        if (!(bot >= 0) || tall < him * 1.4) f('the train across the line is ' + tall + 'px tall, he would be ' + him + 'px there');
        Scene.train = null;
        // ---- the hop ----
        STONES_FORCE = S.hole; S.yards = S.yardsMax; Scene.newHole(S.hole, S.tier);
        const J = Scene.isle; Scene.walkOn = true; Scene.swingT = 0; Scene.heli = 0;
        let crouch = 0, crouch2 = 0, upMax = 0, tuck = 0, low = 1e9, stand = 0;
        const LT = LEGS_TUCK;
        for (let k = 0; k < 40; k++) {
          const u = (k + 0.5) / 40; Scene.camD = J.bank + J.hopLen * (1 + u); Scene.crossing = 0.3;
          const G = Scene.golferPose(), base = Scene.golferPose(J.bank - 0.5);
          if (!G.hopping) { f('on the stones at ' + u.toFixed(2) + ' of a hop he is not hopping'); break; }
          stand = Scene.golferPose(Scene.camD).p.y;
          if (G.hopSq > 0.5) { if (u < 0.5) crouch++; else crouch2++; low = Math.min(low, G.h); }
          upMax = Math.max(upMax, stand - (G.y + G.h));
          // (his legs drawn up while he is drawn in the air)
          if (G.hopAir > 0.3 && G.hopAir < 0.7) { let seen = 0; const DL = drawLegsBack;
            window.drawLegsBack = function () { seen = Math.max(seen, LEGS_TUCK); return DL.apply(this, arguments); };
            try { Scene.drawGolfer(D); } finally { window.drawLegsBack = DL; }
            if (seen > 0.5) tuck++; }
        }
        const G0 = Scene.golferPose(); Scene.walkOn = false;
        o.hop = crouch + ' and ' + crouch2 + ' crouched, ' + upMax + 'px up, ' + tuck + ' tucked';
        if (crouch < 2 || crouch2 < 2 || !(low < G0.h + 1e9) || low >= Math.round(B_GOLFER * US * G0.p.s)) f('he does not crouch to spring and to land (' + crouch + ', ' + crouch2 + ', ' + low + ')');
        if (upMax < Math.round(B_GOLFER * US * G0.p.s) * 0.3) f('in the air he is only ' + upMax + 'px off the stones');
        if (tuck < 4) f('his legs are tucked in ' + tuck + ' of 40 steps');
        // his legs drawn tucked are shorter than walking
        const legs = tk => { const c2 = document.createElement('canvas'); c2.width = 60; c2.height = 80; const c = c2.getContext('2d');
          LEGS_TUCK = tk; try { drawLegsBack(c, 30, 20, 30, 10, 0.12, '#203A6A', '#18284A', '#222222'); } finally { LEGS_TUCK = LT; }
          const q = c.getImageData(0, 0, 60, 80).data; let b = -1; for (let i = 0; i < q.length; i += 4) if (q[i + 3]) b = Math.max(b, (i >> 2) / 60 | 0); return b; };
        if (typeof drawLegsBack === 'function') { const a = legs(0), b = legs(1); o.legs = a + ' and ' + b;
          if (!(b < a)) f('tucked, his feet come down to ' + b + ', walking to ' + a); }
        STONES_FORCE = 0;
        // ---- Settings ----
        QUIET = false; setGender('m'); settingsSheet();
        const M = document.getElementById('gender_m'), Fm = document.getElementById('gender_f');
        if (!M || !Fm) f('Settings has no Male Golfer and Female Golfer boxes');
        else {
          const lab = el => el.closest('.setrow') && el.closest('.setrow').querySelector('.nm').textContent;
          if (lab(M) !== 'Male Golfer' || lab(Fm) !== 'Female Golfer') f('the boxes are named ' + lab(M) + ' and ' + lab(Fm));
          if (!M.checked || Fm.checked) f('with him chosen the boxes read ' + M.checked + ' and ' + Fm.checked);
          Fm.click();
          if (S.gender !== 'f' || M.checked || !Fm.checked) f('a tick on Female Golfer left ' + S.gender + ', ' + M.checked + ', ' + Fm.checked);
          Fm.click();
          if (S.gender !== 'f' || !Fm.checked) f('a second tap on Female Golfer unticked it (' + S.gender + ')');
          M.click();
          if (S.gender !== 'm' || !M.checked || Fm.checked) f('a tick on Male Golfer left ' + S.gender);
          hideSheet();
        }
        // ---- her pictures ----
        const hairPx = (spr, col) => { const im = spr.cv || spr.c || spr.canvas || spr, c2 = document.createElement('canvas'); c2.width = im.width; c2.height = im.height; const c = c2.getContext('2d');
          c.drawImage(im, 0, 0); const q = c.getImageData(0, 0, im.width, im.height).data, C = [parseInt(col.slice(1, 3), 16), parseInt(col.slice(3, 5), 16), parseInt(col.slice(5, 7), 16)];
          let n = 0; for (let i = 0; i < q.length; i += 4) if (q[i + 3] && q[i] === C[0] && q[i + 1] === C[1] && q[i + 2] === C[2]) n++; return n; };
        S.outfit = 'classic'; for (const g of ['m', 'f']) { setGender(g);
          o[g] = ['gAddr', 'gFinish', 'gBack'].map(k => hairPx(SPRITE[k], HAIR)); }
        o.hair = 'his ' + o.m.join('/') + ', hers ' + o.f.join('/');
        if (o.f.some((n, i) => n < o.m[i] + 4)) f('her pictures do not carry her hair: ' + o.hair);
        // a skin: the tail drawn over it for her, nothing for him
        S.styleOwn['o:midas'] = 1; S.outfit = 'midas';
        const tail = g => { setGender(g); const c2 = document.createElement('canvas'); c2.width = 80; c2.height = 80; const c = c2.getContext('2d');
          const spr = SPRITE.gAddr, hh = 46, w = Math.round(hh * spr.w / spr.h);
          paintGolfer(c, 20, 70 - hh, w, hh, 0, 3.3, 70, false, 0.1, spr, [], undefined, false); return c.getImageData(0, 0, 80, 80).data; };
        const a = tail('m'), b = tail('f'), P = FEM_HAIR.midas[0], Q = [parseInt(P.slice(1, 3), 16), parseInt(P.slice(3, 5), 16), parseInt(P.slice(5, 7), 16)];
        let na = 0, nb = 0; for (let i = 0; i < a.length; i += 4) { if (a[i] === Q[0] && a[i + 1] === Q[1] && a[i + 2] === Q[2]) na++; if (b[i] === Q[0] && b[i + 1] === Q[1] && b[i + 2] === Q[2]) nb++; }
        o.tail = na + ' and ' + nb;
        if (nb < na + 6) f('on Midas her ponytail shows ' + nb + ' pixels of its gold, his ' + na);
      } catch (e) { f('threw: ' + e.message + ' ' + (e.stack || '').split('\n')[1]); }
      finally {
        STONES_FORCE = 0; window.step = keepStep; window.requestAnimationFrame = raf; Scene.train = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        for (const k in SHOWSPR) delete SHOWSPR[k];
        QUIET = false; buildSprites(); hideSheet(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the train ' + r.train + '; the hop: ' + r.hop + ', feet at ' + r.legs + ' walking and tucked',
            'Settings\' two boxes; her hair pixels ' + r.hair + '; the Midas tail ' + r.tail + ' (him, her)'];
  }
};
