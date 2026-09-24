/* The caddie: a fairy at the golfer's shoulder, and the perks he gives.
 *
 *   - the fairy never overlaps the golfer: through every phase of a swing,
 *     at address and walking, the box he is drawn in stays clear of every
 *     pixel of the golfer, club included. He was a man on the ground, who
 *     walked into bunkers, ponds and the golfer himself; the first fairy sat
 *     where the club reaches on its way up, which is further left than the
 *     top of the backswing
 *   - caddie perks: bought once with sovereigns, one worn at a time, and
 *     changing between owned ones is free; ten sovereigns buy nothing
 *   - the worn perk goes off every CPERK_EVERY seconds on the course and
 *     moves the stat it names by what it says, for as long as it says; not
 *     during a catch-up, and not with none worn
 *   - a save wearing a perk it does not own, or one that does not exist,
 *     loads with none
 *   - the Range has a Caddie rack with a row for every perk
 *   - a shot flies exactly as far as it took him down the hole -- a chip of
 *     1.5 units as much as a drive of 38 -- lies where it came down, and he
 *     sets off after it only once it is down, and walks to it. It
 *     flew a flat 14-23 units whatever it did, and he walked a step
 *   - he does not hit again until he has walked up to his last ball: the
 *     swings that come due meanwhile wait, add up, and go off when he gets
 *     there; and a swing still playing when a hole ends is dropped with the
 *     hole (it hit a ball a yard off the new tee that counted for nothing)
 *   - Lost Ball Scout's luck lasts until the next hole ends, and is spent
 *     there
 *   - he does not glide: while a swing is still going, the camera holds,
 *     however far the yardage has already moved (it chased the yardage the
 *     moment the simulation swung, and carried him on in his backswing)
 */
'use strict';
module.exports = {
  name: 'caddie',
  async run(page) {
    const r = await page.evaluate(() => {
      const o = {}; const SNAP = JSON.stringify(S);
      hideSheet(); QUIET = true;
      const D = derive();
      try {
        // ---- the fairy keeps clear of the golfer ---------------------------
        const bbox = () => { const g = Scene.b.getImageData(0, 0, VW, VH).data; let x0 = 1e9, x1 = -1, y0 = 1e9, y1 = -1;
          for (let i = 3; i < g.length; i += 4) if (g[i]) { const p = i >> 2, x = p % VW, y = (p / VW) | 0;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
          return x1 < 0 ? null : { x0, x1, y0, y1 }; };
        o.hits = []; o.poses = 0;
        const keep = SPRITE.caddie;
        const pose = (walking, ph) => {
          Scene.walkOn = walking; Scene.walkPh = 0.3;
          Scene.swingT = ph > 0 ? Scene.swingDur * (1 - ph) : 0;
          // the golfer alone, painted, then where the fairy goes beside him
          SPRITE.caddie = null; Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D);
          const g = bbox(); SPRITE.caddie = keep;
          Scene.b.clearRect(0, 0, VW, VH); Scene.drawGolfer(D);
          const f = Scene._fairy; o.poses++;
          if (g && f && f.x + f.w > g.x0 && f.x < g.x1 && f.y + f.h > g.y0 && f.y < g.y1)
            o.hits.push((walking ? 'walking' : 'swing ' + ph.toFixed(2)) + ': fairy ' + f.x + '-' + (f.x + f.w) + ', golfer from ' + g.x0);
        };
        // and hopping for a birdie or drooping at a bogey, at every point of it
        for (const outfit of ['classic', 'divine']) {
          S.styleOwn['o:' + outfit] = 1; S.outfit = outfit; buildSprites();
          for (const say of [null, 'cheer', 'sigh'])
            for (let ph = 0; ph <= 1.0001; ph += 0.02) {
              Scene.fairySay = say && { kind: say, word: 'X', t0: Scene.t - ph * 1.3, dur: 1.3 };
              pose(false, ph);
            }
          Scene.fairySay = null;
          pose(true, 0);
        }
        S.outfit = 'classic'; buildSprites(); Scene.walkOn = false; Scene.swingT = 0;

        // ---- perks: bought once, one worn, free to change ------------------
        S.cperkOwn = {}; S.cperk = null; S.sov = 10;
        cperkPick('tempo'); o.poor = S.cperk + ' ' + S.sov;
        S.sov = 1000; cperkPick('tempo'); const s1 = S.sov; cperkPick('book'); const s2 = S.sov;
        cperkPick('tempo'); o.back = S.cperk + ' ' + (s2 - S.sov) + ' ' + (1000 - s1);
        o.book = 1000 - s1 + (s1 - s2);
        o.want = B.CPERKS.find(p => p.id === 'tempo').cost + B.CPERKS.find(p => p.id === 'book').cost;

        // ---- it goes off every CPERK_EVERY seconds, and does what it says ---
        S.buff = {}; S.cperkT = 0; QUIET = false; OFFLINE = false;
        const spd0 = derive().spd;
        tickCaddie(B.CPERK_EVERY - 1); o.early = !!S.buff.cSpd;
        tickCaddie(1.5); o.fired = S.buff.cSpd ? S.buff.cSpd.v + '/' + S.buff.cSpd.t : null;
        o.spdUp = derive().spd / spd0;
        QUIET = true; S.buff = {}; S.cperkT = 0; tickCaddie(B.CPERK_EVERY * 2); o.quiet = !!S.buff.cSpd; QUIET = false;
        S.cperk = null; S.cperkT = 0; tickCaddie(B.CPERK_EVERY * 2); o.none = Object.keys(S.buff).length;
        // the newer ones: xp, pure strike power, and a second off the clock
        const fire = id => { S.cperkOwn[id] = 1; S.cperk = id; S.buff = {}; S.cperkT = B.CPERK_EVERY - 0.01; tickCaddie(0.02); };
        // a crumb of xp, so no level is gained to muddle the count
        const xpNow = () => (S.xp || 0) + (S.paraXp || 0), xp0 = xpNow();
        S.buff = {}; addXp(1e-3); const plain = xpNow() - xp0;
        fire('notes'); const xp1 = xpNow(); addXp(1e-3); o.xpUp = (xpNow() - xp1) / plain;
        S.buff = {}; const cpw0 = derive().cpw; fire('club'); o.cpwUp = derive().cpw / cpw0;
        S.elapsed = 5; fire('ready'); o.clock = +S.elapsed.toFixed(3) + ' ' + Object.keys(S.buff).length;
        S.elapsed = 0.4; fire('ready'); o.clock0 = S.elapsed;
        // once the hole is cleared he is walking in: winding the clock back then
        // only made the hole wait out its minimum again
        const y0 = S.yards; S.yards = 0; S.elapsed = 0.5; fire('ready'); o.clockWalk = S.elapsed; S.yards = y0;
        S.cperk = null;
        QUIET = true; S.buff = {};

        // ---- the fairy has his say -------------------------------------------
        QUIET = false; Scene.fairySay = null;
        const said = d => { Scene.fairySay = null; Scene.holed(scoreFor(d)); return Scene.fairySay ? Scene.fairySay.kind : 'none'; };
        o.react = [0.3, 0.55, 0.85, 1.0, 1.4, 2.2].map(r => scoreFor(r).d + ':' + said(r)).join(' ');
        QUIET = true; Scene.fairySay = null; Scene.holed(scoreFor(0.3)); o.reactQuiet = !!Scene.fairySay; QUIET = false;
        // a quip comes round on the course, and every line he has fits the font
        Scene.fairySay = null; Scene.fairyCast = null; Scene.swingT = 0; Scene.quipT = 0.01;
        Scene.tickQuip(0.05); o.quip = Scene.fairySay ? Scene.fairySay.kind + ':' + Scene.fairySay.word : null;
        Scene.fairySay = null;
        o.badLines = [];
        for (const [k, l] of Object.entries(B.FAIRY_SAY)) for (const w of l)
          if (w.length > 16 || [...w].some(ch => !GLYPH[ch])) o.badLines.push(k + ': ' + w);
        QUIET = true;

        // ---- repaired on load ------------------------------------------------
        S.cperkOwn = {}; S.cperk = 'chat'; initState(); o.unowned = S.cperk;
        S.cperkOwn = { nope: 1 }; S.cperk = 'nope'; initState(); o.unknown = S.cperk;

        // ---- the Range's Caddie rack -----------------------------------------
        QUIET = false; setView('upg'); rangeSub = 'cad'; renderRangeNav();
        o.rows = document.querySelectorAll('#cadRows .row').length;
        o.navs = [...document.querySelectorAll('#rangeNav .sub')].map(b => b.textContent).join('/');
        rangeSub = 'upg'; renderRangeNav(); QUIET = true;

        // ---- no gliding --------------------------------------------------------
        Scene.newHole(S.hole, S.tier); Scene.camD = 10;
        S.yardsMax = 1000; S.yards = 1000 * (1 - 14 / LEN);            // the sim has moved on four units
        Scene.swingT = Scene.swingDur; const c0 = Scene.camD; let moved = 0;
        while (Scene.swingT > Scene.swingDur * 0.2) { Scene.draw(0.016, D); moved = Math.max(moved, Math.abs(Scene.camD - c0)); }
        o.glide = moved;
        Scene.swingT = 0; for (let i = 0; i < 60; i++) Scene.draw(0.016, D);
        o.after = Scene.camD - c0;

        // ---- the ball goes as far as the shot, and he walks to it -----------
        o.walk = [];
        for (const [from, to] of [[10, 11.5], [10, 34], [20, 58]]) {
          Scene.newHole(S.hole, S.tier); Scene.camD = from; Scene.balls.length = 0; Scene.swingT = 0;
          S.yardsMax = 1000; S.yards = 1000 * (1 - to / LEN);
          Scene.pendingBall = { crit: false, el: null, dmg: 1 }; Scene.launch();
          const b = Scene.balls[0], land = b.d0 + b.dist;
          let rest = null, camAtLand = null;
          for (let i = 0; i < 400 && (Scene.balls.length || Scene.camD < to - 0.05); i++) {
            Scene.draw(0.016, D);
            if (!Scene.balls.length && camAtLand === null) { camAtLand = Scene.camD; rest = Scene.restBall && Scene.restBall.d; }
          }
          o.walk.push({ from, to, land: +land.toFixed(2), rest: rest && +rest.toFixed(2), camAtLand: camAtLand && +camAtLand.toFixed(2), end: +Scene.camD.toFixed(2) });
        }

        // ---- he does not hit again until he reaches his ball ------------------
        {
          Scene.newHole(S.hole, S.tier); Scene.camD = 10; Scene.balls.length = 0; Scene.swingT = 0;
          S.yardsMax = 1000; S.yards = 1000 * (1 - 30 / LEN);
          Scene.restBall = { d: 30, lat: 0 }; Scene.walkTo = 30;         // his ball lies 20 ahead
          Scene.swing(5, false, null); Scene.swing(7, false, null);
          o.held = { swinging: Scene.swingT > 0, queued: Scene.queued ? Scene.queued.dmg : 0 };
          let firedAt = null;
          for (let i = 0; i < 400 && firedAt === null; i++) { Scene.draw(0.016, D); if (Scene.swingT > 0) firedAt = Scene.camD; }
          o.held.firedAt = firedAt;
          // and a swing still going when a hole ends does not follow him onto the next tee
          Scene.swingT = Scene.swingDur * 0.7; Scene.pendingBall = { dmg: 3 }; Scene.queued = { dmg: 2 };
          Scene.newHole(S.hole, S.tier);
          o.held.carried = Scene.swingT + ' ' + !!Scene.pendingBall + ' ' + !!Scene.queued;
        }

        // ---- Lost Ball Scout: armed until the next hole ends -----------------
        S.cperkOwn = { scout: 1 }; S.cperk = 'scout'; S.buff = {}; S.cperkT = B.CPERK_EVERY - 0.1;
        QUIET = false; tickCaddie(0.5); QUIET = true;
        // forty seconds go by with no hole finished: the buff timers run down
        // the way step() runs them, and the luck is still there
        for (const k in S.buff) S.buff[k].t -= 40;
        o.scoutArmed = buffVal('cDrop') > 0;
        S.elapsed = 5; S.hole = S.hole; finishHole(derive());
        o.scoutSpent = !S.buff.cDrop;
      } finally {
        QUIET = false; OFFLINE = false; SPRITE.caddie = SPRITE.caddie || null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); buildSprites(); startHole();
      }
      o.n = B.CPERKS.length; o.every = B.CPERK_EVERY;
      return o;
    });

    if (r.hits.length) throw new Error('the fairy overlaps the golfer in ' + r.hits.length + ' of ' + r.poses + ' poses: ' + r.hits.slice(0, 3).join('; '));
    if (r.poor !== 'null 10') throw new Error('ten sovereigns bought a perk: ' + r.poor);
    if (r.book !== r.want) throw new Error('two perks and changing back cost ' + r.book + ', their prices are ' + r.want);
    if (!/^tempo 0 /.test(r.back)) throw new Error('changing back to an owned perk was not free: ' + r.back);
    if (r.early) throw new Error('the perk went off before ' + r.every + ' seconds');
    if (r.fired !== '20/8') throw new Error('Tempo Call did not give +20% tempo for 8s: ' + r.fired);
    if (!(r.spdUp > 1.15)) throw new Error('with Tempo Call live the tempo moved by x' + r.spdUp.toFixed(3));
    if (r.quiet) throw new Error('the perk went off during a catch-up');
    if (r.none) throw new Error('with no perk worn, ' + r.none + ' buffs went off');
    if (!(r.xpUp > 1.29 && r.xpUp < 1.31)) throw new Error('Course Notes moved xp by x' + (r.xpUp || 0).toFixed(3) + ', not x1.30');
    if (!(r.cpwUp > 1.19 && r.cpwUp < 1.21)) throw new Error('Club Selection moved pure strike power by x' + (r.cpwUp || 0).toFixed(3));
    if (r.clock !== '4 0') throw new Error('Ready Golf left the clock at ' + r.clock + ' (want 4, and no lasting buff)');
    if (r.clock0 !== 0) throw new Error('Ready Golf wound the clock back past zero: ' + r.clock0);
    if (r.clockWalk !== 0.5) throw new Error('Ready Golf wound the clock back while he walked in off a cleared hole: ' + r.clockWalk);
    const want = ['-4:cheer', '-2:cheer', '-1:cheer', '0:none', '1:sigh', '2:sigh'];
    const got = r.react.split(' ');
    for (let i = 0; i < got.length; i++) {
      const [d, k] = got[i].split(':'), need = +d <= -1 ? 'cheer' : +d >= 1 ? 'sigh' : 'none';
      if (k !== need) throw new Error('the fairy said "' + k + '" to a ' + d + ' (want ' + need + '): ' + r.react);
    }
    if (!/cheer/.test(r.react) || !/sigh/.test(r.react)) throw new Error('the scores tried never reached a cheer and a sigh: ' + r.react);
    if (r.reactQuiet) throw new Error('the fairy had his say during a catch-up');
    if (!r.quip || !/^quip:/.test(r.quip)) throw new Error('no quip came round when it was due: ' + r.quip);
    if (r.badLines.length) throw new Error('lines the fairy cannot say on the field (16 at most, in the font): ' + r.badLines.join('; '));
    if (r.unowned !== null || r.unknown !== null) throw new Error('a save wearing an unowned or unknown perk loaded with ' + r.unowned + ' / ' + r.unknown);
    if (r.rows !== r.n || r.navs !== 'Upgrades/Caddie') throw new Error('the Range shows ' + r.rows + ' perk rows of ' + r.n + ' under ' + r.navs);
    if (r.glide > 0.001) throw new Error('the camera moved ' + r.glide.toFixed(2) + ' units while he was still swinging');
    for (const w of r.walk) {
      if (Math.abs(w.land - w.to) > 0.01) throw new Error('a shot from ' + w.from + ' that took him to ' + w.to + ' flew to ' + w.land);
      if (w.camAtLand !== null && w.camAtLand > w.from + 0.05)
        throw new Error('he was already ' + (w.camAtLand - w.from).toFixed(1) + ' of ' + (w.to - w.from) + ' units down the hole when the ball landed');
      if (Math.abs(w.end - w.to) > 0.1) throw new Error('he walked to ' + w.end + ', the ball came down at ' + w.to);
    }
    if (r.held.swinging) throw new Error('he swung again with his last ball still lying 20 units ahead of him');
    if (r.held.queued !== 12) throw new Error('the waiting swings were not kept: ' + r.held.queued + ' of 12');
    if (r.held.firedAt === null || r.held.firedAt < 29) throw new Error('the waiting swing went off at ' + r.held.firedAt + ', not when he reached his ball at 30');
    if (r.held.carried !== '0 false false') throw new Error('a swing from the last hole carried onto the new tee: ' + r.held.carried);
    if (!r.scoutArmed) throw new Error('Lost Ball Scout lapsed before the hole ended');
    if (!r.scoutSpent) throw new Error('Lost Ball Scout was still armed after the hole it was for');
    if (!(r.after > 1)) throw new Error('after the swing the camera did not move on: ' + r.after.toFixed(2));
    return ['the fairy stays clear of the golfer in all ' + r.poses + ' poses, club and all',
      r.n + ' perks: bought once, one worn, free to change; +20% tempo for 8s every ' + r.every + 's, none in a catch-up;'
        + ' Course Notes x' + r.xpUp.toFixed(2) + ' xp, Club Selection x' + r.cpwUp.toFixed(2) + ' pure power, Ready Golf 1s off',
      'the fairy cheers a birdie or better, sighs at a bogey or worse, keeps quiet at par and in a catch-up (' + r.react + '),'
        + ' and a quip comes round ("' + r.quip.slice(5) + '")',
      'no gliding: the camera holds through the swing and walks on after (' + r.after.toFixed(1) + ' units)',
      'every shot flies as far as it went (' + r.walk.map(w => (w.to - w.from).toFixed(1)).join(', ') + ' units) and he walks to where it came down',
      'he does not hit again until he reaches his ball (the waiting swing goes off at ' + r.held.firedAt.toFixed(1) + ' of 30); a new hole drops a swing still going',
      'Lost Ball Scout holds its luck until the next hole ends, then it is spent'];
  }
};
