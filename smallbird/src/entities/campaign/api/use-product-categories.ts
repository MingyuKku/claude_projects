import useSWR from "swr";

import { fetchProductCategories } from "./product-category-api";

/** 상품 카테고리 전체 목록. 거의 바뀌지 않아 한 번 읽은 값을 다시 읽지 않음. */
export function useProductCategories() {
  const { data, error, isLoading, mutate } = useSWR(
    ["campaign", "product-categories"],
    fetchProductCategories,
    { revalidateOnFocus: false, revalidateIfStale: false },
  );
  return { categories: data, error, isLoading, mutate };
}
