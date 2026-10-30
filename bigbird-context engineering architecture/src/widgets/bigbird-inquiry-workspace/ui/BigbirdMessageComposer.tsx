import { tryit } from "radash";
import { useState } from "react";
import { generatePath, useNavigate } from "react-router";
import { toast } from "sonner";

import {
  AttachmentTextField,
  createBigbirdInquiry,
  sendInquiryMessage,
  startInquiryUploads,
  useInquiryAttachments,
} from "@/entities/inquiry";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

interface BigbirdMessageComposerProps {
  threadIdx: number;
  /** 끝난 문의면 먼저 일반 문의 스레드를 만들어 보냄(끝난 실시간 스레드로 보내면 새 스레드가 실시간으로 생길 수 있음). */
  isFinished?: boolean;
  campaignIdx?: number | null;
  /** 전송 뒤 목록·대화를 다시 받는 함수. */
  onSent?: () => void;
}

/**
 * 열린 일반 문의(문의 남기기)의 추가 메시지 입력창(사용자 결정 2026-10-28). 텍스트는
 * `POST /v3/help/thread/message`로 보내고 파일은 업로드 스토어가 이어서 올림(진행 줄은 대화 아래).
 */
export function BigbirdMessageComposer({
  threadIdx,
  isFinished = false,
  campaignIdx = null,
  onSent,
}: BigbirdMessageComposerProps) {
  const { t } = useTranslation("widgets/bigbird-inquiry-workspace");
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const attachments = useInquiryAttachments();
  const hasContent = Boolean(text.trim()) || attachments.files.length > 0;
  const canSend = !isSending && hasContent;

  async function submit() {
    if (!canSend) return;
    setIsSending(true);
    try {
      // 그사이 자동 종료된 스레드면 서버가 새 스레드를 만들어 그 번호를 돌려줌. 첨부도 그 스레드로 보냄.
      let target = threadIdx;
      const body = text.trim();
      const files = [...attachments.files];
      if (isFinished) {
        // 끝난 문의: 같은 캠페인의 열린 스레드를 일반 문의로 이어받거나 새로 만들어 거기로 보냄.
        const [createError, created] =
          await tryit(createBigbirdInquiry)(campaignIdx);
        if (createError) {
          console.error("일반 문의 스레드 생성 실패", createError);
          toast.error(t("composer.failed"));
          return;
        }
        target = created.threadIdx;
      }
      if (body) {
        const [error, savedThreadIdx] = await tryit(sendInquiryMessage)({
          threadIdx: target,
          body,
        });
        if (error) {
          console.error("일반 문의 메시지 전송 실패", error);
          toast.error(t("composer.failed"));
          return;
        }
        target = savedThreadIdx;
        // 전송 중에 이어서 쓴 글은 남김
        setText((current) => (current.trim() === body ? "" : current));
      }
      // 전송 중에 새로 고른 파일은 남기고 보낸 파일만 뺌
      if (files.length > 0) {
        startInquiryUploads(target, files);
        files.forEach(attachments.removeSent);
      }
      onSent?.();
      if (target !== threadIdx)
        void navigate(
          generatePath(ROUTES.customerCenterBigbirdThread, {
            threadIdx: String(target),
          }),
          // 목록이 새 문의를 받아오기 전까지 '찾을 수 없는 문의' 대신 로딩을 보여 줌(새 문의 등록과 같은 계약)
          { state: { pendingThreadIdx: target } },
        );
    } finally {
      setIsSending(false);
    }
  }

  return (
    // 입력창은 대화 배경 위에 16px 띄워 놓이고 구분선이 없음(실시간 입력창과 같은 배치).
    <form
      className="shrink-0 bg-muted p-4"
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
        aria-label={t("composer.placeholder")}
        placeholder={t("composer.placeholder")}
        submit={
          <Button type="submit" size="sm" disabled={!canSend}>
            {t("composer.send")}
          </Button>
        }
      />
    </form>
  );
}
