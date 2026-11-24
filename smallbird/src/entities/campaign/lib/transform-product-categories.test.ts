import { productCategoryListSchema } from "../model/product-category-schema";
import { transformProductCategories } from "./transform-product-categories";

describe("transformProductCategories", () => {
  it("대분류 안에 중분류를 넣은 트리를 그대로 옮긴다", () => {
    const response = productCategoryListSchema.parse({
      list: [
        {
          idx: 8,
          name: "여행/문화",
          children: [{ idx: 36, name: "호텔/펜션 예약" }],
        },
      ],
    });

    expect(transformProductCategories(response)).toEqual([
      {
        idx: 8,
        name: "여행/문화",
        children: [{ idx: 36, name: "호텔/펜션 예약" }],
      },
    ]);
  });

  it("중분류가 생략돼도 빈 배열로 읽는다", () => {
    const response = productCategoryListSchema.parse({
      list: [{ idx: 44, name: "기타" }],
    });

    expect(transformProductCategories(response)[0]?.children).toEqual([]);
  });
});
