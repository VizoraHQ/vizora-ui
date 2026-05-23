import { useMemo } from "react";
import type { ReactNode } from "react";
import { extent } from "d3-array";
import { scaleBand, scaleLinear, scaleTime } from "d3-scale";
import { resolveAccessor } from "./accessor";
import type { Accessor } from "./accessor";
import { CartesianContext, useChartFrame } from "./contexts";
import type { AnyXScale, CartesianContextValue } from "./contexts";

export type ScaleKind = "linear" | "time" | "band";

export type CartesianProps<T> = {
  x: Accessor<T, Date | number | string>;
  y: Accessor<T, number>;
  series?: Accessor<T, string>;
  xType?: ScaleKind;
  yType?: "linear";
  xDomain?: [number, number] | [Date, Date] | string[];
  yDomain?: [number, number];
  yNice?: boolean | number;
  yIncludeZero?: boolean;
  bandPadding?: number;
  children: ReactNode;
};

export function Cartesian<T>(props: CartesianProps<T>) {
  const {
    x,
    y,
    series,
    xType = "linear",
    xDomain,
    yDomain,
    yNice = true,
    yIncludeZero = false,
    bandPadding = 0.2,
    children,
  } = props;

  const frame = useChartFrame();
  const data = frame.data as T[];

  const xAccessor = useMemo(() => resolveAccessor(x), [x]);
  const yAccessor = useMemo(() => resolveAccessor(y), [y]);
  const seriesAccessor = useMemo(() => (series ? resolveAccessor(series) : null), [series]);

  const value = useMemo<CartesianContextValue>(() => {
    const xRange: [number, number] = [0, Math.max(0, frame.innerWidth)];
    const yRange: [number, number] = [Math.max(0, frame.innerHeight), 0];

    let xScale: AnyXScale;
    if (xType === "time") {
      const values = data.map((d) => new Date(xAccessor(d) as Date | number | string));
      const domain = (xDomain as [Date, Date] | undefined) ??
        (extent(values) as [Date, Date] | [undefined, undefined]);
      const safeDomain: [Date, Date] =
        domain[0] && domain[1] ? [domain[0], domain[1]] : [new Date(0), new Date(1)];
      xScale = scaleTime().domain(safeDomain).range(xRange);
    } else if (xType === "band") {
      const values = data.map((d) => String(xAccessor(d)));
      const domain = (xDomain as string[] | undefined) ?? Array.from(new Set(values));
      xScale = scaleBand<string>().domain(domain).range(xRange).padding(bandPadding);
    } else {
      const values = data.map((d) => Number(xAccessor(d)));
      const domain = (xDomain as [number, number] | undefined) ??
        (extent(values) as [number, number] | [undefined, undefined]);
      const safeDomain: [number, number] =
        domain[0] != null && domain[1] != null ? [domain[0], domain[1]] : [0, 1];
      xScale = scaleLinear().domain(safeDomain).range(xRange);
    }

    const yValues = data.map((d) => yAccessor(d));
    const yExtent = extent(yValues) as [number, number] | [undefined, undefined];
    let yMin = yExtent[0] ?? 0;
    let yMax = yExtent[1] ?? 1;
    if (yIncludeZero) {
      yMin = Math.min(0, yMin);
      yMax = Math.max(0, yMax);
    }
    if (yMin === yMax) {
      yMin = yMin - 1;
      yMax = yMax + 1;
    }
    const finalDomain = yDomain ?? ([yMin, yMax] as [number, number]);
    let yScale = scaleLinear().domain(finalDomain).range(yRange);
    if (yNice) yScale = yScale.nice(typeof yNice === "number" ? yNice : undefined);

    const seriesKeys = seriesAccessor
      ? Array.from(new Set(data.map((d) => seriesAccessor(d))))
      : [];

    return {
      xScale,
      yScale,
      xKind: xType,
      yKind: "linear",
      xAccessor: xAccessor as (d: unknown) => unknown,
      yAccessor: yAccessor as (d: unknown) => number,
      seriesAccessor: seriesAccessor as ((d: unknown) => string) | null,
      seriesKeys,
    };
  }, [
    data,
    frame.innerWidth,
    frame.innerHeight,
    xAccessor,
    yAccessor,
    seriesAccessor,
    xType,
    xDomain,
    yDomain,
    yNice,
    yIncludeZero,
    bandPadding,
  ]);

  return <CartesianContext.Provider value={value}>{children}</CartesianContext.Provider>;
}
