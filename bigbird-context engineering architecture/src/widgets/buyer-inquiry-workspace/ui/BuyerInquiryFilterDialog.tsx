import { CalendarDays, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import {
  useBuyerInfluencerOptions,
  useInquiryCampaigns,
} from "@/entities/inquiry";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import type { BuyerInquiryFilters } from "@/entities/inquiry";

interface BuyerInquiryFilterDialogProps {
  value: BuyerInquiryFilters;
  threadUserIdx?: number;
  onApply: (filters: BuyerInquiryFilters) => void;
}

const SOURCE_TYPES = ["ALL", "PURCHASER_QUESTION", "PRODUCT_QNA"] as const;

export function BuyerInquiryFilterDialog({
  value,
  threadUserIdx,
  onApply,
}: BuyerInquiryFilterDialogProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<BuyerInquiryFilters>(value);
  const { campaigns } = useInquiryCampaigns(threadUserIdx);
  const { options } = useBuyerInfluencerOptions(draft.campaignIdx);
  // 조건이 걸려 있으면 필터 버튼을 활성 색으로 보여 줌(Figma "필터 버튼 활성화 시").
  const isActive =
    value.sourceType !== "ALL" ||
    value.campaignIdx !== undefined ||
    value.influencerThreadUserIdx !== undefined;
  const hasChanges =
    draft.sourceType !== value.sourceType ||
    draft.campaignIdx !== value.campaignIdx ||
    draft.influencerThreadUserIdx !== value.influencerThreadUserIdx;

  function handleOpenChange(next: boolean) {
    if (next) setDraft(value);
    setOpen(next);
  }

  function handleApply() {
    onApply(draft);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={isActive ? "outline" : "outline-foreground"}
          size="default"
          className="min-w-20 gap-1.5"
        >
          <SlidersHorizontal className="size-4" />
          {t("filter.action")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="top-13 left-0 flex h-[calc(100dvh-3.25rem)] w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none p-0 tablet:top-1/2 tablet:left-1/2 tablet:h-auto tablet:w-85 tablet:max-w-85 tablet:-translate-x-1/2 tablet:-translate-y-1/2 tablet:rounded-lg"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-border px-5 py-5 text-left">
          <DialogTitle className="text-base">{t("filter.title")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-5 tablet:flex-none">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              {t("filter.source")}
            </legend>
            <div className="flex gap-1">
              {SOURCE_TYPES.map((sourceType) => (
                <Button
                  key={sourceType}
                  type="button"
                  variant="outline-foreground"
                  size="sm"
                  aria-pressed={draft.sourceType === sourceType}
                  className={
                    draft.sourceType === sourceType
                      ? "flex-1 border-primary ring-2 ring-primary"
                      : "flex-1"
                  }
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
                  campaignIdx:
                    selected === "all" ? undefined : Number(selected),
                  influencerThreadUserIdx: undefined,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filter.campaignPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.all")}</SelectItem>
                {campaigns?.map((campaign) => (
                  <SelectItem
                    key={campaign.campaignIdx}
                    value={campaign.campaignIdx.toString()}
                  >
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            {t("filter.influencer")}
            <Select
              disabled={draft.campaignIdx === undefined}
              value={draft.influencerThreadUserIdx?.toString()}
              onValueChange={(selected) =>
                setDraft((current) => ({
                  ...current,
                  influencerThreadUserIdx:
                    selected === "all" ? undefined : Number(selected),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filter.influencerPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.all")}</SelectItem>
                {options?.map((option) => (
                  <SelectItem
                    key={option.threadUserIdx}
                    value={option.threadUserIdx.toString()}
                  >
                    {option.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-muted-foreground">
            {t("filter.registrationDate")}
            <span className="relative">
              <Input
                disabled
                placeholder={t("filter.datePlaceholder")}
                className="pr-10"
              />
              <CalendarDays
                aria-hidden
                className="absolute top-1/2 right-3 size-4 -translate-y-1/2"
              />
            </span>
          </label>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <Button
            type="button"
            variant="outline-foreground"
            size="default"
            onClick={() => setDraft({ sourceType: "ALL" })}
          >
            <RotateCcw className="size-4" />
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
      </DialogContent>
    </Dialog>
  );
}
