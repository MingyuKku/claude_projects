import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

interface WithdrawDoneDialogProps {
  onConfirm: () => void;
  isConfirming: boolean;
}

// v2 완료 안내: 제목만 있고 "확인" 버튼 하나(X 없음). 이미 탈퇴가 끝났으므로 닫기·Esc로 벗어나지 못하고 확인을 눌러야 로그아웃함.
export function WithdrawDoneDialog({
  onConfirm,
  isConfirming,
}: WithdrawDoneDialogProps) {
  const { t } = useTranslation("features/withdraw-account");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog open>
      <AlertDialogContent className="p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("done.title")}</AlertDialogTitle>
          {/* 본문 없이 제목만 쓰는 안내라 접근성 설명만 비워 둠. */}
          <AlertDialogDescription className="sr-only" />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction disabled={isConfirming} onClick={onConfirm}>
            {tCommon("action.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
