# 2026 New England results: collection notes

Compiled 2026-11-04T03:11Z (about 10:11 p.m. ET on election night, Nov 3). Every figure in `results.json` comes from a WebSearch result summary and has a source URL. Nothing is estimated. Most counts are early, partial snapshots. Each race's `asOf` field and `note` say which snapshot was used. When sources disagreed, I kept the snapshot with the highest share of the vote reported and listed the others in `note`.

## Coverage

**Called (30):**
- Governor: CT (Lamont), MA (Healey), RI (Foulkes)
- U.S. Senate: NH (Pappas, an open seat that stays D), MA (Markey), RI (Reed)
- Lt. Governor: MA Driscoll and CT Bysiewicz (joint tickets); RI Matos (Loughlin conceded); VT Molly Gray (D flip; Rodgers conceded)
- RI down-ballot: AG Ahern, SOS Amore (unopposed), Treasurer Diossa
- U.S. House: ME-1 Pingree, NH-1 Stefany Shaheen, NH-2 Goodlander, VT-AL Balint, MA-1 Neal, MA-2 McGovern, MA-5 Clark, MA-7 Pressley, RI-1 Amo, RI-2 Magaziner
- 7 NH/RI state House district results from local outlets

**Too close:**
- **NH governor.** Ayotte 49.9% vs Warmington 48.0% at 55% of the expected vote. The lead flipped during the count.
- **ME U.S. Senate.** Jackson 51% vs Collins 49% at 17%. A DDHQ snapshot of unknown time had Collins ahead by 0.08 points. Ranked-choice voting is possible.

**Leading, not called:**
- ME governor (Pingree 51–41 at 12%)
- VT governor (Scott 52.9–45.4 at 72%)
- ME-2 (LePage 54.5–45.5 at 17%)
- MA-3, MA-4, MA-6 (Koh declared victory; no AP call), MA-8, MA-9
- CT-1 through CT-5, all at 1–12% reporting
- CT AG, SOS, Treasurer and Comptroller
- MA AG and SOS
- VT AG and SOS

**No data (nominees only):**
- MA Treasurer, MA Auditor
- VT Treasurer, VT Auditor
- NH Executive Council, all 5 seats (nominees from the Citizens Count primary page; D5 has none)

**Missing entirely:**
- County-level results. No FIPS-level numbers turned up for any race.
- State legislative chamber totals for all 12 chambers. The `chambers` entries carry only `preElection` composition, with `undecided` set to the full seat count.
- MA Governor's Council. WBUR has a results page, but no numbers showed up in search.
- The Republican Lt. Governor nominee for MA.
- Exact NH-1 percentages. NBC showed roughly 59–41 at 47.9%, but the exact figures weren't captured.

**Caveats:**
- Party for RI governor candidate Jasjit Gotra is unknown (coded O). C. D. Reynolds is coded I.
- VT House Addison-2: "Byker wins" (addisonindependent.com/2026/11/03/vermont-election-returns-trickle-in/). It is not in the JSON because the party is unknown.

## What worked (for the recurring updater)

- **Use `mode: "extended"`.** Standard mode returned only 2022/2024 pages. Extended mode surfaced live 2026 pages.
- **Name both candidates and add the date.** Queries like "Lamont Fazio Connecticut governor results November 3 2026" and "Pingree Charles Bennett Maine governor election night results November 3 2026" worked best. Searches for "X wins", "X defeats Y" or "AP race call X" found the call articles.
- **NBC national aggregate tables** give % of the expected vote for every state in one hit. The third, unlabeled number is the expected-vote %. Query "NBC News Secretary of State 2026 Midterm Elections Live Results ..." or "NBC News governor results 2026 all states ...". Pages:
  - nbcnews.com/politics/2026-elections/governor-results
  - nbcnews.com/politics/2026-elections/secretary-of-state-results
  - nbcnews.com/politics/2026-elections/attorney-general-results
- **Per-race NBC pages:** nbcnews.com/politics/2026-elections/{state}-{office}-results, plus `-us-house-district-N-results`.
- **NBC affiliate pages** with vote counts:
  - nbcboston.com/elections/ma-nh-maine-midterm-results-2026/4034229/ (MA House table)
  - nbcboston.com/elections/2026-midterm-voting-live-updates-mass-nh-maine/4038516/ (live blog, newest NH governor numbers)
  - nbcconnecticut.com/elections/connecticut-midterm-election-results-2026/3787258/ (all CT statewide races and House)
- **RI official results** appear in search snippets with full vote counts: electionresults.ri.gov/results/public/RhodeIsland/elections/2026StatewideGeneralElection. Query "electionresults.ri.gov 2026 Statewide General Election governor ... votes".
- **Rhode Island Current** (rhodeislandcurrent.com/2026/11/03/...) has an article for each RI race.
- **AP wire headlines** are syndicated on wtop.com/national/2026/11/... and yahoo.com. Fox's House page (foxnews.com/elections/2026/midterm-results/house) lists AP call times.
- **Maine:**
  - pressherald.com/2026/11/03/polls-open-across-maine-on-election-day/ (live blog)
  - ABC: abcnews.com/Politics/maine-2026-live-midterm-election-results/story?id=136761571 (Senate vote counts)
  - DDHQ: votes.decisiondeskhq.com/races/2026-11-03/maine-us-senate-general-election
  - bangordailynews.com (calls)
- **NH:** nhpr.org/live-updates/election-day-live-blog-newhampshire-voting-2026, plus Concord Monitor, NH Bulletin and Axios.
- **VT:**
  - vtdigger.org/2026/11/03/...
  - wcax.com/2026/11/04/... (wcax also has a town-by-town visualization at /2026/11/04/2026-vermont-town-by-town-results-live-data-visualization/)
  - vermontpublic.org/live-updates/live-updates-vermont-general-election-2026
  - poliwave.com/us/live/midterms-2026/vermont
- **MA:**
  - WBUR, including a dashboard at media.wbur.org/embeds/2026/general-election/dashboard/index.html and a Governor's Council page at wbur.org/news/2026/11/03/massachusetts-2026-election-results-governors-council
  - Boston Globe live blog: bostonglobe.com/2026/11/03/nation/massachusetts-election-live-updates-results-2026/
  - boston25news results pages
- **CT Mirror** has per-race live pages, e.g. ctmirror.org/2026/11/03/ct-governor-2026-live-election-results/, ct-senate-2026-..., ct-house-of-representatives-2026-.... Their snippets were still empty when searched, so re-query them.
- **Legislature:** local outlets work. Keene: mykeenenow.com, keenesentinel.com live results. Warwick: warwickpost.com. Statewide chamber tallies were not out yet. Next time, try "New Hampshire House majority 2026 results Republicans keep" and "Vermont supermajority 2026 results".
- **Pitfalls:**
  - The Wikipedia 2026 VT governor page claims Scott "broke Democratic supermajorities." That text was carried over from 2024. Ignore it.
  - Ballotpedia headline numbers are often from 2022/2024.
  - MultiState pages list winners only for a few races.
  - NBC pages sometimes show percentages with 0 votes (placeholders).
