/* Three the user asked for from the menu together:
 *
 *   - the gallery jumps and waves on an eagle or better, for a second and a
 *     half, and not on a birdie
 *   - frost on the grandstand's and the clubhouse's roofs on a frosty
 *     morning, as on the grass, and none on another day
 *   - the Record in the Trophy Room in three folds (Career, Right Now,
 *     Courses), the career open, each opening and shutting on a tap, every
 *     row still there
 */
'use strict';
module.exports = {
  name: 'extras',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [] }, keep = window.step;
      const f = m => o.fails.push(m);
      try {
        hideSheet(); QUIET = false; window.step = () => {};
        const c = Scene.b, D = derive();
        S.hole = 3; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === 'Fair')); startHole(); Scene.announce = null;
        Scene.camD = LEN - 10; Scene.walkTo = Scene.camD; Scene.draw(0, D);
        const gal = Scene.props.filter(p => p.kind === 1 && Math.abs(p.d - LEN) < 13);
        const pic = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); const was = Scene.props; Scene.props = gal; Scene.drawProps(); Scene.props = was; return c.getImageData(0, 0, VW, VH).data; };
        const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++; return n; };
        Scene.t = 20; Scene.galleryUp = null; const still = pic();
        Scene.happyDance(-1); o.birdie = !!Scene.galleryUp;
        Scene.galleryUp = null; Scene.happyDance(-2); o.eagle = !!Scene.galleryUp;
        Scene.t = Scene.galleryUp.t0 + 0.2; const up = pic();
        Scene.t = Scene.galleryUp.t0 + GALLERY_UP + 0.05; const after = pic();
        Scene.galleryUp = null; Scene.t = 20; const back = pic();
        // (and it stops at the next hole: it cheered on over the next tee)
        Scene.happyDance(-3); Scene.newHole(S.hole + 1, S.tier); o.nextHole = Scene.galleryUp;
        if (o.nextHole) f('the gallery was still cheering on the next hole');
        S.hole = 3; startHole(); Scene.announce = null; Scene.camD = LEN - 10; Scene.walkTo = Scene.camD; Scene.draw(0, D); Scene.t = 20;
        o.gal = [diff(up, still), gal.length].join('/');
        if (o.birdie) f('the gallery jumped on a birdie');
        if (!o.eagle || !(diff(up, still) > 100)) f('the gallery did not jump and wave on an eagle (' + o.gal + ')');
        Scene.t = 20; if (diff(back, still)) f('the gallery was not as it was without the moment');
        Scene.fairyMove = null; Scene.fairyQueue = [];
        // frost on the roofs
        const pale = (cv, hex) => { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data, v = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16)); let n = 0;
          for (let i = 0; i < d.length; i += 4) if (d[i] === v[0] && d[i + 1] === v[1] && d[i + 2] === v[2]) n++; return n; };
        o.frost = [pale(standCv(20, 1, false, 5, 0, true), '#E6F0F4'), pale(standCv(20, 1, false, 5, 0, false), '#E6F0F4'),
                   pale(clubhouseCv(20, false, 1, 5, false, true), '#EEF6FA'), pale(clubhouseCv(20, false, 1, 5, false, false), '#EEF6FA')].join('/');
        const [sf, sn, cf, cn] = o.frost.split('/').map(Number);
        if (!(sf > 20) || sn || !(cf > 20) || cn) f('frost on the roofs, frosted/not: stand ' + sf + '/' + sn + ', clubhouse ' + cf + '/' + cn);
        // and on the course, on a frosty morning's last hole
        FROST_FORCE = 1; const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
        S.hole = first + B.ROUND - 1; startHole(); Scene.announce = null; Scene.camD = LEN - 8; Scene.walkTo = Scene.camD; Scene.draw(0, D);
        const st = Scene.props.find(p => p.kind === 10);
        c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); { const was = Scene.props; Scene.props = [st]; Scene.drawProps(); Scene.props = was; }
        const d = c.getImageData(0, 0, VW, VH).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] === 0xE6 && d[i + 1] === 0xF0 && d[i + 2] === 0xF4) n++;
        o.onCourse = n; FROST_FORCE = null;
        if (!Scene.frost || !(n > 3)) f('on a frosty morning the stand\'s roof showed ' + n + ' pixels of frost (frost ' + Scene.frost + ')');
        // the Record in folds
        trophyRoom('case');
        const folds = () => [...document.querySelectorAll('#statRows .rfold')];
        const shown = () => folds().map(e => e.classList.contains('open') ? 1 : 0).join('');
        o.folds = folds().map(e => e.querySelector('.rfh span').textContent).join('/');
        o.open0 = shown();
        o.rows = document.querySelectorAll('#statRows .lb').length;
        o.visible = [...document.querySelectorAll('#statRows .lb')].filter(e => e.offsetParent).length;
        folds()[1].querySelector('.rfh').click(); o.open1 = shown();
        folds()[1].querySelector('.rfh').click(); folds()[0].querySelector('.rfh').click(); o.open2 = shown();
        folds()[0].querySelector('.rfh').click();
        hideSheet();
        if (o.folds !== 'Career/Right Now/Courses' || o.open0 !== '100' || o.open1 !== '110' || o.open2 !== '000')
          f('the Record\'s folds: ' + o.folds + ', open ' + o.open0 + ' then ' + o.open1 + ' then ' + o.open2);
        if (o.rows !== 16 || o.visible !== 7) f('the Record holds ' + o.rows + ' rows, ' + o.visible + ' shown (want 16, the career\'s 7)');
      } finally {
        window.step = keep; FROST_FORCE = null; Scene.galleryUp = null; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
        try { hideSheet(); } catch (e) {}
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return ['the gallery jumps and waves on an eagle, ' + r.gal.split('/')[0] + ' pixels changed across ' + r.gal.split('/')[1] + ' of them, not on a birdie, and is back after 1.5s',
      'frost on the roofs (stand/clubhouse ' + r.frost + ', ' + r.onCourse + ' on a frosty morning\'s stand); the Record in folds ' + r.folds + ', ' + r.rows + ' rows, the career open'];
  }
};
