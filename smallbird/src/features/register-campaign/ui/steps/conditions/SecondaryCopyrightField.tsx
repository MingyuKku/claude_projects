import { useTranslation } from "@/shared/i18n";

import { useCampaignRegisterStore } from "../../../model/store-context";
import { ChoiceToggleGroup } from "../../fields/ChoiceToggleGroup";

// 2차 저작권 사용 여부: 사용 / 미사용. 저장은 boolean이고 토글은 문자열 값을 쓰므로 변환함.
export function SecondaryCopyrightField() {
  const { t } = useTranslation("features/register-campaign");
  const value = useCampaignRegisterStore(
    (state) => state.draft.conditions.secondaryCopyright,
  );
  const patchConditions = useCampaignRegisterStore(
    (state) => state.patchConditions,
  );

  return (
    <ChoiceToggleGroup
      label={t("conditions.copyright.label")}
      isRequired
      options={[
        { value: "yes", label: t("conditions.copyright.yes") },
        { value: "no", label: t("conditions.copyright.no") },
      ]}
      value={value === null ? null : value ? "yes" : "no"}
      onChangeValue={(next) =>
        patchConditions({ secondaryCopyright: next === "yes" })
      }
    />
  );
}
