# Visual treatments for the public site

The site's structure is settled: an explorer that is a full part of the site, and a process path
that walks through the pipeline with the count that came through each step. This file settles
nothing about structure. It records reference research on how comparable sites look and offers four
visual treatments of that structure, each specific enough for another designer to build from. The
owner chooses one. The specimens below show each treatment on the same real content; they are not
mockups of the site.

The references were captured on 2026-10-09 by `../capture_treatment_references.py` at 1440 by 900
and 390 by 844, first screen and the first 9,000 pixels of each page, into the ignored
`artifacts/treatment-references/` with `provenance.json` (requested and final address, HTTP status,
title, page height and capture time). The boards are built by `../build_treatment_boards.py` into
`artifacts/treatments/boards/`. Live pages change, so a recapture is new evidence, and the boards
show the 2026-10-09 captures.

## Reference research

Each entry says first what the capture shows and then, separately, what it suggests for this site.
Typefaces are named only where the capture makes them identifiable; otherwise they are described.

### Direct peers: elections, legislators and political text

**Hilbig, U.S. Candidate Websites** (hannohilbig.com/candidatewebsites). The capture shows a single
column about 760 pixels wide in the browser's system sans, a 32-pixel bold title, a row of section
links, and hairline gray rules between short sections. Charts are R-style plots in thin rounded
frames: a coverage line chart with dashed and solid lines, and a dumbbell chart in which a brick-red
and a navy dot are joined by a gray bar, with the words Republicans and Democrats set once above the
first row in party color. No chart shows an interval. On the phone the column simply narrows and the
section links run off the right edge. For this site, it shows the restraint a peer research site
uses and that direct party labels on the first row are enough; it also shows how anonymous the
system-font default looks, which this site should avoid.

**CampaignView** (campaignview.org). The capture shows a centered headline in an Arial-like sans
with two words in saturated blue, three solid and outline buttons, and three stock icons for bios,
platforms and metadata. No data appears on the opening screen. The phone stacks everything
centered. For this site, it is the counterexample within the field: the opening says nothing a chart
could have said.

**America's Political Pulse, home and elected officials** (americaspoliticalpulse.com). The home
capture shows a dark top bar with vanity counters (227K survey responses), gradient-filled cards in
orange, blue, red, purple and green, and a newsletter dialog that covers the page on both sizes. The
elected-officials page is better: a ranked table with a photo, the number of classified statements
under each name, party as a colored word, a slim bar per row, and a one-line note that ranks are
adjusted for sample size. Headings use a bold serif and text a humanist sans. For this site, the
ranked table's habit of putting n beside every row is worth taking; the gradient cards and counters
are not.

**Manifesto Project** (manifesto-project.wzb.eu). The capture shows Bootstrap-style boxed panels
with icon links, numeric badges, a small line chart and a word cloud, and the same 1440-pixel layout
cut off on the phone. For this site, it is a counterexample of a serious political-text dataset
presented as a link directory, with a word cloud where a comparison was needed.

**Voteview, parties overview** (voteview.com/parties/all). The capture shows a Lato-like sans, a
chart of party median ideology over two centuries drawn as red and blue lines over a faint cloud of
individual members' dots, and a sortable table with inline span bars. On the phone the chart keeps
its desktop width and is cut off. For this site, drawing the individual candidates faintly behind a
party's share is a strong way to show that a share is made of people; the fixed-width chart is the
phone failure to avoid.

**New York Times, words at the 2012 conventions** (archive.nytimes.com). The capture shows a
Georgia-like serif title and deck, an add-a-word input with a plus button, and a cluster of circles,
one per word, each split into a pale blue half and a pale pink half with the counts under the word.
Below, excerpts are set in two columns, Democrats and Republicans, with the speaker in small bold
caps and the matched word highlighted in the party's tint. The phone shows the desktop page cut off.
For this site, it is the closest precedent for both the add-a-term control and the excerpt
treatment; split circles do not carry intervals, so the mark itself does not transfer.

**Pew Research Center, short read** (pewresearch.org, 2026-02-24). The capture shows a serif
headline and text, then a chart block: a 1-pixel top rule, a bold sans title, an italic subtitle
stating the measure, three small multiples headed Total, Rep/Lean Rep in red and Dem/Lean Dem in
blue, lines in gold and brown with values labelled at the ends, presidential terms shaded as pale
bands with names along the base, and a note, source and Chart/Data toggle below. A cookie notice
covers part of the first screen on both sizes. For this site, the title, subtitle, note and source
stack and the labelled period band (usable for 2026) are worth taking.

**Stanford Cable TV News Analyzer** (tvnews.stanford.edu). The capture shows a light top bar, then
one query row per term, each with a remove button, a search button, a color swatch and the query in
a monospace face, then a date range, an aggregation menu and a single line chart with light
gridlines, followed by copy, embed, save and download links. On the phone the query rows and chart
run off the right edge. For this site, rows of term tokens are a clear multi-term picker, and the
one-line set of copy and download links is a good model for the explorer's exports.

**Comparative Agendas Project** (comparativeagendas.net). Not studied: both captures came back
scrolled to the middle of a news list, so the page's top, navigation and tools were never captured.

### Adjacent fields: statistical agencies, data journalism and academic project sites

**Office for National Statistics, labour market bulletin** (ons.gov.uk). The capture shows an
Open Sans-like sans at a generous size, a blue release header with breadcrumbs, the title, a
standfirst, a white panel with a 4-pixel left border reading that this is the latest release, and a
row giving contact, release date and next release. Further down, each indicator is a gray row with a
bold label, a bold figure, its period in small gray text and a pill stating the change in words
("Largely unchanged", "26,000 (0.1%) lower"), with a disclosure under each group asking what the
reader should know about the quality of the data. The phone keeps every element in one column. For
this site, this is the clearest precedent for writing a number's status beside the number and for a
release header that says when figures will be replaced.

**U.S. Census Bureau, Household Pulse Survey** (census.gov). The capture shows a large bold
Roboto-like title and, in the left column beside it, a product mark captioned "Experimental data".
Text is small and dense below. For this site, one persistent mark that labels a whole body of work
as not final is a precedent for marking every finding as exploratory without repeating a paragraph.

**Our World in Data, grapher** (ourworldindata.org). The capture shows a chart card with a
high-contrast serif title, a one-sentence definition, Table, Map and Line tabs, a map with a stepped
legend and hatched no-data areas, a time slider, a data source and note line, and a right-hand list
of countries in which each value is drawn as a pale bar behind its row. A yellow cookie banner
covers the metadata row. Further down, a download block describes each file in plain words. The
phone keeps the card and stacks the controls. For this site, values drawn inside the filter options,
the table tab, hatching for no data and the plain download descriptions are all directly useful.

**Stanford Open Policing Project, findings** (openpolicing.stanford.edu/findings). The capture shows
a dark title band, a text column on the left with each chart on the right, gray and colored toggle
chips above each chart, bubble scatter plots with a dashed diagonal, and later small multiples with
a dashed vertical marker. On the phone the text and charts stack. For this site, chips placed
directly above the chart they filter are a light-weight filter pattern; the bubble charts are
crowded.

**Eviction Lab** (evictionlab.org). Not studied: the server returned HTTP 403 to both captures.

**The Markup, methodology article** (themarkup.org). The capture shows a warm off-white page, a
crimson wordmark and accent, a dotted rule under the header, and a headline in a heavy
high-contrast serif inside a ruled grid whose cells hold the series name, the topic, the byline and
the date. The text is a book serif with numbered lists. A real police document is shown in a frame
with a label tab and a double rule. The phone keeps the ruled grid with its two cells side by side.
For this site, the ruled kicker cells can carry a status, and the labelled exhibit frame is exactly
what an example site needs to read as one of thousands.

**Distill, Why Momentum Really Works** (distill.pub/2017/momentum). The capture shows a dark top
bar, a centered Georgia-like title, a wide interactive figure with labels set on the figure, two
sliders and a short caption under it, and a ruled byline grid (author and institution, date,
citation). The text column is a comfortable serif. The phone stacks the figure
and its controls. For this site, the byline grid (author, Gonzaga, date) and controls set directly
under the figure they change are useful.

**The Pudding, film dialogue** (pudding.cool/2017/03/film-dialogue). The capture shows a very large
mint-green geometric display headline, a light subtitle, a serif text column, horizontal bar charts
in blue and red, a methodology section in the flow of the article, and an explorer with counts,
check boxes and a film list. For this site, the scale of the opening and the in-article methodology
are references for a reader-first family; the casual voice is not.

**Reuters Graphics** (reuters.com/graphics). Not studied: the desktop capture showed "Access is
temporarily restricted" and the page images never loaded.

**Datawrapper, intervals and value markers** (datawrapper.de/blog). The capture shows three useful
charts. A bar chart has a hatched overlay for a 90 percent interval, named once above the bars. A
bar chart has a gray full-scale track behind each bar with tick markers for earlier results. A range
chart has a hatched minimum-to-maximum band, a solid inner band and a median tick, with a legend
naming both bands. Labels are a Roboto-like sans, source lines small and gray. For this site, the
third chart is the closest existing drawing of a share (tick), its interval (solid band) and its
worst-case range (hatched band) in one row.

**Urban Institute data visualization style guide** (urbaninstitute.github.io/graphics-styleguide).
The capture shows a dark header and then a written table giving the font (Lato), color, case and
pixel size for each chart text element: title 20, subtitle 16, axis and data labels 12, legend 14,
source and notes 11. For this site, it is the model for writing one fixed chart type scale that
every chart obeys.

**FT Visual Vocabulary** (ft-interactive.github.io/visual-vocabulary). Not studied: only the
category tabs rendered and the chart grid did not load in either capture.

### Exceptional interfaces elsewhere: typography, tools and documentation

**Practical Typography, home and grids of numbers** (practicaltypography.com). The captures show
the author's own book serif for text and a humanist sans for notes, section headings set
right-aligned in the left margin under a short heavy rule, run-in heads in letterspaced small caps,
gray margin notes, and a before-and-after table in which figures are aligned by meaning on hairline
rows without fills. On the phone the margin heading moves above the text and the margin note
becomes a boxed inline note. For this site, the three-column page, the run-in heads and the table
setting are all usable, as is the way margin notes collapse.

**Tufte CSS** (edwardtufte.github.io/tufte-css). The capture shows ET Book on a cream ground, a
text column of about 55 percent of the page, and a wide right margin holding sidenotes and figure
captions beside the figure. On the phone the margin disappears and notes become toggles. For this
site, margin notes beside each chart are a way to put definitions and caveats next to the thing they
qualify.

**Gwern.net, home and design page** (gwern.net). The captures show a Source Serif text face, small
capitals in headings, dotted underlines, a navigation of boxed small-caps links, and under each
page title a status line giving dates, "finished", "certainty: highly likely" and "importance". The
design page sets a numbered table of contents in a bordered box beside the text. For this site, a
status line under a title is a precise precedent for saying a finding is exploratory and a year is
provisional in one line.

**GOV.UK, research and statistics search, and the checkboxes component** (gov.uk,
design-system.service.gov.uk). The captures show GOV.UK's own sans at 19 pixels, a left column of
radio buttons and disclosures (Topic, Organisation, World location, Updated), a bold result count
above the results, and result entries with a document type and date line. The checkboxes component
shows 40-pixel square boxes with a 2-pixel black border, hint text, an "or" divider before a
none-of-these option, and a smaller 24-pixel variant for filters. On the phone the filter column
folds into one Filter disclosure above the count. For this site, the control sizes, the wording of
empty choices and the phone filter pattern are directly usable.

**Observable Plot, dot mark** (observablehq.com/plot). The capture shows a quiet documentation page
in an Inter-like sans with code in a monospace face, many small gray scatter plots, and a row of the
default symbols (circle, cross, diamond, square, star, triangle, wye) with a note that a symbol
channel improves accessibility for readers with color-vision deficiency. For this site, a fixed
shape per party is the simplest way for marks to read without color.

**Stripe documentation** (docs.stripe.com). The capture shows a left navigation with capitalized
group labels, a large title, underlined tabs and 1-pixel bordered cards with a link-colored title.
The desktop page scrolls inside a panel, so only the first screen was captured there; the phone
capture shows the stacked layout. For this site, the tab and panel system is a model for a tool-like
family.

**Fathom Information Design** (fathom.info). The capture shows a dark studio site with full-bleed
photographs of data work, text that fades in on scroll and a client-logo grid. For this site, it is a
counterexample: portfolio spectacle, not a reading or checking surface.

### Counterexamples

**FEC, candidates for the House** (fec.gov/data/candidates/house). The capture shows a serif page
title, an Edit filters panel with labelled fields, a dark count chip (Viewing 3,093 results), a note
that newly filed data may not appear for up to 48 hours, and a dense sortable table with party
written in capitals and money right-aligned. On the phone the filters fold into one bar and the count
stays on top. For this site, the count chip and the lag note in the filter panel are good; the
all-capitals party column and plus-button rows are not.

**270toWin, 2024 House map** (270towin.com). The capture shows saturated red and blue maps and
name chips, advertisements between sections, social buttons and very small table type. For this
site, it is the counterexample of party identity carried by color alone.

**Ballotpedia race page and Google Trends.** Not studied: Ballotpedia returned HTTP 403 and Google
Trends HTTP 429 to both captures.

In all, 30 pages from 26 sites were studied, counting GOV.UK's search and its design system as one
site; 6 pages could not be studied.

## Rules every family follows

The four families differ in kind, but builders follow each specification literally, so each one
obeys the same rules.

- **One cue per fact.** Each hard case from the brief is carried by one visual encoding, defined once
  in the family's key, with at most one short label where the encoding first appears in a view. The
  hard cases are 2026 being provisional, every finding being exploratory, partial coverage, small
  groups, empty groups, and candidates who were not analyzed. A not-analyzed group is never drawn
  as zero.
- **No text that restates a graphic.** A chart's labels name what is plotted and give figures the
  chart cannot show, such as counts. Sentences never repeat what a mark already shows. Definitions
  live on one Glossary page. A term's first use on a page links to it, and nothing else is repeated
  beside figures.
- **No decoration without a job.** Hierarchy comes from type, space and rules. There are no tinted or
  rounded chips, no tracked capital labels over headings, no bordered card as a default container,
  and no grids of equal boxes, except where a family below gives a reason.
- **Party.** Democrats and Republicans each have a shape and a fixed position as well as a color,
  and a party name labels the first marks in every chart. Links are never blue, because blue means
  Democrats. Every party color pair passes the dataviz palette validator's color-vision checks
  against its family's page color; the protanopia separation is given below.
- **Budget.** Each family states the most regions per view and the most words of running text per
  view, outside labels and controls.

## 1. Statistical Release

**What it puts first.** The number with its uncertainty. Every share is an estimate row that shows
the share, its interval and its possible range on one track. The row's numbers give only what the
track cannot show, the count. Large type and large controls serve readers with no background.

**Identity.** The process funnel is the site's mark: four stacked ink bars, 3,712 down to 2,682,
drawn small beside the title on every page and full size on the process path. Headings are Source
Sans 3 Black at tight tracking over 2-pixel ink rules, like a ledger, and the only color on the page
belongs to the data. There is no colored header band, no gray filter panel, no yellow focus and no
crest. Those are the habits that would make it read as a GOV.UK page.

**Typefaces.** Source Sans 3 (SIL Open Font License 1.1; github.com/adobe-fonts/source-sans,
variable WOFF2). Weights are 400, 600 and 900. Tables, counts and chart labels use tabular lining
figures (`font-variant-numeric: tabular-nums lining-nums`).

| Element | Desktop | Phone |
| --- | --- | --- |
| Site title | 40/44, 900, tracking -0.01em | 28/32 |
| Section heading | 32/38, 900, over a 2 px ink rule | 26/31 |
| Subheading | 22/28, 600 | 20/26 |
| Body | 19/28, 400, measure 640 px | 18/27 |
| Lead figure (step count) | 40/44, 900 | 32/36 |
| Chart title / axis and data labels | 19/24, 600 / 14/18, 400, #383F43 | same |
| Source line | 14/20, 400, #505A5F | same |

**Color.** Page #FFFFFF; ink #0B0C0C; secondary #505A5F; hairlines #B1B4B6; gridlines #E3E5E6.
Links are ink with a 1-pixel underline that becomes 3 pixels on hover. Focus is a 3-pixel ink outline
offset 2 pixels. Democratic is #1F5A9E with a filled circle; Republican is #B23A2E with a filled
square (protanopia separation 17.8). The possible range is #D9DCDE.

**Space and rules.** Spacing steps are 4, 8, 12, 16, 24, 32, 48, 64 and 96 pixels. Sections are 64
apart (48 on phone). The container is 1200 pixels with 32-pixel gutters: a 260-pixel filter column
and a 860-pixel results column, separated by space, not a rule. Section heads sit on 2-pixel ink
rules, table rows are separated by 1-pixel hairlines, corners are square and nothing has a shadow.

**Charts.** One row per year carries both parties. It has:

- a 90-pixel year label;
- a 0 to 100 percent track about 460 pixels wide, with gridlines at 0, 50 and 100;
- a 180-pixel gap track;
- a counts column ("133 of 322").

On the share track, the possible range among candidates with a known website is a 12-pixel band per
party. The 95 percent interval is a 2-pixel line in the party color with 8-pixel end caps. The share
is an 8-pixel mark. The Democratic band and mark sit 4 pixels above the row's center line and the
Republican ones 4 pixels below.

The gap track runs from -50 to +50 points with an ink zero rule. The gap is a 2-pixel ink tick and
its interval a 6-pixel #B1B4B6 bar, so a gap whose interval crosses zero is visible at a glance.
Adjusted p-values appear only in the table view and the downloads.

The window comparison adds two thin rows under each year, for the 60-day and 120-day windows, in
secondary ink. The process path draws one bar per step, full width equal to 3,712, in ink for those
that passed. Hand checks hang below the step they checked as a dashed outline bar the width of the
sample, labelled with its size ("20 matches per term").

**Controls and filters.** The filter column lists Term, Year, Party, Office, State, Incumbent or
challenger, Close or safe seat, and Won or lost. Each list is open under a 600-weight heading, with
no disclosures and no panel. Checkboxes are 24 pixels with a 2-pixel ink border, and each option
shows its count in secondary ink. Terms are found with a 44-pixel search field over a list grouped
by theme. The results column opens with one line that names the group in figures ("322 analyzed
candidates"). The candidate list behind a share opens in a dialog.

**Text.** A page opens with the question in one sentence and then the lead chart. Each process
step is its bar and count, with three short labels: Rule, Source and Standard.

**Hard cases, one cue each.**

| Fact | Cue | Label |
| --- | --- | --- |
| 2026 is provisional | Hollow marks | The 2026 row reads "2026 so far" |
| Findings are exploratory | One line under the site title, "Exploratory results, 2020 to 2026" | None elsewhere |
| Partial coverage | The gray possible-range band | "Possible range" on the first band in a view |
| Small groups | Under 10 candidates the mark is dropped and only the interval remains | None; the count column already says "3 of 7" |
| Empty groups | The chart area holds one line, "No analyzed candidates match", and a button that removes the last filter | None |
| Not analyzed | No mark, and an em dash in the counts column | None |

**Budget.** A view has at most two regions, the filter column and the results. It has at most 60
words of running text.

**Phone.** One column. The filter column folds into one Filter button showing the number of active
filters, and the results line stays above the charts. Each year row stacks the share track over the
gap track at full width, with counts on the year line.

**Tradeoffs and risks.** It handles every hard case on the same track as the number and is the most
legible family for lay readers. Its rows are table-like, so a large gap is less striking than in a
newsroom chart. Its restraint can tip into anonymity if the title type and the funnel mark are
weakened.

**References.** ONS bulletin (one figure per row, read across), Census Household Pulse (one statement
that marks a whole body of results), GOV.UK checkboxes and search (control sizes, phone filter), FEC
(the group count above the list), Datawrapper (an interval named once on the chart), Urban Institute
(a fixed chart type scale), Our World in Data (downloads). Board:
`artifacts/treatments/boards/1-statistical-release-references.png`.

## 2. Annotated Paper

**What it puts first.** The study read in order. The page is a paper on the web. A left margin
carries the pipeline, the text column carries short framing and small figures, and the right
margin carries each step's rule, source and standard as labels.

**Identity.** The pipeline is drawn once as a ribbon down the left margin of the whole process
path, narrowing in proportion to the count at each step. A reader scrolling the page sees the study
shrink from 3,712 to 2,682. Source Serif 4's optical sizes, from Display titles to Caption chart
labels, and oldstyle figures in prose give it a typeset rather than templated look.

**Typefaces.** Source Serif 4 for everything (SIL Open Font License 1.1;
github.com/adobe-fonts/source-serif; variable, optical size 8 to 60, weight 200 to 900). Prose uses
oldstyle proportional figures (`onum pnum`). Tables and charts use lining tabular figures.

| Element | Desktop | Phone |
| --- | --- | --- |
| Title | 44/50, 600 | 32/38 |
| Status line under the site title | 16/24 italic | 15/22 |
| Section heading | 28/34, 600 | 24/30 |
| Body | 20/31, 400, measure 640 px | 18/28 |
| Margin labels (rule, source, standard) | 15/22, 400, Caption size, #5A554C | 15/22 inline |
| Step count in the left margin | 32/36, 600, lining | 26/30 |
| Chart title / labels | 17/22, 600 / 13/16, Caption size | same |

**Color.** Paper #FBF9F4; ink #1F1D1A; secondary #5A554C; hairlines #D9D3C7; gridlines #E8E3D8.
Links are ink with a 1-pixel dotted underline offset 3 pixels. Focus is a 2-pixel ink outline.
Democratic is #285E9E with a filled circle; Republican is #A8452C with a filled square (protanopia
separation 17.8). The possible range is a 45-degree hatch of 1-pixel #BDB4A3 lines 5 pixels apart.
Excerpts underline the matched term with a 2-pixel line in the party color.

**Space and rules.** Spacing steps are 8, 16, 24, 32, 48, 64 and 96. At 1240 pixels there are three
columns: a left margin of 200, text of 640 and a right margin of 280, with 40-pixel gutters. Figures
may span the text and right margin (960). Rules are 1-pixel hairlines. An example site is shown in
one exhibit frame, a double rule (1 pixel, 2-pixel gap, 1 pixel), labelled "One of 2,682 sites
processed the same way". This is the family's only framed element, because it marks the example as
evidence.

**Charts.** Each term gets a small multiple, about 300 by 180 pixels:

- years on the horizontal axis and 0 to 100 percent on the vertical, with hairline gridlines at 0,
  50 and 100;
- the two parties' shares as 6-pixel marks joined by 1.5-pixel lines;
- each 95 percent interval as a 1-pixel vertical line;
- the possible range as a hatched vertical band 10 pixels wide behind each mark;
- the party names set once at the line ends of the first multiple in a view.

The gap is the vertical distance between the lines and is not restated. The 57-term overview is a
typeset table: term, Democratic share, Republican share and a 60 by 16 sparkline per party. The
pipeline ribbon is 1 to 120 pixels wide, in ink. Hand checks branch from it as dashed hairlines to
their sample size.

**Controls and filters.** The explorer is written as a sentence: Show [working families] among
[all] [House and Senate] candidates in [all states], [incumbents and challengers], [close and safe
seats], [winners and losers], in [all years]. Each bracket is a button set as text with a 2-pixel
dotted underline and a caret. It opens a list of 18-pixel checkboxes with counts. The sentence ends
with the group size: "…: 26 analyzed candidates." The candidate list opens in a dialog set as a
typeset table.

**Text.** Each method step is the ribbon segment, its count in the left margin and a heading. Its
rule, source and standard sit in the right margin as three labels of a few words each. A finding
gets at most one framing sentence before its figure.

**Hard cases, one cue each.**

| Fact | Cue | Label |
| --- | --- | --- |
| 2026 is provisional | Hollow marks and a dotted segment into 2026 | The axis reads "2026 so far" |
| Findings are exploratory | The status line under the site title: "Exploratory findings; confirmatory tests not yet run" | None elsewhere |
| Partial coverage | The hatched band | "Possible range" on the first multiple in a view |
| Small groups | n printed under a mark only when the group is under 30; under 10 the mark is dropped | None |
| Empty groups | The emptying clause of the filter sentence shows "(0)", and the plot shows axes without marks | None |
| Not analyzed | Hatch with no mark; "—" in tables | None |

**Budget.** A view has at most three columns and no other regions. It has at most 120 words of
running prose.

**Phone.** The left margin's count moves onto a line above each heading, and the ribbon becomes a
4-pixel-high horizontal bar under it, scaled to the count. The right-margin labels move under the
heading. Small multiples go one per row at full width. The filter sentence wraps naturally.

**Tradeoffs and risks.** It suits an honors project and the goal of understanding the study end to
end. Its prose budget must be enforced, or it drifts into telling. The sentence explorer is clear
for one term and a few filters but grows long with seven filters and several terms. Serif chart
labels are less legible than sans at 13 pixels.

**References.** Tufte CSS (a right margin beside the text), Practical Typography (hung headings,
number tables, phone collapse of margins), Gwern.net (one status line), Distill (byline, controls
under figures), The Markup (exhibit frame), Hilbig (party names set once). Board:
`artifacts/treatments/boards/2-annotated-paper-references.png`.

## 3. Instrument

**What it puts first.** The data as a tool. The site opens on the explorer with a default term
chosen. Method, coverage, related work and downloads are tabs of the same instrument.

**Identity.** Every figure is set in IBM Plex Mono, so numbers look measured rather than written.
Each share track carries a fine ruler of ticks every 10 points. The pipeline is a single horizontal
flow whose bar heights are the counts. One white surface is divided only by hairline rules, like the
face of a lab instrument, with no cards, shadows or tinted panels.

**Typefaces.** IBM Plex Sans 400, 500 and 600 for interface and text. IBM Plex Mono 400 and 500 for
counts, shares, terms and script names. Both use the SIL Open Font License 1.1 (github.com/IBM/plex).

| Element | Desktop | Phone |
| --- | --- | --- |
| Tab title | 24/30, 600 | 22/28 |
| Region heading | 15/22, 600, sentence case, 16 px space above, over a hairline | same |
| Body and controls | 15/22, 400 | 16/24 |
| Table | 14/20, row 36 px; figures in Plex Mono | 15/22 |
| Large count | 24/28, Plex Mono 500 | 22/26 |
| Chart labels | 12/16, #56606B | same |

**Color.** Page #FFFFFF; hairlines #D6DAE0; ink #15191E; secondary #56606B; muted #858F99; chart
track #EEF0F3 with ticks in #C9CED5. Selection is an ink fill with white text. Focus is a 2-pixel
#0E7C7B outline offset 2 pixels, and that teal is used for nothing else. Democratic is #23589C with a
filled circle; Republican is #D8673F with a filled triangle (protanopia separation 21.4). The
Democratic color is darker than the Republican (luminance contrast 2.0 to 1), so the two also
separate in grayscale and print. The possible range is an unfilled box with a 1-pixel dashed
#56606B outline. 2026 sits on a hatch of 1-pixel #D6DAE0 lines at 45 degrees, 6 pixels apart.

**Space and rules.** Spacing steps are 2, 4, 8, 12, 16, 24 and 32. The layout is:

- a 48-pixel top bar with the site name and underlined tabs (Explorer, Method, Coverage, Related
  work, Downloads);
- a 288-pixel filter rail separated from the main area by one hairline;
- the main area;
- a 360-pixel candidate panel that slides over the right edge without moving the page.

The candidate panel is the only raised surface, with a 1-pixel border and square corners, because
it sits above the page.

**Charts.** The term table lists all 57 terms, grouped by theme under plain region headings. Its
columns are:

- the term;
- the Democratic and Republican shares in Plex Mono;
- a 260-pixel track from 0 to 100 percent with the party marks (8 pixels), 2-pixel interval lines
  and the dashed range box;
- a 120-pixel gap track from -50 to +50 with a zero rule, a 2-pixel ink gap tick and a 6-pixel gray
  interval bar;
- the adjusted p-value in mono, which is not drawn anywhere else.

Any column sorts, and a segmented control switches year.

A term's detail view is a line chart from 2020 to 2026: 2-pixel lines, 7-pixel marks, the interval
as a band of the party color at 16 percent opacity, and the possible range as dashed lines. A
segmented control switches between the election-year, 120-day and 60-day windows and leaves the
other windows' values as small gray ticks.

The Method tab is one horizontal flow. Each step is a vertical ink bar whose height is its count
(3,712 = 240 pixels). Under each bar are the step name, the count in mono and the script that ran it.
Dropped candidate-years peel off as thin gray lines labelled with their number ("843 with no saved
text"). The two hand checks are dashed markers on the step they checked. A step opens a dialog with
its rule, source and standard as labels.

**Controls and filters.** Chosen terms are plain rows: the term in Plex Mono and a remove button,
separated by hairlines, under a search field that suggests terms by theme. Filter options are
16-pixel checkboxes with square corners. Each option shows its count right-aligned in mono over a
2-pixel bar proportional to the count, so a reader sees a group shrink before choosing it. An option
that would leave no one stays clickable and shows 0. One mono line above the main area gives the
group: "26 analyzed · 11 not analyzed".

**Text.** Definitions are on the Glossary tab only. The opening shows one caption line under the
default chart.

**Hard cases, one cue each.**

| Fact | Cue | Label |
| --- | --- | --- |
| 2026 is provisional | The hatch behind every 2026 column and region | The column header reads "2026 so far" |
| Findings are exploratory | One muted line after the site name in the top bar: "exploratory results" | None elsewhere |
| Partial coverage | The dashed range box | "Possible range" in the table header |
| Small groups | Under 30 the row's figures turn muted; under 10 the mark is dropped and the interval remains | None |
| Empty groups | The chart area reads "0 analyzed candidates match" and names the filter that would restore a group | None |
| Not analyzed | An em dash with the accessible label "not analyzed" | None |

**Budget.** A view has at most three regions: the rail, the main area and the optional candidate
panel. It has at most 30 words of running text.

**Phone.** The rail becomes a full-height sheet behind a Filters (3) button. The group line stays
fixed under the top bar. The term table becomes one row group per term: name and shares on one line,
full-width track below, separated by hairlines. The candidate panel becomes a full-screen dialog, and
the Method flow turns vertical with bar widths as counts.

**Tradeoffs and risks.** It is the best family for checking the study and makes the automation
literal, since each step names the code that ran on every candidate-year. It is the least welcoming
to the readers who come first and gives the findings no narrative. Density invites more columns
over time, so the column list above is a ceiling.

**References.** Stanford Cable TV News Analyzer (term rows, exports), Our World in Data (counts
inside filter options, table tab), FEC (sortable table, group count, phone filter bar), America's
Political Pulse elected officials (n beside every row), Observable Plot (a shape per category),
Datawrapper (full-scale track), Stripe (underlined tabs only). Board:
`artifacts/treatments/boards/3-instrument-references.png`.

## 4. Front Page

**What it puts first.** The findings as graphics. Each finding is a headline over one large chart.
The process path is one graphic of all 3,712 candidate-years moving through the steps. The explorer
starts from an add-a-term field.

**Identity.** The 3,712-dot grid is the signature. It opens the site and returns, small, as the
group-size graphic in the explorer, where each dot is a candidate-year in the current group.
Newsreader's large optical sizes set the headlines and the big step counts, and the red and blue
appear only in data.

**Typefaces.** Newsreader for headlines and text (SIL Open Font License 1.1;
github.com/productiontype/Newsreader; variable, optical size 6 to 72, weight 200 to 800). Libre
Franklin for charts, captions and controls (SIL Open Font License 1.1;
github.com/impallari/Libre-Franklin; variable, weight 100 to 900).

| Element | Desktop | Phone |
| --- | --- | --- |
| Headline | Newsreader 60/62, 600, optical size 72 | 38/42 |
| Deck | Newsreader 22/32, 400 | 19/28 |
| Body | Newsreader 19/30, 400, measure 600 px | 18/28 |
| Chart title / subtitle | Franklin 20/26, 700 / 16/22, 400, #595959 | 18/24 / 15/21 |
| Data labels and axis | Franklin 13/16 tabular, #595959 | same |
| Step count in the dot grid | Newsreader 48/50, 600, lining | 36/40 |

**Color.** Page #FFFFFF; ink #121212; secondary #595959; hairlines #DDDDDD. Links are ink with a
1-pixel underline. Focus is a 3-pixel ink outline offset 2 pixels. Democratic is #1F5FC4 with a
filled circle; Republican is #D2372C with a filled square (protanopia separation 23.8). Tints #DCE7F8
and #F8DEDB fill interval bars and excerpt highlights. A 40 percent hatch of each color (#8FB0E2,
#E99B95) shows possible ranges. The 2026 band is #F4F4F2. In every paired chart the Democratic mark
is on the upper row, so position also carries party.

**Space and rules.** Spacing steps are 8, 16, 24, 32, 48, 80 and 120. Each finding opens with a
2-pixel ink rule across the column, then the headline. Charts get 48 pixels above and below and may
run to 960 pixels while text stays at 600. There are no boxes.

**Charts.** A finding chart is a dumbbell by year, with four rows. Each row has:

- the two party marks (10 pixels) on a 0 to 100 percent axis, joined by a 3-pixel #BDBDBD bar;
- the interval as a 10-pixel tint bar behind each mark;
- the possible range as a hatched bar of the same height extending beyond it;
- the gap as a figure in bold Franklin at the bar's midpoint ("+22").

There are no annotation sentences on charts.

The overview of all 57 terms is a butterfly chart: term names on a center spine, Democratic bars
to the left and Republican bars to the right, 14 pixels tall with 4-pixel gaps and values at the bar
ends. The process path is a dot grid of 3,712 dots (4 pixels with 2-pixel gaps, 64 columns). At each
step the candidate-years that dropped turn hatched gray and the count is set at 48 pixels. One dot
is outlined and leads to the exhibit of one example site, labelled "One of 3,712".

**Controls and filters.** A 52-pixel add-a-term field with a 2-pixel ink border, Franklin 18, and
suggestions by theme. Chosen terms are listed as plain text with a remove button. Above the chart
they change, filters are a single row of text menus in Franklin 15 with a caret ("All years",
"Both offices", "All states", "Incumbents and challengers", "Close and safe seats", "Won and lost"),
24 pixels apart, with no outline. The candidate list opens in a dialog of excerpts: name and
district in Franklin 600, the excerpt in Newsreader 17, the matched term highlighted in the party's
tint.

**Text.** Each finding has a headline and at most one sentence of deck. Headlines name the term,
the party and the years, and do not generalize beyond analyzed candidates. Each process step has a
step name and its count. Its rule, source and standard appear as three short labels beside the grid.

**Hard cases, one cue each.**

| Fact | Cue | Label |
| --- | --- | --- |
| 2026 is provisional | The #F4F4F2 band behind 2026 rows and columns | "2026 so far" on the first band in a view |
| Findings are exploratory | One line under the site title on the opening page: "Exploratory results: chosen after viewing all 57 terms" | None elsewhere |
| Partial coverage | The hatched range bar | "Possible range" on the first one in a view |
| Small groups | Under 20 the mark becomes an open bracket spanning its interval; under 10 nothing is plotted and the count is printed in its place | None |
| Empty groups | The chart area shows "No candidates match" in Newsreader italic | None |
| Not analyzed | Hatched gray dots in the grid; never a zero bar | None |

**Budget.** A view has one headline chart and at most two smaller charts. It has at most 80 words
of running text, counting headline and deck.

**Phone.** Headlines drop to 38 pixels. Dumbbells keep a horizontal axis at 358 pixels. The
butterfly chart becomes two stacked bars per term. The filter row scrolls sideways with a fade at the
edge, and the dot grid becomes 40 columns.

**Tradeoffs and risks.** It is the most engaging family for students, voters and journalists. It
also invites overclaiming, with big headlines over exploratory results, and a newspaper look that
can make a student's study read as journalism. It relies on color more than the others and needs the
most custom graphics.

**References.** New York Times convention words (party split, add-a-word control, excerpts), Pew
(chart title stack, labelled band for a period), Datawrapper (hatched range around a solid
interval), The Pudding (scale of the opening), Stanford Open Policing (filters directly above the
chart they change), Voteview (individuals behind a party share). Board:
`artifacts/treatments/boards/4-front-page-references.png`.

## Recommendation

Choose the Statistical Release. The brief's hardest requirements are all about how sure a number
is: exploratory findings, a provisional 2026, partial coverage beside every share, small and empty
groups, and missing that is not zero. In this family each of them is one encoding on the same track
as the share: hollow marks, the possible-range band, a dropped mark and an em dash. No caveat has to
be written next to a result.

Its large type and large controls serve the readers who come first. Its ledger headings and step bars
make it look like one author's careful work, without the Front Page's pull toward
headlines or the Instrument's developer-tool look. The explorer and the process path share one set
of parts: filters with counts, year rows and step bars. That keeps the explorer a full part of the
site without a second visual language, and every element regenerates directly from the result
tables.

## Specimens

Each family is built as one working page on the same content, defined for all four alike: the title
and question, the pipeline in brief, the "Saved by Common Crawl" step in full, and the explorer for
"working families" with every filter at its default, with Washington (a small group), with
Connecticut's 2024 Senate race (an empty group) and with the candidates behind Washington's 2024
Democratic share. Every figure is computed in the page from `artifacts/mockup-data/site.json`, using
the checked intervals in [stats.js](stats.js), and each state has its own address. The fonts are
served from each folder with their open licenses beside them.

| Family | Page | Folder |
| --- | --- | --- |
| 1. Statistical Release | http://127.0.0.1:8765/treatments/1-statistical-release/ | [1-statistical-release/](1-statistical-release/) |
| 2. Annotated Paper | http://127.0.0.1:8765/treatments/2-annotated-paper/ | [2-annotated-paper/](2-annotated-paper/) |
| 3. Instrument | http://127.0.0.1:8765/treatments/3-instrument/ | [3-instrument/](3-instrument/) |
| 4. Front Page | http://127.0.0.1:8765/treatments/4-front-page/ | [4-front-page/](4-front-page/) |

Where a built specimen departs from its family above, the specimen is the current version. In the
Statistical Release the title mark was dropped, because a funnel that shrinks by 28 percent reads as a
menu icon at title size, and the encodings are named once in a key above the plot. In the Annotated
Paper the chart spans the text column and the right margin, the interval is a soft bar, small groups
keep their marks with their size beside them, and the ribbon is narrower. In the Instrument the
filter counts are short bars beside each count, and the pipeline is one stream with the drops peeling
off. In the Front Page the dropped candidate-years form one block per step, the step shows when each
site's latest copy was saved, and the gap sits in its own column.

To rebuild the presentation, with the server running:

```text
artifacts/.venv/Scripts/python.exe design/treatments/capture_states.py
python design/treatments/build_specimen_boards.py
```

The boards are `artifacts/treatments/boards/compare-first-screen.png` and one
`<family>-specimen.png` per family. The captures each specimen's builder took are in
`artifacts/treatments/specimens/<family>/`.
