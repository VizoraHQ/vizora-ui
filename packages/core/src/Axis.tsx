import { useMemo } from "react";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import { useCartesian, useChartFrame } from "./contexts";

export type AxisProps = {
  orientation?: "bottom" | "left";
  tickCount?: number;
  tickFormat?: (value: never) => string;
  label?: string;
  hideLine?: boolean;
};

function defaultFormat(v: unknown): string {
  if (v instanceof Date) return v.toLocaleDateString("en", { month: "short", day: "numeric" });
  if (typeof v === "number") {
    if (Math.abs(v) >= 1000) return new Intl.NumberFormat("en", { notation: "compact" }).format(v);
    return String(v);
  }
  return String(v);
}

export function XAxis(props: AxisProps) {
  const { tickCount = 6, tickFormat, label, hideLine } = props;
  const { innerHeight, innerWidth } = useChartFrame();
  const { xScale, xKind } = useCartesian();

  const ticks = useMemo(() => {
    if (xKind === "band") {
      const bandScale = xScale as ScaleBand<string>;
      const domain = bandScale.domain();
      return domain.map((value) => ({
        value,
        offset: (bandScale(value) ?? 0) + bandScale.bandwidth() / 2,
      }));
    }
    const continuous = xScale as ScaleLinear<number, number>;
    const tickValues = continuous.ticks(tickCount) as unknown[];
    return tickValues.map((value) => ({
      value,
      offset: continuous(value as number),
    }));
  }, [xScale, xKind, tickCount]);

  const fmt = (tickFormat ?? defaultFormat) as (value: unknown) => string;

  return (
    <g className="vz-axis gf-axis-x" transform={`translate(0, ${innerHeight})`}>
      {!hideLine ? <line x1={0} x2={innerWidth} y1={0} y2={0} /> : null}
      {ticks.map(({ value, offset }, i) => (
        <g key={`${String(value)}-${i}`} transform={`translate(${offset}, 0)`}>
          <line y1={0} y2={4} />
          <text y={16} textAnchor="middle">
            {fmt(value)}
          </text>
        </g>
      ))}
      {label ? (
        <text x={innerWidth / 2} y={28} textAnchor="middle" className="vz-axis-label">
          {label}
        </text>
      ) : null}
    </g>
  );
}

export function YAxis(props: AxisProps) {
  const { tickCount = 5, tickFormat, label, hideLine } = props;
  const { innerHeight } = useChartFrame();
  const { yScale } = useCartesian();

  const ticks = useMemo(() => {
    const values = yScale.ticks(tickCount);
    return values.map((value) => ({ value, offset: yScale(value) }));
  }, [yScale, tickCount]);

  const fmt = (tickFormat ?? defaultFormat) as (value: unknown) => string;

  return (
    <g className="vz-axis gf-axis-y">
      {!hideLine ? <line x1={0} x2={0} y1={0} y2={innerHeight} /> : null}
      {ticks.map(({ value, offset }) => (
        <g key={String(value)} transform={`translate(0, ${offset})`}>
          <line x1={-4} x2={0} />
          <text x={-8} dy="0.32em" textAnchor="end">
            {fmt(value)}
          </text>
        </g>
      ))}
      {label ? (
        <text
          transform={`rotate(-90) translate(${-innerHeight / 2}, -32)`}
          textAnchor="middle"
          className="vz-axis-label"
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}
