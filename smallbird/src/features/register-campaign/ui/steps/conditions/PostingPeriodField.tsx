import { useState } from "react";

import { PriceField } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";

import { parseNumberInput } from "../../../lib/number-input";
import { POSTING_PERIOD_PRESET_MONTHS } from "../../../model/constants";
import { useCampaignRegisterStore } from "../../../model/store-context";
import { ChoiceToggleGroup } from "../../fields/ChoiceToggleGroup";

const CUSTOM = "custom";

// 포스팅 유지기간: 1·3·6·12개월 또는 직접 입력("개월" 정수). 저장되는 값은 개월 수 하나라서 "직접 입력" 선택은 화면 상태임.
// 처음에 저장된 값이 프리셋이 아니면 직접 입력으로 열림.
export function PostingPeriodField() {
  const { t } = useTranslation("features/register-campaign");
  const months = useCampaignRegisterStore(
    (state) => state.draft.conditions.postingPeriodMonths,
  );
  const patchConditions = useCampaignRegisterStore(
    (state) => state.patchConditions,
  );
  const [isCustom, setIsCustom] = useState(
    () =>
      months !== null &&
      !(POSTING_PERIOD_PRESET_MONTHS as readonly number[]).includes(months),
  );

  const options = [
    ...POSTING_PERIOD_PRESET_MONTHS.map((preset) => ({
      value: String(preset),
      label: t("conditions.period.option", { count: preset }),
    })),
    { value: CUSTOM, label: t("conditions.period.custom") },
  ];
  const selected = isCustom ? CUSTOM : months === null ? null : String(months);

  function handleChange(value: string) {
    if (value === CUSTOM) {
      setIsCustom(true);
      patchConditions({ postingPeriodMonths: null });
      return;
    }
    setIsCustom(false);
    patchConditions({ postingPeriodMonths: Number(value) });
  }

  return (
    <div className="flex flex-col gap-2">
      <ChoiceToggleGroup
        label={t("conditions.period.label")}
        isRequired
        options={options}
        value={selected}
        onChangeValue={handleChange}
      />
      {isCustom && (
        <PriceField
          aria-label={t("conditions.period.label")}
          unit={t("conditions.period.unit")}
          placeholder={t("conditions.period.placeholder")}
          autoComplete="off"
          inputMode="numeric"
          value={months === null ? "" : String(months)}
          onChange={(event) =>
            patchConditions({
              postingPeriodMonths: parseNumberInput(event.target.value),
            })
          }
        />
      )}
    </div>
  );
}
