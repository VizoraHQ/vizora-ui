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

/**
 * Infer the semantic type of a column by sampling its values.
 * Dates win over numbers; numbers win over everything else.
 */
export function inferColumnType(rows: DataRow[], col: string): ColumnType {
  const samples = rows
    .slice(0, 25)
    .map((r) => r[col])
    .filter((v) => v !== "" && v != null);
  if (samples.length === 0) return "categorical";

  const dates = samples.filter((v) => v instanceof Date).length;
  if (dates > samples.length / 2) return "date";

  const numbers = samples.filter(
    (v) => typeof v === "number" || (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))),
  ).length;
  if (numbers > samples.length / 2) return "numeric";

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
