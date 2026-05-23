export const latency = Array.from({ length: 80 }, (_, i) => {
  const ts = new Date(Date.now() - (80 - i) * 60_000);
  const base = 600 + Math.sin(i / 6) * 180;
  return [
    { ts, model: "gpt-4o", latencyMs: base + Math.random() * 60 },
    { ts, model: "claude-sonnet-4-6", latencyMs: base * 0.78 + Math.random() * 40 },
    { ts, model: "gemini-2.0", latencyMs: base * 1.22 + Math.random() * 80 },
  ];
}).flat();

export const sales = [
  { region: "NA", q1: 4200, q2: 5100 },
  { region: "EU", q1: 3100, q2: 3800 },
  { region: "APAC", q1: 2200, q2: 3400 },
  { region: "LATAM", q1: 900, q2: 1200 },
  { region: "MEA", q1: 700, q2: 1050 },
];

export const salesLong = sales.flatMap((row) => [
  { region: row.region, quarter: "Q1", value: row.q1 },
  { region: row.region, quarter: "Q2", value: row.q2 },
]);

export const tokens = Array.from({ length: 48 }, (_, i) => {
  const ts = new Date(Date.now() - (48 - i) * 30 * 60_000);
  const wave = Math.sin(i / 5) * 0.4 + 1;
  return [
    {
      ts,
      model: "gpt-4o",
      inputTokens: Math.round(2200 * wave + Math.random() * 400),
      outputTokens: Math.round(1100 * wave + Math.random() * 250),
      costUsd: 0.018 * wave + Math.random() * 0.004,
    },
    {
      ts,
      model: "claude-sonnet-4-6",
      inputTokens: Math.round(1800 * wave + Math.random() * 300),
      outputTokens: Math.round(900 * wave + Math.random() * 200),
      costUsd: 0.012 * wave + Math.random() * 0.003,
    },
    {
      ts,
      model: "gemini-2.0",
      inputTokens: Math.round(1500 * wave + Math.random() * 350),
      outputTokens: Math.round(700 * wave + Math.random() * 200),
      costUsd: 0.009 * wave + Math.random() * 0.002,
    },
  ];
}).flat();
