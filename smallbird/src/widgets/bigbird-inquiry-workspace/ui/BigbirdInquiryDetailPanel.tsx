import { ChevronRight, LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import {
  useInquiryCampaignDetail,
  useInquiryCampaigns,
} from "@/entities/inquiry";
import { ClipboardButton } from "@/shared/components/clipboard-button";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

import type { BigbirdInquiryViewModel } from "@/entities/inquiry";

interface BigbirdInquiryDetailPanelProps {
  inquiry: BigbirdInquiryViewModel;
  /** 캠페인 정보를 광고주의 캠페인 목록에서 찾을 때 쓰는 세션 값. */
  threadUserIdx: number | undefined;
  onClickClose: () => void;
}

// Figma 빅버드 문의 상세 정보(10819:40168 PC·TAB 277px 패널, 10819:41609 MO 전체 화면): 캠페인 정보.
// 이름·캠페인 코드는 캠페인 목록(c-client-campaign), 이미지·유형·진행 상태·기간·공구샵 코드는
// 캠페인 정보 API(thread/campaign/{idx}, B7)가 먼저이고 없으면 목록 값을 씀. "캠페인 바로가기"는 이동할 v3 화면이 없어 비활성(P9).
export function BigbirdInquiryDetailPanel({
  inquiry,
  threadUserIdx,
  onClickClose,
}: BigbirdInquiryDetailPanelProps) {
  const { t } = useTranslation("widgets/bigbird-inquiry-workspace");
  const { t: tCommon } = useTranslation();
  const { campaigns, isLoading, isError } = useInquiryCampaigns(threadUserIdx);
  const { detail } = useInquiryCampaignDetail(inquiry.campaignIdx);
  const campaign = campaigns?.find(
    (item) => item.campaignIdx === inquiry.campaignIdx,
  );
  const imageUrl = detail?.imageUrl ?? campaign?.imageUrl ?? null;
  const typeName = detail?.typeName ?? campaign?.typeName ?? null;
  const period = detail?.period ?? campaign?.period ?? null;

  return (
    <>
      {/* Header / Sub: MO는 높이 53에 왼쪽 16·오른쪽 4(닫기 버튼 40·아이콘 16), PC·TAB은 높이 60에 왼쪽 20·오른쪽 8(닫기 버튼 48·아이콘 24) */}
      <header className="flex h-13.25 shrink-0 items-center justify-between border-b border-border pr-1 pl-4 tablet:h-15 tablet:pr-2 tablet:pl-5">
        <h2 className="text-base leading-none font-semibold">{t("detail")}</h2>
        <Button
          variant="ghost-foreground"
          size="icon"
          className="tablet:size-12 tablet:[&_svg:not([class*='size-'])]:size-6"
          aria-label={t("closeDetail")}
          onClick={onClickClose}
        >
          <X />
        </Button>
      </header>
      {isLoading && (
        <LoaderCircle
          role="status"
          aria-label={tCommon("status.loading")}
          className="m-auto size-6 animate-spin text-muted-foreground"
        />
      )}
      {/* 목록에서 캠페인을 못 찾은 경우(종료 등)의 안내는 시안에 없어 확인 중 */}
      {isError && !campaign && (
        <EmptyState
          type="no-message"
          title={tCommon("error.title")}
          className="flex-1"
        />
      )}
      <ScrollArea
        type="auto"
        className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!"
      >
        {campaign && (
          <section className="flex flex-col gap-3 p-4 tablet:p-5">
            <h3 className="text-sm leading-none font-semibold">
              {t("campaignInfo")}
            </h3>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={campaign.name}
                loading="lazy"
                className="h-18.25 w-full rounded-sm object-cover"
              />
            ) : (
              <div aria-hidden className="h-18.25 w-full rounded-sm bg-muted" />
            )}
            <div className="flex flex-col gap-1.5">
              <strong className="text-sm leading-5 font-semibold">
                {campaign.name}
              </strong>
              <Row label={t("campaignType")} value={typeName} />
              <Row
                label={t("progressStatus")}
                value={detail?.progressStatus ?? null}
              />
              <Row label={t("period")} value={toPeriod(period)} />
              <ClipboardButton
                label={t("campaignCode")}
                value={campaign.campaignCode}
                // 상세 정보 시안은 값 쪽 복사 아이콘을 숨김
                hasValueIcon={false}
                onCopyValue={() => toast.success(t("copied"))}
                onCopyError={() => toast.error(t("copyFailed"))}
              />
              {/* 공구샵이 없으면 "-"(사용자 결정), 복사할 값이 없어 비활성. 캠페인 정보를 못 받으면 줄을 그리지 않음 */}
              {detail && (
                <ClipboardButton
                  label={t("shopCode")}
                  value={detail.shopCode ?? "-"}
                  disabled={!detail.shopCode}
                  hasValueIcon={false}
                  onCopyValue={() => toast.success(t("copied"))}
                  onCopyError={() => toast.error(t("copyFailed"))}
                />
              )}
            </div>
            {/* Figma 캠페인 바로가기: px-8 py-6, sm Medium, 글자색 foreground, 아이콘은 글자 바로 옆 */}
            <Button
              variant="outline-foreground"
              size="sm"
              className="w-full"
              disabled
            >
              {t("campaignShortcut")}
              <ChevronRight className="size-4" />
            </Button>
          </section>
        )}
      </ScrollArea>
    </>
  );
}

// 시안 표기는 `YYYY.MM.DD~YYYY.MM.DD`(공백 없음). 캠페인 목록의 기간은 `~` 앞뒤에 공백이 있음.
function toPeriod(period: string | null) {
  return period ? period.replace(" ~ ", "~") : null;
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <dl className="flex justify-between gap-2 text-xs leading-4">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="truncate text-right">{value}</dd>
    </dl>
  );
}
