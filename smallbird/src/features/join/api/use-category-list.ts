import useSWRImmutable from "swr/immutable";

import { memberApi } from "@/shared/api";

import { categoryListResponseSchema } from "../model/schema";

async function fetchCategories() {
  const response = await memberApi.get("/campaign/category");
  return categoryListResponseSchema.parse(response).category;
}

/**
 * Company categories are master data that rarely changes and has nothing to do with
 * permissions, so they are fetched once per session.
 */
export function useCategoryList() {
  const { data, error, isLoading } = useSWRImmutable(
    ["join", "categories"],
    fetchCategories,
  );
  return { categories: data ?? [], isLoading, isError: Boolean(error) };
}
