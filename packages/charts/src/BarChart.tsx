import {
  BarSeries,
  Cartesian,
  ChartProvider,
  Grid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "@vizora/core";
import type { Accessor } from "@vizora/core";

export type BarChartProps<T> = {
  data: T[];
  x: Accessor<T, string>;
  y: Accessor<T, number>;
  series?: Accessor<T, string>;
  width?: number | string;
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  xLabel?: string;
  yLabel?: string;
  radius?: number;
  className?: string;
};

export function BarChart<T>(props: BarChartProps<T>) {
  const {
    data,
    x,
    y,
    series,
    width,
    height = 280,
    showGrid = true,
    showLegend = true,
    showTooltip = true,
    xLabel,
    yLabel,
    radius = 3,
    className,
  } = props;

  return (
    <ChartProvider data={data} width={width} height={height} className={className}>
      <Cartesian x={x} y={y} series={series} xType="band" yIncludeZero>
        {showGrid ? <Grid axis="y" /> : null}
        <YAxis label={yLabel} />
        <XAxis label={xLabel} />
        <BarSeries radius={radius} />
        {showTooltip ? <Tooltip /> : null}
        {showLegend && series ? <Legend /> : null}
      </Cartesian>
    </ChartProvider>
  );
}
