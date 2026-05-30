import { useEffect, useMemo, useState } from "react";
import { AreaChart, BarChart, LineChart, ScatterPlot } from "@vizora/charts";
import { aggregate, applyFilters, computePareto, supportsPareto } from "./parse";
import type { Aggregation, ChartType, DataRow, Filter, ParsedData, Pareto } from "./parse";

interface Props {
  data: ParsedData;
  filters: Filter[];
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  aggregation: Aggregation | null;
  onClearAggregation: () => void;
}

const CHART_TABS: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "scatter", label: "Scatter" },
];

function firstOfType(data: ParsedData, type: "numeric" | "categorical" | "date"): string | undefined {
  return data.columns.find((c) => data.types[c] === type);
}

/** Pick a sensible default X (categorical/date) and Y (numeric). */
function defaultAxes(data: ParsedData): { x: string; y: string } {
  const x = firstOfType(data, "categorical") ?? firstOfType(data, "date") ?? data.columns[0] ?? "";
  const y =
    firstOfType(data, "numeric") ?? data.columns.find((c) => c !== x) ?? data.columns[0] ?? "";
  return { x, y };
}

export function ChartView({
  data,
  filters,
  chartType,
  onChartTypeChange,
  aggregation,
  onClearAggregation,
}: Props) {
  const defaults = useMemo(() => defaultAxes(data), [data]);
  const [xCol, setXCol] = useState(defaults.x);
  const [yCol, setYCol] = useState(defaults.y);

  // Reset axis selection when a new dataset is loaded.
  useEffect(() => {
    setXCol(defaults.x);
    setYCol(defaults.y);
  }, [defaults]);

  const filtered = useMemo(() => applyFilters(data.rows, filters), [data.rows, filters]);

  // When an aggregation is active the chart plots its grouped rows (group key on
  // X, computed value on Y) instead of raw rows; manual axis pickers are hidden.
  const aggResult = useMemo(
    () => (aggregation ? aggregate(filtered, aggregation) : null),
    [filtered, aggregation],
  );

  // Pareto (contribution) view: rank additive category breakdowns by share of
  // the total, descending, and surface a "where it concentrates" headline.
  const pareto = useMemo(
    () => (aggResult && aggregation && supportsPareto(aggregation) ? computePareto(aggResult) : null),
    [aggResult, aggregation],
  );

  const rows = useMemo(() => {
    if (pareto && aggResult) {
      return pareto.segments.map((s) => ({
        [aggResult.groupKey]: s.label,
        [aggResult.valueKey]: s.value,
      }));
    }
    return aggResult ? aggResult.rows : filtered;
  }, [pareto, aggResult, filtered]);

  const activeX = aggResult ? aggResult.groupKey : xCol;
  const activeY = aggResult ? aggResult.valueKey : yCol;

  // Aggregated group keys are always category-like strings (even date buckets,
  // which arrive pre-sorted as "2024-01" labels), so treat X as categorical.
  const xCategorical = aggResult ? true : data.types[activeX] === "categorical";
  const xDate = aggResult ? false : data.types[activeX] === "date";

  // Categorical columns have no position on a continuous (line/area) axis, so
  // map each category to a stable index in encounter order — keeps the line
  // continuous instead of producing NaN coordinates.
  const categoryIndex = useMemo(() => {
    if (!xCategorical) return null;
    const m = new Map<string, number>();
    let i = 0;
    for (const r of rows) {
      const k = String(r[activeX]);
      if (!m.has(k)) m.set(k, i++);
    }
    return m;
  }, [rows, activeX, xCategorical]);

  const coerce = (v: unknown): number =>
    typeof v === "number" ? v : v instanceof Date ? v.getTime() : Number(v) || 0;
  const xString = (d: DataRow): string => String(d[activeX]);
  const xNumeric = (d: DataRow): number => coerce(d[activeX]);
  // Continuous X for line/area: Date for date columns, category index for
  // categorical columns, plain number otherwise.
  const xContinuous = (d: DataRow): Date | number => {
    const v = d[activeX];
    if (xDate) return v instanceof Date ? v : new Date(String(v));
    if (categoryIndex) return categoryIndex.get(String(v)) ?? 0;
    return coerce(v);
  };
  const yAccessor = (d: DataRow): number => coerce(d[activeY]);

  const xType = xDate ? "time" : "linear";

  const shared = {
    data: rows,
    height: 360,
    title: `${activeY} by ${activeX}`,
    description: aggResult
      ? `${data.fileName} · ${aggregation?.op} · ${rows.length} groups`
      : `${data.fileName} · ${rows.length} of ${data.rows.length} rows shown`,
    yLabel: activeY,
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div role="tablist" aria-label="Chart type" style={{ display: "flex", gap: 6 }}>
          {CHART_TABS.map((tab) => {
            const active = tab.value === chartType;
            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={active}
                onClick={() => onChartTypeChange(tab.value)}
                style={{
                  background: active ? "var(--vz-accent)" : "var(--vz-surface)",
                  color: active ? "white" : "var(--vz-fg)",
                  border: "1px solid var(--vz-border)",
                  borderRadius: 8,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {aggResult ? (
          <AggregationChip
            label={`${activeY} by ${activeX}${aggregation?.bucket ? ` (${aggregation.bucket})` : ""}`}
            onClear={onClearAggregation}
          />
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <AxisSelect label="X" value={xCol} options={data.columns} onChange={setXCol} />
            <AxisSelect label="Y" value={yCol} options={data.columns} onChange={setYCol} />
          </div>
        )}
      </div>

      {pareto && pareto.segments.length > 0 && <InsightBanner pareto={pareto} />}

      {rows.length === 0 ? (
        <div
          style={{
            height: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--vz-muted)",
            fontSize: 13,
          }}
        >
          No rows match the active filters.
        </div>
      ) : (
        <>
          {chartType === "bar" && <BarChart {...shared} x={xString} y={yAccessor} />}
          {chartType === "line" && (
            <LineChart {...shared} x={xContinuous} y={yAccessor} xType={xType} xLabel={xCol} />
          )}
          {chartType === "area" && (
            <AreaChart {...shared} x={xContinuous} y={yAccessor} xType={xType} xLabel={xCol} />
          )}
          {chartType === "scatter" && (
            <ScatterPlot {...shared} x={xNumeric} y={yAccessor} xLabel={xCol} />
          )}
        </>
      )}
    </div>
  );
}

function AggregationChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "color-mix(in srgb, var(--vz-accent) 14%, transparent)",
        border: "1px solid var(--vz-accent)",
        borderRadius: 999,
        padding: "5px 6px 5px 12px",
        fontSize: 12,
        color: "var(--vz-fg)",
      }}
    >
      <span style={{ fontWeight: 600 }}>Σ {label}</span>
      <button
        onClick={onClear}
        aria-label="Clear aggregation"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: 999,
          border: "none",
          background: "var(--vz-accent)",
          color: "white",
          fontSize: 11,
          lineHeight: 1,
          cursor: "pointer",
        }}
      >
        ✕
      </button>
    </div>
  );
}

const TOP_SEGMENTS = 5;

/**
 * Contribution headline + a single 100%-width bar split into the top groups'
 * shares (the rest rolled into "Other"). Turns "sum by category" into the
 * answer to "where did most of it go?".
 */
function InsightBanner({ pareto }: { pareto: Pareto }) {
  const top = pareto.segments.slice(0, TOP_SEGMENTS);
  const topShare = top.reduce((acc, s) => acc + s.share, 0);
  const restShare = Math.max(0, 1 - topShare);
  const seriesColor = (i: number) => `var(--vz-series-${(i % 8) + 1})`;

  return (
    <div
      style={{
        background: "var(--vz-bg)",
        border: "1px solid var(--vz-border)",
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--vz-fg)", marginBottom: 10 }}>
        💡 {pareto.insight}
      </div>

      <div
        role="img"
        aria-label={pareto.insight}
        style={{
          display: "flex",
          width: "100%",
          height: 14,
          borderRadius: 7,
          overflow: "hidden",
        }}
      >
        {top.map((s, i) => (
          <div
            key={s.label}
            title={`${s.label} · ${(s.share * 100).toFixed(1)}%`}
            style={{ width: `${s.share * 100}%`, background: seriesColor(i) }}
          />
        ))}
        {restShare > 0.001 && (
          <div
            title={`Other · ${(restShare * 100).toFixed(1)}%`}
            style={{ width: `${restShare * 100}%`, background: "var(--vz-border)" }}
          />
        )}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", marginTop: 10 }}>
        {top.map((s, i) => (
          <LegendItem key={s.label} color={seriesColor(i)} label={s.label} share={s.share} />
        ))}
        {restShare > 0.001 && (
          <LegendItem color="var(--vz-border)" label="Other" share={restShare} />
        )}
      </div>
    </div>
  );
}

function LegendItem({ color, label, share }: { color: string; label: string; share: number }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--vz-muted)" }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: color, flexShrink: 0 }} />
      <span style={{ color: "var(--vz-fg)" }}>{label}</span>
      <span>{(share * 100).toFixed(0)}%</span>
    </span>
  );
}

function AxisSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.8,
          color: "var(--vz-muted)",
        }}
      >
        {label} axis
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "var(--vz-bg)",
          color: "var(--vz-fg)",
          border: "1px solid var(--vz-border)",
          borderRadius: 6,
          padding: "5px 8px",
          fontSize: 12,
          fontFamily: "inherit",
          cursor: "pointer",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
