import { useOutletContext, useParams, useSearchParams } from "react-router";

import { useBuyerInquiries } from "@/entities/inquiry";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";
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
  const selectedInquiry = inquiries?.find(
    (inquiry) => inquiry.key === inquiryKey,
  );

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
        selectedKey={inquiryKey}
        isPanelOpen={inquiryKey !== undefined}
        panelLabel={t("conversation")}
        threadUserIdx={session.threadUserIdx}
      >
        {selectedInquiry ? (
          <BuyerInquiryPanels
            inquiry={selectedInquiry}
            threadUserIdx={session.threadUserIdx}
          />
        ) : (
          <EmptyState
            type="folder"
            title={t("preparingTitle")}
            description={t("preparingDescription")}
            className="min-h-full"
          />
        )}
      </BuyerInquiryWorkspace>
    </>
  );
}
