import type { ProductCategoryListResponse } from "../model/product-category-schema";
import type { ProductCategory } from "../model/types";

export function transformProductCategories(
  response: ProductCategoryListResponse,
): ProductCategory[] {
  return response.list.map((category) => ({
    idx: category.idx,
    name: category.name,
    children: category.children.map((child) => ({
      idx: child.idx,
      name: child.name,
    })),
  }));
}
