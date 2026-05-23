export type ThemeName = "dark" | "light" | "midnight";

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
};

export type Theme = {
  name: ThemeName;
  bg: string;
  surface: string;
  fg: string;
  muted: string;
  border: string;
  grid: string;
  accent: string;
  series: readonly string[];
};

const SERIES_DARK = [
  "hsl(196 92% 56%)",
  "hsl(273 86% 64%)",
  "hsl(142 72% 50%)",
  "hsl(38 96% 60%)",
  "hsl(340 86% 64%)",
  "hsl(180 70% 50%)",
  "hsl(24 92% 60%)",
  "hsl(258 72% 70%)",
] as const;

const SERIES_LIGHT = [
  "hsl(196 84% 44%)",
  "hsl(273 70% 52%)",
  "hsl(142 60% 38%)",
  "hsl(38 86% 48%)",
  "hsl(340 76% 52%)",
  "hsl(180 60% 38%)",
  "hsl(24 84% 48%)",
  "hsl(258 60% 58%)",
] as const;

export const tokens: Record<ThemeName, Theme> = {
  dark: {
    name: "dark",
    bg: "hsl(240 6% 6%)",
    surface: "hsl(240 5% 10%)",
    fg: "hsl(0 0% 96%)",
    muted: "hsl(240 4% 60%)",
    border: "hsl(240 4% 18%)",
    grid: "hsl(240 4% 16%)",
    accent: "hsl(196 92% 56%)",
    series: SERIES_DARK,
  },
  light: {
    name: "light",
    bg: "hsl(0 0% 100%)",
    surface: "hsl(240 6% 98%)",
    fg: "hsl(240 10% 8%)",
    muted: "hsl(240 4% 46%)",
    border: "hsl(240 6% 90%)",
    grid: "hsl(240 6% 92%)",
    accent: "hsl(196 84% 44%)",
    series: SERIES_LIGHT,
  },
  midnight: {
    name: "midnight",
    bg: "hsl(230 35% 7%)",
    surface: "hsl(230 30% 11%)",
    fg: "hsl(220 30% 96%)",
    muted: "hsl(230 15% 60%)",
    border: "hsl(230 25% 20%)",
    grid: "hsl(230 25% 17%)",
    accent: "hsl(258 92% 68%)",
    series: SERIES_DARK,
  },
};
