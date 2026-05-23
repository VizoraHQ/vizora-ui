import { useMemo, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import { bisector } from "d3-array";
import type { ScaleBand, ScaleLinear } from "d3-scale";
import { useCartesian, useChartFrame } from "./contexts";

export type TooltipPoint<T = unknown> = {
  datum: T;
  x: number;
  y: number;
  seriesKey: string | null;
};

export type TooltipProps<T = unknown> = {
  render?: (point: TooltipPoint<T>) => ReactNode;
  snap?: boolean;
};

export function Tooltip<T = unknown>(props: TooltipProps<T>) {
  const { render } = props;
  const frame = useChartFrame();
  const { innerWidth, innerHeight } = frame;
  const { xScale, yScale, xAccessor, yAccessor, xKind, seriesAccessor } = useCartesian();
  const overlayRef = useRef<SVGRectElement | null>(null);
  const [point, setPoint] = useState<TooltipPoint<T> | null>(null);

  const data = frame.data as T[];

  const ordered = useMemo(() => {
    if (xKind === "band") return data;
    const getX = (d: T): number => {
      const v = xAccessor(d);
      if (xKind === "time") return +new Date(v as Date | number | string);
      return Number(v);
    };
    return data.slice().sort((a, b) => getX(a) - getX(b));
  }, [data, xAccessor, xKind]);

  const findNearest = (clientX: number, clientY: number): TooltipPoint<T> | null => {
    const el = overlayRef.current;
    if (!el || data.length === 0) return null;
    const ctm = el.getScreenCTM();
    if (!ctm) return null;
    const svgPoint = el.ownerSVGElement?.createSVGPoint();
    if (!svgPoint) return null;
    svgPoint.x = clientX;
    svgPoint.y = clientY;
    const local = svgPoint.matrixTransform(ctm.inverse());
    const mx = local.x;

    if (xKind === "band") {
      const band = xScale as ScaleBand<string>;
      const domain = band.domain();
      const step = band.step();
      const idx = Math.max(0, Math.min(domain.length - 1, Math.floor(mx / step)));
      const key = domain[idx];
      if (key == null) return null;
      const datum = data.find((d) => String(xAccessor(d)) === key);
      if (!datum) return null;
      const xPos = (band(key) ?? 0) + band.bandwidth() / 2;
      return {
        datum,
        x: xPos,
        y: yScale(yAccessor(datum)),
        seriesKey: seriesAccessor ? seriesAccessor(datum) : null,
      };
    }

    const continuous = xScale as ScaleLinear<number, number>;
    const x0 = continuous.invert(mx);
    const getX = (d: T): number => {
      const v = xAccessor(d);
      if (xKind === "time") return +new Date(v as Date | number | string);
      return Number(v);
    };
    const bisect = bisector<T, number>(getX).center;
    const idx = bisect(ordered, +x0);
    const safeIdx = Math.max(0, Math.min(ordered.length - 1, idx));
    const datum = ordered[safeIdx];
    if (!datum) return null;
    const xVal = getX(datum);
    const xPos = (xScale as (v: number) => number)(xVal);
    return {
      datum,
      x: xPos,
      y: yScale(yAccessor(datum)),
      seriesKey: seriesAccessor ? seriesAccessor(datum) : null,
    };
  };

  const handleMove = (e: MouseEvent<SVGRectElement>): void => {
    const next = findNearest(e.clientX, e.clientY);
    setPoint(next);
  };

  const handleLeave = (): void => setPoint(null);

  return (
    <g className="vz-tooltip-layer">
      <rect
        ref={overlayRef}
        x={0}
        y={0}
        width={innerWidth}
        height={innerHeight}
        fill="transparent"
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      />
      {point ? (
        <>
          <line
            x1={point.x}
            x2={point.x}
            y1={0}
            y2={innerHeight}
            stroke="var(--vz-muted)"
            strokeDasharray="2 3"
            opacity={0.5}
          />
          <circle cx={point.x} cy={point.y} r={4} fill="var(--vz-accent)" />
          <foreignObject
            x={Math.min(point.x + 12, innerWidth - 180)}
            y={Math.max(0, point.y - 44)}
            width={180}
            height={88}
            style={{ overflow: "visible", pointerEvents: "none" }}
          >
            <div className="vz-tooltip">
              {render ? render(point) : <DefaultTip point={point} />}
            </div>
          </foreignObject>
        </>
      ) : null}
    </g>
  );
}

function DefaultTip<T>({ point }: { point: TooltipPoint<T> }) {
  const d = point.datum as Record<string, unknown>;
  return (
    <div>
      {point.seriesKey ? (
        <div style={{ fontWeight: 600, marginBottom: 2 }}>{point.seriesKey}</div>
      ) : null}
      <div style={{ color: "var(--vz-muted)", fontSize: 11 }}>
        {Object.entries(d)
          .slice(0, 3)
          .map(([k, v]) => (
            <div key={k}>
              {k}: {String(v)}
            </div>
          ))}
      </div>
    </div>
  );
}
