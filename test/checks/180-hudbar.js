/* The hole's bar across the top of the field (the user asked, to open up
 * more of the course): right under the scorecard, the yardage bar the whole
 * width, the wind and the rest on one line under it; the buttons in one
 * column down the left under it (two side by side only where the stage is
 * too short).
 *
 *   - at 320x568, 390x844, 440x956 and 844x390: the bar's top within a pixel
 *     of the stage's, which starts within a pixel of the nine's bar above it;
 *     the bar and its yardage line at least 97% of the stage wide
 *   - the hole, the yards and the clock on one line; the weather line one line
 *     high, with the longest weather the game shows, nothing cut mid-word
 *   - the six buttons below the bar, in one column at the same left (or two)
 *   - the toasts start below the bar
 *   - the bar one height whether the line under it is empty, full, or its
 *     letters shrunk (the user saw it change size), the affinity's slot
 *     centred under the yards
 *   - the day's condition beside the cog, under the bar, whole */
'use strict';
module.exports = {
  name: 'hudbar',
  async run(page) {
    const fails = [], f = m => { if (fails.length < 12) fails.push(m); }, o = [];
    for (const [W, H] of [[320, 568], [390, 844], [440, 956], [844, 390]]) {
      await page.setViewportSize({ width: W, height: H });
      await page.waitForTimeout(250);
      const r = await page.evaluate(() => {
        hideSheet(); setView('upg');
        // the longest line the game writes there: the wind, the course's affinity, the closing hole (on a Sunday)
        const wx = document.getElementById('rWx');
        // (four slots: the wind, the day's condition, the affinity, the closing hole; the longest of each)
        const fillWx = (a, b2) => { wx.innerHTML = '<span>' + a + '</span><span>' + b2 + '<small class="aff">AFF</small>+</span><span>CLOSING HOLE</span>'; wx.hidden = false; Scene._hwKey = 'test'; fitHudLeft(); };
        const barH = () => document.getElementById('rRow').getBoundingClientRect().height;
        const hs = []; wx.hidden = true; wx.innerHTML = ''; fitHudLeft(); hs.push(barH());
        const mid4 = () => [...wx.children].map(c => { const q = c.getBoundingClientRect(); return q.left + q.width / 2; });
        fillWx('1\u00a0MPH', 'FIRE'); const m0 = mid4(); hs.push(barH());
        fillWx('&lt;&lt;&lt; 18\u00a0MPH', 'STORM'); const m1 = mid4(); hs.push(barH());
        wx.style.fontSize = '7px'; hs.push(barH()); wx.style.fontSize = '';
        const affMid = m1[1];
        const moved = Math.max(...m0.map((v, i) => Math.abs(v - m1[i])));
        wx.hidden = false; Scene._hwKey = 'test'; fitHudLeft();
        const R = id => document.getElementById(id).getBoundingClientRect();
        const st = R('stage'), nb = R('nineBar'), bar = R('rRow'), fill = document.querySelector('#readout .rbar').getBoundingClientRect(), line = document.querySelector('#readout .rline').getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(wx).lineHeight) || parseFloat(getComputedStyle(wx).fontSize) * 1.35;
        const shown = [...wx.children].filter(c => c.tagName === 'SPAN' && getComputedStyle(c).display !== 'none');
        const cut = shown.some(c => c.getBoundingClientRect().right > wx.getBoundingClientRect().right + 0.5 || c.scrollWidth > c.clientWidth + 0.5);
        const btns = ['setBtn', 'calBtn', 'shopBtn', 'roomBtn', 'perkBtn', 'hudClimb'].map(id => R(id));
        const lefts = [...new Set(btns.map(b => Math.round(b.left)))];
        const toasts = R('toasts'), mid = R('stage').left + R('stage').width / 2;
        // the yards in the middle whatever the call says either side
        const yards = []; for (const [tag, clock] of [['', '0.0 / 10s'], ['Albatross', '10.0 / 15s'], ['Par', '1.2 / 10s']]) {
          document.getElementById('rTag').textContent = tag; document.getElementById('rTopR').textContent = clock; const q = document.querySelector('#readout .rmain').getBoundingClientRect(); yards.push(q.left + q.width / 2 - mid); }
        const out = { st: [st.top, st.width], nb: nb.bottom, bar: [bar.top, bar.bottom, bar.width], fill: fill.width, line: line.height, rh: R('rTop').height,
          wxh: wx.getBoundingClientRect().height, lh, cut, shown: shown.length, cols: lefts.length, btnTop: Math.min(...btns.map(b => b.top)), toastTop: toasts.top,
          two: document.getElementById('hudLeft').classList.contains('twocol'), yards, moved, hs, affOff: affMid - mid };
        // the condition beside the cog
        const keep = S.chaos; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Cart Path Only')); renderLive();
        const ct = document.getElementById('condTip'), cq = ct.getBoundingClientRect(), cog = R('setBtn');
        out.cond = { txt: ct.textContent, l: cq.left - cog.right, top: cq.top, bot: cq.bottom, cogBot: cog.bottom, cut: ct.scrollWidth > ct.clientWidth + 0.5 || cq.right > R('stage').right };
        S.chaos = keep; renderLive();
        Scene._hwKey = null; wx.hidden = true;
        return out;
      });
      const at = W + 'x' + H + ': ';
      if (Math.abs(r.st[0] - r.nb) > 1) f(at + 'the field starts ' + (r.st[0] - r.nb).toFixed(1) + 'px under the nine\'s bar');
      if (Math.abs(r.bar[0] - r.st[0]) > 1) f(at + 'the bar ' + (r.bar[0] - r.st[0]).toFixed(1) + 'px down the field');
      if (r.bar[2] < r.st[1] * 0.97 || r.fill < r.st[1] * 0.9) f(at + 'the bar ' + Math.round(r.bar[2]) + ' wide, its yardage ' + Math.round(r.fill) + ', of ' + Math.round(r.st[1]));
      if (r.line > r.rh * 1.9) f(at + 'the hole, the yards and the clock on more than one line (' + Math.round(r.line) + 'px)');
      if (r.wxh > r.lh * 1.5) f(at + 'the weather on more than one line (' + Math.round(r.wxh) + 'px, a line ' + Math.round(r.lh) + ')');
      if (r.cut) f(at + 'the weather line cut mid-word');
      if (r.moved > 1.5) f(at + 'the slots under the bar move ' + r.moved.toFixed(1) + 'px as their words change');
      if (r.yards.some(v => Math.abs(v) > 1.5)) f(at + 'the yards off the middle by ' + r.yards.map(v => v.toFixed(1)).join('/') + 'px as the call changes');
      if (r.cols !== 1 && !(r.two && r.cols === 2)) f(at + 'the buttons in ' + r.cols + ' columns');
      if (Math.max(...r.hs) - Math.min(...r.hs) > 0.5) f(at + 'the bar changes size: ' + r.hs.map(v => v.toFixed(1)).join('/') + 'px');
      if (Math.abs(r.affOff) > 1.5) f(at + 'the affinity ' + r.affOff.toFixed(1) + 'px off the middle');
      if (r.cond.txt !== 'Cart Path Only' || r.cond.cut) f(at + 'the condition beside the cog reads "' + r.cond.txt + '"' + (r.cond.cut ? ', cut' : ''));
      if (r.cond.l < 0 || r.cond.l > (r.two ? 80 : 40) || r.cond.top < r.bar[1] || r.cond.bot > r.cond.cogBot + 14) f(at + 'the condition not just right of the cog (' + JSON.stringify(r.cond) + ')');
      if (r.btnTop < r.bar[1]) f(at + 'a button up in the bar');
      if (r.toastTop < r.bar[1]) f(at + 'the toasts over the bar');
      o.push(W + 'x' + H + ' bar ' + Math.round(r.bar[1] - r.bar[0]) + 'px, ' + r.shown + ' of 3 slots, ' + r.cols + (r.cols > 1 ? ' columns' : ' column'));
    }
    await page.setViewportSize({ width: 400, height: 860 });
    if (fails.length) throw new Error(fails.join('; '));
    return ['the hole\'s bar right under the card, the whole width, one line of weather: ' + o.join(', ')];
  }
};
