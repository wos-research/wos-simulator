# WOS Battle Simulator — Monorepo

A monorepo for simulating and calibrating Whiteout Survival (WOS) battles. It
is organized around three primary components plus shared data and documentation.

```
.
├── simulator/     # PRIMARY: the TypeScript battle simulator (source of truth)
├── dashboard/     # Next.js web dashboard + SQLite migrations and OCR fixtures
├── skill/         # Self-contained agent skill ("wos") for driving the game via ADB
├── shared/        # Data shared across components (fighter stat profiles)
├── testcases/     # Ground-truth calibration corpus (game-observed battle results)
├── docs/          # Design docs, plans, and specs
└── test_results/  # Calibration DB (dashboard.sqlite) + baseline
```

## Expedition Simulator Mk2

The [current locked catalogue20 checkpoint](docs/mk2-locked-logical581-20260914.md) covers **581 logical testcases: 349 exact matches, 580 matching winner classifications and 232 unresolved cases**. The normal CLI executed all 581 with zero errors. This adds 35 distinct new mail-report fixtures and complete anonymized combat sidecars to the published 546; all prior fixture bytes and comparisons are preserved. Exactness checks the winner, all six survivor counts and every explicitly recorded supported chance-skill count. Failures remain visible.

T1–T10 / FC0–FC5 troop statistics are locked to the supplied source. The audited historical calibrated table contained 302 one-point reductions: 156 cells in the approved range were restored, while 146 T1–T10 / FC6–FC10 one-point reductions remain inherited and unvalidated. Higher-tier/FC behavior is not established by this checkpoint. Replays use the original recorded seeds and retained exact-context RNG rules; those rules are retained for reconstruction, not revalidated by the stat restoration. Twenty new report-only fixtures have no independently captured battle timestamp and keep it unknown. Available direct mail mappings cover 339 of the inherited 546 testcase IDs; the other 207 retain their historical ledger provenance without a new identity proof. This 581-case checkpoint was audited at 17:59 UTC on 14 September 2026. Later 125-Infantry / 100-, 105-, and 110-Marksmen experiments are separate and excluded from this checkpoint.

The [historical pre-restoration 541-report checkpoint](docs/mk2-installed-asymmetric-scope541-20260914.md) recorded 530 exact matches, 540 matching winner classifications and 11 unresolved cases. Its results, including the UI-supported winner correction for a battle with zero survivors on both sides, remain available as history; they do not describe the current restored-stat baseline.

The [dashboard/CLI compatibility review](docs/mk2-compatibility-review-20260914.md) documents the representation and loader repairs, validation, and approved round-cap restoration and unresolved stat/timestamp findings.

The [Mk2 integration guide](docs/mk2-integration.md) describes the opt-in replay engine,
seed provenance, and reproducible checks. The original 160 captured cases live in
[`testcases/mk2/controlled.json`](testcases/mk2/controlled.json), with a
[readable report catalog](docs/mk2-controlled-reports.md). The [historical installed catalogue19 checkpoint](docs/installed-catalogue19-validation-20260914.md) recorded **516/516 reviewed controlled reports exactly**: winner, all six survivor counts and every explicitly recorded supported chance-skill count. That historical update added 20 reports and two narrowly scoped Ambusher reservation rules while preserving complete results and RNG for the previous 496. It changed no troop statistics, probabilities or normal attack/effect scheduling. All fixtures, recorded seeds, observed results and four new sanitized complete combat-report sidecars are included. Captured timestamps remain separate from seed-derived adapters; timestamp exceptions and external inbox failures remain documented. The [previous checkpoint](docs/installed-catalogue18-validation-20260914.md) and dated research documents retain the development history. Raw identifying network captures remain private.

## Components

### `simulator/` — the primary simulator

The current, authoritative battle engine. Written in TypeScript and run with
`tsx` (no build step required for dev). It powers in-browser simulation in the
dashboard and the parity/tournament tooling.

```bash
cd simulator
npm test                    # unit + testcase parity suite
npm run typecheck
npx tsx ../scripts/run_testcases.ts --save-snapshot --db-ingest # save run and add to dashboard history
npx tsx ../scripts/run_testcases.ts --human --generate-charts   # summary plus stochastic distribution charts
```

Simulator-backed operational scripts live at the repo root:

```bash
npx tsx scripts/tournament_dual_swiss.ts
npx tsx scripts/benchmark_tournament_battle_modes.ts 60
npx tsx scripts/fit_enemy_base_stats.ts --help
```

Config (troop/hero stats, hero definitions) lives in `simulator/config/`. The
dashboard imports the engine through the `@simulator/*` path alias, which resolves to
`simulator/src/*` (alias name kept for continuity). Hero JSON files are the sole
catalogue: Node tools discover them from the directory at runtime, and the
dashboard discovers and bundles the same directory through Webpack. There is no
generated manifest or separate registration step.

### `dashboard/`

A Next.js app (`dashboard/web/`) with TypeScript SQLite ingestion and Python OCR
helpers. The dashboard reads parity reports and the SQLite run history;
current runs are generated from the CLI with
`npx tsx scripts/run_testcases.ts --save-snapshot --db-ingest`. Saved testcase
run artifacts include stochastic distribution charts, available from the
Run Reports page's Charts tab. In-browser simulation runs the TypeScript engine
in a web worker.

```bash
cd dashboard/web
npm ci
npm run dev                 # http://localhost:3000
npm run build && npm test
```

See [`README_DASHBOARD.md`](README_DASHBOARD.md) and
[`dashboard/README.md`](dashboard/README.md).

### `skill/`

The self-contained `wos` agent skill that automates the game on MuMuPlayer
emulators via ADB (`skill/scripts/wosctl`). Everything the skill needs at
runtime (OCR model, templates, data, knowledge) lives inside `skill/`. The one
intentional outward write is `run-testcase`, which appends captured fixtures to
the root `testcases/` corpus. See [`skill/SKILL.md`](skill/SKILL.md).

## Data layout

- **`simulator/config/`** — the simulator schema (hero definitions, troop stats/skills,
  hero generation stats). Authoritative for the current simulator.
- **`shared/fighters_data/`** — fighter stat profiles (plain numeric stat
  tables), read by simulator-backed scripts.
- **`testcases/`** — the ground-truth calibration corpus. It intentionally lives
  at the repo root rather than under `shared/`: its path string is a stable
  logical id baked into the calibration DB, waivers, and parity-report
  normalization, so moving it would churn historical identities. `simulator/`
  reaches it through a `simulator/testcases -> ../testcases` symlink.

## Development

```bash
# Python (shared venv at repo root)
uv sync
uv run pytest                      # skill and OCR Python tests

# TypeScript
cd simulator && npm test
cd dashboard/web && npm ci && npm test
```

Docker dev/prod compose files at the repo root bind-mount the component trees
into the container; see `docker-compose.yml` / `docker-compose.prod.yml`.

## Credits

Built on the original simulator by **[1589] HIT-Ryo** with help from the
[WOS Nerds Discord](https://discord.gg/BW288dNExX), the
[HIT Alliance in State 1589](https://discord.gg/X6wpn7j3cC), and
[SOS Simulator](https://github.com/request-laurent/sos.battle) by Request-Laurent.
