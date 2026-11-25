import { Plus } from "lucide-react";
import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import {
  CreatorScrollArea,
  LoadError,
  CreatorPanel,
  FolderNameCard,
  useRefreshBookmarkFolders,
  useCreatorTerms,
} from "@/entities/creator";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { useTranslation } from "@/shared/i18n";
import { SortableGrid, SortableItem } from "@/shared/lib/sortable";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { saveFolderDrafts } from "../api/save-folder-drafts";
import { useFolderDrafts } from "../model/use-folder-drafts";
import { FolderRow } from "./FolderRow";
import { RemoveFolderDialog } from "./RemoveFolderDialog";

import type { FolderDraft } from "../model/folder-draft";

const SKELETON_COUNT = 3;

interface ManageFoldersPanelProps {
  onClose: () => void;
  /** 저장에 성공한 뒤. 보고 있는 목록을 다시 읽는 일은 부르는 쪽이 함. */
  onSaved: () => void;
  /** 응답을 못 받았어도 저장됐을 수 있어 목록을 다시 읽게 함. */
  onSaveFailed: () => void;
}

function noop() {}

// 생성·이름·순서·삭제는 저장을 눌러야 서버에 반영되고, 그냥 닫으면 버려짐. 이름을 고치는 중에는 저장할 수 없음.
export function ManageFoldersPanel({
  onClose,
  onSaved,
  onSaveFailed,
}: ManageFoldersPanelProps) {
  const { t } = useTranslation("features/manage-folders");
  const { term } = useCreatorTerms();
  const { t: tCommon } = useTranslation();
  const folders = useFolderDrafts();
  const refreshFolders = useRefreshBookmarkFolders();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 새 폴더 이름을 적던 중이면 저장하며 버려지지 않게 막음.
  const isWriting = editingId !== null || newName.trim() !== "";
  const canSave = folders.hasChanges && !isWriting && !isSaving;

  function handleSubmitNewName(name: string) {
    folders.add(name);
    setNewName("");
    setIsCreating(false);
  }

  function handleSubmitName(id: string, name: string) {
    folders.rename(id, name);
    setEditingId(null);
  }

  // 아직 저장하지 않은 폴더에는 크리에이터가 없어 확인 없이 지움.
  function handleClickRemove(folder: FolderDraft) {
    if (folder.folderIdx === null) folders.remove(folder.id);
    else setRemovingId(folder.id);
  }

  function handleConfirmRemove() {
    if (removingId !== null) folders.remove(removingId);
    setRemovingId(null);
  }

  async function handleClickSave() {
    setIsSaving(true);
    const [error] = await tryit(saveFolderDrafts)(
      folders.original,
      folders.drafts,
    );
    await tryit(refreshFolders)();
    setIsSaving(false);

    if (error) {
      // 응답을 못 받았어도 반영됐을 수 있어 서버 목록으로 되돌림(다시 저장해 폴더가 두 번 생기지 않게).
      folders.reset();
      setEditingId(null);
      onSaveFailed();
      toast.error(tCommon("error.unexpected"));
      return;
    }
    onSaved();
  }

  function renderFolders() {
    if (folders.isLoading) {
      return (
        <SkeletonGroup className="flex flex-col gap-2">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </SkeletonGroup>
      );
    }
    if (folders.isError) {
      return <LoadError onClickRetry={() => void folders.reload()} />;
    }
    return (
      <SortableGrid
        ids={folders.drafts.map((item) => item.id)}
        className="flex flex-col gap-2"
        onChangeOrder={folders.move}
        announcements={{
          instructions: t("sort.instructions"),
          pickedUp: (index) => t("sort.pickedUp", { index }),
          moved: (index) => t("sort.moved", { index }),
          dropped: (index) => t("sort.dropped", { index }),
          cancelled: () => t("sort.cancelled"),
        }}
        renderOverlay={(id) => {
          const folder = folders.drafts.find((item) => item.id === id);
          return (
            folder && (
              <FolderRow
                folder={folder}
                isEditing={false}
                onClickEdit={noop}
                onSubmitName={noop}
                onClickRemove={noop}
              />
            )
          );
        }}
      >
        {folders.drafts.map((folder) => (
          <SortableItem
            key={folder.id}
            id={folder.id}
            disabled={editingId !== null || isSaving}
            className="rounded-md"
          >
            {({ handleProps }) => (
              <FolderRow
                folder={folder}
                isEditing={folder.id === editingId}
                isLocked={editingId !== null}
                handleProps={handleProps}
                onClickEdit={() => setEditingId(folder.id)}
                onSubmitName={(name) => handleSubmitName(folder.id, name)}
                onClickRemove={() => handleClickRemove(folder)}
              />
            )}
          </SortableItem>
        ))}
      </SortableGrid>
    );
  }

  return (
    <CreatorPanel title={t("title")} onClose={onClose}>
      <div className="shrink-0 ds-p-5" inert={isSaving}>
        <Button
          variant="outline"
          className="w-full"
          disabled={folders.isLoading || folders.isError}
          onClick={() => setIsCreating(true)}
        >
          <Plus />
          {term("newFolder")}
        </Button>
      </div>
      {/* 새 폴더 카드의 바깥 링이 스크롤 영역에 잘리지 않게 위로 링 폭만큼 여백을 둠. */}
      <CreatorScrollArea
        className="-mt-1 flex-1"
        contentClassName="flex flex-col gap-2 ds-px-5 pt-1"
        inert={isSaving}
      >
        {isCreating && (
          <FolderNameCard
            onChangeName={setNewName}
            onSubmitName={handleSubmitNewName}
          />
        )}
        {folders.allFolder && (
          <FolderRow
            folder={{ ...folders.allFolder, name: t("row.all") }}
            isEditing={false}
            isLocked
            handleProps={{ disabled: true }}
            onClickEdit={noop}
            onSubmitName={noop}
            onClickRemove={noop}
          />
        )}
        {renderFolders()}
      </CreatorScrollArea>
      <footer className="shrink-0 ds-p-5">
        <Button
          className="w-full tablet:h-9.5 desktop:h-10"
          disabled={!canSave}
          onClick={() => void handleClickSave()}
        >
          {tCommon("action.save")}
        </Button>
      </footer>
      <RemoveFolderDialog
        isOpen={removingId !== null}
        onClose={() => setRemovingId(null)}
        onConfirm={handleConfirmRemove}
      />
    </CreatorPanel>
  );
}
