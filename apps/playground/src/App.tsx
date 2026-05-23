import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AreaChart,
  BarChart,
  DonutChart,
  Heatmap,
  LineChart,
  ScatterPlot,
} from "@vizora/charts";
import { KpiGrid } from "@vizora/dashboard-blocks";
import { TokenUsageChart } from "@vizora/ai-visuals";
import { applyTheme } from "@vizora/themes";
import type { ThemeName } from "@vizora/themes";
import {
  evalLong,
  latency,
  latencyHeatmap,
  modelShare,
  HEATMAP_HOURS,
  MODELS,
  spend,
  sparkSeeds,
  tokens,
  tradeoff,
} from "./data";

export function App() {
  const [theme, setTheme] = useState<ThemeName>("dark");
  const onTheme = (t: ThemeName): void => {
    setTheme(t);
    applyTheme(t);
  };

  // Pretty totals for the KPI strip — derived from sample data so they
  // stay coherent with the charts below.
  const totals = useMemo(() => {
    const totalSpend = modelShare.reduce((s, x) => s + x.spendUsd, 0);
    const tokensPerReq = Math.round(
      tokens.reduce((s, x) => s + x.inputTokens + x.outputTokens, 0) / tokens.length,
    );
    return {
      spend: totalSpend,
      tokensPerReq,
    };
  }, []);

  return (
    <div
      style={{
        padding: "32px 40px 64px",
        maxWidth: 1440,
        margin: "0 auto",
        fontFamily: "var(--vz-font-sans)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.4,
              color: "var(--vz-muted)",
              textTransform: "uppercase",
            }}
          >
            Vizora · v0.2 demo
          </div>
          <h1 style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 600 }}>AI Ops dashboard</h1>
          <p style={{ margin: "6px 0 0", color: "var(--vz-muted)", fontSize: 13 }}>
            Sample workloads across {MODELS.length} models — Line, Area, Bar, Donut, Heatmap, Scatter
            and AI-native components.
          </p>
        </div>
        <div role="tablist" aria-label="Theme" style={{ display: "flex", gap: 6 }}>
          {(["dark", "light", "midnight"] as const).map((t) => {
            const active = theme === t;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={active}
                onClick={() => onTheme(t)}
                style={{
                  background: active ? "var(--vz-accent)" : "var(--vz-surface)",
                  color: active ? "white" : "var(--vz-fg)",
                  border: "1px solid var(--vz-border)",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </header>

      <Section>
        <KpiGrid
          items={[
            {
              label: "Spend (24h)",
              value: `$${totals.spend.toFixed(2)}`,
              delta: { value: -0.06 },
              sparkline: sparkSeeds.spend,
            },
            {
              label: "p95 Latency",
              value: "812ms",
              delta: { value: 0.12, invert: true },
              sparkline: sparkSeeds.latency,
            },
            {
              label: "Eval pass rate",
              value: "94.2%",
              delta: { value: 0.03 },
              sparkline: sparkSeeds.evalPass,
            },
            {
              label: "Tokens / req",
              value: totals.tokensPerReq.toLocaleString(),
              delta: { value: 0.01 },
              sparkline: sparkSeeds.tokens,
            },
          ]}
        />
      </Section>

      <Row>
        <Panel
          title="Latency over time"
          subtitle="p50 across models, last 80 minutes"
          flex={1.4}
        >
          <LineChart
            title="Latency over time"
            description="p50 latency in milliseconds across three models, sampled every minute."
            data={latency}
            x={(d) => d.ts}
            y={(d) => d.latencyMs}
            series={(d) => d.model}
            yLabel="ms"
            height={260}
          />
        </Panel>
        <Panel title="Spend by model" subtitle="Last 24h" flex={1}>
          <DonutChart
            title="Share of spend by model"
            description="Cumulative spend per model over the last 24 hours."
            data={modelShare}
            value={(d) => d.spendUsd}
            label={(d) => d.model}
            width={220}
            height={220}
            valueFormat={(v) => `$${v.toFixed(2)}`}
          />
        </Panel>
      </Row>

      <Row>
        <Panel title="Hourly spend" subtitle="USD per hour, rolling 60h" flex={1.4}>
          <AreaChart
            title="Hourly spend"
            description="Total spend per hour over the past 60 hours."
            data={spend}
            x={(d) => d.ts}
            y={(d) => d.costUsd}
            yLabel="$"
            height={240}
          />
        </Panel>
        <Panel
          title="Eval pass rate"
          subtitle="By model · grouped tasks"
          flex={1}
        >
          <BarChart
            title="Eval pass rate by task"
            description="Pass-rate across RAG, SQL, Code, and Math evals, grouped by model."
            data={evalLong}
            x={(d) => d.task}
            y={(d) => d.passRate * 100}
            series={(d) => d.model}
            yLabel="% pass"
            height={240}
          />
        </Panel>
      </Row>

      <Row>
        <Panel
          title="Latency heatmap"
          subtitle="By hour of day × model"
          flex={1.4}
        >
          <Heatmap
            title="Latency by hour and model"
            description="Average latency in milliseconds for each hour of day, segmented by model."
            data={latencyHeatmap}
            x={(d) => d.hour}
            y={(d) => d.model}
            value={(d) => d.latencyMs}
            xDomain={HEATMAP_HOURS}
            yDomain={MODELS as unknown as string[]}
            height={220}
            valueFormat={(v) => `${v} ms`}
          />
        </Panel>
        <Panel
          title="Cost vs accuracy"
          subtitle="Pareto sweep across model families"
          flex={1}
        >
          <ScatterPlot
            title="Cost vs accuracy"
            description="Each marker is one evaluated configuration. Lower-right is better — high accuracy at low cost."
            data={tradeoff}
            x={(d) => d.costPer1k}
            y={(d) => d.accuracy}
            series={(d) => d.family}
            xLabel="$ / 1K tok"
            yLabel="accuracy"
            height={260}
          />
        </Panel>
      </Row>

      <Section>
        <Panel
          title="Token usage"
          subtitle="The signature AI-native component"
        >
          <TokenUsageChart data={tokens} height={300} />
        </Panel>
      </Section>

      <footer
        style={{
          marginTop: 32,
          color: "var(--vz-muted)",
          fontSize: 11,
          textAlign: "center",
        }}
      >
        Vizora playground · {new Date().getFullYear()} · MIT
      </footer>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
        gap: 16,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
  );
}

function Section({ children }: { children: ReactNode }) {
  return <section style={{ marginBottom: 16 }}>{children}</section>;
}

function Panel({
  title,
  subtitle,
  flex,
  children,
}: {
  title: string;
  subtitle?: string;
  flex?: number;
  children: ReactNode;
}) {
  return (
    <div
      className="vz-card"
      style={{
        padding: 20,
        flex,
        minWidth: 0,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--vz-fg)" }}>{title}</div>
        {subtitle ? (
          <div style={{ fontSize: 11, color: "var(--vz-muted)", marginTop: 2 }}>{subtitle}</div>
        ) : null}
      </div>
      {children}
    </div>
  );
}
