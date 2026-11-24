import { useNavigate } from "react-router";

import { getCampaignRegisterPath } from "@/entities/campaign";
import { StepSidebar } from "@/shared/components/step-sidebar";
import { useTranslation } from "@/shared/i18n";

import { getStepLabelKey } from "../../model/step-labels";
import { getRegisterSteps } from "../../model/steps";

import type { CampaignDetail } from "@/entities/campaign";

const OVERVIEW_ID = "overview";

interface CampaignDetailSidebarProps {
  detail: CampaignDetail;
  canManage: boolean;
}

// 반려 상태에서만 단계를 눌러 수정 모드로 들어감. 그 밖은 조회라 단계를 막음.
export function CampaignDetailSidebar({
  detail,
  canManage,
}: CampaignDetailSidebarProps) {
  const { t } = useTranslation("features/register-campaign");
  const navigate = useNavigate();
  const steps = getRegisterSteps(
    detail.serviceType ?? "PICK",
    detail.productType ?? "BRAND",
  );
  const isEditable = canManage && detail.stage === "REJECTED";

  function handleSelect(id: string) {
    const target = steps.find(({ step }) => step === id)?.step;
    if (target)
      void navigate(getCampaignRegisterPath(detail.campaignIdx, target));
  }

  return (
    <div className="h-full overflow-y-auto border-r bg-muted/40 px-4 py-5">
      <StepSidebar
        label={t("nav.label")}
        size="md"
        indicatorLabels={{
          editing: t("nav.indicator.editing"),
          warning: t("nav.indicator.warning"),
        }}
        overviewItem={{
          id: OVERVIEW_ID,
          label: t("detail.title"),
          isCurrent: true,
        }}
        items={steps.map(({ step }, index) => ({
          id: step,
          number: index + 1,
          label: t(getStepLabelKey(step, detail.productType)),
          state: isEditable ? "default" : "disabled",
        }))}
        onSelect={handleSelect}
      />
    </div>
  );
}
