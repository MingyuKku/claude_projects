import { useState } from "react";

import { ChatMessage } from "@/shared/components/chat-message";
import { FileItem, FileThumbnail } from "@/shared/components/file-list";
import { MediaViewer } from "@/shared/components/media-viewer";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { getAttachmentDownloadUrl } from "../api/inquiry-api";
import { formatFileSize } from "../lib/attachment-rules";

import type { ConversationRow } from "../lib/group-attachments";
import type { ReactNode } from "react";

type FilesRow = Extract<ConversationRow, { type: "files" }>;

interface ConversationFilesProps {
  row: FilesRow;
  name: string;
  /** 상대(왼쪽) 아바타 이미지와 그 이미지에 더할 클래스. 없으면 기본 아바타. */
  avatarSrc?: string;
  avatarClassName?: string;
  /** 앞의 텍스트 말풍선 옆에 보이는 시각. */
  time?: string;
  /** 말풍선 크기. TAB은 작은 형태(아바타 32·이름 한 줄)를 씀(Figma 11315:50501). 기본 md. */
  size?: "sm" | "md";
  /** 아바타와 말풍선 사이 간격 등 행 클래스(앞 텍스트 없이 첨부만 있는 메시지에만 적용). ChatMessage 의 `rowClassName` 으로 넘어감. */
  rowClassName?: string;
  /**
   * 앞 텍스트 말풍선을 바깥에서 그릴 때(수정·삭제 툴바 등) 첨부 묶음을 받아 메시지 전체를 돌려줌.
   * 없거나 앞 텍스트가 없으면 툴바 없는 일반 말풍선으로 그림.
   */
  renderText?: (attachments: ReactNode) => ReactNode;
}

/**
 * 대화의 첨부 묶음: 말풍선(있으면) 아래 이미지·동영상 80px 썸네일 격자 + 누르면 열리는 뷰어, 그 아래 문서 카드
 * (Figma 11315:49676, 190px 카드에 이름·용량·다운로드). 보낸 쪽 끝에 붙음. 빅버드 문의와 구매자 문의 대화가 같이 씀.
 */
export function ConversationFiles({
  row,
  name,
  avatarSrc,
  avatarClassName,
  time,
  size,
  rowClassName,
  renderText,
}: ConversationFilesProps) {
  const { t: tCommon } = useTranslation();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  // 문서는 뷰어 대상이 아니라 누르면 바로 내려받음. 뷰어는 이미지·동영상만 넘김.
  const media = row.messages.filter((message) => message.kind !== "file");
  const documents = row.messages.filter(
    (message) => message.kind === "file" && message.attachment,
  );
  const items = media.flatMap((message) =>
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

  const attachments = (
    <div
      className={cn(
        "flex w-full flex-col gap-1",
        row.isMine ? "items-end" : "items-start",
      )}
    >
      {media.length > 0 && (
        <ul
          className={cn(
            // 최대 3열(썸네일 80 × 3 + 간격 4 × 2 = 248, Figma 11315:50390·50501).
            "grid w-full max-w-62 grid-cols-[repeat(auto-fit,80px)] gap-1",
            row.isMine ? "justify-end" : "justify-start",
          )}
        >
          {media.map((message, index) => {
            const fileName = message.attachment?.fileName ?? "";
            return (
              <li key={message.id}>
                <button
                  type="button"
                  aria-label={fileName}
                  onClick={() => setViewerIndex(index)}
                  className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <FileThumbnail
                    type={message.kind === "video" ? "video" : "image"}
                    src={message.kind === "video" ? undefined : message.body}
                    videoSrc={
                      message.kind === "video" ? message.body : undefined
                    }
                    alt={fileName}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {documents.length > 0 && (
        <ul className="flex flex-col gap-1">
          {documents.map(({ id, attachment }) => {
            if (!attachment) return null;
            const fileName = attachment.fileName ?? "";
            return (
              <li key={id}>
                {/* 문서는 받기 경로가 이미지와 같고(type=image), 이 경로만 파일 이름을 붙여 내려줌 */}
                <FileItem
                  className="w-47.5"
                  name={fileName}
                  sizeLabel={
                    attachment.fileSize === null
                      ? ""
                      : formatFileSize(attachment.fileSize)
                  }
                  downloadLabel={tCommon("attachment.download")}
                  downloadHref={getAttachmentDownloadUrl(
                    "image",
                    attachment.attachmentIdx,
                  )}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <>
      {renderText && row.text ? (
        renderText(attachments)
      ) : (
        <ChatMessage
          name={name}
          avatarSrc={avatarSrc}
          avatarClassName={avatarClassName}
          size={size}
          rowClassName={rowClassName}
          side={row.isMine ? "me" : "other"}
          message={row.text?.body}
          time={time}
          attachments={attachments}
        />
      )}
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
