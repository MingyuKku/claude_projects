import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { HOVER, MOVE, type CardClasses } from "../lib/section1-card-classes";
import { useHoverVideo } from "../lib/use-hover-video";
import { HoverVideo } from "./HoverVideo";

import type { section1 } from "../model/data";

interface Props {
  card: (typeof section1.cards)[number];
  classes: CardClasses;
}

export function IntroSection1Card({ card, classes }: Props) {
  const { t } = useTranslation("pages/introduction");
  const { videoRef, isReady, play, stop, markReady } = useHoverVideo();
  const { phoneScreen } = classes;

  return (
    <li
      className={cn(
        // PC(행): 1200px 를 3등분해 387px, 높이는 세 카드 모두 436.
        // 열에서는 flex:1 이 flex-basis:0 처럼 동작해 height 를 무시하고 컨테이너 높이를 나눠 가지므로
        // (436 이 132 로 줄어듦) 세로 배치에서는 끔.
        "group relative h-[436px] min-w-0 flex-1 overflow-hidden rounded-[4px] bg-[#fafafa] px-[30px] pt-[30px] max-introtab:w-full max-introtab:flex-none",
        // 호버 효과는 PC 폭에서 마우스일 때만 켬: 터치 기기는 탭한 뒤에도 호버 상태가 남고,
        // 폭을 줄인 창은 TAB 효과와 충돌함.
        `transition-[background] ${HOVER}`,
        "introtab:hover:bg-[linear-gradient(180deg,#285b99_0%,#292f35_100%)]",
      )}
      onMouseEnter={play}
      onMouseLeave={stop}
    >
      {/* 호버하면 글자는 사라지고 목업이 카드를 채움. */}
      <h3
        className={cn(
          "relative z-[1] m-0 text-2xl leading-[1.4] font-bold text-[#222] max-mo:text-lg",
          `transition-opacity ${HOVER}`,
          "introtab:group-hover:opacity-0",
        )}
      >
        {t(`section1.cards.${card.key}.title`)}
      </h3>
      {/* 제목과 설명 사이 간격은 PC·TAB 18px, MO 8px. */}
      <p
        className={cn(
          "relative z-[1] mt-[18px] mb-0 text-lg leading-[1.4] font-medium whitespace-pre-line text-[#868e96] max-mo:mt-2 max-mo:text-sm ko:break-keep",
          `transition-opacity ${HOVER}`,
          "introtab:group-hover:opacity-0",
        )}
      >
        {t(`section1.cards.${card.key}.description`)}
      </p>

      {/* 이미지 프레임은 y=150 에서 시작하고 높이는 436-150=286. */}
      <div
        className={cn(
          "absolute inset-x-0 top-[150px] h-[286px] overflow-hidden rounded-b-[4px]",
          `transition-[top,height] ${HOVER}`,
          "introtab:group-hover:top-0 introtab:group-hover:h-full",
        )}
      >
        {/* max-w-none: preflight 의 img{max-width:100%} 가 카드보다 크게 배치해야 하는 목업을 찌그러뜨림
            (크기는 디자인의 좌표). */}
        <img
          className={cn(
            "absolute left-1/2 max-w-none",
            MOVE,
            classes.imgDefault,
            "introtab:group-hover:opacity-0",
          )}
          src={card.image}
          alt=""
          loading="lazy"
        />
        <img
          className={cn(
            "absolute left-1/2 max-w-none opacity-0",
            MOVE,
            classes.imgHover,
            "introtab:group-hover:opacity-100",
          )}
          src={card.hoverImage}
          alt=""
          loading="lazy"
        />

        {card.screenImg && phoneScreen && (
          <span
            className={cn(
              "absolute top-[29.4px] left-[calc(50%-123.9px)] h-[503.2px] w-[245px] overflow-hidden rounded-[28.9px] opacity-0",
              MOVE,
              // 스케일 기준점은 목업 중앙을 오버레이 박스 좌표로 환산한 값:
              // 목업 중앙(50% - 18.5, -91 + 368)을 오버레이 기준(50% - 123.9, 29.4)에 대입.
              "introtab:origin-[105.4px_247.6px] introtab:scale-[0.76] introtab:group-hover:scale-100 introtab:group-hover:opacity-100",
              "max-introtab:opacity-100",
              phoneScreen.screen,
              phoneScreen.screenVars,
            )}
          >
            {/* 캡처는 헤더 아래에서 시작해 그 뒤로 밀려 올라감. 헤더 높이(61.5px)보다 2px 위에서 시작해
                살짝 겹침: 정확히 맞붙이면 소수 좌표가 서브픽셀로 반올림될 때 이음매에 1px 틈이 생김.
                0.4s transition 은 호버를 벗어날 때 되돌아가는 속도.
                TAB·MO 는 transition 을 끄고 애니메이션으로 계속 흘림. */}
            <img
              className={cn(
                "absolute top-[59.5px] left-0 w-full transition-transform duration-400 ease-[ease]",
                "motion-reduce:animate-none max-introtab:animate-[intro-s1-screen-scroll_var(--s1-scroll-dur)_linear_infinite] max-introtab:transition-none",
                phoneScreen.screenBody,
                phoneScreen.screenScroll,
              )}
              src={card.screenImg}
              alt=""
              loading="lazy"
            />
            {/* 상태바 + 앱 헤더: 디자인에서는 이미지 프레임 위에 고정된 레이어.
                900x226 원본(450x113 의 2배)은 화면 폭 245 에서 61.5px. */}
            <img
              className="absolute top-0 left-0 z-[1] w-full"
              src={card.screenHead}
              alt=""
              loading="lazy"
            />
          </span>
        )}

        {card.hoverVideo && (
          <HoverVideo
            ref={videoRef}
            src={card.hoverVideo}
            isReady={isReady}
            onCanPlay={markReady}
          />
        )}
      </div>
    </li>
  );
}
