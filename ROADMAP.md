# Vizora Roadmap

> *Visual intelligence for the AI era.*

This document tracks where Vizora is, what's next, and how outside contributors can help. It is the canonical source — issues and PRs should reference items here.

**Current state (2026-05-23):** v0.1 shipped, live at https://github.com/Santoshrt999/vizora-ui with green CI.

---

## 📍 Immediate next moves (this week)

Small, high-leverage actions that don't require new code. Listed roughly in order of impact-per-minute.

### 1. Repo metadata (2 minutes, biggest discoverability win)
At https://github.com/Santoshrt999/vizora-ui/settings:

- **Description:** `Visual intelligence for the AI era — React + TypeScript visualizations for AI-native products.`
- **Website:** leave blank for now (or `https://github.com/Santoshrt999/vizora-ui`)
- **Topics:** `react`, `typescript`, `dataviz`, `charts`, `chart-library`, `ai`, `llm`, `dashboard`, `d3`, `visualization`, `react19`, `tailwindcss`, `monorepo`, `open-source`
- Tick **"Releases"** and **"Packages"** under the "About" section.

### 2. Pin the repo to your profile (30 seconds)
At https://github.com/Santoshrt999→ "Customize your pins" → check `vizora-ui`. First impression on every profile visit.

### 3. Enable GitHub Discussions (1 minute)
Settings → Features → tick **Discussions**. Creates a forum for early-feedback questions before they become issues.

### 4. Claim the `@vizora` npm scope (5 minutes)
```bash
npm login                                            # use your npm account
cd packages/themes && npm publish --access public --dry-run
```
If the `--dry-run` says "would publish," remove `--dry-run` to actually claim the scope by publishing `@vizora/themes@0.1.0`. After that, the scope is yours; later packages publish without ceremony.

> **Note:** publishing v0.1 is optional — it's mostly a brand-protection move. The API is still pre-stable and a v0.x publish signals that clearly.

### 5. Open a "good first issue" set (15 minutes)
Five small, well-scoped issues let contributors find you quickly. Suggested titles:
- `feat(charts): add stacked bar variant to BarChart`
- `feat(core): add Crosshair overlay (extract from Tooltip)`
- `feat(charts): support brush selection on time series`
- `chore(themes): add a `solarized` theme variant`
- `docs: write a "your first Vizora dashboard" guide`

Label them `good first issue`, `help wanted`, and link to this file.

### 6. Make the README hero a real screenshot (30 minutes)
Right now the README has no images. A single PNG of the playground (in dark mode, with the TokenUsageChart visible) at the top of the README would dramatically increase star conversion. Capture from `pnpm dev` at 1280×720, drop into `docs/assets/hero.png`, embed under the H1.

### 7. Add a `CODEOWNERS` and a `CONTRIBUTING.md` (10 minutes)
`.github/CODEOWNERS` with `* @Santoshrt999` tells GitHub to auto-request your review on every PR. `CONTRIBUTING.md` documents the workflow.

---

## 🚀 v0.2 — "Useful catalog" (target: 2–3 weeks)

Goal: enough chart types that someone can build a complete analytics dashboard without dropping to the kernel.

**New charts in `@vizora/charts`:**
- `PieChart` — donut variant via `innerRadius` prop
- `DonutChart` — convenience wrapper
- `ScatterPlot` — quantitative-vs-quantitative, optional regression line
- `Heatmap` — calendar + matrix variants
- `RadarChart` — multi-axis comparison

**Kernel additions in `@vizora/core`:**
- `<Polar>` context (sibling to `<Cartesian>`) for pie/radar
- `<Crosshair>` extracted as standalone overlay
- `<Brush>` overlay for range selection
- Headless `useCrosshair()` and `useNearest()` hooks (replace Tooltip's DOM-based hit testing)
- Animation layer via Framer Motion (line-draw, area-fill, bar-grow), respecting `prefers-reduced-motion`

**Utilities in `@vizora/utils`:**
- Production-grade `useStream` improvements: back-pressure, custom window strategies (count vs time)
- `pickPalette()` — categorical / sequential / diverging helpers
- `interpolateRange()` for animated scale transitions

**First runnable example:**
- `examples/nextjs-ai-dashboard/` — a Vercel-deployable Next.js 15 app that imports `@vizora/*` from npm (or workspace), renders a complete LLM ops dashboard. README has a "Deploy to Vercel" button.

**Tooling:**
- Wire **Vitest** for unit tests per package (start with `@vizora/utils` — pure functions, easy)
- Wire **Storybook 8** in `apps/docs` with at least three stories per chart
- Bundle-size budget check in CI (fail PR if any package grows >20%)

**Definition of done for v0.2:** `pnpm install && pnpm test && pnpm build && pnpm storybook` all clean; one published example deploys to Vercel from a button; first three external `good first issue` PRs merged.

---

## 🤖 v0.3 — "AI-native" (target: 4–6 weeks after v0.2)

The signature differentiator. The README hero moves to one of these.

**New in `@vizora/ai-visuals`:**
- `PromptCostVisualizer` — sankey-style breakdown of cost per prompt component
- `ModelComparisonChart` — multi-axis radar across cost/latency/accuracy
- `EvalScoreboard` — sortable table of eval runs with sparklines per metric
- `ConfusionMatrix` — heatmap with cell-level annotations and class drill-down
- `TradeoffChart` — Pareto-front scatter (cost vs accuracy, latency vs cost)

**Adapters:**
- `@vizora/adapter-langfuse` — `langfuse → TokenUsageChart` zero-config
- `@vizora/adapter-langsmith` — same for LangSmith
- `@vizora/adapter-openllmetry` — OTLP traces → Vizora components

**Docs:**
- A "Build an LLM dashboard in 10 minutes" guide as the docs homepage
- A "From `console.log` to Vizora" migration walkthrough

---

## 🧠 v0.4 — "Workflow visuals" (target: 8–10 weeks)

The visualizations no other chart library has.

- `RAGPipelineDiagram` — animated flow of query → retrieval → rerank → generation, with per-stage latency
- `AgentWorkflowGraph` — tree/DAG of agent calls with cost + tokens on edges (`reactflow` + `elkjs`)
- `EmbeddingClusterMap` — UMAP/t-SNE projection with hover-to-show-doc

These are *expensive* to ship right (custom layout, custom interaction, large data). Each is a 1–2 week effort on its own.

---

## 🛠 v0.5 — "Distribution" (target: ~3 months)

The package becomes installable for non-developers.

- `packages/cli` (`vizora` binary): `npx vizora init`, `npx vizora add <component>` (shadcn-style — drops source into user repos)
- Hosted component registry that the CLI reads from
- `apps/docs` upgraded to a real Next.js + Fumadocs site at `vizora.dev` (or `.io` / `.sh` if `.dev` stays parked)
- Theme marketplace v0 — community themes published as `@vizora/theme-*` packages
- Pre-composed dashboard blocks: `AnalyticsDashboard`, `UsageBillingDashboard`, `ModelMonitoringDashboard`, `DatasetQualityDashboard`

---

## ⚡ v0.8 — "Scale + a11y" (target: ~5 months)

- Canvas renderer with the same primitive API (auto-switch when data > N points)
- WebGL renderer for 100k+ point scatters and heatmaps
- WCAG 2.2 AA audit and certification
- i18n for all built-in formatters (Intl already covers most of it)
- Server components compatibility certification (Next.js + Remix + Astro)

---

## 🏁 v1.0 — "Stable" (target: ~6 months)

- API freeze with semver guarantees
- Plugin spec for third-party series, scales, renderers, themes
- LTS branch policy
- Tested against React 18 + 19, Next 14 + 15, Remix 2, Astro, Vite, Vue (via @vizora/vue wrapper if demand exists)

---

## 🤝 How to contribute

1. **Pick a `good first issue`** or comment on a roadmap item to claim it.
2. Fork → branch (`feat/<short-name>`) → PR against `main`.
3. CI must be green: `pnpm typecheck && pnpm lint && pnpm build`.
4. Add or update a Storybook story for any component change (once Storybook lands in v0.2).
5. Run `pnpm changeset` and describe the change in user-facing terms.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup details (TODO — landing with v0.2).

---

## 📊 Tracking

- **Project board:** TODO — create at https://github.com/Santoshrt999/vizora-ui/projects (one column per minor version)
- **Milestones:** v0.2, v0.3, v0.4, v0.5, v0.8, v1.0 — to be created as issues are filed
- **Discussions:** for design questions and "how do I…" before they become issues

---

## 🐛 Known caveats to revisit before v1.0

These shipped in v0.1 and should be addressed by v0.5 at the latest:

- `Tooltip` uses DOM-based hit testing — should be lifted to a headless `useCrosshair` hook (v0.2).
- No animation layer yet — Framer Motion is in the deps plan but unused (v0.2).
- `BarChart` only does grouped bars; stacked is not implemented (v0.2).
- Series colors come from CSS variables (`--vz-series-1..8`); a programmatic override API is missing (v0.2).
- Bundle-size regression checks are not yet in CI (v0.2).
- Author email on commits is `gsr.teja@gmail.com` (git global). If commits need to match a different GitHub identity, set `git config user.email <addr>` before authoring.

---

*Last updated: 2026-05-23, post-v0.1 ship.*
