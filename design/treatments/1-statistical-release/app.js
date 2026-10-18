"use strict";
// Statistical Release specimen. Every figure is computed from /data/site.json; intervals use ../stats.js.

const YEARS = [2020, 2022, 2024, 2026];
const PARTY = { D: "Democratic", R: "Republican" };
const COLOR = { D: "#1F5A9E", R: "#B23A2E" };
const ELECTION = { 2020: "2020-11-03", 2022: "2022-11-08", 2024: "2024-11-05", 2026: "2026-11-03" };
const EXAMPLE_ID = "2024-H0WA08046";
const DEFAULT_TERM = "working families";
const SMALL = 10;
const STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho",
  IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas",
  UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
  WI: "Wisconsin", WY: "Wyoming",
};
const STATUS = {
  "no website": "no known website",
  "no saved text": "no saved text",
  "under 100 words": "under 100 words",
  excluded: "excluded after review",
};

const fmt = (n) => n.toLocaleString("en-US");
const pc = (x) => (x * 100).toFixed(1);
const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const $ = (s) => document.querySelector(s);

let DATA, CANDS, TERMS;
const ctx = document.createElement("canvas").getContext("2d");
function textW(s, weight = 400, size = 14) {
  ctx.font = `${weight} ${size}px "Source Sans 3"`;
  return ctx.measureText(s).width;
}

function glyph(p, hollow = false, size = 8) {
  const c = COLOR[p];
  if (p === "D") {
    const r = size / 2;
    return hollow
      ? `<svg width="${size}" height="${size}" aria-hidden="true"><circle cx="${r}" cy="${r}" r="${r - 1}" fill="#fff" stroke="${c}" stroke-width="2"/></svg>`
      : `<svg width="${size}" height="${size}" aria-hidden="true"><circle cx="${r}" cy="${r}" r="${r}" fill="${c}"/></svg>`;
  }
  return hollow
    ? `<svg width="${size}" height="${size}" aria-hidden="true"><rect x="1" y="1" width="${size - 2}" height="${size - 2}" fill="#fff" stroke="${c}" stroke-width="2"/></svg>`
    : `<svg width="${size}" height="${size}" aria-hidden="true"><rect width="${size}" height="${size}" fill="${c}"/></svg>`;
}

/* ---------- Process path ---------- */

function stepBar(total, n, lost, opts = {}) {
  // n passed; lost = [from, to] in candidate-years on the 3,712 scale; split = optional divider
  const w = (v) => `${(v / total) * 100}%`;
  let lostHtml = "";
  if (lost) {
    const div = opts.split ? `<span class="div" style="left:${((opts.split - lost[0]) / (lost[1] - lost[0])) * 100}%"></span>` : "";
    lostHtml = `<span class="lost" style="left:${w(lost[0])};width:${w(lost[1] - lost[0])}">${div}</span>`;
  }
  return `<div class="bar" aria-hidden="true"><span class="pass" style="width:${w(n)}"></span>${lostHtml}</div>`;
}

function stepLine(n, what, loss, lossRight, total) {
  const l = loss ? `<span class="loss" style="left:${(lossRight / total) * 100}%">${loss}</span>` : "";
  return `<div class="step-line"><span class="lead">${fmt(n)}</span><span class="what">${what}</span>${l}</div>`;
}

function renderFunnel() {
  const total = CANDS.length;
  const count = (s) => CANDS.filter((c) => c.status === s).length;
  const known = total - count("no website");
  const saved = known - count("no saved text");
  const under = count("under 100 words");
  const excl = count("excluded");
  const an = count("analyzed");
  const steps = [
    { n: total, what: "Democratic and Republican candidate-years on general-election ballots" },
    { n: known, what: "with a known campaign website", loss: `${fmt(total - known)} without`, lost: [known, total] },
    { n: saved, what: "with text saved by Common Crawl in the election year", loss: `${fmt(known - saved)} without`, lost: [saved, known] },
    { n: an, what: "analyzed", loss: `${under} under 100 words, ${excl} excluded`, lost: [an, saved], split: an + under, check: [an + under, saved, `${excl} excluded sites, each read by hand`] },
  ];
  $("#steps").innerHTML = steps
    .map((s) => {
      let check = "";
      if (s.check) {
        const [a, b, label] = s.check;
        check = `<div class="check" data-a="${a / total}" data-b="${b / total}"><svg class="dash" aria-hidden="true"></svg><span class="check-label">${label}</span></div>`;
      }
      return `<li>${stepLine(s.n, s.what, s.loss, s.lost ? s.lost[1] : 0, total)}${stepBar(total, s.n, s.lost, s)}${check}</li>`;
    })
    .join("");

  // The step shown in full
  $("#step-bars").innerHTML =
    `<div class="stepbar">${stepLine(known, "candidate-years in, each with a known website", "", 0, total)}${stepBar(total, known, null)}</div>` +
    `<div class="stepbar">${stepLine(saved, "out, with text saved in the window", `${fmt(known - saved)} with no saved text`, known, total)}${stepBar(total, saved, [saved, known])}</div>`;
  placeChecks();
}

function placeChecks() {
  // A hand check hangs under the step it checked: a dashed outline as wide as its sample.
  document.querySelectorAll(".check").forEach((el) => {
    const W = el.clientWidth;
    const lab = el.querySelector(".check-label");
    const a = +el.dataset.a * W, b = +el.dataset.b * W;
    const w = b - a, H = 28;
    const svg = el.querySelector(".dash");
    svg.setAttribute("width", Math.max(2, w));
    svg.setAttribute("height", H);
    svg.style.left = `${a}px`;
    svg.innerHTML = w >= 4
      ? `<rect x="0.75" y="0" width="${w - 1.5}" height="${H - 0.75}" fill="none" stroke="#0B0C0C" stroke-width="1.5" stroke-dasharray="3 2"/>`
      : `<line x1="${Math.max(2, w) / 2}" x2="${Math.max(2, w) / 2}" y1="0" y2="${H}" stroke="#0B0C0C" stroke-width="2" stroke-dasharray="3 2"/>`;
    lab.style.left = `${Math.max(0, a - 10 - lab.offsetWidth)}px`;
  });
}

/* ---------- Capture dates ---------- */

function dayOf(s) {
  return Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8));
}

function renderCaptures() {
  const host = $("#capture-chart");
  const phone = host.clientWidth < 640;
  const W = phone ? host.clientWidth : host.clientWidth - 106;
  const bins = {}, ends = {};
  let max = 0, span = 0;
  for (const y of YEARS) {
    const start = Date.UTC(y, 0, 1);
    const end = Date.parse(ELECTION[y]);
    const days = (end - start) / 864e5 + 1;
    ends[y] = days;
    span = Math.max(span, days);
    const b = new Array(Math.ceil(days / 7)).fill(0);
    for (const c of CANDS) {
      if (c.year !== y || !c.latest) continue;
      const d = (dayOf(c.latest) - start) / 864e5;
      if (d >= 0 && d < days) b[Math.floor(d / 7)]++;
    }
    bins[y] = b;
    max = Math.max(max, ...b);
  }
  const H = 64, top = 18;
  const ex = CANDS.find((c) => c.id === EXAMPLE_ID);
  let html = "";
  for (const y of YEARS) {
    const days = ends[y];
    const x = (d) => (d / span) * W;
    const hollow = y === 2026;
    let bars = "";
    let peak = 0, peakI = 0;
    bins[y].forEach((v, i) => {
      if (v > peak) { peak = v; peakI = i; }
      if (!v) return;
      const x0 = x(i * 7) + 1, x1 = Math.min(x((i + 1) * 7), x(days)) - 1;
      const h = Math.max(1, (v / max) * H);
      bars += hollow
        ? `<rect x="${x0 + 0.5}" y="${top + H - h + 0.5}" width="${Math.max(0, x1 - x0 - 1)}" height="${Math.max(0, h - 1)}" fill="#fff" stroke="#0B0C0C" stroke-width="1"/>`
        : `<rect x="${x0}" y="${top + H - h}" width="${x1 - x0}" height="${h}" fill="#0B0C0C"/>`;
    });
    const px = (x(peakI * 7) + Math.min(x((peakI + 1) * 7), x(days))) / 2;
    const peakLabel = `<text x="${px}" y="${top + H - (peak / max) * H - 5}" text-anchor="middle">${peak}</text>`;
    let mark = "";
    const isEx = ex && ex.year === y;
    const exH = isEx ? 14 : 0;
    if (isEx) {
      const d = (dayOf(ex.latest) - Date.UTC(y, 0, 1)) / 864e5;
      const mx = x(d);
      mark = `<path d="M${mx - 5} ${top + H + 13} L${mx} ${top + H + 4} L${mx + 5} ${top + H + 13} Z" fill="#0B0C0C"/>`;
    }
    const last = y === 2026;
    let axis = "";
    if (last) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
      const edw = textW("Election day");
      months.forEach((m, i) => {
        if (phone && i % 2) return;
        const d = (Date.UTC(y, i, 1) - Date.UTC(y, 0, 1)) / 864e5;
        axis += `<line x1="${x(d)}" x2="${x(d)}" y1="${top + H}" y2="${top + H + 5}" stroke="#B1B4B6"/>`;
        if (x(d) + 3 + textW(m) < W - edw - 12) axis += `<text x="${x(d) + 3}" y="${top + H + 20}">${m}</text>`;
      });
      axis += `<text x="${W}" y="${top + H + 20}" text-anchor="end">Election day</text>`;
    }
    const eday = `<line x1="${x(days) - 0.5}" x2="${x(days) - 0.5}" y1="${top + 6}" y2="${top + H + 5}" stroke="#0B0C0C"/>` +
      "";
    const svgH = top + H + (last ? 26 : 2) + exH;
    const yl = y === 2026 ? `2026<small>so far</small>` : `${y}`;
    html += `<div class="cap-row"><div class="cap-year">${yl}</div><svg class="chart" width="${W}" height="${svgH}" role="img" aria-label="${y}: latest capture dates by week, peak ${peak} sites in one week">${bars}<line x1="0" x2="${x(days)}" y1="${top + H + 0.5}" y2="${top + H + 0.5}" stroke="#0B0C0C"/>${eday}${peakLabel}${mark}${axis}</svg></div>`;
    if (isEx) {
      const dt = new Date(dayOf(ex.latest)).toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });
      const savedN = CANDS.filter((c) => c.latest || (c.status !== "no website" && c.status !== "no saved text")).length;
      html += `<div class="cap-row"><div></div><p class="head-label ex-note">&#9650; Example: ${esc(ex.site)}, ${y}. Latest copy saved ${dt}; ${ex.pages} pages, ${fmt(ex.words)} words. One of ${fmt(savedN)} sites saved by the same rule.</p></div>`;
    }
  }
  host.innerHTML = html;
}

/* ---------- Explorer state ---------- */

const FACETS = [
  { key: "year", label: "Year", get: (c) => String(c.year) },
  { key: "party", label: "Party", get: (c) => c.party },
  { key: "office", label: "Office", get: (c) => c.office },
  { key: "state", label: "State", get: (c) => c.state, scroll: "states" },
  { key: "inc", label: "Incumbent or challenger", get: (c) => (c.inc ? "incumbent" : "challenger") },
  { key: "seat", label: "Close or safe seat", get: (c) => c.seat },
  { key: "won", label: "Won or lost", get: (c) => (c.won === 1 ? "won" : c.won === 0 ? "lost" : null) },
];
const OPTS = {
  year: YEARS.map((y) => [String(y), String(y)]),
  party: [["D", "Democratic"], ["R", "Republican"]],
  office: [["House", "House"], ["Senate", "Senate"]],
  inc: [["incumbent", "Incumbent"], ["challenger", "Challenger"]],
  seat: [["close", "Close"], ["safe", "Safe"]],
  won: [["won", "Won"], ["lost", "Lost"]],
};
const optLabel = (key, v) => (OPTS[key] || []).concat(key === "state" ? OPTS.state : []).find((o) => o[0] === v)?.[1] || v;

const S = { terms: [], f: {}, order: [], list: null };

function readURL() {
  const q = new URLSearchParams(location.search);
  S.f = {}; S.order = []; S.list = null;
  const def = TERMS.findIndex((t) => t.term === DEFAULT_TERM);
  S.terms = [def];
  for (const [k, v] of q) {
    if (k === "term") {
      S.terms = v.split(",").map((s) => TERMS.findIndex((t) => slug(t.term) === s)).filter((i) => i >= 0);
    } else if (k === "list") {
      S.list = v;
    } else if (FACETS.some((f) => f.key === k)) {
      for (const val of v.split(",")) {
        if (!val) continue;
        (S.f[k] ||= new Set()).add(val);
        S.order.push(`${k}:${val}`);
      }
    }
  }
}

function writeURL() {
  const q = new URLSearchParams();
  const def = TERMS.findIndex((t) => t.term === DEFAULT_TERM);
  if (!(S.terms.length === 1 && S.terms[0] === def)) q.set("term", S.terms.map((i) => slug(TERMS[i].term)).join(","));
  const seen = [];
  for (const o of S.order) {
    const k = o.split(":")[0];
    if (!seen.includes(k)) seen.push(k);
  }
  for (const k of seen) q.set(k, [...S.f[k]].join(","));
  if (S.list) q.set("list", S.list);
  const s = q.toString().replace(/%2C/g, ",");
  history.replaceState(null, "", (s ? `?${s}` : location.pathname) + location.hash);
}

function match(c, except) {
  for (const f of FACETS) {
    if (f.key === except) continue;
    const set = S.f[f.key];
    if (set && set.size && !set.has(f.get(c))) return false;
  }
  return true;
}

function toggle(key, val, on) {
  const set = (S.f[key] ||= new Set());
  const tag = `${key}:${val}`;
  if (on) { set.add(val); if (!S.order.includes(tag)) S.order.push(tag); }
  else { set.delete(val); S.order = S.order.filter((o) => o !== tag); }
  if (!set.size) delete S.f[key];
  update();
}

/* ---------- Filter column ---------- */

function optHtml(key, v, label, extra = "") {
  return `<label class="opt" data-key="${key}" data-v="${esc(v)}"${extra}><input type="checkbox" value="${esc(v)}"><span class="opt-name">${label}</span><span class="opt-count"></span></label>`;
}

function buildFilters() {
  let h = `<div class="facet" id="facet-term"><h3 id="h-term">Term</h3>
    <input class="search" id="term-search" type="search" aria-label="Find a term" placeholder="Find a term" autocomplete="off">
    <div class="scroll terms" role="group" aria-labelledby="h-term">`;
  let theme = null;
  TERMS.forEach((t, i) => {
    if (t.theme !== theme) {
      if (theme !== null) h += `</div>`;
      theme = t.theme;
      h += `<div class="theme-group"><p class="theme">${esc(theme)}</p>`;
    }
    h += optHtml("term", String(i), esc(t.term));
  });
  h += `</div></div><p class="list-hint" hidden></p></div>`;
  for (const f of FACETS) {
    const opts = OPTS[f.key];
    h += `<div class="facet"><h3 id="h-${f.key}">${f.label}</h3>`;
    if (f.scroll) h += `<input class="search" id="state-search" type="search" aria-label="Find a state" placeholder="Find a state" autocomplete="off">`;
    const two = ["year", "seat", "won"].includes(f.key) ? ' class="two"' : "";
    h += f.scroll ? `<div class="scroll ${f.scroll}" role="group" aria-labelledby="h-${f.key}">` : `<div${two} role="group" aria-labelledby="h-${f.key}">`;
    for (const [v, label] of opts) {
      const name = f.key === "party" ? `${glyph(v, false, 10)}${label}` : esc(label);
      h += optHtml(f.key, v, name);
    }
    h += f.scroll ? `</div><p class="list-hint" hidden></p></div>` : `</div></div>`;
  }
  $("#facets").innerHTML = h;
  $("#facets").addEventListener("change", (e) => {
    const lab = e.target.closest(".opt");
    if (!lab) return;
    const { key, v } = lab.dataset;
    if (key === "term") {
      const i = +v;
      S.terms = e.target.checked ? [...S.terms, i] : S.terms.filter((t) => t !== i);
      S.terms.sort((a, b) => a - b);
      update();
    } else toggle(key, v, e.target.checked);
  });
  $("#state-search").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('#facets .opt[data-key="state"]').forEach((o) => {
      o.hidden = !!q && !(STATES[o.dataset.v] || o.dataset.v).toLowerCase().startsWith(q);
    });
    const box = $("#facets .scroll.states");
    box.scrollTop = 0;
    updateHint(box);
  });
  $("#term-search").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll("#facet-term .theme-group").forEach((g) => {
      let any = false;
      g.querySelectorAll(".opt").forEach((o) => {
        const hit = !q || TERMS[+o.dataset.v].term.toLowerCase().includes(q);
        o.hidden = !hit;
        any ||= hit;
      });
      g.hidden = !any;
    });
    const box = $("#facets .scroll.terms");
    box.scrollTop = 0;
    updateHint(box);
  });
}

// Each list shows whole rows only (four terms, three states) and says when it holds more.
const shown = (box) => [...box.querySelectorAll(".opt")].filter((o) => !o.hidden && !o.closest("[hidden]"));
function sizeLists() {
  document.querySelectorAll("#facets .scroll").forEach((box) => {
    if (!box.offsetParent) return;
    const keep = box.scrollTop;
    box.style.maxHeight = "none";
    box.scrollTop = 0;
    const opts = shown(box);
    const rows = box.classList.contains("terms") ? 4 : 3;
    const last = opts[Math.min(rows, opts.length) - 1];
    if (last) box.style.maxHeight = `${Math.ceil(last.getBoundingClientRect().bottom - box.getBoundingClientRect().top) + 1}px`;
    box.scrollTop = keep;
    updateHint(box);
  });
}
function updateHint(box) {
  const hint = box.parentElement.querySelector(".list-hint");
  const n = shown(box).length;
  hint.hidden = box.scrollHeight <= box.clientHeight + 1;
  hint.textContent = `Scroll for all ${n} ${box.classList.contains("terms") ? "terms" : "states"}`;
}

function updateFilters(G) {
  const an = G.filter((c) => c.status === "analyzed");
  const termCount = new Array(TERMS.length).fill(0);
  for (const c of an) for (const t of c.terms) termCount[t]++;
  document.querySelectorAll("#facets .opt").forEach((o) => {
    const { key, v } = o.dataset;
    const input = o.querySelector("input");
    let n;
    if (key === "term") {
      n = termCount[+v];
      input.checked = S.terms.includes(+v);
    } else {
      input.checked = !!(S.f[key] && S.f[key].has(v));
    }
    o.querySelector(".opt-count").textContent = n === undefined ? "" : fmt(n);
    if (n !== undefined) o.classList.toggle("zero", n === 0 && !input.checked);
  });
  for (const f of FACETS) {
    const counts = {};
    for (const c of CANDS) {
      if (c.status !== "analyzed" || !match(c, f.key)) continue;
      const v = f.get(c);
      counts[v] = (counts[v] || 0) + 1;
    }
    document.querySelectorAll(`#facets .opt[data-key="${f.key}"]`).forEach((o) => {
      const n = counts[o.dataset.v] || 0;
      o.querySelector(".opt-count").textContent = fmt(n);
      o.classList.toggle("zero", n === 0 && !o.querySelector("input").checked);
    });
  }
  const nActive = S.order.length;
  $("#filter-toggle").innerHTML = nActive ? `Filter <span class="n">(${nActive})</span>` : "Filter";
  $("#filter-done").textContent = `Show ${fmt(an.length)} analyzed`;
}

function scrollChecked() {
  document.querySelectorAll("#facets .scroll").forEach((box) => {
    const first = box.querySelector("input:checked");
    if (!first) return;
    const o = first.closest(".opt");
    const top = o.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    // Show one whole row above the checked option, so the list never opens on a cut row
    if (top < box.scrollTop || top > box.scrollTop + box.clientHeight - o.offsetHeight) box.scrollTop = Math.max(0, top - 1 - o.offsetHeight);
  });
}

/* ---------- Results ---------- */

function stats(cands, t) {
  const N = cands.length;
  const known = cands.filter((c) => c.status !== "no website").length;
  const an = cands.filter((c) => c.status === "analyzed");
  const n = an.length;
  const k = an.filter((c) => c.terms.includes(t)).length;
  if (!n) return { N, known, n, k };
  return {
    N, known, n, k,
    share: k / n,
    ci: wilson(k, n),
    range: known ? [k / known, (k + known - n) / known] : null,
  };
}


function shareSVG(row, W, o) {
  const H = 48, cy = 24;
  const X = (p) => 8 + p * (W - 16);
  let g = "";
  for (const p of [0, 0.5, 1]) g += `<line x1="${X(p)}" x2="${X(p)}" y1="0" y2="${H}" stroke="#E3E5E6"/>`;
  let bands = "", lines = "", marks = "";
  const hollow = row.year === 2026;
  for (const p of o.parties) {
    const s = row[p];
    if (!s || !s.n) continue;
    const yo = cy + (p === "D" ? -4 : 4);
    if (s.range) {
      bands += `<rect x="${X(s.range[0])}" y="${yo - 6}" width="${Math.max(1, X(s.range[1]) - X(s.range[0]))}" height="12" fill="#D9DCDE"/>`;
    }
    const [a, b] = [X(s.ci[0]), X(s.ci[1])];
    lines += `<line x1="${a}" x2="${b}" y1="${yo}" y2="${yo}" stroke="${COLOR[p]}" stroke-width="2"/>`;
    lines += `<line x1="${a}" x2="${a}" y1="${yo - 4}" y2="${yo + 4}" stroke="${COLOR[p]}" stroke-width="2"/>`;
    lines += `<line x1="${b}" x2="${b}" y1="${yo - 4}" y2="${yo + 4}" stroke="${COLOR[p]}" stroke-width="2"/>`;
    if (s.n >= SMALL) {
      const x = X(s.share);
      if (p === "D") {
        marks += hollow
          ? `<circle cx="${x}" cy="${yo}" r="3" fill="#fff" stroke="${COLOR.D}" stroke-width="2"/>`
          : `<circle cx="${x}" cy="${yo}" r="4" fill="${COLOR.D}"/>`;
      } else {
        marks += hollow
          ? `<rect x="${x - 3}" y="${yo - 3}" width="6" height="6" fill="#fff" stroke="${COLOR.R}" stroke-width="2"/>`
          : `<rect x="${x - 4}" y="${yo - 4}" width="8" height="8" fill="${COLOR.R}"/>`;
      }
    }
  }
  return { svg: `<svg class="chart" width="${W}" height="${H}" aria-hidden="true">${g}${bands}${lines}${marks}</svg>`, H, cy };
}

function gapSVG(row, W, H, cy, axis) {
  const X = (v) => 8 + (0.5 - Math.max(-0.5, Math.min(0.5, v))) * (W - 16);
  let s = "";
  s += `<line x1="${X(0.5)}" x2="${X(0.5)}" y1="0" y2="${H}" stroke="#E3E5E6"/><line x1="${X(-0.5)}" x2="${X(-0.5)}" y1="0" y2="${H}" stroke="#E3E5E6"/>`;
  s += `<line x1="${X(0)}" x2="${X(0)}" y1="${axis ? 18 : 0}" y2="${axis ? H - 18 : H}" stroke="#0B0C0C"/>`;
  if (axis) s += `<text x="0" y="10">Gap, points</text>`;
  const d = row.D, r = row.R;
  if (row.gap) {
    const [lo, hi] = row.gap.ci;
    s += `<rect x="${X(hi)}" y="${cy - 3}" width="${Math.max(1, X(lo) - X(hi))}" height="6" fill="#B1B4B6"/>`;
    if (d.n >= SMALL && r.n >= SMALL) s += `<rect x="${X(row.gap.d) - 1}" y="${cy - 8}" width="2" height="16" fill="#0B0C0C"/>`;
  }
  if (axis) {
    s += `<text x="${X(0.5)}" y="${H - 4}" text-anchor="start">D +50</text><text x="${X(0)}" y="${H - 4}" text-anchor="middle">0</text><text x="${X(-0.5)}" y="${H - 4}" text-anchor="end">R +50</text>`;
  }
  return `<svg class="chart" width="${W}" height="${H}" aria-hidden="true">${s}</svg>`;
}

function countsHtml(row, t, parties) {
  return parties
    .map((p) => {
      const s = row[p];
      const g = glyph(p, row.year === 2026);
      if (!s || !s.n) return `<span class="c">${g}<span class="dash" style="padding-left:0">&mdash;</span></span>`;
      return `<span class="c">${g}<button type="button" class="linkish" data-list="${slug(TERMS[t].term)}.${row.year}.${p}" aria-label="${s.k} of ${s.n} analyzed ${PARTY[p]} candidates, ${row.year}: show the list">${s.k} of ${s.n}</button></span>`;
    })
    .join("");
}

function describe(row, p) {
  const s = row[p];
  if (!s || !s.n) return `${PARTY[p]}: no analyzed candidates`;
  const small = s.n < SMALL ? " (under 10 analyzed, so no point estimate is drawn)" : "";
  return `${PARTY[p]}: ${s.k} of ${s.n}, ${pc(s.share)}%, 95% interval ${pc(s.ci[0])} to ${pc(s.ci[1])}%` +
    (s.range ? `, possible range ${pc(s.range[0])} to ${pc(s.range[1])}%` : "") + small;
}

function tipHtml(row, parties) {
  let h = `<b>${row.year === 2026 ? "2026 so far" : row.year}</b>`;
  for (const p of parties) {
    const s = row[p];
    h += `<div class="r">${glyph(p, row.year === 2026)}<span>`;
    if (!s || !s.n) h += `${PARTY[p]}: no analyzed candidates`;
    else h += `<b>${pc(s.share)}%</b> (${s.k} of ${s.n}); interval ${pc(s.ci[0])}&ndash;${pc(s.ci[1])}; possible range ${s.range ? `${pc(s.range[0])}&ndash;${pc(s.range[1])}` : "&mdash;"}`;
    h += `</span></div>`;
  }
  if (row.gap) h += `<div>Gap ${Math.abs(row.gap.d * 100).toFixed(1)} points ${row.gap.d >= 0 ? "toward Democrats" : "toward Republicans"}; interval ${(row.gap.ci[0] * 100).toFixed(1)} to ${(row.gap.ci[1] * 100).toFixed(1)}</div>`;
  return h;
}

function keyHtml(parties) {
  const item = (svg, text) => `<span class="key-item">${svg}<span>${text}</span></span>`;
  let k = parties.map((p) => item(glyph(p, false, 10), PARTY[p])).join("");
  k += item(`<svg width="26" height="10" aria-hidden="true"><path d="M1 0V10M25 0V10M1 5H25" fill="none" stroke="#383F43" stroke-width="2"/></svg>`, "95% interval");
  k += item(`<svg width="26" height="12" aria-hidden="true"><rect width="26" height="12" fill="#D9DCDE"/></svg>`, "Possible range among candidates with a known website");
  return `<p class="key">${k}</p>`;
}

function renderChart(t, G, width) {
  const years = S.f.year ? YEARS.filter((y) => S.f.year.has(String(y))) : YEARS;
  const parties = S.f.party ? ["D", "R"].filter((p) => S.f.party.has(p)) : ["D", "R"];
  const rows = years.map((y) => {
    const row = { year: y };
    for (const p of parties) row[p] = stats(G.filter((c) => c.year === y && c.party === p), t);
    if (row.D && row.R && row.D.n && row.R.n) row.gap = { d: row.D.share - row.R.share, ci: newcombe(row.D.k, row.D.n, row.R.k, row.R.n) };
    return row;
  });
  const stack = width < 640;
  const shareW = stack ? width : width - 90 - 180 - 82 - 48;
  const term = TERMS[t].term;
  let h = `<div class="term-chart" style="--share-w:${shareW}px"><h3>&ldquo;${esc(term)}&rdquo;</h3>${keyHtml(parties)}<div class="rows">`;
  const X = (p) => 8 + p * (shareW - 16);
  const shareHead = `<svg class="chart" width="${shareW}" height="40" aria-hidden="true"><text x="0" y="12">Share of analyzed candidates using the term</text><text x="${X(0) - 3}" y="34" text-anchor="start">0</text><text x="${X(0.5)}" y="34" text-anchor="middle">50</text><text x="${X(1) + 4}" y="34" text-anchor="end">100%</text></svg>`;
  if (stack) {
    h += `<div class="row head stack">${shareHead}</div>`;
  } else {
    const GX = (v) => 8 + (0.5 - v) * (180 - 16);
    const gapHead = `<svg class="chart" width="180" height="40" aria-hidden="true"><text x="0" y="12">Gap, points</text><text x="0" y="34" text-anchor="start">D +50</text><text x="${GX(0)}" y="34" text-anchor="middle">0</text><text x="180" y="34" text-anchor="end">R +50</text></svg>`;
    h += `<div class="row head"><span></span>${shareHead}${gapHead}<span class="head-label">Count</span></div>`;
  }
  rows.forEach((row, i) => {
    const sh = shareSVG(row, shareW, { parties });
    const yl = row.year === 2026 ? `2026<small>so far</small>` : `${row.year}`;
    const aria = `${row.year === 2026 ? "2026 so far" : row.year}. ${parties.map((p) => describe(row, p)).join(". ")}.` +
      (row.gap ? ` Gap ${(row.gap.d * 100).toFixed(1)} points, interval ${(row.gap.ci[0] * 100).toFixed(1)} to ${(row.gap.ci[1] * 100).toFixed(1)}.` : "");
    if (stack) {
      const yLine = row.year === 2026 ? `2026 <small style="display:inline">so far</small>` : `${row.year}`;
      const gapH = i === 0 ? 64 : 28;
      h += `<div class="row stack" data-i="${i}" role="group" aria-label="${esc(aria)}"><div class="yl"><span class="year">${yLine}</span><span class="counts">${countsHtml(row, t, parties)}</span></div>${sh.svg}<div class="gapwrap">${gapSVG(row, shareW, gapH, i === 0 ? 32 : 14, i === 0)}</div></div>`;
    } else {
      h += `<div class="row" data-i="${i}" role="group" aria-label="${esc(aria)}"><span class="year">${yl}</span>${sh.svg}${gapSVG(row, 180, sh.H, sh.cy, false)}<span class="counts">${countsHtml(row, t, parties)}</span></div>`;
    }
  });
  h += `</div>`;
  const notes = [];
  if (term === "working families" && years.includes(2026) && parties.includes("R")) notes.push("2026 Republican count includes the Working Families Tax Cut bill name.");
  if (term === "freedom") notes.push("Matches checked by hand: 85 percent correct.");
  if (term === "inflation") notes.push("Excludes the Inflation Reduction Act.");
  h += notes.length ? `<p class="source">${notes.join(" ")}</p></div>` : `</div>`;
  return { html: h, rows, parties };
}

let LAST_ROWS = [];

// On a wide screen the filter column is held to one screen and scrolls on its own, and the results
// stay in view beside it.
function fitFilters() {
  const fl = $("#filters");
  if (innerWidth < 1200) { fl.style.maxHeight = ""; fl.classList.remove("clipped"); return; }
  fl.style.maxHeight = "";
  const target = innerHeight - 32;
  if (fl.scrollHeight <= target + 1) { fl.classList.remove("clipped"); return; }
  // Cut between rows, never through one
  const top = fl.getBoundingClientRect().top;
  let cut = 0;
  fl.querySelectorAll(".facet > h3, .facet > .search, .facet > .scroll, .facet > div:not(.scroll) > .opt").forEach((el) => {
    const b = el.getBoundingClientRect().bottom - top;
    if (b + 2 <= target && b > cut) cut = b;
  });
  fl.style.maxHeight = `${Math.round(cut + 2)}px`;
  fl.classList.add("clipped");
}

function renderResults() {
  const G = CANDS.filter((c) => match(c, null));
  const an = G.filter((c) => c.status === "analyzed").length;
  const res = $("#results");
  const width = res.clientWidth;
  const where = [];
  for (const f of FACETS) if (S.f[f.key]) where.push([...S.f[f.key]].map((v) => (f.key === "state" ? STATES[v] || v : optLabel(f.key, v))).join(" or "));
  let h = `<p class="group"><strong class="num">${fmt(an)}</strong> analyzed candidate-years <span class="of">of ${fmt(G.length)} on the ballot</span>${where.length ? `<span class="where">${esc(where.join(", "))}</span>` : ""}</p>`;
  LAST_ROWS = [];
  if (!an) {
    const last = S.order[S.order.length - 1];
    let btn = "";
    if (last) {
      const [k, v] = last.split(":");
      btn = `<button type="button" class="btn" id="undo">Remove ${esc(k === "state" ? STATES[v] || v : optLabel(k, v))}</button>`;
    }
    const titles = S.terms.map((t) => `<h3>&ldquo;${esc(TERMS[t].term)}&rdquo;</h3>`).join("");
    h += `<div class="term-chart">${titles}<div class="empty"><p>No analyzed candidates match</p>${btn}</div></div>`;
  } else if (!S.terms.length) {
    h += `<p class="none">No term chosen. Pick one or more terms to see their shares.</p>`;
  } else {
    for (const t of S.terms) {
      const c = renderChart(t, G, width);
      h += c.html;
      LAST_ROWS.push(c);
    }
  }
  res.innerHTML = h;
  updateFilters(G);
  fitFilters();
  const undo = $("#undo");
  if (undo) undo.addEventListener("click", () => {
    const [k, v] = S.order[S.order.length - 1].split(":");
    toggle(k, v, false);
  });
  return G;
}

/* ---------- Tooltip ---------- */

function bindTips() {
  const tip = $("#tip");
  $("#results").addEventListener("mousemove", (e) => {
    const rowEl = e.target.closest(".row[data-i]");
    if (!rowEl || e.target.closest(".counts")) { tip.hidden = true; return; }
    const charts = [...document.querySelectorAll("#results .term-chart")];
    const ci = charts.indexOf(rowEl.closest(".term-chart"));
    const c = LAST_ROWS[ci];
    if (!c) return;
    tip.innerHTML = tipHtml(c.rows[+rowEl.dataset.i], c.parties);
    tip.hidden = false;
    const r = tip.getBoundingClientRect();
    let x = e.clientX + 16, y = e.clientY + 16;
    if (x + r.width > innerWidth - 8) x = e.clientX - r.width - 16;
    if (y + r.height > innerHeight - 8) y = e.clientY - r.height - 16;
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
  });
  $("#results").addEventListener("mouseleave", () => { tip.hidden = true; });
}

/* ---------- Candidate list ---------- */

const EXCERPTS = {};
async function excerpts(t) {
  if (!EXCERPTS[t]) EXCERPTS[t] = fetch(`/data/excerpts/${t}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
  return EXCERPTS[t];
}

function trimBefore(s, n = 80) {
  if (s.length <= n) return s;
  const cut = s.slice(-n);
  const sp = cut.indexOf(" ");
  return "…" + cut.slice(sp + 1);
}
function trimAfter(s, n = 80) {
  if (s.length <= n) return s;
  const cut = s.slice(0, n);
  return cut.slice(0, cut.lastIndexOf(" ")) + "…";
}

function seat(c) {
  let s;
  if (c.office === "Senate") s = "Senate";
  else if (!/^\d+$/.test(c.district) || +c.district === 0) s = "House, at large";
  else s = `House, District ${+c.district}`;
  const bits = [s, c.inc ? "incumbent" : "challenger"];
  if (c.won === 1) bits.push("won");
  if (c.won === 0) bits.push("lost");
  return bits.join(" · ");
}

async function openList(spec, push = true) {
  const [ts, y, p] = spec.split(".");
  const t = TERMS.findIndex((x) => slug(x.term) === ts);
  if (t < 0 || !PARTY[p]) return;
  S.list = spec;
  if (push) writeURL();
  const year = +y;
  const G = CANDS.filter((c) => match(c, null) && c.year === year && c.party === p);
  const ex = await excerpts(t);
  const an = G.filter((c) => c.status === "analyzed");
  const users = an.filter((c) => c.terms.includes(t));
  const non = an.filter((c) => !c.terms.includes(t));
  const out = G.filter((c) => c.status !== "analyzed");
  const byDist = (a, b) => (a.office === b.office ? String(a.district).localeCompare(String(b.district), "en", { numeric: true }) : a.office === "Senate" ? 1 : -1);
  [users, non, out].forEach((l) => l.sort(byDist));
  const where = [];
  if (S.f.state) where.push([...S.f.state].map((s) => STATES[s] || s).join(", "));
  if (S.f.office) where.push([...S.f.office].join(" and "));
  for (const k of ["inc", "seat", "won"]) if (S.f[k]) where.push([...S.f[k]].map((v) => optLabel(k, v)).join(" or "));
  const yLabel = year === 2026 ? "2026 so far" : String(year);
  $("#cands-head").innerHTML = `${PARTY[p]} candidates<small>${esc([where.join(", ") || "All states", yLabel].join(", "))}</small>`;
  const term = TERMS[t].term;
  $("#cands-sum").innerHTML = `<span class="num">${users.length} of ${an.length}</span> analyzed used &ldquo;${esc(term)}&rdquo;.` +
    (out.length ? ` <span class="num">${out.length}</span> more on the ballot ${out.length === 1 ? "was" : "were"} not analyzed.` : "");
  $("#cands-col").innerHTML = `Used &ldquo;${esc(term)}&rdquo;`;
  const tr = (c, cell) => `<tr><td><span class="who">${esc(c.name)}</span><span class="seat">${esc(seat(c))}</span></td><td>${cell}</td></tr>`;
  let body = "";
  for (const c of users) {
    const e = ex[c.id];
    const q = e ? `<span class="excerpt">&ldquo;${esc(trimBefore(e[0]))}<mark>${esc(e[1])}</mark>${esc(trimAfter(e[2]))}&rdquo;</span>` : "";
    body += tr(c, `<span class="used">Yes</span>${q}`);
  }
  for (const c of non) body += tr(c, `<span class="no">No</span>`);
  for (const c of out) body += tr(c, `<span class="na">&mdash; Not analyzed: ${STATUS[c.status] || c.status}</span>`);
  $("#cands-body").innerHTML = body;
  const dlg = $("#cands");
  if (!dlg.open) dlg.showModal();
  dlg.scrollTop = 0;
}

/* ---------- Wiring ---------- */

let G_LAST;
function update() {
  G_LAST = renderResults();
  writeURL();
}

function bind() {
  $("#results").addEventListener("click", (e) => {
    const b = e.target.closest("[data-list]");
    if (b) { LAST_TRIGGER = b.dataset.list; openList(b.dataset.list); }
  });
  const dlg = $("#cands");
  $("#cands-close").addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener("close", () => {
    S.list = null;
    writeURL();
    const back = document.querySelector(`[data-list="${LAST_TRIGGER}"]`);
    if (back) back.focus();
  });
  const fl = $("#filters"), tg = $("#filter-toggle");
  const setSheet = (on) => {
    fl.classList.toggle("open", on);
    document.body.classList.toggle("sheet", on);
    tg.setAttribute("aria-expanded", String(on));
    if (on) { sizeLists(); scrollChecked(); $("#filter-done").focus(); } else tg.focus();
  };
  tg.addEventListener("click", () => setSheet(true));
  $("#filter-done").addEventListener("click", () => setSheet(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && fl.classList.contains("open")) setSheet(false); });
  let lastW = innerWidth;
  addEventListener("resize", () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    clearTimeout(bind.t);
    bind.t = setTimeout(() => { renderCaptures(); placeChecks(); renderResults(); }, 120);
  });
}
let LAST_TRIGGER = null;

async function main() {
  const [data] = await Promise.all([fetch("/data/site.json").then((r) => r.json()), document.fonts.ready]);
  DATA = data;
  TERMS = data.terms;
  CANDS = data.candidates.filter((c) => c.party === "D" || c.party === "R");
  for (const c of CANDS) c.terms ||= [];
  OPTS.state = [...new Set(CANDS.map((c) => c.state))].map((s) => [s, STATES[s] || s]).sort((a, b) => a[1].localeCompare(b[1]));
  readURL();
  renderFunnel();
  renderCaptures();
  buildFilters();
  sizeLists();
  bind();
  bindTips();
  update();
  scrollChecked();
  if (S.list) {
    LAST_TRIGGER = S.list;
    openList(S.list, false);
  }
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target) target.scrollIntoView();
  document.documentElement.dataset.ready = "1";
}
main();
