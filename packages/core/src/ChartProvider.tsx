import { useId, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { useResizeObserver } from "@vizora/utils";
import { ChartFrameContext } from "./contexts";

export type ChartFrame = {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
  data: unknown[];
};

export type ChartProviderProps<T> = {
  data: T[];
  width?: number | string;
  height?: number | string;
  margin?: Partial<ChartFrame["margin"]>;
  className?: string;
  /** Accessible name announced by screen readers. Renders as `<title>` inside the SVG. */
  title?: string;
  /** Longer description for screen readers. Renders as `<desc>` inside the SVG. */
  description?: string;
  children: ReactNode;
};

const DEFAULT_MARGIN = { top: 12, right: 16, bottom: 28, left: 40 };

export function ChartProvider<T>(props: ChartProviderProps<T>) {
  const { data, width, height, margin: marginIn, className, title, description, children } = props;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const observed = useResizeObserver(containerRef, { width: 0, height: 0 });
  const a11yId = useId();
  const titleId = title ? `${a11yId}-title` : undefined;
  const descId = description ? `${a11yId}-desc` : undefined;
  const labelledBy = [titleId, descId].filter(Boolean).join(" ") || undefined;

  const margin = useMemo(() => ({ ...DEFAULT_MARGIN, ...marginIn }), [marginIn]);

  const resolvedWidth = typeof width === "number" ? width : observed.width;
  const resolvedHeight = typeof height === "number" ? height : observed.height;

  const frame = useMemo(() => {
    const w = Math.max(0, resolvedWidth);
    const h = Math.max(0, resolvedHeight);
    return {
      width: w,
      height: h,
      innerWidth: Math.max(0, w - margin.left - margin.right),
      innerHeight: Math.max(0, h - margin.top - margin.bottom),
      margin,
      data,
    };
  }, [resolvedWidth, resolvedHeight, margin, data]);

  const style: React.CSSProperties = {
    width: typeof width === "string" ? width : width != null ? `${width}px` : "100%",
    height: typeof height === "string" ? height : height != null ? `${height}px` : "100%",
    position: "relative",
  };

  return (
    <div ref={containerRef} className={className} style={style} data-vz-chart="">
      {frame.width > 0 && frame.height > 0 ? (
        <ChartFrameContext.Provider value={frame}>
          <svg
            width={frame.width}
            height={frame.height}
            viewBox={`0 0 ${frame.width} ${frame.height}`}
            role="img"
            aria-labelledby={labelledBy}
            style={{ display: "block", overflow: "visible" }}
          >
            {title ? <title id={titleId}>{title}</title> : null}
            {description ? <desc id={descId}>{description}</desc> : null}
            <g transform={`translate(${margin.left}, ${margin.top})`}>{children}</g>
          </svg>
        </ChartFrameContext.Provider>
      ) : null}
    </div>
  );
}
