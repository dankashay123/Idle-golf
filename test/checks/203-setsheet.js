/* A club's sets on its sheet (the user asked for them as a game shows its
 * sets, with a picture: the set's name and pieces, what is worn and what is
 * not, and its bonuses):
 *
 *   - a named set's piece: the set's name with how many are worn, "(2/6)";
 *     its six pieces, the worn ones lit and only those, one in the locker
 *     said so; its bonuses at each count, only the one in effect lit (only
 *     the highest reached counts) and a lower one reached shown passed
 *   - each rarity set the club counts toward, with its count and its slots
 *     worn at that rarity lit
 *   - a plain club in no set shows none
 *   - at 320 nothing past the screen */
'use strict';
module.exports = {
  name: 'setsheet',
  async run(page) {
    await page.setViewportSize({ width: 320, height: 640 });
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), tw = window.toast, o = {};
      try {
        hideSheet(); window.toast = () => {}; QUIET = true;
        S.bag = []; S.equip = {};
        const mk = (slot, rar, set) => { const it = makeItem(10, 0, rar, slot); it.rar = rar; it.set = set || null; return it; };
        S.equip.driver = mk('driver', 2, 'heritage'); S.equip.irons = mk('irons', 2, 'heritage'); S.equip.putter = mk('putter', 2, 'heritage');
        S.equip.ball = mk('ball', 0); S.equip.glove = mk('glove', 0);
        const w = mk('wedge', 2, 'heritage'), gl = mk('glove', 2, 'heritage'), plain = mk('wedge', 0); S.bag.push(w, gl, plain);
        QUIET = false; itemSheet(w, false);
        const sh = document.getElementById('sheet'), boxes = [...sh.querySelectorAll('.setbox')];
        o.heads = boxes.map(b => b.querySelector('.sbh').textContent);
        o.lit = [...sh.querySelectorAll('.setbox .sbp li.on')].map(e => e.textContent);
        o.locker = [...sh.querySelectorAll('.setbox .sbp li')].filter(e => /in your locker/.test(e.textContent)).map(e => e.textContent.replace(/ ·.*/, ''));
        o.tiers = [...boxes[0].querySelectorAll('.sbt')].map(e => e.className.replace('sbt', '').trim() || 'off');
        o.chips = boxes[1] ? [...boxes[1].querySelectorAll('.sbchips span.on')].map(e => e.textContent) : null;
        o.off = [...sh.querySelectorAll('.setbox, .setbox *')].filter(e => e.getBoundingClientRect().right > innerWidth + 0.5).length;
        hideSheet(); itemSheet(plain, false); o.plain = document.querySelectorAll('#sheet .setbox').length; hideSheet();
      } finally { window.toast = tw; QUIET = false; Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); hideSheet(); renderBag(); }
      return o;
    });
    const fl = [], f = m => fl.push(m);
    if (r.heads[0] !== 'Old Course Heritage (3/6)') f('the set\'s name and count read "' + r.heads[0] + '"');
    if (r.lit.join() !== 'Heritage Driver,Heritage Irons,Heritage Putter') f('the pieces lit: ' + r.lit.join(', '));
    if (r.locker.join() !== 'Heritage Wedge,Heritage Glove') f('the pieces said to be in the locker: ' + r.locker.join(', '));
    if (r.tiers.join() !== 'on,off,off') f('the bonuses read ' + r.tiers.join(', ') + ' with three worn');
    if (r.heads[1] !== 'Matched Set (3/6)' || (r.chips || []).join() !== 'Driver,Irons,Putter') f('the rarity set read ' + r.heads[1] + ', its slots ' + (r.chips || []).join(', '));
    if (r.plain) f('a plain club in no set shows ' + r.plain + ' set panels');
    if (r.off) f(r.off + ' parts of the set panels past the screen at 320');
    if (fl.length) throw new Error(fl.join('; '));
    return ['a set piece\'s sheet: "' + r.heads[0] + '", the worn pieces lit, two said in the locker, the bonus in effect lit; the rarity set it counts toward with its slots; none on a plain club; whole at 320'];
  }
};
