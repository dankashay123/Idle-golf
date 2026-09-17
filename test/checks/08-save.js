/* A save written by an older build still loads. migrate() is the only thing
 * standing between a format change and somebody's progress, so it gets a save
 * with junk in it, fields that no longer exist, and fields that never did. */
'use strict';
module.exports = {
  name: 'save',
  async run(page) {
    const r = await page.evaluate(() => {
      // something worth losing
      QUIET = true; DEV.gold(500); DEV.upg(6); DEV.set(3); DEV.skills(); QUIET = false; hideSheet();
      const gold = S.gold, lv = S.lv, upg = S.upg.drive, bag = S.bag.length;
      save();
      const raw = JSON.parse(localStorage.getItem(Object.keys(localStorage)
        .find(k => /mulligan|golf|mm/i.test(k)) || ''));
      if (!raw) return { skip: 'could not find the save key' };

      // rough it up the way an older build would have left it
      raw.upg.aRungThatWasRemoved = 40;
      raw.relic.aTrophyThatWasRemoved = 3;
      raw.equip.driver.aff = [{ k: 'notAnAffixAnyMore', roll: 0.5 }, { k: 'mst', roll: 0.4 }];
      raw.equip.irons.el = 'notAnElement';
      raw.equip.wedge.rar = undefined;
      raw.bag.push({ uid: 999, slot: 'ball', rar: 99, ilvl: -3, enh: 'x', aff: null });
      delete raw.tal;                                   // a field a later build added

      const key = Object.keys(localStorage).find(k => /mulligan|golf|mm/i.test(k));
      localStorage.setItem(key, JSON.stringify(raw));
      Object.keys(S).forEach(k => delete S[k]);
      Object.assign(S, defaultState());
      load(); initState(); migrate();
      const D = derive();
      return {
        gold, lv, upg, bag,
        after: { gold: S.gold, lv: S.lv, upg: S.upg.drive, bag: S.bag.length,
                 carry: D.dps, ghostRung: S.upg.aRungThatWasRemoved,
                 ghostTrophy: S.relic.aTrophyThatWasRemoved,
                 badAffix: (S.equip.driver.aff || []).some(a => a.k === 'notAnAffixAnyMore'),
                 badElem: S.equip.irons.el }
      };
    });
    if (r.skip) throw new Error(r.skip);
    const a = r.after;
    if (!(a.gold > 0) || a.lv !== r.lv) throw new Error('progress did not survive the load');
    if (a.upg !== r.upg) throw new Error('an upgrade level changed over the load: ' + r.upg + ' -> ' + a.upg);
    if (!isFinite(a.carry) || a.carry <= 0) throw new Error('carry came back as ' + a.carry);
    if (a.ghostRung !== undefined) throw new Error('a removed upgrade survived migrate()');
    if (a.ghostTrophy !== undefined) throw new Error('a removed trophy survived migrate()');
    if (a.badAffix) throw new Error('an affix that no longer exists survived migrate()');
    if (a.badElem === 'notAnElement') throw new Error('a bad element survived migrate()');
    return ['a roughed-up save loads clean, carry ' + Math.round(a.carry)];
  }
};
