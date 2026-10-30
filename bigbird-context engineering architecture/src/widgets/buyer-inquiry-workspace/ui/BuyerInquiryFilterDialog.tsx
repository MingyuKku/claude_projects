import { RefreshCcw, Settings2, X } from "lucide-react";
import { useId, useState } from "react";

import {
  useBuyerInfluencerOptions,
  useInquiryCampaigns,
} from "@/entities/inquiry";
import { Combobox } from "@/shared/components/combobox";
import { DateRangePicker } from "@/shared/components/date-picker";
import { useTranslation } from "@/shared/i18n";
import { toDateRange, toIsoDate } from "@/shared/lib/date-range";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { BuyerInquiryFilters } from "@/entities/inquiry";
import type { ReactNode } from "react";

interface BuyerInquiryFilterDialogProps {
  value: BuyerInquiryFilters;
  threadUserIdx?: number;
  onApply: (filters: BuyerInquiryFilters) => void;
}

// 시작일만 고른 중간 상태는 적용되지 않으므로, 날짜는 시작·종료가 모두 있는 범위만 비교합니다.
function toRangeKey({ startDate, endDate }: BuyerInquiryFilters) {
  return startDate && endDate ? `${startDate}~${endDate}` : "";
}

const SOURCE_TYPES = ["ALL", "PURCHASER_QUESTION", "PRODUCT_QNA"] as const;

export function BuyerInquiryFilterDialog({
  value,
  threadUserIdx,
  onApply,
}: BuyerInquiryFilterDialogProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { t: tCommon } = useTranslation("common");
  const isTabletUp = useMediaQuery("(min-width: 768px)");
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const dateLabelId = useId();
  const [draft, setDraft] = useState<BuyerInquiryFilters>(value);
  const { campaigns } = useInquiryCampaigns(threadUserIdx);
  const { options } = useBuyerInfluencerOptions(draft.campaignIdx);
  // 조건이 걸려 있으면 필터 버튼을 활성 색으로 보여 줌(Figma "필터 버튼 활성화 시").
  const isActive =
    value.sourceType !== "ALL" ||
    value.campaignIdx !== undefined ||
    value.influencerThreadUserIdx !== undefined ||
    value.startDate !== undefined;
  const hasChanges =
    draft.sourceType !== value.sourceType ||
    draft.campaignIdx !== value.campaignIdx ||
    draft.influencerThreadUserIdx !== value.influencerThreadUserIdx ||
    toRangeKey(draft) !== toRangeKey(value);

  function handleOpenChange(next: boolean) {
    if (next) setDraft(value);
    setOpen(next);
  }

  function handleApply() {
    onApply(draft);
    setOpen(false);
  }

  const trigger = (
    <Button
      variant={isActive ? "outline" : "outline-foreground"}
      size="default"
      className="min-w-20 gap-1.5"
    >
      <Settings2 className="size-4" />
      {t("filter.action")}
    </Button>
  );

  const form = (
    <>
      {/* Figma Content Area: 위·좌우 MO 16·TAB/PC 20, 아래 12, 항목 간격 MO 8·TAB/PC 12 */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 pt-4 pb-3 tablet:flex-none tablet:gap-3 tablet:px-5 tablet:pt-5">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            {t("filter.source")}
          </legend>
          {/* 토글 간격 8·최소 폭 94, 선택은 흰 2px을 띄운 primary 링(Figma Toggle focus ring) */}
          <div className="flex gap-2">
            {SOURCE_TYPES.map((sourceType) => (
              <Button
                key={sourceType}
                type="button"
                variant="outline-foreground"
                size="sm"
                aria-pressed={draft.sourceType === sourceType}
                className={cn(
                  "min-w-23.5 flex-1 border-input",
                  draft.sourceType === sourceType &&
                    "ring-2 ring-primary ring-offset-2",
                )}
                onClick={() =>
                  setDraft((current) => ({ ...current, sourceType }))
                }
              >
                {t(`filter.sourceType.${sourceType}`)}
              </Button>
            ))}
          </div>
        </fieldset>
        <label className="flex flex-col gap-2 text-sm font-medium">
          {t("filter.campaign")}
          <Select
            value={draft.campaignIdx?.toString()}
            onValueChange={(selected) =>
              setDraft((current) => ({
                ...current,
                campaignIdx: selected === "all" ? undefined : Number(selected),
                influencerThreadUserIdx: undefined,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("filter.campaignPlaceholder")} />
            </SelectTrigger>
            {/* 선택 상자와 같은 폭, 항목 8개(32씩 + 위아래 4)를 넘으면 스크롤, 긴 이름은 한 줄 말줄임 */}
            <SelectContent className="max-h-66 w-(--radix-select-trigger-width)">
              <SelectItem value="all">{t("filter.all")}</SelectItem>
              {campaigns?.map((campaign) => (
                <SelectItem
                  key={campaign.campaignIdx}
                  value={campaign.campaignIdx.toString()}
                  title={campaign.name}
                  className="*:[span]:last:block *:[span]:last:min-w-0 *:[span]:last:truncate"
                >
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        {/* 인플루언서는 검색되는 콤보박스(Figma Combobox 6777:61876) */}
        <Combobox
          label={t("filter.influencer")}
          disabled={draft.campaignIdx === undefined}
          value={draft.influencerThreadUserIdx?.toString() ?? ""}
          onValueChange={(selected) =>
            setDraft((current) => ({
              ...current,
              influencerThreadUserIdx:
                selected === "all" ? undefined : Number(selected),
            }))
          }
          options={[
            { value: "all", label: t("filter.all") },
            ...(options ?? []).map((option) => ({
              value: option.threadUserIdx.toString(),
              label: option.displayName,
            })),
          ]}
          placeholder={t("filter.influencerPlaceholder")}
          searchPlaceholder={t("filter.influencerSearchPlaceholder")}
          // 검색 결과 없음 문구는 시안에 없어 비워 둠(문구 확정 대기)
          emptyText=""
        />
        <div className="flex flex-col gap-2 text-sm font-medium">
          <span id={dateLabelId}>{t("filter.registrationDate")}</span>
          <DateRangePicker
            aria-labelledby={dateLabelId}
            placeholder={t("filter.datePlaceholder")}
            value={toDateRange(draft.startDate, draft.endDate)}
            onValueChange={(range) =>
              setDraft((current) => ({
                ...current,
                startDate: range?.from ? toIsoDate(range.from) : undefined,
                // 시작일만 고른 중간 상태는 종료일 없이 둡니다. 적용할 때는 둘이 모두 있어야 서버로 갑니다.
                endDate: range?.to ? toIsoDate(range.to) : undefined,
              }))
            }
          />
        </div>
      </div>
      {/* Figma Button Area 여백 MO 16·TAB/PC 20, 초기화는 primary 글자 outline + refresh-ccw */}
      <div className="flex gap-2 p-4 tablet:p-5">
        <Button
          type="button"
          variant="outline"
          size="default"
          className="min-w-20"
          onClick={() => setDraft({ sourceType: "ALL" })}
        >
          <RefreshCcw className="size-4" />
          {t("filter.reset")}
        </Button>
        <Button
          type="button"
          size="default"
          className="flex-1"
          disabled={!hasChanges}
          onClick={handleApply}
        >
          {t("filter.apply")}
        </Button>
      </div>
    </>
  );

  function renderHeader(title: ReactNode) {
    return (
      <header className="flex h-15 shrink-0 items-center justify-between gap-2 border-b border-border pr-2 pl-4 tablet:pl-5">
        {title}
        <Button
          variant="ghost-foreground"
          size="icon-lg"
          aria-label={tCommon("action.close")}
          onClick={() => setOpen(false)}
        >
          <X />
        </Button>
      </header>
    );
  }

  // PC·TAB은 필터 버튼 아래에 붙는 팝오버(Figma 6782:68709·6791:45353: 버튼 아래 2, 오른쪽 끝 4 바깥),
  // MO는 헤더 아래 전체 화면(6790:130769).
  if (isTabletUp) {
    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={2}
          alignOffset={-4}
          aria-labelledby={titleId}
          // 시안 테두리는 안쪽에 그려져 배치에 영향이 없으므로 테두리 대신 안쪽 링으로 그림
          className="flex w-85 flex-col rounded-md border-0 bg-card p-0 shadow-lg ring-1 ring-border ring-inset"
        >
          {renderHeader(
            <h2 id={titleId} className="text-base leading-none font-semibold">
              {t("filter.title")}
            </h2>,
          )}
          {form}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      {/* MO 시안은 앱 헤더를 어둡게 하지 않으므로 배경 막은 투명 */}
      <DialogContent
        className="top-13 left-0 flex h-[calc(100dvh-3.25rem)] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0"
        overlayClassName="bg-transparent"
        showCloseButton={false}
        aria-describedby={undefined}
      >
        {renderHeader(
          <DialogTitle className="text-base leading-none font-semibold">
            {t("filter.title")}
          </DialogTitle>,
        )}
        {form}
      </DialogContent>
    </Dialog>
  );
}
