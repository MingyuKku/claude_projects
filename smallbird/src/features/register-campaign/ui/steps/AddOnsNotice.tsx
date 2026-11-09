import { Inform } from "@/shared/components/inform";
import { useTranslation } from "@/shared/i18n";

/** 4단계 카드 위의 "부가서비스는 선택사항입니다." 안내 박스. */
export function AddOnsNotice() {
  const { t } = useTranslation("features/register-campaign");

  return (
    <Inform
      variant="filled"
      title={t("addOns.notice.title")}
      items={[{ id: "optional", text: t("addOns.notice.body") }]}
    />
  );
}
