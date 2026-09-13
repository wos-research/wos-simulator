import type { BattleInput, SimulationOptions } from "./types";
import { createBattleRng } from "./mk2/battle_rng";
import { normalizeTimestamp } from "./mk2/timestamp";

export type MechanicsVersion = "legacy" | "mk2";
export interface BattleExecution {
  mechanicsVersion: MechanicsVersion;
  mode: "simulation" | "replay";
  rngAlgorithm: "legacy-lcg" | "lua54-xoshiro256**" | "custom";
  seed: string;
  timestamp?: string;
  timestampSource?: string;
  reportedSeed?: string;
  timestampStatus: "missing" | "unverified" | "matches-reported-seed" | "derived-from-reported-seed" | "not-used";
  historicalSeedMatched: boolean;
  warnings: string[];
}

const missingSources = new Set(["default", "default_zero", "missing-default"]);
export function replayTimestamp(input: Pick<BattleInput, "timestamp" | "timestampSource">): string | undefined {
  if (input.timestamp === undefined) return undefined;
  const value = normalizeTimestamp(input.timestamp);
  if (BigInt(value) === 0n && missingSources.has(input.timestampSource ?? "")) return undefined;
  return BigInt(value).toString();
}

function normalizeReportedSeed(value: unknown): string {
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("reportedSeed must be a safe integer or decimal string");
    value = String(value);
  }
  if (typeof value !== "string" || !/^\d+$/.test(value) || BigInt(value) < 1n || BigInt(value) > 9223372036854775807n)
    throw new Error("reportedSeed must be a positive signed 64-bit integer");
  return BigInt(value).toString();
}

export function mechanicsVersionFor(input: Pick<BattleInput, "mechanicsVersion" | "timestamp" | "timestampSource" | "reportedSeed">): MechanicsVersion {
  if (input.mechanicsVersion !== undefined && input.mechanicsVersion !== "legacy" && input.mechanicsVersion !== "mk2")
    throw new Error("Unknown mechanicsVersion; expected legacy or mk2");
  if (input.timestampSource !== undefined && (typeof input.timestampSource !== "string" || !input.timestampSource.trim()))
    throw new Error("timestampSource must be a nonempty string");
  const timestamp = replayTimestamp(input);
  const reportedSeed = input.reportedSeed === undefined ? undefined : normalizeReportedSeed(input.reportedSeed);
  if (timestamp !== undefined && reportedSeed !== undefined && BigInt(timestamp) + 1n !== BigInt(reportedSeed))
    throw new Error("Battle timestamp + 1 does not match the recorded report seed");
  return input.mechanicsVersion ?? (timestamp !== undefined || reportedSeed !== undefined ? "mk2" : "legacy");
}

export function isReplayInput(input: BattleInput): boolean {
  return mechanicsVersionFor(input) === "mk2" && (replayTimestamp(input) !== undefined || input.reportedSeed !== undefined);
}

/** Accept old flat testcases and Mk2 {input} / {request:{input}} exports. */
export function replayFieldsFromRecord(value: unknown): Pick<BattleInput, "mechanicsVersion" | "timestamp" | "timestampSource" | "reportedSeed"> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Testcase must be an object");
  const row = value as Record<string, any>;
  const records = [row, row.request, row.request?.input, row.input, row.report].filter(x => x && typeof x === "object");
  const timestamps: { value: string; source?: string }[] = [];
  const seeds: string[] = [];
  const versions: MechanicsVersion[] = [];
  for (const record of records) {
    if (record.mechanicsVersion !== undefined) versions.push(record.mechanicsVersion);
    if (record.reportedSeed !== undefined) seeds.push(normalizeReportedSeed(record.reportedSeed));
    if (record.timestamp !== undefined) {
      const source = record.timestampSource ?? record.timestamp_source;
      const value = replayTimestamp({ timestamp: record.timestamp, timestampSource: source } as BattleInput);
      if (value !== undefined) timestamps.push({ value, source });
    }
  }
  if (new Set(timestamps.map(t => t.value)).size > 1) throw new Error("Conflicting testcase timestamps");
  if (new Set(seeds).size > 1) throw new Error("Conflicting recorded seeds");
  if (new Set(versions).size > 1) throw new Error("Conflicting mechanics versions");
  const timestamp = timestamps[0];
  // Never upgrade derived provenance merely because another wrapper repeats the same timestamp.
  const source = timestamps.some(t => t.source === "derived-report-seed-minus-one") ? "derived-report-seed-minus-one" : timestamp?.source;
  return {
    ...(versions.length ? { mechanicsVersion: versions[0] } : {}),
    ...(timestamp ? { timestamp: timestamp.value, ...(source ? { timestampSource: source } : {}) } : {}),
    ...(seeds.length ? { reportedSeed: seeds[0] } : {}),
  };
}

/** A supplied timestamp is a hypothesis until it agrees with an independently supplied seed. */
export function executionFor(input: BattleInput, seed: string | number, options: SimulationOptions = {}) {
  const mechanicsVersion = mechanicsVersionFor(input);
  const timestamp = replayTimestamp(input);
  const reportedSeed = input.reportedSeed === undefined ? undefined : normalizeReportedSeed(input.reportedSeed);
  const replay = mechanicsVersion === "mk2" && (timestamp !== undefined || reportedSeed !== undefined) && !options.rng;
  const derived = timestamp === undefined || input.timestampSource === "derived-report-seed-minus-one";
  const usedTimestamp = replay ? timestamp ?? (BigInt(reportedSeed!) - 1n).toString() : timestamp;
  const stream = replay ? createBattleRng(usedTimestamp, options.mode === "trace") : undefined;
  const execution: BattleExecution = {
    mechanicsVersion,
    mode: replay ? "replay" : "simulation",
    rngAlgorithm: options.rng ? "custom" : replay ? "lua54-xoshiro256**" : "legacy-lcg",
    seed: replay ? (BigInt(usedTimestamp!) + 1n).toString() : String(seed),
    ...(usedTimestamp !== undefined ? { timestamp: usedTimestamp } : {}),
    ...(input.timestampSource !== undefined ? { timestampSource: input.timestampSource } :
      replay && timestamp === undefined ? { timestampSource: "derived-report-seed-minus-one" } : {}),
    ...(reportedSeed !== undefined ? { reportedSeed } : {}),
    timestampStatus: !replay ? timestamp !== undefined || reportedSeed !== undefined ? "not-used" : "missing" :
      derived && reportedSeed !== undefined ? "derived-from-reported-seed" : reportedSeed !== undefined ? "matches-reported-seed" : "unverified",
    historicalSeedMatched: replay && reportedSeed !== undefined,
    warnings: [],
  };
  if (replay && derived && reportedSeed !== undefined) execution.warnings.push("Replay uses a recorded seed; the original battle timestamp is not independently verified.");
  else if (replay && reportedSeed === undefined) execution.warnings.push("Timestamp supplied without a recorded seed; historical RNG match is unverified.");
  if (!replay && execution.timestampStatus === "not-used") execution.warnings.push("Replay data was supplied but this run uses legacy mechanics or a custom RNG.");
  return { execution, rng: stream?.rng };
}

export function executionLabel(execution?: BattleExecution): string {
  if (!execution) return "Timestamp status unavailable (older result)";
  const model = execution.mechanicsVersion === "mk2" ? "Mk2" : "Legacy";
  const labels: Record<BattleExecution["timestampStatus"], string> = {
    missing: "simulation · no battle timestamp",
    unverified: "replay · timestamp unverified",
    "matches-reported-seed": "replay · timestamp matches recorded seed",
    "derived-from-reported-seed": "replay · recorded seed, timestamp derived",
    "not-used": "simulation · replay data not used",
  };
  return `${model} · ${labels[execution.timestampStatus]}`;
}
