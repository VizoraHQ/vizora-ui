import { useEffect, useMemo, useState } from "react";
import { AreaChart, BarChart, LineChart, ScatterPlot } from "@vizora/charts";
import { applyFilters } from "./parse";
import type { ChartType, DataRow, Filter, ParsedData } from "./parse";

interface Props {
  data: ParsedData;
  filters: Filter[];
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
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

export function ChartView({ data, filters, chartType, onChartTypeChange }: Props) {
  const defaults = useMemo(() => defaultAxes(data), [data]);
  const [xCol, setXCol] = useState(defaults.x);
  const [yCol, setYCol] = useState(defaults.y);

  // Reset axis selection when a new dataset is loaded.
  useEffect(() => {
    setXCol(defaults.x);
    setYCol(defaults.y);
  }, [defaults]);

  const rows = useMemo(() => applyFilters(data.rows, filters), [data.rows, filters]);

  const coerce = (v: unknown): number =>
    typeof v === "number" ? v : v instanceof Date ? v.getTime() : Number(v) || 0;
  const xString = (d: DataRow): string => String(d[xCol]);
  const xNumeric = (d: DataRow): number => coerce(d[xCol]);
  const xAny = (d: DataRow): Date | number | string => {
    const v = d[xCol];
    if (v instanceof Date) return v;
    const n = Number(v);
    return v === "" || Number.isNaN(n) ? String(v) : n;
  };
  const yAccessor = (d: DataRow): number => coerce(d[yCol]);

  const xType = data.types[xCol] === "date" ? "time" : "linear";

  const shared = {
    data: rows,
    height: 360,
    title: `${yCol} by ${xCol}`,
    description: `${data.fileName} · ${rows.length} of ${data.rows.length} rows shown`,
    yLabel: yCol,
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

        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <AxisSelect label="X" value={xCol} options={data.columns} onChange={setXCol} />
          <AxisSelect label="Y" value={yCol} options={data.columns} onChange={setYCol} />
        </div>
      </div>

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
          {chartType === "line" && <LineChart {...shared} x={xAny} y={yAccessor} xType={xType} />}
          {chartType === "area" && <AreaChart {...shared} x={xAny} y={yAccessor} xType={xType} />}
          {chartType === "scatter" && (
            <ScatterPlot {...shared} x={xNumeric} y={yAccessor} xLabel={xCol} />
          )}
        </>
      )}
    </div>
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
