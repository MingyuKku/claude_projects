import { formatNumber, useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE } from "@/shared/lib";

import {
  formatAverageCount,
  formatCompactCount,
  formatIndexScore,
} from "./format-metrics";

import type { CreatorViewModel } from "../model/types";

const WON_PER_MAN = 10_000;

/** 목록 표·카드의 수치 칸에 보일 글자. */
export function useCreatorMetricTexts() {
  const { t } = useTranslation("entities/creator");

  return (creator: CreatorViewModel) => ({
    followers:
      creator.followerCount === null
        ? EMPTY_VALUE
        : formatCompactCount(creator.followerCount),
    brandIndex: formatIndexScore(creator.brandIndex),
    groupBuyIndex: formatIndexScore(creator.groupBuyIndex),
    commentWriters: formatAverageCount(creator.avgCommentWriterCount),
    expectedCost:
      creator.expectedCost === null
        ? EMPTY_VALUE
        : t("cost.approx", {
            man: formatNumber(Math.round(creator.expectedCost / WON_PER_MAN)),
            won: formatNumber(creator.expectedCost),
          }),
  });
}
