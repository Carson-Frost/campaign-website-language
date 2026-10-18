# Public site

The study's public site and the design work behind it. Everything here runs from the project root.

## What is here

| Path | What it is |
| --- | --- |
| `mockups/` | The site: `index.html`, `app.js`, `style.css`. One page with hash routes (`#/`, `#/method`, `#/explore`, `#/coverage`, `#/related`, `#/data`). |
| `instrument/` | The Instrument build of the interface: explorer, charts, filters and drawer. Served at `/instrument/`. |
| `treatments/` | The four visual treatments the Instrument was chosen from, one directory each. `treatments/README.md` describes the families and the rules every one follows. |
| `mockups/build_data.py` | Builds the data the pages read, from `results/` and `tools/`. |
| `mockups/serve.py` | Serves the site, the built data and the result tables on a loopback address. |
| `capture_*.py`, `direction_boards.py`, `build_treatment_boards.py`, `*/capture*.py`, `*/boards.py` | Playwright captures and review boards. Every one writes into the ignored `artifacts/`. |

Each font directory carries its own licence file.

## Build the data, then run it

```text
artifacts/.venv/Scripts/python design/mockups/build_data.py
python design/mockups/serve.py --detach
```

`build_data.py` writes `artifacts/mockup-data/site.json` and `artifacts/mockup-data/excerpts/<n>.json`
from the tracked `results/` tables and the study's own `tools/`, so no number on the site is a second
copy of a number in `results/`. Repeated runs give byte-identical files. `artifacts/` is not in Git:
rebuild it, never commit it.

`serve.py --detach` starts a background server that outlives the terminal and prints the address,
http://127.0.0.1:8765/ by default; pass a port to use another. Without `--detach` it runs in the
foreground. It serves:

| Route | From |
| --- | --- |
| `/` | `design/mockups/` |
| `/instrument/` | `design/instrument/` |
| `/treatments/` | `design/treatments/` |
| `/data/` | `artifacts/mockup-data/`, built by `build_data.py` |
| `/files/*.csv` | `results/`, as downloads, with independent and third-party rows removed |

The capture and board scripts need the server running, and they need the Playwright browser
(`artifacts/.venv/Scripts/python -m playwright install chromium`).
