# Officeholder data notes (New England, incumbents as of 2026-11-04)

Generated 2026-11-04T03:12:44+00:00 into `election/data/officeholders.json` (1370 seat rows). These are the officeholders serving *before* the Nov 3, 2026 election takes effect; no 2026 results are reflected.

## Sources (all retrieved 2026-11-04)

| Source | Used for | URL |
|---|---|---|
| openstates/people YAML (`data/<st>/legislature/*.yml`, `executive/*.yml`, `retired/*.yml`) | All state legislators, vacancy detection, most statewide officers | https://github.com/openstates/people (files fetched from `raw.githubusercontent.com/openstates/people/main/...`; per-seat `source` is the raw file URL) |
| unitedstates/congress-legislators `legislators-current.json` | US Senate (with class) and US House | https://raw.githubusercontent.com/unitedstates/congress-legislators/gh-pages/legislators-current.json |
| WebSearch snippets (Ballotpedia, Vermont Public, Maine Public, Bangor Daily News, stateagreport.com, RI Current, Hartford Business) | NH Executive Council, MA Governor's Council, VT Lt Gov party, ME legislature-chosen officers, NH AG, CT/RI treasurers | URL on each seat, marked "(via WebSearch snippet)" |
| Model knowledge (last resort) | CT Comptroller Sean Scanlon (D), VT Treasurer Mike Pieciak (D), VT Auditor Doug Hoffer (D/P), NH SoS David Scanlan (R), NH Treasurer Monica Mezzapelle (party null) | `"source": "knowledge"` |

File enumeration: openstates file names include UUIDs, so they were listed with GitHub code search (`repo:openstates/people path:data/<st>/legislature`, plus `Republican`/`Democratic`/`lower`/county-name variants to catch missed index entries; the variants found no additional files). The `retired` directories were searched for `2025`/`2026` to find mid-term departures.

## How current is the data

- openstates legislator files include role start dates as recent as 2026-07-15 (ME House 29, Nancy Theriault) and departures (retired-file end dates) as recent as 2026-08-31 (RI House 31). Latest role starts per chamber are listed below. The data looks current to about September 2026. A departure or special election after that would not be captured.
- Each chamber's total (current members plus detected vacancies) matches its constitutional size exactly: CT 151/36, ME 151 (+2 tribal)/35, MA 160/40, NH 400/24, RI 75/38, VT 150/30. That is strong evidence the enumeration is complete.
- openstates `executive` data is patchy and partly wrong. It gives NH SoS David Scanlan as "Democratic" with an expired role (he is a Republican), VT Lt Gov John Rodgers as "Democratic" (he was elected Lt Gov as a Republican in 2024/Jan 2025), and Maine SoS Bellows with a role ending 2025-01-06 (she was re-elected by the Legislature in Dec 2024). The curated values in the JSON override these.
- congress-legislators: all 12 senators and 21 House members are present, with terms ending 2027-01-03 (House and Class II) or later. There are no vacancies.
- Party in openstates is one current label per person, with no party history. Party switches during the term show only as the current label.

## Counts

| State | Office | D | R | I | DP | Vacant | other | total |
|---|---|---|---|---|---|---|---|---|
| CT | ag | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| CT | comptroller | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| CT | gov | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| CT | ltgov | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| CT | sos | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| CT | sthouse | 102 | 49 | 0 | 0 | 0 | 0 | 151 |
| CT | stsen | 25 | 11 | 0 | 0 | 0 | 0 | 36 |
| CT | treas | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| CT | ushouse | 5 | 0 | 0 | 0 | 0 | 0 | 5 |
| CT | ussen | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| MA | ag | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| MA | auditor | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| MA | gov | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| MA | govcouncil | 8 | 0 | 0 | 0 | 0 | 0 | 8 |
| MA | ltgov | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| MA | sos | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| MA | sthouse | 131 | 25 | 1 | 0 | 3 | 0 | 160 |
| MA | stsen | 35 | 5 | 0 | 0 | 0 | 0 | 40 |
| MA | treas | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| MA | ushouse | 9 | 0 | 0 | 0 | 0 | 0 | 9 |
| MA | ussen | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| ME | ag | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| ME | auditor | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| ME | gov | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| ME | sos | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| ME | sthouse | 75 | 73 | 5 | 0 | 0 | 0 | 153 |
| ME | stsen | 20 | 14 | 1 | 0 | 0 | 0 | 35 |
| ME | treas | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| ME | ushouse | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| ME | ussen | 0 | 1 | 1 | 0 | 0 | 0 | 2 |
| NH | ag | 0 | 1 | 0 | 0 | 0 | 0 | 1 |
| NH | execcouncil | 1 | 4 | 0 | 0 | 0 | 0 | 5 |
| NH | gov | 0 | 1 | 0 | 0 | 0 | 0 | 1 |
| NH | sos | 0 | 1 | 0 | 0 | 0 | 0 | 1 |
| NH | sthouse | 169 | 211 | 2 | 0 | 18 | 0 | 400 |
| NH | stsen | 8 | 16 | 0 | 0 | 0 | 0 | 24 |
| NH | treas | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| NH | ushouse | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| NH | ussen | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| RI | ag | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| RI | gov | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| RI | ltgov | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| RI | sos | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| RI | sthouse | 63 | 10 | 1 | 0 | 1 | 0 | 75 |
| RI | stsen | 34 | 4 | 0 | 0 | 0 | 0 | 38 |
| RI | treas | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| RI | ushouse | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| RI | ussen | 2 | 0 | 0 | 0 | 0 | 0 | 2 |
| VT | ag | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| VT | auditor | 0 | 0 | 0 | 1 | 0 | 0 | 1 |
| VT | gov | 0 | 1 | 0 | 0 | 0 | 0 | 1 |
| VT | ltgov | 0 | 1 | 0 | 0 | 0 | 0 | 1 |
| VT | sos | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| VT | sthouse | 88 | 57 | 3 | 2 | 0 | 0 | 150 |
| VT | stsen | 14 | 13 | 0 | 3 | 0 | 0 | 30 |
| VT | treas | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| VT | ushouse | 1 | 0 | 0 | 0 | 0 | 0 | 1 |
| VT | ussen | 1 | 0 | 1 | 0 | 0 | 0 | 2 |

Notes on counts:
- ME `sthouse` holds 153 rows: 151 voting districts plus 2 non-voting tribal representatives, districts `Passamaquoddy Tribe` and `Houlton Band of Maliseet Indians`. The tribal rows have `nonVoting: true` and `upIn2026: false`, because the tribes choose them and they are not on the state ballot. Drop them for map joins.
- CT: 25 `D` rows (21 House, 4 Senate) carry fusion labels `Democratic/Working Families` or `Democratic/Independence/Working Families`. They are normalized to `D` and the raw label is kept in `partyRaw`.
- VT: openstates labels 5 legislators `Democratic/Progressive`, stored as `DP` with `partyRaw`. openstates appears not to distinguish Progressive-first (P/D) members or pure Progressives: it shows no `Progressive` label at all. The VT Progressive caucus is probably under-counted (some P/D members show as plain `Democratic`).
- NH Treasurer has `party: null`. She is a career official elected by the Legislature, and no party affiliation was found.
- `upIn2026: false` applies to: US Senate Class I/III seats (CT both, MA Warren, ME King, RI Whitehouse, VT both, NH Hassan); ME AG/SoS/Treasurer/Auditor (chosen by the Legislature, `elected: false`); NH AG (appointed), SoS and Treasurer (chosen by the Legislature), all `elected: false`; ME tribal reps. Everything else is `true`.
- Offices that do not exist or are not popularly elected, and so are omitted: NH and ME Lt Gov (NH: the Senate President is first in line; ME: the Senate President succeeds); CT and RI auditor (appointed by the legislature); MA and RI comptroller (appointed); NH auditor.

## Vacancies (22 legislative seats; `party: "Vacant"`, `name: null`)

Detection works per district: departures this term (an openstates role ending after 2025-01-10, from `retired/` or from a current member's ended role) minus mid-term replacements (current members whose role started after 2025-01-10). openstates end dates can lag the real vacancy date by days to weeks. Several dated 2026-01-24 look like batch-update dates. A vacancy filled by a special election in Sept–Oct 2026 may not be reflected yet.

| State | Chamber | District | Vacated by | Former party | openstates end date |
|---|---|---|---|---|---|
| MA | sthouse | 16th Middlesex | Rodney Elliott | Democratic | 2026-08-12 |
| MA | sthouse | 17th Middlesex | Vanna Howard | Democratic | 2026-03-18 |
| MA | sthouse | 1st Franklin | Natalie Blais | Democratic | 2026-01-28 |
| NH | sthouse | Belknap 2 | Matty Lunney | Republican | 2026-01-24 |
| NH | sthouse | Belknap 5 | Charlie St. Clair | Democratic | 2026-08-22 |
| NH | sthouse | Belknap 6 | Harry Bean | Republican | 2026-04-02 |
| NH | sthouse | Cheshire 1 | Dylan Germana | Democratic | 2026-02-11 |
| NH | sthouse | Coos 6 | Mike Murphy | Republican | 2026-06-03 |
| NH | sthouse | Grafton 9 | Thomas Oppel | Democratic | 2026-08-03 |
| NH | sthouse | Hillsborough 1 | Sandra Panek | Republican | 2026-04-02 |
| NH | sthouse | Hillsborough 24 | Don Bouchard | Democratic | 2026-01-24 |
| NH | sthouse | Hillsborough 29 | Sheila Seidel | Republican | 2026-01-24 |
| NH | sthouse | Hillsborough 39 | Jon Morton | Republican | 2026-07-29 |
| NH | sthouse | Hillsborough 40 | Suraj Budathoki | Democratic | 2026-06-03 |
| NH | sthouse | Hillsborough 41 | Tim Hartnett | Democratic | 2026-07-30 |
| NH | sthouse | Hillsborough 6 | Sue Vail | Democratic | 2026-06-15 |
| NH | sthouse | Rockingham 11 | Linda Haskins | Democratic | 2026-07-29 |
| NH | sthouse | Rockingham 22 | Kate Murray | Democratic | 2026-08-03 |
| NH | sthouse | Rockingham 24 | Jaci Grote | Democratic | 2026-07-29 |
| NH | sthouse | Rockingham 25 | Fred Doucette | Republican | 2025-03-26 |
| NH | sthouse | Rockingham 5 | Michael Vose | Republican | 2026-08-27 |
| RI | sthouse | 31 | Julie Casimiro | Democratic | 2026-08-31 |

Districts with no member left (whole district vacant): NH `Cheshire 1`, `Coos 6`, `Grafton 9`, `Rockingham 22`; MA `1st Franklin`, `16th Middlesex`, `17th Middlesex`; RI House `31`. MA `17th Middlesex` was vacated when Vanna Howard moved to the First Middlesex Senate seat (Senate role start 2026-03-18). No legislative district is missing data. Every seat has a member or an explicit Vacant row.

Other known caveats:
- NH AG John Formella: Gov. Ayotte declined to renew his term in Mar 2025 "for now" (openstates ends his role 2025-03-31). Search snippets say he was later reconfirmed (stateagreport lists the term to 2029). Medium confidence.
- ME Auditor Matthew Dunlap was a 2026 candidate for ME-2. He remains auditor until a successor is chosen.
- VT Lt Gov John Rodgers (R) was elected by the Legislature in Jan 2025.

## District name formats (for joining to TIGER SLDU/SLDL)

`district` is stored exactly as openstates labels it. No normalization was applied, so there is no `districtRaw`.

| State | Chamber | Format | Examples | Join hint |
|---|---|---|---|---|
| CT | stsen | integer string, no padding | `1` … `36` | TIGER SLDUST `001`–`036` (zero-pad to 3) |
| CT | sthouse | integer string | `1` … `151` | SLDLST `001`–`151` |
| ME | stsen | integer string | `1` … `35` | SLDUST zero-pad to 3 |
| ME | sthouse | integer string, plus 2 tribal names | `1` … `151`, `Passamaquoddy Tribe`, `Houlton Band of Maliseet Indians` | SLDLST zero-pad to 3; drop tribal rows |
| MA | stsen | spelled-out ordinal + county list, or a named district | `First Middlesex`, `Second Essex and Middlesex`, `Cape and Islands`, `Berkshire, Hampden, Franklin and Hampshire`, `Worcester and Middlesex` | TIGER SLDU NAMELSAD uses the same county wording. Match names case-insensitively, normalizing `and`/commas |
| MA | sthouse | numeric ordinal (`1st`,`2nd`,`3rd`,`10th`) + county; one named district | `1st Barnstable`, `10th Bristol`, `37th Middlesex`, `19th Suffolk`, `Barnstable, Dukes and Nantucket` | TIGER SLDL names are typically spelled out ("First Barnstable"). Convert the ordinal number to words or vice versa |
| NH | stsen | integer string | `1` … `24` | SLDUST zero-pad to 3 |
| NH | sthouse | `<County> <n>` (county name, space, integer); 203 districts, including floterial districts that overlap base districts | `Belknap 1`, `Hillsborough 12` (8 seats), `Rockingham 13` (10 seats), `Coos 7`, `Sullivan 8` | TIGER NH SLDL names look like "Hillsborough County District 12" or similar. Parse county + number. Floterial districts overlap base districts geographically, so the join should expect overlaps |
| RI | stsen | integer string | `1` … `38` | zero-pad to 3 |
| RI | sthouse | integer string | `1` … `75` | zero-pad to 3 |
| VT | stsen | county-based names; 16 districts, 1–3 seats each | `Addison`, `Chittenden Central`, `Chittenden North`, `Chittenden Southeast`, `Grand Isle`, `Windsor` | TIGER VT SLDU names match these county names |
| VT | sthouse | hyphenated `<County>[-<County>…][-<n>]`; 109 districts, 1–2 seats each | `Addison-1`, `Addison-Rutland`, `Chittenden-17`, `Windsor-Orange-1`, `Windsor-Windham` | TIGER VT SLDL names are similar but may use spaces or abbreviations (e.g., `Chittenden-17` vs `CHI-17`). Normalize hyphens/spaces/case |

### Full district lists for multi-member / named chambers (seat counts in parentheses where any district has more than 1 seat; vacancies included)

### MA stsen: 40 seats in 40 districts; latest roleStart 2026-03-18
Berkshire, Hampden, Franklin and Hampshire, Bristol and Norfolk, Cape and Islands, Fifth Middlesex, First Bristol and Plymouth, First Essex, First Essex and Middlesex, First Middlesex, First Plymouth and Norfolk, First Suffolk, First Worcester, Fourth Middlesex, Hampden, Hampden and Hampshire, Hampden, Hampshire and Worcester, Hampshire, Franklin and Worcester, Middlesex and Norfolk, Middlesex and Suffolk, Middlesex and Worcester, Norfolk and Middlesex, Norfolk and Plymouth, Norfolk and Suffolk, Norfolk, Plymouth and Bristol, Norfolk, Worcester and Middlesex, Plymouth and Barnstable, Second Bristol and Plymouth, Second Essex, Second Essex and Middlesex, Second Middlesex, Second Plymouth and Norfolk, Second Suffolk, Second Worcester, Suffolk and Middlesex, Third Bristol and Plymouth, Third Essex, Third Middlesex, Third Suffolk, Worcester and Hampden, Worcester and Hampshire, Worcester and Middlesex

### MA sthouse: 160 seats in 160 districts; latest roleStart 2026-04-15
1st Barnstable, 1st Berkshire, 1st Bristol, 1st Essex, 1st Franklin, 1st Hampden, 1st Hampshire, 1st Middlesex, 1st Norfolk, 1st Plymouth, 1st Suffolk, 1st Worcester, 2nd Barnstable, 2nd Berkshire, 2nd Bristol, 2nd Essex, 2nd Franklin, 2nd Hampden, 2nd Hampshire, 2nd Middlesex, 2nd Norfolk, 2nd Plymouth, 2nd Suffolk, 2nd Worcester, 3rd Barnstable, 3rd Berkshire, 3rd Bristol, 3rd Essex, 3rd Hampden, 3rd Hampshire, 3rd Middlesex, 3rd Norfolk, 3rd Plymouth, 3rd Suffolk, 3rd Worcester, 4th Barnstable, 4th Bristol, 4th Essex, 4th Hampden, 4th Middlesex, 4th Norfolk, 4th Plymouth, 4th Suffolk, 4th Worcester, 5th Barnstable, 5th Bristol, 5th Essex, 5th Hampden, 5th Middlesex, 5th Norfolk, 5th Plymouth, 5th Suffolk, 5th Worcester, 6th Bristol, 6th Essex, 6th Hampden, 6th Middlesex, 6th Norfolk, 6th Plymouth, 6th Suffolk, 6th Worcester, 7th Bristol, 7th Essex, 7th Hampden, 7th Middlesex, 7th Norfolk, 7th Plymouth, 7th Suffolk, 7th Worcester, 8th Bristol, 8th Essex, 8th Hampden, 8th Middlesex, 8th Norfolk, 8th Plymouth, 8th Suffolk, 8th Worcester, 9th Bristol, 9th Essex, 9th Hampden, 9th Middlesex, 9th Norfolk, 9th Plymouth, 9th Suffolk, 9th Worcester, 10th Bristol, 10th Essex, 10th Hampden, 10th Middlesex, 10th Norfolk, 10th Plymouth, 10th Suffolk, 10th Worcester, 11th Bristol, 11th Essex, 11th Hampden, 11th Middlesex, 11th Norfolk, 11th Plymouth, 11th Suffolk, 11th Worcester, 12th Bristol, 12th Essex, 12th Hampden, 12th Middlesex, 12th Norfolk, 12th Plymouth, 12th Suffolk, 12th Worcester, 13th Bristol, 13th Essex, 13th Middlesex, 13th Norfolk, 13th Suffolk, 13th Worcester, 14th Bristol, 14th Essex, 14th Middlesex, 14th Norfolk, 14th Suffolk, 14th Worcester, 15th Essex, 15th Middlesex, 15th Norfolk, 15th Suffolk, 15th Worcester, 16th Essex, 16th Middlesex, 16th Suffolk, 16th Worcester, 17th Essex, 17th Middlesex, 17th Suffolk, 17th Worcester, 18th Essex, 18th Middlesex, 18th Suffolk, 18th Worcester, 19th Middlesex, 19th Suffolk, 19th Worcester, 20th Middlesex, 21st Middlesex, 22nd Middlesex, 23rd Middlesex, 24th Middlesex, 25th Middlesex, 26th Middlesex, 27th Middlesex, 28th Middlesex, 29th Middlesex, 30th Middlesex, 31st Middlesex, 32nd Middlesex, 33rd Middlesex, 34th Middlesex, 35th Middlesex, 36th Middlesex, 37th Middlesex, Barnstable, Dukes and Nantucket

### NH stsen: 24 seats in 24 districts; latest roleStart 2024-12-04
1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24

### NH sthouse: 400 seats in 203 districts; latest roleStart 2026-03-25
Belknap 1 (1), Belknap 2 (2), Belknap 3 (1), Belknap 4 (1), Belknap 5 (4), Belknap 6 (4), Belknap 7 (3), Belknap 8 (2), Carroll 1 (3), Carroll 2 (2), Carroll 3 (2), Carroll 4 (2), Carroll 5 (1), Carroll 6 (2), Carroll 7 (1), Carroll 8 (2), Cheshire 1 (1), Cheshire 2 (1), Cheshire 3 (1), Cheshire 4 (1), Cheshire 5 (1), Cheshire 6 (2), Cheshire 7 (1), Cheshire 8 (1), Cheshire 9 (1), Cheshire 10 (2), Cheshire 11 (1), Cheshire 12 (1), Cheshire 13 (1), Cheshire 14 (1), Cheshire 15 (2), Cheshire 16 (1), Cheshire 17 (1), Cheshire 18 (2), Coos 1 (2), Coos 2 (1), Coos 3 (1), Coos 4 (1), Coos 5 (2), Coos 6 (1), Coos 7 (1), Grafton 1 (3), Grafton 2 (1), Grafton 3 (1), Grafton 4 (1), Grafton 5 (2), Grafton 6 (1), Grafton 7 (1), Grafton 8 (3), Grafton 9 (1), Grafton 10 (1), Grafton 11 (1), Grafton 12 (4), Grafton 13 (1), Grafton 14 (1), Grafton 15 (1), Grafton 16 (1), Grafton 17 (1), Grafton 18 (1), Hillsborough 1 (4), Hillsborough 2 (7), Hillsborough 3 (3), Hillsborough 4 (3), Hillsborough 5 (3), Hillsborough 6 (3), Hillsborough 7 (3), Hillsborough 8 (3), Hillsborough 9 (3), Hillsborough 10 (3), Hillsborough 11 (3), Hillsborough 12 (8), Hillsborough 13 (6), Hillsborough 14 (2), Hillsborough 15 (2), Hillsborough 16 (2), Hillsborough 17 (2), Hillsborough 18 (2), Hillsborough 19 (2), Hillsborough 20 (2), Hillsborough 21 (2), Hillsborough 22 (2), Hillsborough 23 (2), Hillsborough 24 (2), Hillsborough 25 (2), Hillsborough 26 (2), Hillsborough 27 (1), Hillsborough 28 (2), Hillsborough 29 (4), Hillsborough 30 (3), Hillsborough 31 (1), Hillsborough 32 (3), Hillsborough 33 (2), Hillsborough 34 (3), Hillsborough 35 (2), Hillsborough 36 (2), Hillsborough 37 (1), Hillsborough 38 (2), Hillsborough 39 (2), Hillsborough 40 (4), Hillsborough 41 (3), Hillsborough 42 (3), Hillsborough 43 (4), Hillsborough 44 (2), Hillsborough 45 (1), Merrimack 1 (1), Merrimack 2 (1), Merrimack 3 (2), Merrimack 4 (2), Merrimack 5 (2), Merrimack 6 (1), Merrimack 7 (2), Merrimack 8 (3), Merrimack 9 (4), Merrimack 10 (4), Merrimack 11 (1), Merrimack 12 (2), Merrimack 13 (2), Merrimack 14 (1), Merrimack 15 (1), Merrimack 16 (1), Merrimack 17 (1), Merrimack 18 (1), Merrimack 19 (1), Merrimack 20 (1), Merrimack 21 (1), Merrimack 22 (1), Merrimack 23 (1), Merrimack 24 (1), Merrimack 25 (1), Merrimack 26 (1), Merrimack 27 (2), Merrimack 28 (1), Merrimack 29 (1), Merrimack 30 (1), Rockingham 1 (3), Rockingham 2 (3), Rockingham 3 (1), Rockingham 4 (3), Rockingham 5 (2), Rockingham 6 (1), Rockingham 7 (1), Rockingham 8 (1), Rockingham 9 (2), Rockingham 10 (3), Rockingham 11 (4), Rockingham 12 (2), Rockingham 13 (10), Rockingham 14 (2), Rockingham 15 (2), Rockingham 16 (7), Rockingham 17 (4), Rockingham 18 (2), Rockingham 19 (1), Rockingham 20 (3), Rockingham 21 (1), Rockingham 22 (1), Rockingham 23 (1), Rockingham 24 (2), Rockingham 25 (9), Rockingham 26 (1), Rockingham 27 (1), Rockingham 28 (1), Rockingham 29 (4), Rockingham 30 (2), Rockingham 31 (2), Rockingham 32 (1), Rockingham 33 (1), Rockingham 34 (1), Rockingham 35 (1), Rockingham 36 (1), Rockingham 37 (1), Rockingham 38 (1), Rockingham 39 (1), Rockingham 40 (1), Strafford 1 (2), Strafford 2 (3), Strafford 3 (1), Strafford 4 (3), Strafford 5 (1), Strafford 6 (1), Strafford 7 (1), Strafford 8 (1), Strafford 9 (1), Strafford 10 (4), Strafford 11 (3), Strafford 12 (4), Strafford 13 (1), Strafford 14 (1), Strafford 15 (1), Strafford 16 (1), Strafford 17 (1), Strafford 18 (1), Strafford 19 (3), Strafford 20 (1), Strafford 21 (3), Sullivan 1 (1), Sullivan 2 (1), Sullivan 3 (3), Sullivan 4 (1), Sullivan 5 (1), Sullivan 6 (3), Sullivan 7 (1), Sullivan 8 (2)

1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38

1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75

### VT stsen: 30 seats in 16 districts; latest roleStart 2026-01-02
Addison (2), Bennington (2), Caledonia (1), Chittenden Central (3), Chittenden North (1), Chittenden Southeast (3), Essex (1), Franklin (2), Grand Isle (1), Lamoille (1), Orange (1), Orleans (1), Rutland (3), Washington (3), Windham (2), Windsor (3)

### VT sthouse: 150 seats in 109 districts; latest roleStart 2026-04-16
Addison-1 (2), Addison-2 (1), Addison-3 (2), Addison-4 (2), Addison-5 (1), Addison-Rutland (1), Bennington-1 (1), Bennington-2 (2), Bennington-3 (1), Bennington-4 (2), Bennington-5 (2), Bennington-Rutland (1), Caledonia-1 (1), Caledonia-2 (1), Caledonia-3 (2), Caledonia-Essex (2), Caledonia-Washington (1), Chittenden-1 (1), Chittenden-2 (2), Chittenden-3 (2), Chittenden-4 (1), Chittenden-5 (1), Chittenden-6 (1), Chittenden-7 (1), Chittenden-8 (1), Chittenden-9 (1), Chittenden-10 (1), Chittenden-11 (1), Chittenden-12 (1), Chittenden-13 (2), Chittenden-14 (2), Chittenden-15 (2), Chittenden-16 (2), Chittenden-17 (1), Chittenden-18 (2), Chittenden-19 (2), Chittenden-20 (2), Chittenden-21 (2), Chittenden-22 (2), Chittenden-23 (2), Chittenden-24 (1), Chittenden-25 (1), Chittenden-Franklin (2), Essex-Caledonia (1), Essex-Orleans (1), Franklin-1 (2), Franklin-2 (1), Franklin-3 (1), Franklin-4 (2), Franklin-5 (2), Franklin-6 (1), Franklin-7 (1), Franklin-8 (1), Grand Isle-Chittenden (2), Lamoille-1 (1), Lamoille-2 (2), Lamoille-3 (1), Lamoille-Washington (2), Orange-1 (1), Orange-2 (1), Orange-3 (1), Orange-Caledonia (1), Orange-Washington-Addison (2), Orleans-1 (1), Orleans-2 (1), Orleans-3 (1), Orleans-4 (1), Orleans-Lamoille (2), Rutland-1 (1), Rutland-2 (2), Rutland-3 (1), Rutland-4 (1), Rutland-5 (1), Rutland-6 (1), Rutland-7 (1), Rutland-8 (1), Rutland-9 (1), Rutland-10 (1), Rutland-11 (1), Rutland-Bennington (1), Rutland-Windsor (1), Washington-1 (2), Washington-2 (2), Washington-3 (2), Washington-4 (2), Washington-5 (1), Washington-6 (1), Washington-Chittenden (2), Washington-Orange (2), Windham-1 (1), Windham-2 (1), Windham-3 (2), Windham-4 (1), Windham-5 (1), Windham-6 (1), Windham-7 (1), Windham-8 (1), Windham-9 (1), Windham-Windsor-Bennington (1), Windsor-1 (2), Windsor-2 (1), Windsor-3 (2), Windsor-4 (1), Windsor-5 (1), Windsor-6 (2), Windsor-Addison (1), Windsor-Orange-1 (1), Windsor-Orange-2 (2), Windsor-Windham (1)

