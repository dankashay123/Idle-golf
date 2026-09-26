/* The wagers as they are played (the user sent screenshots of four of them).
 *
 *   - the Island Green's green shows, standing in its lake (it was a bare
 *     basin with the flag in it)
 *   - the Twilight Putt starts with him on the green (he glided up to it)
 *     and he putts: no full swing all run, a putt stroked and rolling
 *   - the Clubhouse Vault is walked: the camera moves only while he is not
 *     swinging, and he is seen walking (he glided up it as he swung)
 *   - the Scramble has no ball left over from the course sitting at the cup
 *   - every wager has a Leave button at the top right of the field, and a
 *     line over the shot buttons saying what helps in it; neither on the
 *     course; Leave asks once, then ends the wager and pays what it won
 */
'use strict';
module.exports = {
  name: 'wagerplay',
  async run(page) {
    const start = id => page.evaluate(id => { hideSheet(); QUIET = false; delete S.dgnRun;
      const d = B.DGN.find(x => x.id === id); S.dgnKeys[d.id] = 3; setView('dgn'); startDgn(d); hideSheet(); }, id);
    const f = m => { throw new Error(m); };
    await page.evaluate(() => { hideSheet(); QUIET = true; DEV.tierSet(6); DEV.skills(); QUIET = false; hideSheet(); });

    // ---- off a wager: no Leave, no hint ----
    const off = await page.evaluate(() => [document.getElementById('leaveBtn').hidden, document.getElementById('wagerStat').hidden]);
    if (!off[0] || !off[1]) f('on the course the Leave button or the wager hint shows');

    // ---- the Scramble: a putt left from the course does not come along ----
    await page.evaluate(() => { Scene.putt = { t0: Scene.t - 5, d0: LEN - 2.2 }; Scene.cupT = 0; });
    await start('scramble'); await page.waitForTimeout(400);
    const sc = await page.evaluate(() => {
      const b = document.getElementById('leaveBtn').getBoundingClientRect(), st = document.getElementById('stage').getBoundingClientRect();
      const ws = document.getElementById('wagerStat'), wr = ws.getBoundingClientRect(), d = B.DGN.find(x => x.id === 'scramble');
      const k = (parseFloat(Scene.cv.style.height) || st.height) / VH, sz = Math.max(12, Math.round(VW * 0.050 / 12) * 12), pad = Math.max(3, Math.round(sz / 6));
      const shots = st.top + (VH - sz - pad * 2 - 2) * k;
      return { putt: !!Scene.putt, leave: !document.getElementById('leaveBtn').hidden && b.right > st.right - st.width * 0.1 && b.top < st.top + st.height * 0.12,
               hint: !ws.hidden && ws.textContent === 'Helped by ' + d.st && wr.bottom <= shots + 0.5 && wr.left < st.left + st.width * 0.2,
               hintText: ws.textContent, toastsBelow: document.getElementById('toasts').getBoundingClientRect().top >= b.bottom - 1 };
    });
    if (sc.putt) f('the Scramble kept a putt from the course: its ball sat at the cup');
    if (!sc.leave) f('no Leave button at the top right of the field in a wager');
    if (!sc.toastsBelow) f('the toasts stand over the Leave button');
    if (!sc.hint) f('the wager hint over the shot buttons reads "' + sc.hintText + '", or stands in the wrong place');
    // Leave: asks, then ends it and pays
    const lv = await page.evaluate(async () => {
      const b = document.getElementById('leaveBtn'); b.click(); const asked = document.getElementById('leaveTxt').textContent, still = !!S.dgnRun;
      b.click(); await new Promise(r => setTimeout(r, 50));
      const res = { asked, still, gone: !S.dgnRun, sheet: document.getElementById('veil').classList.contains('on'), hidden: b.hidden };
      hideSheet(); return res;
    });
    if (lv.asked !== 'Sure?' || !lv.still || !lv.gone || !lv.sheet) f('Leave did not ask and then end the wager: ' + JSON.stringify(lv));
    await page.waitForTimeout(100);
    await page.waitForTimeout(100);
    if (!(await page.evaluate(() => document.getElementById('leaveBtn').hidden && document.getElementById('wagerStat').hidden && document.getElementById('callout').hidden))) f('the Leave button or hint stayed up after leaving');

    // ---- the Island Green: its green shows, and its calls are on the page,
    // small, in the interface's type (the pixel letters were too big) ----
    await start('water'); await page.waitForTimeout(600);
    await page.waitForTimeout(1100);
    const call = await page.evaluate(() => { const e = document.getElementById('callout'), cs = getComputedStyle(e);
      return { shown: !e.hidden, t: e.textContent, size: parseFloat(cs.fontSize), font: cs.fontFamily, off: !!document.getElementById('callout').hidden }; });
    if (!call.shown || !/on the green|in the water/i.test(call.t) || !(call.size <= 14) || /Iowan|monospace/i.test(call.font))
      f('the Island Green\'s call reads ' + JSON.stringify(call));
    const isl = await page.evaluate(() => {
      // (bright grass, the haze on it and all: the lake about it is dark
      // blue-green, and the bare basin was darker still)
      const p = Scene.proj(LEN, 0), R = Math.max(6, Math.round(4 * LAT * p.s)), d = Scene.b.getImageData(0, 0, VW, VH).data;
      let n = 0;
      for (let y = Math.max(0, p.y - R); y < Math.min(VH, p.y + R); y++) for (let x = Math.max(0, p.x - R * 2); x < Math.min(VW, p.x + R * 2); x++) {
        const i = (y * VW + x) * 4;
        if (d[i + 1] > 140 && d[i + 1] > d[i] + 40 && d[i + 1] > d[i + 2] + 20) n++;
      }
      delete S.dgnRun; return n;
    });
    if (isl < 25) f('the Island Green shows only ' + isl + ' pixels of green by its pin');

    // ---- the Twilight Putt: on the green from the first frame, putting ----
    await start('twilight');
    const tw = await page.evaluate(async () => {
      const o = { cam0: null, swung: 0, putts: 0, rolled: 0, spot: LEN - B_GREEN_STAND };
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      o.cam0 = Scene.camD;
      const t0 = performance.now(); let lastPutt = null;
      while (performance.now() - t0 < 5200) {
        await new Promise(r => requestAnimationFrame(r));
        if (Scene.swingT > 0) o.swung++;
        if (Scene.putt && Scene.putt.wager && Scene.putt !== lastPutt) { o.putts++; lastPutt = Scene.putt; }
        if (Scene.putt && Scene.putt.wager && (Scene.t - Scene.putt.t0) / Scene.putt.k > PUTT_HIT + 0.1) o.rolled++;

      }
      // a putt that drops ends in the cup (it ran to the course's pin, off his line)
      { const keepP = Scene.putt; Scene.wagerPutt(true, 0, 2); const e = Scene.puttBall(PUTT_HIT + PUTT_ROLL); o.off = Math.abs(e.lat - Scene.pinX()) + Math.abs(e.d - LEN); Scene.putt = keepP; }
      delete S.dgnRun; return o;
    });
    if (tw.off > 0.15) f('a putt that dropped in the Twilight Putt finished ' + tw.off.toFixed(2) + ' off the cup');
    if (Math.abs(tw.cam0 - tw.spot) > 0.05) f('the Twilight Putt starts him at ' + tw.cam0.toFixed(2) + ', not on the green at ' + tw.spot.toFixed(2) + ' (he glided up to it)');
    if (tw.swung) f('in the Twilight Putt he swung ' + tw.swung + ' frames: it is putts, not chips');
    if (!(tw.putts >= 2) || !(tw.rolled > 5)) f('in five seconds of the Twilight Putt ' + tw.putts + ' putts were struck and ' + tw.rolled + ' frames rolled');

    // ---- the Vault: walked, not glided ----
    await start('vault');
    const va = await page.evaluate(async () => {
      const o = { walk: 0, slid: 0, moved: 0 };
      let cam = Scene.camD, sw = Scene.swingT;
      const t0 = performance.now();
      while (performance.now() - t0 < 4000) {
        await new Promise(r => requestAnimationFrame(r));
        const dc = Scene.camD - cam; cam = Scene.camD;
        // (mid-swing on both sides of the frame: a swing can start in the
        // frame after he has stepped)
        if (Math.abs(dc) > 0.002 && Scene.swingT > 0 && sw > 0 && Scene.swingT < sw) o.slid++;
        sw = Scene.swingT;
        if (dc > 0.002) o.moved++;
        if (Scene.walkOn) o.walk++;
      }
      delete S.dgnRun; return o;
    });
    if (!(va.moved > 10) || !(va.walk > 5)) f('in the Vault the camera moved ' + va.moved + ' frames and he walked ' + va.walk);
    if (va.slid > 2) f('in the Vault he slid forward mid-swing in ' + va.slid + ' frames');
    await page.evaluate(() => { delete S.dgnRun; QUIET = false; hideSheet(); startHole(); });
    return ['the Island Green\'s green shows (' + isl + ' pixels by the pin); the Twilight Putt starts on the green and is putted (' + tw.putts + ' putts, no swing)',
      'the Vault is walked (' + va.walk + ' frames walking, ' + va.slid + ' sliding mid-swing); the Scramble brings no ball from the course',
      'Leave at the top right, asking once; "' + sc.hintText + '" over the shot buttons; neither on the course'];
  }
};
