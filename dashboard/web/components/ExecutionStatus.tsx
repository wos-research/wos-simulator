import { executionLabel, type BattleExecution } from "@simulator/execution";

export default function ExecutionStatus({ execution }: { execution?: BattleExecution }) {
  const timingFallback = execution?.warnings.some(warning => warning.includes("delayed Gunpowder timing"));
  const warnings = execution?.warnings.filter(warning => !warning.includes("delayed Gunpowder timing")) ?? [];
  return (
    <section className="mb-4 rounded border p-3 text-sm" aria-label="Battle replay status">
      <p className="font-semibold">{executionLabel(execution)}</p>
      {execution?.mode === "replay" && (
        <p className="mt-1 text-xs opacity-70">
          Seed {execution.seed} · timestamp {execution.timestamp} seconds
          {execution.timestampSource ? ` · source: ${execution.timestampSource}` : ""}
          . This is one battle replay; its outcome is not a win-probability estimate.
        </p>
      )}
      {timingFallback && <p className="mt-1 text-xs opacity-70">Gunpowder uses legacy timing for this army setup; Mk2 timing has only been validated for specific troop-only battles.</p>}
      {warnings.map((warning, index) => <p className="mt-1 text-xs opacity-70" key={index}>{warning}</p>)}
    </section>
  );
}
