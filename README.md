# Campaign website language

A study of which words and phrases, such as "working people", U.S. House and Senate general-election
candidates used on their campaign websites in 2020, 2022, 2024 and 2026. It compares Democratic and
Republican candidates by year. Independent and third-party candidates are outside the study, although the
collection tools still gather them. The main measure is term usage: the
share of a party's candidates whose site uses a term at least once. Tone measures are built but not
yet validated, and no tone result is reported.

The unit is the candidate-year. The candidate list is every candidate on a November general-election
ballot, House and Senate, excluding write-ins, taken from Ballotpedia for all four years.
General-election candidates were chosen over primary candidates because their sites are archived far
more completely and because 2026 sites are still live before election day.

The text comes from one source, Common Crawl, for every year (a few analyzed sites come from the
Wayback Machine). The study therefore covers the campaign websites that Common Crawl saved between
January 1 of each election year and election day, and its coverage of the ballot is reported below by
year and party. Shares from the 60 days and 120 days before election day are reported beside them
(`results/term_shares_windows.csv`; see "Collection window" in `METHODS.md`).

## Data and coverage

Of 3,712 Democratic and Republican general-election candidate-years, 3,616 have a usable campaign
website, 2,773 yielded some saved text, and 2,701 yielded at least 100 words of campaign text from the
election year. 19 of those were excluded as not campaign content, leaving 2,682 analyzed. The 843
candidate-years with a website and no saved text are the largest gap: no archive in this source saved a
usable copy of the site inside the window. The presidential vote by seat covers 3,436 of the 4,900 rows of
`seat_pres.csv`, including every 2022 and 2026 candidate-year.

The 2026 text is a mid-campaign snapshot from Common Crawl's crawls of January to September 2026. The
window for 2026 runs through election day, November 3, 2026, and the figures below will change when the
final capture is analyzed.

Coverage of analyzed candidates (share of those on the ballot):

| Year | Democratic | Republican |
| --- | --- | --- |
| 2020 | 370 of 482 (77%) | 353 of 462 (76%) |
| 2022 | 317 of 454 (70%) | 322 of 462 (70%) |
| 2024 | 316 of 453 (70%) | 335 of 458 (73%) |
| 2026 | 360 of 476 (76%) | 309 of 465 (66%) |

Mike Johnson's 2022 candidate-year is not included because his race was not printed on the November
ballot. Page text extraction is serial, because trafilatura shares one parser across threads, and
repeated full runs give byte-identical page text, results and tone sentences (SHA-256).

## Running it

All tools are in `tools/` and run from that directory with the project virtual environment
(`artifacts/.venv/Scripts/python`; packages in `requirements.txt`). Every network fetch is cached
under `artifacts/cache/`, so reruns are cheap and every collector resumes where it stopped.
`artifacts/` is not in Git. Run the steps in this order.

| Step | Tool | Output |
| --- | --- | --- |
| Candidate lists from Ballotpedia | `universe.py 2020 2022 2024`, `universe.py 2026` | `artifacts/data/candidates_bp_*.csv` |
| FEC candidate IDs for every year | `match_fec.py` | `artifacts/data/candidates.csv`, `results/list_crosscheck.csv` |
| FEC general-election lists, cross-check only | `fec_universe.py` | `artifacts/data/candidates_fec.csv` |
| Campaign websites from FEC Form 1 | `fec_websites.py` | `artifacts/data/websites_fec.csv` |
| Ballotpedia pages: website link, quoted website text, survey answers | `bp_profiles.py [lists]` | `artifacts/data/bp_profiles.jsonl` |
| Merge into the collection list | `build_input.py` | `artifacts/data/sites_input.csv` |
| Site text from Common Crawl (main archive) | `cc.py 2020 2022 2024 2026` | `artifacts/data/pages_cc.jsonl` |
| The same for the 120-day and election-year windows | `cc.py --window 120 ...`, `cc.py --window year ...` | `artifacts/data/pages_cc_120.jsonl`, `pages_cc_year.jsonl` |
| Site text from the Wayback Machine, or live 2026 sites | `sites.py archived` / `sites.py live` | `artifacts/data/pages_archived.jsonl`, `pages_live.jsonl` |
| General-election results for 2020–2024 | `vote_results.py` | `artifacts/data/results.csv` |
| Presidential vote by seat | `seat_pres.py` | `artifacts/data/seat_pres.csv` |
| Washington voter-guide statements | `wa_statements.py` | `artifacts/data/wa_statements.jsonl` |
| Screening, term shares, distinctive phrases, examples, checks | `analyze.py` | `results/*.csv`, `results/*.json` |
| Match precision from the hand-coded sample | `precision.py` | `results/term_precision.csv` |
| Spanish paragraph rule checked against langid.py | `check_language.py` | `results/language_check*.csv` |
| Intervals, gap tests, adjusted p-values and bounds | `inference.py` | `results/term_gaps.csv`, `results/term_bounds.csv` |
| Stable and changing words, question 1 of the analysis plan | `questions.py` | `results/term_classes.csv`, `results/term_changes.csv` |
| Shares under the three windows | `windows.py` | `results/coverage_windows.csv`, `results/term_shares_windows.csv` |
| Report page | `report.py` | `results/report.html` |
| Sentiment and tone | `tone.py` | `artifacts/data/tone_sentences.jsonl`, `results/tone_scores.csv` |

`bp_profiles.py` is run on the 2026 list and on `artifacts/data/bp_needed.csv`, the Ballotpedia pages
of candidates without a usable FEC website. The collectors key their resume state on candidate and
site, so a candidate whose website changes is collected again.

The page text can be rebuilt without the network, because `pages_*.jsonl` store only extracted text
while the raw inputs are cached (`artifacts/cache/ccx` index blocks, `ccw` WARC records, `cdx` and
`wb` Wayback captures, `live` 2026 pages). Move the old `pages_*.jsonl` aside, then run `cc.py 2020
2022 2024 2026`, `sites.py archived` and `sites.py live` with `OFFLINE=1` set. A cache miss then
raises instead of fetching; the collector logs it as "retry later ... offline: not cached" and
writes nothing for that candidate-year, so compare the status lines with the previous files. Then run
`analyze.py`, `precision.py`, `check_language.py`, `report.py` and `tone.py`.

## Tests

Run from `tools/`: `python -m unittest test_terms test_pipeline test_inference test_questions test_tone`. `test_terms` checks the 57
patterns against every hand-coded match and the cases they were narrowed for. `test_pipeline` checks
party grouping, website-address handling, page choice, the screening and exclusion rules, share
counting and the t-test on small made-up inputs. `test_inference` checks the intervals, exact test,
adjusted p-values, bounds and agreement coefficient against published or hand-worked values, and checks
the tables built from the tracked results. None of the three needs collected data.
`test_tone` needs the lexicon files in `artifacts/lexicons/`.

The term list is `tools/terms.py`. It was fixed before any results were examined, and six patterns
were narrowed after the precision check below.

A full rebuild from the network takes about 2 hours of FEC Form 1 lookups and 5–6 hours of
Ballotpedia at 6-second spacing (candidate lists, profiles, 2024 district results and about 15
minutes of presidential seat tables), while Common Crawl takes under an hour. A rebuild will not match
the tracked `results/`, because live sites and Ballotpedia change. Every exclusion in
`results/excluded_sites.csv` and the reviewed keys in `analyze.py` (`REVIEWED_CAMPAIGN`,
`REVIEWED_NOT_CAMPAIGN`) must then be read again.

## Sources and access rules

- Ballotpedia: candidate lists parse from the state pages' "General election candidates" lists, and
  from vote boxes for Senate and at-large races (ranked-choice boxes differ). Possessives of states
  ending in "s" have no extra "s" in page titles ("Arkansas' 1st Congressional District election,
  2024"). Ballotpedia's AWS firewall answers HTTP 202 with an empty body (a JavaScript challenge)
  after roughly 150 requests at 2-second spacing. It recovered within about 20 minutes. Collect at
  6-second spacing from one process at a time and never work around the challenge.
- FEC: `federalelections2020.xlsx` and `federalelections2022.xlsx` (certified results) and
  `2024congressgecands.xlsx` (general ballot list) from fec.gov, saved in `artifacts/fec/`. As of
  2026-10-03 fec.gov had no 2024 congressional results workbook. Candidate master files
  `cn20.zip`–`cn26.zip` give each candidate's principal committee. FEC IDs in the ballot files can
  carry trailing whitespace or list several IDs for one candidate.
- FEC Form 1 filings: `docquery.fec.gov/cgi-bin/forms/<committee>/` lists filings without an API
  key, and `docquery.fec.gov/dcdev/posted/<id>.fec` returns the raw filing. The website is field 14
  of the F1 record. The fields are separated by `\x1c`, so split on newlines, not `splitlines()`.
  The OpenFEC API's `DEMO_KEY` allows only about 10 requests, which is too few.
- Presidential vote by seat (`seat_pres.py`). Ballotpedia carries these results, compiled by Daily
  Kos Elections for 2020 and by The Downballot for 2024:
  - The 2020 result on 2022 lines is in the "2020 presidential results by Congressional district"
    table on each state's 2022 district race pages. Louisiana's 2022 pages carry only each district's
    own one-row table.
  - The 2024 result on 2026 lines is in the "2024 presidential results in congressional districts"
    table on each state's 2026 House elections page. Missouri enacted a new map, but it was put on hold
    by a veto referendum, so its 2026 general uses the old map, and Ballotpedia's table follows the old
    map.
  - Statewide 2020 and 2024 results are on each state's "Presidential election in <state>, 2024"
    page. Alaska (2024) and Maine use ranked-choice boxes, whose first-round votes are used.

  Ballotpedia has no 2020 result on 2020 lines. The 2022 tables' "political predecessor" column does
  not name the old district, and Texas renumbered and merged districts, so it cannot be mapped by
  number. The 2024 race pages give only the 2020 result on 2024 lines. Nine states redrew between
  2024 and 2026 (Alabama, California, Florida, Louisiana, North Carolina, Ohio, Tennessee, Texas and
  Utah, per Ballotpedia's "Redistricting ahead of the 2026 elections"). For them, the 2024 result on
  2024 lines is on no Ballotpedia page. Daily Kos Elections and The Downballot publish their district
  results as shared Google Sheets, which this project does not open. The Downballot's public
  Datawrapper table (`datawrapper.dwcdn.net/RhIew/1/dataset.csv`) has already been updated to the
  2026 maps. The Wayback Machine holds only 2026 captures of that table.
- MIT Election Data and Science Lab returns on Harvard Dataverse: the Senate file
  (doi:10.7910/DVN/PEJ5QU) downloads freely, but the House file (doi:10.7910/DVN/IG0UN2) requires a
  guestbook form with personal details, so it is not used. 2024 results come from Ballotpedia's
  district race pages instead.
- Common Crawl is the main archive. The index server (index.commoncrawl.org) returned 504s under
  load, so `cc.py` binary-searches each crawl's `cluster.idx` (100–175 MB each, saved in
  `artifacts/ccindex/`) and range-fetches index blocks and WARC records from data.commoncrawl.org.
  That takes 1–5 seconds per candidate uncached. Crawls used: every crawl of the election year, eight
  in 2020 (2020-05 to 2020-45), five in 2022 (2022-05 to 2022-40), nine in 2024 (2024-10 to 2024-46,
  captures after election day dropped) and nine in 2026 so far (2026-04 to 2026-39). The 60-day window
  holds two crawls in 2020, one in 2022, three in 2024 and one in 2026.
- Wayback Machine: CDX at `web.archive.org/cdx/search/cdx`, raw captures at
  `web.archive.org/web/<timestamp>id_/<url>`. In October 2026 it returned 429 to browser-like user
  agents, refused connections for about 20 minutes after repeated 429s, and then allowed only about
  five requests per 10 minutes. It is not practical as a bulk source.
- Library of Congress web archive: behind a Cloudflare challenge, so it is not usable.
- Live 2026 sites: fetched directly at 1-second spacing per host.
- Washington's voter-guide API serves the 2020–2026 primaries and generals with full statement text.
  Primary election IDs are 865, 876, 888 and 898, and general IDs are 866, 877, 889 and 899. The API
  root is `https://voter.votewa.gov/elections`, and requests need a browser user agent.
- CampaignView (Porter, Case and Treul, *Scientific Data*, 2025; Harvard Dataverse
  doi:10.7910/DVN/JIEAPT, CC0) covers House primary candidates for 2018–2022 with hand-split,
  topic-coded issue points. It has no website URLs, no Senate, no independents, and no 2024 or 2026
  data. In it, "working families" appeared on about 31% of Democratic and 6–7% of Republican House
  primary candidates' sites in each of 2018, 2020 and 2022.

## Checks on the candidate list

- Ballotpedia lists 4,900 general-election candidacies (4,890 candidate-years once a candidate on a
  regular and a special Senate ballot counts once): 1,255, 1,187, 1,178 and 1,280 for 2020–2026.
  For 2020–2024 Ballotpedia and the FEC lists agree within five major-party candidates a year;
  Ballotpedia lists more minor-party candidates in 2024 (211 third-party and 53 independent against
  the FEC's 160 and 41). 4,821 rows carry an FEC ID.
- Louisiana's 2026 House races hold a November 3 all-party primary with a December 12 general,
  because the Supreme Court's *Louisiana v. Callais* ruling led the state to cancel its new partisan
  House primaries. The study treats that November ballot like Louisiana's 2020–2024 all-party
  primaries. Louisiana's Senate race uses the new party system and has a normal November general.
- Lindsey Graham died in 2026; his sister Darline Graham holds the South Carolina seat and is the
  Republican nominee. Ballotpedia's record of this is correct.
- A Washington primary test (2022, 2024 and 2026, 204 candidates) found Wayback captures of an
  issues page within 30 days before the primary for about 29% of 2022 candidates and about 70% of
  2024 and 2026 candidates.

## Design decisions

- All four years draw their candidate lists from Ballotpedia. FEC lists are a cross-check only.
  Candidates whom the FEC's certified 2020 and 2022 results list as unopposed in the general are
  dropped (`match_fec.unopposed`), because Florida and Louisiana do not print such races on the
  ballot; only Mike Johnson (Louisiana 4th, 2022) was on Ballotpedia's lists.
- FEC IDs come from FEC's own general-election list when the candidate is on it (the master files
  hold duplicate registrations), otherwise from the candidate master file for that cycle. Names match
  on last name, then first name, with spaces ignored ("Grey Bull" and "GreyBull").
- Website order: FEC Form 1 for that election, then the campaign site Ballotpedia quoted for that
  year, then the current Ballotpedia link. Wayback links quoted by Ballotpedia are unwrapped to the
  original address. Social-media, donation, Ballotpedia and official House or Senate addresses are
  skipped (`sites.clean_site`).
- Every year is analyzed from archived text (January 1 of the election year to election day, the latest
  capture of each page, homepage plus up to three linked pages), and only pages of the candidate-year's
  current site count. This is the window that saves the most sites (analysis plan, Amendments 4 and 6); it
  has no published standard. The 60-day and 120-day windows are collected the same way and compared in
  `windows.py`.
- Screening (`analyze.py`): paragraphs of page code, gambling spam, placeholder Latin and Spanish are
  dropped. A candidate-year is excluded as not campaign content when what remains is under 100 words
  but the dropped text would have reached it, when spam outweighs the rest, when hosting-error or
  parked pages make up a short site, or when the text has neither the candidate's name nor any
  campaign word. One flagged site (Chris Russomanno, 2022) was kept after hand review, and two sites
  that pass the screen are excluded (`analyze.REVIEWED_NOT_CAMPAIGN`). Each of the 20 exclusions in
  `results/excluded_sites.csv` was read and confirmed: Robin Kelly 2020–2024, Eugene Yu 2024, Dayna
  Steele 2024 and Nathan Lewis 2024 (unrelated content or a for-sale notice on lapsed domains), Marcy
  Kaptur 2020 and Lynnette Grey Bull 2022 (supplement and gambling spam), Ted Lieu 2024 and 2026
  (gambling spam), Terri Sewell 2020, Adrienne Bell 2020 and Michael McCaul 2022 and 2024 (hosting
  errors), James Comer 2022, Vicente Gonzalez 2022, Glenn Thompson 2022 and La'Ron Singletary 2022
  (unfinished templates, under 100 words without the placeholder text), and Rhonda Hart 2026 and
  Christian Maxwell 2026 (only site-builder page titles, each with the same site description). Seven
  candidate-years excluded under the 60-day window are analyzed under the election-year window, each
  read and confirmed as campaign text: Joe Mackey 2020, Glenn Thompson 2024, Rebecca Whiting 2024, Ronald
  Russell 2026, George Austin 2026, Melissa Strange 2026 and Ndidiamaka Okpareke 2026. Christy
  Peterson's 2026 site carries injected gambling spam after a hack; the spam paragraphs are dropped and
  the rest is analyzed.
- The live 2026 crawl is a check, not the main source. Live shares run about one point higher than
  archived shares on average (higher for 77 of 114 term-party shares), and the partisan gaps agree
  closely (correlation 0.99 across the 57 terms).
- Terms are counted as the share of candidates using a term at least once, so long sites do not
  dominate.
- Distinctive words and phrases are ranked by Welch's t-test on each candidate's relative frequency,
  with candidates as the units (Lijffijt et al. 2016), and no words removed beforehand; see
  `METHODS.md`.

## Results (exploratory)

The findings were chosen after viewing results for all 57 terms, so the report labels them
exploratory. Shares are of each party's analyzed candidates.

- Democrats: "working families" 32% (2020) to 39% (2024) and 55% (2026), "middle class" 31% to 24–27%
  from 2022 on, "working people" 15% to 26%. In 2026, "billionaires" 28% (5–9% before), "tariffs" 22%
  (1–4%), "corporations" 48% (32–36%). "Reproductive freedom or rights" 14% to 52% in 2024, then 36%.
  "Freedom" 23% to 53% in 2024, then 46%. "Democracy" 29% to 42–47% from 2022 on. "Climate" 50–51%
  through 2024, then 34%. "Housing" 37% to 63%.
- Republicans: "inflation" 3% to 41% (2022) and 40% (2024), then 28%. "Working families" 10–12%
  through 2024, then 34% in 2026; 7 of the 104 sites use it only in the name of the "Working Families
  Tax Cut", and without them the share is 31%. "Pro-life" or "unborn" 39% to 32% (2024) and 26% (2026),
  "abortion" 26–27% to 16% in 2026, "health care" 63% to 45–47% from 2022 on. "Freedom" held at 52–54%.
- Both parties: "artificial intelligence" 15% of Democrats and 9% of Republicans in 2026, 4% or less
  before. "Cost of living" rose steadily in both, from 6% to 22% of Democrats and 3% to 14% of
  Republicans.
- Returning candidates (`results/term_shares_panel.csv`, 578 candidates analyzed in two or more
  years): the Republican shifts hold, and the 2026 Democratic shifts are smaller. Among them "working
  families" went 35% (2020) to 46% (2026), "climate" stayed at 49%, and "billionaires" reached 16% and
  "tariffs" 12%, so those 2026 shifts come partly from new candidates.
- Selection (`results/selection.csv`): in every year analyzed candidates are more often incumbents
  and more often won than unanalyzed ones (2024 Democrats: 48% against 34% incumbents, 56% against
  38% won), and analyzed Democrats more often ran in close races. The results lean toward incumbents
  and winning campaigns.
- Seat partisanship by presidential vote (a close seat has a Democratic two-party presidential share of
  45–55%): in 2022, 22% of analyzed Democrats ran in close seats against 12% of unanalyzed ones, and
  19% against 16% for Republicans. In 2026 the shares were 21% against 9% for Democrats and 20%
  against 15% for Republicans. So the tilt toward competitive seats is not just a product of the race
  vote, and it reaches Republicans as well. The seat measure correlates 0.97–0.99 with the race's own
  two-party vote where both exist. Coverage: all 2022 and 2026 candidate-years; for 2020, only Senate
  and at-large seats; for 2024, Senate and the 41 states that kept their lines. The report shows only
  the complete years.
- Gaps between the parties (`results/term_gaps.csv`): 138 of the 171 term-year comparisons in 2020, 2022
  and 2024 have an adjusted p-value below 0.05 by the Benjamini-Hochberg method (adjusted over those 171),
  so most are large. 2026, adjusted on its own, has 48 of 57, provisionally. The 2022 gap in
  "abortion" is not: 28% of Democratic and 27% of Republican candidates, a gap of 2 points with a 95%
  interval of −5 to 9 points and an adjusted p-value of 0.70. In 2020 the gap favored Republicans by 16
  points, and in 2024 it favored Democrats by 19.
- Stable and changing words (`results/term_classes.csv`, `results/term_changes.csv`; exploratory, because the
  gaps were seen before the rule was fixed): 39 of the 57 terms are split between the parties in the same
  direction in 2020, 2022 and 2024 with adjusted p-values below 0.05. Of these 28 are also still (no
  within-party change with an adjusted p-value below 0.05), including "climate", "working families",
  "billionaires" and "Second Amendment" for their parties, and 11 are split and moving, including
  "border", "health care", "housing", "Trump" and "reproductive freedom / rights". Of the 18
  that are not consistently split, 10 move, including "inflation", "abortion" and "freedom". Only 30
  of the 228 within-party changes have an adjusted p-value below 0.05.
- Worst-case ranges (`results/term_bounds.csv`): because about 28% of Democratic and Republican candidacies are not analyzed, the
  share of all candidates on the ballot who used a term can lie anywhere from the share of the whole
  ballot that analyzed candidates account for to that plus the unanalyzed fraction. For Republican
  "inflation" in 2022, 41% of analyzed candidates used it, and the range for candidates with a known
  website is 30% to 58%.
- Match precision (`results/term_matches_coded.csv`, `results/term_precision.csv`): 20 random users
  per finding term were hand-coded at one random match each. The prespecified patterns for inflation
  (Inflation Reduction Act), corporations (biographies, company names), health care (job
  descriptions) and artificial intelligence (text-message consent boilerplate, degree names) fell
  below 90%. Those four, plus freedom (Freedom Caucus, Medal of Freedom, Freedom Act) and climate
  ("business climate" and similar), were narrowed and recoded on a fresh sample, and a narrowed term's
  precision comes from that sample alone (`precision.py`, with 95% Wilson intervals). Every finding
  term measures 18 of 20 or better except "freedom", 17 of 20 (85%), whose misses are award and
  endorser names. Excluding the Inflation Reduction Act lowered Democrats' "inflation" from 25% to 16%
  in 2024. The coded samples were drawn from the 60-day text.
- Collection window (`results/term_shares_windows.csv`, `results/coverage_windows.csv`): the
  election-year window analyzes 185 more Democratic and Republican candidate-years in 2020–2024 than the
  60-day window. For the same candidates, 2022 shares rise most, because the 60-day window holds one 2022
  crawl and gave shorter text; the largest move is Republican "Second Amendment", 35% to 46%.

## Method standard

These rules govern every part of the study, including collection, cleaning, term counting, sentiment
and tone. `METHODS.md` records each decision, the standard it follows and its source.

- Every decision of method or implementation follows an established, citable standard in the
  relevant literature or in the documentation of the standard tool, and `METHODS.md` records the
  decision, the standard and its source. A decision with no such basis is researched first, and where
  the literature offers no standard, the choice and the reason for it are stated as a limitation.
- Every measure is repeatable: a fixed word list, a written rule or a published lexicon run by code,
  giving the same output each time on the same text. No language model or trained neural classifier
  labels or scores the text, and no model checks the hand coding.
- Sentiment analysis follows the standard practice for sentiment in political text. Gale Digital
  Scholar Lab scores documents with AFINN, a lexicon built on Twitter posts, so it is not used; see
  `METHODS.md`.
- Tool versions are pinned, and every lexicon and script file is checked against a SHA-256 hash.

## Tone measures (built, not validated)

Everything is in `tools/tone.py`, checked by `tools/test_tone.py` against the Lexicoder documentation's
own examples. It is implemented in Python; R's quanteda is the reference implementation of the
dictionary.

- Sentiment: the Lexicoder Sentiment Dictionary (LSD2015; Young and Soroka 2012), the standard
  dictionary for political text. Each sentence is preprocessed by Lexicoder's R preprocessing script
  (Luxon 2017), whose 1,293 replacement rules `tone.py` reads from the distributed file and applies in
  the script's order, including its optional proper-noun marking, which matches Young and Soroka's
  removal of capitalized words. Counts are combined by the LSD codebook's negation rule and summed per
  candidate-year, the document level the codebook requires. The score is
  log((positive + 0.5) / (negative + 0.5)) (Proksch et al. 2019; quanteda.sentiment's default), with
  Young and Soroka's net tone, (positive − negative) / words, beside it.
- Tone toward the opponents and toward the other party: the same LSD counts from only the sentences
  that name them, summed per candidate-year, following Young and Soroka's party and leader measure.
  Opponents are the other candidates on the same ballot, by full name or surname. The other party is
  each major party that is not the candidate's own, by party name and by its national leaders from
  January 2019 to October 2026: presidents, vice presidents, the 2020 and 2024 presidential tickets,
  Speakers, and House and Senate floor leaders (history.house.gov and senate.gov lists).
- Threat: the percentage of words in the threat dictionary (Choi et al. 2022), the authors' own
  measure.
- Incivility is set aside.
- Cleaning: the extracted paragraphs are filtered by C4's line rules (under 5 words; "javascript" or a
  cookie or policy string; Raffel et al. 2020), then split into sentences by pysbd within each
  paragraph (Read et al. 2012; Sadvilkar and Neumann 2020). Candidate-years under the study's 100-word
  minimum after the line rules get no scores.
- Outputs: sentence counts in `artifacts/data/tone_sentences.jsonl` (ignored) and per candidate-year
  scores in `results/tone_scores.csv`.
- Coverage: of 234,209 extracted lines, 81,007 had under 5 words and 505 carried javascript or policy
  text, leaving 286,416 sentences. 3,086 of the 3,102 analyzed candidate-years are scored (16 fall
  under 100 words after the line rules). 656 scored candidate-years have at least one sentence naming
  an opponent, and 1,722 at least one naming the other party or its leaders.

The LSD files are licensed by McGill for academic research only, may not be modified or shared, and
publications must acknowledge that the dictionary was developed at and licensed from McGill. They
stay in the ignored `artifacts/lexicons/lsd/`; downloading them accepts the license.

The tone measures are not validated. Before any tone result is reported, they must be validated
against human coding as `METHODS.md` describes: a random sample of 100 to 300 candidate-year sites
coded at the site level by at least two coders. `tools/tone_codebook.md` was written for
sentence-level coding and must be rewritten for site-level coding first.

## Limitations

- 843 of the 3,616 major-party candidates with known websites (23%) yielded no archived text from
  the window. The Wayback Machine could fill some of these, but only as a slow multi-day trickle at
  its current limits.
- Ballotpedia's quoted website text is collected in `bp_profiles.jsonl` but not analyzed.
- The presidential seat measure is missing for 2020 House seats (1,080 candidate-years) and for 2024
  House seats in the nine states that redrew for 2026 (384 candidate-years).
- `METHODS.md` lists each choice that has no published standard.
