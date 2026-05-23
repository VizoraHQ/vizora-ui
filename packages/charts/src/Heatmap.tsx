import { useId, useMemo, useRef, useState } from "react";
import { useResizeObserver } from "@vizora/utils";

export type HeatmapProps<T> = {
  data: T[];
  /** Categorical x-axis accessor. */
  x: (d: T) => string;
  /** Categorical y-axis accessor. */
  y: (d: T) => string;
  /** Numeric value accessor — drives cell intensity. */
  value: (d: T) => number;
  /** Optional explicit x-axis domain order (otherwise: first-seen order). */
  xDomain?: string[];
  /** Optional explicit y-axis domain order. */
  yDomain?: string[];
  width?: number | string;
  height?: number | string;
  /** Domain min for the color scale. Defaults to data min. */
  vMin?: number;
  /** Domain max for the color scale. Defaults to data max. */
  vMax?: number;
  /** CSS color used as the cell fill — opacity ramps with value. Defaults to `var(--vz-accent)`. */
  color?: string;
  /** Format the cell value in tooltips. */
  valueFormat?: (v: number) => string;
  cellRadius?: number;
  cellGap?: number;
  showTooltip?: boolean;
  className?: string;
  title?: string;
  description?: string;
};

const DEFAULT_MARGIN = { top: 12, right: 16, bottom: 28, left: 64 };

export function Heatmap<T>(props: HeatmapProps<T>) {
  const {
    data,
    x,
    y,
    value,
    xDomain: xDomainIn,
    yDomain: yDomainIn,
    width,
    height = 280,
    vMin: vMinIn,
    vMax: vMaxIn,
    color = "var(--vz-accent)",
    valueFormat = (v) => (Number.isInteger(v) ? v.toLocaleString("en") : v.toFixed(2)),
    cellRadius = 3,
    cellGap = 2,
    showTooltip = true,
    className,
    title,
    description,
  } = props;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const observed = useResizeObserver(containerRef, { width: 0, height: 0 });
  const a11yId = useId();
  const titleId = title ? `${a11yId}-title` : undefined;
  const descId = description ? `${a11yId}-desc` : undefined;
  const labelledBy = [titleId, descId].filter(Boolean).join(" ") || undefined;

  const resolvedWidth = typeof width === "number" ? width : observed.width;
  const resolvedHeight = typeof height === "number" ? height : observed.height;

  const { xDomain, yDomain, vMin, vMax, lookup } = useMemo(() => {
    const xs = xDomainIn ?? Array.from(new Set(data.map(x)));
    const ys = yDomainIn ?? Array.from(new Set(data.map(y)));
    const values = data.map(value).filter((v) => Number.isFinite(v));
    const min = vMinIn ?? (values.length ? Math.min(...values) : 0);
    const max = vMaxIn ?? (values.length ? Math.max(...values) : 1);
    const map = new Map<string, T>();
    for (const d of data) {
      map.set(`${x(d)}::${y(d)}`, d);
    }
    return { xDomain: xs, yDomain: ys, vMin: min, vMax: max, lookup: map };
  }, [data, x, y, value, xDomainIn, yDomainIn, vMinIn, vMaxIn]);

  const innerWidth = Math.max(0, resolvedWidth - DEFAULT_MARGIN.left - DEFAULT_MARGIN.right);
  const innerHeight = Math.max(0, resolvedHeight - DEFAULT_MARGIN.top - DEFAULT_MARGIN.bottom);
  const cellW =
    xDomain.length > 0 ? Math.max(0, innerWidth / xDomain.length - cellGap) : 0;
  const cellH =
    yDomain.length > 0 ? Math.max(0, innerHeight / yDomain.length - cellGap) : 0;

  const intensity = (v: number): number => {
    if (vMax === vMin) return 0.5;
    return Math.max(0.05, Math.min(1, (v - vMin) / (vMax - vMin)));
  };

  const [hover, setHover] = useState<{ xKey: string; yKey: string; datum: T } | null>(null);

  const containerStyle: React.CSSProperties = {
    width: typeof width === "string" ? width : width != null ? `${width}px` : "100%",
    height: typeof height === "string" ? height : height != null ? `${height}px` : "100%",
    position: "relative",
  };

  return (
    <div ref={containerRef} className={className} style={containerStyle} data-vz-chart="">
      {resolvedWidth > 0 && resolvedHeight > 0 ? (
        <svg
          width={resolvedWidth}
          height={resolvedHeight}
          viewBox={`0 0 ${resolvedWidth} ${resolvedHeight}`}
          role="img"
          aria-labelledby={labelledBy}
          style={{ display: "block", overflow: "visible" }}
        >
          {title ? <title id={titleId}>{title}</title> : null}
          {description ? <desc id={descId}>{description}</desc> : null}
          <g transform={`translate(${DEFAULT_MARGIN.left}, ${DEFAULT_MARGIN.top})`}>
            <g className="vz-series vz-heatmap-series">
              {yDomain.map((yKey, yi) =>
                xDomain.map((xKey, xi) => {
                  const d = lookup.get(`${xKey}::${yKey}`);
                  const v = d != null ? value(d) : null;
                  const alpha = v != null ? intensity(v) : 0;
                  const isHover = hover && hover.xKey === xKey && hover.yKey === yKey;
                  return (
                    <rect
                      key={`${yKey}:${xKey}`}
                      x={xi * (cellW + cellGap)}
                      y={yi * (cellH + cellGap)}
                      width={cellW}
                      height={cellH}
                      rx={cellRadius}
                      ry={cellRadius}
                      fill={color}
                      fillOpacity={alpha}
                      stroke={isHover ? "var(--vz-fg)" : undefined}
                      strokeWidth={isHover ? 1 : 0}
                      onMouseEnter={() => (d ? setHover({ xKey, yKey, datum: d }) : null)}
                      onMouseLeave={() => setHover(null)}
                    />
                  );
                }),
              )}
            </g>
            <g className="vz-axis vz-axis-y">
              {yDomain.map((yKey, yi) => (
                <text
                  key={yKey}
                  x={-8}
                  y={yi * (cellH + cellGap) + cellH / 2}
                  dy="0.32em"
                  textAnchor="end"
                  style={{ fontSize: 11, fill: "var(--vz-muted)" }}
                >
                  {yKey}
                </text>
              ))}
            </g>
            <g
              className="vz-axis vz-axis-x"
              transform={`translate(0, ${yDomain.length * (cellH + cellGap)})`}
            >
              {xDomain.map((xKey, xi) => (
                <text
                  key={xKey}
                  x={xi * (cellW + cellGap) + cellW / 2}
                  y={14}
                  textAnchor="middle"
                  style={{ fontSize: 11, fill: "var(--vz-muted)" }}
                >
                  {xKey}
                </text>
              ))}
            </g>
          </g>
        </svg>
      ) : null}
      {showTooltip && hover ? (
        <HeatmapTooltip xKey={hover.xKey} yKey={hover.yKey} value={value(hover.datum)} format={valueFormat} />
      ) : null}
    </div>
  );
}

function HeatmapTooltip({
  xKey,
  yKey,
  value,
  format,
}: {
  xKey: string;
  yKey: string;
  value: number;
  format: (v: number) => string;
}) {
  return (
    <div
      className="vz-tooltip"
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        pointerEvents: "none",
        fontSize: 12,
        lineHeight: 1.4,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 2 }}>
        {yKey} · {xKey}
      </div>
      <div style={{ color: "var(--vz-muted)" }}>{format(value)}</div>
    </div>
  );
}
