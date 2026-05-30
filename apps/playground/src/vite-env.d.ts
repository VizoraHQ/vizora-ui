/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Anthropic API key for the Data Explorer AI assistant (optional). */
  readonly VITE_ANTHROPIC_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
