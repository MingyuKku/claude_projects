import { ArrowLeft, ArrowRight, Download, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { FileThumbnail } from "@/shared/components/file-list";
import { cn } from "@/shared/lib/utils";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";

export interface MediaViewerItem {
  type: "image" | "video";
  src: string;
  name: string;
  /** 받기 주소. 없으면 다운로드 버튼을 숨김. */
  downloadHref?: string;
}

interface MediaViewerProps {
  items: readonly MediaViewerItem[];
  /** 보고 있는 항목. null이면 닫혀 있음. */
  index: number | null;
  onChangeIndex: (index: number) => void;
  onClose: () => void;
  title: string;
  downloadLabel: string;
  closeLabel: string;
  prevLabel: string;
  nextLabel: string;
}

// Figma 첨부 이미지 다운로드 뷰어(5218:34450 PC, 6791:60181 TAB, 6791:64741 MO): 어두운 전체 화면 위에
// 상단 줄(제목·다운로드·닫기), 큰 미디어, 좌우 화살표, 하단 썸네일 줄.
export function MediaViewer({
  items,
  index,
  onChangeIndex,
  onClose,
  title,
  downloadLabel,
  closeLabel,
  prevLabel,
  nextLabel,
}: MediaViewerProps) {
  const current = index === null ? undefined : items[index];
  const isOpen = index !== null && Boolean(current);
  const count = items.length;
  const move = (step: number) =>
    index !== null && onChangeIndex((index + step + count) % count);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-slate-800/80"
        className="top-0 left-0 grid h-dvh max-w-none translate-x-0 translate-y-0 grid-rows-[auto_1fr_auto] gap-0 rounded-none border-0 bg-transparent p-0 text-white shadow-none sm:max-w-none"
        // 설명이 없는 미디어 뷰어라 Radix 경고를 끔.
        aria-describedby={undefined}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft") move(-1);
          if (event.key === "ArrowRight") move(1);
        }}
      >
        <header className="flex h-13 items-center gap-2 bg-slate-800 pr-2.5 pl-4 tablet:h-20 tablet:pr-5 tablet:pl-7 desktop:pl-8">
          <DialogTitle className="text-base font-semibold tablet:text-lg">
            {title}
          </DialogTitle>
          {current?.downloadHref && (
            <a
              href={current.downloadHref}
              target="_blank"
              rel="noreferrer"
              aria-label={downloadLabel}
              className="flex size-10 items-center justify-center rounded-md hover:bg-white/10 tablet:size-12"
            >
              <Download className="size-4 tablet:size-6" />
            </a>
          )}
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className="ml-auto flex size-10 items-center justify-center rounded-md hover:bg-white/10 tablet:size-12"
          >
            <X className="size-4 tablet:size-6" />
          </DialogPrimitive.Close>
        </header>
        <div className="relative flex min-h-0 items-center justify-center p-4 tablet:p-8">
          {current?.type === "video" ? (
            <video
              key={current.src}
              src={current.src}
              controls
              autoPlay
              className="max-h-full max-w-full"
            >
              {/* 사용자가 올린 영상에는 자막 파일이 없어 빈 트랙만 둠. */}
              <track kind="captions" />
            </video>
          ) : (
            current && (
              <img
                src={current.src}
                alt={current.name}
                className="max-h-full max-w-full object-contain"
              />
            )
          )}
          {count > 1 && (
            <>
              <ArrowButton
                label={prevLabel}
                onClick={() => move(-1)}
                className="left-4 tablet:left-5 desktop:left-6"
              >
                <ArrowLeft />
              </ArrowButton>
              <ArrowButton
                label={nextLabel}
                onClick={() => move(1)}
                className="right-4 tablet:right-5 desktop:right-6"
              >
                <ArrowRight />
              </ArrowButton>
            </>
          )}
        </div>
        {count > 1 && (
          <ul className="flex justify-center gap-1 overflow-x-auto pt-4 pb-6 tablet:pb-7 desktop:pb-8">
            {items.map((item, itemIndex) => (
              <li key={`${item.src}-${itemIndex}`}>
                <button
                  type="button"
                  aria-label={item.name}
                  aria-current={itemIndex === index}
                  onClick={() => onChangeIndex(itemIndex)}
                  className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <FileThumbnail
                    size="md"
                    type={item.type}
                    src={item.type === "image" ? item.src : undefined}
                    videoSrc={item.type === "video" ? item.src : undefined}
                    alt=""
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ArrowButton({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary [&_svg]:size-4",
        className,
      )}
    >
      {children}
    </button>
  );
}
