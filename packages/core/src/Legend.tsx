import { seriesColor } from "@vizora/utils";
import { useCartesian } from "./contexts";

export type LegendItem = {
  key: string;
  color: string;
  label?: string;
};

export type LegendProps = {
  items?: LegendItem[];
  position?: "top" | "bottom";
  align?: "start" | "center" | "end";
};

export function Legend(props: LegendProps) {
  const { items, align = "start" } = props;
  const { seriesKeys } = useCartesian();
  const resolved =
    items ??
    seriesKeys.map((key, i) => ({
      key,
      color: seriesColor(i),
      label: key,
    }));

  if (resolved.length === 0) return null;

  return (
    <g className="vz-legend">
      <foreignObject x={0} y={-24} width={400} height={20} style={{ overflow: "visible" }}>
        <div
          style={{
            display: "flex",
            gap: 14,
            fontSize: 12,
            color: "var(--vz-muted)",
            justifyContent:
              align === "center" ? "center" : align === "end" ? "flex-end" : "flex-start",
          }}
        >
          {resolved.map((item) => (
            <span key={item.key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: item.color,
                  display: "inline-block",
                }}
              />
              {item.label ?? item.key}
            </span>
          ))}
        </div>
      </foreignObject>
    </g>
  );
}
