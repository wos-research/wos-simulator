/** Compatibility entry points for the original Gunpowder-only integration. */
import type {CompiledBattle} from './upstream/src/prepare';
import {orderCrystalShield, crystalShieldExtraHits, type ShieldInteractionMode} from './crystal_shield';
export type GunpowderShieldMode = ShieldInteractionMode;
const gunpowderOnly = {gunpowderShield: 'per-hit', lanceShield: 'reference', volleyShield: 'reference'} as const;
export function orderGunpowderShield(compiled: CompiledBattle): void {
  orderCrystalShield(compiled, gunpowderOnly);
}
export const shieldGunpowderHit = crystalShieldExtraHits(gunpowderOnly)!;
