# Glossary

Plain-language definitions of every term the study uses, in alphabetical order.

## Terms

### 2026

The 2026 figures come from copies of campaign sites saved from January 1 up to the newest copy the study has. The campaigns run until election day on November 3, so these figures will change. The hatching on a chart marks 2026.

### 95% Interval

The range a share could plausibly take, given which candidates were analyzed, drawn as a band on the chart and written as two percentages. "95%" means that if candidates were sampled this way over and over, about 95 of every 100 such ranges would hold the true share. It reflects chance among the candidates analyzed and does not cover candidates who could not be analyzed. A gap's range is its Gap Interval, and a change's is its Change Interval.

### Adjusted P-Value

A p-value is how likely a gap this large, or larger, would be if the two parties used the term equally often, so a small one suggests the gap is not just chance. With 57 terms tested, some gaps would be large by luck alone, so each p-value is adjusted for testing many terms at once, across all 57 terms with 2020, 2022 and 2024 together and 2026 apart. Among the gaps with this adjusted value or a smaller one, no more than this share are expected to be only chance, so smaller is stronger evidence. That holds when one term's result does not affect another's, which may not be true of terms sites use together, so the downloads also give the more cautious Benjamini-Yekutieli value. A gap has one only among all candidates, with no filters.

### Analyzed

A candidate whose campaign site had at least 100 words of saved text in the election year, and was not removed as something other than campaign content. Shares and counts use only these candidates. Candidates who were not analyzed are not counted as zeros.

### Ballotpedia

An online encyclopedia of American elections. The study takes its list of general-election candidates from Ballotpedia, and checks that list against Federal Election Commission lists for 2020 to 2024.

### Benjamini-Hochberg Adjustment

The correction that turns each p-value into an Adjusted P-Value. With 57 terms tested at once, some gaps would look real by chance alone. The correction keeps the expected share of such false alarms among the gaps called real at or below the adjusted value.

### Benjamini-Yekutieli Adjustment

A more cautious version of the Benjamini-Hochberg Adjustment. It keeps the expected share of false alarms in check even when terms that sites use together are related, so its adjusted values are larger. The downloaded files give it beside the Benjamini-Hochberg value.

### Candidate-Year

One candidate in one election year. Someone who ran in 2022 and 2024 is two candidate-years.

### Challenger

A candidate who did not hold the seat before the election, including a candidate for a seat that had no incumbent running.

### Classifier

A computer program trained on labeled examples to sort text into categories, such as a topic.

### Close or Safe Seat

A close seat is one where the Democratic share of the two-party presidential vote was 45% to under 55%, in the district, or the state for a Senate seat. A seat with a known presidential vote outside that range is a safe seat.

### Coding

Reading a text and recording what it contains by a fixed set of rules. In this study a person coded a sample of matches for each term. In other studies coders recorded features of whole websites.

### Common Crawl

A nonprofit archive that saves copies of web pages. Every year's text in this study comes from it, apart from one analyzed site that has Wayback Machine copies only, so a site it never saved is not here.

### Cycle

An election year: 2020, 2022, 2024 or 2026. A cycle is one election, so 2024 is the 2024 cycle.

### Exploratory

A result noticed after looking at all 57 terms. It is a lead to check, not a test planned in advance. Every current result is exploratory.

### FEC Form 1

The Statement of Organization that a campaign committee files with the Federal Election Commission. It must list the committee's official website, if it has one.

### Fisher Exact Test

A test of how likely a gap this large, or larger, would be by chance if the two parties used the term equally often. The chance it reports is the gap's p-value, before any adjustment. It stays reliable when few candidates used a term, because it needs no large-sample approximation.

### Gap

The Democratic share minus the Republican share, in percentage points, computed from unrounded shares. It is written D+ when Democratic is higher and R+ when Republican is higher, so D+10 means the Democratic share is 10 points higher. A gap is shown in italics when its Gap Interval includes zero or its adjusted p-value is 0.05 or more, which means it may be chance. With filters on, a gap has no adjusted p-value, and its italics rest on the Gap Interval alone.

### Gap Interval

The 95% Interval of a gap: the range the gap could plausibly take, given which candidates were analyzed, written in the gap's own notation, such as D+2 to D+9. A gap whose Gap Interval includes zero is shown in italics, because it may be chance. It does not cover candidates who could not be analyzed.

### Harvard Dataverse

A free repository where researchers deposit datasets so that others can download and cite them.

### Incumbent

A candidate who held the seat before the election.

### Median

The middle value: half of the sites have more words and half have fewer.

### Newcombe Interval

The method used to find the 95% Interval of a difference between two shares, such as the gap between the parties or a party's change between cycles. It combines the Wilson Interval of each of the two shares, rather than subtracting one range from the other, so it stays reliable for small groups and for shares near 0% or 100%.

### No Usable Text

A candidate with a known website whose text could not be used, for one of three reasons: No Saved Text, which means no copy of the site was saved in the election year; Under 100 Words, which means the saved text had fewer than 100 words, counting paragraphs dropped as spam, placeholder or Spanish text; or Not Campaign Content, which means the study's rules flagged the site and a person confirmed it was not campaign content.

### No Website Found

A candidate for whom no campaign website was found on FEC Form 1 or on the candidate's Ballotpedia page.

### Not Analyzed

A candidate on the ballot whose site could not be used, for one of four reasons: No Website Found, No Saved Text, Under 100 Words or Not Campaign Content. The last three together are No Usable Text, which is how the coverage counts in README.md group them. A site removed as Not Campaign Content is listed with its own reason: No Campaign Words, Site Unavailable, Placeholder Text, Spam or Page Titles Only.

### Percentage Points

The difference between two percentages: a share that moves from 35% to 41% has moved 6 percentage points.

### Possible Range

The lowest and highest share of all candidates with a known website, in a party and cycle and within any filters, that could have used the term: lowest if none of those with no analyzed text did, highest if every one did. It follows the bounds Manski (1988) described for missing data. It counts the candidates not analyzed and does not measure chance, so it is not an interval of the same kind as the 95% Interval, and where few candidates were left out it can be narrower than that interval.

### Seat Code

A candidate's seat as the state's postal abbreviation and the district number, so NC-12 is North Carolina's 12th House district and WA-Senate is a Washington Senate seat. AL after a state, as in AK-AL, means the state has one House seat for the whole state; Alabama's own districts read AL-1 to AL-7.

### Share

The percent of one party's analyzed candidates whose site used the term at least once. A share printed as <1% means some candidates used the term but fewer than one in a hundred, and 0% means none did.

### Terms

The study counts 57 fixed terms. Each is matched by a written pattern, as whole words anywhere in a site's text, ignoring capitals except for "AI", which counts only in capitals. A label with a slash names two wordings, and a site counts if it uses either; when the label begins with a shared word, as in "Illegal Immigration / Aliens", each wording includes it: "illegal immigration" and "illegal aliens", not "aliens" alone. "Corporations / Corporate" is narrower: it counts "corporations", "corporation" only after a word such as "big" or "greedy", and "corporate" only in phrases such as "corporate PACs" or "corporate greed". Some labels also count plurals, hyphenated forms or other wordings: "China" counts "CCP" and "Chinese Communist", "Reproductive Freedom / Rights" counts "reproductive health care", and "Working People" counts "working men and women". Some patterns skip matches that are not the term's sense; "Inflation" does not count the Inflation Reduction Act. The full patterns are in the study's code.

### Wayback Machine

The Internet Archive's collection of saved copies of web pages. One analyzed site in this study has copies from it only, and the Hilbig dataset in RELATED-WORK.md comes from it.

### Welch's T Statistic

A number that compares the averages of two groups, relative to how much candidates within each group differ. Here the groups are the parties and the average is how often a candidate uses a word or phrase. The farther from zero, the more the parties differ: positive means Democratic candidates use it more, negative Republican.

### Wilson Interval

The method used to find each share's 95% Interval. The simpler textbook formula can be unreliable for shares near 0% or 100% and for small groups, and the Wilson Interval stays reliable at every group size here.

### Winner

A candidate who won the seat in the general election. Results come from the Federal Election Commission's certified results for 2020 and 2022 and from Ballotpedia for 2024; 2026 has none until election day.

### Working Paper

A paper shared for comment before a journal publishes it. It can change before publication.
