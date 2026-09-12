/** Independent Shield protection for the explicitly enabled troop extra hits. */
import type {CompiledBattle} from '../prepare';
import {damageJobShapeSlot} from '../effectIndex';
import {triggerAttackSkills, type BeforeExtraAttack} from '../runtime';

export type ShieldInteractionMode = 'per-hit' | 'reference';
export type ShieldInteractions = {
  gunpowderShield?: ShieldInteractionMode;
  lanceShield?: ShieldInteractionMode;
  volleyShield?: ShieldInteractionMode;
};

function enabledSkills(options: ShieldInteractions): string[] {
  return [
    ...(options.gunpowderShield === 'reference' ? [] : ['CrystalGunpowder']),
    ...(options.lanceShield === 'reference' ? [] : ['CrystalLance']),
    ...(options.volleyShield === 'reference' ? [] : ['Volley'])
  ];
}

export function orderCrystalShield(compiled: CompiledBattle, options: ShieldInteractions): void {
  const enabled = enabledSkills(options);
  if (!enabled.length) return;
  compiled.runtimeSkills = {...compiled.runtimeSkills,
    attackDeclaredByJobShape: compiled.runtimeSkills.attackDeclaredByJobShape.map(slot => {
      if (!slot) return slot;
      const ordered = [...slot];
      const before = (first: string, second: string) => {
        const a = ordered.findIndex(p => p.skill.id === first);
        const b = ordered.findIndex(p => p.skill.id === second);
        if (a >= 0 && b >= 0 && a > b)
          [ordered[a], ordered[b]] = [ordered[b], ordered[a]];
      };
      // Measured pairwise orders: Volley precedes Shield; the crystal outgoing
      // skills follow it. Unrelated skills retain their mutual order.
      for (const skill of enabled.filter(id => id !== 'Volley')) before('CrystalShield', skill);
      if (enabled.includes('Volley')) before('Volley', 'CrystalShield');
      return ordered;
    })};
}

export function crystalShieldExtraHits(options: ShieldInteractions): BeforeExtraAttack | undefined {
  const effects = new Set(enabledSkills(options).map(id => `${id}/1`));
  if (!effects.size) return undefined;
  return (job, intent, runtime, recorder) => {
    // Actual generated troop hits only: never trigger outgoing skills again,
    // or infer protection against unrelated hero hits and pending snapshots.
    if (job.kind !== 'skill' || !job.sourceEffectId || !effects.has(job.sourceEffectId)) return;
    const matching = runtime.skills.attackDeclaredByJobShape[
      damageJobShapeSlot('normal', job.dealerSide, job.dealerUnit, job.takerSide, job.takerUnit)
    ]?.filter(p => p.skill.id === 'CrystalShield');
    if (!matching?.length) return;
    triggerAttackSkills(job.round, matching, runtime, recorder, {
      ...intent, dealerSide: job.dealerSide, dealerUnit: job.dealerUnit,
      takerSide: job.takerSide, takerUnit: job.takerUnit
    }, 'extra_attack');
  };
}
