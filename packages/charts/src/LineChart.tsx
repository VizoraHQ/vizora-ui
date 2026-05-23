import {
  Cartesian,
  ChartProvider,
  Grid,
  Legend,
  LineSeries,
  Tooltip,
  XAxis,
  YAxis,
} from "@vizora/core";
import type { Accessor, CurveKind } from "@vizora/core";

export type LineChartProps<T> = {
  data: T[];
  x: Accessor<T, Date | number | string>;
  y: Accessor<T, number>;
  series?: Accessor<T, string>;
  width?: number | string;
  height?: number | string;
  curve?: CurveKind;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  showPoints?: boolean;
  xLabel?: string;
  yLabel?: string;
  xType?: "linear" | "time";
  className?: string;
};

export function LineChart<T>(props: LineChartProps<T>) {
  const {
    data,
    x,
    y,
    series,
    width,
    height = 280,
    curve = "monotone",
    showGrid = true,
    showLegend = true,
    showTooltip = true,
    showPoints = false,
    xLabel,
    yLabel,
    xType = "time",
    className,
  } = props;

  return (
    <ChartProvider data={data} width={width} height={height} className={className}>
      <Cartesian x={x} y={y} series={series} xType={xType}>
        {showGrid ? <Grid axis="y" /> : null}
        <YAxis label={yLabel} />
        <XAxis label={xLabel} />
        <LineSeries curve={curve} showPoints={showPoints} />
        {showTooltip ? <Tooltip /> : null}
        {showLegend && series ? <Legend /> : null}
      </Cartesian>
    </ChartProvider>
  );
}
