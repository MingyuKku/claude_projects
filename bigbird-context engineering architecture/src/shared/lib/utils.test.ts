import { cn } from "./utils";

describe("cn", () => {
  it("충돌하는 Tailwind 클래스는 뒤의 것이 이긴다", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("falsy 값은 무시한다", () => {
    const hidden = Math.random() > 2;
    expect(cn("a", hidden && "b", undefined, "c")).toBe("a c");
  });
});
