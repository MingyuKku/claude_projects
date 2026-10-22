import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { CARD_CLASSES } from "../lib/section1-card-classes";
import { CONTAINER } from "../lib/tw";
import { useIsResizing } from "../lib/use-is-resizing";
import { section1 } from "../model/data";
import { IntroSection1Card } from "./IntroSection1Card";

interface Props {
  className?: string;
}

export function IntroSection1({ className }: Props) {
  const { t } = useTranslation("pages/introduction");
  // TAB 경계(1240px)를 넘으면 목업 좌표가 PC 값과 TAB 값 사이에서 바뀜.
  // 목업에는 호버 transition(0.9s)이 있지만 비디오 오버레이에는 없어, 리사이즈 중에는 비디오가 새 자리로 먼저 뛰고
  // 목업이 뒤따라감. 그래서 리사이즈 중에만 transition 을 끔(디자인 QA).
  const isResizing = useIsResizing();

  return (
    // 디자인의 섹션 높이는 PC 852 / TAB 1696 / MO 1650. 높이는 콘텐츠가 정하고
    // 디자인의 세로 패딩만 재현함: PC 100(제목 y=100, 카드 끝 316+436=752 아래 100) / TAB 80 / MO 60.
    // 배경 #f1f3f5 = bigbird/forms. 카드(#fafafa)가 돋보이도록 카드보다 어두워야 함.
    <section
      className={cn(
        "bg-[#f1f3f5] py-25 max-introtab:py-20 max-mo:py-15",
        // 리사이즈 중에는 목업과 비디오가 같은 순간에 움직여야 함.
        isResizing && "[&_*]:transition-none!",
        className,
      )}
    >
      <div className={CONTAINER}>
        {/* 디자인의 제목 폭은 PC·TAB 472, MO 320. 열어 두면 설명이 디자인의 2/3 가 아니라 한 줄로 늘어남.
            간격 16 은 세 화면 모두 같음. */}
        <div className="mx-auto flex max-w-[472px] flex-col items-center gap-4 text-center max-mo:max-w-[320px]">
          {/* whitespace-pre-line 이 제목의 \n(2줄 줄바꿈)을 유지함. */}
          <h2 className="m-0 text-[32px] leading-[1.4] font-bold whitespace-pre-line text-[#222] max-mo:text-2xl ko:break-keep">
            {t("section1.title")}
          </h2>
          <p className="m-0 text-lg leading-[1.4] font-medium text-[#868e96] max-mo:text-base ko:break-keep">
            {t("section1.description")}
          </p>
        </div>

        {/* 카드 간격은 PC 19.5, TAB·MO 20 -> gap-5.
            mt: 제목 끝 -> 카드 시작이 PC 60, TAB·MO 32. */}
        <ul className="mt-15 flex list-none gap-5 p-0 max-introtab:mt-8 max-introtab:flex-col">
          {section1.cards.map((card, index) => {
            const classes = CARD_CLASSES[index];
            if (!classes) return null;
            return (
              <IntroSection1Card key={card.key} card={card} classes={classes} />
            );
          })}
        </ul>
      </div>
    </section>
  );
}
