import { PieChart } from "./PieChart";
import type { PieChartProps } from "./PieChart";

export type DonutChartProps<T> = Omit<PieChartProps<T>, "innerRadius"> & {
  /** Donut thickness as a fraction of the outer radius (0–0.95). Default 0.62. */
  innerRadius?: number;
};

/**
 * Donut chart — a `PieChart` with a default `innerRadius` of 0.62 and
 * an active-slice readout rendered in the center hole.
 */
export function DonutChart<T>(props: DonutChartProps<T>) {
  const { innerRadius = 0.62, ...rest } = props;
  return <PieChart {...rest} innerRadius={innerRadius} />;
}
