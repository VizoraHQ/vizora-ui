import { useMemo } from "react";
import { line as d3Line } from "d3-shape";
import { seriesColor } from "@vizora/utils";
import { useCartesian } from "../contexts";
import { useSeriesGroups } from "./groupBySeries";
import { getCurve } from "./curves";
import type { CurveKind } from "./curves";

export type LineSeriesProps = {
  stroke?: string;
  strokeWidth?: number;
  curve?: CurveKind;
  dashed?: boolean;
  showPoints?: boolean;
  pointRadius?: number;
};

export function LineSeries(props: LineSeriesProps) {
  const { stroke, strokeWidth = 2, curve = "monotone", dashed, showPoints, pointRadius = 3 } = props;
  const { xScale, yScale, xAccessor, yAccessor, xKind } = useCartesian();
  const groups = useSeriesGroups<unknown>();

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
      d3Line<unknown>()
        .x((d) => getX(d))
        .y((d) => yScale(yAccessor(d)))
        .curve(getCurve(curve)),
    [getX, yScale, yAccessor, curve],
  );

  return (
    <g className="vz-series gf-line-series">
      {groups.map((group) => {
        const color = stroke ?? seriesColor(group.index);
        const path = generator(group.data) ?? "";
        return (
          <g key={group.key} data-series-key={group.key}>
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={dashed ? "4 4" : undefined}
            />
            {showPoints
              ? group.data.map((d, i) => (
                  <circle
                    key={i}
                    cx={getX(d)}
                    cy={yScale(yAccessor(d))}
                    r={pointRadius}
                    fill={color}
                  />
                ))
              : null}
          </g>
        );
      })}
    </g>
  );
}
