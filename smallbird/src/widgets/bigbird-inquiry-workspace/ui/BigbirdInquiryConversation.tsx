import { ChevronLeft, LoaderCircle, Paperclip } from "lucide-react";
import { tryit } from "radash";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";

import {
  ConversationFiles,
  groupAttachments,
  InquiryUploadStatus,
  useBigbirdInquiryDetail,
  useCampaignTimeline,
  useInquiryCampaigns,
  isMatchFailureShown,
  useConsultationDocument,
  useRealtimeConsultationMessages,
} from "@/entities/inquiry";
import { EditableChatMessage } from "@/features/edit-inquiry-message";
import { SubHeader } from "@/shared/components/app-header";
import {
  ChatCodeCard,
  ChatDivider,
  ChatMessage,
  MessageAlert,
} from "@/shared/components/chat-message";
import { EmptyState } from "@/shared/components/empty-state";
import { TextField } from "@/shared/components/text-field";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

import {
  formatDividerDate,
  formatMessageTime,
  getInquiryTitleKey,
  STATUS_BADGE_VARIANT,
} from "../lib/format";
import { mergeConversationMessages } from "../lib/merge-messages";
import { BigbirdMessageComposer } from "./BigbirdMessageComposer";

import type {
  BigbirdInquiryViewModel,
  InquiryMessageViewModel,
} from "@/entities/inquiry";
import type { ReactNode } from "react";

interface BigbirdInquiryConversationProps {
  inquiry: BigbirdInquiryViewModel;
  /** 내 말풍선에 표시할 광고주 이름. */
  myName: string;
  threadUserIdx: number;
  /** 대화 아래에 붙는 입력창. 없으면 열린 일반 문의는 기본 입력창, 실시간 상담은 비활성 입력창. 종료된 문의는 입력창 없음. */
  composer?: ReactNode;
  /** 보낸 메시지를 고치거나 지운 뒤 대화를 다시 받는 함수. 없으면 수정·삭제를 허용하지 않습니다. */
  onChangedMessage?: () => void;
  // 실시간 상담의 쓰기 동작. 연동(Firestore·REST 쓰기 계약)이 확정되기 전에는 넘기지 않으며,
  // 넘기지 않으면 해당 버튼은 비활성.
  onClickEnd?: () => void;
  /** 문의 남기기 대화를 실시간 상담으로 요청. 없으면 버튼을 그리지 않음. */
  onClickRealtime?: () => void;
  isRealtimeRequesting?: boolean;
}

/** 연결 실패 안내 카드를 보여 주는 시간. 그 뒤 대화는 일반 문의처럼 이어감(사용자 결정 2026-10-29). */
const FAILED_CARD_MS = 10_000;

// Figma 빅버드 문의 채팅(5202:101654, 완료 9298:260494). 날짜가 바뀔 때마다 구분 칩을 넣음.
export function BigbirdInquiryConversation({
  inquiry,
  myName,
  threadUserIdx,
  composer,
  onChangedMessage,
  onClickEnd,
  onClickRealtime,
  isRealtimeRequesting = false,
}: BigbirdInquiryConversationProps) {
  const { t } = useTranslation("widgets/bigbird-inquiry-workspace");
  const { t: tCommon } = useTranslation();
  const realtime = useRealtimeConsultationMessages(
    threadUserIdx,
    inquiry.isRealtime ? inquiry.sequence : undefined,
    inquiry.threadIdx,
  );
  // 캠페인 카드 메시지에는 기간이 없어 광고주의 캠페인 목록에서 캠페인 코드로 찾아 채움(이미지도 카드에 없을 때만).
  const { campaigns } = useInquiryCampaigns(threadUserIdx);
  // 같은 캠페인에 종료 뒤 다시 열린 스레드가 있어도 하나의 대화로 이어 보여 줌. 받기 전·실패 때는 이 스레드의 메시지.
  const timeline = useCampaignTimeline(inquiry.campaignIdx);
  // 캠페인이 없는 기타 문의는 타임라인이 없어 상세 API로 대화를 받음(이때 운영 답장이 읽음 처리됨).
  const detail = useBigbirdInquiryDetail(
    threadUserIdx,
    inquiry.threadIdx,
    inquiry.campaignIdx === null,
  );
  const title = getInquiryTitleKey(
    inquiry,
    campaigns?.find((campaign) => campaign.campaignIdx === inquiry.campaignIdx)
      ?.productName,
  );
  // 상세 정보는 캠페인 정보라 기타 문의에는 없음(기타 문의 동작은 시안에 없어 기획 확인 중).
  const [searchParams, setSearchParams] = useSearchParams();
  const hasDetail = inquiry.campaignIdx !== null;
  const isDetailOpen = hasDetail && searchParams.get("panel") === "detail";
  // 열린 문의 남기기 대화에서만 실시간 상담을 요청할 수 있음(Figma 3.0.6 헤더의 "실시간 상담하기").
  const canRequestRealtime =
    !inquiry.isRealtime && !inquiry.isFinished && onClickRealtime !== undefined;
  const endRef = useRef<HTMLDivElement>(null);
  // 일반·실시간 문의 모두 캠페인 카드를 표시하고, 운영 앱용 인사말 등 자동 안내만 숨김.
  // 실시간 상담도 같은 대화창에 이어 보임: 일반 문의 내용(REST)에 상담 문서의 실시간 메시지를 합침.
  const history = timeline.messages ?? detail.messages ?? inquiry.messages;
  const messages = (
    inquiry.isRealtime
      ? mergeConversationMessages(history, realtime.messages ?? [])
      : history
  ).filter((message) => message.kind !== "system");

  // 타임라인(일반 문의 내용)이 있으면 상담 문서를 받는 중이거나 실패해도 대화를 가리지 않음.
  const hasNoMessages = messages.length === 0;
  // 목록 응답에는 메시지가 없어 대화(타임라인·상세)를 받는 중·실패를 빈 대화와 구분해 보임. 꺼진 쪽 훅은 둘 다 false.
  const isHistoryLoading =
    hasNoMessages && (timeline.isLoading || detail.isLoading);
  const isHistoryError = hasNoMessages && (timeline.isError || detail.isError);
  const rows = groupAttachments(messages);
  // 새 메시지가 오면 맨 아래로 내림. 처음 들어올 때도 최신 메시지가 보이게 함.
  const messageCount = messages.length;
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messageCount]);

  function handleClickDetail() {
    setSearchParams((params) => {
      if (isDetailOpen) params.delete("panel");
      else params.set("panel", "detail");
      return params;
    });
  }

  const phase = inquiry.realtimePhase;
  const isFailed = phase === "failed";
  // 연결 실패 카드는 잠깐만 보여 줌. 대화가 바뀌면 컴포넌트가 새로 그려져(key) 다시 셈.
  const [isFailedCardHidden, setIsFailedCardHidden] = useState(false);
  useEffect(() => {
    if (!isFailed) return;
    const timer = setTimeout(() => setIsFailedCardHidden(true), FAILED_CARD_MS);
    return () => clearTimeout(timer);
  }, [isFailed]);
  // 3분 매칭 실패로 서버가 일반 문의로 돌린 스레드: 상담 문서의 endReason으로 앎.
  const { consultation: endedConsultation } = useConsultationDocument(
    threadUserIdx,
    inquiry.isRealtime ? undefined : inquiry.sequence,
    inquiry.threadIdx,
  );
  // endReason은 종료·전환 때마다 덮어써지고 새 요청 뒤에도 남을 수 있어(마켓 실측 2026-11-04) 요청 시각이 비었을 때만 인정하고,
  // 실패 뒤에 상담원이 일반 메시지를 보내면 걷음. 규칙은 isMatchFailureShown.
  const isMatchFailed = isMatchFailureShown(endedConsultation);
  const isFailedCardVisible =
    (isFailed && !isFailedCardHidden) || isMatchFailed;
  // 대화 위에 고정되는 안내 카드(완료·요청 중·요청 실패). 첫 메시지가 가리지 않게 높이만큼 띄움.
  const hasTopCard =
    inquiry.isFinished || phase === "requesting" || isFailedCardVisible;

  function renderTopCard() {
    const className = "absolute inset-x-4 top-4 z-10";
    if (inquiry.isFinished) {
      return (
        <MessageAlert
          status="completed"
          title={t("completed.title")}
          description={t("completed.description")}
          caption={t("completed.caption")}
          className={className}
        />
      );
    }
    if (phase === "requesting") {
      return (
        <MessageAlert
          status="loading"
          title={t("realtime.requesting.title")}
          description={t("realtime.requesting.description")}
          // 피그마(11315:50259 등)는 "최대 5분"이지만 백엔드 매칭 실패(스케줄러)가 3분이라 3분으로 맞춤(사용자 결정 2026-11-03).
          caption={t("realtime.requesting.caption")}
          className={className}
        />
      );
    }
    // Figma 10819:40835 "실시간 상담 불가" 카드에 요구명세서 REQ-23-0020 문구(2026-10-29 결정). 버튼 없이 일반 문의로 이어감.
    if (isFailedCardVisible) {
      return (
        <MessageAlert
          status="error"
          title={t("realtime.failed.title")}
          description={t("realtime.failed.description")}
          caption={t("realtime.failed.caption")}
          className={className}
        />
      );
    }
    return null;
  }

  async function handleClickCopy(code: string) {
    const [error] = await tryit(() => navigator.clipboard.writeText(code))();
    if (error) {
      console.error("캠페인 코드 복사 실패", error);
      toast.error(t("copyFailed"));
      return;
    }
    toast.success(t("copied"));
  }

  function renderMessage(message: InquiryMessageViewModel) {
    const side = message.isMine ? "me" : "other";
    const name = message.isMine ? myName : t("bigbirdManager");
    // 서버의 상담 종료 안내는 말풍선이 아니라 가운데 구분선(마켓·인플루언서 시안과 같음).
    if (message.kind === "notice") {
      return <ChatDivider className="self-center">{message.body}</ChatDivider>;
    }
    if (message.isDeleted) {
      return (
        <ChatDivider className="self-center">{t("deletedMessage")}</ChatDivider>
      );
    }
    if (message.campaign) {
      const { campaign } = message;
      const listed = campaigns?.find(
        (item) => item.campaignCode === campaign.campaignCode,
      );
      return (
        <ChatMessage
          name={name}
          side={side}
          card={
            <ChatCodeCard
              thumbnailSrc={
                campaign.mainImageUrl ?? listed?.imageUrl ?? undefined
              }
              title={campaign.productName}
              description={listed?.typeName ?? campaign.brandName}
              codeLabel={t("campaignCode")}
              code={campaign.campaignCode}
              copyLabel={t("copyCode")}
              onClickCopy={() => void handleClickCopy(campaign.campaignCode)}
            />
          }
        />
      );
    }
    return (
      <EditableChatMessage
        message={message}
        name={name}
        time={formatMessageTime(message.createdAt)}
        // 실시간 상담은 Firestore 메시지라 수정·삭제 API 대상이 아니고, 종료된 문의는 읽기 전용입니다.
        canModify={
          onChangedMessage !== undefined &&
          !inquiry.isRealtime &&
          !inquiry.isFinished
        }
        onChanged={() => onChangedMessage?.()}
      />
    );
  }

  return (
    <>
      <SubHeader
        variant="chat"
        title={
          <>
            {/* TAB·MO는 목록과 대화가 다른 화면이라 목록으로 돌아가는 버튼을 둠(사용자 결정 2026-10-14). */}
            <Button
              asChild
              variant="outline-foreground"
              size="icon-sm"
              className="shrink-0 desktop:hidden"
            >
              <Link
                to={ROUTES.customerCenterBigbird}
                aria-label={t("backToList")}
              >
                <ChevronLeft />
              </Link>
            </Button>
            {/* 뒤로가기와는 12, 배지와 제목 사이는 8(Figma Header / Sub의 안쪽 Title Group) */}
            {/* 제목 영역을 누르면 상세 정보가 열림(Figma 3.0.6 "타이틀 영역 클릭 시 우측 상세정보 호출") */}
            {/* 버튼 안의 h2는 제목으로 읽히지 않아 h2가 버튼을 감쌈 */}
            <h2 className="flex min-w-0 text-base leading-none font-semibold">
              <button
                type="button"
                disabled={!hasDetail}
                aria-expanded={hasDetail ? isDetailOpen : undefined}
                onClick={handleClickDetail}
                className="flex min-w-0 items-center gap-2 text-left disabled:cursor-default"
              >
                <Badge variant={STATUS_BADGE_VARIANT[inquiry.status]}>
                  {t(inquiry.status)}
                </Badge>
                <span className="-my-0.5 truncate py-0.5">
                  {t(title.key, { name: "name" in title ? title.name : "" })}
                </span>
              </button>
            </h2>
          </>
        }
        // 실시간 상담 중에만 상담 종료 버튼(Figma 3.0.6: 상담일 표시 삭제). 모바일은 제목 아래 2행 오른쪽.
        // MO는 2행에 상세 정보 버튼과 상담 종료 버튼이 반반으로 놓임(Figma 41621·41622·40280).
        actions={
          hasDetail || inquiry.isRealtime || canRequestRealtime ? (
            <div className="flex items-center gap-3 tablet:justify-end">
              {hasDetail && (
                <Button
                  variant="outline-foreground"
                  size="sm"
                  className="flex-1 tablet:hidden"
                  onClick={handleClickDetail}
                >
                  {t("detail")}
                </Button>
              )}
              {canRequestRealtime && (
                <Button
                  variant="outline-foreground"
                  size="sm"
                  className="flex-1 tablet:flex-none"
                  onClick={onClickRealtime}
                  disabled={isRealtimeRequesting}
                >
                  {t("realtime.request")}
                </Button>
              )}
              {inquiry.isRealtime && (
                <Button
                  // Figma: 상담 종료는 파란색이 아니라 기본(foreground) 글자색.
                  variant="outline-foreground"
                  size="sm"
                  className="flex-1 tablet:flex-none"
                  onClick={onClickEnd}
                  disabled={inquiry.isFinished || !onClickEnd}
                >
                  {t("realtime.end")}
                </Button>
              )}
            </div>
          ) : undefined
        }
      />
      {/* 완료 카드는 대화 위에 고정됨(Figma 9298:260494). 종료된 문의는 입력창이 없음. */}
      <div className="relative flex min-h-0 flex-1 flex-col bg-muted">
        {renderTopCard()}
        {isHistoryLoading ||
        (hasNoMessages && inquiry.isRealtime && realtime.isLoading) ? (
          <LoaderCircle
            role="status"
            aria-label={tCommon("status.loading")}
            className="m-auto size-6 animate-spin text-muted-foreground"
          />
        ) : isHistoryError ? (
          <EmptyState
            type="no-message"
            title={t("conversationError")}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void timeline.mutate();
                  void detail.mutate();
                }}
              >
                {tCommon("action.retry")}
              </Button>
            }
            className="flex-1"
          />
        ) : hasNoMessages && inquiry.isRealtime && realtime.isError ? (
          <EmptyState
            type="no-message"
            title={t(
              realtime.isOtherDevice
                ? "realtime.otherDevice"
                : "realtimeLoadError",
            )}
            className="flex-1"
          />
        ) : // 요청 중·연결 중·요청 실패에서 보일 메시지(캠페인 카드 포함)가 없으면 빈 영역으로 둠(시안 9298:260487 등). 안내는 종료된 이력에만 보임.
        inquiry.isRealtime && inquiry.isFinished && messages.length === 0 ? (
          <EmptyState
            type="no-message"
            title={t("realtimeHistory")}
            className="flex-1"
          />
        ) : (
          // Radix 스크롤 영역은 안쪽을 display:table로 감싸 내용 폭(긴 캠페인 카드 380px)만큼 늘어나고,
          // MO(360)에서 대화가 화면 밖으로 밀립니다. 세로 스크롤만 쓰므로 안쪽을 block으로 둡니다.
          <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:block!">
            <ol
              className={cn(
                "flex flex-col gap-3 px-5 py-4 tablet:gap-4 tablet:pt-5",
                hasTopCard && "pt-36 tablet:pt-36",
              )}
            >
              {rows.map((row, index) => {
                const createdAt =
                  row.type === "files" ? row.createdAt : row.message.createdAt;
                const previous = rows[index - 1];
                const previousCreatedAt =
                  previous?.type === "files"
                    ? previous.createdAt
                    : previous?.message.createdAt;
                const day = formatDividerDate(createdAt);
                const isNewDay =
                  !previousCreatedAt ||
                  formatDividerDate(previousCreatedAt) !== day;
                return (
                  <li
                    key={row.id}
                    className={cn(
                      "flex flex-col gap-3 tablet:gap-4",
                      // 캠페인 카드와 다음 메시지는 Figma에서 한 Message Row라 행 간격보다 4 좁음(PC·TAB 12, MO 8)
                      row.type === "message" && row.message.campaign && "-mb-1",
                    )}
                  >
                    {isNewDay && (
                      <ChatDivider className="self-center">{day}</ChatDivider>
                    )}
                    {row.type === "files" ? (
                      <ConversationFiles
                        row={row}
                        name={row.isMine ? myName : t("bigbirdManager")}
                        time={
                          row.text
                            ? formatMessageTime(row.text.createdAt)
                            : undefined
                        }
                      />
                    ) : (
                      renderMessage(row.message)
                    )}
                  </li>
                );
              })}
            </ol>
            <div ref={endRef} />
          </ScrollArea>
        )}
      </div>
      {/* 문의 남기기에서 넘어온 첨부를 올리는 동안(또는 실패했을 때) 보이는 진행 줄. */}
      <InquiryUploadStatus threadIdx={inquiry.threadIdx} />
      {/* 입력창은 완료된 상담에도 항상 있음(사용자 결정 2026-10-28). 끝난 문의에 보내면 서버가 새 스레드를 만들고,
          입력창이 그 번호로 이동시킴. 실시간 입력창은 진행 중인 상담에만 씀. */}
      {/* 연결 실패한 실시간 상담도 일반 문의로 이어 씀: 같은 캠페인 스레드를 일반 문의로 돌리거나(기타는 새 스레드) 그리로 보냄. */}
      {inquiry.isFinished || isFailed ? (
        <BigbirdMessageComposer
          threadIdx={inquiry.threadIdx}
          isFinished
          campaignIdx={inquiry.campaignIdx}
          onSent={onChangedMessage}
        />
      ) : (
        (composer ??
        (inquiry.isRealtime ? (
          <DisabledComposer />
        ) : (
          <BigbirdMessageComposer
            threadIdx={inquiry.threadIdx}
            onSent={onChangedMessage}
          />
        )))
      )}
    </>
  );
}

// 실시간 상담 입력창. 요청 중·요청 실패에서는 비활성이 확정이고(2026-10-14), 상담 중 전송은
// 쓰기 계약이 확정되기 전이라 같이 비활성으로 둠.
function DisabledComposer() {
  const { t } = useTranslation("widgets/bigbird-inquiry-workspace");
  return (
    <div className="shrink-0 bg-muted p-4">
      <TextField
        variant="count"
        isWide
        maxLength={3000}
        disabled
        aria-label={t("realtime.composer")}
        placeholder={t("realtime.composerPlaceholder")}
        leading={
          <Button variant="outline-muted" size="sm" disabled>
            <Paperclip />
            {t("realtime.attach")}
          </Button>
        }
        submit={
          <Button size="sm" disabled>
            {t("realtime.send")}
          </Button>
        }
      />
    </div>
  );
}
