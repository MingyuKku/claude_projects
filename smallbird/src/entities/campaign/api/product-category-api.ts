import { serverApiV3 } from "@/shared/api";

import { transformProductCategories } from "../lib/transform-product-categories";
import { productCategoryListSchema } from "../model/product-category-schema";

import type { ProductCategory } from "../model/types";

/** A-5.5 `GET /v3/campaign/product-categories`. 대분류·중분류 전체를 한 번에 읽음. */
export async function fetchProductCategories(): Promise<ProductCategory[]> {
  return transformProductCategories(
    productCategoryListSchema.parse(
      await serverApiV3.get("/campaign/product-categories"),
    ),
  );
}
