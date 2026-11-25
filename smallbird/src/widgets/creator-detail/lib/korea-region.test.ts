import { getKoreaRegion } from "./korea-region";

describe("getKoreaRegion", () => {
  it("상위 지역을 우선하고 없으면 지역명으로 찾는다", () => {
    expect(
      getKoreaRegion({ area: "강남구", parentArea: "서울특별시" }),
    ).toEqual({ label: "서울시", region: "seoul" });
    expect(
      getKoreaRegion({ area: "제주특별자치도", parentArea: null }),
    ).toEqual({ label: "제주도", region: "jeju" });
  });

  it("값이 없거나 모르는 이름이면 지도에서 고르지 않는다", () => {
    expect(
      getKoreaRegion({ area: null, parentArea: null }).region,
    ).toBeUndefined();
    expect(
      getKoreaRegion({ area: "해외", parentArea: null }).region,
    ).toBeUndefined();
  });
});
