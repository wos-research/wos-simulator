/** Exact saved-observation audit. It never searches seeds or alters combat inputs.
 * Usage: node --import <tsx-loader> rng_audit.ts INPUTS.json OUTPUT.json
 * Options: --classify-only; --max-sources N (default 2); --channels PROFILE.
 */
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import * as backend from './backend';
import {compiledTriggerForSkill} from './upstream/src/effects';
import type {BattleResult, ResolvedSkill, SideId, UnitType} from './upstream/src/types';

const SIDES: SideId[] = ['attacker', 'defender'];
const UNITS: UnitType[] = ['infantry', 'lancer', 'marksman'];
const TROOP_REPORT_IDS: Record<string, string> = {
  MasterBrawler:'90001', BandsOfSteel:'90002', Charge:'90003', Ambusher:'90004',
  RangedStrike:'90005', Volley:'90006', CrystalShield:'90007', CrystalLance:'90008',
  CrystalGunpowder:'90009', BodyOfLight:'90010', IncandescentField:'90012', FlameCharge:'90013'
};
type Observed = {
  winner?: string | null;
  totals?: Partial<Record<SideId, number>>;
  remaining?: Partial<Record<SideId, Partial<Record<UnitType, number>>>>;
  skillProcs?: Partial<Record<SideId, Record<string, number>>>;
};
export type AuditCase = {
  id: string; cohort: string; testcaseId?: string; request: backend.Request;
  timestamp?: {provided: boolean; reportedSeedProvided?: boolean; source?: string; value?: string | number};
  observed: Observed; source?: unknown; evidence?: unknown;
};

function reportId(skill: ResolvedSkill, compiled: ReturnType<typeof backend.prepare>): string | undefined {
  if (/^\d+$/.test(skill.id)) return skill.id;
  if (skill.sourceKind === 'troop_skill') return TROOP_REPORT_IDS[skill.id];
  const name = skill.heroName;
  if (!name) return undefined;
  const hero = Object.entries(backend.extension.heroNames).find(([, value]) =>
    value === name || name === 'Ling' && value === 'Ling Xue' || name === 'Lumak' && value === 'Lumak Bokan');
  const definition = compiled.config.heroDefinitions[name];
  if (!hero || !definition) return undefined;
  const index = Object.keys(definition.skills).indexOf(skill.id);
  const id = backend.extension.heroSkillOrder[hero[0]]?.[index];
  return id === undefined ? undefined : String(id);
}

/** Count instances, retaining two sides and duplicate main/joiner skills. */
export function classify(request: backend.Request) {
  const compiled = backend.prepare(request);
  const sources = SIDES.flatMap(side => {
    const fighter = compiled.fighters[side];
    return [...(fighter.heroSkills ?? []), ...fighter.troopSkills]
      .filter(skill => skill.trigger.type !== 'pre_battle')
      .filter(skill => {const p=compiledTriggerForSkill(skill).probabilityPct; return p > 0 && p < 100;})
      .map((skill, index) => ({
        instance: `${side}:${skill.heroInstanceId ?? skill.troopType ?? 'unknown'}:${skill.id}:${index}`,
        side, skillId: skill.id, reportSkillId: reportId(skill, compiled),
        hero: skill.heroName, heroInstance: skill.heroInstanceId, role: skill.heroRole,
        troopType: skill.troopType, chancePercent: compiledTriggerForSkill(skill).probabilityPct,
        trigger: skill.trigger,
      }));
  });
  const declared = compiled.runtimeSkills.randomness.chanceSkillIds;
  if (sources.length !== declared.attacker.length + declared.defender.length)
    throw new Error('Resolved RNG instance count disagrees with runtime');
  return {sourceCount: sources.length, sources, warnings: compiled.v2Warnings};
}

export function compare(observed: Observed, result: Pick<BattleResult, 'winner'|'remaining'|'skillReport'>,
                        sources: ReturnType<typeof classify>['sources']) {
  const totals = Object.fromEntries(SIDES.map(side => [side, UNITS.reduce((n, u) => n + result.remaining[side][u], 0)]));
  const differences: Array<{field: string; expected: unknown; actual: unknown}> = [];
  let survivorChecks = 0;
  if (observed.remaining) {
    for (const side of SIDES) for (const unit of UNITS) {
      const expected = observed.remaining[side]?.[unit];
      if (expected === undefined) continue;
      survivorChecks++;
      if (expected !== result.remaining[side][unit]) differences.push({field:`remaining.${side}.${unit}`, expected, actual:result.remaining[side][unit]});
    }
  } else if (observed.totals) {
    for (const side of SIDES) {
      const expected = observed.totals[side];
      if (expected === undefined) continue;
      survivorChecks++;
      if (expected !== totals[side]) differences.push({field:`totals.${side}`, expected, actual:totals[side]});
    }
  }
  const winnerChecked = observed.winner !== null && observed.winner !== undefined;
  if (winnerChecked && observed.winner !== result.winner)
    differences.push({field:'winner', expected:observed.winner, actual:result.winner});
  const outcomeExact = survivorChecks > 0 && !differences.length;
  const procChecks = [];
  const checked = new Set<string>();
  for (const source of sources) {
    const reportSkillId = source.reportSkillId;
    if (!reportSkillId) continue;
    const key = `${source.side}:${reportSkillId}`;
    if (checked.has(key)) continue;
    checked.add(key);
    const expected = observed.skillProcs?.[source.side]?.[reportSkillId];
    if (expected === undefined) continue; // Absent report entries are unknown, not zero.
    const skillIds = new Set(sources.filter(s=>s.side===source.side && s.reportSkillId===reportSkillId).map(s=>s.skillId));
    const actual = result.skillReport[source.side].filter(s=>skillIds.has(s.skillId)).reduce((n,s)=>n+s.skillActivations,0);
    procChecks.push({side:source.side, reportSkillId, expected, actual, exact:expected===actual});
    if (expected !== actual) differences.push({field:`skillProcs.${key}`, expected, actual});
  }
  return {exact:outcomeExact && !differences.length, outcomeExact, winnerChecked, survivorChecks,
    procChecks, differences, actual:{winner:result.winner, remaining:result.remaining, totals}};
}

export function audit(cases: AuditCase[], options: {classifyOnly?:boolean; maxSources?:number; channels?:string} = {}) {
  const cache = new Map<string, any>();
  const classifications = new Map<string, ReturnType<typeof classify>>();
  const rows = cases.map(row => {
    const request = structuredClone(row.request);
    if (options.channels) request.mechanics = {...request.mechanics, channels: options.channels as any};
    const key = JSON.stringify({...request, id:undefined});
    const record: any = {id:row.id, cohort:row.cohort, testcaseId:row.testcaseId, source:row.source,
      timestamp:row.timestamp ?? {provided:request.timestamp !== undefined && !['default','default_zero','missing-default'].includes(request.timestampSource ?? ''),
        value:request.timestamp ?? '000000', source:request.timestampSource ?? 'missing-default'}, observed:row.observed};
    try {
      if (!classifications.has(key)) classifications.set(key,classify(request));
      Object.assign(record,classifications.get(key));
      const missingTimestamp = !record.timestamp.provided;
      record.timestampQualified = !missingTimestamp;
      record.reportedSeedProvided = Boolean(record.timestamp.reportedSeedProvided);
      record.validationEligible = record.sourceCount === 0 || !missingTimestamp || record.reportedSeedProvided;
      record.limitation = record.reportedSeedProvided
        ? 'Diagnostic uses the reported seed via timestamp=seed-1; this is not an independently recovered timestamp.'
        : missingTimestamp && record.sourceCount > 0
        ? 'Missing battle timestamp: fixed default replay cannot validate the historical RNG stream.' : undefined;
      if (options.classifyOnly || record.sourceCount > (options.maxSources ?? 2)) {
        record.status = 'classified';
        return record;
      }
      if (!cache.has(key)) {
        const replay = (backend as any).replay;
        if (typeof replay !== 'function') throw new Error('backend.replay is not available');
        const value = replay(request, true);
        const {events = [], ...metadata} = value.rng;
        cache.set(key, {winner:value.winner, remaining:value.remaining, skillReport:value.skillReport,
          rounds:value.rounds, rng:{...metadata, events:events.slice(0,200), omittedEvents:Math.max(0,events.length-200)}});
      }
      const result = cache.get(key);
      record.status = 'replayed';
      record.comparison = compare(row.observed,result,record.sources);
      record.rounds = result.rounds;
      const {events = [], ...rng} = result.rng;
      record.rng = {...rng, events:events.slice(0,200), omittedEvents:result.rng.omittedEvents ?? Math.max(0,events.length-200)};
      record.validatedExact = record.validationEligible && record.comparison.exact;
    } catch (error) {
      record.status = 'error'; record.error = String(error);
    }
    return record;
  });
  const summary: Record<string, any> = {};
  for (const row of rows) {
    const key = `${row.cohort}:${row.sourceCount ?? 'error'}`;
    const group = summary[key] ??= {observations:0,testcases:new Set(),timestampProvided:0,reportedSeedProvided:0,replayed:0,
      exactOutcomes:0,exactIncludingKnownProcs:0,validatedExact:0,procComparable:0,errors:0};
    group.observations++;
    group.testcases.add(JSON.stringify([row.source,row.testcaseId]).replace(/,"observation":\d+/g,''));
    group.timestampProvided += Number(Boolean(row.timestampQualified));
    group.reportedSeedProvided += Number(Boolean(row.reportedSeedProvided));
    group.replayed += Number(row.status==='replayed');
    group.exactOutcomes += Number(Boolean(row.comparison?.outcomeExact));
    group.exactIncludingKnownProcs += Number(Boolean(row.comparison?.exact));
    group.validatedExact += Number(Boolean(row.validatedExact));
    group.procComparable += Number(Boolean(row.comparison?.procChecks.length));
    group.errors += Number(row.status==='error');
  }
  for (const group of Object.values(summary)) group.testcases = group.testcases.size;
  return {policy:'Exact integer survivors and winner; known chance-skill proc counts also compared. No seed search. Timestamp-free stochastic matches are coincidences, not validation.',
    channels:options.channels ?? 'input/default', maxSources:options.maxSources ?? 2,
    summary,uniqueReplays:cache.size,rows};
}

function main() {
  const args = process.argv.slice(2);
  const input = args[0], output = args[1];
  if (!input || !output) throw new Error('Usage: rng_audit.ts INPUTS.json OUTPUT.json [--classify-only] [--max-sources N] [--channels PROFILE]');
  const option = (name:string) => {const i=args.indexOf(name); return i<0?undefined:args[i+1];};
  const maxSources = Number(option('--max-sources') ?? 2);
  if (!Number.isInteger(maxSources) || maxSources<0) throw new Error('--max-sources must be a nonnegative integer');
  const result = audit(JSON.parse(readFileSync(input,'utf8').replace(/^\uFEFF/,'')),
    {classifyOnly:args.includes('--classify-only'),maxSources,channels:option('--channels')});
  writeFileSync(output,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({output,summary:result.summary,uniqueReplays:result.uniqueReplays}));
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
