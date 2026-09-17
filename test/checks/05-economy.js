/* The affinity cap holds on both channels. Affinity feeds damage AND gold, and
 * the cap was once applied to only one of them, so a stacked build multiplied
 * prize money without limit.
 *
 * Both are measured by swinging, so both are estimates. Damage lands exactly on
 * ELEM_CAP. Gold settles a little ABOVE 1 + cap -- verdant is gold-only, so it
 * has no damage component to divide by and the baseline is not a clean
 * comparison; measured, it converges to about 25.5 against a cap of 24. The
 * bound here is therefore generous on purpose. It is not trying to pin the
 * number, it is trying to catch the cap coming off, and uncapped was orders of
 * magnitude, not a few percent.
 *
 * Also the cup target. A cup is meant to be the same distance away however
 * strong you are, and it hardened by a flat nine shots a cup and then stopped
 * dead at -260. That floor is inside what a maxed shot book can card, so past
 * about nineteen cups a card that beat the number once beat it forever, and
 * cups feed legacy at 1.16 a cup. It now closes on a perfect card by a share
 * of what is left, so it is always harder and never arrives. */
'use strict';
module.exports = {
  name: 'economy',
  async run(page) {
    const r = await page.evaluate(() => {
      const rows = [];
      for (const el of ['verdant', 'ember', 'frost', 'storm', 'void']) {
        Object.keys(S).forEach(k => delete S[k]);
        Object.assign(S, defaultState());
        initState(); migrate(); startNine(); startHole();
        S.equip.ball = { uid: 1, slot: 'ball', rar: 5, ilvl: 0, enh: 0, aff: [], el };
        S.relic.oath = 20;            // as much affinity as the game can be given
        S.courseEl = el;              // and resonating on top of it
        const D = derive();
        const HUGE = D.pow * 1e6, PURSE = 1000, N = 8000;   // 2000 was too noisy to assert on
        let gold = 0, dmg = 0;
        for (let i = 0; i < N; i++) {
          S.yardsMax = HUGE; S.yards = HUGE; S.purse = PURSE; S.armor = 0;
          S.burn = 0; S.burnT = 0; S.frost = 0;
          const g0 = S.gold;
          oneSwing(D, false);
          gold += S.gold - g0; dmg += HUGE - S.yards;
        }
        const base = (dmg / N / HUGE) * PURSE * B.SWING_SHARE;
        rows.push({ el, dmgMult: +D.elemDmg.toFixed(2),
                    goldMult: +(gold / N / base).toFixed(2) });
      }
      // the cup target, walked out further than anyone will ever get
      const cups = [];
      const keep = S.cups;
      for(let c = 0; c <= 400; c++){ S.cups = c; cups.push(eventTarget()); }
      S.cups = keep;
      return { cap: B.ELEM_CAP, rows, voidShare: B.VOID_MAX_SHARE,
               cups, perfect: B.ROUND * B.DAYS * B.SCORE[0].d,
               holes: B.ROUND * B.DAYS, base: B.TARGET_BASE };
    });
    const dmgMax  = r.cap + 1.5;              // damage lands on the cap exactly
    const goldMax = (r.cap + 1) * 1.5;        // gold is an estimate; see above
    for (const row of r.rows) {
      if (row.dmgMult > dmgMax)
        throw new Error(row.el + ' damage affinity reached ' + row.dmgMult + ', cap is ' + r.cap);
      if (row.goldMult > goldMax)
        throw new Error(row.el + ' GOLD affinity reached ' + row.goldMult
          + ', which is past ' + goldMax.toFixed(0) + ' on a cap of ' + r.cap);
    }
    if (!(r.voidShare > 0 && r.voidShare <= 0.35))
      throw new Error('void share per proc is ' + r.voidShare + ', which is not a cap');
    // every cup is harder than the one before, and the number stays inside
    // what a card can physically be
    for (let c = 1; c < r.cups.length; c++) {
      // A plateau is only allowed at a card of nothing but Aces, which is the
      // one number no card can beat. Anywhere short of that, a target that has
      // stopped moving is a card that beats it once beating it forever.
      if (!(r.cups[c] < r.cups[c - 1]) && r.cups[c] > r.perfect)
        throw new Error('cup ' + c + ' asks for ' + r.cups[c] + ', no harder than cup '
          + (c - 1) + ' at ' + r.cups[c - 1] + ', and ' + (r.cups[c] - r.perfect).toFixed(1)
          + ' short of a perfect card. A target that has stopped moving is one a card '
          + 'beats forever.');
      if (r.cups[c] < r.perfect)
        throw new Error('cup ' + c + ' asks for ' + r.cups[c] + ', past the ' + r.perfect
          + ' of an Ace on all ' + r.holes + ' holes.');
    }
    if (r.cups[0] !== r.base)
      throw new Error('the first cup asks for ' + r.cups[0] + ', not TARGET_BASE ' + r.base);

    const worstD = Math.max.apply(null, r.rows.map(x => x.dmgMult));
    const worstG = Math.max.apply(null, r.rows.map(x => x.goldMult));
    return ['cup target ' + r.cups[0].toFixed(0) + ' -> ' + r.cups[20].toFixed(0)
            + ' -> ' + r.cups[400].toFixed(1)
            + ', harder every cup, never past ' + r.perfect,
            'cap ' + r.cap + '; worst damage ' + worstD + ' of ' + dmgMax
            + ', worst gold ' + worstG + ' of ' + goldMax.toFixed(0)
            + ', void share ' + r.voidShare];
  }
};
