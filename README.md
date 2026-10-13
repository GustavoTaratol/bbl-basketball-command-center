# BBL Draft Assistant

Offline NBA fantasy draft assistant built from the supplied BBL workbook and
CBS player data snapshots.

## Finished application

The distributable application is a single standalone HTML file:

`Deliverables/BBL Draft Assistant/BBL_Draft_Assistant_Offline.html`

It runs locally in a modern browser and does not require an internet
connection.

The same generated application is written to `docs/index.html` for GitHub
Pages. Configure Pages to deploy from the `main` branch and `/docs` folder.

## League configuration

- 10 teams
- 13 rounds
- Standard snake draft
- Daily starters: 1 G, 1 F, 1 C, and 2 G/F/C flex
- 8 bench spots
- Draft position can be changed from Settings
- Multi-position eligibility is supported (`PG/SG`, `SF/PF`, `PF/C`, etc.)

## Mock drafts

New drafts open in **Mock draft** mode. Choose your slot in Settings, then use
**Simulate to my pick** to let the computer make every opponent selection. At
your turn, draft any available player or use **Auto-draft best**. Opponent picks
use a weighted lottery within a plausible market tier. Proximity to the current
pick carries the most weight, with smaller adjustments for BBL value, available
position groups, and players falling past market expectation. Repeated mocks
remain different without producing implausible early-round reaches.

Choose **Live draft assistant** in Settings when following a real draft and
recording opponent selections manually.

Click a player's orange position label to correct or add eligibility. CSV
imports accept a `Positions`, `Position`, or `Pos` column with slash-, comma-,
or space-separated values.

Position eligibility comes from the Basketball Reference player directory.
Its career labels (`G`, `F`, `G-F`, `F-C`, and `C`) are mapped to the app's
specific slots (`G → PG/SG`, `F → SF/PF`). Run `python3
sync_bref_positions.py` to refresh the checked-in snapshot. Settings can also
import a replacement CSV with `Name` and `Positions` columns.

## Offline application source

- `build_offline.py` — reads the workbook and CBS snapshots and builds the
  standalone HTML application
- `v2_app.js` — application state, draft projections, scoring, lineup coverage,
  settings, and interactions
- `v2_extra.css` — application styling and responsive layout
- `v2_additions.html` — additional application panels and controls
- `cbs_adp_snapshot.csv` — CBS ADP snapshot
- `cbs_deep_pool_snapshot.csv` — extended CBS player pool
- `cbs_projection_snapshot.csv` — CBS projection snapshot

The workbook path and output path are configured near the top of
`build_offline.py`.

## Rebuilding

Python dependencies used by the generator:

- `openpyxl`
- `pandas`

Run:

```bash
python3 build_offline.py
```

When the workbook is unavailable but the embedded player data already exists,
refresh the checked-in standalone page after JavaScript or CSS changes with:

```bash
npm run build:offline
```

The checked-in CBS snapshots allow the embedded player pool to be rebuilt
without downloading fresh CBS data.

## Data and saves

The generated HTML embeds the player data, projections, schedules, CSS, and
JavaScript. Draft progress is saved in the browser's local storage. Users can
also download and restore backup files from inside the application.
