import { useState } from "react";
import { DataExplorer } from "./pages/DataExplorer";
import { applyTheme } from "@vizora/themes";
import type { ThemeName } from "@vizora/themes";

export function App() {
  const [theme, setTheme] = useState<ThemeName>("dark");

  const onTheme = (t: ThemeName): void => {
    setTheme(t);
    applyTheme(t);
  };

  return <DataExplorer theme={theme} onTheme={onTheme} />;
}
