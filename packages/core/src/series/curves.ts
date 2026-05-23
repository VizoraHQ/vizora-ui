import {
  curveCardinal,
  curveLinear,
  curveMonotoneX,
  curveStep,
  curveStepAfter,
  curveStepBefore,
} from "d3-shape";
import type { CurveFactory } from "d3-shape";

export type CurveKind =
  | "linear"
  | "monotone"
  | "step"
  | "step-before"
  | "step-after"
  | "cardinal";

export function getCurve(kind: CurveKind): CurveFactory {
  switch (kind) {
    case "monotone":
      return curveMonotoneX;
    case "step":
      return curveStep;
    case "step-before":
      return curveStepBefore;
    case "step-after":
      return curveStepAfter;
    case "cardinal":
      return curveCardinal;
    case "linear":
    default:
      return curveLinear;
  }
}
