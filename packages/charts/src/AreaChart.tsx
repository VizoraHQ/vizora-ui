import {
  AreaSeries,
  Cartesian,
  ChartProvider,
  Grid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "@vizora/core";
import type { Accessor, CurveKind } from "@vizora/core";

export type AreaChartProps<T> = {
  data: T[];
  x: Accessor<T, Date | number | string>;
  y: Accessor<T, number>;
  series?: Accessor<T, string>;
  width?: number | string;
  height?: number | string;
  curve?: CurveKind;
  gradient?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  xType?: "linear" | "time";
  xLabel?: string;
  yLabel?: string;
  className?: string;
};

export function AreaChart<T>(props: AreaChartProps<T>) {
  const {
    data,
    x,
    y,
    series,
    width,
    height = 280,
    curve = "monotone",
    gradient = true,
    showGrid = true,
    showLegend = true,
    showTooltip = true,
    xType = "time",
    xLabel,
    yLabel,
    className,
  } = props;

  return (
    <ChartProvider data={data} width={width} height={height} className={className}>
      <Cartesian x={x} y={y} series={series} xType={xType}>
        {showGrid ? <Grid axis="y" /> : null}
        <YAxis label={yLabel} />
        <XAxis label={xLabel} />
        <AreaSeries curve={curve} gradient={gradient} />
        {showTooltip ? <Tooltip /> : null}
        {showLegend && series ? <Legend /> : null}
      </Cartesian>
    </ChartProvider>
  );
}
