import { CAMPAIGN_TYPES, useCampaignLabels } from "@/entities/campaign";
import { useTranslation } from "@/shared/i18n";

import { useCampaignRegisterStore } from "../../model/store-context";
import { ChoiceToggleGroup } from "./ChoiceToggleGroup";

// 2단계 맨 위의 캠페인 유형. 1단계에서 고른 유형만 눌린 모양으로 보이고 나머지는 비활성임(바꾸려면 1단계로 돌아감, 사용자 결정).
export function ReadOnlyCampaignTypeGroup({
  className,
}: {
  className?: string;
}) {
  const { t } = useTranslation("features/register-campaign");
  const labels = useCampaignLabels();
  const campaignType = useCampaignRegisterStore(
    (state) => state.draft.campaignInfo.campaignType,
  );

  return (
    <ChoiceToggleGroup
      label={t("campaignInfo.type.label")}
      isRequired
      options={CAMPAIGN_TYPES.map((type) => ({
        value: type,
        label: labels.campaignType(type),
        isDisabled: type !== campaignType,
      }))}
      value={campaignType}
      onChangeValue={() => {}}
      className={className}
    />
  );
}
