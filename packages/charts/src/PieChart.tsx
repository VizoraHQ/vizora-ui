import { useId, useMemo, useState } from "react";
import { arc as d3Arc, pie as d3Pie } from "d3-shape";
import { seriesColor } from "@vizora/utils";

export type PieDatum<T> = {
  /** Original datum, useful for tooltips. */
  datum: T;
  label: string;
  value: number;
};

export type PieChartProps<T> = {
  data: T[];
  /** Numeric value accessor (must return a non-negative number). */
  value: (d: T) => number;
  /** Slice label accessor — rendered in legend + tooltip. */
  label: (d: T) => string;
  /** Width in px (default 320). Height defaults to width for a square chart. */
  width?: number;
  height?: number;
  /**
   * Donut inner radius as a fraction of the outer radius (0–1).
   * Defaults to 0 (solid pie). Use 0.6 for a donut.
   */
  innerRadius?: number;
  /** Slice padding angle in radians. Default 0.012. */
  padAngle?: number;
  /** Corner rounding in px. Default 2. */
  cornerRadius?: number;
  /** Optional explicit palette. Defaults to theme CSS variables. */
  colors?: string[];
  showLegend?: boolean;
  showLabels?: boolean;
  /** Format the on-slice or tooltip value. */
  valueFormat?: (v: number) => string;
  className?: string;
  title?: string;
  description?: string;
};

const defaultFormat = (n: number): string =>
  Number.isInteger(n) ? n.toLocaleString("en") : n.toFixed(1);

export function PieChart<T>(props: PieChartProps<T>) {
  const {
    data,
    value,
    label,
    width = 320,
    height,
    innerRadius = 0,
    padAngle = 0.012,
    cornerRadius = 2,
    colors,
    showLegend = true,
    showLabels = false,
    valueFormat = defaultFormat,
    className,
    title,
    description,
  } = props;

  const a11yId = useId();
  const titleId = title ? `${a11yId}-title` : undefined;
  const descId = description ? `${a11yId}-desc` : undefined;
  const labelledBy = [titleId, descId].filter(Boolean).join(" ") || undefined;

  const h = height ?? width;
  const radius = Math.min(width, h) / 2;
  const inner = Math.max(0, Math.min(0.95, innerRadius)) * radius;

  const slices = useMemo(() => {
    const generator = d3Pie<T>()
      .value((d) => Math.max(0, value(d)))
      .sort(null)
      .padAngle(padAngle);
    return generator(data);
  }, [data, value, padAngle]);

  const arcGen = useMemo(
    () =>
      d3Arc<{ startAngle: number; endAngle: number }>()
        .innerRadius(inner)
        .outerRadius(radius)
        .cornerRadius(cornerRadius),
    [inner, radius, cornerRadius],
  );

  const labelArc = useMemo(
    () =>
      d3Arc<{ startAngle: number; endAngle: number }>()
        .innerRadius((inner + radius) / 2)
        .outerRadius((inner + radius) / 2),
    [inner, radius],
  );

  const total = useMemo(() => slices.reduce((s, x) => s + Math.max(0, x.value), 0), [slices]);

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const palette = (i: number): string =>
    colors && colors.length > 0 ? (colors[i % colors.length] ?? seriesColor(i)) : seriesColor(i);

  return (
    <div
      className={className}
      style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}
    >
      <svg
        width={width}
        height={h}
        viewBox={`${-width / 2} ${-h / 2} ${width} ${h}`}
        role="img"
        aria-labelledby={labelledBy}
        style={{ overflow: "visible" }}
      >
        {title ? <title id={titleId}>{title}</title> : null}
        {description ? <desc id={descId}>{description}</desc> : null}
        <g className="vz-series vz-pie-series">
          {slices.map((slice, i) => {
            const path = arcGen(slice) ?? "";
            const color = palette(i);
            const dim = hoverIdx != null && hoverIdx !== i;
            return (
              <path
                key={i}
                d={path}
                fill={color}
                opacity={dim ? 0.35 : 1}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{ transition: "opacity var(--vz-duration-fast, 120ms) var(--vz-ease, ease)" }}
              />
            );
          })}
          {showLabels
            ? slices.map((slice, i) => {
                const [lx, ly] = labelArc.centroid(slice);
                const pct = total > 0 ? (slice.value / total) * 100 : 0;
                if (pct < 4) return null;
                return (
                  <text
                    key={`l-${i}`}
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dy="0.32em"
                    style={{
                      fontSize: 11,
                      fill: "var(--vz-fg, currentColor)",
                      fontWeight: 600,
                      pointerEvents: "none",
                    }}
                  >
                    {pct.toFixed(0)}%
                  </text>
                );
              })
            : null}
          {inner > 0 && hoverIdx != null && slices[hoverIdx] ? (
            <g style={{ pointerEvents: "none" }}>
              <text
                textAnchor="middle"
                dy="-0.2em"
                style={{ fontSize: 11, fill: "var(--vz-muted)" }}
              >
                {label(slices[hoverIdx].data)}
              </text>
              <text
                textAnchor="middle"
                dy="1em"
                style={{ fontSize: 18, fontWeight: 600, fill: "var(--vz-fg, currentColor)" }}
              >
                {valueFormat(slices[hoverIdx].value)}
              </text>
            </g>
          ) : null}
        </g>
      </svg>
      {showLegend ? (
        <ul
          className="vz-legend vz-pie-legend"
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 160,
          }}
        >
          {slices.map((slice, i) => {
            const pct = total > 0 ? (slice.value / total) * 100 : 0;
            const dim = hoverIdx != null && hoverIdx !== i;
            return (
              <li
                key={i}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "10px 1fr auto",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                  opacity: dim ? 0.55 : 1,
                  cursor: "default",
                  transition: "opacity var(--vz-duration-fast, 120ms) var(--vz-ease, ease)",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: palette(i),
                    display: "inline-block",
                  }}
                />
                <span style={{ color: "var(--vz-fg)" }}>{label(slice.data)}</span>
                <span style={{ color: "var(--vz-muted)" }}>{pct.toFixed(1)}%</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
