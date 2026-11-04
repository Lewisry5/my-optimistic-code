# New England Election Map — data & updating

The page is `election.html` (repo root). It loads:

| File | What it is | Changes |
|---|---|---|
| `data/geo.topo.json` | District shapes for CT, ME, MA, NH, RI, VT: `states`, `counties`, `cd` (U.S. House), `sldu` (state senate), `sldl` (state house), `sldl_flot` (27 NH House floterial districts, drawn as outlines). Census 2022 cartographic boundaries (the maps used for the 2022, 2024 and 2026 elections). | Static |
| `data/officeholders.json` | Who holds every seat before the 2026 election: governor, U.S. Senate (both seats), U.S. House, state senate, state house, statewide officers, NH Executive Council and MA Governor's Council. Includes `upIn2026` for each seat. | Static (pre-election snapshot) |
| `data/results.json` | 2026 results. **The page re-fetches this every 90 seconds**, so pushing an updated file updates the map for anyone who has it open. | Updated repeatedly |
| `data/notes-*.md` | Sources, coverage, gaps and district-name formats for each data set. | Reference |

## `results.json` format

```jsonc
{
  "election": "2026-11-03",
  "updated": "2026-11-04T03:11:09Z",      // ISO time of the newest figures; the page shows it
  "notes": "…",
  "races": [
    {
      "id": "NH-gov", "office": "gov", "st": "NH", "district": null,
      "candidates": [
        { "name": "Kelly Ayotte", "party": "R", "votes": 189359, "pct": 49.9, "incumbent": true, "winner": false }
      ],
      "reportingPct": 55, "called": false, "calledBy": "AP",
      "status": "called | leading | too-close | no-data",
      "counties": { "33011": [ { "party": "R", "votes": 1234 }, { "party": "D", "votes": 1200 } ] },  // optional
      "seats": 1,                         // optional, for multi-member districts (NH/VT house)
      "sources": ["https://…"], "asOf": "…"
    }
  ],
  "chambers": [
    { "st": "NH", "office": "sthouse", "seats": 400, "D": 0, "R": 0, "other": 0, "undecided": 400, "control": null, "called": false }
  ]
}
```

- `office`: `gov`, `ltgov`, `ag`, `sos`, `treas`, `auditor`, `comptroller`, `ussen`, `ushouse`, `stsen`, `sthouse`, `execcouncil`, `govcouncil`.
- `party`: `D`, `R`, `I`, `P` (VT Progressive), `L`, `G`, `O`.
- `district` is matched to a shape loosely (case, "District", zero padding, "and"/"&"/hyphens are ignored): `"2"`, `"AL"`, `"Hillsborough 12"`, `"1st Barnstable"`, `"Chittenden-1"`, `"First Middlesex"`. If a name won't match, add `"geo": "<feature id>"` (for example `"NH-524"` or `"MA-D01"`). The ids are listed in `data/notes-geo.md`.
- A race is drawn as **called** when `called` is true or any candidate has `winner: true`. Otherwise the candidate with the most votes or highest `pct` is drawn as **leading**. With no numbers, the seat shows as awaiting results.
- Statewide races are drawn by county when `counties` is present (5-digit county FIPS keys). Otherwise every county takes the statewide result.

## Checking locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000/election.html
```
In the browser console, `NEMap.rIdx.unmatched` lists result rows whose district did not match a shape.
