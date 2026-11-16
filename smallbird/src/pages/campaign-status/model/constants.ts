import type { CampaignStage } from "@/entities/campaign";

/** 탭. 한 캠페인은 전체 탭 말고는 한 탭에만 보임(REQ-5-0003). */
export const STATUS_TABS = [
  "all",
  "draft",
  "review",
  "active",
  "ended",
] as const;
export type StatusTab = (typeof STATUS_TABS)[number];
export const DEFAULT_TAB: StatusTab = "all";

/** 탭이 서버 `status`로 보내는 진행 단계. 비면 전체. */
export const TAB_STAGES: Record<StatusTab, readonly CampaignStage[]> = {
  all: [],
  draft: ["DRAFT"],
  review: ["REVIEWING", "REJECTED"],
  active: ["IN_PROGRESS"],
  ended: ["ENDED"],
};

export const TAB_PARAM = "tab";
export const TYPE_PARAM = "type";
export const KEYWORD_PARAM = "q";
export const PAGE_PARAM = "page";

/** 탭을 바꾸면 쪽은 1로 돌아가고 검색어·유형은 유지함(REQ-5-0008). 열어 둔 필터 화면은 닫음. */
export const RESET_ON_TAB_CHANGE = [PAGE_PARAM, "panel"] as const;

/** PC·TAB 툴바의 유형 선택 폭(px). */
export const TYPE_FIELD_WIDTH = 150;
