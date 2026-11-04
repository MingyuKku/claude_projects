import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import {
  useBuyerInquiryDetail,
  useBuyerProduct,
  useInquiryCampaigns,
  useInquiryUserImage,
} from "@/entities/inquiry";
import instagramIcon from "@/shared/assets/img/platform/instagram.svg";
import { ClipboardButton } from "@/shared/components/clipboard-button";
import { EmptyState } from "@/shared/components/empty-state";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";

import { toInquiryMenu } from "../model/menu";

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
  // Figma 인플루언서 문의 상세(PC 10819:40984·TAB 10819:40998)는 주문/상품 정보·공구샵 코드·공구 진행 인플루언서가 없음.
  // MO 시안(10819:40238)에는 남아 있으나 PC·TAB 기준으로 둠(디자인 확인 필요).
  const isBuyerMenu = toInquiryMenu(inquiry.source) === "buyer";

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

  // 상세 정보 시안(6766:45691 등)은 값 쪽 복사 아이콘을 숨깁니다.
  const copyProps = {
    hasValueIcon: false,
    onCopyValue: () => toast.success(t("copied")),
    onCopyError: () => toast.error(t("copyFailed")),
  };
  // 상품·캠페인 목록에서 못 찾아도 상세 응답의 대표 이미지·"브랜드 상품명"으로 채움(Swagger: 주문상품·캠페인 공용).
  const productImageUrl = product?.imageUrl ?? detail.imageUrl;
  const productName = product?.name ?? detail.name;
  const campaignImageUrl = campaign?.imageUrl ?? detail.imageUrl;
  const campaignName = campaign?.name || detail.name;
  const period =
    detail.progressStartDate && detail.progressEndDate
      ? // Figma 표기 YYYY.MM.DD~YYYY.MM.DD(서버는 yyyy-MM-dd)
        `${detail.progressStartDate.replaceAll("-", ".")}~${detail.progressEndDate.replaceAll("-", ".")}`
      : null;

  return (
    // Figma MO 변수(6791:67084): p-5·gap-6·gap-5 = 16, gap-4 = 12, gap-3 = 8, leading-5 = 16. TAB·PC는 20·24·16·12·20.
    <div className="flex flex-col gap-4 p-4 tablet:gap-6 tablet:p-5">
      <div className="flex items-center gap-3 py-2 tablet:gap-4">
        <Avatar size="2xl">
          {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
          <AvatarPlaceholder />
        </Avatar>
        {/* Figma Profile(6756:41079): 14px·leading-none, 이름 SemiBold, 연락처 Regular, 간격 6.
            leading-none + 말줄임이 g·@ 아래 획을 잘라 위아래 2px 여유(-my-0.5 py-0.5)를 둡니다. */}
        <div className="flex min-w-0 flex-col gap-1.5 text-sm leading-none">
          <strong className="-my-0.5 truncate py-0.5 font-semibold">
            {detail.writerName ?? t("unknownWriter")}
          </strong>
          {detail.email && (
            <span className="-my-0.5 truncate py-0.5 text-muted-foreground">
              {detail.email}
            </span>
          )}
          {detail.phoneNumber && (
            <span className="-my-0.5 truncate py-0.5 text-muted-foreground">
              {detail.phoneNumber}
            </span>
          )}
        </div>
      </div>
      {isBuyerMenu && detail.orderNumber && (
        <Section title={t("orderInfo")}>
          <div className="flex items-start gap-2 tablet:gap-3">
            {/* Figma: 썸네일이 남는 폭을 채우는 정사각형이고 글은 140px 고정, 위쪽 정렬. */}
            {productImageUrl ? (
              <img
                src={productImageUrl}
                alt={productName ?? ""}
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
              {productName && (
                <strong className="text-sm leading-4 font-semibold tablet:leading-5">
                  {productName}
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
        <Section
          title={t("campaignInfo")}
          // 구매자 문의: Figma Container(6756:41103)는 높이 289 고정이고 배너가 남는 높이를 채움(PC 81·MO 97).
          // 인플루언서 문의는 공구샵 코드·바로가기가 없어 배너가 72 고정(Figma 11315:50442 상세 패널).
          contentClassName={cn("gap-2 tablet:gap-3", isBuyerMenu && "h-72.25")}
        >
          {/* 캠페인을 목록에서 못 찾거나 이미지가 없어도 배너 자리는 남깁니다. */}
          {campaignImageUrl ? (
            <img
              src={campaignImageUrl}
              alt={campaignName ?? ""}
              loading="lazy"
              className={cn(
                "min-h-0 w-full rounded-sm object-cover",
                isBuyerMenu ? "flex-1" : "h-18",
              )}
            />
          ) : (
            <div
              aria-hidden
              className={cn(
                "min-h-0 w-full rounded-sm bg-muted",
                isBuyerMenu ? "flex-1" : "h-18",
              )}
            />
          )}
          {/* Figma Wrap(6756:41105): 캠페인명과 정보 줄·복사 버튼은 6px 간격입니다. */}
          <div className="flex flex-col gap-1.5">
            {/* 이름을 모를 때도 한 줄 자리를 비워 둡니다. */}
            <strong className="min-h-4 text-sm leading-4 font-semibold tablet:min-h-5 tablet:leading-5">
              {campaignName}
            </strong>
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
            {isBuyerMenu && detail.shopCode && (
              <ClipboardButton
                label={t("shopCode")}
                value={detail.shopCode}
                {...copyProps}
              />
            )}
            {/* TODO(backend): 인플루언서 닉네임 필드가 내려오면 [브랜드명][캠페인명][인플루언서 닉네임] 문의 표기와 닉네임만 남기는 상세로 교체 (요구명세서 24 I4·I26, 백엔드 요청 문서 5절 등록) */}
            {isBuyerMenu && detail.influencerAccountLink && (
              // Figma Info(6766:47012): 간격 없이 양끝 정렬, 라벨은 한 줄이고 계정명이 길면 버튼 쪽을 말줄임합니다.
              <div className="flex items-center justify-between">
                <span className="shrink-0 text-xs leading-4 font-medium whitespace-nowrap text-muted-foreground">
                  {t("influencer")}
                </span>
                <a
                  href={detail.influencerAccountLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-w-0 items-center justify-center gap-1 rounded-md border border-border bg-background px-1.75 py-1.25 text-xs leading-4 font-medium hover:bg-accent"
                >
                  {isInstagram(detail.influencerAccountLink) && (
                    <img
                      src={instagramIcon}
                      alt=""
                      className="size-4 shrink-0"
                    />
                  )}
                  <span className="truncate">
                    {detail.influencerAccountName ?? detail.influencerPlatform}
                  </span>
                </a>
              </div>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}

// 시안은 인스타그램 아이콘만 있습니다. 다른 플랫폼은 계정명만 보입니다.
function isInstagram(link: string) {
  return new URL(link).hostname.endsWith("instagram.com");
}

// Figma Chat Details Base / List(6756:41083): 제목 14px leading-none, 제목과 내용 12px.
// 내용끼리는 주문/상품 8px(6756:41256), 캠페인 12px(6756:41103)입니다.
function Section({
  title,
  contentClassName = "gap-2",
  children,
}: {
  title: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 tablet:gap-3">
      <h3 className="text-sm leading-none font-semibold">{title}</h3>
      <div className={cn("flex flex-col", contentClassName)}>{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <dl className="flex justify-between gap-2 text-xs">
      <dt className="font-medium text-muted-foreground">{label}</dt>
      <dd className="truncate text-right">{value}</dd>
    </dl>
  );
}
