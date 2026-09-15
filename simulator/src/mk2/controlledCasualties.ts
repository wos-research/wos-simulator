/** Optional settlement projection for the validated controlled context; never changes combat or RNG. */
export const TROOP_TYPES = ['infantry', 'lancer', 'marksman'] as const;
export const SIDES = ['attacker', 'defender'] as const;
export type TroopType = typeof TROOP_TYPES[number];
export type Side = typeof SIDES[number];
export type Counts = Record<Side, Record<TroopType, number>>;
export interface ConfirmedContext {
  battletype: 9;
  controlledOccupiedTile: true;
  heroFree: true;
  oneFormationPerSideConfirmed: true;
  noHospitalOverflowConfirmed: Record<Side, true>;
  positiveProfilesPerType: Counts;
}
export interface CasualtyCategories {dead: number; wounded: number; minorWounded: number;}
export interface Projection {
  status: 'validated-controlled-context';
  scope: 'controlled-occupied-tile-no-death-one-profile-per-type';
  categories: Record<Side, Record<TroopType, CasualtyCategories>>;
}
function object(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}
function keys(value: Record<string, unknown>, wanted: readonly string[], label: string): void {
  if (Object.keys(value).length !== wanted.length || wanted.some(key => !Object.hasOwn(value, key))) throw new Error(`${label} has missing or unsupported keys`);
}
function integer(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error(`${label} must be a nonnegative safe integer`);
}
function counts(value: unknown, label: string): Counts {
  const root = object(value, label); keys(root, SIDES, label);
  for (const side of SIDES) {
    const units = object(root[side], `${label}.${side}`); keys(units, TROOP_TYPES, `${label}.${side}`);
    for (const troop of TROOP_TYPES) integer(units[troop], `${label}.${side}.${troop}`);
  }
  return value as Counts;
}
/** Confirmations are caller assertions, not inferred from outcomes. This scope does not certify all battle-type-9 settlements. */
export function projectControlledCasualties(context: ConfirmedContext, initial: Counts, remaining: Counts): Projection {
  const ctx = object(context, 'context');
  keys(ctx, ['battletype', 'controlledOccupiedTile', 'heroFree', 'oneFormationPerSideConfirmed', 'noHospitalOverflowConfirmed', 'positiveProfilesPerType'], 'context');
  if (ctx.battletype !== 9 || ctx.controlledOccupiedTile !== true || ctx.heroFree !== true || ctx.oneFormationPerSideConfirmed !== true) throw new Error('Unsupported or unconfirmed battle context');
  const noOverflow = object(ctx.noHospitalOverflowConfirmed, 'noHospitalOverflowConfirmed');
  keys(noOverflow, SIDES, 'noHospitalOverflowConfirmed');
  if (SIDES.some(side => noOverflow[side] !== true)) throw new Error('Hospital overflow absence must be explicitly confirmed for both sides');
  const starts = counts(initial, 'initial'), survivors = counts(remaining, 'remaining');
  const profiles = counts(ctx.positiveProfilesPerType, 'positiveProfilesPerType');
  const categories = {} as Projection['categories'];
  for (const side of SIDES) {
    categories[side] = {} as Record<TroopType, CasualtyCategories>;
    for (const troop of TROOP_TYPES) {
      const start = starts[side][troop], left = survivors[side][troop];
      if (left > start) throw new Error(`remaining.${side}.${troop} exceeds initial`);
      if (profiles[side][troop] !== (start > 0 ? 1 : 0)) throw new Error(`Unsupported or inconsistent profile count for ${side}.${troop}`);
      const losses = start - left;
      // BigInt avoids overflow and floating-point ceil errors even at MAX_SAFE_INTEGER.
      const wounded = Number((7n * BigInt(losses) + 19n) / 20n);
      categories[side][troop] = {dead: 0, wounded, minorWounded: losses - wounded};
    }
  }
  return {status: 'validated-controlled-context', scope: 'controlled-occupied-tile-no-death-one-profile-per-type', categories};
}
