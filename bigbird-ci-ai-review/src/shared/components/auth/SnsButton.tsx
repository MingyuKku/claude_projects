import { cva } from "class-variance-authority";

import appleIcon from "@/shared/assets/img/platform/apple.svg";
import googleIcon from "@/shared/assets/img/platform/google.svg";
import kakaoIcon from "@/shared/assets/img/platform/kakao.svg";
import naverIcon from "@/shared/assets/img/platform/naver.svg";
import { cn } from "@/shared/lib";

import { AuthText } from "./AuthText";

import type { VariantProps } from "class-variance-authority";
import type { ComponentProps, MouseEventHandler } from "react";

/** Social login button. Colors and icons are fixed by each platform's brand guide. */

export type SnsPlatform = "kakao" | "naver" | "apple" | "google";

const ICON_SIZE = 20;

const PLATFORM_META: Record<SnsPlatform, { icon: string; label: string }> = {
  kakao: { icon: kakaoIcon, label: "카카오로 시작하기" },
  naver: { icon: naverIcon, label: "네이버로 시작하기" },
  apple: { icon: appleIcon, label: "애플로 시작하기" },
  google: { icon: googleIcon, label: "구글로 시작하기" },
};

const snsButtonVariants = cva("flex items-center justify-center", {
  variants: {
    platform: {
      kakao: "bg-kakao-bg",
      naver: "bg-naver-bg",
      apple: "bg-apple-bg",
      google: "border border-google-border bg-google-bg",
    },
    size: {
      large: "h-12 w-full rounded-lg",
      small: "size-10 rounded-full p-2.5",
    },
  },
  defaultVariants: { size: "large" },
});

const snsContentVariants = cva(
  "flex shrink-0! items-center justify-center gap-2.5",
  {
    variants: {
      size: { large: "w-fit", small: "size-5" },
    },
    defaultVariants: { size: "large" },
  },
);

const snsLabelVariants = cva("", {
  variants: {
    platform: {
      kakao: "text-kakao-text!",
      naver: "text-naver-text!",
      apple: "text-apple-text!",
      google: "text-google-text!",
    },
  },
});

interface SnsButtonProps
  extends
    Omit<ComponentProps<"button">, "onClick">,
    Pick<VariantProps<typeof snsButtonVariants>, "size"> {
  platform: SnsPlatform;
  onClick: MouseEventHandler;
  iconClassName?: string;
}

/** `size="small"` renders the icon only; the accessible name stays the label. */
export function SnsButton({
  platform,
  onClick,
  size = "large",
  iconClassName,
  className,
  ...props
}: SnsButtonProps) {
  const { icon, label } = PLATFORM_META[platform];
  const isLarge = size === "large";

  return (
    <button
      type="button"
      {...props}
      onClick={onClick}
      aria-label={isLarge ? undefined : label}
      className={cn(snsButtonVariants({ platform, size }), className)}
    >
      <div className={snsContentVariants({ size })}>
        <img
          src={icon}
          alt=""
          width={ICON_SIZE}
          height={ICON_SIZE}
          className={cn("size-5! shrink-0!", iconClassName)}
        />
        {isLarge && (
          <AuthText className={snsLabelVariants({ platform })}>
            {label}
          </AuthText>
        )}
      </div>
    </button>
  );
}
