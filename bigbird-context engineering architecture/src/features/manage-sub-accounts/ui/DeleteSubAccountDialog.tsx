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

import type { SubAccountViewModel } from "../model/types";

interface DeleteSubAccountDialogProps {
  /** 삭제를 확인받는 Sub ID. null이면 닫혀 있음. */
  account: SubAccountViewModel | null;
  onCancel: () => void;
  /** 삭제 버튼. 실제로 지울지는 호출하는 쪽이 정함(목록 API 전에는 준비 중 안내). */
  onConfirm: (account: SubAccountViewModel) => void;
}

// Figma 삭제 알럿(10061:201625 PC·TAB, 10061:207084 MO): Destructive. 제목 "Sub ID 삭제", 모든 기기 같은 문구(사용자 확인).
// PC·TAB은 왼쪽 정렬 + 취소·삭제 가로, MO는 가운데 정렬 + 삭제(위)·취소(아래) 세로(AlertDialog의 반응형 기본 구조).
export function DeleteSubAccountDialog({
  account,
  onCancel,
  onConfirm,
}: DeleteSubAccountDialogProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog
      open={account !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent className="p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6">
            {t("delete.description", { identifier: account?.identifier ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel variant="outline-foreground">
            {tCommon("action.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            destructive
            onClick={() => account && onConfirm(account)}
          >
            {t("list.action.delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
