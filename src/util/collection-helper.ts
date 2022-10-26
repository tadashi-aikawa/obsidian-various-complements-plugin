export const groupBy = <T>(
  values: T[],
  toKey: (t: T) => string
): { [key: string]: T[] } =>
  values.reduce(
    (prev, cur, _1, _2, k = toKey(cur)) => (
      (prev[k] || (prev[k] = [])).push(cur), prev
    ),
    {} as { [key: string]: T[] }
  );

export function uniq<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export function uniqBy<T>(values: T[], fn: (x: T) => string | number): T[] {
  const m = new Map<string | number, T>();
  values.forEach((x) => {
    const k = fn(x);
    if (!m.has(k)) {
      m.set(k, x);
    }
  });
  return Array.from(m.values());
}

export function uniqWith<T>(arr: T[], fn: (one: T, other: T) => boolean) {
  return arr.filter(
    (element, index) => arr.findIndex((step) => fn(element, step)) === index
  );
}

export function arrayEquals(
  arr1: unknown[],
  arr2: unknown[],
  length?: number
): boolean {
  let l = Math.max(arr1.length, arr2.length);
  if (length !== undefined) {
    l = Math.min(l, length);
  }

  for (let i = 0; i < l; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}

export function arrayEqualsUntil(arr1: unknown[], arr2: unknown[]): number {
  let l = Math.min(arr1.length, arr2.length);
  for (let i = 0; i < l; i++) {
    if (arr1[i] !== arr2[i]) {
      return i - 1;
    }
  }

  return l - 1;
}

export function mirrorMap<T>(
  collection: T[],
  toValue: (t: T) => string
): { [key: string]: string } {
  return collection.reduce((p, c) => ({ ...p, [toValue(c)]: toValue(c) }), {});
}

export function max(collection: number[], emptyValue: number): number {
  const select = (a: number, b: number) => (a >= b ? a : b);
  return collection.reduce(select, emptyValue);
}
