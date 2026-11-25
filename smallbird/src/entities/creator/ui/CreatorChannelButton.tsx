import { SquareArrowOutUpRight } from "lucide-react";

import { PlatformIcon } from "@/shared/components/platform-icon";
import { Button } from "@/shared/ui/button";

import { usePlatformName } from "../lib/use-platform-name";

import type { MatchingPlatform } from "../model/types";

interface CreatorChannelButtonProps {
  platform: MatchingPlatform;
  /** 원본 채널 주소. 없으면 같은 모양으로 꺼 둠. */
  url: string | null;
  size: "xs" | "sm";
}

// 시안 테두리는 폭에 포함되는 안쪽 선.
const BUTTON_CLASS_NAMES = {
  xs: "border-0 inset-ring inset-ring-border",
  sm: "h-8.5 border-0 inset-ring inset-ring-border desktop:h-9",
};

export function CreatorChannelButton({
  platform,
  url,
  size,
}: CreatorChannelButtonProps) {
  const getPlatformName = usePlatformName();

  const content = (
    <>
      {platform.code && (
        <PlatformIcon platform={platform.code} className="size-4" />
      )}
      {getPlatformName(platform)}
      <SquareArrowOutUpRight />
    </>
  );

  if (!url) {
    return (
      <Button
        variant="outline-foreground"
        size={size}
        className={BUTTON_CLASS_NAMES[size]}
        disabled
      >
        {content}
      </Button>
    );
  }
  return (
    <Button
      variant="outline-foreground"
      size={size}
      className={BUTTON_CLASS_NAMES[size]}
      asChild
    >
      <a href={url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    </Button>
  );
}
