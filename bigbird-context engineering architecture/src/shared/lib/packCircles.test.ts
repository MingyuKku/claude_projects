import { describe, expect, it } from "vitest";

import { packCircles } from "./packCircles";

describe("packCircles", () => {
  it("원끼리 겹치지 않게 배치한다", () => {
    const circles = packCircles([40, 32, 28, 24, 24, 18, 18, 18, 16]);
    for (const [i, a] of circles.entries()) {
      for (const b of circles.slice(i + 1)) {
        expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(
          a.r + b.r - 0.02,
        );
      }
    }
  });

  it("첫 원은 원점에 놓는다", () => {
    expect(packCircles([10])).toEqual([{ x: 0, y: 0, r: 10 }]);
  });
});
