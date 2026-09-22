/* A save written by an older build still loads. migrate() is the only thing
 * standing between a format change and somebody's progress, so it gets a save
 * with junk in it, fields that no longer exist, and fields that never did.
 *
 * And what it does with points spent on something that is gone. Ten talents
 * stopped being a flat percentage of a Range stat and became conditions on the
 * course, under new ids; a save from before that carries levels in ten ids the
 * table no longer has. Deleting them silently is how a save loses a career to
 * a balance patch, so they come back as unspent points and the screen says so,
 * the same way the paragon rebuild handed its points back. */
'use strict';
module.exports = {
  name: 'save',
  async run(page) {
    const r = await page.evaluate(() => {
      // something worth losing
      QUIET = true; DEV.gold(500); DEV.upg(6); DEV.set(3); DEV.skills(); QUIET = false; hideSheet();
      const gold = S.gold, lv = S.lv, upg = S.upg.drive, bag = S.bag.length;
      save();
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!raw) return { skip: 'nothing under ' + KEY };

      // rough it up the way an older build would have left it
      raw.upg.aRungThatWasRemoved = 40;
      raw.relic.aTrophyThatWasRemoved = 3;
      raw.equip.driver.aff = [{ k: 'notAnAffixAnyMore', roll: 0.5 }, { k: 'mst', roll: 0.4 }];
      raw.equip.irons.el = 'notAnElement';
      raw.equip.wedge.rar = undefined;
      raw.bag.push({ uid: 999, slot: 'ball', rar: 99, ilvl: -3, enh: 'x', aff: null });

      // the ten flat-stat talents as an older build wrote them, plus one that
      // never existed at all, and one that is still in the table
      const OLD = { persimmon: 5, loaded: 5, compress: 5, hands: 5, contact: 5,
                    infuse: 5, through: 5, endorse: 5, eye: 5, lantern: 5 };
      raw.tal = Object.assign({ aTalentThatNeverWas: 3, bane: 2 }, OLD);
      raw.talPts = 0;
      raw.talRefund = 0;
      const oldSpent = Object.keys(raw.tal).reduce((n, k) => n + raw.tal[k], 0);

      localStorage.setItem(KEY, JSON.stringify(raw));
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
                 badElem: S.equip.irons.el,
                 talPts: S.talPts, talRefund: S.talRefund,
                 keptTalent: S.tal.bane,
                 ghostTalent: S.tal.persimmon,
                 talKeys: Object.keys(S.tal).filter(k => S.tal[k] > 0) },
        treeIds: [].concat.apply([], B.TREES.map(t => t.t.map(x => x.id))),
        oldSpent, oldKept: raw.tal.bane
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

    if (a.ghostTalent !== undefined)
      throw new Error('a talent the tree no longer has survived migrate()');
    if (a.keptTalent !== r.oldKept)
      throw new Error('a talent that is still in the tree came back as ' + a.keptTalent
        + ' instead of ' + r.oldKept);
    const owed = r.oldSpent - r.oldKept;
    if (a.talPts !== owed)
      throw new Error(owed + ' points were spent on lines this build no longer has and '
        + a.talPts + ' came back. Points spent on a line that was removed belong to the '
        + 'player, not to the line.');
    if (a.talRefund !== owed)
      throw new Error('the refund counter says ' + a.talRefund + ' of ' + owed
        + ', so the screen will not tell anyone their points came back');
    for (const k of a.talKeys)
      if (r.treeIds.indexOf(k) < 0)
        throw new Error('S.tal still carries "' + k + '", which is in no tree');

    return ['a roughed-up save loads clean, carry ' + Math.round(a.carry),
      owed + ' points off retired talents came back unspent, ' + a.keptTalent
      + ' left where they were'];
  }
};
