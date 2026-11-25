import { BookmarkX, FolderInput, Mail } from "lucide-react";

import { Trans, useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { useCreatorTerms } from "../lib/use-creator-terms";

const TEXT_BUTTON_CLASS_NAME = "h-9.5 desktop:h-10";

interface CreatorSelectionBarProps {
  isTabletUp: boolean;
  selectedCount: number;
  /** 첫 버튼 문구(관리는 그룹 이동, 검색은 즐겨찾기 저장). */
  firstActionLabel: string;
  /** 없으면 첫 버튼은 늘 비활성. */
  onClickFirstAction?: () => void;
  onClickRemove: () => void;
  /** 없으면 제안 버튼은 늘 비활성. */
  onClickPropose?: () => void;
}

// 선택 0개여도 바는 보이고 버튼은 비활성임. MO는 앞의 두 버튼이 아이콘만 있음.
export function CreatorSelectionBar({
  isTabletUp,
  selectedCount,
  firstActionLabel,
  onClickFirstAction,
  onClickRemove,
  onClickPropose,
}: CreatorSelectionBarProps) {
  const { t } = useTranslation("entities/creator");
  const { term } = useCreatorTerms();

  const hasSelection = selectedCount > 0;
  const isFirstActionDisabled = !hasSelection || !onClickFirstAction;

  return (
    <div className="flex shrink-0 items-center justify-end ds-gap-5">
      <p className="flex items-center gap-1 ds-text-sm-none-medium text-foreground">
        <Trans
          t={t}
          i18nKey="selection.count"
          count={selectedCount}
          components={{
            em: <span className="ds-text-sm-none-semibold text-primary" />,
          }}
        />
      </p>
      <div className="flex items-center ds-gap-3">
        {isTabletUp ? (
          <>
            <Button
              variant="outline"
              className={TEXT_BUTTON_CLASS_NAME}
              disabled={isFirstActionDisabled}
              onClick={onClickFirstAction}
            >
              <FolderInput />
              {firstActionLabel}
            </Button>
            <Button
              variant="outline"
              className={TEXT_BUTTON_CLASS_NAME}
              disabled={!hasSelection}
              onClick={onClickRemove}
            >
              <BookmarkX />
              {term("removeBookmark")}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              size="icon"
              disabled={isFirstActionDisabled}
              aria-label={firstActionLabel}
              onClick={onClickFirstAction}
            >
              <FolderInput />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={!hasSelection}
              aria-label={term("removeBookmark")}
              onClick={onClickRemove}
            >
              <BookmarkX />
            </Button>
          </>
        )}
        <Button
          className={TEXT_BUTTON_CLASS_NAME}
          disabled={!hasSelection || !onClickPropose}
          onClick={onClickPropose}
        >
          <Mail />
          {term("propose")}
        </Button>
      </div>
    </div>
  );
}
