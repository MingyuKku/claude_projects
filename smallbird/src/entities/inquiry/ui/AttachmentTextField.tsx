import { Paperclip } from "lucide-react";
import { useRef, useState } from "react";

import { FileItem, FileThumbnail } from "@/shared/components/file-list";
import { TextField } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
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

import {
  ATTACHMENT_LIMITS,
  formatFileSize,
  getAttachmentKind,
} from "../lib/attachment-rules";

import type { InquiryAttachments } from "../model/useInquiryAttachments";
import type { ComponentProps } from "react";

// 동영상의 첫 장면을 뽑는 동안과 뽑지 못했을 때는 빈 칸 위에 재생 아이콘만 얹음(FileThumbnail이 아이콘을 그림).
const BLANK_POSTER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

const ACCEPT = Object.values(ATTACHMENT_LIMITS)
  .flatMap((limit) => limit.extensions.map((extension) => `.${extension}`))
  .join(",");

type TextFieldProps = ComponentProps<typeof TextField>;

interface AttachmentTextFieldProps extends Omit<
  TextFieldProps,
  "leading" | "attachments" | "isDragging" | "dropTitle" | "dropDescription"
> {
  attachments: InquiryAttachments;
  /** 첨부 버튼·드롭·붙여넣기를 막음(입력창 자체가 막힌 상태 등). */
  isAttachDisabled?: boolean;
}

/**
 * 문의·상담 입력창에 첨부를 붙인 공용 필드: 파일 선택·드래그 앤 드롭·붙여넣기, 입력창 위 썸네일(hover 삭제),
 * 규칙 위반 시 확인 Alert. 선택한 파일은 `attachments` 훅이 들고 있고 업로드는 전송하는 쪽이 함.
 */
export function AttachmentTextField({
  attachments,
  isAttachDisabled = false,
  disabled,
  onPaste,
  className,
  textareaClassName,
  ...props
}: AttachmentTextFieldProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isBlocked = isAttachDisabled || Boolean(disabled);
  const { error } = attachments;

  return (
    <div
      onDragOver={(event) => {
        if (isBlocked || !event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setIsDragging(false);
      }}
      onDrop={(event) => {
        if (isBlocked) return;
        event.preventDefault();
        setIsDragging(false);
        attachments.add(Array.from(event.dataTransfer.files));
      }}
    >
      <TextField
        {...props}
        variant="count"
        isWide
        // Figma MO 텍스트 필드(8284:82094): 오른쪽 안쪽 여백 8(테두리 보정 7), TAB·PC는 12. 공용 TextField는 캠페인 등록 등 다른 화면도 써서 여기서만 맞춤.
        // 입력 글줄 높이는 MO만 16(Figma MO Placeholder 14/16).
        className={cn("pr-1.75 tablet:pr-2.75", className)}
        textareaClassName={cn("max-tablet:leading-4", textareaClassName)}
        disabled={disabled}
        isDragging={isDragging}
        dropTitle={t("attachment.dropTitle")}
        dropDescription={t("attachment.dropDescription")}
        onPaste={(event) => {
          onPaste?.(event);
          const files = Array.from(event.clipboardData.files);
          if (isBlocked || files.length === 0) return;
          event.preventDefault();
          attachments.add(files);
        }}
        // Figma 텍스트 필드 파일 업로드 예시(11315:50778): 입력창 위 한 줄, 넘치면 가로 스크롤(간격 6).
        // 이미지·동영상(80px 칸)과 문서(190px 카드)가 섞여도 같은 줄에 고른 순서대로 놓음(섞인 시안은 없음).
        attachments={
          attachments.items.length > 0 && (
            <div className="flex w-full items-start gap-1.5 overflow-x-auto">
              {attachments.items.map(({ file, url, poster }, index) => {
                const kind = getAttachmentKind(file) ?? "image";
                if (kind === "file")
                  return (
                    <FileItem
                      key={url}
                      className="w-47.5 shrink-0"
                      name={file.name}
                      sizeLabel={formatFileSize(file.size)}
                      removeLabel={t("attachment.remove")}
                      onClickRemove={() => attachments.remove(index)}
                    />
                  );
                return (
                  <FileThumbnail
                    key={url}
                    src={kind === "image" ? url : (poster ?? BLANK_POSTER)}
                    alt={file.name}
                    type={kind}
                    removeLabel={t("attachment.remove")}
                    onClickRemove={() => attachments.remove(index)}
                  />
                );
              })}
            </div>
          )
        }
        leading={
          <>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              hidden
              onChange={(event) => {
                attachments.add(Array.from(event.target.files ?? []));
                // 같은 파일을 다시 골라도 change가 발생하도록 비움.
                event.target.value = "";
              }}
            />
            <Button
              type="button"
              variant="outline-muted"
              size="sm"
              // Figma 첨부 버튼(5198:98500): 높이 36, 왼쪽 12·오른쪽 8(안쪽 테두리 보정 -1px).
              className="pr-1.75 pl-2.75"
              disabled={isBlocked}
              onClick={() => {
                if (!attachments.rejectIfFull()) inputRef.current?.click();
              }}
            >
              <Paperclip />
              {t("attachment.attach")}
            </Button>
          </>
        }
      />
      <AlertDialog
        open={attachments.isErrorOpen}
        onOpenChange={(open) => !open && attachments.clearError()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {error && t(`attachment.error.${error}.title`)}
            </AlertDialogTitle>
            {/* 첨부 오류 시안(6766:45609 등)은 설명 줄 높이가 24px(leading-6). 다른 Alert는 20px. */}
            <AlertDialogDescription className="leading-6">
              {error && t(`attachment.error.${error}.description`)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* 시안(9997:422432, 2026-10-21)은 취소·확인 두 버튼이며 둘 다 닫기만 합니다. */}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={attachments.clearError}>
              {t("action.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={attachments.clearError}>
              {t("action.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
