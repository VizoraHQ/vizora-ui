import Papa from "papaparse";
import * as XLSX from "xlsx";

/** A single record from an uploaded dataset. */
export type DataRow = Record<string, unknown>;

/** Inferred semantic type of a column. */
export type ColumnType = "numeric" | "categorical" | "date";

/** Result of parsing an uploaded file. */
export interface ParsedData {
  columns: string[];
  rows: DataRow[];
  types: Record<string, ColumnType>;
  fileName: string;
}

/** Chart types the Data Explorer can render. */
export type ChartType = "bar" | "line" | "area" | "scatter";

/** Comparison operators the filter engine (and the AI assistant) understands. */
export type Operator = ">" | "<" | "=" | ">=" | "<=" | "contains" | "startsWith";

export const OPERATORS: Operator[] = [">", "<", "=", ">=", "<=", "contains", "startsWith"];

/** A single active filter applied to the dataset. */
export interface Filter {
  column: string;
  operator: Operator;
  value: string | number;
}

/** One turn in the AI assistant conversation. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUPPORTED_EXTENSIONS = ["csv", "xlsx", "xls"] as const;

// Date-shaped strings (ISO `2026-01-15`, US `1/15/2026`, etc). Requiring a
// separator avoids misreading bare numbers like years as dates.
const DATE_LIKE = /^\d{4}-\d{1,2}-\d{1,2}|^\d{1,2}\/\d{1,2}\/\d{2,4}/;

function looksLikeDate(v: unknown): boolean {
  if (v instanceof Date) return true;
  if (typeof v !== "string") return false;
  return DATE_LIKE.test(v.trim()) && !Number.isNaN(Date.parse(v));
}

function isNumericValue(v: unknown): boolean {
  if (typeof v === "number") return true;
  return typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v));
}

/**
 * Infer the semantic type of a column by sampling its values.
 * Dates win over numbers; numbers win over everything else. CSV date columns
 * arrive as strings, so date detection is string-aware (not just `instanceof Date`).
 */
export function inferColumnType(rows: DataRow[], col: string): ColumnType {
  const samples = rows
    .slice(0, 25)
    .map((r) => r[col])
    .filter((v) => v !== "" && v != null);
  if (samples.length === 0) return "categorical";

  if (samples.filter(looksLikeDate).length > samples.length / 2) return "date";
  if (samples.filter(isNumericValue).length > samples.length / 2) return "numeric";

  return "categorical";
}

function buildTypes(rows: DataRow[], columns: string[]): Record<string, ColumnType> {
  const types: Record<string, ColumnType> = {};
  for (const col of columns) types[col] = inferColumnType(rows, col);
  return types;
}

function shapeResult(rows: DataRow[], fileName: string): ParsedData {
  const columns = Object.keys(rows[0] ?? {});
  return { columns, rows, types: buildTypes(rows, columns), fileName };
}

/** Parse a CSV file with PapaParse (header row + dynamic typing). */
async function parseCsv(file: File): Promise<DataRow[]> {
  const text = await file.text();
  const result = Papa.parse<DataRow>(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return result.data;
}

/** Parse an Excel workbook (first sheet) with SheetJS. */
async function parseExcel(file: File): Promise<DataRow[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];
  const ws = wb.Sheets[sheetName];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json<DataRow>(ws, { defval: "" });
}

/**
 * Parse an uploaded CSV/Excel file into a normalized {@link ParsedData} shape.
 * Throws if the extension is unsupported or the file yields no rows.
 */
export async function parseDataFile(file: File): Promise<ParsedData> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!SUPPORTED_EXTENSIONS.includes(ext as (typeof SUPPORTED_EXTENSIONS)[number])) {
    throw new Error("Only .csv, .xlsx, and .xls files are supported.");
  }

  const rows = ext === "csv" ? await parseCsv(file) : await parseExcel(file);
  if (rows.length === 0) throw new Error("The file appears to be empty.");

  return shapeResult(rows, file.name);
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (v instanceof Date) return v.getTime();
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/** Evaluate a single filter against one row's value. */
function matches(value: unknown, op: Operator, target: string | number): boolean {
  switch (op) {
    case ">":
    case "<":
    case ">=":
    case "<=": {
      const a = toNumber(value);
      const b = toNumber(target);
      if (a === null || b === null) return false;
      if (op === ">") return a > b;
      if (op === "<") return a < b;
      if (op === ">=") return a >= b;
      return a <= b;
    }
    case "=": {
      const a = toNumber(value);
      const b = toNumber(target);
      if (a !== null && b !== null) return a === b;
      return String(value).toLowerCase() === String(target).toLowerCase();
    }
    case "contains":
      return String(value).toLowerCase().includes(String(target).toLowerCase());
    case "startsWith":
      return String(value).toLowerCase().startsWith(String(target).toLowerCase());
    default:
      return true;
  }
}

/** Return only the rows that satisfy every active filter (logical AND). */
export function applyFilters(rows: DataRow[], filters: Filter[]): DataRow[] {
  if (filters.length === 0) return rows;
  return rows.filter((row) => filters.every((f) => matches(row[f.column], f.operator, f.value)));
}

/** Reducers the aggregate engine supports. */
export type AggregateOp = "sum" | "avg" | "count" | "min" | "max";

/** Granularity for bucketing a date group-by column. */
export type DateBucket = "day" | "month" | "year";

export const AGGREGATE_OPS: AggregateOp[] = ["sum", "avg", "count", "min", "max"];
export const DATE_BUCKETS: DateBucket[] = ["day", "month", "year"];

/** A group-by + measure aggregation request. */
export interface Aggregation {
  /** Column whose distinct values become the groups (X axis). */
  groupBy: string;
  /** Numeric column being summarized. Ignored when {@link op} is `count`. */
  measure: string;
  op: AggregateOp;
  /** Only meaningful when {@link groupBy} is a date column. */
  bucket?: DateBucket;
}

/** Chart-ready output of {@link aggregate}: rows plus the key names to plot. */
export interface AggregatedResult {
  rows: DataRow[];
  groupKey: string;
  valueKey: string;
}

/** Human-readable name for the aggregated value column, e.g. "sum of DR". */
export function aggregateValueKey(agg: Aggregation): string {
  return agg.op === "count" ? "count" : `${agg.op} of ${agg.measure}`;
}

function toDate(v: unknown): Date | null {
  if (v instanceof Date) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Zero-padded, lexicographically-sortable bucket key for a date value. */
function bucketKey(v: unknown, bucket: DateBucket): string {
  const d = toDate(v);
  if (!d) return String(v ?? "");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  if (bucket === "year") return String(y);
  if (bucket === "month") return `${y}-${m}`;
  return `${y}-${m}-${day}`;
}

interface Bucket {
  sum: number;
  count: number;
  min: number;
  max: number;
  order: number;
}

/**
 * Group `rows` by `agg.groupBy` and reduce `agg.measure` with `agg.op`.
 * Date group-by columns are bucketed by `agg.bucket` (default day) and sorted
 * chronologically; other columns keep first-encounter order. Returns rows
 * shaped `{ [groupBy]: label, [valueKey]: number }` ready to chart.
 */
export function aggregate(rows: DataRow[], agg: Aggregation): AggregatedResult {
  const valueKey = aggregateValueKey(agg);
  const groups = new Map<string, Bucket>();
  let order = 0;

  for (const row of rows) {
    const raw = row[agg.groupBy];
    const key = agg.bucket ? bucketKey(raw, agg.bucket) : String(raw ?? "");
    let g = groups.get(key);
    if (!g) {
      g = { sum: 0, count: 0, min: Infinity, max: -Infinity, order: order++ };
      groups.set(key, g);
    }
    g.count += 1;
    if (agg.op !== "count") {
      const n = toNumber(row[agg.measure]);
      if (n !== null) {
        g.sum += n;
        if (n < g.min) g.min = n;
        if (n > g.max) g.max = n;
      }
    }
  }

  const reduce = (g: Bucket): number => {
    switch (agg.op) {
      case "count":
        return g.count;
      case "avg":
        return g.count ? g.sum / g.count : 0;
      case "min":
        return g.min === Infinity ? 0 : g.min;
      case "max":
        return g.max === -Infinity ? 0 : g.max;
      default:
        return g.sum;
    }
  };

  const out = [...groups.entries()].map(([key, g]) => ({
    key,
    order: g.order,
    value: reduce(g),
  }));

  // Date buckets sort chronologically (keys are zero-padded); else encounter order.
  out.sort((a, b) => (agg.bucket ? a.key.localeCompare(b.key) : a.order - b.order));

  return {
    rows: out.map((r) => ({ [agg.groupBy]: r.key, [valueKey]: r.value })),
    groupKey: agg.groupBy,
    valueKey,
  };
}

/** One ranked group's contribution to the aggregated total. */
export interface ParetoSegment {
  label: string;
  value: number;
  /** This group's fraction of the total, 0..1. */
  share: number;
  /** Running fraction of the total through this group (inclusive), 0..1. */
  cumulative: number;
}

/** A Pareto / contribution breakdown: groups ranked by share of the whole. */
export interface Pareto {
  /** Groups sorted by descending value. */
  segments: ParetoSegment[];
  total: number;
  /** Plain-English headline, e.g. "61% of the total came from Rent and Groceries." */
  insight: string;
}

/**
 * Contribution analysis only reads sensibly for additive measures, so it's
 * offered for `sum`/`count` category breakdowns — not averages, extremes, or
 * date trends (those are about shape over time, not share of a whole).
 */
export function supportsPareto(agg: Aggregation): boolean {
  return (agg.op === "sum" || agg.op === "count") && !agg.bucket;
}

/** Join names as "A", "A and B", or "A, B and C". */
function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

function paretoInsight(segments: ParetoSegment[]): string {
  const first = segments[0];
  if (!first) return "No positive values to summarize.";
  if (segments.length === 1) return `All of it came from ${first.label}.`;

  // Fewest leading groups whose combined share crosses a clear majority (60%),
  // capped at 3 so the sentence stays readable.
  const cap = Math.min(3, segments.length);
  let k = 1;
  while (k < cap && (segments[k - 1]?.cumulative ?? 1) < 0.6) k += 1;

  const leaders = segments.slice(0, k);
  const pct = Math.round((leaders[leaders.length - 1]?.cumulative ?? 0) * 100);
  return `${pct}% of the total came from ${formatList(leaders.map((s) => s.label))}.`;
}

/**
 * Rank an {@link aggregate} result by each group's share of the total
 * (descending) and derive a one-line "where it concentrates" insight.
 * Non-positive contributions are dropped — share-of-total is only meaningful
 * for the positive parts of the whole.
 */
export function computePareto(result: AggregatedResult): Pareto {
  const ranked = result.rows
    .map((r) => ({ label: String(r[result.groupKey]), value: Number(r[result.valueKey]) || 0 }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = ranked.reduce((acc, s) => acc + s.value, 0);
  let running = 0;
  const segments: ParetoSegment[] = ranked.map((s) => {
    running += s.value;
    return {
      label: s.label,
      value: s.value,
      share: total ? s.value / total : 0,
      cumulative: total ? running / total : 0,
    };
  });

  return { segments, total, insight: paretoInsight(segments) };
}
