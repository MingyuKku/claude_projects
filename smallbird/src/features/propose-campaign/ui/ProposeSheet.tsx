import {
  CreatorSheet,
  toTargetsKey,
  useLastValue,
  useCreatorTerms,
} from "@/entities/creator";
import { useTranslation } from "@/shared/i18n";

import { ProposePanel } from "./ProposePanel";

import type { CreatorViewModel } from "@/entities/creator";

interface ProposeSheetProps {
  /** 제안할 크리에이터. null이면 닫힘. */
  targets: CreatorViewModel[] | null;
  onClose: () => void;
  onProposed: () => void;
  onClickBookmark: (creator: CreatorViewModel) => void;
}

export function ProposeSheet({
  targets,
  onClose,
  onProposed,
  onClickBookmark,
}: ProposeSheetProps) {
  const { t } = useTranslation("features/propose-campaign");
  const { term } = useCreatorTerms();
  const lastTargets = useLastValue(targets);
  const isBatch = (lastTargets?.length ?? 0) > 1;

  return (
    <CreatorSheet
      isOpen={targets !== null}
      title={isBatch ? t("title.batch") : term("propose")}
      onClose={onClose}
      className={isBatch ? "w-199" : "w-90.5"}
    >
      {lastTargets && (
        <ProposePanel
          key={toTargetsKey(lastTargets)}
          targets={lastTargets}
          isTabletUp
          onClose={onClose}
          onProposed={onProposed}
          onClickBookmark={onClickBookmark}
        />
      )}
    </CreatorSheet>
  );
}
