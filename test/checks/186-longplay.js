/* A long play keeps its pictures bounded (the user asked for a long-play
 * test: the phone's memory for pictures ran out once before, rule 77). A hundred and fifty
 * holes played through real frames, changing card every few: every canvas the
 * game makes is counted, and every one it frees.
 *
 *   - the far trees' hazed copies held to FOG_ALL_MAX all told, a sprite's
 *     to FOG_MAX, and its shrunk sizes to SH_MAX (each shrunk size kept two
 *     dozen hazes without end: thousands more every half hour)
 *   - the pictures kept (made less freed) level off: over the last sixty of
 *     a hundred and fifty holes under a quarter of what the first sixty kept */
'use strict';
module.exports = {
  name: 'longplay',
  async run(page) {
    const r = await page.evaluate(async () => {
      const SNAP = JSON.stringify(S), keep = { step: window.step };
      let made = 0, freed = 0; const ce = Document.prototype.createElement, cf = window.cvFree;
      Document.prototype.createElement = function(t){ const e = ce.apply(this, arguments); if (String(t).toLowerCase() === 'canvas') made++; return e; };
      const o = { blocks: [] };
      try {
        hideSheet(); QUIET = true; HOUR_FORCE = 14;
        const D = derive();
        // (the frees counted where they happen: a canvas shrunk to nothing)
        const wdesc = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'width');
        Object.defineProperty(HTMLCanvasElement.prototype, 'width', { configurable: true, get(){ return wdesc.get.call(this); }, set(v){ if (v === 0 && wdesc.get.call(this) > 0) freed++; wdesc.set.call(this, v); } });
        try {
          for (let blk = 0; blk < 5; blk++) {
            const m0 = made, f0 = freed;
            for (let k = 0; k < 30; k++) {
              const h = S.hole + 1 + k % 3; S.hole = h; S.scores = S.scores.slice(0, holeInRound(h) - 1); startHole();
              if (k % 5 === 0) S.tier = (S.tier + 1) % 60;
              for (let f = 0; f < 30; f++) { Scene.camD = f / 30 * LEN * 0.9; Scene.t += 1 / 60; Scene.draw(1 / 60, D); }
              await new Promise(r => setTimeout(r, 0));
            }
            o.blocks.push((made - m0) - (freed - f0));
          }
        } finally { Object.defineProperty(HTMLCanvasElement.prototype, 'width', wdesc); }
        o.fogAll = FOG_ALL.size; o.fogMax = FOG_ALL_MAX;
        // every sprite reachable from the hazes: its own bounds
        let worstFog = 0, worstSh = 0; const seen = new Set();
        for (const M of FOG_ALL.values()) { if (seen.has(M)) continue; seen.add(M); worstFog = Math.max(worstFog, M.size); }
        const walk = sp => { if (!sp || typeof sp !== 'object') return; if (sp._sh) worstSh = Math.max(worstSh, sp._sh.size); };
        for (const k in TREE_CACHE) for (const sp of Object.values(TREE_CACHE[k])) walk(sp);
        o.worstFog = worstFog; o.worstSh = worstSh;
      } finally {
        Document.prototype.createElement = ce; QUIET = false; HOUR_FORCE = null;
        Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(SNAP)); startHole();
      }
      return o;
    });
    const f = [];
    if (r.fogAll > r.fogMax) f.push(r.fogAll + ' hazed copies kept, over ' + r.fogMax);
    if (r.worstFog > 24) f.push('a sprite kept ' + r.worstFog + ' hazes');
    if (r.worstSh > 48) f.push('a tree kept ' + r.worstSh + ' shrunk sizes');
    if (!(r.blocks[3] + r.blocks[4] < (r.blocks[0] + r.blocks[1]) * 0.25)) f.push('pictures kept grew ' + r.blocks.join(', ') + ' a thirty holes: not levelling off');
    if (f.length) throw new Error(f.join('\n'));
    return ['150 holes: pictures kept ' + r.blocks.map(x => '+' + x).join(' ') + ' a thirty; hazes ' + r.fogAll + ' of ' + r.fogMax + ', at most ' + r.worstFog + ' a sprite, ' + r.worstSh + ' sizes a tree'];
  }
};
