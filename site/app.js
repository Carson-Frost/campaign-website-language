/* Instrument: the shell and the Explorer. Top bar, ranked table, one-term view, several terms, filters, candidate drawer. */
(() => {
"use strict";
const { S, C, PCOL, PNAME, YEARS, TINY, SMALL, STATES, $, $$, esc, nf, yl } = INS;

const excerptCache = {};
let query = "";            // the word search above the table; not part of the address
let filtersOpen = false;
let opener = null;         // the control that opened the drawer or the filters, to return focus to
let scrollAt = null;       // the page's scroll position when the drawer opened, restored when it closes
let lastKey = "";          // the address of the view without its drawer, to tell a drawer change from a new view

/* A word's own note, with the mark that ties it to the word wherever the word is in view: a dagger for Working Families,
   which is also set on the value it changes, the 2026 Republican share, and only where a site that uses the phrase only as part of
   "Working Families Tax Cut" (flagged `bill`) is in the group on view. `long` names the word, for views that hold several. */
const CAVEATS = {
  freedom: { mark: "‡", text: "In a sample of 20 matches, 17 used the word as intended and 3 were an award or group name. The shares count every match.",
    long: w => `In a sample of 20 ${w} matches, 17 used the word as intended and 3 were an award or group name. The shares count every match.` },
  inflation: { mark: "§", text: "Excludes mentions of the Inflation Reduction Act.", long: w => `${w} excludes mentions of the Inflation Reduction Act.` },
  "working families": { mark: "†", text: "Includes sites that use the phrase only as part of “Working Families Tax Cut,” a bill’s name.",
    dagger: c => c.y === 2026 && c.p === "R" && INS.group(c.y, c.p).an.some(x => x.bill),
    long: w => `${w} includes sites that use the phrase only as part of “Working Families Tax Cut,” a bill’s name.` },
};
const caveat = ti => CAVEATS[INS.D.terms[ti].term];
/* Marks on the chart face were removed: the pre-registered patterns carve out false positives in the regex itself.
   caveat() stays available for future use; markApplies and markFor are hard-wired empty so nothing renders. */
const markApplies = () => false;
const markFor = () => "";

/* A change the reader makes to the view (cycle, sort, grouping, filters, possible range) is a step in the history, so
   Back undoes it and stays on the view. Anything else replaces the address; the drawer's own entry keeps its mark
   until the drawer is gone. */
INS.commit = (o = {}) => {
  const a = INS.addressFor();
  if (o.push && a !== location.hash) history.pushState(null, "", a);
  else history.replaceState(S.panel ? history.state : null, "", a);
  INS.render(o);
};
INS.go = addr => { if (location.hash === addr) INS.render(); else location.hash = addr; };

/* ---------- small pieces ---------- */
/* The glossary subsite was removed; definition links collapse to plain text. */
const glossLink = (id, text) => text;
const analyzedIn = (y, p) => INS.group(y, p).n;

function yearSeg() {
  return `<div class="seg-wrap"><div class="seg" role="group" aria-label="Cycle">${YEARS.map(y => `<button type="button" data-year="${y}" aria-pressed="${S.year === y}"${y === 2026 ? ' class="y26"' : ""}>${yl(y)}</button>`).join("")}</div>${S.year === 2026 ? `<span class="asof">${asOf()}</span>` : ""}</div>`;
}
function toggle(id, label, on, hint) {
  return `<label class="check" for="${id}"${hint ? ` title="${esc(hint)}"` : ""}><input type="checkbox" id="${id}"${on ? " checked" : ""}><span class="box" aria-hidden="true"></span><span>${label}</span></label>`;
}
function filtersButton() {
  const n = INS.GROUPS.filter(g => S.f[g.key].size).length;
  return `<button type="button" class="btn" id="filtersBtn" aria-haspopup="dialog" aria-expanded="${filtersOpen}" aria-controls="filters">Filters${n ? `<span class="badge">${n}</span>` : ""}</button>`;
}
/* The active filters as removable chips. */
function chips() {
  const out = [];
  INS.GROUPS.forEach(g => [...S.f[g.key]].forEach(v => {
    const label = g.key === "state" ? STATES[v] : g.byV[v].label;
    out.push(`<button type="button" class="chip" data-unfilter="${g.key}:${v}" aria-label="Remove filter ${esc(label)}">${esc(label)}<svg width="9" height="9" aria-hidden="true"><path d="M1 1 L8 8 M8 1 L1 8" stroke="currentColor" stroke-width="1.5"/></svg></button>`);
  }));
  return out.join("");
}

/* ---------- filters popover ---------- */
function optCounts(g) {
  const years = S.terms.length === 0 ? [S.year] : YEARS;
  const base = INS.D.candidates.filter(c => c.status === "analyzed" && years.includes(c.year) && INS.match(c, g.key));
  return g.opts.map(o => base.filter(o.test).length);
}
function renderFilters() {
  const el = $("#filters");
  el.hidden = !filtersOpen;
  $("#fscrim").hidden = !filtersOpen;
  if (!filtersOpen) { el.innerHTML = ""; return; }
  const keep = $(".fscroll", el), at = keep ? keep.scrollTop : 0;   // a choice redraws the list; it stays where the reader was
  const group = g => {
    return `<fieldset class="fgrp"><legend>${g.key === "seat" ? glossLink("close-or-safe-seat", g.label) : g.label}</legend>${g.opts.map(o => `<label class="opt">
      <input type="checkbox" data-g="${g.key}" value="${o.v}"${S.f[g.key].has(o.v) ? " checked" : ""}><span class="box" aria-hidden="true"></span>
      <span class="lab">${esc(o.label)}</span></label>`).join("")}</fieldset>`;
  };
  const sg = INS.GROUPS.find(g => g.key === "state");
  const any = INS.filtered();
  el.innerHTML = `<div class="fscroll"><div class="fhead"><h2 id="fTitle">Filters</h2></div>
    <div class="fgrid">${["office", "inc", "seat", "won"].map(k => group(INS.GROUPS.find(g => g.key === k))).join("")}</div>
    <div class="fstate"><label for="stateSel">State</label>
      <select id="stateSel"><option value="">Add State</option>${sg.opts.map(o => (S.f.state.has(o.v) ? "" : `<option value="${o.v}">${esc(o.label)}</option>`)).join("")}</select></div></div>
    <div class="ffoot"><button type="button" class="textbtn" id="fClear"${any ? "" : " disabled"}>Clear All</button><button type="button" class="btn dark" id="fDone">Done</button></div>`;
  const box = $(".fscroll", el); if (box) box.scrollTop = at;
}
function openFilters(from) { opener = from || null; filtersOpen = true; renderFilters(); positionFilters(); const f = $("#filters input, #filters select"); if (f) f.focus(); const b = $("#filtersBtn"); if (b) b.setAttribute("aria-expanded", "true"); }
function closeFilters(refocus = true) {
  filtersOpen = false; renderFilters();
  const b = $("#filtersBtn"); if (b) { b.setAttribute("aria-expanded", "false"); if (refocus) b.focus(); }
}
function positionFilters() {
  const el = $("#filters"), b = $("#filtersBtn");
  if (!b || INS.isPhone()) { el.style.left = el.style.top = el.style.width = el.style.maxHeight = ""; return; }
  /* Fixed under its button, kept inside the window: the height left below the button is the most it takes, and its list scrolls. */
  const r = b.getBoundingClientRect(), w = Math.min(520, innerWidth - 32), bar = 0;
  const top = Math.max(bar + 8, r.bottom + 6);
  el.style.width = w + "px";
  el.style.left = Math.max(16, Math.min(r.left, innerWidth - w - 16)) + "px";
  el.style.top = top + "px";
  el.style.maxHeight = Math.max(160, innerHeight - top - 16) + "px";
}

/* ---------- chips and notes ---------- */
const pn = p => `<span class="pn ${p}">${PNAME[p]}</span>`;
function groupLine() {
  const c = chips();
  return c ? `<div class="scope">${c}</div>` : "";
}
/* Footnotes with chart-face marks were removed. notebook() still collects plain `.add` lines, but `.mark` is a
   no-op so every mark+footnote pair asks for nothing. */
function notebook() {
  const lines = [];
  return {
    add(html) { if (html && !lines.includes(html)) lines.push(html); },
    mark() { /* no-op: marks are no longer rendered */ },
    html() {
      return `<footer class="notes">${lines.map(x => `<p>${x}</p>`).join("")}${sourceLine()}</footer>`;
    },
  };
}
/* Every site's copy is the newest saved from January 1 through election day (for 2026, through the date its figures reach),
   and some analyzed 2024 sites have a newest copy saved on election day itself; one analyzed 2024 site has Wayback Machine copies
   only. The age of a copy runs from 0 days to months, so it is said as what can be, not as what always is. */
const sourceLine = () => `<p class="src">Source: ${glossLink("common-crawl", "Common Crawl")} copies of campaign websites, each the newest saved from January 1 through election day or, for 2026, through ${INS.fmtDate(INS.through2026)}. Method: METHODS.md.</p>`;
/* Notes 1 and 2 are marked on the Gap and Adjusted P-Value heads (and on a phone's labels), so a reader meets the key
   at the figure it explains. */
const GAPMARK = "1", PMARK = "2";
const gapNote = () => `${glossLink("gap", "Gap")} is Democratic minus Republican. <span class="pn D">D+</span>&nbsp;is higher Democratic, <span class="pn R">R+</span>&nbsp;higher Republican; a gap in italics may be chance.`;
const noteMark = () => "";
const changeDef = total => `Change is a party’s share minus its share in the previous cycle. A change in italics may be chance.${total ? ` <span class="tcnote">Total Change is the same figure for both parties’ candidates together.</span>` : ""}`;
const pNote = () => `${glossLink("adjusted-p-value", "Adjusted P-Value")}: how much of a gap this strong could be chance, adjusted across all 57 terms. Smaller is stronger evidence.`;
const rangeNote = () => `${glossLink("possible-range", "Possible Range")} is how low and how high the share could be if every candidate with a website but no analyzed text had, or had not, used the term. It is not an interval of chance.`;
const starNote = () => "Fewer than 30 analyzed candidates, so one candidate moves a share by 3% or more.";
/* What a share is, for the offices in view: a filter on one office narrows the candidates named. A group of under ten
   analyzed candidates shows a count in place of a share, so the line says which each view shows. */
const SHARE_BASE = () => { const o = [...S.f.office]; return `analyzed ${o.length === 1 ? o[0] : "House and Senate"} candidates whose campaign website used the term at least once`; };
const shareDef = mode => mode === "count" ? `Number of ${SHARE_BASE()}.`
  : `Share of ${SHARE_BASE()}${mode === "mixed" ? ", or the number where fewer than ten were analyzed" : ""}.`;
const smallCell = y => INS.PARTIES.some(p => { const n = INS.group(y, p).n; return n > 0 && n < TINY; });
/* The date the 2026 figures reach is said beside the cycle only while 2026 is the cycle on view, and under 2026 in a chart, a cycle table and the drawer. */
const asOf = () => `As of ${INS.fmtDate(INS.through2026)}`;
/* What the shares rest on: the analyzed candidates of each party and those left out. */
const basisNote = y => {
  const g = INS.PARTIES.map(p => INS.group(y, p)), lost = g.map(x => x.B - x.n);
  const out = lost[0] + lost[1] > 0 ? ` Not analyzed: ${nf(lost[0])} Democratic and ${nf(lost[1])} Republican. ${glossLink("not-analyzed", "Reasons for Not Analyzing")}.` : "";
  return `Analyzed: ${nf(g[0].n)} Democratic and ${nf(g[1].n)} Republican ${g[1].n === 1 ? "candidate" : "candidates"}.${out}`;
};
/* The basis of a view that draws every cycle: the four cycles summed, since no one cycle is the view's subject. */
const basisAll = () => {
  const n = p => YEARS.reduce((a, y) => a + INS.group(y, p).n, 0);
  const lost = p => YEARS.reduce((a, y) => { const g = INS.group(y, p); return a + g.B - g.n; }, 0);
  const d = n("D"), r = n("R"), ld = lost("D"), lr = lost("R");
  const out = ld + lr > 0 ? ` Not analyzed: ${nf(ld)} Democratic and ${nf(lr)} Republican. ${glossLink("not-analyzed", "Reasons for Not Analyzing")}.` : "";
  return `Analyzed across the four cycles: ${nf(d)} Democratic and ${nf(r)} Republican candidate-years.${out}`;
};

/* ---------- cells ---------- */
const tipFor = (c, o = {}) => {
  const lo = Math.round(c.ci[0] * 100), hi = Math.round(c.ci[1] * 100);
  return `${PNAME[c.p]}, ${yl(c.y)}\n${c.k} of ${c.n} analyzed candidates` + (c.n >= TINY ? `\n95% Interval ${lo} to ${hi}%` : "")
    + (o.range && c.range && c.n >= TINY ? `\nPossible Range ${c.rangePct[0]} to ${c.rangePct[1]}%` : "")
    + "\nSelect to list the candidates";
};
function shareBtn(c, o = {}) {
  if (!c || !c.n) return `<span class="na" role="img" aria-label="not analyzed">—</span>`;
  const val = c.n < TINY ? `${c.k} of ${c.n}` : INS.pctOf(c.k, c.n);
  const on = S.panel && S.panel.ti === c.ti && S.panel.y === c.y && S.panel.p === c.p ? " on" : "";
  const lab = `${PNAME[c.p]}, ${yl(c.y)}: ${c.n < TINY ? val : `${val} of ${c.n}`} analyzed candidates` + (c.n >= TINY ? `, 95% Interval ${Math.round(c.ci[0] * 100)} to ${Math.round(c.ci[1] * 100)}%` : "") + `. Show the candidates`;
  return `<button type="button" class="share${c.n < SMALL ? " small" : ""}${on}" style="${o.style || ""}" data-panel="${INS.tslug(c.ti)}.${c.y}.${c.p}" data-tip="${esc(tipFor(c, o))}" aria-label="${esc(lab)}">${val}</button>`;
}
/* A party's move from the previous cycle, as a percent, beside its share; set in italics where its interval includes zero. */
function chgEl(ch) {
  if (!ch) return "";
  const t = INS.diff(ch.a.k, ch.a.n, ch.b.k, ch.b.n), lo = INS.signedPts(ch.ci[0]), hi = INS.signedPts(ch.ci[1]);
  const tip = `Change from ${yl(ch.from)}\nChange Interval ${lo}% to ${hi}%` + (ch.weak ? "\nIn italics: the Change Interval includes zero" : "");
  const dir = t.sign > 0 ? "Up" : t.sign < 0 ? "Down" : "No change,";
  return `<span class="chg${ch.weak ? " weak" : ""}" tabindex="0" role="img" data-tip="${esc(tip)}" aria-label="${dir}${t.sign ? ` ${String(t.text).replace(/^[+−]/, "")} percent` : ""} from ${yl(ch.from)}${ch.weak ? ", may be chance" : ""}">${t.text}%</span>`;
}
/* One party's cell in the ranked table: a bar from 0 to 100% with its value at the end. */
function barCell(c, p, o = {}) {
  const tag = `<span class="tag ${p}" aria-hidden="true">${PNAME[p]}</span>`;
  if (!c || !c.n) return `${tag}<span class="na" role="img" aria-label="not analyzed">—</span>`;
  if (c.n < TINY) return `${tag}${shareBtn(c, o)}`;
  const w = c.share * 100;
  return `${tag}<span class="barwrap"><span class="bars"><i style="width:${w.toFixed(1)}%"></i><span class="vlab" style="left:calc(${w.toFixed(1)}% + 9px)">${shareBtn(c, o)}${chgEl(o.chg)}</span></span></span>`;
}
/* A gap is weak, and set in italics, when its Gap Interval includes zero or its adjusted p-value is 0.05 or more. */
const weakGap = g => g.ci[0] <= 0 && g.ci[1] >= 0 || (g.q !== null && g.q >= 0.05);
/* The newest cycle's gap, when a gap that size turns up by chance: the overview marks the term, because a chart
   of two lines alone invites a reader to read a difference the study cannot tell from nothing. */
const LASTY = YEARS[YEARS.length - 1];
function notDistinguishable(ti) {
  const d = INS.cell(ti, LASTY, "D"), r = INS.cell(ti, LASTY, "R");
  const g = INS.gapOf(d, r, ti, LASTY);
  return !!(g && !g.tiny && weakGap(g));
}
/* The gap in the ranked table is a button: selecting it, or focusing it, shows its Gap Interval and adjusted p-value. */
function gapEl(g, d, r) {
  if (!g) return `<span class="na" role="img" aria-label="not analyzed">—</span>`;
  if (g.tiny) return `<span class="muted">Too Few Candidates</span>`;
  const t = INS.diff(d.k, d.n, r.k, r.n), mag = t.text.replace(/^[+−]/, "");
  const who = t.sign > 0 ? "D" : t.sign < 0 ? "R" : null;
  const weak = weakGap(g);
  const iv = `Gap Interval ${INS.partyPts(g.ci[0])} to ${INS.partyPts(g.ci[1])}`, q = g.q !== null ? `Adjusted P-Value ${INS.fmtQ(g.q)}` : "";
  const why = g.ci[0] <= 0 && g.ci[1] >= 0 ? "the Gap Interval includes zero" : "the adjusted p-value is 0.05 or more";
  const tip = `Gap, Democratic Minus Republican\n${iv}` + (q ? `\n${q}` : "") + (weak ? `\nIn italics: ${why}` : "");
  const lab = (who ? `${PNAME[who]} candidates higher by ${mag} points` : "No gap") + `. ${iv[0].toUpperCase() + iv.slice(1)}` + (q ? `. ${q}` : "") + (weak ? `. In italics because ${why}` : "") + ".";
  return `<button type="button" class="gp ${who || ""}${g.small ? " small" : ""}${weak ? " weak" : ""}" data-tip="${esc(tip)}" aria-label="${esc(lab)}">${who ? `${who}+${mag}` : "0"}</button>`;
}

/* ---------- the ranked table ---------- */
function modelRows(termIdx) {
  const y = S.year;
  const ids = termIdx || INS.D.terms.map((t, i) => i);
  return ids.map(ti => {
    const d = INS.cell(ti, y, "D"), r = INS.cell(ti, y, "R");
    const k = d.k + r.k, n = d.n + r.n;
    const dc = INS.changeOf(ti, y, "D"), rc = INS.changeOf(ti, y, "R"), tc = INS.changeTotal(ti, y);
    return { ti, theme: INS.D.terms[ti].theme, d, r, dc, rc, tc, g: INS.gapOf(d, r, ti, y), prom: n ? k / n : null };
  });
}
const SORT_NAMES = { prom: "Most Used Overall", d: "Democratic Share", r: "Republican Share", gap: "Most Democratic Gap", gapr: "Most Republican Gap", dchg: "Democratic Change", rchg: "Republican Change", tchg: "Total Change", name: "Alphabetical" };
/* What the table can show this year under these filters: a count-only table has no gap. */
function tableFacts(pool) {
  const y = S.year, rows = modelRows();
  const counts = INS.PARTIES.every(p => INS.group(y, p).n < TINY);   // nothing to draw: shares are counts
  const noGap = counts || !rows.some(x => x.g && !x.g.tiny);         // no word has a gap to show: the column is left out
  // a change column is left out, like the gap, when no word shown has a value in it; its sort goes with it
  const chgRows = pool || rows, can = !counts && y !== INS.YEARS[0];
  const dc = can && chgRows.some(x => x.dc), rc = can && chgRows.some(x => x.rc), tc = can && chgRows.some(x => x.tc);
  const hasChg = dc || rc || tc;
  const sorts = ["prom", "d", "r"].concat(noGap ? [] : ["gap", "gapr"], dc ? ["dchg"] : [], rc ? ["rchg"] : [], tc ? ["tchg"] : [], ["name"]);
  return { y, counts, noGap, hasChg, dc, rc, tc, sorts, sort: sorts.includes(S.sort) || S.sort === "gap" && sorts.includes("gapr") ? S.sort : "prom" };
}
function sortRows(rows, sort = S.sort) {
  const key = { prom: x => x.prom, d: x => (x.d.n ? x.d.share : null), r: x => (x.r.n ? x.r.share : null), gap: x => (x.g ? INS.key(x.g.v) : null), dchg: x => (x.dc ? INS.key(x.dc.v) : null), rchg: x => (x.rc ? INS.key(x.rc.v) : null), tchg: x => (x.tc ? INS.key(x.tc.v) : null), name: x => INS.dn(x.ti).replace(/[“”]/g, "").toLowerCase() }[sort];
  const sign = S.dir === "desc" ? -1 : 1;
  if (sort === "name") return rows.slice().sort((a, b) => key(a).localeCompare(key(b)) * sign || a.ti - b.ti);
  return rows.slice().sort((a, b) => {
    const A = key(a), B = key(b);
    if (A === null && B === null) return a.ti - b.ti;
    if (A === null) return 1; if (B === null) return -1;
    return (A - B) * sign || a.ti - b.ti;
  });
}

/* The table. ordered: the rows keep the order given, as when they follow the charts above them. Its notes go to the
   notebook `fn`, which the caller sets at the foot of the view. */
function tableHTML(rows, fn, ordered = false) {
  const { y, counts, noGap, hasChg, dc, rc, tc, sort } = tableFacts(ordered ? rows : undefined);
  /* A head is a button that sorts by its column; a second press turns the order round. Nothing is sorted by a head
     while the order is Most Used Overall, which no column holds. */
  const sh = (k, label, mark = "") => {
    const cls = { name: "first", d: "ph D", r: "ph R", gap: "gaph", dchg: "chgh D", rchg: "chgh R", tchg: "chgh T" }[k];
    if (ordered) return `<th class="${cls}" scope="col">${label}${mark}`;
    const on = S.sort === k && sort === k;
    return `<th class="${cls}" scope="col"${on ? ` aria-sort="${S.dir === "asc" ? "ascending" : "descending"}"` : ""}>`
      + `<button type="button" class="sorth" data-sort="${k}"><span>${label}${mark}</span><span class="arr" aria-hidden="true"></span></button>`;
  };
  const head = `<thead><tr>${sh("name", "Term")}</th>
      ${sh("d", "Democratic")}</th>${dc ? `${sh("dchg", "Change")}</th>` : ""}${sh("r", "Republican")}</th>${rc ? `${sh("rchg", "Change")}</th>` : ""}${tc ? `${sh("tchg", "Total Change")}</th>` : ""}${noGap ? "" : `${sh("gap", "Gap", noteMark(GAPMARK))}</th>`}</tr></thead>`;
  const row = x => {
    const dag = caveat(x.ti) && caveat(x.ti).dagger;
    const link = INS.addressFor({ terms: [x.ti], panel: null });
    return `<tr><th scope="row" class="first"><a href="${link}">${esc(INS.dn(x.ti))}</a></th>
      <td class="pcell D"><div class="pc D">${barCell(x.d, "D", { dagger: dag, chg: x.dc })}</div></td>${dc ? `<td class="chgc D">${chgEl(x.dc)}</td>` : ""}
      <td class="pcell R"><div class="pc R">${barCell(x.r, "R", { dagger: dag, chg: x.rc })}</div></td>${rc ? `<td class="chgc R">${chgEl(x.rc)}</td>` : ""}${tc ? `<td class="chgc T">${chgEl(x.tc)}</td>` : ""}
      ${noGap ? "" : `<td class="gapc"><span class="flab">Gap${noteMark(GAPMARK)}</span>${gapEl(x.g, x.d, x.r)}</td>`}</tr>`;
  };
  const body = ordered ? rows.map(row).join("") : sortRows(rows, sort).map(row).join("");
  const g = INS.PARTIES.map(p => INS.group(y, p));
  fn.add(basisNote(y) + " Select a value to list its candidates.");
  if (noGap) fn.add(`Fewer than ten analyzed candidates in a party, so its results are counts${g.some(x => !x.n) ? ", or a dash if none" : ""}, and a gap needs ten or more in both.`);
  else { if (hasChg) fn.add(changeDef(tc)); fn.mark(GAPMARK, gapNote()); }
  if (hasChg && noGap) fn.add(changeDef(tc));
  if (g.some(x => x.n >= TINY && x.n < SMALL)) fn.mark("*", starNote());
  rows.forEach(x => {
    const cv = caveat(x.ti);
    if (cv && cv.dagger && INS.PARTIES.some(p => cv.dagger({ y, p }))) fn.mark(cv.mark, cv.long(esc(INS.dn(x.ti))));
  });
  return `<table class="rank${hasChg ? " hc" : ""}${counts ? " counts" : ""}${noGap ? " nogap" : ""}${y === 2026 ? " y26" : ""}">${head}<tbody>${body}</tbody></table>`;
}

function emptyHTML(years = [S.year]) {
  const base = INS.D.candidates.filter(c => years.includes(c.year) && c.status === "analyzed");
  const when = years.length === 1 ? yl(years[0]) : "any cycle";
  const opts = [];
  INS.GROUPS.forEach(g => [...S.f[g.key]].forEach(v => {
    const keep = c => INS.GROUPS.every(h => { const sel = [...S.f[h.key]].filter(x => !(h.key === g.key && x === v)); return sel.length === 0 || sel.some(x => h.byV[x].test(c)); });
    const n = base.filter(keep).length;
    const label = g.key === "state" ? STATES[v] : g.byV[v].label;
    opts.push(`<li><button type="button" class="textbtn" data-unfilter="${g.key}:${v}">Remove ${esc(label)}</button> <span class="muted">${nf(n)} analyzed candidates would match</span></li>`);
  }));
  const all = INS.D.candidates.filter(c => years.includes(c.year) && INS.match(c)).length;
  return `<div class="empty"><h2>No Matching Candidates</h2><p>${all ? `${nf(all)} ${all === 1 ? "candidate matches" : "candidates match"} in ${when}, but no site text was analyzed. A missing site is not a zero.` : "No Democratic or Republican candidate matches these filters."}</p>${opts.length ? `<ul>${opts.join("")}</ul>` : ""}</div>`;
}

function tableBlock(termIdx, fn, ordered = false) {
  const rows = modelRows(termIdx);
  const q = query.trim().toLowerCase();
  const shown = q ? rows.filter(x => INS.dn(x.ti).toLowerCase().includes(q)) : rows;
  const none = INS.PARTIES.every(p => !INS.group(S.year, p).n);
  if (none) return emptyHTML();
  if (!shown.length) return `<p class="nomatch">No term matches “${esc(query)}”.</p>`;
  return tableHTML(shown, fn, ordered);
}
/* ---------- the themes, the opening view ---------- */
/* The width the track is drawn at. The track is one column of a table that fills the view, so it is sized from the
   view and redrawn when the view changes width. */
const TRACKH = 22;
function trackW() {
  const vw = $("#view").clientWidth || innerWidth - 64;
  return INS.isPhone() ? Math.max(180, vw - 10) : Math.max(110, Math.min(430, vw - 450));
}

/* Every theme as a row of small charts, one per term, each drawing both parties across all four cycles. A reader
   takes in a theme at a glance and never chooses a cycle, because every chart draws all of them. */
/* Simple chart for an extracted-candidate term the search box resolves to: 2 party lines across 4 cycles. */
function searchChart(entry, W) {
  const PAD = { t: 18, r: 92, b: 30, l: 42 }, H = 220;
  const years = YEARS, byYP = {};
  entry.shares.forEach(s => { byYP[s.year + s.party] = s; });
  let max = 0;
  years.forEach(y => INS.PARTIES.forEach(p => { const s = byYP[y + p]; if (s && s.n) max = Math.max(max, s.k / s.n); }));
  max = Math.min(1, Math.max(0.1, Math.ceil(max * 10 + 0.001) / 10));
  const xOf = i => PAD.l + (W - PAD.l - PAD.r) * i / (years.length - 1);
  const yOf = v => PAD.t + (H - PAD.t - PAD.b) * (1 - v / max);
  const path = p => years.map((y, i) => { const s = byYP[y + p]; return s && s.n ? `${i ? "L" : "M"}${xOf(i).toFixed(1)},${yOf(s.k / s.n).toFixed(1)}` : null; }).filter(Boolean).join(" ");
  const dots = p => years.map((y, i) => { const s = byYP[y + p]; return s && s.n ? `<circle cx="${xOf(i).toFixed(1)}" cy="${yOf(s.k / s.n).toFixed(1)}" r="3.2" fill="${INS.PCOL[p]}"/>` : ""; }).join("");
  const grid = [0, 0.25, 0.5, 0.75, 1].filter(v => v <= max + 0.001).map(v =>
    `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${yOf(v).toFixed(1)}" y2="${yOf(v).toFixed(1)}" stroke="${INS.C.faint}"/>` +
    `<text x="${PAD.l - 8}" y="${yOf(v).toFixed(1)}" text-anchor="end" font-size="11" fill="${INS.C.sec}" dominant-baseline="central">${Math.round(v * 100)}%</text>`
  ).join("");
  const xtk = years.map((y, i) => `<text x="${xOf(i).toFixed(1)}" y="${H - 10}" text-anchor="middle" font-size="12" fill="${INS.C.ink}">${yl(y)}</text>`).join("");
  const endLab = p => { const s = byYP["2026" + p]; const yv = s && s.n ? yOf(s.k / s.n) : (p === "D" ? PAD.t + 10 : PAD.t + 26); return `<text x="${(W - PAD.r + 8).toFixed(1)}" y="${yv.toFixed(1)}" font-size="12" fill="${INS.PCOL[p]}" dominant-baseline="central">${INS.PNAME[p]}</text>`; };
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Share by party and cycle">${grid}<path d="${path("D")}" fill="none" stroke="${INS.PCOL.D}" stroke-width="2"/><path d="${path("R")}" fill="none" stroke="${INS.PCOL.R}" stroke-width="2"/>${dots("D")}${dots("R")}${xtk}${endLab("D")}${endLab("R")}</svg>`;
}

function searchChartBlock(entry) {
  const vw = $("#view").clientWidth || innerWidth - 64;
  const w = Math.min(640, Math.max(320, vw));
  const total = YEARS.reduce((a, y) => a + INS.PARTIES.reduce((b, p) => { const s = entry.shares.find(x => x.year === y && x.party === p); return b + (s ? s.n : 0); }, 0), 0);
  const title = entry.term.split(" ").map(w => w ? w[0].toUpperCase() + w.slice(1) : w).join(" ");
  return `<figure class="searchCard"><figcaption>${esc(title)}</figcaption>${searchChart(entry, w)}<p class="src">Extracted candidate term, charted from the search index. ${total} analyzed candidate-years across the four cycles.</p></figure>`;
}

/* Topic chips group the grid into Carson's narrower categories. Multi-select: a chart shows if its
   topics intersect the active set. Empty set means the All chip is on and every chart renders. */
function topicsList() {
  return INS.D.topics_list || [];
}
function topicChipsHTML() {
  const picked = S.topics.size ? [...S.topics][0] : "";
  const list = [["", "All"]].concat(topicsList().map(t => [INS.slug(t), t]));
  const current = list.find(([s]) => s === picked) || list[0];
  const items = list.map(([s, lab]) => {
    const on = s === picked;
    return `<li role="option" aria-selected="${on}" data-cat="${esc(s)}" tabindex="-1" class="cat-opt${on ? " on" : ""}">${esc(lab)}${on ? `<svg width="12" height="12" aria-hidden="true" class="cat-check"><path d="M1 6 L5 10 L11 2" stroke="currentColor" stroke-width="2" fill="none"/></svg>` : ""}</li>`;
  }).join("");
  return `<div class="cat-picker">
    <button type="button" class="cat-btn" id="catBtn" aria-haspopup="listbox" aria-expanded="false" aria-controls="catMenu">
      <span class="cat-prefix">Category:</span><span class="cat-current">${esc(current[1])}</span>
      <svg width="12" height="8" aria-hidden="true" class="cat-caret"><path d="M1 1 L6 7 L11 1" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>
    </button>
    <ul class="cat-menu" id="catMenu" role="listbox" aria-label="Category" hidden>${items}</ul>
  </div>`;
}
function termMatchesTopics(ti) {
  if (S.topics.size === 0) return true;
  const topics = (INS.D.terms[ti].topics || []).map(INS.slug);
  return topics.some(t => S.topics.has(t));
}

function themesWithFoot() {
  const fn = notebook(), y = S.year;
  const q = query.trim().toLowerCase();
  const all = INS.D.terms.map((t, i) => i);
  const scoped = q ? all.filter(ti => INS.dn(ti).toLowerCase().includes(q))
                   : all.filter(termMatchesTopics);
  const shownIdx = scoped;
  if (INS.PARTIES.every(p => !INS.group(y, p).n)) return emptyHTML(YEARS);
  if (!shownIdx.length) {
    const hit = INS.SEARCH && INS.SEARCH.get(q);
    if (hit) return searchChartBlock(hit);
    return `<p class="nomatch">No term matches “${esc(query)}”.</p>`;
  }
  const vw = $("#view").clientWidth || innerWidth - 64;
  const cols = innerWidth <= 760 ? 1 : innerWidth <= 980 ? 2 : 3;
  const w = cols === 1 ? Math.max(260, vw) : Math.floor(vw / cols - 14);
  const mo = ti => ({ mini: true, range: false, ci: false, dagger: (caveat(ti) || {}).dagger });
  const drawnAll = shownIdx.filter(ti => INS.lineHasData(INS.lineData(ti)));
  /* One layout for the page, so a value sits in the same place in every chart. */
  const oneLine = drawnAll.every(ti => INS.lineOneLine(ti, w, mo(ti)));
  /* One height for every chart on the page, so the grid reads evenly across themes. */
  const hhAll = Math.max(0, ...drawnAll.map(ti => INS.lineChartHeight(ti, w, Object.assign(mo(ti), { oneLine }))));
  const card = ti => {
    const has = INS.lineHasData(INS.lineData(ti));
    const cv = caveat(ti);
    if (cv && cv.dagger && has && YEARS.some(yy => INS.PARTIES.some(p => cv.dagger({ y: yy, p })))) fn.mark(cv.mark, cv.long(esc(INS.dn(ti))));
    return `<figure class="multiple"><figcaption>${esc(INS.dn(ti))}${has ? markFor(ti) : ""}</figcaption>
      ${has ? INS.lineChart(ti, w, Object.assign(mo(ti), { h: hhAll, oneLine })) : `<p class="nochart">Fewer than ten analyzed candidates in every group</p>`}</figure>`;
  };
  const secs = INS.themesOf(shownIdx).map(t => {
    const sub = t.theme === "Endorsements" ? `<h3 class="theme-sub">Interest Groups</h3>` : "";
    return `<section class="themeblk">${sub}<div class="multiples">${t.terms.map(card).join("")}</div></section>`;
  }).join("");
  fn.add(basisAll());
  fn.add(`Each chart is one term across the four cycles. Select a term for its figures, its ${glossLink("95-interval", "95% Interval")}, its gap and the candidates behind them.`);
  if (drawnAll.some(ti => YEARS.some(yy => INS.PARTIES.some(p => INS.starFor(INS.cell(ti, yy, p)))))) fn.mark("*", starNote());
  return secs + fn.html();
}

function controlsTable(f, none) {
  return `<div class="controls">
    <div class="find"><label class="vh" for="termQ">Term Search</label><input id="termQ" type="search" placeholder="Term Search" autocomplete="off" value="${esc(query)}"></div>
    ${filtersButton()}
  </div>`;
}

function renderTable(host) {
  const f = tableFacts();
  const none = INS.PARTIES.every(p => !INS.group(S.year, p).n);
  const showTabs = !query.trim();
  host.innerHTML = `<h1 class="title">How has the language of congressional campaigns shifted across cycles?</h1>
    ${none ? "" : `<p class="sub">${shareDef(f.counts ? "count" : smallCell(S.year) ? "mixed" : "share")}</p>`}
    <div class="toprow">
      <div id="topicshost">${showTabs ? topicChipsHTML() : ""}</div>
      ${controlsTable(f, none)}
      <div class="chartkey parties" aria-label="Party key"><span><i class="psw d" aria-hidden="true"></i>Democratic</span><span><i class="psw r" aria-hidden="true"></i>Republican</span></div>
    </div>
    <div id="groupline">${groupLine()}</div>
    <div id="tablehost">${themesWithFoot()}</div>`;
}

/* ---------- one word ---------- */
const backLink = href => `<a class="back" href="${href}"><svg width="12" height="10" aria-hidden="true"><path d="M11 5 H2 M5.5 1 L1.5 5 L5.5 9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>All Terms</a>`;
function compareSelect(exclude) {
  const themes = [...new Set(INS.D.terms.map(t => t.theme))];
  return `<div class="addword"><label class="vh" for="addSel">Compare with Another Term</label><select class="addsel" id="addSel"><option value="">Compare with Another Term</option>
    ${themes.map(th => `<optgroup label="${esc(cap(th))}">${INS.D.terms.map((t, i) => (t.theme === th && !exclude.includes(i) ? `<option value="${i}">${esc(INS.dn(i).replace(/[“”]/g, ""))}</option>` : "")).join("")}</optgroup>`).join("")}</select></div>`;
}
const ofN = c => (c && c.n >= TINY ? `<span class="of">${nf(c.n)} Analyzed Candidates</span>` : "");
function cycleTable(ti, has) {
  const cv = caveat(ti);
  const all = YEARS.map(y => {
    const d = INS.cell(ti, y, "D"), r = INS.cell(ti, y, "R");
    return { y, d, r, g: INS.gapOf(d, r, ti, y) };
  });
  const rows = all.filter(x => x.d.n || x.r.n), none = all.filter(x => !x.d.n && !x.r.n).map(x => yl(x.y));
  const showQ = rows.some(x => x.g && x.g.q !== null);
  const showGap = rows.some(x => x.g && !x.g.tiny);
  const g2 = x => {
    if (!x.g) return { gap: `<span class="na" role="img" aria-label="not analyzed">—</span>`, ci: "" };
    if (x.g.tiny) return { gap: `<span class="muted">Too Few Candidates</span>`, ci: "" };
    const t = INS.diff(x.d.k, x.d.n, x.r.k, x.r.n), mag = t.text.replace(/^[+−]/, "");
    const who = t.sign > 0 ? "D" : t.sign < 0 ? "R" : null;
    return { gap: `<span class="gp ${who || ""}${x.g.small ? " small" : ""}${weakGap(x.g) ? " weak" : ""}">${who ? `${who}+${mag}` : "0"}</span>`, ci: `${INS.partyPts(x.g.ci[0])} to ${INS.partyPts(x.g.ci[1])}` };
  };
  const cell = c => `<td class="fig ${c.p}"><span class="sv"><span class="tag ${c.p}" aria-hidden="true">${PNAME[c.p]}</span>${shareBtn(c, { dagger: cv && cv.dagger, range: INS.showRange() })}${chgEl(INS.changeOf(ti, c.y, c.p))}</span>${ofN(c)}</td>`;
  const hasChg = rows.some(x => INS.changeOf(ti, x.y, "D") || INS.changeOf(ti, x.y, "R"));
  const tr = x => `<tr class="${x.y === 2026 ? "y26" : ""}"><th scope="row" class="first"><span class="yr">${yl(x.y)}</span>${x.y === 2026 && !has ? `<span class="of nf">${asOf()}</span>` : ""}</th>
    ${cell(x.d)}${cell(x.r)}
    ${showGap ? (g => `<td class="gapt"><span class="flab">Gap${noteMark(GAPMARK)} </span>${g.gap}</td><td class="cit">${g.ci ? `<span class="flab">Gap Interval </span><span class="nw">${g.ci}</span>` : ""}</td>`)(g2(x)) : ""}${showQ ? `<td class="fig q">${x.g && x.g.q !== null ? `<span class="flab">Adjusted P-Value${noteMark(PMARK)} </span>${INS.fmtQ(x.g.q)}` : ""}</td>` : ""}</tr>`;
  const dash = rows.some(x => !x.d.n || !x.r.n);
  return { showGap, showQ, none, dash, hasChg, html: `<table class="rank cyc"><thead>
    <tr><th class="first" scope="col">Cycle</th><th class="ph D" scope="col">Democratic</th><th class="ph R" scope="col">Republican</th>
      ${showGap ? `<th class="gaph" scope="col">Gap${noteMark(GAPMARK)}</th><th class="gaph ciph" scope="col">Gap Interval</th>` : ""}${showQ ? `<th class="qh" scope="col">Adjusted P-Value${noteMark(PMARK)}</th>` : ""}</tr></thead>
    <tbody>${rows.map(tr).join("")}</tbody></table>` };
}

function renderTerm(host) {
  const ti = S.terms[0], cv = caveat(ti);
  const w = Math.max(280, Math.round($("#view").clientWidth || (innerWidth - 2 * (INS.isPhone() ? 16 : 32))));
  const data = INS.lineData(ti);
  const has = INS.lineHasData(data);
  const any = YEARS.some(y => INS.PARTIES.some(p => INS.group(y, p).n));
  const chartHTML = has ? INS.lineChart(ti, w, { range: INS.showRange(), dagger: cv && cv.dagger, asof: INS.PARTIES.some(p => INS.group(2026, p).n >= INS.TINY) ? asOf() : "" }) : "";
  const key = `<div class="chartkey"><span><i class="band" aria-hidden="true"></i>${glossLink("95-interval", "95% Interval")}</span>${toggle("rangeTg", `${INS.showRange() ? `<i class="band wide" aria-hidden="true"></i>` : ""}Possible Range`, INS.showRange())}</div>`;
  const undrawn = INS.PARTIES.map(p => ({ p, ys: YEARS.filter(y => { const c = INS.cell(ti, y, p); return c.n > 0 && c.n < TINY; }) })).filter(x => x.ys.length);
  const ct = any ? cycleTable(ti, has) : null;
  /* The word's own mark follows its title; a word whose note is set on a value shows it only where that value is drawn. */
  const markShown = markApplies(ti);
  const fn = notebook();
  if (any) fn.add("Select a value to list its candidates.");
  if (markShown) fn.mark(cv.mark, esc(cv.text));
  if (has && INS.showRange()) fn.add(rangeNote());
  if (has && undrawn.length) fn.add("A party and cycle with fewer than ten analyzed candidates is not drawn and has no gap.");
  if (!has && any) fn.add(`Fewer than ten analyzed candidates in every party and cycle, so results are counts and have no gap.${ct.dash ? " A dash means none were analyzed, not zero." : ""}`);
  if (ct && ct.none.length) fn.add(`No analyzed candidates in ${ct.none.length > 1 ? `${ct.none.slice(0, -1).join(", ")} or ${ct.none[ct.none.length - 1]}` : ct.none[0]} with these filters.`);
  if (ct && ct.hasChg) fn.add(changeDef(false));
  if (ct && ct.showGap) fn.mark(GAPMARK, gapNote());
  if (ct && ct.showQ) fn.mark(PMARK, pNote());
  if (YEARS.some(y => INS.PARTIES.some(p => INS.starFor(INS.cell(ti, y, p))))) fn.mark("*", starNote());
  host.innerHTML = `<div class="crumb">${backLink(INS.addressFor({ terms: [], panel: null }))}</div>
    <h1 class="title t1">${esc(INS.dn(ti))}${markShown ? markFor(ti) : ""}</h1>
    <p class="sub">${shareDef(!any ? "share" : !has ? "count" : YEARS.some(smallCell) ? "mixed" : "share")}</p>
    <div class="controls">${filtersButton()}${compareSelect([ti])}</div>
    <div id="groupline">${groupLine()}</div>
    ${!any ? emptyHTML(YEARS) : `${has ? `<div class="chartbox" id="chartbox">${chartHTML}</div>${key}` : ""}
    <div class="cycles">${ct.html}</div>${fn.html()}`}`;
}

/* ---------- several words ---------- */
function renderTerms(host) {
  // one column on a phone, two to 860 px, three above; a chart fills its column less the padding that sets the columns apart
  const cols = innerWidth <= 760 ? 1 : innerWidth <= 860 ? 2 : 3, vw = $("#view").clientWidth || innerWidth - 64;
  const w = cols === 1 ? Math.max(260, vw) : Math.floor(vw / cols - 28);
  const shown = [];
  // the charts of one view share a height: the greatest any of them needs to keep its labels clear
  const mo = ti => ({ mini: true, range: false, ci: false, dagger: (caveat(ti) || {}).dagger });
  const drawnTi = S.terms.filter(ti => INS.lineHasData(INS.lineData(ti)));
  const oneLine = drawnTi.every(ti => INS.lineOneLine(ti, w, mo(ti)));
  const hh = Math.max(0, ...drawnTi.map(ti => INS.lineChartHeight(ti, w, Object.assign(mo(ti), { oneLine }))));
  const cards = S.terms.map(ti => {
    const data = INS.lineData(ti), has = INS.lineHasData(data);
    if (has) shown.push(ti);
    return `<figure class="multiple"><figcaption><a href="${INS.addressFor({ terms: [ti], panel: null })}">${esc(INS.dn(ti))}${has ? markFor(ti) : ""}</a>
      <button type="button" class="rm" data-rm="${ti}" aria-label="Remove ${esc(INS.dn(ti))}"><svg width="10" height="10" aria-hidden="true"><path d="M1 1 L9 9 M9 1 L1 9" stroke="currentColor" stroke-width="1.5"/></svg></button></figcaption>
      ${has ? INS.lineChart(ti, w, Object.assign(mo(ti), { h: hh, oneLine })) : `<p class="nochart">Fewer than ten analyzed candidates in every group</p>`}</figure>`;
  }).join("");
  const fn = notebook();
  S.terms.forEach(ti => { const cv = caveat(ti); if (cv && markApplies(ti) && INS.lineHasData(INS.lineData(ti))) fn.mark(cv.mark, cv.long(esc(INS.dn(ti)))); });
  if (shown.some(ti => YEARS.some(y => INS.PARTIES.some(p => INS.starFor(INS.cell(ti, y, p)))))) fn.mark("*", starNote());
  const tbl = tableBlock(S.terms, fn, true);
  if (shown.length && !tbl.startsWith("<table")) fn.add("Select a value to list its candidates.");
  host.innerHTML = `<div class="crumb">${backLink(INS.addressFor({ terms: [], panel: null }))}</div>
    <h1 class="title">Compared Terms</h1>
    <p class="sub">${shareDef(!shown.length ? "count" : smallCell(S.year) ? "mixed" : "share")}</p>
    <div class="controls">${filtersButton()}${compareSelect(S.terms)}</div>
    <div id="groupline">${groupLine()}</div>

    <div class="multiples">${cards}</div>
    <div class="controls tight"><span class="seglab">Table Cycle</span>${yearSeg()}</div>
    <div id="tablehost">${tbl}</div>${fn.html()}`;
}

/* ---------- the candidate drawer ---------- */
const trimText = (s, n, end) => {
  if (s.length <= n) return s;
  if (end) { const t = s.slice(-n); return "…" + t.slice(t.indexOf(" ") + 1); }
  const t = s.slice(0, n); return t.slice(0, t.lastIndexOf(" ")) + "…";
};
let openGroups = new Set(["use"]);   // the candidate lists the reader has open; "Used it" opens first
const SMALL_WORDS = new Set(["a", "an", "the", "and", "but", "or", "nor", "for", "of", "in", "on", "at", "to", "by", "as", "up", "with", "from", "into"]);
const cap = s => s.split(" ").map((w, i, a) => (i && i < a.length - 1 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
const REASON = { "no website": "No Website Found", "no saved text": "No Saved Text", "under 100 words": "Under 100 Words", excluded: "Not Campaign Content" };
/* The study's reasons for removing a site as not campaign content, each in the three words a row can hold. */
const WHY = { "no candidate name or campaign words": "No Campaign Words", "hosting error or parked domain": "Site Unavailable", "placeholder text": "Placeholder Text", spam: "Spam", "site-builder page titles only": "Page Titles Only" };
let panelCode = "";   // the address code of the drawer on screen, to find its control again when it closes
/* anchor: the name just selected and where it sat on screen, so the list does not move under the reader. */
async function renderPanel(anchor = null) {
  const el = $("#panel"), sc = $("#dscrim");
  if (!S.panel) { el.classList.remove("open"); sc.hidden = true; el.hidden = true; el.innerHTML = ""; document.body.classList.remove("drawer-open"); $("#main").inert = false; $("#skip").inert = false; openGroups = new Set(["use"]); return; }
  const { ti, y, p } = S.panel;
  panelCode = `${INS.tslug(ti)}.${y}.${p}`;
  const g = INS.group(y, p);
  const an = g.an, users = an.filter(c => c.terms.includes(ti)), non = an.filter(c => !c.terms.includes(ti));
  const out = g.all.filter(c => c.status !== "analyzed");
  if (!excerptCache[ti]) {
    try { excerptCache[ti] = await (await fetch(`/data/excerpts/${ti}.json`)).json(); } catch (e) { excerptCache[ti] = {}; }
  }
  if (!S.panel || S.panel.ti !== ti || S.panel.y !== y || S.panel.p !== p) return;
  const ex = excerptCache[ti], c = INS.cell(ti, y, p);
  const seat = x => `${x.state}-${x.office === "Senate" ? "Senate" : x.district === "00" ? "AL" : String(+x.district)}`;
  /* Each part of a candidate's line is kept whole, a seat code such as NC-12 above all; the line may break between parts. */
  const meta = x => [seat(x), x.inc ? "Incumbent" : "Challenger", x.won === 1 ? "Won" : x.won === 0 ? "Lost" : null].filter(Boolean).map(t => `<span class="nw">${esc(t)}</span>`).join(" · ");
  const sel = S.cand && users.find(u => u.id === S.cand);
  /* The excerpt is a window onto the page's text, so each end that is not the page's own edge reads as cut. */
  const excerpt = x => {
    const e = ex[x.id];
    if (!e) return "";
    const before = trimText(e[0], 100, true), after = trimText(e[2], 100, false);
    const lead = before.startsWith("…") ? before : "…" + before, tail = after.endsWith("…") ? after : after + "…";
    return `<div class="exc" id="exc"><p class="ex">${esc(lead)}<mark>${esc(e[1])}</mark>${esc(tail)}</p>
      <p class="src">Saved ${e[3] ? INS.fmtDate(e[3], true) + " " : ""}from ${esc(x.site)}${e[4] === "archived" ? ` by the ${glossLink("wayback-machine", "Wayback Machine")}` : ""}</p></div>`;
  };
  /* A name that opens a sentence has a chevron; the names in the other lists are plain text. */
  /* The names that open a passage are one stop in the Tab order and are walked with the arrow keys, so a list of
     124 names does not stand between the reader and the lists below it. */
  const li = (x, kind, stop) => {
    const on = S.cand === x.id;
    const head = `<span class="nm">${esc(INS.cname(x.name))}</span><span class="meta">${meta(x)}${kind === "out" ? ` · ${esc(x.status === "excluded" ? WHY[x.why] || cap(x.why || REASON.excluded) : REASON[x.status] || cap(x.status))}` : ""}</span>`;
    return kind === "use" && ex[x.id]
      ? `<li><button type="button" class="crow can${on ? " sel" : ""}" data-cand="${x.id}" aria-expanded="${on}" tabindex="${stop ? 0 : -1}">${head}<span class="chev" aria-hidden="true"></span></button>${on ? excerpt(x) : ""}</li>`
      : `<li><div class="crow plain${kind === "out" ? " out" : ""}">${head}</div></li>`;
  };
  const section = (key, label, list, kind) => {
    if (!list.length) return "";
    const sorted = list.slice().sort(INS.byName);
    const opens = sorted.filter(x => kind === "use" && ex[x.id]);
    const stop = (opens.find(x => x.id === S.cand) || opens[0] || {}).id;
    return `<details class="cgrp" data-k="${key}"${openGroups.has(key) ? " open" : ""}><summary><span>${label}</span>${key === "use" ? "" : `<span class="n">${nf(list.length)}</span>`}</summary>
      ${key === "out" ? `<p class="gnote">Reasons for Not Analyzing</p>` : ""}<ul>${sorted.map(x => li(x, kind, x.id === stop)).join("")}</ul></details>`;
  };
  const where = INS.GROUPS.flatMap(gr => [...S.f[gr.key]].map(v => (gr.key === "state" ? STATES[v] : gr.byV[v].label)));
  const miss = c.K - c.n;
  /* Marks (dagger, asterisk) were removed; the pre-registered patterns do the data cleaning in the regex itself. */
  const star = "";
  const dag = false;
  const facts = c.n >= TINY ? `<p class="facts">${glossLink("95-interval", "95% Interval")} ${Math.round(c.ci[0] * 100)} to ${Math.round(c.ci[1] * 100)}%</p>` : "";
  const ch = INS.changeOf(ti, y, p);
  const chgTxt = ch ? `<p class="facts">Change from ${yl(ch.from)} ${INS.diff(ch.a.k, ch.a.n, ch.b.k, ch.b.n).text}%</p>` : "";
  const rangeTxt = c.range && c.n >= TINY && miss > 0 ? `<p class="facts">${glossLink("possible-range", "Possible Range")} ${c.rangePct[0]} to ${c.rangePct[1]}%</p>` : "";
  const noneTxt = c.n ? "" : `<p class="facts">No candidates were analyzed in this group${where.length ? " with these filters" : ""}.</p>`;
  /* The drawer's footnotes are pinned to its foot, so they are in view however far the lists run. */
  const foot = [dag ? [cv.mark, esc(cv.text)] : null, star ? ["*", starNote()] : null].filter(Boolean);
  el.innerHTML = `<div class="dhead"><div><p class="dtitle" id="panelTitle" tabindex="-1">${esc(INS.dn(ti))}</p>
      <div class="sub"><span class="nw">${yl(y)} ${pn(p)} Candidates</span></div>${y === 2026 ? `<div class="sub">${asOf()}</div>` : ""}${where.length ? `<div class="sub">${where.map(t => esc(t)).map((t, i, a) => `<span class="nw">${t}${i < a.length - 1 ? " ·" : ""}</span>`).join(" ")}</div>` : ""}</div>
      <button type="button" class="btn" id="panelClose">Close</button></div>
    <div class="dsum ${p}">${c.n ? `<span class="big">${c.n < TINY ? `${c.k} of ${c.n}` : INS.pctOf(c.k, c.n) + star}${dag ? "†" : ""}</span><span class="of">${c.n < TINY ? "" : `${nf(c.k)} of ${nf(c.n)} `}Analyzed Candidates Using the Term</span>` : ""}${facts}${chgTxt}${rangeTxt}${noneTxt}</div>
    <div class="clist">
      ${section("use", "Using the Term", users, "use")}
      ${section("no", "Not Using the Term", non, "no")}${section("out", "Not Analyzed", out, "out")}
    </div><div class="dfoot">${foot.map(([m, h]) => `<p><span class="fk">${m}</span>${h}</p>`).join("")}${an.length || out.length ? `<p>${glossLink("seat-code", "Seat Code")} and ${glossLink("challenger", "Challenger")} Definitions</p>` : ""}</div>`;
  el.hidden = false; sc.hidden = false; el.classList.add("open");
  if (!document.body.classList.contains("drawer-open")) {
    document.documentElement.style.setProperty("--sbw", (innerWidth - document.documentElement.clientWidth) + "px");
    document.body.classList.add("drawer-open");
  }
  $("#main").inert = true; $("#skip").inert = true;
  if (anchor) { const b = $(`[data-cand="${anchor.id}"]`, el); if (b) el.scrollTop += b.getBoundingClientRect().top - anchor.top; }
  const x = $("#exc", el);
  if (x) {
    // the passage comes into view clear of the pinned head above it and the pinned foot below it
    const top = $(".dhead", el), foot = $(".dfoot", el);
    x.style.scrollMarginTop = (top ? top.offsetHeight : 0) + 12 + "px";
    x.style.scrollMarginBottom = (foot ? foot.offsetHeight : 0) + 12 + "px";
    x.scrollIntoView({ block: "nearest" });
  }
}
/* Closing the drawer: an entry it pushed is stepped back over, so Back never has a dead step and never leaves the
   view; a drawer opened by an address has no entry of its own and is replaced. */
function closePanel() {
  if (history.state && history.state.drawer) { history.back(); return; }
  S.panel = null; S.cand = null;
  INS.commit();
  afterDrawer();
}
/* The page is where it was when the drawer opened, and the control that opened it takes focus without moving the
   page. A drawer opened by an address has no such control in hand: the same share is found again, and failing
   that the view's title takes focus, so focus never falls to the page. */
function afterDrawer() {
  const code = opener ? opener.code : panelCode, kind = opener ? opener.kind : "";
  opener = null;
  const at = scrollAt; scrollAt = null;
  let b = (kind && $(`${kind}[data-panel="${code}"]`)) || $(`.share[data-panel="${code}"]`) || $(`[data-panel="${code}"]`);
  if (!b) { b = $("#view h1"); if (b) b.tabIndex = -1; }
  if (b) b.focus({ preventScroll: true });
  if (at !== null) window.scrollTo(0, at);
}

/* ---------- tooltip ---------- */
function setupTip() {
  const tip = $("#tip");
  const show = el => {
    const t = el.dataset.tip; if (!t) return;
    tip.textContent = t; tip.hidden = false;
    const r = el.getBoundingClientRect();
    let x = r.left, y = r.bottom + 6;
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    if (x + tw > innerWidth - 8) x = Math.max(8, innerWidth - 8 - tw);
    if (y + th > innerHeight - 8) y = Math.max(8, r.top - th - 6);
    tip.style.left = x + "px"; tip.style.top = y + "px";
  };
  const hide = () => { tip.hidden = true; };
  document.addEventListener("pointerover", e => { const el = e.target.closest("[data-tip]"); if (el) show(el); });
  document.addEventListener("pointerout", e => { if (e.target.closest("[data-tip]")) hide(); });
  document.addEventListener("focusin", e => { const el = e.target.closest("[data-tip]"); if (el) show(el); });
  document.addEventListener("click", e => {
    const el = e.target.closest("[data-tip]");
    if (el && !el.dataset.panel) show(el); else if (!el) hide();
  });
  document.addEventListener("focusout", hide);
  document.addEventListener("scroll", hide, { passive: true });
  window.addEventListener("scroll", () => { if (filtersOpen) positionFilters(); }, { passive: true });
}

/* ---------- wiring ---------- */
function openPanel(code, from) {
  const m = /^([a-z0-9-]+)\.(\d{4})\.([DR])$/.exec(code);
  if (!m) return;
  opener = { code, kind: from && from.matches && from.matches("g.pt") ? "g.pt" : ".share" };
  const fresh = !S.panel;
  if (fresh) scrollAt = window.scrollY;
  S.panel = { ti: INS.TERM_BY_SLUG[m[1]], y: +m[2], p: m[3] }; S.cand = null;
  openGroups = new Set(["use"]);
  /* The drawer is a step in the history: Back closes it and stays on the view. The step carries where the page was,
     so coming back to it from a definition puts the page there too. */
  if (fresh) { history.pushState({ drawer: true, at: window.scrollY }, "", INS.addressFor()); INS.render({ focusPanel: true }); }
  else INS.commit({ focusPanel: true });
}
/* An open drawer or filters sheet keeps Tab inside itself. */
function trapTab(e) {
  const box = S.panel ? $("#panel") : filtersOpen ? $("#filters") : null;
  if (!box || box.hidden) return;
  const f = $$('a[href], button:not([disabled]), select, input:not([disabled]), summary', box).filter(el => {
    const d = el.closest("details");   // what a closed list holds, apart from its summary, is not reachable
    return el.tabIndex >= 0 && el.offsetParent !== null && (!d || d.open || el.parentElement === d);
  });
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1], at = document.activeElement;
  /* Focus on the title or the box itself sits before the first control: Shift+Tab from there wraps like it does from the first. */
  if (!box.contains(at) || (e.shiftKey && f.indexOf(at) <= 0)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); }
  else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
}
function setup() {
  function closeCatMenu() {
    const m = $("#catMenu"), b = $("#catBtn");
    if (m) m.hidden = true;
    if (b) b.setAttribute("aria-expanded", "false");
  }
  document.addEventListener("click", e => {
    const btn = e.target.closest("#catBtn");
    if (btn) {
      e.preventDefault();
      const m = $("#catMenu");
      if (!m) return;
      const open = !m.hidden;
      m.hidden = open;
      btn.setAttribute("aria-expanded", String(!open));
      if (!open) {
        const cur = m.querySelector(".cat-opt.on") || m.querySelector(".cat-opt");
        if (cur) cur.focus();
      }
      return;
    }
    const opt = e.target.closest(".cat-opt");
    if (opt) {
      e.preventDefault();
      const slug = opt.dataset.cat;
      S.topics = slug ? new Set([slug]) : new Set();
      S.panel = null; S.cand = null;
      closeCatMenu();
      INS.commit({ push: true, focus: "#catBtn" });
      return;
    }
    if (!e.target.closest(".cat-picker")) closeCatMenu();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && (e.target.closest(".cat-picker") || !$("#catMenu")?.hidden)) {
      closeCatMenu();
      const b = $("#catBtn"); if (b) b.focus();
      return;
    }
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && e.target.classList.contains("cat-opt")) {
      e.preventDefault();
      const opts = [...$("#catMenu").querySelectorAll(".cat-opt")];
      const i = opts.indexOf(e.target);
      const j = (i + (e.key === "ArrowDown" ? 1 : opts.length - 1)) % opts.length;
      opts[j].focus();
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("cat-opt")) {
      e.preventDefault();
      e.target.click();
      return;
    }
  }, true);
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-year],[data-sort],[data-panel],[data-cand],[data-unfilter],[data-rm],#filtersBtn,#fDone,#fClear,#panelClose,#fscrim,#dscrim");
    if (!t) { return; }
    if (t.dataset.year) { S.year = +t.dataset.year; S.panel = null; S.cand = null; INS.commit({ push: true, focus: `[data-year="${S.year}"]` }); }
    else if (t.dataset.sort) {
      const k = t.dataset.sort;
      if (S.sort === k) S.dir = S.dir === "desc" ? "asc" : "desc"; else { S.sort = k; S.dir = k === "name" ? "asc" : "desc"; }
      INS.commit({ push: true, focus: `[data-sort="${k}"]` });
    }
    else if (t.dataset.panel) { e.preventDefault(); openPanel(t.dataset.panel, t); }
    else if (t.dataset.cand) {
      const id = t.dataset.cand, top = t.getBoundingClientRect().top;
      S.cand = S.cand === id ? null : id; history.replaceState(history.state, "", INS.addressFor());
      renderPanel({ id, top }).then(() => { const b = $(`#panel [data-cand="${id}"]`); if (b) { b.tabIndex = 0; b.focus({ preventScroll: true }); } });
    }
    else if (t.dataset.unfilter) { const [k, v] = t.dataset.unfilter.split(":"); S.f[k].delete(v); S.panel = null; S.cand = null; INS.commit({ push: true }); }
    else if (t.dataset.rm) { const terms = S.terms.filter(i => i !== +t.dataset.rm); INS.go(INS.addressFor({ terms, panel: null })); }
    else if (t.id === "filtersBtn") { filtersOpen ? closeFilters() : openFilters(t); }
    else if (t.id === "fDone" || t.id === "fscrim") closeFilters();
    else if (t.id === "fClear") { INS.GROUPS.forEach(g => S.f[g.key].clear()); S.panel = null; S.cand = null; INS.commit({ push: true }); }
    else if (t.id === "panelClose" || t.id === "dscrim") closePanel();
  });
  document.addEventListener("keydown", e => {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("g.pt")) { e.preventDefault(); openPanel(e.target.dataset.panel, e.target); return; }
    if (e.key === "Tab") { trapTab(e); return; }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) && e.target.matches("#panel button.crow.can")) {
      const names = $$("button.crow.can", e.target.closest("ul")), i = names.indexOf(e.target);
      const j = e.key === "Home" ? 0 : e.key === "End" ? names.length - 1 : Math.max(0, Math.min(names.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
      e.preventDefault();
      names.forEach(b => { b.tabIndex = -1; });
      names[j].tabIndex = 0; names[j].focus();
      return;
    }
    if (e.key !== "Escape") return;
    /* A tooltip that stays under focus is dismissed first; what is open behind it closes on the next press. */
    const tip = $("#tip"), tipShown = !tip.hidden;
    tip.hidden = true;
    if (tipShown && !S.panel && !filtersOpen) return;
    if (filtersOpen) closeFilters();
    else if (S.panel) closePanel();
  });
  $("#panel").addEventListener("toggle", e => {
    const d = e.target;
    if (d.matches && d.matches("details.cgrp")) { if (d.open) openGroups.add(d.dataset.k); else openGroups.delete(d.dataset.k); }
  }, true);
  document.addEventListener("change", e => {
    const t = e.target;
    if (t.matches("#filters input[type=checkbox]")) {
      const set = S.f[t.dataset.g]; t.checked ? set.add(t.value) : set.delete(t.value);
      S.panel = null; S.cand = null; INS.commit({ push: true, keepFilters: true });
      const again = $(`#filters input[data-g="${t.dataset.g}"][value="${t.value}"]`); if (again) again.focus();
    } else if (t.id === "stateSel") {
      if (t.value) { S.f.state.add(t.value); S.panel = null; S.cand = null; INS.commit({ push: true, keepFilters: true }); const s = $("#stateSel"); if (s) s.focus(); }
    } else if (t.id === "rangeTg") { S.range = t.checked; INS.commit({ push: true, focus: "#rangeTg" }); }
    else if (t.id === "sortSel") { S.sort = t.value === "gapr" ? "gap" : t.value; S.dir = t.value === "name" || t.value === "gapr" ? "asc" : "desc"; INS.commit({ push: true, focus: "#sortSel" }); }
    else if (t.classList.contains("addsel")) {
      if (t.value) INS.go(INS.addressFor({ terms: S.terms.concat([+t.value]), panel: null }));
    }
  });
  let searchT = null;
  document.addEventListener("input", e => {
    if (e.target.id !== "termQ") return;
    const v = e.target.value;
    clearTimeout(searchT);
    searchT = setTimeout(() => {
      query = v;
      const host = $("#topicshost");
      if (host) host.innerHTML = query.trim() ? "" : topicChipsHTML();
      $("#tablehost").innerHTML = themesWithFoot();
    }, 150);
  });
}

/* ---------- the explorer ---------- */
INS.renderExplorer = (o = {}) => {
  INS.buildCells();
  const host = $("#view");
  renderTable(host);
  renderFilters();
  if (filtersOpen) positionFilters();
  renderPanel().then(() => {
    if (o.focusPanel) { const h = $("#panelTitle"); if (h) h.focus(); }
  });
  if (o.focus) { const el = $(o.focus); if (el) el.focus(); }
};

/* ---------- the shell ---------- */
function titleFocus() { const h = $("#view h1"); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }

INS.render = (o = {}) => {
  lastKey = INS.addressFor({ panel: null });
  document.title = (S.terms.length === 1 ? INS.dn(S.terms[0]).replace(/[“”]/g, "") + " · " : "") + "Campaign Website Language";
  INS.renderExplorer(o);
};

function wire() {
  $("#skip").addEventListener("click", e => {
    e.preventDefault();
    const h = $("#view h1"); if (h) { h.tabIndex = -1; h.focus(); }
  });
  window.addEventListener("hashchange", () => {
    const before = lastKey, had = !!S.panel;
    const a = document.activeElement, again = a && a.id ? "#" + a.id : a && a.dataset && a.dataset.year ? `[data-year="${a.dataset.year}"]` : "";
    INS.readAddress();
    const now = INS.addressFor({ panel: null });
    const sameView = now === before;                                  // only the drawer changed: the page stays where it is
    const samePath = now.split("?")[0] === before.split("?")[0];      // the same words, with another cycle, sort, grouping or filters
    INS.render({ focusPanel: !!S.panel });
    const st = history.state;
    if (S.panel && !sameView && st && typeof st.at === "number") { scrollAt = st.at; window.scrollTo(0, st.at); }   // back to a drawer: the page as it was
    else if (!samePath) window.scrollTo(0, 0);
    if (had && !S.panel) { if (sameView) afterDrawer(); else if (!samePath) { opener = null; scrollAt = null; } }   // Back closed the drawer
    // a new view, reached by a link, starts at its title, so focus is never left on the page behind
    if (!samePath && !S.panel) titleFocus();
    else if (samePath && !sameView && !S.panel && again) { const el = $(again); if (el) el.focus({ preventScroll: true }); }
  });
  let rt, lastW = innerWidth;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { if (innerWidth !== lastW) { lastW = innerWidth; INS.render(); } }, 150); });
}

(async () => {
  await INS.init();
  setup(); setupTip(); wire();
  INS.readAddress();
  /* The charts measure each label in the page's own faces, so every face is loaded before the first drawing: a first load
     lays a view out as a later one does. */
  await Promise.all(["400", "500", "600", "700"].map(w => document.fonts.load(`${w} 16px "IBM Plex Sans"`)));
  await document.fonts.ready;
  INS.render({ focusPanel: !!S.panel });
  document.documentElement.dataset.ready = "1";
})();
})();
