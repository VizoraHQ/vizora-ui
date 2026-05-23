// Sample AI-ops data for the Vizora playground.
// Deterministic-ish: uses a small seeded RNG so the dashboard doesn't
// re-shuffle on every hot reload, which makes design tweaks easier to eyeball.

function mulberry32(seed: number): () => number {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260523);
const r = (min: number, max: number): number => min + rand() * (max - min);

export const MODELS = ["gpt-4o", "claude-sonnet-4-6", "gemini-2.0"] as const;

// ---------- Latency time-series (multi-series LineChart) ----------
export const latency = Array.from({ length: 80 }, (_, i) => {
  const ts = new Date(Date.now() - (80 - i) * 60_000);
  const base = 600 + Math.sin(i / 6) * 180;
  return MODELS.map((model, idx) => ({
    ts,
    model,
    latencyMs: base * (0.8 + idx * 0.2) + r(0, 80),
  }));
}).flat();

// ---------- Spend over time (AreaChart) ----------
export const spend = Array.from({ length: 60 }, (_, i) => {
  const ts = new Date(Date.now() - (60 - i) * 60 * 60_000); // hourly window
  const wave = Math.sin(i / 6) * 0.4 + 1;
  return {
    ts,
    costUsd: 1.2 * wave + r(0, 0.4),
  };
});

// ---------- Eval pass-rate by model (BarChart, grouped) ----------
export const evalLong = MODELS.flatMap((model) =>
  ["RAG", "SQL", "Code", "Math"].map((task) => ({
    model,
    task,
    passRate: Math.max(0.6, Math.min(0.99, 0.78 + r(-0.12, 0.18))),
  })),
);

// ---------- Model share of spend (PieChart / DonutChart) ----------
export const modelShare: { model: string; spendUsd: number }[] = [
  { model: "gpt-4o", spendUsd: 462.18 },
  { model: "claude-sonnet-4-6", spendUsd: 318.94 },
  { model: "gemini-2.0", spendUsd: 211.05 },
  { model: "fine-tuned (internal)", spendUsd: 96.21 },
];

// ---------- Token usage (TokenUsageChart) ----------
export const tokens = Array.from({ length: 48 }, (_, i) => {
  const ts = new Date(Date.now() - (48 - i) * 30 * 60_000);
  const wave = Math.sin(i / 5) * 0.4 + 1;
  return MODELS.map((model, idx) => ({
    ts,
    model,
    inputTokens: Math.round((1500 + idx * 300) * wave + r(0, 400)),
    outputTokens: Math.round((700 + idx * 200) * wave + r(0, 250)),
    costUsd: (0.009 + idx * 0.003) * wave + r(0, 0.004),
  }));
}).flat();

// ---------- Latency heatmap (hour × model) ----------
const HOURS = Array.from({ length: 24 }, (_, h) => h.toString().padStart(2, "0"));
export const latencyHeatmap = MODELS.flatMap((model, idx) =>
  HOURS.map((hour, h) => {
    // Bias higher latency in the 12–18 window for that 'business hours' feel.
    const peak = Math.max(0, 1 - Math.abs(h - 15) / 6);
    return {
      hour,
      model,
      latencyMs: Math.round(380 * (1 + idx * 0.2) + peak * 240 + r(0, 60)),
    };
  }),
);
export const HEATMAP_HOURS = HOURS;

// ---------- Cost vs Accuracy scatter (Pareto frontier feel) ----------
export const tradeoff = [
  ...Array.from({ length: 8 }, () => ({
    family: "gpt",
    accuracy: Math.min(0.99, 0.74 + r(0, 0.2)),
    costPer1k: 0.005 + r(0, 0.035),
  })),
  ...Array.from({ length: 8 }, () => ({
    family: "claude",
    accuracy: Math.min(0.99, 0.78 + r(0, 0.18)),
    costPer1k: 0.004 + r(0, 0.03),
  })),
  ...Array.from({ length: 8 }, () => ({
    family: "gemini",
    accuracy: Math.min(0.99, 0.72 + r(0, 0.22)),
    costPer1k: 0.003 + r(0, 0.025),
  })),
];

// ---------- Sparkline trails (for KPI cards) ----------
export const sparkSeeds = {
  spend: Array.from({ length: 24 }, (_, i) => Math.sin(i / 3) * 8 + 16 + r(0, 3)),
  latency: Array.from({ length: 24 }, (_, i) => Math.cos(i / 4) * 5 + 18 + r(0, 2)),
  evalPass: Array.from({ length: 24 }, (_, i) => Math.sin(i / 5) * 3 + 15 + r(0, 1.5)),
  tokens: Array.from({ length: 24 }, (_, i) => Math.cos(i / 3.5) * 6 + 17 + r(0, 2.5)),
};
