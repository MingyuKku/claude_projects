import { Bookmark } from "lucide-react";

import { CreatorChannelButton, useCreatorTerms } from "@/entities/creator";
import { useTranslation } from "@/shared/i18n";
import { cn, EMPTY_VALUE } from "@/shared/lib";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";

import type { CreatorDetail, MatchingPlatform } from "@/entities/creator";
import type { ReactNode } from "react";

export type ProfileLayout = "desktop" | "tablet" | "mobile";

interface CreatorProfileCardProps {
  detail: CreatorDetail;
  layout: ProfileLayout;
  platform: MatchingPlatform | undefined;
  /** 원본 채널 주소. 없으면 바로가기를 끔. */
  platformUrl: string | null;
  categoryName: string | undefined;
  serviceTypeName: string | undefined;
  onClickBookmark: () => void;
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-5 items-center justify-between gap-2">
      <dt className="ds-text-sm-none-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 truncate">{children}</dd>
    </div>
  );
}

export function CreatorProfileCard({
  detail,
  layout,
  platform,
  platformUrl,
  categoryName,
  serviceTypeName,
  onClickBookmark,
}: CreatorProfileCardProps) {
  const { t } = useTranslation("widgets/creator-detail");
  const { term, bookmarkLabel } = useCreatorTerms();
  const isMobile = layout === "mobile";

  const channelButton = platform && (
    <CreatorChannelButton platform={platform} url={platformUrl} size="sm" />
  );

  const identity = (
    <div className="flex h-19 min-w-0 items-end">
      <div className="flex min-w-0 items-center gap-3 self-center">
        <Avatar size="3xl">
          <AvatarImage src={detail.profileImageUrl ?? undefined} alt="" />
          <AvatarPlaceholder />
        </Avatar>
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="-mb-1 line-clamp-2 pb-1 ds-text-lg-none-semibold tracking-[-0.4px] text-foreground">
            {detail.nickname}
          </p>
          <p className="-mb-1 line-clamp-2 pb-1 ds-text-base-none-normal text-muted-foreground">
            @{detail.platformId}
          </p>
        </div>
      </div>
      <div className="pb-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={bookmarkLabel(detail.nickname)}
          aria-pressed={detail.isBookmarked}
          onClick={onClickBookmark}
        >
          <Bookmark
            className={cn(detail.isBookmarked && "fill-current text-primary")}
          />
        </Button>
      </div>
    </div>
  );

  const profile =
    layout === "desktop" ? (
      <div className="flex min-w-0 flex-1 items-end justify-between gap-2">
        {identity}
        {channelButton}
      </div>
    ) : (
      <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
        {identity}
        {channelButton}
      </div>
    );

  return (
    <section
      className={cn(
        "flex rounded-md border p-4",
        isMobile ? "flex-col gap-3" : "items-start gap-4",
      )}
    >
      {profile}
      <Separator
        orientation={isMobile ? "horizontal" : "vertical"}
        className={isMobile ? undefined : "self-stretch"}
      />
      <dl className="flex min-w-0 flex-1 flex-col gap-2">
        <InfoRow label={term("category")}>
          {categoryName ? (
            <Badge variant="blue" size="sm" className="max-tablet:leading-4">
              {categoryName}
            </Badge>
          ) : (
            EMPTY_VALUE
          )}
        </InfoRow>
        <InfoRow label={t("profile.serviceType")}>
          {serviceTypeName ? (
            <Badge variant="green" size="sm" className="max-tablet:leading-4">
              {serviceTypeName}
            </Badge>
          ) : (
            EMPTY_VALUE
          )}
        </InfoRow>
        <InfoRow label={t("profile.platformNickname")}>
          <span className="ds-text-sm-none-normal text-foreground">
            {detail.nickname}
          </span>
        </InfoRow>
      </dl>
    </section>
  );
}
