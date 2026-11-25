import { Bookmark } from "lucide-react";

import {
  CreatorChannelButton,
  useCreatorLabels,
  useCreatorTerms,
} from "@/entities/creator";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Button } from "@/shared/ui/button";

import type { CreatorViewModel } from "@/entities/creator";

interface ProposeProfileProps {
  creator: CreatorViewModel;
  platformUrl: string | null;
  onClickBookmark: () => void;
}

export function ProposeProfile({
  creator,
  platformUrl,
  onClickBookmark,
}: ProposeProfileProps) {
  const { bookmarkLabel } = useCreatorTerms();
  const { findPlatform } = useCreatorLabels();

  const platform = findPlatform(creator.platformIdx);

  return (
    <section className="flex shrink-0 items-end justify-between">
      <div className="flex min-w-0 items-end">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="xl">
            <AvatarImage src={creator.profileImageUrl ?? undefined} alt="" />
            <AvatarPlaceholder />
          </Avatar>
          <div className="flex min-w-0 flex-col gap-1">
            <p className="-mb-1 truncate pb-1 ds-text-base-none-medium text-foreground">
              {creator.nickname}
            </p>
            <p className="-mb-1 truncate pb-1 ds-text-base-none-normal text-muted-foreground">
              @{creator.platformId}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={bookmarkLabel(creator.nickname)}
          aria-pressed={creator.isBookmarked}
          onClick={onClickBookmark}
        >
          <Bookmark
            className={cn(creator.isBookmarked && "fill-current text-primary")}
          />
        </Button>
      </div>
      {platform && (
        <CreatorChannelButton platform={platform} url={platformUrl} size="sm" />
      )}
    </section>
  );
}
