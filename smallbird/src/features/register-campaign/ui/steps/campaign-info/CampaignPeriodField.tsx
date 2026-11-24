import { useState } from "react";

import { getCampaignPeriodDays } from "@/entities/campaign";
import { DatePicker } from "@/shared/components/date-picker";
import { formatNumericDate, useTranslation } from "@/shared/i18n";
import { fromIsoDate, toIsoDate } from "@/shared/lib";

import { useRegisterWizardStore } from "../../../model/wizard-context";

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// 종료일은 시작일 + 상품 유형별 일수(브랜드형 30일·공구형 60일)로 자동 정해지므로 칸으로 두지 않고 도움말로만 안내함. 캘린더는 오늘 이전만 막음(v2와 같음). MO는 바텀시트.
export function CampaignPeriodField() {
  const { t } = useTranslation("features/register-campaign");
  const startDate = useRegisterWizardStore(
    (state) => state.draft.info.startDate,
  );
  const productType = useRegisterWizardStore((state) => state.productType);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );
  const [today] = useState(getToday);

  const start = fromIsoDate(startDate);

  function handleChangeStart(date: Date | undefined) {
    if (date) patchStepDraft("info", { startDate: toIsoDate(date) });
  }

  return (
    <DatePicker
      label={
        productType === "GROUP_BUY"
          ? t("info.period.label.groupBuy")
          : t("info.period.label.brand")
      }
      isRequired
      placeholder={t("info.period.placeholder")}
      helpText={t("info.period.help", {
        days: getCampaignPeriodDays(productType),
      })}
      value={start}
      formatValue={formatNumericDate}
      onValueChange={handleChangeStart}
      isSheetOnMobile
      popoverAlign="start"
      calendarProps={{ disabled: { before: today }, defaultMonth: start }}
    />
  );
}
