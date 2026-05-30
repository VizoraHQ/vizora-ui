import { useMemo, useState } from "react";
import { FileUpload } from "../components/data-explorer/FileUpload";
import { FilterSidebar } from "../components/data-explorer/FilterSidebar";
import { ChartView } from "../components/data-explorer/ChartView";
import { ChatPanel } from "../components/data-explorer/ChatPanel";
import { applyFilters } from "../components/data-explorer/parse";
import type {
  ChartType,
  ChatMessage,
  Filter,
  ParsedData,
} from "../components/data-explorer/parse";

function suggestChart(data: ParsedData): ChartType {
  const categorical = data.columns.find((c) => data.types[c] === "categorical");
  const firstNumeric = data.columns.find((c) => data.types[c] === "numeric");
  const firstDate = data.columns.find((c) => data.types[c] === "date");
  if (categorical && firstNumeric) return "bar";
  if (firstDate && firstNumeric) return "line";
  return "bar";
}

export function DataExplorer() {
  const [data, setData] = useState<ParsedData | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  function handleParsed(parsed: ParsedData) {
    setData(parsed);
    setFilters([]);
    setMessages([]);
    setChartType(suggestChart(parsed));
  }

  const addFilter = (f: Filter) => setFilters((prev) => [...prev, f]);
  const removeFilter = (i: number) => setFilters((prev) => prev.filter((_, idx) => idx !== i));
  const resetFilters = () => setFilters([]);

  const filteredRows = useMemo(
    () => (data ? applyFilters(data.rows, filters) : []),
    [data, filters],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "240px minmax(0, 1fr) 360px",
        height: "100vh",
        fontFamily: "var(--vz-font-sans)",
      }}
    >
      {/* Left sidebar: upload + filters */}
      <div
        style={{
          borderRight: "1px solid var(--vz-border)",
          padding: 16,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.4,
              color: "var(--vz-muted)",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            Data Explorer
          </div>
          <FileUpload data={data} onParsed={handleParsed} />
        </div>
        {data && (
          <FilterSidebar
            data={data}
            filters={filters}
            onAdd={addFilter}
            onRemove={removeFilter}
            onReset={resetFilters}
          />
        )}
      </div>

      {/* Main area: chart + preview */}
      <div style={{ overflowY: "auto", padding: 24 }}>
        {!data ? (
          <EmptyState />
        ) : (
          <>
            <div className="vz-card" style={{ padding: 20, marginBottom: 16 }}>
              <ChartView
                data={data}
                filters={filters}
                chartType={chartType}
                onChartTypeChange={setChartType}
              />
            </div>
            <DataPreview data={data} rows={filteredRows} />
          </>
        )}
      </div>

      {/* Right panel: AI chat */}
      <div style={{ height: "100vh", overflow: "hidden" }}>
        {data ? (
          <ChatPanel
            data={data}
            messages={messages}
            onMessagesChange={setMessages}
            onAddFilter={addFilter}
            onSetChartType={setChartType}
            onResetFilters={resetFilters}
          />
        ) : (
          <div
            style={{
              height: "100%",
              borderLeft: "1px solid var(--vz-border)",
              background: "var(--vz-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              textAlign: "center",
              color: "var(--vz-muted)",
              fontSize: 12,
            }}
          >
            Upload a dataset to chat with the AI analyst.
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--vz-muted)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 44, marginBottom: 12 }}>📊</div>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--vz-fg)" }}>
        Upload a CSV or Excel file
      </h2>
      <p style={{ margin: "8px 0 0", fontSize: 13, maxWidth: 360 }}>
        Drop a file in the left sidebar to visualize it, filter it, and explore it with the
        AI analyst.
      </p>
    </div>
  );
}

function DataPreview({ data, rows }: { data: ParsedData; rows: ReturnType<typeof applyFilters> }) {
  const preview = rows.slice(0, 10);
  return (
    <details className="vz-card" style={{ padding: 16 }} open>
      <summary
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "var(--vz-fg)",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        Data preview · {rows.length.toLocaleString()} rows
        {rows.length !== data.rows.length ? ` (of ${data.rows.length.toLocaleString()})` : ""}
      </summary>
      <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ fontSize: 11, borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              {data.columns.map((c) => (
                <th
                  key={c}
                  style={{
                    padding: "6px 10px",
                    textAlign: "left",
                    borderBottom: "1px solid var(--vz-border)",
                    color: "var(--vz-muted)",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, i) => (
              <tr key={i}>
                {data.columns.map((c) => (
                  <td
                    key={c}
                    style={{
                      padding: "6px 10px",
                      borderBottom: "1px solid var(--vz-border)",
                      color: "var(--vz-fg)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {String(row[c] instanceof Date ? (row[c] as Date).toLocaleDateString() : row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
