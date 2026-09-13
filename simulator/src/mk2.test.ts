import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadSimulatorConfig } from "./config-node";
import { prepareBattle, runPrepared, simulateBattles } from "./simulator";
import { adaptTestcaseEntry, executeTestcaseCase, runTestcases } from "./tooling/testcases";
import { executionLabel, replayFieldsFromRecord } from "./execution";
import { Lua54Random } from "./mk2/lua54_rng";
import type { BattleInput, SideId } from "./types";

const config = loadSimulatorConfig();
const read = (name: string) => JSON.parse(readFileSync(new URL(`../../research/mk2/fixtures/${name}.json`, import.meta.url), "utf8"));
const controlled = read("controlled");
const reference = read("reference");
const reportSkills: Record<string, string> = {
  "90004": "Ambusher", "90006": "Volley", "90007": "CrystalShield", "90008": "CrystalLance", "90009": "CrystalGunpowder",
};
const inputFor = (row = controlled[0]): BattleInput => adaptTestcaseEntry(row);
const run = (input: BattleInput) => runPrepared(prepareBattle(input, config));

test("main engine reproduces all 160 recorded reports, including all 275 recorded skill counts", () => {
  let procs = 0;
  for (const c of controlled) {
    const input = inputFor(c), before = JSON.stringify(input);
    const result = run(input);
    assert.deepEqual(result.remaining, c.observed.remaining, c.id);
    assert.equal(result.winner, c.observed.winner, c.id);
    assert.equal(result.execution?.seed, String(c.reportedSeed));
    assert.equal(result.execution?.timestampStatus, "derived-from-reported-seed");
    assert.equal(result.execution?.historicalSeedMatched, true);
    for (const side of ["attacker", "defender"] as SideId[]) {
      for (const [id, expected] of Object.entries(c.observed.skillProcs[side])) {
        assert(reportSkills[id], id);
        const actual = result.skillReport[side].filter(s => s.skillId === reportSkills[id]).reduce((n, s) => n + s.skillActivations, 0);
        assert.equal(actual, expected, `${c.id}:${side}:${id}`);
        procs++;
      }
    }
    assert.equal(JSON.stringify(input), before);
  }
  assert.equal(controlled.length, 160);
  assert.equal(procs, 275);
});

test("all 301 legacy reference outcomes and rounds remain unchanged after Mk2 runs", () => {
  const before = JSON.stringify(config);
  run(inputFor());
  for (const c of reference) {
    const result = runPrepared(prepareBattle(c.input, config), "cross-repo-nohero-0", { mode: "fast" });
    assert.deepEqual(result.remaining, c.expected.remaining, c.id);
    assert.equal(result.winner, c.expected.winner, c.id);
    assert.equal(result.rounds, c.expected.rounds, c.id);
    assert.equal(result.execution?.mechanicsVersion, "legacy");
    assert.equal(result.execution?.historicalSeedMatched, false);
  }
  assert.equal(JSON.stringify(config), before, "Mk2 must not mutate the shared config");
});

test("ported Lua RNG matches all 145 saved native vectors", () => {
  let count = 0;
  for (const c of controlled) if (c.nativeLuaReference) {
    const native = c.nativeLuaReference, rng = new Lua54Random(BigInt(native.seed));
    assert.deepEqual(native.rolls.map(() => rng.random(0, 9999)), native.rolls, c.id);
    count++;
  }
  assert.equal(count, 145);
});

test("timestamp-only, recorded-seed-only, matched, missing, and ignored timestamp statuses remain distinct", () => {
  const fixture = controlled[0];
  const base = fixture.request.input;
  const timestamp = fixture.request.timestamp;
  const supplied = run({ ...base, timestamp, timestampSource: "packet" });
  assert.equal(supplied.execution?.timestampStatus, "unverified");
  assert.equal(supplied.execution?.historicalSeedMatched, false);
  const matched = run({ ...base, timestamp, timestampSource: "packet", reportedSeed: fixture.reportedSeed });
  assert.equal(matched.execution?.timestampStatus, "matches-reported-seed");
  assert.equal(matched.execution?.historicalSeedMatched, true);
  const seedOnly = run({ ...base, reportedSeed: fixture.reportedSeed });
  assert.deepEqual(seedOnly.remaining, fixture.observed.remaining);
  assert.equal(seedOnly.execution?.timestampStatus, "derived-from-reported-seed");
  const missing = run({ ...base, mechanicsVersion: "mk2" });
  assert.equal(missing.execution?.mode, "simulation");
  assert.equal(missing.execution?.timestampStatus, "missing");
  const ignored = run({ ...base, timestamp, mechanicsVersion: "legacy" });
  assert.equal(ignored.execution?.timestampStatus, "not-used");
  assert.equal(ignored.execution?.historicalSeedMatched, false);
  assert.match(executionLabel(), /unavailable/);
});

test("conflicting timestamps, unsafe numbers, and seed mismatches fail before simulation", () => {
  const base = controlled[0].request.input;
  assert.throws(() => run({ ...base, timestamp: "123", reportedSeed: 999 }), /does not match/);
  for (const timestamp of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1, "2026-09-12", "", "9223372036854775807"])
    assert.throws(() => run({ ...base, timestamp }), /timestamp/);
  assert.throws(() => replayFieldsFromRecord({ timestamp: 1, input: { timestamp: 2 } }), /Conflicting/);
  assert.throws(() => run({ ...base, mechanicsVersion: "typo" as any }), /Unknown mechanicsVersion/);
  const missing = adaptTestcaseEntry({ ...base, timestamp: "000000", timestampSource: "missing-default" });
  assert.equal(run(missing).execution?.mechanicsVersion, "legacy");
});

test("replays execute once despite repeat/seed requests; Mk2 sampling still supports distinct reproducible seeds", () => {
  const input = inputFor();
  assert.equal(simulateBattles(input, config, { count: 5 }).length, 1);
  const result = executeTestcaseCase({ file: "fixture", reportFile: "fixture", testcaseId: "test", index: 0, input, repeat: 500, seed: "irrelevant" }, config);
  assert.equal(result.sampleCount, 1);
  assert.equal(result.deterministic, true);
  assert.equal(result.result?.execution?.seed, String(controlled[0].reportedSeed));
  const compiled = prepareBattle({ ...controlled[0].request.input, mechanicsVersion: "mk2" }, config);
  const a = runPrepared(compiled, "sample-A"), b = runPrepared(compiled, "sample-B");
  assert.deepEqual(runPrepared(compiled, "sample-A"), a);
  assert.notDeepEqual(a.remaining, b.remaining);
  assert.equal(a.execution?.historicalSeedMatched, false);
  const custom = runPrepared(prepareBattle(input, config), "custom", { rng: () => 0.9 });
  assert.equal(custom.execution?.rngAlgorithm, "custom");
  assert.equal(custom.execution?.historicalSeedMatched, false);
});

test("testcase summary retains replay provenance and never adjusts stats for a replay", () => {
  const dir = mkdtempSync(join(tmpdir(), "wos-replay-case-"));
  try {
    const fixture = structuredClone(controlled[0]);
    fixture.observed.remaining.attacker.lancer += 100;
    writeFileSync(join(dir, "case.json"), JSON.stringify(fixture));
    const result = runTestcases({ testcaseRoot: dir, repeat: 5 }, config);
    assert.equal(result.counts.errors, 0);
    const detail = result.details[0], summary = Object.values(result.testcases)[0];
    assert.equal(detail.sampleCount, 1);
    assert.equal(detail.gameStatAdjustment, undefined);
    assert.equal(summary.execution?.timestampStatus, "derived-from-reported-seed");
    assert.equal(summary.armies?.attacker.troops.lancer_t7_fc1, 5000);
    assert.deepEqual(detail.result?.remaining, controlled[0].observed.remaining);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
