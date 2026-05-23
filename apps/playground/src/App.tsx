import { useState } from "react";
import { AreaChart, BarChart, LineChart } from "@vizora/charts";
import { KpiGrid } from "@vizora/dashboard-blocks";
import { TokenUsageChart } from "@vizora/ai-visuals";
import { applyTheme } from "@vizora/themes";
import type { ThemeName } from "@vizora/themes";
import { latency, salesLong, tokens } from "./data";

const sparkSeed = Array.from({ length: 24 }, (_, i) => Math.sin(i / 3) * 8 + 16 + Math.random() * 3);

export function App() {
  const [theme, setTheme] = useState<ThemeName>("dark");

  const onTheme = (t: ThemeName): void => {
    setTheme(t);
    applyTheme(t);
  };

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1280, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Vizora Playground</h1>
          <p style={{ margin: "4px 0 0", color: "var(--vz-muted)", fontSize: 13 }}>
            v0.1 — every component, live.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["dark", "light", "midnight"] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTheme(t)}
              style={{
                background: theme === t ? "var(--vz-accent)" : "var(--vz-surface)",
                color: theme === t ? "white" : "var(--vz-fg)",
                border: "1px solid var(--vz-border)",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <section style={{ marginBottom: 32 }}>
        <KpiGrid
          items={[
            { label: "Spend (24h)", value: "$148.20", delta: { value: -0.06 }, sparkline: sparkSeed },
            { label: "p95 Latency", value: "812ms", delta: { value: 0.12, invert: true }, sparkline: sparkSeed.map((v) => v + 4) },
            { label: "Eval pass rate", value: "94.2%", delta: { value: 0.03 }, sparkline: sparkSeed.map((v) => v - 2) },
            { label: "Tokens / req", value: "1,204", delta: { value: 0.01 }, sparkline: sparkSeed.map((v) => v * 0.9) },
          ]}
        />
      </section>

      <Panel title="LineChart — multi-series latency">
        <LineChart
          data={latency}
          x={(d) => d.ts}
          y={(d) => d.latencyMs}
          series={(d) => d.model}
          yLabel="ms"
        />
      </Panel>

      <Panel title="AreaChart — single series">
        <AreaChart
          data={latency.filter((d) => d.model === "gpt-4o")}
          x={(d) => d.ts}
          y={(d) => d.latencyMs}
          yLabel="ms"
        />
      </Panel>

      <Panel title="BarChart — grouped sales">
        <BarChart
          data={salesLong}
          x={(d) => d.region}
          y={(d) => d.value}
          series={(d) => d.quarter}
          yLabel="units"
        />
      </Panel>

      <Panel title="TokenUsageChart — AI-native">
        <TokenUsageChart data={tokens} />
      </Panel>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px", color: "var(--vz-muted)" }}>
        {title}
      </h2>
      <div className="vz-card" style={{ padding: 20 }}>
        {children}
      </div>
    </section>
  );
}
