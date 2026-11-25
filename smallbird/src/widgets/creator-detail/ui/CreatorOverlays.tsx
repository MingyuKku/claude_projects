import {
  CreatorFullScreen,
  FocusLayer,
  toTargetsKey,
} from "@/entities/creator";
import { ProposePanel, ProposeSheet } from "@/features/propose-campaign";
import { RemoveBookmarkDialog } from "@/features/remove-bookmark";
import { SaveBookmarkPanel, SaveBookmarkSheet } from "@/features/save-bookmark";

import { CreatorDetailPanel } from "./CreatorDetailPanel";
import { CreatorDetailSheet } from "./CreatorDetailSheet";

import type { CreatorOverlaysState } from "../model/use-creator-overlays";
import type { CreatorViewModel } from "@/entities/creator";

interface CreatorOverlaysProps {
  overlays: CreatorOverlaysState;
  isTabletUp: boolean;
  isDesktop: boolean;
}

// PC는 드로어, TAB·MO는 전체 화면(`hasPanel`일 때 목록을 덮음). 제안 창은 상세 위에, 저장 창은 그 위에 뜸.
export function CreatorOverlays({
  overlays,
  isTabletUp,
  isDesktop,
}: CreatorOverlaysProps) {
  const { detailCreator, saveTargets, proposeTargets } = overlays;
  const { openPropose } = overlays;
  const handleClickPropose =
    openPropose && ((creator: CreatorViewModel) => openPropose([creator]));

  // 위 창을 닫고 돌아왔을 때 보던 탭·입력이 남도록 아래 창은 숨기기만 함.
  const fullScreen = (
    <CreatorFullScreen>
      {detailCreator && (
        <div
          className="h-full"
          hidden={saveTargets !== null || proposeTargets !== null}
        >
          <CreatorDetailPanel
            key={detailCreator.key}
            creator={detailCreator}
            layout={isTabletUp ? "tablet" : "mobile"}
            onClose={overlays.closeDetail}
            onClickBookmark={overlays.toggleBookmark}
            onClickPropose={handleClickPropose}
          />
        </div>
      )}
      {proposeTargets && (
        <FocusLayer
          className="h-full outline-none"
          hidden={saveTargets !== null}
        >
          <ProposePanel
            key={toTargetsKey(proposeTargets)}
            targets={proposeTargets}
            isTabletUp={isTabletUp}
            onClose={overlays.closePropose}
            onProposed={overlays.handleProposed}
            onClickBookmark={overlays.toggleBookmark}
          />
        </FocusLayer>
      )}
      {saveTargets && (
        <FocusLayer className="h-full outline-none">
          <SaveBookmarkPanel
            targets={saveTargets}
            isTabletUp={isTabletUp}
            onClose={overlays.closeSave}
            onSaved={overlays.handleSaved}
            onSaveFailed={overlays.handleSaveFailed}
          />
        </FocusLayer>
      )}
    </CreatorFullScreen>
  );

  return (
    <>
      {isDesktop ? (
        <>
          <CreatorDetailSheet
            creator={detailCreator}
            onClose={overlays.closeDetail}
            onClickBookmark={overlays.toggleBookmark}
            onClickPropose={handleClickPropose}
          />
          <ProposeSheet
            targets={proposeTargets}
            onClose={overlays.closePropose}
            onProposed={overlays.handleProposed}
            onClickBookmark={overlays.toggleBookmark}
          />
          <SaveBookmarkSheet
            targets={saveTargets}
            onClose={overlays.closeSave}
            onSaved={overlays.handleSaved}
            onSaveFailed={overlays.handleSaveFailed}
          />
        </>
      ) : (
        overlays.hasPanel && fullScreen
      )}
      <RemoveBookmarkDialog
        targets={overlays.removeTargets}
        folderIdx={overlays.removeFolderIdx}
        onClose={overlays.closeRemove}
        onRemoved={overlays.handleRemoved}
      />
    </>
  );
}
