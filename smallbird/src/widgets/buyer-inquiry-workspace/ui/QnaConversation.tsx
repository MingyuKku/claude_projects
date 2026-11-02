import { LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  createQnaReply,
  deleteQnaReply,
  editQnaReply,
  useQnaDetail,
} from "@/entities/inquiry";
import { isApiError } from "@/shared/api";
import { ChatDivider, ChatMessage } from "@/shared/components/chat-message";
import { EmptyState } from "@/shared/components/empty-state";
import { TextField } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import { formatDividerDate, formatMessageTime } from "../lib/format";
import { IS_BUYER_WRITE_ENABLED } from "../model/constants";

import type {
  BuyerInquiryViewModel,
  QnaItemViewModel,
} from "@/entities/inquiry";

interface QnaConversationProps {
  inquiry: BuyerInquiryViewModel;
}

/** 상품 Q&A: 질문마다 광고주 답변 하나. 답변 등록·수정·삭제는 REST이고, 구매자가 읽은 답변은 서버가 수정·삭제를 거절함. */
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
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const [text, setText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { reply } = item;

  // 서버 상태 코드로 사유를 구분함: 409는 이미 답변이 있거나(등록) 이미 읽힌 답변(수정·삭제).
  async function run(
    action: () => Promise<void>,
    conflictKey: "exists" | "read",
  ) {
    setIsBusy(true);
    try {
      await action();
      setText("");
      setIsEditing(false);
      onChanged();
    } catch (error) {
      console.error("Q&A 답변 처리 실패", error);
      toast.error(
        isApiError(error) && error.status === 409
          ? t(`reply.${conflictKey}`)
          : t("reply.failed"),
      );
      // 409는 서버 상태와 어긋났다는 뜻이라 최신 상태를 다시 받음.
      if (isApiError(error) && error.status === 409) onChanged();
    } finally {
      setIsBusy(false);
    }
  }

  if (reply && !isEditing) {
    return (
      <div className="flex flex-col items-end gap-2">
        <ChatMessage
          name={advertiserName}
          side="me"
          message={reply.body}
          time={
            reply.writtenAt ? formatMessageTime(reply.writtenAt) : undefined
          }
          className="w-full"
        />
        {IS_BUYER_WRITE_ENABLED && !reply.isRead && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => {
                setText(reply.body);
                setIsEditing(true);
              }}
            >
              {t("reply.edit")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => setIsDeleteOpen(true)}
            >
              {t("reply.delete")}
            </Button>
          </div>
        )}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("reply.deleteTitle")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("reply.deleteDescription")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("reply.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  void run(() => deleteQnaReply(reply.replyIdx), "read")
                }
              >
                {t("reply.delete")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // 답변이 없거나 수정 중: 입력창.
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const body = text.trim();
        if (!IS_BUYER_WRITE_ENABLED || !body || isBusy) return;
        void (reply
          ? run(() => editQnaReply(reply.replyIdx, body), "read")
          : run(() => createQnaReply(item.inquiryIdx, body), "exists"));
      }}
    >
      <TextField
        variant="count"
        isWide
        maxLength={3000}
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label={t("reply.placeholder")}
        placeholder={t("reply.placeholder")}
        disabled={isBusy || !IS_BUYER_WRITE_ENABLED}
        submit={
          <div className="flex gap-2">
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBusy}
                onClick={() => {
                  setIsEditing(false);
                  setText("");
                }}
              >
                {t("reply.cancel")}
              </Button>
            )}
            <Button
              type="submit"
              size="sm"
              disabled={!IS_BUYER_WRITE_ENABLED || isBusy || !text.trim()}
            >
              {isEditing ? t("reply.save") : t("reply.submit")}
            </Button>
          </div>
        }
      />
    </form>
  );
}
