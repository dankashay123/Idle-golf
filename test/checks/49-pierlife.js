/* Life on the pier: sea spray in the wind, and gulls.
 *
 * On a Sea Stack hole the user asked for some life: spray blowing over the
 * deck in a crosswind, and gulls.
 *
 *   - spray only with the wind up: none on a calm day, some at 9 mph, and
 *     more in a crosswind than at 9 mph
 *   - three gulls wheeling over the sea round the stack, in view from the
 *     tee; one sat on a post half way along the pier until he comes within
 *     seven of it, then gone from the post, and back on it on the next such
 *     hole
 *   - a gull's cry now and then on a Sea Stack hole, never on another hole
 *     and never at night; about as loud as the birds in the trees, rendered
 *     offline and measured (they cannot be listened to here)
 *   - the sigview check holds all of it above the ground in front
 */
'use strict';
module.exports = {
  name: 'pierlife',
  async run(page) {
    const r = await page.evaluate(async () => {
      const o = {}, SNAP = JSON.stringify(S);
      const keep = { ctx: Sfx.ctx, gull: Sfx.gull, chirp: Sfx.chirp, gust: Sfx.gust, mt: Sfx.musicTick, sound: S.sound, wind: Scene.wind, night: Scene.night };
      try {
        hideSheet(); QUIET = true;
        DEV.course(B.COURSE.findIndex(c => c.id === 'coastal')); hideSheet();
        const first = awayFirstHole(S.hole);
        const piers = []; for (let h = first; h < first + B.ROUND * B.DAYS; h++) if (isPier(h)) piers.push(h);
        S.hole = piers[0]; startHole(); Scene.announce = null;
        const I = Scene.isle, a = I.bank + 0.5, b = LEN - 8.3, hw = 0.55, up = 0.12;
        const posts = []; for (let d = b; d >= a - 0.01; d -= 2.4) posts.push(d);
        const c = Scene.b, D = derive();
        // a frame drawn from where the camera stands, for the ground line
        // everything on the hole is cut at (Scene.clipAt)
        const look = cam => { Scene.camD = cam; Scene.walkTo = cam; Scene.swingT = 0; Scene.draw(0, D); };
        const px = (col) => { const d = c.getImageData(0, 0, VW, VH).data; let n = 0;
          for (let i = 0; i < d.length; i += 4) { if (!d[i + 3]) continue;
            if (!col) n++; else if ('#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase() === col) n++; }
          return n; };

        // ---- spray, with the wind ----
        look(I.bank + 2);
        const near = Scene.camD - CAM_BACK + 0.7;
        const spray = w => { Scene.wind = w; let n = 0;
          for (let k = 0; k < 8; k++) { Scene.t += 0.13; c.clearRect(0, 0, VW, VH); Scene.drawSpray(posts, hw, up, near); n += px(); }
          return n; };
        o.calm = spray(0); o.breeze = spray(0.5); o.gale = spray(1.2);
        o.mph = [0, 0.5, 1.2].map(w => Math.round(Math.abs(w) * 18));

        // ---- gulls ----
        Scene.wind = 0; look(0);
        c.clearRect(0, 0, VW, VH); Scene.drawGulls(posts, hw, Scene.camD - CAM_BACK + 0.7);
        o.gullPx = px('#EEF1F3') + px('#5A6470');
        // the one on the post: there until he is within seven, then off
        const pd = posts[Math.floor(posts.length / 2)];
        const beak = cam => { const t0 = Scene.t; look(cam); Scene.t = t0;
          c.clearRect(0, 0, VW, VH); Scene.drawGulls(posts, hw, cam - CAM_BACK + 0.7); return px('#E8B04A'); };
        Scene.gullOff = null; Scene._gullHole = Scene.hole;
        o.sat = beak(pd - 10);
        o.stillSat = beak(pd - 7.2);
        o.off = beak(pd - 6.9); o.offAt = Scene.gullOff !== null;
        Scene.t += 1; o.gone = beak(pd - 5);
        Scene.t += 8; o.later = beak(pd - 3);
        // and back on its post on the next Sea Stack hole
        S.hole = piers[1]; startHole(); Scene.announce = null;
        const I2 = Scene.isle, posts2 = []; for (let d = LEN - 8.3; d >= I2.bank + 0.5 - 0.01; d -= 2.4) posts2.push(d);
        look(0); c.clearRect(0, 0, VW, VH); Scene.drawGulls(posts2, hw, -CAM_BACK + 0.7);
        o.back = px('#E8B04A');

        // ---- the cry ----
        let n = 0;
        S.sound = 1; QUIET = false;
        Sfx.ctx = { state: 'running', currentTime: 1 };
        Sfx.gull = () => { n++; }; Sfx.chirp = () => {}; Sfx.gust = () => {}; Sfx.musicTick = () => {};
        const cries = (secs, night) => { const n0 = n; Scene.night = night; Sfx.gullT = undefined;
          for (let t = 0; t < secs; t += 0.1) Sfx.tick(0.1); return n - n0; };
        o.onPier = cries(120, false); o.atNight = cries(120, true);
        const piered = Scene.isle; Scene.isle = null; o.elsewhere = cries(120, false); Scene.isle = piered;
        Sfx.ctx = keep.ctx; Sfx.gull = keep.gull; Sfx.chirp = keep.chirp; Sfx.gust = keep.gust; Sfx.musicTick = keep.mt;

        // ---- as loud as a bird ----
        const loud = async fn => {
          const oc = new OfflineAudioContext(1, 88200, 44100), k2 = { ctx: Sfx.ctx, master: Sfx.master, nz: Sfx._nz };
          Sfx.ctx = oc; Sfx.master = oc.destination; Sfx._nz = null;
          const mr = Math.random; Math.random = () => 0.5;
          try { fn(0.05); } finally { Sfx.ctx = k2.ctx; Sfx.master = k2.master; Sfx._nz = k2.nz; Math.random = mr; }
          const d = (await oc.startRendering()).getChannelData(0), W = 13230; let sum = 0, best = 0;
          for (let i = 0; i < d.length; i++) { sum += d[i] * d[i]; if (i >= W) sum -= d[i - W] * d[i - W]; if (i >= W - 1) best = Math.max(best, sum / W); }
          return 10 * Math.log10(best + 1e-12);
        };
        o.gullDb = await loud(t => Sfx.gull(t)); o.chirpDb = await loud(t => Sfx.chirp(t));
      } finally {
        Sfx.ctx = keep.ctx; Sfx.gull = keep.gull; Sfx.chirp = keep.chirp; Sfx.gust = keep.gust; Sfx.musicTick = keep.mt;
        S.sound = keep.sound; Scene.wind = keep.wind; Scene.night = keep.night; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    const f = m => { throw new Error(m); };
    if (r.calm) f('on a calm day ' + r.calm + ' pixels of spray were drawn');
    if (!(r.breeze > 0 && r.gale > r.breeze * 1.5)) f('spray at ' + r.mph.join(', ') + ' mph: ' + [r.calm, r.breeze, r.gale].join(', ') + ' pixels, not none, some, and more in a crosswind');
    if (!(r.gullPx >= 9)) f('from the tee only ' + r.gullPx + ' pixels of gull were in view');
    if (!(r.sat > 0 && r.stillSat > 0)) f('the gull was not sat on its post while he was further off (' + r.sat + ', ' + r.stillSat + ')');
    if (r.off || !r.offAt || r.gone || r.later) f('the gull on the post did not take off when he came within seven (' + [r.off, r.offAt, r.gone, r.later].join(', ') + ')');
    if (!(r.back > 0)) f('on the next Sea Stack hole the gull was not back on its post');
    if (!(r.onPier >= 6) || r.atNight || r.elsewhere) f('gull cries in two minutes: ' + r.onPier + ' on the pier, ' + r.atNight + ' at night, ' + r.elsewhere + ' on another hole');
    if (Math.abs(r.gullDb - r.chirpDb) > 3) f('a gull cries at ' + r.gullDb.toFixed(1) + ' dB against a bird\'s ' + r.chirpDb.toFixed(1) + ' dB');
    return ['spray with the wind: ' + [r.calm, r.breeze, r.gale].join(' / ') + ' pixels at ' + r.mph.join(' / ') + ' mph',
      'gulls wheeling over the stack; the one on the post sits till he is within seven, takes off, and is back on the next Sea Stack hole',
      r.onPier + ' cries in two minutes on the pier, none at night or elsewhere; ' + r.gullDb.toFixed(1) + ' dB against a bird\'s ' + r.chirpDb.toFixed(1)];
  }
};
