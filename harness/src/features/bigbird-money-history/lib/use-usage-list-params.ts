import { useSearchParams } from "react-router";

import { useUsageFilterOptions } from "../api/use-usage-filter-options";
import { LIST_PAGE_SIZE_OPTIONS } from "../model/constants";
import { toUsageQuery } from "./usage-query";
import { useListParams } from "./use-list-params";
import {
  OPTION_FILTER_IDS,
  useUsageFilterFields,
} from "./use-usage-filter-fields";

/**
 * 사용 내역의 필터 필드·주소 쿼리와 그로부터 만든 요청 조건(쪽 번호 제외). 목록과 사용 상세가 같은 조건으로 읽음.
 * `isOptionsPending`: 주소에 캠페인·사용 내역 필터가 있는데 선택지를 아직 읽는 중이면 참. 그동안은 필터가 무시되므로
 * 목록을 읽지 말아야 필터 없는 목록을 먼저 읽었다가 다시 바꾸는 일이 없음. 선택지 조회가 실패하면 거짓이 되어 필터 없이 읽음.
 */
export function useUsageListParams() {
  const fields = useUsageFilterFields();
  const params = useListParams(fields, LIST_PAGE_SIZE_OPTIONS);
  const baseQuery = toUsageQuery(
    params.filters,
    params.pageSize,
    params.keyword,
  );
  const { isLoading: isOptionsLoading } = useUsageFilterOptions();
  const [searchParams] = useSearchParams();
  const isOptionsPending =
    isOptionsLoading && OPTION_FILTER_IDS.some((id) => searchParams.has(id));
  return { fields, params, baseQuery, isOptionsPending };
}
