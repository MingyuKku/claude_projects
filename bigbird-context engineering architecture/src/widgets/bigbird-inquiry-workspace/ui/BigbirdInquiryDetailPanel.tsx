import { LoaderCircle, X } from "lucide-react";
import { toast } from "sonner";

import { useInquiryCampaigns } from "@/entities/inquiry";
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
// 진행 상태·공구샵 코드·"캠페인 바로가기"는 데이터와 이동 대상이 없어(백엔드 확인 중, B7) 그리지 않음.
export function BigbirdInquiryDetailPanel({
  inquiry,
  threadUserIdx,
  onClickClose,
}: BigbirdInquiryDetailPanelProps) {
  const { t } = useTranslation("widgets/bigbird-inquiry-workspace");
  const { t: tCommon } = useTranslation();
  const { campaigns, isLoading, isError } = useInquiryCampaigns(threadUserIdx);
  const campaign = campaigns?.find(
    (item) => item.campaignIdx === inquiry.campaignIdx,
  );

  return (
    <>
      {/* Header / Sub: MO는 높이 53에 왼쪽 16·오른쪽 4(닫기 버튼 40), PC·TAB은 높이 60에 좌우 20 */}
      <header className="flex h-13.25 shrink-0 items-center justify-between border-b border-border pr-1 pl-4 tablet:h-15 tablet:px-5">
        <h2 className="text-base leading-none font-semibold">{t("detail")}</h2>
        <Button
          variant="ghost-foreground"
          size="icon"
          className="tablet:hidden"
          aria-label={t("closeDetail")}
          onClick={onClickClose}
        >
          <X className="size-4" />
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
      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
        {campaign && (
          <section className="flex flex-col gap-3 p-4 tablet:p-5">
            <h3 className="text-sm leading-none font-semibold">
              {t("campaignInfo")}
            </h3>
            {campaign.imageUrl ? (
              <img
                src={campaign.imageUrl}
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
              <Row label={t("campaignType")} value={campaign.typeName} />
              {/* 상품명(REQ-23-0006). 진행 상태·공구샵 코드는 광고주 API에 값이 없어 받을 때까지 그리지 않음. */}
              <Row
                label={t("productName")}
                value={campaign.productName.trim() || null}
              />
              <Row label={t("period")} value={toPeriod(campaign.period)} />
              <ClipboardButton
                label={t("campaignCode")}
                value={campaign.campaignCode}
                // 상세 정보 시안은 값 쪽 복사 아이콘을 숨김
                hasValueIcon={false}
                onCopyValue={() => toast.success(t("copied"))}
                onCopyError={() => toast.error(t("copyFailed"))}
              />
            </div>
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
