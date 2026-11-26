import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";

import { useCreatorLabels } from "../api/use-creator-labels";
import { isInteractiveTarget } from "../lib/is-interactive-target";
import { useCreatorMetricTexts } from "../lib/use-creator-metric-texts";
import { CreatorPlatform } from "./CreatorPlatform";
import { CreatorRowActions } from "./CreatorRowActions";

import type { CreatorViewModel } from "../model/types";
import type { ReactNode } from "react";

interface CreatorCompactListProps {
  items: CreatorViewModel[];
  selectedKeys: ReadonlySet<string>;
  onChangeSelected: (key: string, isSelected: boolean) => void;
  onClickBookmark: (creator: CreatorViewModel) => void;
  /** 없으면 제안 버튼은 비활성. */
  onClickPropose?: (creator: CreatorViewModel) => void;
  /** 체크박스·버튼 밖을 누르면 상세를 엶. */
  onClickItem: (creator: CreatorViewModel) => void;
  footer?: ReactNode;
  className?: string;
}

// 카드 하나가 두 줄: 프로필·버튼, 그 아래 플랫폼·지수. 머리 줄은 표 카드(ProfileTableCard)와 같은 모양.
export function CreatorCompactList({
  items,
  selectedKeys,
  onChangeSelected,
  onClickBookmark,
  onClickPropose,
  onClickItem,
  footer,
  className,
}: CreatorCompactListProps) {
  const { t } = useTranslation("entities/creator");
  const { findPlatform } = useCreatorLabels();
  const getMetricTexts = useCreatorMetricTexts();

  return (
    <div className={cn("flex flex-col ds-gap-3", className)}>
      <ul aria-label={t("list.label")} className="flex flex-col gap-3">
        {items.map((item) => {
          const metrics = getMetricTexts(item);

          return (
            <li key={item.key}>
              <Card
                className="cursor-pointer"
                onClick={(event) => {
                  if (!isInteractiveTarget(event)) onClickItem(item);
                }}
              >
                <div className="flex items-center pt-4 pr-4">
                  <div className="flex h-12 items-center px-4">
                    <Checkbox
                      aria-label={t("select.row", { name: item.nickname })}
                      checked={selectedKeys.has(item.key)}
                      onCheckedChange={(state) =>
                        onChangeSelected(item.key, state === true)
                      }
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar size="md">
                        <AvatarImage
                          src={item.profileImageUrl ?? undefined}
                          alt=""
                        />
                        <AvatarPlaceholder />
                      </Avatar>
                      <div className="flex min-w-0 flex-1 flex-col gap-1 text-base leading-none">
                        <button
                          type="button"
                          className="-mb-1 block max-w-full truncate pb-1 text-left font-medium text-foreground outline-none focus-visible:underline"
                          onClick={() => onClickItem(item)}
                        >
                          {item.nickname}
                        </button>
                        <p className="-mb-1 truncate pb-1 text-muted-foreground">
                          @{item.platformId}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreatorRowActions
                        creator={item}
                        onClickBookmark={onClickBookmark}
                        onClickPropose={onClickPropose}
                      />
                    </div>
                  </div>
                </div>
                <dl className="flex h-12 items-center gap-4 px-4 pb-4 text-sm leading-5 text-foreground">
                  <div className="relative flex shrink-0 items-center">
                    <dt className="sr-only">{t("term.platform")}</dt>
                    <dd>
                      <CreatorPlatform
                        platform={findPlatform(item.platformIdx)}
                      />
                    </dd>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <dt className="truncate font-semibold">
                      {t("column.brandIndex")}
                    </dt>
                    <dd>{metrics.brandIndex}</dd>
                  </div>
                  <div className="flex min-w-0 items-center gap-1.5">
                    <dt className="truncate font-semibold">
                      {t("column.groupBuyIndex")}
                    </dt>
                    <dd>{metrics.groupBuyIndex}</dd>
                  </div>
                </dl>
              </Card>
            </li>
          );
        })}
      </ul>
      {footer}
    </div>
  );
}
