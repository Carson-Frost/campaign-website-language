/* Instrument: the Method, Coverage, Related work, Downloads and Glossary tabs. Every count is computed from /data/site.json. */
(() => {
"use strict";
const { S, $, $$, esc, nf, PNAME, YEARS } = INS;
const V = INS.views;

/* A whole percentage from two counts, rounded once, half up. */
const pct = (a, b) => (b ? INS.pctN(a, b) + "%" : "—");
const when = id => { requestAnimationFrame(() => { const el = id && document.getElementById("s-" + id); if (el) el.scrollIntoView({ block: "start" }); }); };
const gl = (id, text) => `<a class="gl-link" href="#/glossary/${id}">${text}</a>`;
/* A citation: author and year, linked to its entry in the Reference List on the Related Work tab. */
const R = (id, text) => `<a class="gl-link" href="#/related-work/ref-${id}">${text}</a>`;
/* A bracketed citation of one or more works, the brackets inside the links so a line never ends on a lone bracket. */
const C = (...pairs) => pairs.map(([id, t], i) => R(id, (i === 0 ? "(" : "") + t + (i === pairs.length - 1 ? ")" : ""))).join("; ");

/* ---------- Method ---------- */
/* How far shares and gaps move when only copies from the last 120 or 60 days count, for 2020 to 2024, from the tables the page loads. */
function windowTable() {
  const rowsAll = INS.D.windows.filter(r => r.office === "All" && r.year <= 2024);
  const W = { all: {}, common: {} };
  rowsAll.forEach(r => { W[r.sample][`${r.window}|${r.term}|${r.year}|${r.party_group}`] = r.share; });
  const cells = [...new Set(rowsAll.map(r => `${r.term}|${r.year}`))];
  const cw = INS.D.coverage_windows.filter(r => r.year <= 2024);
  const analyzed = w => cw.filter(r => String(r.window) === String(w)).reduce((a, r) => a + r.analyzed, 0);
  const stat = (w, sample) => {
    const S2 = W[sample], sd = [], gd = [], flips = [];
    let top = { v: -1 };
    cells.forEach(k => {
      const [t, y] = k.split("|");
      const g = win => (S2[`${win}|${t}|${y}|Democratic`] - S2[`${win}|${t}|${y}|Republican`]) * 100;
      ["Democratic", "Republican"].forEach(p => {
        const v = Math.abs(S2[`${w}|${t}|${y}|${p}`] - S2[`year|${t}|${y}|${p}`]) * 100;
        sd.push(v);
        if (v > top.v) top = { v, y: +y, p };
      });
      gd.push(Math.abs(g(w) - g("year")));
      if (g(w) * g("year") < 0) flips.push(Math.abs(g("year")));
    });
    const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
    return { avg: avg(sd), max: Math.max(...sd), gavg: avg(gd), gmax: Math.max(...gd), flips: flips.length, flipMax: flips.length ? Math.max(...flips) : 0, top };
  };
  const rows = [["year", "Election Year"], ["120", "Last 120 Days"], ["60", "Last 60 Days"]];
  const one = x => x.toFixed(1);
  const tr = ([w, name]) => {
    const s = w === "year" ? null : stat(w, "all");
    return `<tr><th scope="row"><span class="wn">${name}</span><span class="wc">${nf(analyzed(w))}</span></th>${s
      ? `<td class="r">${one(s.avg)}</td><td class="r pre">${one(s.max)}</td><td class="r sep">${one(s.gavg)}</td><td class="r">${one(s.gmax)}</td>`
      : `<td class="base" colspan="4">Reference</td>`}</tr>`;
  };
  const s120 = stat("120", "all"), s60 = stat("60", "all"), c120 = stat("120", "common"), c60 = stat("60", "common");
  const n = cells.length;
  const flip = s => (s.flips ? `${s.flips}` : "none");
  const flipMax = Math.max(s120.flipMax, s60.flipMax);
  /* The 60-day extreme is one party in one cycle; say how many sites the shorter window sets aside there. */
  const dropped = (() => {
    const q = x => cw.find(r => String(r.window) === x && r.year === s60.top.y && r.party_group === s60.top.p);
    const a = q("year"), b = q("60");
    return a && b ? { out: a.analyzed - b.analyzed, of: a.analyzed } : null;
  })();
  const common = INS.D.coverage_windows.filter(r => r.year <= 2024 && String(r.window) === "year").reduce((a, r) => a + r.analyzed_in_all_windows, 0);
  return `<section class="block" id="s-window"><h2>Change in Results from Recent Copies Only</h2>
    <p class="lede tight">Results use each page’s newest copy saved from January 1 through election day, the Election Year row. The other rows keep only copies saved in the last 120 or 60 days, which sets aside sites whose newest copy is older. Each figure is the size of a move from the Election Year row, up or down, in ${gl("percentage-points", "percentage points")}: the average and the largest across the ${nf(n * 2)} ${gl("share", "shares")} and ${nf(n)} ${gl("gap", "gaps")} of the 57 terms in 2020, 2022 and 2024.</p>
    <table class="plain win"><thead><tr><th rowspan="2" scope="col">Copies Saved<span class="sub unit">Analyzed Candidate-Years</span></th><th colspan="2" class="r grp" scope="colgroup">Change in Share<span class="sub unit">In Points</span></th><th colspan="2" class="r grp sep" scope="colgroup">Change in Gap<span class="sub unit">In Points</span></th></tr>
      <tr><th class="r" scope="col">Average</th><th class="r pre" scope="col">Largest</th><th class="r sep" scope="col">Average</th><th class="r" scope="col">Largest</th></tr></thead>
      <tbody>${rows.map(tr).join("")}</tbody></table>
    <p class="foot">Of the ${n} combinations of a term and a year, the party with the higher share switches in ${flip(s120)} under 120 days and ${flip(s60)} under 60 days${flipMax ? `, each where the Election Year gap was ${one(flipMax)} points or less` : ""}. The largest 60-day change in a share is for ${s60.top.p} candidates in ${s60.top.y}${dropped ? `, where counting only the last 60 days sets aside ${nf(dropped.out)} of ${nf(dropped.of)} analyzed sites` : ""}.</p>
    <p class="foot">On the ${nf(common)} candidate-years analyzed under all three, so that only the text changes, the average changes in a share are ${one(c120.avg)} for 120 days and ${one(c60.avg)} for 60 days, and the largest are ${one(c120.max)} and ${one(c60.max)}. All the results are in <a class="gl-link" href="/files/term_shares_windows.csv" download>term_shares_windows.csv</a>.</p></section>`;
}

/* Analyzed candidates against the rest, by cycle and party: in how many groups the analyzed were more often incumbents or winners,
   counting a group only when the 95% Newcombe interval of the difference (Newcombe 1998) excludes zero. */
function selectionVerdict() {
  const sel = INS.D.selection;
  const find = (y, party, grp) => sel.find(x => x.year === y && x.party_group === party && x.group === grp);
  const pairs = wr => YEARS.flatMap(y => INS.PARTIES.map(p => ({ a: find(y, PNAME[p], "analyzed"), n: find(y, PNAME[p], "not analyzed") }))).filter(x => x.a && x.n && (!wr || (x.a.with_results && x.n.with_results)));
  const inc = pairs(false), won = pairs(true);
  /* The counts behind each share come with the table (incumbents of candidates, winners of those with a result). */
  const more = (xs, k, n) => xs.filter(x => newcombe(x.a[k], x.a[n], x.n[k], x.n[n])[0] > 0).length;
  /* A group is a party in a cycle. `higher` counts those where the analyzed share is the larger, clear or not; `more` those
     where the difference is clear, its interval entirely above zero. */
  const higher = (xs, k, n) => xs.filter(x => x.a[k] * x.n[n] > x.n[k] * x.a[n]).length;
  const pick = (h, t) => (h === t ? `all ${t}` : `${h} of ${t}`);
  const v = { find, inc: inc.length, incMore: more(inc, "incumbents", "candidates"), won: won.length, wonMore: more(won, "winners", "with_results"),
    incHigher: higher(inc, "incumbents", "candidates"), wonHigher: higher(won, "winners", "with_results") };
  /* What the table shows and how much of it is clear, said once for the Coverage tab and for Limitations. */
  v.text = `Analyzed candidates include a higher share of incumbents than candidates not analyzed in ${pick(v.incHigher, v.inc)} combinations of cycle and party and a higher share of winners in ${pick(v.wonHigher, v.won)}. The difference is clear, with a ${gl("interval", "95% Interval")} that excludes zero, in ${v.incMore} of ${v.inc} for incumbents and ${v.wonMore} of ${v.won} for winners.`;
  return v;
}

/* What the study could not do, one entry per limitation in METHODS.md and README.md. Every count is computed from the tables the page loads. */
function limitations() {
  const c = INS.D.candidates, total = c.length;
  const cnt = f => c.filter(f).length;
  const withSite = total - cnt(x => x.status === "no website");
  const noText = cnt(x => x.status === "no saved text");
  const fromForm1 = cnt(x => x.src === "fec_form1"), fromBp = cnt(x => x.src === "ballotpedia_link" || x.src === "ballotpedia_quote");
  const v = selectionVerdict();
  const cc = INS.D.crosscheck.filter(r => r.fec !== null);
  const within = Math.max(...cc.map(r => Math.abs(r.ballotpedia - r.fec)));
  const shares = {};
  INS.D.shares.forEach(r => { shares[`${r.term}|${r.year}|${r.office}|${r.party_group}`] = r.share; });
  let shift = 0;
  INS.D.min_words.forEach(r => { const b = shares[`${r.term}|${r.year}|${r.office}|${r.party_group}`]; if (r.office === "All" && b !== undefined) shift = Math.max(shift, Math.abs(r.share - b) * 100); });
  const perfect = INS.D.precision.filter(p => p.coded === p.intended);
  const low20 = perfect.length ? Math.round(Math.min(...perfect.map(p => p.wilson_low)) * 100) : null;
  const checked = new Set(INS.D.precision.map(p => p.term)).size;
  const codedN = [...new Set(INS.D.precision.map(p => p.coded))].length === 1 ? INS.D.precision[0].coded : "a sample of";
  const repLen = INS.D.site_length.filter(x => x.party_group === "Republican");
  const med = y => (repLen.find(x => x.year === y) || {}).words_median;
  const earlier = repLen.filter(x => x.year < 2026).map(x => x.words_median);
  const noSeat = y => cnt(x => x.year === y && x.seat === null);
  const date = INS.fmtDate(INS.through2026);
  const L = (label, text, id) => ({ label, text, id });
  return [
    L("Independents and Third Parties", "The study compares Democratic and Republican candidates only, so independent and third-party candidates, who are on the ballot, are not analyzed and the study says nothing about them."),
    L("Fusion Ticket Candidates", "A candidate who appears on several parties’ lines, as in New York and Connecticut, is counted once and grouped with the major party named in the label."),
    L("Party Labels Not Recognized", `${INS.D.candidate_list.label} major-party candidate-years whose label abbreviates the party to a single letter, such as “D / Working Families Party”, are grouped as third party and left out, a known error that has not been corrected.`, "party-labels"),
    L("Repeated Candidate Numbers", `In ${INS.D.candidate_list.repeated} cases the candidate list gave a major-party candidate the same FEC candidate number as another candidate in the same year, and only the first was kept, so those ${INS.D.candidate_list.repeated} candidate-years are left out and a candidate who was kept may carry the other’s website. A known error that has not been corrected.`, "repeated-numbers"),
    L("Minnesota Democratic-Farmer-Labor Candidates", "Minnesota’s Democratic-Farmer-Labor Party is that state’s Democratic Party, and its candidates are counted as Democratic."),
    L("Louisiana’s November Election", "Louisiana lists every party’s candidates on one November ballot, and the study treats that election as the general election, so a December runoff adds no candidate and no text."),
    L("Unopposed Candidates", "Florida and Louisiana do not print an unopposed race on the ballot, so those candidates are left out. That removed one candidate on Ballotpedia’s lists, in Louisiana in 2022, and 2026 has no FEC list to check against."),
    L("Candidate List", `Ballotpedia has been used in published research but has not been validated, so its list is checked against the FEC’s: for 2020 to 2024 the two agree within ${within} major-party candidates a year in each party, and write-in candidates are not included.`),
    L("Ballotpedia Quotations", "Ballotpedia’s profile pages quote some candidates’ campaign websites, and that quoted text was collected but is not analyzed."),
    L("Website Addresses", `Websites for ${nf(fromForm1)} candidate-years come from FEC Form 1 and ${nf(fromBp)} from Ballotpedia, a fallback no published standard covers, and ${nf(total - withSite)} candidate-years have no website found.`),
    L("Archive Coverage", `Common Crawl saves a sample of each site and favors well-linked domains ${C(["baack-2024", "Baack 2024"])}, so ${nf(noText)} of the ${nf(withSite)} candidate-years with a known website, ${pct(noText, withSite)}, have no saved text and are not analyzed.`),
    L("Selection Toward Incumbents and Winners", `${v.text.replace(/\.$/, "")} (<a class="gl-link" href="#/coverage">Coverage</a>). The comparison covers only differences the study can observe.`),
    L("Archive Choice", `No earlier study of candidate websites was found that used Common Crawl, the main archive here, and one analyzed 2024 Democratic Senate site has ${gl("wayback-machine", "Wayback Machine")} copies only.`),
    L("Collection Dates", `No published standard sets the dates, and a page’s newest copy can be weeks or months older than election day, so results for the last 120 and last 60 days are compared in <a class="gl-link" href="#/method/window">Change in Results from Recent Copies Only</a>.`),
    L("Pages Read per Site", "Each site’s homepage and up to three linked pages, chosen by their web address, are read, so text on other pages is not counted."),
    L("Text Cleaning Rules", "The rules that drop page code, spam, placeholder text, Spanish paragraphs and repeated paragraphs use this study’s own thresholds, and a check of the Spanish rule against a language-identification program found 5 English paragraphs dropped by mistake."),
    L("Not Campaign Content", `Sites flagged as not campaign content were each read by a person before ${nf(INS.D.excluded.length)} candidate-years were removed, but the flagging rules are this study’s own.`),
    L("Minimum Length", `No standard sets a minimum for political text, so the study follows LIWC-22’s 100 words ${C(["boyd-2022", "Boyd et al. 2022"])}, and at 50 or 200 words no share for either party moves by more than ${shift.toFixed(1)} points.`),
    L("Term List", `The researcher chose the 57 terms before results were examined, did not register the list in advance and never checked it for missed terms ${C(["king-2017", "King, Lam and Roberts 2017"])}, so a candidate who writes an idea in other words is not counted.`),
    L("Match Check Sample", `One person coded ${codedN} matches for each of ${checked} terms, so ${57 - checked} of the 57 terms have no match check. The coded matches come from copies saved in the last 60 days before election day, the text the study used first, not the election-year text the results use. Even 20 correct of 20 has an interval of ${low20} to 100%, so the 90% cutoff cannot be met with confidence.`),
    L("Presence and Site Length", `A term counts once however often it appears and longer sites have more chances to use it, so the median Republican site of ${INS.words(med(2026))} words in 2026, against ${INS.words(Math.min(...earlier))} to ${INS.words(Math.max(...earlier))} in 2020 to 2024, may explain part of any 2026 Republican decline.`),
    L("Intervals and Tests", "The 95% Intervals and tests describe chance variation among the candidates analyzed only, and they treat every candidate-year as unrelated to the others, including those of a candidate who ran in several years."),
    L("Exploratory Results", `Which results deserve attention was decided after all 57 terms were examined, so every result is a ${gl("exploratory", "lead to check")}, not a test planned in advance.`),
    L("Seat Measure", `A ${gl("close-seat", "close or safe seat")} comes from the district’s presidential vote, which the study could not find for ${nf(noSeat(2020))} candidates in 2020, because its source has no 2020 result on 2020 district lines, and for ${nf(noSeat(2024))} in 2024, in nine states that redrew their districts for 2026.`),
    L("Phrase Rankings", `The lists in distinctive_terms.csv rank each party’s top 40 words and phrases by ${gl("welch-t", "Welch’s T Statistic")} with no correction for the many words and phrases ranked, put two- and three-word phrases on one list and do not merge overlapping phrases.`),
    L("2026 Results to Date", `2026 runs through ${date} from the newest saved copy and will change until election day, November 3.`),
  ];
}

V.method = host => {
  const c = INS.D.candidates;
  const total = c.length;
  const n = k => c.filter(x => k.includes(x.status)).length;
  const analyzed = n(["analyzed"]);
  const withSite = total - n(["no website"]);
  const withText = withSite - n(["no saved text"]);
  const long = withText - n(["under 100 words"]);
  const excl = INS.D.excluded;
  const reasons = {};
  excl.forEach(x => { reasons[x.reason] = (reasons[x.reason] || 0) + 1; });
  const prec = INS.D.precision.slice().sort((a, b) => a.term.localeCompare(b.term));
  const codedSet = [...new Set(prec.map(p => p.coded))];
  const codedTxt = codedSet.length === 1 ? `${codedSet[0]} matches` : "a sample of matches";
  const fr = prec.find(p => p.term === "freedom");
  const freedom = fr ? `; “Freedom” is at ${Math.round(fr.precision * 100)}%, below it` : "";
  const nChecked = new Set(prec.map(p => p.term)).size;
  /* How each reason for removing a site reads after "had" or "were", so the list is a sentence. */
  const WHY = { "no candidate name or campaign words": "had no candidate name or campaign words", "hosting error or parked domain": "had a hosting error or parked domain",
    "placeholder text": "had placeholder text that left under 100 words once dropped", "spam": "were mostly spam", "site-builder page titles only": "had only site-builder page titles" };
  const byReason = Object.entries(reasons).sort((a, b) => b[1] - a[1]);
  const steps = [
    { id: "ballot", name: "Candidate-Years on the Ballot", count: total, out: 0,
      rule: `Democratic and Republican candidates on a November general-election ballot for the House or Senate, 2020 to 2026, except the ${INS.D.candidate_list.label} candidate-years under <a class="gl-link" href="#/method/party-labels">Party Labels Not Recognized</a> and the ${INS.D.candidate_list.repeated} under <a class="gl-link" href="#/method/repeated-numbers">Repeated Candidate Numbers</a>. Write-ins are not included.`,
      basis: `${gl("ballotpedia", "Ballotpedia")}, checked against the Federal Election Commission (FEC) candidate lists for 2020 to 2024. 2026 has no FEC list yet. ${R("druckman-2009", "Druckman, Kifer and Parkin (2009)")} coded one site for each general-election candidate.` },
    { id: "website", name: "Campaign Website", count: withSite, out: total - withSite, outWhy: "No Website Found",
      rule: `The website on the candidate’s Federal Election Commission (FEC) ${gl("fec-form-1", "Form 1")}. When Form 1 lists none, the one on the candidate’s Ballotpedia page.`,
      basis: `The Code of Federal Regulations, ${R("fec-rule", "11 CFR 102.2(a)(1)(vii)")}, requires Form 1 to list a committee’s official website, if it has one. The ${R("loc-2024", "Library of Congress election web archive")} takes its site list from FEC data too, adding addresses its staff found.` },
    { id: "saved-text", name: "Saved Text", count: withText, out: withSite - withText, outWhy: "No Saved Text",
      rule: `The newest copy of each site’s homepage and up to three linked pages that ${gl("common-crawl", "Common Crawl")} saved from January 1 of the election year through election day.`,
      basis: `Every year uses Common Crawl alone, except one analyzed 2024 site whose copies come only from the ${gl("wayback-machine", "Wayback Machine")}. No published standard fixes the dates. ${R("druckman-2009", "Druckman et al.")} coded the last ten days, the ${R("porter-2025", "CampaignView")} database the week before a primary. Results for the last 120 and last 60 days are compared under <a class="gl-link" href="#/method/window">Change in Results from Recent Copies Only</a>.` },
    { id: "screen", name: "Text and Length Screen", count: long, out: withText - long, outWhy: "Under 100 Words",
      rule: "Main text pulled from each page. Page code, spam, placeholder text, Spanish paragraphs and repeated paragraphs are dropped. A site with under 100 words in all, counting the paragraphs dropped, is set aside.",
      basis: `trafilatura, an open-source text extractor ${C(["bevendorff-2023", "Bevendorff et al. 2023"])}. Placeholder-text screening follows C4, a cleaned web-text collection ${C(["raffel-2020", "Raffel et al. 2020"])}; the other rules and all thresholds are this study’s own. The 100-word minimum follows LIWC-22, a text-analysis program ${C(["boyd-2022", "Boyd et al. 2022"])}; no standard exists for political text.` },
    { id: "exclusions", name: "Campaign Content", hand: true, count: analyzed, out: long - analyzed, outWhy: "Not Campaign Content",
      rule: "Rules flag sites that are not campaign content; the rules are this study’s own. A person read every flagged site before it was removed.",
      basis: `Of the ${nf(excl.length)} candidate-years removed, ${byReason.map(([r, k], i) => `${i && i === byReason.length - 1 ? "and " : ""}${k} ${esc(WHY[r] || "had " + r)}`).join(", ")}.` },
    { id: "terms", name: "Term Matching", count: null,
      rule: `57 fixed ${gl("words", "terms")} in five themes, chosen by the researcher before results were examined. A candidate uses a term if it appears at least once in the site’s text.`,
      basis: `Presence, not frequency ${C(["grimmer-2013", "Grimmer and Stewart 2013"], ["king-2017", "King, Lam and Roberts 2017"])}. Presence depends on site length, which is on the <a class="gl-link" href="#/coverage">Coverage</a> tab.` },
    { id: "precision", name: "Match Check", hand: true, count: null,
      rule: `One person ${gl("coding", "coded")} ${codedTxt} for each of ${nChecked} terms to see whether the term was used as intended. A term passes at 90%${freedom}.`,
      basis: `A sample for each term, not every match. The number of matches and the 90% cutoff are this study’s choice; no source sets them. Results are under <a class="gl-link" href="#/method/matches">Match Check Results</a>.` },
    { id: "shares", name: "Shares, Intervals and Tests", count: null,
      rule: `Every ${gl("share", "share")} has a ${gl("interval", "95% Interval")}. Every gap between the parties has a ${gl("gap-interval", "Gap Interval")}, and a gap among all candidates also has a ${gl("fisher-test", "Fisher Exact Test")} and an ${gl("adjusted-p-value", "Adjusted P-Value")}.`,
      basis: `A ${gl("wilson-interval", "Wilson Interval")} for each share ${C(["brown-2001", "Brown, Cai and DasGupta 2001"])}, a ${gl("newcombe-interval", "Newcombe Interval")} for each gap and each change ${C(["newcombe-1998", "Newcombe 1998"])} and the ${gl("benjamini-hochberg", "Benjamini-Hochberg Adjustment")} ${C(["benjamini-1995", "Benjamini and Hochberg 1995"])}, with 2020 to 2024 adjusted together and 2026 apart.` },
    { id: "range", name: "Possible Range", count: null,
      rule: `The ${gl("possible-range", "Possible Range")} of a share among all candidates with a known website: its lowest value if none of those with no analyzed text used the term, and its highest if every one did.`,
      basis: `The bounds follow ${R("manski-1988", "Manski (1988)")}, who showed how to bound a result when part of a sample is missing.` },
  ];
  const max = total;
  const row = (s, i) => `<article class="step${S.sub === s.id ? " target" : ""}" id="s-${s.id}">
      <div class="num">${i + 1}</div>
      <div class="what"><h2>${esc(s.name)}</h2>${s.hand ? `<span class="hand">Hand Check</span>` : ""}<p>${s.rule}</p></div>
      <div class="cnt">${s.count !== null ? `<span class="big">${nf(s.count)}</span><span class="bar" aria-hidden="true"><i style="width:${(s.count / max * 100).toFixed(1)}%"></i></span>${s.out ? `<span class="out">${esc(s.outWhy)} ${nf(s.out)}</span>` : ""}` : ""}</div>
      <div class="basis">${s.basis}</div></article>`;
  host.innerHTML = `<h1 class="title">Method</h1>
    <p class="lede">Code ran every step on every ${gl("candidate-year", "candidate-year")}, except the two Hand Checks, which a person did. Counts include 2026, which runs through ${INS.fmtDate(INS.through2026)} and will change until election day. What the study could not do is under <a class="gl-link" href="#/method/limitations">Limitations</a>.</p>
    <div class="steps"><div class="step head" aria-hidden="true"><div></div><div>Step</div><div>Candidate-Years</div><div>Source or Standard</div></div>${steps.map(row).join("")}</div>
    ${windowTable()}
    <section class="block" id="s-matches"><h2>Match Check Results</h2>
      <p class="lede tight">${nChecked} of the 57 terms were checked${codedSet.length === 1 ? `, ${codedSet[0]} matches each` : ""}. Precision is the share of coded matches where the term was used as intended, and a term passes at 90%. Original rows use the term’s ${gl("words", "pattern")} as first written, before any results were seen; Revised rows use the narrowed pattern, checked on a fresh sample.</p>
      <table class="plain prec"><thead><tr><th>Term</th><th>Pattern Version</th>${codedSet.length === 1 ? "" : `<th class="r">Matches Coded</th>`}<th class="r">Precision</th><th class="r">95% Interval</th></tr></thead><tbody>
      ${prec.map(p => `<tr><td>${esc(INS.DN[p.term] || p.term)}</td><td class="muted">${p.sample === "v1" ? "Original" : p.sample === "v2" ? "Revised" : esc(p.sample)}</td>${codedSet.length === 1 ? "" : `<td class="r">${p.coded}</td>`}<td class="r">${Math.round(p.precision * 100)}%</td><td class="r muted">${Math.round(p.wilson_low * 100)} to ${Math.round(p.wilson_high * 100)}%</td></tr>`).join("")}
      </tbody></table></section>
    <section class="block" id="s-limitations"><h2>Limitations</h2>
      <p class="lede tight">What the study could not do, and where its numbers need care.</p>
      <dl class="gloss lim">${limitations().map(x => `<div class="g${x.id && S.sub === x.id ? " target" : ""}"${x.id ? ` id="s-${x.id}"` : ""}><dt>${esc(x.label)}</dt><dd>${x.text}</dd></div>`).join("")}</dl></section>`;
  when(S.sub);
};

/* ---------- Coverage ---------- */
V.coverage = host => {
  const c = INS.D.candidates;
  const rows = [];
  YEARS.forEach(y => INS.PARTIES.forEach(p => {
    const g = c.filter(x => x.year === y && x.party === p);
    const an = g.filter(x => x.status === "analyzed").length;
    const nosite = g.filter(x => x.status === "no website").length;
    rows.push({ y, p, all: g.length, an, nosite, rest: g.length - an - nosite });
  }));
  const bar = r => `<div class="cov${r.y === 2026 ? " y26" : ""}">
      <span class="who"><span class="pn ${r.p}">${PNAME[r.p]}</span></span>
      <span class="stack" role="img" tabindex="0" data-tip="${r.an} Analyzed\n${r.rest} No Usable Text\n${r.nosite} No Website Found" aria-label="${PNAME[r.p]}, ${INS.yl(r.y)}: ${r.an} of ${r.all} analyzed">
        <i class="an ${r.p}" style="width:${r.an / r.all * 100}%"></i><i class="rest" style="width:${r.rest / r.all * 100}%"></i><i class="nosite" style="width:${r.nosite / r.all * 100}%"></i></span>
      <span class="val"><b>${pct(r.an, r.all)}</b> <span class="muted">${nf(r.an)} of ${nf(r.all)}</span></span>
      <span class="cn"><span class="nw"><i class="sw rest"></i>${nf(r.rest)}<span class="vh"> No Usable Text</span></span><span class="nw"><i class="sw nosite"></i>${nf(r.nosite)}<span class="vh"> No Website Found</span></span></span></div>`;
  const len = INS.D.site_length;
  const V2 = selectionVerdict(), find = V2.find;
  const sRows = [];
  YEARS.forEach(y => INS.PARTIES.forEach(p => {
    const a = find(y, PNAME[p], "analyzed"), n2 = find(y, PNAME[p], "not analyzed");
    if (!a || !n2) return;
    const cells = (g, cls) => `<td class="r n${cls}">${nf(g.candidates)}</td><td class="r i${cls}">${pct(g.incumbents, g.candidates)}</td><td class="r w${cls}">${g.with_results ? pct(g.winners, g.with_results) : "—"}</td>`;
    sRows.push(`<tr class="p1${y === 2026 ? " y26" : ""}"><th class="lab" scope="rowgroup" rowspan="2"><span class="yr">${INS.yl(y)}</span><span class="pty"><span class="pn ${p}">${PNAME[p]}</span></span></th><th scope="row" class="gn">Analyzed</th>${cells(a, "")}</tr>
      <tr class="p2"><th scope="row" class="gn">Not Analyzed</th>${cells(n2, " muted")}</tr>`);
  }));
  const verdict = V2.text;
  const med = (y, p) => { const L = len.find(x => x.year === y && x.party_group === PNAME[p]); return L ? INS.words(L.words_median) : "—"; };
  host.innerHTML = `<h1 class="title">Coverage</h1>
    <p class="lede">Which ballot candidates have analyzed site text, and how they differ from the candidates not analyzed. ${gl("2026", "2026")} runs through ${INS.fmtDate(INS.through2026)} and will change until election day.</p>
    <section class="block"><h2>Analyzed Candidates by Cycle</h2>
      <div class="covkey"><span><i class="sw an"></i>${gl("analyzed", "Analyzed")}</span><span><i class="sw rest"></i>${gl("no-usable-text", "No Usable Text")}</span><span><i class="sw nosite"></i>${gl("no-website-found", "No Website Found")}</span></div>
      <div class="covgrid">${YEARS.map(y => `<div class="covyear${y === 2026 ? " y26" : ""}"><h3>${INS.yl(y)}</h3>${rows.filter(r => r.y === y).map(bar).join("")}</div>`).join("")}</div></section>
    <section class="block"><h2>Analyzed and Not Analyzed Candidates</h2>
      <table class="plain sel"><colgroup><col class="c1"><col class="c2"><col class="c3"><col class="c4"><col class="c5"></colgroup><thead><tr><th rowspan="2" scope="col">${gl("cycle", "Cycle")} and Party</th><th rowspan="2" colspan="2" scope="colgroup">Group<span class="sub unit">Candidates</span></th><th colspan="2" class="r grp" scope="colgroup">${gl("share", "Share")} of Group</th></tr>
        <tr><th class="r i" scope="col">${gl("incumbent", "Incumbents")}</th><th class="r w" scope="col">${gl("winner", "Winners")}</th></tr></thead><tbody>${sRows.join("")}</tbody></table>
      <p class="foot">${verdict} Winners are counted among candidates with a result, and a dash means results for the cycle are not in yet.</p>
    </section>
    <section class="block"><h2>Site Length</h2>
      <p class="lede tight">Half of analyzed sites have more words than the ${gl("median", "median")} and half have fewer. A candidate counts once for a term however often it appears, so a longer site has more chances to use it.</p>
      <table class="plain len"><thead><tr><th rowspan="2" scope="col">${gl("cycle", "Cycle")}</th><th colspan="2" class="r grp" scope="colgroup">Median Words</th></tr>
        <tr><th class="r pn D" scope="col">Democratic</th><th class="r pn R" scope="col">Republican</th></tr></thead><tbody>
      ${YEARS.map(y => `<tr class="${y === 2026 ? "y26" : ""}"><td><span class="yr">${INS.yl(y)}</span></td><td class="r">${med(y, "D")}</td><td class="r">${med(y, "R")}</td></tr>`).join("")}</tbody></table>
    </section>`;
};

/* ---------- Related work ---------- */
const doi = d => ({ href: `https://doi.org/${d}`, label: `doi:${d}` });
/* Every work cited anywhere in the interface, from the study's literature record and METHODS.md. A note marks a source not opened in full. */
const REFS = [
  { id: "baack-2024", who: "Baack, S.", year: "2024", title: "A Critical Analysis of the Largest Source for Generative AI Training Data: Common Crawl", venue: "The 2024 ACM Conference on Fairness, Accountability, and Transparency, 2199–2208", ...doi("10.1145/3630106.3659033") },
  { id: "bailey-2026", who: "Bailey, M. A., and Reese, B. F.", year: "2026", title: "Ideological Moderation and Success in U.S. Elections, 2020–2022", venue: "The Journal of Politics, published online February 2026", ...doi("10.1086/741076"),
    note: `The introduction and data section of the ${gl("working-paper", "working paper")} of October 2024 were read. The published article was not opened.` },
  { id: "benjamini-1995", who: "Benjamini, Y., and Hochberg, Y.", year: "1995", title: "Controlling the False Discovery Rate: A Practical and Powerful Approach to Multiple Testing", venue: "Journal of the Royal Statistical Society Series B 57(1), 289–300", ...doi("10.1111/j.2517-6161.1995.tb02031.x"),
    note: "Pages 289 to 293 were read." },
  { id: "bevendorff-2023", who: "Bevendorff, J., Gupta, S., Kiesel, J., and Stein, B.", year: "2023", title: "An Empirical Comparison of Web Content Extraction Algorithms", venue: "Proceedings of the 46th International ACM SIGIR Conference on Research and Development in Information Retrieval, 2594–2603", ...doi("10.1145/3539618.3591920"),
    note: "The full text was not opened." },
  { id: "boyd-2022", who: "Boyd, R. L., Ashokkumar, A., Seraj, S., and Pennebaker, J. W.", year: "2022", title: "The Development and Psychometric Properties of LIWC-22", venue: "University of Texas at Austin", href: "https://www.liwc.app/static/documents/LIWC-22%20Manual%20-%20Development%20and%20Psychometrics.pdf", label: "liwc.app",
    note: "The sampling section was read; the rest was not." },
  { id: "brown-2001", who: "Brown, L. D., Cai, T. T., and DasGupta, A.", year: "2001", title: "Interval Estimation for a Binomial Proportion", venue: "Statistical Science 16(2), 101–133", ...doi("10.1214/ss/1009213286") },
  { id: "ditella-2025", who: "Di Tella, R., Kotti, R., Le Pennec, C., and Pons, V.", year: "2025", title: "Keep Your Enemies Closer: Strategic Platform Adjustments during US and French Elections", venue: "American Economic Review 115(8), 2488–2528", ...doi("10.1257/aer.20231045"),
    note: "The working paper (NBER Working Paper 31503) was read for its data and methods, not its results sections. The journal version was not opened." },
  { id: "druckman-2009", who: "Druckman, J. N., Kifer, M. J., and Parkin, M.", year: "2009", title: "Campaign Communications in U.S. Congressional Elections", venue: "American Political Science Review 103(3), 343–366", ...doi("10.1017/S0003055409990037"),
    note: "The working paper (IPR WP-07-11) was read in full. The published text was not checked against it." },
  { id: "fec-rule", who: "Federal Election Commission", year: "2026", title: "11 CFR 102.2, Statement of Organization: Forms and Committee Identification Number", venue: "Code of Federal Regulations, Title 11, text as of October 2026", href: "https://www.ecfr.gov/current/title-11/chapter-I/subchapter-A/part-102/section-102.2", label: "ecfr.gov" },
  { id: "grimmer-2013", who: "Grimmer, J., and Stewart, B. M.", year: "2013", title: "Text as Data: The Promise and Pitfalls of Automatic Content Analysis Methods for Political Texts", venue: "Political Analysis 21(3), 267–297", ...doi("10.1093/pan/mps028") },
  { id: "hilbig-2026", who: "Hilbig, H.", year: "2026", title: "U.S. House (2018–2024) and Senate (2002–2024) Candidate Websites", venue: `Version 4.0. ${gl("harvard-dataverse", "Harvard Dataverse")}`, ...doi("10.7910/DVN/BZ2JRS"),
    note: "The documentation was read in full. The data files were not downloaded." },
  { id: "king-2017", who: "King, G., Lam, P., and Roberts, M. E.", year: "2017", title: "Computer-Assisted Keyword and Document Set Discovery from Unstructured Text", venue: "American Journal of Political Science 61(4), 971–988", ...doi("10.1111/ajps.12291") },
  { id: "loc-2024", who: "Library of Congress", year: "2024", title: "United States Elections, Web Archives Data Package, Version 1.1", venue: "Library of Congress Labs", href: "https://data.labs.loc.gov/us-elections/", label: "data.labs.loc.gov" },
  { id: "manski-1988", who: "Manski, C. F.", year: "1988", title: "Anatomy of the Selection Problem", venue: "Institute for Research on Poverty Discussion Paper 873-88", ...doi("10.2307/145818"),
    note: "The abstract, introduction and section 2 of the discussion paper were read. A journal version, in The Journal of Human Resources in 1989, has the doi shown." },
  { id: "newcombe-1998", who: "Newcombe, R. G.", year: "1998", title: "Interval Estimation for the Difference between Independent Proportions: Comparison of Eleven Methods", venue: "Statistics in Medicine 17(8), 873–890", href: "https://doi.org/10.1002/(SICI)1097-0258(19980430)17:8%3C873::AID-SIM779%3E3.0.CO;2-I", label: "doi:10.1002/(SICI)1097-0258(19980430)17:8<873::AID-SIM779>3.0.CO;2-I",
    note: "Only an excerpt of the abstract was read." },
  { id: "porter-2025", who: "Porter, R., Case, C. R., and Treul, S. A.", year: "2025", title: "CampaignView, a Database of Policy Platforms and Biographical Narratives for Congressional Candidates", venue: "Scientific Data 12, 1237", ...doi("10.1038/s41597-025-05491-x") },
  { id: "raffel-2020", who: "Raffel, C., Shazeer, N., Roberts, A., Lee, K., Narang, S., Matena, M., Zhou, Y., Li, W., and Liu, P. J.", year: "2020", title: "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer", venue: "Journal of Machine Learning Research 21(140), 1–67", href: "https://jmlr.org/papers/v21/20-074.html", label: "jmlr.org",
    note: "Section 2.2, which describes C4, was read; the rest was not." },
];
const REF = Object.fromEntries(REFS.map(r => [r.id, r]));
const WORKS = [
  { ref: "hilbig-2026", who: "Hilbig",
    did: `Archived text from Democratic and Republican candidate websites, House 2018 to 2024 and Senate 2002 to 2024, from the ${gl("wayback-machine", "Wayback Machine")}, with measures of length, vocabulary and topic shares from a ${gl("classifier", "trained classifier")}.`,
    differs: "This study counts specific words and adds 2026." },
  { ref: "porter-2025", who: "Porter, Case and Treul",
    did: "A database of policy platforms of House primary candidates in 2018, 2020 and 2022, collected by hand a week before each primary and labeled by topic.",
    differs: "This study covers general-election candidates, the House and the Senate, and counts words by code." },
  { ref: "druckman-2009", who: "Druckman, Kifer and Parkin",
    did: `${gl("coding", "Coded")} 736 candidate websites from 2002, 2004 and 2006 in the ten days before election day, and found that challengers and incumbents campaigned differently.`,
    differs: "This study covers 2020 to 2026 and measures every site with the same code instead of coders." },
  { ref: "ditella-2025", who: "Di Tella, Kotti, Le Pennec and Pons",
    did: "Used archived House candidate websites from 2002 to 2016 to show that candidates move toward the center between primary and general election.",
    differs: "This study reports shares of candidates using each term, not an ideology score." },
  { ref: "bailey-2026", who: "Bailey and Reese",
    did: "Scored the ideology of House, Senate and governor candidates from their website and Twitter text in 2020 and 2022.",
    differs: "This study counts named words and shows how the shares changed, with ranges for candidates who could not be analyzed." },
];
V["related-work"] = host => {
  const target = id => (S.sub === "ref-" + id ? " target" : "");
  host.innerHTML = `<h1 class="title">Related Work</h1>
    <p class="lede">Earlier studies that collected or scored text from candidates’ campaign websites, with how this study differs from each.</p>
    <div class="works">${WORKS.map(w => ({ ...w, r: REF[w.ref] })).sort((a, b) => b.r.year - a.r.year).map(w => `<article class="work"><h2>${esc(w.who)} <span class="yr">${w.r.year}</span></h2>
      <div class="wt">${esc(w.r.title)}</div>
      <p>${w.did}</p><p class="differs">${esc(w.differs)}</p><div class="venue"><a class="gl-link" href="#/related-work/ref-${w.ref}">Venue and DOI in the Reference List</a></div></article>`).join("")}</div>
    <section class="block" id="s-references"><h2>Reference List</h2>
      <p class="lede tight">Every work cited on this site, in alphabetical order. A note marks each work that was read only in part.</p>
      <ul class="refs">${REFS.map(r => `<li class="ref${target(r.id)}" id="s-ref-${r.id}"><span class="ra">${esc(r.who)} (${esc(r.year)}).</span> ${esc(r.title)}. <i>${r.venue}</i>. <a class="gl-link" href="${r.href}">${esc(r.label)}</a>.${r.note ? `<span class="rn">${r.note}</span>` : ""}</li>`).join("")}</ul></section>`;
  when(S.sub);
};

/* ---------- Downloads ---------- */
const FILES = [
  { f: "term_shares.csv", cols: "theme, term, year, office, party_group, candidates_using, candidates_analyzed, share", what: "Share of each term by year, office and party, with the counts.", rows: D => D.shares.length },
  { f: "term_gaps.csv", cols: "theme, term, year, dem_using, dem_analyzed, rep_using, rep_analyzed, dem_share, dem_low, dem_high, rep_share, rep_low, rep_high, gap_dem_minus_rep, gap_low, gap_high, fisher_p, q_benjamini_hochberg, q_benjamini_yekutieli, family", what: "Gap between the parties for each term and year, with intervals and adjusted p-values.", rows: D => D.gaps.length },
  { f: "term_classes.csv", cols: "theme, term, class, favors, gap_2020, gap_2022, gap_2024, gap_q_2020, gap_q_2022, gap_q_2024, significant_changes", what: "Class of each term by whether its gap is consistent and whether it moved, 2020 to 2024.", rows: D => D.classes.length },
  { f: "term_bounds.csv", cols: "theme, term, year, party_group, using, analyzed, with_known_website, on_ballot, share_of_analyzed, low_among_known_website, high_among_known_website, low_among_ballot, high_among_ballot", what: "Each share with its Possible Range among candidates with a known website and among all on the ballot.", rows: D => D.bounds.length },
  { f: "term_shares_panel.csv", cols: "theme, term, year, office, party_group, candidates_using, candidates_analyzed, share", what: "Shares for candidates analyzed in two or more years.", rows: D => D.panel.length },
  { f: "term_shares_windows.csv", cols: "window, sample, theme, term, year, office, party_group, candidates_using, candidates_analyzed, share", what: "Shares from copies saved in the election year, the last 120 days and the last 60 days, for all candidates analyzed in each and for those analyzed in all three.", rows: D => D.windows.length },
  { f: "coverage.csv", cols: "year, office, party_group, candidates, website_known, any_text, min_words_met, excluded, analyzed", what: "Candidates at each step from the ballot to analyzed, by year, office and party.", rows: D => D.coverage.length },
  { f: "selection.csv", cols: "year, party_group, group, candidates, incumbent_share, with_results, won_share, mean_vote_share, close_race_share, mean_two_party_margin_from_even, with_seat_presidential, close_seat_share, mean_seat_presidential_margin_from_even", what: "Incumbency, results and closeness of analyzed and not analyzed candidates.", rows: D => D.selection.length },
  { f: "site_length.csv", cols: "year, party_group, analyzed, words_p25, words_median, words_p75, words_mean", what: "Words per analyzed site by year and party.", rows: D => D.site_length.length },
  { f: "distinctive_terms.csv", cols: "year, kind, favors, rank, term, welch_t, dem_mean_per_10k, rep_mean_per_10k, dem_candidates_using, rep_candidates_using, dem_analyzed, rep_analyzed", what: "Words and phrases that most separate the parties, by year.", rows: D => D.distinctive.length },
  { f: "term_precision.csv", cols: "term, sample, coded, intended, precision, wilson_low, wilson_high", what: "Hand-coded matches used as intended, by term.", rows: D => D.precision.length },
];
/* The column names a reader meets in the files, in plain words, in the order the files first use them. A name is kept as written because it is what the reader looks for in the file. */
const COLS = [
  ["theme, term", "The theme a term belongs to, one of five, and the term itself, as the study’s code spells it, which can differ in capitals and quotation marks from how this site shows it."],
  ["year, office, party_group", "The election year; House, Senate, or All offices together; and Democratic or Republican."],
  ["candidates_using, candidates_analyzed", "How many analyzed candidates used the term and how many were analyzed. The share is the first divided by the second."],
  ["share", "The candidates using a term divided by the candidates analyzed, as a fraction of 1, so 0.25 is 25%."],
  ["dem_ and rep_", "A prefix for Democratic and Republican candidates: dem_using is how many analyzed Democratic candidates used the term."],
  ["_low and _high", `The lower and upper ends of a 95% Interval, as fractions of 1: a ${gl("wilson-interval", "Wilson Interval")} for a share and a ${gl("newcombe-interval", "Newcombe Interval")} for a gap.`],
  ["gap_dem_minus_rep", "The Democratic share minus the Republican share, as a fraction of 1, so 0.05 is Democratic higher by 5 points."],
  ["fisher_p", `The ${gl("fisher-test", "p-value")} of the ${gl("fisher-test", "Fisher Exact Test")} of a gap, before any adjustment for testing many terms.`],
  ["q_benjamini_hochberg", `Here q is an adjusted p-value: the p-value of a gap after the ${gl("benjamini-hochberg", "Benjamini-Hochberg Adjustment")} for testing many terms, to three significant figures. It is the one this site prints. The site rounds the unrounded value, so it can differ by one in the last place from the file’s value rounded again.`],
  ["q_benjamini_yekutieli", `The same q after the more cautious ${gl("benjamini-yekutieli", "Benjamini-Yekutieli Adjustment")}, which allows for terms that are related, so it is larger.`],
  ["family", "The tests adjusted together: 2020-2024 for the three earlier years, and 2026 alone."],
  ["class", "Whether a term’s gap points the same way with an adjusted p-value under 0.05 in 2020, 2022 and 2024 (split or not consistently split), and whether either party’s share changed between elections by the same test (moving) or did not (still)."],
  ["favors", "The party with the higher share, given only for terms that are split."],
  ["gap_2020, gap_q_2020", "A year’s gap, as a fraction of 1, and its q, the adjusted p-value; gap_2022, gap_q_2022, gap_2024 and gap_q_2024 are the same for the later years."],
  ["significant_changes", "The changes within one party between consecutive elections that have an adjusted p-value under 0.05."],
  ["using, analyzed", "In term_bounds.csv, the candidates using the term and the candidates analyzed; share_of_analyzed is their ratio."],
  ["with_known_website, on_ballot", "In term_bounds.csv, the candidates with a known website and all candidates on the ballot."],
  ["low_among_known_website, high_among_known_website, low_among_ballot, high_among_ballot", "The Possible Range of the share for each of those two groups: its lowest value if no candidate who was not analyzed used the term, and its highest if every one did."],
  ["window", "The span of saved copies used: year for the election year, 120 for the last 120 days and 60 for the last 60 days before election day."],
  ["sample", "In term_shares_windows.csv, all means every candidate analyzed in that window and common means only the candidates analyzed under all three windows. In term_precision.csv, v1 is the original pattern and v2 the revised pattern."],
  ["candidates", "In coverage.csv, the candidates on the ballot. In selection.csv, the candidates in the group."],
  ["website_known, any_text, min_words_met, excluded", "In coverage.csv, the candidates with a known website, with any saved text, with at least 100 words, and removed as not campaign content."],
  ["group", "In selection.csv, analyzed or not analyzed."],
  ["incumbent_share, won_share", "The share of the group who held the seat before the election, and the share of those with a result who won."],
  ["with_results", "The candidates in the group with a result for the election. 2026 has none."],
  ["mean_vote_share", "The group’s average share of all votes cast in the race, as a fraction of 1."],
  ["close_race_share, close_seat_share", "The share of races, or of seats by their presidential vote, that were close: the Democratic share of the two-party vote was 45% to under 55%."],
  ["mean_two_party_margin_from_even", "The average distance of the Democratic share of the two-party vote from 50%, as a fraction of 1; the seat version uses the presidential vote."],
  ["with_seat_presidential", "The candidates in the group whose seat has a presidential vote."],
  ["words_median, words_mean", "The median and the mean number of words on an analyzed site. Where the count of sites is even, words_median is the higher of the two middle counts, so it can be a few words above the median the Coverage tab shows."],
  ["words_p25, words_p75", "The words on the site at the 25th and 75th percentile: a quarter of analyzed sites are shorter than the first and a quarter longer than the second."],
  ["kind, rank", "Word or phrase, and the place in that year’s list for the party in favors, ranked by welch_t."],
  ["welch_t", `The ${gl("welch-t", "Welch’s T Statistic")}, comparing the parties’ average use of a term or phrase across candidates. Positive favors Democratic candidates, negative Republican, and a larger size is a stronger split.`],
  ["dem_mean_per_10k", "The average number of times a term or phrase appears per 10,000 words or phrases of the same length on a Democratic candidate’s site; rep_mean_per_10k is the same for Republican candidates."],
  ["coded, intended, precision", "The matches coded by hand, how many were used as intended, and the second divided by the first."],
];
V.downloads = host => {
  host.innerHTML = `<h1 class="title">Downloads</h1>
    <p class="lede">Counts, shares, gaps, p-values and words per site, never a site’s full text. Democratic and Republican candidates only. Each file is a CSV, a plain-text table that opens in a spreadsheet. Rows for 2026 run through ${INS.fmtDate(INS.through2026)} and will change. Each description ends with the file’s column names, written as they are in the file and explained under Column Names.</p>
    <table class="plain files"><thead><tr><th>File</th><th>Description</th><th class="r">Rows</th></tr></thead><tbody>
      ${FILES.map(x => `<tr><td><a href="/files/${x.f}" download>${x.f}</a></td><td>${esc(x.what)}<span class="cols">${esc(x.cols)}</span></td><td class="r">${nf(x.rows(INS.D))}</td></tr>`).join("")}
    </tbody></table>
    <section class="block" id="s-columns"><h2>Column Names</h2>
      <dl class="gloss colnames">${COLS.map(([n, d]) => `<div class="g"><dt class="cols">${esc(n)}</dt><dd>${d}</dd></div>`).join("")}</dl></section>`;
  when(S.sub);
};

/* ---------- Glossary ---------- */
const TERMS = [
  ["analyzed", "Analyzed", "A candidate whose campaign site had at least 100 words of saved text in the election year, and was not removed as something other than campaign content. Shares and counts use only these candidates. Candidates who were not analyzed are not counted as zeros."],
  ["cycle", "Cycle", "An election year: 2020, 2022, 2024 or 2026. A cycle is one election, so 2024 is the 2024 cycle."],
  ["words", "Terms", "The study counts 57 fixed terms. Each is matched by a written pattern, as whole words anywhere in a site’s text, ignoring capitals except for “AI”, which counts only in capitals. A label with a slash names two wordings, and a site counts if it uses either; when the label begins with a shared word, as in “Illegal Immigration / Aliens”, each wording includes it: “illegal immigration” and “illegal aliens”, not “aliens” alone. “Corporations / Corporate” is narrower: it counts “corporations”, “corporation” only after a word such as “big” or “greedy”, and “corporate” only in phrases such as “corporate PACs” or “corporate greed”. Some labels also count plurals, hyphenated forms or other wordings: “China” counts “CCP” and “Chinese Communist”, “Reproductive Freedom / Rights” counts “reproductive health care”, and “Working People” counts “working men and women”. Some patterns skip matches that are not the term’s sense; “Inflation” does not count the Inflation Reduction Act. The full patterns are in the study’s code."],
  ["candidate-year", "Candidate-Year", "One candidate in one election year. Someone who ran in 2022 and 2024 is two candidate-years."],
  ["share", "Share", "The percent of one party’s analyzed candidates whose site used the term at least once. A share printed as <1% means some candidates used the term but fewer than one in a hundred, and 0% means none did."],
  ["gap", "Gap", "The Democratic share minus the Republican share, in percentage points, computed from unrounded shares. It is written D+ when Democratic is higher and R+ when Republican is higher, so D+10 means the Democratic share is 10 points higher. A gap is shown in italics when its Gap Interval includes zero or its adjusted p-value is 0.05 or more, which means it may be chance. With filters on, a gap has no adjusted p-value, and its italics rest on the Gap Interval alone."],
  ["interval", "95% Interval", "The range a share could plausibly take, given which candidates were analyzed, drawn as a band on the chart and written as two percentages. “95%” means that if candidates were sampled this way over and over, about 95 of every 100 such ranges would hold the true share. It reflects chance among the candidates analyzed and does not cover candidates who could not be analyzed. A gap’s range is its Gap Interval, and a change’s is its Change Interval."],
  ["gap-interval", "Gap Interval", "The 95% Interval of a gap: the range the gap could plausibly take, given which candidates were analyzed, written in the gap’s own notation, such as D+2 to D+9. A gap whose Gap Interval includes zero is shown in italics, because it may be chance. It does not cover candidates who could not be analyzed."],
  ["possible-range", "Possible Range", "The lowest and highest share of all candidates with a known website, in a party and cycle and within any filters, that could have used the term: lowest if none of those with no analyzed text did, highest if every one did. It follows the bounds Manski (1988) described for missing data. It counts the candidates not analyzed and does not measure chance, so it is not an interval of the same kind as the 95% Interval, and where few candidates were left out it can be narrower than that interval."],
  ["adjusted-p-value", "Adjusted P-Value", "A p-value is how likely a gap this large, or larger, would be if the two parties used the term equally often, so a small one suggests the gap is not just chance. With 57 terms tested, some gaps would be large by luck alone, so each p-value is adjusted for testing many terms at once, across all 57 terms with 2020, 2022 and 2024 together and 2026 apart. Among the gaps with this adjusted value or a smaller one, no more than this share are expected to be only chance, so smaller is stronger evidence. That holds when one term’s result does not affect another’s, which may not be true of terms sites use together, so the downloads also give the more cautious Benjamini-Yekutieli value. A gap has one only among all candidates, with no filters."],
  ["welch-t", "Welch’s T Statistic", "A number that compares the averages of two groups, relative to how much candidates within each group differ. Here the groups are the parties and the average is how often a candidate uses a word or phrase. The farther from zero, the more the parties differ: positive means Democratic candidates use it more, negative Republican."],
  ["percentage-points", "Percentage Points", "The difference between two percentages: a share that moves from 35% to 41% has moved 6 percentage points."],
    ["common-crawl", "Common Crawl", "A nonprofit archive that saves copies of web pages. Every year’s text in this study comes from it, apart from one analyzed site that has Wayback Machine copies only, so a site it never saved is not here."],
  ["ballotpedia", "Ballotpedia", "An online encyclopedia of American elections. The study takes its list of general-election candidates from Ballotpedia, and checks that list against Federal Election Commission lists for 2020 to 2024."],
  ["wayback-machine", "Wayback Machine", "The Internet Archive’s collection of saved copies of web pages. One analyzed site in this study has copies from it only, and the Hilbig dataset on the Related Work tab comes from it."],
  ["harvard-dataverse", "Harvard Dataverse", "A free repository where researchers deposit datasets so that others can download and cite them."],
  ["fec-form-1", "FEC Form 1", "The Statement of Organization that a campaign committee files with the Federal Election Commission. It must list the committee’s official website, if it has one."],
  ["wilson-interval", "Wilson Interval", "The method used to find each share’s 95% Interval. The simpler textbook formula can be unreliable for shares near 0% or 100% and for small groups, and the Wilson Interval stays reliable at every group size here."],
  ["newcombe-interval", "Newcombe Interval", "The method used to find the 95% Interval of a difference between two shares, such as the gap between the parties or a party’s change between cycles. It combines the Wilson Interval of each of the two shares, rather than subtracting one range from the other, so it stays reliable for small groups and for shares near 0% or 100%."],
  ["fisher-test", "Fisher Exact Test", "A test of how likely a gap this large, or larger, would be by chance if the two parties used the term equally often. The chance it reports is the gap’s p-value, before any adjustment. It stays reliable when few candidates used a term, because it needs no large-sample approximation."],
  ["benjamini-hochberg", "Benjamini-Hochberg Adjustment", "The correction that turns each p-value into an Adjusted P-Value. With 57 terms tested at once, some gaps would look real by chance alone. The correction keeps the expected share of such false alarms among the gaps called real at or below the adjusted value."],
  ["benjamini-yekutieli", "Benjamini-Yekutieli Adjustment", "A more cautious version of the Benjamini-Hochberg Adjustment. It keeps the expected share of false alarms in check even when terms that sites use together are related, so its adjusted values are larger. The downloaded files give it beside the Benjamini-Hochberg value."],
  ["coding", "Coding", "Reading a text and recording what it contains by a fixed set of rules. In this study a person coded a sample of matches for each term. In other studies coders recorded features of whole websites."],
  ["no-usable-text", "No Usable Text", "A candidate with a known website whose text could not be used, for one of three reasons: No Saved Text, which means no copy of the site was saved in the election year; Under 100 Words, which means the saved text had fewer than 100 words, counting paragraphs dropped as spam, placeholder or Spanish text; or Not Campaign Content, which means the study’s rules flagged the site and a person confirmed it was not campaign content."],
  ["no-website-found", "No Website Found", "A candidate for whom no campaign website was found on FEC Form 1 or on the candidate’s Ballotpedia page."],
  ["classifier", "Classifier", "A computer program trained on labeled examples to sort text into categories, such as a topic."],
  ["working-paper", "Working Paper", "A paper shared for comment before a journal publishes it. It can change before publication."],
  ["winner", "Winner", "A candidate who won the seat in the general election. Results come from the Federal Election Commission’s certified results for 2020 and 2022 and from Ballotpedia for 2024; 2026 has none until election day."],
  ["close-seat", "Close or Safe Seat", "A close seat is one where the Democratic share of the two-party presidential vote was 45% to under 55%, in the district, or the state for a Senate seat. A seat with a known presidential vote outside that range is a safe seat."],
  ["not-analyzed", "Not Analyzed", "A candidate on the ballot whose site could not be used, for one of four reasons: No Website Found, No Saved Text, Under 100 Words or Not Campaign Content. The last three together are No Usable Text on the Coverage tab. A site removed as Not Campaign Content is listed with its own reason: No Campaign Words, Site Unavailable, Placeholder Text, Spam or Page Titles Only."],
  ["2026", "2026", "The 2026 figures come from copies of campaign sites saved from January 1 through {DATE}. The campaigns run until election day on November 3, so these figures will change. The hatching on a chart marks 2026."],
  ["exploratory", "Exploratory", "A result noticed after looking at all 57 terms. It is a lead to check, not a test planned in advance. Every current result is exploratory."],
  ["incumbent", "Incumbent", "A candidate who held the seat before the election."],
  ["challenger", "Challenger", "A candidate who did not hold the seat before the election, including a candidate for a seat that had no incumbent running."],
  ["seat-code", "Seat Code", "A candidate’s seat as the state’s postal abbreviation and the district number, so NC-12 is North Carolina’s 12th House district and WA-Senate is a Washington Senate seat. AL after a state, as in AK-AL, means the state has one House seat for the whole state; Alabama’s own districts read AL-1 to AL-7."],
  ["median", "Median", "The middle value: half of the sites have more words and half have fewer."],
];
V.glossary = host => {
  const date = INS.fmtDate(INS.through2026, true);
  host.innerHTML = `<h1 class="title">Glossary</h1>
    <dl class="gloss">${TERMS.slice().sort((x, y) => x[1].localeCompare(y[1], "en", { numeric: true })).map(([id, t, d]) => `<div class="g${S.sub === id ? " target" : ""}" id="s-${id}"><dt>${esc(t)}</dt><dd>${esc(d.replace("{DATE}", date))}</dd></div>`).join("")}</dl>`;
  when(S.sub);
};
})();
