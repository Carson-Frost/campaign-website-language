/* Annotated Paper specimen: process ribbon, sentence explorer, candidate list. */
(() => {
  "use strict";

  const SVGNS = "http://www.w3.org/2000/svg";
  const YEARS = [2020, 2022, 2024, 2026];
  const PARTIES = ["D", "R"];
  const PARTY_NAME = { D: "Democratic", R: "Republican" };
  const PARTY_COLOR = { D: "#285E9E", R: "#A8452C" };
  const BALLOT_TOTAL = 3712;
  const RIBBON_MAX = 72;
  const STATE_NAMES = {
    AK: "Alaska", AL: "Alabama", AR: "Arkansas", AZ: "Arizona", CA: "California", CO: "Colorado",
    CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", IA: "Iowa",
    ID: "Idaho", IL: "Illinois", IN: "Indiana", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
    MA: "Massachusetts", MD: "Maryland", ME: "Maine", MI: "Michigan", MN: "Minnesota", MO: "Missouri",
    MS: "Mississippi", MT: "Montana", NC: "North Carolina", ND: "North Dakota", NE: "Nebraska",
    NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NV: "Nevada", NY: "New York", OH: "Ohio",
    OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia", VT: "Vermont",
    WA: "Washington", WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming",
  };

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k === "html") n.innerHTML = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v);
    }
    for (const k of kids) if (k != null) n.append(k);
    return n;
  };
  const sv = (tag, attrs = {}) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
    return n;
  };
  const int = (x) => x.toLocaleString("en-US");
  const pct = (x) => Math.round(x * 100);
  const isPhone = () => window.matchMedia("(max-width: 1179px)").matches;

  /* ---------- Process ribbon ---------- */

  function ribbonWidth(count) {
    return Math.max(1, (RIBBON_MAX * count) / BALLOT_TOTAL);
  }

  function addPhoneBars() {
    document.querySelectorAll(".path .step").forEach((step) => {
      const count = +step.dataset.count;
      const bar = el("span", { class: "bar", "aria-hidden": "true" });
      bar.style.width = `${(100 * count) / BALLOT_TOTAL}%`;
      step.querySelector(".count").after(bar);
    });
  }

  // The ribbon's left edge is fixed; its right edge steps in as candidate-years drop out, and each
  // loss leaves as a stream of its own width that ends at the line saying why. Hand checks leave as
  // dashed hairlines.
  function drawRibbons() {
    document.querySelectorAll(".path").forEach((section) => {
      const svg = section.querySelector(".ribbon");
      svg.replaceChildren();
      if (isPhone()) return;
      const sec = section.getBoundingClientRect();
      const W = svg.getBoundingClientRect().width;
      const xL = W - RIBBON_MAX;
      const rel = (r) => ({ top: r.top - sec.top, bottom: r.bottom - sec.top, mid: (r.top + r.bottom) / 2 - sec.top });
      const steps = [...section.querySelectorAll(".step")].map((s) => {
        const drop = s.querySelector(".drop");
        return { count: +s.dataset.count, hand: s.dataset.hand ? +s.dataset.hand : 0,
          c: rel(s.querySelector(".count").getBoundingClientRect()),
          drop: drop ? rel(drop.getBoundingClientRect()) : null };
      });
      if (!steps.length) return;
      svg.setAttribute("height", sec.height);
      const last = steps.at(-1);
      const y0 = steps[0].c.top + 2;
      const yEnd = Math.max(last.c.bottom, last.drop ? last.drop.bottom : 0) + 4;
      const pts = [[xL, y0], [xL + ribbonWidth(steps[0].count), y0]];
      const streams = [];
      for (let i = 1; i < steps.length; i++) {
        const wp = ribbonWidth(steps[i - 1].count), w = ribbonWidth(steps[i].count);
        const tE = steps[i].c.top - 2, tS = tE - 14;
        pts.push([xL + wp, tS], [xL + w, tE]);
        const lost = steps[i - 1].count - steps[i].count;
        if (lost <= 0 || !steps[i].drop) continue;
        const hand = steps[i].hand, auto = lost - hand;
        const ty = steps[i].drop.mid;
        const handW = (RIBBON_MAX * hand) / BALLOT_TOTAL, autoW = (RIBBON_MAX * auto) / BALLOT_TOTAL;
        if (auto > 0) streams.push({ x: xL + wp - autoW / 2, sy: tS, ty: ty - (hand ? 3 : 0), w: autoW, dashed: false });
        if (hand > 0) streams.push({ x: xL + w + handW / 2, sy: tS + 6, ty: ty + 4, w: handW, dashed: true });
      }
      pts.push([xL + ribbonWidth(last.count), yEnd], [xL, yEnd]);
      for (const s of streams) {
        const xe = W + 34;
        const d = `M${s.x},${s.sy} C${s.x},${s.ty} ${s.x + 8},${s.ty} ${Math.min(xe, s.x + 24)},${s.ty} L${xe},${s.ty}`;
        svg.append(sv("path", s.dashed
          ? { d, fill: "none", stroke: "#1F1D1A", "stroke-width": 1, "stroke-dasharray": "2.5 2.5" }
          : { d, fill: "none", stroke: "#BDB4A3", "stroke-width": Math.max(1.25, s.w) }));
      }
      svg.append(sv("polygon", { points: pts.map((p) => p.join(",")).join(" "), fill: "#1F1D1A", stroke: "#FBF9F4", "stroke-width": 2, "stroke-linejoin": "round" }));
    });
  }

  /* ---------- Explorer state ---------- */

  let DATA, TERMS, CANDS, EXCERPTS = {};
  const DIMS = ["party", "office", "state", "inc", "seat", "won", "year"];
  const OPTIONS = {
    party: [["D", "Democratic"], ["R", "Republican"]],
    office: [["House", "House"], ["Senate", "Senate"]],
    state: Object.entries(STATE_NAMES).sort((a, b) => a[1].localeCompare(b[1])),
    inc: [["1", "Incumbents"], ["0", "Challengers and open-seat candidates"]],
    seat: [["close", "Close seats"], ["safe", "Safe seats"]],
    won: [["1", "Winners"], ["0", "Losers"]],
    year: YEARS.map((y) => [String(y), y === 2026 ? "2026 so far" : String(y)]),
  };
  // Dimensions whose empty selection means "all".
  const EMPTY_IS_ALL = new Set(["state"]);

  const state = {
    terms: [1],
    party: new Set(["D", "R"]), office: new Set(["House", "Senate"]), state: new Set(),
    inc: new Set(["1", "0"]), seat: new Set(["close", "safe"]), won: new Set(["1", "0"]),
    year: new Set(YEARS.map(String)),
    list: null,
  };

  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  function readHash() {
    const h = new URLSearchParams(location.hash.slice(1));
    const full = (d) => new Set(OPTIONS[d].map((o) => o[0]));
    if (h.has("term")) {
      const want = h.get("term").split(",").filter(Boolean);
      state.terms = TERMS.map((t, i) => [slug(t.term), i]).filter(([s]) => want.includes(s)).map(([, i]) => i);
    } else state.terms = [1];
    for (const d of DIMS) {
      if (h.has(d)) {
        const vals = h.get(d).split(",").filter((v) => full(d).has(v));
        state[d] = new Set(vals);
        if (!vals.length && !EMPTY_IS_ALL.has(d)) state[d] = full(d);
      } else state[d] = EMPTY_IS_ALL.has(d) ? new Set() : full(d);
    }
    state.list = h.get("list");
  }

  function writeHash() {
    const h = new URLSearchParams();
    const termSlugs = state.terms.map((i) => slug(TERMS[i].term)).join(",");
    if (!(state.terms.length === 1 && state.terms[0] === 1)) h.set("term", termSlugs);
    for (const d of DIMS) {
      const all = OPTIONS[d].length;
      const n = state[d].size;
      if (EMPTY_IS_ALL.has(d) ? n > 0 : n < all) h.set(d, [...state[d]].join(","));
    }
    if (state.list) h.set("list", state.list);
    const s = h.toString().replace(/%2C/g, ",");
    history.replaceState(null, "", s ? `#${s}` : location.pathname + location.search);
  }

  function passes(c, d, sel) {
    const all = EMPTY_IS_ALL.has(d) ? sel.size === 0 : sel.size === OPTIONS[d].length;
    if (all) return true;
    switch (d) {
      case "party": return sel.has(c.party);
      case "office": return sel.has(c.office);
      case "state": return sel.has(c.state);
      case "inc": return sel.has(String(c.inc));
      case "seat": return c.seat != null && sel.has(c.seat);
      case "won": return c.won != null && sel.has(String(c.won));
      case "year": return sel.has(String(c.year));
    }
    return true;
  }

  function inGroup(c, override) {
    for (const d of DIMS) {
      const sel = override && override.dim === d ? override.sel : state[d];
      if (!passes(c, d, sel)) return false;
    }
    return true;
  }

  function groupStats(cands, t) {
    const ballot = cands.length;
    const known = cands.filter((c) => c.status !== "no website").length;
    const an = cands.filter((c) => c.status === "analyzed");
    const n = an.length;
    const k = t == null ? 0 : an.filter((c) => c.tset.has(t)).length;
    const g = { ballot, known, n, k };
    if (n > 0) {
      g.share = k / n;
      [g.lo, g.hi] = wilson(k, n);
    }
    if (known > 0) {
      g.blo = k / known;
      g.bhi = (k + known - n) / known;
    }
    return g;
  }

  /* ---------- Sentence ---------- */

  const sentenceButtons = {};
  const zeroSpans = {};
  let countSpan;

  const joinAnd = (xs) => xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs.at(-1)}`;

  function labelFor(d) {
    if (d === "term") {
      if (!state.terms.length) return "a term";
      if (state.terms.length > 3) return `${state.terms.length} terms`;
      return joinAnd(state.terms.map((i) => `“${TERMS[i].term}”`));
    }
    const sel = state[d];
    const opts = OPTIONS[d].filter(([v]) => sel.has(v));
    const full = sel.size === OPTIONS[d].length;
    switch (d) {
      case "party": return full ? "all" : opts[0][1];
      case "office": return full ? "House and Senate" : opts[0][1];
      case "state":
        if (sel.size === 0) return "all states";
        if (sel.size > 2) return `${sel.size} states`;
        return joinAnd(opts.map((o) => o[1]));
      case "inc": return full ? "incumbents and challengers" : opts[0][1].toLowerCase();
      case "seat": return full ? "close and safe seats" : opts[0][1].toLowerCase();
      case "won": return full ? "winners and losers" : opts[0][1].toLowerCase();
      case "year": return full ? "all years" : joinAnd(opts.map((o) => o[1]));
    }
  }

  // A bracket keeps its "(0)" and trailing punctuation on its own line.
  function makePick(d, punct = "") {
    const b = el("button", { type: "button", class: "pick", "aria-haspopup": "true", "aria-expanded": "false" });
    b.dataset.dim = d;
    b.addEventListener("click", () => togglePop(d, b));
    sentenceButtons[d] = b;
    zeroSpans[d] = el("span", { class: "zero", hidden: "" }, " (0)");
    return el("span", { class: "clause" }, b, zeroSpans[d], punct);
  }

  function buildSentence() {
    const p = document.getElementById("sentence");
    countSpan = el("span");
    p.append("Show ", makePick("term"), " among ", makePick("party"), " ", makePick("office"),
      " candidates in ", makePick("state", ","), " ", makePick("inc", ","), " ", makePick("seat", ","), " ",
      makePick("won", ","), " in ", makePick("year", ":"), " ", countSpan, ".");
  }

  const CARET = '<svg class="caret" viewBox="0 0 9 6" aria-hidden="true"><path d="M0.5 0.5 L4.5 5 L8.5 0.5" fill="none" stroke="#1F1D1A" stroke-width="1.4"/></svg>';

  function updateSentence() {
    for (const [d, b] of Object.entries(sentenceButtons)) {
      b.innerHTML = "";
      b.append(labelFor(d));
      b.insertAdjacentHTML("beforeend", CARET);
      zeroSpans[d].hidden = true;
    }
    // The clause that empties the group, read in sentence order, carries "(0)".
    let pool = CANDS.filter((c) => c.status === "analyzed");
    const total = pool.filter((c) => inGroup(c)).length;
    if (total === 0) {
      for (const d of DIMS) {
        pool = pool.filter((c) => passes(c, d, state[d]));
        if (pool.length === 0) { zeroSpans[d].hidden = false; break; }
      }
    }
    countSpan.textContent = `${int(total)} analyzed candidate${total === 1 ? "" : "s"}`;
  }

  /* ---------- Popover lists ---------- */

  let openPop = null;
  let refilling = false;

  function closePop(returnFocus = true) {
    if (!openPop) return;
    const { pop, button } = openPop;
    openPop = null;
    if (returnFocus) button.focus();
    pop.remove();
    button.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
  }
  function outside(e) {
    if (openPop && !openPop.pop.contains(e.target) && !openPop.button.contains(e.target)) closePop(false);
  }

  function optionCounts(d) {
    const an = CANDS.filter((c) => c.status === "analyzed");
    if (d === "term") {
      const g = an.filter((c) => inGroup(c));
      return Object.fromEntries(TERMS.map((t, i) => [i, g.filter((c) => c.tset.has(i)).length]));
    }
    const out = {};
    for (const [v] of OPTIONS[d]) {
      const sel = new Set([v]);
      out[v] = an.filter((c) => inGroup(c, { dim: d, sel })).length;
    }
    return out;
  }

  function fillPop(d, pop) {
    pop.replaceChildren();
    const counts = optionCounts(d);
    const row = (value, text, checked, n) => {
      const cb = el("input", { type: "checkbox", value });
      cb.checked = checked;
      cb.addEventListener("change", () => onPick(d, value, cb.checked));
      return el("label", { class: n === 0 ? "none" : "" }, cb, el("span", {}, text), el("span", { class: "n" }, int(n)));
    };
    if (d === "term") {
      if (state.terms.length) pop.append(el("button", { type: "button", class: "clear", onclick: () => setAll(d) }, "Clear terms"));
      let theme = null;
      TERMS.forEach((t, i) => {
        if (t.theme !== theme) { theme = t.theme; pop.append(el("div", { class: "theme" }, theme)); }
        pop.append(row(String(i), t.term, state.terms.includes(i), counts[i]));
      });
      return;
    }
    if (d === "state" && state.state.size) pop.append(el("button", { type: "button", class: "clear", onclick: () => setAll(d) }, "All states"));
    for (const [v, text] of OPTIONS[d]) {
      pop.append(row(v, text, d === "state" ? state.state.has(v) : state[d].has(v), counts[v]));
    }
  }

  function togglePop(d, button) {
    if (openPop && openPop.dim === d) { closePop(); return; }
    closePop(false);
    const pop = el("div", { class: "pop", role: "group", "aria-label": `Choose ${d}` });
    fillPop(d, pop);
    document.body.append(pop);
    const r = button.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const w = pop.offsetWidth;
    pop.style.left = `${Math.max(16, Math.min(r.left + scrollX, vw - w - 16 + scrollX))}px`;
    pop.style.top = `${r.bottom + scrollY + 8}px`;
    button.setAttribute("aria-expanded", "true");
    openPop = { dim: d, pop, button };
    pop.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); closePop(); } });
    pop.addEventListener("focusout", (e) => {
      if (refilling) return;
      if (openPop && !pop.contains(e.relatedTarget) && e.relatedTarget !== button) closePop(false);
    });
    document.addEventListener("pointerdown", outside, true);
    const first = pop.querySelector("input:checked") || pop.querySelector("input");
    if (first) first.focus();
  }

  function setAll(d) {
    if (d === "term") state.terms = [];
    else state[d] = EMPTY_IS_ALL.has(d) ? new Set() : new Set(OPTIONS[d].map((o) => o[0]));
    afterChange(d);
  }

  function onPick(d, value, on) {
    if (d === "term") {
      const i = +value;
      state.terms = on ? [...state.terms, i].sort((a, b) => a - b) : state.terms.filter((x) => x !== i);
    } else {
      on ? state[d].add(value) : state[d].delete(value);
      if (!EMPTY_IS_ALL.has(d) && state[d].size === 0) state[d] = new Set(OPTIONS[d].map((o) => o[0]));
    }
    afterChange(d, value);
  }

  function afterChange(d, value) {
    state.list = null;
    render();
    if (openPop && openPop.dim === d) {
      const pop = openPop.pop;
      const scroll = pop.scrollTop;
      refilling = true;
      fillPop(d, pop);
      const again = value != null && pop.querySelector(`input[value="${value}"]`);
      (again || pop.querySelector("input"))?.focus({ preventScroll: true });
      pop.scrollTop = scroll;
      refilling = false;
    }
  }

  /* ---------- Figures ---------- */

  function computeTerm(t) {
    const byYear = {};
    const members = CANDS.filter((c) => inGroup(c));
    for (const y of YEARS) {
      byYear[y] = {};
      for (const p of PARTIES) byYear[y][p] = groupStats(members.filter((c) => c.year === y && c.party === p), t);
    }
    return byYear;
  }

  // Geometry shared by the chart and the figures aligned under it.
  function chartGeom(width) {
    const phone = width < 600;
    const top = 36, plotH = phone ? 200 : 236, bottom = top + plotH;
    const left = 34, right = width - (phone ? 110 : 112);
    const pad = phone ? 12 : 56;
    const xS = (y) => left + pad + (YEARS.indexOf(y) * (right - left - 2 * pad)) / 3;
    const yS = (v) => bottom - v * (bottom - top);
    return { phone, top, bottom, left, right, xS, yS, H: bottom + 30, off: { D: phone ? -8 : -11, R: phone ? 8 : 11 } };
  }

  function drawChart(svg, width, stats, first) {
    const years = YEARS.filter((y) => state.year.has(String(y)));
    const parties = PARTIES.filter((p) => state.party.has(p));
    const G = chartGeom(width);
    const { top, bottom, left, right, xS, yS, off, H } = G;
    svg.setAttribute("width", width);
    svg.setAttribute("height", H);
    svg.setAttribute("viewBox", `0 0 ${width} ${H}`);
    svg.replaceChildren();
    const uid = Math.random().toString(36).slice(2, 8);
    const defs = sv("defs");
    const pat = sv("pattern", { id: `h${uid}`, width: 5, height: 5, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" });
    pat.append(sv("line", { x1: 0.5, y1: 0, x2: 0.5, y2: 5, stroke: "#BDB4A3", "stroke-width": 1 }));
    defs.append(pat);
    svg.append(defs);
    const text = (x, y, s, attrs = {}) => {
      const t = sv("text", { x, y, ...attrs });
      t.textContent = s;
      svg.append(t);
      return t;
    };

    text(0, 13, G.phone ? "% of analyzed candidates" : "% of analyzed candidates using the term");
    for (const v of [0, 0.5, 1]) {
      svg.append(sv("line", { x1: left, x2: right, y1: yS(v) + 0.5, y2: yS(v) + 0.5, stroke: v === 0 ? "#D9D3C7" : "#E8E3D8", "stroke-width": 1 }));
      text(left - 7, yS(v) + 4.5, String(v * 100), { "text-anchor": "end" });
    }
    for (const y of years) text(xS(y), bottom + 21, y === 2026 ? "2026 so far" : String(y), { "text-anchor": "middle", class: "year" });

    const bandW = G.phone ? 12 : 14;
    for (const p of parties) for (const y of years) {
      const g = stats[y][p];
      if (g.bhi == null) continue;
      const x = xS(y) + off[p];
      svg.append(sv("rect", { x: x - bandW / 2, y: yS(g.bhi), width: bandW, height: Math.max(1, yS(g.blo) - yS(g.bhi)), fill: `url(#h${uid})` }));
    }
    // The 95% interval is a soft bar in the party color: short for large groups, long for small ones.
    for (const p of parties) for (const y of years) {
      const g = stats[y][p];
      if (!g.n) continue;
      const x = xS(y) + off[p];
      svg.append(sv("rect", { x: x - 3, y: yS(g.hi), width: 6, height: Math.max(1, yS(g.lo) - yS(g.hi)), fill: PARTY_COLOR[p], "fill-opacity": 0.24 }));
    }
    for (const p of parties) {
      const col = PARTY_COLOR[p];
      for (let i = 1; i < YEARS.length; i++) {
        const a = YEARS[i - 1], b = YEARS[i];
        if (!state.year.has(String(a)) || !state.year.has(String(b))) continue;
        const ga = stats[a][p], gb = stats[b][p];
        if (!(ga.n && gb.n)) continue;
        const attrs = { x1: xS(a) + off[p], y1: yS(ga.share), x2: xS(b) + off[p], y2: yS(gb.share), stroke: col, "stroke-width": 1.75, "stroke-linecap": "round" };
        if (b === 2026) Object.assign(attrs, { "stroke-dasharray": "0.01 4", "stroke-width": 2.2 });
        svg.append(sv("line", attrs));
      }
    }
    const nRight = {};
    for (const p of parties) for (const y of years) {
      const g = stats[y][p];
      if (!g.n) continue;
      const col = PARTY_COLOR[p], hollow = y === 2026;
      const x = xS(y) + off[p], cy = yS(g.share);
      const fill = hollow ? "#FBF9F4" : col, sw = hollow ? 1.6 : 0;
      if (p === "D") svg.append(sv("circle", { cx: x, cy, r: hollow ? 3.5 : 4.2, fill, stroke: col, "stroke-width": sw }));
      else { const s = hollow ? 7 : 8; svg.append(sv("rect", { x: x - s / 2, y: cy - s / 2, width: s, height: s, fill, stroke: col, "stroke-width": sw })); }
      // Group size beside the mark, on the party's outer side, when the group is under 30.
      if (g.n < 30) {
        const t = text(x + (p === "D" ? -12 : 12), cy + 4.5, "", { "text-anchor": p === "D" ? "end" : "start", class: "halo" });
        const it = sv("tspan", { "font-style": "italic" });
        it.textContent = "n";
        t.append(it, ` ${g.n}`);
        if (p === "R") nRight[y] = x + 12 + t.getComputedTextLength();
      }
    }

    if (first) {
      const ends = [];
      for (const p of parties) {
        const ys = years.filter((y) => stats[y][p].n);
        if (!ys.length) continue;
        ends.push({ p, y: yS(stats[ys.at(-1)][p].share) + 4.5, x: p === "R" ? Math.max(right + 10, (nRight[ys.at(-1)] || 0) + 8) : right + 10 });
      }
      if (ends.length === 2 && Math.abs(ends[0].y - ends[1].y) < 16) {
        const [a, b] = ends[0].y <= ends[1].y ? ends : [ends[1], ends[0]];
        const mid = (a.y + b.y) / 2;
        a.y = mid - 8; b.y = mid + 8;
      }
      for (const e of ends) text(e.x, e.y, PARTY_NAME[e.p], { class: "party" });
      if (years.some((y) => parties.some((p) => stats[y][p].bhi != null))) {
        const t = text(width, 13, "Possible range", { "text-anchor": "end" });
        const w = t.getComputedTextLength();
        svg.append(sv("rect", { x: width - w - 20, y: 1, width: 12, height: 15, fill: `url(#h${uid})` }));
      }
    }
    return G;
  }

  const signed = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v);

  function keyGlyph(p) {
    return p === "D"
      ? `<svg class="key" width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><circle cx="4" cy="4" r="3.6" fill="${PARTY_COLOR.D}"/></svg>`
      : `<svg class="key" width="8" height="8" viewBox="0 0 8 8" aria-hidden="true"><rect x="0.5" y="0.5" width="7" height="7" fill="${PARTY_COLOR.R}"/></svg>`;
  }

  // Only the figures the drawing cannot give: exact counts behind each share, and the gap with its interval.
  function figureRows(t, stats) {
    const years = YEARS.filter((y) => state.year.has(String(y)));
    const parties = PARTIES.filter((p) => state.party.has(p));
    const rows = [];
    const dash = () => el("span", { class: "dash" }, "—");
    for (const p of parties) {
      rows.push({ label: `${keyGlyph(p)}${PARTY_NAME[p]}, used it`, cells: years.map((y) => {
        const g = stats[y][p];
        if (!g.n) return dash();
        const b = el("button", { type: "button", class: "cnt", "aria-label": `${g.k} of ${g.n} analyzed ${PARTY_NAME[p]} candidates used it, ${y}: show the list` },
          el("span", {}, int(g.k)), el("span", { class: "of" }, ` of ${int(g.n)}`));
        b.addEventListener("click", () => openList(t, y, p, b));
        return b;
      }) });
    }
    if (parties.length === 2) {
      rows.push({ label: "Gap, D − R (95% interval)", cls: "gap", cells: years.map((y) => {
        const d = stats[y].D, r = stats[y].R;
        if (!(d.n && r.n)) return dash();
        const [lo, hi] = newcombe(d.k, d.n, r.k, r.n);
        return el("span", {}, el("b", {}, signed(Math.round((d.share - r.share) * 100))),
          el("span", { class: "ci" }, `${signed(Math.round(lo * 100))} to ${signed(Math.round(hi * 100))}`));
      }) });
    }
    return { years, rows };
  }

  function buildFigureRows(t, stats, G) {
    const { years, rows } = figureRows(t, stats);
    // Figures sit directly under their year on the chart's own axis; the row label hangs in the left
    // margin on desktop and sits above its row on phone.
    const box = el("div", { class: G.phone ? "figrows phone" : "figrows" });
    for (const r of rows) {
      const row = el("div", { class: `figrow ${r.cls || ""}`.trim() }, el("div", { class: "figlabel", html: r.label }));
      const holder = G.phone ? el("div", { class: "figcells" }) : row;
      years.forEach((y, i) => {
        const c = el("div", { class: "figcell" }, r.cells[i]);
        c.style.left = `${G.xS(y)}px`;
        holder.append(c);
      });
      if (G.phone) row.append(holder);
      box.append(row);
    }
    return box;
  }

  const REASON = {
    "no website": "No campaign website on record",
    "no saved text": "No copy saved by Common Crawl in the election year",
    "under 100 words": "Under 100 words of campaign text",
    excluded: "Excluded after review as not campaign content",
  };

  function renderEmpty(host, members) {
    const n = members.length;
    const lead = n === 0
      ? "No candidate on the ballot matches these filters."
      : `No analyzed candidate matches these filters. ${n === 1 ? "The one candidate" : `The ${int(n)} candidates`} on the ballot ${n === 1 ? "was" : "were"} not analyzed:`;
    host.append(el("p", { class: "empty-lead" }, lead));
    if (!n) return;
    const HATCH = '<svg class="na" width="12" height="16" viewBox="0 0 12 16" aria-hidden="true"><defs><pattern id="na" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0.5" y1="0" x2="0.5" y2="5" stroke="#BDB4A3"/></pattern></defs><rect width="12" height="16" fill="url(#na)"/></svg>';
    const list = el("ul", { class: "na-list" });
    for (const c of members.slice(0, 25)) {
      const race = `${PARTY_NAME[c.party]}, ${c.office === "Senate" ? "Senate" : `House ${ordinal(parseInt(c.district) || 0)} District`}, ${STATE_NAMES[c.state]}, ${c.year}`;
      const li = el("li", { html: HATCH });
      li.append(el("div", {}, el("p", {}, el("b", {}, c.name), `, ${race}`), el("p", { class: "why" }, REASON[c.status] || c.status)));
      list.append(li);
    }
    if (members.length > 25) list.append(el("li", { class: "more" }, `and ${int(members.length - 25)} more`));
    host.append(list);
  }

  function renderFigures() {
    const host = document.getElementById("figures");
    host.replaceChildren();
    if (!state.terms.length) {
      host.append(el("p", { class: "note-none" }, "Choose a term to see its shares."));
      return;
    }
    const members = CANDS.filter((c) => inGroup(c));
    if (!members.some((c) => c.status === "analyzed")) {
      renderEmpty(host, members);
      return;
    }
    const phone = isPhone();
    const width = phone ? Math.min(host.clientWidth, 640) : host.clientWidth;
    state.terms.forEach((t, i) => {
      const stats = computeTerm(t);
      const name = TERMS[t].term;
      const fig = el("figure", { class: "fig" });
      fig.append(el("h3", {}, `“${name.charAt(0).toUpperCase()}${name.slice(1)}”`));
      const svg = sv("svg", { class: "chart", role: "img", "aria-label": `Share of analyzed candidates using “${name}”, by party and year.` });
      fig.append(svg);
      host.append(fig);
      const G = drawChart(svg, width, stats, i === 0);
      fig.append(buildFigureRows(t, stats, G));
    });
  }

  /* ---------- Candidate list ---------- */

  const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  async function loadExcerpts(t) {
    if (!EXCERPTS[t]) EXCERPTS[t] = fetch(`/data/excerpts/${t}.json`).then((r) => r.json()).catch(() => ({}));
    return EXCERPTS[t];
  }

  let listOpener = null;

  async function openList(t, y, p, opener) {
    state.list = `${y}-${p}`;
    writeHash();
    listOpener = opener || null;
    const dlg = document.getElementById("list");
    const members = CANDS.filter((c) => inGroup(c) && c.year === y && c.party === p);
    const states = new Set(members.map((c) => c.state));
    const oneState = states.size === 1 ? [...states][0] : null;
    members.sort((a, b) => (a.state.localeCompare(b.state)) || (a.office === b.office ? 0 : a.office === "House" ? -1 : 1) || (parseInt(a.district) || 0) - (parseInt(b.district) || 0));
    const an = members.filter((c) => c.status === "analyzed");
    const users = an.filter((c) => c.tset.has(t));
    const offices = state.office.size === 1 ? `${[...state.office][0]} ` : "";
    const where = oneState ? `${STATE_NAMES[oneState]}, ` : "";
    document.getElementById("list-title").textContent = `${PARTY_NAME[p]} ${offices}Candidates, ${where}${y === 2026 ? "2026 So Far" : y}`;
    document.getElementById("list-sub").textContent = `${users.length} of ${an.length} analyzed used “${TERMS[t].term}”`;

    const table = document.getElementById("list-table");
    table.replaceChildren();
    const head = el("tr", {}, ...["Candidate", "District", "Incumbent", "Result", "Words saved", "Used it"].map((h, i) => el("th", { scope: "col", class: [i === 4 ? "r" : "", i >= 1 && i <= 3 ? "wide" : ""].join(" ").trim() }, h)));
    table.append(el("thead", {}, head));
    const body = el("tbody");
    const statusText = { "no website": "No website", "no saved text": "No saved text", "under 100 words": "Under 100 words", excluded: "Excluded" };
    for (const c of members) {
      const dist = c.office === "Senate" ? "Senate" : c.district === "00" || c.district === "AL" ? "At large" : `${ordinal(parseInt(c.district))}`;
      const district = oneState ? dist : `${c.state} ${dist}`;
      const result = c.won == null ? (c.year === 2026 ? "Not yet" : "Unknown") : c.won ? "Won" : "Lost";
      const analyzed = c.status === "analyzed";
      const used = analyzed ? (c.tset.has(t) ? "Yes" : "No") : "—";
      body.append(el("tr", {},
        el("td", {}, c.name, el("span", { class: "meta" }, `${district} · ${c.inc ? "Incumbent" : "Not incumbent"} · ${result}`)),
        el("td", { class: "wide" }, district),
        el("td", { class: "wide" }, c.inc ? "Yes" : "No"),
        el("td", { class: "wide" }, result),
        el("td", { class: analyzed ? "r" : "r muted" }, analyzed ? int(c.words) : statusText[c.status] || c.status),
        el("td", { class: used === "Yes" ? "used" : "muted" }, used)));
    }
    table.append(body);

    const ex = document.getElementById("list-excerpt");
    ex.replaceChildren();
    if (!dlg.open) dlg.showModal();
    document.getElementById("list-title").focus();
    const excerpts = await loadExcerpts(t);
    const who = users.find((c) => excerpts[c.id]);
    if (who) {
      const [before, match, after] = excerpts[who.id];
      const dist = who.office === "Senate" ? "Senate" : `${ordinal(parseInt(who.district))} District`;
      const m = el("mark", {}, match);
      m.style.textDecorationColor = PARTY_COLOR[p];
      ex.append(el("div", { class: "excerpt" },
        el("p", { class: "who" }, `${who.name}, ${STATE_NAMES[who.state]} ${dist}, ${who.site}`),
        el("p", {}, "“…", before.replace(/^\s+/, ""), m, after.replace(/\s+$/, ""), "…”")));
    }
  }

  function initDialog() {
    const dlg = document.getElementById("list");
    document.getElementById("list-close").addEventListener("click", () => dlg.close());
    dlg.addEventListener("close", () => {
      state.list = null;
      writeHash();
      if (listOpener && document.contains(listOpener)) listOpener.focus();
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
  }

  /* ---------- Render ---------- */

  function render() {
    updateSentence();
    renderFigures();
    writeHash();
  }

  function openListFromHash() {
    if (!state.list || !state.terms.length) return;
    const [y, p] = state.list.split("-");
    const t = state.terms[0];
    const btn = [...document.querySelectorAll(".fig")][0];
    if (btn) btn.scrollIntoView({ block: "center" });
    openList(t, +y, p, btn ? btn.querySelector("button.cnt") : null);
  }

  async function init() {
    addPhoneBars();
    await document.fonts.ready;
    drawRibbons();
    const res = await fetch("/data/site.json");
    DATA = await res.json();
    TERMS = DATA.terms;
    CANDS = DATA.candidates.filter((c) => c.party === "D" || c.party === "R");
    for (const c of CANDS) c.tset = new Set(c.terms || []);
    readHash();
    buildSentence();
    initDialog();
    const list = state.list;
    render();
    state.list = list;
    openListFromHash();
    if (!list) writeHash();
    let lastPhone = isPhone();
    window.addEventListener("resize", () => {
      drawRibbons();
      if (isPhone() || lastPhone !== isPhone()) renderFigures();
      lastPhone = isPhone();
      closePop(false);
    });
    window.addEventListener("hashchange", async () => {
      closePop(false);
      const dlg = document.getElementById("list");
      if (dlg.open) {
        dlg.close();
        await new Promise((r) => setTimeout(r));
      }
      readHash();
      render();
      openListFromHash();
    });
    document.documentElement.dataset.ready = "1";
  }

  init();
})();
