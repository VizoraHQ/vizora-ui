import type { ThemeName } from "./tokens";

const THEME_ATTR = "data-vz-theme";

export function applyTheme(theme: ThemeName, target?: HTMLElement): void {
  if (typeof document === "undefined") return;
  const el = target ?? document.documentElement;
  el.setAttribute(THEME_ATTR, theme);
}

export function getCurrentTheme(target?: HTMLElement): ThemeName | null {
  if (typeof document === "undefined") return null;
  const el = target ?? document.documentElement;
  const value = el.getAttribute(THEME_ATTR);
  if (value === "dark" || value === "light" || value === "midnight") return value;
  return null;
}
