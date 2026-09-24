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

    // 1. the button is on the stage, under the readout on the left, no bigger
    //    than the other stage buttons, and it opens the shop; the Trophy Room
    //    under it, and auto-climb beside the readout
    const btn = await page.$('#shopBtn');
    if (!btn) throw new Error('there is no shop button on the stage');
    const box = await btn.boundingBox();
    const stage = await (await page.$('#stage')).boundingBox();
    const read = await (await page.$('#readout')).boundingBox();
    const room = await (await page.$('#roomBtn')).boundingBox();
    const cx = box.x + box.width/2;
    if (!(cx < stage.x + stage.width*0.35))
      throw new Error('the shop button is not on the left of the stage');
    // It lives in a column with the readout, which is built out of fixed pixel
    // type: about 45px tall whatever the screen, which is 14 per cent of a
    // short stage and 9 per cent of a tall one. So the check is that it is
    // under the readout and clear of it, not that it is at some percentage.
    // The settings gear sits between the two, so the shop is measured from the
    // bottom of whichever is directly above it.
    const gear = await (await page.$('#setBtn')).boundingBox();
    if (!(gear.y >= read.y + read.height && gear.y - (read.y + read.height) < stage.height * 0.06))
      throw new Error('the settings button is not directly under the readout');
    const above = gear.y + gear.height;
    if (!(box.y >= above))
      throw new Error('the shop button overlaps the settings button above it: it starts at '
        + box.y.toFixed(0) + ' and that ends at ' + above.toFixed(0));
    if (!(box.y - above < stage.height * 0.06))
      throw new Error('the shop button is ' + (box.y - above).toFixed(0)
        + 'px below the settings button, which is not underneath it');
    if (!(box.x < read.x + read.width))
      throw new Error('the shop button is not under the readout horizontally');
    if (!(box.width <= room.width * 1.05))
      throw new Error('the shop button is ' + box.width.toFixed(0) + 'px against '
        + room.width.toFixed(0) + 'px for the Trophy Room button: it is the loudest thing '
        + 'on the stage and it is the one asking for money');
    // The Trophy Room is the next button down the same column, under the shop,
    // and it is not drawn as a trophy (the user asked for that: the heirlooms
    // and the cabinet keep the trophy).
    if (!(room.y >= box.y + box.height && room.y - (box.y + box.height) < stage.height * 0.06
          && Math.abs(room.x - box.x) < 1))
      throw new Error('the Trophy Room button is not directly under the shop button: shop at '
        + box.x.toFixed(0) + ',' + box.y.toFixed(0) + ', room at ' + room.x.toFixed(0) + ',' + room.y.toFixed(0));
    const roomIc = await page.evaluate(() => {
      const src = document.getElementById('roomIcon').src;
      return Object.keys(B.PX12).filter(k => pixUrl(k, '#E3B457') === src);
    });
    if (roomIc.join() !== 'medal') throw new Error('the Trophy Room button draws ' + (roomIc.join() || 'nothing known') + ', not the medal');
    // Auto-climb sits to the right of the readout, level with its foot, and
    // stays put however the words in the readout change: the readout's width
    // used to follow its words, which change every second.
    const climb = async () => (await (await page.$('#hudClimb')).boundingBox());
    const cb = await climb();
    if (!(cb.x >= read.x + read.width - 0.5 && cb.x - (read.x + read.width) < 12))
      throw new Error('the auto-climb button is not just right of the readout: readout ends at '
        + (read.x + read.width).toFixed(1) + ', the button starts at ' + cb.x.toFixed(1));
    if (Math.abs((cb.y + cb.height) - (read.y + read.height)) > 0.75)
      throw new Error('the auto-climb button\'s foot is at ' + (cb.y + cb.height).toFixed(1)
        + ' and the readout\'s at ' + (read.y + read.height).toFixed(1));
    const moved = [];
    // the longest the readout says, on the course, walking in, and in a wager
    for (const [tag, big, unit, top] of [['Albatross', '999.9bw', 'yds', 'Hole 18 \u00b7 Par 5'],
        ['Albatross', '\u2014', 'walking in', 'Hole 18 \u00b7 Par 5'], ['Running hot', '1.23Qa', 'left', 'Floor 188 \u00b7 1,204 banked'],
        ['Par', '1', 'yds', 'Hole 1 \u00b7 Par 3']]) {
      await page.evaluate(([tag, big, unit, top]) => {
        for (const [id, t] of [['rTag', tag], ['rBig', big], ['rUnit', unit], ['rTop', top]]) document.getElementById(id).textContent = t;
      }, [tag, big, unit, top]);
      const c2 = await climb();
      if (Math.abs(c2.x - cb.x) > 0.5 || Math.abs(c2.y - cb.y) > 0.5) moved.push(tag + ': ' + (c2.x - cb.x).toFixed(1) + ',' + (c2.y - cb.y).toFixed(1));
    }
    // written round the change-only writers, so they are told to write again
    await page.evaluate(() => { for (const id of ['rTag', 'rBig', 'rUnit', 'rTop']) {
      const e = document.getElementById(id); e._tx = e._hx = undefined; } renderLive(); });
    if (moved.length) throw new Error('the auto-climb button moves when the readout\'s words change: ' + moved.join('; '));
    await btn.click();
    if (!await page.$('#sheet .shopnav'))
      throw new Error('pressing the shop button did not open the shop');

    const r = await page.evaluate(() => {
      const out = {};

      // 2. nothing in the shop asks for payment details, on any tab
      out.inputs = [];
      out.banner = {};
      for (const sub of ['offers', 'bags', 'perm', 'style']) {
        openShop(sub);
        const sheet = document.getElementById('sheet');
        out.inputs = out.inputs.concat(
          [...sheet.querySelectorAll('input,form,iframe,[type=password]')].map(e => sub + ':' + e.tagName));
        out.banner[sub] = !!sheet.querySelector('.freebar');
        // a shop is a rack you choose from, so every tab is tiles with a price
        // on each rather than a list you read top to bottom
        const cards = [...sheet.querySelectorAll('.card')];
        out.tiles = (out.tiles || {});
        out.tiles[sub] = { cards: cards.length,
          priced: cards.filter(c => c.querySelector('.price')).length,
          art: cards.filter(c => c.querySelector('.cart img')).length,
          rows: sheet.querySelectorAll('.shoprow').length };
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

    for (const sub in r.tiles) {
      const t = r.tiles[sub];
      if (!(t.cards > 0))
        throw new Error('the ' + sub + ' tab has no tiles on it');
      if (t.priced !== t.cards || t.art !== t.cards)
        throw new Error('the ' + sub + ' tab has ' + t.cards + ' tiles, ' + t.priced
          + ' with a price and ' + t.art + ' with art. Every tile needs both.');
      if (t.rows)
        throw new Error('the ' + sub + ' tab still draws ' + t.rows + ' list rows');
    }

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

    // 8. and the currency has exactly one source. Not "the shop is the only
    //    place", because the free rail pays for climbing a Tour Card and that
    //    happens out on the course -- but every one of those routes through
    //    grantSov, so the full list of faucets in the game is one grep long and
    //    none of them can be opened by accident.
    const lines = src.split('\n');
    const made = lines
      .map((l, i) => [i + 1, l])
      .filter(([, l]) => /\bS\.sov\s*(\+=|=[^=])/.test(l))
      .filter(([, l]) => !/S\.sov\s*(-=|=\s*0\b)/.test(l));
    if (made.length !== 1)
      throw new Error('sovereigns are created in ' + made.length + ' places (index.html:'
        + made.map(([n]) => n).join(', ') + '). There has to be exactly one, or the faucets '
        + 'stop being greppable and a premium currency stops being premium.');
    const faucets = lines.filter(l => /grantSov\(/.test(l) && !/function grantSov/.test(l)).length;

    // ---- style: looks only, paid once, repaired on load ----------------
    const st = await page.evaluate(() => {
      const o = {}; QUIET = true;
      const snap = () => { const D = derive(); return [D.dps, D.pow, D.spd, D.gold, D.crit, D.mst, D.drop].join(','); };
      try {
        S.styleOwn = {}; S.outfit = 'classic'; S.trail = 'plain'; buildSprites();
        const base = snap();
        // a stat changed by any look is a look that is not only a look
        o.moved = [];
        S.sov = 1e6;
        for (const d of B.OUTFITS) { styleBuy('o', d.id); if (snap() !== base) o.moved.push('outfit ' + d.id); }
        for (const d of B.TRAILS)  { styleBuy('t', d.id); if (snap() !== base) o.moved.push('trail ' + d.id); }
        for (const d of B.CADDIES) { styleBuy('c', d.id); if (snap() !== base) o.moved.push('caddie ' + d.id); }
        for (const d of B.CLUBS)   { styleBuy('k', d.id); if (snap() !== base) o.moved.push('club ' + d.id); }
        o.spent = 1e6 - S.sov;
        o.want = B.OUTFITS.concat(B.TRAILS, B.CADDIES, B.CLUBS).reduce((t, d) => t + d.cost, 0);
        o.clubWorn = S.club; o.clubLast = B.CLUBS[B.CLUBS.length - 1].id;
        // a caddie for every look, at a third of its price
        o.caddieMiss = B.OUTFITS.filter(x => !B.CADDIES.some(c => c.of === x.id)).map(x => x.id);
        o.caddiePrice = B.CADDIES.filter(c => c.of && Math.abs(c.cost - styleDef('o', c.of).cost / 3) > 3).map(c => c.id + ' ' + c.cost);
        // and the caddie wears it: his bib is the outfit's shirt
        styleBuy('c', 'sunday');
        o.caddieShirt = (() => { const g = SPRITE.caddie.cv.getContext('2d'), d = g.getImageData(0, 0, SPRITE.caddie.cv.width, SPRITE.caddie.cv.height).data;
          const hex = styleDef('o', 'sunday').shirt.toLowerCase(); let n = 0;
          for (let i = 0; i < d.length; i += 4) if (d[i+3] && '#' + [d[i], d[i+1], d[i+2]].map(v => v.toString(16).padStart(2, '0')).join('') === hex) n++;
          return n; })();
        // wearing one you own again costs nothing
        const s1 = S.sov; styleBuy('o', 'sunday'); styleBuy('t', 'gold'); o.again = s1 - S.sov;
        o.worn = S.outfit + '/' + S.trail;
        // the outfit reaches the golfer: his shirt is the outfit's shirt
        const px = (spr, col) => { const g = spr.cv.getContext('2d'), d = g.getImageData(0, 0, spr.cv.width, spr.cv.height).data;
          const hex = col.toLowerCase(); let n = 0;
          for (let i = 0; i < d.length; i += 4)
            if (d[i+3] && '#' + [d[i], d[i+1], d[i+2]].map(v => v.toString(16).padStart(2, '0')).join('') === hex) n++;
          return n; };
        o.shirtPx = px(SPRITE.gAddr, styleDef('o', 'sunday').shirt);
        o.classicPx = px(SPRITE.gAddr, styleDef('o', 'classic').shirt);
        // T, the shirt's darkest fold, has a colour now
        o.foldPx = px(SPRITE.gAddr, styleDef('o', 'sunday').shirt3);
        // not enough sovereigns: nothing bought, nothing worn
        S.styleOwn = {}; S.outfit = 'classic'; S.sov = 10;
        styleBuy('o', 'mythic'); o.poor = S.outfit + ' ' + S.sov + ' ' + !!S.styleOwn['o:mythic'];
        // a save wearing something it does not own, or that does not exist
        S.outfit = 'mythic'; S.trail = 'nope'; S.caddie = 'divine'; S.club = 'saber'; initState();
        o.repaired = S.outfit + '/' + S.trail + '/' + S.caddie + '/' + S.club;
      } finally { QUIET = false; S.outfit = 'classic'; S.trail = 'plain'; S.caddie = 'bib'; S.club = 'steel'; buildSprites(); hideSheet(); }
      return o;
    });
    if (st.moved.length) throw new Error('a look changed a stat: ' + st.moved.join(', '));
    if (st.spent !== st.want) throw new Error('buying every look cost ' + st.spent + ', the price list says ' + st.want);
    if (st.again) throw new Error('wearing a look already owned charged ' + st.again + ' again');
    if (st.worn !== 'sunday/gold') throw new Error('wearing an owned look did not put it on: ' + st.worn);
    if (!(st.shirtPx > 20) || st.classicPx) throw new Error('the Sunday Red outfit did not reach the golfer: '
      + st.shirtPx + ' red shirt pixels, ' + st.classicPx + ' white');
    if (!(st.foldPx > 5)) throw new Error('the shirt\'s darkest fold is still see-through: ' + st.foldPx + ' pixels');
    if (st.poor !== 'classic 10 false') throw new Error('ten sovereigns bought the Mythic outfit: ' + st.poor);
    if (st.clubWorn !== st.clubLast) throw new Error('buying a club did not put it in his hands: ' + st.clubWorn);
    if (st.repaired !== 'classic/plain/bib/steel') throw new Error('a save wearing an unowned or unknown look loaded as ' + st.repaired);
    if (st.caddieMiss.length) throw new Error('these looks have no caddie to match: ' + st.caddieMiss.join(', '));
    if (st.caddiePrice.length) throw new Error('these caddies are not a third of their look: ' + st.caddiePrice.join(', '));
    if (!(st.caddieShirt > 20)) throw new Error('the Sunday Red caddie does not wear its red: ' + st.caddieShirt + ' pixels of it');

    return ['shop and Trophy Room under the readout, auto-climb level with its foot and still; no input of any kind, banner on all four',
      'style: every outfit and trail changes no stat, each paid once (' + st.want
      + ' sovereigns for all), owned ones free to wear, a save wearing one it does not own repaired',
      'tiles ' + Object.keys(r.tiles).map(k => k + ' ' + r.tiles[k].cards).join('/'),
      'packs ' + r.rates.map(x => x.toFixed(0)).join('/') + ' per dollar, rising',
      r.bags.map(b => b.id + ' ' + b.got + ' clubs >=' + b.worst).join(', '),
      'pity paid at ' + r.pity.sawAt + ' of ' + r.pity.promised
      + ', bench caps at ' + r.capped + ', all ' + r.permKeys.length + ' wired',
      'one place makes sovereigns, ' + faucets + ' call it'];
  }
};
