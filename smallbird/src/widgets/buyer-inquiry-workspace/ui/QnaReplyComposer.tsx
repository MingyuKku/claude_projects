import { useState } from "react";
import { toast } from "sonner";

import { createQnaReply, useQnaDetail } from "@/entities/inquiry";
import { isApiError } from "@/shared/api";
import { TextField } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { IS_BUYER_WRITE_ENABLED } from "../model/constants";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

interface QnaReplyComposerProps {
  inquiry: BuyerInquiryViewModel;
}

/**
 * 상품 Q&A 답변 입력창. 구매자 문의 입력창(BuyerReplyComposer)처럼 대화 맨 아래에 고정되고, 아직 답변하지 않은
 * 가장 최근 질문에 답변을 등록함. 모두 답변했으면 입력이 막힘.
 */
export function QnaReplyComposer({ inquiry }: QnaReplyComposerProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { items, mutate } = useQnaDetail(inquiry);
  const [text, setText] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const target = items?.filter((item) => !item.reply).at(-1);
  const body = text.trim();
  const isDisabled = !IS_BUYER_WRITE_ENABLED || !target || isBusy;
  const canSend = !isDisabled && body.length > 0;

  async function submit() {
    if (!canSend) return;
    setIsBusy(true);
    try {
      await createQnaReply(target.inquiryIdx, body);
      setText("");
      await mutate();
    } catch (error) {
      console.error("Q&A 답변 등록 실패", error);
      const isConflict = isApiError(error) && error.status === 409;
      // 이미 답변이 있는 질문(409)이면 최신 상태를 다시 받음.
      if (isConflict) void mutate();
      toast.error(isConflict ? t("reply.exists") : t("reply.failed"));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="shrink-0 bg-muted">
      <form
        className="p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <TextField
          variant="count"
          isWide
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
          aria-label={t("reply.placeholder")}
          placeholder={t("reply.placeholder")}
          submit={
            <Button type="submit" size="sm" disabled={!canSend}>
              {t("reply.submit")}
            </Button>
          }
        />
      </form>
    </div>
  );
}
