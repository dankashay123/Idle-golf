/* The ball on the hole map (the user saw it vanish as the golfer set off):
 * a ball in the air shows as a white pixel, and once it lies out there it
 * stays on the map until he walks up to it; then it goes.
 */
'use strict';
module.exports = {
  name: 'mapball',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = {}, keep = window.step;
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        S.hole = 2; startHole(); Scene.announce = null;
        const D = derive(); Scene.camD = 2; Scene.walkTo = 2; Scene.balls = []; Scene.draw(0, D);
        const cv = document.getElementById('holeMap');
        if (!Scene.mapOn) return { off: 1 };
        const at = (d, lat) => { const [x, y] = Scene.mapXY(d, lat); return [Math.round(x), Math.round(y)]; };
        const white = (x, y) => { const px = cv.getContext('2d').getImageData(x, y, 1, 1).data; return px[0] === 255 && px[1] === 255 && px[2] === 255; };
        const frame = () => { Scene._mapT = -1; Scene.t += 0.2; Scene.drawMap(); };
        Scene.restBall = { d: 30, lat: 0.4 };
        frame(); const p = at(30, 0.4); o.lying = white(p[0], p[1]);
        Scene.camD = 20; frame(); o.walking = white(p[0], p[1]);
        Scene.camD = 29.6; Scene.drawBalls(0); frame(); o.reached = !Scene.restBall && !white(p[0], p[1]);
      } finally {
        window.step = keep; Scene.restBall = null; QUIET = false;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });
    if (r.off) throw new Error('no hole map on the stage to look at');
    if (!r.lying || !r.walking) throw new Error('the ball lying out there is not on the map (' + (r.lying ? 'shown' : 'missing') + ' at first, ' + (r.walking ? 'shown' : 'missing') + ' as he walks)');
    if (!r.reached) throw new Error('the ball stayed on the map after he reached it');
    return ['the ball lying out there stays on the map as he walks, and goes when he reaches it'];
  }
};
