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
  open: boolean;
  /** 삭제를 확인받는 Sub ID. 닫히는 동안에도 문구가 바뀌지 않게 닫은 뒤에도 남겨 둠(`useDialogTarget`). */
  account: SubAccountViewModel | null;
  onCancel: () => void;
  /** 삭제 버튼. 요청과 결과 안내는 호출하는 쪽이 함. */
  onConfirm: (account: SubAccountViewModel) => void;
}

// Figma 삭제 알럿(10061:201625 PC·TAB, 10061:207084 MO): Destructive. 제목 "Sub ID 삭제", 모든 기기 같은 문구(사용자 확인).
// PC·TAB은 왼쪽 정렬 + 취소·삭제 가로, MO는 가운데 정렬 + 삭제(위)·취소(아래) 세로(AlertDialog의 반응형 기본 구조).
export function DeleteSubAccountDialog({
  open,
  account,
  onCancel,
  onConfirm,
}: DeleteSubAccountDialogProps) {
  const { t } = useTranslation("features/manage-sub-accounts");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
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
