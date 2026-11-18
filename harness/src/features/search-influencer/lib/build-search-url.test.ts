import { buildInfluencerSearchUrl } from "./build-search-url";

describe("buildInfluencerSearchUrl", () => {
  it("문구를 인코딩하고 플랫폼을 붙인다", () => {
    expect(
      buildInfluencerSearchUrl({
        query: "스킨케어 & 20대",
        platform: "instagram",
      }),
    ).toBe(
      `/influencers/search?q=${encodeURIComponent("스킨케어 & 20대").replaceAll("%20", "+")}&platform=instagram`,
    );
  });

  it("플랫폼을 고르지 않았으면 platform 쿼리를 뺀다", () => {
    expect(buildInfluencerSearchUrl({ query: "hello" })).toBe(
      "/influencers/search?q=hello",
    );
  });

  it("문구의 앞뒤 공백을 지운다", () => {
    expect(buildInfluencerSearchUrl({ query: "  hello  " })).toBe(
      "/influencers/search?q=hello",
    );
  });
});
