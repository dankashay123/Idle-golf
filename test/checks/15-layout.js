/* Nothing sticks out past the edge it is inside, and the stat tiles line up.
 *
 * Two real ones behind this. A club with a long name pushed the locker row's
 * middle column to 231px where only 222 was free -- a grid item will not shrink
 * below its own min-content unless it is told it may -- so the row overran its
 * own right padding and squeezed the button until the word UPGRADE was cut in
 * half. And the away card's three tiles were flowed from the top with one of
 * them in a bigger face, so the big one set the row height and the other two
 * sat above their own middles with the three captions on three different lines.
 *
 * Both are invisible to every other check in here: the numbers are right, the
 * rows are all present, nothing throws. You have to measure the boxes.
 */
'use strict';

module.exports = {
  name: 'layout',
  async run(page) {
    const r = await page.evaluate(() => {
      const out = { over: [], looked: 0 };
      QUIET = true; DEV.gold(400); DEV.skills(); DEV.keys(); DEV.tierSet(12);
      DEV.relics(2); DEV.ach(); QUIET = false;
      try { hideSheet(); } catch (e) {}
      S.sov = 99999; for (let i = 0; i < 3; i++) openBag(B.BAGS[1]);
      try { hideSheet(); } catch (e) {}
      S.talPts = 20; S.statPts = 20; S.para = 8; S.paraPts = { core: 8 };

      const where = e => { const a = []; let n = e;
        while (n && n !== document.body) {
          a.unshift(n.tagName.toLowerCase() + (n.id ? '#' + n.id : '')
            + (typeof n.className === 'string' && n.className.trim()
               ? '.' + n.className.trim().split(/\s+/).join('.') : ''));
          n = n.parentElement; }
        return a.slice(-3).join(' > '); };

      // Anything inside the panel or a sheet has to stay inside it. Absolutely
      // positioned things are skipped: a badge hanging off a corner is doing it
      // on purpose, and so is anything its parent clips.
      const sweep = (rootId, tag) => {
        const root = document.getElementById(rootId);
        if (!root) return;
        const rb = root.getBoundingClientRect();
        if (!rb.width) return;
        for (const e of root.querySelectorAll('*')) {
          const b = e.getBoundingClientRect();
          if (!b.width || !b.height) continue;
          const cs = getComputedStyle(e);
          if (cs.position === 'absolute' || cs.position === 'fixed') continue;
          let clipped = false;
          // Ancestors BETWEEN the element and the root only. The root itself
          // scrolls -- #panel is overflow-y:auto, which computes overflow-x to
          // auto as well -- so including it marked every box on every screen as
          // deliberately clipped and the sweep measured nothing at all.
          for (let n = e.parentElement; n && n !== root; n = n.parentElement)
            if (/hidden|auto|scroll/.test(getComputedStyle(n).overflowX)) { clipped = true; break; }
          if (clipped) continue;
          out.looked++;
          const over = b.right - rb.right;
          if (over > 0.5) out.over.push({ at: tag + ' ' + where(e), over: +over.toFixed(1) });
        }
      };

      for (const v of ['upg', 'bag', 'dgn', 'tour', 'career']) { setView(v); sweep('panel', v); }
      setView('bag'); bagSub = 'shots'; renderBag(); renderSkillsTab(); sweep('panel', 'shots');
      bagSub = 'gear'; renderBag();
      for (const sub of ['stats', 'tal', 'para', 'leg']) {
        careerSub = sub; setView('career'); renderCareer(); sweep('panel', 'career/' + sub);
      }
      for (const sub of ['offers', 'buy', 'bags', 'perm']) { openShop(sub); sweep('sheet', 'shop/' + sub); }
      try { hideSheet(); } catch (e) {}
      honoursSheet(); sweep('sheet', 'honours'); try { hideSheet(); } catch (e) {}
      perksSheet(); sweep('sheet', 'perks'); try { hideSheet(); } catch (e) {}
      if (S.bag[0]) { itemSheet(S.bag[0], false); sweep('sheet', 'item'); try { hideSheet(); } catch (e) {} }

      // the away card's three tiles: captions on one line, content centred
      S.bag = []; S.t = Date.now()/1000 - 8*3600;
      QUIET = true; offline(); QUIET = false;
      const tiles = [...document.querySelectorAll('#sheet .awst')];
      out.tiles = tiles.length;
      out.capTops = tiles.map(t => +t.querySelector('.awk').getBoundingClientRect().top.toFixed(1));
      out.offCentre = tiles.map(t => {
        const b = t.getBoundingClientRect();
        const v = t.querySelector('.awv').getBoundingClientRect();
        const k = t.querySelector('.awk').getBoundingClientRect();
        return +(((v.top + k.bottom) / 2) - ((b.top + b.bottom) / 2)).toFixed(1);
      });
      try { hideSheet(); } catch (e) {}
      setView('upg');
      return out;
    });

    if (!(r.looked > 400))
      throw new Error('the sweep only measured ' + r.looked + ' boxes, so it is not reaching '
        + 'the screens it thinks it is');
    if (r.over.length) {
      const worst = r.over.slice().sort((a, b) => b.over - a.over).slice(0, 5);
      throw new Error(r.over.length + ' element(s) stick out past the edge they are inside, '
        + 'worst first: ' + worst.map(x => x.at + ' by ' + x.over + 'px').join('; ')
        + '. On a phone that is a button with its label cut in half.');
    }

    if (r.tiles !== 3) throw new Error('the away card has ' + r.tiles + ' tiles, expected 3');
    if (new Set(r.capTops).size !== 1)
      throw new Error('the away card captions sit on ' + new Set(r.capTops).size
        + ' different lines (' + r.capTops.join(', ') + '). One of the three is in a bigger '
        + 'face, so left to flow from the top it sets the row height and the other two sit '
        + 'above their own middles.');
    for (const d of r.offCentre)
      if (Math.abs(d) > 0.6)
        throw new Error('an away tile\'s content sits ' + d + 'px off the middle of its box');

    return [r.looked + ' boxes measured across five screens, four shop tabs and three sheets, '
      + 'none past its edge',
      'away card: three tiles, captions on one line, all three centred'];
  }
};
