# How the study works

This is for you to read before anything is written in your name. It explains the whole study in plain
words: what it asks, where each number comes from, what each tool does, what the results show and what
they do not show. Every technical word is explained where it first appears, and there is a glossary at
the end. Numbers come from the files in `results/` as of 2026-10-07. The 2026 numbers are provisional,
so this walkthrough concentrates on 2020, 2022 and 2024.

If any sentence here is unclear, that is a defect in this document and not in your understanding. Ask,
and I will rewrite it.

## 1. The study in one paragraph

Every two years, hundreds of people run for the U.S. House and Senate, and almost all of them have a
campaign website. The study collects the text of those websites for 2020, 2022, 2024 and 2026. It then
counts how many candidates of each party used each of 57 chosen words and phrases, such as "working
families", "inflation" or "abortion", and compares the parties and the years. For example, in 2020 about
3 in 100 Republican candidates mentioned inflation on their website. In 2022 it was about 39 in 100.

## 2. What question this answers, and why it is worth asking

The question is what candidates say on their own websites, and how that changes from one election to the
next. A campaign website is the one place a candidate controls completely. It is not filtered by a
reporter, cut down to a clip, or shaped by a debate question. That makes it a clean record of what a
campaign chooses to put in front of voters.

The study does not explain why candidates say what they say. It does not measure whether voters read the
sites or whether the words win votes. It describes, carefully, what is on the sites. The Honors
documents later turn this into research questions, and that choice is yours to make. This walkthrough
only covers what the study already does.

## 3. The steps, in order

The tools in `tools/` run in a fixed order. Each step takes the output of the one before it.

### Step 1. Decide who counts

**What goes in:** Ballotpedia, a public encyclopedia of U.S. elections, and the Federal Election
Commission (FEC), the federal agency that records every candidate's campaign filings.

**What happens:** For each election year, the tool reads Ballotpedia's page for each state and takes
everyone listed as a general-election candidate for the House or Senate. The general election is the
November vote between the nominees. Write-in candidates are left out. A "candidate-year" is one person
in one election year, and it is the unit the study counts. A person who runs in 2020 and 2024 is two
candidate-years.

**Why Ballotpedia and not the FEC list:** Ballotpedia has one list format for all four years, including
2026, when the FEC has not yet published a list. The study uses the FEC's official lists for 2020, 2022
and 2024 only as a cross-check. They agree within five major-party candidates a year.

**Two special cases you should know:**
- Florida and Louisiana do not print a race on the ballot when only one candidate qualified. Such a
  candidate is dropped, because they were never on a November ballot. That removed one candidate from
  Ballotpedia's list, Mike Johnson in Louisiana's 4th District in 2022.
- Louisiana held an all-party election in November through 2024 and runs a December runoff. The study
  treats the November vote as the general election, which is how the FEC's own tables treat it.

**Party groups:** The study covers Democratic and Republican candidates. Democratic includes Minnesota's
DFL party. A candidate who runs on several lines (common in New York and Connecticut) is counted once,
under their major party. Independent and third-party candidates (Libertarian, Green and others) are
outside the study, although the tools still collect them.

### Step 2. Find each candidate's website

The FEC requires every campaign committee to file a form when it registers, and the form includes a
website address. The study reads that address first. If the form has none, it uses the website that
Ballotpedia quoted for that year, and then the link Ballotpedia shows now. Social media pages, donation
pages and official House or Senate pages are skipped, because they are not the campaign's own site.

### Step 3. Get the text of each site, as it looked before the election

This is the step that most needs explaining, because the websites change all the time, and the study
needs each site as it was before the election, not as it is today.

**The 60-day window:** For each year the study takes text only from the 60 days before election day. For
2020 that is roughly September 4 to November 3. The window is the study's own choice. The published work
on campaign websites used windows from one month to the last ten days.

**Where the old pages come from:** The study uses web archives. An archive is an organization that saves
copies of web pages at certain dates. The main one is Common Crawl, a nonprofit that visits a large part
of the web every month or so and publishes what it found. The study looks inside Common Crawl's saved
pages for each candidate's site and keeps only captures dated inside the window. The Wayback Machine, the
Internet Archive's older and more famous service, is used for a few gaps, but it limits how fast a
person can ask it for pages, so it supplied almost nothing. Of the 2,753 candidate-years that ended up
analyzed, 2,751 came from Common Crawl and 2 from the Wayback Machine.

**Which pages:** A site can have hundreds of pages. The study takes the homepage plus up to three other
pages linked from it, preferring pages whose address suggests an issues page or a biography page ("issues",
"priorities", "about", "meet") and skipping donation, volunteer, shop, contact and event pages. If a page
was captured more than once in the window, the study uses the latest capture.

**Extracting the text:** The saved page is raw web code. A program called trafilatura, which is widely
used for this job, pulls out the main text of the page and drops menus and footers. Pages are processed
one at a time, because the program gave a slightly different answer once when it ran several pages at the
same time. Running the whole pipeline twice now gives byte-for-byte identical text.

### Step 4. Clean the text and decide which sites count

Raw extracted text still contains junk. The study removes whole paragraphs that are:
- page code that leaked into the text,
- gambling or pill spam that hackers inject into abandoned sites,
- placeholder Latin ("lorem ipsum", which web designers leave in unfinished templates),
- Spanish, because the 57 terms are English. Spanish paragraphs are found by counting common Spanish and
  English words. A separate program, langid, was run as a check, and it agreed with this rule on 871 of
  the 889 paragraphs the rule dropped.

A paragraph that appears twice on one candidate's site is counted once.

Then each candidate-year has to pass these tests to be analyzed:
- It must have at least **100 words** left after cleaning. Fewer than that is too little to say what a
  campaign talks about. The number follows the minimum used in a text-analysis tool called LIWC, and no
  standard exists for political sites. The study checked 50 and 200 words, and no term in the findings
  changed its share by more than 2.3 percentage points.
- It must not be a hosting error ("this domain is for sale"), and it must contain either the candidate's
  name or at least one campaign word such as "voters" or "district".
- Every one of the 23 sites this removed was read by hand and confirmed.

### Step 5. Count the 57 terms

This is the core measurement. The list of 57 terms is in `tools/terms.py`, grouped into five themes:
economy and class, opponents and politics, rights and values, security and immigration, and programs
and policy. The list was written before any results were looked at.

Each term is a pattern that a program searches for, ignoring capital letters. A pattern can cover
variants. For example, the "working people" pattern also matches "working men and women".

A candidate **uses** a term if it appears at least once anywhere in their collected text. The study
then reports the **share**: the number of candidates using the term, divided by the number of
candidates analyzed in that party and year.

**A worked example.** In 2020, 344 Democratic candidates were analyzed. 114 of them used "working
families" at least once. 114 divided by 344 is 33%. In 2024, 116 of 292 did, which is 40%.

Counting "at least once" and not "how many times" is deliberate. A candidate with a very long site would
otherwise count for much more than one with a short site. The cost is that a term used once in passing
counts the same as one the candidate hammers on. Keep that in mind when reading any share.

### Step 6. Checking that the counts mean what they claim

A pattern can match the wrong thing. The checks below are how the study finds out.

**Match precision.** For each term that appears in the findings, 20 candidate sites were drawn at random
from those using the term, and one match from each was shown in its surrounding sentence. One person
read the 20 and marked whether the match was the meaning the term is supposed to capture. For
"working families" all 20 were right. For "inflation", the first test caught the "Inflation Reduction
Act", a law, which is not talk about prices rising. The pattern was changed to skip it, and a fresh sample
of 20 was read. The same happened with "freedom" (Freedom Caucus, Medal of Freedom), "climate" ("business
climate"), "corporations", "health care" and "artificial intelligence". Every term in the findings now
scores 18 of 20 or better, except "freedom" at 17 of 20 (85%). Each precision comes with a 95% interval,
which is a range showing how uncertain a figure based on only 20 cases is. With 20 cases, 18 right
means the true rate is somewhere between about 70% and 97%.

The study does not yet check the opposite error, called **recall**: how many real uses of an idea the
pattern misses because the candidate used different words. This is one of the open items.

**Candidates who were analyzed versus those who were not.** Only 56% of candidate-years ended up
analyzed. The rest had no usable site or no archived copy. The study compares the two groups. In
every year, the analyzed candidates are more often incumbents (already in office) and more often won.
For example, in 2024, 49% of analyzed Democrats were incumbents against 34% of unanalyzed ones. A
likely reason is that Common Crawl favors well-known, well-linked sites, as published work on it
reports. This is the most important
limit on the results, and it is covered in section 5.

### Step 7. Phrases that separate the parties

The 57 terms are the study's own list, so a reader could ask what it missed. The study also lets the data
speak. For each year it counts every word and every two- and three-word phrase on each site and asks,
for each one, whether Democrats and Republicans use it at clearly different rates.

**How:** For one phrase, each candidate gets a rate: how often the phrase appears divided by how many
phrases the site has in total. Then the study compares the average rate of the Democrats with the average
rate of the Republicans using **Welch's t-test**. The t-test produces a score. The score is large when the
two averages are far apart compared to how much candidates inside each party vary from one another. A
large score means the gap is unlikely to be a fluke of which candidates happened to be in the sample.
Phrases are ranked by this score, and the top 40 for each party are saved.

**What it shows:** In 2020, the top Democratic phrases were "access to", "climate change", "gun
violence", "public schools" and "Affordable Care Act". The top Republican phrases were "second
amendment", "right to life", "bear arms", "the unborn" and "illegal immigration". In 2024 the Democratic
list had "working families", "our democracy", "reproductive freedom" and "reproductive rights", and the
Republican list had "illegal immigration", "secure our", "president Trump" and "the Biden".

Some of those phrases overlap ("affordable care" and "affordable care act" are the same idea). The study
does not merge them. It lists the top 40 without correcting for the fact that thousands of phrases were
tested at once, which means a few high scores can still be chance. The study says so.

### Step 8. Tone (built, but not yet usable)

The code also measures sentiment (how positive or negative the wording is) using the Lexicoder Sentiment
Dictionary, a published list of words scored positive or negative that political scientists use for
political text. It also measures tone in sentences that name an opponent or the other party, and the
share of words that signal threat.

**None of this can be reported yet.** A word-list method is only trustworthy if it has been checked
against how people actually read the same sites. That means at least two people reading a random sample
of 100 to 300 sites and scoring them, and then comparing their scores to the program's. That has not been
done. Until it is, no tone figure appears anywhere.

## 4. What the results show for 2020, 2022 and 2024

All figures are the share of that party's analyzed candidates who used the term at least once.

| Term | Democrats 2020 / 2022 / 2024 | Republicans 2020 / 2022 / 2024 |
| --- | --- | --- |
| inflation | 3% / 15% / 15% | 3% / 39% / 40% |
| abortion | 10% / 29% / 38% | 26% / 21% / 22% |
| border | 19% / 13% / 28% | 55% / 56% / 67% |
| climate | 49% / 49% / 47% | 10% / 8% / 9% |
| working families | 33% / 35% / 40% | 10% / 10% / 11% |

**Reading the table:**
- **Inflation** went from rare in 2020 to common in both parties by 2022, and far more so among
  Republicans. Prices rose sharply in 2021 and 2022, which fits the pattern, but the study does not test why. In 2024 the
  Democratic figure falls from 24% to 15% when the Inflation Reduction Act is excluded, which is why the
  pattern was changed.
- **Abortion** is the clearest swap. It was mostly a Republican topic in 2020. The Supreme Court
  overturned *Roe v. Wade* in June 2022, and Democratic use rose from 10% to 29% that year and to 38%
  in 2024, while Republican use stayed near 21 to 22%. The study cannot show that the ruling caused
  the rise.
- **Border** is a Republican topic every year, and Republican use rose in 2024. Democratic use dips in
  2022 and rises in 2024.
- **Climate** is steady for Democrats at about half and low for Republicans.
- **Working families** is a Democratic phrase that Republicans barely use before 2026.

**What this does not mean:** None of these shows that a party changed its mind. It shows how many of the
sites that could be analyzed mentioned a word. A different set of candidates ran each year, and the sites
that could be analyzed are not a random sample of all sites (section 5).

The report also contains 2026 figures. They are provisional: they rest on a September snapshot, and the
campaign runs until November 3. In that snapshot, "billionaires" among Democrats rose from 9% in 2024 to
25%, and "tariffs" from 2% to 18%. These will be updated when the 2026 capture is finished.

## 5. What the results cannot tell us

These limits belong in the paper. A reader who finds one that you did not state will trust the rest
less.

1. **The sites analyzed are not all sites.** 56% of candidate-years are included. Analyzed candidates
   skew toward incumbents, winners and candidates in close races, because well-known sites are more
   likely to be archived. The results describe those candidates best. No adjustment for this is made yet.
2. **A website is not a campaign.** Candidates also speak, advertise and post. The results describe
   websites only.
3. **"Uses at least once" is not emphasis.** A passing mention counts the same as a central theme.
4. **The window and pages are chosen by the study.** Homepage plus three pages from the 60 days before
   the election. Different choices would give somewhat different numbers. No standard fixes them.
5. **Archives are patchy.** Common Crawl saves a random subset of a site's pages. Candidates with
   obscure sites are less likely to have been saved at all. 30% of major-party candidates with a known
   website had nothing archived from the window.
6. **The 57 terms are one researcher's list.** It was written before looking at results, but a different
   researcher would pick different terms, and the list has not been checked for what it misses.
7. **The headline findings were chosen after looking.** The report shows terms that stood out in the
   results for all 57, so they are labelled exploratory. Exploratory means found while looking, as
   opposed to confirmatory, meaning predicted in advance and then tested. Labeling them honestly is
   required. A finding picked after seeing the data can look stronger than it is.
8. **Uncertainty ranges.** The report used to say changes smaller than about 8 points may be noise,
   with no source. It now shows a 95% range for every share and, for every Democratic minus Republican
   gap, a range and an adjusted p-value (a p-value corrected for running 228 comparisons at once). Out of
   the 228, 180 are clear gaps after that correction. One that is not: abortion in 2022, 29% of
   Democratic and 21% of Republican candidates, a gap of 7 points that could be anywhere from 0 to 14.
   These ranges describe chance only. They do not cover the candidates whose sites could not be analyzed,
   which a separate table bounds.
9. **Independents and third parties are outside the study.** Nothing here says anything about them.
10. **The match checks have limits.** Twenty cases per term, read by one person, with a 90% cutoff that
    no source fixes.

## 6. What is done and what is not, before 2026

**Done and checked:**
- Uncertainty ranges for every share and gap, adjusted p-values for all 228 comparisons, and worst-case
  ranges for the unanalyzed candidates, with tests of the formulas.
- A written analysis plan fixing the hypotheses and tests before further analysis.
- The candidate lists for 2020, 2022 and 2024, cross-checked against the FEC.
- Website addresses, archived text and cleaning, with every exclusion read by hand.
- The 57-term counts, with precision checks and a language check.
- A comparison of analyzed against unanalyzed candidates.
- Distinctive phrases by party.

**Not done:**
- A second person checking term precision, so agreement between two coders can be reported.
- A check for terms the list misses (recall).
- An adjustment or bound for the skew toward incumbents and winners.
- Writing down, with a date, which patterns of change are expected before analyzing again.
- Validating the tone measures.
- The research questions, the literature review, the paper, the public page, and the Honors documents.

## 7. Questions you should be able to answer

If you can answer each of these in two or three sentences without this page, you understand the study.
If you cannot, tell me which one, and I will explain it again differently.

1. What is a candidate-year, and why is it the unit?
2. Where does the list of candidates come from, and why does Ballotpedia and not the FEC supply it?
3. What is the 60-day window, and why does the text need to come from it?
4. What is Common Crawl, and why does it matter that it saves only a part of the web?
5. Which pages of each site are used?
6. Why are some candidate-years left out, and what is wrong with only studying the rest?
7. What does "a candidate uses a term" mean, and what does the share tell you?
8. What does the precision check measure, and what does it not measure?
9. What is recall, and why is it not checked yet?
10. What does "exploratory" mean, and why do the findings carry that label?
11. How does the t-test turn two groups of candidates into a ranked list of phrases?
12. Why can no tone result be reported yet?
13. What can you say about abortion in 2020 versus 2024, and what can you not say?

## Glossary

- **Archive:** An organization that saves copies of web pages at specific dates.
- **Candidate-year:** One person in one election year. The unit that the study counts.
- **Common Crawl:** A nonprofit that crawls much of the web every month and publishes the results. The
  study's main source of old page text.
- **Confirmatory and exploratory:** A result is confirmatory if it was predicted before the data were
  examined. It is exploratory if it was found by looking.
- **Crawl:** A program that visits web pages and saves them.
- **FEC (Federal Election Commission):** The federal agency that records the finances and filings of
  every federal candidate.
- **General election:** The November election between party nominees.
- **Incumbent:** A candidate who already holds the seat.
- **Interval (95%):** A range showing how uncertain a figure is. A narrow range means the figure is
  well pinned down. A wide range means it could be quite different.
- **Lexicoder Sentiment Dictionary:** A published list of words scored positive or negative, built for
  political text.
- **Panel:** The group of candidates who appear in more than one year, so that the same person can be
  compared with themselves over time.
- **Precision:** Of the matches a pattern finds, the share that really mean what the term is meant to
  mean.
- **Recall:** Of all the real uses of an idea in the text, the share that the pattern finds.
- **Share:** The number of candidates using a term, divided by the number of candidates analyzed.
- **Term:** One of the 57 words or phrases the study counts.
- **trafilatura:** A program that pulls the main text out of saved web pages.
- **Wayback Machine:** The Internet Archive's service for old copies of web pages.
- **Welch's t-test:** A way of asking whether the average rate of a word differs between two groups by
  more than the variation inside the groups would produce by chance.
