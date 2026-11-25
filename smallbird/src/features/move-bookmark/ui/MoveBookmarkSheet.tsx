import {
  CreatorSheet,
  toTargetsKey,
  useLastValue,
  useCreatorTerms,
} from "@/entities/creator";

import { MoveBookmarkPanel } from "./MoveBookmarkPanel";

import type { CreatorViewModel } from "@/entities/creator";

interface MoveBookmarkSheetProps {
  /** 옮길 크리에이터. null이면 닫힘. */
  targets: CreatorViewModel[] | null;
  onClose: () => void;
  onMoved: () => void;
}

export function MoveBookmarkSheet({
  targets,
  onClose,
  onMoved,
}: MoveBookmarkSheetProps) {
  const { term } = useCreatorTerms();
  const lastTargets = useLastValue(targets);

  return (
    <CreatorSheet
      isOpen={targets !== null}
      title={term("moveGroup")}
      onClose={onClose}
      className="w-104"
    >
      {lastTargets && (
        <MoveBookmarkPanel
          key={toTargetsKey(lastTargets)}
          targets={lastTargets}
          onClose={onClose}
          onMoved={onMoved}
        />
      )}
    </CreatorSheet>
  );
}
