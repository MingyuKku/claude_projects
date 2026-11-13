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

describe("cn - ds 토큰 병합", () => {
  it("ds 간격은 같은 범위의 Tailwind 간격과 서로 덮는다", () => {
    expect(cn("gap-4", "ds-gap-6")).toBe("ds-gap-6");
    expect(cn("ds-gap-6", "gap-4")).toBe("gap-4");
    expect(cn("ds-gap-x-2", "ds-gap-6")).toBe("ds-gap-6");
    expect(cn("px-4 pt-2", "ds-p-6")).toBe("ds-p-6");
    expect(cn("ds-pl-2", "ds-px-4")).toBe("ds-px-4");
    expect(cn("ds-gap-0.5", "ds-gap-px")).toBe("ds-gap-px");
  });

  it("다른 범위의 간격은 남긴다", () => {
    expect(cn("ds-gap-6", "ds-p-6")).toBe("ds-gap-6 ds-p-6");
    expect(cn("ds-p-6", "ds-px-4")).toBe("ds-p-6 ds-px-4");
    expect(cn("ds-px-4", "ds-py-2")).toBe("ds-px-4 ds-py-2");
  });

  it("텍스트 스타일은 앞의 크기·행간·굵기·자간을 지우고 색은 남긴다", () => {
    expect(
      cn(
        "text-sm leading-6 font-bold tracking-tight text-primary",
        "ds-text-sm-5-medium",
      ),
    ).toBe("text-primary ds-text-sm-5-medium");
    expect(cn("ds-text-sm-5-medium", "ds-text-lg-none-semibold")).toBe(
      "ds-text-lg-none-semibold",
    );
  });

  it("ds 그림자와 Tailwind 그림자는 서로 덮는다", () => {
    expect(cn("shadow-md", "ds-shadow-sm")).toBe("ds-shadow-sm");
    expect(cn("ds-shadow", "shadow-lg")).toBe("shadow-lg");
  });
});
