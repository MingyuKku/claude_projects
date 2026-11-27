import { Mail } from "lucide-react";

import { PlatformIcon } from "@/shared/components/platform-icon";
import { useTranslation } from "@/shared/i18n";
import { EMPTY_VALUE } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Checkbox } from "@/shared/ui/checkbox";

import { useCreatorLabels } from "../api/use-creator-labels";
import { isInteractiveTarget } from "../lib/is-interactive-target";
import { useCreatorMetricTexts } from "../lib/use-creator-metric-texts";
import { useCreatorTerms } from "../lib/use-creator-terms";
import { usePlatformName } from "../lib/use-platform-name";
import { CreatorBookmarkToggle } from "./CreatorRowActions";

import type { CreatorViewModel, MatchingPlatform } from "../model/types";
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

// MO 카드: 체크박스·프로필·즐겨찾기 / 플랫폼·지수 칸 셋 / 캠페인 제안 버튼.
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
  const { findPlatform } = useCreatorLabels();
  const getMetricTexts = useCreatorMetricTexts();

  return (
    <div className={cn("flex flex-col gap-3", className)}>
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
                <div className="flex items-center p-4">
                  <div className="flex h-12 items-center pr-4">
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
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <button
                          type="button"
                          className="line-clamp-2 text-left ds-text-base-none-medium break-all text-foreground outline-none focus-visible:underline"
                          onClick={() => onClickItem(item)}
                        >
                          {item.nickname}
                        </button>
                        <p className="line-clamp-2 ds-text-base-none-normal break-all text-muted-foreground">
                          @{item.platformId}
                        </p>
                      </div>
                    </div>
                    <CreatorBookmarkToggle
                      creator={item}
                      onClickBookmark={onClickBookmark}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2 px-3 pb-3">
                  <dl className="flex gap-2">
                    <MetricCell className="min-w-30" label={term("platform")}>
                      <PlatformName platform={findPlatform(item.platformIdx)} />
                    </MetricCell>
                    <MetricCell
                      className="min-w-0"
                      label={t("column.brandIndex")}
                    >
                      {metrics.brandIndex}
                    </MetricCell>
                    <MetricCell
                      className="min-w-0"
                      label={t("column.groupBuyIndex")}
                    >
                      {metrics.groupBuyIndex}
                    </MetricCell>
                  </dl>
                  <Button
                    variant="outline"
                    className="h-9.5 w-full"
                    disabled={!onClickPropose}
                    onClick={() => onClickPropose?.(item)}
                  >
                    <Mail />
                    {term("propose")}
                  </Button>
                </div>
              </Card>
            </li>
          );
        })}
      </ul>
      {footer}
    </div>
  );
}

interface MetricCellProps {
  label: string;
  className?: string;
  children: ReactNode;
}

// 칸 셋이 폭을 나누되, 플랫폼 칸은 최소 폭이 있고 이름이 길면 글자만큼 넓어짐.
// 시안 테두리는 안쪽 선이라 크기를 늘리지 않게 inset ring으로 그림. 글자는 기기별 토큰이 아닌 고정값.
function MetricCell({ label, className, children }: MetricCellProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col rounded-lg px-2.5 ring-1 ring-border ring-inset",
        className,
      )}
    >
      <dt className="pt-3 pb-1 text-xs leading-4 font-semibold break-words text-foreground">
        {label}
      </dt>
      <dd className="mt-auto truncate pb-3 text-sm leading-5 text-foreground">
        {children}
      </dd>
    </div>
  );
}

// 로고가 있는 플랫폼은 로고 + 이름, 없으면 서버 이름만.
function PlatformName({
  platform,
}: {
  platform: MatchingPlatform | undefined;
}) {
  const getPlatformName = usePlatformName();

  if (!platform) return EMPTY_VALUE;

  return (
    <span className="flex items-center gap-1 whitespace-nowrap">
      {platform.code && (
        <PlatformIcon platform={platform.code} className="size-4" />
      )}
      {getPlatformName(platform)}
    </span>
  );
}
