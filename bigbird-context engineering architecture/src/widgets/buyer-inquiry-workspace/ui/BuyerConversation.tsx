import { LoaderCircle } from "lucide-react";
import { Fragment } from "react";

import {
  ConversationFiles,
  groupAttachments,
  useInquiryUserImage,
  usePurchaserConversation,
} from "@/entities/inquiry";
import { ChatDivider, ChatMessage } from "@/shared/components/chat-message";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";

import { formatDividerDate, formatMessageTime } from "../lib/format";
import { QnaConversation } from "./QnaConversation";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

interface BuyerConversationProps {
  inquiry: BuyerInquiryViewModel;
}

/** 대화 영역의 메시지 부분. 구매자 문의는 구매자↔광고주 스레드, 상품 Q&A는 질문과 답변. */
export function BuyerConversation({ inquiry }: BuyerConversationProps) {
  return inquiry.source === "qna" ? (
    <QnaConversation inquiry={inquiry} />
  ) : (
    <PurchaserConversation inquiry={inquiry} />
  );
}

function PurchaserConversation({ inquiry }: BuyerConversationProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { t: tCommon } = useTranslation();
  const { messages, isLoading, isError } = usePurchaserConversation(inquiry);
  const writerName = inquiry.writerName ?? t("unknownWriter");
  const avatarSrc = useInquiryUserImage(inquiry.threadUserIdx);

  if (isLoading) {
    return (
      <LoaderCircle
        role="status"
        aria-label={tCommon("status.loading")}
        className="m-auto size-6 animate-spin text-muted-foreground"
      />
    );
  }
  if (isError) {
    return (
      <EmptyState
        type="no-message"
        title={t("conversationError")}
        className="flex-1"
      />
    );
  }
  const rows = groupAttachments(
    (messages ?? []).filter((message) => message.kind !== "system"),
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
        const name = isMine ? t("advertiser") : writerName;
        return (
          <li key={row.id} className="flex flex-col gap-3 tablet:gap-4">
            {isNewDay && (
              <ChatDivider className="self-center">{day}</ChatDivider>
            )}
            {row.type === "files" ? (
              <ConversationFiles
                row={row}
                name={name}
                time={
                  row.text ? formatMessageTime(row.text.createdAt) : undefined
                }
              />
            ) : row.message.isDeleted ? (
              <ChatDivider className="self-center">
                {t("messageDeleted")}
              </ChatDivider>
            ) : (
              <Fragment>
                <ChatMessage
                  name={name}
                  side={isMine ? "me" : "other"}
                  avatarSrc={isMine ? undefined : avatarSrc}
                  message={row.message.body}
                  time={formatMessageTime(row.message.createdAt)}
                />
              </Fragment>
            )}
          </li>
        );
      })}
    </ol>
  );
}
