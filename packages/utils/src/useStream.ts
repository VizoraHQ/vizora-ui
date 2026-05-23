import { useEffect, useRef, useState } from "react";

export type StreamOptions<T> = {
  source: (push: (item: T) => void) => void | (() => void);
  windowMs?: number;
  maxItems?: number;
  getTimestamp?: (item: T) => number;
};

/**
 * Rolling-window stream hook. Pushes are batched into a single render per animation frame.
 * Old items outside `windowMs` (or beyond `maxItems`) are evicted.
 */
export function useStream<T>(options: StreamOptions<T>): T[] {
  const { source, windowMs, maxItems = 1000, getTimestamp } = options;
  const [items, setItems] = useState<T[]>([]);
  const bufferRef = useRef<T[]>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const flush = (): void => {
      frameRef.current = null;
      if (bufferRef.current.length === 0) return;
      const incoming = bufferRef.current;
      bufferRef.current = [];
      setItems((prev) => {
        let next = prev.concat(incoming);
        if (windowMs && getTimestamp) {
          const cutoff = Date.now() - windowMs;
          next = next.filter((d) => getTimestamp(d) >= cutoff);
        }
        if (next.length > maxItems) next = next.slice(next.length - maxItems);
        return next;
      });
    };

    const push = (item: T): void => {
      bufferRef.current.push(item);
      if (frameRef.current == null && typeof requestAnimationFrame !== "undefined") {
        frameRef.current = requestAnimationFrame(flush);
      }
    };

    const teardown = source(push);
    return () => {
      if (frameRef.current != null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      teardown?.();
    };
  }, [source, windowMs, maxItems, getTimestamp]);

  return items;
}
