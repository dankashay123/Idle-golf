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

    // ---- coming back from another tab or app ---------------------------
    // The browser stops the frame loop while the page is out of sight, and the
    // first frame back clamps its step to a quarter of a second. So ten minutes
    // in another app was worth 0.25s of golf, and the away card only turned up
    // if the phone happened to throw the page away and reload it.
    const tab = await page.evaluate(() => {
      try { hideSheet(); } catch (e) {}
      const vis = hidden => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
        document.dispatchEvent(new Event('visibilitychange'));
      };
      let played = 0, caught = 0;
      const realStep = window.step, realOff = window.offline;
      window.step = function (dt, D) { played += dt; return realStep.call(this, dt, D); };
      window.offline = function () { caught++; return realOff.apply(this, arguments); };
      const out = {};
      try {
        // hiding stamps the clock, so the return has something to measure from
        S.t = 0; vis(true); out.stamped = Math.abs(S.t - Date.now()/1000) < 2;

        // half a minute away: played out at full pace, no card raised
        S.t = Date.now()/1000 - 30; played = 0; caught = 0;
        vis(false);
        // a sheet is up when the veil is; the sheet keeps its last page underneath
        const up = () => document.getElementById('veil').classList.contains('on');
        out.short = { played, caught, sheet: up() && /while you were away/i.test(
          document.getElementById('sheet').textContent) };

        // two hours away: the same away card a reload would have raised
        try { hideSheet(); } catch (e) {}
        const holes0 = S.totalHoles;
        S.t = Date.now()/1000 - 2*3600; played = 0; caught = 0;
        vis(false);
        out.long = { caught, holes: S.totalHoles - holes0,
                     sheet: document.getElementById('veil').classList.contains('on')
                            && /while you were away/i.test(document.getElementById('sheet').textContent) };
        try { hideSheet(); } catch (e) {}

        // and straight back again: nothing left to claim, so nothing is paid twice
        const holes1 = S.totalHoles, gold1 = S.gold; played = 0; caught = 0;
        vis(false);
        out.again = { played, caught, holes: S.totalHoles - holes1, gold: S.gold - gold1 };
      } finally {
        window.step = realStep; window.offline = realOff;
        delete document.hidden;
      }
      return out;
    });
    if (!tab.stamped)
      throw new Error('hiding the page did not stamp the save clock, so a return has nothing '
        + 'to measure from');
    if (Math.abs(tab.short.played - 30) > 0.5)
      throw new Error('thirty seconds in another tab played ' + tab.short.played.toFixed(2)
        + 's of golf on the way back. The frame loop stops while the page is hidden and '
        + 'the first frame back clamps to a quarter second, so anything not caught up here '
        + 'is simply lost.');
    if (tab.short.caught || tab.short.sheet)
      throw new Error('half a minute away raised the away card, which is not worth a sheet');
    if (tab.long.caught !== 1 || !tab.long.sheet || !(tab.long.holes > 0))
      throw new Error('two hours in another tab came back with ' + tab.long.holes + ' holes '
        + 'played and ' + (tab.long.sheet ? 'an' : 'no') + ' away card. A reload credits '
        + 'that time; a return has to credit it the same way.');
    if (tab.again.played > 0.5 || tab.again.holes || tab.again.gold > 0)
      throw new Error('a second return straight after the first paid again: '
        + tab.again.played.toFixed(2) + 's played, ' + tab.again.holes + ' holes, '
        + tab.again.gold + ' purse. Claiming the time has to move the clock.');

    return ['a roughed-up save loads clean, carry ' + Math.round(a.carry),
      'back from another tab: 30s played out at full pace (' + tab.short.played.toFixed(2)
      + 's), 2h raised the away card (' + tab.long.holes + ' holes), and a second return '
      + 'straight after paid nothing',
      owed + ' points off retired talents came back unspent, ' + a.keptTalent
      + ' left where they were'];
  }
};
