import { useMemo } from "react";
import type { ScaleBand, ScaleLinear, ScaleTime } from "d3-scale";
import { seriesColor } from "@vizora/utils";
import { useCartesian } from "../contexts";
import { useSeriesGroups } from "./groupBySeries";

export type ScatterSeriesProps = {
  /** Override the per-series CSS-variable color. */
  fill?: string;
  /** Marker radius when no `size` accessor is provided. Default 4. */
  radius?: number;
  /** Optional value-to-pixel size accessor for bubble charts. */
  size?: (d: unknown) => number;
  /** Marker opacity. Default 0.85. */
  opacity?: number;
  /** Outline color. Defaults to no outline. */
  stroke?: string;
  strokeWidth?: number;
};

export function ScatterSeries(props: ScatterSeriesProps) {
  const { fill, radius = 4, size, opacity = 0.85, stroke, strokeWidth = 1 } = props;
  const { xScale, yScale, xAccessor, yAccessor, xKind } = useCartesian();
  const groups = useSeriesGroups<unknown>();

  const getX = useMemo(() => {
    if (xKind === "band") {
      const band = xScale as ScaleBand<string>;
      return (d: unknown) => (band(String(xAccessor(d))) ?? 0) + band.bandwidth() / 2;
    }
    if (xKind === "time") {
      const time = xScale as ScaleTime<number, number>;
      return (d: unknown) => time(new Date(xAccessor(d) as Date | number | string));
    }
    const linear = xScale as ScaleLinear<number, number>;
    return (d: unknown) => linear(Number(xAccessor(d)));
  }, [xScale, xAccessor, xKind]);

  return (
    <g className="vz-series vz-scatter-series">
      {groups.map((group) => {
        const color = fill ?? seriesColor(group.index);
        return (
          <g key={group.key} data-series-key={group.key}>
            {group.data.map((d, i) => {
              const r = size ? Math.max(1, size(d)) : radius;
              return (
                <circle
                  key={i}
                  cx={getX(d)}
                  cy={yScale(yAccessor(d))}
                  r={r}
                  fill={color}
                  fillOpacity={opacity}
                  stroke={stroke}
                  strokeWidth={stroke ? strokeWidth : undefined}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
