import { useMemo } from "react";
import { useCartesian, useChartFrame } from "./contexts";

export type GridProps = {
  axis?: "x" | "y" | "both";
  tickCount?: number;
};

export function Grid({ axis = "y", tickCount = 5 }: GridProps) {
  const { innerWidth, innerHeight } = useChartFrame();
  const { xScale, yScale, xKind } = useCartesian();

  const xLines = useMemo(() => {
    if (axis === "y") return [];
    if (xKind === "band") return [];
    const continuous = xScale as ReturnType<typeof import("d3-scale").scaleLinear<number, number>>;
    return continuous.ticks(tickCount).map((v) => continuous(v as number));
  }, [axis, xKind, xScale, tickCount]);

  const yLines = useMemo(() => {
    if (axis === "x") return [];
    return yScale.ticks(tickCount).map((v) => yScale(v));
  }, [axis, yScale, tickCount]);

  return (
    <g className="vz-grid">
      {yLines.map((y, i) => (
        <line key={`y-${i}`} x1={0} x2={innerWidth} y1={y} y2={y} />
      ))}
      {xLines.map((x, i) => (
        <line key={`x-${i}`} x1={x} x2={x} y1={0} y2={innerHeight} />
      ))}
    </g>
  );
}
