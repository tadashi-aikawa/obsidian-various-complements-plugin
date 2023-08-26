export type PartialRequired<T, K extends keyof T> = T & {
  [P in K]-?: T[P];
};

export function isPresent<T>(arg: T | null | undefined): arg is T {
  return arg != null;
}
