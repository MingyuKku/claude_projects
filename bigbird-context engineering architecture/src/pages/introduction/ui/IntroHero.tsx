import { Fragment } from "react";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import SCROLL_INDICATOR from "../assets/hero-scroll-indicator.svg";
import { hero } from "../model/data";
import { IntroCtaButton } from "./IntroCtaButton";

import type { CssVariableStyle } from "@/shared/lib";

interface Props {
  /** 히어로 축소 진행도, 0~1. */
  progress: number;
  className?: string;
}

export function IntroHero({ progress, className }: Props) {
  const { t } = useTranslation("pages/introduction");
  const style: CssVariableStyle = { "--hero-progress": progress };

  return (
    // 최대 축소 값은 여기에 두고, JS 는 --hero-progress(0~1)만 넘김.
    //
    // 축소된 비디오는 폭 1200px. 1200 보다 좁은 뷰포트에서는 좌우 여백이 음수가 되어 비디오가 넘치므로
    // max() 로 0 에서 막음. 축소 효과는 PC 전용이라 TAB·MO 는 가득 찬 채로 둠(introtab 미만은 0).
    //
    // -mt-[72px] 는 sticky 헤더가 흐름에서 차지하는 72px 을 상쇄해 히어로가 y=0 에서 시작하게 함(IntroHeader 참고).
    // 높이는 디자인의 836/600px 가 아니라 뷰포트 전체(h-dvh): 요구사항이 처음에 화면을 가득 채우는 것이라
    // 큰 모니터에서 틈이 생기거나 작은 화면에서 잘리면 안 됨.
    <section
      className={cn(
        "[--hero-max-bottom:68px] [--hero-max-inset:max(0px,calc((100%-1200px)/2))] [--hero-max-radius:32px]",
        "max-introtab:[--hero-max-bottom:0px] max-introtab:[--hero-max-inset:0px] max-introtab:[--hero-max-radius:0px]",
        "relative flex h-dvh items-center justify-center overflow-hidden",
        "-mt-[72px]",
        "ml-[calc(var(--hero-max-inset)*var(--hero-progress))]",
        "mr-[calc(var(--hero-max-inset)*var(--hero-progress))]",
        "mb-[calc(var(--hero-max-bottom)*var(--hero-progress))]",
        "rounded-[calc(var(--hero-max-radius)*var(--hero-progress))]",
        className,
      )}
      style={style}
    >
      <video
        className="absolute inset-0 size-full object-cover"
        poster={hero.poster}
        src={hero.video}
        autoPlay
        muted
        loop
        playsInline
      />

      {/* PC·TAB 은 헤드라인과 버튼 그룹을 gap-20 한 덩어리로 가운데 정렬함.
          MO 는 축소판이 아님: 헤드라인은 높이의 39% 에, 버튼은 아래에서 20px 에 놓이고 둘 사이에 고정 간격이 없어
          flex gap 으로 재현할 수 없으므로 MO 는 absolute 배치를 씀. */}
      <div className="relative z-[1] flex flex-col items-center gap-20 px-5 text-center max-mo:absolute max-mo:inset-0 max-mo:block max-mo:gap-0 max-mo:p-0">
        {/* 한국어 기본 줄바꿈은 단어 중간에서 끊음("더 정확 / 하게"). 줄은 아래 span 으로 나누고,
            좁은 화면에서 한 행이 더 접히는 것은 ko:break-keep 이 막음.
            MO 에서는 헤딩 폭을 219px 로 제한하지 않음: 3행이 218.5px 폭으로 그려져 서브픽셀 반올림이
            넘침으로 계산되고 줄이 하나 더 접힘. 좌우 여백만 주고 각 행의 nowrap 이 지킴. */}
        <h1 className="m-0 text-[42px] leading-[1.4] font-bold text-white max-introtab:text-[32px] max-mo:absolute max-mo:top-[39%] max-mo:right-5 max-mo:left-5 max-mo:text-2xl max-mo:leading-[34px] ko:break-keep">
          {hero.titleLines.map((line) => (
            <Fragment key={line.key}>
              {/* PC·TAB 은 2줄임: 1행은 혼자, 2·3행은 이어 붙음. JSX 는 span 사이의 공백을 버리므로
                  단어 공백을 명시해야 하고, MO 에서는 모든 행이 한 줄씩 차지하므로 숨김. */}
              {line.hasLeadingSpace && <span className="max-mo:hidden"> </span>}
              <span
                className={cn(
                  "inline max-mo:block max-mo:whitespace-nowrap",
                  line.isOwnRow && "block",
                )}
              >
                {t(`hero.title.${line.key}`)}
              </span>
            </Fragment>
          ))}
        </h1>

        {/* MO: 48px 버튼 두 개가 8px 간격으로 쌓이고 아래에서 20px 떨어짐. */}
        <div className="flex items-center gap-4 max-mo:absolute max-mo:right-5 max-mo:bottom-5 max-mo:left-5 max-mo:w-auto max-mo:max-w-none max-mo:flex-col max-mo:items-stretch max-mo:gap-2">
          {hero.buttons.map((button) => (
            <IntroCtaButton key={button.key} button={button} />
          ))}
        </div>
      </div>

      {/* 디자인의 아래 패딩은 PC·TAB 에서 83px. 디자이너가 말한 "아래 여백 68px"은 이것이 아니라
          축소된 비디오를 가리킴(--hero-max-bottom). 인디케이터는 MO 에 없음. */}
      <img
        className="absolute bottom-[83px] left-1/2 z-[1] size-[60px] -translate-x-1/2 max-mo:hidden"
        src={SCROLL_INDICATOR}
        alt=""
      />
    </section>
  );
}
