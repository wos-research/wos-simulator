import assert from 'node:assert/strict';
import {readFileSync, writeFileSync} from 'node:fs';
import {audit} from './rng_audit';

const fixtures = JSON.parse(readFileSync(new URL('./fixtures/controlled.json', import.meta.url), 'utf8'));
const cases = fixtures.map((c: any) => ({...c, testcaseId: c.id,
  timestamp: {provided: false, reportedSeedProvided: true,
    value: c.request.timestamp, source: c.request.timestampSource}}));
const result = audit(cases, {maxSources: 3});
assert.equal(result.rows.length, 160);
assert.deepEqual(new Set(result.rows.map((r: any) => r.id)), new Set(cases.map((c: any) => c.id)));
const failures = result.rows.filter((r: any) => !r.validatedExact || !r.comparison.winnerChecked ||
  r.comparison.survivorChecks !== 6 || r.comparison.procChecks.length !== r.sourceCount);
const summary = {reports: result.rows.length, exact: result.rows.length - failures.length,
  distinctPredictiveRequests: result.uniqueReplays,
  singleSource: result.rows.filter((r: any) => r.sourceCount === 1).length,
  twoSource: result.rows.filter((r: any) => r.sourceCount === 2).length,
  threeSource: result.rows.filter((r: any) => r.sourceCount === 3).length,
  limitations: 'Recorded-seed diagnostics. Independent timestamp seeding, skill-credited wounded conversion, and untested interactions remain unresolved.'};
writeFileSync(new URL('./validation-results.json', import.meta.url), JSON.stringify({summary, ...result}, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
assert.equal(failures.length, 0, JSON.stringify(failures.map((r: any) => ({id:r.id,error:r.error,differences:r.comparison?.differences}))));
