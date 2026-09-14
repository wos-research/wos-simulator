import type { Mk2ReplayOptions, Mk2ReplayResult } from "@simulator/mk2/replay";
import type { SimulateRequestPayload } from "@/lib/simulate-run";

export type ReplayRunMetadata = Mk2ReplayResult["replayMetadata"] | {
  mode: "legacy";
  seedSource: "legacy";
  seedBase?: string;
};

export interface ReplaySettings {
  mode: "legacy" | "mk2";
  timestamp: string;
  reportedSeed: string;
  timestampSource?: string;
  mechanics?: Mk2ReplayOptions["mechanics"];
  terminalVolleyEvidence?: Mk2ReplayOptions["terminalVolleyEvidence"];
}

export function replaySettingsFromRequest(request?: SimulateRequestPayload | null): ReplaySettings {
  return {
    mode: request?.simulation_mode === "mk2" ? "mk2" : "legacy",
    timestamp: request?.mk2?.timestamp === undefined ? "" : String(request.mk2.timestamp),
    reportedSeed: request?.mk2?.reportedSeed === undefined ? "" : String(request.mk2.reportedSeed),
    timestampSource: request?.mk2?.timestampSource,
    mechanics: request?.mk2?.mechanics,
    terminalVolleyEvidence: request?.mk2?.terminalVolleyEvidence === undefined ? undefined : structuredClone(request.mk2.terminalVolleyEvidence),
  };
}

export function withReplaySettings(request: SimulateRequestPayload, settings: ReplaySettings): SimulateRequestPayload {
  const base = { ...request };
  delete base.mk2;
  if (settings.mode === "legacy") return { ...base, simulation_mode: "legacy" };
  return {
    ...base,
    simulation_mode: "mk2",
    replicates: 1,
    mk2: {
      ...(settings.timestamp.trim() ? {
        timestamp: settings.timestamp.trim(),
        timestampSource: settings.timestampSource ?? "dashboard-unverified",
      } : {}),
      ...(settings.reportedSeed.trim() ? { reportedSeed: settings.reportedSeed.trim() } : {}),
      ...(settings.mechanics ? { mechanics: settings.mechanics } : {}),
      ...(settings.terminalVolleyEvidence !== undefined ? { terminalVolleyEvidence: structuredClone(settings.terminalVolleyEvidence) } : {}),
    },
  };
}

export function replayMetadataLabel(metadata?: ReplayRunMetadata): string {
  if (!metadata || metadata.mode === "legacy") return "Legacy simulation";
  if (metadata.seedSource === "recorded-seed") return `Expedition simulator Mk2 · Recorded seed ${metadata.effectiveSeed}`;
  if (metadata.seedSource === "timestamp") return `Expedition simulator Mk2 · Unverified timestamp ${metadata.timestamp} · Seed ${metadata.effectiveSeed}`;
  return `Expedition simulator Mk2 · Fixed default timestamp 000000 · Seed ${metadata.effectiveSeed}`;
}
