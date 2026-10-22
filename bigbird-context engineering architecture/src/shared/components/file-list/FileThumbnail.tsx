import { cva } from "class-variance-authority";
import { X } from "lucide-react";

import playIcon from "@/shared/assets/img/chat/play.svg";
import { cn } from "@/shared/lib/utils";

// Figma File List Base / Thumbnail(5219:126850) Image·Movie.
// md는 80px 고정, sm은 File List / Thumbnail_sm(6977:45434)처럼 줄 너비를 나눠 갖는 정사각형.
const thumbnailVariants = cva(
  "group/thumbnail relative overflow-hidden rounded-md border border-border bg-muted",
  {
    variants: {
      size: {
        md: "size-20 shrink-0",
        sm: "aspect-square min-w-0 flex-1",
      },
    },
    defaultVariants: { size: "md" },
  },
);

interface FileThumbnailProps {
  /** 이미지 주소. 동영상이면 첫 장면 이미지(없으면 `videoSrc`나 빈 칸). */
  src?: string;
  /** 동영상 파일 주소. 첫 장면을 브라우저가 직접 그림(다른 출처의 영상은 캔버스로 캡처할 수 없음). */
  videoSrc?: string;
  alt: string;
  type?: "image" | "video";
  size?: "md" | "sm";
  /** 있으면 hover 시 어둡게 + 오른쪽 위 삭제 버튼을 보여 줌. */
  onClickRemove?: () => void;
  removeLabel?: string;
  className?: string;
  "data-preview-state"?: string;
}

export function FileThumbnail({
  src,
  videoSrc,
  alt,
  type = "image",
  size,
  onClickRemove,
  removeLabel,
  className,
  ...props
}: FileThumbnailProps) {
  return (
    <div className={cn(thumbnailVariants({ size }), className)} {...props}>
      {type === "video" && videoSrc && !src ? (
        <video
          // #t=0.1: 메타데이터만 받아 그 지점의 장면을 보여 줌(검은 첫 프레임 회피).
          src={`${videoSrc}#t=0.1`}
          preload="metadata"
          muted
          playsInline
          aria-label={alt}
          className="size-full object-cover"
        />
      ) : (
        <img src={src} alt={alt} className="size-full object-cover" />
      )}
      {onClickRemove && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-foreground/10 opacity-0 group-focus-within/thumbnail:opacity-100 group-hover/thumbnail:opacity-100"
        />
      )}
      {type === "video" && (
        <img
          src={playIcon}
          alt=""
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-1/2 -translate-1/2"
        />
      )}
      {onClickRemove && (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onClickRemove}
          className="absolute top-0.75 right-0.75 flex size-5 items-center justify-center rounded-md border border-border bg-background p-0.5 text-foreground opacity-0 outline-none group-focus-within/thumbnail:opacity-100 group-hover/thumbnail:opacity-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
