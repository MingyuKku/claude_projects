import { CalendarIcon } from "lucide-react";
import { useState } from "react";

import { getCampaignEndDate } from "@/entities/campaign";
import { DatePicker } from "@/shared/components/date-picker";
import { formatNumericDate, useTranslation } from "@/shared/i18n";
import { fromIsoDate, toIsoDate } from "@/shared/lib";

import { useRegisterWizardStore } from "../../../model/wizard-context";

function getToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// 캠페인 희망 시작 일자. 고르기 전에는 1칸, 고른 뒤에는 라벨이 "캠페인 기간"으로 바뀌고 시작일·종료일 2칸(사용자 확인: 시안의
// 두 모양은 선택 전·후). 종료일은 시작일 + 30일 읽기 전용이고, 캘린더는 오늘 이전만 막음(v2와 같음). MO는 바텀시트.
export function CampaignPeriodField() {
  const { t } = useTranslation("features/register-campaign");
  const startDate = useRegisterWizardStore(
    (state) => state.draft.info.startDate,
  );
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );
  const [today] = useState(getToday);

  const start = fromIsoDate(startDate);
  const end = fromIsoDate(getCampaignEndDate(startDate));

  function handleChangeStart(date: Date | undefined) {
    if (date) patchStepDraft("info", { startDate: toIsoDate(date) });
  }

  const startPicker = (
    <DatePicker
      label={t(start ? "info.period.label" : "info.period.startLabel")}
      isRequired
      placeholder={t("info.period.placeholder")}
      helpText={t("info.period.help")}
      value={start}
      formatValue={formatNumericDate}
      onValueChange={handleChangeStart}
      isSheetOnMobile
      popoverAlign="start"
      calendarProps={{ disabled: { before: today }, defaultMonth: start }}
    />
  );

  if (!end) return startPicker;

  return (
    <div className="grid grid-cols-2 gap-2">
      {startPicker}
      <div className="pt-7">
        <p className="flex h-10 items-center rounded-md border border-input bg-background px-3 text-sm leading-5 text-foreground">
          <span className="sr-only">{t("info.period.endLabel")}</span>
          <span className="min-w-0 flex-1 truncate">
            {formatNumericDate(end)}
          </span>
          <CalendarIcon className="ml-4 size-4 shrink-0" aria-hidden />
        </p>
      </div>
    </div>
  );
}
