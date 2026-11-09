import { GripVertical, Play, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Label } from "@/shared/ui/label";

import { INTRO_MEDIA_MAX_COUNT } from "../../../model/constants";

import type { CampaignFile } from "@/entities/campaign";
import type { ChangeEvent, DragEvent } from "react";

interface MediaListFieldProps {
  value: CampaignFile[];
  accept: string;
  onPickFiles: (files: File[]) => void;
  onChangeValue: (media: CampaignFile[]) => void;
  disabled?: boolean;
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return null;
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

// 상품 상세 이미지/동영상: 최대 5개. 업로드 영역에 파일을 끌어 놓거나 눌러 고르고,
// 썸네일은 끌어서 순서를 바꾸며 Hover·포커스하면 순서 핸들과 "×"가 보임.
export function MediaListField({
  value,
  accept,
  onPickFiles,
  onChangeValue,
  disabled,
}: MediaListFieldProps) {
  const { t } = useTranslation("features/register-campaign");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const isFull = value.length >= INTRO_MEDIA_MAX_COUNT;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length > 0) onPickFiles(files);
  }

  function handleDropFiles(event: DragEvent) {
    event.preventDefault();
    setIsFileDragging(false);
    if (disabled || isFull) return;
    onPickFiles(Array.from(event.dataTransfer.files));
  }

  function handleDropOnItem(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...value];
    const moved = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, ...moved);
    onChangeValue(next);
    setDragIndex(null);
  }

  return (
    <div className="flex h-full flex-col gap-2">
      <Label className="gap-0.5 leading-none">
        {t("intro.media.label")}
        <span aria-hidden className="font-semibold text-primary">
          *
        </span>
      </Label>
      <button
        type="button"
        disabled={disabled || isFull}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          if (dragIndex !== null) return;
          event.preventDefault();
          setIsFileDragging(true);
        }}
        onDragLeave={() => setIsFileDragging(false)}
        onDrop={dragIndex === null ? handleDropFiles : undefined}
        className={cn(
          "flex min-h-32.5 flex-1 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border bg-background p-5 text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
          isFileDragging && "border-primary ring-2 ring-primary ring-offset-2",
        )}
      >
        <Upload aria-hidden className="size-5" />
        <span className="text-sm leading-5">
          {isFileDragging ? t("intro.media.drop") : t("intro.media.title")}
        </span>
        <span className="text-xs leading-4 opacity-50">
          {t("intro.media.description", { max: INTRO_MEDIA_MAX_COUNT })}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={handleChange}
      />
      {value.length > 0 && (
        <ul className="grid grid-cols-5 gap-2">
          {value.map((file, index) => (
            <li
              key={file.fileId}
              draggable={!disabled}
              onDragStart={() => setDragIndex(index)}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) =>
                // 썸네일을 끄는 중이 아니면 OS 파일임. 처리하지 않으면 브라우저가 파일을 열어 작성 중인 화면을 벗어남.
                dragIndex === null
                  ? handleDropFiles(event)
                  : handleDropOnItem(index)
              }
              className="group/media relative aspect-square overflow-hidden rounded-md border bg-background"
            >
              <img
                src={file.thumbnailUrl ?? file.url}
                alt=""
                className="size-full object-cover"
              />
              {file.mediaType === "VIDEO" && (
                <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-foreground/50 px-1 text-xs leading-4 text-background">
                  <Play aria-hidden className="size-3" />
                  {formatDuration(file.durationSec)}
                </span>
              )}
              <span
                aria-hidden
                className="absolute top-1 left-1 cursor-grab rounded-md border bg-background opacity-0 transition-opacity group-focus-within/media:opacity-100 group-hover/media:opacity-100"
              >
                <GripVertical className="size-4" />
              </span>
              <button
                type="button"
                disabled={disabled}
                aria-label={t("intro.media.remove")}
                onClick={() =>
                  onChangeValue(value.filter((v) => v.fileId !== file.fileId))
                }
                className="absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center rounded-md border bg-background opacity-0 transition-opacity outline-none group-focus-within/media:opacity-100 group-hover/media:opacity-100 focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X aria-hidden className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
