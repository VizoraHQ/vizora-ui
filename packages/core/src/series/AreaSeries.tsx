import { useId, useMemo } from "react";
import { area as d3Area } from "d3-shape";
import { seriesColor } from "@vizora/utils";
import { useCartesian, useChartFrame } from "../contexts";
import { useSeriesGroups } from "./groupBySeries";
import { getCurve } from "./curves";
import type { CurveKind } from "./curves";

export type AreaSeriesProps = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  curve?: CurveKind;
  gradient?: boolean;
};

export function AreaSeries(props: AreaSeriesProps) {
  const { fill, stroke, strokeWidth = 2, curve = "monotone", gradient = true } = props;
  const { xScale, yScale, xAccessor, yAccessor, xKind } = useCartesian();
  const { innerHeight } = useChartFrame();
  const groups = useSeriesGroups<unknown>();
  const gradientId = useId();

  const getX = useMemo(() => {
    if (xKind === "band") {
      const band = xScale as ReturnType<typeof import("d3-scale").scaleBand<string>>;
      return (d: unknown) => (band(String(xAccessor(d))) ?? 0) + band.bandwidth() / 2;
    }
    if (xKind === "time") {
      const time = xScale as ReturnType<typeof import("d3-scale").scaleTime<number, number>>;
      return (d: unknown) => time(new Date(xAccessor(d) as Date | number | string));
    }
    const linear = xScale as ReturnType<typeof import("d3-scale").scaleLinear<number, number>>;
    return (d: unknown) => linear(Number(xAccessor(d)));
  }, [xScale, xAccessor, xKind]);

  const generator = useMemo(
    () =>
      d3Area<unknown>()
        .x((d) => getX(d))
        .y0(innerHeight)
        .y1((d) => yScale(yAccessor(d)))
        .curve(getCurve(curve)),
    [getX, yScale, yAccessor, innerHeight, curve],
  );

  return (
    <g className="vz-series gf-area-series">
      <defs>
        {groups.map((group) => {
          const color = stroke ?? fill ?? seriesColor(group.index);
          return (
            <linearGradient
              key={group.key}
              id={`${gradientId}-${group.key}`}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor={color} stopOpacity={gradient ? 0.36 : 0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={gradient ? 0 : 0.18} />
            </linearGradient>
          );
        })}
      </defs>
      {groups.map((group) => {
        const color = stroke ?? seriesColor(group.index);
        const path = generator(group.data) ?? "";
        return (
          <g key={group.key} data-series-key={group.key}>
            <path d={path} fill={fill ?? `url(#${gradientId}-${group.key})`} />
            <path
              d={path.replace(/L[^L]*$/, "")}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </g>
  );
}
