import { Folder, Settings } from "lucide-react";
import { useEffect, useState } from "react";

import { LoadError } from "@/entities/creator";
import { ButtonGroup } from "@/shared/components/button-group";
import { SkeletonGroup } from "@/shared/components/skeleton-presets";
import { MEDIA_QUERY } from "@/shared/config";
import { formatNumber, Trans, useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/shared/ui/carousel";
import { Skeleton } from "@/shared/ui/skeleton";

import type { BookmarkFolder } from "@/entities/creator";
import type { CarouselApi } from "@/shared/ui/carousel";

interface FolderCarouselProps {
  folders: BookmarkFolder[];
  isLoading: boolean;
  isError: boolean;
  onClickRetry: () => void;
  /** null이면 `전체`. */
  selectedFolderIdx: number | null;
  /** 지금 목록의 총 개수. 목록을 받기 전에는 없음. */
  totalCount: number | undefined;
  onSelectFolder: (folderIdx: number | null) => void;
  onClickSettings: () => void;
}

const SKELETON_COUNT = 3;

const CAROUSEL_OPTIONS = {
  align: "start",
  containScroll: "trimSnaps",
} as const;

// 폴더를 못 받아도 `전체` 목록은 볼 수 있게 함.
const ALL_ONLY_FOLDERS: BookmarkFolder[] = [
  { folderIdx: null, name: "", count: 0, avatarUrls: [] },
];

// 선택 링(바깥 4px)이 뷰포트의 overflow-hidden에 잘리지 않게 뷰포트를 4px 넓히고 같은 만큼 안쪽 여백을 둠.
const VIEWPORT_RING_ROOM_CLASS_NAME =
  "[&_[data-slot=carousel-content]]:-m-1 [&_[data-slot=carousel-content]]:p-1";

// 공통 이전·다음 버튼은 슬라이드 바깥에 겹쳐 놓는 위치 지정이라, 시안처럼 줄 안에 두려고 흐름으로 되돌림.
const ARROW_CLASS_NAME = "static translate-y-0";

// MO는 목록이 카드 오른쪽 끝까지 이어지고 다음 화살표가 그 위에 겹침. 누를 때 공통 버튼의 이동이 세로 가운데 정렬을 덮지 않게 함.
const NEXT_ARROW_CLASS_NAME =
  "max-tablet:right-3 max-tablet:active:not-aria-[haspopup]:-translate-y-1/2 tablet:static tablet:translate-y-0";

// 슬라이드 폭에는 왼쪽 간격 8px이 들어 있어 시안 버튼 폭(MO 130·PC 200)에 8을 더함. TAB은 3개가 폭을 나눠 가짐.
// MO 마지막 폴더는 겹쳐 놓인 다음 화살표에 가리지 않게 뒤를 비움.
const ITEM_CLASS_NAME =
  "basis-34.5 pl-2 max-tablet:last:mr-12 tablet:basis-1/3 desktop:basis-52";

export function FolderCarousel({
  folders,
  isLoading,
  isError,
  onClickRetry,
  selectedFolderIdx,
  totalCount,
  onSelectFolder,
  onClickSettings,
}: FolderCarouselProps) {
  const { t } = useTranslation("pages/creator-manage");
  const isTabletUp = useMediaQuery(MEDIA_QUERY.tabletUp);
  const [api, setApi] = useState<CarouselApi>();

  const items = folders.length > 0 ? folders : ALL_ONLY_FOLDERS;
  const selectedIndex = Math.max(
    0,
    items.findIndex((folder) => folder.folderIdx === selectedFolderIdx),
  );

  // 주소로 들어온 폴더나 눌러 고른 폴더가 가려져 있으면 보이는 자리로 옮김.
  useEffect(() => {
    api?.scrollTo(selectedIndex);
  }, [api, selectedIndex]);

  return (
    <section className="flex flex-col ds-gap-4 rounded-lg border ds-px-5 pt-(--ds-gap-4) ds-pb-5 max-tablet:pr-1">
      <div className="flex items-center justify-between max-tablet:pr-3">
        <div className="flex items-center ds-gap-3">
          <h2 className="ds-text-base-none-semibold text-foreground">
            {t("group.title")}
          </h2>
          {totalCount !== undefined && (
            <p className="flex items-center ds-gap-0.5 ds-text-sm-none-normal text-muted-foreground">
              <Trans
                t={t}
                i18nKey="group.total"
                count={totalCount}
                values={{ value: formatNumber(totalCount) }}
                components={{
                  em: <span className="ds-text-sm-none-semibold" />,
                }}
              />
            </p>
          )}
        </div>
        <Button variant="ghost-foreground" size="sm" onClick={onClickSettings}>
          <Settings />
          {t("group.settings")}
        </Button>
      </div>
      {isLoading ? (
        <SkeletonGroup className="flex ds-gap-2">
          {Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <Skeleton
              key={index}
              className="h-11.5 w-32.5 desktop:h-14 desktop:w-50"
            />
          ))}
        </SkeletonGroup>
      ) : (
        <Carousel
          aria-label={t("group.title")}
          opts={CAROUSEL_OPTIONS}
          setApi={setApi}
          className={cn(
            "flex items-center ds-gap-4",
            VIEWPORT_RING_ROOM_CLASS_NAME,
          )}
        >
          <CarouselPrevious
            aria-label={t("group.previous")}
            className={ARROW_CLASS_NAME}
          />
          <div className="min-w-0 flex-1">
            <CarouselContent className="-ml-2">
              {items.map((folder) => (
                <CarouselItem
                  key={folder.folderIdx ?? "all"}
                  className={ITEM_CLASS_NAME}
                >
                  <ButtonGroup
                    size={isTabletUp ? "default" : "mobile"}
                    title={
                      folder.folderIdx === null ? t("group.all") : folder.name
                    }
                    count={
                      folders.length > 0
                        ? formatNumber(folder.count)
                        : undefined
                    }
                    icon={<Folder />}
                    aria-pressed={folder.folderIdx === selectedFolderIdx}
                    className={cn(
                      "w-full tablet:px-5 desktop:px-6",
                      folder.folderIdx === selectedFolderIdx &&
                        "ring-2 ring-primary ring-offset-2",
                    )}
                    onClick={() => onSelectFolder(folder.folderIdx)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </div>
          <CarouselNext
            aria-label={t("group.next")}
            className={NEXT_ARROW_CLASS_NAME}
          />
        </Carousel>
      )}
      {isError && <LoadError onClickRetry={onClickRetry} />}
    </section>
  );
}
