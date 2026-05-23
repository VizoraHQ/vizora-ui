import { useMemo } from "react";
import { area, curveMonotoneX, line } from "d3-shape";
import { extent } from "d3-array";
import { scaleLinear } from "d3-scale";

export type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
};

export function Sparkline(props: SparklineProps) {
  const { values, width = 96, height = 28, stroke = "var(--vz-accent)", fill, strokeWidth = 1.5 } =
    props;

  const { linePath, areaPath } = useMemo(() => {
    if (values.length < 2) return { linePath: "", areaPath: "" };
    const xScale = scaleLinear()
      .domain([0, values.length - 1])
      .range([0, width]);
    const [min, max] = extent(values) as [number, number];
    const yScale = scaleLinear()
      .domain([min === max ? min - 1 : min, min === max ? max + 1 : max])
      .range([height - 2, 2]);
    const lineGen = line<number>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(curveMonotoneX);
    const areaGen = area<number>()
      .x((_, i) => xScale(i))
      .y0(height)
      .y1((d) => yScale(d))
      .curve(curveMonotoneX);
    return { linePath: lineGen(values) ?? "", areaPath: areaGen(values) ?? "" };
  }, [values, width, height]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      {fill ? <path d={areaPath} fill={fill} /> : null}
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={strokeWidth} />
    </svg>
  );
}
