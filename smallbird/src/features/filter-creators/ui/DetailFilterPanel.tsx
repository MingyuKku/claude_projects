import { RefreshCcw } from "lucide-react";
import { isEqual } from "radash";
import { useState } from "react";

import {
  CreatorScrollArea,
  CreatorPanel,
  RANGE_FILTER_KEYS,
  RANGE_FILTER_RULES,
  useCreatorTerms,
} from "@/entities/creator";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { isInvalidRange } from "../lib/range-value";
import { EMPTY_DETAIL_FILTER } from "../model/detail-filter";
import { ProfileFilterFields } from "./ProfileFilterFields";
import { RangeFilterField } from "./RangeFilterField";

import type { DetailFilterValue } from "../model/detail-filter";
import type {
  RangeFilterKey,
  RangeFilters,
  RangeValue,
} from "@/entities/creator";

const VALUE_TAB_KEYS: readonly RangeFilterKey[] = [
  "brandIndex",
  "groupBuyIndex",
];
const QUANTITY_TAB_KEYS = RANGE_FILTER_KEYS.filter(
  (key) => !VALUE_TAB_KEYS.includes(key),
);

// MO 시안의 탭은 공통보다 낮음.
const TAB_CLASS_NAME = "max-tablet:group-data-[variant=default]/tabs-list:py-1";

// 다른 화면과 이름이 같은 조건.
const RANGE_TERMS = {
  follower: "followerCount",
  like: "avgLikeCount",
  view: "avgViewCount",
  reply: "avgCommentCount",
  share: "avgShareRatio",
  brandIndex: "brandInfluenceIndex",
  groupBuyIndex: "groupBuyInfluenceIndex",
} as const;

type SharedRangeKey = keyof typeof RANGE_TERMS;

function isSharedRangeKey(key: RangeFilterKey): key is SharedRangeKey {
  return key in RANGE_TERMS;
}

interface DetailFilterPanelProps {
  /** 지금 목록에 걸린 조건. 패널 안에서 고친 값은 `적용하기`를 눌러야 반영됨. */
  value: DetailFilterValue;
  isTabletUp: boolean;
  onApply: (value: DetailFilterValue) => void;
  onClose: () => void;
}

export function DetailFilterPanel({
  value,
  isTabletUp,
  onApply,
  onClose,
}: DetailFilterPanelProps) {
  const { t } = useTranslation("features/filter-creators");
  const { term } = useCreatorTerms();
  const { t: tCommon } = useTranslation();
  const [draft, setDraft] = useState(value);
  const [tab, setTab] = useState("quantity");

  const hasInvalidRange = Object.values(draft.ranges).some(isInvalidRange);
  const canApply = !isEqual(draft, value) && !hasInvalidRange;

  // 최소가 최대보다 큰 채로 탭을 바꾸면 입력칸이 사라져 안내를 띄울 수 없으므로 머묾.
  function handleChangeTab(next: string) {
    if (!hasInvalidRange) setTab(next);
  }

  function handleChangeRange(
    key: RangeFilterKey,
    range: RangeValue | undefined,
  ) {
    const ranges: RangeFilters = { ...draft.ranges };
    if (range) ranges[key] = range;
    else delete ranges[key];
    setDraft({ ...draft, ranges });
  }

  function getRangeLabel(key: RangeFilterKey) {
    return isSharedRangeKey(key) ? term(RANGE_TERMS[key]) : t(`range.${key}`);
  }

  function renderRangeFields(keys: readonly RangeFilterKey[]) {
    return keys.map((key) => (
      <RangeFilterField
        key={key}
        rule={RANGE_FILTER_RULES[key]}
        label={getRangeLabel(key)}
        value={draft.ranges[key]}
        onChangeValue={(range) => handleChangeRange(key, range)}
      />
    ));
  }

  return (
    <CreatorPanel
      title={isTabletUp ? term("detailFilter") : t("mobileTitle")}
      onClose={onClose}
    >
      <CreatorScrollArea className="flex-1" contentClassName="ds-px-5 ds-pt-5">
        <Tabs value={tab} onValueChange={handleChangeTab} className="ds-gap-3">
          <TabsList className="w-full">
            <TabsTrigger value="quantity" className={TAB_CLASS_NAME}>
              {t("tab.quantity")}
            </TabsTrigger>
            <TabsTrigger value="value" className={TAB_CLASS_NAME}>
              {t("tab.value")}
            </TabsTrigger>
            <TabsTrigger value="profile" className={TAB_CLASS_NAME}>
              {term("profile")}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="quantity" className="flex flex-col ds-gap-4">
            {renderRangeFields(QUANTITY_TAB_KEYS)}
          </TabsContent>
          <TabsContent value="value" className="flex flex-col ds-gap-4">
            {renderRangeFields(VALUE_TAB_KEYS)}
          </TabsContent>
          <TabsContent value="profile" className="flex flex-col ds-gap-6">
            <ProfileFilterFields
              value={draft.profile}
              onChangeValue={(profile) => setDraft({ ...draft, profile })}
            />
          </TabsContent>
        </Tabs>
      </CreatorScrollArea>
      <div className="flex shrink-0 gap-3 ds-p-5">
        <Button
          variant="outline"
          className="h-9.5 desktop:h-10"
          onClick={() => setDraft(EMPTY_DETAIL_FILTER)}
        >
          <RefreshCcw />
          {tCommon("list.filter.reset")}
        </Button>
        <Button
          className="h-9.5 flex-1 desktop:h-10"
          disabled={!canApply}
          onClick={() => onApply(draft)}
        >
          {tCommon("list.filter.apply")}
        </Button>
      </div>
    </CreatorPanel>
  );
}
