/* Instrument: one chart per theme. The chart is split into a Democratic panel and a Republican panel, each drawing
   every term in the theme across all four cycles on the same 0 to 100% scale, with the term named at the end of its
   own line. A reader meets a theme whole: no cycle to choose, and the two parties side by side on one scale. */
(() => {
"use strict";
const { PNAME, YEARS, TINY, esc, yl } = INS;

const drawn = c => c && c.n >= TINY;

/* The width of a label in the chart's own face, so the right margin is the width the names truly need. */
let measurer = null;
const textWidth = (t, px) => {
  if (!measurer) measurer = document.createElement("canvas").getContext("2d");
  measurer.font = `400 ${px}px "IBM Plex Sans", system-ui, sans-serif`;
  return measurer.measureText(t).width;
};

const LFS = 12;        // the term named at the end of its line
const LGAP = 15;       // the least distance between two names, so none sits on another
const AXFS = 11;

/* Each term of a theme, with its cells for one party and the last cycle it is drawn in. */
const seriesFor = (terms, p) => terms.map(ti => {
  const cells = YEARS.map(y => INS.cell(ti, y, p));
  let last = -1;
  cells.forEach((c, i) => { if (drawn(c)) last = i; });
  return { ti, cells, last, name: INS.dn(ti).replace(/[“”]/g, "") };
}).filter(s => s.last >= 0);

/* The names at the right edge, pushed apart where their lines end close together and kept inside the panel. */
function placeLabels(series, Y, top, bottom) {
  const want = series.map(s => ({ s, y: Y(s.cells[s.last].share) }));
  want.sort((a, b) => a.y - b.y);
  let prev = -Infinity;
  want.forEach(w => { w.ly = Math.max(w.y, prev + LGAP); prev = w.ly; });
  const over = want.length ? want[want.length - 1].ly - bottom : 0;
  if (over > 0) {
    let next = Infinity;
    for (let i = want.length - 1; i >= 0; i--) { want[i].ly = Math.min(want[i].ly - over, next - LGAP); next = want[i].ly; }
    const under = top - want[0].ly;
    if (under > 0) { prev = -Infinity; want.forEach(w => { w.ly = Math.max(w.ly + under, prev + LGAP); prev = w.ly; }); }
  }
  return want;
}

/* One party's panel of a theme's chart. */
function panel(terms, p, W, H, labelW) {
  const m = { l: 36, r: labelW, t: 12, b: 30 };
  const pw = W - m.l - m.r, ph = H - m.t - m.b;
  const inset = 10;
  const X = i => m.l + inset + i * (pw - inset * 2) / (YEARS.length - 1);
  const base = m.t + ph;
  const Y = v => base - v * ph;
  const id = "th" + Math.random().toString(36).slice(2, 7);
  const series = seriesFor(terms, p);
  let s = `<svg class="tchart ${p}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(PNAME[p])} candidates: share using each term, by cycle">
    <defs><pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M-1 9 L9 -1 M-1 1 L1 -1 M7 9 L9 7" stroke="#B3BAC2" stroke-width="1" fill="none"/></pattern></defs>`;
  /* The 2026 region, which the study has not finished collecting. */
  const hx = (X(2) + X(3)) / 2;
  s += `<rect x="${hx.toFixed(1)}" y="${m.t}" width="${(m.l + pw - hx).toFixed(1)}" height="${ph}" fill="url(#${id})"/>`;
  /* The scale: a line at the half, the baseline at its zero. */
  s += `<line class="tgrid" x1="${m.l}" x2="${(m.l + pw).toFixed(1)}" y1="${Y(0.5).toFixed(1)}" y2="${Y(0.5).toFixed(1)}"/>`;
  s += `<line class="tbase" x1="${m.l}" x2="${(m.l + pw).toFixed(1)}" y1="${base + 0.5}" y2="${base + 0.5}"/>`;
  [[1, "100%"], [0.5, "50%"], [0, "0%"]].forEach(([v, t]) =>
    s += `<text class="tax" x="${m.l - 7}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${t}</text>`);
  YEARS.forEach((y, i) => {
    s += `<line class="tbase" x1="${X(i).toFixed(1)}" x2="${X(i).toFixed(1)}" y1="${base}" y2="${base + 4}"/>`;
    s += `<text class="tax" x="${X(i).toFixed(1)}" y="${base + 19}" text-anchor="middle">${yl(y)}</text>`;
  });
  /* A term's line, broken wherever a cycle has too few analyzed candidates to draw. */
  series.forEach(se => {
    const runs = [];
    let cur = [];
    se.cells.forEach((c, i) => {
      if (drawn(c)) cur.push(`${X(i).toFixed(1)},${Y(c.share).toFixed(1)}`);
      else { if (cur.length) runs.push(cur); cur = []; }
    });
    if (cur.length) runs.push(cur);
    runs.forEach(r => {
      s += r.length === 1
        ? `<circle class="tpt ${p}" cx="${r[0].split(",")[0]}" cy="${r[0].split(",")[1]}" r="2.6"/>`
        : `<polyline class="tline ${p}" points="${r.join(" ")}"/>`;
    });
  });
  /* The name at the end of each line, with a leader where it had to move to clear another. */
  const placed = placeLabels(series, Y, m.t + 5, base);
  placed.forEach(w => {
    const ex = X(w.s.last), ey = w.y, lx = m.l + pw + 8;
    s += `<circle class="tend ${p}" cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="3"/>`;
    if (Math.abs(w.ly - ey) > 1.5)
      s += `<path class="tlead" d="M${(ex + 4).toFixed(1)} ${ey.toFixed(1)} L${(lx - 4).toFixed(1)} ${w.ly.toFixed(1)}"/>`;
    s += `<a href="${INS.addressFor({ terms: [w.s.ti], panel: null })}" class="tname"><text x="${lx.toFixed(1)}" y="${(w.ly + 4).toFixed(1)}">${esc(w.s.name)}<title>${esc(w.s.name)}, ${esc(PNAME[p])} ${INS.pctOf(w.s.cells[w.s.last].k, w.s.cells[w.s.last].n)} in ${yl(YEARS[w.s.last])}</title></text></a>`;
  });
  return s + `</svg>`;
}

/* The chart for one theme: the two parties' panels, drawn to one height so the scales line up. */
INS.themeChart = (terms, W, H) => {
  const names = terms.map(ti => INS.dn(ti).replace(/[“”]/g, ""));
  const labelW = Math.min(190, Math.ceil(Math.max(60, ...names.map(n => textWidth(n, LFS)))) + 16);
  return INS.PARTIES.map(p =>
    `<div class="tpanel"><h3 class="${p}">${esc(PNAME[p])}</h3>${panel(terms, p, W, H, labelW)}</div>`).join("");
};

/* The height a theme needs: enough that its names can sit apart without being pushed off the scale. */
INS.themeChartHeight = n => Math.max(250, Math.min(460, 70 + n * LGAP));

/* The themes in the order the term list gives them, each with its own term indexes. */
INS.themesOf = idx => {
  const ids = idx || INS.visibleTermIds();
  const out = [];
  ids.forEach(ti => {
    const th = INS.D.terms[ti].theme;
    const last = out[out.length - 1];
    if (last && last.theme === th) last.terms.push(ti);
    else out.push({ theme: th, terms: [ti] });
  });
  return out;
};
})();
