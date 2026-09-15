import type { ReplayRunMetadata } from "@/lib/simulate/replay-settings";
import { replayMetadataLabel } from "@/lib/simulate/replay-settings";

export function ReplayMetadataPanel({ metadata, warnings }: {
  metadata?: ReplayRunMetadata;
  warnings?: string[];
}) {
  return (
    <div className="mb-3 text-xs" data-testid="replay-metadata">
      <p className="font-semibold">{replayMetadataLabel(metadata)}</p>
      {metadata?.mode === "mk2" && <>
        <p className="mt-1 opacity-70">One deterministic outcome. This does not estimate a win probability.</p>
        {metadata.timestamp !== null && metadata.seedSource === "recorded-seed" && (
          <p className="mt-1 opacity-70">
            Timestamp {metadata.timestamp} (unverified)
            {metadata.timestampMatchesRecordedSeed === false ? " does not produce the recorded seed; replay uses the recorded seed." : "."}
          </p>
        )}
        <details className="mt-2 opacity-80">
          <summary className="cursor-pointer">Replay settings · {metadata.version}</summary>
          <pre className="mt-1 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(metadata, null, 2)}</pre>
        </details>
      </>}
      {!!warnings?.length && <ul className="mt-2 list-disc space-y-1 pl-4 opacity-80">
        {warnings.map((warning, index) => <li key={index}>{warning}</li>)}
      </ul>}
    </div>
  );
}
