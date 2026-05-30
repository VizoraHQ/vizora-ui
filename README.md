<div align="center">

# ✦ Vizora

### Visual intelligence for the AI era

A **React + TypeScript** visualization framework built for the dashboards modern products actually ship —
beautiful by default, headless underneath, and **AI-native from day one**.

<br/>

[![status](https://img.shields.io/badge/status-v0.2_preview-8b5cf6?style=flat-square)](./ROADMAP.md)
[![license](https://img.shields.io/badge/license-MIT-111111?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white)](#)
[![core](https://img.shields.io/badge/core-5.4KB_gzip-8b5cf6?style=flat-square)](#-architecture)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-22c55e?style=flat-square)](./CONTRIBUTING.md)

**[Install](#-install)** · **[Quickstart](#-30-second-example)** · **[Components](#-component-catalog)** · **[Playground](#-playground)** · **[Roadmap](#-roadmap)**

</div>

---

## ✨ Why Vizora?

Most chart libraries were built for dashboards from 2014. They render bars and lines, but everything else — themes, real-time data, AI workflows, custom interactions — falls on you.

Vizora ships the visualizations modern products actually need:

|  |  |
| --- | --- |
| 🎨 **Beautiful by default** | A tuned, dark-mode-first design system you can retheme with a single CSS variable. |
| 🤖 **AI-native, not retrofitted** | Token usage, prompt costs, agent traces, and eval matrices as first-class components. |
| 🧱 **Composable kernel** | A headless primitives layer (`ChartProvider`, `Cartesian`, series, overlays) on D3 — build anything the catalog doesn't ship. |
| 🔒 **SSR-safe & accessible** | No `window` at import time, ARIA descriptions, color-blind-safe palettes. |
| 📦 **One install, three layers** | High-level charts, AI visuals, and dashboard blocks all sit on the same kernel. |

---

## 📦 Install

```bash
pnpm add @vizora/charts @vizora/themes
# or grab the AI catalogue
pnpm add @vizora/ai-visuals
```

Import a theme once at the top of your app:

```ts
import "@vizora/themes/dark.css";
```

---

## ⚡ 30-second example

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

> No `<ResponsiveContainer>`, no manual margin math, no theme prop drilling.

---

## 🤖 AI-native visualizations

```tsx
import { TokenUsageChart } from "@vizora/ai-visuals";

<TokenUsageChart data={spans} unit="cost" />;
```

Designed for the trace shapes you already have in **LangSmith**, **OpenTelemetry**, **Langfuse**, or your own pipeline.

---

## 🧩 Dashboard blocks

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

---

## 🎨 Theming

Three themes ship in the box — `dark`, `light`, and `midnight`. Switch at runtime, or override a single token to make it yours:

```ts
import { applyTheme } from "@vizora/themes";
applyTheme("midnight");
```

```css
/* everything keys off CSS variables — retheme in one line */
:root { --vz-accent: #8b5cf6; }
```

---

## 🗂️ Component catalog

| Layer | Package | What's inside |
| --- | --- | --- |
| 🧱 **Kernel** | `@vizora/core` | `ChartProvider`, `Cartesian`, scales, axes, series, tooltip, legend |
| 📊 **Charts** | `@vizora/charts` | Line · Bar · Area · Pie · Donut · Scatter · Heatmap |
| 🤖 **AI visuals** | `@vizora/ai-visuals` | `TokenUsageChart` *(more landing in v0.3)* |
| 📐 **Dashboard blocks** | `@vizora/dashboard-blocks` | `KpiCard`, `KpiGrid`, `Sparkline` |
| 🎨 **Themes** | `@vizora/themes` | dark · light · midnight (CSS variables + Tailwind preset) |
| 🛠️ **Utils** | `@vizora/utils` | formatters, color palettes, streaming hooks, a11y helpers |

---

## 🧪 Playground

The Vite playground is a living demo of the whole catalog:

- **AI Ops dashboard** — KPI strip + six chart panels + the signature token-usage chart, across three themes.
- **Data Explorer** — drop in a CSV/Excel file, auto-chart it, filter it with chips, and ask a Claude-powered analyst to reshape the view.

```bash
pnpm dev   # → http://localhost:5173
```

---

## 🏗️ Architecture

```
vizora/
├── apps/
│   ├── docs/            (planned) Next.js + MDX docs site
│   └── playground/      Vite playground — AI Ops dashboard + Data Explorer
├── packages/
│   ├── core/            ChartProvider, Cartesian, axes, series, tooltip
│   ├── charts/          Line, Bar, Area, Pie, Donut, Scatter, Heatmap
│   ├── ai-visuals/      TokenUsageChart (more landing in v0.3)
│   ├── dashboard-blocks/ KpiCard, KpiGrid, Sparkline
│   ├── themes/          Dark / light / midnight, CSS variables
│   ├── utils/           Formatters, color helpers, streaming hooks
│   └── cli/             (planned) `npx vizora add ...`
└── examples/            (planned) standalone runnable demos
```

---

## 🛠️ Run locally

```bash
pnpm install
pnpm dev               # boots the playground at http://localhost:5173
pnpm build             # builds every package via turbo + tsup
pnpm typecheck
```

---

## 🗺️ Roadmap

See [CLAUDE.md](./CLAUDE.md) for the working plan. Highlights:

- ✅ **v0.1** — Kernel, Line/Bar/Area, KpiCard/Grid, TokenUsageChart, dark/light/midnight themes.
- 🟣 **v0.2 (now)** — Pie, Donut, Scatter, Heatmap shipped; streaming hooks + example apps in progress.
- ⏳ **v0.3** — AI visuals: PromptCost, ModelComparison, EvalScoreboard, ConfusionMatrix, TradeoffChart.
- ⏳ **v0.4** — RAG pipeline, AgentWorkflow graph, EmbeddingCluster.
- ⏳ **v0.5** — Dashboard blocks library + `vizora` CLI + theme marketplace.
- ⏳ **v1.0** — Stable API, plugin spec, a11y certification.

---

## 🤝 Contributing

Vizora is early and friendly. Open an issue, pick a `good first issue`, or just send a PR — see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

<div align="center">

**MIT** © Vizora contributors · Use it anywhere, including commercial.

</div>
