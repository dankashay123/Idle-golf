/* A buzz in the hand (the user chose it, readying the iPhone app): with a
 * stand-in for the app's Haptics,
 *
 *   - an ace and an albatross played with the course in sight buzz, a strong
 *     one; an eagle does not; an ace away (a catch-up) or unseen does not
 *   - a Mythic club into the locker buzzes, a light one; a Legendary does
 *     not; a bag giving a Mythic does
 *   - the Settings carry Vibration in the app and it turns them all off,
 *     kept in the save; on a computer's browser, which cannot buzz, no row
 *   - never two buzzes within 0.4 seconds (a bag of Mythics is one) */
'use strict';
module.exports = {
  name: 'buzz',
  async run(page) {
    await page.setViewportSize({ width: 390, height: 844 });
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), fl = [], f = m => fl.push(m), o = {}, RN = Date.now;
      let T = RN(); Date.now = () => T;
      const calls = [];
      try {
        hideSheet(); QUIET = false; window.step = () => {}; S.chaos = { n: 'Fair' };
        // ---- a computer's browser: no row ----
        settingsSheet(); if (/Vibration/.test(document.getElementById('sheet').innerText)) f('a browser that cannot buzz shows Vibration'); hideSheet();
        // ---- the app ----
        window.__inApp = 1;
        window.Capacitor = { Plugins: { Haptics: { impact: x => calls.push('impact ' + x.style), notification: x => calls.push('note ' + x.type) } } };
        const later = () => { T += 1000; };
        const D = derive(), sid = d => B.SCORE.findIndex(s => s.d === d);
        const finish = (d, away, unseen) => { later(); calls.length = 0; startHole(); hideSheet(); S.chaos = { n: 'Fair' };
          const i = sid(d); S.doneT = (d === -4 ? B.SCORE[i].r * 0.5 : (B.SCORE[i].r + B.SCORE[i - 1].r) / 2) * S.parTime;
          Scene.drawnN = Scene.stepN - (unseen ? 50 : 0); OFFLINE = !!away; finishHole(D); OFFLINE = false; S.doneT = null; return calls.slice(); };
        let c = finish(-4); if (!c.includes('note SUCCESS')) f('an ace seen did not buzz (' + c + ')');
        c = finish(-3); if (!c.includes('note SUCCESS')) f('an albatross seen did not buzz (' + c + ')');
        // (a hole that waits for him to walk up: the buzz as the ball drops, and not again when the hole moves on)
        { later(); calls.length = 0; startHole(); hideSheet(); S.chaos = { n: 'Fair' }; const i = sid(-4); S.doneT = B.SCORE[i].r * 0.5 * S.parTime; Scene.drawnN = Scene.stepN;
          holeSaid(); const atDrop = calls.length; later(); finishHole(D); S.doneT = null;
          if (atDrop !== 1) f('an ace did not buzz as the ball dropped (' + atDrop + ')'); if (calls.length !== 1) f('an ace buzzed ' + calls.length + ' times'); }
        c = finish(-2); if (c.some(x => /^note/.test(x))) f('an eagle buzzed');
        c = finish(-4, true); if (c.length) f('an ace in a catch-up buzzed');
        c = finish(-4, false, true); if (c.some(x => /^note/.test(x))) f('an ace unseen buzzed');
        Scene.drawnN = Scene.stepN;
        later(); calls.length = 0; bagAdd(makeItem(S.tier, 0, 5)); if (!calls.includes('impact MEDIUM')) f('a Mythic club did not buzz (' + calls + ')');
        later(); calls.length = 0; bagAdd(makeItem(S.tier, 0, 4)); if (calls.length) f('a Legendary club buzzed');
        later(); calls.length = 0; S.sov = 1e6; S.pityB = { range: 29 }; openBag(B.BAGS.find(b => b.id === 'range'), true); if (!calls.length) f('a bag giving a Mythic did not buzz');
        calls.length = 0; T += 100; bagAdd(makeItem(S.tier, 0, 5)); if (calls.length) f('two buzzes within 0.4 seconds');
        // ---- the setting ----
        settingsSheet(); const t = document.getElementById('sheet').innerText;
        if (!/Vibration/.test(t)) f('in the app the Settings have no Vibration');
        toggleBuzz(); hideSheet(); if (S.buzz !== 0) f('Vibration off is not kept');
        const kept = JSON.parse(localStorage.getItem(KEY)); if (kept.buzz !== 0) f('Vibration off is not in the save');
        later(); calls.length = 0; bagAdd(makeItem(S.tier, 0, 5)); c = finish(-4); if (calls.length || c.length) f('with Vibration off it buzzed');
        later(); toggleBuzz(); hideSheet(); if (S.buzz === 0) f('Vibration back on is not kept');
        o.n = Buzz.n;
      } finally {
        Date.now = RN; delete window.Capacitor; delete window.__inApp; OFFLINE = false; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); startHole();
      }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['in the app: an ace and an albatross seen buzz, an eagle, a catch-up or an unseen ace not; a Mythic club and a bag\'s Mythic buzz, a Legendary not; one in 0.4 seconds; Vibration in the Settings turns it off, kept; none on a computer'];
  }
};
