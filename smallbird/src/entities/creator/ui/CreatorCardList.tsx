import { ProfileTableCard } from "@/shared/components/cards";
import { useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";

import { useCreatorLabels } from "../api/use-creator-labels";
import { isInteractiveTarget } from "../lib/is-interactive-target";
import { useCreatorMetricTexts } from "../lib/use-creator-metric-texts";
import { useCreatorTerms } from "../lib/use-creator-terms";
import { CreatorPlatform } from "./CreatorPlatform";
import { CreatorRowActions } from "./CreatorRowActions";

import type { CreatorViewModel } from "../model/types";
import type { ReactNode } from "react";

interface CreatorCardListProps {
  items: CreatorViewModel[];
  selectedKeys: ReadonlySet<string>;
  onChangeSelected: (key: string, isSelected: boolean) => void;
  onClickBookmark: (creator: CreatorViewModel) => void;
  /** 없으면 제안 버튼은 비활성. */
  onClickPropose?: (creator: CreatorViewModel) => void;
  /** 체크박스·버튼 밖을 누르면 상세를 엶. */
  onClickItem: (creator: CreatorViewModel) => void;
  /** 카드 아래(다음 쪽 표식·읽는 중·재시도). */
  footer?: ReactNode;
  className?: string;
}

// TAB은 2열, MO는 1열 카드.
export function CreatorCardList({
  items,
  selectedKeys,
  onChangeSelected,
  onClickBookmark,
  onClickPropose,
  onClickItem,
  footer,
  className,
}: CreatorCardListProps) {
  const { t } = useTranslation("entities/creator");
  const { term } = useCreatorTerms();
  const { findPlatform, findCategoryName } = useCreatorLabels();
  const getMetricTexts = useCreatorMetricTexts();

  return (
    <div className={cn("flex flex-col ds-gap-3", className)}>
      <ul
        aria-label={t("list.label")}
        className="grid grid-cols-1 gap-3 tablet:grid-cols-2 tablet:gap-4"
      >
        {items.map((item) => {
          const metrics = getMetricTexts(item);

          return (
            <li key={item.key}>
              <ProfileTableCard
                avatar={
                  <Avatar size="md">
                    <AvatarImage
                      src={item.profileImageUrl ?? undefined}
                      alt=""
                    />
                    <AvatarPlaceholder />
                  </Avatar>
                }
                className="cursor-pointer"
                onClick={(event) => {
                  if (!isInteractiveTarget(event)) onClickItem(item);
                }}
                name={
                  <button
                    type="button"
                    className="-mb-1 block max-w-full truncate pb-1 text-left outline-none focus-visible:underline"
                    onClick={() => onClickItem(item)}
                  >
                    {item.nickname}
                  </button>
                }
                description={`@${item.platformId}`}
                actions={
                  <CreatorRowActions
                    creator={item}
                    onClickBookmark={onClickBookmark}
                    onClickPropose={onClickPropose}
                  />
                }
                checkboxLabel={t("select.row", { name: item.nickname })}
                isChecked={selectedKeys.has(item.key)}
                onCheckedChange={(isChecked) =>
                  onChangeSelected(item.key, isChecked)
                }
                rows={[
                  {
                    id: "platform",
                    label: term("platform"),
                    value: (
                      <CreatorPlatform
                        platform={findPlatform(item.platformIdx)}
                      />
                    ),
                  },
                  {
                    id: "category",
                    label: term("category"),
                    value: findCategoryName(item.categoryIdx) ?? EMPTY_VALUE,
                  },
                  {
                    id: "followers",
                    label: term("followerCount"),
                    value: metrics.followers,
                  },
                  {
                    id: "brandIndex",
                    label: t("column.brandIndex"),
                    value: metrics.brandIndex,
                  },
                  {
                    id: "groupBuyIndex",
                    label: t("column.groupBuyIndex"),
                    value: metrics.groupBuyIndex,
                  },
                  {
                    id: "commentWriters",
                    label: term("avgCommentWriterCount"),
                    value: metrics.commentWriters,
                  },
                  {
                    id: "expectedCost",
                    label: term("expectedCost"),
                    value: metrics.expectedCost,
                  },
                ]}
              />
            </li>
          );
        })}
      </ul>
      {footer}
    </div>
  );
}
