import { CreatorSheet, useLastValue } from "@/entities/creator";
import { useTranslation } from "@/shared/i18n";

import { CreatorDetailPanel } from "./CreatorDetailPanel";

import type { CreatorViewModel } from "@/entities/creator";

interface CreatorDetailSheetProps {
  /** null이면 닫힘. */
  creator: CreatorViewModel | null;
  onClose: () => void;
  onClickBookmark: (creator: CreatorViewModel) => void;
  onClickPropose?: (creator: CreatorViewModel) => void;
}

export function CreatorDetailSheet({
  creator,
  onClose,
  onClickBookmark,
  onClickPropose,
}: CreatorDetailSheetProps) {
  const { t } = useTranslation("widgets/creator-detail");
  const lastCreator = useLastValue(creator);

  return (
    <CreatorSheet
      isOpen={creator !== null}
      title={t("title")}
      onClose={onClose}
      className="w-248"
    >
      {lastCreator && (
        <CreatorDetailPanel
          key={lastCreator.key}
          creator={lastCreator}
          layout="desktop"
          onClose={onClose}
          onClickBookmark={onClickBookmark}
          onClickPropose={onClickPropose}
        />
      )}
    </CreatorSheet>
  );
}
