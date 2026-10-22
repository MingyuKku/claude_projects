import { useState } from "react";

import { ChatMessage } from "@/shared/components/chat-message";
import { FileThumbnail } from "@/shared/components/file-list";
import { MediaViewer } from "@/shared/components/media-viewer";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { getAttachmentDownloadUrl } from "../api/inquiry-api";

import type { ConversationRow } from "../lib/group-attachments";

type FilesRow = Extract<ConversationRow, { type: "files" }>;

interface ConversationFilesProps {
  row: FilesRow;
  name: string;
  /** 앞의 텍스트 말풍선 옆에 보이는 시각. */
  time?: string;
}

/**
 * 대화의 첨부 묶음: 말풍선(있으면) 아래 80px 썸네일 격자 + 누르면 열리는 뷰어. 칸 덩어리는 보낸 쪽 끝에 붙고
 * 마지막 줄은 첫 칸부터 채움. 빅버드 문의와 구매자 문의 대화가 같이 씀.
 */
export function ConversationFiles({ row, name, time }: ConversationFilesProps) {
  const { t: tCommon } = useTranslation();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const items = row.messages.flatMap((message) =>
    message.attachment
      ? [
          {
            type:
              message.kind === "video"
                ? ("video" as const)
                : ("image" as const),
            src: message.body,
            name: message.attachment.fileName ?? "",
            downloadHref: getAttachmentDownloadUrl(
              message.kind === "video" ? "video" : "image",
              message.attachment.attachmentIdx,
            ),
          },
        ]
      : [],
  );

  return (
    <>
      <ChatMessage
        name={name}
        side={row.isMine ? "me" : "other"}
        message={row.text?.body}
        time={time}
        attachments={
          <ul
            className={cn(
              "grid w-full grid-cols-[repeat(auto-fit,80px)] gap-1",
              row.isMine ? "justify-end" : "justify-start",
            )}
          >
            {row.messages.map((message, index) => (
              <li key={message.id}>
                <button
                  type="button"
                  aria-label={message.attachment?.fileName ?? ""}
                  onClick={() => setViewerIndex(index)}
                  className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <FileThumbnail
                    type={message.kind === "video" ? "video" : "image"}
                    src={message.kind === "video" ? undefined : message.body}
                    videoSrc={
                      message.kind === "video" ? message.body : undefined
                    }
                    alt={message.attachment?.fileName ?? ""}
                  />
                </button>
              </li>
            ))}
          </ul>
        }
      />
      <MediaViewer
        items={items}
        index={viewerIndex !== null && items.length > 0 ? viewerIndex : null}
        onChangeIndex={setViewerIndex}
        onClose={() => setViewerIndex(null)}
        title={tCommon("attachment.viewer.title")}
        downloadLabel={tCommon("attachment.viewer.download")}
        closeLabel={tCommon("action.close")}
        prevLabel={tCommon("attachment.viewer.prev")}
        nextLabel={tCommon("attachment.viewer.next")}
      />
    </>
  );
}
