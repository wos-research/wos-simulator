import assert from "node:assert/strict";
import { test } from "node:test";
import { gzipSync, gunzipSync } from "node:zlib";
import type { SimulateRequestPayload, SavedSimulationRunResponse } from "@/lib/simulate-run";
import { runSimulation, runSimulationTrace, runSimulationBatchDirect } from "./simulate";
import { savedRunToFormState } from "@/lib/simulate/saved-run-state";
import { replayMetadataLabel, replaySettingsFromRequest, withReplaySettings } from "@/lib/simulate/replay-settings";

function request(): SimulateRequestPayload {
  const side: SimulateRequestPayload["attacker"] = {
    troops: { infantry: 0, lancer: 0, marksman: 500 },
    troop_types: { infantry: "infantry_t5_fc5", lancer: "lancer_t5", marksman: "marksman_t7_fc3" },
    heroes: {
      infantry: { name: null, skills: [0, 0, 0, 0] },
      lancer: { name: null, skills: [0, 0, 0, 0] },
      marksman: { name: null, skills: [0, 0, 0, 0] },
    },
    joiners: [],
    stats: { inf: [100, 100, 100, 100], lanc: [100, 100, 100, 100], mark: [100, 100, 100, 100] },
  };
  return { attacker: side, defender: { ...structuredClone(side), troops: { infantry: 1000, lancer: 0, marksman: 0 } }, replicates: 500, rally_mode: false };
}

test("Mk2 executes once, ignores legacy batch seeds, and traces the same recorded seed", async () => {
  const payload = { ...request(), simulation_mode: "mk2" as const, mk2: { reportedSeed: "123456", timestamp: "4" } };
  const progress: number[][] = [];
  const result = await runSimulation(payload, {
    seedBase: "must-not-seed-mk2",
    runBatches: async () => { throw new Error("Mk2 must not enter the replicate pool"); },
    onProgress: (done, total) => progress.push([done, total]),
  });
  assert.equal(result.replicates, 1);
  assert.equal(result.outcome_runs?.length, 1);
  assert.deepEqual(progress, [[1, 1]]);
  assert.equal(result.replayMetadata?.mode, "mk2");
  if (result.replayMetadata?.mode !== "mk2") throw new Error("Missing Mk2 metadata");
  assert.equal(result.replayMetadata.effectiveSeed, "123456");
  assert.equal(result.replayMetadata.timestampMatchesRecordedSeed, false);
  assert.match(result.warnings!.join(" "), /differs from recorded seed/);
  const trace = runSimulationTrace(payload, "legacy:999");
  assert.deepEqual(trace, result.trace);
  assert.equal(trace.seed, "123456");
  assert.ok(trace.rng?.events?.length);
  assert.throws(() => runSimulationBatchDirect(payload, [{ index: 0, seed: "legacy" }]), /one replay/);
});

test("Mk2 request, replay metadata, RNG events and trace survive saved JSON/gzip hydration", async () => {
  const payload = withReplaySettings(request(), {
    mode: "mk2", timestamp: "000004", reportedSeed: "9007199254740993", timestampSource: "capture-unverified",
    mechanics: { gunpowderTiming: "reference" },
  });
  const result = await runSimulation(payload);
  const document: SavedSimulationRunResponse = {
    version: 1, id: "mk2-save-test", kind: "simulate", created_at: "2026-09-12T00:00:00Z",
    share_url: "/simulate?run=mk2-save-test", request: payload, result,
  };
  const decoded = JSON.parse(gunzipSync(gzipSync(JSON.stringify(document))).toString()) as SavedSimulationRunResponse;
  const state = savedRunToFormState(decoded);
  assert.deepEqual(state.simulateRequest, payload);
  assert.equal(state.replaySettings.reportedSeed, "9007199254740993");
  assert.equal(state.replaySettings.timestamp, "000004");
  assert.equal(state.replaySettings.timestampSource, "capture-unverified");
  assert.deepEqual(withReplaySettings(request(), state.replaySettings), payload);
  assert.deepEqual(state.result?.replayMetadata, result.replayMetadata);
  assert.deepEqual(state.result?.trace, JSON.parse(JSON.stringify(result.trace)));
  assert.deepEqual(runSimulationTrace(state.simulateRequest!, "ignored"), result.trace);
  assert.match(state.savedRunMeta!.title, /^Mk2:/);
});

test("timestamp, fixed default and missing legacy metadata stay visibly distinct", async () => {
  const base = request();
  const timestamp = await runSimulation({ ...base, simulation_mode: "mk2", mk2: { timestamp: "123455" } });
  const fallback = await runSimulation({ ...base, simulation_mode: "mk2" });
  assert.match(replayMetadataLabel(timestamp.replayMetadata), /Unverified timestamp 123455/);
  assert.match(replayMetadataLabel(fallback.replayMetadata), /Fixed default timestamp 000000/);
  assert.equal(replayMetadataLabel(undefined), "Legacy simulation");
  assert.equal(replaySettingsFromRequest(base).mode, "legacy");
  const legacy = await runSimulation({ ...base, replicates: 2, mk2: { reportedSeed: "123456" } }, { seedBase: "legacy-check" });
  assert.deepEqual(legacy.replayMetadata, { mode: "legacy", seedSource: "legacy", seedBase: "legacy-check" });
  assert.deepEqual(legacy.outcome_runs?.map(row => row.seed), ["legacy-check:0", "legacy-check:1"]);
  assert.equal(runSimulationTrace(base, "legacy-check:1").replayMetadata?.mode, "legacy");
});
