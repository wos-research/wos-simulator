import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { SimulateRequestPayload, SimulateSidePayload, SavedSimulationRunResponse } from "../simulate-run";
import { runSimulation, runSimulationBatchDirect, runSimulationTrace } from "./simulate";
import { savedRunToFormState } from "../simulate/saved-run-state";
import { executionLabel } from "@simulator/execution";

const fixture = JSON.parse(readFileSync(new URL("../../../../research/mk2/fixtures/controlled.json", import.meta.url), "utf8"))[0];
const units = ["infantry", "lancer", "marksman"] as const;
function side(raw: any): SimulateSidePayload {
  const typeFor = (unit: string) => Object.keys(raw.troops).find(id => id.startsWith(unit + "_")) ?? `${unit}_t5`;
  const stats = (unit: string) => ["attack", "defense", "lethality", "health"].map(axis => raw.stats[unit]?.[axis] ?? 0) as [number, number, number, number];
  return {
    troops: Object.fromEntries(units.map(u => [u, raw.troops[typeFor(u)] ?? 0])) as SimulateSidePayload["troops"],
    troop_types: Object.fromEntries(units.map(u => [u, typeFor(u)])) as SimulateSidePayload["troop_types"],
    heroes: Object.fromEntries(units.map(u => [u, { name: null, skills: [0, 0, 0, 0] }])) as SimulateSidePayload["heroes"],
    joiners: [], stats: { inf: stats("infantry"), lanc: stats("lancer"), mark: stats("marksman") },
  };
}
function request(): SimulateRequestPayload {
  return { attacker: side(fixture.request.input.attacker), defender: side(fixture.request.input.defender),
    replicates: 500, rally_mode: false, mechanicsVersion: "mk2",
    timestamp: fixture.request.timestamp, timestampSource: fixture.request.timestampSource, reportedSeed: fixture.reportedSeed };
}

test("dashboard workers, aggregates, saved runs and traces preserve one recorded replay", async () => {
  const payload = request();
  let tasksSeen = 0;
  const result = await runSimulation(payload, { runBatches: async (p, tasks) => {
    tasksSeen += tasks.length;
    return JSON.parse(JSON.stringify(runSimulationBatchDirect(p, tasks)));
  } });
  assert.equal(tasksSeen, 1);
  assert.equal(result.replicates, 1);
  assert.equal(result.summary.mean, 1848);
  assert.equal(result.execution?.historicalSeedMatched, true);
  assert.equal(result.execution?.timestampStatus, "derived-from-reported-seed");
  assert.equal(result.outcome_runs?.[0].seed, String(fixture.reportedSeed));
  const trace = runSimulationTrace(payload, "unrelated-dashboard-seed");
  assert.equal(trace.outcome, result.summary.mean);
  assert.equal(trace.execution?.seed, String(fixture.reportedSeed));
  const saved: SavedSimulationRunResponse = { version: 1, id: "replay", kind: "simulate", created_at: "2026-09-12", share_url: "/simulate?run=replay", request: payload, result };
  const restored = savedRunToFormState(JSON.parse(JSON.stringify(saved)));
  assert.equal(restored.mechanicsVersion, "mk2");
  assert.equal(restored.timestampSource, "derived-report-seed-minus-one");
  assert.equal(restored.reportedSeed, String(fixture.reportedSeed));
  assert.equal(restored.result?.execution?.historicalSeedMatched, true);
});

test("old saved runs stay legacy, timestamp-only runs stay unverified, and conflicting timestamps fail", async () => {
  const payload = request();
  delete payload.timestamp; delete payload.timestampSource; delete payload.reportedSeed; delete payload.mechanicsVersion;
  payload.replicates = 5;
  const result = await runSimulation(payload);
  assert.equal(result.replicates, 5);
  assert.equal(result.execution?.mechanicsVersion, "legacy");
  const saved = savedRunToFormState({ version: 1, id: "old", kind: "simulate", created_at: "2026-09-12", share_url: "/simulate?run=old", request: payload, result });
  assert.equal(saved.mechanicsVersion, "legacy");
  assert.equal(saved.timestamp, "");
  const unverified = request(); delete unverified.reportedSeed;
  const replay = await runSimulation(unverified);
  assert.equal(replay.execution?.historicalSeedMatched, false);
  assert.match(executionLabel(replay.execution), /unverified/);
  await assert.rejects(runSimulation({ ...request(), timestamp: "123" }), /does not match/);
});


test("saved replay inputs without an explicit version restore the automatically selected Mk2 model", () => {
  const payload = request();
  delete payload.mechanicsVersion;
  const restored = savedRunToFormState({ version: 1, id: "auto", kind: "simulate", created_at: "2026-09-12", share_url: "/simulate?run=auto", request: payload, result: {} as any });
  assert.equal(restored.mechanicsVersion, "mk2");
});
