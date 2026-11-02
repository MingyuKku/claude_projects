import { Download, X } from "lucide-react";

import excelIcon from "@/shared/assets/img/chat/file-excel.svg";
import pdfIcon from "@/shared/assets/img/chat/file-pdf.svg";
import pptIcon from "@/shared/assets/img/chat/file-ppt.svg";
import txtIcon from "@/shared/assets/img/chat/file-txt.svg";
import wordIcon from "@/shared/assets/img/chat/file-word.svg";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

// Figma File List Base / Thumbnail(5219:126850) Type=File: 36px 파일 아이콘 + 이름·용량 + 오른쪽 버튼.
// 오른쪽 버튼은 받은 파일이면 다운로드, 입력창에서 아직 안 보낸 파일이면 빼기(x).
// 형식 아이콘은 디자인 시스템 New Icons / PDF·Word·Excel·TXT(7080:81538·81539·81567·81542).
// PowerPoint 아이콘은 시안에 없어 같은 모양에 "PPT" 글자(Pretendard Medium 윤곽선)와 #C43E1C로 임시로 만듦.
const ICON_BY_EXTENSION: Record<string, string> = {
  pdf: pdfIcon,
  txt: txtIcon,
  doc: wordIcon,
  docx: wordIcon,
  xls: excelIcon,
  xlsx: excelIcon,
  ppt: pptIcon,
  pptx: pptIcon,
};

function toIconSrc(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";
  return ICON_BY_EXTENSION[extension] ?? pdfIcon;
}

interface FileItemProps {
  name: string;
  sizeLabel: string;
  /** 파일 형식 아이콘. 없으면 파일 이름의 확장자로 고르고, 모르는 확장자는 PDF 아이콘. */
  iconSrc?: string;
  downloadLabel?: string;
  onClickDownload?: () => void;
  /** 있으면 다운로드 버튼을 이 주소로 가는 링크로 그림(브라우저가 내려받음). */
  downloadHref?: string;
  /** 있으면 다운로드 대신 빼기 버튼을 그림. */
  onClickRemove?: () => void;
  removeLabel?: string;
  className?: string;
  "data-preview-state"?: string;
}

export function FileItem({
  name,
  sizeLabel,
  iconSrc,
  downloadLabel,
  onClickDownload,
  downloadHref,
  onClickRemove,
  removeLabel,
  className,
  ...props
}: FileItemProps) {
  function renderAction() {
    if (onClickRemove)
      return (
        <Button
          type="button"
          variant="ghost-foreground"
          size="icon-xs"
          aria-label={removeLabel}
          onClick={onClickRemove}
        >
          <X />
        </Button>
      );
    if (downloadHref)
      return (
        <Button variant="ghost-foreground" size="icon-xs" asChild>
          <a href={downloadHref} download={name} aria-label={downloadLabel}>
            <Download />
          </a>
        </Button>
      );
    return (
      <Button
        type="button"
        variant="ghost-foreground"
        size="icon-xs"
        aria-label={downloadLabel}
        onClick={onClickDownload}
      >
        <Download />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "flex w-62.5 items-center gap-2 rounded-lg border border-border bg-card p-4 hover:bg-accent/50",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <img
          src={iconSrc ?? toIconSrc(name)}
          alt=""
          aria-hidden="true"
          className="size-9 shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm leading-none font-medium text-card-foreground">
            {name}
          </p>
          <p className="text-xs leading-5 text-muted-foreground">{sizeLabel}</p>
        </div>
      </div>
      {renderAction()}
    </div>
  );
}
