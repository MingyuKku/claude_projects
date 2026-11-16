import { useTranslation } from "@/shared/i18n";
import { Badge } from "@/shared/ui/badge";

// 데모 캠페인 표시(시안 3.0.3 "DEMO"). 실제 캠페인으로 전환되면 쓰지 않음.
export function CampaignDemoTag() {
  const { t } = useTranslation("entities/campaign");

  return (
    <Badge size="sm" className="bg-slate-700/70 ds-text-xs-5-medium text-white">
      {t("demo")}
    </Badge>
  );
}
