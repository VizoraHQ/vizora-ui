import { useEffect, useRef, useState } from "react";
import { OPERATORS } from "./parse";
import type { ChartType, ChatMessage, Filter, Operator, ParsedData } from "./parse";

interface Props {
  data: ParsedData;
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  onAddFilter: (filter: Filter) => void;
  onSetChartType: (type: ChartType) => void;
  onResetFilters: () => void;
}

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MODEL = "claude-sonnet-4-20250514";

function buildSystemPrompt(data: ParsedData): string {
  const sample = JSON.stringify(data.rows.slice(0, 3));
  return [
    "You are Vizora's AI data analyst. The user has uploaded a dataset.",
    `Columns: ${data.columns.join(", ")}`,
    `Sample rows (first 3): ${sample}`,
    "",
    "When the user asks to filter data, respond ONLY with valid JSON on the first line, then a plain-English explanation:",
    '{"action":"filter","column":"Revenue","operator":">","value":5000}',
    "",
    "When the user asks to change chart type, respond with:",
    '{"action":"chart","type":"bar"}',
    "",
    "When the user asks to reset filters:",
    '{"action":"reset"}',
    "",
    "Supported operators: >, <, =, >=, <=, contains, startsWith",
    "Always confirm the action in plain English after the JSON.",
  ].join("\n");
}

const CHART_TYPES: ChartType[] = ["bar", "line", "area", "scatter"];

interface AIAction {
  action?: string;
  column?: string;
  operator?: string;
  value?: string | number;
  type?: string;
}

/**
 * If the first line is a valid action object, dispatch it and strip it from
 * the displayed text. Returns the explanation to show in the chat bubble.
 */
function dispatchAction(
  raw: string,
  data: ParsedData,
  handlers: Pick<Props, "onAddFilter" | "onSetChartType" | "onResetFilters">,
): string {
  const newline = raw.indexOf("\n");
  const firstLine = (newline === -1 ? raw : raw.slice(0, newline)).trim();
  const rest = newline === -1 ? "" : raw.slice(newline + 1).trim();

  let parsed: AIAction | null = null;
  try {
    const candidate = JSON.parse(firstLine) as unknown;
    if (candidate && typeof candidate === "object") parsed = candidate as AIAction;
  } catch {
    parsed = null;
  }

  if (!parsed?.action) return raw.trim();

  if (parsed.action === "filter" && parsed.column && parsed.operator) {
    const op = parsed.operator as Operator;
    if (OPERATORS.includes(op) && data.columns.includes(parsed.column)) {
      const numeric =
        data.types[parsed.column] === "numeric" && parsed.value != null && !Number.isNaN(Number(parsed.value));
      handlers.onAddFilter({
        column: parsed.column,
        operator: op,
        value: numeric ? Number(parsed.value) : String(parsed.value ?? ""),
      });
    }
  } else if (parsed.action === "chart" && parsed.type) {
    const type = parsed.type as ChartType;
    if (CHART_TYPES.includes(type)) handlers.onSetChartType(type);
  } else if (parsed.action === "reset") {
    handlers.onResetFilters();
  }

  return rest || "Done.";
}

export function ChatPanel({
  data,
  messages,
  onMessagesChange,
  onAddFilter,
  onSetChartType,
  onResetFilters,
}: Props) {
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");

    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    onMessagesChange(history);

    if (!API_KEY) {
      onMessagesChange([
        ...history,
        {
          role: "assistant",
          content:
            "No API key configured. Set VITE_ANTHROPIC_API_KEY in apps/playground/.env to enable the assistant.",
        },
      ]);
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1000,
          system: buildSystemPrompt(data),
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error(`API error ${res.status}`);
      }

      const json = (await res.json()) as { content?: { type: string; text?: string }[] };
      const raw = json.content?.map((b) => (b.type === "text" ? b.text ?? "" : "")).join("") ?? "";
      const explanation = dispatchAction(raw, data, { onAddFilter, onSetChartType, onResetFilters });
      onMessagesChange([...history, { role: "assistant", content: explanation }]);
    } catch (e) {
      onMessagesChange([
        ...history,
        { role: "assistant", content: `Sorry — the request failed (${e instanceof Error ? e.message : "unknown"}).` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside
      aria-label="AI assistant"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        borderLeft: "1px solid var(--vz-border)",
        background: "var(--vz-surface)",
      }}
    >
      <div style={{ padding: "16px 16px 12px", borderBottom: "1px solid var(--vz-border)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--vz-fg)" }}>AI data analyst</div>
        <div style={{ fontSize: 11, color: "var(--vz-muted)", marginTop: 2 }}>
          Ask to filter rows or change the chart type.
        </div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 12, color: "var(--vz-muted)", lineHeight: 1.6 }}>
            Try: <em>"show only rows where revenue &gt; 5000"</em> or <em>"switch to a line chart"</em>.
          </div>
        )}
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {busy && (
          <div
            style={{
              alignSelf: "flex-start",
              fontSize: 12,
              color: "var(--vz-muted)",
              fontStyle: "italic",
            }}
          >
            analyzing…
          </div>
        )}
      </div>

      <div style={{ padding: 12, borderTop: "1px solid var(--vz-border)", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void send()}
          placeholder="Ask the analyst…"
          aria-label="Message the AI analyst"
          style={{
            flex: 1,
            background: "var(--vz-bg)",
            color: "var(--vz-fg)",
            border: "1px solid var(--vz-border)",
            borderRadius: 8,
            padding: "8px 10px",
            fontSize: 12,
            fontFamily: "inherit",
          }}
        />
        <button
          onClick={() => void send()}
          disabled={busy}
          style={{
            background: "var(--vz-accent)",
            color: "white",
            border: "none",
            borderRadius: 8,
            padding: "0 14px",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: busy ? "wait" : "pointer",
            opacity: busy ? 0.6 : 1,
          }}
        >
          Send
        </button>
      </div>
    </aside>
  );
}

function Bubble({ role, content }: { role: ChatMessage["role"]; content: string }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "85%",
        background: isUser ? "var(--vz-accent)" : "var(--vz-bg)",
        color: isUser ? "white" : "var(--vz-fg)",
        border: isUser ? "none" : "1px solid var(--vz-border)",
        borderRadius: 10,
        padding: "8px 10px",
        fontSize: 12,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {content}
    </div>
  );
}
