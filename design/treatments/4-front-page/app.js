/* Treatment 4, Front Page: specimen page. Every figure is computed from /data/site.json. */
(async function () {
  "use strict";

  const YEARS = [2020, 2022, 2024, 2026];
  const ELECTION_DAY = { 2020: "2020-11-03", 2022: "2022-11-08", 2024: "2024-11-05", 2026: "2026-11-03" };
  const PARTY = {
    D: { plural: "Democrats", one: "Democrat", color: "#1F5FC4", tint: "#DCE7F8", hatch: "url(#hatch-D)" },
    R: { plural: "Republicans", one: "Republican", color: "#D2372C", tint: "#F8DEDB", hatch: "url(#hatch-R)" },
  };
  const STATES = {
    AK: "Alaska", AL: "Alabama", AR: "Arkansas", AZ: "Arizona", CA: "California", CO: "Colorado", CT: "Connecticut",
    DE: "Delaware", FL: "Florida", GA: "Georgia", HI: "Hawaii", IA: "Iowa", ID: "Idaho", IL: "Illinois", IN: "Indiana",
    KS: "Kansas", KY: "Kentucky", LA: "Louisiana", MA: "Massachusetts", MD: "Maryland", ME: "Maine", MI: "Michigan",
    MN: "Minnesota", MO: "Missouri", MS: "Mississippi", MT: "Montana", NC: "North Carolina", ND: "North Dakota",
    NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NV: "Nevada", NY: "New York", OH: "Ohio",
    OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
    TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia", VT: "Vermont", WA: "Washington", WI: "Wisconsin",
    WV: "West Virginia", WY: "Wyoming",
  };
  const STATUS_NOTE = {
    "no website": "no known website",
    "no saved text": "no saved text",
    "under 100 words": "under 100 words",
    "excluded": "excluded after review",
  };
  const EXAMPLE_ID = "2024-H0WA08046";
  const DEFAULT_TERM = "working families";

  const $ = (s, el = document) => el.querySelector(s);
  const fmt = (n) => n.toLocaleString("en-US");
  const minus = (n) => (n < 0 ? "−" + Math.abs(n) : String(n));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const ctx = document.createElement("canvas").getContext("2d");
  const textW = (s, size = 13, weight = 400, family = "Libre Franklin") => {
    ctx.font = `${weight} ${size}px "${family}"`;
    return ctx.measureText(s).width;
  };

  await Promise.all([
    document.fonts.load('600 48px "Newsreader"'),
    document.fonts.load('italic 400 22px "Newsreader"'),
    document.fonts.load('400 13px "Libre Franklin"'),
    document.fonts.load('700 13px "Libre Franklin"'),
  ]).catch(() => {});

  const DATA = await fetch("/data/site.json").then((r) => r.json());
  const TERMS = DATA.terms;
  const CANDS = DATA.candidates;
  CANDS.forEach((c) => { c.tset = new Set(c.terms || []); });
  const termIndex = Object.fromEntries(TERMS.map((t, i) => [slug(t.term), i]));
  const excerptCache = {};
  const loadExcerpts = (t) =>
    (excerptCache[t] ||= fetch(`/data/excerpts/${t}.json`).then((r) => (r.ok ? r.json() : {})).catch(() => ({})));

  const pageWidth = () => $(".page").clientWidth - (isPhone() ? 32 : 0);
  const isPhone = () => window.innerWidth <= 720;

  /* ------------------------------------------------------------------ dot grids */

  const PITCH = 6, DOT = 4;

  // A block of n dots in rows of `cols`, ink or hatched gray. Returns its SVG markup and size.
  function dotBlock(n, cols, kind, ring) {
    const rows = Math.ceil(n / cols);
    const w = Math.min(n, cols) * PITCH - (PITCH - DOT), h = rows * PITCH - (PITCH - DOT);
    let d = "";
    for (let i = 0; i < n; i++) {
      d += `<circle cx="${(i % cols) * PITCH + DOT / 2}" cy="${Math.floor(i / cols) * PITCH + DOT / 2}" r="2"/>`;
    }
    let extra = "";
    if (ring != null) {
      const x = (ring % cols) * PITCH + DOT / 2, y = Math.floor(ring / cols) * PITCH + DOT / 2;
      extra = `<circle cx="${x}" cy="${y}" r="9.5" fill="#FFFFFF"/>` +
        `<circle cx="${x}" cy="${y}" r="7.5" fill="none" stroke="#121212" stroke-width="2"/>` +
        `<circle cx="${x}" cy="${y}" r="3" fill="#121212"/>`;
    }
    const fill = kind === "drop" ? `fill="url(#hatch-gray)" stroke="#7D7D7D" stroke-width="0.6"` : `fill="#121212"`;
    return { w, h, svg: `<svg width="${w}" height="${h}" aria-hidden="true" class="dots"><g ${fill}>${d}</g>${extra}</svg>` };
  }

  const byStatus = {};
  CANDS.forEach((c) => ((byStatus[c.status] ||= []).push(c)));
  const cnt = (s) => (byStatus[s] || []).length;
  const nBallot = CANDS.length;
  const nKnown = nBallot - cnt("no website");
  const nSaved = nKnown - cnt("no saved text");
  const nAnalyzed = cnt("analyzed");

  // The process path: each count, then the candidate-years that left at the next step, then the next count.
  function drawPipeline() {
    const wrap = $('[data-grid="pipeline"]');
    const cols = isPhone() ? 40 : 64;
    const stage = (count, name) =>
      `<div class="pl-count"><span class="step-count">${fmt(count)}</span><span class="pl-name">${name}</span></div>`;
    const drop = (n, why) => {
      const b = dotBlock(n, cols, "drop");
      return `<div class="pl-drop">${b.svg}<p class="pl-why">${why}</p></div>`;
    };
    const kept = dotBlock(nAnalyzed, cols, "keep", cols - 1);
    wrap.innerHTML =
      stage(nBallot, "candidate-years on the ballot") +
      drop(cnt("no website"), `<b>${fmt(cnt("no website"))}</b> with no known website`) +
      stage(nKnown, "with a known website") +
      drop(cnt("no saved text"), `<b>${fmt(cnt("no saved text"))}</b> with no copy saved by Common Crawl in the election year`) +
      stage(nSaved, "with text saved by Common Crawl") +
      drop(cnt("under 100 words") + cnt("excluded"),
        `<b>${fmt(cnt("under 100 words"))}</b> under 100 words, <b>${fmt(cnt("excluded"))}</b> excluded after review`) +
      stage(nAnalyzed, "analyzed") +
      `<div class="pl-kept">${kept.svg}<a class="one-of" href="#example" style="left:${kept.w + 20}px">One of 3,712</a>` +
      `<svg class="one-of-leader" width="18" height="4" style="left:${kept.w + 1}px" aria-hidden="true"><path d="M0 2H16" stroke="#121212"/></svg></div>`;
  }

  /* -------------------------------------------------- the step: saved by Common Crawl */

  const isoDate = (s) => new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T00:00:00Z`);
  const longDate = (d) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" });

  function drawStep() {
    $(".step-counts").innerHTML =
      `<div><span class="step-count">${fmt(nKnown)}</span><span class="pl-name">in, with a known website</span></div>` +
      `<div><span class="step-count">${fmt(nSaved)}</span><span class="pl-name">out, with a saved copy in the window</span></div>`;
    drawWindow();
    drawExhibit();
  }

  // The rule as a graphic: the window from January 1 to election day, and the week in which each site's
  // latest saved copy falls. Candidate-years with no saved copy are counted beside each year.
  function drawWindow() {
    const phone = isPhone();
    const W = phone ? pageWidth() : 600;
    const L = phone ? 0 : 76;
    const R = phone ? 0 : 112;
    const PW = W - L - R;
    const DAYS = 312; // January 1 to November 8, the latest election day of the four
    const X = (day) => L + (day / DAYS) * PW;
    const dayOf = (d, y) => (d - Date.UTC(y, 0, 1)) / 864e5;
    const bins = {}, saved = {}, none = {};
    let max = 1;
    YEARS.forEach((y) => { bins[y] = []; saved[y] = 0; none[y] = 0; });
    CANDS.forEach((c) => {
      if (c.status === "no website") return;
      if (c.status === "no saved text") { none[c.year]++; return; }
      saved[c.year]++;
      if (!c.latest) return;
      const wk = Math.floor(dayOf(isoDate(c.latest), c.year) / 7);
      bins[c.year][wk] = (bins[c.year][wk] || 0) + 1;
      max = Math.max(max, bins[c.year][wk]);
    });
    const head = phone ? 22 : 0, barH = 44, below = 26, room = 20;
    const rowH = head + room + barH + below;
    const H = rowH * YEARS.length + 22;
    const ex = CANDS.find((c) => c.id === EXAMPLE_ID);
    let s = `<svg width="${W}" height="${H}" role="img" aria-label="Weekly counts of each candidate-year's latest saved copy, January 1 to election day, for each year.">`;
    YEARS.forEach((y, ri) => {
      const top = ri * rowH;
      const base = top + head + room + barH;
      if (y === 2026) s += `<rect x="${phone ? -16 : 0}" y="${top}" width="${W + (phone ? 32 : 0)}" height="${rowH}" fill="#F4F4F2"/>`;
      const yLab = `${y}${y === 2026 ? '<tspan font-weight="400" fill="#595959"> so far</tspan>' : ""}`;
      const counts = `<tspan font-weight="700" fill="#121212">${fmt(saved[y])}</tspan><tspan fill="#595959"> saved</tspan>`;
      const lost = `<tspan font-weight="700" fill="#121212">${fmt(none[y])}</tspan><tspan fill="#595959"> not saved</tspan>`;
      if (phone) {
        s += `<text x="0" y="${top + 16}" font-size="13" font-weight="700" fill="#121212">${yLab}</text>`;
        s += `<text x="${W}" y="${top + 16}" text-anchor="end" font-size="13">${counts}<tspan fill="#595959">,</tspan><tspan dx="4"></tspan>${lost.replace("<tspan ", '<tspan dx="4" ')}</text>`;
      } else {
        s += `<text x="0" y="${base - 4}" font-size="13" font-weight="700" fill="#121212">${yLab}</text>`;
        s += `<text x="${W - R + 16}" y="${base - 18}" font-size="13">${counts}</text>`;
        s += `<text x="${W - R + 16}" y="${base - 2}" font-size="13">${lost}</text>`;
      }
      // Bars: one per week, height by count; any non-empty week shows at least a hairline.
      let peak = 0, peakX = 0;
      const endDay = dayOf(Date.parse(ELECTION_DAY[y] + "T00:00:00Z"), y) + 1;
      bins[y].forEach((n, wk) => {
        if (!n) return;
        const h = Math.max(1.5, (n / max) * barH);
        const x = X(wk * 7) + 0.75, w = X(Math.min(wk * 7 + 7, endDay)) - 0.75 - x;
        s += `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="#121212"/>`;
        if (n > peak) { peak = n; peakX = x + w / 2; }
      });
      s += `<text x="${peakX}" y="${base - (peak / max) * barH - 5}" text-anchor="middle" font-size="13" fill="#595959">${fmt(peak)}</text>`;
      // The window: January 1 to this year's election day.
      const end = X(dayOf(Date.parse(ELECTION_DAY[y] + "T00:00:00Z"), y) + 1);
      s += `<path d="M${X(0)} ${base + 1}H${end}" stroke="#121212" stroke-width="2"/>`;
      s += `<path d="M${X(0)} ${base - 6}V${base + 6}M${end} ${base - 6}V${base + 6}" stroke="#121212" stroke-width="1"/>`;
      if (ri === 0) {
        s += `<text x="${end}" y="${base + 19}" text-anchor="end" font-size="13" fill="#595959">Election day</text>`;
        s += `<text x="${X(0)}" y="${base + 19}" font-size="13" fill="#595959">January 1</text>`;
      }
      if (ex && y === ex.year) {
        const xd = X(dayOf(isoDate(ex.latest), y));
        s += `<circle cx="${xd}" cy="${base + 1}" r="7.5" fill="#FFFFFF" stroke="#121212" stroke-width="2"/><circle cx="${xd}" cy="${base + 1}" r="3" fill="#121212"/>`;
        s += `<text x="${xd - 14}" y="${base + 19}" text-anchor="end" font-size="13" font-weight="600" fill="#121212">${ex.site}</text>`;
      }
    });
    // Month initials along the bottom.
    const top = YEARS.length * rowH;
    "JFMAMJJASON".split("").forEach((m, i) => {
      const d = (Date.UTC(2021, i, 15) - Date.UTC(2021, 0, 1)) / 864e5;
      s += `<text x="${X(d)}" y="${top + 14}" text-anchor="middle" font-size="13" fill="#595959">${m}</text>`;
    });
    s += `</svg>`;
    $(".window-chart").innerHTML = s;
  }

  /* --------------------------------------------------------------- the exhibit */

  function drawExhibit() {
    const c = CANDS.find((x) => x.id === EXAMPLE_ID);
    if (!c) return;
    $(".exhibit-site").textContent = c.site;
    $(".exhibit-who").textContent = `${c.name}, ${PARTY[c.party].one}, ${districtOf(c)}, ${c.year}`;
    const pages = c.pages > 1 ? `the homepage and ${c.pages - 1} linked page${c.pages > 2 ? "s" : ""}` : "the homepage";
    $(".exhibit-facts").textContent =
      `Latest saved copy ${longDate(isoDate(c.latest))}. Kept ${pages}, ${fmt(c.words)} words.`;
  }

  /* ---------------------------------------------------------------- explorer */

  const FILTERS = [
    { key: "year", label: "Year", all: "All years", opts: YEARS.map((y) => [String(y), String(y)]) },
    { key: "party", label: "Party", all: "Both parties", opts: [["D", "Democrats"], ["R", "Republicans"]] },
    { key: "office", label: "Office", all: "Both offices", opts: [["House", "House"], ["Senate", "Senate"]] },
    { key: "state", label: "State", all: "All states",
      opts: Object.entries(STATES).sort((a, b) => a[1].localeCompare(b[1])) },
    { key: "inc", label: "Incumbency", all: "Incumbents and challengers", opts: [["1", "Incumbents"], ["0", "Challengers"]] },
    { key: "seat", label: "Seat", all: "Close and safe seats", opts: [["close", "Close seats"], ["safe", "Safe seats"]] },
    { key: "won", label: "Result", all: "Won and lost", opts: [["1", "Won"], ["0", "Lost"]] },
  ];
  const st = { terms: [], list: "" };
  FILTERS.forEach((f) => (st[f.key] = ""));

  function readURL() {
    const q = new URLSearchParams(location.search);
    const t = q.get("terms");
    st.terms = t === null ? [termIndex[slug(DEFAULT_TERM)]]
      : t.split(",").map((s) => termIndex[s]).filter((i) => i !== undefined);
    FILTERS.forEach((f) => {
      const v = q.get(f.key) || "";
      st[f.key] = f.opts.some(([k]) => k === v) ? v : "";
    });
    st.list = q.get("list") || "";
  }
  function writeURL() {
    const q = new URLSearchParams();
    const def = [termIndex[slug(DEFAULT_TERM)]];
    if (st.terms.join() !== def.join()) q.set("terms", st.terms.length ? st.terms.map((i) => slug(TERMS[i].term)).join(",") : "");
    FILTERS.forEach((f) => st[f.key] && q.set(f.key, st[f.key]));
    if (st.list) q.set("list", st.list);
    const s = q.toString();
    history.replaceState(null, "", location.pathname + (s ? "?" + s : "") + location.hash);
  }

  const match = (c) =>
    (!st.party || c.party === st.party) &&
    (!st.office || c.office === st.office) &&
    (!st.state || c.state === st.state) &&
    (!st.inc || c.inc === +st.inc) &&
    (!st.seat || c.seat === st.seat) &&
    (!st.won || c.won === +st.won);
  const years = () => (st.year ? [+st.year] : YEARS);
  const parties = () => (st.party ? [st.party] : ["D", "R"]);

  function cell(t, year, party) {
    let N = 0, known = 0, n = 0, k = 0;
    for (const c of CANDS) {
      if (c.year !== year || c.party !== party || !match(c)) continue;
      N++;
      if (c.status !== "no website") known++;
      if (c.status === "analyzed") { n++; if (c.tset.has(t)) k++; }
    }
    const ci = n ? wilson(k, n) : null;
    return { N, known, n, k, p: n ? k / n : null, ci,
      range: known && n ? [k / known, (k + known - n) / known] : null };
  }

  // Filter row: each menu is a text label with a caret; a transparent native select sits over it.
  function buildFilters() {
    const row = $(".filters");
    row.innerHTML = FILTERS.map((f) =>
      `<label class="filter"><span class="filter-text"></span>` +
      `<select data-key="${f.key}" aria-label="${f.label}"><option value="">${f.all}</option>` +
      f.opts.map(([v, l]) => `<option value="${v}">${esc(l)}</option>`).join("") + `</select></label>`
    ).join("");
    row.addEventListener("change", (e) => {
      const k = e.target.dataset.key;
      if (!k) return;
      st[k] = e.target.value;
      st.list = "";
      writeURL();
      syncFilters();
      renderExplorer();
    });
  }
  function syncFilters() {
    $(".filters").querySelectorAll("select").forEach((sel) => {
      sel.value = st[sel.dataset.key];
      sel.classList.toggle("set", !!sel.value);
      sel.style.width = Math.ceil(textW(sel.options[sel.selectedIndex].text, 15, 400)) + 12 + "px";
    });
    fitFilters();
  }
  // Keep the row inside the column: 24 px apart when it fits, down to 16 px, and only then wrap.
  function fitFilters() {
    const row = $(".filters");
    row.style.columnGap = ""; row.style.flexWrap = "";
    if (isPhone()) return; // the phone row scrolls sideways
    for (const g of [24, 20, 16]) {
      row.style.columnGap = g + "px";
      if (row.scrollWidth <= row.clientWidth) return;
    }
    row.style.columnGap = "24px";
    row.style.flexWrap = "wrap";
  }

  /* term field */
  const input = $("#term-input"), listbox = $("#term-options");
  let active = -1, optionEls = [];
  function openOptions() {
    const q = input.value.trim().toLowerCase();
    const themes = [...new Set(TERMS.map((t) => t.theme))];
    let html = "", i = 0;
    optionEls = [];
    themes.forEach((th) => {
      const ts = TERMS.map((t, idx) => ({ ...t, idx }))
        .filter((t) => t.theme === th && !st.terms.includes(t.idx) && (!q || t.term.toLowerCase().includes(q)));
      if (!ts.length) return;
      html += `<div class="theme" role="presentation">${esc(th)}</div>`;
      ts.forEach((t) => {
        html += `<div role="option" id="opt-${t.idx}" data-idx="${t.idx}" aria-selected="false">${esc(t.term)}</div>`;
        i++;
      });
    });
    listbox.innerHTML = html || `<div class="none">None of the 57 terms matches</div>`;
    optionEls = [...listbox.querySelectorAll('[role="option"]')];
    active = q && optionEls.length ? 0 : -1;
    markActive();
    listbox.hidden = false;
    input.setAttribute("aria-expanded", "true");
  }
  function closeOptions() {
    listbox.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    active = -1;
  }
  function markActive() {
    optionEls.forEach((o, j) => o.setAttribute("aria-selected", j === active ? "true" : "false"));
    if (active >= 0) {
      input.setAttribute("aria-activedescendant", optionEls[active].id);
      optionEls[active].scrollIntoView({ block: "nearest" });
    } else input.removeAttribute("aria-activedescendant");
  }
  function addTerm(idx) {
    if (!st.terms.includes(idx)) st.terms.push(idx);
    input.value = "";
    closeOptions();
    st.list = "";
    writeURL();
    renderChosen();
    renderExplorer();
  }
  input.addEventListener("focus", openOptions);
  input.addEventListener("input", openOptions);
  input.addEventListener("blur", () => setTimeout(closeOptions, 120));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (listbox.hidden) openOptions(); active = Math.min(active + 1, optionEls.length - 1); markActive(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); markActive(); }
    else if (e.key === "Enter") { e.preventDefault(); if (active >= 0) addTerm(+optionEls[active].dataset.idx); }
    else if (e.key === "Escape") { closeOptions(); }
  });
  listbox.addEventListener("mousedown", (e) => {
    const o = e.target.closest('[role="option"]');
    e.preventDefault();
    if (o) addTerm(+o.dataset.idx);
  });

  function renderChosen() {
    $(".chosen").innerHTML = st.terms.map((i) =>
      `<li>${esc(TERMS[i].term)}<button type="button" class="remove" data-idx="${i}" aria-label="Remove ${esc(TERMS[i].term)}">×</button></li>`
    ).join("");
  }
  $(".chosen").addEventListener("click", (e) => {
    const b = e.target.closest(".remove");
    if (!b) return;
    st.terms = st.terms.filter((i) => i !== +b.dataset.idx);
    st.list = "";
    writeURL();
    renderChosen();
    renderExplorer();
    input.focus();
  });

  /* the dumbbell */
  function renderExplorer() {
    firstBand.unused = true;
    const res = $(".results");
    const ys = years(), ps = parties();
    if (!st.terms.length) {
      res.innerHTML = `<p class="empty prompt">Add a term to see who used it</p>`;
    } else {
      res.innerHTML = "";
      st.terms.forEach((t, bi) => res.appendChild(termBlock(t, bi === 0, ys, ps)));
    }
    renderGroup(ys, ps);
  }

  function termBlock(t, first, ys, ps) {
    const block = document.createElement("div");
    block.className = "term-block";
    const term = TERMS[t].term;
    const cells = ys.map((y) => Object.fromEntries(ps.map((p) => [p, cell(t, y, p)])));
    const any = cells.some((row) => ps.some((p) => row[p].n > 0));
    block.innerHTML =
      `<h3 class="chart-title">Candidates whose site used “${esc(term)}”</h3>` +
      `<p class="chart-sub">Percent of analyzed candidates, by year and party</p>`;
    if (!any) {
      block.insertAdjacentHTML("beforeend", `<p class="empty">No candidates match</p>`);
      return block;
    }
    if (first) {
      const all = cells.flatMap((row) => ps.map((p) => row[p]));
      block.insertAdjacentHTML("beforeend", legendHTML({
        tint: all.some((c) => c.n >= 20),
        range: all.some((c) => c.n >= 10),
      }));
    }

    const phone = isPhone();
    const W = pageWidth();
    const two = ps.length === 2;
    // Desktop: year | plot 0–100% | share and count | gap and its interval. Phone: the plot spans the width,
    // with the year and gap above each row and the counts below it.
    const L = phone ? 0 : 100;
    const PW = phone ? W - 2 : 536;
    const X = (v) => L + 1 + v * PW;
    const C0 = 672, G0 = 838;
    const head = phone ? 22 : 0;
    const lanes = two ? 16 : 0;
    const foot = phone ? 30 : 0;
    const rowH = head + 26 + lanes + 12 + foot;
    const axisH = 26;
    const H = axisH + rowH * ys.length;
    const gapOf = (D, R) => {
      const gap = D.p - R.p, [glo, ghi] = newcombe(D.k, D.n, R.k, R.n);
      const lo = Math.round(100 * (gap >= 0 ? glo : -ghi)), hi = Math.round(100 * (gap >= 0 ? ghi : -glo));
      const g = Math.round(Math.abs(gap) * 100);
      return { g: g === 0 ? "0" : `+${g}`, ivl: `${minus(lo)} to ${minus(hi)}` };
    };

    const chart = document.createElement("div");
    chart.className = "chart";
    chart.style.height = H + "px";
    let s = `<svg width="${W}" height="${H}" role="img" aria-label="${esc(ariaSummary(term, ys, ps, cells))}">`;
    ys.forEach((y, ri) => {
      if (y === 2026) s += `<rect x="${phone ? -16 : 0}" y="${axisH + ri * rowH}" width="${W + (phone ? 32 : 0)}" height="${rowH}" fill="#F4F4F2"/>`;
    });
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => {
      const x = X(v);
      s += `<path d="M${x} ${axisH - 7}V${H}" stroke="${v === 0 ? "#BDBDBD" : "#DDDDDD"}" stroke-width="1"/>`;
      const lab = v === 1 ? "100%" : String(v * 100);
      const anchor = phone && v === 1 ? "end" : phone && v === 0 ? "start" : "middle";
      s += `<text x="${phone && v === 1 ? x + 1 : x}" y="${axisH - 12}" text-anchor="${anchor}" font-size="13" fill="#595959">${lab}</text>`;
    });
    const anyGap = two && cells.some((row) => row.D.n >= 20 && row.R.n >= 20);
    if (!phone) {
      s += `<text x="${C0 + 36}" y="${axisH - 12}" text-anchor="end" font-size="13" fill="#595959">Share</text>`;
      s += `<text x="${C0 + 44}" y="${axisH - 12}" font-size="13" fill="#595959">Used it, of analyzed</text>`;
      if (anyGap) {
        s += `<text x="${G0 + 32}" y="${axisH - 12}" text-anchor="end" font-size="13" fill="#595959">Gap</text>`;
        s += `<text x="${G0 + 40}" y="${axisH - 12}" font-size="13" fill="#595959">95% interval</text>`;
      }
    }

    const html = [];
    let bandLabelled = false;
    ys.forEach((y, ri) => {
      const top = axisH + ri * rowH;
      const laneY = (p) => top + head + 13 + (two && p === "R" ? lanes : 0);
      const mid = top + head + 13 + lanes / 2;
      const firstRow = ri === 0 && first;
      const yl = y === 2026 && !bandLabelled && firstBand.unused ? (bandLabelled = true, firstBand.unused = false, true) : false;
      const yText = `${y}${yl ? '<tspan font-weight="400" fill="#595959" dx="5">so far</tspan>' : ""}`;
      s += phone
        ? `<text x="0" y="${top + 16}" font-size="13" font-weight="700" fill="#121212">${yText}</text>`
        : `<text x="0" y="${mid + 4.5}" font-size="13" font-weight="700" fill="#121212">${yText}</text>`;
      const row = cells[ri];
      const shown = {};
      const allEmpty = ps.every((q) => row[q].n === 0);
      ps.forEach((p, pi) => {
        const c = row[p], ly = laneY(p), P = PARTY[p];
        if (c.n === 0) {
          if (!allEmpty || pi === 0) {
            const ny = allEmpty ? mid : ly;
            html.push(`<p class="lane-note" style="left:${X(0.5)}px;top:${ny}px">No candidates match</p>`);
          }
          return;
        }
        if (c.n < 10) {
          // Too few to plot: the count is printed in place of the mark.
          const cw = textW(`${fmt(c.k)} of ${fmt(c.n)}`, 13) + 8;
          const cx = Math.min(Math.max(X(c.p), L + cw / 2), (phone ? W : C0 - 24) - cw / 2);
          html.push(countBtn(t, y, p, c, { x: cx, y: ly, center: true }));
          return;
        }
        // Counts: in their own column on a desktop, on a line under the row on a phone.
        html.push(countBtn(t, y, p, c, phone
          ? { x: pi === 0 ? 0 : Math.round(W / 2) + 4, y: top + head + 26 + lanes + 18, party: false }
          : { x: C0, y: ly }));
        const [rl, rh] = c.range;
        s += `<rect x="${X(rl)}" y="${ly - 5}" width="${Math.max(1, X(rh) - X(rl))}" height="10" fill="${P.hatch}"/>`;
        if (c.n < 20) {
          const a = X(c.ci[0]), b = X(c.ci[1]);
          s += `<path d="M${a + 4} ${ly - 6}H${a}V${ly + 6}H${a + 4}M${b - 4} ${ly - 6}H${b}V${ly + 6}H${b - 4}" fill="none" stroke="${P.color}" stroke-width="2"/>`;
        } else {
          s += `<rect x="${X(c.ci[0])}" y="${ly - 5}" width="${X(c.ci[1]) - X(c.ci[0])}" height="10" fill="${P.tint}"/>`;
          shown[p] = { x: X(c.p), y: ly, c };
        }
        // Party name beside the first row's marks.
        if (firstRow) {
          const x0 = X(Math.min(rl, c.ci[0])), x1 = X(Math.max(rh, c.ci[1]));
          const w = textW(P.plural, 13, 700);
          const right = x1 + 8 + w <= (phone ? W : C0 - 16);
          s += `<text x="${right ? x1 + 8 : x0 - 8}" y="${ly + 4.5}" text-anchor="${right ? "start" : "end"}" font-size="13" font-weight="700" fill="#121212">${P.plural}</text>`;
        }
      });
      if (shown.D && shown.R) {
        const d = shown.D, r = shown.R;
        // The difference: a bar from one party's share to the other's, between the two lanes.
        s += `<path d="M${Math.min(d.x, r.x)} ${mid}H${Math.max(d.x, r.x)}" stroke="#BDBDBD" stroke-width="3"/>`;
        const { g, ivl } = gapOf(d.c, r.c);
        if (phone) {
          s += `<text x="${W}" y="${top + 16}" text-anchor="end" font-size="13">` +
            (firstRow ? `<tspan fill="#595959">Gap </tspan>` : "") +
            `<tspan font-weight="700" fill="#121212">${g}</tspan><tspan dx="6" fill="#595959">${firstRow ? "95% interval " : ""}${ivl}</tspan></text>`;
        } else {
          s += `<text x="${G0 + 32}" y="${mid + 4.5}" text-anchor="end" font-size="13" font-weight="700" fill="#121212">${g}</text>`;
          s += `<text x="${G0 + 40}" y="${mid + 4.5}" font-size="13" fill="#595959">${ivl}</text>`;
        }
      }
      ["D", "R"].forEach((p) => {
        const m = shown[p];
        if (!m) return;
        s += p === "D"
          ? `<circle cx="${m.x}" cy="${m.y}" r="5.5" fill="${PARTY.D.color}" stroke="#FFFFFF" stroke-width="1.5"/>`
          : `<rect x="${m.x - 5.25}" y="${m.y - 5.25}" width="10.5" height="10.5" fill="${PARTY.R.color}" stroke="#FFFFFF" stroke-width="1.5"/>`;
      });
    });
    s += `</svg>`;
    chart.innerHTML = s + html.join("");
    block.appendChild(chart);
    return block;
  }
  const firstBand = { unused: true };

  function countBtn(t, y, p, c, pos) {
    const P = PARTY[p];
    const pct = c.n < 10 ? "" : `${Math.round(c.p * 100)}%`;
    const count = `${fmt(c.k)} of ${fmt(c.n)}`;
    const glyph = pos.party !== undefined
      ? (p === "D" ? `<svg width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="5" fill="${P.color}"/></svg>`
        : `<svg width="10" height="10" aria-hidden="true"><rect width="10" height="10" fill="${P.color}"/></svg>`)
      : "";
    const name = pos.party ? `<span class="party">${P.plural}</span>` : "";
    const cls = pos.center ? " inline center" : pos.party !== undefined ? " inline" : "";
    const bg = pos.center ? `;background:${y === 2026 ? "#F4F4F2" : "#FFFFFF"}` : "";
    return `<button type="button" class="count${cls}" data-list="${y}-${p}-${t}" style="left:${pos.x}px;top:${pos.y}px${bg}"` +
      ` aria-label="${P.plural}, ${y}: ${c.k} of ${c.n} analyzed candidates used ${esc(TERMS[t].term)}. Show the candidates.">` +
      `${glyph}${name}<b class="pct">${pct}</b><span class="n">${count}</span></button>`;
  }
  function legendHTML(has) {
    const sw = (fill1, fill2) =>
      `<svg width="28" height="14"><rect x="0" y="0" width="28" height="6" fill="${fill1}"/><rect x="0" y="8" width="28" height="6" fill="${fill2}"/></svg>`;
    const items = [];
    if (has.tint) items.push(`<span>${sw("#DCE7F8", "#F8DEDB")}<span>95% interval</span></span>`);
    if (has.range) items.push(`<span>${sw("url(#hatch-D)", "url(#hatch-R)")}<span>Possible range among candidates with a known website</span></span>`);
    return items.length ? `<p class="legend">${items.join("")}</p>` : "";
  }
  function ariaSummary(term, ys, ps, cells) {
    return `Share of analyzed candidates whose site used ${term}. ` + ys.map((y, i) =>
      `${y}: ` + ps.map((p) => {
        const c = cells[i][p];
        return c.n ? `${PARTY[p].plural} ${c.k} of ${c.n}` : `${PARTY[p].plural} no analyzed candidates`;
      }).join(", ")).join("; ");
  }

  /* the group-size graphic */
  function renderGroup(ys, ps) {
    const phone = isPhone();
    const W = pageWidth();
    const groups = [];
    ys.forEach((y) => ps.forEach((p) => {
      const list = CANDS.filter((c) => c.year === y && c.party === p && match(c));
      const a = list.filter((c) => c.status === "analyzed").length;
      groups.push({ y, p, N: list.length, a });
    }));
    // Desktop: a column per year, Democrats above Republicans. Phone: a row per year, side by side.
    const nc = phone ? ps.length : ys.length;
    const gapX = phone ? 16 : 48;
    const cw = Math.floor((W - (nc - 1) * gapX) / nc);
    const cols = Math.max(1, Math.min(phone ? 28 : 32, Math.floor((cw + 2) / PITCH)));
    const maxN = Math.max(1, ...groups.map((g) => g.N));
    const gridH = (n) => Math.max(1, Math.ceil(n / cols)) * PITCH - 2;
    const rowsH = (yy) => Math.max(...groups.filter((g) => (phone ? g.y === yy : g.p === yy)).map((g) => gridH(g.N)));
    const headH = 24, capH = 34;
    let s = "", y0 = 0, H = 0;
    const bandX = {};
    if (!phone) {
      // year heads
      ys.forEach((y, ci) => {
        const x = ci * (cw + gapX);
        s += `<text x="${x}" y="13" font-size="13" font-weight="700" fill="#121212">${y}</text>`;
      });
      y0 = headH;
      ps.forEach((p, ri) => {
        const rh = rowsH(p);
        ys.forEach((y, ci) => {
          const g = groups.find((q) => q.y === y && q.p === p);
          s += cellSVG(g, ci * (cw + gapX), y0, cols, ci === 0, rh);
        });
        y0 += rh + capH + (ri < ps.length - 1 ? 24 : 0);
      });
      H = y0;
      // 2026 band behind its column
      const i26 = ys.indexOf(2026);
      if (i26 >= 0) {
        const x = i26 * (cw + gapX) - 12;
        s = `<rect x="${x}" y="-8" width="${cols * PITCH + 22}" height="${H + 8}" fill="#F4F4F2"/>` + s;
      }
    } else {
      ps.forEach((p, ci) => {
        const x = ci * (cw + gapX);
        s += (p === "D" ? `<circle cx="${x + 5}" cy="8.5" r="5" fill="${PARTY.D.color}"/>` : `<rect x="${x}" y="3.5" width="10" height="10" fill="${PARTY.R.color}"/>`) +
          `<text x="${x + 16}" y="13" font-size="13" font-weight="700" fill="#121212">${PARTY[p].plural}</text>`;
      });
      y0 = 32;
      ys.forEach((y) => {
        const rh = rowsH(y);
        if (y === 2026) s += `<rect x="-16" y="${y0 - 8}" width="${W + 32}" height="${headH + rh + capH + 8}" fill="#F4F4F2"/>`;
        s += `<text x="0" y="${y0 + 13}" font-size="13" font-weight="700" fill="#121212">${y}</text>`;
        ps.forEach((p, ci) => {
          const g = groups.find((q) => q.y === y && q.p === p);
          s += cellSVG(g, ci * (cw + gapX), y0 + headH, cols, false, rh);
        });
        y0 += headH + rh + capH + 16;
      });
      H = y0 - 16;
    }
    $(".group-grid").innerHTML = `<svg width="${W}" height="${H}" aria-hidden="true">${s}</svg>`;
    $(".group-key").innerHTML =
      `<span><svg width="22" height="6"><circle cx="2" cy="3" r="2" fill="${PARTY.D.color}"/><circle cx="8" cy="3" r="2" fill="${PARTY.D.color}"/><rect x="12" y="1" width="4" height="4" fill="${PARTY.R.color}"/><rect x="18" y="1" width="4" height="4" fill="${PARTY.R.color}"/></svg>Analyzed</span>` +
      `<span><svg width="22" height="6"><g fill="url(#hatch-gray)" stroke="#7D7D7D" stroke-width="0.75"><circle cx="2" cy="3" r="2"/><circle cx="8" cy="3" r="2"/><rect x="12" y="1" width="4" height="4"/><rect x="18" y="1" width="4" height="4"/></g></svg>Not analyzed</span>`;
  }
  function cellSVG(g, x0, y0, cols, labelParty, rowH) {
    const P = PARTY[g.p];
    let a = "", b = "";
    for (let i = 0; i < g.N; i++) {
      const x = x0 + (i % cols) * PITCH, y = y0 + Math.floor(i / cols) * PITCH;
      const m = g.p === "D" ? `<circle cx="${x + 2}" cy="${y + 2}" r="2"/>` : `<rect x="${x}" y="${y}" width="4" height="4"/>`;
      if (i < g.a) a += m; else b += m;
    }
    const gh = g.N ? Math.ceil(g.N / cols) * PITCH - 2 : 0;
    const cap = g.N === 0 ? "None on the ballot" : g.a === 0 ? `${fmt(g.N)} not analyzed` : `${fmt(g.a)} of ${fmt(g.N)} analyzed`;
    const ty = y0 + rowH + 18;
    return `<g fill="${P.color}">${a}</g><g fill="url(#hatch-gray)" stroke="#7D7D7D" stroke-width="0.75">${b}</g>` +
      `<text x="${x0}" y="${ty}" font-size="13" fill="#595959">${labelParty ? `<tspan font-weight="700" fill="#121212">${P.plural}</tspan><tspan dx="6">` : "<tspan>"}${cap}</tspan></text>`;
  }

  /* the candidate list */
  const sheet = $("#sheet");
  let opener = null;
  function districtOf(c) {
    if (c.office === "Senate") return `${c.state} Senate${c.district === "S2" ? ", special" : ""}`;
    const d = c.district;
    return /^\d+$/.test(d) ? (+d === 0 ? `${c.state} at large` : `${c.state}-${d.padStart(2, "0")}`) : `${c.state}-${d}`;
  }
  async function openList(key, from) {
    const [ys, p, ts] = key.split("-");
    const y = +ys, t = ts !== undefined ? +ts : st.terms[0];
    if (!PARTY[p] || !YEARS.includes(y) || t === undefined || !TERMS[t]) return;
    const P = PARTY[p], term = TERMS[t].term;
    const group = CANDS.filter((c) => c.year === y && c.party === p && match(c))
      .sort((a, b) => a.state.localeCompare(b.state) || districtOf(a).localeCompare(districtOf(b)) || a.name.localeCompare(b.name));
    const used = group.filter((c) => c.status === "analyzed" && c.tset.has(t));
    const notUsed = group.filter((c) => c.status === "analyzed" && !c.tset.has(t));
    const out = group.filter((c) => c.status !== "analyzed");
    const ex = await loadExcerpts(t);
    const where = [st.state ? STATES[st.state] : "All states", st.office || "",
      st.inc ? (st.inc === "1" ? "Incumbents" : "Challengers") : "",
      st.seat ? (st.seat === "close" ? "Close seats" : "Safe seats") : "",
      st.won ? (st.won === "1" ? "Won" : "Lost") : ""].filter(Boolean).join(", ");
    $(".sheet-title").textContent = `${P.plural}, ${y}${y === 2026 ? " so far" : ""}`;
    $(".sheet-sub").textContent = where;
    const mark = (c) => p === "D"
      ? `<svg class="mark" width="10" height="10"><circle cx="5" cy="5" r="${c.status === "analyzed" ? 5 : 4.5}" fill="${c.status === "analyzed" ? P.color : "url(#hatch-gray)"}" stroke="${c.status === "analyzed" ? "none" : "#7D7D7D"}"/></svg>`
      : `<svg class="mark" width="10" height="10"><rect x="0.5" y="0.5" width="9" height="9" fill="${c.status === "analyzed" ? P.color : "url(#hatch-gray)"}" stroke="${c.status === "analyzed" ? "none" : "#7D7D7D"}"/></svg>`;
    let h = "";
    h += `<h3>Used “${esc(term)}” <span class="n">${used.length}</span></h3><ol>`;
    used.forEach((c) => {
      const e = ex[c.id];
      h += `<li class="excerpt-item"><div class="who">${esc(c.name)}<span class="dist">${districtOf(c)}</span></div>` +
        (e ? `<p class="excerpt">…${esc(e[0].trimStart())}<mark class="${p}">${esc(e[1])}</mark>${esc(e[2].trimEnd())}…</p>` : "") + `</li>`;
    });
    h += `</ol>`;
    if (notUsed.length) {
      h += `<h3>Did not use it <span class="n">${notUsed.length}</span></h3><ol class="name-list">`;
      notUsed.forEach((c) => (h += `<li class="who">${esc(c.name)}<span class="dist">${districtOf(c)}</span></li>`));
      h += `</ol>`;
    }
    if (out.length) {
      h += `<h3>Not analyzed <span class="n">${out.length}</span></h3><ol class="name-list">`;
      out.forEach((c) => (h += `<li class="who">${mark(c)}${esc(c.name)}<span class="dist">${districtOf(c)}</span><span class="note">${STATUS_NOTE[c.status]}</span></li>`));
      h += `</ol>`;
    }
    $(".sheet-body").innerHTML = h;
    opener = from || null;
    st.list = key;
    writeURL();
    if (!sheet.open) sheet.showModal();
    $(".sheet-title").focus();
    sheet.scrollTop = 0;
  }
  sheet.addEventListener("close", () => {
    st.list = "";
    writeURL();
    if (opener && document.contains(opener)) opener.focus();
  });
  sheet.addEventListener("click", (e) => {
    if (e.target === sheet || e.target.closest("[data-close]")) sheet.close();
  });
  $(".results").addEventListener("click", (e) => {
    const b = e.target.closest(".count");
    if (!b) return;
    const [y, p, t] = b.dataset.list.split("-");
    openList(st.terms.length > 1 ? `${y}-${p}-${t}` : `${y}-${p}`, b);
  });

  /* ------------------------------------------------------------------- start */

  function renderAll() {
    firstBand.unused = true;
    fitFilters();
    drawPipeline();
    drawStep();
    renderExplorer();
  }
  readURL();
  buildFilters();
  syncFilters();
  renderChosen();
  renderAll();
  if (st.list) {
    const b = [...document.querySelectorAll(".count")].find((x) => x.dataset.list.startsWith(st.list.split("-").slice(0, 2).join("-")));
    openList(st.list, b);
  }
  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) el.scrollIntoView();
  }
  let rt, lastPhone = isPhone(), lastW = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      lastPhone = isPhone();
      renderAll();
    }, 120);
  });
  document.documentElement.dataset.ready = "1";
})();
