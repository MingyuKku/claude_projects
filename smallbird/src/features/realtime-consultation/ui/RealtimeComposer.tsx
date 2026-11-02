import { LoaderCircle } from "lucide-react";
import { useState } from "react";

import { AttachmentTextField, useInquiryAttachments } from "@/entities/inquiry";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

interface RealtimeComposerProps {
  /** 응대 락을 가진 탭에서 요청 중이거나 연결된 상담만 보낼 수 있음. */
  canSend: boolean;
  /** 저장에 성공하면 true. 실패하면 false를 돌려주며 입력이 되돌려짐. */
  onSend: (text: string) => Promise<boolean>;
  /** 파일을 모두 올려 한 번에 보냄. 실패하면 false이고 파일은 입력창에 그대로 남음. */
  onSendFiles: (files: File[]) => Promise<boolean>;
}

// Figma 실시간 상담 입력창(Text Field / Default, 글자 수 3000)에 첨부를 붙인 입력창.
export function RealtimeComposer({
  canSend,
  onSend,
  onSendFiles,
}: RealtimeComposerProps) {
  const { t } = useTranslation("features/realtime-consultation");
  const { t: tCommon } = useTranslation();
  const [text, setText] = useState("");
  const [isSendingFiles, setIsSendingFiles] = useState(false);
  const attachments = useInquiryAttachments();

  async function submit() {
    const body = text;
    const files = attachments.files;
    if (!canSend || isSendingFiles || (!body.trim() && files.length === 0))
      return;
    // 보내는 즉시 입력을 비워 다음 글을 바로 쓸 수 있게 함(전송은 동시에 여러 건 진행될 수 있고, 같은 글을
    // 두 번 보내지 않음). 실패하면 사용자가 그 사이 다른 글을 쓰지 않았을 때만 입력을 되돌림.
    setText("");
    if (body.trim() && !(await onSend(body))) {
      setText((current) => current || body);
      return;
    }
    if (files.length === 0) return;
    // 올리는 동안 로딩을 보여 주고, 모두 올라간 뒤 한 번에 저장해 대화에 한꺼번에 나타나게 함.
    setIsSendingFiles(true);
    try {
      if (await onSendFiles(files)) attachments.reset();
    } finally {
      setIsSendingFiles(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="shrink-0 bg-muted p-4"
    >
      <AttachmentTextField
        attachments={attachments}
        isAttachDisabled={isSendingFiles}
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
        disabled={!canSend}
        aria-label={t("composer")}
        placeholder={t("composerPlaceholder")}
        submit={
          <Button
            type="submit"
            size="sm"
            className="h-8"
            disabled={
              !canSend ||
              isSendingFiles ||
              (!text.trim() && attachments.files.length === 0)
            }
          >
            {isSendingFiles && (
              <LoaderCircle
                role="status"
                aria-label={tCommon("status.loading")}
                className="animate-spin"
              />
            )}
            {t("send")}
          </Button>
        }
      />
    </form>
  );
}
