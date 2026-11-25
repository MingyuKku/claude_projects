import { useEffect, useState } from "react";

import playIcon from "@/shared/assets/img/chat/play.svg";
import { FileThumbnail } from "@/shared/components/file-list";
import { useTranslation } from "@/shared/i18n";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";

import type { CarouselApi } from "@/shared/ui/carousel";

interface PostMediaGalleryProps {
  urls: string[];
  /** 영상 게시물. 서버는 대표 이미지만 주므로 첫 항목에 재생 표시만 함. */
  isVideo: boolean;
}

export function PostMediaGallery({ urls, isVideo }: PostMediaGalleryProps) {
  const { t } = useTranslation("widgets/creator-detail");
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasMany = urls.length > 1;

  useEffect(() => {
    if (!api) return;
    const handleSelect = () => setSelectedIndex(api.selectedScrollSnap());
    api.on("select", handleSelect);
    return () => {
      api.off("select", handleSelect);
    };
  }, [api]);

  return (
    <section
      aria-label={t("feed.media")}
      className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-slate-700 desktop:flex-1"
    >
      <Carousel
        setApi={setApi}
        className="h-62.5 shrink-0 tablet:h-122.5 desktop:h-auto desktop:min-h-0 desktop:flex-1 [&_[data-slot=carousel-content]]:h-full"
      >
        <CarouselContent className="ml-0 h-full">
          {urls.map((url, index) => (
            <CarouselItem
              key={`${index}-${url}`}
              className="relative flex items-center justify-center pl-0"
            >
              <img
                src={url}
                alt={t("feed.mediaItem", { order: index + 1 })}
                className="size-50 object-contain tablet:size-96.5"
              />
              {isVideo && !hasMany && (
                <img
                  src={playIcon}
                  alt=""
                  aria-hidden
                  className="absolute top-1/2 left-1/2 size-15 -translate-1/2"
                />
              )}
            </CarouselItem>
          ))}
        </CarouselContent>
        {hasMany && (
          <>
            <CarouselPrevious
              aria-label={t("feed.previous")}
              className="left-4 tablet:left-5 desktop:left-6"
            />
            <CarouselNext
              aria-label={t("feed.next")}
              className="right-4 tablet:right-5 desktop:right-6"
            />
          </>
        )}
      </Carousel>
      {hasMany && (
        <ul className="scrollbar-hidden flex shrink-0 justify-center-safe gap-1 overflow-x-auto px-4 pt-4 pb-6 tablet:pb-7 desktop:pb-8">
          {urls.map((url, index) => (
            <li key={`${index}-${url}`}>
              <button
                type="button"
                aria-label={t("feed.mediaItem", { order: index + 1 })}
                aria-current={index === selectedIndex}
                className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={() => api?.scrollTo(index)}
              >
                <FileThumbnail
                  size="md"
                  type={isVideo && index === 0 ? "video" : "image"}
                  src={url}
                  alt=""
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
