"""Render results/report.html from the CSV and JSON outputs of analyze.py."""
import csv
import json
from datetime import date

from common import ROOT

RESULTS = ROOT / "results"

# Written from the 2026-10-05 rebuild on re-extracted text (2,753 candidate-years analyzed). Rewrite when the data change.
# Exploratory: chosen after viewing results for all 57 terms. Every term named here was hand-checked
# for match precision (results/term_precision.csv).
FINDINGS = [
    ("working families", "Democrats moved from “middle class” toward “working families.” “Working families” rose "
     "from 33% of Democratic candidates in 2020 to 48% in 2026, and “middle class” fell from 31% to 20%. "
     "“Working people” rose from 14% to 24%, almost all of it in 2026. Among Democrats analyzed in more than one "
     "year, “working families” barely moved (36% to 38%), so the 2026 rise comes mostly from new candidates."),
    ("working families", "Republicans took up “working families” in 2026: 27% of Republican candidates used it, "
     "against 10–11% in 2020–2024. Nine of those 67 sites use it only in the name of the “Working Families Tax "
     "Cut,” the party’s label for its 2025 tax law. Without them the share is 23%, still more than double the "
     "earlier level, and the rise also appears among Republicans analyzed in more than one year (10% to 21%)."),
    ("inflation", "Prices became a Republican theme after 2020. “Inflation” went from 3% of Republican candidates "
     "in 2020 to 39% in 2022 and 40% in 2024, then fell to 25% in 2026. Democrats’ use peaked at 15%, not counting "
     "mentions of the Inflation Reduction Act. “Cost of living” rose steadily in both parties, from 6% to 17% of "
     "Democrats and from 3% to 12% of Republicans, and Democrats’ use of “housing” rose from 35% to 55%."),
    ("billionaires", "In 2026 Democrats turned to “billionaires” (25%, up from 5–9%), “tariffs” (18%, up from "
     "1–4%) and “corporations” (43%, up from 31–35%). These are mostly new candidates’ words: among Democrats "
     "analyzed in more than one year, “billionaires” reached 13% and “tariffs” 11%."),
    ("reproductive freedom / rights", "Abortion language shifted after the 2022 Dobbs decision. Democrats’ "
     "“reproductive freedom or rights” rose from 15% in 2020 to 48% in 2024 and stood at 29% in 2026, and their "
     "use of “abortion” rose from 10% to 38% in 2024. Republicans’ “pro-life” or “unborn” fell from 39% in 2020 "
     "to 20% in 2026, and their use of “abortion” from 26% to 11%."),
    ("freedom", "Democrats took up “freedom” and “democracy.” “Freedom” rose from 24% of Democratic candidates "
     "in 2020 to 50% in 2024, level with Republicans, and stood at 39% in 2026. “Democracy” rose from 27% to "
     "38–43% from 2022 on. Republicans’ use of “freedom” fell from 52% in 2020 to 43% in 2026."),
    ("artificial intelligence", "Artificial intelligence arrived in 2026: 13% of Democratic and 8% of Republican "
     "candidates mentioned it, against 4% or less in every earlier year."),
    ("climate", "Some issues faded. Democrats’ use of “climate” held at 47–49% through 2024 and fell to 29% in "
     "2026, though among Democrats analyzed in more than one year it fell only to 43%. Republicans’ use of "
     "“health care” fell from 61% in 2020 to between 35% and 42% from 2022 on."),
]


def rows(name):
    return list(csv.DictReader(open(RESULTS / name, encoding="utf-8")))


def main():
    shares = [dict(t=r["term"], th=r["theme"], y=int(r["year"]), o=r["office"], g=r["party_group"],
                   u=int(r["candidates_using"]), n=int(r["candidates_analyzed"])) for r in rows("term_shares.csv")]
    dist = [dict(y=int(r["year"]), k=r["kind"], side=r["favors"], rank=int(r["rank"]), term=r["term"], d=int(r["dem_candidates_using"]),
                 r=int(r["rep_candidates_using"]), nd=int(r["dem_analyzed"]), nr=int(r["rep_analyzed"]))
            for r in rows("distinctive_terms.csv")]
    cov = [dict(y=int(r["year"]), o=r["office"], g=r["party_group"], c=int(r["candidates"]), w=int(r["website_known"]),
                x=int(r["any_text"]), a=int(r["analyzed"])) for r in rows("coverage.csv")]
    live = [dict(t=r["term"], g=r["party_group"], u=int(r["candidates_using"]), n=int(r["candidates_analyzed"]))
            for r in rows("term_shares_2026_live.csv") if r["office"] == "All" and r["year"] == "2026"]
    ex = json.load(open(RESULTS / "examples.json", encoding="utf-8"))
    stats = json.load(open(RESULTS / "corpus_stats.json"))
    sel = [dict(y=int(r["year"]), g=r["party_group"], a=r["group"] == "analyzed", n=int(r["candidates"]),
                inc=float(r["incumbent_share"]), won=float(r["won_share"]) if r["won_share"] else None,
                close=float(r["close_race_share"]) if r["close_race_share"] else None,
                seat=float(r["close_seat_share"]) if r["close_seat_share"] else None,
                nseat=int(r["with_seat_presidential"])) for r in rows("selection.csv")]
    prec = [dict(t=r["term"], fresh=r["sample"] == "v2", n=int(r["coded"]), k=int(r["intended"]),
                 lo=float(r["wilson_low"]), hi=float(r["wilson_high"])) for r in rows("term_precision.csv")]
    cross = [dict(y=int(r["year"]), g=r["party_group"], bp=int(r["ballotpedia"]), fec=int(r["fec"]) if r["fec"] else None)
             for r in rows("list_crosscheck.csv")]
    panel = [dict(t=r["term"], y=int(r["year"]), g=r["party_group"], u=int(r["candidates_using"]), n=int(r["candidates_analyzed"]))
             for r in rows("term_shares_panel.csv") if r["party_group"] in ("Democratic", "Republican")]
    gaps = [dict(t=r["term"], y=int(r["year"]), d=float(r["gap_dem_minus_rep"]), lo=float(r["gap_low"]), hi=float(r["gap_high"]),
                 q=float(r["q_benjamini_hochberg"])) for r in rows("term_gaps.csv")]
    excluded = len(rows("excluded_sites.csv"))
    data = dict(findings=[dict(term=t, text=x) for t, x in FINDINGS], shares=shares, dist=dist, cov=cov, ex=ex, live=live,
                stats=stats, sel=sel, prec=prec, cross=cross, panel=panel, gaps=gaps, excluded=excluded, built=date.today().isoformat())
    html = TEMPLATE.replace("/*DATA*/null", json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    (RESULTS / "report.html").write_text(html, encoding="utf-8")
    print("wrote", RESULTS / "report.html", len(html) // 1024, "KB")


TEMPLATE = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Campaign Website Language</title>
<style>
:root {
  color-scheme: light;
  --page: #f9f9f7; --surface: #fcfcfb; --ink: #0b0b0b; --ink-2: #52514e; --muted: #6f6d68;
  --grid: #e1e0d9; --axis: #c3c2b7; --ring: rgba(11,11,11,0.10); --wash: rgba(11,11,11,0.04);
  --dem: #2a78d6; --rep: #e34948; --ind: #1baf7a; --hit: #fff1b8;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --page: #0d0d0d; --surface: #1a1a19; --ink: #ffffff; --ink-2: #c3c2b7; --muted: #9a988f;
    --grid: #2c2c2a; --axis: #383835; --ring: rgba(255,255,255,0.10); --wash: rgba(255,255,255,0.05);
    --dem: #3987e5; --rep: #e66767; --ind: #199e70; --hit: #4a3f12;
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --page: #0d0d0d; --surface: #1a1a19; --ink: #ffffff; --ink-2: #c3c2b7; --muted: #9a988f;
  --grid: #2c2c2a; --axis: #383835; --ring: rgba(255,255,255,0.10); --wash: rgba(255,255,255,0.05);
  --dem: #3987e5; --rep: #e66767; --ind: #199e70; --hit: #4a3f12;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink);
  font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 1040px; margin: 0 auto; padding: 40px 16px 64px; }
h1 { font-size: 28px; line-height: 1.2; margin: 0 0 8px; letter-spacing: -0.01em; }
h2 { font-size: 19px; margin: 0 0 4px; }
h3 { font-size: 14px; margin: 0 0 8px; color: var(--ink-2); font-weight: 600; }
p { margin: 0 0 12px; }
.dek { color: var(--ink-2); font-size: 17px; max-width: 760px; }
.section { margin-top: 40px; }
.lede { color: var(--ink-2); max-width: 760px; margin-bottom: 16px; }
.card { background: var(--surface); border: 1px solid var(--ring); border-radius: 10px; padding: 20px; }
.tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-top: 24px; }
.tile .v { font-size: 26px; font-weight: 650; line-height: 1.1; }
.tile .l { color: var(--ink-2); font-size: 13px; margin-top: 4px; }
.controls { display: flex; flex-wrap: wrap; gap: 12px 20px; align-items: center; margin-bottom: 16px; }
label.ctl { display: flex; gap: 8px; align-items: center; font-size: 13px; color: var(--ink-2); }
select { font: inherit; color: var(--ink); background: var(--surface); border: 1px solid var(--axis);
  border-radius: 6px; padding: 6px 8px; max-width: 100%; }
.seg { display: inline-flex; border: 1px solid var(--axis); border-radius: 6px; overflow: hidden; }
.seg button { font: inherit; font-size: 13px; color: var(--ink-2); background: transparent; border: 0;
  padding: 6px 12px; cursor: pointer; }
.seg button + button { border-left: 1px solid var(--axis); }
.seg button[aria-pressed="true"] { background: var(--wash); color: var(--ink); font-weight: 600; }
.legend { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: var(--ink-2); margin: 4px 0 8px; }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
svg text { fill: var(--muted); font-size: 12px; }
.chart-wrap { position: relative; }
.tip { position: absolute; pointer-events: none; background: var(--surface); border: 1px solid var(--ring);
  box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-radius: 8px; padding: 8px 10px; font-size: 13px;
  min-width: 180px; display: none; z-index: 5; }
.tip b { display: block; margin-bottom: 4px; }
.tip .row { display: flex; justify-content: space-between; gap: 12px; }
.tip .sw { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.note { font-size: 13px; color: var(--muted); }
.examples { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
.examples .col h3 { display: flex; align-items: center; gap: 6px; }
.ex { overflow-wrap: anywhere; font-size: 13.5px; line-height: 1.45; padding: 8px 0; border-top: 1px solid var(--grid); }
.ex .who { color: var(--muted); font-size: 12px; margin-top: 2px; }
.ex mark { background: var(--hit); color: inherit; padding: 0 2px; border-radius: 2px; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; }
.mini { background: var(--surface); border: 1px solid var(--ring); border-radius: 8px; padding: 8px 10px 4px;
  cursor: pointer; text-align: left; font: inherit; color: inherit; }
.mini:hover, .mini:focus-visible { border-color: var(--axis); background: var(--wash); outline: none; }
.mini .t { font-size: 13px; font-weight: 600; line-height: 1.25; min-height: 2.5em; }
.mini-x { display: flex; justify-content: space-between; font-size: 10px; color: var(--muted); margin-top: -2px; }
.findings { margin: 0; padding: 0; list-style: none; display: grid; gap: 10px; counter-reset: f; }
.findings li { background: var(--surface); border: 1px solid var(--ring); border-radius: 10px; padding: 14px 16px 14px 48px;
  position: relative; max-width: 860px; }
.findings li::before { counter-increment: f; content: counter(f); position: absolute; left: 16px; top: 14px;
  font-weight: 650; color: var(--muted); }
.findings button { font: inherit; font-size: 13px; color: var(--dem); background: none; border: 0; padding: 0;
  margin-top: 6px; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; text-align: left; }
.theme-h { margin: 20px 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
.dist { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.drow { display: grid; grid-template-columns: minmax(0, 1fr) 132px; gap: 10px; align-items: center;
  padding: 5px 0; border-top: 1px solid var(--grid); font-size: 13.5px; }
.bars { display: grid; gap: 2px; }
.bar { height: 6px; border-radius: 0 3px 3px 0; min-width: 1px; }
.pct { font-variant-numeric: tabular-nums; color: var(--muted); font-size: 12px; }
table { border-collapse: collapse; width: 100%; font-size: 13px; }
th, td { text-align: right; padding: 6px 8px; border-top: 1px solid var(--grid); font-variant-numeric: tabular-nums; }
th:first-child, td:first-child { text-align: left; }
th { color: var(--ink-2); font-weight: 600; }
details summary { cursor: pointer; color: var(--ink-2); font-size: 13px; margin-top: 12px; }
.scroll { overflow-x: auto; }
.numbers td, .numbers th { white-space: nowrap; }
ul.method { padding-left: 20px; max-width: 800px; }
ul.method li { margin-bottom: 8px; }
.checks { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 20px; align-items: start; }
.checks h3 { color: var(--ink); font-size: 15px; }
.checks .note { margin: 8px 0 0; }
.checks .wide { grid-column: 1 / -1; }
.checks td { white-space: nowrap; }
.checks td.l, .checks th.l { text-align: left; }
@media (max-width: 760px) {
  .tiles { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .examples, .dist, .checks { grid-template-columns: minmax(0, 1fr); }
  h1 { font-size: 24px; }
}
</style>
</head>
<body>
<main>
  <h1>How congressional candidates talk on their campaign websites, 2020–2026</h1>
  <p class="dek">Which words U.S. House and Senate general-election candidates used on their campaign
  websites, by party and election year. Each figure is the share of candidates whose site used a term at
  least once.</p>
  <div class="tiles" id="tiles"></div>

  <section class="section">
    <h2>What changed</h2>
    <p class="lede">Shares are the percentage of each party's analyzed candidates whose campaign website used a term at
    least once. These findings are exploratory: they were picked after looking at all 57 terms, so they point to
    patterns worth testing rather than settled results. Every share in the term table below has a 95% range, and
    every Democratic minus Republican gap has a range and an adjusted p-value. Those ranges describe chance variation
    among the candidates analyzed, and they do not cover the 44% of candidate-years that could not be analyzed.
    Select a finding to open its term below.</p>
    <ol class="findings" id="findings"></ol>
  </section>

  <section class="section">
    <h2>Explore a term</h2>
    <p class="lede">Pick a term to see what share of each party's candidates used it in each election.
    Hollow points rest on fewer than 15 candidates.</p>
    <div class="card">
      <div class="controls">
        <label class="ctl">Term <select id="term"></select></label>
        <div class="seg" id="office" role="group" aria-label="Office">
          <button aria-pressed="true" data-v="All">House and Senate</button><button aria-pressed="false" data-v="House">House</button><button aria-pressed="false" data-v="Senate">Senate</button>
        </div>
      </div>
      <div class="legend" id="legend"></div>
      <div class="chart-wrap" id="main-chart"></div>
      <details><summary>Show the numbers</summary><div class="scroll" id="main-table"></div></details>
    </div>
    <div class="card" style="margin-top:12px">
      <div class="controls">
        <h2 style="margin:0">How candidates used it</h2>
        <div class="seg" id="ex-year" role="group" aria-label="Year"></div>
      </div>
      <div class="examples" id="examples"></div>
    </div>
  </section>

  <section class="section">
    <h2>Every term at a glance</h2>
    <p class="lede">Each panel shows Democratic and Republican candidates from 2020 to 2026, House and Senate
    together, on its own scale. The number under each panel is its highest share. Select a panel to open it above.</p>
    <div id="overview"></div>
  </section>

  <section class="section">
    <h2>Phrases that most separate the parties</h2>
    <p class="lede">Words and phrases ranked by how strongly their use leans toward one party's candidates
    in that election. Each candidate counts once: the ranking compares how much of each candidate's text
    the word or phrase makes up, averaged over each party's candidates, by Welch's t-test (Lijffijt and
    others, 2016), so a phrase repeated on one site cannot top the list. No words are removed
    beforehand. Bars show the share of each party's candidates who used it.</p>
    <div class="card">
      <div class="controls"><div class="seg" id="dist-year" role="group" aria-label="Year"></div>
        <div class="seg" id="dist-kind" role="group" aria-label="Unit"><button data-v="phrase" aria-pressed="true">Phrases</button><button data-v="word" aria-pressed="false">Single words</button></div></div>
      <div class="dist" id="dist"></div>
    </div>
  </section>

  <section class="section">
    <h2>Coverage</h2>
    <p class="lede">Candidates on each general-election ballot, how many had a known campaign website,
    and how many sites yielded at least 100 words of campaign text from the collection window.</p>
    <div class="card scroll" id="coverage"></div>
  </section>

  <section class="section">
    <h2>Checking 2026 against live sites</h2>
    <p class="lede">The 2026 figures above use archived captures, like the other years. This table repeats them
    using a live crawl of every 2026 campaign site with a known address, taken in early October 2026. Live shares
    run a few points higher for nearly every term in both parties, because a live site exposes more pages and more
    text than an archive holds. That is why every year is compared on archived text only. The gaps between the
    parties are similar in both columns.</p>
    <div class="card scroll" id="livecheck"></div>
  </section>

  <section class="section">
    <h2>Method and limits</h2>
    <ul class="method" id="method"></ul>
    <div class="checks">
      <div class="card scroll wide"><h3>Who was analyzed</h3><div id="selection"></div></div>
      <div class="card scroll wide"><h3>Candidates analyzed in more than one year</h3><div id="panel"></div></div>
      <div class="card scroll"><h3>How often a match means the term</h3><div id="precision"></div></div>
      <div class="card scroll"><h3>Candidate lists: Ballotpedia and FEC</h3><div id="crosscheck"></div></div>
    </div>
  </section>
</main>
<div class="tip" id="tip"></div>
<script>
const D = /*DATA*/null;
const YEARS = [2020, 2022, 2024, 2026];
const PARTIES = [
  {g: "Democratic", c: "var(--dem)", s: "circle"},
  {g: "Republican", c: "var(--rep)", s: "square"},
  {g: "Independent", c: "var(--ind)", s: "triangle"}];
const SMALL_N = 15;
const fmt = v => (v * 100).toFixed(v < 0.1 ? 1 : 0) + "%";
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;"}[c]));
const gapIdx = new Map(D.gaps.map(r => [r.t + "|" + r.y, r]));
const idx = new Map();
for (const r of D.shares) idx.set([r.t, r.y, r.o, r.g].join("|"), r);
const get = (t, y, o, g) => idx.get([t, y, o, g].join("|"));
const terms = []; const themes = new Map();
for (const r of D.shares) if (!themes.has(r.th) || !themes.get(r.th).includes(r.t)) {
  if (!themes.has(r.th)) themes.set(r.th, []);
  themes.get(r.th).push(r.t); terms.push(r.t);
}
let state = {term: "working families", office: "All", exYear: null, distYear: null, distKind: "phrase"};

function marker(shape, x, y, color, hollow) {
  const f = hollow ? "var(--surface)" : color, st = `stroke="${color}" stroke-width="2"`;
  if (shape === "square") return `<rect x="${x-4.5}" y="${y-4.5}" width="9" height="9" rx="1.5" fill="${f}" ${st}/>`;
  if (shape === "triangle") return `<path d="M${x},${y-5.5} L${x+5.5},${y+4.5} L${x-5.5},${y+4.5} Z" fill="${f}" ${st} stroke-linejoin="round"/>`;
  return `<circle cx="${x}" cy="${y}" r="4.5" fill="${f}" ${st}/>`;
}
function legendHTML(parties) {
  return parties.map(p => `<span><svg width="14" height="14" viewBox="-7 -7 14 14">${marker(p.s, 0, 0, p.c, false)}</svg>${p.g}</span>`).join("");
}
function ticks(v) {
  const step = [0.01, 0.02, 0.05, 0.1, 0.2, 0.25].find(s => v / s <= 5) || 0.25;
  const max = Math.min(1, Math.ceil(v / step - 1e-9) * step);
  return {max, step};
}

function lineChart(el, term, office) {
  const W = Math.max(300, Math.round(el.clientWidth || 680)), narrow = W < 520;
  const H = narrow ? 240 : 300, m = {l: 40, r: narrow ? 72 : 132, t: 12, b: 30};
  const series = PARTIES.map(p => ({...p, pts: YEARS.map(y => get(term, y, office, p.g)).map((r, i) =>
    r && r.n ? {y: YEARS[i], v: r.u / r.n, u: r.u, n: r.n} : null)}));
  const all = series.flatMap(s => s.pts.filter(Boolean).map(p => p.v));
  const tk = ticks(Math.max(0.05, ...all)), ymax = tk.max;
  const X = y => m.l + (YEARS.indexOf(y)) * (W - m.l - m.r) / (YEARS.length - 1);
  const Y = v => m.t + (1 - v / ymax) * (H - m.t - m.b);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="display:block;max-width:100%" role="img" aria-label="Share of candidates using ${esc(term)} by party and year">`;
  for (let i = 0; i * tk.step <= ymax + 1e-9; i++) { const v = i * tk.step, y = Y(v);
    s += `<line x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}" stroke="var(${i ? "--grid" : "--axis"})" stroke-width="1"/>`;
    s += `<text x="${m.l - 8}" y="${y + 4}" text-anchor="end">${Math.round(v * 100)}%</text>`; }
  for (const y of YEARS) s += `<text x="${X(y)}" y="${H - 8}" text-anchor="middle">${y}</text>`;
  const ends = [];
  for (const se of series) {
    const p = se.pts.filter(Boolean);
    if (!p.length) continue;
    s += `<path d="${p.map((q, i) => (i ? "L" : "M") + X(q.y) + "," + Y(q.v)).join(" ")}" fill="none" stroke="${se.c}" stroke-width="2" stroke-linejoin="round"/>`;
    for (const q of p) s += marker(se.s, X(q.y), Y(q.v), se.c, q.n < SMALL_N);
    const last = p[p.length - 1];
    ends.push({y: Y(last.v), label: `${narrow ? se.g.slice(0, 3) + "." : se.g} ${fmt(last.v)}`, x: X(last.y)});
  }
  ends.sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16;
  for (const e of ends) s += `<text x="${e.x + 12}" y="${e.y + 4}" style="fill:var(--ink-2)">${esc(e.label)}</text>`;
  YEARS.forEach(y => { s += `<rect class="hov" data-y="${y}" x="${X(y) - (W - m.l - m.r) / 6}" y="${m.t}" width="${(W - m.l - m.r) / 3}" height="${H - m.t - m.b}" fill="transparent"/>`; });
  s += `<line id="xh" x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="var(--axis)" stroke-width="1" visibility="hidden"/></svg>`;
  el.innerHTML = s;
  const svg = el.querySelector("svg"), tip = document.getElementById("tip"), xh = svg.querySelector("#xh");
  svg.querySelectorAll(".hov").forEach(r => {
    const y = +r.dataset.y;
    const show = ev => {
      xh.setAttribute("x1", X(y)); xh.setAttribute("x2", X(y)); xh.setAttribute("visibility", "visible");
      tip.innerHTML = `<b>${esc(term)}, ${y}</b>` + series.map(se => { const q = se.pts[YEARS.indexOf(y)];
        return `<div class="row"><span><span class="sw" style="background:${se.c}"></span>${se.g}</span><span>${q ? fmt(q.v) + ` <span class="note">${q.u} of ${q.n}</span>` : "no data"}</span></div>`; }).join("");
      tip.style.display = "block";
      const b = el.getBoundingClientRect(), w = tip.offsetWidth;
      const px = (X(y) / W) * b.width;
      tip.style.left = (window.scrollX + b.left + Math.min(Math.max(px - w / 2, 0), b.width - w)) + "px";
      tip.style.top = (window.scrollY + b.top - tip.offsetHeight - 6) + "px";
    };
    r.addEventListener("mousemove", show); r.addEventListener("mouseleave", () => { tip.style.display = "none"; xh.setAttribute("visibility", "hidden"); });
  });
}

function wilson(u, n) {
  const z = 1.96, p = u / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

function mainTable(term, office) {
  let h = `<div class="scroll"><table class="numbers"><tr><th>Party</th>${YEARS.map(y => `<th>${y}</th>`).join("")}</tr>`;
  for (const g of ["Democratic", "Republican", "Independent", "Third party"]) {
    h += `<tr><td>${g}</td>` + YEARS.map(y => { const r = get(term, y, office, g);
      if (!r || !r.n) return "<td>–</td>";
      const [lo, hi] = wilson(r.u, r.n);
      return `<td>${fmt(r.u / r.n)} <span class="pct">${r.u} of ${r.n}<br>95% CI ${fmt(lo)}–${fmt(hi)}</span></td>`; }).join("") + "</tr>";
  }
  if (office === "All") {
    h += `<tr><td>Democratic minus Republican</td>` + YEARS.map(y => { const r = gapIdx.get(term + "|" + y);
      if (!r) return "<td>–</td>";
      const pts = v => (v >= 0 ? "+" : "−") + Math.abs(v * 100).toFixed(0);
      const q = r.q < 0.001 ? "adjusted p &lt; 0.001" : "adjusted p = " + r.q.toFixed(r.q < 0.01 ? 3 : 2);
      return `<td>${pts(r.d)} points<br><span class="pct">95% CI ${pts(r.lo)} to ${pts(r.hi)}<br>${q}</span></td>`; }).join("") + "</tr>";
  }
  return h + `</table></div><p class="note" style="margin-top:8px">Ranges for shares are 95% Wilson score intervals. Ranges for
    gaps are Newcombe score intervals, and each adjusted p-value comes from Fisher's exact test, adjusted by the
    Benjamini-Hochberg method for the 228 term-year comparisons in this study. All of them describe chance variation
    among the candidates analyzed. They do not cover the candidates whose sites could not be analyzed.</p>`;
}

function examples() {
  const years = YEARS.filter(y => D.ex.some(e => e.term === state.term && e.year == y));
  if (!years.includes(state.exYear)) state.exYear = years[years.length - 1] || 2026;
  const seg = document.getElementById("ex-year");
  seg.innerHTML = YEARS.map(y => `<button data-v="${y}" aria-pressed="${y === state.exYear}" ${years.includes(y) ? "" : "disabled"}>${y}</button>`).join("");
  seg.querySelectorAll("button").forEach(b => b.onclick = () => { state.exYear = +b.dataset.v; examples(); });
  document.getElementById("examples").innerHTML = PARTIES.map(p => {
    const e = D.ex.find(e => e.term === state.term && e.year == state.exYear && e.party_group === p.g);
    const items = e ? e.examples.map(x => `<div class="ex">…${esc(x.pre)}<mark>${esc(x.hit)}</mark>${esc(x.post)}…<div class="who">${esc(x.name)}, ${esc(x.where)}</div></div>`).join("")
      : `<div class="ex note">No ${p.g.toLowerCase()} candidate used this term in ${state.exYear}.</div>`;
    return `<div class="col"><h3><svg width="12" height="12" viewBox="-6 -6 12 12">${marker(p.s, 0, 0, p.c, false)}</svg>${p.g}</h3>${items}</div>`;
  }).join("");
}

function renderMain() {
  document.getElementById("term").value = state.term;
  document.querySelectorAll("#office button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === state.office));
  lineChart(document.getElementById("main-chart"), state.term, state.office);
  document.getElementById("main-table").innerHTML = mainTable(state.term, state.office);
  examples();
}

function overview() {
  let h = "";
  for (const [th, ts] of themes) {
    const peak = t => Math.max(...YEARS.flatMap(y => ["Democratic", "Republican"].map(g => { const r = get(t, y, "All", g); return r && r.n ? r.u / r.n : 0; })));
    h += `<div class="theme-h">${esc(th)}</div><div class="grid">`;
    for (const t of [...ts].sort((a, b) => peak(b) - peak(a))) {
      const W = 140, H = 54, ymax = Math.max(0.02, peak(t));
      const X = i => 4 + i * (W - 8) / 3, Y = v => 4 + (1 - v / ymax) * (H - 10);
      let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" aria-hidden="true"><line x1="0" x2="${W}" y1="${H - 6}" y2="${H - 6}" stroke="var(--axis)"/>`;
      for (const p of PARTIES.slice(0, 2)) {
        const pts = YEARS.map((y, i) => { const r = get(t, y, "All", p.g); return r && r.n ? [X(i), Y(r.u / r.n)] : null; }).filter(Boolean);
        if (pts.length) s += `<path d="${pts.map((q, i) => (i ? "L" : "M") + q[0] + "," + q[1]).join(" ")}" fill="none" stroke="${p.c}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
        if (pts.length) s += `<circle cx="${pts[pts.length - 1][0]}" cy="${pts[pts.length - 1][1]}" r="2.5" fill="${p.c}"/>`;
      }
      s += `</svg><div class="mini-x"><span>2020</span><span>2026</span></div>`;
      h += `<button class="mini" data-t="${esc(t)}"><div class="t">${esc(t)}</div>${s}<div class="pct">Peak ${fmt(peak(t))}</div></button>`;
    }
    h += "</div>";
  }
  const el = document.getElementById("overview");
  el.innerHTML = `<div class="legend">${legendHTML(PARTIES.slice(0, 2))}</div>` + h;
  el.querySelectorAll(".mini").forEach(b => b.onclick = () => { state.term = b.dataset.t; renderMain();
    document.getElementById("term").scrollIntoView({behavior: "smooth", block: "center"}); });
}

function distinctive() {
  const years = YEARS.filter(y => D.dist.some(d => d.y === y));
  if (!years.includes(state.distYear)) state.distYear = years[years.length - 1];
  const seg = document.getElementById("dist-year");
  seg.innerHTML = YEARS.map(y => `<button data-v="${y}" aria-pressed="${y === state.distYear}" ${years.includes(y) ? "" : "disabled"}>${y}</button>`).join("");
  seg.querySelectorAll("button").forEach(b => b.onclick = () => { state.distYear = +b.dataset.v; distinctive(); });
  document.querySelectorAll("#dist-kind button").forEach(b => { b.setAttribute("aria-pressed", b.dataset.v === state.distKind);
    b.onclick = () => { state.distKind = b.dataset.v; distinctive(); }; });
  const col = side => {
    const list = D.dist.filter(d => d.y === state.distYear && d.k === state.distKind && d.side === side).slice(0, 20);
    const mx = Math.max(0.01, ...list.map(d => Math.max(d.d / d.nd, d.r / d.nr)));
    return `<div><h3>Used more by ${side} candidates</h3>` + list.map(d =>
      `<div class="drow"><span>${esc(d.term)}</span><span class="bars" title="${fmt(d.d / d.nd)} of Democratic, ${fmt(d.r / d.nr)} of Republican candidates">
        <span class="bar" style="width:${100 * d.d / d.nd / mx}%;background:var(--dem)"></span>
        <span class="bar" style="width:${100 * d.r / d.nr / mx}%;background:var(--rep)"></span>
        <span class="pct">D ${fmt(d.d / d.nd)} · R ${fmt(d.r / d.nr)}</span></span></div>`).join("") + "</div>";
  };
  document.getElementById("dist").innerHTML = col("Democratic") + col("Republican");
}

function coverage() {
  const groups = ["Democratic", "Republican", "Independent", "Third party"];
  let h = `<table><tr><th>Year</th>${groups.map(g => `<th>${g}</th>`).join("")}<th>All</th></tr>`;
  for (const y of YEARS) {
    const cells = groups.map(g => D.cov.filter(c => c.y === y && c.g === g));
    const sum = (arr, k) => arr.reduce((a, c) => a + c[k], 0);
    const fmtc = arr => { const c = sum(arr, "c"); return c ? `${sum(arr, "a")} of ${c} <span class="pct">(${Math.round(100 * sum(arr, "a") / c)}%)</span>` : "–"; };
    h += `<tr><td>${y}</td>${cells.map(c => `<td>${fmtc(c)}</td>`).join("")}<td>${fmtc(cells.flat())}</td></tr>`;
  }
  h += `</table><p class="note" style="margin-top:8px">Cells show candidates analyzed of candidates on the ballot.
    Websites were known for ${D.cov.reduce((a, c) => a + c.w, 0)} of ${D.cov.reduce((a, c) => a + c.c, 0)} candidacies.</p>`;
  document.getElementById("coverage").innerHTML = h;
}

function livecheck() {
  const L = new Map(D.live.map(r => [r.t + "|" + r.g, r]));
  const rows = terms.map(t => ({t, a: ["Democratic", "Republican"].map(g => get(t, 2026, "All", g)),
    l: ["Democratic", "Republican"].map(g => L.get(t + "|" + g))}))
    .filter(r => r.a.every(Boolean) && r.l.every(Boolean));
  const pct = r => r && r.n ? fmt(r.u / r.n) : "–";
  const nA = rows.length ? rows[0].a.map(r => r.n) : [0, 0], nL = rows.length ? rows[0].l.map(r => r.n) : [0, 0];
  let h = `<table><tr><th>Term</th><th>Democratic, archived (${nA[0]})</th><th>Democratic, live (${nL[0]})</th>
    <th>Republican, archived (${nA[1]})</th><th>Republican, live (${nL[1]})</th></tr>`;
  for (const r of rows) h += `<tr><td>${esc(r.t)}</td><td>${pct(r.a[0])}</td><td>${pct(r.l[0])}</td><td>${pct(r.a[1])}</td><td>${pct(r.l[1])}</td></tr>`;
  document.getElementById("livecheck").innerHTML = rows.length ? h + "</table>" : `<p class="note">No 2026 archived captures yet.</p>`;
}

function findings() {
  const el = document.getElementById("findings");
  el.innerHTML = D.findings.map((f, i) => `<li>${esc(f.text)}<br><button data-t="${esc(f.term)}">Open “${esc(f.term)}” in the explorer</button></li>`).join("");
  el.querySelectorAll("button").forEach(b => b.onclick = () => { state.term = b.dataset.t; renderMain();
    document.getElementById("term").scrollIntoView({behavior: "smooth", block: "center"}); });
}

function tiles() {
  const c = D.cov.reduce((a, x) => a + x.c, 0), w = D.cov.reduce((a, x) => a + x.w, 0), a = D.cov.reduce((a2, x) => a2 + x.a, 0);
  const t = [[c.toLocaleString(), "candidacies on general-election ballots"], [w.toLocaleString(), "with a known campaign website"],
    [a.toLocaleString(), "sites analyzed (100+ words)"], [D.stats.median_words.toLocaleString(), "median words per analyzed site"]];
  document.getElementById("tiles").innerHTML = t.map(([v, l]) => `<div class="card tile"><div class="v">${v}</div><div class="l">${l}</div></div>`).join("");
}

function method() {
  const pct = v => v == null ? "–" : Math.round(v * 100) + "%";
  const items = [
    "Candidates: every U.S. House and Senate candidate on a November general-election ballot, taken from Ballotpedia's candidate lists for all four years, with FEC candidate IDs attached by state, district and name. Write-in candidates are excluded. Louisiana's November all-party primary counts as its general election, including its 2026 House races, which went back to that system after the Supreme Court's Louisiana v. Callais ruling canceled the state's new party primaries. The FEC's own general-election lists for 2020–2024 agree with Ballotpedia's within five major-party candidates a year; Ballotpedia lists more minor-party candidates in 2024.",
    "Party groups: Democratic and Republican include fusion lines such as Working Families or Conservative. Independent covers independent, unaffiliated and no-party labels. Third party covers every other party (Libertarian, Green, Constitution and others) and is shown in tables only because it mixes left and right.",
    "Websites: the site listed on the campaign committee's FEC Statement of Organization in force at that election. When none was listed, the campaign site Ballotpedia quoted for that election is used, then the one currently on the candidate's Ballotpedia page. Social media, donation pages and official House or Senate sites are never used.",
    "Text: archived captures from the 60 days before each election day, the same way for all four years. Nearly all come from Common Crawl's public crawls (late September and October 2020, late September 2022, September through early November 2024, mid-September 2026), and the Wayback Machine fills in two sites that Common Crawl missed. Each site contributes its homepage and up to three linked pages, preferring issue and biography pages and skipping donation, volunteer, contact, store and event pages. Text was extracted with trafilatura, and repeated paragraphs were removed. 2022 has a single Common Crawl crawl in the window, so fewer 2022 sites were recovered.",
    `Screening: paragraphs of page code, placeholder text (lorem ipsum), gambling spam and Spanish are removed before counting, because the English term list cannot read them or they are not the campaign's words. A site then needs at least 100 words. ${D.excluded} candidate-years were excluded as not campaign content, each checked by hand: lapsed or hijacked domains serving gambling or other spam, hosting-error pages, unfinished templates, sites holding only page titles and Spanish-only sites.`,
    "Measure: a candidate uses a term when it appears at least once in that candidate's collected text. Shares are the percentage of analyzed candidates in a party who used the term. Counting candidates rather than words keeps long sites from dominating.",
    "Terms: the list was fixed before any results were examined. Afterward, 20 randomly chosen users of each term named in the findings were checked by hand at one random match each. Six patterns were then narrowed to drop matches that are not the term's sense, such as the Inflation Reduction Act, the House Freedom Caucus, “business climate” and biographies that mention corporations, and each narrowed pattern was checked again on a fresh sample, which alone gives its precision. Every term in the findings matched its intended sense in at least 18 of 20 checked matches except “freedom” (17 of 20), whose remaining misses are award and endorser names. Matching still counts a word's appearance, not its stance: “abortion” counts both supporters and opponents of abortion rights.",
    "Who was analyzed: in every year, analyzed candidates are more often incumbents and more often won than candidates who were not analyzed, and analyzed Democrats more often ran in close races. By the presidential vote in each seat, which does not depend on the candidates, analyzed candidates of both parties more often ran in closely divided seats in 2022 and 2026, the years with complete seat data. Established campaigns' sites are probably archived more often. The results therefore lean toward incumbents and winning campaigns (table below).",
    `Returning candidates: ${D.stats.panel_candidates} candidates were analyzed in two or more years. Among them the Republican shifts hold, but several 2026 Democratic shifts are much smaller, so those come mostly from new candidates rather than returning ones changing their words.`,
    "Limits: these results describe what candidates' websites said, not what candidates believe, what voters heard or why language changed. Sites that were never archived, or archived without their issue pages, are missing; this is more common among minor-party and low-budget candidates, as the coverage table shows. Independent candidates are few in any year, so their shares move a lot with small changes.",
  ];
  document.getElementById("method").innerHTML = items.map(i => `<li>${esc(i)}</li>`).join("");

  let h = `<table><tr><th>Year</th><th class="l">Party</th><th>Analyzed</th><th>Incumbents</th><th>Won</th><th>Close races</th><th>Close seats</th></tr>`;
  for (const y of YEARS) for (const g of ["Democratic", "Republican"]) {
    const a = D.sel.find(s => s.y === y && s.g === g && s.a), b = D.sel.find(s => s.y === y && s.g === g && !s.a);
    if (!a || !b) continue;
    const vs = k => a[k] == null ? "–" : `${pct(a[k])} <span class="pct">vs ${pct(b[k])}</span>`;
    const seat = a.nseat === a.n && b.nseat === b.n ? vs("seat") : "–";  // shown only when every seat is covered
    h += `<tr><td>${g === "Democratic" ? y : ""}</td><td class="l">${g}</td><td>${a.n} of ${a.n + b.n}</td><td>${vs("inc")}</td><td>${vs("won")}</td><td>${vs("close")}</td><td>${seat}</td></tr>`;
  }
  document.getElementById("selection").innerHTML = h + `</table><p class="note">Each cell gives analyzed candidates first, then candidates not analyzed. Close race: the Democratic share of the two-party vote was at least 45% and under 55%. Results are from FEC certified returns (2020, 2022) and Ballotpedia's certified vote counts (2024); 2026 has no results yet.</p><p class="note">Close seat: the Democratic share of the two-party presidential vote in the district, or statewide for Senate, was at least 45% and under 55%. It uses the latest presidential result on that year's district lines (2020 for 2022, 2024 for 2026), from Ballotpedia, so it does not depend on the candidates themselves. Ballotpedia has no presidential results on 2020 district lines, or on 2024 lines in the nine states that redrew for 2026, so 2020 and 2024 are blank.</p>`;

  const P = new Map(D.panel.map(r => [[r.t, r.y, r.g].join("|"), r]));
  const sh = (src, t, y, g) => { const r = src(t, y, g); return r && r.n ? fmt(r.u / r.n) : "–"; };
  const all = (t, y, g) => get(t, y, "All", g), ret = (t, y, g) => P.get([t, y, g].join("|"));
  const keyTerms = [...new Set(D.findings.map(f => f.term))].concat(["middle class", "tariffs", "pro-life / unborn", "health care"])
    .filter((t, i, a) => a.indexOf(t) === i && terms.includes(t));
  h = `<table><tr><th>Term</th><th>Democrats, all</th><th>Democrats, returning</th><th>Republicans, all</th><th>Republicans, returning</th></tr>`;
  for (const t of keyTerms) h += `<tr><td>${esc(t)}</td>` + ["Democratic", "Republican"].map(g =>
    `<td>${sh(all, t, 2020, g)} → ${sh(all, t, 2026, g)}</td><td>${sh(ret, t, 2020, g)} → ${sh(ret, t, 2026, g)}</td>`).join("") + "</tr>";
  document.getElementById("panel").innerHTML = h + `</table><p class="note">Each cell shows the 2020 share, then the 2026 share. Returning: candidates analyzed in two or more of the four years. Each year's share uses those of them who ran that year, so the group differs a little from year to year.</p>`;

  const counts = [...new Set(D.prec.map(r => r.n))].join(" or ");
  h = `<table><tr><th>Term</th><th>Intended sense</th><th>95% interval</th></tr>`;
  for (const r of [...D.prec].sort((a, b) => a.k / a.n - b.k / b.n)) h += `<tr><td>${esc(r.t)}${r.fresh ? " *" : ""}</td><td>${Math.round(100 * r.k / r.n)}%</td><td>${Math.round(100 * r.lo)}–${Math.round(100 * r.hi)}%</td></tr>`;
  document.getElementById("precision").innerHTML = h + `</table><p class="note">${counts} randomly chosen matches were checked by hand for each term. Misses were mostly names of laws, awards and endorsing groups, and biographies. Terms marked * were narrowed after the first check, so their figures come only from a fresh sample drawn after narrowing.</p>`;

  const groups = ["Democratic", "Republican", "Independent", "Third party"];
  h = `<table><tr><th>Year</th>${groups.map(g => `<th>${g}</th>`).join("")}</tr>`;
  for (const y of YEARS) h += `<tr><td>${y}</td>` + groups.map(g => { const r = D.cross.find(c => c.y === y && c.g === g);
    return `<td>${r.bp}${r.fec != null ? ` <span class="pct">(FEC ${r.fec})</span>` : ""}</td>`; }).join("") + "</tr>";
  document.getElementById("crosscheck").innerHTML = h + `</table><p class="note">Candidates on Ballotpedia's lists, which the study uses for every year, beside the FEC's general-election lists for 2020–2024. The FEC has no list for 2026 before the election.</p>`;
}

const sel = document.getElementById("term");
sel.innerHTML = [...themes].map(([th, ts]) => `<optgroup label="${esc(th)}">${ts.map(t => `<option>${esc(t)}</option>`).join("")}</optgroup>`).join("");
sel.onchange = () => { state.term = sel.value; renderMain(); };
document.querySelectorAll("#office button").forEach(b => b.onclick = () => { state.office = b.dataset.v; renderMain(); });
document.getElementById("legend").innerHTML = legendHTML(PARTIES);
if (!terms.includes(state.term)) state.term = terms[0];
tiles(); findings(); renderMain(); overview(); distinctive(); coverage(); livecheck(); method();
let rz; window.addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => lineChart(document.getElementById("main-chart"), state.term, state.office), 150); });
</script>
</body>
</html>
"""

if __name__ == "__main__":
    main()
