import {
  Cartesian,
  ChartProvider,
  Grid,
  Legend,
  ScatterSeries,
  Tooltip,
  XAxis,
  YAxis,
} from "@vizora/core";
import type { Accessor } from "@vizora/core";

export type ScatterPlotProps<T> = {
  data: T[];
  x: Accessor<T, number>;
  y: Accessor<T, number>;
  series?: Accessor<T, string>;
  /** Optional bubble-size accessor (px radius). */
  size?: (d: T) => number;
  radius?: number;
  width?: number | string;
  height?: number | string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  xLabel?: string;
  yLabel?: string;
  className?: string;
  title?: string;
  description?: string;
};

export function ScatterPlot<T>(props: ScatterPlotProps<T>) {
  const {
    data,
    x,
    y,
    series,
    size,
    radius = 4,
    width,
    height = 320,
    showGrid = true,
    showLegend = true,
    showTooltip = true,
    xLabel,
    yLabel,
    className,
    title,
    description,
  } = props;

  return (
    <ChartProvider
      data={data}
      width={width}
      height={height}
      className={className}
      title={title}
      description={description}
    >
      <Cartesian x={x} y={y} series={series} xType="linear" yIncludeZero>
        {showGrid ? <Grid axis="both" /> : null}
        <YAxis label={yLabel} />
        <XAxis label={xLabel} />
        <ScatterSeries radius={radius} size={size as ((d: unknown) => number) | undefined} />
        {showTooltip ? <Tooltip /> : null}
        {showLegend && series ? <Legend /> : null}
      </Cartesian>
    </ChartProvider>
  );
}
