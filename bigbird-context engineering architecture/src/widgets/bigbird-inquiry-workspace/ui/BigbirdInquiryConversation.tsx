import { ChevronLeft, LoaderCircle, Paperclip, RotateCw } from "lucide-react";
import { tryit } from "radash";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import {
  ConversationFiles,
  groupAttachments,
  InquiryUploadStatus,
  useInquiryCampaigns,
  useRealtimeConsultationMessages,
} from "@/entities/inquiry";
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
  formatConsultDate,
  formatDividerDate,
  formatMessageTime,
  getInquiryTitleKey,
  STATUS_BADGE_VARIANT,
} from "../lib/format";

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
  /** 대화 아래에 붙는 입력창. 종료된 문의면 넘기지 않음. */
  composer?: ReactNode;
  // 실시간 상담의 쓰기 동작. 연동(Firestore·REST 쓰기 계약)이 확정되기 전에는 넘기지 않으며,
  // 넘기지 않으면 해당 버튼은 비활성.
  onClickEnd?: () => void;
  onClickRetry?: () => void;
  onClickLeaveMessage?: () => void;
}

// Figma 빅버드 문의 채팅(5202:101654, 완료 9298:260494). 날짜가 바뀔 때마다 구분 칩을 넣음.
export function BigbirdInquiryConversation({
  inquiry,
  myName,
  threadUserIdx,
  composer,
  onClickEnd,
  onClickRetry,
  onClickLeaveMessage,
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
  const title = getInquiryTitleKey(inquiry);
  const endRef = useRef<HTMLDivElement>(null);
  // 일반·실시간 문의 모두 캠페인 카드를 표시하고, 운영 앱용 인사말 등 자동 안내만 숨김.
  const messages = (
    inquiry.isRealtime ? (realtime.messages ?? []) : inquiry.messages
  ).filter((message) => message.kind !== "system");

  const rows = groupAttachments(messages);
  // 새 메시지가 오면 맨 아래로 내림. 처음 들어올 때도 최신 메시지가 보이게 함.
  const messageCount = messages.length;
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messageCount]);

  const phase = inquiry.realtimePhase;
  // 대화 위에 고정되는 안내 카드(완료·요청 중·요청 실패). 첫 메시지가 가리지 않게 높이만큼 띄움.
  const hasTopCard =
    inquiry.isFinished || phase === "requesting" || phase === "failed";

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
          caption={t("realtime.requesting.caption")}
          className={className}
        />
      );
    }
    if (phase === "failed") {
      return (
        <MessageAlert
          status="error"
          title={t("realtime.failed.title")}
          description={t("realtime.failed.description")}
          caption={t("realtime.failed.caption")}
          className={className}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onClickRetry}
                disabled={!onClickRetry}
              >
                <RotateCw />
                {t("realtime.retry")}
              </Button>
              <Button
                size="sm"
                onClick={onClickLeaveMessage}
                disabled={!onClickLeaveMessage}
              >
                {t("realtime.leaveMessage")}
              </Button>
            </>
          }
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
              description={campaign.brandName}
              period={listed?.period ?? undefined}
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
      <ChatMessage
        name={name}
        side={side}
        message={message.body}
        time={formatMessageTime(message.createdAt)}
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
            <Badge variant={STATUS_BADGE_VARIANT[inquiry.status]}>
              {t(inquiry.status)}
            </Badge>
            <h2 className="truncate text-base leading-none font-semibold">
              {t(title.key, { name: "name" in title ? title.name : "" })}
            </h2>
          </>
        }
        // 모바일 2행: 실시간 상담은 왼쪽 상담일 + 오른쪽 상담 종료(Figma 9298:262218), 일반 문의는 날짜만 오른쪽.
        // TAB·PC는 제목 줄 오른쪽에 나란히 놓임.
        actions={
          <div
            className={cn(
              "flex items-center gap-2 tablet:justify-end",
              inquiry.isRealtime ? "justify-between" : "justify-end",
            )}
          >
            <p className="flex shrink-0 gap-2 text-xs text-muted-foreground">
              {t("consultDate")}
              <span className="text-foreground">
                {formatConsultDate(inquiry.createdAt)}
              </span>
            </p>
            {inquiry.isRealtime && (
              <Button
                // Figma: 상담 종료는 파란색이 아니라 기본(foreground) 글자색.
                variant="outline-foreground"
                size="sm"
                onClick={onClickEnd}
                disabled={inquiry.isFinished || !onClickEnd}
              >
                {t("realtime.end")}
              </Button>
            )}
          </div>
        }
      />
      {/* 완료 카드는 대화 위에 고정됨(Figma 9298:260494). 종료된 문의는 입력창이 없음. */}
      <div className="relative flex min-h-0 flex-1 flex-col bg-muted">
        {renderTopCard()}
        {inquiry.isRealtime && realtime.isLoading ? (
          <LoaderCircle
            role="status"
            aria-label={tCommon("status.loading")}
            className="m-auto size-6 animate-spin text-muted-foreground"
          />
        ) : inquiry.isRealtime && realtime.isError ? (
          <EmptyState
            type="no-message"
            title={t("realtimeLoadError")}
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
          <ScrollArea className="min-h-0 flex-1">
            <ol
              className={cn(
                "flex flex-col gap-3 px-4 py-4 tablet:gap-4 tablet:px-5 tablet:pt-5",
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
                  <li key={row.id} className="flex flex-col gap-3 tablet:gap-4">
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
      {!inquiry.isFinished &&
        (composer ?? (inquiry.isRealtime ? <DisabledComposer /> : null))}
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
