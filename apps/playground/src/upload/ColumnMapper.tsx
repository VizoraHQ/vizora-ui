import { useState } from "react";
import { BarChart, LineChart, AreaChart, ScatterPlot } from "@vizora/charts";
import { suggestChartType } from "./parseFile";
import type { Row, ChartSuggestion } from "./parseFile";

interface Props {
  rows: Row[];
  fileName: string;
  onReset: () => void;
}

const CHART_TYPES: { value: ChartSuggestion; label: string }[] = [
  { value: "line", label: "Line" },
  { value: "area", label: "Area" },
  { value: "bar", label: "Bar" },
  { value: "scatter", label: "Scatter" },
];

export function ColumnMapper({ rows, fileName, onReset }: Props) {
  const columns = Object.keys(rows[0] ?? {});
  const [xCol, setXCol] = useState(columns[0] ?? "");
  const [yCol, setYCol] = useState(columns[1] ?? "");
  const [seriesCol, setSeriesCol] = useState<string>("");
  const [chartType, setChartType] = useState<ChartSuggestion>(
    () => suggestChartType(rows, columns[0] ?? "", columns[1] ?? ""),
  );

  const coerce = (v: unknown): number =>
    typeof v === "number" ? v : parseFloat(String(v)) || 0;

  const xString = (d: Row): string => String(d[xCol]);
  const xNumeric = (d: Row): number => coerce(d[xCol]);
  const xAny = (d: Row): Date | number | string => {
    const v = d[xCol];
    if (v instanceof Date) return v;
    const n = parseFloat(String(v));
    return isNaN(n) ? String(v) : n;
  };

  const yAccessor = (d: Row): number => coerce(d[yCol]);
  const seriesAccessor = seriesCol ? (d: Row): string => String(d[seriesCol]) : undefined;

  const sharedProps = {
    data: rows,
    series: seriesAccessor,
    height: 340,
    title: `${yCol} by ${xCol}`,
    description: `Uploaded from ${fileName}`,
    yLabel: yCol,
  };

  return (
    <div style={{ padding: "32px 40px 64px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 1.4, color: "var(--vz-muted)", textTransform: "uppercase" }}>
            Vizora · file upload
          </div>
          <h1 style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 600 }}>{fileName}</h1>
          <div style={{ fontSize: 12, color: "var(--vz-muted)", marginTop: 4 }}>
            {rows.length.toLocaleString()} rows · {columns.length} columns
          </div>
        </div>
        <button
          onClick={onReset}
          style={{
            background: "var(--vz-surface)",
            color: "var(--vz-fg)",
            border: "1px solid var(--vz-border)",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          ← Upload another
        </button>
      </div>

      {/* Controls */}
      <div
        className="vz-card"
        style={{ padding: 20, marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}
      >
        <Field label="X axis">
          <Select value={xCol} options={columns} onChange={(v) => {
            setXCol(v);
            setChartType(suggestChartType(rows, v, yCol));
          }} />
        </Field>
        <Field label="Y axis">
          <Select value={yCol} options={columns} onChange={(v) => {
            setYCol(v);
            setChartType(suggestChartType(rows, xCol, v));
          }} />
        </Field>
        <Field label="Series (optional)">
          <Select value={seriesCol} options={["(none)", ...columns]} onChange={(v) => setSeriesCol(v === "(none)" ? "" : v)} />
        </Field>
        <Field label="Chart type">
          <Select
            value={chartType}
            options={CHART_TYPES.map((c) => c.value)}
            labels={CHART_TYPES.map((c) => c.label)}
            onChange={(v) => setChartType(v as ChartSuggestion)}
          />
        </Field>
      </div>

      {/* Chart */}
      <div className="vz-card" style={{ padding: 20 }}>
        {chartType === "line" && <LineChart {...sharedProps} x={xAny} y={yAccessor} />}
        {chartType === "area" && <AreaChart {...sharedProps} x={xAny} y={yAccessor} />}
        {chartType === "bar" && <BarChart {...sharedProps} x={xString} y={yAccessor} />}
        {chartType === "scatter" && (
          <ScatterPlot
            {...sharedProps}
            x={xNumeric}
            y={yAccessor}
            xLabel={xCol}
          />
        )}
      </div>

      {/* Data preview */}
      <details style={{ marginTop: 16 }}>
        <summary style={{ fontSize: 12, color: "var(--vz-muted)", cursor: "pointer", userSelect: "none" }}>
          Preview first 5 rows
        </summary>
        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={{ fontSize: 11, borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c} style={{ padding: "4px 10px", textAlign: "left", borderBottom: "1px solid var(--vz-border)", color: "var(--vz-muted)", fontWeight: 600 }}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 5).map((row, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c} style={{ padding: "4px 10px", borderBottom: "1px solid var(--vz-border)", color: "var(--vz-fg)" }}>
                      {String(row[c] instanceof Date ? (row[c] as Date).toLocaleDateString() : row[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
      <label style={{ fontSize: 11, color: "var(--vz-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.8 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  value,
  options,
  labels,
  onChange,
}: {
  value: string;
  options: string[];
  labels?: string[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        background: "var(--vz-bg)",
        color: "var(--vz-fg)",
        border: "1px solid var(--vz-border)",
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: 12,
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      {options.map((opt, i) => (
        <option key={opt} value={opt}>
          {labels?.[i] ?? opt}
        </option>
      ))}
    </select>
  );
}
