# Mk2 in the main simulator

The main `simulator/src` engine now includes the measured Mk2 changes: Lua 5.4 replay RNG, FC attack/health floor rounding for T1–T10, per-hit Shield checks, separate Volley hits, side-local attack scheduling, Ambusher target-time checks, Volley checks after depletion, and the guarded Gunpowder-after-Volley rule. The production engine does not import the research snapshot. Provisional newer-hero and T12 definitions remain outside this integration.

## Compatibility and selection

- Existing flat testcase files and callers without replay fields keep **legacy mechanics and RNG**. The 301 saved reference outcomes, including rounds and survivor counts, remain unchanged.
- Set `mechanicsVersion: "mk2"` to sample with Mk2 mechanics. Without replay data, different simulation seeds still produce independent, reproducible samples using the existing LCG.
- A valid `timestamp` or `reportedSeed` selects Mk2 replay automatically unless `mechanicsVersion: "legacy"` is explicit.
- Fresh dashboard forms default to Mk2. The “Mechanics and battle replay” controls offer Legacy, an optional battle timestamp, and an optional report seed. Older saved forms without a mechanics version load as Legacy.
- Ratio search and exploration use the selected mechanics version. The replay input fields apply to the Simulate action.

The API accepts nonnegative integer Unix seconds as safe integer numbers or decimal strings. It does not guess a timezone or parse display/OCR timestamps. Preserve large seeds as decimal strings.

```ts
import { prepareBattle, runPrepared, simulateBattles } from "./src/simulator";
import { loadSimulatorConfig } from "./src/config-node";

const config = loadSimulatorConfig();

// Existing input: identical legacy combat behavior.
const legacy = runPrepared(prepareBattle(oldInput, config), "old-seed");

// Mk2 mechanics with five ordinary simulation seeds.
const samples = simulateBattles({
  ...oldInput, mechanicsVersion: "mk2", seed: "my-comparison",
}, config, { count: 5 });

// Replay with an independently supplied timestamp and report seed.
const replay = runPrepared(prepareBattle({
  ...oldInput,
  timestamp: "1789160442",
  timestampSource: "packet",
  reportedSeed: "1789160443",
}, config));
console.log(replay.execution);
```

## Timestamp status

Every main `runPrepared` result includes serializable `execution` metadata. It survives the dashboard worker boundary, saved result, outcome entry, trace, testcase detail, and parity summary.

| `timestampStatus` | Meaning |
|---|---|
| `missing` | No usable historical timestamp or report seed; ordinary simulation. |
| `unverified` | Timestamp supplied, but the original seed was not supplied for comparison. |
| `matches-reported-seed` | The supplied timestamp plus one equals the supplied recorded seed. |
| `derived-from-reported-seed` | Replay uses the report seed; the timestamp was derived, not independently recovered. |
| `not-used` | Replay data was supplied, but explicit Legacy or a custom RNG prevented its use. |

`historicalSeedMatched` is true only when the Lua replay uses the supplied report seed. This records agreement with the supplied evidence; it does not authenticate a game report or establish that every mechanic is correct. A timestamp without a seed is never marked verified. Conflicting timestamps, unsafe numeric values, and timestamp/seed mismatches fail before execution. An explicit `timestampSource: "derived-report-seed-minus-one"` retains its derived status when a report seed is available; it never becomes an independently verified timestamp just because the two agree.

Old results with no metadata display “Timestamp status unavailable (older result).” Missing/default-zero timestamps with a missing provenance marker remain ordinary simulations; no seed-1 replay is silently invented.

## Testcase formats and replay execution

The testcase adapter accepts existing `{attacker, defender, ...}` files, Mk2 `{input, timestamp, ...}` requests, and controlled `{request: {input, timestamp, ...}, reportedSeed, observed}` rows. Timestamp declarations in nested wrappers must agree. The captured `observed` outcome is used only for comparison, never as a combat input.

```json
{
  "test_id": "captured-battle",
  "attacker": {"troops": {"lancer_t7_fc1": 5000}},
  "defender": {"troops": {"infantry_t5_fc1": 5000}},
  "timestamp": "1789160442",
  "timestampSource": "packet",
  "reportedSeed": "1789160443"
}
```

A replay executes once even when a testcase repeat count or dashboard replicate count is larger. Simulation seed overrides cannot replace the historical seed during replay. Testcase replays bypass the existing stat-adjustment search; their comparisons use unchanged input stats. Result cards show a replay winner and survivor counts instead of treating one replay as a win-probability estimate.

The 160 supplied controls contain 34 troop-only input profiles, with no heroes. The delayed Gunpowder rule retains its original guards and falls back to legacy timing outside the measured scope; the execution metadata records that fallback. This integration does not expand the snapshot's accuracy claims.

## Regression coverage

`simulator/src/mk2.test.ts` verifies the 160 exact controlled outcomes, all 275 recorded skill counts, 301 unchanged reference outcomes, 145 native Lua RNG vectors, timestamp provenance and conflicts, missing timestamps, custom RNG handling, sampling, and the testcase reporting path. `dashboard/web/lib/simulator/replay.test.ts` exercises worker serialization, aggregation, traces, saved forms, and legacy restoration. The existing engine and dashboard suites remain applicable.

The dashboard TypeScript target is ES2020 because the Lua RNG needs native BigInt arithmetic.
