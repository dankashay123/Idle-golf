/* The Bag tab, reworked (the user asked, with a picture of the look).
 *
 *   - it opens on its clubs: the Gear sub tab first, the slot bar, then the
 *     clubs, with nothing about sets over them; the set and affinity rows
 *     and what you hold to spend have a sub tab of their own, Sets &
 *     Affinities
 *   - the clubs are tiles, two to a row: each framed in its rarity's colour,
 *     its name in that colour, its item level and rarity, and its numbers
 *     (the swing or affinity it gives, and an affix); the one carried
 *     first and marked Equipped; a better one marked with an arrow
 *   - the sub tabs and the slot bar stay at the top of the panel however far
 *     the clubs are scrolled, and a slot can be changed from there
 *   - a tap on a club opens it with Equip, Upgrade and Scrap together:
 *     Upgrade reforges it a level (spending grit) and the tile then shows
 *     it, Scrap pays its shards and takes it out, Equip carries it; the one
 *     carried cannot be equipped again or scrapped
 */
'use strict';
module.exports = {
  name: 'bag',
  async run(page) {
    await page.setViewportSize({ width: 390, height: 844 });
    const r = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, mr = Math.random;
      const f = m => o.fails.push(m);
      const sleep = ms => new Promise(res => setTimeout(res, ms));
      try {
        hideSheet(); QUIET = true;
        S.bag = []; S.equip = {}; S.grit = 1e9; S.shard = 1000;
        for (let i = 0; i < 16; i++) S.bag.push(makeItem(20 + i * 2, 0, i % 6, 'driver'));
        S.equip.driver = makeItem(30, 0, 2, 'driver');
        S.bag.push(makeItem(20, 0, 3, 'ball'));
        // (the menu pulled up, so the panel has room to scroll)
        $('app').classList.add('big'); window.dispatchEvent(new Event('resize'));
        bagSub = 'gear'; setView('bag'); S.bagSlot = 'driver'; renderBag(); await sleep(150);

        // ---- opens on the clubs ----
        o.sub = bagSub;
        const vis = id => { const e = $(id); return !!e && !e.hidden && !!e.offsetParent; };
        if (!vis('bagGear') || !vis('bagList')) f('the Bag tab did not open on its clubs');
        if (vis('setBox') || vis('purseStrip')) f('the set rows or the purse are shown over the clubs');
        const navs = [...$('bagNav').querySelectorAll('.sub')].map(b => b.textContent);
        o.navs = navs.join('/');
        if (navs[0] !== 'Gear' || !navs.includes('Sets & Affinities')) f('the sub tabs read ' + o.navs);
        // the clubs come before anything else below the slot bar
        const order = [...$('bagGear').children].map(e => e.id).filter(Boolean);
        if (order[0] !== 'bagGrid' || order.indexOf('bagList') > 2) f('the gear tab is laid out ' + order.join(', '));

        // ---- the sets have their own sub tab ----
        bagSub = 'sets'; renderBagNav(); renderBag();
        if (!vis('setBox') || !vis('purseStrip') || vis('bagList')) f('Sets & Affinities does not show the set rows and the purse alone');
        o.setRows = $('setBox').children.length;
        bagSub = 'gear'; renderBagNav(); renderBag(); await sleep(50);

        // ---- tiles, two to a row ----
        const tiles = [...$('bagList').querySelectorAll('.gt')];
        o.tiles = tiles.length;
        if (tiles.length !== 17) f(tiles.length + ' tiles for 16 spare drivers and the one carried');
        const rects = tiles.map(t => t.getBoundingClientRect());
        const rows = {}; rects.forEach(b => { const k = Math.round(b.top); rows[k] = (rows[k] || 0) + 1; });
        const perRow = Object.values(rows);
        if (perRow.some(n => n > 2) || perRow.slice(0, -1).some(n => n !== 2)) f('tiles per row: ' + perRow.join(','));
        if (Math.abs(rects[0].width - rects[1].width) > 1) f('the two tiles of a row differ in width');
        if (!tiles[0].classList.contains('worn') || !/Equipped/.test(tiles[0].textContent)) f('the carried driver is not first and marked Equipped');
        for (const t of tiles) {
          const it = findItem(+t.dataset.uid), col = RC(it.rar).toLowerCase();
          const cs = getComputedStyle(t), nm = t.querySelector('.gn');
          const hex = c => '#' + (c.match(/\d+/g) || []).slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join('');
          if (hex(cs.borderLeftColor) !== col) { f(it.name + ': its tile is not framed in its rarity\'s colour (' + cs.borderLeftColor + ')'); break; }
          if (!nm || nm.textContent !== it.name || hex(getComputedStyle(nm).color) !== col) { f(it.name + ': its name is not shown in its rarity\'s colour'); break; }
          if (t.textContent.indexOf('iLv ' + it.ilvl) < 0 || t.textContent.indexOf(B.RARITY[it.rar].n) < 0) { f(it.name + ': no item level or rarity on its tile'); break; }
          if (!/×\S+ (swing|affinity)/.test(t.textContent)) { f(it.name + ': no swing or affinity figure on its tile'); break; }
          const better = itemScore(it) > itemScore(S.equip.driver);
          if (!t.classList.contains('worn') && better !== !!t.querySelector('.gup')) { f(it.name + ': the better-than arrow is ' + (better ? 'missing' : 'on a worse club')); break; }
        }

        // ---- the nav and the slot bar stay at the top ----
        const P = $('panel');
        P.scrollTop = 0; await sleep(30);
        const top0 = P.getBoundingClientRect().top;
        P.scrollTop = P.scrollHeight; await sleep(60);
        o.scrolled = P.scrollTop;
        const nb = $('bagNav').getBoundingClientRect(), gb = $('bagGrid').getBoundingClientRect();
        o.stick = [Math.round(nb.top - top0), Math.round(gb.top - nb.bottom)];
        if (!(o.scrolled > 100)) f('the panel only scrolled ' + o.scrolled + 'px, so the bar was not tried');
        if (Math.abs(nb.top - top0) > 1 || Math.abs(gb.top - nb.bottom) > 1) f('scrolled down, the sub tabs sat ' + o.stick[0] + 'px from the top and the slot bar ' + o.stick[1] + 'px under them');
        // and a slot changed from there
        const ballTile = $('bagGrid').children[B.SLOTS.findIndex(x => x.id === 'ball')];
        ballTile.click(); await sleep(30);
        if (S.bagSlot !== 'ball' || ![...$('bagList').querySelectorAll('.gt')].every(t => findItem(+t.dataset.uid).slot === 'ball')) f('the slot bar, scrolled down, did not change the slot');
        S.bagSlot = 'driver'; renderBag(); P.scrollTop = 0;

        // ---- a tap: equip, upgrade, scrap ----
        const tile = uid => $('bagList').querySelector('.gt[data-uid="' + uid + '"]');
        const spare = S.bag.find(x => x.slot === 'driver' && x.enh === 0);
        QUIET = false; hideSheet(); tile(spare.uid).click(); await sleep(30);
        const btn = t => [...document.querySelectorAll('#sheet .acts3 .act')].find(b => b.textContent.indexOf(t) === 0);
        if (!btn('Equip') || !btn('Upgrade') || !btn('Scrap')) { f('a spare club\'s sheet lacks Equip, Upgrade or Scrap: ' + [...document.querySelectorAll('#sheet .act')].map(b => b.textContent).join(' | ')); return o; }
        Math.random = () => 0;                         // the reforge takes
        const g0 = S.grit; btn('Upgrade').click(); Math.random = mr;
        if (spare.enh !== 1 || !(S.grit < g0)) f('Upgrade did not raise it a level for grit (+' + spare.enh + ')');
        const enhTag = tile(spare.uid) && tile(spare.uid).querySelector('.genh');
        if (!enhTag || enhTag.textContent !== '+1') f('the tile does not show the upgrade');
        // the result is said on the sheet itself (a toast is behind its veil)
        const said = () => { const e = document.querySelector('#sheet .enhres'); return e ? e.className + ': ' + e.textContent : ''; };
        if (said() !== 'enhres ok: Upgraded to +1') f('the sheet did not say the upgrade took: "' + said() + '"');
        spare.enh = B.ENH_SAFE + 2; itemSheet(spare, false); Math.random = () => 0.9999;
        btn('Upgrade').click(); Math.random = mr;
        if (spare.enh !== B.ENH_SAFE + 2 || said() !== 'enhres no: Upgrade failed \u00b7 still +' + spare.enh) f('the sheet did not say the upgrade failed: "' + said() + '"');
        itemSheet(spare, false);
        if (said()) f('the upgrade\'s result stayed on the sheet when it was opened again');
        spare.enh = 1; renderBag(); itemSheet(spare, false);
        const sh0 = S.shard, val = scrapValue(spare);
        btn('Scrap').click();
        if (S.bag.includes(spare) || S.shard !== sh0 + val || tile(spare.uid)) f('Scrap did not take it out for its shards');
        const next = S.bag.find(x => x.slot === 'driver');
        tile(next.uid).click(); btn('Equip').click();
        if (S.equip.driver !== next || !tile(next.uid).classList.contains('worn')) f('Equip did not carry it');
        tile(next.uid).click();
        const e2 = btn('Equipped'), s2 = btn('Scrap');
        if (!e2 || !e2.disabled || !s2 || !s2.disabled) f('the carried club can still be equipped or scrapped from its sheet');
        hideSheet();
      } finally {
        Math.random = mr;
        try { hideSheet(); } catch (e) {}
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; bagSub = 'gear'; $('app').classList.remove('big'); window.dispatchEvent(new Event('resize')); renderBag();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['opens on Gear (' + r.navs + '), the clubs first; the sets and the purse on their own sub tab (' + r.setRows + ' rows)',
      r.tiles + ' tiles two to a row, framed and named in their rarity\'s colours, level, rarity and numbers on each, the carried one first',
      'scrolled ' + r.scrolled + 'px, the sub tabs and slot bar held at the top, and the slot changed from there',
      'a tap: Upgrade a level for grit (the tile shows it), Scrap for shards, Equip; not on the one carried'];
  }
};
