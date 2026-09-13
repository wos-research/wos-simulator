/** Scoped terminal Volley/Shield observation; optional engine hook keeps legacy unchanged. */
import type {CompiledBattle} from '../prepare';
import type {BeforeExtraAttack} from '../runtime';
import {damageJobShapeSlot} from '../effectIndex';
import {crystalShieldExtraHits} from './crystal_shield';
import {gunpowderTiming} from './gunpowder_timing';

export type TerminalVolleyShield = 'roll' | 'skip';
type Options = Parameters<typeof gunpowderTiming>[1] & {terminalVolleyShield?: TerminalVolleyShield};

export function terminalVolleyShield(compiled: CompiledBattle, options: Options = {}): {
  beforeExhaustedExtraAttack?: BeforeExtraAttack; warnings: string[];
} {
  if (options.terminalVolleyShield === 'skip') return {warnings: []};
  const timing = gunpowderTiming(compiled, options);
  const protect = crystalShieldExtraHits(options);
  const eligible = new Set<string>();
  for (const side of ['attacker', 'defender'] as const) {
    const other = side === 'attacker' ? 'defender' : 'attacker';
    const shield = compiled.fighters[other].troopSkills.find(s => s.id === 'CrystalShield');
    const effect = shield?.effects[0];
    const slot = damageJobShapeSlot('normal', side, 'marksman', other, 'infantry');
    const gp = compiled.runtimeSkills.attackDeclaredByJobShape[slot]?.find(p => p.skill.id === 'CrystalGunpowder');
    // Reuse the measured pure-context deferral gate, then require the canonical Shield shape.
    if (gp && timing.deferAttackSkill && protect && shield?.sourceKind === 'troop_skill' &&
        shield.troopType === 'infantry' && shield.compiledTrigger?.probabilityPct === 37.5 &&
        shield.effects.length === 1 && effect?.id === 'CrystalShield/1' &&
        effect.type === 'active.troop.damageTaken.down' && effect.value === 36 &&
        effect.units?.applies_to === 'trigger.target' && effect.units?.applies_vs === 'trigger.source' &&
        effect.duration?.attacks?.count === 1) eligible.add(side);
  }
  if (!eligible.size) return {warnings: []};
  return {warnings: [], beforeExhaustedExtraAttack: (job, intent, runtime, recorder) => {
    if (job.kind !== 'skill' || job.sourceEffectId !== 'Volley/1' ||
        job.dealerUnit !== 'marksman' || job.takerUnit !== 'infantry' ||
        !eligible.has(job.dealerSide) || (job.roundStartTroops[job.takerSide].infantry ?? 0) <= 0) return;
    const gp = runtime.skills.attackDeclaredByJobShape[
      damageJobShapeSlot('normal', job.dealerSide, job.dealerUnit, job.takerSide, job.takerUnit)
    ]?.find(p => p.skill.id === 'CrystalGunpowder');
    if (!gp || !timing.deferAttackSkill?.(gp, intent)) return;
    protect!(job, intent, runtime, recorder);
  }};
}
