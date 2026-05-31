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
- ✅ `@vizora/charts` — `LineChart`, `BarChart`, `AreaChart`, **`PieChart` + `DonutChart` (v0.2; visually overhauled 2026-05-30 — gradient-shaded slices, mount entrance animation, hover pop-out + colored glow, donut-center total/active readout)**, **`ScatterPlot` (v0.2)**, **`Heatmap` (v0.2)** — all accept `title`/`description`
- ✅ `@vizora/dashboard-blocks` — `KpiCard`, `KpiGrid`, `Sparkline`
- ✅ `@vizora/ai-visuals` — `TokenUsageChart` (signature AI component; sensible default `title`)
- ✅ `apps/playground` — Vite app that is now a **single Data Explorer page** (`src/pages/DataExplorer.tsx` + `src/components/data-explorer/*`): upload CSV/Excel (PapaParse + xlsx), auto-charted via `@vizora/charts` (Bar/Line/Area/Scatter), filter sidebar, and a Claude-powered chat assistant that emits filter/**aggregate**/chart/reset actions (needs `VITE_ANTHROPIC_API_KEY`; browser-direct call, demo-only). dark/light/midnight theme switcher lives at the bottom of the left sidebar. **The old seeded "AI Ops dashboard" page, the nav rail, `src/data.ts`, and the `src/upload/` flow were removed (2026-05-30)** — the playground is upload-driven only, no static demo data.
  - **Aggregation + Pareto insight (2026-05-30, branch `feat/data-explorer`).** `parse.ts` has a group-by engine `aggregate(rows, agg)` — `sum/avg/count/min/max` (`AGGREGATE_OPS`) with optional `day/month/year` date bucketing — and a contribution layer `computePareto`/`supportsPareto`. The AI emits an `aggregate` action (`groupBy`/`measure`/`op`/`bucket`); `applyAggregation` auto-picks a line chart for date buckets, bars for categories. For `sum`/`count` category breakdowns the chart ranks groups by share of the total (descending) and renders an `InsightBanner` (headline + 100% contribution bar, top-5 + "Other"); the **deterministic** insight (computed locally on the *filtered* rows, never model-invented) is also appended to the chat reply. Correctness notes baked in: `avg` divides by the count of *numeric* rows and blank cells are treated as missing (not coerced to 0); `computePareto` is sign-aware (all-positive → direct, all-negative → by magnitude, mixed signs → hidden so "% of total" can't mislead). Known follow-ups from the code review (not yet fixed): invalid AI `aggregate` actions fall through to a silent "Done." no-op; ` ```json `-fenced model replies aren't parsed; `min`/`max` return 0 for all-blank groups; Scatter/Line tabs stay clickable during a Pareto aggregation (category labels → x=0).
  - **Pie chart tab + richer empty state (2026-05-30).** ChartView now has a **Pie** tab rendering `@vizora/charts` `DonutChart` from a category breakdown (`sum of |Y|` per group, top-8 + "Other"); the AI `chart` action accepts `pie`. The no-data `EmptyState` was replaced by a **hero** (`HERO_*` consts in `DataExplorer.tsx`): product one-liner, Upload→Visualize→Ask flow, example prompts, tech-stack row, and an arrow nudging the sidebar dropzone — pure `--vz-*` tokens, themes across dark/light/midnight, reduced-motion safe. README now embeds `assets/data-explorer.png` (a donut hero shot) and its Playground section was refreshed.
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

## Launch / go-to-market plan (next up after v0.2 feature work)

> Added 2026-05-30. The honest truth: the concept is strong and the timing is excellent (AI observability dashboards are hot), but **right now the repo is documentation without an installable product.** Order matters: **publish to npm → deploy the playground → then promote.** Don't skip ahead to promotion.

### Phase 1 — Foundation (do this week) — *blockers before any promotion*
- [ ] **Publish to npm (biggest blocker).** Nobody can `pnpm add @vizora/charts` today → it reads as vaporware. Publish even as `0.1.0-alpha`. Claim the `@vizora` scope first.
- [ ] **Deploy a live demo.** The playground only runs locally. Ship it to Vercel/Netlify and link prominently in the README — a working demo converts browsers into stargazers.
- [ ] **Stand up a docs site.** `apps/docs` is planned but empty. Even a basic Nextra/Docusaurus site beats nothing. (Fumadocs MDX was the original plan.)
- [x] **README screenshot/GIF.** Done 2026-05-30 (`assets/data-explorer.png` donut hero). Consider an animated GIF of the Data Explorer flow too — text-only READMEs for UI libs get ignored.

#### Phase 1 deep-dive: the npm publish task (scoped 2026-05-30)

> Findings below are verified against the repo, not assumed. Current state: 6 publishable packages (`@vizora/{core,charts,ai-visuals,dashboard-blocks,themes,utils}`), all at `0.1.0`, none `private`; all build clean with correct `dist`/types/`exports` (tarballs ship only `package.json` + `dist/**` — no src leak). `@vizora/core` + `@vizora/charts` return **E404 on npm → not yet published**. npm is **not logged in locally**. Changesets config is already correct (`access:"public"`, `baseBranch:"main"`, ignores apps). One `release` script exists (`turbo run build && changeset publish`); **no release CI workflow yet**.

**A. Account / scope prerequisites (do first, blocks everything)**
- [ ] Log into npmjs.com and check **https://www.npmjs.com/org/vizora** — the per-package 404s do *not* prove the `@vizora` scope/org is free. If taken, fall back to **`@vizorahq`** (mirrors the GitHub org) — would require renaming all 6 packages + internal deps.
- [ ] Create the **npm Organization `vizora`** (Free plan = unlimited public packages) to mirror GitHub `VizoraHQ` and prevent name-squatting. Do this even before the first publish.
- [ ] Set up auth. **Important (npm changed this late-2025):** classic tokens were revoked (Dec 2025) and **granular access tokens can NOT publish** — so the old "NPM_TOKEN granular token" plan is dead for CI. Paths now: **manual** = `npm login` + 2FA (interactive OTP, fine locally); **CI (recommended)** = **OIDC Trusted Publishing** from GitHub Actions — no token at all, and it generates provenance for free (needs npm ≥11.5.1, Node ≥22.14.0, `id-token:write`, and a Trusted Publisher configured on npm pointing at `VizoraHQ/vizora-ui` + the workflow file). Token fallback only for non-GitHub CI = an **automation** token with "bypass 2FA" (90-day expiry, must rotate).

**B. Package metadata must-fixes (before publish; ~mechanical)**
- [ ] **Add `repository` (+ `"directory":"packages/<name>"`), `homepage`, `bugs` to all 6 package.json.** `repository` is also a hard requirement for npm provenance.
- [ ] **Per-package `README.md`** (npm package pages are blank without one) and **per-package `LICENSE`** — current `files:["dist"]` excludes the root LICENSE from every tarball, so MIT text doesn't ship. Add `"LICENSE"`/`"README.md"` to `files` and place the files in each package dir.
- [ ] Add `keywords` (react, charts, dataviz, d3, ai, llm, dashboard…) for npm search; optional `publishConfig:{access:"public",provenance:true}`.
- [ ] **Fix `@vizora/charts` d3 peers:** it declares only `d3-shape` but transitively needs `d3-array`+`d3-scale` (via `@vizora/core`) — a consumer installing *only* `@vizora/charts` hits unmet peers. Add all three (match core). Also document that consumers must install the d3-* peers + react/react-dom.
- [ ] **Publish only via `pnpm`/`changeset publish`, never raw `npm publish` per dir** — raw npm ships the literal `workspace:*` string and breaks every install.
- [ ] Note: `workspace:*` internal deps get rewritten to an **exact pin** (`0.1.0`) on publish (per `.npmrc` rolling). Fine for alpha; consider `workspace:^` later for caret ranges.

**C. Release mechanics (the publish itself)**
- [ ] Decide alpha vs straight `0.1.0`. For a clean **`0.1.0-alpha.0`**: reset the 6 versions to `0.0.0`, then `pnpm changeset pre enter alpha` → `pnpm changeset` (minor, all pkgs) → `pnpm changeset version` → commit → `pnpm release`. (If you skip the reset, a patch/minor in pre-mode yields `0.1.1-alpha.0` / `0.2.0-alpha.0`, not `0.1.0-alpha.0`.)
- [ ] Pre-mode auto-publishes under the **`alpha` dist-tag**, so `latest` stays empty until stable — exactly what we want. (Manual `npm publish` would need `--tag alpha` explicitly + correct order: **utils → core → charts/ai-visuals/dashboard-blocks**, themes standalone; `changeset publish` topo-sorts automatically.)
- [ ] Exit later for stable: `pnpm changeset pre exit` → `version` → `release` (publishes `0.1.0` under `latest`).
- [ ] **Recommended sequencing:** do the **first alpha publish manually** (`npm login` + interactive OTP — easier to debug auth/scope), then add a `release.yml` using `changesets/action@v1` with **OIDC Trusted Publishing** (`id-token:write`, no `NPM_TOKEN`) for stable `0.1.0`+. CI currently pins Node 20 — bump the *release* job to Node ≥22.14 for provenance.

**D. Verify after publish**
- [ ] `npm view @vizora/core dist-tags` (confirm `alpha`, no accidental `latest`); scratch-install in `/tmp` with peers (`react react-dom d3-shape`); check both ESM `import` + CJS `require` resolve; verify `@vizora/themes/dark.css` subpath resolves.

**Risks to keep in mind:** versions are permanent (a published+unpublished version can never be reused); unpublish only works <72h and only if nothing depends on it — use `npm deprecate` for mistakes. Always `--dry-run` first.

### Phase 2 — Content & distribution (weeks 2–4)
Leverage existing dev.to audience (the Java modernization article). Articles to write:
- [ ] **"Why I built a visualization library specifically for AI dashboards"** — origin story, most shareable. Cross-post dev.to + Hashnode + Medium simultaneously.
- [ ] **"Visualizing LLM token costs in React — no D3 PhD required"** — practical `TokenUsageChart` tutorial; devs building AI apps actively search this.
- [ ] **"Recharts vs Tremor vs Vizora — what's different"** — comparison posts rank on Google and get shared.

Communities (share the **live demo**, not just the repo):
- [ ] r/reactjs and r/webdev
- [ ] **Show HN: "Vizora — AI-native React visualization framework"** — only once npm package + live demo are ready. Post Tue–Thu mornings ET.
- [ ] Product Hunt — launch at v0.2 with more components.
- [ ] Twitter/X — short demo clips; lean into the AI-native angle (TokenUsageChart, PromptCost, EvalScoreboard).

### Phase 3 — Community & SEO (month 2+)
- [ ] **GitHub Topics** — add `d3`, `data-visualization`, `dashboard`, `llm`, `ai` (on top of existing react/typescript) for organic GitHub search.
- [ ] **`good first issue` labels** — tag 3–5 straightforward issues as contributor entry points.
- [ ] **AI tooling community outreach** — Langfuse, LangSmith, OpenTelemetry Discords; `TokenUsageChart` natively targets their users → natural partnership angle.
- [ ] **awesome-lists** — submit to `awesome-react`, `awesome-data-visualization` for passive star drip.

## How we collaborate

- **Keep this file fresh.** Update the "Current state" snapshot whenever a meaningful checkpoint lands. Stale state is worse than no state.
- **Don't push to GitHub without confirmation.** First push, force pushes, repo creation, and any `gh` commands are visible-to-others actions — confirm with Santosh first.
- **No new files unless asked.** Especially no extra markdown — work from this file and the chat. Long-form docs belong in `apps/docs`.
- **Honest snapshots.** If something isn't done, say so. Don't paper over an empty `src/` with optimistic prose.

---

*Last refreshed: 2026-05-30 — Playground is a **single upload-driven Data Explorer** (upload → visualize → filter → **aggregate** → AI chat) on branch `feat/data-explorer`. This session, in order: group-by **aggregation engine + Pareto contribution insight** wired to the AI `aggregate` action; `avg`/blank-cell + negative-measure correctness fixes post-review; a richer **hero empty state**; a **visually overhauled `PieChart`/`DonutChart`** in `@vizora/charts` + a **Pie tab** in the Explorer; and a **README hero screenshot** (`assets/data-explorer.png`) with a freshened Playground/Install/intro. Commits `0298235`, `1689ee6`, `028519e`, `15d86c1`, `5a4f31b`, `8926c6c` pushed. Open: a `@vizora/charts` Changeset for the pie work, plus the four low-severity review follow-ups noted above. typecheck/build pass; verified live in-browser across dark/light/midnight. Repo at VizoraHQ/vizora-ui. CI green. **Also recorded a 3-phase "Launch / go-to-market plan" (above) — next big push after v0.2 feature work; order is npm publish → deploy playground → promote.***

> **▶ RESUME HERE (next session, planned 2026-05-31).** Last session added the **Launch / go-to-market plan** + a fully-scoped **"Phase 1 deep-dive: the npm publish task"** (both above; mirrored in memory `project_launch-plan.md` + `project_npm-publish-scope.md`). **No code was changed and nothing was committed/published** — pure planning. Pick up at the npm-publish checklist. **First two actions are decisions only you can make:** (1) confirm the `@vizora` npm org name is free via the logged-in org-create flow (fallback `@vizorahq`), and (2) alpha vs straight `0.1.0`. Then work the A→B→C→D checklist. Nothing is blocked; the repo is clean and CI is green.
