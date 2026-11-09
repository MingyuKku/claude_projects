import { useTranslation } from "@/shared/i18n";

import { useCampaignRegisterStore } from "../../../model/store-context";
import { CountStepper } from "../../fields/CountStepper";

// 진행 인원(모집형). 모집형 구매리뷰형은 같은 칸의 이름이 "모집 인원"임.
export function HeadcountField() {
  const { t } = useTranslation("features/register-campaign");
  const headcount = useCampaignRegisterStore(
    (state) => state.draft.conditions.headcount,
  );
  const isPurchaseReview = useCampaignRegisterStore(
    (state) => state.draft.campaignInfo.campaignType === "PURCHASE_REVIEW",
  );
  const patchConditions = useCampaignRegisterStore(
    (state) => state.patchConditions,
  );

  return (
    <CountStepper
      label={t(
        isPurchaseReview
          ? "conditions.headcount.recruitLabel"
          : "conditions.headcount.label",
      )}
      isRequired
      unit={t("conditions.headcount.unit")}
      value={headcount}
      onChangeValue={(next) => patchConditions({ headcount: next })}
      decreaseLabel={t("conditions.headcount.decrease")}
      increaseLabel={t("conditions.headcount.increase")}
    />
  );
}
