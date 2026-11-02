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

interface RealtimeLockAlertProps {
  open: boolean;
  /** 취소·확인 모두 같은 콜백. 목록으로 돌아갈지는 호출하는 쪽이 정함. */
  onLeave: () => void;
}

// Figma Alert 이미 상담 진행 중(6790:107707): 다른 접속 화면이 이 상담을 보고 있을 때. 본문은 요구명세서 REQ-23-0022 문구.
export function RealtimeLockAlert({ open, onLeave }: RealtimeLockAlertProps) {
  const { t } = useTranslation("features/realtime-consultation");
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onLeave()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("lock.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("lock.description")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLeave}>
            {t("lock.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onLeave}>
            {t("lock.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
