import type { ReactNode } from "react";
import { cn } from "@vizora/utils";
import { Sparkline } from "./Sparkline";

export type KpiDelta = {
  value: number;
  label?: string;
  invert?: boolean;
};

export type KpiCardProps = {
  label: string;
  value: ReactNode;
  delta?: KpiDelta;
  sparkline?: number[];
  hint?: string;
  className?: string;
};

export function KpiCard(props: KpiCardProps) {
  const { label, value, delta, sparkline, hint, className } = props;

  const deltaTone = delta
    ? (delta.invert ? -delta.value : delta.value) > 0
      ? "pos"
      : (delta.invert ? -delta.value : delta.value) < 0
        ? "neg"
        : "neutral"
    : "neutral";

  const deltaColor =
    deltaTone === "pos"
      ? "var(--vz-series-3)"
      : deltaTone === "neg"
        ? "var(--vz-series-5)"
        : "var(--vz-muted)";

  return (
    <div
      className={cn("vz-card", "vz-kpi-card", className)}
      style={{
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minHeight: 104,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "var(--vz-muted)", fontSize: 12, letterSpacing: 0.2 }}>{label}</span>
        {sparkline && sparkline.length > 1 ? <Sparkline values={sparkline} /> : null}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 600, color: "var(--vz-fg)" }}>{value}</span>
        {delta ? (
          <span style={{ color: deltaColor, fontSize: 12, fontWeight: 500 }}>
            {delta.value > 0 ? "▲" : delta.value < 0 ? "▼" : "—"} {formatDeltaPct(delta.value)}
            {delta.label ? ` · ${delta.label}` : ""}
          </span>
        ) : null}
      </div>
      {hint ? (
        <span style={{ color: "var(--vz-muted)", fontSize: 11 }}>{hint}</span>
      ) : null}
    </div>
  );
}

function formatDeltaPct(v: number): string {
  const pct = Math.abs(v) * 100;
  return `${pct.toFixed(pct < 10 ? 1 : 0)}%`;
}
