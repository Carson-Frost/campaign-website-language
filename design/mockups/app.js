"use strict";
// Mockup of the public site: overview, process path, explorer, coverage, related work, data.
// Every figure is read or computed from data/site.json, which build_data.py derives from the study.

const YEARS = [2020, 2022, 2024, 2026];
const PARTY = {
  D: { name: "Democratic", pl: "Democrats" },
  R: { name: "Republican", pl: "Republicans" },
};
const STATES = { AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming" };
const FEW = 10; // below this many analyzed candidates a share is shown as a count

let D = null;
const excerptCache = {};
const ui = { filtersOpen: false, showAll: false, sampleSeed: {} };

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nf = (n) => Number(n).toLocaleString("en-US");
const pct = (x) => `${Math.round(x * 100)}%`;
const pts = (x) => `${Math.round(Math.abs(x) * 100)}`;
const signed = (x) => (Math.round(x * 100) === 0 ? "0" : `${x < 0 ? "−" : "+"}${pts(x)}`);
const qfmt = (q) => (q < 0.001 ? "adjusted p < 0.001" : `adjusted p = ${q.toFixed(q < 0.01 ? 3 : 2)}`);
const race = (c) => (c.office === "Senate" ? `${c.state} Senate` : `${c.state}-${c.district === "00" ? "AL" : c.district}`);
const dateFmt = (s) => (s ? new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "");

// Wilson score interval (Brown, Cai and DasGupta 2001), as tools/inference.py computes it.
function wilson(k, n, z = 1.959964) {
  if (!n) return [0, 1];
  const p = k / n, d = 1 + (z * z) / n, c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}
// Newcombe's hybrid score interval for a difference of two proportions (method 10).
function newcombe(k1, n1, k2, n2) {
  const p1 = k1 / n1, p2 = k2 / n2, [l1, u1] = wilson(k1, n1), [l2, u2] = wilson(k2, n2), d = p1 - p2;
  return [d - Math.sqrt((p1 - l1) ** 2 + (u2 - p2) ** 2), d + Math.sqrt((u1 - p1) ** 2 + (p2 - l2) ** 2)];
}
function rng(seed) { // mulberry32
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function pick(arr, n, seed) {
  const r = rng(seed), a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}

// ---------- routing ----------
function route() {
  const h = location.hash.replace(/^#\/?/, "");
  const [path, q] = h.split("?");
  const parts = (path || "overview").split("/");
  return { view: parts[0] || "overview", sub: parts[1] || "", p: new URLSearchParams(q || "") };
}
function go(view, params, sub) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) if (v !== undefined && v !== null && v !== "" && v !== "all") q.set(k, v);
  const s = q.toString();
  location.hash = `#/${view}${sub ? "/" + sub : ""}${s ? "?" + s : ""}`;
}

// ---------- data access ----------
function index() {
  D.termIx = Object.fromEntries(D.terms.map((t, i) => [t.term, i]));
  D.gapOf = {}; for (const g of D.gaps) D.gapOf[`${g.term}|${g.year}`] = g;
  D.classOf = {}; for (const c of D.classes) D.classOf[c.term] = c;
  D.precOf = {}; for (const p of D.precision) D.precOf[p.term] = p;
  for (const c of D.candidates) c.T = new Set(c.terms || []);
  D.states = [...new Set(D.candidates.map((c) => c.state))].sort((a, b) => (STATES[a] || a).localeCompare(STATES[b] || b));
}

function filtersFrom(p) {
  return {
    t: (p.get("t") || "").split(",").filter((x) => x !== "").map(Number).filter((i) => i >= 0 && i < D.terms.length),
    y: p.get("y") || "all", o: p.get("o") || "all", s: p.get("s") || "all", i: p.get("i") || "all",
    seat: p.get("seat") || "all", r: p.get("r") || "all", ret: p.get("ret") || "all",
    sel: p.get("sel") || "", c: p.get("c") || "", panel: p.get("panel") || "",
  };
}
function paramsOf(f, over = {}) {
  const g = { ...f, ...over };
  return { t: g.t.join(","), y: g.y, o: g.o, s: g.s, i: g.i, seat: g.seat, r: g.r, ret: g.ret, sel: g.sel, c: g.c, panel: g.panel };
}
const BLANK = { t: [], y: "all", o: "all", s: "all", i: "all", seat: "all", r: "all", ret: "all", sel: "", c: "", panel: "" };
const isPlain = (f) => f.o === "all" && f.s === "all" && f.i === "all" && f.seat === "all" && f.r === "all" && f.ret === "all";
const yearsOf = (f) => (f.y === "all" ? YEARS : [Number(f.y)]).filter((y) => !(f.r !== "all" && y === 2026));

function keep(c, f) {
  if (f.o !== "all" && c.office !== f.o) return false;
  if (f.s !== "all" && c.state !== f.s) return false;
  if (f.i === "inc" && !c.inc) return false;
  if (f.i === "non" && c.inc) return false;
  if (f.seat !== "all" && c.seat !== f.seat) return false;
  if (f.r === "won" && c.won !== 1) return false;
  if (f.r === "lost" && c.won !== 0) return false;
  if (f.ret === "yes" && !c.returning) return false;
  return true;
}
function ballot(f, year, party) {
  return D.candidates.filter((c) => c.year === year && (!party || c.party === party) && keep(c, f));
}
function group(f, year, party, ti) {
  const b = ballot(f, year, party);
  const an = b.filter((c) => c.status === "analyzed");
  const web = b.filter((c) => c.status !== "no website").length;
  const k = an.filter((c) => c.T.has(ti)).length, n = an.length;
  const [lo, hi] = wilson(k, n);
  return { ballot: b.length, web, n, k, share: n ? k / n : null, lo, hi, rlo: web ? k / web : null, rhi: web ? (k + web - n) / web : null };
}

// ---------- shared pieces ----------
const mk = (p, hollow) => `<span class="mk ${p}${hollow ? " hollow" : ""}" aria-hidden="true"></span>`;
const provTag = `<span class="tag prov" data-tip="2026 comes from Common Crawl's crawls of January to September 2026. These figures will change after election day.">Provisional</span>`;
const explTag = `<span class="tag expl" data-tip="Chosen after looking at all 57 terms, so it describes this data. The tests fixed in advance have not been run yet.">Exploratory</span>`;
const fewTag = (n) => `<span class="tag few" data-tip="Only ${n} analyzed candidate${n === 1 ? "" : "s"}. One candidate moves this share by ${n ? Math.round(100 / n) : 100} points.">Few candidates</span>`;
const ticks = (labels = ["0%", "25%", "50%", "75%", "100%"]) => `<div class="ticks">${labels.map((l, i) => `<span style="left:${(i * 100) / (labels.length - 1)}%">${l}</span>`).join("")}</div>`;

function track(g, p, prov, ghost) {
  if (!g.n) return `<div class="trk"><span class="nil">No analyzed candidates</span></div>`;
  const L = (x) => `${(x * 100).toFixed(2)}%`;
  const tip = `${PARTY[p].pl}: ${g.k} of ${g.n} analyzed used it (${pct(g.share)}). 95% interval ${pct(g.lo)} to ${pct(g.hi)}. Possible range for all ${g.web} with a known website: ${pct(g.rlo)} to ${pct(g.rhi)}.`;
  return `<div class="trk">
    <span class="rng" style="left:${L(g.rlo)};width:${L(g.rhi - g.rlo)}"></span>
    <span class="ci ${p}" style="left:${L(g.lo)};width:${L(g.hi - g.lo)}"></span>
    ${ghost != null ? `<span class="ghost ${p}" style="left:${L(ghost)}"></span>` : ""}
    <span class="dot ${p}${prov ? " hollow" : ""}" style="left:${L(g.share)}" tabindex="0" role="img" aria-label="${esc(tip)}" data-tip="${esc(tip)}"></span>
  </div>`;
}
function valText(g, withRange = true) {
  if (!g.n) return `<span>${g.ballot ? `${g.ballot} on the ballot, none analyzed` : "None on the ballot"}</span>`;
  if (g.n < FEW) return `<b>${g.k} of ${g.n}</b>${fewTag(g.n)}`;
  return `<b>${pct(g.share)}</b>${g.k} of ${g.n}${withRange ? ` <span class="muted">· range ${pct(g.rlo)}–${pct(g.rhi)}</span>` : ""}`;
}
function legendHTML(prov) {
  return `<div class="legend">
    <span class="key">${mk("D")} Democrats</span><span class="key">${mk("R")} Republicans</span>
    <span class="key"><span class="ci"></span> 95% interval</span>
    <span class="key wrap"><span class="band"></span> Possible range if every candidate not analyzed used it, or none did</span>
    ${prov ? `<span class="key">${mk("D", 1)}${mk("R", 1)} 2026, provisional</span>` : ""}
  </div>`;
}

// ---------- overview ----------
const FEATURED = [
  ["working families", "Democrats used it more in every year, and both parties used it far more in 2026.", "Seven 2026 Republican sites use it only in the name of a tax bill, the Working Families Tax Cut."],
  ["inflation", "Rare in 2020. In 2022 and 2024 about four in ten Republicans used it, against one in six Democrats.", "Mentions of the Inflation Reduction Act are not counted."],
  ["billionaires", "Under one in ten Democrats used it through 2024 and 28 percent did in 2026, while Republicans almost never used it.", ""],
  ["reproductive freedom / rights", "Rose from 14 percent of Democrats in 2020 to 52 percent in 2024, and almost no Republican used it.", ""],
  ["freedom", "Republicans used it more in 2020 and 2022. In 2024 the parties were even, at 53 percent each.", "17 of 20 matches checked by hand were the right sense."],
  ["artificial intelligence", "Used by 4 percent or fewer in both parties before 2026, then 15 percent of Democrats and 9 percent of Republicans.", ""],
];

function lineCard(term) {
  const W = 320, H = 150, l = 30, r = 54, t = 10, b = 22, max = 0.6;
  const x = (y) => l + 14 + ((y - 2020) / 6) * (W - l - r - 14);
  const y = (v) => t + (1 - v / max) * (H - t - b);
  const rows = YEARS.map((yr) => D.gapOf[`${term}|${yr}`]);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(`Share of candidates using ${term}, 2020 to 2026: ` + rows.map((g) => `${g.year} Democrats ${pct(g.dem_share)}, Republicans ${pct(g.rep_share)}`).join("; "))}">`;
  for (const v of [0, 0.2, 0.4, 0.6]) s += `<line x1="${l}" x2="${W - r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)" stroke-width="1"/><text x="${l - 6}" y="${y(v) + 4}" text-anchor="end" font-size="10" fill="var(--ink-3)">${v * 100}%</text>`;
  for (const yr of YEARS) s += `<text x="${x(yr)}" y="${H - 6}" text-anchor="middle" font-size="10" fill="var(--ink-3)">${yr}</text>`;
  for (const [p, key, col] of [["D", "dem", "var(--dem)"], ["R", "rep", "var(--rep)"]]) {
    const pt = rows.map((g) => [x(g.year), y(g[`${key}_share`])]);
    for (const g of rows) s += `<line x1="${x(g.year)}" x2="${x(g.year)}" y1="${y(g[`${key}_low`])}" y2="${y(g[`${key}_high`])}" stroke="${col}" stroke-width="2" opacity="0.35"/>`;
    s += `<polyline points="${pt.slice(0, 3).map((q) => q.join(",")).join(" ")}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round"/>`;
    s += `<line x1="${pt[2][0]}" y1="${pt[2][1]}" x2="${pt[3][0]}" y2="${pt[3][1]}" stroke="${col}" stroke-width="2" stroke-dasharray="3 3"/>`;
    rows.forEach((g, i) => {
      const [cx, cy] = pt[i], prov = g.year === 2026, tip = `${PARTY[p].pl} ${g.year}: ${g[`${key}_using`]} of ${g[`${key}_analyzed`]} (${pct(g[`${key}_share`])})`;
      s += p === "D"
        ? `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${prov ? "#fff" : col}" stroke="${prov ? col : "#fff"}" stroke-width="2" data-tip="${esc(tip)}"/>`
        : `<rect x="${cx - 4.5}" y="${cy - 4.5}" width="9" height="9" rx="1" fill="${prov ? "#fff" : col}" stroke="${prov ? col : "#fff"}" stroke-width="2" data-tip="${esc(tip)}"/>`;
    });
  }
  // End labels, nudged apart when they would touch.
  let yd = y(rows[3].dem_share), yr = y(rows[3].rep_share);
  if (Math.abs(yd - yr) < 13) { const m = (yd + yr) / 2, up = yd < yr ? -1 : 1; yd = m + up * 6.5; yr = m - up * 6.5; }
  s += `<text x="${W - r + 9}" y="${yd + 4}" font-size="11" fill="var(--ink)" font-weight="600">D ${pct(rows[3].dem_share)}</text>`;
  s += `<text x="${W - r + 9}" y="${yr + 4}" font-size="11" fill="var(--ink)" font-weight="600">R ${pct(rows[3].rep_share)}</text>`;
  return s + "</svg>";
}

function overview() {
  const cov = D.coverage, sum = (k) => cov.reduce((a, r) => a + r[k], 0);
  const steps = [
    [sum("candidates"), "on the ballot", "Democratic and Republican candidates for the House and Senate"],
    [sum("website_known"), "with a known website", "From Federal Election Commission filings, then Ballotpedia, an online election encyclopedia"],
    [sum("any_text"), "saved by Common Crawl", "A nonprofit web archive saved a copy between January 1 and election day"],
    [sum("analyzed"), "analyzed", "At least 100 words of campaign text"],
  ];
  const top = steps[0][0];
  const dist = D.distinctive.filter((r) => r.year === 2024 && r.rank <= 6);
  return `<div class="page">
  <div class="hero">
    <div>
      <div class="eyebrow">Congressional campaign websites, 2020 to 2026</div>
      <h1>Which words do candidates for Congress use on their campaign websites?</h1>
      <p class="lead">This study counted 57 words and phrases, such as “working families” and “border,” on the saved
      campaign websites of Democratic and Republican candidates for the House and Senate in 2020, 2022, 2024 and 2026.
      It reports the share of each party's candidates who used each one, and how that changed.</p>
      <div class="btns"><a class="btn" href="#/explore">Explore the 57 terms</a><a class="btn ghost" href="#/method">How the study was made</a></div>
    </div>
    <div class="funnel" aria-labelledby="fun-h">
      <h2 id="fun-h">From the ballot to the analysis</h2>
      ${steps.map(([n, t, d]) => `<div class="frow"><span class="n num">${nf(n)}</span><span class="t">${t}</span><span class="d">${d}</span><span class="fbar"><i style="width:${(n / top) * 100}%"></i></span></div>`).join("")}
      <p class="foot">Each count is a candidate-year: one candidate in one election. The study's code ran the same steps
      on all ${nf(top)}. <a href="#/method">See each step</a></p>
    </div>
  </div>

  <section class="block" aria-labelledby="f-h">
    <div class="headrow"><h2 id="f-h">Six changes in the words candidates used</h2>${explTag}</div>
    <p class="sub">Each chart shows the share of a party's analyzed candidates whose website used the term at least once.
    These six were picked after looking at all 57 terms, so they are exploratory. The tests planned before any result
    was seen have not been run yet.</p>
    <div class="legend" style="margin-bottom:14px"><span class="key">${mk("D")} Democrats</span><span class="key">${mk("R")} Republicans</span><span class="key">${mk("D", 1)}${mk("R", 1)} 2026, provisional</span><span class="key"><span class="ci" style="opacity:.4"></span> 95% interval, the range likely by chance</span></div>
    <div class="cards">${FEATURED.map(([t, say, note]) => `<a class="card" href="#/explore?t=${D.termIx[t]}">
      <h3>“${esc(t)}”</h3><p class="say">${say}</p>${lineCard(t)}
      ${note ? `<p class="cnote">${esc(note)}</p>` : ""}<span class="more">Open in the explorer</span></a>`).join("")}</div>
  </section>

  <section class="block notes" aria-label="How to read these numbers">
    <div class="note"><h3>2026 is not finished</h3><p>The 2026 figures come from Common Crawl's crawls of January to
    September 2026 and will change after election day. They are drawn hollow wherever they appear.</p></div>
    <div class="note"><h3>About seven in ten candidates are analyzed</h3><p>In a given year, 66 to 77 percent of each
    party's candidates on the ballot are analyzed, and they are more often incumbents and winners.
    <a href="#/coverage">Who is in the data</a></p></div>
    <div class="note"><h3>Candidates not analyzed are left out</h3><p>A share counts analyzed candidates only. A candidate whose
    site could not be analyzed is left out of every share.</p></div>
  </section>

  <section class="block" aria-labelledby="d-h">
    <div class="headrow"><h2 id="d-h">Words that set the parties apart in 2024</h2>${explTag}</div>
    <p class="sub">Beyond the 57 terms, the study ranked every word and two- or three-word phrase by how much more one
    party's candidates used it, counting each candidate's site once. Each difference was measured with Welch's t-test, a
    comparison of two group averages, following Lijffijt and coauthors (2016).</p>
    <div class="two">${["Democratic", "Republican"].map((pty) => `<div class="tw"><table><caption class="sr">Used more by ${PARTY[pty[0]].pl}</caption><thead><tr><th colspan="2"><span class="key">${mk(pty[0])} Used more by ${PARTY[pty[0]].pl}</span></th><th class="r">Democrats</th><th class="r">Republicans</th></tr></thead><tbody>
      ${["word", "phrase"].map((kind) => `<tr class="grp"><td colspan="4">${kind === "word" ? "Single words" : "Phrases"}</td></tr>` + dist.filter((r) => r.favors === pty && r.kind === kind).map((r) => `<tr><td class="r muted">${r.rank}</td><td>${esc(r.term)}</td><td class="r">${r.dem_candidates_using}</td><td class="r">${r.rep_candidates_using}</td></tr>`).join("")).join("")}
    </tbody></table></div>`).join("")}</div>
    <p class="small muted" style="margin-top:8px">The numbers are how many analyzed sites used each one, out of 316 Democratic and 335 Republican sites in 2024. The full lists for every year are in the <a href="#/data">downloads</a>.</p>
  </section>
</div>`;
}

// ---------- method path ----------
const STEPS = [
  { id: "ballot", n: 1, short: "The ballot", title: "Start from every candidate on the ballot", out: (c) => true },
  { id: "website", n: 2, short: "Websites", title: "Find each campaign's website", out: (c) => c.status !== "no website" },
  { id: "saved", n: 3, short: "Saved copies", title: "Get the copies Common Crawl saved", out: (c) => !["no website", "no saved text"].includes(c.status) },
  { id: "text", n: 4, short: "Text", title: "Pull out the text", out: (c) => !["no website", "no saved text"].includes(c.status) },
  { id: "screen", n: 5, short: "Screen", title: "Keep campaign text of at least 100 words", out: (c) => c.status === "analyzed" },
  { id: "terms", n: 6, short: "Terms", title: "Look for the 57 terms", out: (c) => c.status === "analyzed" },
  { id: "shares", n: 7, short: "Shares", title: "Turn counts into shares, with their uncertainty", out: (c) => c.status === "analyzed" },
];
// Why a candidate-year was excluded, said about the saved page and not about the candidate.
const WHY = { spam: "the saved pages were spam", "hosting error or parked domain": "the saved pages were error or parked pages",
  "no candidate name or campaign words": "the saved pages were about something else", "placeholder text": "the site was an unfinished template",
  "site-builder page titles only": "the site held only page titles" };
const SRC = { fec_form1: "FEC Form 1", ballotpedia_link: "Ballotpedia link", ballotpedia_quote: "Ballotpedia text", "": "None found" };
const STATUS = { analyzed: "Analyzed", "no website": "No website found", "no saved text": "No saved copy in the window", "under 100 words": "Under 100 words", excluded: "Excluded" };

function flow(total, inN, outN, why, note) {
  const W = (n) => `${(n / total) * 100}%`;
  const lost = inN - outN, earlier = total - inN;
  return `<div class="flow" role="img" aria-label="${nf(inN)} came into this step, ${nf(outN)} went on, ${nf(lost)} left here.">
    <div class="counts"><span><b class="num">${nf(inN)}</b> in</span><span><b class="num">${nf(outN)}</b> went on</span>${lost ? `<span><b class="num">${nf(lost)}</b> left at this step</span>` : `<span class="muted">No one leaves at this step</span>`}</div>
    <div class="track"><i class="kept${lost || earlier ? "" : " all"}" style="width:${W(outN)}"></i>${lost ? `<i class="lost" style="width:${W(lost)}"></i>` : ""}${earlier ? `<i class="gone" style="width:${W(earlier)}"></i>` : ""}</div>
    <div class="why"><span><span class="sw" style="background:var(--ink-2)"></span>Went on to the next step</span>${lost ? `<span><span class="sw" style="background:repeating-linear-gradient(135deg,#fff 0 3px,var(--line-2) 3px 5px);outline:1px solid var(--line-2)"></span>Left here${why ? ": " + why : ""}</span>` : ""}${earlier ? `<span><span class="sw" style="background:var(--wash)"></span>Left at an earlier step</span>` : ""}</div>
    ${lost && note ? `<p class="small muted" style="margin:6px 0 0">Candidates who leave at any step are left out of every share.</p>` : ""}
  </div>`;
}

function sampleTable(step, input, cols, isLost, n = 6) {
  const seed = ui.sampleSeed[step] || 7;
  const lost = input.filter(isLost), kept = input.filter((c) => !isLost(c));
  let rows = pick(kept, lost.length ? n - 1 : n, seed + 1);
  if (lost.length) rows.splice(Math.floor(rng(seed + 2)() * n), 0, pick(lost, 1, seed + 3)[0]);
  return `<div class="sample">
    <div class="cap"><span>${n} of the ${nf(input.length)} rows the program wrote at this step, picked at random. Every row went through the same rule.</span>
    <button class="linkbtn" type="button" data-resample="${step}">Show ${n} other rows</button></div>
    <div class="tw"><table><thead><tr>${cols.map(([h, , r]) => `<th${r ? ' class="r"' : ""}>${h}</th>`).join("")}</tr></thead>
    <tbody>${rows.map((c) => `<tr class="${isLost(c) ? "drop" : ""}">${cols.map(([, f, r]) => `<td${r ? ' class="r"' : ""}>${f(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>
  </div>`;
}

function method(r) {
  const C = D.candidates, total = C.length;
  const s2 = C.filter((c) => c.status !== "no website"), s3 = s2.filter((c) => c.status !== "no saved text"), s5 = C.filter((c) => c.status === "analyzed");
  const short = C.filter((c) => c.status === "under 100 words").length, exc = C.filter((c) => c.status === "excluded").length;
  const who = (c) => `<span class="nm">${esc(c.name)} <span class="muted">(${c.party})</span></span>`;
  const cnt = (k) => D.candidates.filter((c) => c.status === k).length;
  const inf = D.gapOf["inflation|2022"], infB = D.bounds.find((b) => b.term === "inflation" && b.year === 2022 && b.party_group === "Republican");
  const themes = {}; D.terms.forEach((t) => (themes[t.theme] = themes[t.theme] || []).push(t.term));
  const on = r.sub || "ballot";
  const rail = `<nav class="rail" aria-label="Steps"><ol>
    <li class="group">Automated steps</li>
    ${STEPS.map((s) => `<li><a href="#/method/${s.id}" class="${on === s.id ? "on" : ""}"><span>${s.n}. ${s.short}</span><span class="num">${nf(C.filter(s.out).length)}</span></a></li>`).join("")}
    <li class="group">Checks</li>
    <li><a href="#/method/people" class="${on === "people" ? "on" : ""}"><span>Checked by hand</span></a></li>
    <li><a href="#/method/choices" class="${on === "choices" ? "on" : ""}"><span>Two choices, tested</span></a></li>
  </ol></nav>`;
  const basis = (src, std) => `<aside class="basis"><h4>Source</h4><p>${src}</p><h4>Standard it follows</h4><p>${std}</p></aside>`;
  const step = (s, body, side) => `<section class="step" id="${s.id}"><div class="eyebrow">Step ${s.n} of 7 · run by the study's code on every candidate-year</div><h2>${s.title}</h2><div class="cols"><div>${body}</div>${side}</div></section>`;

  return `<div class="page">
  <div class="prose">
    <div class="eyebrow">How the study was made</div>
    <h1>One program, the same steps for every candidate</h1>
    <p class="lead">Every number on this site comes from one program run over the full list of
    ${nf(total)} candidate-years. Each step took everything that came out of the step before it, applied one written
    rule to each candidate-year, and passed on the ones that met it. Running it again on the same saved pages gives
    the same result.</p>
  </div>
  <div class="path">${rail}<div>
  ${step(STEPS[0], `<p>The program read the lists of general-election candidates kept by Ballotpedia, an online encyclopedia of U.S. elections, for every House and Senate race in the four election years, and kept the Democratic and Republican candidates. Write-in candidates are left out.
    A candidate-year is one candidate in one election, so a candidate who ran in 2022 and 2024 counts twice.</p>
    ${flow(total, total, total)}
    ${sampleTable("ballot", C, [["Year", (c) => c.year], ["Candidate", who], ["Race", race], ["Incumbent", (c) => (c.inc ? "Yes" : "No")]], () => false)}`,
    basis("Ballotpedia's candidate lists. For 2020 to 2024 the program compared them with the Federal Election Commission's (FEC) lists, and they agree within five major-party candidates a year. The FEC has no 2026 list yet.",
      "One website per general-election candidate, House and Senate, as in Druckman, Kifer and Parkin (2009)."))}
  ${step(STEPS[1], `<p>Every campaign committee registers with the Federal Election Commission (FEC) on Form 1, which asks
    for the committee's official website. The program took that address first and, when there was none, the campaign
    site Ballotpedia linked or quoted. Social media pages, donation pages and official House or Senate sites were skipped.</p>
    ${flow(total, total, s2.length, "no website found", true)}
    ${sampleTable("website", C, [["Year", (c) => c.year], ["Candidate", who], ["Website", (c) => esc(c.site) || "None found"], ["Found in", (c) => SRC[c.src]]], (c) => c.status === "no website")}`,
    basis("FEC Form 1 filings; Ballotpedia candidate pages.", "Federal election rules require Form 1 to list the committee's website (11 CFR 102.2). The Library of Congress builds its archive of election websites from the same field."))}
  ${step(STEPS[2], `<p>Common Crawl is a nonprofit that visits a large part of the web several times a year and publishes
    what it saves. For each website the program searched every crawl from January 1 of the election year to election day.
    It took the homepage and up to three linked pages, preferring issue and biography pages, and used the latest saved
    copy of each page.</p>
    ${flow(total, s2.length, s3.length, "no copy saved in the window")}
    <p class="small">This is the largest loss in the study. Common Crawl saves only part of each site and favors
    well-linked ones, so poorly linked sites were less likely to be saved. For 2026 the crawls run to
    September, so 2026 is a snapshot in the middle of the campaign. ${provTag}</p>
    ${sampleTable("saved", s2, [["Year", (c) => c.year], ["Candidate", who], ["Website", (c) => esc(c.site)], ["Pages", (c) => (c.pages || "–"), 1], ["Latest copy", (c) => dateFmt(c.latest) || "None in the window"]], (c) => c.status === "no saved text")}`,
    basis("Common Crawl's crawls of each election year: eight in 2020, five in 2022, nine in 2024 and nine so far in 2026.",
      "No published standard sets the window. Hilbig's 2026 dataset of candidate websites also spans the election year. The 60-day and 120-day windows are compared under <a href=\"#/method/choices\">Two choices, tested</a>."))}
  ${step(STEPS[3], `<p>A web page holds menus, footers and code around its main text. trafilatura, an open-source tool
    built for this, extracted the main text of each saved page. The program then dropped paragraphs of page code,
    gambling spam, placeholder Latin and Spanish (the term list is English), and paragraphs repeated within the same site.</p>
    ${flow(total, s3.length, s3.length)}
    ${sampleTable("text", s3, [["Year", (c) => c.year], ["Candidate", who], ["Words kept", (c) => nf(c.words), 1], ["Words dropped", (c) => nf(c.dropped), 1]], () => false)}`,
    basis("The saved pages from step 3.", "trafilatura scored best overall in an independent comparison of text extractors on eight datasets (Bevendorff and coauthors, 2023)."))}
  ${step(STEPS[4], `<p>A site needed at least 100 words of campaign text after cleaning. The program also flagged sites
    that were not campaign content: parked domains (addresses for sale or showing a placeholder page), hosting error pages, spam, and text with neither the candidate's
    name nor any campaign word.</p>
    ${flow(total, s3.length, s5.length, `${short} under 100 words, ${exc} not campaign content`)}
    ${sampleTable("screen", s3, [["Year", (c) => c.year], ["Candidate", who], ["Words", (c) => nf(c.words), 1], ["Result", (c) => (c.status === "excluded" ? `Excluded: ${WHY[c.why] || esc(c.why)}` : STATUS[c.status])]], (c) => c.status !== "analyzed")}`,
    basis("The cleaned text from step 4.", "No standard length exists for political text. The 100-word minimum is the cutoff used to build LIWC-22, a widely used word-count dictionary (Boyd and coauthors, 2022), and the study lists it as a limitation. At 50 or 200 words no share moves by more than 2 points."))}
  ${step(STEPS[5], `<p>The 57 terms, in five themes, were fixed before any result was examined. Each is a written
    pattern, so “working families” also matches “working family.” A candidate-year uses a term if the pattern matches
    at least once anywhere in its text. How many times it appears does not matter, so a long site does not count
    for more than a short one.</p>
    <div class="themes">${Object.entries(themes).map(([th, ts]) => `<div><b>${th} (${ts.length})</b>${ts.slice(0, 5).map(esc).join(", ")}${ts.length > 5 ? ", …" : ""}</div>`).join("")}</div>
    ${flow(total, s5.length, s5.length)}
    ${sampleTable("terms", s5, [["Year", (c) => c.year], ["Candidate", who], ["Terms used", (c) => c.terms.length, 1], ["Some of them", (c) => c.terms.slice(0, 3).map((i) => esc(D.terms[i].term)).join(", ") || "None"]], () => false)}`,
    basis("The analyzed text from step 5.", "Counting whether a word occurs in a document, not how often, is a standard way to represent text (Grimmer and Stewart, 2013; King, Lam and Roberts, 2017)."))}
  ${step(STEPS[6], `<p>A party's share is the number of its analyzed candidates who used a term, divided by the number
    analyzed. Three more numbers say how far to trust it.</p>
    <p><b>The 95 percent interval</b> is the span the share would likely fall in by chance among candidates like these.
    <b>The gap</b> between the parties gets its own interval and a test of whether it could arise by chance (Fisher's exact
    test). That test's p-value is adjusted because all 57 terms were tested at once. <b>The possible range</b> covers the candidates who were not analyzed: it runs from the
    share if none of them used the term to the share if all of them did.</p>
    <div class="example"><b>Worked example.</b> In 2022, ${inf.rep_using} of ${inf.rep_analyzed} analyzed Republican
    candidates used “inflation,” a share of ${pct(inf.rep_share)} with an interval of ${pct(inf.rep_low)} to ${pct(inf.rep_high)}.
    Among the ${infB.with_known_website} Republicans with a known website, the true share could lie anywhere from
    ${pct(infB.low_among_known_website)} to ${pct(infB.high_among_known_website)}. Among Democrats the share was ${pct(inf.dem_share)}.
    The gap of ${pts(inf.gap_dem_minus_rep)} points has an interval of ${pts(inf.gap_high)} to ${pts(inf.gap_low)} points and an ${qfmt(inf.q_benjamini_hochberg)}.</div>
    <p class="small" style="margin:18px 0 6px">The explorer draws the same figures like this:</p>
    <div class="drawn">${legendHTML(false)}<div class="axis" style="margin-top:10px"><span></span>${ticks()}<span class="valh"></span></div>
    <div class="yr"><div class="yh">“inflation,” 2022${gapLine(BLANK, 2022, D.termIx.inflation, group(BLANK, 2022, "D", D.termIx.inflation), group(BLANK, 2022, "R", D.termIx.inflation))}</div>
    ${["D", "R"].map((p) => { const g = group(BLANK, 2022, p, D.termIx.inflation); return `<div class="prow" style="cursor:default"><span class="who">${mk(p)} ${PARTY[p].pl}</span>${track(g, p)}<span class="val">${valText(g)}</span></div>`; }).join("")}</div></div>`,
    basis("The term counts from step 6.", "Wilson intervals for shares (Brown, Cai and DasGupta, 2001); Newcombe's interval for a gap (1998); Fisher's exact test; p-values adjusted by Benjamini and Hochberg (1995), with the stricter Benjamini and Yekutieli version beside them; worst-case ranges after Manski (1988)."))}

  <section class="step" id="people"><div class="eyebrow">Checks · done by a person on samples and flagged cases</div>
    <h2>What was checked by hand</h2>
    <div class="cols"><div class="people">
      <p>No person read or classified the sites one by one. One person checked the program's output in two places, both
      on samples or on cases the program flagged.</p>
      <h3>Do the matches mean what they should?</h3>
      <p>For each of the 17 terms behind the study's main findings, 20 matches were drawn at random and read in context. Sixteen terms had
      18 or more of 20 in the intended sense. “Freedom” had 17, because of award and group names such as the Medal of
      Freedom. Six patterns were narrowed after this check and read again on a fresh sample.</p>
      <h3>Are the excluded sites really not campaign sites?</h3>
      <p>Each of the ${cnt("excluded")} candidate-years the screen excluded was read to confirm it held a parked domain,
      spam, an error page or another site's text. One flagged site was read and kept.</p>
      <h3>Not done yet</h3>
      <p>The samples of matches were read by one person. A second person will code a new sample of at least 50 matches per
      term, so the two can be compared.</p>
    </div>${basis("The match samples and the excluded sites, both published with the data.", "Checking a term list by reading its matches in the texts being studied (Grimmer and Stewart, 2013). No source sets the sample size, so 20 per term is listed as a limitation.")}</div>
  </section>

  <section class="step" id="choices"><div class="eyebrow">Checks · two settings that have no published standard</div>
    <h2>Two choices, tested</h2>
    <div id="choices-body">${choicesBody(r.p)}</div>
  </section>
  </div></div>
</div>`;
}

function choicesBody(p) {
  const ti = Number(p.get("ct") ?? D.termIx["Second Amendment"]);
  const set = p.get("cs") || "year";
  const same = p.get("same") === "1";
  const term = D.terms[ti].term;
  const val = (y, pty) => {
    if (["60", "120", "year"].includes(set)) {
      const w = set === "year" ? "year" : Number(set);
      return D.windows.find((r) => r.window === w && r.sample === (same ? "common" : "all") && r.term === term && r.year === y && r.party_group === PARTY[pty].name);
    }
    return D.min_words.find((r) => r.min_words === Number(set) && r.term === term && r.year === y && r.party_group === PARTY[pty].name);
  };
  const base = (y, pty) => D.windows.find((r) => r.window === "year" && r.sample === (same ? "common" : "all") && r.term === term && r.year === y && r.party_group === PARTY[pty].name);
  let big = 0;
  const rows = YEARS.map((y) => {
    const prov = y === 2026;
    return `<div class="yr"><div class="yh">${y}${prov ? provTag : ""}</div>${["D", "R"].map((pty) => {
      const v = val(y, pty), b = base(y, pty);
      const g = { n: v.candidates_analyzed, k: v.candidates_using, share: v.share, web: v.candidates_analyzed, rlo: v.share, rhi: v.share };
      [g.lo, g.hi] = wilson(g.k, g.n);
      big = Math.max(big, Math.abs(v.share - b.share));
      const moved = Math.round((v.share - b.share) * 100);
      return `<div class="prow" style="cursor:default"><span class="who">${mk(pty, prov)} ${PARTY[pty].pl}</span>${track(g, pty, prov, set === "year" || set === "100" ? null : b.share)}<span class="val"><b>${pct(v.share)}</b>${v.candidates_using} of ${v.candidates_analyzed}${set === "year" || set === "100" ? "" : ` <span class="muted">· ${moved === 0 ? "no change" : (moved > 0 ? "+" : "−") + Math.abs(moved) + " pts"}</span>`}</span></div>`;
    }).join("")}</div>`;
  }).join("");
  const opt = (v, l) => `<option value="${v}"${set === v ? " selected" : ""}>${l}</option>`;
  return `<div>
    <p class="prose">The study's main results use text saved at any time in the election year and a 100-word minimum. Neither choice has
    a published standard, so each was rerun with other settings. Change one and watch the shares move. A dashed outline
    marks the main result.</p>
    <div class="settings static" style="grid-template-columns:repeat(3,minmax(0,1fr));margin:14px 0 6px">
      <div class="field"><label for="ct">Term</label><select id="ct" data-choice="ct">${D.terms.map((t, i) => `<option value="${i}"${i === ti ? " selected" : ""}>${esc(t.term)}</option>`).join("")}</select></div>
      <div class="field"><label for="cs">Setting</label><select id="cs" data-choice="cs">
        <optgroup label="Window of saved text">${opt("year", "Election year (main)")}${opt("120", "Last 120 days")}${opt("60", "Last 60 days")}</optgroup>
        <optgroup label="Minimum length">${opt("50", "50 words")}${opt("100", "100 words (main)")}${opt("200", "200 words")}</optgroup></select></div>
      <div class="field"><label for="same">Candidates</label><select id="same" data-choice="same" ${["60", "120", "year"].includes(set) ? "" : "disabled"}><option value="0"${same ? "" : " selected"}>All analyzed under this setting</option><option value="1"${same ? " selected" : ""}>Only those analyzed under every window</option></select></div>
    </div>
    <div class="axis" style="margin-top:12px"><span></span>${ticks()}<span class="valh"></span></div>
    ${rows}
    <p class="small" style="margin-top:10px">${set === "year" || set === "100" ? "This is the main setting." : `Largest move for “${esc(term)}” at this setting: ${Math.round(big * 100)} points.`}
    Across all terms, the 50 and 200 word minimums move no share by more than 2 points. The 60-day window held only one
    crawl in 2022, so 2022 text was shorter and 2022 shares were lower under it.</p>
  <aside class="basis" style="margin-top:18px"><h4>Window</h4><p>Druckman, Kifer and Parkin studied sites in the last ten days before the election, CampaignView (a hand-collected set of House primary platforms) one week before each primary, and Hilbig's dataset the whole election year. The study uses the window that saves the most sites.</p><h4>Minimum length</h4><p>LIWC-22, a word-count dictionary, was built from texts of at least 100 words.</p></aside></div>`;
}

// ---------- explorer ----------
function explore(r) {
  const f = filtersFrom(r.p);
  const yrs = yearsOf(f);
  const sel = (id, lab, opts, val, tip) => `<div class="field"><label for="${id}"${tip ? ` data-tip="${esc(tip)}"` : ""}>${lab}</label><select id="${id}" data-f="${id}" data-default="${val === "all" ? 1 : 0}">${opts.map(([v, l]) => `<option value="${v}"${String(val) === String(v) ? " selected" : ""}>${l}</option>`).join("")}</select></div>`;
  const active = [f.y !== "all" && (f.y === "2026" ? "2026, provisional" : f.y), f.o !== "all" && f.o, f.s !== "all" && STATES[f.s], f.i !== "all" && (f.i === "inc" ? "Incumbents" : "Not incumbents"), f.seat !== "all" && `${f.seat} seats`, f.r !== "all" && (f.r === "won" ? "Won" : "Lost"), f.ret !== "all" && "Returning"].filter(Boolean);
  const settings = `<div class="settings${ui.filtersOpen || f.panel ? " open" : ""}" id="settings">
    <div class="field terms"><span class="lab" id="terms-lab">Terms</span><div class="chips" role="group" aria-labelledby="terms-lab">
      ${f.t.map((i) => `<span class="chip">${esc(D.terms[i].term)}<button type="button" data-drop="${i}" aria-label="Remove ${esc(D.terms[i].term)}">×</button></span>`).join("")}
      <select data-add="1" aria-label="Add a term"><option value="">${f.t.length ? "Add a term" : "Choose a term"}</option>${Object.entries(D.terms.reduce((a, t, i) => ((a[t.theme] = a[t.theme] || []).push([t.term, i]), a), {})).map(([th, ts]) => `<optgroup label="${th}">${ts.filter(([, i]) => !f.t.includes(i)).map(([t, i]) => `<option value="${i}">${esc(t)}</option>`).join("")}</optgroup>`).join("")}</select>
    </div></div>
    ${sel("y", "Year", [["all", "All four"], ...YEARS.map((y) => [y, y])], f.y)}
    ${sel("o", "Office", [["all", "Both"], ["House", "House"], ["Senate", "Senate"]], f.o)}
    ${sel("s", "State", [["all", "All states"], ...D.states.map((s) => [s, STATES[s] || s])], f.s)}
    ${sel("i", "Incumbent", [["all", "Any"], ["inc", "Incumbents"], ["non", "Not incumbents"]], f.i)}
    ${sel("seat", "Seat", [["all", "Any seat"], ["close", "Close seat"], ["safe", "Safe seat"]], f.seat, "A close seat is one where the Democratic presidential candidate won 45 to 55 percent of the votes cast for the two major parties.")}
    ${sel("r", "Result", [["all", "Any result"], ["won", "Won"], ["lost", "Lost"]], f.r)}
    ${sel("ret", "Candidates", [["all", "Everyone"], ["yes", "Returning"]], f.ret, `Returning: the ${nf(D.returning_people)} candidates analyzed in two or more election years. Comparing them across years shows change within the same people.`)}
  </div>`;

  // Counts for the match line, over the years shown.
  const B = yrs.flatMap((y) => ballot(f, y));
  const an = B.filter((c) => c.status === "analyzed").length;
  const notes = [];
  if (f.seat !== "all") {
    const unk = yrs.flatMap((y) => ballot({ ...f, seat: "all" }, y)).filter((c) => c.seat === null).length;
    if (unk) notes.push(`Seat lean is not known for ${nf(unk)} matching candidate-years (2020 House seats and 2024 House seats in nine redrawn states), so they are left out.`);
  }
  if (f.r !== "all" && (f.y === "all" || f.y === "2026")) notes.push("2026 results are not known yet, so 2026 is left out.");
  const matchline = `<div class="matchline" aria-live="polite">
    <span><span class="count num${an ? "" : " zero"}">${nf(an)}</span> analyzed candidate-years match</span>
    <span>${nf(B.length)} on the ballot · ${nf(B.length - an)} not analyzed</span>
    ${active.length ? `<span class="muted">${active.map(esc).join(" · ")}</span>` : ""}
    ${!isPlain(f) || f.y !== "all" ? `<a class="reset" href="#/explore${f.t.length ? "?t=" + f.t.join(",") : ""}">Clear filters</a>` : ""}
  </div>${notes.map((n) => `<p class="small muted" style="margin:6px 2px 0">${n}</p>`).join("")}`;

  let main;
  if (!f.t.length) main = allTerms(f, yrs);
  else if (!an && B.length >= 0 && yrs.length && yrs.every((y) => ballot(f, y).filter((c) => c.status === "analyzed").length === 0)) main = emptyState(f, B);
  else if (f.t.length === 1) main = oneTerm(f, yrs);
  else main = manyTerms(f, yrs);

  const list = f.t.length && an ? candidateList(f, yrs) : "";
  const side = sidePanel(f, yrs);
  return `<div class="page" style="max-width:1360px">
    <div class="xhead"><div><div class="eyebrow">Explorer</div><h1 style="font-size:2rem">Which candidates used which words</h1>
    <p>Pick one or more of the 57 terms, then narrow the candidates. Shares count analyzed candidates only. Candidates who
    were not analyzed are left out of the shares and listed with the reason.</p></div>
    <button class="btn ghost filters-btn" type="button" data-toggle-filters aria-expanded="${ui.filtersOpen || f.panel ? "true" : "false"}" aria-controls="settings">Filters${active.length ? ` (${active.length})` : ""}</button></div>
    ${settings}${matchline}
    <div class="xgrid"><div class="xmain">${main}${list}</div><div class="side">${side}</div></div>
  </div>`;
}

function termHead(ti) {
  const t = D.terms[ti], cl = D.classOf[t.term], pr = D.precOf[t.term];
  const by = cl.favors ? PARTY[cl.favors[0]].pl : "";
  const cls = {
    "split, still": `From 2020 to 2024, ${by} used it more in every election, and neither party's use changed clearly.`,
    "split, moving": `From 2020 to 2024, ${by} used it more in every election, and use changed within a party.`,
    "not consistently split, moving": "From 2020 to 2024 the parties were not apart in every election, and use changed within a party.",
    "not consistently split, still": "From 2020 to 2024 the parties were not apart in every election, and neither party's use changed clearly.",
  }[cl.class];
  const cav = { inflation: "Mentions of the Inflation Reduction Act are not counted.", "working families": "In 2026, 7 of the 104 Republican sites that use it do so only in the name of a tax bill, the Working Families Tax Cut; without them the share is 31 percent.", freedom: "Matches checked by hand were the right sense 17 times in 20, below the study's 90 percent mark. The misses were award and group names." }[t.term];
  return `<div class="headrow"><h2>“${esc(t.term)}”</h2><span class="muted small">${esc(t.theme)}</span>${explTag}</div>
    <p class="desc">${cls}</p>${pr || cav ? `<p class="cav">${pr ? `Matches checked by hand: ${pr.intended} of ${pr.coded} in the intended sense.` : ""}${cav ? ` ${cav}` : ""}</p>` : ""}`;
}

function gapLine(f, y, ti, gd, gr) {
  if (!gd.n || !gr.n) return "";
  const d = gd.share - gr.share, [lo, hi] = newcombe(gd.k, gd.n, gr.k, gr.n);
  const off = isPlain(f) ? D.gapOf[`${D.terms[ti].term}|${y}`] : null;
  const tested = off ? ` · ${qfmt(off.q_benjamini_hochberg)}` : " · not tested for filtered groups";
  if (lo > 0) return `<span class="gap">Democrats higher by ${pts(d)} points (interval ${pts(lo)} to ${pts(hi)})${tested}</span>`;
  if (hi < 0) return `<span class="gap">Republicans higher by ${pts(d)} points (interval ${pts(hi)} to ${pts(lo)})${tested}</span>`;
  return `<span class="gap">No clear gap: Democrats minus Republicans is ${signed(d)} points (interval ${signed(lo)} to ${signed(hi)})${tested}</span>`;
}

function oneTerm(f, yrs) {
  const ti = f.t[0];
  const prov = yrs.includes(2026);
  return `<div class="panel">${termHead(ti)}
    ${legendHTML(prov)}
    <div class="axis" style="margin-top:14px"><span></span>${ticks()}<span class="valh">Share of analyzed candidates</span></div>
    ${yrs.map((y) => {
      const gd = group(f, y, "D", ti), gr = group(f, y, "R", ti), pv = y === 2026;
      return `<div class="yr"><div class="yh">${y}${pv ? provTag : ""}${gapLine(f, y, ti, gd, gr)}</div>
        ${[["D", gd], ["R", gr]].map(([p, g]) => `<div class="prow${f.sel === `${y}-${p}` ? " sel" : ""}" data-sel="${y}-${p}" role="button" tabindex="0" aria-label="Show the ${PARTY[p].name} candidates of ${y}"><span class="who">${mk(p, pv)} ${PARTY[p].pl}</span>${track(g, p, pv)}<span class="val">${valText(g)}</span></div>`).join("")}
      </div>`;
    }).join("")}
    <p class="small muted" style="margin:12px 0 0">Select a row to list the candidates behind it.</p>
  </div>`;
}

function manyTerms(f, yrs) {
  const prov = yrs.includes(2026);
  if (yrs.length === 1) {
    const y = yrs[0], pv = y === 2026;
    return `<div class="panel"><div class="headrow"><h2>${f.t.length} terms in ${y}</h2>${pv ? provTag : ""}${explTag}</div>
      <p class="desc">Each row shows both parties on one scale. Select a row to list the candidates.</p>${legendHTML(pv)}
      <div class="axis" style="margin-top:14px"><span></span>${ticks()}<span class="valh">Democrats · Republicans</span></div>
      ${f.t.map((ti) => {
        const gd = group(f, y, "D", ti), gr = group(f, y, "R", ti);
        return `<div class="yr"><div class="yh">“${esc(D.terms[ti].term)}”${gapLine(f, y, ti, gd, gr)}</div>
          ${[["D", gd], ["R", gr]].map(([p, g]) => `<div class="prow${f.sel === `${y}-${p}` ? " sel" : ""}" data-sel="${y}-${p}" role="button" tabindex="0"><span class="who">${mk(p, pv)} ${PARTY[p].pl}</span>${track(g, p, pv)}<span class="val">${valText(g)}</span></div>`).join("")}</div>`;
      }).join("")}</div>`;
  }
  return `<div class="panel"><div class="headrow"><h2>${f.t.length} terms, ${yrs[0]} to ${yrs[yrs.length - 1]}</h2>${explTag}</div>
    <p class="desc">Each cell shows both parties on a scale from 0 to 100 percent, Democrats above and Republicans below. Select a cell to list that year's candidates. Choose a single term to see the possible ranges.</p>
    <div class="legend"><span class="key">${mk("D")} Democrats</span><span class="key">${mk("R")} Republicans</span><span class="key"><span class="ci"></span> 95% interval</span>${prov ? `<span class="key">${mk("D", 1)}${mk("R", 1)} 2026, provisional</span>` : ""}</div>
    <div class="mx" style="--cols:${yrs.length};margin-top:12px"><span class="h yearh"></span>${yrs.map((y) => `<span class="h yearh">${y}${y === 2026 ? provTag : ""}</span>`).join("")}
    ${f.t.map((ti) => `<span class="t">“${esc(D.terms[ti].term)}”</span>${yrs.map((y) => {
      const gd = group(f, y, "D", ti), gr = group(f, y, "R", ti), pv = y === 2026;
      const cell = (g, p) => (g.n ? `<span class="ci ${p}" style="left:${g.lo * 100}%;width:${(g.hi - g.lo) * 100}%"></span><span class="dot ${p}${pv ? " hollow" : ""}" style="left:${g.share * 100}%" data-tip="${esc(`${PARTY[p].pl} ${y}: ${g.k} of ${g.n} (${pct(g.share)})`)}"></span>` : "");
      const v = (g) => (!g.n ? "–" : g.n < FEW ? `${g.k}/${g.n}` : pct(g.share));
      return `<div class="c" data-year="${y}" data-sel="${y}-D" role="button" tabindex="0"><div class="trk two-row">${cell(gd, "D")}${cell(gr, "R")}</div><div class="v"><span>D ${v(gd)}</span><span>R ${v(gr)}</span></div></div>`;
    }).join("")}`).join("")}</div></div>`;
}

function allTerms(f, yrs) {
  const y = yrs.length === 1 ? yrs[0] : 2024, pv = y === 2026;
  const themes = {};
  D.terms.forEach((t, i) => (themes[t.theme] = themes[t.theme] || []).push(i));
  return `<div class="panel"><div class="headrow"><h2>Choose a term to start</h2></div>
    <p class="desc">Or pick one from this list of all 57, which shows each party's share in ${y}${yrs.length === 1 ? "" : " (choose a year above to change it)"}.
    The longer the band between the two marks, the larger the gap.</p>
    <div class="legend" style="margin-bottom:10px"><span class="key">${mk("D", pv)} Democrats</span><span class="key">${mk("R", pv)} Republicans</span>${pv ? provTag : ""}<span class="muted">Scale 0 to 100 percent</span></div>
    <div class="tl">${Object.entries(themes).map(([th, ix]) => `<div class="th"><h3>${th}</h3>${ix.map((i) => {
      const gd = group(f, y, "D", i), gr = group(f, y, "R", i);
      if (!gd.n && !gr.n) return `<a href="#/explore?t=${i}"><span>${esc(D.terms[i].term)}</span><span class="muted small">No analyzed candidates</span></a>`;
      const a = Math.min(gd.share ?? gr.share, gr.share ?? gd.share), b = Math.max(gd.share ?? gr.share, gr.share ?? gd.share);
      const tip = `${D.terms[i].term}, ${y}: Democrats ${gd.n ? pct(gd.share) : "none analyzed"}, Republicans ${gr.n ? pct(gr.share) : "none analyzed"}`;
      return `<a href="#/explore?${new URLSearchParams({ ...Object.fromEntries(Object.entries(paramsOf(f, { t: [i], sel: "", c: "" })).filter(([, v]) => v && v !== "all")) }).toString()}" data-tip="${esc(tip)}"><span>${esc(D.terms[i].term)}</span><span class="trk two-row"><span class="lnk" style="left:${a * 100}%;width:${(b - a) * 100}%"></span>${gd.n ? `<span class="dot D${pv ? " hollow" : ""}" style="left:${gd.share * 100}%"></span>` : ""}${gr.n ? `<span class="dot R${pv ? " hollow" : ""}" style="left:${gr.share * 100}%"></span>` : ""}</span></a>`;
    }).join("")}</div>`).join("")}</div></div>`;
}

function emptyState(f, B) {
  const why = {}; B.forEach((c) => (why[STATUS[c.status]] = (why[STATUS[c.status]] || 0) + 1));
  return `<div class="panel">${f.t.length === 1 ? termHead(f.t[0]) : ""}<div class="empty">
    <h3>No analyzed candidates match these filters</h3>
    <p>${B.length ? `${nf(B.length)} candidate-year${B.length === 1 ? " is" : "s are"} on the ballot with these filters, and none was analyzed: ${Object.entries(why).map(([k, v]) => `${v} ${k.toLowerCase()}`).join(", ")}. No share can be given, and none of them is counted as not using a term.` : "No Democratic or Republican candidate on the ballot matches these filters."}</p>
    <p style="margin:0">Try removing a filter. <a href="#/explore${f.t.length ? "?t=" + f.t.join(",") : ""}">Clear all filters</a></p>
  </div>${B.length ? `<div class="tw" style="margin-top:14px"><table><thead><tr><th>Year</th><th>Candidate</th><th>Race</th><th>Status</th></tr></thead><tbody>${B.map((c) => `<tr class="na"><td>${c.year}</td><td>${esc(c.name)} (${c.party})</td><td>${race(c)}</td><td>${STATUS[c.status]}</td></tr>`).join("")}</tbody></table></div>` : ""}</div>`;
}

function candidateList(f, yrs) {
  let [y, p] = (f.sel || "").split("-");
  y = Number(y); if (!yrs.includes(y)) { y = yrs[yrs.length - 1] === 2026 && yrs.length > 1 ? 2024 : yrs[yrs.length - 1]; p = ""; }
  if (!f.sel) return `<div class="panel clist" style="margin-top:16px"><h2 style="font-size:1.1rem">The candidates behind each share</h2><p class="desc" style="margin-bottom:0">Select a row or cell above to list the candidates it counts, and the ones who could not be analyzed.</p></div>`;
  p = p || "D";
  const B = ballot(f, y, p);
  const ti = f.t;
  const used = (c) => ti.filter((i) => c.T.has(i)).length;
  const order = (c) => (c.status !== "analyzed" ? 3 : used(c) ? 1 : 2);
  B.sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name));
  const an = B.filter((c) => c.status === "analyzed");
  let show = ui.showAll ? B : B.slice(0, 12);
  const chosen = B.find((c) => c.id === f.c);
  if (chosen && !show.includes(chosen)) show = [...show.slice(0, 11), chosen];
  const one = ti.length === 1;
  const t1 = D.terms[ti[0]].term;
  const head = `<div class="chead"><h2>${PARTY[p].name} candidates, ${y}</h2>
    <span class="small muted">${nf(B.length)} on the ballot · ${nf(an.length)} analyzed${one ? ` · ${an.filter((c) => c.T.has(ti[0])).length} used “${esc(t1)}”` : ""}</span></div>
    <div class="tabs" role="group" aria-label="Party and year">${["D", "R"].map((q) => `<button type="button" data-sel="${y}-${q}" aria-pressed="${q === p}">${mk(q, y === 2026)} ${PARTY[q].pl}</button>`).join("")}
    ${yrs.length > 1 ? yrs.map((yy) => `<button type="button" data-sel="${yy}-${p}" aria-pressed="${yy === y}">${yy}</button>`).join("") : ""}</div>`;
  const cell = (c) => (c.status !== "analyzed" ? `<span class="no">Not analyzed: ${STATUS[c.status].toLowerCase()}</span>` : ti.map((i) => (c.T.has(i) ? `<span class="yes">Yes</span>` : `<span class="no">No</span>`)).join(" · "));
  const cardUse = (c) => (c.status !== "analyzed" ? `Not analyzed: ${STATUS[c.status].toLowerCase()}` : ti.map((i) => `${c.T.has(i) ? "<b>Used</b>" : "Did not use"} “${esc(D.terms[i].term)}”`).join(" · "));
  const termH = one ? `Uses “${esc(t1)}”` : ti.map((i) => esc(D.terms[i].term)).join(" · ");
  const res = (c) => (c.won === null ? (y === 2026 ? "Not yet" : "–") : c.won ? "Won" : "Lost");
  return `<div class="panel clist" style="margin-top:16px" id="clist">${head}
    <div class="tw ctable"><table><thead><tr><th>Candidate</th><th>Race</th><th>Incumbent</th><th>Result</th><th>${termH}</th></tr></thead><tbody>
    ${show.map((c) => `<tr class="${c.status !== "analyzed" ? "na" : "click"}${f.c === c.id ? " sel" : ""}"${c.status === "analyzed" ? ` data-c="${c.id}" tabindex="0"` : ""}><td>${esc(c.name)}</td><td>${race(c)}</td><td>${c.inc ? "Yes" : "No"}</td><td>${res(c)}</td><td>${cell(c)}</td></tr>`).join("")}
    </tbody></table></div>
    <div class="ccards">${show.map((c) => `<button type="button" class="ccard${c.status !== "analyzed" ? " na" : ""}${f.c === c.id ? " sel" : ""}"${c.status === "analyzed" ? ` data-c="${c.id}"` : " disabled"}><b>${esc(c.name)}</b><span>${race(c)}</span><span class="st">${c.inc ? "Incumbent" : "Not incumbent"} · ${res(c)}</span><span class="st">${cardUse(c)}</span></button>`).join("")}</div>
    ${B.length > 12 ? `<p style="margin:10px 0 0"><button class="linkbtn" type="button" data-showall>${ui.showAll ? "Show fewer" : `Show all ${nf(B.length)}`}</button></p>` : ""}
  </div>`;
}

function sidePanel(f, yrs) {
  const c = f.c && D.candidates.find((x) => x.id === f.c);
  let ex = "";
  if (c) {
    const lines = f.t.map((i) => {
      const e = excerptCache[i]?.[c.id];
      if (!excerptCache[i]) { loadExcerpts(i); return `<p class="muted small">Loading…</p>`; }
      return e ? `<blockquote>…${esc(e[0].replace(/�/g, " "))}<mark>${esc(e[1])}</mark>${esc(e[2].replace(/�/g, " "))}…</blockquote>` : `<p class="small muted">“${esc(D.terms[i].term)}” does not appear in the saved text.</p>`;
    }).join("");
    ex = `<div class="panel excerpt" id="excerpt"><h3>${esc(c.name)} <span class="muted" style="font-weight:400">(${c.party})</span></h3>
      <dl class="facts"><dt>Race</dt><dd>${race(c)}, ${c.year}${c.year === 2026 ? " " + provTag : ""}</dd><dt>Incumbent</dt><dd>${c.inc ? "Yes" : "No"}</dd>
      <dt>Website</dt><dd>${esc(c.site)}</dd><dt>Saved copy</dt><dd>${c.pages} pages, latest ${dateFmt(c.latest)}</dd><dt>Text analyzed</dt><dd>${nf(c.words)} words</dd></dl>
      ${lines}
      <p class="small muted">Short excerpts only, from the copy Common Crawl saved. The site's full text is not published.</p>
      <p class="small" style="margin:10px 0 0"><b>Uses ${c.terms.length} of the 57 terms:</b> ${c.terms.map((i) => esc(D.terms[i].term)).join(", ")}.</p>
    </div>`;
  } else if (f.sel && f.t.length) {
    ex = `<div class="panel"><h3>Read where a term appears</h3><p class="small" style="margin:0">Select an analyzed candidate in the list to see a short excerpt from their saved site with the match highlighted.</p></div>`;
  }
  if (c) return ex;
  return `${ex}<div class="panel"><h3>Reading the numbers</h3>
    <p class="small">A <b>share</b> is the analyzed candidates who used a term at least once, out of all analyzed. The
    <b>95% interval</b> is the span it would likely fall in by chance. The <b>possible range</b> shows where the share could
    lie among every candidate with a known website, if those not analyzed had all used the term or none had.</p>
    <p class="small">The <b>adjusted p-value</b> accounts for testing all 57 terms, and is given only for the full groups.
    Every result here is <b>exploratory</b>.</p>
    <p class="small" style="margin:0"><a href="#/method/shares">How these are computed</a></p></div>`;
}

function loadExcerpts(i) {
  if (excerptCache[i] === null) return;
  excerptCache[i] = null;
  fetch(`data/excerpts/${i}.json`).then((r) => r.json()).then((j) => { excerptCache[i] = j; render(); });
}

// ---------- coverage ----------
function coverage() {
  const rows = [];
  for (const y of YEARS) for (const p of ["D", "R"]) {
    const C = D.candidates.filter((c) => c.year === y && c.party === p);
    const n = (s) => C.filter((c) => c.status === s).length;
    rows.push({ y, p, tot: C.length, an: n("analyzed"), short: n("under 100 words") + n("excluded"), nosave: n("no saved text"), noweb: n("no website") });
  }
  const sel = D.selection;
  const meas = [["incumbent_share", "Incumbents"], ["won_share", "Won their race"], ["close_seat_share", "Ran in a close seat"]];
  return `<div class="page">
    <div class="prose"><div class="eyebrow">Who is in the data</div><h1>Which candidates the study could analyze</h1>
    <p class="lead">A candidate is analyzed only if the program found their website, Common Crawl saved a copy during the
    election year, and the copy held at least 100 words of campaign text. About seven in ten candidates made it, and they
    are more often incumbents, winners and candidates in close seats than the rest.</p></div>

    <section class="block"><h2>Coverage by year and party</h2>
    <p class="sub">Each bar is every candidate of one party on the ballot in one year.</p>
    <div class="legend" style="margin-bottom:12px"><span class="key"><span class="mk s-an" style="border-radius:2px"></span>Analyzed</span><span class="key"><span class="mk s-short" style="border-radius:2px"></span>Too short or not campaign text</span><span class="key"><span class="mk s-nosave" style="border-radius:2px"></span>No saved copy in the window</span><span class="key"><span class="mk s-noweb" style="border-radius:2px"></span>No website found</span></div>
    <div class="cov">${rows.map((r) => `<span class="lab2"><span class="key">${mk(r.p, r.y === 2026)} ${r.y} ${PARTY[r.p].pl}</span></span>
      <span class="bar" role="img" aria-label="${r.y} ${PARTY[r.p].pl}: ${r.an} analyzed, ${r.short} too short or excluded, ${r.nosave} no saved copy, ${r.noweb} no website, of ${r.tot}">${[["s-an", r.an], ["s-short", r.short], ["s-nosave", r.nosave], ["s-noweb", r.noweb]].filter(([, v]) => v).map(([k, v]) => `<i class="${k}" style="width:${(v / r.tot) * 100}%" data-tip="${v} of ${r.tot}"></i>`).join("")}</span>
      <span class="num small"><b>${pct(r.an / r.tot)}</b> · ${r.an} of ${r.tot}</span>`).join("")}</div>
    <p class="small muted" style="margin-top:10px">2026 is provisional: its window runs to election day, and the crawls so far end in September.</p></section>

    <section class="block"><h2 id="sel-h">How analyzed candidates differ</h2>
    <p class="sub">Analyzed candidates are more often incumbents and winners, and more often ran in close seats, which
    tilts the results toward established and competitive campaigns. Wins are not shown for 2026 because those elections
    have not been held.</p>
    <div class="legend" style="margin-bottom:12px"><span class="key"><span class="mk" style="background:var(--ink);border-radius:50%"></span>Analyzed</span><span class="key"><span class="mk" style="border:2px solid var(--ink-3);border-radius:50%;background:#fff"></span>Not analyzed</span></div>
    <div class="two">${["Democratic", "Republican"].map((pty) => `<div class="panel"><h3 style="font-family:var(--sans);font-size:1rem;font-weight:650;margin-bottom:8px"><span class="key">${mk(pty[0])} ${PARTY[pty[0]].pl}</span></h3>
      <div class="axis" style="--lab:52px;--val:120px"><span></span>${ticks()}<span></span></div>
      ${meas.map(([k, lab]) => `<div style="margin-top:10px"><div class="small" style="font-weight:600">${lab}</div>${YEARS.map((y) => {
        const a = sel.find((s) => s.year === y && s.party_group === pty && s.group === "analyzed"), b = sel.find((s) => s.year === y && s.party_group === pty && s.group === "not analyzed");
        if (a[k] == null || (k === "close_seat_share" && (y === 2020 || y === 2024))) return "";
        return `<div class="prow" style="--lab:52px;--val:120px;cursor:default;min-height:28px"><span class="who small">${y}</span><div class="trk" style="height:22px"><span class="lnk" style="position:absolute;top:10px;height:2px;background:var(--line-2);left:${Math.min(a[k], b[k]) * 100}%;width:${Math.abs(a[k] - b[k]) * 100}%"></span><span class="dot" style="top:11px;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;border:2px solid var(--ink-3);left:${b[k] * 100}%" data-tip="Not analyzed: ${pct(b[k])}"></span><span class="dot" style="top:11px;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:var(--ink);left:${a[k] * 100}%" data-tip="Analyzed: ${pct(a[k])}"></span></div><span class="val small">${pct(a[k])} vs ${pct(b[k])}</span></div>`;
      }).join("")}</div>`).join("")}</div>`).join("")}</div>
    <p class="small muted" style="margin-top:10px">Close seat: the Democratic presidential candidate won 45 to 55 percent of the votes cast for the two major parties in the district. Shown for 2022 and 2026, the years where it is known for every seat. The 2026 figures are provisional.</p></section>

    <section class="block"><h2>Site length</h2>
    <p class="sub">A long site has more chances to use any term, so length matters when comparing parties. Republican sites
    are shorter, and in 2026 the difference grew; part of any 2026 Republican decline may come from that.</p>
    <div class="tw" style="max-width:640px"><table><thead><tr><th>Year</th><th>Party</th><th class="r">Analyzed</th><th class="r">Median words</th><th class="r">Middle half</th></tr></thead><tbody>
    ${D.site_length.map((s) => `<tr><td>${s.year}</td><td><span class="key">${mk(s.party_group[0], s.year === 2026)} ${s.party_group}</span></td><td class="r">${s.analyzed}</td><td class="r">${nf(s.words_median)}</td><td class="r">${nf(s.words_p25)}–${nf(s.words_p75)}</td></tr>`).join("")}
    </tbody></table></div></section>
  </div>`;
}

// ---------- related work ----------
const WORKS = [
  ["Hilbig (2026)", "U.S. House and Senate Candidate Websites. Harvard Dataverse, doi:10.7910/DVN/BZ2JRS.", "Archived the website text of Democratic and Republican candidates, House 2018 to 2024 and Senate 2002 to 2024, from the Internet Archive's Wayback Machine over each election year, and sorted the text into topics with a statistical model trained on labeled examples.", "This study counts specific words, uses Common Crawl, and adds 2026. Hilbig's data can check this study's 2020 to 2024 patterns."],
  ["Porter, Case and Treul (2025)", "CampaignView. Scientific Data 12, 1237.", "Collected the platforms of House primary candidates in 2018, 2020 and 2022 by hand, a week before each primary, and had people code each platform point into one of 14 topics.", "This study covers general-election candidates for the House and Senate through 2026 and counts words by program. CampaignView found “working families” on about 31 percent of Democratic House primary sites, a point of comparison for this study's figures."],
  ["Druckman, Kifer and Parkin (2009)", "Campaign Communications in U.S. Congressional Elections. American Political Science Review 103(3).", "Coded 736 House and Senate websites from 2002 to 2006, read in full by trained student coders, and found that challengers and incumbents campaign differently online.", "The study borrows its unit, one site per general-election candidate, and its case for websites as a record of what campaigns chose to say. Its measure is a count of named words, run by program."],
  ["Di Tella, Kotti, Le Pennec and Pons (2025)", "Keep Your Enemies Closer. American Economic Review 115(8).", "Scored the ideology of House candidates' archived websites from 2002 to 2016 and found that candidates move toward the center between the primary and the general election.", "This study reports the share of each party using each named term, for 2020 to 2026."],
  ["Bailey and Reese (2024)", "Ideological Moderation and Success in U.S. Elections, 2020–2022. Working paper.", "Scored the website and social media text of House, Senate and governor candidates in 2020 and 2022 on one ideology scale and found moderates won more votes.", "The closest published use of 2020 and 2022 candidate-site text. This study keeps each term separate instead of combining them into one score."],
  ["Gulati and Williams (2007)", "Closing the Gap, Raising the Bar. Social Science Computer Review 25(4).", "Coded the features of every House and Senate candidate's website in 2006, minor parties included.", "Coded site features for one election. This study counts words across four."],
];
function related() {
  return `<div class="page">
    <div class="prose"><div class="eyebrow">Related work</div><h1>Other studies of campaign websites</h1>
    <p class="lead">Researchers have studied candidates' websites since the early 2000s. The closest studies are below,
    each with how this one differs. The method sources for each step are listed with the step on
    <a href="#/method">How it was made</a>.</p></div>
    <div class="works" style="margin-top:32px">${WORKS.map(([who, cite, did, diff]) => `<article class="work"><div><h3>${who}</h3><p class="cite">${esc(cite)}</p></div><div><h4>What it did</h4><p>${esc(did)}</p></div><div><h4>How this study differs</h4><p>${esc(diff)}</p></div></article>`).join("")}</div>
  </div>`;
}

// ---------- data and timeline ----------
const FILES = [
  ["term_shares.csv", "Each party's share using each term, by year and office, with exact counts."],
  ["term_gaps.csv", "The gap between the parties for each term and year, with intervals and adjusted p-values."],
  ["term_bounds.csv", "Possible ranges covering the candidates who were not analyzed."],
  ["term_classes.csv", "Whether each term split the parties and whether its use changed, 2020 to 2024."],
  ["term_shares_panel.csv", "Shares among the candidates analyzed in two or more years."],
  ["term_shares_windows.csv", "Shares under the 60-day, 120-day and election-year windows."],
  ["distinctive_terms.csv", "The words and phrases that most set the parties apart, by year."],
  ["coverage.csv", "How many candidates reached each step, by year, office and party."],
  ["selection.csv", "How analyzed candidates differ from the rest."],
  ["term_precision.csv", "The hand check of term matches."],
];
const TIMELINE = [
  ["done", "October 2026", "Candidate lists for 2020 to 2026 collected, and compared by the program with the FEC's lists."],
  ["done", "October 9, 2026", "Website text collected from Common Crawl for 2020 to 2024, and for 2026 through September."],
  ["done", "October 2026", "First results, all exploratory."],
  ["", "October 18, 2026", "Analysis plan fixed before the tests planned in advance are run."],
  ["", "Early November 2026", "Candidate lists rerun after the ballots are final; 2026 updated from Common Crawl's next crawl, if it is out."],
  ["", "November 9, 2026", "Data frozen and the full analysis run."],
  ["", "Early December 2026", "This site completed with the final figures, and the paper posted here."],
];
function data() {
  return `<div class="page">
    <div class="prose"><div class="eyebrow">Data and timeline</div><h1>Download the data</h1>
    <p class="lead">Every table on this site can be downloaded. They hold counts derived from the websites, never the
    websites' text.</p></div>
    <div class="two" style="margin-top:32px;align-items:start"><section><h2 style="font-size:1.3rem;margin-bottom:12px">Tables</h2>
    <div class="tw"><table class="dl"><thead><tr><th>File</th><th>What it holds</th></tr></thead><tbody>
      <tr><td><span class="muted">candidates.csv</span></td><td>One row per candidate-year: race, party, incumbency, result, whether it was analyzed and why not, and which of the 57 terms it used. <span class="muted">Published with the finished site.</span></td></tr>
      ${FILES.map(([f, d]) => `<tr><td><a href="files/${f}">${f}</a></td><td>${d}</td></tr>`).join("")}
      <tr><td><span class="muted">codebook.pdf</span></td><td>What every column means. <span class="muted">Published with the finished site.</span></td></tr>
      <tr><td><span class="muted">paper.pdf</span></td><td>The full paper. <span class="muted">Expected December 2026.</span></td></tr>
    </tbody></table></div></section>
    <section><h2 style="font-size:1.3rem;margin-bottom:12px">Timeline</h2>
    <ol class="timeline">${TIMELINE.map(([s, w, t]) => `<li class="${s}"><div class="when">${w}${s ? " · done" : ""}</div><div class="what">${t}</div></li>`).join("")}</ol></section></div>
  </div>`;
}

// ---------- render and events ----------
function render() {
  const r = route();
  document.querySelectorAll("nav#nav a").forEach((a) => (a.dataset.route === r.view ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  const view = { overview, method, explore, coverage, related, data }[r.view] || overview;
  $("#main").innerHTML = view(r);
  document.title = `${{ overview: "Campaign Website Language", method: "How it was made", explore: "Explorer", coverage: "Who is in the data", related: "Related work", data: "Data and timeline" }[r.view] || "Campaign Website Language"}${r.view === "overview" ? "" : " · Campaign Website Language"}`;
  if (r.view === "method" && r.sub && !render.keepScroll) { const el = document.getElementById(r.sub); if (el) el.scrollIntoView(); }
  else if (r.view === "explore" && r.p.get("c") && !render.keepScroll && matchMedia("(max-width: 760px)").matches) { const el = $("#excerpt"); if (el) el.scrollIntoView(); }
  else if (r.view === "explore" && r.p.get("sel") && r.p.get("scroll") === "list") { const el = $("#clist"); if (el) el.scrollIntoView(); }
  else if (!render.keepScroll) window.scrollTo(0, 0);
  render.keepScroll = false;
}

document.addEventListener("change", (e) => {
  const r = route(), el = e.target;
  if (el.dataset.f || el.dataset.add) {
    const f = filtersFrom(r.p);
    if (el.dataset.add) { if (el.value !== "") f.t.push(Number(el.value)); }
    else f[el.dataset.f] = el.value;
    f.c = ""; ui.showAll = false; render.keepScroll = true;
    go("explore", paramsOf(f));
  } else if (el.dataset.choice) {
    const q = new URLSearchParams(r.p); q.set(el.dataset.choice, el.value);
    if (el.dataset.choice === "cs" && !["60", "120", "year"].includes(el.value)) q.delete("same");
    render.keepScroll = true; location.hash = `#/method/choices?${q}`;
  }
});
document.addEventListener("click", (e) => {
  const r = route(), t = e.target.closest("[data-drop],[data-sel],[data-c],[data-showall],[data-resample],[data-toggle-filters],.menu-btn");
  if (!t) return;
  if (t.matches(".menu-btn")) { const n = $("#nav"); n.classList.toggle("open"); t.setAttribute("aria-expanded", n.classList.contains("open")); return; }
  if (t.dataset.resample) { ui.sampleSeed[t.dataset.resample] = (ui.sampleSeed[t.dataset.resample] || 7) + 11; render.keepScroll = true; render(); return; }
  const f = filtersFrom(r.p);
  render.keepScroll = true;
  if (t.dataset.toggleFilters !== undefined) { ui.filtersOpen = !ui.filtersOpen; f.panel = ""; render(); return; }
  if (t.dataset.drop) { f.t = f.t.filter((i) => i !== Number(t.dataset.drop)); f.c = ""; }
  else if (t.dataset.sel) { f.sel = t.dataset.sel; f.c = ""; ui.showAll = false; }
  else if (t.dataset.c) f.c = t.dataset.c;
  else if (t.dataset.showall !== undefined) { ui.showAll = !ui.showAll; render(); return; }
  go("explore", paramsOf(f));
});
document.addEventListener("keydown", (e) => {
  if ((e.key === "Enter" || e.key === " ") && e.target.matches('[role="button"],tr[data-c]')) { e.preventDefault(); e.target.click(); }
});
const tip = () => $("#tip");
document.addEventListener("mouseover", (e) => showTip(e.target.closest("[data-tip]")));
document.addEventListener("focusin", (e) => showTip(e.target.closest("[data-tip]")));
document.addEventListener("mouseout", (e) => { if (e.target.closest("[data-tip]")) tip().hidden = true; });
document.addEventListener("focusout", () => (tip().hidden = true));
function showTip(el) {
  if (!el) return;
  const t = tip(); t.textContent = el.dataset.tip; t.hidden = false;
  const b = el.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
  t.style.left = `${Math.max(8, Math.min(innerWidth - w - 8, b.left + b.width / 2 - w / 2))}px`;
  t.style.top = `${b.top - h - 8 < 8 ? b.bottom + 8 : b.top - h - 8}px`;
}

window.addEventListener("hashchange", render);
fetch("data/site.json").then((r) => r.json()).then((j) => { D = j; index(); render(); document.body.dataset.ready = "1"; });
