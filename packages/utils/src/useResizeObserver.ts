import { useEffect, useState } from "react";
import type { RefObject } from "react";

export type Size = { width: number; height: number };

export function useResizeObserver<T extends HTMLElement>(
  ref: RefObject<T | null>,
  fallback: Size = { width: 0, height: 0 },
): Size {
  const [size, setSize] = useState<Size>(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
