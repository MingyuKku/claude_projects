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

import type { IdleAlert } from "../model/useRealtimeConversation";

interface RealtimeIdleAlertProps {
  alert: IdleAlert | null;
  onClose: () => void;
  /** 5분 안내의 취소. 실시간 상담을 끝냄. */
  onEnd: () => void;
}

// 5분 안내 2종은 확인이 상담 유지, 취소가 상담 종료. 10분 안내 2종은 이미 결과가 정해져 두 버튼 모두 닫기.
const ENDS_ON_CANCEL: Record<IdleAlert, boolean> = {
  advertiserWarning: true,
  operatorDelay: true,
  advertiserClosed: false,
  operatorUnavailable: false,
};

// Figma 실시간 상담 상태별 Alert(10819:40827·40834·40832·40833).
export function RealtimeIdleAlert({
  alert,
  onClose,
  onEnd,
}: RealtimeIdleAlertProps) {
  const { t } = useTranslation("features/realtime-consultation");
  return (
    <AlertDialog
      open={alert !== null}
      onOpenChange={(next) => !next && onClose()}
    >
      {alert && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(`idle.${alert}.title`)}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(`idle.${alert}.description`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={ENDS_ON_CANCEL[alert] ? onEnd : onClose}
            >
              {t("idle.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={onClose}>
              {t("idle.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  );
}
