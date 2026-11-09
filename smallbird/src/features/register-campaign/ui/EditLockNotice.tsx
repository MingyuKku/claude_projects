import { Inform } from "@/shared/components/inform";
import { useTranslation } from "@/shared/i18n";

interface EditLockNoticeProps {
  /** amount: 결제 금액에 영향을 주는 값(4단계, 6단계 인원·리워드). done: 이미 동의·결제한 내용(7·8단계). */
  kind: "amount" | "done";
  className?: string;
}

// 수정 모드에서 읽기 전용으로 열린 곳에 붙는 안내(스펙 §3 등록 내역: 잠긴 단계는 읽기 전용 + 안내).
export function EditLockNotice({ kind, className }: EditLockNoticeProps) {
  const { t } = useTranslation("features/register-campaign");

  return (
    <Inform
      variant="filled"
      size="sm"
      className={className}
      items={[{ id: kind, text: t(`editLock.${kind}`) }]}
    />
  );
}
