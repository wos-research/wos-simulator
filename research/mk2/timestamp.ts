/** Battle timestamp, in integer seconds; never inferred from a report seed. */
export type Timestamp = string | number;
export const DEFAULT_TIMESTAMP = '000000';

export function normalizeTimestamp(value: unknown = DEFAULT_TIMESTAMP): string {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error('timestamp must be a nonnegative safe integer or decimal string');
    value = String(value);
  }
  if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new Error('timestamp must be an integer or decimal string');
  if (BigInt(value) > 9223372036854775806n) throw new Error('timestamp + 1 exceeds Lua signed 64-bit integer range');
  return value;
}
