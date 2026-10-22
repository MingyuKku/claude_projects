import { Trans, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { createSpriteStyle } from "../lib/sprite-style";
import { CONTAINER, REVEAL } from "../lib/tw";
import { section4 } from "../model/data";

interface Props {
  className?: string;
}

export function IntroSection4({ className }: Props) {
  const { t } = useTranslation("pages/introduction");
  return (
    // py: 디자인의 제목 y 는 PC 160 / TAB 80 / MO 60.
    <section className={cn("py-40 max-introtab:py-20 max-mo:py-15", className)}>
      <div className={CONTAINER}>
        {/* max-w 는 디자인의 제목 폭. */}
        <div
          className={cn(
            REVEAL,
            "mx-auto flex max-w-[701px] flex-col items-center gap-4 text-center max-introtab:max-w-[688px] max-mo:max-w-80",
          )}
          data-reveal=""
        >
          {/* "...과정을" 뒤에서 끊기는 것은 TAB 뿐. 폭에 맡기면 "한곳에서"가 1행으로 올라가므로
              거기서만 pre-line 을 켜고, MO 는 한 문단으로 흐르므로 다시 끔. */}
          <h2 className="m-0 text-[32px] leading-[1.4] font-bold text-[#222] max-introtab:whitespace-pre-line max-mo:text-2xl max-mo:whitespace-normal ko:break-keep">
            {/* <accent> 부분만 주 색상. */}
            <Trans
              t={t}
              i18nKey="section4.title"
              components={{ accent: <span className="text-[#4b80c2]" /> }}
            />
          </h2>
          {/* pre-line 이 PC·TAB 에서 데이터 파일의 줄바꿈을 유지하고, MO 는 자연스럽게 줄바꿈함. */}
          <p className="m-0 text-lg leading-[1.4] font-medium whitespace-pre-line text-[#868e96] max-mo:text-base max-mo:whitespace-normal ko:break-keep">
            {t("section4.description")}
          </p>
        </div>

        <ul className="m-0 mt-15 flex list-none flex-col gap-12 p-0 max-introtab:mt-8 max-mo:mt-8 max-mo:gap-8">
          {section4.cards.map((card, index) => (
            <li
              key={card.key}
              className={cn(
                REVEAL,
                // TAB 디자인은 폭 768 에 px 값이지만 1239px 까지 늘어나야 하므로
                // 콘텐츠 폭 688 에 대한 비율로 환산함(23 / 688). MO 에서는 이미지가 위, 글자가 아래.
                "flex items-center gap-15 pr-[34px] max-introtab:gap-[3.343%] max-introtab:pr-0 max-mo:flex-col max-mo:items-stretch max-mo:gap-6",
                // 카드 2·4는 이미지를 오른쪽에 둠(MO 에서는 뒤집지 않음).
                card.reverse &&
                  "flex-row-reverse pr-0 pl-[34px] max-introtab:pl-0 max-mo:flex-col",
              )}
              data-reveal=""
            >
              {/* 카드 이미지는 화면별 스프라이트에서 잘라 씀(데이터 파일 참고). 비디오 카드는 스프라이트 대신
                  #fafafa 배경 가운데에 화면 캡처 비디오만 보여 줌.
                  aspect: %로 쓴 background-size 는 비율이 고정일 때만 성립함. */}
              <div
                className={cn(
                  "relative h-[400px] w-[794px] flex-none overflow-hidden rounded-[4px] bg-[#fafafa] bg-no-repeat",
                  "[background-image:var(--s4-pc-img)] [background-size:var(--s4-pc-size)] [background-position:var(--s4-pc-pos)]",
                  "max-introtab:aspect-[456/232] max-introtab:h-auto max-introtab:w-[66.279%] max-introtab:[background-image:var(--s4-tab-img)] max-introtab:[background-size:var(--s4-tab-size)] max-introtab:[background-position:var(--s4-tab-pos)]",
                  "max-mo:h-[232px] max-mo:w-full max-mo:[background-image:var(--s4-mo-img)] max-mo:[background-size:var(--s4-mo-size)] max-mo:[background-position:var(--s4-mo-pos)]",
                  card.video &&
                    "[background-image:none] max-introtab:[background-image:none] max-mo:[background-image:none]",
                )}
                role="img"
                aria-label={t(`section4.cards.${card.key}.label`)}
                style={createSpriteStyle(index, card)}
              >
                {/* Safari 는 비디오 자체의 반경으로는 모서리를 자르지 않아 비디오를 감쌈.
                    크기·테두리·그림자는 디자인 값이며 화면별로 600 -> 320 -> 300 으로 줄어듦.
                    TAB 에서는 456 이미지 박스에 대한 비율이라 박스를 따라 커짐. */}
                {card.video && (
                  <span className="absolute top-1/2 left-1/2 h-[290px] w-[600px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[16px] border-2 border-white shadow-[0_4px_10px_rgba(0,0,0,0.2),0_4px_40px_rgba(75,128,194,0.2)] max-introtab:aspect-[320/154.67] max-introtab:h-auto max-introtab:w-[70.175%] max-introtab:rounded-[8.533px] max-introtab:border-[1.067px] max-introtab:shadow-[0_2.133px_5.333px_rgba(0,0,0,0.2),0_2.133px_21.333px_rgba(75,128,194,0.2)] max-mo:h-[145px] max-mo:w-[300px] max-mo:rounded-[8px] max-mo:border max-mo:shadow-[0_2px_5px_rgba(0,0,0,0.2),0_2px_20px_rgba(75,128,194,0.2)]">
                    {/* 비디오는 2.067:1, 프레임은 2.069:1 이라 cover 가 눈에 띄게 자르는 것이 없음.
                        1920x926 원본 오른쪽의 4~6px 검은 띠는 잘라 냈고 2배속 재생은 파일에 구워 넣음. */}
                    <video
                      className="block size-full object-cover"
                      src={card.video}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  </span>
                )}
              </div>

              {/* MO 에서는 아이콘이 글자 위에 놓이지 않고 제목 오른쪽 위에 고정됨: 흐름에서 빠져나와
                  라벨과 제목만 그 둘레로 줄바꿈하고 설명은 320px 전체를 씀.
                  TAB 폭은 29.215%(201/688): flex:1 이 남는 폭을 모두 가지면 768 에서 209 가 되어 디자인과 어긋남. */}
              <div className="flex w-[312px] flex-col gap-8 max-introtab:w-[29.215%] max-introtab:flex-none max-introtab:gap-4 max-mo:relative max-mo:w-full max-mo:gap-0">
                {/* rounded: 이미지에 자체 #e4ecf5 배경이 있어 모서리만 맞춤. MO 에서는 60px 이며 라벨보다 5.5px 아래. */}
                <img
                  className="block size-20 rounded-[12px] max-introtab:size-10 max-mo:absolute max-mo:top-[5.5px] max-mo:right-0 max-mo:size-15"
                  src={card.icon}
                  alt=""
                  loading="lazy"
                />
                <div className="flex flex-col gap-3 max-introtab:gap-1">
                  {/* max-w-[248px] 로 60px 아이콘 + 12px 간격을 피함. */}
                  <p className="m-0 text-sm leading-[1.4] font-bold text-[#4b80c2] max-introtab:text-xs max-mo:max-w-[248px]">
                    {t(`section4.cards.${card.key}.label`)}
                  </p>
                  {/* MO 에서도 줄바꿈은 데이터 파일의 \n 을 따름(pre-line). 폭에 맡기면 카드마다 끊기는 곳이 달라짐. */}
                  <h3 className="m-0 text-2xl leading-[1.4] font-bold whitespace-pre-line text-[#222] max-introtab:text-lg max-mo:max-w-[248px] ko:break-keep">
                    {t(`section4.cards.${card.key}.title`)}
                  </h3>
                  {/* MO 에서는 제목 12px 아래에 놓임. 위 간격이 4px 이므로 8px 을 더함. */}
                  <p className="m-0 text-lg leading-[1.4] font-medium text-[#868e96] max-introtab:text-sm max-mo:mt-2 ko:break-keep">
                    {t(`section4.cards.${card.key}.description`)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
