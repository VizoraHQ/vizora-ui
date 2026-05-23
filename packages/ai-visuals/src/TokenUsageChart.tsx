import { useMemo } from "react";
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
import { formatCurrency, formatDate, formatTokens } from "@vizora/utils";

export type TokenUsagePoint = {
  ts: Date | number | string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd?: number;
};

export type TokenUsageChartProps = {
  data: TokenUsagePoint[];
  unit?: "tokens" | "cost";
  groupBy?: "model";
  width?: number | string;
  height?: number | string;
  showLegend?: boolean;
  showTooltip?: boolean;
  className?: string;
  title?: string;
  description?: string;
};

type Row = {
  ts: Date;
  model: string;
  value: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export function TokenUsageChart(props: TokenUsageChartProps) {
  const {
    data,
    unit = "tokens",
    width,
    height = 320,
    showLegend = true,
    showTooltip = true,
    className,
    title = unit === "cost" ? "Token cost by model over time" : "Token usage by model over time",
    description,
  } = props;

  const rows = useMemo<Row[]>(() => {
    return data.map((p) => {
      const total = p.inputTokens + p.outputTokens;
      const cost = p.costUsd ?? 0;
      return {
        ts: p.ts instanceof Date ? p.ts : new Date(p.ts),
        model: p.model,
        value: unit === "cost" ? cost : total,
        inputTokens: p.inputTokens,
        outputTokens: p.outputTokens,
        costUsd: cost,
      };
    });
  }, [data, unit]);

  return (
    <ChartProvider
      data={rows}
      width={width}
      height={height}
      className={className}
      title={title}
      description={description}
    >
      <Cartesian<Row>
        x={(d) => d.ts}
        y={(d) => d.value}
        series={(d) => d.model}
        xType="time"
        yIncludeZero
      >
        <Grid axis="y" />
        <YAxis tickFormat={(v) => (unit === "cost" ? formatCurrency(v as number) : formatTokens(v as number))} />
        <XAxis tickFormat={(v) => formatDate(v as Date)} />
        <AreaSeries gradient />
        {showTooltip ? (
          <Tooltip<Row>
            render={({ datum, seriesKey }) => (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{seriesKey ?? datum.model}</div>
                <div style={{ color: "var(--vz-muted)", fontSize: 11, lineHeight: 1.4 }}>
                  <div>{formatDate(datum.ts)}</div>
                  <div>
                    Input: <strong style={{ color: "var(--vz-fg)" }}>{formatTokens(datum.inputTokens)}</strong>
                  </div>
                  <div>
                    Output:{" "}
                    <strong style={{ color: "var(--vz-fg)" }}>{formatTokens(datum.outputTokens)}</strong>
                  </div>
                  {datum.costUsd ? (
                    <div>
                      Cost: <strong style={{ color: "var(--vz-fg)" }}>{formatCurrency(datum.costUsd)}</strong>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          />
        ) : null}
        {showLegend ? <Legend /> : null}
      </Cartesian>
    </ChartProvider>
  );
}
