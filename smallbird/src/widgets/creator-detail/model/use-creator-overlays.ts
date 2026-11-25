import { useState } from "react";

import {
  IS_PROPOSAL_ENABLED,
  isSameTargets,
  useRefreshCreatorDetail,
} from "@/entities/creator";

import type { CreatorViewModel } from "@/entities/creator";

interface UseCreatorOverlaysOptions {
  /** 목록에서 보고 있는 폴더. null이면 `전체`. */
  folderIdx: number | null;
  /** 저장·해제한 뒤 보고 있는 목록을 다시 읽음. */
  onReloadList: () => void;
  /** 해제한 크리에이터를 선택에서 뺌. */
  onDeselect: (keys: string[]) => void;
}

/** 상세·즐겨찾기 저장·해제·캠페인 제안 창의 여닫힘. 화면은 `CreatorOverlays`가 그림. */
export function useCreatorOverlays({
  folderIdx,
  onReloadList,
  onDeselect,
}: UseCreatorOverlaysOptions) {
  const refreshDetail = useRefreshCreatorDetail();
  const [detailCreator, setDetailCreator] = useState<CreatorViewModel | null>(
    null,
  );
  const [saveTargets, setSaveTargets] = useState<CreatorViewModel[] | null>(
    null,
  );
  const [removeTargets, setRemoveTargets] = useState<CreatorViewModel[] | null>(
    null,
  );
  // 닫히는 동안 알럿 문구가 바뀌지 않게 대상과 따로 둠.
  const [removeFolderIdx, setRemoveFolderIdx] = useState(folderIdx);

  const [proposeTargets, setProposeTargets] = useState<
    CreatorViewModel[] | null
  >(null);

  // 제안 창은 열 때의 크리에이터를 들고 있어, 창 위에서 바꾼 저장 표시를 맞춰 줌.
  function syncBookmark(changed: CreatorViewModel[], isBookmarked: boolean) {
    const keys = new Set(changed.map((item) => item.key));
    setProposeTargets(
      (current) =>
        current?.map((item) =>
          keys.has(item.key) ? { ...item, isBookmarked } : item,
        ) ?? null,
    );
  }

  function openRemove(
    targets: CreatorViewModel[],
    targetFolderIdx: number | null,
  ) {
    setRemoveTargets(targets);
    setRemoveFolderIdx(targetFolderIdx);
  }

  function refresh() {
    onReloadList();
    void refreshDetail();
  }

  return {
    detailCreator,
    saveTargets,
    /** 해제할 폴더. null이면 모든 폴더에서 해제함. */
    removeFolderIdx,
    removeTargets,
    proposeTargets,
    /** TAB·MO에서 목록을 덮는 창이 열려 있음. */
    hasPanel:
      detailCreator !== null || saveTargets !== null || proposeTargets !== null,
    openDetail: setDetailCreator,
    openSave: setSaveTargets,
    /** 목록의 해제는 보고 있는 폴더에서만 뺌. */
    openRemove: (targets: CreatorViewModel[]) => openRemove(targets, folderIdx),
    /** 꺼 둔 환경에서는 없음(버튼 비활성). */
    openPropose: IS_PROPOSAL_ENABLED ? setProposeTargets : undefined,
    /** 상세·제안 창은 폴더와 상관없는 화면이라 모든 폴더에서 뺌. */
    toggleBookmark: (creator: CreatorViewModel) => {
      if (creator.isBookmarked) openRemove([creator], null);
      else setSaveTargets([creator]);
    },
    closeDetail: () => setDetailCreator(null),
    closeSave: () => setSaveTargets(null),
    closeRemove: () => setRemoveTargets(null),
    closePropose: () => setProposeTargets(null),
    handleProposed: () => {
      onDeselect((proposeTargets ?? []).map((item) => item.key));
      setProposeTargets((current) =>
        isSameTargets(current, proposeTargets) ? null : current,
      );
    },
    handleSaveFailed: refresh,
    handleSaved: () => {
      if (saveTargets) syncBookmark(saveTargets, true);
      setSaveTargets((current) =>
        isSameTargets(current, saveTargets) ? null : current,
      );
      refresh();
    },
    handleRemoved: () => {
      if (removeTargets) {
        onDeselect(removeTargets.map((item) => item.key));
        // 한 폴더에서만 해제하면 다른 폴더에는 남아 있을 수 있음.
        if (removeFolderIdx === null) syncBookmark(removeTargets, false);
      }
      setRemoveTargets(null);
      refresh();
    },
  };
}

export type CreatorOverlaysState = ReturnType<typeof useCreatorOverlays>;
