import { LIST_PAGE_SIZE_OPTIONS } from "../model/constants";
import { toUsageQuery } from "./usage-query";
import { useListParams } from "./use-list-params";
import { useUsageFilterFields } from "./use-usage-filter-fields";

/** 사용 내역의 필터 필드·주소 쿼리와 그로부터 만든 요청 조건(쪽 번호 제외). 목록과 사용 상세가 같은 조건으로 읽음. */
export function useUsageListParams() {
  const fields = useUsageFilterFields();
  const params = useListParams(fields, LIST_PAGE_SIZE_OPTIONS);
  const baseQuery = toUsageQuery(params.filters, params.pageSize);
  return { fields, params, baseQuery };
}
