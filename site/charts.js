/* Instrument: charts. Inline SVG strings. A party is its color and its name; every mark is labelled with its value.
   The line chart follows the conventions of public-opinion trend charts: thick lines, open end markers, values at
   the points in the series color, the party named inside the chart beside its own line, a baseline with ticks and
   no gridlines. One scale is shared by every chart, from zero to the highest share any of them draws, with its two
   end values named at the axis; the baseline is the zero of the
   scale. */
(() => {
"use strict";
const { C, PCOL, PNAME, YEARS, TINY, SMALL, esc, yl, S } = INS;

/* ---------- the line chart for one word across the cycles ---------- */
const drawn = c => c && c.n >= TINY;   // only a group with ten or more analyzed candidates is drawn
INS.lineData = ti => {
  const out = {};
  INS.PARTIES.forEach(p => { out[p] = YEARS.map(y => INS.cell(ti, y, p)); });
  return out;
};
INS.lineHasData = data => INS.PARTIES.some(p => data[p].some(drawn));

/* A share from a group of 10 to 29 analyzed candidates carries an asterisk wherever its value is printed. */
/* Marks on the chart face were removed; the pre-registered patterns carry the data cleaning. */
INS.starFor = () => "";

/* The size of a mark's target: 44 px, cut at the midpoint toward the other party's mark when that mark is closer. */
INS.TARGET = 44;
/* The least distance between cycles at which a party's name is set on one line with its last value. */
const ONELINE_STEP = 36;

/* The width of a text in the chart's own face, so a label's box is its true width. */
let measurer = null;
const textWidth = (t, px) => {
  if (!measurer) measurer = document.createElement("canvas").getContext("2d");
  measurer.font = `700 ${px}px "IBM Plex Sans", "Segoe UI", sans-serif`;
  return measurer.measureText(t).width;
};

/* One drawing of the chart at height H. `bad` counts the labels that could not be set clear of another party's mark,
   another label, a scale label or the edge. */
const buildChart = (ti, W, o, H, small = false, edges = true, oneLine = true) => {
  const data = INS.lineData(ti), mini = !!o.mini, range = !!o.range;
  /* The interval is drawn where there is room to say what it is. A chart too small for that sentence draws the
     lines alone, and the term's own view carries the interval, the gap and its test. */
  const showCI = o.ci !== false;
  const narrow = W < 560;
  let bad = 0, soft = 0, far = 0;   // soft: a label on its own interval outline; far: how far a last value sits from its marker
  const valText = c => INS.pctOf(c.k, c.n);
  const nfs = 13;   // the party's name
  // the last value of each series is set with the party's name in the right margin, on one line, the value first. Where
  // the margin that line needs would leave the cycles too close, the name goes over its value, set apart from the other's.
  let inline = oneLine && !mini && W >= 640;
  const inset = mini ? 14 : W < 310 ? 14 : narrow ? 24 : 26;
  let m = mini ? { l: 44, r: 28, t: 22, b: 44 } : inline ? { l: 56, r: 148, t: 28, b: 52 } : narrow ? { l: 44, r: 84, t: 28, b: 52 } : { l: 56, r: 84, t: 28, b: 52 };
  if (oneLine && !inline && !mini) {
    const lastCells = INS.PARTIES.map(p => { const ds = data[p].filter(drawn); return ds[ds.length - 1]; }).filter(Boolean);
    const need = lastCells.length ? Math.ceil(7 + 6.5 + 6 + Math.max(...lastCells.map(c => textWidth(valText(c), 13) + textWidth(" " + PNAME[c.p], nfs)))) : 0;
    const m2 = Object.assign({}, m, { r: Math.max(m.r, need) });
    if (lastCells.length && (W - m2.l - m2.r - inset * 2) / 3 >= ONELINE_STEP) { inline = true; m = m2; }
  }
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const X = i => m.l + inset + i * (pw - inset * 2) / 3;
  const base = m.t + ph;
  // every chart on the page is on one scale, which reaches the highest share drawn, and the baseline is its zero
  const top = range ? 1 : INS.scaleTop();
  const Y = v => base - (v / top) * ph;
  const id = "h" + Math.random().toString(36).slice(2, 7);
  const r = mini ? 4.5 : 6.5, sw = mini ? 3.2 : 4.4;
  const T = INS.TARGET / 2;
  const ZY = 10;   // the scale's zero is named just under the baseline, out of the row a value at zero is set in
  // a value is 16 px where the cycles are 56 px apart or more, and 13 px where they are closer
  const fs = mini || small || (pw - inset * 2) / 3 < 56 ? 13 : 16;
  let s = `<svg class="linechart${mini ? " mini" : ""}${!mini && fs === 13 ? " sm" : ""}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(INS.dn(ti))}: share of analyzed candidates by party and cycle">
    <defs><pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-1 9 L9 -1 M-1 1 L1 -1 M7 9 L9 7" stroke="#B3BAC2" stroke-width="1" fill="none"/></pattern></defs>`;
  // the 2026 region
  const hx = (X(2) + X(3)) / 2;
  s += `<rect x="${hx.toFixed(1)}" y="${m.t}" width="${(m.l + pw - hx).toFixed(1)}" height="${ph}" fill="url(#${id})"/>`;
  // baseline with a tick and a label at each cycle, the date 2026 runs through under its label, and the scale's two ends
  s += `<line x1="${m.l}" x2="${m.l + pw}" y1="${base + 0.5}" y2="${base + 0.5}" stroke="#7B848E" stroke-width="1"/>`;
  s += `<text class="ax" x="${m.l - 8}" y="${(Y(top) + 4.5).toFixed(1)}" text-anchor="end">${Math.round(top * 100)}%</text><text class="ax" x="${m.l - 8}" y="${(base + ZY).toFixed(1)}" text-anchor="end">0%</text>`;
  YEARS.forEach((y, i) => {
    s += `<line x1="${X(i)}" x2="${X(i)}" y1="${base}" y2="${base + 5}" stroke="#7B848E"/>`;
    const ty = base + (mini ? 19 : 23);
    s += `<text class="ax" x="${X(i)}" y="${ty}" text-anchor="middle">${yl(y)}</text>`;
    if (y === 2026 && o.asof) s += `<text class="ax" x="${X(i)}" y="${ty + 16}" text-anchor="middle">${esc(o.asof)}</text>`;
  });
  const runs = p => {
    const rs = []; let cur = [];
    data[p].forEach((c, i) => { if (drawn(c)) cur.push({ c, i }); else if (cur.length) { rs.push(cur); cur = []; } });
    if (cur.length) rs.push(cur);
    return rs;
  };
  // the possible range first, as a pale band; then the intervals, then the lines
  if (range) INS.PARTIES.forEach(p => {
    runs(p).forEach(run => {
      if (!run.every(({ c }) => c.range)) return;
      if (run.length > 1) {
        const up = run.map(({ c, i }) => `${X(i).toFixed(1)},${Y(c.range[1]).toFixed(1)}`);
        const dn = run.slice().reverse().map(({ c, i }) => `${X(i).toFixed(1)},${Y(c.range[0]).toFixed(1)}`);
        s += `<polygon points="${up.concat(dn).join(" ")}" fill="${PCOL[p]}" opacity="0.08"/>`;
      } else {
        const { c, i } = run[0];
        s += `<line x1="${X(i)}" x2="${X(i)}" y1="${Y(c.range[0]).toFixed(1)}" y2="${Y(c.range[1]).toFixed(1)}" stroke="${PCOL[p]}" stroke-width="16" opacity="0.08"/>`;
      }
    });
  });
  // the 95% interval behind the lines: a pale fill inside two outlines in the party's color (at least 3 to 1 against the page)
  if (showCI) INS.PARTIES.forEach(p => {
    runs(p).forEach(run => {
      if (run.length > 1) {
        const up = run.map(({ c, i }) => `${X(i).toFixed(1)},${Y(c.ci[1]).toFixed(1)}`);
        const dn = run.map(({ c, i }) => `${X(i).toFixed(1)},${Y(c.ci[0]).toFixed(1)}`);
        s += `<polygon points="${up.concat(dn.slice().reverse()).join(" ")}" fill="${PCOL[p]}" opacity="0.10"/>`;
        if (edges) {
          s += `<polyline class="ciedge" points="${up.join(" ")}" fill="none" stroke="${PCOL[p]}" stroke-width="1.5" stroke-linejoin="round"/>`;
          s += `<polyline class="ciedge" points="${dn.join(" ")}" fill="none" stroke="${PCOL[p]}" stroke-width="1.5" stroke-linejoin="round"/>`;
        }
      } else {
        const { c, i } = run[0], x = X(i), y0 = Y(c.ci[0]).toFixed(1), y1 = Y(c.ci[1]).toFixed(1);
        s += `<path class="ciedge" d="M${x - 6} ${y0} H${x + 6} M${x - 6} ${y1} H${x + 6} M${x} ${y0} V${y1}" fill="none" stroke="${PCOL[p]}" stroke-width="1.5"/>`;
      }
    });
  });
  // a white keyline under each line stops the other party's interval outline short of it, so no outline crosses a line
  INS.PARTIES.forEach(p => {
    runs(p).forEach(run => {
      if (run.length > 1) s += `<polyline points="${run.map(({ c, i }) => `${X(i).toFixed(1)},${Y(c.share).toFixed(1)}`).join(" ")}" fill="none" stroke="#fff" stroke-width="${sw + 5}" stroke-linejoin="round" stroke-linecap="round"/>`;
    });
  });
  // lines
  INS.PARTIES.forEach(p => {
    runs(p).forEach(run => {
      if (run.length > 1) s += `<polyline points="${run.map(({ c, i }) => `${X(i).toFixed(1)},${Y(c.share).toFixed(1)}`).join(" ")}" fill="none" stroke="${PCOL[p]}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
    });
  });

  /* ----- labels -----
     Every drawn point carries its value. The first point of a series is labelled to its left and the last to its
     right; every other label goes above the higher party's point and below the lower one, outside the interval.
     Each label is moved aside, then up or down, until it touches no line, outline, marker, scale label or label
     already placed. A wide chart prints the party's name after its last value. A narrow one sets the name beside
     its own line, nearest its end, where it touches none of those and is nearer its own line than the other's. */
  const firstI = {}, lastI = {};
  INS.PARTIES.forEach(p => { const ds = data[p].map((c, i) => (drawn(c) ? i : -1)).filter(i => i >= 0); firstI[p] = ds[0]; lastI[p] = ds[ds.length - 1]; });
  const textW = c => Math.ceil(textWidth(valText(c), fs)) + 1;
  const placed = [];      // every label box so far, the scale labels first
  const labelSpec = {};   // key -> {x, y, anchor}
  const boxFor = (x, yb, anchor, w, f = fs) => {
    const x0 = anchor === "end" ? x - w : anchor === "start" ? x : x - w / 2;
    return { x0, x1: x0 + w, t: yb - f * 0.78, b: yb + 2 };
  };
  // the scale's two end labels keep a clear row above and below them, so a value set at the left edge never stands in their column
  const AXPAD = 9;
  placed.push({ x0: m.l - 8 - 36, x1: m.l - 8, t: Y(top) + 4.5 - 10 - AXPAD, b: Y(top) + 6.5 + AXPAD }, { x0: m.l - 8 - 22, x1: m.l - 8, t: base + ZY - 10 - AXPAD, b: base + ZY + 2 + AXPAD });
  // the lines, interval outlines and markers a label must not cross, each sampled every 2 px
  const obs = [], dots = [];
  const addSeg = (ax, ay, bx, by, hw, kind, party) => {
    const k = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2)), pts = [];
    for (let t = 0; t <= k; t++) pts.push([ax + (bx - ax) * t / k, ay + (by - ay) * t / k]);
    obs.push({ pts, e: hw + 2, kind, party });
  };
  INS.PARTIES.forEach(p => {
    runs(p).forEach(run => {
      for (let k = 1; k < run.length; k++) {
        addSeg(X(run[k - 1].i), Y(run[k - 1].c.share), X(run[k].i), Y(run[k].c.share), sw / 2, "line", p);
        if (edges && showCI) for (const e of [1, 0]) addSeg(X(run[k - 1].i), Y(run[k - 1].c.ci[e]), X(run[k].i), Y(run[k].c.ci[e]), 1, "edge", p);
      }
      run.forEach(({ c, i }) => {
        dots.push([X(i), Y(c.share)]);
        if (run.length === 1 && showCI) { addSeg(X(i), Y(c.ci[0]), X(i), Y(c.ci[1]), 1, "edge", p); addSeg(X(i) - 6, Y(c.ci[0]), X(i) + 6, Y(c.ci[0]), 1, "edge", p); addSeg(X(i) - 6, Y(c.ci[1]), X(i) + 6, Y(c.ci[1]), 1, "edge", p); }
      });
    });
  });
  /* What a label box would cost by what it touches, for a label of party `mine`: the page edge or the baseline 400,
     another label 200, the other party's interval outline 160, the other party's line or any marker 150, its own line
     120, its own outline 60. Zero is a free place; 100 or more counts as in the way. */
  const touches = (b, mine) => {
    let n = 0;
    if (b.x0 < 2 || b.x1 > W - 2 || b.t < 2) n += 400;
    if (b.b > base - 3) n += 400;
    for (const [cx, cy] of dots) {
      const dx = Math.max(b.x0 - cx, 0, cx - b.x1), dy = Math.max(b.t - cy, 0, cy - b.b);
      if (dx * dx + dy * dy < (r + 4) * (r + 4)) n += 150;
    }
    for (const sg of obs) {
      const e = sg.e;
      for (const pt of sg.pts) { if (pt[0] >= b.x0 - e && pt[0] <= b.x1 + e && pt[1] >= b.t - e && pt[1] <= b.b + e) { n += sg.party === mine ? (sg.kind === "line" ? 120 : 60) : (sg.kind === "line" ? 150 : 160); break; } }
    }
    for (const p2 of placed) if (!(b.x1 + 2 < p2.x0 || b.x0 - 2 > p2.x1 || b.b + 1 < p2.t || b.t - 1 > p2.b)) n += 200;
    return n;
  };
  /* The other party's line at x, or null where it has none. */
  const lineAt = (q, x) => {
    for (const run of runs(q)) for (let k = 1; k < run.length; k++) {
      const a = X(run[k - 1].i), b = X(run[k].i);
      if (x >= a - 0.01 && x <= b + 0.01) { const ya = Y(run[k - 1].c.share), yb = Y(run[k].c.share); return ya + (yb - ya) * (x - a) / (b - a); }
    }
    return null;
  };
  /* A label belongs on its own marker's side of the other party's line: the cost of a spot (bx, by) across that line
     from the marker (mx, my). Markers closer than 1.5 px have no side. */
  const CROSS = 130;
  const crossCost = (p, mx, my, bx, by) => {
    const q = INS.PARTIES.find(z => z !== p), ref = lineAt(q, mx), at = lineAt(q, bx);
    if (ref === null || at === null || Math.abs(my - ref) < 1.5) return 0;
    return Math.sign(by - at) !== Math.sign(my - ref) ? CROSS : 0;
  };
  // a place in the way of something (100 or more) always loses to one that is not; among the rest the nearer, and the
  // one on the marker's own side, wins
  const costOf = (p, b, pen, mark) => {
    const t = touches(b, p);
    return (t >= 100 ? t + 1000 : t) + pen + (mark ? crossCost(p, mark[0], mark[1], (b.x0 + b.x1) / 2, (b.t + b.b) / 2) : 0);
  };
  /* A label takes the candidate that touches nothing and is nearest its preferred place; each candidate carries its penalty. */
  const place = (key, cands, w, mark) => {
    let pick = cands[0], best = Infinity;
    for (const cd of cands) {
      const cost = costOf(key.charAt(0), boxFor(cd.x, cd.y, cd.anchor, w), cd.pen || 0, mark);
      if (cost < best) { best = cost; pick = cd; }
    }
    labelSpec[key] = pick;
    const pb = boxFor(pick.x, pick.y, pick.anchor, w);
    // a label more than 36 px from its own marker is not read as that marker's
    const tc = touches(pb, key.charAt(0));
    if (tc >= 100 || (mark && Math.hypot((pb.x0 + pb.x1) / 2 - mark[0], (pb.t + pb.b) / 2 - mark[1]) > 36)) bad++;
    else if (tc > 0) soft++;
    placed.push(pb);
  };
  // the first value of a series sits to the left of its marker; two that would touch are pushed apart, and one that
  // would meet a scale label or a line goes above or below its marker
  const endKeys = [];
  INS.PARTIES.forEach(p => { if (firstI[p] !== undefined && firstI[p] !== lastI[p]) endKeys.push([p, firstI[p]]); });
  const endY = {};
  endKeys.forEach(([p, i]) => {
    const c = data[p][i], y = Y(c.share);
    let ty = y + fs * 0.31;
    const q = INS.PARTIES.find(z => z !== p), oc = data[q][i];
    if (drawn(oc) && i === firstI[q] && i !== lastI[q]) {
      const dy = Y(oc.share) - y, need = fs + 1;
      if (Math.abs(dy) < need) ty += (dy >= 0 ? -1 : 1) * (need - Math.abs(dy)) / 2;
    }
    endY[p + i] = Math.min(ty, base - 8);
  });
  // two first labels of one cycle that would touch keep the order of their markers: the higher marker's label stays above
  YEARS.forEach((yy, i) => {
    const a = endY["D" + i], b = endY["R" + i];
    if (a === undefined || b === undefined || Math.abs(a - b) >= fs + 1) return;
    const hi = Y(data.D[i].share) <= Y(data.R[i].share) ? "D" : "R", lo = hi === "D" ? "R" : "D";
    endY[lo + i] = Math.min(Math.max(endY[lo + i], endY[hi + i] + fs + 1), base - 8);
    endY[hi + i] = Math.min(endY[hi + i], endY[lo + i] - (fs + 1));
  });
  const endSpec = (p, i) => ({ c: data[p][i], x: X(i) - (r + 6), y: endY[p + i], anchor: "end", w: textW(data[p][i]) });
  const done = {};
  endKeys.forEach(([p, i]) => {
    if (done[p + i]) return;
    const q = INS.PARTIES.find(z => z !== p);
    const here = endSpec(p, i), other = endKeys.some(([pp, ii]) => pp === q && ii === i) ? endSpec(q, i) : null;
    if (other) {
      // both parties start here: the two labels move together, so the higher marker's label stays the higher
      let best = null, bestCost = Infinity;
      for (let k = 0; k <= 14; k++) for (const sg of (k ? [-1, 1] : [1])) {
        const dy = sg * k * 3, A = { x: here.x, y: here.y + dy, anchor: "end" }, B = { x: other.x, y: other.y + dy, anchor: "end" };
        const ba = boxFor(A.x, A.y, A.anchor, here.w), bb = boxFor(B.x, B.y, B.anchor, other.w);
        const cost = touches(ba, p) + touches(bb, q) + k;
        const sep = (bb.t < ba.b + 1 && ba.t < bb.b + 1) ? 400 : 0;
        if (cost + sep < bestCost) { bestCost = cost + sep; best = [A, B]; }
      }
      // or the higher marker's value over its marker and the lower one's at the left, where the left column is the scale's
      const hiP = Y(data[p][i].share) <= Y(data[q][i].share) ? p : q, loP = hiP === p ? q : p;
      const spec = { [p]: here, [q]: other };
      const hiAt = { x: X(i), y: Y(data[hiP][i].share) - (r + 5), anchor: "middle" };
      const bh = boxFor(hiAt.x, hiAt.y, hiAt.anchor, spec[hiP].w);
      for (let k = 0; k <= 14; k++) for (const sg of (k ? [-1, 1] : [1])) {
        const lo = { x: spec[loP].x, y: spec[loP].y + sg * k * 3, anchor: "end" }, bl = boxFor(lo.x, lo.y, lo.anchor, spec[loP].w);
        const sep = (bl.t < bh.b + 1 && bh.t < bl.b + 1) ? 400 : 0;
        const cost = touches(bh, hiP) + touches(bl, loP) + k + 8 + sep + (((bl.t + bl.b) < (bh.t + bh.b)) ? 120 : 0);
        if (cost < bestCost) { bestCost = cost; best = hiP === p ? [hiAt, lo] : [lo, hiAt]; }
      }
      [[p, here, best[0]], [q, other, best[1]]].forEach(([pp, sp, at]) => {
        const bx = boxFor(at.x, at.y, at.anchor, sp.w);
        if (touches(bx, pp) >= 100) bad++;
        labelSpec[pp + i] = at; placed.push(bx);
      });
      done[p + i] = done[q + i] = true;
      return;
    }
    const x = X(i), y = Y(here.c.share);
    const cands = [{ x: here.x, y: here.y, anchor: "end", pen: 0 }];
    for (let k = 1; k <= 10; k++) for (const sg of [-1, 1]) cands.push({ x: here.x, y: here.y + sg * k * 3, anchor: "end", pen: 2 + k * 1.5 });
    cands.push({ x, y: y - (r + 5), anchor: "middle", pen: 14 }, { x, y: y + r + 5 + fs * 0.78, anchor: "middle", pen: 14 });
    // or to the right of the marker, on the party's own line, which the label's plate may cross
    for (let k = 0; k <= 6; k++) for (const sg of (k ? [-1, 1] : [1])) cands.push({ x: x + r + 6, y: here.y + sg * k * 3, anchor: "start", pen: 10 + k });
    place(p + i, cands, here.w, [x, y]);
    done[p + i] = true;
  });
  // the last value of a series, with the party's name, to the right of its marker. The lower marker's is set first and
  // the higher one cannot sink below it, so the order of the names is the order of the lines.
  const named = {}, nameSpec = {};
  let prev = null;   // the block of the lower marker, set first
  INS.PARTIES.filter(p => lastI[p] !== undefined).map(p => [p, lastI[p]])
    .sort((a, b) => Y(data[b[0]][b[1]].share) - Y(data[a[0]][a[1]].share))
    .forEach(([p, i]) => {
      const c = data[p][i], nw = Math.ceil(textWidth(PNAME[p], nfs)) + 2;
      const w = inline ? Math.ceil(textWidth(valText(c), fs) + textWidth(" " + PNAME[p], nfs)) + 1 : Math.max(textW(c), nw);
      const x0 = X(i) + r + 6, y0 = Y(c.share) + fs * 0.31;
      const lift = inline ? 0 : 4.5 + nfs * 0.78 - fs * 0.04;   // what the stacked name adds above the value, set close over it
      const GAP = inline ? 1 : 9;   // a stacked name and value are one block: the next block keeps this far clear of it
      const boxAt = (yv, x) => ({ x0: x, x1: x + w, t: yv - fs * 0.78 - lift, b: yv + 2 });
      let pick = null, best = Infinity;
      // beside its marker; failing that a little higher or lower, and then a little further right
      for (const dx of [0, 10, 20, 30]) for (let k = 0; k <= 24; k++) for (const sg of (k ? [-1, 1] : [1])) {
        const yv = y0 + sg * k * 3, box = boxAt(yv, x0 + dx);
        if ((prev && box.x0 < prev.x1 + 2 && box.x1 > prev.x0 - 2 && box.b > prev.t - GAP) || yv > base - 2 || box.x1 > W - 2) continue;
        const cost = touches(box, p) + k * 1.5 + dx * 0.8;
        if (cost < best) { best = cost; pick = { yv, x: x0 + dx, box }; }
      }
      // or centered over or under its marker, where a mark of the other party rises beside it
      if (best >= 100) {
        const cx = Math.max(2, Math.min(W - 2 - w, X(i) - w / 2)), my = Y(c.share);
        for (let k = 0; k <= 16; k++) for (const sg of [-1, 1]) {
          const yv = sg < 0 ? my - r - 5 - k * 3 : my + r + 4 + fs * 0.78 + lift + k * 3, box = boxAt(yv, cx);
          if ((prev && box.x0 < prev.x1 + 2 && box.x1 > prev.x0 - 2 && box.b > prev.t - GAP) || yv > base - 2 || box.t < 2) continue;
          const cost = touches(box, p) + 12 + k * 1.5;
          if (cost < best) { best = cost; pick = { yv, x: cx, box }; }
        }
      }
      if (!pick) { const yv = prev ? Math.min(y0, prev.t - GAP - 2) : y0; pick = { yv, x: x0, box: boxAt(yv, x0) }; }
      if (touches(pick.box, p) >= 100) bad++;
      { const bx = pick.box, mx = X(i), my = Y(c.share); far += Math.max(0, Math.hypot(Math.max(bx.x0 - mx, 0, mx - bx.x1), Math.max(bx.t - my, 0, my - bx.b)) - 24); }
      labelSpec[p + i] = { x: pick.x, y: pick.yv, anchor: "start" };
      if (inline) named[p + i] = true; else nameSpec[p] = { x: pick.x, y: pick.yv - fs * 0.74 - 4.5, anchor: "start" };
      placed.push(pick.box);
      prev = pick.box;
    });
  // the inner labels, a cycle at a time: where both parties have one, the two are set together, so that each stays on
  // its own marker's side of the other party's line and the higher marker's label is the higher
  const inner = {};
  INS.PARTIES.forEach(p => data[p].forEach((c, i) => { if (drawn(c) && i !== firstI[p] && i !== lastI[p]) (inner[i] = inner[i] || []).push(p); }));
  const innerCands = (p, i) => {
    const c = data[p][i], x = X(i), y = Y(c.share), w = textW(c);
    const q = INS.PARTIES.find(z => z !== p), oc = data[q][i];
    const lower = drawn(oc) && (oc.share > c.share || (oc.share === c.share && p === "R"));
    const up = y - (r + 4), down = y + r + 4 + fs * 0.78;
    // every row from well above the marker to just below it, in the order of nearness to the place this party's label belongs
    const ideal = lower ? down : up, cands = [];
    for (let yb = up - 7 * (fs + 3); yb <= down + 2 * (fs + 3); yb += 2) {
      const wrong = lower ? yb < y : yb > y;
      const band = yb > Y(c.ci[1]) - 4 && yb < Y(c.ci[0]) + 4 + fs * 0.78;   // inside its own interval: a last resort
      [["middle", 0], ["end", -(r + 4)], ["start", r + 4]].forEach(([anchor, dx]) => {
        cands.push({ x: x + dx, y: yb, anchor, pen: Math.abs(yb - ideal) * 0.6 + (anchor === "middle" ? 0 : 4) + (wrong ? 20 : 0) + (band ? 6 : 0) });
      });
    }
    return { p, i, w, mark: [x, y], cands };
  };
  Object.keys(inner).map(Number).sort((a, b) => a - b).forEach(i => {
    const L = inner[i].map(p => innerCands(p, i));
    if (L.length === 1) { place(L[0].p + i, L[0].cands, L[0].w, L[0].mark); return; }
    // every place of each label, nearest first, then the cheapest pair; a pair's cost is its two costs and what the two
    // do to each other, so the search stops where the two costs alone pass the best pair
    const scored = L.map(o => o.cands.map(cd => { const b = boxFor(cd.x, cd.y, cd.anchor, o.w); return { cd, b, cost: costOf(o.p, b, cd.pen, o.mark) }; })
      .sort((a, b) => a.cost - b.cost));
    let pair = null, bestPair = Infinity;
    const dm = L[0].mark[1] - L[1].mark[1];
    for (const a of scored[0]) {
      if (a.cost + scored[1][0].cost >= bestPair) break;
      for (const b of scored[1]) {
        let cost = a.cost + b.cost;
        if (cost >= bestPair) break;
        if (!(a.b.x1 + 2 < b.b.x0 || a.b.x0 - 2 > b.b.x1 || a.b.b + 1 < b.b.t || a.b.t - 1 > b.b.b)) cost += 200;
        const dl = (a.b.t + a.b.b) / 2 - (b.b.t + b.b.b) / 2;
        if (Math.abs(dm) >= 1.5 && Math.sign(dl) !== Math.sign(dm)) cost += 120;
        if (cost < bestPair) { bestPair = cost; pair = [a, b]; }
      }
    }
    pair.forEach((pk, k) => {
      const o = L[k];
      labelSpec[o.p + i] = pk.cd;
      const tc = touches(pk.b, o.p);
      if (tc >= 100 || Math.hypot((pk.b.x0 + pk.b.x1) / 2 - o.mark[0], (pk.b.t + pk.b.b) / 2 - o.mark[1]) > 36) bad++;
      else if (tc > 0) soft++;
      placed.push(pk.b);
    });
  });
  // labels on the wrong side of the other party's line, or in the wrong order against the other party's label
  let wrong = 0;
  const ctr = {};
  INS.PARTIES.forEach(p => data[p].forEach((c, i) => {
    const sp = labelSpec[p + i];
    if (!drawn(c) || !sp) return;
    const w = textW(c), cx = sp.anchor === "end" ? sp.x - w / 2 : sp.anchor === "start" ? sp.x + w / 2 : sp.x;
    ctr[p + i] = sp.y - fs * 0.35;
    if (crossCost(p, X(i), Y(c.share), cx, ctr[p + i])) wrong++;
  }));
  YEARS.forEach((yy, i) => {
    if (ctr["D" + i] === undefined || ctr["R" + i] === undefined) return;
    const dm = Y(data.D[i].share) - Y(data.R[i].share);
    if (Math.abs(dm) >= 1.5 && Math.sign(ctr["D" + i] - ctr["R" + i]) !== Math.sign(dm)) wrong++;
  });
  INS.PARTIES.forEach(p => {
    data[p].forEach((c, i) => {
      const sp = labelSpec[p + i];
      if (!drawn(c) || !sp) return;
      s += `<text class="vl ${p}" x="${sp.x.toFixed(1)}" y="${sp.y.toFixed(1)}" text-anchor="${sp.anchor}">${valText(c)}${!mini && named[p + i] ? ` <tspan class="nm">${PNAME[p]}</tspan>` : ""}</text>`;
    });
  });

  if (!mini) INS.PARTIES.forEach(p => {
    const sp = nameSpec[p];
    if (sp) s += `<text class="pl ${p}" x="${sp.x.toFixed(1)}" y="${sp.y.toFixed(1)}" text-anchor="${sp.anchor}">${PNAME[p]}</text>`;
  });

  // marks last so they sit on the lines; each is a button that opens the candidates behind it. Its target is 44 px
  // wide and 44 px tall, cut at the midpoint toward the other party's mark when that mark is nearer than 44 px.
  INS.PARTIES.forEach(p => {
    data[p].forEach((c, i) => {
      if (!drawn(c)) return;
      const x = X(i), y = Y(c.share), star = INS.starFor(c);
      const tip = `${PNAME[p]}, ${yl(c.y)}\n${c.k} of ${c.n} analyzed candidates\n95% Interval ${Math.round(c.ci[0] * 100)} to ${Math.round(c.ci[1] * 100)}%` + (range && c.range ? `\nPossible Range ${c.rangePct[0]} to ${c.rangePct[1]}%` : "") + "\nSelect to list the candidates";
      const lab = `${PNAME[p]}, ${yl(c.y)}: ${INS.pctOf(c.k, c.n)} of ${c.n} analyzed candidates${star ? ", fewer than 30" : ""}. Show the candidates`;
      const on = S.panel && S.panel.ti === ti && S.panel.y === c.y && S.panel.p === p;
      const oc = data[INS.PARTIES.find(z => z !== p)][i], oy = drawn(oc) ? Y(oc.share) : null;
      // 44 px tall, cut at the midpoint toward the other party's mark; the part cut off is added on the far side
      let top = y - T, bot = y + T;
      if (oy !== null && Math.abs(oy - y) < INS.TARGET) {
        const half = Math.abs(oy - y) / 2;
        if (oy > y) { bot = y + half; top = bot - INS.TARGET; } else { top = y - half; bot = top + INS.TARGET; }
      }
      top = Math.max(0, top); bot = Math.min(H, bot);
      s += `<g class="pt${on ? " on" : ""}" role="button" tabindex="0" data-panel="${INS.tslug(ti)}.${c.y}.${p}" data-tip="${esc(tip)}" aria-label="${esc(lab)}">
        <rect class="hitc" x="${(x - T).toFixed(1)}" y="${top.toFixed(1)}" width="${INS.TARGET}" height="${(bot - top).toFixed(1)}" fill="transparent"/>
        <circle class="ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r + 6}" fill="transparent"/>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="#fff" stroke="${PCOL[p]}" stroke-width="${mini ? 2.8 : 3.4}"/></g>`;
    });
  });
  return { svg: s + "</svg>", bad, wrong, soft, far };
};

/* The chart at the least height, from the given steps, at which every label is clear and on its own marker's side of
   the other party's line; failing that the same steps with 13 px values; failing that, the drawing with the fewest
   labels in the way, and where none is in the way the fewest on the wrong side. A narrow chart may grow, because the scale
   is the same 0 to 100% and a taller plot only spreads the marks. o.h fixes the height. */
const heightsFor = (W, o) => o.h ? [o.h] : o.mini ? [200, 240, 280, 320, 360] : W < 560 ? [290, 330, 370, 410, 450, 500, 560] : [300, 340, 380, 420, 470];
const fit = (ti, W, o) => {
  let best = null, bestScore = Infinity;
  /* The interval is a pale fill inside two outlines. Where the labels cannot be set clear of the outlines at any height,
     the outlines are left off and the fill alone shows the interval. A party's name goes on one line with its last
     value where there is room; where that line would be set far from its marker, the name goes over its value instead. */
  for (const edges of [true, false]) {
    for (const small of o.mini ? [false] : [false, true]) {
      for (const H of heightsFor(W, o)) {
        // at one height both settings of the name are drawn; the one whose last values sit nearer their markers is kept
        let hb = null, hs = Infinity, hbase = 0;
        for (const oneLine of o.oneLine === undefined ? [true, false] : [o.oneLine]) {
          const r = buildChart(ti, W, o, H, small, edges, oneLine);
          // among drawings with the same labels in the way, the side of the line decides only where nothing is in the way
          const base = r.bad * 100 + (r.bad ? 0 : (r.wrong + r.soft) * 10 + (edges ? 0 : 12) + (small ? 3 : 0));
          const score = base + r.far * 0.1 + (oneLine ? 0 : 1);
          if (score < hs) { hs = score; hbase = base; hb = Object.assign(r, { H }); }
        }
        if (hbase < bestScore) { bestScore = hbase; best = hb; }
        if (hb.bad === 0 && hb.wrong === 0 && hb.soft === 0) return best;
      }
    }
  }
  return best;
};
INS.lineChart = (ti, W, o = {}) => fit(ti, W, o).svg;
/* The height a chart needs, so several charts in one view can share it. */
INS.lineChartHeight = (ti, W, o = {}) => fit(ti, W, o).H;
/* Whether this chart sets each party's name on one line with its last value, and is clear, at the least height. Charts
   that stand side by side all take one setting, so the row reads alike. */
INS.lineOneLine = (ti, W, o = {}) => { const r = fit(ti, W, Object.assign({}, o, { oneLine: true })); return r.bad === 0 && r.far === 0; };
})();
