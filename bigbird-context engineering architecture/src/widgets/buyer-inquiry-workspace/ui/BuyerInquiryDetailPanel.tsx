import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import {
  useBuyerInquiryDetail,
  useBuyerProduct,
  useInquiryCampaigns,
  useInquiryUserImage,
} from "@/entities/inquiry";
import { ClipboardButton } from "@/shared/components/clipboard-button";
import { EmptyState } from "@/shared/components/empty-state";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";
import type { ReactNode } from "react";

interface BuyerInquiryDetailPanelProps {
  inquiry: BuyerInquiryViewModel;
  /** 캠페인 이미지·이름을 광고주의 캠페인 목록에서 찾을 때 씀(세션 값). */
  threadUserIdx?: number;
}

// Figma 구매자 문의 상세 정보(5202:105720 오른쪽 패널): 문의자, 주문/상품 정보, 캠페인 정보.
// 데이터는 `GET /v3/help/inquiry/{inquiryIdx}`이고, 상품 썸네일·이름은 주문번호로 `c-purchaser-questionInfo`,
// 캠페인 배너·이름은 광고주의 캠페인 목록(`c-client-campaign`)에서 캠페인 번호로 찾음. 이미지는 없어도 나머지는 보임.
export function BuyerInquiryDetailPanel({
  inquiry,
  threadUserIdx,
}: BuyerInquiryDetailPanelProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { t: tCommon } = useTranslation();
  const { detail, isLoading, isError } = useBuyerInquiryDetail(inquiry);
  const { product } = useBuyerProduct(detail?.orderNumber ?? null);
  const avatarSrc = useInquiryUserImage(inquiry.threadUserIdx);
  const { campaigns } = useInquiryCampaigns(threadUserIdx);
  const campaign = campaigns?.find(
    (item) => item.campaignIdx === inquiry.campaignIdx,
  );

  if (isLoading) {
    return (
      <LoaderCircle
        role="status"
        aria-label={tCommon("status.loading")}
        className="m-auto size-6 animate-spin text-muted-foreground"
      />
    );
  }
  if (isError || !detail) {
    return (
      <EmptyState
        type="no-message"
        title={t("detailError")}
        className="flex-1"
      />
    );
  }

  const copyProps = {
    onCopyValue: () => toast.success(t("copied")),
    onCopyError: () => toast.error(t("copyFailed")),
  };
  const period =
    detail.progressStartDate && detail.progressEndDate
      ? `${detail.progressStartDate}~${detail.progressEndDate}`
      : null;

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="flex items-center gap-4 py-2">
        <Avatar size="2xl">
          {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
          <AvatarPlaceholder />
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1">
          <strong className="truncate text-sm">
            {detail.writerName ?? t("unknownWriter")}
          </strong>
          {detail.email && (
            <span className="truncate text-xs text-muted-foreground">
              {detail.email}
            </span>
          )}
          {detail.phoneNumber && (
            <span className="truncate text-xs text-muted-foreground">
              {detail.phoneNumber}
            </span>
          )}
        </div>
      </div>
      {detail.orderNumber && (
        <Section title={t("orderInfo")}>
          <div className="flex gap-2">
            {/* Figma: 썸네일이 남는 폭을 채우는 정사각형이고 글은 140px 고정. */}
            {product?.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                loading="lazy"
                className="aspect-square min-w-0 flex-1 rounded-md border border-border object-cover"
              />
            ) : (
              <div
                aria-hidden
                className="aspect-square min-w-0 flex-1 rounded-md border border-border bg-muted"
              />
            )}
            <div className="flex w-35 shrink-0 flex-col justify-center gap-1.5">
              {product && (
                <strong className="text-sm leading-5 font-semibold">
                  {product.name}
                </strong>
              )}
              <Row label={t("orderDate")} value={detail.orderDate} />
              <Row
                label={t("paymentAmount")}
                value={
                  detail.paymentAmount === null
                    ? null
                    : t("won", { amount: formatNumber(detail.paymentAmount) })
                }
              />
            </div>
          </div>
          <ClipboardButton
            label={t("orderNumber")}
            value={detail.orderNumber}
            {...copyProps}
          />
        </Section>
      )}
      {(detail.campaignCode || detail.campaignType || period) && (
        <Section title={t("campaignInfo")}>
          {campaign?.imageUrl && (
            <img
              src={campaign.imageUrl}
              alt={campaign.name}
              loading="lazy"
              className="h-28 w-full rounded-md object-cover"
            />
          )}
          {campaign && (
            <strong className="text-sm leading-5 font-semibold">
              {campaign.name}
            </strong>
          )}
          <Row label={t("campaignType")} value={detail.campaignType} />
          <Row label={t("progressStatus")} value={detail.progressStatus} />
          <Row label={t("period")} value={period} />
          {detail.campaignCode && (
            <ClipboardButton
              label={t("campaignCode")}
              value={detail.campaignCode}
              {...copyProps}
            />
          )}
          {detail.shopCode && (
            <ClipboardButton
              label={t("shopCode")}
              value={detail.shopCode}
              {...copyProps}
            />
          )}
          {detail.influencerAccountLink && (
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-muted-foreground">{t("influencer")}</span>
              <a
                href={detail.influencerAccountLink}
                target="_blank"
                rel="noreferrer"
                className="truncate rounded-md border border-border px-2 py-1.5 font-medium"
              >
                {detail.influencerPlatform ?? detail.influencerAccountLink}
              </a>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <dl className="flex justify-between gap-2 text-xs">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate text-right">{value}</dd>
    </dl>
  );
}
