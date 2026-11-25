import { Bookmark, Mail } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Toggle } from "@/shared/ui/toggle";

import { useCreatorTerms } from "../lib/use-creator-terms";

import type { CreatorViewModel } from "../model/types";

interface CreatorRowActionsProps {
  creator: CreatorViewModel;
  onClickBookmark: (creator: CreatorViewModel) => void;
  /** 없으면 제안 버튼은 비활성. */
  onClickPropose?: (creator: CreatorViewModel) => void;
}

// 저장 여부는 아이콘 채움으로 보이므로 공통 Toggle의 선택 링은 끔.
const BOOKMARK_TOGGLE_CLASS_NAME =
  "data-[state=on]:ring-0 data-[state=on]:ring-offset-0";

// 행 오른쪽 버튼 둘(즐겨찾기·캠페인 제안). 간격은 감싸는 쪽이 정함.
export function CreatorRowActions({
  creator,
  onClickBookmark,
  onClickPropose,
}: CreatorRowActionsProps) {
  const { t } = useTranslation("entities/creator");
  const { bookmarkLabel } = useCreatorTerms();

  return (
    <>
      <Toggle
        variant="outline"
        size="sm"
        className={BOOKMARK_TOGGLE_CLASS_NAME}
        aria-label={bookmarkLabel(creator.nickname)}
        pressed={creator.isBookmarked}
        onPressedChange={() => onClickBookmark(creator)}
      >
        <Bookmark
          className={cn(creator.isBookmarked && "fill-current text-primary")}
        />
      </Toggle>
      <Toggle
        variant="outline"
        size="sm"
        pressed={false}
        disabled={!onClickPropose}
        onPressedChange={() => onClickPropose?.(creator)}
        aria-label={t("action.propose", { name: creator.nickname })}
      >
        <Mail />
      </Toggle>
    </>
  );
}
