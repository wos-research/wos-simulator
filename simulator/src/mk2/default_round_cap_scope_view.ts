/** Scope comparison only. Retains the original request and prepared numerical state.
 * The original run loop uses input.maxRounds ?? 1500. No other default is implied.
 * Validation still occurs before this helper, and nondefault caps pass through.
 */
export function defaultRoundCapScopeView<T extends {input: {maxRounds?: number}}>(compiled: T): T {
  if (compiled.input.maxRounds !== 1500) return compiled;
  const input = {...compiled.input};
  delete input.maxRounds;
  return {...compiled, input};
}
