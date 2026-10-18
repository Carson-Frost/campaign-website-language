/* Instrument treatment specimen. Every figure is computed from /data/site.json. */
(() => {
"use strict";

const C = { dem: "#23589C", rep: "#D8673F", ink: "#15191E", sec: "#56606B", muted: "#858F99", rule: "#D6DAE0", track: "#EEF0F3", tick: "#C9CED5" };
const YEARS = [2020, 2022, 2024, 2026];
const PARTIES = ["D", "R"];
const PNAME = { D: "Democratic", R: "Republican" };
const PCOL = { D: C.dem, R: C.rep };
const STATES = { AK: "Alaska", AL: "Alabama", AR: "Arkansas", AZ: "Arizona", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", IA: "Iowa", ID: "Idaho", IL: "Illinois", IN: "Indiana", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", MA: "Massachusetts", MD: "Maryland", ME: "Maine", MI: "Michigan", MN: "Minnesota", MO: "Missouri", MS: "Mississippi", MT: "Montana", NC: "North Carolina", ND: "North Dakota", NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NV: "Nevada", NY: "New York", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia", VT: "Vermont", WA: "Washington", WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming" };
const SMALL = 30, TINY = 10;

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const nf = n => n.toLocaleString("en-US");
const pct = x => (x * 100).toFixed(1) + "%";
const pt = x => (x * 100).toFixed(1);
const signed = x => (x > 0 ? "+" : x < 0 ? "−" : "") + Math.abs(x * 100).toFixed(1);
const slug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const yl = y => (y === 2026 ? "2026 so far" : String(y));
const isPhone = () => window.matchMedia("(max-width: 760px)").matches;

function glyph(p, size = 8, color) {
  const c = color || PCOL[p], h = size / 2;
  return p === "D"
    ? `<svg class="pglyph-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${h}" cy="${h}" r="${h}" fill="${c}"/></svg>`
    : `<svg class="pglyph-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><path d="M${h} 0 L${size} ${size} L0 ${size} Z" fill="${c}"/></svg>`;
}
function markAt(p, x, y, size, color, ring = true) {
  const h = size / 2, st = ring ? ` stroke="#fff" stroke-width="1.5" paint-order="stroke"` : "";
  if (p === "D") return `<circle cx="${x}" cy="${y}" r="${h}" fill="${color || PCOL.D}"${st}/>`;
  const t = size * 0.58;
  return `<path d="M${x} ${y - t} L${x + h + 0.6} ${y + size - t} L${x - h - 0.6} ${y + size - t} Z" fill="${color || PCOL.R}"${st}/>`;
}

/* ---------- state ---------- */
let D, TERM_BY_SLUG = {}, GROUPS = [];
const S = { terms: [1], f: {}, win: "year", panel: null, step: null, sort: { key: "year", dir: 1 } };
const excerptCache = {};

function buildGroups() {
  const states = Object.keys(STATES).sort((a, b) => STATES[a].localeCompare(STATES[b]));
  GROUPS = [
    { key: "year", label: "Year", opts: YEARS.map(y => ({ v: String(y), label: yl(y), test: c => c.year === y })) },
    { key: "party", label: "Party", opts: PARTIES.map(p => ({ v: p, label: PNAME[p], glyph: p, test: c => c.party === p })) },
    { key: "office", label: "Office", opts: ["House", "Senate"].map(o => ({ v: o, label: o, test: c => c.office === o })) },
    { key: "state", label: "State", scroll: true, opts: states.map(s => ({ v: s, label: STATES[s], test: c => c.state === s })) },
    { key: "inc", label: "Incumbent or challenger", opts: [{ v: "incumbent", label: "Incumbent", test: c => c.inc === 1 }, { v: "challenger", label: "Challenger", test: c => c.inc === 0 }] },
    { key: "seat", label: "Close or safe seat", opts: [{ v: "close", label: "Close seat", test: c => c.seat === "close" }, { v: "safe", label: "Safe seat", test: c => c.seat === "safe" }] },
    { key: "won", label: "Won or lost", opts: [{ v: "won", label: "Won", test: c => c.won === 1 }, { v: "lost", label: "Lost", test: c => c.won === 0 }] },
  ];
  GROUPS.forEach(g => { S.f[g.key] = new Set(); g.byV = Object.fromEntries(g.opts.map(o => [o.v, o])); });
}

function match(c, except) {
  for (const g of GROUPS) {
    if (g.key === except) continue;
    const sel = S.f[g.key];
    if (sel.size && ![...sel].some(v => g.byV[v].test(c))) return false;
  }
  return true;
}
const activeGroups = () => GROUPS.filter(g => S.f[g.key].size);
const isDefault = () => activeGroups().length === 0;
const shownYears = () => (S.f.year.size ? YEARS.filter(y => S.f.year.has(String(y))) : YEARS);
const shownParties = () => (S.f.party.size ? PARTIES.filter(p => S.f.party.has(p)) : PARTIES);

/* ---------- URL ---------- */
function readURL() {
  const q = new URLSearchParams(location.search);
  if (q.has("term")) S.terms = q.get("term").split(",").map(s => TERM_BY_SLUG[s]).filter(i => i !== undefined);
  GROUPS.forEach(g => {
    S.f[g.key] = new Set((q.get(g.key) || "").split(",").filter(v => g.byV[v]));
  });
  S.win = ["year", "120", "60"].includes(q.get("window")) ? q.get("window") : "year";
  S.panel = /^\d{4}-[DR]$/.test(q.get("panel") || "") ? q.get("panel") : null;
  S.step = q.get("step") === "saved-text" ? "saved-text" : null;
}
function writeURL() {
  const q = new URLSearchParams();
  const def = S.terms.length === 1 && S.terms[0] === 1;
  if (!def) q.set("term", S.terms.map(i => slug(D.terms[i].term)).join(","));
  GROUPS.forEach(g => { if (S.f[g.key].size) q.set(g.key, [...S.f[g.key]].join(",")); });
  if (S.win !== "year") q.set("window", S.win);
  if (S.panel) q.set("panel", S.panel);
  if (S.step) q.set("step", S.step);
  const s = q.toString().replace(/%2C/g, ",");
  history.replaceState(null, "", s ? "?" + s : location.pathname);
}

/* ---------- statistics ---------- */
function cell(ti, y, p, list) {
  const g = list.filter(c => c.year === y && c.party === p);
  const a = g.filter(c => c.status === "analyzed");
  let n = a.length, k = a.filter(c => c.terms.includes(ti)).length;
  const K = g.filter(c => c.status !== "no website").length, B = g.length;
  if (S.win !== "year" && isDefault()) {
    const w = D.windows.find(r => String(r.window) === S.win && r.sample === "all" && r.office === "All" && r.term === D.terms[ti].term && r.year === y && r.party_group === PNAME[p]);
    n = w.candidates_analyzed; k = w.candidates_using;
  }
  const share = n ? k / n : null;
  return { y, p, n, k, K, B, share, ci: n ? wilson(k, n) : null, range: n && K ? [k / K, (k + K - n) / K] : null };
}
function windowValues(ti, y, p) {
  return ["year", "120", "60"].filter(w => w !== S.win).map(w => {
    const r = D.windows.find(r => String(r.window) === w && r.sample === "all" && r.office === "All" && r.term === D.terms[ti].term && r.year === y && r.party_group === PNAME[p]);
    return r ? r.candidates_using / r.candidates_analyzed : null;
  }).filter(v => v !== null);
}
function gapOf(d, r, ti, y) {
  if (!d || !r || !d.n || !r.n) return null;
  const g = { v: d.share - r.share, ci: newcombe(d.k, d.n, r.k, r.n), q: null };
  if (isDefault() && S.win === "year") {
    const row = D.gaps.find(x => x.term === D.terms[ti].term && x.year === y);
    if (row) g.q = row.q_benjamini_hochberg;
  }
  return g;
}
const fmtQ = q => (q < 0.001 ? "<0.001" : q.toFixed(q < 0.01 ? 3 : 2));

/* ---------- rail ---------- */
function renderGroups() {
  const host = $("#groups");
  host.innerHTML = GROUPS.map(g => `
    <section class="grp" aria-labelledby="g-${g.key}">
      <div class="grp-head"><h2 id="g-${g.key}">${g.label}</h2><button type="button" class="textbtn clear" data-g="${g.key}" hidden>Clear</button></div>
      <ul class="opts${g.scroll ? " scroll" : ""}" id="o-${g.key}" aria-labelledby="g-${g.key}"></ul>
    </section>`).join("");
  host.addEventListener("change", e => {
    const t = e.target; if (!t.matches("input[type=checkbox]")) return;
    const set = S.f[t.dataset.g];
    t.checked ? set.add(t.value) : set.delete(t.value);
    S.panel = null;
    update({ keepFocus: t });
  });
  host.addEventListener("click", e => {
    const b = e.target.closest(".clear"); if (!b) return;
    S.f[b.dataset.g].clear(); S.panel = null; update();
  });
}
function renderOptions() {
  const list = D.candidates;
  GROUPS.forEach(g => {
    const base = list.filter(c => c.status === "analyzed" && match(c, g.key));
    const counts = g.opts.map(o => base.filter(o.test).length);
    const max = Math.max(1, ...counts);
    let opts = g.opts.map((o, i) => ({ o, n: counts[i] }));
    if (g.scroll) opts = opts.filter(x => S.f[g.key].has(x.o.v)).concat(opts.filter(x => !S.f[g.key].has(x.o.v)));
    const ul = $("#o-" + g.key);
    const scrollTop = ul.scrollTop;
    ul.innerHTML = opts.map(({ o, n }) => {
      const on = S.f[g.key].has(o.v);
      return `<li><label class="opt${n ? "" : " zero"}">
        <input type="checkbox" data-g="${g.key}" value="${o.v}"${on ? " checked" : ""}>
        <span class="box" aria-hidden="true"></span>
        <span class="lab">${o.glyph ? glyph(o.glyph, 9) : ""}${esc(o.label)}</span>
        <span class="cnt">${nf(n)}<span class="vh"> analyzed</span></span>
        <span class="bar" aria-hidden="true"><i style="width:${(n / max * 100).toFixed(2)}%"></i></span>
      </label></li>`;
    }).join("");
    ul.scrollTop = scrollTop;
    $(`.clear[data-g="${g.key}"]`).hidden = !S.f[g.key].size;
  });
}

/* term picker */
function renderChosen() {
  $("#chosen").innerHTML = S.terms.map(i => `<li><span class="term">${esc(D.terms[i].term)}</span>
    <button type="button" class="rm" data-i="${i}" aria-label="Remove ${esc(D.terms[i].term)}"><svg width="10" height="10" aria-hidden="true"><path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" stroke-width="1.5"/></svg></button></li>`).join("");
}
function setupCombo() {
  const inp = $("#termInput"), box = $("#suggest");
  let items = [], active = -1;
  const close = () => { box.hidden = true; inp.setAttribute("aria-expanded", "false"); inp.removeAttribute("aria-activedescendant"); active = -1; };
  const open = () => {
    const q = inp.value.trim().toLowerCase();
    items = D.terms.map((t, i) => ({ t, i })).filter(x => !S.terms.includes(x.i) && (!q || x.t.term.toLowerCase().includes(q)));
    let html = "", theme = null;
    items.forEach((x, j) => {
      if (x.t.theme !== theme) { theme = x.t.theme; html += `<li class="th" role="presentation">${esc(theme)}</li>`; }
      html += `<li role="option" id="sg-${j}" data-i="${x.i}" aria-selected="${j === active}">${esc(x.t.term)}</li>`;
    });
    box.innerHTML = html || `<li class="th" role="presentation">No term matches</li>`;
    box.hidden = false; inp.setAttribute("aria-expanded", "true");
  };
  const choose = i => { S.terms.push(i); inp.value = ""; close(); update(); inp.focus(); };
  const move = d => {
    if (!items.length) return;
    active = (active + d + items.length) % items.length;
    box.querySelectorAll("[role=option]").forEach((el, j) => el.setAttribute("aria-selected", String(j === active)));
    const el = $("#sg-" + active); inp.setAttribute("aria-activedescendant", el.id); el.scrollIntoView({ block: "nearest" });
  };
  inp.addEventListener("focus", open);
  inp.addEventListener("input", () => { active = -1; open(); });
  inp.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (box.hidden) open(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Enter") { e.preventDefault(); const x = items[active] || (items.length === 1 ? items[0] : null); if (x) choose(x.i); }
    else if (e.key === "Escape") { close(); }
  });
  inp.addEventListener("blur", () => setTimeout(close, 120));
  box.addEventListener("mousedown", e => { const o = e.target.closest("[role=option]"); if (o) { e.preventDefault(); choose(+o.dataset.i); } });
  $("#chosen").addEventListener("click", e => {
    const b = e.target.closest(".rm"); if (!b) return;
    S.terms = S.terms.filter(i => i !== +b.dataset.i); S.panel = null; update(); inp.focus();
  });
}

/* ---------- group line ---------- */
function renderGroupLine() {
  const g = D.candidates.filter(c => match(c));
  const a = g.filter(c => c.status === "analyzed").length;
  const n = activeGroups().length;
  $("#groupline").innerHTML = `<span><b>${nf(a)}</b> analyzed <span class="sep">·</span> ${nf(g.length - a)} not analyzed</span>
    <button type="button" class="filters-btn" id="filtersBtn" aria-controls="rail" aria-expanded="false">Filters${n ? ` (${n})` : ""}</button>`;
  $("#filtersBtn").addEventListener("click", openSheet);
}

/* ---------- pipeline ---------- */
const STEPS = [
  { name: "On the ballot", n: 3712, script: "universe.py · match_fec.py" },
  { name: "Known website", n: 3616, script: "fec_websites.py · bp_profiles.py", drops: [{ n: 96, t: "with no website" }] },
  { name: "Saved by Common Crawl", n: 2773, script: "cc.py --window year", id: "saved-text", drops: [{ n: 843, t: "with no saved text" }] },
  { name: "Analyzed", n: 2682, script: "analyze.py", drops: [{ n: 72, t: "under 100 words" }, { n: 19, t: "excluded after review", hand: true }] },
];
const stepLabel = (st, style) => {
  const inner = `<span class="name">${st.name}</span><span class="count">${nf(st.n)}</span><span class="script">${st.script}</span>`;
  return st.id ? `<button type="button" class="step" style="${style}" data-step="${st.id}" aria-haspopup="dialog">${inner}</button>`
    : `<div class="step" style="${style}">${inner}</div>`;
};
const dropLabel = (d, x, y) => `<text class="lbl" x="${x}" y="${y}"><tspan class="n">${nf(d.n)}</tspan> ${d.t}</text>`;
const ribbonStroke = (d, t) => d.hand ? `stroke="${C.sec}" stroke-width="1" stroke-dasharray="3 3"` : `stroke="${C.muted}" stroke-width="${Math.max(1, t).toFixed(2)}"`;
function renderPipeline() {
  const TH = 64, s = TH / 3712;
  const host = $("#pipeH"), W = host.clientWidth;
  if (W) {
    const xs = STEPS.map((_, i) => Math.round(i * W / 4)), P = 72, r = 10, base = TH + 30;
    let g = "";
    STEPS.forEach((st, k) => {
      const x0 = xs[k], x1 = k < 3 ? xs[k + 1] : W, nx = k < 3 ? STEPS[k + 1] : null;
      const xp = nx ? x1 - P : x1;
      g += `<rect x="${x0}" y="0" width="${xp - x0}" height="${(st.n * s).toFixed(2)}" fill="${C.tick}"/>`;
      if (nx) {
        g += `<rect x="${xp}" y="0" width="${x1 - xp}" height="${(nx.n * s).toFixed(2)}" fill="${C.tick}"/>`;
        let off = nx.n * s;
        const J = nx.drops.length;
        nx.drops.forEach((d, j) => {
          const t = d.n * s, ym = off + t / 2; off += t;
          const rr = Math.max(r, t / 2 + 8), xc = xp + 8 + (J - 1 - j) * 16, ye = base + j * 18;
          g += `<path d="M${xp} ${ym.toFixed(2)} H${xc} Q${xc + rr} ${ym.toFixed(2)} ${xc + rr} ${(ym + rr).toFixed(2)} V${ye - 4}" fill="none" ${ribbonStroke(d, t)}/>`;
          g += dropLabel(d, xc + rr + Math.max(1, t) / 2 + 6, ye);
        });
      }
    });
    STEPS.forEach((st, k) => { g += `<rect x="${xs[k]}" y="0" width="6" height="${(st.n * s).toFixed(2)}" fill="${C.ink}"/>`; });
    host.innerHTML = `<div class="steps">${STEPS.map((st, k) => stepLabel(st, `left:${xs[k]}px`)).join("")}</div>
      <svg width="${W}" height="${base + 22}" role="img" aria-label="${STEPS.map(st => st.name + " " + nf(st.n)).join(", ")}">${g}</svg>`;
  }
  const v = $("#pipeV"), VW = v.clientWidth;
  if (VW) {
    const HS = [104, 112, 132, 74], ys = [];
    HS.forEach((h, i) => ys.push(i ? ys[i - 1] + HS[i - 1] : 0));
    const total = ys[3] + HS[3], P = 40, r = 10, LX = 84;
    let g = "";
    STEPS.forEach((st, k) => {
      const y0 = ys[k], y1 = k < 3 ? ys[k + 1] : total, nx = k < 3 ? STEPS[k + 1] : null;
      const yp = nx ? y1 - P : y1;
      g += `<rect x="0" y="${y0}" width="${(st.n * s).toFixed(2)}" height="${yp - y0}" fill="${C.tick}"/>`;
      if (nx) {
        g += `<rect x="0" y="${yp}" width="${(nx.n * s).toFixed(2)}" height="${y1 - yp}" fill="${C.tick}"/>`;
        let off = nx.n * s;
        nx.drops.forEach((d, j) => {
          const t = d.n * s, xm = off + t / 2; off += t;
          const rr = Math.max(r, t / 2 + 8), yc = yp + 4 + (nx.drops.length - 1 - j) * 16, ye = yc + rr;
          g += `<path d="M${xm.toFixed(2)} ${yp} V${yc} Q${xm.toFixed(2)} ${ye.toFixed(2)} ${(xm + rr).toFixed(2)} ${ye.toFixed(2)} H${LX - 6}" fill="none" ${ribbonStroke(d, t)}/>`;
          g += dropLabel(d, LX, ye + 4);
        });
      }
    });
    STEPS.forEach((st, k) => { g += `<rect x="0" y="${ys[k]}" width="${(st.n * s).toFixed(2)}" height="6" fill="${C.ink}"/>`; });
    v.innerHTML = `<div class="vflow" style="height:${total}px"><svg width="${VW}" height="${total}" aria-hidden="true">${g}</svg>
      ${STEPS.map((st, k) => stepLabel(st, `left:${LX}px;top:${ys[k] - 2}px`)).join("")}</div>`;
  }
}

/* ---------- explorer ---------- */
function termCells(ti, list) {
  const years = shownYears(), parties = shownParties();
  return years.map(y => {
    const d = parties.includes("D") ? cell(ti, y, "D", list) : null;
    const r = parties.includes("R") ? cell(ti, y, "R", list) : null;
    return { y, d, r, g: gapOf(d, r, ti, y) };
  });
}
function renderExplorer() {
  const host = $("#explorer");
  if (!S.terms.length) {
    host.innerHTML = `<div class="rh"><h2>Terms</h2></div><p class="no-term">No term chosen. Add one under Term.</p>`;
    return;
  }
  const list = D.candidates.filter(c => match(c));
  const analyzed = list.filter(c => c.status === "analyzed").length;
  host.innerHTML = S.terms.map((ti, idx) => termBlock(ti, idx, list, analyzed)).join("");
  if (!analyzed) return;
  S.terms.forEach((ti, idx) => { drawTable(ti, idx, list); drawChart(ti, idx, list); });
}
function termBlock(ti, idx, list, analyzed) {
  const t = D.terms[ti];
  const winCtl = isDefault() && analyzed ? `<div class="seg" role="group" aria-label="Text window">
      ${[["year", "Election year"], ["120", "120 days"], ["60", "60 days"]].map(([v, l]) => `<button type="button" data-win="${v}" aria-pressed="${S.win === v}">${l}</button>`).join("")}</div>` : "";
  const body = analyzed
    ? `${keyHTML(termCells(ti, list))}<div class="view"><div class="chart" id="chart-${idx}"></div><div class="ytable-wrap" id="table-${idx}"></div></div>`
    : emptyHTML(list);
  return `<section class="term-block" aria-labelledby="th-${idx}">
    <div class="rh"><h2 id="th-${idx}"><span class="term-name">${esc(t.term)}</span><span class="theme">${esc(t.theme)}</span></h2>${winCtl}</div>
    ${body}
  </section>`;
}
function emptyHTML(list) {
  const where = GROUPS.filter(g => S.f[g.key].size && g.key !== "party").map(g => [...S.f[g.key]].map(v => g.byV[v].label).join(", ")).join(" · ");
  const rows = shownParties().map(p => {
    const g = list.filter(c => c.party === p);
    const why = {}; g.forEach(c => { why[c.status] = (why[c.status] || 0) + 1; });
    const detail = g.length
      ? `<span class="na" aria-label="not analyzed">—</span><span>${nf(g.length)} not analyzed <span class="why">(${Object.entries(why).map(([k, n]) => Object.keys(why).length > 1 ? `${n} ${esc(k)}` : esc(k)).join(", ")})</span></span>`
      : `<span></span><span class="why">none in the candidate list</span>`;
    return `<li><span class="ep">${glyph(p, 9)}${PNAME[p]}</span><span class="eb mono">${nf(g.length)} on ballot</span><span class="ed">${detail}</span></li>`;
  }).join("");
  const opts = activeGroups().map(g => ({ g, n: D.candidates.filter(c => c.status === "analyzed" && match(c, g.key)).length })).filter(x => x.n).sort((a, b) => b.n - a.n);
  return `<div class="empty">
    <p class="msg">0 analyzed candidates match</p>
    <p class="where">${esc(where)}</p>
    <ul class="eparty">${rows}</ul>
    ${opts.length ? `<div class="restore">${opts.map(x => `<button type="button" class="wbtn" data-clear="${x.g.key}">Clear ${x.g.label.toLowerCase()}<span class="mono n">${nf(x.n)} analyzed</span></button>`).join("")}</div>` : ""}
  </div>`;
}
function keyHTML(rows) {
  const cs = rows.flatMap(r => [r.d, r.r]).filter(Boolean);
  const small = cs.some(c => c.n && c.n < SMALL), tiny = cs.some(c => c.n && c.n < TINY), na = cs.some(c => !c.n && c.B);
  const sw = (svg, label) => `<li>${svg}<span>${label}</span></li>`;
  return `<ul class="key" aria-label="Key">
    ${sw(`<svg width="24" height="12" aria-hidden="true"><rect x="0" y="1" width="24" height="10" fill="${C.dem}" fill-opacity=".16"/></svg>`, "95% interval")}
    ${sw(`<svg width="24" height="12" aria-hidden="true"><path d="M0 1.5 H24 M0 10.5 H24" stroke="${C.dem}" stroke-dasharray="3 3"/></svg>`, "Possible range")}
    ${isDefault() ? sw(`<svg width="12" height="12" aria-hidden="true"><line x1="2" x2="10" y1="6" y2="6" stroke="${C.muted}" stroke-width="1.5"/></svg>`, "120- and 60-day windows") : ""}
    ${small ? sw(`<span class="k-muted">4/10</span>`, "Under 30 candidates") : ""}
    ${tiny ? sw(`<svg width="12" height="12" aria-hidden="true"><rect x="2" y="0" width="8" height="12" fill="${C.dem}" fill-opacity=".16"/></svg>`, "Under 10: no mark") : ""}
    ${na ? sw(`<span class="k-ink">—</span>`, "Not analyzed") : ""}
  </ul>`;
}

/* line chart: 2020 to 2026 */
function drawChart(ti, idx, list) {
  const host = $("#chart-" + idx); if (!host) return;
  const W = host.clientWidth, H = isPhone() ? 262 : 300;
  const m = { l: 36, r: 12, t: 28, b: isPhone() ? 46 : 32 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
  const inL = isPhone() ? 78 : 96, inR = isPhone() ? 40 : 64;
  const X = i => m.l + inL + i * (pw - inL - inR) / 3, Y = v => m.t + ph - v * ph;
  const years = shownYears(), parties = shownParties();
  const cells = {};
  parties.forEach(p => { cells[p] = years.map(y => cell(ti, y, p, list)); });
  const hx = (X(2) + X(3)) / 2;
  let s = `<svg width="${W}" height="${H}" role="img" aria-label="${esc(D.terms[ti].term)}: share of analyzed candidates by party and year">
    <defs><pattern id="hatch-${idx}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${C.rule}" stroke-width="1"/></pattern></defs>`;
  if (years.includes(2026)) s += `<rect x="${hx}" y="${m.t}" width="${m.l + pw - hx}" height="${ph}" fill="url(#hatch-${idx})"/>`;
  for (let v = 0; v <= 100; v += 10) {
    const y = Y(v / 100) + 0.5, major = v % 20 === 0;
    if (major) s += `<line x1="${m.l}" x2="${m.l + pw}" y1="${y}" y2="${y}" stroke="${v === 0 ? C.sec : C.track}"/>`;
    s += `<line x1="${m.l - (major ? 6 : 3)}" x2="${m.l}" y1="${y}" y2="${y}" stroke="${C.tick}"/>`;
    if (major) s += `<text class="axis mono" x="${m.l - 10}" y="${y + 4}" text-anchor="end">${v}</text>`;
  }
  s += `<text class="axis" x="${m.l - 10}" y="${m.t - 14}" text-anchor="start" style="text-anchor:start">Share of analyzed candidates using the term, %</text>`;
  YEARS.forEach((y, i) => {
    const lab = y === 2026 && isPhone() ? `2026<tspan x="${X(i)}" dy="14">so far</tspan>` : yl(y);
    s += `<text class="axis mono" x="${X(i)}" y="${m.t + ph + 20}" text-anchor="middle" fill="${years.includes(y) ? C.sec : C.tick}">${lab}</text>`;
  });
  const pos = c => X(YEARS.indexOf(c.y));
  // bands and ranges first, then lines, marks on top
  parties.forEach(p => {
    const cs = cells[p].filter(c => c.n);
    const runs = []; let run = [];
    cells[p].forEach(c => { if (c.n) run.push(c); else { if (run.length) runs.push(run); run = []; } });
    if (run.length) runs.push(run);
    runs.forEach(r => {
      if (r.length === 1) {
        const c = r[0], x = pos(c);
        s += `<rect x="${x - 7}" y="${Y(c.ci[1])}" width="14" height="${Y(c.ci[0]) - Y(c.ci[1])}" fill="${PCOL[p]}" fill-opacity=".16"/>`;
        s += `<path d="M${x - 10} ${Y(c.range[0])} h20 M${x - 10} ${Y(c.range[1])} h20" stroke="${PCOL[p]}" stroke-dasharray="3 3" fill="none"/>`;
      } else {
        const up = r.map(c => `${pos(c)},${Y(c.ci[1])}`), lo = r.slice().reverse().map(c => `${pos(c)},${Y(c.ci[0])}`);
        s += `<polygon points="${up.concat(lo).join(" ")}" fill="${PCOL[p]}" fill-opacity=".16"/>`;
        s += `<polyline points="${r.map(c => `${pos(c)},${Y(c.range[0])}`).join(" ")}" fill="none" stroke="${PCOL[p]}" stroke-dasharray="3 3"/>`;
        s += `<polyline points="${r.map(c => `${pos(c)},${Y(c.range[1])}`).join(" ")}" fill="none" stroke="${PCOL[p]}" stroke-dasharray="3 3"/>`;
      }
    });
    void cs;
  });
  parties.forEach(p => {
    const cs = cells[p];
    for (let i = 0; i < cs.length - 1; i++) {
      const a = cs[i], b = cs[i + 1];
      if (a.n >= TINY && b.n >= TINY) s += `<line x1="${pos(a)}" y1="${Y(a.share)}" x2="${pos(b)}" y2="${Y(b.share)}" stroke="${PCOL[p]}" stroke-width="2" stroke-linecap="round"/>`;
    }
  });
  if (isDefault()) parties.forEach(p => cells[p].forEach(c => windowValues(ti, c.y, p).forEach(v => {
    s += `<line x1="${pos(c) + 8}" x2="${pos(c) + 15}" y1="${Y(v)}" y2="${Y(v)}" stroke="${C.muted}" stroke-width="1.5"/>`;
  })));
  parties.forEach(p => cells[p].forEach(c => { if (c.n >= TINY) s += markAt(p, pos(c), Y(c.share), 7); }));
  // party names label the first marks, set to their left
  const first = parties.map(p => cells[p].find(c => c.n)).filter(Boolean);
  const ly = first.map(c => Y(c.share) + 4);
  if (ly.length === 2 && pos(first[0]) === pos(first[1]) && Math.abs(ly[0] - ly[1]) < 16) {
    const up = ly[0] <= ly[1] ? 0 : 1, mid = (ly[0] + ly[1]) / 2;
    ly[up] = mid - 8; ly[1 - up] = mid + 8;
  }
  first.forEach((c, i) => { s += `<text class="plabel" x="${pos(c) - 12}" y="${ly[i]}" text-anchor="end">${PNAME[c.p]}</text>`; });
  s += `<line class="xh" x1="0" x2="0" y1="${m.t}" y2="${m.t + ph}" stroke="${C.ink}" stroke-width="1" visibility="hidden"/>`;
  s += `<rect x="${m.l}" y="${m.t}" width="${pw}" height="${ph}" fill="transparent" class="hit"/></svg><div class="tip" hidden></div>`;
  host.innerHTML = s;
  // crosshair + tooltip
  const svg = host.querySelector("svg"), tip = host.querySelector(".tip"), xh = host.querySelector(".xh");
  const show = i => {
    const y = YEARS[i]; if (!years.includes(y)) { hide(); return; }
    const x = X(i); xh.setAttribute("x1", x); xh.setAttribute("x2", x); xh.setAttribute("visibility", "visible");
    const row = p => { const c = cells[p].find(c => c.y === y); if (!c) return "";
      return `<div class="tr">${glyph(p, 8)}<span class="tv">${c.n ? pct(c.share) : "—"}</span><span class="tn">${c.n ? `${c.k}/${c.n}` : "not analyzed"}</span></div>`; };
    tip.innerHTML = `<div class="ty">${yl(y)}</div>` + parties.map(row).join("");
    tip.hidden = false;
    const left = x + 12 + 180 > W ? x - 12 - tip.offsetWidth : x + 12;
    tip.style.left = left + "px"; tip.style.top = m.t + "px";
  };
  const hide = () => { tip.hidden = true; xh.setAttribute("visibility", "hidden"); };
  svg.addEventListener("pointermove", e => {
    const r = svg.getBoundingClientRect(), px = e.clientX - r.left;
    let best = 0; YEARS.forEach((y, i) => { if (Math.abs(X(i) - px) < Math.abs(X(best) - px)) best = i; });
    show(best);
  });
  svg.addEventListener("pointerleave", hide);
}

/* tracks */
function shareTrack(cs, w, opts = {}) {
  const h = opts.h || 36, pad = 0, lanes = cs.length, X = v => pad + v * (w - 2 * pad);
  const ty = 4, th = h - 8;
  let s = `<svg width="${w}" height="${h}" aria-hidden="true"><rect x="0" y="${ty}" width="${w}" height="${th}" fill="${C.track}"/>`;
  for (let v = 0; v <= 100; v += 10) {
    const x = Math.round(X(v / 100)) + (v === 100 ? -0.5 : 0.5), len = v === 50 ? 6 : 3;
    s += `<line x1="${x}" x2="${x}" y1="${ty}" y2="${ty + len}" stroke="${C.tick}"/><line x1="${x}" x2="${x}" y1="${ty + th - len}" y2="${ty + th}" stroke="${C.tick}"/>`;
  }
  cs.forEach((c, i) => {
    if (!c || !c.n) return;
    const cy = lanes === 1 ? h / 2 : ty + th * (i === 0 ? 0.3 : 0.7);
    const col = PCOL[c.p];
    if (c.range) s += `<rect x="${X(c.range[0]) + 0.5}" y="${cy - 5.5}" width="${Math.max(1, X(c.range[1]) - X(c.range[0]) - 1)}" height="11" fill="none" stroke="${C.sec}" stroke-dasharray="3 2"/>`;
    s += `<line x1="${X(c.ci[0])}" x2="${X(c.ci[1])}" y1="${cy}" y2="${cy}" stroke="${col}" stroke-width="2"/>`;
    if (c.n >= TINY) s += markAt(c.p, X(c.share), cy, 8);
  });
  return s + "</svg>";
}
function gapTrack(g, w, h = 36) {
  const X = v => (v + 0.5) * w;
  let s = `<svg width="${w}" height="${h}" aria-hidden="true">`;
  for (let v = -50; v <= 50; v += 10) { const x = Math.round(X(v / 100)) + (v === 50 ? -0.5 : 0.5); s += `<line x1="${x}" x2="${x}" y1="${h - 7}" y2="${h - 4}" stroke="${C.tick}"/>`; }
  s += `<line x1="${X(0) + 0.5}" x2="${X(0) + 0.5}" y1="4" y2="${h - 4}" stroke="${C.sec}"/>`;
  if (g) {
    const lo = Math.max(-0.5, g.ci[0]), hi = Math.min(0.5, g.ci[1]);
    s += `<rect x="${X(lo)}" y="${h / 2 - 3}" width="${Math.max(1, X(hi) - X(lo))}" height="6" fill="${C.tick}"/>`;
    s += `<rect x="${X(Math.max(-0.5, Math.min(0.5, g.v))) - 1}" y="${h / 2 - 8}" width="2" height="16" fill="${C.ink}"/>`;
  }
  return s + "</svg>";
}
function scaleLabels(w, ticks, fmt) {
  return `<svg class="sc" width="${w}" height="14" aria-hidden="true">${ticks.map(([v, a]) => `<text class="axis mono" x="${v * w + (a === "end" ? 0 : 0)}" y="11" text-anchor="${a}">${fmt(v)}</text>`).join("")}</svg>`;
}

function countCell(c, cls) {
  if (!c) return "";
  const small = c.n && c.n < SMALL ? " small" : "";
  if (!c.B) return `<td class="num ${cls}"><span class="pglyph">${glyph(c.p, 9)}</span><span class="cnt">0 on ballot</span></td>`;
  const body = c.n ? `<span class="cnt">${c.k}/${c.n}</span>` : `<span class="na" aria-label="not analyzed">—</span>`;
  const label = c.n ? `${PNAME[c.p]} ${yl(c.y)}: ${c.k} of ${c.n} analyzed candidates used the term (${pct(c.share)}). Show candidates` : `${PNAME[c.p]} ${yl(c.y)}: not analyzed. Show candidates`;
  const on = S.panel === `${c.y}-${c.p}` ? " on" : "";
  return `<td class="num ${cls}${small}"><span class="pglyph">${glyph(c.p, 9)}</span><button type="button" class="share-btn${on}" aria-expanded="${!!on}" data-panel="${c.y}-${c.p}" aria-label="${esc(label)}">${body}</button></td>`;
}
function drawTable(ti, idx, list) {
  const host = $("#table-" + idx); if (!host) return;
  const phone = isPhone(), parties = shownParties(), two = parties.length === 2;
  const showP = two && isDefault() && S.win === "year";
  const rows = termCells(ti, list);
  const k = S.sort.key, dir = S.sort.dir;
  const val = row => ({ year: row.y, d: row.d && row.d.n ? row.d.share : -1, r: row.r && row.r.n ? row.r.share : -1, gap: row.g ? row.g.v : -9, p: row.g && row.g.q !== null ? row.g.q : 9 }[k]);
  rows.sort((a, b) => (val(a) - val(b)) * dir);
  const gapW = phone ? Math.max(80, host.clientWidth - 264) : 120;
  const arrow = key => (S.sort.key === key ? (S.sort.dir > 0 ? "↑" : "↓") : "");
  const ariaSort = key => (S.sort.key === key ? (S.sort.dir > 0 ? "ascending" : "descending") : "none");
  const th = (key, label, cls = "", sub = "") => `<th class="${cls}" aria-sort="${ariaSort(key)}" scope="col"><button type="button" data-sort="${key}">${label}<span class="arrow" aria-hidden="true">${arrow(key)}</span></button>${sub}</th>`;
  const usedSub = `<span class="sub">used/<wbr>analyzed</span>`;
  let html = `<table class="yt"><caption class="vh">${esc(D.terms[ti].term)}: candidates using the term and party gap by year</caption><thead><tr>
    ${th("year", "Year")}
    ${parties.includes("D") ? th("d", `${glyph("D", 9)} Dem.`, "num", usedSub) : ""}
    ${parties.includes("R") ? th("r", `${glyph("R", 9)} Rep.`, "num", usedSub) : ""}
    ${two ? th("gap", "Gap, D − R", "gaph", scaleLabels(gapW, [[0, "start"], [0.5, "middle"], [1, "end"]], v => (v === 0 ? "R+50" : v === 1 ? "D+50" : "0"))) : ""}
    ${showP ? th("p", "Adj. p", "num pcol") : ""}
  </tr></thead><tbody>`;
  rows.forEach(row => {
    const g = row.g, gsmall = g && (row.d.n < SMALL || row.r.n < SMALL) ? " small" : "";
    const gl = g ? `Gap ${signed(g.v)} points, 95% interval ${signed(g.ci[0])} to ${signed(g.ci[1])}` : "";
    html += `<tr class="${row.y === 2026 ? "y2026" : ""}">
      <td class="year">${row.y === 2026 ? `2026<span class="sofar"> so far</span>` : row.y}</td>
      ${parties.includes("D") ? countCell(row.d, "d") : ""}
      ${parties.includes("R") ? countCell(row.r, "r") : ""}
      ${two ? `<td class="gapc${gsmall}" title="${esc(gl)}"><div class="gw"><span class="gn">${g ? signed(g.v) : ""}</span>${g ? gapTrack(g, gapW) : ""}</div>${showP && g && g.q !== null ? `<span class="gp">adj. p ${fmtQ(g.q)}</span>` : ""}<span class="vh">${esc(gl)}</span></td>` : ""}
      ${showP ? `<td class="num p">${g && g.q !== null ? fmtQ(g.q) : ""}</td>` : ""}
    </tr>`;
  });
  host.innerHTML = html + "</tbody></table>";
}

/* ---------- candidate panel ---------- */
async function renderPanel() {
  const el = $("#panel");
  if (!S.panel || !S.terms.length) { el.classList.add("closed"); el.innerHTML = ""; return; }
  const [y, p] = [+S.panel.slice(0, 4), S.panel.slice(5)];
  const ti = S.terms[0];
  const group = D.candidates.filter(c => c.year === y && c.party === p && match(c, "year") && match(c, "party"));
  const an = group.filter(c => c.status === "analyzed"), users = an.filter(c => c.terms.includes(ti));
  const nonusers = an.filter(c => !c.terms.includes(ti)), out = group.filter(c => c.status !== "analyzed");
  if (!excerptCache[ti]) {
    try { excerptCache[ti] = await (await fetch(`/data/excerpts/${ti}.json`)).json(); } catch (e) { excerptCache[ti] = {}; }
  }
  const ex = excerptCache[ti];
  const where = S.f.state.size ? [...S.f.state].map(s => STATES[s]).join(", ") : "All states";
  const sub = [S.f.office.size ? [...S.f.office].join(", ") : "House and Senate"].concat(GROUPS.filter(g => ["inc", "seat", "won"].includes(g.key) && S.f[g.key].size).map(g => [...S.f[g.key]].join(", "))).join(" · ");
  const c = an.length ? { p, y, n: an.length, k: users.length, ci: wilson(users.length, an.length), share: users.length / an.length, range: null } : null;
  if (c) { const K = group.filter(x => x.status !== "no website").length; c.range = K ? [c.k / K, (c.k + K - c.n) / K] : null; }
  const seat = x => `${x.state}-${x.office === "Senate" ? "Senate" : x.district === "00" ? "AL" : x.district}`;
  const meta = x => [seat(x), x.inc ? "incumbent" : "challenger", x.won === 1 ? "won" : x.won === 0 ? "lost" : null, x.seat ? x.seat + " seat" : null].filter(Boolean).join(" · ");
  const trim = (s, n, end) => {
    if (s.length <= n) return s;
    if (end) { const t = s.slice(-n); return "…" + t.slice(t.indexOf(" ") + 1); }
    const t = s.slice(0, n); return t.slice(0, t.lastIndexOf(" ")) + "…";
  };
  const row = (x, use) => {
    const e = use === "yes" && ex[x.id];
    const mark = use === "yes" ? glyph(p, 9) : use === "no" ? `<svg width="9" height="9" aria-hidden="true"><circle cx="4.5" cy="4.5" r="4" fill="none" stroke="${C.muted}"/></svg>` : `<span class="na">—</span>`;
    const lab = use === "yes" ? "used the term" : use === "no" ? "did not use the term" : "not analyzed: " + x.status;
    return `<li><div class="row"><div><div class="nm">${esc(x.name)}</div><div class="meta">${esc(meta(x))}${use === "out" ? " · " + esc(x.status) : ""}</div></div><span class="use" role="img" aria-label="${esc(lab)}">${mark}</span></div>
      ${e ? `<p class="ex">${esc(trim(e[0], 70, true))}<mark>${esc(e[1])}</mark>${esc(trim(e[2], 70, false))}</p>` : ""}</li>`;
  };
  el.innerHTML = `<div class="panel-head"><div><h2 id="panelTitle">${esc(where)}, ${yl(y)}, ${PNAME[p]}</h2><div class="sub">${esc(sub)}</div></div>
      <button type="button" class="close" id="panelClose">Close</button></div>
    <div class="p-sum">${c ? `<div><span class="big">${c.k} of ${c.n}</span><span class="of">${pct(c.share)}</span></div>
      <div class="what">analyzed candidates used <span class="mono">${esc(D.terms[ti].term)}</span></div>${shareTrack([c], isPhone() ? $("#panel").clientWidth - 32 : 311, { h: 24 })}${scaleLabels(isPhone() ? $("#panel").clientWidth - 32 : 311, [[0, "start"], [0.5, "middle"], [1, "end"]], v => String(v * 100))}` : `<div class="big">0 analyzed</div>`}</div>
    <ul class="clist">
      <li class="hd"><span>Candidate</span><span>Used the term</span></li>
      ${users.map(x => row(x, "yes")).join("")}
      ${nonusers.map(x => row(x, "no")).join("")}
      ${out.length ? `<li class="hd"><span>Not analyzed</span><span class="mono">${out.length}</span></li>` + out.map(x => row(x, "out")).join("") : ""}
    </ul>`;
  el.classList.remove("closed");
  $("#panelClose").addEventListener("click", closePanel);
}
let panelOpener = null;
function closePanel() { S.panel = null; update(); panelOpener = panelOpener && $(`[data-panel="${panelOpener.dataset.panel}"]`); if (panelOpener && document.body.contains(panelOpener)) panelOpener.focus(); }

/* ---------- step dialog ---------- */
function ruledBar(v, w) {
  let s = `<svg width="${w}" height="14" aria-hidden="true"><rect y="0" width="${w}" height="8" fill="${C.track}"/><rect y="0" width="${(v * w).toFixed(1)}" height="8" fill="${C.ink}"/>`;
  for (let t = 0; t <= 10; t++) { const x = Math.min(w - 0.5, Math.round(t / 10 * w) + 0.5); s += `<line x1="${x}" x2="${x}" y1="10" y2="${t === 5 || t % 10 === 0 ? 14 : 12}" stroke="${C.tick}"/>`; }
  return s + "</svg>";
}
function renderStep() {
  const dlg = $("#stepDlg");
  if (!S.step) { if (dlg.open) dlg.close(); return; }
  const byYP = YEARS.flatMap(y => PARTIES.map(p => {
    const rows = D.coverage.filter(r => r.year === y && r.party_group === PNAME[p]);
    return { y, p, i: rows.reduce((a, r) => a + r.website_known, 0), o: rows.reduce((a, r) => a + r.any_text, 0) };
  }));
  const win = w => D.coverage_windows.filter(r => String(r.window) === w && r.year < 2026).reduce((a, r) => a + r.analyzed, 0);
  const ex = D.candidates.find(c => c.id === "2024-H0WA08046");
  const date = ex.latest.replace(/(\d{4})(\d\d)(\d\d)/, "$1-$2-$3");
  const bw = isPhone() ? 56 : 120;
  dlg.innerHTML = `<div class="dlg-in">
    <div class="dlg-head"><div><h2 id="stepTitle" tabindex="-1" autofocus>Saved by Common Crawl</h2><div class="sub">Step 3 of 4 · cc.py --window year · same code for every candidate-year</div></div>
      <button type="button" class="close" id="stepClose">Close</button></div>
    <div class="readout">
      <div><span class="k">In: known website</span><span class="v">3,616</span></div>
      <span class="arrow" aria-hidden="true">→</span>
      <div><span class="k">Out: saved text</span><span class="v">2,773</span></div>
      <div><span class="k">No saved text</span><span class="v out">843</span></div>
    </div>
    <table class="yp"><caption class="vh">Candidate-years with a known website and with saved text, by year and party</caption>
      <thead><tr><th scope="col">Year</th>${PARTIES.map(p => `<th scope="col" colspan="3"><span class="ph">${glyph(p, 9)} ${PNAME[p]}${isPhone() ? "" : ", saved of known"}</span></th>`).join("")}</tr></thead><tbody>
      ${YEARS.map(y => `<tr class="${y === 2026 ? "y2026" : ""}"><td class="yr">${y === 2026 ? `2026<span class="sofar"> so far</span>` : y}</td>${PARTIES.map(p => {
        const r = byYP.find(r => r.y === y && r.p === p);
        return `<td class="num io">${nf(r.o)}/${nf(r.i)}</td><td class="bar">${ruledBar(r.o / r.i, bw)}</td><td class="num pc">${(r.o / r.i * 100).toFixed(0)}%</td>`;
      }).join("")}</tr>`).join("")}
      </tbody></table>
    <dl class="fields">
      <dt>Rule</dt><dd>Keep the latest capture of the homepage and up to three linked pages saved between January 1 of the election year and election day.</dd>
      <dt>Source</dt><dd>Common Crawl, every crawl of each election year: 8 in 2020, 5 in 2022, 9 in 2024, 9 in 2026 through September. A few sites come from the Wayback Machine.</dd>
      <dt>Standard</dt><dd>None published; stated as a limitation. The window that saves the most sites, as the analysis plan requires. Druckman, Kifer and Parkin (2009) used the last 10 days.</dd>
      <dt>Other windows</dt><dd><span class="mono">${nf(win("year"))}</span> analyzed in 2020–2024 with this window, <span class="mono">${nf(win("120"))}</span> with 120 days, <span class="mono">${nf(win("60"))}</span> with 60 days.</dd>
      <dt>Example</dt><dd><div class="example">${esc(ex.site)} <span class="arr">→</span> ${ex.pages} pages, latest capture ${date}</div><span class="example"><span class="who">${esc(ex.name)}, ${ex.state}-${ex.district}, ${ex.year}. One of 3,616 sites run through this step the same way.</span></span></dd>
    </dl></div>`;
  $("#stepClose").addEventListener("click", () => dlg.close());
  if (!dlg.open) dlg.showModal();
}

/* ---------- phone sheet ---------- */
let sheetOpener = null;
function openSheet(e) { sheetOpener = e && e.currentTarget; $("#rail").classList.add("open"); $("#sheetDone").focus(); const b = $("#filtersBtn"); if (b) b.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; }
function closeSheet() { $("#rail").classList.remove("open"); document.body.style.overflow = ""; const b = $("#filtersBtn"); if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); } }

/* ---------- update ---------- */
function update(o = {}) {
  writeURL();
  renderChosen();
  renderOptions();
  renderGroupLine();
  renderExplorer();
  const ready = renderPanel();
  if (o.keepFocus) {
    const sel = `input[data-g="${o.keepFocus.dataset.g}"][value="${o.keepFocus.value}"]`;
    const el = $(sel); if (el) el.focus();
  }
  return ready;
}

function wire() {
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-step],[data-win],[data-sort],[data-panel],[data-clear]");
    if (!t) return;
    if (t.dataset.step) { S.step = t.dataset.step; writeURL(); renderStep(); }
    else if (t.dataset.win) { S.win = t.dataset.win; update(); const b = $(`[data-win="${S.win}"]`); if (b) b.focus(); }
    else if (t.dataset.sort) { const k = t.dataset.sort; S.sort = { key: k, dir: S.sort.key === k ? -S.sort.dir : (k === "year" ? 1 : -1) }; renderExplorer(); const b = $(`[data-sort="${k}"]`); if (b) b.focus(); }
    else if (t.dataset.panel) { S.panel = t.dataset.panel; update().then(() => { panelOpener = $(`[data-panel="${S.panel}"]`); $("#panel").focus(); }); }
    else if (t.dataset.clear) { S.f[t.dataset.clear].clear(); update(); }
  });
  $("#stepDlg").addEventListener("close", () => { S.step = null; writeURL(); const b = $('.pipe:not([style*="none"]) [data-step]'); if (b && b.offsetParent) b.focus(); });
  $("#sheetDone").addEventListener("click", closeSheet);
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if ($("#rail").classList.contains("open")) closeSheet();
    else if (S.panel) closePanel();
  });
  let rt; window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { renderPipeline(); renderExplorer(); }, 120); });
}

async function init() {
  D = await (await fetch("/data/site.json")).json();
  D.terms.forEach((t, i) => { TERM_BY_SLUG[slug(t.term)] = i; });
  buildGroups();
  renderGroups();
  readURL();
  setupCombo();
  wire();
  await document.fonts.ready;
  renderPipeline();
  update();
  renderStep();
  document.documentElement.dataset.ready = "1";
}
init();
})();
