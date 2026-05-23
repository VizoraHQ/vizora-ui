<div align="center">

# Vizora

**Visual intelligence for the AI era.**

A React + TypeScript visualization framework built for the dashboards modern products actually ship — beautiful by default, headless underneath, and AI-native from day one.

[![license](https://img.shields.io/badge/license-MIT-111)](./LICENSE)
[![status](https://img.shields.io/badge/status-v0.1%20preview-8b5cf6)](./ROADMAP.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-22c55e)](./CONTRIBUTING.md)

</div>

---

## Why Vizora?

Most chart libraries were built for dashboards from 2014. They render bars and lines, but everything else — themes, real-time data, AI workflows, custom interactions — falls on you.

Vizora ships the visualizations modern products actually need:

- **Beautiful by default** — a tuned, dark-mode-first design system you can retheme with one CSS variable.
- **AI-native, not retrofitted** — token usage, prompt costs, agent traces, eval matrices as first-class components.
- **Composable kernel** — a headless primitives layer (`ChartProvider`, `Cartesian`, series, overlays) on D3 (scale/shape/array), so you can build anything the catalog doesn't ship.
- **SSR-safe and accessible** — no `window` at import time, ARIA descriptions, color-blind-safe palettes.
- **One install, three layers** — high-level charts, AI visuals, and dashboard blocks all sit on the same kernel.

## Install

```bash
pnpm add @vizora/charts @vizora/themes
# or grab the AI catalogue
pnpm add @vizora/ai-visuals
```

Import a theme once at the top of your app:

```ts
import "@vizora/themes/dark.css";
```

## 30-second example

```tsx
import { LineChart } from "@vizora/charts";

export function Latency({ spans }) {
  return (
    <LineChart
      data={spans}
      x={(d) => d.ts}
      y={(d) => d.latencyMs}
      series={(d) => d.model}
      height={280}
    />
  );
}
```

No `<ResponsiveContainer>`, no manual margin math, no theme prop drilling.

## AI-native visualizations

```tsx
import { TokenUsageChart } from "@vizora/ai-visuals";

<TokenUsageChart data={spans} unit="cost" />;
```

Designed for the trace shapes you already have in LangSmith, OpenTelemetry, Langfuse, or your own pipeline.

## Dashboard blocks

```tsx
import { KpiGrid } from "@vizora/dashboard-blocks";

<KpiGrid
  items={[
    { label: "Spend (24h)", value: "$148.20", delta: { value: -0.06 }, sparkline: trail },
    { label: "p95 Latency", value: "812ms", delta: { value: 0.12, invert: true } },
    { label: "Eval pass rate", value: "94.2%", delta: { value: 0.03 } },
  ]}
/>;
```

## Architecture

```
vizora/
├── apps/
│   ├── docs/            (planned) Next.js + MDX docs site
│   └── playground/      Vite playground showing every component
├── packages/
│   ├── core/            ChartProvider, Cartesian, axes, series, tooltip
│   ├── charts/          LineChart, BarChart, AreaChart
│   ├── ai-visuals/      TokenUsageChart (more landing in v0.3)
│   ├── dashboard-blocks/ KpiCard, KpiGrid, Sparkline
│   ├── themes/          Dark / light / midnight, CSS variables
│   ├── utils/           Formatters, color helpers, streaming hooks
│   └── cli/             (planned) `npx vizora add ...`
└── examples/            (planned) standalone runnable demos
```

## Run locally

```bash
pnpm install
pnpm dev               # boots the playground at http://localhost:5173
pnpm build             # builds every package via turbo + tsup
pnpm typecheck
```

## Roadmap

See [CLAUDE.md](./CLAUDE.md) for the working plan. Highlights:

- **v0.1 (now)** — Kernel, Line/Bar/Area, KpiCard/Grid, TokenUsageChart, dark/light/midnight themes.
- **v0.2** — Pie, Donut, Scatter, Heatmap, Radar; streaming hooks; first example app.
- **v0.3** — AI visuals: PromptCost, ModelComparison, EvalScoreboard, ConfusionMatrix, TradeoffChart.
- **v0.4** — RAG pipeline, AgentWorkflow graph, EmbeddingCluster.
- **v0.5** — Dashboard blocks library + `vizora` CLI + theme marketplace.
- **v1.0** — Stable API, plugin spec, a11y certification.

## Contributing

Vizora is early and friendly. Open an issue, pick a `good first issue`, or just send a PR.

## License

MIT © Vizora contributors. Use it anywhere, including commercial.
