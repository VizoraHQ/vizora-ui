import type { Options } from "tsup";

export const baseConfig: Options = {
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: "es2022",
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "d3-array",
    "d3-scale",
    "d3-shape",
  ],
};
