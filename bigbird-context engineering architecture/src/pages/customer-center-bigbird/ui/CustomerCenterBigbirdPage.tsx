import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router";

import { useBigbirdInquiries } from "@/entities/inquiry";
import {
  IS_REALTIME_WRITE_ENABLED,
  RealtimeComposer,
  RealtimeLockAlert,
  useRealtimeConversation,
} from "@/features/realtime-consultation";
import { EmptyState } from "@/shared/components/empty-state";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { Button } from "@/shared/ui/button";
import {
  BigbirdInquiryConversation,
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
  const [searchParams] = useSearchParams();
  const status = toStatusFilter(searchParams.get("status"));
  const serverStatus = {
    all: "ALL",
    waiting: "WAITING",
    consulting: "IN_PROGRESS",
    done: "ANSWERED",
  } as const;
  const { inquiries, isLoading, isError, mutate } = useBigbirdInquiries(
    session.threadUserIdx,
    serverStatus[status],
  );
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
    onChanged: () => void mutate(),
    // 요청을 취소한 뒤 같은 캠페인(또는 기타 문의)으로 문의 남기기 작성 화면을 엶.
    onLeaveForMessage: (campaignIdx) =>
      void navigate(ROUTES.customerCenterBigbirdNew, {
        state: { campaignIdx },
      }),
  });
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
      <BigbirdInquiryWorkspace
        inquiries={inquiries}
        isLoading={isLoading}
        isError={isError}
        onClickRefresh={() => void mutate()}
        selectedThreadIdx={selectedThreadIdx}
        isPanelOpen={threadIdx !== undefined}
        panelLabel={t("conversation")}
      >
        {selected ? (
          <BigbirdInquiryConversation
            key={selected.threadIdx}
            inquiry={selected}
            myName={session.displayName}
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
            onClickRetry={
              isRealtimeWritable && selected.isRetryable
                ? () => void realtime.retry()
                : undefined
            }
            onClickLeaveMessage={
              isRealtimeWritable
                ? () => void realtime.leaveForMessage()
                : undefined
            }
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void mutate()}
                  >
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
