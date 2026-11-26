import { Folder, Plus } from "lucide-react";
import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import {
  LoadError,
  CreatorPanel,
  isInteractiveTarget,
  moveBookmarks,
  NewFolderCard,
  useBookmarkFolderMembership,
  useBookmarkFolders,
  useRefreshBookmarkFolders,
  useCreatorTerms,
} from "@/entities/creator";
import { ButtonList } from "@/shared/components/button-list";
import { Inform } from "@/shared/components/inform";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import type { CreatorViewModel } from "@/entities/creator";

const SKELETON_COUNT = 3;

interface MoveBookmarkPanelProps {
  targets: CreatorViewModel[];
  onClose: () => void;
  /** 저장에 성공한 뒤. 보고 있는 목록을 다시 읽는 일은 부르는 쪽이 함. */
  onMoved: () => void;
}

// 저장하면 고른 폴더가 소속 폴더 전체가 되므로 하나도 안 고르면 저장할 수 없음. `전체`는 이동 대상이 아니라 뺌.
export function MoveBookmarkPanel({
  targets,
  onClose,
  onMoved,
}: MoveBookmarkPanelProps) {
  const { t } = useTranslation("features/move-bookmark");
  const { term } = useCreatorTerms();
  const { t: tCommon } = useTranslation();
  const folderList = useBookmarkFolders();
  const membership = useBookmarkFolderMembership(targets);
  const refreshFolders = useRefreshBookmarkFolders();
  const [editedFolderIdxs, setEditedFolderIdxs] = useState<number[] | null>(
    null,
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedFolderIdxs = editedFolderIdxs ?? membership.checkedFolderIdxs;
  const canSave =
    selectedFolderIdxs !== undefined &&
    selectedFolderIdxs.length > 0 &&
    !isSaving;

  function changeFolder(folderIdx: number, isChecked: boolean) {
    // 새 폴더를 만드는 동안 바꾼 선택을 덮어쓰지 않게 최신 값에서 바꿈.
    setEditedFolderIdxs((current) => {
      const others = (current ?? membership.checkedFolderIdxs ?? []).filter(
        (idx) => idx !== folderIdx,
      );
      return isChecked ? [...others, folderIdx] : others;
    });
  }

  function handleCreated(folderIdx: number) {
    changeFolder(folderIdx, true);
    setIsCreating(false);
  }

  async function handleClickSave() {
    if (!selectedFolderIdxs) return;
    setIsSaving(true);
    const [error] = await tryit(moveBookmarks)(targets, selectedFolderIdxs);
    setIsSaving(false);

    if (error) {
      toast.error(tCommon("error.unexpected"));
      return;
    }
    void refreshFolders();
    onMoved();
  }

  function handleClickRetry() {
    void membership.reload();
    void folderList.reload();
  }

  function renderFolders() {
    if (membership.isError || folderList.isError) {
      return <LoadError onClickRetry={handleClickRetry} />;
    }
    if (!selectedFolderIdxs || folderList.isLoading) {
      return (
        <SkeletonGroup className="flex flex-col ds-gap-3">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </SkeletonGroup>
      );
    }
    return folderList.folders.map(({ folderIdx, name, count }) => {
      if (folderIdx === null) return null;
      const isChecked = selectedFolderIdxs.includes(folderIdx);
      return (
        <ButtonList
          key={folderIdx}
          type="checkbox"
          className="shrink-0 cursor-pointer"
          title={name}
          count={formatNumber(count)}
          icon={<Folder />}
          isChecked={isChecked}
          onCheckedChange={(next) => changeFolder(folderIdx, next)}
          onClick={(event) => {
            if (!isInteractiveTarget(event))
              changeFolder(folderIdx, !isChecked);
          }}
        />
      );
    });
  }

  return (
    <CreatorPanel title={term("moveGroup")} onClose={onClose}>
      <Inform
        items={[{ id: "guide", text: t("guide") }]}
        className="shrink-0 ds-p-5"
      />
      <div className="shrink-0 ds-px-5 pb-4">
        <Button
          variant="outline"
          className="w-full"
          disabled={!selectedFolderIdxs}
          onClick={() => setIsCreating(true)}
        >
          <Plus />
          {term("newFolder")}
        </Button>
      </div>
      {/* 새 폴더 카드의 바깥 링이 스크롤 영역에 잘리지 않게 위로 링 폭만큼 여백을 둠. */}
      <ScrollPanel
        className="-mt-1 flex-1"
        contentClassName="flex flex-col ds-gap-3 ds-px-5 pt-1"
        role="group"
        aria-label={t("folders")}
      >
        {isCreating && <NewFolderCard onCreated={handleCreated} />}
        {renderFolders()}
      </ScrollPanel>
      <footer className="shrink-0 ds-p-5">
        <Button
          className="w-full"
          disabled={!canSave}
          onClick={() => void handleClickSave()}
        >
          {tCommon("action.save")}
        </Button>
      </footer>
    </CreatorPanel>
  );
}
