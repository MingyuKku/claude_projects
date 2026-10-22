import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { CONTAINER } from "../lib/tw";
import { header } from "../model/data";

interface Props {
  /** 히어로 축소 진행도, 0~1. */
  progress: number;
  className?: string;
}

// ghost 버튼은 배경도 블러도 없이 글자만 히어로 위에 놓임(backdrop-blur 는 알약 모양으로 비침).
// 글자색은 스크롤에 따라 바뀌므로 클래스가 아니라 아래 인라인 style 로 정함.
const VARIANT = {
  primary: "rounded-[4px] bg-[#1a1b1c] text-white",
  ghost: "",
  secondary: "",
} as const;

// ghost 글자는 흰색(255)에서 #222(34)로 바뀜: 변화 폭 221.
const GHOST_CHANNEL_START = 255;
const GHOST_CHANNEL_RANGE = 221;

export function IntroHeader({ progress, className }: Props) {
  const { t } = useTranslation("pages/introduction");
  const ghostChannel = GHOST_CHANNEL_START - GHOST_CHANNEL_RANGE * progress;

  return (
    // sticky + 히어로의 음수 margin-top.
    //
    // fixed 로 두면 헤더는 뷰포트(1440) 기준으로 크기가 정해지는데 본문은 스크롤바로 좁아진(1425) 스크롤 컨테이너 안에 있어
    // 헤더 로고가 섹션 왼쪽 가장자리에서 7px 어긋남. sticky 는 컨테이너를 기준으로 하므로 정렬되지만
    // 흐름에서 72px 을 차지하므로, 히어로가 -mt-[72px] 로 이를 상쇄해 y=0 에서 시작함.
    <header className={cn("sticky top-0 z-10 h-[72px]", className)}>
      <div
        className="absolute inset-0 border-b border-[#adb5bd] bg-white"
        style={{ opacity: progress }}
      />
      <div
        className={cn(
          CONTAINER,
          "relative flex h-full items-center justify-between",
        )}
      >
        {/* 표시 전용: 로고를 눌러도 이동하지 않음(제품 결정). */}
        <div className="relative block h-[26.37px] w-[120px] shrink-0">
          <img
            className="absolute inset-0 size-full"
            src={header.logoLight}
            alt="Bigbird"
            style={{ opacity: 1 - progress }}
          />
          <img
            className="absolute inset-0 size-full"
            src={header.logoDark}
            alt=""
            style={{ opacity: progress }}
          />
        </div>

        {/* gap: PC·TAB 24px, MO 8px. */}
        <div className="flex shrink-0 items-center gap-6 max-mo:gap-2">
          {header.buttons.map((button) => (
            <a
              key={button.key}
              className={cn(
                // MO 에서 두 버튼은 폭 96px / 81px 로 고정되어 좌우 패딩이 16px 이 됨. 24px 이면 360px 뷰포트를 넘침.
                "flex h-10 items-center justify-center px-6 py-3 text-center text-sm leading-[21px] font-bold whitespace-nowrap no-underline max-mo:px-4",
                VARIANT[button.variant],
              )}
              href={button.href}
              style={
                button.variant === "ghost"
                  ? {
                      color: `rgb(${ghostChannel}, ${ghostChannel}, ${ghostChannel})`,
                    }
                  : undefined
              }
            >
              {t(`header.${button.key}`)}
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
