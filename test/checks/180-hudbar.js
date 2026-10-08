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
 *   - the toasts start below the bar */
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
        // the longest weather line the game writes: wind, weather, affinity, a signature hole, the closing hole
        const wx = document.getElementById('rWx');
        wx.innerHTML = ['<span>18 MPH &gt;&gt;</span>', '<span>THUNDERSTORM</span>', '<span>SPONSOR DAY</span>', '<span>EMBER<small class="aff">AFF</small></span>', '<span>ISLAND GREEN</span>', '<span>CLOSING HOLE</span>'].join('<i>·</i>');
        wx.hidden = false; Scene._hwKey = 'test'; fitHudLeft();
        const R = id => document.getElementById(id).getBoundingClientRect();
        const st = R('stage'), nb = R('nineBar'), bar = R('rRow'), fill = document.querySelector('#readout .rbar').getBoundingClientRect(), line = document.querySelector('#readout .rline').getBoundingClientRect();
        const lh = parseFloat(getComputedStyle(wx).lineHeight) || parseFloat(getComputedStyle(wx).fontSize) * 1.35;
        const shown = [...wx.children].filter(c => c.tagName === 'SPAN' && getComputedStyle(c).display !== 'none');
        const cut = shown.some(c => c.getBoundingClientRect().right > wx.getBoundingClientRect().right + 0.5);
        const btns = ['setBtn', 'calBtn', 'shopBtn', 'roomBtn', 'perkBtn', 'hudClimb'].map(id => R(id));
        const lefts = [...new Set(btns.map(b => Math.round(b.left)))];
        const toasts = R('toasts');
        const out = { st: [st.top, st.width], nb: nb.bottom, bar: [bar.top, bar.bottom, bar.width], fill: fill.width, line: line.height, rh: R('rTop').height,
          wxh: wx.getBoundingClientRect().height, lh, cut, shown: shown.length, cols: lefts.length, btnTop: Math.min(...btns.map(b => b.top)), toastTop: toasts.top,
          two: document.getElementById('hudLeft').classList.contains('twocol') };
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
      if (r.cols !== 1 && !(r.two && r.cols === 2)) f(at + 'the buttons in ' + r.cols + ' columns');
      if (r.btnTop < r.bar[1]) f(at + 'a button up in the bar');
      if (r.toastTop < r.bar[1]) f(at + 'the toasts over the bar');
      o.push(W + 'x' + H + ' bar ' + Math.round(r.bar[1] - r.bar[0]) + 'px, ' + r.shown + ' of 6 weather items, ' + r.cols + (r.cols > 1 ? ' columns' : ' column'));
    }
    await page.setViewportSize({ width: 400, height: 860 });
    if (fails.length) throw new Error(fails.join('; '));
    return ['the hole\'s bar right under the card, the whole width, one line of weather: ' + o.join(', ')];
  }
};
