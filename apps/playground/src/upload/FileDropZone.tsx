import { useRef, useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { parseFile } from "./parseFile";
import type { Row } from "./parseFile";

interface Props {
  onParsed: (rows: Row[], fileName: string) => void;
}

export function FileDropZone({ onParsed }: Props) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handle(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(ext ?? "")) {
      setError("Only .csv, .xlsx, and .xls files are supported.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) {
        setError("The file appears to be empty.");
        return;
      }
      onParsed(rows, file.name);
    } catch {
      setError("Could not parse the file. Make sure it's a valid spreadsheet.");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handle(file);
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handle(file);
  }

  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        aria-label="Upload a CSV or Excel file"
        style={{
          border: `2px dashed ${dragging ? "var(--vz-accent)" : "var(--vz-border)"}`,
          borderRadius: 16,
          padding: "48px 32px",
          cursor: loading ? "wait" : "pointer",
          background: dragging ? "color-mix(in srgb, var(--vz-accent) 8%, transparent)" : "var(--vz-surface)",
          transition: "border-color 0.15s, background 0.15s",
          maxWidth: 480,
          margin: "0 auto",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--vz-fg)", marginBottom: 6 }}>
          {loading ? "Parsing file…" : "Drop a file here"}
        </div>
        <div style={{ fontSize: 12, color: "var(--vz-muted)" }}>
          or click to browse · .csv, .xlsx, .xls
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          style={{ display: "none" }}
          onChange={onChange}
        />
      </div>
      {error && (
        <div style={{ marginTop: 12, fontSize: 13, color: "#f87171" }}>{error}</div>
      )}
    </div>
  );
}
