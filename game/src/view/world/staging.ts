/**
 * Turn an allSettled fan-out into an atomic stage. If any sibling failed,
 * every fulfilled value is disposed before the original failure is rethrown.
 */
export const collectAtomicStage = <T>(
  settled: readonly PromiseSettledResult<T>[],
  dispose: (value: T) => void,
): readonly T[] => {
  const failure = settled.find(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  if (failure !== undefined) {
    for (const result of settled) {
      if (result.status === "fulfilled") dispose(result.value);
    }
    throw failure.reason;
  }
  return settled.map((result) => (result as PromiseFulfilledResult<T>).value);
};
