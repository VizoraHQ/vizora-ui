# Vizora Integration Guide

> How companies can integrate Vizora into their products. Reference this when planning plugin/embed strategies.

---

## For LLM API Providers (OpenAI, Anthropic, Together, etc.)

### The Pitch
Vizora ships **pre-built, themable LLM dashboards** so you don't rebuild token usage charts, cost trends, and latency heatmaps every product cycle. Drop components into your existing admin panel or ship a standalone observability SaaS.

### Integration Architecture

```
┌─────────────────────────────────────────────────────┐
│ Your SaaS Platform (React + Node/Python backend)    │
├─────────────────────────────────────────────────────┤
│                                                       │
│  Dashboard Frontend (React)                          │
│  ├─ Vizora components (@vizora/charts, @vizora/ai-visuals)
│  ├─ Theme switching (@vizora/themes)                │
│  └─ Custom layout (your design system)              │
│                                                       │
│  API / Data Layer (your backend)                    │
│  ├─ Usage metrics (tokens, requests, latency)       │
│  ├─ Billing data (spend by model, customer, org)    │
│  └─ Real-time webhooks (usage events)               │
│                                                       │
│  Integrations                                        │
│  ├─ Your auth system (OAuth, API keys)              │
│  ├─ Your database (PostgreSQL, DynamoDB)            │
│  └─ Your billing provider (Stripe, custom)          │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Step 1: Install Vizora Packages

```bash
npm install @vizora/core @vizora/charts @vizora/ai-visuals @vizora/themes
```

Optional (if building on Vizora dashboard patterns):
```bash
npm install @vizora/dashboard-blocks @vizora/utils
```

### Step 2: Wire Your Data Source

**Your backend exposes a usage metrics endpoint:**

```typescript
// GET /api/usage/timeline
// Returns time-series data for the dashboard

export interface UsageMetrics {
  ts: Date;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  errorRate: number;
}

export async function fetchUsageMetrics(
  orgId: string,
  timeRange: '1d' | '7d' | '30d'
): Promise<UsageMetrics[]> {
  const res = await fetch(`/api/orgs/${orgId}/usage?range=${timeRange}`);
  return res.json();
}
```

### Step 3: Build Your Dashboard

**Example: "API Usage & Billing" dashboard for your admin panel**

```tsx
import { LineChart, AreaChart, BarChart, Heatmap } from '@vizora/charts';
import { TokenUsageChart } from '@vizora/ai-visuals';
import { KpiGrid } from '@vizora/dashboard-blocks';
import { applyTheme } from '@vizora/themes';
import { useEffect, useState } from 'react';
import { fetchUsageMetrics } from './api';

export function OrgDashboard({ orgId }: { orgId: string }) {
  const [data, setData] = useState<UsageMetrics[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    fetchUsageMetrics(orgId, '7d').then(setData);
  }, [orgId]);

  const totals = {
    spend: data.reduce((s, x) => s + x.costUsd, 0),
    tokens: data.reduce((s, x) => s + x.inputTokens + x.outputTokens, 0),
    avgLatency: Math.round(
      data.reduce((s, x) => s + x.latencyMs, 0) / data.length
    ),
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1440, margin: '0 auto' }}>
      <header style={{ marginBottom: 28 }}>
        <h1>API Usage & Billing</h1>
        <select value={theme} onChange={(e) => {
          setTheme(e.target.value as any);
          applyTheme(e.target.value as any);
        }}>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </header>

      {/* KPI Cards */}
      <KpiGrid
        items={[
          { label: 'Total Spend (7d)', value: `$${totals.spend.toFixed(2)}` },
          { label: 'Tokens Processed', value: totals.tokens.toLocaleString() },
          { label: 'Avg Latency', value: `${totals.avgLatency}ms` },
        ]}
      />

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginTop: 16 }}>
        {/* Token Usage — AI-native component */}
        <div className="vz-card" style={{ padding: 20 }}>
          <TokenUsageChart data={data} height={300} />
        </div>

        {/* Cost Trend */}
        <div className="vz-card" style={{ padding: 20 }}>
          <AreaChart
            title="Spend trend"
            description="7-day spend trajectory"
            data={data}
            x={(d) => d.ts}
            y={(d) => d.costUsd}
            yLabel="$"
            height={300}
          />
        </div>
      </div>

      {/* Latency by model */}
      <div className="vz-card" style={{ padding: 20, marginTop: 16 }}>
        <LineChart
          title="Latency by model"
          description="p50 latency over time"
          data={data}
          x={(d) => d.ts}
          y={(d) => d.latencyMs}
          series={(d) => d.model}
          yLabel="ms"
          height={260}
        />
      </div>
    </div>
  );
}
```

### Step 4: Customize Theming

Vizora ships with dark/light/midnight CSS variable themes. **Override in your app:**

```css
/* your-app.css */
:root {
  /* Vizora color palette — override any variable */
  --vz-bg: #0a0e27;        /* Your brand primary */
  --vz-fg: #f0f4ff;
  --vz-accent: #8b5cf6;    /* Your brand accent */
  --vz-border: #1e293b;
  --vz-series-1: #3b82f6;  /* Model A */
  --vz-series-2: #ec4899;  /* Model B */
  --vz-series-3: #10b981;  /* Model C */
}

.vz-card {
  background: var(--vz-surface);
  border: 1px solid var(--vz-border);
  border-radius: 12px;
}
```

### Step 5: Real-Time Updates (Optional)

**WebSocket for live dashboards:**

```tsx
import { useEffect, useState } from 'react';

export function LiveDashboard({ orgId }: { orgId: string }) {
  const [data, setData] = useState<UsageMetrics[]>([]);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.your-provider.com/usage/${orgId}`);
    
    ws.onmessage = (event) => {
      const newMetric = JSON.parse(event.data) as UsageMetrics;
      setData((prev) => [...prev.slice(-99), newMetric]); // Keep last 100 points
    };

    return () => ws.close();
  }, [orgId]);

  // Render charts with latest data
  return <LineChart data={data} x={(d) => d.ts} y={(d) => d.costUds} />;
}
```

### Step 6: Embed in Your Existing Admin UI

**If you have a dashboard framework (e.g., Next.js, your own SPA):**

```tsx
// pages/dashboard/[orgId].tsx
import { OrgDashboard } from '@/components/dashboards/OrgDashboard';
import { withAuth } from '@/lib/auth';

export default function DashboardPage({ params: { orgId } }) {
  return <OrgDashboard orgId={orgId} />;
}

export const getServerSideProps = withAuth(async (context) => {
  const { orgId } = context.params;
  // Verify user has access to this org
  return { props: { orgId } };
});
```

### Step 7: Bundle & Deploy

```bash
# Install deps
npm install

# Build your app (Vizora is tree-shakeable)
npm run build

# Deploy (Vercel, AWS, your infrastructure)
npm run deploy
```

**Bundle size impact:** Vizora adds ~10KB gzipped (with d3). Negligible for most dashboards.

---

## For Observability Platforms (Datadog, New Relic, etc.)

### The Pitch
Ship a **"Logs for LLMs"** module or **"AI Agent Monitoring"** dashboard powered by Vizora components.

### Integration Points
1. **Data ingest:** Parse LLM traces (tokens, latency, errors) from your agent SDK
2. **Dashboard:** Vizora `TokenUsageChart`, `Heatmap` for time-of-day patterns
3. **Alerts:** Threshold-based notifications on `TokenUsageChart` data
4. **Export:** Integrations with your existing observability UI

### Example: Langchain Integration

```tsx
// langchain-vizora-plugin.ts
import { BaseCallbackHandler } from 'langchain/callbacks';
import { TokenUsageChart } from '@vizora/ai-visuals';

export class VizoraDashboardHandler extends BaseCallbackHandler {
  name = 'vizora_dashboard';
  private metrics: any[] = [];

  async handleLLMEnd(output: any): Promise<void> {
    this.metrics.push({
      ts: new Date(),
      model: output.model,
      inputTokens: output.usage.input,
      outputTokens: output.usage.output,
      costUsd: this.calculateCost(output),
    });
  }

  render() {
    return <TokenUsageChart data={this.metrics} />;
  }
}

// Usage in Langchain app
const chain = new LLMChain({
  llm: new ChatOpenAI(),
  callbacks: [new VizoraDashboardHandler()],
});
```

---

## For AI Agent Platforms (Langchain, AutoGen)

### The Pitch
Embed **agent workflow visualizations** and **eval scoreboard** into your platform.

### Integration Points
```tsx
// Agent execution dashboard
<AgentWorkflowGraph agentSteps={executionTrace} />;

// Eval results
<EvalScoreboard results={benchmarkResults} />;

// Cost tracking
<TokenUsageChart data={agentMetrics} />;
```

---

## For SaaS Analytics (general)

### The Pitch
Use Vizora for any SaaS that needs **fast, themable, accessible charts** without building from scratch.

### Example: Usage-Based Billing Dashboard

```tsx
<BarChart
  data={customerUsage}
  x={(d) => d.customer}
  y={(d) => d.usageUnits}
  series={(d) => d.tier}
  title="Customer usage by tier"
  description="Usage units per customer, grouped by subscription tier."
/>
```

---

## Copy-Paste vs. NPM Import: When to Use Each

| Approach | When | Pros | Cons |
|----------|------|------|------|
| **NPM (`npm install @vizora/charts`)** | Building a SaaS with charts | Automatic updates, smaller dist if you use few components, version control | Dependency management, version lock-in |
| **Copy-Paste (v0.5+, `npx vizora add`)** | Internal tools, one-off dashboards | Full source control, no version surprises, fork-friendly | Manual updates, duplicate code across projects |

---

## Bundle Size Checklist

```
@vizora/core:              5.4KB
@vizora/charts:            0.6KB  (add one chart type at a time)
@vizora/ai-visuals:        1.0KB  (TokenUsageChart only)
@vizora/dashboard-blocks:  1.4KB  (KpiGrid)
@vizora/themes:            0.3KB  (CSS variables, auto-loaded)
d3 (peer dependency):      ~3KB   (shared across all packages)
────────────────────────────────
Total (typical dashboard): ~10KB gzipped
```

---

## Rollout Plan (Recommended Timeline)

### Phase 1: Proof of Concept (1–2 weeks)
- [ ] Install Vizora packages
- [ ] Wire one data source (e.g., token usage)
- [ ] Render `TokenUsageChart` + one line chart
- [ ] Test in dev environment

### Phase 2: Core Dashboard (2–4 weeks)
- [ ] Build KPI cards + 6 core charts
- [ ] Integrate with your backend data pipeline
- [ ] Customize theming to match your brand
- [ ] Deploy to staging

### Phase 3: Polish & Shipping (1–2 weeks)
- [ ] A/B test chart types with users
- [ ] Performance optimization (if needed)
- [ ] Accessibility audit (Vizora ships with a11y built-in)
- [ ] Ship to production

### Phase 4: Future Enhancements
- [ ] Real-time WebSocket updates
- [ ] Custom eval visualization modules
- [ ] Export to PDF / Slack
- [ ] Mobile-responsive layout

---

## FAQ

**Q: Will Vizora stay open-source?**  
A: Yes. MIT license, VizoraHQ org, no plans for closure.

**Q: Can I use Vizora in a closed-source product?**  
A: Yes, MIT allows commercial use.

**Q: What about version stability?**  
A: v0.x is pre-1.0; expect API changes. v1.0 will have an LTS policy.

**Q: How do I report bugs?**  
A: GitHub issues: https://github.com/VizoraHQ/vizora-ui/issues

**Q: Can I customize chart internals?**  
A: Yes. With the copy-paste CLI (v0.5+), you own the source. Or fork the repo.

**Q: Do I need D3 knowledge?**  
A: No. Vizora abstracts D3 away. You just pass data + accessor functions.

**Q: What about performance with 10K+ data points?**  
A: SVG is fine for ~5K points. Canvas/WebGL mode (v0.8+) handles 100K+.

---

## Next Steps

1. **Try the playground:** `pnpm install && pnpm dev` → http://localhost:5173
2. **Read the CLAUDE.md** for current roadmap & state
3. **Open an issue** on GitHub if you need a specific chart type
4. **Start a POC** with one component (TokenUsageChart is the easiest win)

---

*Last updated: 2026-05-23 · Vizora v0.2*
