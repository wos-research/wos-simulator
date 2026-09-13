# Mk2 integration into the standard simulator

This branch ports the Expedition Simulator Mk2 mechanics into the existing simulator, testcase runner, and single-battle dashboard. It replaces the separate review-package layout with the repository's normal folders. The original comparison snapshot remains in [PR #1](https://github.com/wos-research/wos-simulator/pull/1). Neither branch changes shared `main` until reviewed and merged.

**Research direction (September13):** the user abandoned the proposed rollback and directed continued research from the current Mk2 baseline. Protect established source behavior and prioritize unresolved RNG timing, skill ordering and random-number consumption. The broad FC flooring override exceeded its original evidence scope; isolated comparison results do not authorize extrapolation or prove a coefficient. Every new active-kernel change requires explicit user approval. See [the scope clarification](mk2-rng-scope-20260913.md) and [latest twenty reports](mk2-continuation-20260913.md).

## Where the work lives

| Path | Purpose |
|---|---|
| `simulator/src/{types,effects,runtime,simulator,extraAttacks}.ts` | Optional hooks in the existing battle engine; legacy defaults remain unchanged. |
| `simulator/src/mk2/` | Browser-safe Lua 5.4 RNG, seed metadata, tested troop mechanics, and replay entry point. Uses the primary engine, without a second vendored copy. |
| `simulator/src/tooling/testcases.ts` and `scripts/run_testcases.ts` | Load and replay captured cases, compare observed outcomes, and preserve replay metadata. |
| `testcases/mk2/controlled.json` | All 160 anonymized captured report cases in the normal testcase format. |
| `simulator/src/mk2/fixtures/` | Native Lua RNG vectors and 301 legacy reference outcomes for regression tests. |
| `dashboard/web/` | Explicit Mk2/legacy selection and replay settings in the existing single-battle flow. |
| `docs/mk2-controlled-reports.md` | Human-readable catalog of all 160 captured reports. |

## Captured evidence and limits

The controlled corpus contains 65 single-RNG-source, 75 two-source, and 20 three-source reports. Separate battles remain separate cases even when their inputs coincide: 160 reports represent 156 distinct predictive requests. Comparison checks the winner, all six survivor counts, and every supplied chance-skill activation count. A missing activation count is unknown; an explicit zero is checked. The 301 legacy reference outcomes are regression fixtures, not 301 additional validated controlled battles. The separate campaign adds 161 passing reports; the five previously unresolved D1 reports also now pass, for 326 before the health correction. The ten health witnesses now also pass, for 336 total. Their existing file and IDs are retained without duplication. Mixed-skill research reports remain outside the passing count; the two original failures and additional completed observations are preserved separately. See the dated campaign notes and [pending research](mk2-pending-research.md) for validation scope.

The [health checkpoint](mk2-health-checkpoint-20260913.md) now includes the tested v14 correction: original T10 FC5 Lancer health 597 restores all ten larger-army reports, while preserving all 326 earlier passing reports. That publication checkpoint contains 366 reports: 336 passing and 30 pending mixed-skill observations. The subsequent15-report supplement reached381 reports:342 exact and39 pending. The [twenty-report continuation](mk2-continuation-20260913.md) reached401 reports under catalogue14. The user-approved [scoped Volley/Lance update](mk2-scoped-volley-lance-20260913.md) and five additional C2 reports bring the corpus to406:361 current-kernel matches and45 pending observations. Only the exact reviewed E1 rule is installed; other ordering candidates remain experimental.

The transferred rules are Lua 5.4 xoshiro256** and inclusive integer draws; FC troop-stat flooring with nine individually tested original-catalogue stat restorations across six profiles; per-hit Crystal Shield checks; side-local attack scheduling; Ambusher targeting; Volley checks after Marksman depletion; the narrowly guarded Volley/Gunpowder ordering; and a terminal Volley Shield check when the normal shot exhausts Infantry, with canceled Volley damage still suppressed. Damage equations are unchanged. The catalogue corrections and subsequent captured campaign evidence are detailed in [the campaign notes](mk2-campaign-20260913.md). The Gunpowder timing guard remains restricted to the tested pure Marksman versus Infantry skill profiles; unsupported combinations retain reference timing with an explicit warning. Experimental hero and T12 definitions from the research workspace are not imported.

Matching a report's recorded seed is diagnostic replay. Independently deriving the game's seed from battle time remains unresolved. All supplied controlled cases carry `timestampSource: "derived-report-seed-minus-one"`; their timestamp is constructed from the recorded seed and is not independent evidence of the game's seeding event. Skill-credited wounded conversion, general hero interactions, and untested troop combinations are outside this validation.

## Testcase and seed behavior

Old cases remain on the legacy engine unless they explicitly opt into Mk2 using `simulation_mode: "mk2"` or replay data. Mk2 cases retain the normal root `attacker` and `defender` fields, adding `replay` and `observed`:

```json
{
  "test_id": "example",
  "simulation_mode": "mk2",
  "attacker": { "troops": {}, "stats": {} },
  "defender": { "troops": {}, "stats": {} },
  "replay": {
    "timestamp": "1789160442",
    "timestampSource": "derived-report-seed-minus-one",
    "reportedSeed": 1789160443
  },
  "observed": {
    "winner": "attacker",
    "remaining": {
      "attacker": { "infantry": 0, "lancer": 1848, "marksman": 0 },
      "defender": { "infantry": 0, "lancer": 0, "marksman": 0 }
    },
    "skillProcs": { "attacker": { "90004": 18 }, "defender": {} }
  }
}
```

The abbreviated armies above illustrate the schema only; use the complete captured cases for runnable examples.

A supplied `reportedSeed` takes precedence and is recorded as the seed source. Otherwise an explicit integer timestamp uses `timestamp + 1`; absent both, the fixed timestamp is `000000` and seed is `1`. The second Lua seed argument is zero. Metadata distinguishes recorded-seed replay, timestamp-based replay, and the fixed default; comparing a timestamp against a supplied seed does not prove the timestamp is independently correct.

Mk2 replay runs once with supplied inputs. It bypasses legacy stochastic repetitions and stat fitting, so a report cannot pass by silently adjusting army stats. Exact comparison and seed provenance are retained in saved testcase details. The dashboard likewise stores Mk2 replay settings and metadata with saved single-battle results. Other dashboard simulation workflows retain their existing behavior.

## Reproduce

From the repository root:

```sh
cd simulator
npm ci
npm test
npm run typecheck
npx tsx ../scripts/run_testcases.ts --matching mk2 --workers 1 --human
```

To save replay artifacts without modifying the calibration database:

```sh
npx tsx ../scripts/run_testcases.ts --matching mk2 --workers 1 --save-snapshot --output-dir ../test_results/mk2
```

Dashboard checks run from `dashboard/web` after `npm ci`:

```sh
npm test
npx tsc --noEmit
npm run build
```

Captured inputs are sanitized: account names, mail identifiers, raw network captures, emulator details, and private workspace paths are excluded. Recorded seeds, troop counts, army stats, outcomes, and available activation counts are preserved. See the [report catalog](mk2-controlled-reports.md) for the observations and the [native cases](../testcases/mk2/controlled.json) for exact inputs.

## Integration validation

At publication, the full simulator suite passes 248 tests, including the 160 controlled replays, 301 legacy reference outcomes, and 45,440 native Lua values. The dashboard passes 104 tests and its production build. The CLI/tooling suite passes 53 tests (including tests also counted in the simulator suite). A real browser worker replay, save, and reload preserves Mk2 mode, its recorded seed, and a visible timestamp mismatch. The native testcase runner checks 960 survivor values and 275 explicitly recorded skill counts across the 160 reports, with one replay per case and no stat adjustments.


## Supplemental evidence discovery

The aggregate forty-fight casualty evidence is stored under `research/mk2/controlled_casualties_20260913.json` and verified by its dedicated test. It is intentionally outside the ordinary battle-file scan because it references campaign battles rather than containing root armies. This resolves the sidecar adaptation error identified in PCB’s dated integration review while retaining its exact contents. A full Mk2 scan still includes known mixed-skill failures and unsupported T12 inbox cases; those remain visible errors or mismatches.

Latest evidence: [ten further RNG reports](mk2-shield-accounting-witnesses-20260913.md) bring the corpus to **416 reports: 366 exact and 50 pending** under unchanged catalogue15. Two new Shield-context reports distinguish the previously frozen Volley accounting alternatives; the candidate remains experimental while reverse testing proceeds.

The subsequent [ten reverse reports](mk2-reverse-rng-controls-20260913.md) bring the corpus to **426 reports: 371 exact and 55 pending**. The three-source ALG combination matches ten reports across both directions. Reverse Shield reports match both experimental alternatives and supply no additional accounting distinction. The active kernel remains unchanged.

A further [five reverse accounting reports](mk2-reverse-rng-controls-20260913.md#additional-reverse-accounting-batch) bring the current corpus to **431 reports: 371 exact and 60 pending**. They match both frozen candidates and provide no reverse unused-success distinction. The original 160 controls still pass; the new ordering candidate remains isolated.
