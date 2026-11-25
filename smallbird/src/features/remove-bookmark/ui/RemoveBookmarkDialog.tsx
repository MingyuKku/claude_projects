import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import {
  removeBookmarks,
  useRefreshBookmarkFolders,
  useCreatorTerms,
} from "@/entities/creator";
import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

import type { CreatorTarget } from "@/entities/creator";

interface RemoveBookmarkDialogProps {
  /** 해제할 크리에이터. null이면 닫힘. */
  targets: CreatorTarget[] | null;
  /** 보고 있는 폴더. null이면 전체 폴더(모든 폴더에서 해제). */
  folderIdx: number | null;
  onClose: () => void;
  /** 해제에 성공한 뒤. 보고 있는 목록을 다시 읽는 일은 부르는 쪽이 함. */
  onRemoved: () => void;
}

// 전체 폴더에서는 모든 폴더에서 해제하고, 특정 폴더를 보고 있으면 그 폴더에서만 해제함.
export function RemoveBookmarkDialog({
  targets,
  folderIdx,
  onClose,
  onRemoved,
}: RemoveBookmarkDialogProps) {
  const { t } = useTranslation("features/remove-bookmark");
  const { term } = useCreatorTerms();
  const { t: tCommon } = useTranslation();
  const refreshFolders = useRefreshBookmarkFolders();
  const [isRemoving, setIsRemoving] = useState(false);

  const scope = folderIdx === null ? "all" : "folder";

  async function handleClickConfirm() {
    if (!targets) return;
    setIsRemoving(true);
    const [error] = await tryit(removeBookmarks)(targets, folderIdx);
    setIsRemoving(false);

    if (error) {
      toast.error(tCommon("error.unexpected"));
      return;
    }
    void refreshFolders();
    onRemoved();
  }

  return (
    <AlertDialog
      open={targets !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen && !isRemoving) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {scope === "all" ? term("removeBookmark") : t("folder.title")}
          </AlertDialogTitle>
          <AlertDialogDescription className="whitespace-pre-line">
            {t(`${scope}.description`)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline-foreground" disabled={isRemoving}>
            {tCommon("action.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            destructive
            disabled={isRemoving}
            onClick={(event) => {
              event.preventDefault();
              void handleClickConfirm();
            }}
          >
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
