/* The hole's bar across the top of the field (the user asked, to open up
 * more of the course): right under the scorecard, the yardage bar the whole
 * width, the wind and the rest on one line under it; the buttons in one
 * column down the left under it (two side by side only where the stage is
 * too short).
 *
 *   - at 320x568, 390x844, 440x956 and 844x390: the bar's top within a pixel
 *     of the stage's, which starts within a pixel of the nine's bar above it;
 *     the bar and its yardage line at least 97% of the stage wide
 *   - the hole, the yards and the clock on one line, the call ("Albatross")
 *     and the clock whole and apart (at 320 the clock takes the hole's place); the weather line one line
 *     high, with the longest weather the game shows, nothing cut mid-word
 *   - the six buttons below the bar, in one column at the same left (or two)
 *   - the toasts start below the bar, and below the words by the cog
 *     while those reach across under them (a festival's line ran under one);
 *     those words step aside while a course is announced (its name was drawn
 *     over them at 320 and on its side)
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
        let callCut = ''; const yards = []; for (const [tag, clock] of [['', '0.0 / 10s'], ['Albatross', '10.0 / 15s'], ['Par', '1.2 / 10s']]) {
          document.getElementById('rTag').textContent = tag; document.getElementById('rTopR').textContent = clock; const q = document.querySelector('#readout .rmain').getBoundingClientRect(); yards.push(q.left + q.width / 2 - mid);
          const tg = document.getElementById('rTag'), ck = document.getElementById('rTopR'); if (tg.scrollWidth > tg.clientWidth + 0.5 || ck.scrollWidth > ck.clientWidth + 0.5 || (tag && (() => { const a = ck.getBoundingClientRect(), b = tg.getBoundingClientRect(); return a.left < b.right - 0.5 && b.left < a.right - 0.5; })())) callCut = tag + ' with ' + clock; }
        const out = { st: [st.top, st.width], nb: nb.bottom, bar: [bar.top, bar.bottom, bar.width], fill: fill.width, line: line.height, rh: Math.max(R('rTop').height, R('rTopR').height), callCut,
          wxh: wx.getBoundingClientRect().height, lh, cut, shown: shown.length, cols: lefts.length, btnTop: Math.min(...btns.map(b => b.top)), toastTop: toasts.top,
          two: document.getElementById('hudLeft').classList.contains('twocol'), yards, moved, hs, affOff: affMid - mid };
        // the condition beside the cog
        const keep = S.chaos; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Cart Path Only')); renderLive();
        const ct = document.getElementById('condTip'), cq = ct.getBoundingClientRect(), cog = R('setBtn');
        out.cond = { txt: ct.textContent, l: cq.left - cog.right, top: cq.top, bot: cq.bottom, cogBot: cog.bottom, cut: ct.scrollWidth > ct.clientWidth + 0.5 || cq.right > R('stage').right };
        S.chaos = keep; renderLive();
        // a long line by the cog (a festival's) and two toasts up: no toast over the words
        { const bt = document.getElementById('buffTip'), ln = document.createElement('span'); ln.className = 'bl'; ln.dataset.k = 'zz'; ln.textContent = 'Harvest Festival \u00b7 +20% club luck';
          bt.appendChild(ln); bt.classList.add('on'); toastShift(); const ann = Scene.announce; Scene.announce = null;
          toast('UNLOCKED +2 \u00b7 Matching Pair \u00b7 +2 tickets'); toast('Full Set \u00b7 The Radiant');
          const T = [...document.querySelectorAll('#toasts .toast')].map(e => e.getBoundingClientRect()), L = [...document.querySelectorAll('#buffTip .bl, #condTip')].map(e => e.getBoundingClientRect()).filter(q => q.width);
          out.under = { toasts: T.length, hit: T.some(a => L.some(q => a.left < q.right && q.left < a.right && a.top < q.bottom && q.top < a.bottom)) };
          document.getElementById('toasts').innerHTML = ''; ln.remove(); Scene.announce = ann; buffTip(0); }
        // a course announced: the words by the cog step aside, and come back after
        { const keepA = Scene.announce; Scene.announce = { name: 'X', sub: 'Y', label: 'X', subLabel: 'Y', t: 0, dur: 4.2, w0: performance.now() }; buffTip(0);
          const during = document.getElementById('stage').classList.contains('ann') && getComputedStyle(document.getElementById('sideWords')).opacity !== '1' || document.getElementById('stage').classList.contains('ann');
          Scene.announce = null; buffTip(0); const after = !document.getElementById('stage').classList.contains('ann');
          out.annWords = { during, after }; Scene.announce = keepA; buffTip(0); }
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
      if (r.callCut) f(at + 'the call or the clock cut or crossing: ' + r.callCut);
      if (r.cols !== 1 && !(r.two && r.cols === 2)) f(at + 'the buttons in ' + r.cols + ' columns');
      if (Math.max(...r.hs) - Math.min(...r.hs) > 0.5) f(at + 'the bar changes size: ' + r.hs.map(v => v.toFixed(1)).join('/') + 'px');
      if (Math.abs(r.affOff) > 1.5) f(at + 'the affinity ' + r.affOff.toFixed(1) + 'px off the middle');
      if (r.cond.txt !== 'Cart Path Only' || r.cond.cut) f(at + 'the condition beside the cog reads "' + r.cond.txt + '"' + (r.cond.cut ? ', cut' : ''));
      if (r.cond.l < 0 || r.cond.l > (r.two ? 80 : 40) || r.cond.top < r.bar[1] || r.cond.bot > r.cond.cogBot + 14) f(at + 'the condition not just right of the cog (' + JSON.stringify(r.cond) + ')');
      if (r.btnTop < r.bar[1]) f(at + 'a button up in the bar');
      if (r.under.toasts < 2 || r.under.hit) f(at + 'a toast over the words by the cog (' + JSON.stringify(r.under) + ')');
      if (!r.annWords.during || !r.annWords.after) f(at + 'the words by the cog under a course\'s announcement: ' + JSON.stringify(r.annWords));
      if (r.toastTop < r.bar[1]) f(at + 'the toasts over the bar');
      o.push(W + 'x' + H + ' bar ' + Math.round(r.bar[1] - r.bar[0]) + 'px, ' + r.shown + ' of 3 slots, ' + r.cols + (r.cols > 1 ? ' columns' : ' column'));
    }
    await page.setViewportSize({ width: 400, height: 860 });
    if (fails.length) throw new Error(fails.join('; '));
    return ['the hole\'s bar right under the card, the whole width, one line of weather: ' + o.join(', ')];
  }
};
