/* The gear sheet's locks (the user: "remove the 'lock' buttons, and replace
 * it with a lock icon that is unlocked until tapped, then it locks. make
 * sure they don't overlap"): on a club with four rolls at 320 wide and on
 * its side, every roll has a padlock, open until it is tapped and shut
 * after; no LOCK button left; each padlock clear of its roll's words
 * and of the padlocks above and below. */
'use strict';
module.exports = { name: 'gearlocks', async run(page) {
  const out = [];
  for (const [w, h] of [[320, 640], [440, 900], [760, 360]]) {
    await page.setViewportSize({ width: w, height: h });
    const r = await page.evaluate(() => {
      const fails = [], f = m => fails.push(m);
      hideSheet();
      const it = makeItem(Math.max(10, S.tier), 0, 4, 'driver'); S.bag.push(it);
      try {
        itemSheet(it, false);
        const rows = () => [...document.querySelectorAll('#sheet li.afx')];
        if (rows().length !== it.aff.length || it.aff.length < 3) f(rows().length + ' padlocks for ' + it.aff.length + ' rolls');
        if ([...document.querySelectorAll('#sheet button')].some(b => /^\s*(un)?lock\s*$/i.test(b.innerText))) f('a LOCK button still on the sheet');
        if (rows().some(li => li.querySelector('.lockb').getAttribute('aria-pressed') !== 'false')) f('a padlock shut before it was tapped');
        rows()[1].querySelector('.lockb').click();
        if (!it.aff[1].lock) f('tapping the padlock did not lock the roll');
        if (rows()[1].querySelector('.lockb').getAttribute('aria-pressed') !== 'true' || !rows()[1].classList.contains('on')) f('the padlock did not show shut');
        rows()[1].querySelector('.lockb').click();
        if (it.aff[1].lock) f('tapping it again did not unlock it');
        // clear of the words, and of each other
        const R = rows().map(li => ({ t: li.querySelector('span').getBoundingClientRect(), b: li.querySelector('.lockb').getBoundingClientRect() }));
        const hit = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
        R.forEach((x, i) => {
          if (hit(x.t, x.b)) f('roll ' + i + '\'s padlock over its words');
          if (x.b.width < 28 || x.b.height < 26) f('roll ' + i + '\'s padlock only ' + Math.round(x.b.width) + 'x' + Math.round(x.b.height));
          if (i && hit(R[i - 1].b, x.b)) f('padlocks ' + (i - 1) + ' and ' + i + ' overlap');
          const sh = document.getElementById('sheet').getBoundingClientRect(); if (x.b.right > sh.right) f('roll ' + i + '\'s padlock past the sheet');
        });
        return { fails, n: R.length };
      } finally { S.bag.splice(S.bag.indexOf(it), 1); hideSheet(); }
    });
    if (r.fails.length) throw new Error(w + 'x' + h + ': ' + r.fails.join('; '));
    out.push(w + 'x' + h + ' ' + r.n);
  }
  return ['a padlock to every roll, open until tapped, shut after and open again, clear of the words and of each other (' + out.join(', ') + ')'];
} };
