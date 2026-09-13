/**
 * Lua 5.4 math.random, with the standard 64-bit integer/double configuration.
 * Reference: https://www.lua.org/source/5.4/lmathlib.c.html
 *
 * Lua seeds xoshiro256** directly (not through SplitMix64), then discards 16
 * draws. Integer ranges use low-bit masking and rejection, not float scaling.
 *
 * Adapted from Lua, Copyright (C) 1994-2026 Lua.org, PUC-Rio.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
const MASK64 = (1n << 64n) - 1n;
const MIN_INTEGER = -(1n << 63n);
const MAX_INTEGER = (1n << 63n) - 1n;

function integer(value: number | bigint, name: string): bigint {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) {
    throw new RangeError(`${name} must be a safe integer number or a bigint`);
  }
  const result = BigInt(value);
  if (result < MIN_INTEGER || result > MAX_INTEGER) {
    throw new RangeError(`${name} must fit in a signed 64-bit Lua integer`);
  }
  return result;
}

function rotateLeft(value: bigint, bits: bigint): bigint {
  return ((value << bits) | (value >> (64n - bits))) & MASK64;
}

export class Lua54Random {
  private state: [bigint, bigint, bigint, bigint];
  /** Raw 64-bit draws, including range rejections but excluding seed warmup. */
  rawDraws = 0;

  constructor(seed: number | bigint, seed2: number | bigint = 0) {
    this.state = [integer(seed, 'seed') & MASK64, 0xffn, integer(seed2, 'seed2') & MASK64, 0n];
    for (let i = 0; i < 16; i++) this.nextUnsigned64();
    this.rawDraws = 0;
  }

  /** The next xoshiro256** output, unsigned and lossless. */
  nextUnsigned64(): bigint {
    const [s0, s1, oldS2, oldS3] = this.state;
    const s2 = oldS2 ^ s0;
    const s3 = oldS3 ^ s1;
    const result = (rotateLeft((s1 * 5n) & MASK64, 7n) * 9n) & MASK64;
    this.state = [s0 ^ s3, s1 ^ s2, (s2 ^ (s1 << 17n)) & MASK64, rotateLeft(s3, 45n)];
    this.rawDraws++;
    return result;
  }

  /** Lua math.random(0): all 64 bits, interpreted as a signed Lua integer. */
  randomInteger(): bigint {
    return BigInt.asIntN(64, this.nextUnsigned64());
  }

  random(): number;
  random(upper: number): number;
  random(lower: number, upper: number): number;
  random(lower?: number, upper?: number): number {
    // Lua advances the generator before checking range arguments.
    const draw = this.nextUnsigned64();
    if (lower === undefined && upper === undefined) {
      return Number(draw >> 11n) * 2 ** -53;
    }
    if (upper === undefined) {
      if (lower === 0) {
        throw new RangeError('Use randomInteger() for lossless Lua math.random(0)');
      }
      upper = lower;
      lower = 1;
    }
    const lo = integer(lower!, 'lower bound');
    const hi = integer(upper!, 'upper bound');
    if (lo > hi) throw new RangeError('interval is empty');
    return Number(this.project(draw, hi - lo) + lo);
  }

  private project(draw: bigint, range: bigint): bigint {
    if ((range & (range + 1n)) === 0n) return draw & range;
    let mask = range;
    for (const shift of [1n, 2n, 4n, 8n, 16n, 32n]) mask |= mask >> shift;
    let candidate = draw & mask;
    while (candidate > range) candidate = this.nextUnsigned64() & mask;
    return candidate;
  }
}
