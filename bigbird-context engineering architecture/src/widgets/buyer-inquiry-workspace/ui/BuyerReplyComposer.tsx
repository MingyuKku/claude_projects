import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import {
  AttachmentTextField,
  InquiryUploadStatus,
  sendInquiryMessage,
  startInquiryUploads,
  useInquiryAttachments,
  usePurchaserConversation,
} from "@/entities/inquiry";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { IS_BUYER_WRITE_ENABLED } from "../model/constants";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

/**
 * 구매자 문의 답장 입력창. 구매자 대화 스레드에 `POST /v3/help/thread/message`로 텍스트를 보내고, 파일은
 * 업로드 스토어가 이어서 올림(진행 줄은 입력창 위). 대화 내역(스레드)이 없으면 보낼 곳이 없어 비활성.
 * ponytail: 보낸 답장이 구매자 앱에 도달하는지는 구매자 앱과 확인하지 못함(스펙 "미구현·미확인").
 */
export function BuyerReplyComposer({
  inquiry,
}: {
  inquiry: BuyerInquiryViewModel;
}) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { threadIdx, mutate } = usePurchaserConversation(inquiry);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const attachments = useInquiryAttachments();
  const hasContent = Boolean(text.trim()) || attachments.files.length > 0;
  // 쓰기를 꺼 두면 입력창은 보이되 비활성(model/constants.ts).
  const isDisabled = threadIdx === null || !IS_BUYER_WRITE_ENABLED;
  const canSend = !isDisabled && !isSending && hasContent;

  async function submit() {
    if (threadIdx === null || !canSend) return;
    setIsSending(true);
    try {
      // 종료된 스레드에 보내면 서버가 새 스레드를 만들어 그 번호를 돌려줌. 첨부도 그 스레드로 보냄.
      let target = threadIdx;
      const body = text.trim();
      if (body) {
        const [error, savedThreadIdx] = await tryit(sendInquiryMessage)({
          threadIdx,
          body,
        });
        if (error) {
          console.error("구매자 문의 답장 전송 실패", error);
          toast.error(t("reply.failed"));
          return;
        }
        target = savedThreadIdx;
        setText("");
      }
      if (attachments.files.length > 0) {
        startInquiryUploads(target, [...attachments.files]);
        attachments.reset();
      }
      // 전송은 이미 끝났으니 재조회 실패는 전송 실패로 알리지 않고 로그만 남김.
      const [refreshError] = await tryit(mutate)();
      if (refreshError) console.error("구매자 대화 재조회 실패", refreshError);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="shrink-0 border-t border-border bg-muted">
      {threadIdx !== null && <InquiryUploadStatus threadIdx={threadIdx} />}
      <form
        className="p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <AttachmentTextField
          attachments={attachments}
          maxLength={3000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          // Enter로 전송, Shift+Enter로 줄바꿈. 한글 조합 중의 Enter는 글자 확정이라 보내지 않음.
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              void submit();
            }
          }}
          disabled={isDisabled}
          aria-label={t("messagePlaceholder")}
          placeholder={t("messagePlaceholder")}
          submit={
            <Button type="submit" size="sm" disabled={!canSend}>
              {t("send")}
            </Button>
          }
        />
      </form>
    </div>
  );
}
