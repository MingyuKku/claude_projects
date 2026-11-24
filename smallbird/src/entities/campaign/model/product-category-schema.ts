import { z } from "zod";

import { list } from "./schema-helpers";

// 상품 카테고리 목록(A-5.5). 대분류 안에 중분류를 넣은 트리이고, 이름은 서버 값을 그대로 보여 줌.

const productMiddleCategorySchema = z.object({
  idx: z.number().int(),
  name: z.string(),
});

const productCategorySchema = z.object({
  idx: z.number().int(),
  name: z.string(),
  children: list(productMiddleCategorySchema),
});

export const productCategoryListSchema = z.object({
  list: list(productCategorySchema),
});
export type ProductCategoryListResponse = z.infer<
  typeof productCategoryListSchema
>;
