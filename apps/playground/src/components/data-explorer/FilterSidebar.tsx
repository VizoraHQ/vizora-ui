import { useState } from "react";
import { OPERATORS } from "./parse";
import type { Filter, Operator, ParsedData } from "./parse";

interface Props {
  data: ParsedData;
  filters: Filter[];
  onAdd: (filter: Filter) => void;
  onRemove: (index: number) => void;
  onReset: () => void;
}

const selectStyle = {
  background: "var(--vz-bg)",
  color: "var(--vz-fg)",
  border: "1px solid var(--vz-border)",
  borderRadius: 6,
  padding: "5px 8px",
  fontSize: 12,
  fontFamily: "inherit",
  width: "100%",
  boxSizing: "border-box" as const,
};

export function FilterSidebar({ data, filters, onAdd, onRemove, onReset }: Props) {
  const [column, setColumn] = useState(data.columns[0] ?? "");
  const [operator, setOperator] = useState<Operator>(">");
  const [value, setValue] = useState("");

  function add() {
    if (!column || value.trim() === "") return;
    const numeric = data.types[column] === "numeric" && !Number.isNaN(Number(value));
    onAdd({ column, operator, value: numeric ? Number(value) : value });
    setValue("");
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            color: "var(--vz-muted)",
          }}
        >
          Filters
        </span>
        {filters.length > 0 && (
          <button
            onClick={onReset}
            style={{
              background: "none",
              border: "none",
              color: "var(--vz-accent)",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: "inherit",
              padding: 0,
            }}
          >
            Reset all
          </button>
        )}
      </div>

      {filters.length === 0 ? (
        <div style={{ fontSize: 11, color: "var(--vz-muted)", marginBottom: 12 }}>No active filters.</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
          {filters.map((f, i) => (
            <span
              key={`${f.column}-${f.operator}-${i}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                padding: "3px 6px 3px 8px",
                borderRadius: 999,
                background: "color-mix(in srgb, var(--vz-accent) 14%, transparent)",
                border: "1px solid color-mix(in srgb, var(--vz-accent) 40%, transparent)",
                color: "var(--vz-fg)",
              }}
            >
              <span>
                {f.column} {f.operator} {String(f.value)}
              </span>
              <button
                onClick={() => onRemove(i)}
                aria-label={`Remove filter ${f.column} ${f.operator} ${f.value}`}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--vz-muted)",
                  cursor: "pointer",
                  fontSize: 12,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <select value={column} onChange={(e) => setColumn(e.target.value)} style={selectStyle} aria-label="Filter column">
          {data.columns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={operator}
          onChange={(e) => setOperator(e.target.value as Operator)}
          style={selectStyle}
          aria-label="Filter operator"
        >
          {OPERATORS.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="value"
          aria-label="Filter value"
          style={selectStyle}
        />
        <button
          onClick={add}
          style={{
            background: "var(--vz-accent)",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Add filter
        </button>
      </div>
    </div>
  );
}
