import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatDuration,
  formatNumber,
  formatTokens,
} from "./format";

describe("formatNumber", () => {
  it("formats integers in full mode by default", () => {
    expect(formatNumber(1234)).toBe("1,234");
  });

  it("compacts when asked", () => {
    expect(formatNumber(1500, { compact: true })).toBe("1.5K");
    expect(formatNumber(2_400_000, { compact: true })).toBe("2.4M");
  });

  it("returns em-dash for non-finite input", () => {
    expect(formatNumber(NaN)).toBe("—");
    expect(formatNumber(Infinity)).toBe("—");
  });
});

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    expect(formatCurrency(12.5)).toBe("$12.50");
  });

  it("uses more precision for sub-dollar amounts", () => {
    expect(formatCurrency(0.0123)).toBe("$0.0123");
  });

  it("respects custom currency codes", () => {
    expect(formatCurrency(10, "EUR")).toMatch(/€/);
  });
});

describe("formatTokens", () => {
  it("uses raw count under 1000", () => {
    expect(formatTokens(420)).toBe("420 tok");
  });

  it("compacts at 1000+", () => {
    expect(formatTokens(1500)).toBe("1.5K tok");
    expect(formatTokens(2_000_000)).toBe("2M tok");
  });
});

describe("formatDuration", () => {
  it("uses microseconds for sub-millisecond input", () => {
    expect(formatDuration(0.5)).toBe("500µs");
  });

  it("uses ms under a second", () => {
    expect(formatDuration(420)).toBe("420ms");
  });

  it("uses seconds under a minute", () => {
    expect(formatDuration(15_000)).toBe("15.00s");
  });

  it("uses minutes for longer", () => {
    expect(formatDuration(180_000)).toBe("3.0m");
  });
});

describe("formatDate", () => {
  it("formats valid dates", () => {
    const out = formatDate(new Date("2026-05-23T14:30:00Z"));
    expect(out.length).toBeGreaterThan(0);
    expect(out).not.toBe("—");
  });

  it("returns em-dash for invalid input", () => {
    expect(formatDate("not a date")).toBe("—");
  });
});
