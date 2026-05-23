const NUMBER_COMPACT = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const NUMBER_FULL = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

export function formatNumber(value: number, opts?: { compact?: boolean }): string {
  if (!Number.isFinite(value)) return "—";
  return opts?.compact ? NUMBER_COMPACT.format(value) : NUMBER_FULL.format(value);
}

export function formatCurrency(value: number, currency = "USD"): string {
  if (!Number.isFinite(value)) return "—";
  const formatter = new Intl.NumberFormat("en", {
    style: "currency",
    currency,
    maximumFractionDigits: value < 1 ? 4 : 2,
  });
  return formatter.format(value);
}

export function formatTokens(value: number): string {
  if (!Number.isFinite(value)) return "—";
  if (value < 1000) return `${value} tok`;
  return `${NUMBER_COMPACT.format(value)} tok`;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

const SHORT_DATE = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: Date | number | string): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return SHORT_DATE.format(d);
}
