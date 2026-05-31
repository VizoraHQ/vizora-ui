import { useMemo, useState } from "react";
import type { ThemeName } from "@vizora/themes";
import { FileUpload } from "../components/data-explorer/FileUpload";
import { FilterSidebar } from "../components/data-explorer/FilterSidebar";
import { ChartView } from "../components/data-explorer/ChartView";
import { ChatPanel } from "../components/data-explorer/ChatPanel";
import { applyFilters } from "../components/data-explorer/parse";
import type {
  Aggregation,
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

interface DataExplorerProps {
  theme: ThemeName;
  onTheme: (t: ThemeName) => void;
}

export function DataExplorer({ theme, onTheme }: DataExplorerProps) {
  const [data, setData] = useState<ParsedData | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [aggregation, setAggregation] = useState<Aggregation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  function handleParsed(parsed: ParsedData) {
    setData(parsed);
    setFilters([]);
    setAggregation(null);
    setMessages([]);
    setChartType(suggestChart(parsed));
  }

  const addFilter = (f: Filter) => setFilters((prev) => [...prev, f]);
  const removeFilter = (i: number) => setFilters((prev) => prev.filter((_, idx) => idx !== i));
  const resetFilters = () => setFilters([]);

  // The AI sets an aggregation; pick the chart that reads best for the shape —
  // a line for date buckets (a trend) and bars for category breakdowns.
  const applyAggregation = (agg: Aggregation) => {
    setAggregation(agg);
    setChartType(agg.bucket ? "line" : "bar");
  };

  // "Reset" from the assistant clears both filters and aggregation.
  const resetAll = () => {
    setFilters([]);
    setAggregation(null);
  };

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
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--vz-fg)" }}>Vizora</div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 1.4,
              color: "var(--vz-muted)",
              textTransform: "uppercase",
              marginBottom: 12,
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
        <ThemeSwitch theme={theme} onTheme={onTheme} />
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
                aggregation={aggregation}
                onClearAggregation={() => setAggregation(null)}
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
            rows={filteredRows}
            messages={messages}
            onMessagesChange={setMessages}
            onAddFilter={addFilter}
            onSetChartType={setChartType}
            onResetFilters={resetAll}
            onAggregate={applyAggregation}
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

function ThemeSwitch({ theme, onTheme }: DataExplorerProps) {
  return (
    <div style={{ marginTop: "auto" }}>
      <div
        style={{
          fontSize: 10,
          color: "var(--vz-muted)",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 6,
        }}
      >
        Theme
      </div>
      <div role="tablist" aria-label="Theme" style={{ display: "flex", gap: 4 }}>
        {(["dark", "light", "midnight"] as const).map((t) => {
          const active = theme === t;
          return (
            <button
              key={t}
              role="tab"
              aria-selected={active}
              onClick={() => onTheme(t)}
              style={{
                flex: 1,
                background: active ? "var(--vz-accent)" : "var(--vz-bg)",
                color: active ? "white" : "var(--vz-fg)",
                border: "1px solid var(--vz-border)",
                borderRadius: 8,
                padding: "6px 4px",
                fontSize: 11,
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
    </div>
  );
}

const HERO_STEPS = [
  { n: "1", color: "var(--vz-series-1)", title: "Upload", body: "Drop a CSV or Excel file — columns are typed automatically." },
  { n: "2", color: "var(--vz-series-3)", title: "Visualize", body: "It auto-charts as bar, line, area, or scatter on render." },
  { n: "3", color: "var(--vz-series-4)", title: "Ask", body: "Filter, aggregate, and interrogate it in plain English." },
];

const HERO_STACK = [
  { label: "React + TypeScript", color: "var(--vz-series-1)" },
  { label: "@vizora/charts", color: "var(--vz-series-2)" },
  { label: "PapaParse + SheetJS", color: "var(--vz-series-3)" },
  { label: "Claude", color: "var(--vz-series-4)" },
];

const HERO_PROMPTS = [
  "where did the money go?",
  "total spend by category",
  "only rows where amount > 500",
];

const HERO_CSS = `
.vz-hero{position:relative;width:100%;min-height:100%;display:flex;flex-direction:column;
  align-items:center;justify-content:center;padding:48px 24px;box-sizing:border-box;overflow:hidden}
.vz-hero__bg{position:absolute;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(620px 360px at 28% 12%, color-mix(in srgb, var(--vz-accent) 16%, transparent), transparent 70%),
    radial-gradient(560px 420px at 82% 88%, color-mix(in srgb, var(--vz-series-2) 14%, transparent), transparent 70%),
    linear-gradient(transparent 95%, color-mix(in srgb, var(--vz-border) 60%, transparent) 95%) 0 0/100% 34px,
    linear-gradient(90deg, transparent 95%, color-mix(in srgb, var(--vz-border) 60%, transparent) 95%) 0 0/34px 100%;
  mask-image:radial-gradient(80% 70% at 50% 40%, #000 30%, transparent 100%)}
.vz-hero__inner{position:relative;z-index:1;width:100%;max-width:760px;text-align:center}
.vz-rise{opacity:0;animation:vzRise var(--vz-duration-slow,420ms) var(--vz-ease,ease) forwards}
@keyframes vzRise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes vzNudge{0%,100%{transform:translateX(0)}50%{transform:translateX(-7px)}}
.vz-hero__arrow{animation:vzNudge 1.7s ease-in-out infinite}
.vz-step,.vz-chip{transition:transform var(--vz-duration-base,220ms) var(--vz-ease),border-color var(--vz-duration-base,220ms)}
.vz-step:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--vz-accent) 55%,var(--vz-border))}
.vz-chip:hover{transform:translateY(-2px);border-color:var(--vz-accent);color:var(--vz-fg)}
`;

function EmptyState() {
  return (
    <div className="vz-hero">
      <style>{HERO_CSS}</style>
      <div className="vz-hero__bg" />

      <div className="vz-hero__inner">
        {/* Eyebrow */}
        <div
          className="vz-rise"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--vz-font-mono)",
            fontSize: 11,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: "var(--vz-muted)",
            border: "1px solid var(--vz-border)",
            borderRadius: 999,
            padding: "5px 12px",
            background: "color-mix(in srgb, var(--vz-surface) 70%, transparent)",
            animationDelay: "0ms",
          }}
        >
          <span style={{ color: "var(--vz-accent)" }}>◆</span> Vizora · Data Explorer
        </div>

        {/* Headline */}
        <h1
          className="vz-rise"
          style={{
            margin: "20px 0 0",
            fontSize: "clamp(30px, 5vw, 46px)",
            lineHeight: 1.05,
            fontWeight: 800,
            letterSpacing: -1,
            color: "var(--vz-fg)",
            animationDelay: "70ms",
          }}
        >
          Spreadsheets in.{" "}
          <span
            style={{
              background: "linear-gradient(100deg, var(--vz-accent), var(--vz-series-2))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Insights out.
          </span>
        </h1>

        {/* One-liner: what it does */}
        <p
          className="vz-rise"
          style={{
            margin: "16px auto 0",
            maxWidth: 540,
            fontSize: 15,
            lineHeight: 1.6,
            color: "var(--vz-muted)",
            animationDelay: "130ms",
          }}
        >
          A live demo of the <strong style={{ color: "var(--vz-fg)", fontWeight: 600 }}>Vizora</strong>{" "}
          chart library: turn a raw CSV or Excel file into charts you can filter, aggregate, and ask
          questions about in plain English — no setup, no formulas.
        </p>

        {/* How it works */}
        <div
          className="vz-rise"
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            margin: "32px 0 0",
            animationDelay: "190ms",
          }}
        >
          {HERO_STEPS.map((s) => (
            <div
              key={s.n}
              className="vz-step"
              style={{
                flex: "1 1 180px",
                maxWidth: 230,
                textAlign: "left",
                background: "var(--vz-surface)",
                border: "1px solid var(--vz-border)",
                borderRadius: 12,
                padding: "14px 16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "white",
                  background: s.color,
                  marginBottom: 10,
                }}
              >
                {s.n}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--vz-fg)" }}>{s.title}</div>
              <div style={{ fontSize: 12, lineHeight: 1.5, color: "var(--vz-muted)", marginTop: 3 }}>
                {s.body}
              </div>
            </div>
          ))}
        </div>

        {/* The kept CTA — points to the upload zone in the sidebar */}
        <div
          className="vz-rise"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            margin: "28px auto 0",
            maxWidth: 480,
            background: "color-mix(in srgb, var(--vz-accent) 7%, var(--vz-surface))",
            border: "1px dashed color-mix(in srgb, var(--vz-accent) 55%, var(--vz-border))",
            borderRadius: 14,
            padding: "16px 20px",
            textAlign: "left",
            animationDelay: "250ms",
          }}
        >
          <div
            className="vz-hero__arrow"
            aria-hidden
            style={{ fontSize: 22, color: "var(--vz-accent)", flexShrink: 0 }}
          >
            ←
          </div>
          <div style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>📊</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "var(--vz-fg)" }}>
              Upload a CSV or Excel file
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--vz-muted)" }}>
              Drop a file in the left sidebar to visualize it, filter it, and explore it with the
              AI analyst.
            </p>
          </div>
        </div>

        {/* Try-it prompts */}
        <div
          className="vz-rise"
          style={{ margin: "24px 0 0", animationDelay: "310ms" }}
        >
          <div
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
              color: "var(--vz-muted)",
              marginBottom: 10,
            }}
          >
            Then try asking
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {HERO_PROMPTS.map((p) => (
              <span
                key={p}
                className="vz-chip"
                style={{
                  fontFamily: "var(--vz-font-mono)",
                  fontSize: 12,
                  color: "var(--vz-muted)",
                  background: "var(--vz-surface)",
                  border: "1px solid var(--vz-border)",
                  borderRadius: 999,
                  padding: "6px 12px",
                  cursor: "default",
                }}
              >
                “{p}”
              </span>
            ))}
          </div>
        </div>

        {/* Powered-by stack */}
        <div
          className="vz-rise"
          style={{
            display: "flex",
            gap: "8px 16px",
            justifyContent: "center",
            flexWrap: "wrap",
            margin: "36px 0 0",
            paddingTop: 20,
            borderTop: "1px solid var(--vz-border)",
            animationDelay: "370ms",
          }}
        >
          {HERO_STACK.map((b) => (
            <span
              key={b.label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 11.5,
                color: "var(--vz-muted)",
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: b.color }} />
              {b.label}
            </span>
          ))}
        </div>
      </div>
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
