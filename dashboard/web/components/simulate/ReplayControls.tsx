"use client";

import type { ReplaySettings } from "@/lib/simulate/replay-settings";

export function ReplayControls({ value, onChange, disabled }: {
  value: ReplaySettings;
  onChange: (value: ReplaySettings) => void;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="mb-3 flex flex-wrap items-end gap-3" data-testid="replay-controls">
      <label className="flex flex-col gap-1 text-xs">
        <span className="sim-field-label">Simulator</span>
        <select className="sim-input min-h-[38px] px-2 py-1" name="simulate.engine"
          value={value.mode} onChange={event => onChange({ ...value, mode: event.target.value as ReplaySettings["mode"] })}>
          <option value="legacy">Legacy</option>
          <option value="mk2">Expedition simulator Mk2</option>
        </select>
      </label>
      {value.mode === "mk2" && <>
        <label className="flex flex-col gap-1 text-xs">
          <span className="sim-field-label">Recorded seed (optional)</span>
          <input className="sim-input min-h-[38px] max-w-52 px-2 py-1 font-mono" name="simulate.reportedSeed"
            inputMode="numeric" value={value.reportedSeed} placeholder="From the battle report"
            onChange={event => onChange({ ...value, reportedSeed: event.target.value })} />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="sim-field-label">Timestamp (optional, unverified)</span>
          <input className="sim-input min-h-[38px] max-w-52 px-2 py-1 font-mono" name="simulate.timestamp"
            inputMode="numeric" value={value.timestamp} placeholder="000000"
            onChange={event => onChange({ ...value, timestamp: event.target.value, timestampSource: "dashboard-unverified" })} />
        </label>
        <p className="basis-full text-xs opacity-70">
          Runs one replay. A recorded seed takes priority. Otherwise Mk2 uses timestamp + 1; an empty timestamp uses 000000.
          The battle timestamp used for seeding is still unverified.
        </p>
      </>}
    </fieldset>
  );
}
