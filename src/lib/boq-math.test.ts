import { describe, expect, it } from "vitest";
import { boqTotals } from "./boq-math";

describe("boqTotals", () => {
  it("applies wastage, prelims, contingency, margin then tax", () => {
    const t = boqTotals({
      lines: [{ id: "a", ref: "1", trade: "Concrete", description: "", unit: "m3", quantity: 10, rate: 100 }],
      wastagePct: 10, prelimsPct: 0, contingencyPct: 0, marginPct: 10, taxPct: 18,
    });
    expect(t.direct).toBe(1000);
    expect(t.subtotal).toBeCloseTo(1210);
    expect(t.total).toBeCloseTo(1427.8);
  });
});
