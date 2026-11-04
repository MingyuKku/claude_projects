import {
  generatePath,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router";

import { useBuyerInquiries } from "@/entities/inquiry";
import { EmptyState } from "@/shared/components/empty-state";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { showBrowserNotification } from "@/shared/lib/browserNotification";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import {
  BuyerInquiryPanels,
  BuyerInquiryWorkspace,
  toBuyerInquiryFilters,
  toBuyerStatusFilter,
} from "@/widgets/buyer-inquiry-workspace";

import type { RealtimeAlarm } from "@/entities/inquiry";
import type { SessionViewModel } from "@/entities/session";

export function CustomerCenterBuyerPage() {
  const { t } = useTranslation("pages/customer-center-buyer");
  const { inquiryKey } = useParams();
  const session = useOutletContext<SessionViewModel>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
    handleRealtimeAlarm,
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

  // 구매자 실시간 상담 요청 크롬 알림(사용자 결정 2026-11-02, 구매자 문의만). 문구는 마켓이 쓴 alarmData 그대로임.
  function handleRealtimeAlarm(threadUserIdx: number, alarm: RealtimeAlarm) {
    const target = inquiries?.find(
      (inquiry) =>
        inquiry.source === "purchaser" &&
        inquiry.threadUserIdx === threadUserIdx &&
        (alarm.campaignIdx == null ||
          inquiry.campaignIdx === alarm.campaignIdx),
    );
    void showBrowserNotification({
      title: alarm.title.replace(/\//g, "\n"),
      body: alarm.body?.replace(/\//g, "\n"),
      icon: alarm.icon,
      onClick: () =>
        void navigate(
          target
            ? generatePath(ROUTES.customerCenterBuyerThread, {
                inquiryKey: target.key,
              })
            : ROUTES.customerCenterBuyer,
        ),
    });
  }

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
            identifier={session.identifier}
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
