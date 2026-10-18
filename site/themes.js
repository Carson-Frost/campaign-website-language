/* Instrument: the track drawn on a theme row. One term, both parties, every cycle on one 0 to 100% scale, so a
   reader meets a term's whole history without choosing a cycle. The faint marks are the earlier cycles and the
   open mark is the newest; the rule between the two newest marks is the gap the row's Gap column names. The row's
   values stay HTML buttons beside the track, so the track itself carries no target and no label. */
(() => {
"use strict";
const { PNAME, YEARS, TINY, esc, yl } = INS;

const drawn = c => c && c.n >= TINY;

/* Every cycle's cell for one term, by party, as the track draws them. */
INS.trackData = ti => {
  const out = {};
  INS.PARTIES.forEach(p => { out[p] = YEARS.map(y => INS.cell(ti, y, p)); });
  return out;
};
INS.trackHasData = data => INS.PARTIES.some(p => data[p].some(drawn));

/* The track for one term. W and H are the drawing's own box; the scale runs the full width, so every row of a
   theme shares one scale and a reader compares down the column. */
INS.track = (ti, W, H) => {
  const data = INS.trackData(ti);
  const cy = H / 2, R = 4.6, r = 2.4;
  const x = v => R + (W - 2 * R) * v;
  const parts = [];
  const last = p => { const d = data[p]; for (let i = d.length - 1; i >= 0; i--) if (drawn(d[i])) return d[i]; return null; };
  const ld = last("D"), lr = last("R");
  /* The gap: the distance between the parties' newest drawn shares, under the marks. */
  if (ld && lr) {
    const a = x(Math.min(ld.share, lr.share)), b = x(Math.max(ld.share, lr.share));
    if (b - a > 1) parts.push(`<line class="tgap" x1="${a.toFixed(1)}" y1="${cy}" x2="${b.toFixed(1)}" y2="${cy}"/>`);
  }
  INS.PARTIES.forEach(p => {
    const cells = data[p], pts = [];
    cells.forEach(c => { if (drawn(c)) pts.push(x(c.share)); });
    if (pts.length > 1) parts.push(`<line class="ttrail ${p}" x1="${pts[0].toFixed(1)}" y1="${cy}" x2="${pts[pts.length - 1].toFixed(1)}" y2="${cy}"/>`);
    const newest = last(p);
    cells.forEach(c => {
      if (!drawn(c)) return;
      const isNew = c === newest;
      parts.push(`<circle class="tdot ${p}${isNew ? " now" : ""}" cx="${x(c.share).toFixed(1)}" cy="${cy}" r="${isNew ? R : r}"><title>${esc(`${PNAME[c.p]}, ${yl(c.y)} ${INS.pctOf(c.k, c.n)}`)}</title></circle>`);
    });
  });
  /* The track repeats the row's own label and values, so it is not read a second time. */
  return `<svg class="track" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">${parts.join("")}</svg>`;
};

/* The scale drawn once at the head of a theme, in the track's own column. */
INS.trackScale = (W, H) => {
  const R = 4.6, x = v => R + (W - 2 * R) * v / 100;
  return `<svg class="tscale" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">`
    + [0, 50, 100].map(v => `<text class="tt" x="${x(v).toFixed(1)}" y="${H - 3}" text-anchor="${v === 0 ? "start" : v === 100 ? "end" : "middle"}">${v}%</text>`).join("")
    + `</svg>`;
};

/* The themes in the order the term list gives them, each with its own term indexes. */
INS.themesOf = idx => {
  const ids = idx || INS.D.terms.map((t, i) => i);
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
