import assert from "node:assert/strict";
import { test } from "node:test";
import type { SavedSimulationRunResponse, SimulateRequestPayload } from "@/lib/simulate-run";
import { replaySettingsFromRequest, withReplaySettings } from "./replay-settings";
import { savedRunToFormState } from "./saved-run-state";

function evidence() {
  return {
    battleType: 9,
    actors: {
      attacker: {
        profiles: [{ id: 20500, star: 5, soldier_type: 2, count: 5 }],
        rawBuffs: { "10113": 18236 },
        experts: [[{ id: 7010, level: 12, skills: { "7010": 2 } }]],
      },
      defender: { profiles: [], rawBuffs: {}, experts: [] },
    },
  };
}

function request(): SimulateRequestPayload {
  const side = {
    troops: { infantry: 0, lancer: 5, marksman: 0 },
    troop_types: { infantry: "infantry_t5", lancer: "lancer_t5_fc5", marksman: "marksman_t5" },
    heroes: {
      infantry: { name: null, skills: [0, 0, 0, 0] },
      lancer: { name: null, skills: [0, 0, 0, 0] },
      marksman: { name: null, skills: [0, 0, 0, 0] },
    },
    joiners: [],
    stats: { inf: [0, 0, 0, 0], lanc: [100, 100, 100, 100], mark: [0, 0, 0, 0] },
  };
  return {
    attacker: structuredClone(side), defender: structuredClone(side),
    replicates: 20, rally_mode: false, simulation_mode: "mk2",
    mk2: { timestamp: "100000", reportedSeed: "100001", timestampSource: "test", terminalVolleyEvidence: evidence() },
  };
}

test("terminal evidence survives saved-run hydration and replay request rebuilding", () => {
  const original = request();
  const saved: SavedSimulationRunResponse = {
    version: 1, id: "saved-test", kind: "simulate", created_at: "2026-01-01T00:00:00Z",
    share_url: "/simulate?run=saved-test", request: original,
    result: {
      replicates: 1,
      summary: {
        mean: 0, std: 0, best: { value: 0, winner: "draw" }, worst: { value: 0, winner: "draw" },
        attacker_win_rate: 0.5, avg_rounds: 1, avg_skill_activations: 0, avg_skill_kills: 0,
        avg_attacker_activations: 0, avg_defender_activations: 0, avg_attacker_kills: 0, avg_defender_kills: 0,
      },
      outcomes: [], per_side_skills: { attacker: [], defender: [] },
    },
  };
  const restored = savedRunToFormState(JSON.parse(JSON.stringify(saved)));
  const rebuilt = withReplaySettings(original, restored.replaySettings);
  assert.deepEqual(rebuilt.mk2?.terminalVolleyEvidence, original.mk2?.terminalVolleyEvidence);
  assert.equal(rebuilt.mk2?.timestamp, "100000");
  assert.equal(rebuilt.mk2?.reportedSeed, "100001");
  assert.equal(rebuilt.replicates, 1);
});

test("reading replay settings deeply detaches terminal evidence from the request", () => {
  const original = request();
  const before = structuredClone(original);
  const settings = replaySettingsFromRequest(original);
  const detached = settings.terminalVolleyEvidence as ReturnType<typeof evidence>;
  detached.actors.attacker.rawBuffs["10113"]++;
  detached.actors.attacker.experts[0][0].skills["7010"]++;
  detached.actors.attacker.profiles[0].count++;
  assert.deepEqual(original, before);
});

test("rebuilding a request deeply detaches terminal evidence from saved settings", () => {
  const original = request();
  const settings = replaySettingsFromRequest(original);
  const before = structuredClone(settings);
  const rebuilt = withReplaySettings(original, settings);
  const detached = rebuilt.mk2?.terminalVolleyEvidence as ReturnType<typeof evidence>;
  detached.actors.attacker.rawBuffs["10113"]++;
  detached.actors.attacker.experts[0][0].skills["7010"]++;
  detached.actors.attacker.profiles[0].count++;
  assert.deepEqual(settings, before);
  assert.deepEqual(original.mk2?.terminalVolleyEvidence, evidence());
});

test("switching to legacy removes Mk2 evidence without mutating the original request", () => {
  const original = request();
  const before = structuredClone(original);
  const rebuilt = withReplaySettings(original, { ...replaySettingsFromRequest(original), mode: "legacy" });
  assert.equal(rebuilt.simulation_mode, "legacy");
  assert.equal(Object.hasOwn(rebuilt, "mk2"), false);
  assert.deepEqual(original, before);
});

test("missing evidence remains absent and does not inherit stale request evidence", () => {
  assert.equal(replaySettingsFromRequest().terminalVolleyEvidence, undefined);
  assert.equal(replaySettingsFromRequest(null).terminalVolleyEvidence, undefined);
  const withoutEvidence = request();
  delete withoutEvidence.mk2!.terminalVolleyEvidence;
  const settings = replaySettingsFromRequest(withoutEvidence);
  assert.equal(settings.terminalVolleyEvidence, undefined);
  const rebuilt = withReplaySettings(request(), settings);
  assert.equal(Object.hasOwn(rebuilt.mk2!, "terminalVolleyEvidence"), false);
});
