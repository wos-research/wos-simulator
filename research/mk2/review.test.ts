import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {replay, makeConfig} from './backend';
import {classify, compare} from './rng_audit';
import {Lua54Random} from './lua54_rng';
import {prepareBattle, runPrepared} from './upstream/src/simulator';

const read = (path: string) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const cases = read('./fixtures/controlled.json');

test('all 160 controlled report identities survive export, including repeated predictive requests', () => {
  assert.equal(cases.length, 160);
  assert.equal(new Set(cases.map((c: any) => c.id)).size, 160);
  const requests = new Set(cases.map((c: any) => JSON.stringify({...c.request, id: undefined})));
  assert.equal(requests.size, 156);
  const counts = [0, 0, 0, 0];
  for (const c of cases) {
    counts[classify(c.request).sourceCount]++;
    assert.equal(c.request.timestamp, String(c.reportedSeed - 1));
    assert.equal(c.request.timestampSource, 'derived-report-seed-minus-one');
  }
  assert.deepEqual(counts, [0, 65, 75, 20]);
});

for (const c of cases) test(`${c.id} ${c.cohort}: winner, six survivors and every recorded random-skill count`, () => {
  const before = JSON.stringify(c.request);
  const sources = classify(c.request).sources;
  const result = replay(c.request, true);
  const check = compare(c.observed, result, sources);
  assert.equal(check.exact, true, JSON.stringify(check.differences));
  assert.equal(check.winnerChecked, true);
  assert.equal(check.survivorChecks, 6);
  assert.equal(check.procChecks.length, sources.length);
  assert.equal(result.rng.seed, String(c.reportedSeed));
  assert.equal(JSON.stringify(c.request), before);
});

test('saved native Lua vectors remain exact for all 145 supplied report vectors', () => {
  let verified = 0;
  for (const c of cases) {
    const reference = c.nativeLuaReference;
    if (!reference) continue;
    const rng = new Lua54Random(BigInt(reference.seed));
    assert.deepEqual(reference.rolls.map(() => rng.random(0, 9999)), reference.rolls, c.id);
    verified++;
  }
  assert.equal(verified, 145);
});

test('the 301 original reference outcomes remain identical with reference configuration and legacy RNG', () => {
  const reference = read('./fixtures/reference.json');
  assert.equal(reference.length, 301);
  const config = makeConfig();
  for (const c of reference) {
    const result = runPrepared(prepareBattle(c.input, config), 'cross-repo-nohero-0', {mode: 'fast'});
    assert.deepEqual(result.remaining, c.expected.remaining, c.id);
    assert.equal(result.winner, c.expected.winner, c.id);
    assert.equal(result.rounds, c.expected.rounds, c.id);
  }
});

test('exported runtime bytes match the local validated snapshot and upstream hooks reverse to the pinned baseline', () => {
  const snapshot = read('./snapshot.json');
  for (const [path, expected] of Object.entries(snapshot.originalRuntimeSha256)) {
    const bytes = readFileSync(new URL('./' + path, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, path);
  }
  const manifest = read('./upstream_manifest.json');
  const hooks = read('./upstream_rng_hooks.json');
  for (const [path, expected] of Object.entries(manifest.sha256)) {
    let bytes = readFileSync(new URL('./upstream/' + path, import.meta.url));
    const patch = hooks.files[path];
    if (patch) {
      assert.equal(createHash('sha256').update(bytes).digest('hex'), patch.sha256, path);
      let text = bytes.toString('utf8').replaceAll('\r\n', '\n');
      for (const [before, after] of [...patch.replacements].reverse()) {
        assert.equal(text.split(after).length - 1, 1, path);
        text = text.replace(after, before);
      }
      bytes = Buffer.from(text.replaceAll('\n', patch.newline));
    }
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, path);
  }
});
