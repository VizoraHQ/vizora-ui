export type Accessor<T, V> = keyof T | ((d: T) => V);

export function resolveAccessor<T, V>(accessor: Accessor<T, V>): (d: T) => V {
  if (typeof accessor === "function") return accessor;
  return (d: T) => d[accessor] as unknown as V;
}
