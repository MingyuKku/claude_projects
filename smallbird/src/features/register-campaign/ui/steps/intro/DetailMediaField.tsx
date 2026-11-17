import { GripVertical, Play, Upload, X } from "lucide-react";
import { tryit } from "radash";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

import { uploadCampaignFile } from "../../../api/upload-campaign-file";
import {
  checkDetailMediaFile,
  DETAIL_MEDIA_ACCEPT,
} from "../../../model/file-rules";
import { DETAIL_MEDIA_MAX_COUNT } from "../../../model/step-completion";

import type { CampaignMedia } from "@/entities/campaign";
import type { ChangeEvent, DragEvent } from "react";

const FILE_ERROR_KEYS = {
  type: "toast.fileType",
  size: "toast.fileSize",
} as const;

/** 순서 바꾸기 드래그를 파일 드롭과 구분하는 데이터 형식. */
const REORDER_DATA_TYPE = "application/x-bigbird-detail-media";

interface DetailMediaFieldProps {
  value: CampaignMedia[];
  onChangeValue: (media: CampaignMedia[]) => void;
  disabled?: boolean;
}

function isFileDrag(event: DragEvent) {
  return event.dataTransfer.types.includes("Files");
}

function formatDuration(seconds: number) {
  const total = Math.floor(seconds);
  const minutes = String(Math.floor(total / 60)).padStart(2, "0");
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

// PC는 왼쪽 메인 이미지와 높이를 맞추려고 업로드 칸이 남는 높이를 채움.
export function DetailMediaField({
  value,
  onChangeValue,
  disabled,
}: DetailMediaFieldProps) {
  const { t } = useTranslation("features/register-campaign");
  const labelId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFileDragging, setIsFileDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const isLocked = disabled || isUploading;

  async function uploadFiles(files: File[]) {
    const room = DETAIL_MEDIA_MAX_COUNT - value.length;
    if (files.length > room) toast.error(t("toast.fileCount"));
    const accepted: File[] = [];
    for (const file of files.slice(0, Math.max(room, 0))) {
      const ruleError = checkDetailMediaFile(file);
      if (ruleError) {
        toast.error(t(FILE_ERROR_KEYS[ruleError]));
        continue;
      }
      accepted.push(file);
    }
    if (accepted.length === 0) return;

    setIsUploading(true);
    const uploaded: CampaignMedia[] = [];
    for (const file of accepted) {
      const [error, result] = await tryit(uploadCampaignFile)(file);
      if (error) {
        toast.error(t("toast.saveFailed"));
        continue;
      }
      uploaded.push(result);
    }
    setIsUploading(false);
    if (uploaded.length > 0) onChangeValue([...value, ...uploaded]);
  }

  function handleChangeFile(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // 같은 파일을 다시 골라도 change가 일어나도록 비움.
    event.target.value = "";
    void uploadFiles(files);
  }

  function handleDropFiles(event: DragEvent) {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    setIsFileDragging(false);
    if (!isLocked) void uploadFiles(Array.from(event.dataTransfer.files));
  }

  function handleDropReorder(event: DragEvent, targetIndex: number) {
    if (!event.dataTransfer.types.includes(REORDER_DATA_TYPE)) return;
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData(REORDER_DATA_TYPE));
    setDraggingIndex(null);
    const moved = value[fromIndex];
    if (fromIndex === targetIndex || !moved) return;
    const next = value.filter((_, index) => index !== fromIndex);
    next.splice(targetIndex, 0, moved);
    onChangeValue(next);
  }

  return (
    <section aria-labelledby={labelId} className="flex min-w-0 flex-col gap-2">
      <p id={labelId} className="flex gap-0.5 ds-text-sm-5-medium">
        {t("intro.detailMedia.label")}
        <span aria-hidden className="ds-text-sm-5-semibold text-primary">
          *
        </span>
      </p>
      <button
        type="button"
        disabled={isLocked}
        aria-labelledby={labelId}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(event) => {
          if (!isFileDrag(event)) return;
          event.preventDefault();
          setIsFileDragging(true);
        }}
        onDragLeave={() => setIsFileDragging(false)}
        onDrop={handleDropFiles}
        className={cn(
          "flex aspect-1200/630 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border bg-background ds-p-5 text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed desktop:aspect-auto desktop:min-h-0 desktop:flex-1",
          isFileDragging && "ring-2 ring-primary ring-offset-2",
        )}
      >
        <Upload aria-hidden className="size-5" />
        {isFileDragging ? (
          <span className="ds-text-sm-5-normal">
            {t("intro.detailMedia.drop")}
          </span>
        ) : (
          <span className="flex flex-col gap-0.5 text-center">
            <span className="ds-text-sm-5-normal">
              {t("intro.detailMedia.title")}
            </span>
            <span className="ds-text-xs-4-normal opacity-50">
              {t("intro.detailMedia.description")}
            </span>
          </span>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={DETAIL_MEDIA_ACCEPT}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={handleChangeFile}
      />
      {value.length > 0 && (
        <ul className="grid grid-cols-3 gap-2 desktop:grid-cols-5">
          {value.map((media, index) => (
            <li
              // 같은 파일을 두 번 올리면 번호가 달라 겹치지 않음. 번호 없는 v2 항목은 주소로 구분함.
              key={media.attachmentIdx ?? media.url}
              onDragOver={(event) => {
                if (event.dataTransfer.types.includes(REORDER_DATA_TYPE)) {
                  event.preventDefault();
                }
              }}
              onDrop={(event) => handleDropReorder(event, index)}
              className={cn(
                "group/media relative aspect-square overflow-hidden rounded-md border",
                draggingIndex === index && "opacity-50",
              )}
            >
              <DetailMediaThumbnail
                media={media}
                label={t(
                  media.mediaType === "VIDEO"
                    ? "intro.detailMedia.video"
                    : "intro.detailMedia.image",
                  { index: index + 1 },
                )}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-foreground/10 opacity-0 transition-opacity group-focus-within/media:opacity-100 group-hover/media:opacity-100"
              />
              {!isLocked && (
                <>
                  <span
                    draggable
                    role="img"
                    aria-label={t("intro.detailMedia.reorder", {
                      index: index + 1,
                    })}
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        REORDER_DATA_TYPE,
                        String(index),
                      );
                      event.dataTransfer.effectAllowed = "move";
                      setDraggingIndex(index);
                    }}
                    onDragEnd={() => setDraggingIndex(null)}
                    className="absolute top-1 left-1 flex size-5 cursor-grab items-center justify-center rounded-md border bg-background opacity-0 transition-opacity group-focus-within/media:opacity-100 group-hover/media:opacity-100"
                  >
                    <GripVertical aria-hidden className="size-3" />
                  </span>
                  <button
                    type="button"
                    aria-label={t("intro.detailMedia.remove", {
                      index: index + 1,
                    })}
                    onClick={() =>
                      onChangeValue(value.filter((_, i) => i !== index))
                    }
                    className="absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center rounded-md border bg-background opacity-0 transition-opacity outline-none group-focus-within/media:opacity-100 group-hover/media:opacity-100 focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X aria-hidden className="size-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

interface DetailMediaThumbnailProps {
  media: CampaignMedia;
  label: string;
}

function DetailMediaThumbnail({ media, label }: DetailMediaThumbnailProps) {
  const [duration, setDuration] = useState<number | null>(null);

  if (media.mediaType !== "VIDEO") {
    return (
      <img src={media.url} alt={label} className="size-full object-cover" />
    );
  }

  return (
    <>
      <video
        src={media.url}
        aria-label={label}
        muted
        preload="metadata"
        className="size-full object-cover"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
      />
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 flex size-10 -translate-1/2 items-center justify-center rounded-full bg-slate-700/70 text-white"
      >
        <Play className="size-5 fill-current" />
      </span>
      {duration !== null && Number.isFinite(duration) && (
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-md bg-slate-700/70 px-1.5 ds-text-xs-5-medium text-white">
          {formatDuration(duration)}
        </span>
      )}
    </>
  );
}
