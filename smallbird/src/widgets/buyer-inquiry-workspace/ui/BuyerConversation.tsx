import { LoaderCircle } from "lucide-react";
import { Fragment, useEffect, useRef } from "react";

import {
  ConversationFiles,
  groupAttachments,
  insertRealtimeLines,
  useInquiryUserImage,
  usePurchaserConversation,
  useRealtimeSessionLines,
} from "@/entities/inquiry";
import { EditableChatMessage } from "@/features/edit-inquiry-message";
import { ChatDivider } from "@/shared/components/chat-message";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";

import { formatDividerDate, formatMessageTime } from "../lib/format";
import { IS_BUYER_WRITE_ENABLED } from "../model/constants";
import { isQnaSource } from "../model/menu";
import { useRefreshListOnRead } from "../model/useRefreshListOnRead";
import { QnaConversation } from "./QnaConversation";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

const TABLET_ONLY_QUERY = "(min-width: 768px) and (max-width: 1439.98px)";

interface BuyerConversationProps {
  inquiry: BuyerInquiryViewModel;
  /** 다른 기기가 이 실시간 상담을 쥐고 있어 읽기가 막힘(채팅방 잠금). */
  isOtherDevice?: boolean;
  /** 안 읽은 문의의 대화를 받아 읽음 처리된 뒤 목록을 다시 받을 때 부름(파란 점 갱신). */
  onRead?: () => void;
}

/** 대화 영역의 메시지 부분. 구매자·인플루언서 문의는 상대↔광고주 스레드, 상품·캠페인 Q&A는 질문과 답변. */
export function BuyerConversation({
  inquiry,
  isOtherDevice = false,
  onRead,
}: BuyerConversationProps) {
  return isQnaSource(inquiry.source) ? (
    <QnaConversation inquiry={inquiry} onRead={onRead} />
  ) : (
    <PurchaserConversation
      inquiry={inquiry}
      isOtherDevice={isOtherDevice}
      onRead={onRead}
    />
  );
}

function PurchaserConversation({
  inquiry,
  isOtherDevice = false,
  onRead,
}: BuyerConversationProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { t: tCommon } = useTranslation();
  // Figma 구매자 대화 말풍선: TAB(6791:59549)은 작은 형태(아바타 32·최대 200), MO·PC는 최대 340입니다.
  const isTablet = useMediaQuery(TABLET_ONLY_QUERY);
  const { messages, isLoading, isError, mutate } =
    usePurchaserConversation(inquiry);
  const writerName = inquiry.writerName ?? t("unknownWriter");
  const avatarSrc = useInquiryUserImage(inquiry.threadUserIdx);
  useRefreshListOnRead(
    inquiry.key,
    inquiry.hasUnread,
    messages !== undefined,
    onRead,
  );
  // 인플루언서 문의에만 실시간 상담의 시작·종료 줄을 끼움(사용자 요청 2026-11-09). 구매자 문의에도 쓸지는 미정.
  const realtimeLines = useRealtimeSessionLines(
    inquiry,
    inquiry.source === "influencer",
  );
  const shownMessages = messages
    ? insertRealtimeLines(messages, realtimeLines, {
        start: t("realtime.started"),
        end: t("realtime.ended"),
      })
    : undefined;
  const endRef = useRef<HTMLDivElement>(null);
  // 새 메시지(보낸 것·받은 것)가 생기거나 문의를 바꿔 처음 들어오면 맨 아래로 내림(빅버드 문의와 같음).
  const messageCount = shownMessages?.length ?? 0;
  useEffect(() => {
    if (isLoading) return;
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messageCount, isLoading, inquiry.key]);

  if (isLoading) {
    return (
      <LoaderCircle
        role="status"
        aria-label={tCommon("status.loading")}
        className="m-auto size-6 animate-spin text-muted-foreground"
      />
    );
  }
  if (isError || isOtherDevice) {
    return (
      <EmptyState
        type="no-message"
        title={t(isOtherDevice ? "realtime.otherDevice" : "conversationError")}
        className="flex-1"
      />
    );
  }
  // 구매자 앱이 문의를 시작할 때 보내는 캠페인 JSON auto 메시지는 상세 패널과 내용이 겹쳐 숨깁니다.
  // 삭제된 메시지는 "삭제됨" 표시 없이 자리째 뺌(REQ-24-0044 대신 사용자 결정 2026-10-29).
  const rows = groupAttachments(
    (shownMessages ?? []).filter(
      (message) =>
        message.kind !== "system" && !message.campaign && !message.isDeleted,
    ),
  );
  if (rows.length === 0) {
    return (
      <EmptyState
        type="no-message"
        title={t("noMessages")}
        className="flex-1"
      />
    );
  }

  return (
    <>
      <ol className="flex flex-col gap-3 tablet:gap-4">
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
            !previousCreatedAt || formatDividerDate(previousCreatedAt) !== day;
          const isMine = row.type === "files" ? row.isMine : row.message.isMine;
          const senderId =
            row.type === "files"
              ? (row.text ?? row.messages[0])?.senderId
              : row.message.senderId;
          // 내 말풍선에는 보낸 광고주 계정 id를 보입니다(v2와 같음, Figma "광고주명"). 모를 때만 "광고주"입니다.
          const name = isMine ? (senderId ?? t("advertiser")) : writerName;
          // 내 텍스트+첨부 묶음의 앞 텍스트. 텍스트만 있는 메시지와 같은 수정·삭제 툴바를 붙임(첨부는 그대로).
          const groupedText = row.type === "files" && isMine ? row.text : null;
          return (
            <li key={row.id} className="flex flex-col gap-3 tablet:gap-4">
              {isNewDay && (
                <ChatDivider className="self-center">{day}</ChatDivider>
              )}
              {row.type === "files" ? (
                <ConversationFiles
                  row={row}
                  name={name}
                  size={isTablet ? "sm" : "md"}
                  time={
                    row.text ? formatMessageTime(row.text.createdAt) : undefined
                  }
                  renderText={
                    groupedText
                      ? (attachments) => (
                          <EditableChatMessage
                            message={groupedText}
                            name={name}
                            time={formatMessageTime(groupedText.createdAt)}
                            size={isTablet ? "sm" : "md"}
                            canModify={
                              IS_BUYER_WRITE_ENABLED && groupedText.id > 0
                            }
                            onChanged={() => void mutate()}
                            attachments={attachments}
                          />
                        )
                      : undefined
                  }
                />
              ) : row.message.kind === "notice" ? (
                <ChatDivider className="self-center">
                  {row.message.body}
                </ChatDivider>
              ) : (
                <Fragment>
                  <EditableChatMessage
                    message={row.message}
                    name={name}
                    avatarSrc={isMine ? undefined : avatarSrc}
                    time={formatMessageTime(row.message.createdAt)}
                    size={isTablet ? "sm" : "md"}
                    // Figma 구매자 PC 내 메시지(6756:28994)는 아바타와 12px, 나머지는 8px입니다.
                    rowClassName={isMine ? "desktop:gap-3" : undefined}
                    // 음수 id는 실시간 상담 Firestore 메시지라 REST 수정·삭제를 쓸 수 없음.
                    canModify={IS_BUYER_WRITE_ENABLED && row.message.id > 0}
                    onChanged={() => void mutate()}
                  />
                </Fragment>
              )}
            </li>
          );
        })}
      </ol>
      <div ref={endRef} />
    </>
  );
}
