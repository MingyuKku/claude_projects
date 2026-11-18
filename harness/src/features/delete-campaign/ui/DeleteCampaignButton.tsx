import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import { deleteCampaign, useRevalidateCampaignList } from "@/entities/campaign";
import { isApiError } from "@/shared/api";
import { TrashIcon } from "@/shared/components/icons";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
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
import { Button } from "@/shared/ui/button";

interface DeleteCampaignButtonProps {
  campaignIdx: number;
  /** 지운 뒤(또는 이미 지울 수 없는 상태라 목록이 낡았을 때) 지금 보이는 목록을 다시 읽음. */
  onDeleted: () => void;
  className?: string;
}

const NOT_DELETABLE_STATUS = 409;

// 휴지통 아이콘 → 확인 알럿 → 삭제 → 목록 다시 읽기 → 토스트. 삭제할 수 있는 캠페인(등록 중)에만 그리는 것은 호출하는 쪽이 정함.
// 알럿은 시안 3.0.2(MO)를 모든 기기에 씀(PC·TAB 시안 없음, 스펙 D-2).
export function DeleteCampaignButton({
  campaignIdx,
  onDeleted,
  className,
}: DeleteCampaignButtonProps) {
  const { t } = useTranslation("features/delete-campaign");
  const { t: tCommon } = useTranslation();
  const revalidateCampaignList = useRevalidateCampaignList();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleClickDelete() {
    setIsDeleting(true);
    const [error] = await tryit(deleteCampaign)(campaignIdx);
    setIsDeleting(false);
    setIsOpen(false);

    if (!error) {
      toast.success(t("toast.deleted"));
    } else if (isApiError(error) && error.status === NOT_DELETABLE_STATUS) {
      toast.error(t("toast.notDeletable"));
    } else {
      toast.error(t("toast.failed"));
      return;
    }
    void revalidateCampaignList();
    onDeleted();
  }

  return (
    <>
      <Button
        variant="outline-foreground"
        size="icon-sm"
        aria-label={t("action.delete")}
        className={cn("rounded-md", className)}
        onClick={() => setIsOpen(true)}
      >
        <TrashIcon />
      </Button>
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogContent className="p-6">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription className="leading-6">
              {t("dialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline-foreground">
              {tCommon("action.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              destructive
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                void handleClickDelete();
              }}
            >
              {t("dialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
