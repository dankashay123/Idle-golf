/* A shot's number over his head (found going over the graphics): the course's
 * lettering is all capitals, so "3.88Oc" read "3.880C", another number.
 *
 *   - a number's suffix is lettered small, with a sliver of room before it:
 *     every small letter has a drawing of its own, eight rows like the rest,
 *     and none is its capital's
 *   - the number over his head is written that way; a number with no suffix
 *     is as it was
 *   - nothing else lettered on the course changes: words are capitals still */
'use strict';
module.exports = {
  name: 'suffix',
  async run(page) {
    const r = await page.evaluate(() => {
      const fl = [], f = m => fl.push(m), o = {}, keep = drawTextS, nums = Scene.nums;
      try {
        hideSheet();
        const low = ch => String.fromCharCode(0xE000 + ch.charCodeAt(0));
        for (const ch of 'abcdefghijklmnopqrstuvwxyz') {
          const g = GLYPH_S[low(ch)];
          if (!g || g.length !== FHS || g.some(row => row.length !== g[0].length)) { f('no small "' + ch + '" of ' + FHS + ' even rows'); continue; }
          if (g.join('') === GLYPH_S[ch.toUpperCase()].join('')) f('the small "' + ch + '" is its capital');
          if (!g.join('').includes('#')) f('the small "' + ch + '" is blank');
        }
        if (lowS('3.88Oc') !== '3.88O' + low('c')) f('3.88Oc is written ' + JSON.stringify(lowS('3.88Oc')));
        if (lowS('1.14ad') !== '1.14' + low('a') + low('d')) f('1.14ad is written ' + JSON.stringify(lowS('1.14ad')));
        if (lowS('12.5') !== '12.5' || lowS('*6') !== '*6') f('a number with no suffix changed: ' + JSON.stringify(lowS('12.5')));
        // drawn: unlike the capitals, and wider by the room before the suffix
        const px = str => { const cv = textCv(String(str).toUpperCase(), '#FFFFFF', 1, true); return cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data.join(','); };
        if (px(lowS('3.88Oc')) === px('3.88OC')) f('3.88Oc is drawn as 3.88OC');
        o.w = textW(lowS('3.88Oc'), 1) - textW('3.88OC', 1);
        if (!(o.w >= 1)) f('no room before the suffix (' + o.w + 'px)');
        if (px('Lovely') !== px('LOVELY')) f('words are no longer capitals');
        // the number over his head
        const said = [];
        drawTextS = function (c, str) { said.push(String(str)); return keep.apply(this, arguments); };
        Scene.nums = [{ v: 3.88e27, x: 0, y: 0, t: 0.1, crit: 1 }, { v: 42, x: 6, y: 0, t: 0.1 }];
        Scene.draw(0, derive());
        o.said = said.filter(x => /3\.88|42/.test(x));
        if (!o.said.includes('*' + lowS(fmt(3.88e27)))) f('the number over his head was written ' + JSON.stringify(o.said));
        if (!o.said.includes('42')) f('a plain 42 was written ' + JSON.stringify(o.said));
        o.fmt = fmt(3.88e27);
      } finally { drawTextS = keep; Scene.nums = nums; }
      return { fl, o };
    });
    if (r.fl.length) throw new Error(r.fl.join('; '));
    return ['a shot of ' + r.o.fmt + ' over his head with its suffix in small letters, ' + r.o.w + 'px wider for the room before it; 26 small letters, none its capital; words still capitals'];
  }
};
