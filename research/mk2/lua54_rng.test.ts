import test from 'node:test';
import assert from 'node:assert/strict';
import {Lua54Random} from './lua54_rng';

// Captured from native Lua 5.4 through installed Lupa 2.8, not this module:
// math.randomseed(seed); for i=1,12 do print(math.random(0,9999)) end
// Lua source: https://www.lua.org/source/5.4/lmathlib.c.html
const rollVectors: [bigint, number[]][] = [
  [0n, [8712,6380,9303,6200,4848,5191,9977,7653,4497,8327,6383,268]],
  [1n, [3485,1511,2039,4054,4061,2792,1918,638,8778,9476,4722,507]],
  [42n, [5169,7509,5045,2623,3334,1649,5272,8727,7703,7936,125,4268]],
  [1725926401n, [4672,9536,4639,9021,816,5865,3020,9393,7260,6654,6798,9858]],
  [-1n, [817,7295,195,3191,5288,6150,8413,8446,2412,5013,827,7852]],
  [9223372036854775807n, [5177,9960,1270,6039,6103,6329,781,4524,2633,6716,5886,2328]],
];

test('Lua 5.4 Crystal Gunpowder integer rolls match native Lua for all reference seeds', () => {
  for (const [seed, expected] of rollVectors) {
    const rng = new Lua54Random(seed);
    assert.equal(rng.rawDraws, 0);
    assert.deepEqual(expected.map(() => rng.random(0,9999)), expected, `seed ${seed}`);
  }
});

test('integer rejection consumes the same raw draws as native Lua', () => {
  const rng = new Lua54Random(1);
  // Reference counts obtained by matching native random(0) following each
  // random(0,9999) sequence to a separately reseeded raw-output sequence.
  const expectedCounts = [1,2,4,6,7,8,9,11,15,16,20,21];
  const counts = expectedCounts.map(() => {rng.random(0,9999); return rng.rawDraws;});
  assert.deepEqual(counts, expectedCounts);
});

test('double draws use the same top 53 bits as native Lua', () => {
  const rng = new Lua54Random(1);
  const expected = [
    0.8155878155472306,0.9865775064345756,0.07933071959002602,
    0.498648493233687,0.5918101854789889,0.833968868649314,
    0.15454780904609333,0.26419587508692477,0.2582089950302118,
    0.7806011185716933,0.45661087142974743,0.5324398884134947,
  ];
  assert.deepEqual(expected.map(() => rng.random()), expected);
  assert.equal(rng.rawDraws, expected.length);
});

test('full signed 64-bit outputs match native math.random(0) without precision loss', () => {
  const rng = new Lua54Random(1);
  const expected = [
    -3401804370673955427n,-247601303632394777n,1463393481460428193n,
    9198441137422714871n,-7529773041964062036n,-3062733788294557738n,
    2850903880625819613n,4873553693058239208n,4763115248852060030n,
    -4047195015766118725n,8422983886538048126n,-8624961717511343907n,
  ];
  assert.deepEqual(expected.map(() => rng.randomInteger()), expected);
  const unsigned = new Lua54Random(1);
  assert.deepEqual(expected.map(() => unsigned.nextUnsigned64()), expected.map(x => BigInt.asUintN(64,x)));
});

test('power-of-two ranges, negative bounds and single-argument ranges match native Lua', () => {
  const power = new Lua54Random(1);
  const expectedPower = [29,103,33,119,44,86,93,104,-2,59,-2,93];
  assert.deepEqual(expectedPower.map(() => power.random(-128,127)), expectedPower);
  assert.equal(power.rawDraws, 12);
  const upper = new Lua54Random(1);
  const expectedUpper = [8,2,8,7,9,8,5,3,2,3,7,7];
  assert.deepEqual(expectedUpper.map(() => upper.random(10)), expectedUpper);
});

test('explicit second seed matches native Lua, with zero as its default', () => {
  const rng = new Lua54Random(42,54);
  const expected = [4890,7214,4530,6575,7024,4756,1608,8898,2191,5106,8405,9146];
  assert.deepEqual(expected.map(() => rng.random(0,9999)), expected);
  const implicit = new Lua54Random(42);
  const explicit = new Lua54Random(42,0);
  for (let i = 0; i < 100; i++) assert.equal(implicit.random(),explicit.random());
});

test('constant integer ranges still consume one raw draw', () => {
  const rng = new Lua54Random(1);
  assert.equal(rng.random(7,7), 7);
  assert.equal(rng.rawDraws, 1);
  assert.equal(rng.random(), 0.9865775064345756);
});

test('seeds and bounds reject fractional, unsafe, or out-of-range values', () => {
  for (const value of [1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]) {
    assert.throws(() => new Lua54Random(value), /safe integer/);
    assert.throws(() => new Lua54Random(1).random(0,value), /safe integer/);
  }
  assert.throws(() => new Lua54Random(1n << 63n), /signed 64-bit/);
  assert.throws(() => new Lua54Random(-(1n << 63n)-1n), /signed 64-bit/);
  const rng = new Lua54Random(1);
  assert.throws(() => rng.random(2,1), /interval is empty/);
  assert.equal(rng.rawDraws,1);
  assert.throws(() => rng.random(0), /randomInteger/);
});
