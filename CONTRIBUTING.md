# Contributing to Vizora

Thanks for your interest. Vizora is early — the API isn't frozen, the test bar isn't enforced yet, and the maintainer is a one-person operation. That means small, focused PRs land fast.

## Quick start

```bash
git clone https://github.com/VizoraHQ/vizora-ui.git
cd vizora-ui
pnpm install
pnpm dev      # boots the playground at http://localhost:5173
pnpm build    # builds every package via turbo + tsup
pnpm typecheck
pnpm lint
pnpm test
```

Node 20+ and pnpm 9+ required. The `.nvmrc` and `packageManager` fields pin versions.

## Workflow

1. **Pick a [`good first issue`](https://github.com/VizoraHQ/vizora-ui/labels/good%20first%20issue)** or comment on a [`ROADMAP.md`](./ROADMAP.md) item to claim it.
2. Fork → branch (`feat/<short-name>`, `fix/<short-name>`, or `chore/<short-name>`) → PR against `main`.
3. CI must be green: `pnpm typecheck && pnpm lint && pnpm build && pnpm test`.
4. Run `pnpm changeset` and describe the change in user-facing terms (one changeset per user-visible change).

## What lands

- Bug fixes with a repro.
- New components that fit the roadmap (see [`ROADMAP.md`](./ROADMAP.md)).
- Doc PRs (typos, clarifications, examples).
- A11y improvements — always welcome.

## What gets pushback

- New runtime dependencies without justification in the PR description.
- Breaking API changes without a `BREAKING:` prefix and a migration note.
- Features that don't have a story in the roadmap or a labeled issue. Open the issue first; the design conversation is usually the longest part.

## House rules

- **TypeScript strict, no `any`.** Public APIs fully typed with generics over data.
- **SSR-safe:** no `window`/`document` access at module top level.
- **Dark-mode first;** themes via CSS variables (`--vz-*`), not JS objects.
- **No `: JSX.Element` annotations** (React 19 removed the global namespace — let TS infer, or `import type { JSX } from "react"`).
- **Honor `prefers-reduced-motion`** for any animation.
- One `Changeset` per user-visible change.

## Reporting bugs

Use the [Bug report](https://github.com/VizoraHQ/vizora-ui/issues/new?template=bug.yml) template. The faster the repro, the faster the fix.

## Security

Don't open public issues for vulnerabilities — see [`SECURITY.md`](./SECURITY.md).

## License

By contributing, you agree your contributions are licensed under MIT (see [`LICENSE`](./LICENSE)).
