import { calcHeroProgress } from "./hero-progress";

describe("calcHeroProgress", () => {
  it("최상단이면 진행도 0", () => {
    expect(calcHeroProgress(0, 500)).toBe(0);
  });

  it("절반 스크롤하면 0.5", () => {
    expect(calcHeroProgress(250, 500)).toBe(0.5);
  });

  it("축소 거리를 넘어가도 1 에서 멈춘다", () => {
    expect(calcHeroProgress(500, 500)).toBe(1);
    expect(calcHeroProgress(9999, 500)).toBe(1);
  });

  it("음수 scrollTop 은 0 으로 눌린다 (iOS 바운스 스크롤)", () => {
    expect(calcHeroProgress(-120, 500)).toBe(0);
  });

  it("축소 거리가 0 이하면 1 을 반환한다 (0 으로 나누지 않는다)", () => {
    expect(calcHeroProgress(100, 0)).toBe(1);
    expect(calcHeroProgress(100, -10)).toBe(1);
  });
});
