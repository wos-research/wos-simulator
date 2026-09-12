/** Browser-safe Mk2 entry point. Legacy prepareBattle/runPrepared defaults stay unchanged. */
import {prepareBattle, runPrepared} from '../simulator';
import type {BattleInput, BattleResult, SimulatorConfig} from '../types';
import {createBattleRng, type Mk2RngMetadata} from './battle_rng';
import {resolveSeed, type SeedOptions, type SeedMetadata} from './seed';
import {createMk2Config, normalizeMechanics, type Mk2Mechanics} from './mechanics';
import {orderCrystalShield, crystalShieldExtraHits} from './crystal_shield';
import {volleyAfterDeath} from './volley_persistence';
import {gunpowderTiming} from './gunpowder_timing';

export type {Mk2Mechanics} from './mechanics';
export type {Mk2RngMetadata, Mk2RandomEvent} from './battle_rng';
export const MK2_VERSION = 'expedition-mk2-lua54-gunpowder-timing-8';
export interface Mk2ReplayOptions extends SeedOptions {
  trace?: boolean;
  mechanics?: Mk2Mechanics;
}
export interface Mk2ReplayMetadata extends SeedMetadata {
  mode: 'mk2';
  version: string;
  mechanics: Required<Mk2Mechanics>;
}
export interface Mk2ReplayResult extends BattleResult {
  rng: Mk2RngMetadata;
  replayMetadata: Mk2ReplayMetadata;
  warnings: string[];
}

export function replayMk2(input: BattleInput, config: SimulatorConfig, options: Mk2ReplayOptions = {}): Mk2ReplayResult {
  if (!options || typeof options !== 'object' || Array.isArray(options)) throw new Error('Mk2 options must be an object');
  if (options.trace !== undefined && typeof options.trace !== 'boolean') throw new Error('Mk2 trace must be a boolean');
  const seed = resolveSeed(options), mechanics = normalizeMechanics(options.mechanics);
  const effectiveConfig = createMk2Config(config, mechanics), warnings = [...seed.warnings];
  if (input.maxRounds !== undefined && (!Number.isInteger(input.maxRounds) || input.maxRounds < 1 || input.maxRounds > 10000))
    throw new Error('Invalid Mk2 maxRounds');
  for (const side of ['attacker', 'defender'] as const) {
    const fighter = input[side];
    if (!fighter?.troops) throw new Error(`${side}: missing troops`);
    let count = 0;
    for (const [id, value] of Object.entries(fighter.troops)) {
      if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${side}: invalid troop count ${id}`);
      if (!value) continue;
      const troop = effectiveConfig.troopStats[id];
      if (!troop) throw new Error(`${side}: unsupported troop ${id}`);
      if (troop.tier > 10) warnings.push(`${side}: T${troop.tier} uses the existing supplied catalogue; Mk2 has not validated this troop profile.`);
      count += value;
    }
    if (!Number.isSafeInteger(count) || count === 0) throw new Error(`${side}: empty or out-of-range army`);
  }
  const compiled = prepareBattle(input, effectiveConfig);
  for (const side of ['attacker', 'defender'] as const) {
    const fighter = compiled.fighters[side];
    if (fighter.diagnostics.length) throw new Error(fighter.diagnostics.join('; '));
    if (fighter.heroes.length) warnings.push(`${side}: Mk2 hero interactions have not been validated; existing supplied hero definitions are unchanged.`);
    const stacks = Object.entries(input[side].troops).filter(([, count]) => count > 0);
    const types = stacks.map(([id]) => effectiveConfig.troopStats[id].type);
    if (new Set(types).size < types.length)
      warnings.push(`${side}: mixed tier/FC stacks use the existing weighted-average stats and maximum skill eligibility; this profile is not validated.`);
  }
  orderCrystalShield(compiled, mechanics);
  const timing = gunpowderTiming(compiled, mechanics);
  warnings.push(...timing.warnings);
  const stream = createBattleRng(seed.metadata.effectiveSeed, options.trace);
  const result = runPrepared(compiled, undefined, {mode: options.trace ? 'trace' : 'standard', rng: stream.rng,
    beforeExtraAttack: crystalShieldExtraHits(mechanics), attackScheduling: mechanics.attackScheduling,
    onEmptyUnit: volleyAfterDeath(compiled, mechanics.volleyAfterDeath), deferAttackSkill: timing.deferAttackSkill});
  const total = (side: 'attacker'|'defender') => Object.values(result.remaining[side]).reduce((a, b) => a + b, 0);
  if (result.winner === 'draw' && total('attacker') > 0 && total('defender') > 0)
    throw new Error(`Unresolved round cap with both sides alive after ${result.rounds} rounds`);
  return {...result, rng: stream.metadata(), replayMetadata: {mode: 'mk2', version: MK2_VERSION,
    ...seed.metadata, mechanics}, warnings};
}
