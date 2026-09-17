/* The pro shop.
 *
 * It is a storefront with no store behind it: every pack grants on the press
 * and nothing is charged. The first three checks are about keeping it that
 * way, because a half-wired payment surface is worse than none at all. The
 * shop must say so on its own face, it must never ask for anything that looks
 * like payment details, and a pack must grant without taking.
 *
 * The rest is the shop working: a bag has to honour the rarity it advertises
 * and the pity counter it advertises, a permanent upgrade has to stop at ten
 * and has to be read somewhere outside its own table, and the currency has to
 * stay premium -- if the game pays sovereigns out anywhere else, the shop is
 * not the only way to get them and the prices mean nothing.
 */
'use strict';
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'shop',
  async run(page) {
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');

    // 1. the button is on the stage, bottom left, and opens the shop
    const btn = await page.$('#shopBtn');
    if (!btn) throw new Error('there is no shop button on the stage');
    const box = await btn.boundingBox();
    const stage = await (await page.$('#stage')).boundingBox();
    const cx = box.x + box.width/2, cy = box.y + box.height/2;
    if (!(cx < stage.x + stage.width*0.35))
      throw new Error('the shop button is not on the left of the stage');
    if (!(cy > stage.y + stage.height*0.6))
      throw new Error('the shop button is not near the bottom of the stage');
    await btn.click();
    if (!await page.$('#sheet .shopnav'))
      throw new Error('pressing the shop button did not open the shop');

    const r = await page.evaluate(() => {
      const out = {};

      // 2. nothing in the shop asks for payment details, on any tab
      out.inputs = [];
      out.banner = {};
      for (const sub of ['offers', 'buy', 'bags', 'perm']) {
        openShop(sub);
        const sheet = document.getElementById('sheet');
        out.inputs = out.inputs.concat(
          [...sheet.querySelectorAll('input,form,iframe,[type=password]')].map(e => sub + ':' + e.tagName));
        out.banner[sub] = !!sheet.querySelector('.freebar');
      }

      // 3. a pack grants and takes nothing
      S.sov = 0; S.gold = 12345; S.sovSpent = 0;
      const goldBefore = S.gold;
      buyPack(B.SOV_PACKS[3]);
      out.pack = { got: S.sov, want: B.SOV_PACKS[3].c, goldMoved: S.gold !== goldBefore,
                   spent: S.sovSpent };

      // and the ladder is a ladder: every pack is better value than the last
      const rate = p => p.c / p.usd;
      out.rates = B.SOV_PACKS.map(rate);

      // 4. bags honour what they advertise
      S.bag = []; S.tier = 15; S.pity = 0;
      const worst = {}, best = {}, counts = {};
      for (const bg of B.BAGS) {
        worst[bg.id] = 99; best[bg.id] = -1; counts[bg.id] = 0;
        for (let n = 0; n < 40; n++) {
          S.sov = bg.c; S.bag = [];
          openBag(bg);
          try { hideSheet(); } catch (e) {}
          counts[bg.id] = S.bag.length;
          let hi = -1;
          for (const it of S.bag) {
            worst[bg.id] = Math.min(worst[bg.id], it.rar);
            hi = Math.max(hi, it.rar);
          }
          best[bg.id] = best[bg.id] < 0 ? hi : Math.min(best[bg.id], hi);
        }
      }
      out.bags = B.BAGS.map(bg => ({ id: bg.id, num: bg.num, got: counts[bg.id],
        floor: bg.floor, worst: worst[bg.id], top: bg.top, leastBest: best[bg.id] }));

      // 5. pity: open nothing but the cheapest bag and a Mythic has to turn up
      //    inside the advertised count
      S.pity = 0; S.bag = [];
      const top = B.RARITY.length - 1;
      let sawAt = -1;
      for (let n = 1; n <= B.BAG_PITY; n++) {
        S.sov = B.BAGS[0].c; S.bag = [];
        openBag(B.BAGS[0]);
        try { hideSheet(); } catch (e) {}
        if (S.bag.some(it => it.rar >= top)) { sawAt = n; break; }
      }
      out.pity = { sawAt, promised: B.BAG_PITY };

      // 6. the bench stops at ten
      S.perm = {}; S.sov = 1e9;
      const u = B.PERM[0];
      for (let i = 0; i < B.PERM_MAX + 6; i++) buyPerm(u);
      out.capped = permLv(u.id);
      out.max = B.PERM_MAX;
      out.permKeys = B.PERM.map(x => x.id);
      return out;
    });

    if (r.inputs.length)
      throw new Error('the shop renders ' + r.inputs.join(', ') + '. Nothing here takes a '
        + 'payment, so nothing here should look like it is about to.');
    for (const sub in r.banner)
      if (!r.banner[sub])
        throw new Error('the ' + sub + ' tab does not say that nothing is charged');

    if (r.pack.got !== r.pack.want)
      throw new Error('a pack granted ' + r.pack.got + ' of ' + r.pack.want);
    if (r.pack.goldMoved || r.pack.spent)
      throw new Error('a pack took something: gold moved ' + r.pack.goldMoved
        + ', sovereigns spent ' + r.pack.spent);
    for (let i = 1; i < r.rates.length; i++)
      if (!(r.rates[i] > r.rates[i-1]))
        throw new Error('pack ' + i + ' is worse value than the one below it ('
          + r.rates[i].toFixed(1) + ' against ' + r.rates[i-1].toFixed(1)
          + ' per dollar). The ladder is the whole point of a ladder.');

    for (const b of r.bags) {
      if (b.got !== b.num)
        throw new Error(b.id + ' promised ' + b.num + ' clubs and handed over ' + b.got);
      if (b.worst < b.floor)
        throw new Error(b.id + ' promised nothing worse than rarity ' + b.floor
          + ' and produced ' + b.worst);
      if (b.leastBest < b.top)
        throw new Error(b.id + ' promised its best club would reach rarity ' + b.top
          + ', and one opening topped out at ' + b.leastBest);
    }
    if (r.pity.sawAt < 0)
      throw new Error('the shop promises a Mythic within ' + r.pity.promised
        + ' bags and ' + r.pity.promised + ' produced none');

    if (r.capped !== r.max)
      throw new Error('a bench line bought past its cap: ' + r.capped + ' of ' + r.max);

    // 7. every bench line is read somewhere outside its own table
    const unwired = r.permKeys.filter(id =>
      !new RegExp("perm(?:Add|Mult|Lv)\\('" + id + "'\\)").test(src));
    if (unwired.length)
      throw new Error('bench line' + (unwired.length > 1 ? 's ' : ' ') + unwired.join(', ')
        + (unwired.length > 1 ? ' are' : ' is') + ' sold and never read. Ten levels of '
        + 'nothing is the worst thing a shop can sell.');

    // 8. and the currency stays premium: every line that ADDS to the balance has
    //    to live inside the shop. Anywhere else and the shop is no longer the
    //    only way to get one, which is the assumption every price here rests on.
    const lines = src.split('\n');
    const shopFrom = lines.findIndex(l => /THE PRO SHOP$/.test(l.trim()));
    const shopTo = lines.findIndex((l, i) => i > shopFrom && /RETIREMENT$/.test(l.trim()));
    if (shopFrom < 0 || shopTo < 0)
      throw new Error('cannot find the shop section in index.html to bound this check');
    const adds = lines
      .map((l, i) => [i + 1, l])
      .filter(([, l]) => /\bS\.sov\s*(\+=|=[^=])/.test(l) && !/S\.sov\s*=\s*0\b/.test(l))
      .filter(([n]) => n < shopFrom + 1 || n > shopTo + 1);
    if (adds.length)
      throw new Error('sovereigns are handed out outside the shop, at index.html:'
        + adds.map(([n]) => n).join(', ') + '. A premium currency the game pays out '
        + 'anywhere else is not premium, and every price in the shop is quoted against '
        + 'the assumption that it is.');

    return ['button bottom left, four tabs, no input of any kind, banner on all four',
      'packs ' + r.rates.map(x => x.toFixed(0)).join('/') + ' per dollar, rising',
      r.bags.map(b => b.id + ' ' + b.got + ' clubs >=' + b.worst).join(', '),
      'pity paid at ' + r.pity.sawAt + ' of ' + r.pity.promised
      + ', bench caps at ' + r.capped + ', all ' + r.permKeys.length + ' wired',
      'nothing pays sovereigns outside the shop'];
  }
};
