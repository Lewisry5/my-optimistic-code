# geo.topo.json — boundary data notes

File: `election/data/geo.topo.json` — TopoJSON Topology, 0.81 MB (809,516 bytes), lon/lat WGS84 (EPSG:4269 NAD83 source, treated as WGS84), quantized (`quantization=1e5`, ≈6 m grid), `bbox` included. Geometry `id` is also set to the `id` property.

No vertex simplification was applied: the Census cartographic-boundary (CB) 1:500,000 files are already generalized, and the whole six-state topology (all layers sharing arcs) is well under the 5 MB budget. Shapes are clipped to the shoreline (CB files), so there are no water-only polygons; no `ZZZ` districts exist in these files.

## Objects

| object | what | properties |
|---|---|---|
| `states` | 6 state outlines | `st`, `id` (= st), `name` |
| `counties` | 67 counties (CT = 8 legacy counties) | `st`, `id` (5-digit FIPS), `name` |
| `cd` | 21 congressional districts (118th/119th Congress) | `st`, `id` (`NH-1`, `VT-AL`), `name` |
| `sldu` | 189 state senate districts | `st`, `id` (`${st}-${SLDUST}`), `name` (TIGER NAMELSAD), `num`; MA also `alt` |
| `sldl` | 810 state house districts (NH base districts only) | `st`, `id` (`${st}-${SLDLST}`), `name` (TIGER NAMELSAD), `num` |
| `sldl_flot` | 27 of 39 NH House floterial districts (DERIVED, see below) — overlap `sldl` | `st`, `id`, `name`, `num`, `bases`, `floterial: true` |

## Sources (all downloaded via raw.githubusercontent.com)

All layers come from U.S. Census Bureau **Cartographic Boundary Files, 2022 vintage, 1:500,000** (`cb_2022_*_500k`), as GeoJSON conversions mirrored in the GitHub repo [`loganpowell/census-geojson`](https://github.com/loganpowell/census-geojson) (branch `master`, folder `GeoJSON/500k/2022/`). Direct census.gov downloads are blocked in this environment, so this mirror was used; attributes (`LSY`=2022, `CDSESSN`=118, GEOIDs) were checked and match the Census CB 2022 schema.

| layer | source URL | Census vintage / plan |
|---|---|---|
| states | `https://raw.githubusercontent.com/loganpowell/census-geojson/master/GeoJSON/500k/2022/state.json` | cb_2022_us_state_500k |
| counties (ME, MA, NH, RI, VT) | `https://raw.githubusercontent.com/loganpowell/census-geojson/master/GeoJSON/500k/2022/county.json` | cb_2022_us_county_500k |
| counties (CT legacy 8) | `https://raw.githubusercontent.com/loganpowell/census-geojson/master/GeoJSON/500k/2022/09/county-subdivision.json` (2022 town geometry) dissolved by each town's legacy county taken from `https://raw.githubusercontent.com/loganpowell/census-geojson/master/GeoJSON/500k/2021/09/county-subdivision.json` (joined on COUSUBFP) | cb_2022_09_cousub_500k + cb_2021_09_cousub_500k attributes. (CB 2022 county file itself has the 9 CT planning regions instead.) |
| cd | `https://raw.githubusercontent.com/loganpowell/census-geojson/master/GeoJSON/500k/2022/congressional-district.json` | cb_2022_us_cd118_500k — 118th Congress districts; New England maps unchanged for the 119th Congress / 2026 election |
| sldu | `https://raw.githubusercontent.com/loganpowell/census-geojson/master/GeoJSON/500k/2022/<FIPS>/state-legislative-district-_upper-chamber_.json` (FIPS 09, 23, 25, 33, 44, 50) | cb_2022_<FIPS>_sldu_500k, LSY=2022 (post-2020-census plans used for 2022/2024/2026) |
| sldl | `https://raw.githubusercontent.com/loganpowell/census-geojson/master/GeoJSON/500k/2022/<FIPS>/state-legislative-district-_lower-chamber_.json` | cb_2022_<FIPS>_sldl_500k, LSY=2022 |
| sldl_flot (NH) | derived: union of TIGER NH base districts, composition from `https://raw.githubusercontent.com/Echidne41/repapp/main/backend/data/floterial_by_base.csv` and `.../floterial_by_town.csv` (same files also in `Echidne41/Rep_App`) | third-party table, cross-checked (see below) |

Processing: Python (normalize properties) → mapshaper 0.6 (`-dissolve` for CT legacy counties and NH floterials; `combine-files` → `-o format=topojson quantization=1e5 bbox id-field=id`). Scripts are in the session scratchpad, not the repo.

## Feature counts per layer per state

| layer | CT | ME | MA | NH | RI | VT | total |
|---|---|---|---|---|---|---|---|
| states | 1 | 1 | 1 | 1 | 1 | 1 | 6 |
| counties | 8 | 16 | 14 | 10 | 5 | 14 | 67 |
| cd | 5 | 2 | 9 | 2 | 2 | 1 | 21 |
| sldu | 36 | 35 | 40 | 24 | 38 | 16 | 189 |
| sldl | 151 | 151 | 160 | 164 | 75 | 109 | 810 |
| sldl_flot | 0 | 0 | 0 | 27 | 0 | 0 | 27 |

All match the expected seat-district counts (SLDU CT 36, ME 35, MA 40, NH 24, RI 38, VT 16; SLDL CT 151, ME 151, MA 160, NH 164 base, RI 75, VT 109).

## Normalization rules for `num`

- CT, ME, RI (both chambers), NH senate: `num` = district number without zero padding (`"12"`). `id` keeps the 3-digit TIGER code (`CT-012`).
- NH house: `num` = `"<County> <n>"` without padding, e.g. `"Hillsborough 24"` (TIGER name is `State House District Hillsborough 24`; TIGER code = county digit + 2-digit number, e.g. `524`).
- MA house: `num` = TIGER NAME, e.g. `"1st Barnstable"`, `"Barnstable-Dukes-Nantucket"`. MA senate: `num` = TIGER NAME (e.g. `"Berkshire-Hampden-Franklin-Hampshire"`, `"First Worcester"`), plus `alt` = legislature-style form with commas/"and" (e.g. `"Berkshire, Hampden, Franklin and Hampshire"`). Note MA uses ordinal words ("First Middlesex") for senate but numerals ("1st Middlesex") for house.
- VT house: `num` = TIGER NAME, e.g. `"Chittenden-1"`, `"Addison-Rutland"`, `"Grand Isle-Chittenden"`. VT senate: `num` = county-based name, TIGER "Chittenden Central/North/South East" mapped to `"Chittenden-Central"`, `"Chittenden-North"`, `"Chittenden-Southeast"`; others = county name (`"Grand Isle"`).

## NH floterial districts

Census TIGER/CB contain only the 164 NH base House districts; the 39 floterial districts (2022 plan; 203 districts total) are not in any Census product. No published floterial geometry was found on reachable hosts. A third-party table (Echidne41/repapp `floterial_by_base.csv`, 163 base→floterial rows, 39 floterials; and `floterial_by_town.csv`, 131 town→floterial rows) was cross-checked against geometry: for each floterial, the towns covered by its listed base districts (area overlay of CB 2022 NH towns vs. base districts) were compared to the town list in the second table. Only the **27 floterials where both tables agree exactly** were built (dissolve of the listed base districts) and put in the separate `sldl_flot` object, so `sldl` stays a clean non-overlapping partition. Floterial `id` uses TIGER-style coding (county digit + number, e.g. `NH-008` = Belknap 8; does not collide with base codes). Treat `sldl_flot` as derived/approximate.

**Not built (12, composition unverified or tables disagree):** Hillsborough 39, Hillsborough 40 (Manchester wards – not checkable at town level), Merrimack 25 (Franklin/Northfield absent from town table), Merrimack 27 (town table adds Dunbarton, Hooksett), Merrimack 28, Merrimack 29 (Concord wards), Rockingham 36, 37, 38, 39, 40 (base and town tables conflict, e.g. Rye/Greenland/South Hampton), Strafford 20 (base Strafford 11 overlaps part of Dover). The table's claimed base lists for these are: H39 = H15,16,20; H40 = H18,19,21,22,23; M25 = M2,3; M27 = M11,14; M28 = M15,16,17; M29 = M18,23,24; R36 = R19,20; R37 = R21,22; R38 = R23; R39 = R24,26,27,28; R40 = R29,30; S20 = S10,11.

## Congressional districts (`cd`)

- **CT**: `CT-1`, `CT-2`, `CT-3`, `CT-4`, `CT-5` — name pattern `Congressional District 1`
- **ME**: `ME-1`, `ME-2` — name pattern `Congressional District 1`
- **MA**: `MA-1`, `MA-2`, `MA-3`, `MA-4`, `MA-5`, `MA-6`, `MA-7`, `MA-8`, `MA-9` — name pattern `Congressional District 1`
- **NH**: `NH-1`, `NH-2` — name pattern `Congressional District 1`
- **RI**: `RI-1`, `RI-2` — name pattern `Congressional District 1`
- **VT**: `VT-AL` — name pattern `Congressional District (at Large)`

## Counties (`counties`)

- **CT**: 09001 Fairfield County, 09003 Hartford County, 09005 Litchfield County, 09007 Middlesex County, 09009 New Haven County, 09011 New London County, 09013 Tolland County, 09015 Windham County
- **ME**: 23001 Androscoggin County, 23003 Aroostook County, 23005 Cumberland County, 23007 Franklin County, 23009 Hancock County, 23011 Kennebec County, 23013 Knox County, 23015 Lincoln County, 23017 Oxford County, 23019 Penobscot County, 23021 Piscataquis County, 23023 Sagadahoc County, 23025 Somerset County, 23027 Waldo County, 23029 Washington County, 23031 York County
- **MA**: 25001 Barnstable County, 25003 Berkshire County, 25005 Bristol County, 25007 Dukes County, 25009 Essex County, 25011 Franklin County, 25013 Hampden County, 25015 Hampshire County, 25017 Middlesex County, 25019 Nantucket County, 25021 Norfolk County, 25023 Plymouth County, 25025 Suffolk County, 25027 Worcester County
- **NH**: 33001 Belknap County, 33003 Carroll County, 33005 Cheshire County, 33007 Coos County, 33009 Grafton County, 33011 Hillsborough County, 33013 Merrimack County, 33015 Rockingham County, 33017 Strafford County, 33019 Sullivan County
- **RI**: 44001 Bristol County, 44003 Kent County, 44005 Newport County, 44007 Providence County, 44009 Washington County
- **VT**: 50001 Addison County, 50003 Bennington County, 50005 Caledonia County, 50007 Chittenden County, 50009 Essex County, 50011 Franklin County, 50013 Grand Isle County, 50015 Lamoille County, 50017 Orange County, 50019 Orleans County, 50021 Rutland County, 50023 Washington County, 50025 Windham County, 50027 Windsor County

## State senate districts (`sldu`)

One line per feature: `id | num | name` (MA senate: `| alt`).

### sldu CT (36)

```
CT-001 | 1 | State Senate District 1
CT-002 | 2 | State Senate District 2
CT-003 | 3 | State Senate District 3
CT-004 | 4 | State Senate District 4
CT-005 | 5 | State Senate District 5
CT-006 | 6 | State Senate District 6
CT-007 | 7 | State Senate District 7
CT-008 | 8 | State Senate District 8
CT-009 | 9 | State Senate District 9
CT-010 | 10 | State Senate District 10
CT-011 | 11 | State Senate District 11
CT-012 | 12 | State Senate District 12
CT-013 | 13 | State Senate District 13
CT-014 | 14 | State Senate District 14
CT-015 | 15 | State Senate District 15
CT-016 | 16 | State Senate District 16
CT-017 | 17 | State Senate District 17
CT-018 | 18 | State Senate District 18
CT-019 | 19 | State Senate District 19
CT-020 | 20 | State Senate District 20
CT-021 | 21 | State Senate District 21
CT-022 | 22 | State Senate District 22
CT-023 | 23 | State Senate District 23
CT-024 | 24 | State Senate District 24
CT-025 | 25 | State Senate District 25
CT-026 | 26 | State Senate District 26
CT-027 | 27 | State Senate District 27
CT-028 | 28 | State Senate District 28
CT-029 | 29 | State Senate District 29
CT-030 | 30 | State Senate District 30
CT-031 | 31 | State Senate District 31
CT-032 | 32 | State Senate District 32
CT-033 | 33 | State Senate District 33
CT-034 | 34 | State Senate District 34
CT-035 | 35 | State Senate District 35
CT-036 | 36 | State Senate District 36
```

### sldu ME (35)

```
ME-001 | 1 | State Senate District 1
ME-002 | 2 | State Senate District 2
ME-003 | 3 | State Senate District 3
ME-004 | 4 | State Senate District 4
ME-005 | 5 | State Senate District 5
ME-006 | 6 | State Senate District 6
ME-007 | 7 | State Senate District 7
ME-008 | 8 | State Senate District 8
ME-009 | 9 | State Senate District 9
ME-010 | 10 | State Senate District 10
ME-011 | 11 | State Senate District 11
ME-012 | 12 | State Senate District 12
ME-013 | 13 | State Senate District 13
ME-014 | 14 | State Senate District 14
ME-015 | 15 | State Senate District 15
ME-016 | 16 | State Senate District 16
ME-017 | 17 | State Senate District 17
ME-018 | 18 | State Senate District 18
ME-019 | 19 | State Senate District 19
ME-020 | 20 | State Senate District 20
ME-021 | 21 | State Senate District 21
ME-022 | 22 | State Senate District 22
ME-023 | 23 | State Senate District 23
ME-024 | 24 | State Senate District 24
ME-025 | 25 | State Senate District 25
ME-026 | 26 | State Senate District 26
ME-027 | 27 | State Senate District 27
ME-028 | 28 | State Senate District 28
ME-029 | 29 | State Senate District 29
ME-030 | 30 | State Senate District 30
ME-031 | 31 | State Senate District 31
ME-032 | 32 | State Senate District 32
ME-033 | 33 | State Senate District 33
ME-034 | 34 | State Senate District 34
ME-035 | 35 | State Senate District 35
```

### sldu MA (40)

```
MA-D01 | Berkshire-Hampden-Franklin-Hampshire | Berkshire-Hampden-Franklin-Hampshire District | Berkshire, Hampden, Franklin and Hampshire
MA-D02 | Hampden and Hampshire | Hampden and Hampshire District | Hampden and Hampshire
MA-D03 | Hampden | Hampden District | Hampden
MA-D04 | Hampden-Hampshire-Worcester | Hampden-Hampshire-Worcester District | Hampden, Hampshire and Worcester
MA-D05 | Hampshire-Franklin-Worcester | Hampshire-Franklin-Worcester District | Hampshire, Franklin and Worcester
MA-D06 | Worcester and Hampshire | Worcester and Hampshire District | Worcester and Hampshire
MA-D07 | Worcester and Hampden | Worcester and Hampden District | Worcester and Hampden
MA-D08 | Second Worcester | Second Worcester District | Second Worcester
MA-D09 | First Worcester | First Worcester District | First Worcester
MA-D10 | Worcester and Middlesex | Worcester and Middlesex District | Worcester and Middlesex
MA-D11 | First Middlesex | First Middlesex District | First Middlesex
MA-D12 | Middlesex and Worcester | Middlesex and Worcester District | Middlesex and Worcester
MA-D13 | Middlesex and Norfolk | Middlesex and Norfolk District | Middlesex and Norfolk
MA-D14 | Norfolk-Worcester-Middlesex | Norfolk-Worcester-Middlesex District | Norfolk, Worcester and Middlesex
MA-D15 | Third Middlesex | Third Middlesex District | Third Middlesex
MA-D16 | Fourth Middlesex | Fourth Middlesex District | Fourth Middlesex
MA-D17 | Norfolk and Middlesex | Norfolk and Middlesex District | Norfolk and Middlesex
MA-D18 | Norfolk and Suffolk | Norfolk and Suffolk District | Norfolk and Suffolk
MA-D19 | First Essex | First Essex District | First Essex
MA-D20 | Second Essex and Middlesex | Second Essex and Middlesex District | Second Essex and Middlesex
MA-D21 | First Essex and Middlesex | First Essex and Middlesex District | First Essex and Middlesex
MA-D22 | Second Essex | Second Essex District | Second Essex
MA-D23 | Fifth Middlesex | Fifth Middlesex District | Fifth Middlesex
MA-D24 | Third Essex | Third Essex District | Third Essex
MA-D25 | Third Suffolk | Third Suffolk District | Third Suffolk
MA-D26 | Middlesex and Suffolk | Middlesex and Suffolk District | Middlesex and Suffolk
MA-D27 | Second Middlesex | Second Middlesex District | Second Middlesex
MA-D28 | Suffolk and Middlesex | Suffolk and Middlesex District | Suffolk and Middlesex
MA-D29 | Second Suffolk | Second Suffolk District | Second Suffolk
MA-D30 | First Suffolk | First Suffolk District | First Suffolk
MA-D31 | First Plymouth and Norfolk | First Plymouth and Norfolk District | First Plymouth and Norfolk
MA-D32 | Norfolk and Plymouth | Norfolk and Plymouth District | Norfolk and Plymouth
MA-D33 | Norfolk-Plymouth-Bristol | Norfolk-Plymouth-Bristol District | Norfolk, Plymouth and Bristol
MA-D34 | Second Plymouth and Norfolk | Second Plymouth and Norfolk District | Second Plymouth and Norfolk
MA-D35 | Bristol and Norfolk | Bristol and Norfolk District | Bristol and Norfolk
MA-D36 | Third Bristol and Plymouth | Third Bristol and Plymouth District | Third Bristol and Plymouth
MA-D37 | First Bristol and Plymouth | First Bristol and Plymouth District | First Bristol and Plymouth
MA-D38 | Second Bristol and Plymouth | Second Bristol and Plymouth District | Second Bristol and Plymouth
MA-D39 | Plymouth and Barnstable | Plymouth and Barnstable District | Plymouth and Barnstable
MA-D40 | Cape and Islands | Cape and Islands District | Cape and Islands
```

### sldu NH (24)

```
NH-001 | 1 | State Senate District 01
NH-002 | 2 | State Senate District 02
NH-003 | 3 | State Senate District 03
NH-004 | 4 | State Senate District 04
NH-005 | 5 | State Senate District 05
NH-006 | 6 | State Senate District 06
NH-007 | 7 | State Senate District 07
NH-008 | 8 | State Senate District 08
NH-009 | 9 | State Senate District 09
NH-010 | 10 | State Senate District 10
NH-011 | 11 | State Senate District 11
NH-012 | 12 | State Senate District 12
NH-013 | 13 | State Senate District 13
NH-014 | 14 | State Senate District 14
NH-015 | 15 | State Senate District 15
NH-016 | 16 | State Senate District 16
NH-017 | 17 | State Senate District 17
NH-018 | 18 | State Senate District 18
NH-019 | 19 | State Senate District 19
NH-020 | 20 | State Senate District 20
NH-021 | 21 | State Senate District 21
NH-022 | 22 | State Senate District 22
NH-023 | 23 | State Senate District 23
NH-024 | 24 | State Senate District 24
```

### sldu RI (38)

```
RI-001 | 1 | State Senate District 1
RI-002 | 2 | State Senate District 2
RI-003 | 3 | State Senate District 3
RI-004 | 4 | State Senate District 4
RI-005 | 5 | State Senate District 5
RI-006 | 6 | State Senate District 6
RI-007 | 7 | State Senate District 7
RI-008 | 8 | State Senate District 8
RI-009 | 9 | State Senate District 9
RI-010 | 10 | State Senate District 10
RI-011 | 11 | State Senate District 11
RI-012 | 12 | State Senate District 12
RI-013 | 13 | State Senate District 13
RI-014 | 14 | State Senate District 14
RI-015 | 15 | State Senate District 15
RI-016 | 16 | State Senate District 16
RI-017 | 17 | State Senate District 17
RI-018 | 18 | State Senate District 18
RI-019 | 19 | State Senate District 19
RI-020 | 20 | State Senate District 20
RI-021 | 21 | State Senate District 21
RI-022 | 22 | State Senate District 22
RI-023 | 23 | State Senate District 23
RI-024 | 24 | State Senate District 24
RI-025 | 25 | State Senate District 25
RI-026 | 26 | State Senate District 26
RI-027 | 27 | State Senate District 27
RI-028 | 28 | State Senate District 28
RI-029 | 29 | State Senate District 29
RI-030 | 30 | State Senate District 30
RI-031 | 31 | State Senate District 31
RI-032 | 32 | State Senate District 32
RI-033 | 33 | State Senate District 33
RI-034 | 34 | State Senate District 34
RI-035 | 35 | State Senate District 35
RI-036 | 36 | State Senate District 36
RI-037 | 37 | State Senate District 37
RI-038 | 38 | State Senate District 38
```

### sldu VT (16)

```
VT-ADD | Addison | Addison Senate District
VT-BEN | Bennington | Bennington Senate District
VT-CAL | Caledonia | Caledonia Senate District
VT-CHC | Chittenden-Central | Chittenden Central Senate District
VT-CHN | Chittenden-North | Chittenden North Senate District
VT-CHS | Chittenden-Southeast | Chittenden South East Senate District
VT-ESX | Essex | Essex Senate District
VT-FRA | Franklin | Franklin Senate District
VT-GRI | Grand Isle | Grand Isle Senate District
VT-LAM | Lamoille | Lamoille Senate District
VT-ORA | Orange | Orange Senate District
VT-ORL | Orleans | Orleans Senate District
VT-RUT | Rutland | Rutland Senate District
VT-WAS | Washington | Washington Senate District
VT-WDH | Windham | Windham Senate District
VT-WSR | Windsor | Windsor Senate District
```


## State house districts (`sldl`)

One line per feature: `id | num | name`.

### sldl CT (151)

```
CT-001 | 1 | State House District 1
CT-002 | 2 | State House District 2
CT-003 | 3 | State House District 3
CT-004 | 4 | State House District 4
CT-005 | 5 | State House District 5
CT-006 | 6 | State House District 6
CT-007 | 7 | State House District 7
CT-008 | 8 | State House District 8
CT-009 | 9 | State House District 9
CT-010 | 10 | State House District 10
CT-011 | 11 | State House District 11
CT-012 | 12 | State House District 12
CT-013 | 13 | State House District 13
CT-014 | 14 | State House District 14
CT-015 | 15 | State House District 15
CT-016 | 16 | State House District 16
CT-017 | 17 | State House District 17
CT-018 | 18 | State House District 18
CT-019 | 19 | State House District 19
CT-020 | 20 | State House District 20
CT-021 | 21 | State House District 21
CT-022 | 22 | State House District 22
CT-023 | 23 | State House District 23
CT-024 | 24 | State House District 24
CT-025 | 25 | State House District 25
CT-026 | 26 | State House District 26
CT-027 | 27 | State House District 27
CT-028 | 28 | State House District 28
CT-029 | 29 | State House District 29
CT-030 | 30 | State House District 30
CT-031 | 31 | State House District 31
CT-032 | 32 | State House District 32
CT-033 | 33 | State House District 33
CT-034 | 34 | State House District 34
CT-035 | 35 | State House District 35
CT-036 | 36 | State House District 36
CT-037 | 37 | State House District 37
CT-038 | 38 | State House District 38
CT-039 | 39 | State House District 39
CT-040 | 40 | State House District 40
CT-041 | 41 | State House District 41
CT-042 | 42 | State House District 42
CT-043 | 43 | State House District 43
CT-044 | 44 | State House District 44
CT-045 | 45 | State House District 45
CT-046 | 46 | State House District 46
CT-047 | 47 | State House District 47
CT-048 | 48 | State House District 48
CT-049 | 49 | State House District 49
CT-050 | 50 | State House District 50
CT-051 | 51 | State House District 51
CT-052 | 52 | State House District 52
CT-053 | 53 | State House District 53
CT-054 | 54 | State House District 54
CT-055 | 55 | State House District 55
CT-056 | 56 | State House District 56
CT-057 | 57 | State House District 57
CT-058 | 58 | State House District 58
CT-059 | 59 | State House District 59
CT-060 | 60 | State House District 60
CT-061 | 61 | State House District 61
CT-062 | 62 | State House District 62
CT-063 | 63 | State House District 63
CT-064 | 64 | State House District 64
CT-065 | 65 | State House District 65
CT-066 | 66 | State House District 66
CT-067 | 67 | State House District 67
CT-068 | 68 | State House District 68
CT-069 | 69 | State House District 69
CT-070 | 70 | State House District 70
CT-071 | 71 | State House District 71
CT-072 | 72 | State House District 72
CT-073 | 73 | State House District 73
CT-074 | 74 | State House District 74
CT-075 | 75 | State House District 75
CT-076 | 76 | State House District 76
CT-077 | 77 | State House District 77
CT-078 | 78 | State House District 78
CT-079 | 79 | State House District 79
CT-080 | 80 | State House District 80
CT-081 | 81 | State House District 81
CT-082 | 82 | State House District 82
CT-083 | 83 | State House District 83
CT-084 | 84 | State House District 84
CT-085 | 85 | State House District 85
CT-086 | 86 | State House District 86
CT-087 | 87 | State House District 87
CT-088 | 88 | State House District 88
CT-089 | 89 | State House District 89
CT-090 | 90 | State House District 90
CT-091 | 91 | State House District 91
CT-092 | 92 | State House District 92
CT-093 | 93 | State House District 93
CT-094 | 94 | State House District 94
CT-095 | 95 | State House District 95
CT-096 | 96 | State House District 96
CT-097 | 97 | State House District 97
CT-098 | 98 | State House District 98
CT-099 | 99 | State House District 99
CT-100 | 100 | State House District 100
CT-101 | 101 | State House District 101
CT-102 | 102 | State House District 102
CT-103 | 103 | State House District 103
CT-104 | 104 | State House District 104
CT-105 | 105 | State House District 105
CT-106 | 106 | State House District 106
CT-107 | 107 | State House District 107
CT-108 | 108 | State House District 108
CT-109 | 109 | State House District 109
CT-110 | 110 | State House District 110
CT-111 | 111 | State House District 111
CT-112 | 112 | State House District 112
CT-113 | 113 | State House District 113
CT-114 | 114 | State House District 114
CT-115 | 115 | State House District 115
CT-116 | 116 | State House District 116
CT-117 | 117 | State House District 117
CT-118 | 118 | State House District 118
CT-119 | 119 | State House District 119
CT-120 | 120 | State House District 120
CT-121 | 121 | State House District 121
CT-122 | 122 | State House District 122
CT-123 | 123 | State House District 123
CT-124 | 124 | State House District 124
CT-125 | 125 | State House District 125
CT-126 | 126 | State House District 126
CT-127 | 127 | State House District 127
CT-128 | 128 | State House District 128
CT-129 | 129 | State House District 129
CT-130 | 130 | State House District 130
CT-131 | 131 | State House District 131
CT-132 | 132 | State House District 132
CT-133 | 133 | State House District 133
CT-134 | 134 | State House District 134
CT-135 | 135 | State House District 135
CT-136 | 136 | State House District 136
CT-137 | 137 | State House District 137
CT-138 | 138 | State House District 138
CT-139 | 139 | State House District 139
CT-140 | 140 | State House District 140
CT-141 | 141 | State House District 141
CT-142 | 142 | State House District 142
CT-143 | 143 | State House District 143
CT-144 | 144 | State House District 144
CT-145 | 145 | State House District 145
CT-146 | 146 | State House District 146
CT-147 | 147 | State House District 147
CT-148 | 148 | State House District 148
CT-149 | 149 | State House District 149
CT-150 | 150 | State House District 150
CT-151 | 151 | State House District 151
```

### sldl ME (151)

```
ME-001 | 1 | State House District 1
ME-002 | 2 | State House District 2
ME-003 | 3 | State House District 3
ME-004 | 4 | State House District 4
ME-005 | 5 | State House District 5
ME-006 | 6 | State House District 6
ME-007 | 7 | State House District 7
ME-008 | 8 | State House District 8
ME-009 | 9 | State House District 9
ME-010 | 10 | State House District 10
ME-011 | 11 | State House District 11
ME-012 | 12 | State House District 12
ME-013 | 13 | State House District 13
ME-014 | 14 | State House District 14
ME-015 | 15 | State House District 15
ME-016 | 16 | State House District 16
ME-017 | 17 | State House District 17
ME-018 | 18 | State House District 18
ME-019 | 19 | State House District 19
ME-020 | 20 | State House District 20
ME-021 | 21 | State House District 21
ME-022 | 22 | State House District 22
ME-023 | 23 | State House District 23
ME-024 | 24 | State House District 24
ME-025 | 25 | State House District 25
ME-026 | 26 | State House District 26
ME-027 | 27 | State House District 27
ME-028 | 28 | State House District 28
ME-029 | 29 | State House District 29
ME-030 | 30 | State House District 30
ME-031 | 31 | State House District 31
ME-032 | 32 | State House District 32
ME-033 | 33 | State House District 33
ME-034 | 34 | State House District 34
ME-035 | 35 | State House District 35
ME-036 | 36 | State House District 36
ME-037 | 37 | State House District 37
ME-038 | 38 | State House District 38
ME-039 | 39 | State House District 39
ME-040 | 40 | State House District 40
ME-041 | 41 | State House District 41
ME-042 | 42 | State House District 42
ME-043 | 43 | State House District 43
ME-044 | 44 | State House District 44
ME-045 | 45 | State House District 45
ME-046 | 46 | State House District 46
ME-047 | 47 | State House District 47
ME-048 | 48 | State House District 48
ME-049 | 49 | State House District 49
ME-050 | 50 | State House District 50
ME-051 | 51 | State House District 51
ME-052 | 52 | State House District 52
ME-053 | 53 | State House District 53
ME-054 | 54 | State House District 54
ME-055 | 55 | State House District 55
ME-056 | 56 | State House District 56
ME-057 | 57 | State House District 57
ME-058 | 58 | State House District 58
ME-059 | 59 | State House District 59
ME-060 | 60 | State House District 60
ME-061 | 61 | State House District 61
ME-062 | 62 | State House District 62
ME-063 | 63 | State House District 63
ME-064 | 64 | State House District 64
ME-065 | 65 | State House District 65
ME-066 | 66 | State House District 66
ME-067 | 67 | State House District 67
ME-068 | 68 | State House District 68
ME-069 | 69 | State House District 69
ME-070 | 70 | State House District 70
ME-071 | 71 | State House District 71
ME-072 | 72 | State House District 72
ME-073 | 73 | State House District 73
ME-074 | 74 | State House District 74
ME-075 | 75 | State House District 75
ME-076 | 76 | State House District 76
ME-077 | 77 | State House District 77
ME-078 | 78 | State House District 78
ME-079 | 79 | State House District 79
ME-080 | 80 | State House District 80
ME-081 | 81 | State House District 81
ME-082 | 82 | State House District 82
ME-083 | 83 | State House District 83
ME-084 | 84 | State House District 84
ME-085 | 85 | State House District 85
ME-086 | 86 | State House District 86
ME-087 | 87 | State House District 87
ME-088 | 88 | State House District 88
ME-089 | 89 | State House District 89
ME-090 | 90 | State House District 90
ME-091 | 91 | State House District 91
ME-092 | 92 | State House District 92
ME-093 | 93 | State House District 93
ME-094 | 94 | State House District 94
ME-095 | 95 | State House District 95
ME-096 | 96 | State House District 96
ME-097 | 97 | State House District 97
ME-098 | 98 | State House District 98
ME-099 | 99 | State House District 99
ME-100 | 100 | State House District 100
ME-101 | 101 | State House District 101
ME-102 | 102 | State House District 102
ME-103 | 103 | State House District 103
ME-104 | 104 | State House District 104
ME-105 | 105 | State House District 105
ME-106 | 106 | State House District 106
ME-107 | 107 | State House District 107
ME-108 | 108 | State House District 108
ME-109 | 109 | State House District 109
ME-110 | 110 | State House District 110
ME-111 | 111 | State House District 111
ME-112 | 112 | State House District 112
ME-113 | 113 | State House District 113
ME-114 | 114 | State House District 114
ME-115 | 115 | State House District 115
ME-116 | 116 | State House District 116
ME-117 | 117 | State House District 117
ME-118 | 118 | State House District 118
ME-119 | 119 | State House District 119
ME-120 | 120 | State House District 120
ME-121 | 121 | State House District 121
ME-122 | 122 | State House District 122
ME-123 | 123 | State House District 123
ME-124 | 124 | State House District 124
ME-125 | 125 | State House District 125
ME-126 | 126 | State House District 126
ME-127 | 127 | State House District 127
ME-128 | 128 | State House District 128
ME-129 | 129 | State House District 129
ME-130 | 130 | State House District 130
ME-131 | 131 | State House District 131
ME-132 | 132 | State House District 132
ME-133 | 133 | State House District 133
ME-134 | 134 | State House District 134
ME-135 | 135 | State House District 135
ME-136 | 136 | State House District 136
ME-137 | 137 | State House District 137
ME-138 | 138 | State House District 138
ME-139 | 139 | State House District 139
ME-140 | 140 | State House District 140
ME-141 | 141 | State House District 141
ME-142 | 142 | State House District 142
ME-143 | 143 | State House District 143
ME-144 | 144 | State House District 144
ME-145 | 145 | State House District 145
ME-146 | 146 | State House District 146
ME-147 | 147 | State House District 147
ME-148 | 148 | State House District 148
ME-149 | 149 | State House District 149
ME-150 | 150 | State House District 150
ME-151 | 151 | State House District 151
```

### sldl MA (160)

```
MA-001 | 1st Barnstable | 1st Barnstable District
MA-002 | 2nd Barnstable | 2nd Barnstable District
MA-003 | 3rd Barnstable | 3rd Barnstable District
MA-004 | 4th Barnstable | 4th Barnstable District
MA-005 | 5th Barnstable | 5th Barnstable District
MA-006 | Barnstable-Dukes-Nantucket | Barnstable-Dukes-Nantucket District
MA-007 | 1st Berkshire | 1st Berkshire District
MA-008 | 2nd Berkshire | 2nd Berkshire District
MA-009 | 3rd Berkshire | 3rd Berkshire District
MA-010 | 1st Bristol | 1st Bristol District
MA-011 | 2nd Bristol | 2nd Bristol District
MA-012 | 3rd Bristol | 3rd Bristol District
MA-013 | 4th Bristol | 4th Bristol District
MA-014 | 5th Bristol | 5th Bristol District
MA-015 | 6th Bristol | 6th Bristol District
MA-016 | 7th Bristol | 7th Bristol District
MA-017 | 8th Bristol | 8th Bristol District
MA-018 | 9th Bristol | 9th Bristol District
MA-019 | 10th Bristol | 10th Bristol District
MA-020 | 11th Bristol | 11th Bristol District
MA-021 | 12th Bristol | 12th Bristol District
MA-022 | 13th Bristol | 13th Bristol District
MA-023 | 14th Bristol | 14th Bristol District
MA-024 | 1st Essex | 1st Essex District
MA-025 | 2nd Essex | 2nd Essex District
MA-026 | 3rd Essex | 3rd Essex District
MA-027 | 4th Essex | 4th Essex District
MA-028 | 5th Essex | 5th Essex District
MA-029 | 6th Essex | 6th Essex District
MA-030 | 7th Essex | 7th Essex District
MA-031 | 8th Essex | 8th Essex District
MA-032 | 9th Essex | 9th Essex District
MA-033 | 10th Essex | 10th Essex District
MA-034 | 11th Essex | 11th Essex District
MA-035 | 12th Essex | 12th Essex District
MA-036 | 13th Essex | 13th Essex District
MA-037 | 14th Essex | 14th Essex District
MA-038 | 15th Essex | 15th Essex District
MA-039 | 16th Essex | 16th Essex District
MA-040 | 17th Essex | 17th Essex District
MA-041 | 18th Essex | 18th Essex District
MA-042 | 1st Franklin | 1st Franklin District
MA-043 | 2nd Franklin | 2nd Franklin District
MA-044 | 1st Hampden | 1st Hampden District
MA-045 | 2nd Hampden | 2nd Hampden District
MA-046 | 3rd Hampden | 3rd Hampden District
MA-047 | 4th Hampden | 4th Hampden District
MA-048 | 5th Hampden | 5th Hampden District
MA-049 | 6th Hampden | 6th Hampden District
MA-050 | 7th Hampden | 7th Hampden District
MA-051 | 8th Hampden | 8th Hampden District
MA-052 | 9th Hampden | 9th Hampden District
MA-053 | 10th Hampden | 10th Hampden District
MA-054 | 11th Hampden | 11th Hampden District
MA-055 | 12th Hampden | 12th Hampden District
MA-056 | 1st Hampshire | 1st Hampshire District
MA-057 | 2nd Hampshire | 2nd Hampshire District
MA-058 | 3rd Hampshire | 3rd Hampshire District
MA-059 | 1st Middlesex | 1st Middlesex District
MA-060 | 2nd Middlesex | 2nd Middlesex District
MA-061 | 3rd Middlesex | 3rd Middlesex District
MA-062 | 4th Middlesex | 4th Middlesex District
MA-063 | 5th Middlesex | 5th Middlesex District
MA-064 | 6th Middlesex | 6th Middlesex District
MA-065 | 7th Middlesex | 7th Middlesex District
MA-066 | 8th Middlesex | 8th Middlesex District
MA-067 | 9th Middlesex | 9th Middlesex District
MA-068 | 10th Middlesex | 10th Middlesex District
MA-069 | 11th Middlesex | 11th Middlesex District
MA-070 | 12th Middlesex | 12th Middlesex District
MA-071 | 13th Middlesex | 13th Middlesex District
MA-072 | 14th Middlesex | 14th Middlesex District
MA-073 | 15th Middlesex | 15th Middlesex District
MA-074 | 16th Middlesex | 16th Middlesex District
MA-075 | 17th Middlesex | 17th Middlesex District
MA-076 | 18th Middlesex | 18th Middlesex District
MA-077 | 19th Middlesex | 19th Middlesex District
MA-078 | 20th Middlesex | 20th Middlesex District
MA-079 | 21st Middlesex | 21st Middlesex District
MA-080 | 22nd Middlesex | 22nd Middlesex District
MA-081 | 23rd Middlesex | 23rd Middlesex District
MA-082 | 24th Middlesex | 24th Middlesex District
MA-083 | 25th Middlesex | 25th Middlesex District
MA-084 | 26th Middlesex | 26th Middlesex District
MA-085 | 27th Middlesex | 27th Middlesex District
MA-086 | 28th Middlesex | 28th Middlesex District
MA-087 | 29th Middlesex | 29th Middlesex District
MA-088 | 30th Middlesex | 30th Middlesex District
MA-089 | 31st Middlesex | 31st Middlesex District
MA-090 | 32nd Middlesex | 32nd Middlesex District
MA-091 | 33rd Middlesex | 33rd Middlesex District
MA-092 | 34th Middlesex | 34th Middlesex District
MA-093 | 35th Middlesex | 35th Middlesex District
MA-094 | 36th Middlesex | 36th Middlesex District
MA-095 | 37th Middlesex | 37th Middlesex District
MA-096 | 1st Norfolk | 1st Norfolk District
MA-097 | 2nd Norfolk | 2nd Norfolk District
MA-098 | 3rd Norfolk | 3rd Norfolk District
MA-099 | 4th Norfolk | 4th Norfolk District
MA-100 | 5th Norfolk | 5th Norfolk District
MA-101 | 6th Norfolk | 6th Norfolk District
MA-102 | 7th Norfolk | 7th Norfolk District
MA-103 | 8th Norfolk | 8th Norfolk District
MA-104 | 9th Norfolk | 9th Norfolk District
MA-105 | 10th Norfolk | 10th Norfolk District
MA-106 | 11th Norfolk | 11th Norfolk District
MA-107 | 12th Norfolk | 12th Norfolk District
MA-108 | 13th Norfolk | 13th Norfolk District
MA-109 | 14th Norfolk | 14th Norfolk District
MA-110 | 15th Norfolk | 15th Norfolk District
MA-111 | 1st Plymouth | 1st Plymouth District
MA-112 | 2nd Plymouth | 2nd Plymouth District
MA-113 | 3rd Plymouth | 3rd Plymouth District
MA-114 | 4th Plymouth | 4th Plymouth District
MA-115 | 5th Plymouth | 5th Plymouth District
MA-116 | 6th Plymouth | 6th Plymouth District
MA-117 | 7th Plymouth | 7th Plymouth District
MA-118 | 8th Plymouth | 8th Plymouth District
MA-119 | 9th Plymouth | 9th Plymouth District
MA-120 | 10th Plymouth | 10th Plymouth District
MA-121 | 11th Plymouth | 11th Plymouth District
MA-122 | 12th Plymouth | 12th Plymouth District
MA-123 | 1st Suffolk | 1st Suffolk District
MA-124 | 2nd Suffolk | 2nd Suffolk District
MA-125 | 3rd Suffolk | 3rd Suffolk District
MA-126 | 4th Suffolk | 4th Suffolk District
MA-127 | 5th Suffolk | 5th Suffolk District
MA-128 | 6th Suffolk | 6th Suffolk District
MA-129 | 7th Suffolk | 7th Suffolk District
MA-130 | 8th Suffolk | 8th Suffolk District
MA-131 | 9th Suffolk | 9th Suffolk District
MA-132 | 10th Suffolk | 10th Suffolk District
MA-133 | 11th Suffolk | 11th Suffolk District
MA-134 | 12th Suffolk | 12th Suffolk District
MA-135 | 13th Suffolk | 13th Suffolk District
MA-136 | 14th Suffolk | 14th Suffolk District
MA-137 | 15th Suffolk | 15th Suffolk District
MA-138 | 16th Suffolk | 16th Suffolk District
MA-139 | 17th Suffolk | 17th Suffolk District
MA-140 | 18th Suffolk | 18th Suffolk District
MA-141 | 19th Suffolk | 19th Suffolk District
MA-142 | 1st Worcester | 1st Worcester District
MA-143 | 2nd Worcester | 2nd Worcester District
MA-144 | 3rd Worcester | 3rd Worcester District
MA-145 | 4th Worcester | 4th Worcester District
MA-146 | 5th Worcester | 5th Worcester District
MA-147 | 6th Worcester | 6th Worcester District
MA-148 | 7th Worcester | 7th Worcester District
MA-149 | 8th Worcester | 8th Worcester District
MA-150 | 9th Worcester | 9th Worcester District
MA-151 | 10th Worcester | 10th Worcester District
MA-152 | 11th Worcester | 11th Worcester District
MA-153 | 12th Worcester | 12th Worcester District
MA-154 | 13th Worcester | 13th Worcester District
MA-155 | 14th Worcester | 14th Worcester District
MA-156 | 15th Worcester | 15th Worcester District
MA-157 | 16th Worcester | 16th Worcester District
MA-158 | 17th Worcester | 17th Worcester District
MA-159 | 18th Worcester | 18th Worcester District
MA-160 | 19th Worcester | 19th Worcester District
```

### sldl NH (164)

```
NH-001 | Belknap 1 | State House District Belknap 01
NH-002 | Belknap 2 | State House District Belknap 02
NH-003 | Belknap 3 | State House District Belknap 03
NH-004 | Belknap 4 | State House District Belknap 04
NH-005 | Belknap 5 | State House District Belknap 05
NH-006 | Belknap 6 | State House District Belknap 06
NH-007 | Belknap 7 | State House District Belknap 07
NH-101 | Carroll 1 | State House District Carroll 01
NH-102 | Carroll 2 | State House District Carroll 02
NH-103 | Carroll 3 | State House District Carroll 03
NH-104 | Carroll 4 | State House District Carroll 04
NH-105 | Carroll 5 | State House District Carroll 05
NH-106 | Carroll 6 | State House District Carroll 06
NH-201 | Cheshire 1 | State House District Cheshire 01
NH-202 | Cheshire 2 | State House District Cheshire 02
NH-203 | Cheshire 3 | State House District Cheshire 03
NH-204 | Cheshire 4 | State House District Cheshire 04
NH-205 | Cheshire 5 | State House District Cheshire 05
NH-206 | Cheshire 6 | State House District Cheshire 06
NH-207 | Cheshire 7 | State House District Cheshire 07
NH-208 | Cheshire 8 | State House District Cheshire 08
NH-209 | Cheshire 9 | State House District Cheshire 09
NH-210 | Cheshire 10 | State House District Cheshire 10
NH-211 | Cheshire 11 | State House District Cheshire 11
NH-212 | Cheshire 12 | State House District Cheshire 12
NH-213 | Cheshire 13 | State House District Cheshire 13
NH-214 | Cheshire 14 | State House District Cheshire 14
NH-301 | Coos 1 | State House District Coos 01
NH-302 | Coos 2 | State House District Coos 02
NH-303 | Coos 3 | State House District Coos 03
NH-304 | Coos 4 | State House District Coos 04
NH-305 | Coos 5 | State House District Coos 05
NH-306 | Coos 6 | State House District Coos 06
NH-401 | Grafton 1 | State House District Grafton 01
NH-402 | Grafton 2 | State House District Grafton 02
NH-403 | Grafton 3 | State House District Grafton 03
NH-404 | Grafton 4 | State House District Grafton 04
NH-405 | Grafton 5 | State House District Grafton 05
NH-406 | Grafton 6 | State House District Grafton 06
NH-407 | Grafton 7 | State House District Grafton 07
NH-408 | Grafton 8 | State House District Grafton 08
NH-409 | Grafton 9 | State House District Grafton 09
NH-410 | Grafton 10 | State House District Grafton 10
NH-411 | Grafton 11 | State House District Grafton 11
NH-412 | Grafton 12 | State House District Grafton 12
NH-413 | Grafton 13 | State House District Grafton 13
NH-414 | Grafton 14 | State House District Grafton 14
NH-415 | Grafton 15 | State House District Grafton 15
NH-416 | Grafton 16 | State House District Grafton 16
NH-501 | Hillsborough 1 | State House District Hillsborough 01
NH-502 | Hillsborough 2 | State House District Hillsborough 02
NH-503 | Hillsborough 3 | State House District Hillsborough 03
NH-504 | Hillsborough 4 | State House District Hillsborough 04
NH-505 | Hillsborough 5 | State House District Hillsborough 05
NH-506 | Hillsborough 6 | State House District Hillsborough 06
NH-507 | Hillsborough 7 | State House District Hillsborough 07
NH-508 | Hillsborough 8 | State House District Hillsborough 08
NH-509 | Hillsborough 9 | State House District Hillsborough 09
NH-510 | Hillsborough 10 | State House District Hillsborough 10
NH-511 | Hillsborough 11 | State House District Hillsborough 11
NH-512 | Hillsborough 12 | State House District Hillsborough 12
NH-513 | Hillsborough 13 | State House District Hillsborough 13
NH-514 | Hillsborough 14 | State House District Hillsborough 14
NH-515 | Hillsborough 15 | State House District Hillsborough 15
NH-516 | Hillsborough 16 | State House District Hillsborough 16
NH-517 | Hillsborough 17 | State House District Hillsborough 17
NH-518 | Hillsborough 18 | State House District Hillsborough 18
NH-519 | Hillsborough 19 | State House District Hillsborough 19
NH-520 | Hillsborough 20 | State House District Hillsborough 20
NH-521 | Hillsborough 21 | State House District Hillsborough 21
NH-522 | Hillsborough 22 | State House District Hillsborough 22
NH-523 | Hillsborough 23 | State House District Hillsborough 23
NH-524 | Hillsborough 24 | State House District Hillsborough 24
NH-525 | Hillsborough 25 | State House District Hillsborough 25
NH-526 | Hillsborough 26 | State House District Hillsborough 26
NH-527 | Hillsborough 27 | State House District Hillsborough 27
NH-528 | Hillsborough 28 | State House District Hillsborough 28
NH-529 | Hillsborough 29 | State House District Hillsborough 29
NH-530 | Hillsborough 30 | State House District Hillsborough 30
NH-531 | Hillsborough 31 | State House District Hillsborough 31
NH-532 | Hillsborough 32 | State House District Hillsborough 32
NH-533 | Hillsborough 33 | State House District Hillsborough 33
NH-534 | Hillsborough 34 | State House District Hillsborough 34
NH-535 | Hillsborough 35 | State House District Hillsborough 35
NH-536 | Hillsborough 36 | State House District Hillsborough 36
NH-542 | Hillsborough 42 | State House District Hillsborough 42
NH-543 | Hillsborough 43 | State House District Hillsborough 43
NH-601 | Merrimack 1 | State House District Merrimack 01
NH-602 | Merrimack 2 | State House District Merrimack 02
NH-603 | Merrimack 3 | State House District Merrimack 03
NH-604 | Merrimack 4 | State House District Merrimack 04
NH-605 | Merrimack 5 | State House District Merrimack 05
NH-606 | Merrimack 6 | State House District Merrimack 06
NH-607 | Merrimack 7 | State House District Merrimack 07
NH-608 | Merrimack 8 | State House District Merrimack 08
NH-609 | Merrimack 9 | State House District Merrimack 09
NH-610 | Merrimack 10 | State House District Merrimack 10
NH-611 | Merrimack 11 | State House District Merrimack 11
NH-612 | Merrimack 12 | State House District Merrimack 12
NH-613 | Merrimack 13 | State House District Merrimack 13
NH-614 | Merrimack 14 | State House District Merrimack 14
NH-615 | Merrimack 15 | State House District Merrimack 15
NH-616 | Merrimack 16 | State House District Merrimack 16
NH-617 | Merrimack 17 | State House District Merrimack 17
NH-618 | Merrimack 18 | State House District Merrimack 18
NH-619 | Merrimack 19 | State House District Merrimack 19
NH-620 | Merrimack 20 | State House District Merrimack 20
NH-621 | Merrimack 21 | State House District Merrimack 21
NH-622 | Merrimack 22 | State House District Merrimack 22
NH-623 | Merrimack 23 | State House District Merrimack 23
NH-624 | Merrimack 24 | State House District Merrimack 24
NH-701 | Rockingham 1 | State House District Rockingham 01
NH-702 | Rockingham 2 | State House District Rockingham 02
NH-703 | Rockingham 3 | State House District Rockingham 03
NH-704 | Rockingham 4 | State House District Rockingham 04
NH-705 | Rockingham 5 | State House District Rockingham 05
NH-706 | Rockingham 6 | State House District Rockingham 06
NH-707 | Rockingham 7 | State House District Rockingham 07
NH-708 | Rockingham 8 | State House District Rockingham 08
NH-709 | Rockingham 9 | State House District Rockingham 09
NH-710 | Rockingham 10 | State House District Rockingham 10
NH-711 | Rockingham 11 | State House District Rockingham 11
NH-712 | Rockingham 12 | State House District Rockingham 12
NH-713 | Rockingham 13 | State House District Rockingham 13
NH-714 | Rockingham 14 | State House District Rockingham 14
NH-715 | Rockingham 15 | State House District Rockingham 15
NH-716 | Rockingham 16 | State House District Rockingham 16
NH-717 | Rockingham 17 | State House District Rockingham 17
NH-718 | Rockingham 18 | State House District Rockingham 18
NH-719 | Rockingham 19 | State House District Rockingham 19
NH-720 | Rockingham 20 | State House District Rockingham 20
NH-721 | Rockingham 21 | State House District Rockingham 21
NH-722 | Rockingham 22 | State House District Rockingham 22
NH-723 | Rockingham 23 | State House District Rockingham 23
NH-724 | Rockingham 24 | State House District Rockingham 24
NH-725 | Rockingham 25 | State House District Rockingham 25
NH-726 | Rockingham 26 | State House District Rockingham 26
NH-727 | Rockingham 27 | State House District Rockingham 27
NH-728 | Rockingham 28 | State House District Rockingham 28
NH-729 | Rockingham 29 | State House District Rockingham 29
NH-730 | Rockingham 30 | State House District Rockingham 30
NH-801 | Strafford 1 | State House District Strafford 01
NH-802 | Strafford 2 | State House District Strafford 02
NH-803 | Strafford 3 | State House District Strafford 03
NH-804 | Strafford 4 | State House District Strafford 04
NH-805 | Strafford 5 | State House District Strafford 05
NH-806 | Strafford 6 | State House District Strafford 06
NH-807 | Strafford 7 | State House District Strafford 07
NH-808 | Strafford 8 | State House District Strafford 08
NH-809 | Strafford 9 | State House District Strafford 09
NH-810 | Strafford 10 | State House District Strafford 10
NH-811 | Strafford 11 | State House District Strafford 11
NH-812 | Strafford 12 | State House District Strafford 12
NH-813 | Strafford 13 | State House District Strafford 13
NH-814 | Strafford 14 | State House District Strafford 14
NH-815 | Strafford 15 | State House District Strafford 15
NH-816 | Strafford 16 | State House District Strafford 16
NH-817 | Strafford 17 | State House District Strafford 17
NH-901 | Sullivan 1 | State House District Sullivan 01
NH-902 | Sullivan 2 | State House District Sullivan 02
NH-903 | Sullivan 3 | State House District Sullivan 03
NH-904 | Sullivan 4 | State House District Sullivan 04
NH-905 | Sullivan 5 | State House District Sullivan 05
NH-906 | Sullivan 6 | State House District Sullivan 06
```

### sldl RI (75)

```
RI-001 | 1 | State House District 1
RI-002 | 2 | State House District 2
RI-003 | 3 | State House District 3
RI-004 | 4 | State House District 4
RI-005 | 5 | State House District 5
RI-006 | 6 | State House District 6
RI-007 | 7 | State House District 7
RI-008 | 8 | State House District 8
RI-009 | 9 | State House District 9
RI-010 | 10 | State House District 10
RI-011 | 11 | State House District 11
RI-012 | 12 | State House District 12
RI-013 | 13 | State House District 13
RI-014 | 14 | State House District 14
RI-015 | 15 | State House District 15
RI-016 | 16 | State House District 16
RI-017 | 17 | State House District 17
RI-018 | 18 | State House District 18
RI-019 | 19 | State House District 19
RI-020 | 20 | State House District 20
RI-021 | 21 | State House District 21
RI-022 | 22 | State House District 22
RI-023 | 23 | State House District 23
RI-024 | 24 | State House District 24
RI-025 | 25 | State House District 25
RI-026 | 26 | State House District 26
RI-027 | 27 | State House District 27
RI-028 | 28 | State House District 28
RI-029 | 29 | State House District 29
RI-030 | 30 | State House District 30
RI-031 | 31 | State House District 31
RI-032 | 32 | State House District 32
RI-033 | 33 | State House District 33
RI-034 | 34 | State House District 34
RI-035 | 35 | State House District 35
RI-036 | 36 | State House District 36
RI-037 | 37 | State House District 37
RI-038 | 38 | State House District 38
RI-039 | 39 | State House District 39
RI-040 | 40 | State House District 40
RI-041 | 41 | State House District 41
RI-042 | 42 | State House District 42
RI-043 | 43 | State House District 43
RI-044 | 44 | State House District 44
RI-045 | 45 | State House District 45
RI-046 | 46 | State House District 46
RI-047 | 47 | State House District 47
RI-048 | 48 | State House District 48
RI-049 | 49 | State House District 49
RI-050 | 50 | State House District 50
RI-051 | 51 | State House District 51
RI-052 | 52 | State House District 52
RI-053 | 53 | State House District 53
RI-054 | 54 | State House District 54
RI-055 | 55 | State House District 55
RI-056 | 56 | State House District 56
RI-057 | 57 | State House District 57
RI-058 | 58 | State House District 58
RI-059 | 59 | State House District 59
RI-060 | 60 | State House District 60
RI-061 | 61 | State House District 61
RI-062 | 62 | State House District 62
RI-063 | 63 | State House District 63
RI-064 | 64 | State House District 64
RI-065 | 65 | State House District 65
RI-066 | 66 | State House District 66
RI-067 | 67 | State House District 67
RI-068 | 68 | State House District 68
RI-069 | 69 | State House District 69
RI-070 | 70 | State House District 70
RI-071 | 71 | State House District 71
RI-072 | 72 | State House District 72
RI-073 | 73 | State House District 73
RI-074 | 74 | State House District 74
RI-075 | 75 | State House District 75
```

### sldl VT (109)

```
VT-A-1 | Addison-1 | Addison-1 State House District
VT-A-2 | Addison-2 | Addison-2 State House District
VT-A-3 | Addison-3 | Addison-3 State House District
VT-A-4 | Addison-4 | Addison-4 State House District
VT-A-5 | Addison-5 | Addison-5 State House District
VT-A-R | Addison-Rutland | Addison-Rutland State House District
VT-B-1 | Bennington-1 | Bennington-1 State House District
VT-B-2 | Bennington-2 | Bennington-2 State House District
VT-B-3 | Bennington-3 | Bennington-3 State House District
VT-B-4 | Bennington-4 | Bennington-4 State House District
VT-B-5 | Bennington-5 | Bennington-5 State House District
VT-B-R | Bennington-Rutland | Bennington-Rutland State House District
VT-C-1 | Chittenden-1 | Chittenden-1 State House District
VT-C-2 | Chittenden-2 | Chittenden-2 State House District
VT-C-3 | Chittenden-3 | Chittenden-3 State House District
VT-C-4 | Chittenden-4 | Chittenden-4 State House District
VT-C-5 | Chittenden-5 | Chittenden-5 State House District
VT-C-6 | Chittenden-6 | Chittenden-6 State House District
VT-C-7 | Chittenden-7 | Chittenden-7 State House District
VT-C-8 | Chittenden-8 | Chittenden-8 State House District
VT-C-9 | Chittenden-9 | Chittenden-9 State House District
VT-C-F | Chittenden-Franklin | Chittenden-Franklin State House District
VT-C10 | Chittenden-10 | Chittenden-10 State House District
VT-C11 | Chittenden-11 | Chittenden-11 State House District
VT-C12 | Chittenden-12 | Chittenden-12 State House District
VT-C13 | Chittenden-13 | Chittenden-13 State House District
VT-C14 | Chittenden-14 | Chittenden-14 State House District
VT-C15 | Chittenden-15 | Chittenden-15 State House District
VT-C16 | Chittenden-16 | Chittenden-16 State House District
VT-C17 | Chittenden-17 | Chittenden-17 State House District
VT-C18 | Chittenden-18 | Chittenden-18 State House District
VT-C19 | Chittenden-19 | Chittenden-19 State House District
VT-C20 | Chittenden-20 | Chittenden-20 State House District
VT-C21 | Chittenden-21 | Chittenden-21 State House District
VT-C22 | Chittenden-22 | Chittenden-22 State House District
VT-C23 | Chittenden-23 | Chittenden-23 State House District
VT-C24 | Chittenden-24 | Chittenden-24 State House District
VT-C25 | Chittenden-25 | Chittenden-25 State House District
VT-CA1 | Caledonia-1 | Caledonia-1 State House District
VT-CA2 | Caledonia-2 | Caledonia-2 State House District
VT-CA3 | Caledonia-3 | Caledonia-3 State House District
VT-CAE | Caledonia-Essex | Caledonia-Essex State House District
VT-CAW | Caledonia-Washington | Caledonia-Washington State House District
VT-E-C | Essex-Caledonia | Essex-Caledonia State House District
VT-E-O | Essex-Orleans | Essex-Orleans State House District
VT-F-1 | Franklin-1 | Franklin-1 State House District
VT-F-2 | Franklin-2 | Franklin-2 State House District
VT-F-3 | Franklin-3 | Franklin-3 State House District
VT-F-4 | Franklin-4 | Franklin-4 State House District
VT-F-5 | Franklin-5 | Franklin-5 State House District
VT-F-6 | Franklin-6 | Franklin-6 State House District
VT-F-7 | Franklin-7 | Franklin-7 State House District
VT-F-8 | Franklin-8 | Franklin-8 State House District
VT-GIC | Grand Isle-Chittenden | Grand Isle-Chittenden State House District
VT-L-1 | Lamoille-1 | Lamoille-1 State House District
VT-L-2 | Lamoille-2 | Lamoille-2 State House District
VT-L-3 | Lamoille-3 | Lamoille-3 State House District
VT-L-W | Lamoille-Washington | Lamoille-Washington State House District
VT-O-1 | Orleans-1 | Orleans-1 State House District
VT-O-2 | Orleans-2 | Orleans-2 State House District
VT-O-3 | Orleans-3 | Orleans-3 State House District
VT-O-4 | Orleans-4 | Orleans-4 State House District
VT-O-L | Orleans-Lamoille | Orleans-Lamoille State House District
VT-OR1 | Orange-1 | Orange-1 State House District
VT-OR2 | Orange-2 | Orange-2 State House District
VT-OR3 | Orange-3 | Orange-3 State House District
VT-ORC | Orange-Caledonia | Orange-Caledonia State House District
VT-OWA | Orange-Washington-Addison | Orange-Washington-Addison State House District
VT-R-1 | Rutland-1 | Rutland-1 State House District
VT-R-2 | Rutland-2 | Rutland-2 State House District
VT-R-3 | Rutland-3 | Rutland-3 State House District
VT-R-4 | Rutland-4 | Rutland-4 State House District
VT-R-5 | Rutland-5 | Rutland-5 State House District
VT-R-6 | Rutland-6 | Rutland-6 State House District
VT-R-7 | Rutland-7 | Rutland-7 State House District
VT-R-8 | Rutland-8 | Rutland-8 State House District
VT-R-9 | Rutland-9 | Rutland-9 State House District
VT-R-B | Rutland-Bennington | Rutland-Bennington State House District
VT-R-W | Rutland-Windsor | Rutland-Windsor State House District
VT-R10 | Rutland-10 | Rutland-10 State House District
VT-R11 | Rutland-11 | Rutland-11 State House District
VT-W-1 | Windham-1 | Windham-1 State House District
VT-W-2 | Windham-2 | Windham-2 State House District
VT-W-3 | Windham-3 | Windham-3 State House District
VT-W-4 | Windham-4 | Windham-4 State House District
VT-W-5 | Windham-5 | Windham-5 State House District
VT-W-6 | Windham-6 | Windham-6 State House District
VT-W-7 | Windham-7 | Windham-7 State House District
VT-W-8 | Windham-8 | Windham-8 State House District
VT-W-9 | Windham-9 | Windham-9 State House District
VT-WA1 | Washington-1 | Washington-1 State House District
VT-WA2 | Washington-2 | Washington-2 State House District
VT-WA3 | Washington-3 | Washington-3 State House District
VT-WA4 | Washington-4 | Washington-4 State House District
VT-WA5 | Washington-5 | Washington-5 State House District
VT-WA6 | Washington-6 | Washington-6 State House District
VT-WAC | Washington-Chittenden | Washington-Chittenden State House District
VT-WAO | Washington-Orange | Washington-Orange State House District
VT-WWB | Windham-Windsor-Bennington | Windham-Windsor-Bennington State House District
VT-Y-1 | Windsor-1 | Windsor-1 State House District
VT-Y-2 | Windsor-2 | Windsor-2 State House District
VT-Y-3 | Windsor-3 | Windsor-3 State House District
VT-Y-4 | Windsor-4 | Windsor-4 State House District
VT-Y-5 | Windsor-5 | Windsor-5 State House District
VT-Y-6 | Windsor-6 | Windsor-6 State House District
VT-Y-A | Windsor-Addison | Windsor-Addison State House District
VT-Y-W | Windsor-Windham | Windsor-Windham State House District
VT-YO1 | Windsor-Orange-1 | Windsor-Orange-1 State House District
VT-YO2 | Windsor-Orange-2 | Windsor-Orange-2 State House District
```


## NH floterial districts (`sldl_flot`, derived)

One line per feature: `id | num | name` | bases.

### sldl_flot NH (27)

```
NH-008 | Belknap 8 | Belknap 8 (floterial) | Belknap 3, Belknap 4
NH-107 | Carroll 7 | Carroll 7 (floterial) | Carroll 5, Carroll 6
NH-108 | Carroll 8 | Carroll 8 (floterial) | Carroll 3, Carroll 4
NH-215 | Cheshire 15 | Cheshire 15 (floterial) | Cheshire 1, Cheshire 2, Cheshire 3, Cheshire 4, Cheshire 5, Cheshire 6
NH-216 | Cheshire 16 | Cheshire 16 (floterial) | Cheshire 8, Cheshire 9
NH-217 | Cheshire 17 | Cheshire 17 (floterial) | Cheshire 10, Cheshire 11, Cheshire 12
NH-218 | Cheshire 18 | Cheshire 18 (floterial) | Cheshire 13, Cheshire 14
NH-307 | Coos 7 | Coos 7 (floterial) | Coos 4, Coos 5
NH-417 | Grafton 17 | Grafton 17 (floterial) | Grafton 13, Grafton 14, Grafton 15
NH-418 | Grafton 18 | Grafton 18 (floterial) | Grafton 9, Grafton 10, Grafton 11, Grafton 16
NH-537 | Hillsborough 37 | Hillsborough 37 (floterial) | Hillsborough 34, Hillsborough 43
NH-538 | Hillsborough 38 | Hillsborough 38 (floterial) | Hillsborough 13, Hillsborough 14
NH-541 | Hillsborough 41 | Hillsborough 41 (floterial) | Hillsborough 17, Hillsborough 24, Hillsborough 25, Hillsborough 26
NH-544 | Hillsborough 44 | Hillsborough 44 (floterial) | Hillsborough 28, Hillsborough 29
NH-545 | Hillsborough 45 | Hillsborough 45 (floterial) | Hillsborough 35, Hillsborough 36
NH-626 | Merrimack 26 | Merrimack 26 (floterial) | Merrimack 1, Merrimack 4, Merrimack 5
NH-630 | Merrimack 30 | Merrimack 30 (floterial) | Merrimack 19, Merrimack 20, Merrimack 21
NH-731 | Rockingham 31 | Rockingham 31 (floterial) | Rockingham 2, Rockingham 3
NH-732 | Rockingham 32 | Rockingham 32 (floterial) | Rockingham 6, Rockingham 7, Rockingham 8
NH-733 | Rockingham 33 | Rockingham 33 (floterial) | Rockingham 10, Rockingham 11, Rockingham 12
NH-734 | Rockingham 34 | Rockingham 34 (floterial) | Rockingham 14, Rockingham 15
NH-735 | Rockingham 35 | Rockingham 35 (floterial) | Rockingham 16, Rockingham 17
NH-818 | Strafford 18 | Strafford 18 (floterial) | Strafford 3, Strafford 4
NH-819 | Strafford 19 | Strafford 19 (floterial) | Strafford 5, Strafford 6, Strafford 7, Strafford 8, Strafford 9
NH-821 | Strafford 21 | Strafford 21 (floterial) | Strafford 13, Strafford 14, Strafford 15, Strafford 16, Strafford 17
NH-907 | Sullivan 7 | Sullivan 7 (floterial) | Sullivan 2, Sullivan 3
NH-908 | Sullivan 8 | Sullivan 8 (floterial) | Sullivan 4, Sullivan 5, Sullivan 6
```

## Missing / approximated

- NH floterial House districts: 12 of 39 missing; the 27 present are derived (see above). Base districts are complete (164).
- CT counties are the 8 legacy counties (no longer governmental/statistical units since 2022); built from 2022 town geometry. Census 2022+ products use 9 planning regions instead (not included).
- Geometry is Census CB 1:500k (generalized, shoreline-clipped). Not full-resolution TIGER/Line; adequate for region- and state-level display, district shapes in dense areas (Boston, Providence) remain recognizable.
- Data obtained from a GitHub mirror of Census CB files rather than census.gov directly (blocked). Spot checks: district counts, codes, `LSY=2022`, `CDSESSN=118` all consistent with the official 2022 CB release.
- VT congressional at-large district `VT-AL` (TIGER CD118FP `00`).
