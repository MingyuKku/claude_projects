import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import {
  acceptRealtimeRequest,
  appendConsultationMessage,
  AttachmentTextField,
  InquiryUploadStatus,
  newMessageId,
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
  identifier,
}: {
  inquiry: BuyerInquiryViewModel;
  /** 실시간 상담 메시지에 남길 광고주 계정 id(세션 값). */
  identifier?: string;
}) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { threadIdx, realtimeThread, mutate } =
    usePurchaserConversation(inquiry);
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
      if (body && realtimeThread && inquiry.threadUserIdx !== null) {
        // 실시간 상담: 수락은 대화를 열 때 함(useAcceptRealtimeOnOpen). 열 때 수락이 빠졌으면(문서가 늦게 생김 등)
        // 연결 전 거절(not-connected)이 오므로 여기서 한 번 수락하고 다시 보냄. 수락도 거절되면(종료·만료) 실패.
        const target = {
          threadUserIdx: inquiry.threadUserIdx,
          ...realtimeThread,
        };
        const message = {
          auto: false,
          attachmentIdx: null,
          identifier: identifier ?? null,
          isUserMessage: false,
          body,
          fileName: null,
          messageId: newMessageId(),
        };
        const send = () =>
          appendConsultationMessage(target, {
            requireConnected: true,
            message,
          });
        const [error, result] = await tryit(async () => {
          const first = await send();
          if (first.ok || first.reason !== "not-connected") return first;
          const accepted = await acceptRealtimeRequest(
            target,
            identifier ?? null,
          );
          return accepted.ok ? send() : accepted;
        })();
        if (error || !result.ok) {
          console.error("구매자 실시간 상담 전송 실패", error ?? result);
          toast.error(t("reply.failed"));
          return;
        }
        setText("");
      } else if (body) {
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
    // Figma Conversation Area(6756:28991): 입력창은 대화 배경 위에 16px 띄워 놓이고 구분선이 없습니다.
    <div className="shrink-0 bg-muted">
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
