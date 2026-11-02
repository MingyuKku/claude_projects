import { Trans, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { CONTAINER, REVEAL } from "../lib/tw";
import { section6 } from "../model/data";

import type { CssVariableStyle } from "@/shared/lib";

interface Props {
  className?: string;
}

// 간격을 포함한 카드의 가로 피치(0 / 305 / 610 / 915).
const CARD_PITCH = 305;

type Group = (typeof section6.groups)[number];
type MobileSprite = (typeof section6.spriteMo)[number];

// PC 와 TAB·MO 는 서로 다른 스프라이트를 씀. 카드마다 좌표가 달라 미디어 쿼리만으로는 고를 수 없으므로,
// 두 벌을 모두 CSS 변수로 넣고 스타일의 미디어 쿼리가 고름.
function spriteStyle(
  group: Group,
  mo: MobileSprite,
  cardIndex: number,
): CssVariableStyle {
  const { sprite, spriteSize } = section6;
  return {
    "--s6-pc-img": `url(${sprite})`,
    "--s6-pc-size": `${spriteSize.w}px ${spriteSize.h}px`,
    "--s6-pc-pos": `-${cardIndex * CARD_PITCH}px -${group.spriteY}px`,
    "--s6-mo-img": `url(${mo.src})`,
    "--s6-mo-size": `${mo.w}px ${mo.h}px`,
    // 잘라 낸 폭(320)이 카드 폭과 다를 수 있어 x 는 가운데로 맞춤.
    "--s6-mo-pos": `center -${mo.ys[cardIndex]}px`,
  };
}

export function IntroSection6({ className }: Props) {
  const { t } = useTranslation("pages/introduction");
  return (
    // py: 디자인의 제목 y 는 PC 100 / TAB 80 / MO 60.
    <section className={cn("py-25 max-introtab:py-20 max-mo:py-15", className)}>
      <div className={CONTAINER}>
        {/* max-w-[626px] 는 디자인의 제목 폭이고, mb 는 제목 끝 -> 그룹 간격. */}
        <div
          className={cn(
            REVEAL,
            "mx-auto mb-15 flex max-w-[626px] flex-col items-center gap-4 text-center max-introtab:mb-8 max-mo:mb-8 max-mo:max-w-80",
          )}
          data-reveal=""
        >
          <h2 className="m-0 text-[32px] leading-[1.4] font-bold text-[#222] max-mo:text-2xl ko:break-keep">
            <Trans
              t={t}
              i18nKey="section6.title"
              components={{ accent: <span className="text-[#4b80c2]" /> }}
            />
          </h2>
          <p className="m-0 text-lg leading-[1.4] font-medium text-[#868e96] max-mo:text-base ko:break-keep">
            {t("section6.description")}
          </p>
        </div>

        {section6.groups.map((group, groupIndex) => {
          const mobileSprite = section6.spriteMo[groupIndex];
          if (!mobileSprite) return null;
          return (
            <div
              key={group.key}
              className={cn(
                REVEAL,
                // 그룹 사이 간격: PC 48, TAB 32, MO 는 섹션 간격.
                groupIndex > 0 && "mt-12 max-introtab:mt-8",
              )}
              data-reveal=""
            >
              {/* 띠 #4b80c2 = bigbird/primary 이며 디자인에 반경이 없음. 글자
                #f8f9fa = bigbird/contents-bg, 세 화면 모두 18px. */}
              <h3 className="m-0 mb-[21px] flex h-[45px] items-center justify-center bg-[#4b80c2] text-lg leading-[1.4] font-semibold text-[#f8f9fa] max-mo:mb-2">
                {t(`section6.groups.${group.key}.heading`)}
              </h3>

              {/* TAB 은 2열 x 2행(행 간격 8, 열 간격 20). MO 는 카드가 맞닿는 1열이며
                간격은 각 카드 자체의 안쪽 패딩에서 나옴. */}
              <ul className="m-0 flex list-none gap-5 p-0 max-introtab:flex-wrap max-introtab:gap-x-5 max-introtab:gap-y-2 max-mo:flex-col max-mo:gap-0">
                {group.cards.map((card, cardIndex) => (
                  // gap-4: 이미지와 글자 사이가 벌어지는 것은 PC 뿐이고, TAB·MO 에서는 글자가 이미지에 붙음.
                  <li
                    key={card.no}
                    className="flex min-w-0 flex-1 flex-col gap-4 max-introtab:flex-[0_0_calc((100%-20px)/2)] max-introtab:gap-0 max-mo:w-full max-mo:flex-none"
                  >
                    {/* 카드 이미지 8장이 한 스프라이트에 들어 있고 각 카드는 자기 영역만 보여 줌.
                      TAB·MO 는 이미지를 334x236 으로 재배치해 PC 스프라이트를 쓸 수 없음.
                      배경 #f1f3f5 = bigbird/forms (S1/S4 카드와 다름). */}
                    <div
                      className="h-[236px] w-full rounded-[4px] bg-[#f1f3f5] [background-image:var(--s6-pc-img)] [background-size:var(--s6-pc-size)] [background-position:var(--s6-pc-pos)] bg-no-repeat max-introtab:[background-image:var(--s6-mo-img)] max-introtab:[background-size:var(--s6-mo-size)] max-introtab:[background-position:var(--s6-mo-pos)]"
                      style={spriteStyle(group, mobileSprite, cardIndex)}
                    />
                    {/* 설명이 1줄인 카드와 2줄인 카드의 아래 여백이 같도록 높이를 158px 로 고정함
                      (MO 만 콘텐츠를 따라 늘어남). */}
                    <div className="flex h-[158px] flex-col gap-3 px-2.5 py-5 max-mo:h-auto">
                      <p className="m-0 text-xl leading-none font-bold text-[#4b80c2] max-mo:text-base">
                        {card.no}
                      </p>
                      <div className="flex flex-col gap-2">
                        <h4 className="m-0 text-2xl leading-[1.4] font-bold text-[#222] max-mo:text-xl ko:break-keep">
                          {t(`${card.key}.title`)}
                        </h4>
                        {/* MO 에서도 16px. */}
                        <p className="m-0 text-base leading-[1.4] font-medium text-[#868e96] ko:break-keep">
                          {t(`${card.key}.description`)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
