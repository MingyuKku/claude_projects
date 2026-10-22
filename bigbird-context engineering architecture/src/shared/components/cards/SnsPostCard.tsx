import {
  Ellipsis,
  Heart,
  MessageCircleMore,
  Play,
  RotateCw,
  ThumbsUp,
} from "lucide-react";

import playIcon from "@/shared/assets/img/chat/play.svg";
import instagramIcon from "@/shared/assets/img/sns/instagram.svg";
import naverIcon from "@/shared/assets/img/sns/naver.svg";
import tiktokIcon from "@/shared/assets/img/sns/tiktok.svg";
import xIcon from "@/shared/assets/img/sns/x.svg";
import youtubeIcon from "@/shared/assets/img/sns/youtube.svg";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

// Figma Card SNS 카드 frame(7301:113481): 플랫폼별 게시물 카드(304 × 440).
// Instagram = 머리글·이미지·지표·본문, Youtube·Tiktok = 이미지가 위, Naver·X = 글이 위·이미지가 아래.
export type SnsPlatform = "instagram" | "youtube" | "tiktok" | "naver" | "x";

const SNS_ICON_SRC: Record<SnsPlatform, string> = {
  instagram: instagramIcon,
  youtube: youtubeIcon,
  tiktok: tiktokIcon,
  naver: naverIcon,
  x: xIcon,
};

/** 플랫폼 로고(기본 24px). 장식이 아니면 alt를 넘김. */
export function SnsIcon({
  platform,
  alt = "",
  className,
}: {
  platform: SnsPlatform;
  alt?: string;
  className?: string;
}) {
  return (
    <img
      src={SNS_ICON_SRC[platform]}
      alt={alt}
      aria-hidden={alt ? undefined : true}
      className={cn("size-6 shrink-0", className)}
    />
  );
}

export interface SnsPostMetrics {
  views?: ReactNode;
  likes?: ReactNode;
  comments?: ReactNode;
  reposts?: ReactNode;
}

interface SnsPostCardProps extends Omit<ComponentProps<"article">, "title"> {
  platform: SnsPlatform;
  author: ReactNode;
  /** Youtube·Naver의 굵은 한 줄 제목 */
  title?: ReactNode;
  text?: ReactNode;
  imageSrc: string;
  imageAlt: string;
  isVideo?: boolean;
  metrics: SnsPostMetrics;
  date: ReactNode;
  /** Instagram 머리글의 더보기 버튼 */
  menuLabel?: string;
  onClickMenu?: () => void;
}

const MEDIA_FIRST: SnsPlatform[] = ["youtube", "tiktok"];

export function SnsPostCard({
  platform,
  author,
  title,
  text,
  imageSrc,
  imageAlt,
  isVideo = false,
  metrics,
  date,
  menuLabel,
  onClickMenu,
  className,
  ...props
}: SnsPostCardProps) {
  const authorLine = (
    <div className="flex items-center gap-2">
      <SnsIcon platform={platform} className="size-5" />
      <span className="text-sm leading-5 font-semibold text-foreground">
        {author}
      </span>
    </div>
  );
  const media = <PostMedia src={imageSrc} alt={imageAlt} isVideo={isVideo} />;
  const meta = <PostMeta platform={platform} metrics={metrics} date={date} />;
  const titleLine = title && (
    <p className="truncate text-lg leading-7 font-semibold text-foreground">
      {title}
    </p>
  );

  return (
    <article
      className={cn(
        "flex h-110 w-76 flex-col overflow-hidden rounded-md border bg-card p-px",
        className,
      )}
      {...props}
    >
      {platform === "instagram" && (
        <>
          <div className="flex items-center justify-between px-5 py-3.5">
            {authorLine}
            {menuLabel && (
              <Button
                variant="ghost-foreground"
                size="icon-sm"
                aria-label={menuLabel}
                onClick={onClickMenu}
              >
                <Ellipsis aria-hidden />
              </Button>
            )}
          </div>
          {media}
          <div className="px-5 pt-3">{meta}</div>
          <p className="min-h-13 px-5 pt-2.5 pb-5 text-sm leading-5 text-foreground">
            {text}
          </p>
        </>
      )}

      {MEDIA_FIRST.includes(platform) && (
        <>
          {media}
          <div className="flex flex-col gap-1.5 px-5 pt-3 pb-5">
            {authorLine}
            {titleLine}
            {text && (
              <p className="text-sm leading-5 text-foreground">{text}</p>
            )}
            {meta}
          </div>
        </>
      )}

      {(platform === "naver" || platform === "x") && (
        <>
          <div className="flex flex-col gap-1.5 px-5 pt-4 pb-2.5">
            {authorLine}
            {titleLine}
            {text && (
              <p className="line-clamp-3 text-sm leading-5 text-foreground">
                {text}
              </p>
            )}
          </div>
          <div className="px-5 pb-3">{meta}</div>
          {media}
        </>
      )}
    </article>
  );
}

function PostMedia({
  src,
  alt,
  isVideo,
}: {
  src: string;
  alt: string;
  isVideo: boolean;
}) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-muted">
      <img src={src} alt={alt} className="size-full object-cover" />
      {isVideo && (
        <img
          src={playIcon}
          alt=""
          aria-hidden
          className="absolute top-1/2 left-1/2 size-15 -translate-1/2"
        />
      )}
    </div>
  );
}

// Youtube·Tiktok의 좋아요는 thumbs-up, 나머지는 heart 아이콘.
function PostMeta({
  platform,
  metrics,
  date,
}: {
  platform: SnsPlatform;
  metrics: SnsPostMetrics;
  date: ReactNode;
}) {
  const items: { id: string; icon: LucideIcon; value?: ReactNode }[] = [
    { id: "views", icon: Play, value: metrics.views },
    {
      id: "likes",
      icon: MEDIA_FIRST.includes(platform) ? ThumbsUp : Heart,
      value: metrics.likes,
    },
    { id: "comments", icon: MessageCircleMore, value: metrics.comments },
    { id: "reposts", icon: RotateCw, value: metrics.reposts },
  ];

  return (
    <div className="flex items-center justify-between text-xs leading-4 text-muted-foreground">
      <ul className="flex items-center gap-3">
        {items
          .filter((item) => item.value != null)
          .map(({ id, icon: Icon, value }) => (
            <li key={id} className="flex items-center gap-1">
              <Icon aria-hidden className="size-4" />
              {value}
            </li>
          ))}
      </ul>
      <span>{date}</span>
    </div>
  );
}
