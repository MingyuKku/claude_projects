import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import {
  generatePath,
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router";
import { toast } from "sonner";

import {
  useBigbirdInquiries,
  useInquiryCampaigns,
  useInquiryUserName,
} from "@/entities/inquiry";
import {
  IS_REALTIME_WRITE_ENABLED,
  isRealtimeOpenHours,
  RealtimeComposer,
  RealtimeHoursAlert,
  RealtimeIdleAlert,
  RealtimeLockAlert,
  useRealtimeConversation,
  useRequestRealtimeConsultation,
} from "@/features/realtime-consultation";
import { EmptyState } from "@/shared/components/empty-state";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { Button } from "@/shared/ui/button";
import {
  BigbirdInquiryConversation,
  BigbirdInquiryDetailPanel,
  BigbirdInquiryWorkspace,
  toStatusFilter,
} from "@/widgets/bigbird-inquiry-workspace";

import type { SessionViewModel } from "@/entities/session";

export function CustomerCenterBigbirdPage() {
  const { t } = useTranslation("pages/customer-center-bigbird");
  const { t: tCommon } = useTranslation();
  const session = useOutletContext<SessionViewModel>();
  const { threadIdx } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // 방금 등록해 목록이 아직 새 문의를 받아오지 못한 경우(없는 문의로 보이지 않게 로딩을 보여 줌).
  const isPendingCreated =
    threadIdx !== undefined &&
    (location.state as { pendingThreadIdx?: number } | null)
      ?.pendingThreadIdx === Number(threadIdx);
  const [searchParams, setSearchParams] = useSearchParams();
  const status = toStatusFilter(searchParams.get("status"));
  const serverStatus = {
    all: "ALL",
    waiting: "WAITING",
    consulting: "IN_PROGRESS",
    done: "ANSWERED",
  } as const;
  const {
    inquiries,
    isLoading,
    isError,
    hasMore,
    isLoadingMore,
    loadMore,
    refresh,
  } = useBigbirdInquiries(session.threadUserIdx, serverStatus[status]);
  // 문의를 고르지 않고 들어오면 PC에서 최신 문의를 보여 줌(캡션 "최신 채팅 Focus").
  // 목록의 상태 탭과 어긋나지 않게 같은 필터를 적용한 첫 문의를 고름.
  const selectedThreadIdx =
    threadIdx === undefined
      ? inquiries?.find(
          (inquiry) => status === "all" || inquiry.status === status,
        )?.threadIdx
      : Number(threadIdx);
  const selected = inquiries?.find(
    (inquiry) => inquiry.threadIdx === selectedThreadIdx,
  );

  // 락·쓰기는 대화가 화면에 보이는 문의에만 적용함. 주소로 연 문의, 또는 PC(desktop)에서 자동 선택된
  // 최신 문의. TAB·MO 목록 뒤에 가려진 자동 선택 문의의 락은 잡지 않음.
  const isDesktop = useMediaQuery("(min-width: 1440px)");
  // MO 목록만 보일 때는 자동 선택 문의를 강조하지 않음(Figma 6791:47931, TAB 6785:18961은 강조함).
  const isMobile = !useMediaQuery("(min-width: 768px)");
  const listSelectedThreadIdx =
    threadIdx === undefined && isMobile ? undefined : selectedThreadIdx;
  const openedInquiry =
    threadIdx === undefined && !isDesktop ? undefined : selected;
  // 락 알림을 닫은 문의. 자동 선택된 문의에서는 목록으로 돌아가도 같은 문의가 다시 선택되므로, 알림이 반복되지 않게 기억함.
  const [dismissedLockThreadIdx, setDismissedLockThreadIdx] =
    useState<number>();
  // 다른 문의로 옮겨 가면 기억을 지워, 나중에 이 문의로 돌아오면 알림이 다시 뜸.
  if (
    dismissedLockThreadIdx !== undefined &&
    openedInquiry &&
    openedInquiry.threadIdx !== dismissedLockThreadIdx
  )
    setDismissedLockThreadIdx(undefined);
  const realtime = useRealtimeConversation({
    inquiry: openedInquiry,
    session,
    enabled: IS_REALTIME_WRITE_ENABLED,
    onChanged: refresh,
  });
  const isDetailOpen = searchParams.get("panel") === "detail";

  function closeDetail() {
    setSearchParams((params) => {
      params.delete("panel");
      return params;
    });
  }

  // 대화 헤더의 "실시간 상담하기": 지금 보는 캠페인(또는 기타 문의)으로 실시간 상담을 요청함.
  const { campaigns } = useInquiryCampaigns(session.threadUserIdx);
  const { request: requestRealtime, isRequesting: isRealtimeRequesting } =
    useRequestRealtimeConsultation(session);

  // 운영 시간(평일 10~18시) 밖에서 실시간 상담하기를 누르면 안내만 띄움. 개발 서버에서는 시간과 상관없이 시험할 수 있게 건너뜀.
  const [isHoursAlertOpen, setIsHoursAlertOpen] = useState(false);

  async function handleClickRealtime() {
    if (!selected) return;
    if (!import.meta.env.DEV && !isRealtimeOpenHours(new Date())) {
      setIsHoursAlertOpen(true);
      return;
    }
    const campaign =
      campaigns?.find((item) => item.campaignIdx === selected.campaignIdx) ??
      null;
    // 캠페인 문의인데 캠페인 목록에서 못 찾으면(종료 등) 기타 문의로 잘못 요청하지 않도록 멈춤.
    if (selected.campaignIdx !== null && !campaign) {
      toast.error(t("requestFailed"));
      return;
    }
    const requested = await requestRealtime(campaign);
    if (requested.status !== "requested") {
      toast.error(t("requestFailed"));
      return;
    }
    refresh();
    void navigate(
      generatePath(ROUTES.customerCenterBigbirdThread, {
        threadIdx: String(requested.threadIdx),
      }),
      { state: { pendingThreadIdx: requested.threadIdx } },
    );
  }

  // 광고주 말풍선 이름은 회사명(사용자 결정 2026-10-29). 받기 전·실패면 로그인 이름.
  const companyName = useInquiryUserName(session.threadUserIdx);

  const isRealtimeWritable =
    IS_REALTIME_WRITE_ENABLED && Boolean(openedInquiry?.isRealtime);

  return (
    <>
      <title>{t("title")}</title>
      <RealtimeLockAlert
        open={
          realtime.lock === "blocked" &&
          openedInquiry?.threadIdx !== dismissedLockThreadIdx
        }
        onLeave={() => {
          setDismissedLockThreadIdx(openedInquiry?.threadIdx);
          if (threadIdx !== undefined)
            void navigate(ROUTES.customerCenterBigbird);
        }}
      />
      <RealtimeHoursAlert
        open={isHoursAlertOpen}
        onClose={() => setIsHoursAlertOpen(false)}
      />
      <RealtimeIdleAlert
        alert={realtime.idleAlert}
        onClose={realtime.dismissIdleAlert}
        onEnd={realtime.endFromIdleAlert}
      />
      <BigbirdInquiryWorkspace
        threadUserIdx={session.threadUserIdx}
        inquiries={inquiries}
        isLoading={isLoading}
        isError={isError}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        onLoadMore={loadMore}
        onClickRefresh={refresh}
        selectedThreadIdx={listSelectedThreadIdx}
        isPanelOpen={threadIdx !== undefined}
        panelLabel={t("conversation")}
        detail={
          selected && selected.campaignIdx !== null && isDetailOpen ? (
            <BigbirdInquiryDetailPanel
              inquiry={selected}
              threadUserIdx={session.threadUserIdx}
              onClickClose={closeDetail}
            />
          ) : undefined
        }
      >
        {selected ? (
          <BigbirdInquiryConversation
            key={selected.threadIdx}
            inquiry={selected}
            onChangedMessage={refresh}
            myName={companyName ?? session.displayName}
            threadUserIdx={session.threadUserIdx}
            composer={
              isRealtimeWritable ? (
                <RealtimeComposer
                  canSend={realtime.canSend}
                  onSend={realtime.send}
                  onSendFiles={realtime.sendFiles}
                />
              ) : undefined
            }
            // 쓰기를 끄면 핸들러를 넘기지 않아 버튼이 비활성.
            onClickEnd={
              isRealtimeWritable ? () => void realtime.end() : undefined
            }
            onClickRealtime={
              IS_REALTIME_WRITE_ENABLED
                ? () => void handleClickRealtime()
                : undefined
            }
            isRealtimeRequesting={isRealtimeRequesting}
          />
        ) : isPendingCreated && !isError ? (
          <LoaderCircle
            role="status"
            aria-label={tCommon("status.loading")}
            className="m-auto size-6 animate-spin text-muted-foreground"
          />
        ) : (
          !isLoading && (
            // TAB·MO에서는 목록 패널이 숨겨지므로 이 안에서 다시 시도하거나 목록으로 돌아갈 수 있게 함.
            <EmptyState
              type="no-message"
              title={
                isError
                  ? t("loadError")
                  : t(threadIdx === undefined ? "noSelection" : "notFound")
              }
              action={
                isError ? (
                  <Button variant="outline" size="sm" onClick={refresh}>
                    {tCommon("action.retry")}
                  </Button>
                ) : (
                  threadIdx !== undefined && (
                    <Button asChild variant="outline" size="sm">
                      <Link to={ROUTES.customerCenterBigbird}>
                        {t("backToList")}
                      </Link>
                    </Button>
                  )
                )
              }
              className="flex-1"
            />
          )
        )}
      </BigbirdInquiryWorkspace>
    </>
  );
}
