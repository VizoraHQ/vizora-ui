import * as XLSX from "xlsx";

export type Row = Record<string, unknown>;

export async function parseFile(file: File): Promise<Row[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]!];
  if (!ws) return [];
  const rows = XLSX.utils.sheet_to_json<Row>(ws, { defval: "" });
  return rows;
}

export function inferColumnType(rows: Row[], col: string): "date" | "number" | "string" {
  const samples = rows.slice(0, 20).map((r) => r[col]);
  const numbers = samples.filter((v) => typeof v === "number" || (typeof v === "string" && v !== "" && !isNaN(Number(v))));
  const dates = samples.filter((v) => v instanceof Date);
  if (dates.length > samples.length / 2) return "date";
  if (numbers.length > samples.length / 2) return "number";
  return "string";
}

export type ChartSuggestion = "line" | "bar" | "area" | "scatter" | "donut";

export function suggestChartType(
  rows: Row[],
  xCol: string,
  yCol: string,
): ChartSuggestion {
  const xType = inferColumnType(rows, xCol);
  const yType = inferColumnType(rows, yCol);
  if (xType === "date" && yType === "number") return "line";
  if (xType === "string" && yType === "number") return "bar";
  if (xType === "number" && yType === "number") return "scatter";
  return "bar";
}
