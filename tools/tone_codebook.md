# Campaign tone codebook

This codebook defines the sentence codes for hand coding. The fixed word-list rules in `tone.py`
measure the three campaign-tone categories (attack or contrast, threat or alarm, incivility), and the
dictionary sentiment tools measure polarity. Hand coding under this codebook checks how well each rule
and tool agrees with a human reading. The coding rules were fixed before any rule output was examined.

## Unit and general rules

- The unit is one sentence from a candidate's campaign website, shown with the sentences before and
  after it. Code the target sentence only. Use the surrounding sentences only to work out what the
  target refers to, such as who "he" or "they" is, or which bill "it" is.
- If the sentence was split badly (two sentences joined, or one cut short), code the text as shown.
- The candidate is the author. Everything the campaign put on its site counts as its own, including
  quotes from endorsers, testimonials and excerpts from news stories.
- The categories are independent. A sentence can have none, one or several of them. Every
  incivility sentence is also an attack sentence, because both apply to the same targets.
- Code what the sentence says, not what its topic usually implies. A sentence about crime, the border
  or inflation is not attack or alarm just because of its subject.
- Headlines, slogans and lists are coded like sentences.
- Mark a sentence unusable (hand coding only) when it is not readable English campaign text, such as
  garbled extraction, a navigation menu, page code, another language, or text plainly not from the
  campaign. An unusable sentence gets no other codes.

## The other side

Attack and incivility apply only to targets on the other side of the candidate. The candidate's party
is given with each sentence.

The other side is:

- the candidate's opponent in this race, named or not ("my opponent");
- any party other than the candidate's own, and its members as a group ("Democrats", "House
  Republicans", "Washington Democrats", "MAGA Republicans", "the radical left", "the far right");
- that party's leaders, officeholders and candidates, such as a president, cabinet members,
  congressional leaders or governors, and their administrations ("the Biden administration");
- policies and laws named for them or attributed to them in the sentence ("Bidenomics", "Trump's
  tariffs", "the Democrats' spending bill").

For an independent or third-party candidate, both major parties are the other side, so "both
parties" or "the two-party system" is a target.

Not the other side, unless the sentence ties them to another party or its leaders:

- the candidate's own party, its members and its leaders;
- politicians, Washington, Congress, "the establishment", "career politicians" or "both parties"
  (for a Democratic or Republican candidate);
- government agencies, courts and judges, corporations, industries, billionaires, the media, interest
  groups, foreign governments, and social or demographic groups.

"Trump's hand-picked judges" is tied to another party's leader. "The Supreme Court" alone is not.

## Attack or contrast

Code attack when the sentence criticizes the other side, or contrasts the candidate with the other
side in a way that puts the other side in a worse light.

Counts:

- saying the other side did, supported or would do something harmful, wrong or foolish;
- faulting their record, votes, positions, character, competence or honesty;
- blaming them for a problem ("Democrats' reckless spending drove up prices");
- a contrast: "Unlike my opponent, I will never vote to cut Social Security", or "Republicans voted
  against it. I voted for it." Each sentence of a contrast that carries the comparison counts.

Does not count:

- criticism with no target on the other side ("Prices are too high", "Washington is broken");
- a neutral mention ("I worked with Republicans to pass the bill", "My opponent is a former state
  senator");
- criticism of the candidate's own party or of targets that are not the other side;
- praise of the candidate or the candidate's own side.

## Threat or alarm

Code alarm when the sentence presents something as a danger, a crisis or a threat to the country, a
state, a community, a group of people or the voter, or warns of serious harm or loss if something
happens or is not stopped.

Counts:

- danger or crisis language applied to a situation: crisis, emergency, danger, threat, under attack,
  invasion, epidemic, catastrophe, collapse, survival, "on the line", "at stake", "we could lose";
- warnings that rights, freedoms, democracy, lives, homes or livelihoods are being or will be taken
  away or destroyed;
- descriptions of deaths or violence presented as a danger to people ("Fentanyl is killing our
  kids").

Does not count:

- stating a problem or a goal in ordinary terms ("Housing costs are too high", "We need to secure
  the border", "Families are struggling with rising prices");
- strong verbs on an ordinary problem without danger or crisis framing ("Inflation is crushing
  family budgets");
- policy proposals, and criticism of a record that does not claim a danger.

The source of the danger can be anything, including the other side, a foreign country, crime, drugs,
disease, the economy or the climate. A sentence can be both attack and alarm ("Republicans want to
take away your freedom to choose").

## Incivility

Code incivility when the sentence insults or ridicules people on the other side or applies a
disparaging label to them.

Counts:

- name-calling and insults: liar, crook, clown, corrupt, traitor, puppet, coward, nicknames such as
  "Sleepy Joe";
- disparaging labels applied to people or a party: extremist, radical, socialist, communist,
  fascist, un-American, "MAGA extremists", "the radical left";
- mockery, sarcasm or vulgarity aimed at them;
- accusing them of lying.

Does not count:

- harsh criticism of records, votes or policies, even in strong words ("a disastrous vote", "an
  extreme abortion ban"), where the label applies to the policy and not to people;
- a neutral description of someone's party or ideology ("my Republican opponent", "a progressive
  Democrat");
- insults aimed at targets that are not the other side.

## Polarity (hand coding only)

Polarity checks the general sentiment tools. Code one of three values.

- Positive: the sentence expresses approval, hope, pride, gratitude or praise, reports an
  accomplishment, or promises to make something better.
- Negative: the sentence expresses disapproval, criticism, anger, fear or worry, or describes
  something bad, such as a harm, a problem, a failure or a threat.
- Neutral: neither, including factual statements (biography, dates, procedures, contact details), or
  positive and negative in equal measure.

Code the stance the sentence expresses, not its topic. "I will fight to keep our neighborhoods safe"
is positive, because it is a promise. "Violent crime has doubled in our city" is negative. When a
sentence both names a problem and promises a fix, code what it mainly does: "I will lower the costs
that are squeezing families" is positive, and "Families are being squeezed by costs Washington refuses
to address" is negative.
