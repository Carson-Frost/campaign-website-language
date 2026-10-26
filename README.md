# Campaign website language

Which words and phrases U.S. House and Senate general-election candidates used on their campaign
websites in 2020, 2022, 2024 and 2026, compared between Democratic and Republican candidates.

The measure is term usage: the share of a party's candidates whose site used a term at least once.
The unit is the candidate-year. The candidate list is every candidate on a November general-election
ballot, House and Senate, excluding write-ins, from Ballotpedia. Independent and third-party
candidates are outside the study. Site text comes from Common Crawl for every year, with a few
analyzed sites from the Wayback Machine, collected between January 1 of each election year and
election day.

The project is three things:

| | |
| --- | --- |
| `tools/` | The code that collected and cleaned the data, plus its tests. |
| `results/` | The tracked result tables the project produced. |
| `site/` | frontend interface showing the charts |

## The documents

| | |
| --- | --- |
| [RELATED-WORK.md](RELATED-WORK.md) | The five studies closest to this one, how this one differs, and the full reference list. |

## The site

From the project root:

```text
artifacts/.venv/Scripts/python site/build_data.py
python site/serve.py --detach
```

That serves http://127.0.0.1:8765/. `build_data.py` reads only the tracked `results/` tables and the
project's own code, and writes the data the pages read into the ignored `artifacts/site-data/`, so a
result never exists in two places. `serve.py --detach` runs in the background and prints the address;
it also offers the `results/` tables as downloads under `/files/`, with independent and third-party
rows removed.

## The data

Of 3,712 Democratic and Republican general-election candidate-years, 3,616 have a usable campaign
website, 2,773 yielded some saved text, and 2,701 yielded at least 100 words of campaign text from the
election year. 19 were excluded as not campaign content, leaving **2,682 analyzed**. The 843
candidate-years with a website and no saved text are the largest gap: no archive saved a usable copy
inside the window.

Coverage of analyzed candidates, as a share of those on the ballot:

| Year | Democratic | Republican |
| --- | --- | --- |
| 2020 | 370 of 482 (77%) | 353 of 462 (76%) |
| 2022 | 317 of 454 (70%) | 322 of 462 (70%) |
| 2024 | 316 of 453 (70%) | 335 of 458 (73%) |
| 2026 | 360 of 476 (76%) | 309 of 465 (66%) |

2026 is a mid-campaign snapshot from crawls of January to September 2026 and will change when the
final capture is analyzed.

## How the data was collected

Tools run from `tools/` with the project virtual environment (`artifacts/.venv/Scripts/python`;
packages in `requirements.txt`). Every network fetch is cached under `artifacts/cache/`, so reruns are
cheap and every collector resumes where it stopped. `artifacts/` is not in Git. Run in this order.

| Step | Tool |
| --- | --- |
| Candidate lists from Ballotpedia | `universe.py 2020 2022 2024`, `universe.py 2026` |
| FEC candidate IDs, and the FEC list as a cross-check | `match_fec.py`, `fec_universe.py` |
| Campaign websites from FEC Form 1 | `fec_websites.py` |
| Ballotpedia pages: website link, quoted text, survey answers | `bp_profiles.py [lists]` |
| Merge into the collection list | `build_input.py` |
| Site text from Common Crawl, and its two comparison windows | `cc.py 2020 2022 2024 2026`, `cc.py --window 120 ...`, `cc.py --window year ...` |
| Site text from the Wayback Machine, or live 2026 sites | `sites.py archived`, `sites.py live` |
| Election results and presidential vote by seat | `vote_results.py`, `seat_pres.py` |
| Washington voter-guide statements | `wa_statements.py` |
| Screening, term shares, distinctive phrases, examples, checks | `analyze.py` |
| Match precision from the hand-coded sample | `precision.py` |
| Spanish paragraph rule checked against langid.py | `check_language.py` |
| Intervals, gap tests, adjusted p-values and bounds | `inference.py` |
| Stable and changing words | `questions.py` |
| Shares under the three collection windows | `windows.py` |

Page text extraction is serial, because trafilatura shares one parser across threads, and repeated
full runs give byte-identical page text and results (SHA-256).

The page text can be rebuilt without the network, because `pages_*.jsonl` store only extracted text
while the raw inputs stay cached. Move the old `pages_*.jsonl` aside, then run `cc.py 2020 2022 2024
2026`, `sites.py archived` and `sites.py live` with `OFFLINE=1` set: a cache miss then raises instead
of fetching. A full rebuild *from the network* will not reproduce the tracked `results/`, because live
sites and Ballotpedia change.

## Tests

From `tools/`:

```text
python -m unittest test_terms test_pipeline test_inference test_questions
```

`test_terms` checks the 57 patterns against every hand-coded match. `test_pipeline` checks party
grouping, website handling, page choice, screening and exclusion rules, and share counting.
`test_inference` checks intervals, the exact test, adjusted p-values and bounds against published or
hand-worked values. None needs collected data.

The term list is `tools/terms.py`. It was fixed before any results were examined, and six patterns
were narrowed after the precision check.

## Limitations

Findings are exploratory: they were chosen after looking at all 57 terms, so the site labels them so.
Coverage is 66% to 77% of the ballot depending on year and party, and the missing candidate-years are
not missing at random, since smaller campaigns are archived less. One text source means one source's
crawl schedule.

