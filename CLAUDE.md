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
- ✅ `@vizora/themes` — `ThemeName` type + `applyTheme`/`getCurrentTheme`, dark/light/midnight CSS
- ✅ `@vizora/utils` — formatters, color helpers, `useResizeObserver`, `useStream`, `cn` (+ Vitest wired with 14 passing tests on formatters)
- ✅ `@vizora/core` — `ChartProvider` (with a11y `title`/`description` props → `<title>`/`<desc>` + `aria-labelledby`), `Cartesian`, `XAxis`/`YAxis`, `Grid`, `LineSeries`/`AreaSeries`/`BarSeries`, `Tooltip`, `Legend`
- ✅ `@vizora/charts` — `LineChart`, `BarChart`, `AreaChart`, **`PieChart` + `DonutChart` (v0.2)**, **`ScatterPlot` (v0.2)**, **`Heatmap` (v0.2)** — all accept `title`/`description`
- ✅ `@vizora/dashboard-blocks` — `KpiCard`, `KpiGrid`, `Sparkline`
- ✅ `@vizora/ai-visuals` — `TokenUsageChart` (signature AI component; sensible default `title`)
- ✅ `apps/playground` — Vite app that is now a **single Data Explorer page** (`src/pages/DataExplorer.tsx` + `src/components/data-explorer/*`): upload CSV/Excel (PapaParse + xlsx), auto-charted via `@vizora/charts` (Bar/Line/Area/Scatter), filter sidebar, and a Claude-powered chat assistant that emits filter/chart/reset actions (needs `VITE_ANTHROPIC_API_KEY`; browser-direct call, demo-only). dark/light/midnight theme switcher lives at the bottom of the left sidebar. **The old seeded "AI Ops dashboard" page, the nav rail, `src/data.ts`, and the `src/upload/` flow were removed (2026-05-30)** — the playground is upload-driven only, no static demo data.
- ✅ Root: README, LICENSE (MIT), `.changeset/config.json`, CI workflow (now incl. `pnpm test`), PR + issue templates, **CONTRIBUTING.md, CODEOWNERS, CODE_OF_CONDUCT.md, SECURITY.md** (post-audit)
- ✅ `pnpm install && pnpm build && pnpm typecheck && pnpm lint && pnpm test` all pass (post-cleanup-sweep)

**Bundle sizes (gzipped, post-d3-externalization):** core 5.4KB · utils 1.6KB · dashboard-blocks 1.4KB · ai-visuals 1.0KB · charts 0.6KB · themes 0.3KB. d3 is now a peer dep on `core` + `dashboard-blocks` — `auto-install-peers=true` in `.npmrc` keeps the install ergonomics smooth, and consumers get a single shared d3 instead of one copy per package.

**Not yet:**
- ❌ `packages/cli` and `apps/docs` are still empty (planned for v0.5 and v0.2 respectively).
- ❌ No Storybook or Playwright yet — coming in v0.2. (Vitest now wired in `@vizora/utils`, ready to expand.)
- ❌ No examples in `examples/` yet.
- ❌ Not published to npm yet — `@vizora` scope on npm not claimed.

**Known kernel caveats to revisit before v1.0:**
- Tooltip currently does its own DOM-based hit testing — works, but should be lifted to a proper headless `useCrosshair` hook.
- No animation layer yet (framer-motion is in the deps plan but unused). Add in v0.2.
- `BarChart` only does grouped bars; stacked is not implemented.
- Series colors come from CSS variables (`--vz-series-1..8`); a programmatic override API isn't exposed yet.

## Audit findings — 2026-05-23 (v0.1 sweep, **LANDED** in branch `chore/v0.1-cleanup-sweep`)

Full audit table is in the chat history for this session. The 12-item cleanup PR has shipped — keeping the list here as a record of what was addressed:

1. **Legacy `gf-*` class prefix (rename leftover from "GraphForge")** in 5 files — delete from `core/src/Axis.tsx:47,79`, `core/src/series/{Line,Area,Bar}Series.tsx`. No CSS targets these; pure cruft.
2. **Unused declared dependencies:**
   - `@vizora/core` ships `d3-time` + `d3-time-format` + their `@types` — nothing imports them.
   - `@vizora/charts` declares `@vizora/themes` + `@vizora/utils` — only imports from `@vizora/core`.
   - `@vizora/ai-visuals` declares `@vizora/charts` + `@vizora/themes` — only imports `core` + `utils`.
   - `@vizora/dashboard-blocks` declares `@vizora/core` + `@vizora/charts` + `@vizora/themes` — only imports `@vizora/utils` + d3.
3. **README factual bug + broken link:** README claims "headless primitives layer on D3 + Visx" — **Visx is not installed**. Also, the "PRs Welcome" badge links to `./CONTRIBUTING.md` which doesn't exist (404).
4. **`packages/themes/src/tokens.ts` midnight entry drifts from `midnight.css`:** JS `tokens.midnight.series` reuses `SERIES_DARK` (cyan-first); CSS `--vz-series-1` for midnight is purple. Anyone reading the JS tokens at runtime gets wrong colors. Either delete `tokens.ts` (CSS is source of truth) or drive CSS from JS.
5. **`ChartFrameValue.data: any[]`** (`packages/core/src/contexts.ts:11`) — eslint-suppressed; should be `unknown[]`. Exported `ChartFrame` type also drops the `data` field that the actual context carries — public API drift.
6. **A11y is effectively broken:** `role="img"` on the SVG (`core/src/ChartProvider.tsx:62`) with no `aria-label` / `<title>` / `<desc>`. Screen readers announce "graphic" and nothing else. Add `title?: string` + `description?: string` props on every chart and pipe them in.
7. **`BarSeries` throws hard `Error` if xType !== "band"** (`series/BarSeries.tsx:21`). Downgrade to dev-mode warning.
8. **`AreaSeries` top stroke via regex** `path.replace(/L[^L]*$/, "")` (`series/AreaSeries.tsx:75`) — fragile; generate it from a separate `d3-shape line()` instead.
9. **d3 bundled into every library** rather than externalized. `@vizora/core` and `@vizora/dashboard-blocks` each ship their own copy of d3-scale + d3-shape. Externalize in `tsup.base.ts` and add d3-* as peers where used.
10. **`ROADMAP.md` still has stale `Santoshrt999/vizora-ui` URLs in 4 places** (lines 7, 16, 19, 170) — fix to `VizoraHQ/vizora-ui`.
11. **Missing community/governance files:** no `CONTRIBUTING.md`, no `CODEOWNERS`, no `CODE_OF_CONDUCT.md`, no `SECURITY.md`, no `FUNDING.yml`.
12. **CI doesn't run `pnpm test`** (no package implements it). Add a Vitest stub in `@vizora/utils` + wire the test step so the pipeline is ready when real tests arrive in v0.2.

**Verified bundle sizes (gzipped, `gzip -c dist/index.js | wc -c`):** core 5.3KB · utils 1.6KB · dashboard-blocks 1.4KB · ai-visuals 0.95KB · themes 0.67KB · charts 0.6KB. Total ~10.1KB *with d3 bundled in* — peer-externalizing d3 would cut another ~3KB from core.

**Next-five recommended tasks** (priority order, total ~4.5 hours): (1) the cleanup sweep above, (2) minimum a11y (`title`/`description` props), (3) wire Vitest in `@vizora/utils`, (4) externalize d3 + add as peers, (5) add CODEOWNERS/CONTRIBUTING/COC/SECURITY/FUNDING + `pnpm test` CI step.

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

*Last refreshed: 2026-05-30 — Playground is now a **single upload-driven Data Explorer** (upload → visualize → filter → AI chat) on branch `feat/data-explorer`. Removed the seeded "AI Ops dashboard", the nav rail, `src/data.ts`, and the legacy `src/upload/` flow; theme switcher moved into the explorer's left sidebar. `papaparse` + `@types/papaparse` in `apps/playground`. typecheck/build/lint pass. v0.2 charts (Pie/Donut/Scatter/Heatmap) already in main; Radar still parked. Repo at VizoraHQ/vizora-ui. CI green.*
