import { useMemo } from "react";
import { scaleBand } from "d3-scale";
import type { ScaleBand } from "d3-scale";
import { seriesColor } from "@vizora/utils";
import { useCartesian, useChartFrame } from "../contexts";
import { useSeriesGroups } from "./groupBySeries";

export type BarSeriesProps = {
  fill?: string;
  radius?: number;
  groupPadding?: number;
};

export function BarSeries(props: BarSeriesProps) {
  const { fill, radius = 3, groupPadding = 0.1 } = props;
  const { xScale, yScale, xAccessor, yAccessor, xKind, seriesKeys } = useCartesian();
  const { innerHeight } = useChartFrame();
  const groups = useSeriesGroups<unknown>();

  if (xKind !== "band") {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Vizora: <BarSeries> requires <Cartesian xType=\"band\"> — rendering nothing.",
      );
    }
    return null;
  }

  const band = xScale as ScaleBand<string>;

  const innerScale = useMemo(() => {
    if (seriesKeys.length <= 1) return null;
    return scaleBand<string>()
      .domain(seriesKeys)
      .range([0, band.bandwidth()])
      .padding(groupPadding);
  }, [seriesKeys, band, groupPadding]);

  const baseline = yScale(0);
  const yZero = Number.isFinite(baseline) ? baseline : innerHeight;

  return (
    <g className="vz-series vz-bar-series">
      {groups.map((group) => {
        const color = fill ?? seriesColor(group.index);
        return (
          <g key={group.key} data-series-key={group.key}>
            {group.data.map((d, i) => {
              const key = String(xAccessor(d));
              const baseX = band(key);
              if (baseX == null) return null;
              const offset = innerScale ? innerScale(group.key) ?? 0 : 0;
              const width = innerScale ? innerScale.bandwidth() : band.bandwidth();
              const value = yAccessor(d);
              const y = yScale(value);
              const h = Math.max(0, yZero - y);
              return (
                <rect
                  key={i}
                  x={baseX + offset}
                  y={Math.min(y, yZero)}
                  width={width}
                  height={h}
                  fill={color}
                  rx={radius}
                  ry={radius}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
