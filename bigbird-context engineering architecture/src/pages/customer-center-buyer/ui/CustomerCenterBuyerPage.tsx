import { useOutletContext, useParams, useSearchParams } from "react-router";

import { useBuyerInquiries } from "@/entities/inquiry";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import {
  BuyerInquiryPanels,
  BuyerInquiryWorkspace,
  toBuyerInquiryFilters,
  toBuyerStatusFilter,
} from "@/widgets/buyer-inquiry-workspace";

import type { SessionViewModel } from "@/entities/session";

export function CustomerCenterBuyerPage() {
  const { t } = useTranslation("pages/customer-center-buyer");
  const { inquiryKey } = useParams();
  const session = useOutletContext<SessionViewModel>();
  const [searchParams] = useSearchParams();
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const isDesktop = useMediaQuery("(min-width: 1440px)");
  const {
    inquiries,
    isLoading,
    isError,
    isLoadingMore,
    hasMore,
    loadMore,
    mutate,
  } = useBuyerInquiries(
    toBuyerStatusFilter(searchParams.get("status")),
    toBuyerInquiryFilters(searchParams),
  );
  // 문의를 고르지 않고 들어오면 지금 탭(서버가 걸러 준 목록)의 첫 문의를 보여 줌(빅버드 문의와 같음).
  const selectedInquiry =
    inquiryKey === undefined
      ? inquiries?.[0]
      : inquiries?.find((inquiry) => inquiry.key === inquiryKey);
  // MO 목록만 보일 때는 자동 선택 문의를 강조하지 않음(빅버드 문의와 같음).
  const listSelectedKey =
    inquiryKey === undefined && isMobile ? undefined : selectedInquiry?.key;
  // TAB·MO 목록 뒤에 가려진 자동 선택 문의는 패널을 그리지 않음(보이지 않는 대화·상세 조회 방지).
  const openedInquiry =
    inquiryKey === undefined && !isDesktop ? undefined : selectedInquiry;

  return (
    <>
      <title>{t("title")}</title>
      <BuyerInquiryWorkspace
        inquiries={inquiries}
        isLoading={isLoading}
        isError={isError}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onClickRefresh={() => void mutate()}
        onLoadMore={loadMore}
        selectedKey={listSelectedKey}
        isPanelOpen={inquiryKey !== undefined}
        panelLabel={t("conversation")}
        threadUserIdx={session.threadUserIdx}
      >
        {openedInquiry ? (
          <BuyerInquiryPanels
            inquiry={openedInquiry}
            threadUserIdx={session.threadUserIdx}
          />
        ) : (
          !isLoading && (
            <EmptyState
              type="folder"
              title={t("preparingTitle")}
              description={t("preparingDescription")}
              className="min-h-full tablet:rounded-lg tablet:border tablet:border-border"
            />
          )
        )}
      </BuyerInquiryWorkspace>
    </>
  );
}
