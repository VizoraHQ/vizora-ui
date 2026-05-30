import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { parseDataFile } from "./parse";
import type { ColumnType, ParsedData } from "./parse";

interface Props {
  data: ParsedData | null;
  onParsed: (data: ParsedData) => void;
}

const TYPE_COLOR: Record<ColumnType, string> = {
  numeric: "var(--vz-series-1)",
  categorical: "var(--vz-series-3)",
  date: "var(--vz-series-5)",
};

export function FileUpload({ data, onParsed }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    setError(null);
    setLoading(true);
    try {
      onParsed(await parseDataFile(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not parse the file.");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handle(file);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handle(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        aria-label="Upload a CSV or Excel file"
        style={{
          border: `2px dashed ${dragging ? "var(--vz-accent)" : "var(--vz-border)"}`,
          borderRadius: 12,
          padding: "24px 16px",
          textAlign: "center",
          cursor: loading ? "wait" : "pointer",
          background: dragging
            ? "color-mix(in srgb, var(--vz-accent) 8%, transparent)"
            : "var(--vz-surface)",
          transition: "border-color 0.15s, background 0.15s",
        }}
      >
        <div style={{ fontSize: 28, marginBottom: 6 }}>📂</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--vz-fg)", marginBottom: 4 }}>
          {loading ? "Parsing…" : data ? "Replace dataset" : "Drop a file"}
        </div>
        <div style={{ fontSize: 11, color: "var(--vz-muted)" }}>or click · .csv, .xlsx, .xls</div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={onChange}
        />
      </div>

      {error && <div style={{ marginTop: 8, fontSize: 12, color: "#f87171" }}>{error}</div>}

      {data && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, color: "var(--vz-muted)", marginBottom: 8 }}>
            <strong style={{ color: "var(--vz-fg)" }}>{data.rows.length.toLocaleString()}</strong> rows ·{" "}
            <strong style={{ color: "var(--vz-fg)" }}>{data.columns.length}</strong> columns
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.columns.map((col) => (
              <div
                key={col}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    color: "var(--vz-fg)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={col}
                >
                  {col}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 9,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    padding: "1px 6px",
                    borderRadius: 999,
                    color: TYPE_COLOR[data.types[col] ?? "categorical"],
                    border: `1px solid ${TYPE_COLOR[data.types[col] ?? "categorical"]}`,
                    background: "color-mix(in srgb, currentColor 10%, transparent)",
                  }}
                >
                  {data.types[col]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
