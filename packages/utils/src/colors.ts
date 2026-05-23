const SERIES_VARS = [
  "var(--vz-series-1)",
  "var(--vz-series-2)",
  "var(--vz-series-3)",
  "var(--vz-series-4)",
  "var(--vz-series-5)",
  "var(--vz-series-6)",
  "var(--vz-series-7)",
  "var(--vz-series-8)",
] as const;

export function seriesColor(index: number): string {
  const safe = ((index % SERIES_VARS.length) + SERIES_VARS.length) % SERIES_VARS.length;
  return SERIES_VARS[safe] ?? SERIES_VARS[0]!;
}

export function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  if (color.startsWith("var(") || color.startsWith("hsl(")) {
    return `color-mix(in srgb, ${color} ${Math.round(clamped * 100)}%, transparent)`;
  }
  return color;
}
