import {
  CreatorSheet,
  toTargetsKey,
  useLastValue,
  useCreatorTerms,
} from "@/entities/creator";

import { SaveBookmarkPanel } from "./SaveBookmarkPanel";

import type { CreatorViewModel } from "@/entities/creator";

interface SaveBookmarkSheetProps {
  /** 저장할 크리에이터. null이면 닫힘. */
  targets: CreatorViewModel[] | null;
  onClose: () => void;
  onSaved: () => void;
  onSaveFailed: () => void;
}

// PC 오른쪽 드로어.
export function SaveBookmarkSheet({
  targets,
  onClose,
  onSaved,
  onSaveFailed,
}: SaveBookmarkSheetProps) {
  const { term } = useCreatorTerms();
  const lastTargets = useLastValue(targets);

  return (
    <CreatorSheet
      isOpen={targets !== null}
      title={term("saveBookmark")}
      onClose={onClose}
      className="w-199"
    >
      {lastTargets && (
        <SaveBookmarkPanel
          key={toTargetsKey(lastTargets)}
          targets={lastTargets}
          isTabletUp
          onClose={onClose}
          onSaved={onSaved}
          onSaveFailed={onSaveFailed}
        />
      )}
    </CreatorSheet>
  );
}
