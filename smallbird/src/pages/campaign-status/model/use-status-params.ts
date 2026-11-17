import { useSearchParams } from "react-router";

import {
  CAMPAIGN_TYPE_FILTERS,
  isCampaignTypeFilter,
  useCampaignTypeLabel,
} from "@/entities/campaign";
import {
  applyFilterValues,
  readFilterValues,
} from "@/shared/components/list-filter";
import { FILTER_PANEL_PARAM } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useTabParam } from "@/shared/lib";

import { parsePageParam } from "../lib/parse-page-param";
import {
  DEFAULT_TAB,
  KEYWORD_PARAM,
  PAGE_PARAM,
  RESET_ON_TAB_CHANGE,
  STATUS_TABS,
  TAB_PARAM,
  TAB_STAGES,
  TYPE_FIELD_WIDTH,
  TYPE_PARAM,
} from "./constants";

import type {
  FilterField,
  FilterValues,
} from "@/shared/components/list-filter";

/**
 * 현황 목록의 탭·검색어·유형·쪽. 주소 쿼리가 원본이라 새로고침·뒤로 가기·공유에도 유지되고 잘못된 값은 기본값으로 읽음.
 * 목록 요청 조건(`baseQuery`, 쪽 제외)도 여기서 만듦.
 */
export function useStatusParams() {
  const { t } = useTranslation("pages/campaign-status");
  const typeLabel = useCampaignTypeLabel();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tab, setTab } = useTabParam({
    tabs: STATUS_TABS,
    defaultTab: DEFAULT_TAB,
    param: TAB_PARAM,
    resetParams: RESET_ON_TAB_CHANGE,
  });

  const fields: FilterField[] = [
    {
      type: "select",
      id: TYPE_PARAM,
      label: t("filter.type.label"),
      inlinePlaceholder: t("filter.type.placeholder"),
      placeholder: t("filter.type.placeholder"),
      // 시안 140은 공용 Select의 안쪽 간격(16)에서 "전체 캠페인 유형"이 말줄임되어 글자가 들어가는 폭으로 둠.
      width: TYPE_FIELD_WIDTH,
      options: CAMPAIGN_TYPE_FILTERS.map((type) => ({
        value: type,
        label: typeLabel(type),
      })),
    },
  ];
  const filters = readFilterValues(searchParams, fields);
  const typeValue = filters[TYPE_PARAM] ?? null;
  const type = isCampaignTypeFilter(typeValue) ? typeValue : null;
  const keyword = searchParams.get(KEYWORD_PARAM) ?? "";
  const page = parsePageParam(searchParams.get(PAGE_PARAM));

  function update(change: (params: URLSearchParams) => void) {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      change(params);
      return params;
    });
  }

  return {
    tab,
    setTab,
    fields,
    filters,
    type,
    keyword,
    page,
    baseQuery: { statuses: TAB_STAGES[tab], type, keyword },
    setKeyword: (next: string) =>
      update((params) => {
        if (next) params.set(KEYWORD_PARAM, next);
        else params.delete(KEYWORD_PARAM);
        params.delete(PAGE_PARAM);
      }),
    setFilters: (next: FilterValues) =>
      update((params) => applyFilterValues(params, fields, next, PAGE_PARAM)),
    /** MO 필터 모달의 "적용하기". 필터를 쓰고 모달을 닫는 두 일을 한 기록에서 함. */
    applyFiltersAndClosePanel: (next: FilterValues) =>
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          applyFilterValues(params, fields, next, PAGE_PARAM);
          params.delete(FILTER_PANEL_PARAM);
          return params;
        },
        { replace: true },
      ),
    /** 새로고침 아이콘: 검색어를 지우고 유형을 전체로 돌리며 지금 탭은 유지함(REQ-5-0007). */
    reset: () =>
      update((params) => {
        applyFilterValues(params, fields, {}, PAGE_PARAM);
        params.delete(KEYWORD_PARAM);
      }),
    setPage: (next: number) =>
      update((params) => params.set(PAGE_PARAM, String(next))),
    /** 마지막 쪽의 항목을 지웠거나 주소를 직접 고쳐 범위를 벗어난 쪽을 마지막 쪽으로 당김(기록은 쌓지 않음). */
    clampPage: (lastPage: number) =>
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          params.set(PAGE_PARAM, String(lastPage));
          return params;
        },
        { replace: true },
      ),
    buildPageHref: (target: number) => {
      const params = new URLSearchParams(searchParams);
      params.set(PAGE_PARAM, String(target));
      return `?${params.toString()}`;
    },
  };
}
