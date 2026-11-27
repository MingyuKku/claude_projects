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

/** `desktop`은 PC 표, `tablet`은 TAB 한 줄 표(검색·관리 같음). */
export type CreatorColumnLayout = "desktop" | "tablet";

const SUBSCRIBER_PLATFORMS: ReadonlySet<MatchingPlatformCode> = new Set([
  "youtube",
  "naver",
  "tiktok",
]);

// 칸은 시안 폭으로 두고 머리글이 길면 말줄임함(남는 폭은 크리에이터 칸이 가짐).
const COLUMN_CLASS_NAMES = {
  platform: "max-w-0 min-w-21.75",
  category: "max-w-0 min-w-28",
  brandIndex: "max-w-0 min-w-28.5",
  metric: "max-w-0 min-w-25.5",
  tabletMetric: "max-w-0 min-w-28",
};

export function useCreatorColumns(
  layout: CreatorColumnLayout,
  platformCode?: MatchingPlatformCode,
): CreatorColumn[] {
  const { t } = useTranslation("entities/creator");
  const { term } = useCreatorTerms();
  const { findPlatform, findCategoryName } = useCreatorLabels();
  const getMetricTexts = useCreatorMetricTexts();
  const isTablet = layout === "tablet";

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
  const brandIndex: CreatorColumn = {
    id: "brandIndex",
    sortKey: "BRAND_INDEX",
    header: t("column.brandIndex"),
    className: isTablet
      ? COLUMN_CLASS_NAMES.tabletMetric
      : COLUMN_CLASS_NAMES.brandIndex,
    render: (creator) => getMetricTexts(creator).brandIndex,
  };
  const groupBuyIndex: CreatorColumn = {
    id: "groupBuyIndex",
    sortKey: "GROUP_BUY_INDEX",
    header: t("column.groupBuyIndex"),
    className: isTablet
      ? COLUMN_CLASS_NAMES.tabletMetric
      : COLUMN_CLASS_NAMES.metric,
    render: (creator) => getMetricTexts(creator).groupBuyIndex,
  };

  if (isTablet) return [platform, brandIndex, groupBuyIndex];

  // 통합지수 도입 전에는 플랫폼을 골라도 칸이 같고 팔로워 칸 이름만 바뀜.
  return [
    platform,
    {
      id: "category",
      sortKey: "CATEGORY",
      header: term("category"),
      className: COLUMN_CLASS_NAMES.category,
      cellClassName: "max-w-0 truncate",
      render: (creator) => findCategoryName(creator.categoryIdx) ?? EMPTY_VALUE,
    },
    brandIndex,
    groupBuyIndex,
    {
      id: "followers",
      sortKey: "FOLLOWER",
      header:
        platformCode && SUBSCRIBER_PLATFORMS.has(platformCode)
          ? term("subscriberCount")
          : term("followerCount"),
      className: COLUMN_CLASS_NAMES.metric,
      render: (creator) => getMetricTexts(creator).followers,
    },
    {
      id: "expectedCost",
      sortKey: "EXPECTED_COST",
      header: t("column.predictedCost"),
      className: COLUMN_CLASS_NAMES.metric,
      render: (creator) => getMetricTexts(creator).expectedCost,
    },
    // 희망비용은 목록 응답에 아직 없어 항상 -.
    {
      id: "desiredCost",
      sortKey: "DESIRED_COST",
      header: t("column.desiredCost"),
      className: COLUMN_CLASS_NAMES.metric,
      render: () => EMPTY_VALUE,
    },
  ];
}
