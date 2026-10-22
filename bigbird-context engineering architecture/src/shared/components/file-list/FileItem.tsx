import { Download } from "lucide-react";

import pdfIcon from "@/shared/assets/img/chat/file-pdf.svg";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

// Figma File List Base / Thumbnail(5219:126850) Type=File: 36px 파일 아이콘 + 이름·용량 + 다운로드 버튼.
interface FileItemProps {
  name: string;
  sizeLabel: string;
  /** 파일 형식 아이콘. 없으면 Figma 기본값인 PDF 아이콘을 씀. */
  iconSrc?: string;
  downloadLabel: string;
  onClickDownload?: () => void;
  className?: string;
  "data-preview-state"?: string;
}

export function FileItem({
  name,
  sizeLabel,
  iconSrc = pdfIcon,
  downloadLabel,
  onClickDownload,
  className,
  ...props
}: FileItemProps) {
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
          src={iconSrc}
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
      <Button
        variant="ghost-foreground"
        size="icon-xs"
        aria-label={downloadLabel}
        onClick={onClickDownload}
      >
        <Download />
      </Button>
    </div>
  );
}
