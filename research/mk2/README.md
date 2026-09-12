# Expedition simulator Mk2: controlled replay review

The snapshot below describes the isolated review export. Its measured mechanics are now also available in the [main simulator integration](integration.md); this research runtime remains unchanged.

This is a self-contained review snapshot of Mk2 version `expedition-mk2-lua54-gunpowder-timing-8`. It reproduces 160 controlled in-game report results using their recorded seeds. The existing simulator and dashboard elsewhere in this repository are unchanged.

## Run it

With Node.js 22 or newer, from this directory:

```sh
npm ci
npm test
npm run validate
```

Expected validation: **160/160 reports**, comprising **65 single-source**, **75 two-source**, and **20 three-source** cases. These represent 156 distinct predictive requests: separate fights with identical inputs and results remain separate cases. Exactness covers winner, all six survivor counts, and every recorded chance-skill activation count.

The tests also check 301 original reference outcomes in reference mode, native Lua RNG vectors, the delayed-Gunpowder scope guards, unchanged runtime source hashes, and reversal of the five upstream hook files. This portable suite is a focused export; the local 243-pass/one-Greg-TODO TypeScript suite and 23 Python tests include additional capture-ingestion and workstation evidence checks that are not shipped here.

To produce detailed traces for the supplied requests:

```sh
npm run replay -- --input fixtures/requests.json --trace --output replay-results.json
```

## Test cases and captured report results

- [Readable catalog of all 160 captured reports](reports/CONTROLLED_REPORTS.md): troop setups, seeds, winners, survivors, and recorded skill activation counts.
- [Full testcase data](fixtures/controlled.json): exact predictive stats and inputs alongside captured expected results.
- [Replay requests](fixtures/requests.json): inputs ready for the replay command.
- [301 reference cases](fixtures/reference.json): original-engine regression expectations, separate from the controlled in-game cohort.

## What changed from the reference engine

- Lua 5.4 xoshiro256** replay with exact `math.random(0,9999)` integer projection and rejection sampling. The default seed is `timestamp + 1`; missing timestamps become `000000`.
- FC attack/health rounding down for the tested T1–T10 coefficient path; broader FC accuracy is not established by these controls.
- Separate Shield checks for actual Gunpowder, Lance, and Volley extra hits.
- Volley as a separate strike with independent Shield protection.
- Army-local attack scheduling and Ambusher checks at Lancer target selection, consistent with the paired controls.
- Continued Volley chance/count checks after Marksman depletion, without damage.
- In the measured troop profiles, Volley roll → normal Shield/hit → Volley extra Shield/hit → Gunpowder roll → Gunpowder extra Shield/hit.

The latest timing rule is guarded against unmeasured heroes, mixed stacks, additional troop skills, and incompatible mechanics. `mechanics.gunpowderTiming: "reference"` preserves its pre-change behavior. Other reference switches are described in the corresponding wrapper modules. The core damage equations remain inherited from Piddly's engine.

## Review map

- `backend.ts`: active defaults and guarded integration.
- `lua54_rng.ts`, `battle_rng.ts`: random stream and trace metadata.
- `crystal_shield.ts`, `volley_persistence.ts`, `gunpowder_timing.ts`: tested troop interactions.
- `upstream_rng_hooks.json`: exact reversible replacements for five engine files.
- `upstream/`: the pinned `fadcab7` reference snapshot plus those hooks. Keeping this snapshot isolated avoids silently mixing our validated results with newer changes to the shared simulator.
- `fixtures/controlled.json`: anonymized captured inputs, observations, and saved native Lua vectors.
- `review.test.ts`: full controlled replay and reference-parity checks.
- `snapshot.json`: byte hashes tying shipped runtime files to the locally validated Mk2 snapshot.

Report IDs are replaced with sequential IDs and army names are generic. Troop counts, stats, seeds, and expected results are unchanged. Raw packets, account/mail IDs, full decoded reports, emulator state, and workstation paths are excluded. The private raw-to-export mapping remains local. The local capture loader's identity handling is therefore not independently verifiable from raw traffic in this package.

## Evidence limits

These are **recorded-seed diagnostics**, with replay timestamps explicitly derived as `reportedSeed - 1`. Independent recovery of the game's seeding timestamp is unresolved. Reports do not expose every internal server draw, and alternative internal schedules can sometimes be observationally equivalent.

Skill-credited wounded conversion and the existing Greg discrepancy remain unresolved. `extensions.json` includes earlier provisional newer-hero/T12 definitions needed to preserve the current snapshot; these are **not validated improvements** and are outside the controlled cohort. This branch does not claim universal server-battle accuracy or independently verified mixed-stack behavior.

No simulator mechanic was changed while packaging this review. Runtime files are copied byte-for-byte from the validated local version; the only test-data transformations are documented anonymization and omission of private provenance.

## Main-engine integration reports

- [Main simulator integration and compatibility](integration.md)
- [Integration validation](reports/integration-validation.md)
- [Replay accuracy comparison](reports/accuracy-comparison.md)
- [Per-case comparison](reports/accuracy-cases.md)
