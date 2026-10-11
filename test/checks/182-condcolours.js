/* (and a tap on a condition's name says what it does, off its own numbers:
 * the conditions were only named)
 * The day's conditions beside the cog each in a colour of its own, of what
 * it is (the user asked: "Glass Greens (1 color) + STATIC AIR (a different
 * color)"): every condition has its colour and no two share one; two at once
 * show in their two colours with a plain "+" between; none on a Fair day.
 * And the day's line under the course's name stands clear of it (the user
 * found them too close): at least 4px between the name's letters and the
 * day's, the header no taller for it. */
'use strict';
module.exports = {
  name: 'condcolours',
  async run(page) {
    const r = await page.evaluate(() => {
      const keep = S.chaos, o = {};
      try {
        hideSheet();
        o.names = B.CHAOS.map(c => c.n).filter(n => n !== 'Fair');
        o.missing = o.names.filter(n => !COND_COL[n]);
        const cols = o.names.map(n => COND_COL[n]);
        o.dupes = cols.length - new Set(cols).size;
        S.chaos = Object.assign({}, keep, { n: 'Glass Greens + Static Air' }); renderLive(derive());
        const ct = document.getElementById('condTip');
        o.parts = [...ct.querySelectorAll('b')].map(b => [b.textContent, getComputedStyle(b).color]);
        o.text = ct.textContent;
        S.chaos = Object.assign({}, keep, { n: 'Fair' }); renderLive(derive()); o.fair = ct.textContent;
        const a = document.getElementById('eventName').getBoundingClientRect(), b2 = document.getElementById('dayName').getBoundingClientRect();
        o.gap = Math.round(b2.top - a.bottom); o.head = Math.round(document.getElementById('title').parentNode.getBoundingClientRect().height);
      } finally { S.chaos = keep; renderLive(derive()); }
      return o;
    });
    const fails = [];
    if (r.missing.length) fails.push('no colour for ' + r.missing.join(', '));
    if (r.dupes) fails.push(r.dupes + ' conditions share a colour');
    if (r.parts.length !== 2 || r.parts[0][1] === r.parts[1][1]) fails.push('two conditions not in two colours: ' + JSON.stringify(r.parts));
    if (!/Glass Greens \+ Static Air/.test(r.text)) fails.push('the words read ' + r.text);
    if (r.fair) fails.push('a Fair day shows ' + r.fair);
    if (!(r.gap >= 4)) fails.push('the day\'s line ' + r.gap + 'px under the course\'s name');
    if (r.head > 60) fails.push('the header grew to ' + r.head + 'px');
    // what each does, off its own numbers, and said on a tap of its name by the cog
    const w = await page.evaluate(() => {
      const bad = [], pc = v => Math.round(Math.abs(v) * 100) + '%';
      for (const c of B.CHAOS) { if (c.n === 'Fair') continue; const t = condWhat(c.n).replace(/<[^>]+>/g, '').replace(/\u00a0/g, ' ');
        const want = []; if (c.y !== 1) want.push('holes ' + pc(c.y - 1)); if (c.g !== 1) want.push(pc(c.g - 1) + (c.g > 1 ? ' more' : ' less') + ' purse');
        if (c.s !== 1) want.push('swings ' + pc(c.s - 1)); if (c.c) want.push(pc(c.c) + ' pure strike'); if (c.p) want.push(pc(c.p) + ' affinity'); if (c.dl) want.push(pc(c.dl) + ' club luck');
        for (const x of want) if (!t.includes(x)) bad.push(c.n + ' does not say "' + x + '": ' + t); }
      hideSheet(); const ann = Scene.announce; Scene.announce = null; const keep = S.chaos; S.chaos = Object.assign({}, B.CHAOS[7], { n: 'Glass Greens + Static Air' }); renderLive();
      document.getElementById('toasts').innerHTML = ''; document.getElementById('condTip').click();
      const said = [...document.querySelectorAll('#toasts .toast')].map(t => t.textContent).join(' ').replace(/\u00a0/g, ' ');
      S.chaos = keep; Scene.announce = ann; renderLive(); document.getElementById('toasts').innerHTML = '';
      return { bad, said };
    });
    fails.push(...w.bad.slice(0, 4));
    if (!/Glass Greens · holes 10% shorter/.test(w.said) || !/Static Air · holes 10% longer/.test(w.said)) fails.push('a tap on the conditions said "' + w.said + '"');
    if (fails.length) throw new Error(fails.join('\n'));
    return [r.names.length + ' conditions, ' + r.names.length + ' colours, each said in words off its numbers on a tap; two at once in two; the day\'s line ' + r.gap + 'px under the name, header ' + r.head + 'px'];
  }
};
