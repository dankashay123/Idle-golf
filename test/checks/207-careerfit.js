/* The Career screens on a narrow phone (the user plays on an iPhone):
 *
 *   - the box of points to spend, under the level bar, stays inside a 320
 *     screen with every mix of talents, attributes and paragon points (all
 *     three ran off it: "59 talents · 177 attributes · 12 p")
 *   - Paragon's Swing Power, full, says where Core's points go from there,
 *     and what it multiplies his power by
 *   - nothing on the Attributes, Talents or Paragon pages past the screen */
'use strict';
module.exports = {
  name: 'careerfit',
  async run(page) {
    await page.setViewportSize({ width: 320, height: 640 });
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), fl = [], f = m => fl.push(m), o = { mixes: 0 };
      try {
        hideSheet(); S.lv = 60; S.para = 300;
        for (const [t, st, pp] of [[59, 177, 12], [59, 177, 0], [0, 177, 12], [59, 0, 12], [7, 3, 0], [0, 0, 1240], [120, 180, 900]]) {
          S.talPts = t; S.statPts = st; B.PARAGON.forEach(c => S.paraPts[c.id] = 0); S.paraPts.core = pp; renderXp();
          const e = document.getElementById('xpNum'), b = e.getBoundingClientRect();
          if (b.right > innerWidth + 0.5 || b.left < -0.5) f('"' + e.textContent + '" runs past the screen (to ' + Math.round(b.right) + ')');
          o.mixes++;
        }
        const pa = B.PARAGON[0].a.find(a => a.id === 'pow');
        S.paraSpent['core.pow'] = pa.cap; S.paraPts.core = 5;
        setView('career');
        for (const sub of ['stat', 'tal', 'para']) {
          careerSub = sub; renderCareer();
          const w = document.getElementById('careerBody');
          const off = [...w.querySelectorAll('*')].filter(e => e.offsetParent && e.getBoundingClientRect().right > innerWidth + 0.5);
          if (off.length) f(off.length + ' parts of ' + sub + ' past the screen');
          if (sub === 'para') { const row = [...w.querySelectorAll('.row')].find(e => e.querySelector('.nm').textContent.startsWith('Swing Power'));
            o.row = row ? row.querySelector('.mt').textContent : null;
            if (!row || !/full: points go to Affinity Power/.test(o.row) || !/×4\.00/.test(o.row)) f('full Swing Power reads "' + o.row + '"'); }
        }
      } finally { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); renderXp(); setView('upg'); }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['the points to spend inside a 320 screen in ' + r.o.mixes + ' mixes; full Swing Power: "' + r.o.row + '"; Attributes, Talents and Paragon whole at 320'];
  }
};
