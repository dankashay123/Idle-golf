/* The game boots, plays itself for a while, survives every tab, and runs a
 * Depths contest end to end without throwing. If this fails nothing else
 * below it means anything. */
'use strict';
module.exports = {
  name: 'smoke',
  async run(page) {
    await page.waitForTimeout(6000);          // let the sim actually run
    const mid = await page.evaluate(() => ({
      hole: S.hole, gold: S.gold, holes: S.totalHoles, lv: S.lv,
      carry: derive().dps, scored: S.scores.filter(Boolean).length
    }));
    if (!(mid.gold > 0)) throw new Error('no purse earned in six seconds');
    if (!(mid.carry > 0)) throw new Error('carry is zero');

    for (const v of ['upg', 'bag', 'skl', 'dgn', 'tour', 'career', 'leg']) {
      await page.evaluate(x => setView(x), v);
      await page.waitForTimeout(120);
    }
    await page.evaluate(() => { setView('dgn'); startDgn(B.DGN[0]); });
    await page.waitForTimeout(1200);
    if (!await page.evaluate(() => !!S.dgnRun)) throw new Error('a Depths run would not start');
    await page.waitForTimeout(17000);
    if (await page.evaluate(() => !!S.dgnRun)) throw new Error('the Depths run never finished');

    return ['purse ' + Math.round(mid.gold) + ', carry ' + Math.round(mid.carry)
            + ', ' + mid.scored + ' holes carded'];
  }
};
