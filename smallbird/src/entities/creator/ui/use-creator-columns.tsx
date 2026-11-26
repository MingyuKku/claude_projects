import { useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE } from "@/shared/lib";

import { useCreatorLabels } from "../api/use-creator-labels";
import { useCreatorMetricTexts } from "../lib/use-creator-metric-texts";
import { useCreatorTerms } from "../lib/use-creator-terms";
import { CreatorPlatform } from "./CreatorPlatform";

import type { SearchSortKey } from "../model/search-query";
import type { CreatorViewModel, MatchingPlatformCode } from "../model/types";
import type { ReactNode } from "react";

/** 체크박스·프로필·버튼 사이에 놓이는 표 칸. */
export interface CreatorColumn {
  id: string;
  header: string;
  /** 머리글 칸(최소 폭). */
  className?: string;
  cellClassName?: string;
  /** 있으면 검색 표에서 머리글로 정렬함. */
  sortKey?: SearchSortKey;
  render: (creator: CreatorViewModel) => ReactNode;
}

/** `default`는 관리 화면, `search`는 검색 PC, `searchTablet`은 검색 TAB 한 줄. */
export type CreatorColumnLayout = "default" | "search" | "searchTablet";

const SUBSCRIBER_PLATFORMS: ReadonlySet<MatchingPlatformCode> = new Set([
  "youtube",
  "naver",
  "tiktok",
]);

const COLUMN_CLASS_NAMES = {
  platform: "min-w-17.25",
  category: "min-w-35.75",
  metric: "min-w-24",
  wideMetric: "min-w-35",
  cost: "min-w-30",
  searchCategory: "min-w-28",
  searchCost: "min-w-27.5",
};

export function useCreatorColumns(
  layout: CreatorColumnLayout,
  platformCode?: MatchingPlatformCode,
): CreatorColumn[] {
  const { t } = useTranslation("entities/creator");
  const { term } = useCreatorTerms();
  const { findPlatform, findCategoryName } = useCreatorLabels();
  const getMetricTexts = useCreatorMetricTexts();

  const platform: CreatorColumn = {
    id: "platform",
    sortKey: "PLATFORM",
    header: term("platform"),
    className: COLUMN_CLASS_NAMES.platform,
    render: (creator) => (
      <div className="flex items-center justify-center">
        <CreatorPlatform platform={findPlatform(creator.platformIdx)} />
      </div>
    ),
  };
  const category: CreatorColumn = {
    id: "category",
    sortKey: "CATEGORY",
    header: term("category"),
    className: COLUMN_CLASS_NAMES.category,
    cellClassName: "max-w-0 truncate",
    render: (creator) => findCategoryName(creator.categoryIdx) ?? EMPTY_VALUE,
  };
  const followers: CreatorColumn = {
    id: "followers",
    sortKey: "FOLLOWER",
    header:
      platformCode && SUBSCRIBER_PLATFORMS.has(platformCode)
        ? term("subscriberCount")
        : term("followerCount"),
    className: COLUMN_CLASS_NAMES.metric,
    render: (creator) => getMetricTexts(creator).followers,
  };
  const brandIndex: CreatorColumn = {
    id: "brandIndex",
    sortKey: "BRAND_INDEX",
    header: t("column.brandIndex"),
    className: COLUMN_CLASS_NAMES.metric,
    render: (creator) => getMetricTexts(creator).brandIndex,
  };
  const groupBuyIndex: CreatorColumn = {
    id: "groupBuyIndex",
    sortKey: "GROUP_BUY_INDEX",
    header: t("column.groupBuyIndex"),
    className: COLUMN_CLASS_NAMES.metric,
    render: (creator) => getMetricTexts(creator).groupBuyIndex,
  };
  const expectedCost: CreatorColumn = {
    id: "expectedCost",
    sortKey: "EXPECTED_COST",
    header: term("expectedCost"),
    className: COLUMN_CLASS_NAMES.cost,
    render: (creator) => getMetricTexts(creator).expectedCost,
  };
  // 희망비용은 목록 응답에 아직 없어 항상 -.
  const desiredCost: CreatorColumn = {
    id: "desiredCost",
    sortKey: "DESIRED_COST",
    header: term("desiredCost"),
    className: COLUMN_CLASS_NAMES.cost,
    render: () => EMPTY_VALUE,
  };

  if (layout === "searchTablet") return [platform, brandIndex, groupBuyIndex];

  // 검색 표는 정렬 머리글 시안이라 칸 폭이 관리 화면과 다름.
  const searchCategory: CreatorColumn = {
    ...category,
    className: COLUMN_CLASS_NAMES.searchCategory,
  };
  const predictedCost: CreatorColumn = {
    ...expectedCost,
    header: t("column.predictedCost"),
    className: COLUMN_CLASS_NAMES.searchCost,
  };
  const searchDesiredCost: CreatorColumn = {
    ...desiredCost,
    className: COLUMN_CLASS_NAMES.searchCost,
  };

  // 통합지수 도입 전에는 플랫폼을 골라도 칸이 같고 팔로워 칸 이름만 바뀜.
  if (layout === "search") {
    return [
      platform,
      searchCategory,
      brandIndex,
      groupBuyIndex,
      followers,
      predictedCost,
      searchDesiredCost,
    ];
  }

  return [
    platform,
    category,
    followers,
    brandIndex,
    groupBuyIndex,
    {
      id: "commentWriters",
      header: term("avgCommentWriterCount"),
      className: COLUMN_CLASS_NAMES.wideMetric,
      render: (creator) => getMetricTexts(creator).commentWriters,
    },
    expectedCost,
  ];
}
