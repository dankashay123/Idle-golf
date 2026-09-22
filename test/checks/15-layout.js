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
 *
 * The stage and the vitals bar are measured at three widths, because that is
 * where the faults were. On a 320 phone the readout ran 6px out of its own box
 * -- the hole label and the clock were both nowrap with a fixed gap between
 * them -- and the toast stack, 52% wide against a readout column that runs to
 * 58.2%, sat on top of the readout by 39px. The comment over #toasts has always
 * said they sit "clear of the readout on the left and the two stage buttons
 * below"; they did not.
 *
 * One overlap is left and is deliberate: at 320 a two-toast stack can still
 * reach ten pixels into the honours button. The buttons are z-index 31 and the
 * toasts 30, so the button stays whole and a corner of a three-second toast
 * goes behind it. Buying that back would mean either a toast wide enough to
 * cover the readout again or buttons pushed into the middle of the hole.
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

    // ---- the stage and the vitals bar, at three widths ------------------
    const hud = [];
    for (const [w, h] of [[320, 568], [400, 860], [768, 1024]]) {
      await page.setViewportSize({ width: w, height: h });
      await page.waitForTimeout(200);
      hud.push(await page.evaluate(([w]) => {
        QUIET = true; DEV.tierSet(300); DEV.maxCapped(); QUIET = false;
        try { hideSheet(); } catch (e) {}
        B.SLOTS.forEach(sl => { S.equip[sl.id] = makeItem(300, 0, 5, sl.id); });
        S.hole = 18; startHole(); renderVitals(); renderLive();
        // Real toasts off the real path, not a string copied in here. The first
        // version of this hard-coded the achievement wording, so when the
        // wording was shortened to fit the check went on measuring a toast the
        // game no longer raises. checkAch() toasts for every unlock and the
        // stack keeps the last two, so this stands the tallest pair it can.
        S.achDone = {}; S.tally = {};
        S.totalHoles = 1e9; S.aces = 1e9; S.cups = 1e9; S.lv = B.LV_MAX; S.para = 1e9;
        S.bestTier = 400; S.retires = 1e9; S.perkUsed = 1e9;
        B.DGN.forEach(d => S.dgnFloor[d.id] = 999);
        for (const k of ['birdie', 'eagle', 'snow', 'runs', 'legend', 'myth', 'enh15'])
          S.tally[k] = 1e9;
        checkAch();
        const R = e => e.getBoundingClientRect();
        const st = R($('stage'));
        const o = { w, off: [], cut: [], vitals: {}, hit: [] };

        // nothing on the stage leaves the stage
        for (const e of $('stage').querySelectorAll('*')) {
          const r = R(e); if (!r.width || !r.height) continue;
          const out2 = Math.max(st.left - r.left, r.right - st.right,
                                st.top - r.top, r.bottom - st.bottom);
          if (out2 > 0.5) o.off.push((e.id || e.className || e.tagName) + ' by ' + out2.toFixed(1));
        }
        // Nothing on the HUD sits on anything else on the HUD, with the
        // tallest pair of toasts the game can raise standing. The comment over
        // #toasts has always claimed they are "clear of the readout on the left
        // and the two stage buttons below"; this is that claim, measured.
        const ids = ['readout', 'shopBtn', 'honBtn', 'perkBtn', 'toasts'];
        const box = {}; for (const i of ids) { const e = $(i); if (e) box[i] = R(e); }
        const ks = Object.keys(box);
        for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) {
          const a = box[ks[i]], c = box[ks[j]];
          const ox = Math.min(a.right, c.right) - Math.max(a.left, c.left);
          const oy = Math.min(a.bottom, c.bottom) - Math.max(a.top, c.top);
          if (ox > 0.5 && oy > 0.5)
            o.hit.push(ks[i] + ' on ' + ks[j] + ' by ' + ox.toFixed(0) + 'x' + oy.toFixed(0));
        }

        // text that runs out of its box with nothing to catch it
        for (const e of $('stage').querySelectorAll('*')) {
          if (!e.clientWidth || e.scrollWidth - e.clientWidth <= 0.5) continue;
          if (getComputedStyle(e).textOverflow === 'ellipsis') continue;   // degrading on purpose
          // A badge pinned outside its own corner widens scrollWidth without
          // anything being wrong: the shop button's "new" dot sits at -8%.
          if ([...e.children].some(k => getComputedStyle(k).position === 'absolute')) continue;
          o.cut.push((e.id || e.className) + ' by ' + (e.scrollWidth - e.clientWidth));
        }

        // the vitals bar: five equal cells, one caption line, one value line
        const cells = [...document.querySelectorAll('#vitals .vital')];
        o.vitals = {
          n: cells.length,
          widths: [...new Set(cells.map(c => Math.round(R(c).width)))],
          capTops: [...new Set(cells.map(c => Math.round(R(c.querySelector('.k')).top)))],
          valTops: [...new Set(cells.map(c => Math.round(R(c.querySelector('.v')).top)))],
          over: cells.filter(c => [...c.children].some(x => x.scrollWidth - x.clientWidth > 0.5))
                     .map(c => c.textContent.trim())
        };
        return o;
      }, [w]));
    }
    // ---- a number and its unit stay on one line --------------------------
    // "The caddie kept the group moving at 55 per cent of your live pace" broke
    // after "55 per", leaving "cent" alone on the next line: a single unit
    // spelled as two ordinary words, so the column was free to split it. The
    // same fault turned up at 400 wide in "+1.2% swing power".
    //
    // The first version of this rule measured where lines actually fell, at a
    // handful of widths. That passes by luck: unbinding "+1.2% swing power"
    // again went unnoticed, because at none of those widths did the line happen
    // to end there. So it asks the width-independent question instead -- is
    // this pair ABLE to break -- by reading the character between the figure
    // and its unit. An ordinary space can break and a hard one cannot, at every
    // width there is, including ones no phone has yet.
    await page.setViewportSize({ width: 400, height: 900 });
    await page.waitForTimeout(150);
    const splits = await page.evaluate(() => {
      const loose = [], twoWord = [];
      const NUM = /^[+\-\u00d7x~]?[\d][\d.,]*(%|pp|x|s|h|m|K|M|B|T|Qa|Qi|Sx)?$/;
      const UNIT = new RegExp('^(per|cent|seconds?|sec|minutes?|hours?|days?|yards?|yds|'
        + 'holes?|levels?|points?|clubs?|greens?|chips?|floors?|events?|pieces?|'
        + 'sovereigns?|entry|entries|cards?|troph(y|ies)|cups?|swings?|ranks?|'
        + 'shards?|scrolls?|bags?)$', 'i');
      let looked = 0;
      const scan = () => {
        for (const m of (document.body.innerText || '').match(/[^\n]*\bper cent\b[^\n]*/gi) || [])
          twoWord.push(m.trim().slice(0, 70));
        const it = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let tn;
        while ((tn = it.nextNode())) {
          const t = tn.nodeValue;
          if (!/\S/.test(t) || !tn.parentElement || !tn.parentElement.offsetParent) continue;
          looked++;
          const re = /(\S+)([ \u00a0]+)(?=(\S+))/g; let m;
          while ((m = re.exec(t))) {
            if (!(NUM.test(m[1]) && UNIT.test(m[3]))) continue;
            if (/\u00a0/.test(m[2])) continue;          // bound: cannot break
            loose.push('"' + m[1] + ' ' + m[3] + '" in "' + t.trim().slice(0, 55) + '"');
          }
        }
      };
      try { hideSheet(); } catch (e) {}
      QUIET = true; DEV.gold(20); DEV.lv(40); DEV.tierSet(8); DEV.skills();
      DEV.keys(); DEV.relics(3); DEV.cards(2); QUIET = false;
      S.sov = 9999; S.shard = 1e7; S.legacy = 5000; S.cups = 3;
      try { hideSheet(); } catch (e) {}
      for (const v of ['upg', 'bag', 'dgn', 'tour', 'career']) { setView(v); scan(); }
      setView('bag'); bagSub = 'shots'; renderBagNav(); scan();
      bagSub = 'gear'; renderBagNav();
      setView('career');
      for (const sub of ['stat', 'tal', 'para', 'leg']) {
        const btn = [...document.querySelectorAll('#careerNav button')]
          .find(x => x.dataset.s === sub);
        if (btn) { btn.click(); scan(); }
      }
      for (const sub of ['offers', 'buy', 'bags', 'perm']) { openShop(sub); scan(); }
      try { hideSheet(); } catch (e) {}
      S.t = Date.now()/1000 - 3*3600; offline(); scan();
      try { hideSheet(); } catch (e) {}
      setView('upg');
      return { loose: [...new Set(loose)], twoWord: [...new Set(twoWord)], looked };
    });

    await page.setViewportSize({ width: 400, height: 860 });
    await page.waitForTimeout(150);

    for (const o of hud) {
      const at = ' at ' + o.w + ' wide';
      if (o.off.length)
        throw new Error(o.off.length + ' thing(s) hang off the stage' + at + ': '
          + o.off.join('; '));
      if (o.hit.length)
        throw new Error('the stage HUD overlaps itself' + at + ': ' + o.hit.join('; ')
          + '. The readout is what you are reading and the two buttons are what you press; '
          + 'a toast is gone in three seconds and should not be over either.');
      if (o.cut.length)
        throw new Error('text runs out of its box with no ellipsis to catch it' + at + ': '
          + o.cut.join('; '));
      if (o.vitals.n !== 5)
        throw new Error('the vitals bar has ' + o.vitals.n + ' cells' + at);
      if (o.vitals.widths.length > 1)
        throw new Error('the five vitals cells are ' + o.vitals.widths.join('/') + 'px wide' + at
          + ', so the bar is not five equal columns');
      if (o.vitals.capTops.length > 1 || o.vitals.valTops.length > 1)
        throw new Error('the vitals captions sit on ' + o.vitals.capTops.length
          + ' lines and the values on ' + o.vitals.valTops.length + at);
      if (o.vitals.over.length)
        throw new Error('a vitals cell cannot hold its own number' + at + ': '
          + o.vitals.over.join(', '));
    }

    if (!(r.looked > 400))
      throw new Error('the sweep only measured ' + r.looked + ' boxes, so it is not reaching '
        + 'the screens it thinks it is');
    if (r.over.length) {
      const worst = r.over.slice().sort((a, b) => b.over - a.over).slice(0, 5);
      throw new Error(r.over.length + ' element(s) stick out past the edge they are inside, '
        + 'worst first: ' + worst.map(x => x.at + ' by ' + x.over + 'px').join('; ')
        + '. On a phone that is a button with its label cut in half.');
    }

    if (!(splits.looked > 400))
      throw new Error('the wrapping sweep only read ' + splits.looked + ' pieces of text, so it '
        + 'is not reaching the screens it thinks it is');
    if (splits.twoWord.length)
      throw new Error('a unit is spelled as two ordinary words, so the column is free to break '
        + 'it in half wherever the line happens to end: ' + splits.twoWord.slice(0, 3).join('; ')
        + '. Write it "%" -- one token has nowhere to break.');
    if (splits.loose.length)
      throw new Error(splits.loose.length + ' figure(s) can be left on a different line from the '
        + 'unit they carry: ' + splits.loose.slice(0, 4).join('; ')
        + '. A figure and the thing it measures are one idea -- pass the line through nb(), or '
        + 'put a hard space between them.');

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
      'away card: three tiles, captions on one line, all three centred',
      'stage and vitals at 320/400/768: nothing off the stage, no HUD element on another '
      + 'with the tallest toasts up, five equal cells holding a maxed golfer\'s numbers',
      splits.looked + ' pieces of text read across every screen and sub-tab: no two-word unit '
      + 'anywhere, and every figure bound to the unit it carries'];
  }
};
