import { cva } from "class-variance-authority";

import { Trans, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { CONTAINER, REVEAL } from "../lib/tw";
import { section5 } from "../model/data";

interface Props {
  className?: string;
}

// 카드 배경 사진은 열마다 다르게 놓음. 카드 1은 106.1% / 141.31% 로 키워 자르고,
// 카드 2는 원본 비율에 가깝게 둠. TAB·MO 에서는 두 카드 모두 카드를 가득 채움(size-full + object-cover):
// 카드 비율이 달라 PC 배치를 쓰면 사람이 글자와 겹침.
const CARD_BG = {
  brand: "top-[-15.71%] left-[-6.03%] h-[141.31%] w-[106.1%]",
  groupBuy: "top-[-16.52%] left-0 h-[133.28%] w-[100.07%]",
};

// 배지는 세 화면 모두 카드 1 "브랜드형"이 Bold(700), 카드 2 "공구형"이 SemiBold(600). 배경 #f1f3f5.
const badgeVariants = cva(
  "relative m-0 rounded-[4px] bg-[#f1f3f5] px-4 py-2.5 text-sm leading-[1.4] text-[#222]",
  {
    variants: {
      weight: {
        bold: "font-bold",
        semibold: "font-semibold",
      },
    },
  },
);

export function IntroSection5({ className }: Props) {
  const { t } = useTranslation("pages/introduction");
  return (
    // py: 디자인의 제목 y 는 PC 100 / TAB 80 / MO 60.
    <section className={cn("py-25 max-introtab:py-20 max-mo:py-15", className)}>
      <div className={CONTAINER}>
        {/* max-w-[563px] 는 디자인의 제목 폭. */}
        <div
          className={cn(
            REVEAL,
            "mx-auto flex max-w-[563px] flex-col items-center gap-4 text-center max-mo:max-w-80",
          )}
          data-reveal=""
        >
          <h2 className="m-0 text-[32px] leading-[1.4] font-bold text-[#222] max-mo:text-2xl ko:break-keep">
            <Trans
              t={t}
              i18nKey="section5.title"
              components={{ accent: <span className="text-[#4b80c2]" /> }}
            />
          </h2>
          <p className="m-0 text-lg leading-[1.4] font-medium text-[#868e96] max-mo:text-base ko:break-keep">
            {t("section5.description")}
          </p>
        </div>

        {/* gap: PC 20 / TAB 32 / MO 24. */}
        <div className="mt-15 flex items-start gap-5 max-introtab:mt-8 max-introtab:flex-col max-introtab:gap-8 max-mo:mt-8 max-mo:gap-6">
          {section5.columns.map((column) => (
            <div
              key={column.key}
              className={cn(REVEAL, "min-w-0 flex-1 max-introtab:w-full")}
              data-reveal=""
            >
              {/* MO 에서 카드는 정사각형(디자인 QA). 높이를 320px 로 고정하면 폭 360px 미만에서
                  카드가 세로로 늘어나고, cover 가 정사각형 사진을 높이에 맞춰 확대해 양옆을 자름(사람이 커짐).
                  폭을 따라가는 비율로 이를 피함. */}
              <article className="group relative flex h-[443px] flex-col items-start justify-between overflow-hidden rounded-[4px] px-5 pt-5 pb-8 max-mo:aspect-square max-mo:h-auto">
                {/* ::after 는 디자인대로 아래로 갈수록 어두워지는 그라데이션과 전체 톤다운. */}
                <div
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[4px] after:absolute after:inset-0 after:rounded-[4px] after:[background-image:linear-gradient(180deg,rgba(34,34,34,0)_41.196%,rgba(34,34,34,0.8)_76.479%),linear-gradient(90deg,rgba(0,0,0,0.2)_0%,rgba(0,0,0,0.2)_100%)] after:content-['']"
                  aria-hidden="true"
                >
                  {/* 호버하면 배경 사진만 136.63%(106.1% 의 1.288배)로 커짐. PC 폭에서 마우스일 때만 켬:
                      터치 기기는 상태가 남고, 폭을 줄인 데스크톱 창은 태블릿과 같아야 함(디자인 QA).
                      max-w-none: preflight 의 img{max-width:100%} 가 106.1% 를 깎음. */}
                  <img
                    className={cn(
                      "absolute max-w-none object-cover transition-transform duration-500 ease-[ease] max-introtab:top-0 max-introtab:left-0 max-introtab:size-full",
                      CARD_BG[column.key],
                      "introtab:group-hover:scale-[1.288]",
                    )}
                    src={column.card.image}
                    alt=""
                    loading="lazy"
                  />
                </div>

                <p className={badgeVariants({ weight: column.badgeWeight })}>
                  {t(`section5.columns.${column.key}.badge`)}
                </p>

                <div className="relative flex flex-col gap-4 pl-3 text-white">
                  {/* 세 화면 모두 20px 이며 화면별로 줄지 않음. */}
                  <h3 className="m-0 text-xl leading-[1.4] font-bold whitespace-pre-line text-white ko:break-keep">
                    {t(`section5.columns.${column.key}.title`)}
                  </h3>
                  {/* MO 는 폭에 맞춰 자연스럽게 줄바꿈함. 데이터 파일의 줄바꿈은 PC·TAB 폭(376)에 맞춘 것이라
                      MO 의 268 에서는 4줄이 되어 글자 블록이 사람 얼굴 위로 올라감. 디자인은 3줄임. */}
                  <p className="m-0 text-base leading-[1.4] font-medium whitespace-pre-line max-mo:whitespace-normal ko:break-keep">
                    {t(`section5.columns.${column.key}.description`)}
                  </p>
                </div>
              </article>

              {/* 항목 사이 gap-2 (디자인: 항목이 y 0 / 127 / 254, 각 119+8).
                  mt: PC 32 (카드 끝 443 -> 목록 시작 475), TAB·MO 8. */}
              <ul className="m-0 mt-8 flex list-none flex-col gap-2 p-0 max-introtab:mt-2">
                {column.items.map((item) => (
                  // gap-[37px]: PC·TAB 에서 아이콘 x=20-80, 글자 x=117. MO 에서는 아이콘이 글자 위에 놓임.
                  // border-b #dee2e6 = bigbird/line2.
                  <li
                    key={item.key}
                    className="flex min-h-[119px] items-center gap-[37px] border-b border-[#dee2e6] bg-white p-5 max-mo:min-h-0 max-mo:flex-col max-mo:items-start max-mo:gap-5 max-mo:px-2.5 max-mo:py-5"
                  >
                    <span className="flex size-15 flex-none items-center justify-center rounded-[4px] bg-[#f1f3f5]">
                      <img
                        className="size-8"
                        src={item.icon}
                        alt=""
                        loading="lazy"
                      />
                    </span>
                    <div className="flex min-w-0 flex-col gap-2">
                      <p className="m-0 text-sm leading-[1.4] font-semibold text-[#222]">
                        {t(`${item.key}.title`)}
                      </p>
                      {/* 세 화면 모두 18px. */}
                      <p className="m-0 text-lg leading-[1.4] font-medium text-[#222] ko:break-keep">
                        {t(`${item.key}.description`)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
