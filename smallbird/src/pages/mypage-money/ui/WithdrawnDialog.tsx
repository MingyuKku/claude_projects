import { formatDate, useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";

// 시안 예: "2025년 6월 2일 10:30". 언어별 순서·구분자는 Intl이 정함.
const REQUESTED_AT_FORMAT = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
} as const;

interface WithdrawnDialogProps {
  open: boolean;
  requestedAt: Date | null;
  onConfirm: () => void;
}

// 출금 요청 완료 알럿(Figma 11224:104313). 완료 알럿은 "확인"만 둠(스펙 공통 규칙, 시안의 "취소"는 두지 않음).
export function WithdrawnDialog({
  open,
  requestedAt,
  onConfirm,
}: WithdrawnDialogProps) {
  const { t } = useTranslation("pages/mypage-money");
  const { t: tCommon } = useTranslation();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onConfirm();
      }}
    >
      <AlertDialogContent className="p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("withdrawn.title")}</AlertDialogTitle>
          <AlertDialogDescription className="leading-6 whitespace-pre-line">
            {t("withdrawn.description", {
              requestedAt: requestedAt
                ? formatDate(requestedAt, REQUESTED_AT_FORMAT)
                : "",
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>{tCommon("action.confirm")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
