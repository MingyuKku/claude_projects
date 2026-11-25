import { describe, expect, it } from "vitest";

import { toBookmarkQueryParams, toSearchQueryParams } from "./search-query";

import type { CreatorSearchFilters } from "./search-query";

const ALL_CATEGORY_IDX = 178;

const base: CreatorSearchFilters = {
  keyword: "",
  platformIdx: 1,
  categoryIdxs: [],
  ranges: {},
  profile: {},
  sort: "FOLLOWER_DESC",
};

describe("toSearchQueryParams", () => {
  it("카테고리를 고르지 않으면 '전체' idx를 보냄", () => {
    expect(toSearchQueryParams(base, ALL_CATEGORY_IDX)).toMatchObject({
      platformIdx: 1,
      categoryIdxList: "178",
      sort: "FOLLOWER_DESC",
    });
  });

  it("여러 카테고리는 쉼표로 이어 보냄", () => {
    const params = toSearchQueryParams(
      { ...base, categoryIdxs: [3, 7] },
      ALL_CATEGORY_IDX,
    );
    expect(params.categoryIdxList).toBe("3,7");
  });

  it("최소 0과 끝 눈금 최대는 보내지 않고, 끝 눈금보다 작은 최대만 보냄", () => {
    const params = toSearchQueryParams(
      {
        ...base,
        ranges: {
          follower: { min: 0, max: 10_000_000 },
          krFollowerRatio: { min: 10.5, max: null },
          brandIndex: { min: 20, max: 39.9 },
          reply: { min: 0, max: 100_000 },
        },
      },
      ALL_CATEGORY_IDX,
    );
    expect(params).toMatchObject({
      krFollowerRatioMin: 10.5,
      brandIndexMin: 20,
      brandIndexMax: 39.9,
    });
    for (const key of [
      "followerMin",
      "followerMax",
      "krFollowerRatioMax",
      "replyMin",
      "replyMax",
    ]) {
      expect(params[key]).toBeUndefined();
    }
  });

  it("비용 구간은 최소·최대로, 최상위 구간은 최대 없이 보냄", () => {
    const params = toSearchQueryParams(
      {
        ...base,
        aiPredictedCost: { min: 50_000, max: 99_999 },
        desiredCost: { min: 3_000_000, max: null },
      },
      ALL_CATEGORY_IDX,
    );
    expect(params).toMatchObject({
      aiPredictedCostMin: 50_000,
      aiPredictedCostMax: 99_999,
      desiredCostMin: 3_000_000,
    });
    expect(params.desiredCostMax).toBeUndefined();
  });

  it("키워드는 앞뒤 공백을 지우고 비면 보내지 않음", () => {
    expect(
      toSearchQueryParams({ ...base, keyword: "  " }, ALL_CATEGORY_IDX).keyword,
    ).toBeUndefined();
    expect(
      toSearchQueryParams({ ...base, keyword: " abc " }, ALL_CATEGORY_IDX)
        .keyword,
    ).toBe("abc");
  });
});

describe("toBookmarkQueryParams", () => {
  it("전체 폴더(null)는 folderIdx를 보내지 않음", () => {
    const params = toBookmarkQueryParams({
      folderIdx: null,
      categoryIdxs: [],
      keyword: "",
      ranges: {},
      profile: { genderIdx: 2 },
    });
    expect(params.folderIdx).toBeUndefined();
    expect(params.genderIdx).toBe(2);
    expect(params.categoryIdxList).toBeUndefined();
  });

  it("고른 카테고리와 비용을 보냄", () => {
    const params = toBookmarkQueryParams({
      folderIdx: 1,
      categoryIdxs: [3, 5],
      aiPredictedCost: { min: 50_000, max: 99_999 },
      keyword: "",
      ranges: {},
      profile: {},
    });
    expect(params).toMatchObject({
      folderIdx: 1,
      categoryIdxList: "3,5",
      aiPredictedCostMin: 50_000,
      aiPredictedCostMax: 99_999,
    });
  });
});
