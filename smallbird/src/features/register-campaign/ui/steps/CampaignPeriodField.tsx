import { CalendarIcon } from "lucide-react";
import { useId } from "react";

import { DatePicker } from "@/shared/components/date-picker";
import { formatNumericDate, useTranslation } from "@/shared/i18n";
import { fromIsoDate, toIsoDate } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Label } from "@/shared/ui/label";

import { calculateEndDate, startOfToday } from "../../lib/campaign-period";

interface CampaignPeriodFieldProps {
  startDate: string | null;
  onChangeStartDate: (startDate: string | null) => void;
}

// 시작일을 고르기 전에는 "캠페인 희망 시작 일자" 1칸이고, 고른 뒤에는 라벨이 "캠페인 기간"으로 바뀌며 시작일·종료일 2칸이 됨(사용자 확인).
// 종료일은 시작일 + 30일로 정해지는 읽기 전용 값임. 캘린더는 오늘 이전 날짜만 막음(구독 종료일 규칙은 적용하지 않음).
export function CampaignPeriodField({
  startDate,
  onChangeStartDate,
}: CampaignPeriodFieldProps) {
  const { t } = useTranslation("features/register-campaign");
  const labelId = useId();
  const start = fromIsoDate(startDate);
  const end = fromIsoDate(calculateEndDate(startDate));

  return (
    <div className="flex flex-col gap-2">
      <Label id={labelId} className="gap-0.5">
        {start
          ? t("campaignInfo.period.label")
          : t("campaignInfo.startDate.label")}
        <span aria-hidden="true" className="font-semibold text-primary">
          *
        </span>
      </Label>
      {/* PC·TAB은 시작일·종료일 칸이 나란하고 그 아래 도움말, MO(Figma 7555:417426)는 시작일 칸 → 도움말 → 종료일 칸으로 쌓임. */}
      <div
        className={cn(
          "grid grid-cols-1 gap-2",
          end && "tablet:grid-cols-2 tablet:gap-x-3",
        )}
      >
        <DatePicker
          className="order-1 min-w-0"
          aria-labelledby={labelId}
          value={start}
          placeholder={t("campaignInfo.startDate.placeholder")}
          formatValue={formatNumericDate}
          popoverAlign="end"
          isSheetOnMobile
          onValueChange={(date) =>
            onChangeStartDate(date ? toIsoDate(date) : null)
          }
          calendarProps={{ disabled: { before: startOfToday() } }}
        />
        <p
          className={cn(
            "order-2 text-sm leading-5 text-muted-foreground",
            // 두 칸일 때만 열을 가로지름(한 칸일 때 걸면 빈 열이 생겨 칸이 좁아짐).
            end && "tablet:order-3 tablet:col-span-2",
          )}
        >
          {t("campaignInfo.startDate.help")}
        </p>
        {end && (
          <div
            role="textbox"
            aria-readonly
            aria-labelledby={labelId}
            className="order-3 flex h-10 min-w-0 items-center rounded-md border border-input bg-background px-3 py-2 text-sm leading-5 text-foreground tablet:order-2"
          >
            <span className="min-w-0 flex-1 truncate">
              {formatNumericDate(end)}
            </span>
            <CalendarIcon aria-hidden className="ml-4 size-4 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
}
