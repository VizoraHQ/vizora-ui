import { createContext, useContext } from "react";
import type { ScaleBand, ScaleLinear, ScaleTime } from "d3-scale";

export type ChartFrameValue = {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
  data: unknown[];
};

export const ChartFrameContext = createContext<ChartFrameValue | null>(null);

export function useChartFrame(): ChartFrameValue {
  const ctx = useContext(ChartFrameContext);
  if (!ctx) {
    throw new Error("Vizora: components must be rendered inside <ChartProvider>.");
  }
  return ctx;
}

export type AnyContinuousScale = ScaleLinear<number, number> | ScaleTime<number, number>;
export type AnyXScale = AnyContinuousScale | ScaleBand<string>;

export type CartesianContextValue = {
  xScale: AnyXScale;
  yScale: ScaleLinear<number, number>;
  xKind: "linear" | "time" | "band";
  yKind: "linear";
  xAccessor: (d: unknown) => unknown;
  yAccessor: (d: unknown) => number;
  seriesAccessor: ((d: unknown) => string) | null;
  seriesKeys: string[];
};

export const CartesianContext = createContext<CartesianContextValue | null>(null);

export function useCartesian(): CartesianContextValue {
  const ctx = useContext(CartesianContext);
  if (!ctx) {
    throw new Error("Vizora: this component must be rendered inside <Cartesian>.");
  }
  return ctx;
}
