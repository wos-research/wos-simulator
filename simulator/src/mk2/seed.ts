/** Seed provenance for one replay. A matching derived timestamp is only a consistency check. */
export type IntegerInput = string | number;
export const DEFAULT_TIMESTAMP = '000000';
const MAX_INTEGER = 9223372036854775807n;
const MIN_INTEGER = -9223372036854775808n;

function integer(value: unknown, label: string, signed: boolean): string {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new Error(`${label} must be a safe integer or decimal string`);
    value = String(value);
  }
  if (typeof value !== 'string' || !(signed ? /^-?\d+$/ : /^\d+$/).test(value))
    throw new Error(`${label} must be ${signed ? 'an integer' : 'a nonnegative integer'} or decimal string`);
  const parsed = BigInt(value);
  if (parsed < (signed ? MIN_INTEGER : 0n) || parsed > (signed ? MAX_INTEGER : MAX_INTEGER - 1n))
    throw new Error(`${label}${signed ? '' : ' + 1'} exceeds the Lua signed 64-bit integer range`);
  return value;
}

export function normalizeTimestamp(value: unknown = DEFAULT_TIMESTAMP): string {
  return integer(value, 'timestamp', false);
}
export function normalizeReportedSeed(value: unknown): string {
  return BigInt(integer(value, 'reportedSeed', true)).toString();
}

export interface SeedOptions {
  timestamp?: IntegerInput;
  reportedSeed?: IntegerInput;
  timestampSource?: string;
}
export interface SeedMetadata {
  seedSource: 'recorded-seed' | 'timestamp' | 'default';
  effectiveSeed: string;
  reportedSeed: string | null;
  timestamp: string | null;
  timestampSource: string | null;
  timestampSeed: string | null;
  timestampMatchesRecordedSeed: boolean | null;
}
export function resolveSeed(options: SeedOptions = {}): {metadata: SeedMetadata; warnings: string[]} {
  if (options.timestampSource !== undefined && (typeof options.timestampSource !== 'string' || !options.timestampSource.trim()))
    throw new Error('timestampSource must be a nonempty string');
  const suppliedTimestamp = options.timestamp === undefined ? null : normalizeTimestamp(options.timestamp);
  const reportedSeed = options.reportedSeed === undefined ? null : normalizeReportedSeed(options.reportedSeed);
  const seedSource = reportedSeed !== null ? 'recorded-seed' : suppliedTimestamp !== null ? 'timestamp' : 'default';
  const timestamp = suppliedTimestamp ?? (seedSource === 'default' ? DEFAULT_TIMESTAMP : null);
  const timestampSeed = timestamp === null ? null : (BigInt(timestamp) + 1n).toString();
  const timestampMatchesRecordedSeed = suppliedTimestamp !== null && reportedSeed !== null ? timestampSeed === reportedSeed : null;
  const warnings: string[] = [];
  if (timestampMatchesRecordedSeed === false)
    warnings.push(`Timestamp seed ${timestampSeed} differs from recorded seed ${reportedSeed}; replay uses the recorded seed.`);
  if (seedSource === 'timestamp')
    warnings.push('Timestamp + 1 seeding is an unverified hypothesis without an explicit recorded seed.');
  if (seedSource === 'default')
    warnings.push('Missing timestamp and recorded seed: using timestamp 000000 and seed 1; historical replay is not established.');
  return {metadata: {
    seedSource, effectiveSeed: reportedSeed ?? timestampSeed!, reportedSeed, timestamp,
    timestampSource: options.timestampSource ?? (seedSource === 'default' ? 'missing-default' : suppliedTimestamp === null ? null : 'explicit'),
    timestampSeed, timestampMatchesRecordedSeed
  }, warnings};
}
