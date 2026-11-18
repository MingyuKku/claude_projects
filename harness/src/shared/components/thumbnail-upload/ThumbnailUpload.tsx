import { Upload, X } from "lucide-react";
import { useRef } from "react";

import { cn } from "@/shared/lib/utils";

import type { ChangeEvent } from "react";

// Figma Card / Thumbnail Upload(7555:333788 비어 있음, 7555:333881 이미지, 7555:353182 Hover).
// 비어 있으면 업로드 안내 카드이고, 이미지가 있으면 미리보기를 채움. Hover·포커스하면 어두운 막(10%)과 우상단 "×"(삭제)가 보이고,
// 미리보기를 다시 누르면(특히 TAB·MO) 파일을 다시 고름. 형식·용량 검사는 도메인 규칙이라 호출하는 쪽이 함.
interface ThumbnailUploadProps {
  /** 올린 이미지의 미리보기 주소. 없으면 업로드 안내를 보임. */
  imageUrl?: string | null;
  title: string;
  description?: string;
  accept: string;
  /** 업로드 버튼의 접근 가능한 이름(보이는 라벨이 따로 있으면 그 id를 넘김). */
  "aria-labelledby"?: string;
  removeLabel: string;
  onPickFile: (file: File) => void;
  onRemove: () => void;
  disabled?: boolean;
  className?: string;
}

export function ThumbnailUpload({
  imageUrl,
  title,
  description,
  accept,
  removeLabel,
  onPickFile,
  onRemove,
  disabled,
  className,
  "aria-labelledby": labelledBy,
}: ThumbnailUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleChangeFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 change가 일어나도록 비움.
    event.target.value = "";
    if (file) onPickFile(file);
  }

  return (
    <div
      className={cn(
        "group/thumbnail relative aspect-278/130 w-full overflow-hidden rounded-md border border-border bg-background",
        className,
      )}
    >
      <button
        type="button"
        disabled={disabled}
        aria-labelledby={labelledBy}
        onClick={() => fileInputRef.current?.click()}
        className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1.5 p-5 text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed"
      >
        {imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt=""
              className="pointer-events-none absolute inset-0 size-full object-cover"
            />
            {/* Hover·포커스 때 보이는 어두운 막(Figma Dimmed 10%). */}
            <span
              aria-hidden
              className="absolute inset-0 bg-foreground/10 opacity-0 transition-opacity group-focus-within/thumbnail:opacity-100 group-hover/thumbnail:opacity-100"
            />
          </>
        ) : (
          <>
            <Upload aria-hidden className="size-5" />
            <span className="flex flex-col gap-0.5 text-center">
              <span className="text-sm leading-5">{title}</span>
              {description && (
                <span className="text-xs leading-4 opacity-50">
                  {description}
                </span>
              )}
            </span>
          </>
        )}
      </button>
      {imageUrl && (
        <button
          type="button"
          aria-label={removeLabel}
          disabled={disabled}
          onClick={onRemove}
          className="absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center rounded-md border border-border bg-background text-foreground opacity-0 transition-opacity outline-none group-focus-within/thumbnail:opacity-100 group-hover/thumbnail:opacity-100 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
        onChange={handleChangeFile}
      />
    </div>
  );
}
