/* Instrument: data, state, address and statistics. Every figure is computed from data/site.json. */
(() => {
"use strict";
const INS = window.INS = {};

INS.C = { dem: "#2B64A0", rep: "#B5302A", ink: "#15191E", sec: "#56606B", muted: "#858F99", rule: "#D6DAE0", faint: "#EEF0F3", tick: "#C9CED5", page: "#FFFFFF" };
INS.YEARS = [2020, 2022, 2024, 2026];
INS.PARTIES = ["D", "R"];
INS.PNAME = { D: "Democratic", R: "Republican" };
INS.PCOL = { D: INS.C.dem, R: INS.C.rep };
INS.STATES = { AK: "Alaska", AL: "Alabama", AR: "Arkansas", AZ: "Arizona", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", IA: "Iowa", ID: "Idaho", IL: "Illinois", IN: "Indiana", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", MA: "Massachusetts", MD: "Maryland", ME: "Maine", MI: "Michigan", MN: "Minnesota", MO: "Missouri", MS: "Mississippi", MT: "Montana", NC: "North Carolina", ND: "North Dakota", NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NV: "Nevada", NY: "New York", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia", VT: "Vermont", WA: "Washington", WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming" };
/* A group under SMALL analyzed candidates is drawn muted; under TINY no share is drawn, only the count. */
INS.SMALL = 30;
INS.TINY = 10;
INS.DEFAULT_YEAR = 2026;
INS.MINUS = "−";

const $ = (s, r = document) => r.querySelector(s);
INS.$ = $;
INS.$$ = (s, r = document) => [...r.querySelectorAll(s)];
INS.esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
INS.nf = n => n.toLocaleString("en-US");
INS.slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
INS.yl = y => String(y);
/* "20260917" as "Sept. 17" (AP style), with the year when asked. */
const MONTHS = ["Jan.", "Feb.", "March", "April", "May", "June", "July", "Aug.", "Sept.", "Oct.", "Nov.", "Dec."];
INS.fmtDate = (s, withYear) => { const m = /^(\d{4})(\d\d)(\d\d)$/.exec(s); return m ? `${MONTHS[+m[2] - 1]} ${+m[3]}${withYear ? `, ${m[1]}` : ""}` : s; };
INS.isPhone = () => window.matchMedia("(max-width: 760px)").matches;
INS.prevYear = y => INS.YEARS[INS.YEARS.indexOf(y) - 1];

/* Printed figures are rounded once, from the counts, with a half rounded up. A float share such as 0.145 times 100 can fall just
   under 14.5, so nothing printed is rounded from a share. */
INS.pctN = (k, n) => Math.floor((200 * k + n) / (2 * n));
/* A whole percentage; "<1%" for a nonzero share that rounds to zero. */
INS.pctOf = (k, n) => { const r = INS.pctN(k, n); return k > 0 && r === 0 ? "<1%" : r + "%"; };
/* A difference of two shares, ka of na minus kb of nb, in points, from the counts: whole points, one decimal under one point.
   The difference is N / D exactly, so a tie such as 2.5 rounds up like any other half. */
INS.diff = (ka, na, kb, nb) => {
  const N = 100 * (ka * nb - kb * na), D = na * nb, M = INS.MINUS, a = Math.abs(N);
  const tenths = Math.floor((20 * a + D) / (2 * D)), small = tenths < 10;
  const r = small ? tenths : Math.floor((2 * a + D) / (2 * D));
  return { v: N / D, text: r === 0 ? "0" : (N > 0 ? "+" : M) + (small ? (r / 10).toFixed(1) : r), sign: r === 0 ? 0 : Math.sign(N) };
};
/* The one rule for an interval end, in points, the rule INS.diff applies to a gap: rounded once from the value, with a half
   rounded up, to a tenth when that is under one point and to a whole point from one point up, so 0.97 prints "1" and an end
   equal to the gap beside it prints as the gap does. An end that rounds to zero is "0" with no sign. `x` is a fraction. */
INS.endPts = x => {
  const a = Math.abs(x) * 100, t = Math.floor(a * 10 + 0.5);
  return { text: t === 0 ? "0" : t < 10 ? (t / 10).toFixed(1) : String(Math.floor(a + 0.5)), sign: t === 0 ? 0 : Math.sign(x) };
};
/* An end as a signed number, as the Change Interval prints it. */
INS.signedPts = x => { const e = INS.endPts(x); return (e.sign > 0 ? "+" : e.sign < 0 ? INS.MINUS : "") + e.text; };
/* An end in the gap's own notation, "D+17" or "R+3", so an interval reads like the gap it surrounds. */
INS.partyPts = x => { const e = INS.endPts(x); return e.sign > 0 ? "D+" + e.text : e.sign < 0 ? "R+" + e.text : "0"; };
/* A count of words on a site, rounded once and half up: a median of an even count can end in .5. */
INS.words = x => INS.nf(Math.floor(x + 0.5));
/* An adjusted p-value, rounded once from its unrounded value: two decimals, three below 0.01 and within 0.01 of 0.05, and more
   decimals where fewer would print a value under 0.05 as 0.05, so no printed value contradicts the cutoff. */
INS.fmtQ = q => {
  if (q < 0.001) return "<0.001";
  let d = q < 0.01 || Math.abs(q - 0.05) <= 0.01 ? 3 : 2;
  while (d < 8 && q !== 0.05 && +q.toFixed(d) === 0.05) d++;
  return q.toFixed(d);
};
/* Gaps and changes are ordered by their exact value, so equal differences keep the order of the terms. */
INS.key = v => Math.round(v * 1e9);

/* ---------- state ---------- */
const S = INS.S = {
  tab: "explorer", sub: null,
  terms: [], year: INS.DEFAULT_YEAR, f: {}, range: false,
  sort: "prom", dir: "desc", panel: null, cand: null,
  topics: new Set(),  // selected topic slugs; empty set means the All chip is on
  gridSort: "prom",  // "prom" most used in 2026 (default); "category" groups by user-facing topic; "alpha" flat A-Z; "change" biggest 2020→2026 shift
};
INS.D = null;
INS.TERM_BY_SLUG = {};
INS.GROUPS = [];
INS.DN = {};
INS.dn = i => INS.DN[INS.D.terms[i].term];
INS.tslug = i => INS.slug(INS.D.terms[i].term);

INS.buildGroups = () => {
  const states = Object.keys(INS.STATES).sort((a, b) => INS.STATES[a].localeCompare(INS.STATES[b]));
  INS.GROUPS = [
    { key: "office", label: "Office", opts: ["House", "Senate"].map(o => ({ v: o, label: o, test: c => c.office === o })) },
    { key: "inc", label: "Incumbent or Challenger", opts: [{ v: "incumbent", label: "Incumbent", test: c => c.inc === 1 }, { v: "challenger", label: "Challenger", test: c => c.inc === 0 }] },
    { key: "seat", label: "Close or Safe Seat", opts: [{ v: "close", label: "Close Seat", test: c => c.seat === "close" }, { v: "safe", label: "Safe Seat", test: c => c.seat === "safe" }] },
    { key: "won", label: "Won or Lost", opts: [{ v: "won", label: "Won", test: c => c.won === 1 }, { v: "lost", label: "Lost", test: c => c.won === 0 }] },
    { key: "state", label: "State", opts: states.map(s => ({ v: s, label: INS.STATES[s], test: c => c.state === s })) },
  ];
  INS.GROUPS.forEach(g => { S.f[g.key] = new Set(); g.byV = Object.fromEntries(g.opts.map(o => [o.v, o])); });
};

/* A candidate matches when it passes every filter group but `except`. */
INS.match = (c, except) => {
  for (const g of INS.GROUPS) {
    if (g.key === except) continue;
    const sel = S.f[g.key];
    if (sel.size && ![...sel].some(v => g.byV[v].test(c))) return false;
  }
  return true;
};
INS.filtered = () => INS.GROUPS.some(g => S.f[g.key].size);

/* ---------- address ---------- */
const FILTER_KEYS = ["office", "inc", "seat", "won", "state"];
const SORTS = ["prom", "d", "r", "gap", "dchg", "rchg", "tchg", "name"];

INS.readAddress = () => {
  const raw = location.hash.replace(/^#/, "");
  const [path, qs] = raw.split("?");
  const q = new URLSearchParams(qs || "");
  const seg = path.split("/").filter(Boolean);
  S.tab = "explorer"; S.sub = null; S.terms = [];
  if (seg[0] === "term" || seg[0] === "terms") {
    S.terms = (seg[1] || "").split(",").map(s => INS.TERM_BY_SLUG[s]).filter(i => i !== undefined);
  }
  FILTER_KEYS.forEach(k => {
    const g = INS.GROUPS.find(x => x.key === k);
    S.f[k] = new Set((q.get(k) || "").split(",").filter(v => g.byV[v]));
  });
  const y = +q.get("year");
  S.year = INS.YEARS.includes(y) ? y : INS.DEFAULT_YEAR;
  /* The possible range is drawn only when the address asks for it. */
  S.range = q.get("range") === "1";
  const so = q.get("sort");
  S.sort = SORTS.includes(so) ? so : "prom";
  S.dir = q.get("dir") === "asc" ? "asc" : "desc";
  const pm = /^([a-z0-9-]+)\.(\d{4})\.([DR])$/.exec(q.get("panel") || "");
  S.panel = pm && INS.TERM_BY_SLUG[pm[1]] !== undefined && INS.YEARS.includes(+pm[2]) ? { ti: INS.TERM_BY_SLUG[pm[1]], y: +pm[2], p: pm[3] } : null;
  S.cand = S.panel ? q.get("cand") : null;
  const topicsQ = (q.get("topics") || "").split(",").filter(Boolean);
  const known = new Set((INS.D && INS.D.topics_list || []).map(INS.slug));
  S.topics = new Set(topicsQ.filter(t => known.has(t)));
  const gs = q.get("gridSort");
  S.gridSort = ["category", "alpha", "prom", "change"].includes(gs) ? gs : "prom";
};
/* The top of the scale every chart shares: the highest share or interval drawn anywhere under the filters in force,
   rounded up to a tenth, so the charts stay comparable with one another while none is mostly empty. Recomputed
   whenever the cells are rebuilt, which is whenever a filter changes. The possible range is left out, because it is
   off by default and reaches far above the shares; a chart drawing it uses the full scale instead. */
let scaleTop = 1;
INS.setScaleTop = () => {
  let m = 0;
  INS.D.terms.forEach((t, ti) => INS.YEARS.forEach(y => INS.PARTIES.forEach(p => {
    const c = INS.cell(ti, y, p);
    if (c.n < INS.TINY) return;
    if (c.share > m) m = c.share;
    if (c.ci && c.ci[1] > m) m = c.ci[1];
  })));
  scaleTop = Math.min(1, Math.max(0.5, Math.ceil(m * 10 + 0.001) / 10));
};
INS.scaleTop = () => scaleTop;

INS.showRange = () => S.range;

INS.addressFor = (o = {}) => {
  const terms = o.terms !== undefined ? o.terms : S.terms;
  const q = new URLSearchParams();
  let path = "";
  if (terms.length === 1) path = "/term/" + INS.tslug(terms[0]);
  else if (terms.length > 1) path = "/terms/" + terms.map(INS.tslug).join(",");
  else path = "/";
  {
    const f = o.f || S.f;
    FILTER_KEYS.forEach(k => { if (f[k].size) q.set(k, [...f[k]].join(",")); });
    const y = o.year || S.year;
    if (y !== INS.DEFAULT_YEAR) q.set("year", y);
    const sort = o.sort || S.sort;
    if (sort !== "prom" || (o.dir || S.dir) === "asc") { q.set("sort", sort); q.set("dir", o.dir || S.dir); }
    const range = o.range !== undefined ? o.range : S.range;
    if (range && terms.length === 1) q.set("range", "1");
    const panel = o.panel !== undefined ? o.panel : S.panel;
    if (panel) {
      q.set("panel", `${INS.tslug(panel.ti)}.${panel.y}.${panel.p}`);
      const cand = o.cand !== undefined ? o.cand : S.cand;
      if (cand) q.set("cand", cand);
    }
    const topics = o.topics !== undefined ? o.topics : S.topics;
    if (topics && topics.size) q.set("topics", [...topics].join(","));
    const gs = o.gridSort !== undefined ? o.gridSort : S.gridSort;
    if (gs && gs !== "prom") q.set("gridSort", gs);
  }
  const s = q.toString().replace(/%2C/g, ",");
  return "#" + path + (s ? "?" + s : "");
};

/* ---------- statistics ---------- */
let CELLS = {}, GAPQ = {};

/* Candidates by year and party under every filter. */
INS.buildCells = () => {
  CELLS = {};
  INS.YEARS.forEach(y => INS.PARTIES.forEach(p => { CELLS[y + p] = { n: 0, K: 0, B: 0, counts: new Int32Array(INS.D.terms.length), an: [], all: [] }; }));
  INS.D.candidates.forEach(c => {
    if (!INS.match(c)) return;
    const g = CELLS[c.year + c.party];
    g.B++; g.all.push(c);
    if (c.status !== "no website") g.K++;
    if (c.status === "analyzed") { g.n++; g.an.push(c); c.terms.forEach(t => g.counts[t]++); }
  });
  INS.setScaleTop();
};
INS.group = (y, p) => CELLS[y + p];

/* One term, year and party: the share, its 95% interval, and the possible range among candidates with a known website,
   with the range's ends as whole percentages rounded once from the counts. */
INS.cell = (ti, y, p) => {
  const g = CELLS[y + p];
  const n = g.n, k = g.counts[ti];
  const K = g.K, B = g.B;
  const share = n ? k / n : null;
  return { ti, y, p, n, k, K, B, share, ci: n ? wilson(k, n) : null, range: n && K ? [k / K, (k + K - n) / K] : null, rangePct: n && K ? [INS.pctN(k, K), INS.pctN(k + K - n, K)] : null };
};

/* Candidate names: entities decoded; the sort key is the last name (suffixes such as Jr. do not count). */
INS.cname = n => n.replace(/&#39;|&apos;/g, "’").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const SUFFIX = /^(jr|sr|ii|iii|iv)\.?$/i, PARTICLE = new Set(["van", "von", "de", "del", "della", "di", "da", "la", "le", "du", "der", "den", "ten", "ter", "dos"]);
const COMPOUND = ["watson coleman", "wasserman schultz", "jackson lee", "blunt rochester", "cortez masto", "gluesenkamp perez", "herrera beutler", "mcmorris rodgers"];
INS.nameKey = n => {
  const w = INS.cname(n).replace(/,/g, " ").split(/\s+/).filter(Boolean);
  while (w.length > 1 && SUFFIX.test(w[w.length - 1])) w.pop();
  let i = w.length - 1;
  if (i > 0 && COMPOUND.includes((w[i - 1] + " " + w[i]).toLowerCase())) i--;
  while (i > 1 && PARTICLE.has(w[i - 1].toLowerCase())) i--;
  return [w.slice(i).join(" "), w.slice(0, i).join(" ")];
};
INS.byName = (a, b) => {
  const A = INS.nameKey(a.name), B = INS.nameKey(b.name), c = { sensitivity: "base" };
  return A[0].localeCompare(B[0], "en", c) || A[1].localeCompare(B[1], "en", c) || (a.id < b.id ? -1 : 1);
};

/* The gap between the parties for one term and year. The adjusted p-value exists only for all candidates, and is the value
   before the results table rounds it. */
INS.gapOf = (d, r, ti, y) => {
  if (!d || !r || !d.n || !r.n) return null;
  const g = { v: d.share - r.share, ci: newcombe(d.k, d.n, r.k, r.n), q: null, small: d.n < INS.SMALL || r.n < INS.SMALL, tiny: d.n < INS.TINY || r.n < INS.TINY };
  if (!INS.filtered()) {
    const row = GAPQ[INS.D.terms[ti].term + "|" + y];
    if (row !== undefined) g.q = row;
  }
  return g;
};

/* The move of one party's share from the previous cycle, from the unrounded shares, with the interval of the difference.
   There is none for the first cycle or where either group is under ten analyzed candidates. */
INS.changeOf = (ti, y, p) => {
  const py = INS.prevYear(y);
  if (!py) return null;
  const a = INS.cell(ti, y, p), b = INS.cell(ti, py, p);
  if (a.n < INS.TINY || b.n < INS.TINY) return null;
  const ci = newcombe(a.k, a.n, b.k, b.n);
  return { v: a.share - b.share, ci, from: py, weak: ci[0] <= 0 && ci[1] >= 0, a, b };
};

/* The move of both parties' candidates together: the pooled share against the previous cycle's. None where any of the
   four groups is under ten analyzed candidates. */
INS.changeTotal = (ti, y) => {
  const py = INS.prevYear(y);
  if (!py) return null;
  const cs = INS.PARTIES.map(p => [INS.cell(ti, y, p), INS.cell(ti, py, p)]);
  if (cs.some(([a, b]) => a.n < INS.TINY || b.n < INS.TINY)) return null;
  const ka = cs[0][0].k + cs[1][0].k, na = cs[0][0].n + cs[1][0].n, kb = cs[0][1].k + cs[1][1].k, nb = cs[0][1].n + cs[1][1].n;
  const ci = newcombe(ka, na, kb, nb);
  return { v: ka / na - kb / nb, ci, from: py, weak: ci[0] <= 0 && ci[1] >= 0, a: { k: ka, n: na, share: ka / na }, b: { k: kb, n: nb, share: kb / nb } };
};

INS.init = async () => {
  const [site, disp] = await Promise.all([fetch("data/site.json").then(r => r.json()), fetch("terms-display.json").then(r => r.json())]);
  INS.D = site;
  INS.DN = disp.terms;
  /* The newest saved copy among the 2026 sites analyzed is how far the 2026 figures reach. */
  INS.through2026 = site.candidates.filter(c => c.year === 2026 && c.status === "analyzed").reduce((m, c) => (c.latest > m ? c.latest : m), "");
  site.terms.forEach((t, i) => { INS.TERM_BY_SLUG[INS.slug(t.term)] = i; });
  site.gaps.forEach(g => { GAPQ[g.term + "|" + g.year] = g.q_benjamini_hochberg_exact; });
  /* Lookup for the extracted-candidates search pool: a typed term that resolves here draws its own chart. */
  INS.SEARCH = new Map((site.search_index || []).map(e => [e.term.toLowerCase(), e]));
  INS.buildGroups();
};
})();
