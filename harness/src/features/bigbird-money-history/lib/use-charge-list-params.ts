import { LIST_PAGE_SIZE_OPTIONS } from "../model/constants";
import { toChargeQuery } from "./charge-query";
import { useChargeFilterFields } from "./use-charge-filter-fields";
import { useListParams } from "./use-list-params";

/** 충전/출금 내역의 필터 필드·주소 쿼리와 그로부터 만든 요청 조건(쪽 번호 제외). 목록과 거래 상세가 같은 조건으로 읽음. */
export function useChargeListParams() {
  const fields = useChargeFilterFields();
  const params = useListParams(fields, LIST_PAGE_SIZE_OPTIONS);
  const baseQuery = toChargeQuery(params.filters, params.pageSize);
  return { fields, params, baseQuery };
}
