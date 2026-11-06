import { LoaderCircle } from "lucide-react";

import { deleteQnaReply, editQnaReply, useQnaDetail } from "@/entities/inquiry";
import { EditableChatMessage } from "@/features/edit-inquiry-message";
import { ChatDivider, ChatMessage } from "@/shared/components/chat-message";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";

import { formatDividerDate, formatMessageTime } from "../lib/format";
import { IS_BUYER_WRITE_ENABLED } from "../model/constants";

import type {
  BuyerInquiryViewModel,
  InquiryMessageViewModel,
  QnaItemViewModel,
} from "@/entities/inquiry";

interface QnaConversationProps {
  inquiry: BuyerInquiryViewModel;
}

/** 상품 Q&A: 질문마다 광고주 답변 하나. 답변 입력은 구매자 문의처럼 하단 고정 입력창(QnaReplyComposer), 수정·삭제는 호버 버튼. */
export function QnaConversation({ inquiry }: QnaConversationProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { t: tCommon } = useTranslation();
  const { items, isLoading, isError, mutate } = useQnaDetail(inquiry);
  const writerName = inquiry.writerName ?? t("unknownWriter");

  if (isLoading) {
    return (
      <LoaderCircle
        role="status"
        aria-label={tCommon("status.loading")}
        className="m-auto size-6 animate-spin text-muted-foreground"
      />
    );
  }
  if (isError || !items) {
    return (
      <EmptyState
        type="no-message"
        title={t("conversationError")}
        className="flex-1"
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        type="no-message"
        title={t("noMessages")}
        className="flex-1"
      />
    );
  }

  return (
    <ol className="flex flex-col gap-6">
      {items.map((item) => (
        <li key={item.inquiryIdx} className="flex flex-col gap-3 tablet:gap-4">
          <ChatDivider className="self-center">
            {formatDividerDate(item.question.writtenAt)}
          </ChatDivider>
          <ChatMessage
            name={writerName}
            side="other"
            message={
              item.question.isDeleted
                ? t("questionDeleted")
                : item.question.body
            }
            time={formatMessageTime(item.question.writtenAt)}
          />
          <QnaReply
            item={item}
            onChanged={() => void mutate()}
            advertiserName={t("advertiser")}
          />
        </li>
      ))}
    </ol>
  );
}

function QnaReply({
  item,
  advertiserName,
  onChanged,
}: {
  item: QnaItemViewModel;
  advertiserName: string;
  onChanged: () => void;
}) {
  const { reply } = item;
  if (!reply) return null;
  // 구매자 문의와 같은 말풍선·호버 수정·삭제를 쓰려고 답변을 메시지 모양으로 바꿈. 읽힌 답변은 버튼이 없음.
  const message: InquiryMessageViewModel = {
    id: reply.replyIdx,
    isMine: true,
    kind: "text",
    body: reply.body,
    createdAt: reply.writtenAt ?? item.question.writtenAt,
    isDeleted: false,
    isRead: reply.isRead,
    isEdited: false,
    senderId: null,
    campaign: null,
    attachment: null,
  };
  return (
    <EditableChatMessage
      message={message}
      name={advertiserName}
      time={reply.writtenAt ? formatMessageTime(reply.writtenAt) : ""}
      canModify={IS_BUYER_WRITE_ENABLED}
      onChanged={onChanged}
      onSubmitEdit={(body) => editQnaReply(reply.replyIdx, body)}
      onConfirmDelete={() => deleteQnaReply(reply.replyIdx)}
    />
  );
}
