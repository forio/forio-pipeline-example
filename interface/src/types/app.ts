export type AppliedReturn<T> = T extends (...args: any[]) => infer R
  ? AppliedReturn<R>
  : T;

export type AppliedAwaited<T> =
  T extends Promise<infer R>
    ? AppliedAwaited<R>
    : T extends (...args: any[]) => infer R
      ? AppliedAwaited<R>
      : T;
