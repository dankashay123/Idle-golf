/* The clubhouse by the last green (the user asked, from the menu: "a
 * clubhouse near the 18th green with a terrace, beside the grandstand").
 *
 *   - beside the grandstand on every last hole that has one, to one side of
 *     it and clear of it; on no other hole
 *   - nothing stands inside it: no tree, spectator or scenery in its
 *     footprint (they were laid there before it)
 *   - nothing through a hill: alone over a blank from eight places down each
 *     home course's 18th; and in view from near the green
 *   - its windows lit at night and not by day, and no far-off clubhouse on
 *     the hills that night as well (every other night hole has that one)
 *   - never over the pin; none in a wager
 */
'use strict';
module.exports = {
  name: 'clubhouse',
  async run(page) {
    const r = await page.evaluate(() => {
      const SNAP = JSON.stringify(S), o = { fails: [], lasts: 0, views: 0, pix: 0, pin: 0 }, keep = window.step;
      const f = m => { if (o.fails.length < 14) o.fails.push(m); };
      try {
        hideSheet(); QUIET = true; window.step = () => {};
        S.outfit = 'classic'; S.caddie = 'classic'; buildSprites(); FROST_FORCE = 0;
        const D = derive(), c = Scene.b;
        const blank = () => { c.fillStyle = '#010203'; c.fillRect(0, 0, VW, VH); };
        const px = () => c.getImageData(0, 0, VW, VH).data;
        const drawn = props => { const was = Scene.props; blank(); Scene.props = props; Scene.drawProps(); Scene.props = was;
          const d = px(); let n = 0; for (let i = 0; i < d.length; i += 4) if (!(d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3)) n++; return { n, d }; };
        const count = (d, hex) => { const v = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16)); let n = 0;
          for (let i = 0; i < d.length; i += 4) if (d[i] === v[0] && d[i + 1] === v[1] && d[i + 2] === v[2]) n++; return n; };
        const play = (hh, night) => { S.hole = hh; S.chaos = Object.assign({}, B.CHAOS.find(x => x.n === (night ? 'Night Round' : 'Fair')));
          Scene.newHole(S.hole, S.tier); Scene.announce = null; Scene.rain = false; return Scene.props; };
        for (let ci = 0; ci < B.COURSE.length; ci++) {
          const cs = B.COURSE[ci];
          DEV.course(ci); hideSheet();
          const t = tournamentOf(S.hole), first = (t - 1) * B.ROUND * B.DAYS + 1;
          for (let day = 0; day < B.DAYS; day++) for (const hh of [first + day * B.ROUND + B.ROUND - 1, first + day * B.ROUND + 3]) {
            const P = play(hh), st = P.filter(p => p.kind === 10), ch = P.filter(p => p.kind === 11), where = cs.id + ' day ' + (day + 1) + ' hole ' + holeInRound(hh);
            if (!st.length) { if (ch.length) f(where + ': a clubhouse with no grandstand'); continue; }
            o.lasts++;
            if (ch.length !== 1) { f(where + ': ' + ch.length + ' clubhouses beside the grandstand'); continue; }
            const C = ch[0];
            if (Math.abs(C.x) < STAND_W / 2 + CLUB_W / 2 || Math.abs(C.d - st[0].d) > 3) f(where + ': the clubhouse not beside the grandstand (' + C.d.toFixed(1) + ', ' + C.x.toFixed(1) + ')');
            const inside = P.filter(q => [0, 1, 8].includes(q.kind) && Math.abs(q.x - C.x) < CLUB_W / 2 && q.d > C.d - 0.5 && q.d < C.d + 3);
            if (inside.length) f(where + ': ' + inside.length + ' things standing inside the clubhouse');
          }
          if (cs.slot !== 'home') continue;
          const P = play(first + B.ROUND - 1), C = P.find(p => p.kind === 11);
          if (!C) continue;
          const where = cs.id + ' hole 18';
          for (let k = 0; k < 8; k++) {
            Scene.camD = LEN * k / 8; Scene.walkTo = 0; Scene.t = 1 + k;
            Scene.draw(0, D); o.views++;
            const lim = Scene.clipAt(C.d) + 1, { n, d } = drawn([C]);
            o.pix += n;
            if (k === 7 && n < 80) f(where + ': the clubhouse shows only ' + n + ' pixels from near the green');
            for (let y = Math.max(0, Math.floor(lim) + 1); y < VH; y++) for (let x = 0; x < VW; x++) {
              const i = (y * VW + x) * 4;
              if (d[i] === 1 && d[i + 1] === 2 && d[i + 2] === 3) continue;
              f(where + ', camera at ' + Scene.camD.toFixed(1) + ': the clubhouse shows at row ' + y + ', under the line ' + Math.round(lim)); y = VH; break;
            }
          }
          // never over the pin
          for (const at of [LEN * 0.5, LEN - 12, LEN - 6]) {
            Scene.camD = at; Scene.walkTo = at; Scene.draw(0, D);
            blank(); Scene.drawFlagstick(); const m = px();
            const was = Scene.props; Scene.draw(0, D); const a = px();
            Scene.props = was.filter(p => p.kind !== 11); Scene.draw(0, D); const b = px(); Scene.props = was;
            for (let i = 0; i < m.length; i += 4) {
              if (m[i] === 1 && m[i + 1] === 2 && m[i + 2] === 3) continue;
              o.pin++;
              if (a[i] !== b[i] || a[i + 1] !== b[i + 1] || a[i + 2] !== b[i + 2]) { f(where + ': the clubhouse over the pin'); break; }
            }
          }
          if (!o.lit) {
            // by day and at night: its windows, and the far-off one on the hills
            Scene.camD = LEN - 8; Scene.draw(0, D);
            const dayLit = count(drawn([C]).d, '#FFD36A');
            play(first + B.ROUND - 1, true); Scene.camD = LEN - 8; Scene.walkTo = Scene.camD; Scene.draw(0, D);
            const C2 = Scene.props.find(p => p.kind === 11), nightLit = count(drawn([C2]).d, '#FFD36A');
            o.lit = dayLit + '/' + nightLit;
            if (dayLit || nightLit < 3) f('the clubhouse windows lit by day or dark at night (' + o.lit + ')');
            const farKept = Scene.clubhouse; let far = 0; Scene.clubhouse = function () { far++; return farKept.apply(this, arguments); };
            Scene.ridgeKey = null; Scene.buildRidge(); Scene.clubhouse = farKept;
            if (far) f('the far-off clubhouse on the hills as well, on the night of the last hole');
            // (and it is there on another night hole)
            play(first + 3, true); far = 0; Scene.clubhouse = function () { far++; return farKept.apply(this, arguments); };
            Scene.ridgeKey = null; Scene.buildRidge(); Scene.clubhouse = farKept;
            if (!far) f('the far-off clubhouse is gone from the other night holes');
            play(first + B.ROUND - 1);
            S.dgnRun = { id: 'x' }; const w = drawn([Scene.props.find(p => p.kind === 11)]).n; delete S.dgnRun;
            if (w) f('the clubhouse drawn in a wager (' + w + ' pixels)');
          }
        }
        if (o.pin < 30) f('the pin was only ' + o.pin + ' pixels over the checks');
      } finally {
        window.step = keep; FROST_FORCE = null; delete S.dgnRun;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP));
        QUIET = false; buildSprites(); startHole();
      }
      return o;
    });
    if (r.fails.length) throw new Error(r.fails.join('; '));
    return [r.lasts + ' last holes with a grandstand, each with the clubhouse beside it and nothing standing inside it; none on other holes',
      r.views + ' views down the home courses\' 18th, ' + r.pix + ' pixels of clubhouse, none under the ground\'s line; ' + r.pin + ' pixels of pin, none changed; lit windows day/night ' + r.lit + ', the far one on the hills only on other nights; none in a wager'];
  }
};
