import { useId, useState } from "react";

import { PriceField } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";
import { Card } from "@/shared/ui/card";

import { POSTING_PERIOD_RANGE } from "../../../model/step-completion";
import { useRegisterWizardStore } from "../../../model/wizard-context";
import { ChoiceField } from "../../fields/ChoiceField";

import type { CampaignConditionsDraft } from "@/entities/campaign";

/** 포스팅 유지기간 고정 선택지(개월). 그 밖의 값은 직접 입력. */
const POSTING_PERIOD_PRESETS = ["1", "3", "6", "12"] as const;
const DIRECT_INPUT = "DIRECT";
/** 직접 입력 자릿수. 범위(1~999)를 넘는 값도 쳐서 오류를 볼 수 있게 한 자리 더 받음. */
const DIRECT_INPUT_MAX_DIGITS = String(POSTING_PERIOD_RANGE.max).length + 1;

type PostingPeriodChoice =
  (typeof POSTING_PERIOD_PRESETS)[number] | typeof DIRECT_INPUT;

function isPresetMonths(months: number | null) {
  return POSTING_PERIOD_PRESETS.some((preset) => Number(preset) === months);
}

function toCopyrightChoice(secondaryCopyright: boolean | null) {
  if (secondaryCopyright === null) return null;
  return secondaryCopyright ? "USE" : "NOT_USE";
}

function isOutOfRange(months: number | null) {
  return (
    months !== null &&
    (months < POSTING_PERIOD_RANGE.min || months > POSTING_PERIOD_RANGE.max)
  );
}

// 리워드·진행 인원은 모집형 전용이라 PICK형에는 없음.
export function ConditionsStep() {
  const { t } = useTranslation("features/register-campaign");
  const errorId = useId();
  const conditions = useRegisterWizardStore((state) => state.draft.conditions);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );
  // 직접 입력을 골랐는지는 값만으로 알 수 없어(아직 비어 있을 때) 화면에 둠. 고정 선택지 밖의 값이면 직접 입력으로 엶.
  const [isDirectInput, setIsDirectInput] = useState(
    conditions.postingPeriodMonths !== null &&
      !isPresetMonths(conditions.postingPeriodMonths),
  );

  const months = conditions.postingPeriodMonths;
  const periodChoice: PostingPeriodChoice | null = isDirectInput
    ? DIRECT_INPUT
    : (POSTING_PERIOD_PRESETS.find((preset) => Number(preset) === months) ??
      null);
  const hasRangeError = isDirectInput && isOutOfRange(months);

  const patch = (value: Partial<CampaignConditionsDraft>) =>
    patchStepDraft("conditions", value);

  function handleChangePeriod(choice: PostingPeriodChoice) {
    if (choice === DIRECT_INPUT) {
      setIsDirectInput(true);
      patch({ postingPeriodMonths: null });
      return;
    }
    setIsDirectInput(false);
    patch({ postingPeriodMonths: Number(choice) });
  }

  return (
    <Card className="grid ds-gap-4 ds-p-6 desktop:grid-cols-2 desktop:gap-6">
      <div className="flex min-w-0 flex-col gap-2">
        <ChoiceField
          label={t("conditions.period.label")}
          value={periodChoice}
          options={[
            ...POSTING_PERIOD_PRESETS.map((preset) => ({
              value: preset,
              label: t("conditions.period.months", { count: Number(preset) }),
            })),
            { value: DIRECT_INPUT, label: t("conditions.period.direct") },
          ]}
          onChangeValue={handleChangePeriod}
        />
        {isDirectInput && (
          <div className="flex flex-col gap-2 tablet:max-w-85.75">
            <PriceField
              unit={t("conditions.period.unit")}
              aria-label={t("conditions.period.label")}
              placeholder={t("conditions.period.placeholder")}
              aria-invalid={hasRangeError || undefined}
              aria-describedby={hasRangeError ? errorId : undefined}
              value={months === null ? "" : String(months)}
              onChange={(event) => {
                const digits = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, DIRECT_INPUT_MAX_DIGITS);
                patch({ postingPeriodMonths: digits ? Number(digits) : null });
              }}
            />
            {hasRangeError && (
              <p id={errorId} className="ds-text-sm-5-normal text-destructive">
                {t("conditions.period.rangeError")}
              </p>
            )}
          </div>
        )}
      </div>
      <ChoiceField
        label={t("conditions.copyright.label")}
        value={toCopyrightChoice(conditions.secondaryCopyright)}
        options={[
          { value: "USE", label: t("conditions.copyright.use") },
          { value: "NOT_USE", label: t("conditions.copyright.notUse") },
        ]}
        onChangeValue={(choice) =>
          patch({ secondaryCopyright: choice === "USE" })
        }
      />
    </Card>
  );
}
