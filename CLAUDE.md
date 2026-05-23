# CLAUDE.md

> Operating notes for Claude Code (and humans) working in this repo. **Read this first.**

## What this is

**Vizora** — *Visual intelligence for the AI era.* An open-source React + TypeScript visualization framework targeting AI-native products. Pitched as *"shadcn/ui for charts, with first-class LLM/agent dashboards."*

> **Live at https://github.com/VizoraHQ/vizora-ui** (public, MIT, CI green).
> **Naming notes.** Product is "Vizora" (capital V). npm scope `@vizora/*` (not yet published). CSS prefix `--vz-` / `.vz-` / `data-vz-*`. Working directory `/Users/santosh/vizora/`. Repo lives under the `VizoraHQ` GitHub org (transferred from personal account `Santoshrt999` on 2026-05-23).

Three product layers:

| Layer | Package | Purpose |
| --- | --- | --- |
| Headless kernel | `@vizora/core` | `ChartProvider`, `Cartesian`, scales, axes, series, overlays. SVG default, Canvas/WebGL escape hatch. |
| High-level charts | `@vizora/charts` | `LineChart`, `BarChart`, `AreaChart`, `PieChart`, `Heatmap`, etc. |
| AI-native visuals | `@vizora/ai-visuals` | `TokenUsageChart`, `AgentWorkflowGraph`, `EvalScoreboard`, `RAGPipelineDiagram`, etc. |
| Dashboard blocks | `@vizora/dashboard-blocks` | Pre-composed sections: KPI grid, billing, model monitor, dataset quality. |
| Themes | `@vizora/themes` | CSS-variable themes (dark/light/midnight) + Tailwind preset. |
| Utils | `@vizora/utils` | Formatters, color palettes, streaming hooks, a11y helpers. |
| CLI | `vizora` | `npx vizora add <component>` copies source into user repos (shadcn-style). |

## Why it exists

Existing chart libraries weren't designed for AI products. Teams ship the same five LLM visualizations badly, every time. Vizora ships them once, well, and themable by default. The bet: a curated, AI-flavored chart library with a copy-paste CLI is a strong wedge against Recharts/Nivo/Tremor.

## Repo layout

```
vizora/
├── apps/
│   ├── docs/          Next.js 15 + Fumadocs MDX (docs site)
│   └── playground/    Vite + Monaco (live editor)
├── packages/
│   ├── core/          Headless primitives
│   ├── charts/        Standard charts
│   ├── ai-visuals/    LLM/ML components
│   ├── dashboard-blocks/  Pre-composed sections
│   ├── themes/        CSS variables + Tailwind preset
│   ├── utils/         Helpers
│   └── cli/           `vizora` binary
└── examples/          Standalone runnable demos
```

Tooling: **pnpm 9** workspaces, **Turbo** for task orchestration, **tsup** for library builds, **Changesets** for releases, **Vitest** for units, **Playwright** for visual + e2e, **Storybook 8** for component lab.

## Current state — snapshot 2026-05-23 (v0.1 live on GitHub, CI green)

**Live at https://github.com/VizoraHQ/vizora-ui** (public, MIT). CI green on commit `cb94e63`.

**Shipped:**
- ✅ `@vizora/themes` — tokens.ts, apply.ts, dark/light/midnight CSS
- ✅ `@vizora/utils` — formatters, color helpers, `useResizeObserver`, `useStream`, `cn`
- ✅ `@vizora/core` — `ChartProvider`, `Cartesian`, `XAxis`/`YAxis`, `Grid`, `LineSeries`/`AreaSeries`/`BarSeries`, `Tooltip`, `Legend`
- ✅ `@vizora/charts` — `LineChart`, `BarChart`, `AreaChart`
- ✅ `@vizora/dashboard-blocks` — `KpiCard`, `KpiGrid`, `Sparkline`
- ✅ `@vizora/ai-visuals` — `TokenUsageChart` (signature AI component)
- ✅ `apps/playground` — Vite app demoing every component, dark/light/midnight theme switcher
- ✅ Root: README, LICENSE (MIT), `.changeset/config.json`, CI workflow, PR + issue templates
- ✅ `pnpm install && pnpm build && pnpm typecheck` all pass (13/13 turbo tasks green)

**Bundle sizes (gzipped, latest build):** core 5.3KB · charts 0.6KB · ai-visuals 0.9KB · dashboard-blocks 1.4KB · themes 0.7KB · utils 1.6KB. Total ~10KB (excludes d3 peer modules).

**Not yet:**
- ❌ `packages/cli` and `apps/docs` are still empty (planned for v0.5 and v0.2 respectively).
- ❌ No Storybook, Vitest, or Playwright wired in yet — coming in v0.2 alongside more chart types.
- ❌ No examples in `examples/` yet.
- ❌ Not published to npm yet — `@vizora` scope on npm not claimed.

**Known kernel caveats to revisit before v1.0:**
- Tooltip currently does its own DOM-based hit testing — works, but should be lifted to a proper headless `useCrosshair` hook.
- No animation layer yet (framer-motion is in the deps plan but unused). Add in v0.2.
- `BarChart` only does grouped bars; stacked is not implemented.
- Series colors come from CSS variables (`--vz-series-1..8`); a programmatic override API isn't exposed yet.

## Where to start (first five components, in build order)

1. **`ChartProvider` + `Cartesian` kernel** in `packages/core` — foundation for everything else.
2. **`LineChart`** in `packages/charts` — proves the high-level API.
3. **`BarChart`** in `packages/charts` — exercises categorical scales.
4. **`KpiCard` + `KpiGrid`** in `packages/dashboard-blocks` — fastest dashboard win.
5. **`TokenUsageChart`** in `packages/ai-visuals` — signature AI component, README hero.

## Conventions (the bar to land a component)

- TypeScript strict, no `any`. Public APIs fully typed with generics over data.
- SSR-safe: no `window`/`document` access at module top level.
- Dark-mode first; themes via CSS variables, not JS objects.
- Components should not annotate `: JSX.Element` return types (React 19 removed the global namespace — let TS infer, or `import type { JSX } from "react"`).
- Keyboard navigation + ARIA descriptions; honors `prefers-reduced-motion`.
- No new runtime dependency without justification in the PR description.
- One Changeset per user-visible change.
- **Test/story discipline (target for v1.0, not enforced in v0.x):** Storybook story, Vitest unit test, Playwright visual snapshot, MDX docs page per component.

## Resume-here checklist

If this is a fresh session (or you just opened the folder):

1. Read this file (you're doing it).
2. `git log --oneline -20` and `git remote -v` — origin is `https://github.com/VizoraHQ/vizora-ui.git`.
3. `pnpm install && pnpm build && pnpm lint` should all succeed; `pnpm dev` boots the playground at http://localhost:5173.
4. Skim memory: my private context lives in `~/.claude/projects/-Users-santosh-vizora/memory/` and survives session loss.
5. Confirm CI: https://github.com/VizoraHQ/vizora-ui/actions — should be green.
6. Check the roadmap below to find the next unblocked task — v0.2 (Pie/Donut/Scatter/Heatmap/Radar + streaming + first example) is the natural next slice.

## Roadmap (condensed — full plan in chat history / future ROADMAP.md)

- **v0.1** — Kernel + Line/Bar/Area + KpiCard + dark/light themes + docs skeleton
- **v0.2** — Pie, Donut, Scatter, Heatmap, Radar; streaming hooks; first example app
- **v0.3** — AI visuals: TokenUsage, PromptCost, ModelComparison, EvalScoreboard, ConfusionMatrix, TradeoffChart
- **v0.4** — Workflow visuals: RAGPipeline, AgentWorkflow, EmbeddingCluster (reactflow + elkjs)
- **v0.5** — Dashboard blocks + `vizora` CLI + theme marketplace v0
- **v0.8** — Canvas/WebGL renderers, a11y certification, i18n
- **v1.0** — API freeze, plugin spec, LTS policy

## How we collaborate

- **Keep this file fresh.** Update the "Current state" snapshot whenever a meaningful checkpoint lands. Stale state is worse than no state.
- **Don't push to GitHub without confirmation.** First push, force pushes, repo creation, and any `gh` commands are visible-to-others actions — confirm with Santosh first.
- **No new files unless asked.** Especially no extra markdown — work from this file and the chat. Long-form docs belong in `apps/docs`.
- **Honest snapshots.** If something isn't done, say so. Don't paper over an empty `src/` with optimistic prose.

---

*Last refreshed: 2026-05-23 — v0.1 live on GitHub at VizoraHQ/vizora-ui with green CI (repo transferred from Santoshrt999 → VizoraHQ org on 2026-05-23).*
