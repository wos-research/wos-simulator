import {createScopedTerminalVolley} from './scoped_terminal_volley';
import {deriveExactScopeInput} from './semantic_scope_bridge';
import { defaultRoundCapScopeView } from './default_round_cap_scope_view';
import {exactScope as ownScope,createOwnInfantryAmbusher} from './scoped_own_infantry_ambusher';
/** Browser-safe Mk2 entry point. Legacy prepareBattle/runPrepared defaults stay unchanged. */
import {prepareBattle, runPrepared} from '../simulator';
import type {BattleInput, BattleResult, SimulatorConfig} from '../types';
import {createBattleRng, type Mk2RngMetadata} from './battle_rng';
import {resolveSeed, type SeedOptions, type SeedMetadata} from './seed';
import {createMk2Config, normalizeMechanics, type Mk2Mechanics} from './mechanics';
import {orderCrystalShield, crystalShieldExtraHits} from './crystal_shield';
import {volleyAfterDeath} from './volley_persistence';
import {gunpowderTiming} from './gunpowder_timing';
import {terminalVolleyShield} from './terminal_volley_shield';
import {createScopedE1Volley} from './scoped_e1_volley';
import {createScopedC2Volley} from './scoped_c2_volley';
import {createScopedFC4Volley} from './scoped_fc4_volley';
import {createScopedFourSourceVolley} from './scoped_four_source_volley';
import {createScopedInf5Volley} from './scoped_inf5_volley';
import {createScopedT10Ambusher} from './scoped_t10_ambusher';
import {createScopedGlobalAmbusher,normalizeScopedAmbusherMechanics} from './scoped_global_ambusher';

export type {Mk2Mechanics} from './mechanics';
export type {Mk2RngMetadata, Mk2RandomEvent} from './battle_rng';
export const MK2_VERSION = 'expedition-mk2-lua54-catalogue-20-source-fc0-5';
export interface Mk2ReplayOptions extends SeedOptions {
  trace?: boolean;
  /** Exact raw decoded context required for the private terminal Volley rule. */
  terminalVolleyEvidence?: unknown;
  e1Volley?: 'scoped' | 'reference';
  c2Volley?: 'scoped' | 'reference';
  fc4Volley?: 'scoped' | 'reference';
  fourSourceVolley?: 'scoped' | 'reference';
  inf5Volley?: 'scoped' | 'reference';
  t10Ambusher?: 'scoped' | 'reference';
  globalAmbusher?: 'scoped' | 'reference';
  ownInfantryAmbusher?: 'scoped' | 'reference';
  mechanics?: Mk2Mechanics;
}
export interface Mk2ReplayMetadata extends SeedMetadata {
  mode: 'mk2';
  version: string;
  mechanics: Required<Mk2Mechanics>;
  /** Actual stat policy; legacy rounding/correction settings apply outside this protected range. */
  statCatalogue: {policy: 'supplied-source-t1-t10-fc0-fc5'; historicalReplayCommit: string; rngScopeValidation: 'retained-for-reconstruction-not-revalidated'};
  e1Volley?: unknown;
  c2Volley?: unknown;
  fc4Volley?: unknown;
  fourSourceVolley?: unknown;
  inf5Volley?: unknown;
  t10Ambusher?: unknown;
  globalAmbusher?: unknown;
  ownInfantryAmbusher?: unknown;
  terminalVolley?: unknown;
  /** Present only when both armies remain alive at the unchanged engine round cap. */
  termination?: {reason: 'round-cap'; rounds: number};
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
  const bridge=deriveExactScopeInput(compiled);
  orderCrystalShield(compiled, mechanics);
  const timing = gunpowderTiming(compiled, mechanics);
  warnings.push(...timing.warnings);
  const terminal = terminalVolleyShield(compiled, mechanics);
  warnings.push(...terminal.warnings);
  const stream = createBattleRng(seed.metadata.effectiveSeed, options.trace);
  const scopeCompiled=bridge.accepted ? {...compiled,input:bridge.input} : defaultRoundCapScopeView(compiled);
  const e1=createScopedE1Volley(scopeCompiled,stream,mechanics,options.e1Volley);
  const c2=createScopedC2Volley(scopeCompiled,stream,mechanics,options.c2Volley);
  const fc4=createScopedFC4Volley(scopeCompiled,stream,mechanics,options.fc4Volley);
  const av=createScopedFourSourceVolley(scopeCompiled,stream,mechanics,options.fourSourceVolley);
  const inf5=createScopedInf5Volley(scopeCompiled,stream,mechanics,options.inf5Volley);
  const ambusherFallback=volleyAfterDeath(compiled,mechanics.volleyAfterDeath);
  const t10=createScopedT10Ambusher(scopeCompiled,stream,mechanics,options.t10Ambusher,ambusherFallback);
  const globalAmb=createScopedGlobalAmbusher(scopeCompiled,stream,mechanics,options.globalAmbusher,ambusherFallback);
  if(options.ownInfantryAmbusher!==undefined&&!['scoped','reference'].includes(options.ownInfantryAmbusher))throw new Error('Unknown own-Infantry Ambusher policy');
  const own=options.ownInfantryAmbusher!=='reference'&&ownScope(scopeCompiled,mechanics)?createOwnInfantryAmbusher(scopeCompiled,stream,mechanics,'cached-round-start'):null;
  const terminalV=createScopedTerminalVolley(scopeCompiled,stream,mechanics,options.terminalVolleyEvidence,ambusherFallback);
  if([e1,c2,fc4,av,inf5,t10,globalAmb,own,terminalV].filter(Boolean).length>1)throw new Error('Scoped ordering guards must be disjoint');
  const result = runPrepared(compiled, undefined, {onRoundStart:own?.onRoundStart,onBattleEnd:terminalV?.onBattleEnd,mode: options.trace ? 'trace' : 'standard', rng: terminalV?.rng ?? own?.rng ?? t10?.rng ?? globalAmb?.rng ?? av?.rng ?? inf5?.rng ?? fc4?.rng ?? c2?.rng ?? e1?.rng ?? stream.rng,
    beforeExhaustedExtraAttack: terminal.beforeExhaustedExtraAttack,
    beforeExtraAttack: crystalShieldExtraHits(mechanics), attackScheduling: mechanics.attackScheduling,
    onEmptyUnit: terminalV?.onEmptyUnit ?? t10?.onEmptyUnit ?? globalAmb?.onEmptyUnit ?? av?.onEmptyUnit ?? inf5?.onEmptyUnit ?? fc4?.onEmptyUnit ?? c2?.onEmptyUnit ?? e1?.onEmptyUnit ?? volleyAfterDeath(compiled, mechanics.volleyAfterDeath), deferAttackSkill: inf5?.deferAttackSkill ?? fc4?.deferAttackSkill ?? c2?.deferAttackSkill ?? timing.deferAttackSkill});
  const terminalVMetadata=terminalV?.finish();
  const e1Metadata=e1?.finish(result);
  const c2Metadata=c2?.finish(result);
  const fc4Metadata=fc4?.finish(result);
  const avMetadata=av?.finish(result);
  const inf5Metadata=inf5?.finish(result);
  const t10Metadata=t10?.finish(result);
  const globalAmbMetadata=globalAmb?.finish(result);
  const ownMetadata=own?.finish(result);
  const total = (side: 'attacker'|'defender') => Object.values(result.remaining[side]).reduce((a, b) => a + b, 0);
  const termination = result.winner === 'draw' && total('attacker') > 0 && total('defender') > 0
    ? {reason: 'round-cap' as const, rounds: result.rounds} : undefined;
  return {...result, rng: stream.metadata(), replayMetadata: {mode: 'mk2', version: MK2_VERSION,
    ...seed.metadata, mechanics,statCatalogue:{policy:'supplied-source-t1-t10-fc0-fc5',historicalReplayCommit:'755bd728167a29e54d247ed3733363e3e1a6be11',rngScopeValidation:'retained-for-reconstruction-not-revalidated'},...(terminalVMetadata?{terminalVolley:terminalVMetadata}:{}),...(termination?{termination}:{}),...(e1Metadata?{e1Volley:e1Metadata}:{}),...(c2Metadata?{c2Volley:c2Metadata}:{}),...(fc4Metadata?{fc4Volley:fc4Metadata}:{}),...(avMetadata?{fourSourceVolley:avMetadata}:{}),...(inf5Metadata?{inf5Volley:inf5Metadata}:{}),...(t10Metadata?{t10Ambusher:t10Metadata}:{}),...(globalAmbMetadata?{globalAmbusher:globalAmbMetadata}:{}),...(ownMetadata?{ownInfantryAmbusher:ownMetadata}:{})}, warnings:inf5?inf5.adjustWarnings(warnings):fc4?fc4.adjustWarnings(warnings):c2?c2.adjustWarnings(warnings):warnings};
}
