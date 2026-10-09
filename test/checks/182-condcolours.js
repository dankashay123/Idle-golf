/* The day's conditions beside the cog each in a colour of its own, of what
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
    if (fails.length) throw new Error(fails.join('\n'));
    return [r.names.length + ' conditions, ' + r.names.length + ' colours; two at once in two; the day\'s line ' + r.gap + 'px under the name, header ' + r.head + 'px'];
  }
};
