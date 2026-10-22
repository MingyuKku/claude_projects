import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { banner } from "../model/data";
import { IntroCtaButton } from "./IntroCtaButton";

// 배너 버튼의 최소 폭과 변형별 추가 클래스.
const BUTTON_CLASS = {
  secondary: "min-w-[78px] backdrop-blur-[2px]",
  primary: "min-w-[78px]",
  ghost: "min-w-[78px]",
} as const;

interface Props {
  className?: string;
}

export function IntroBanner({ className }: Props) {
  const { t } = useTranslation("pages/introduction");

  return (
    // 배경 이미지는 데이터 파일의 것으로 블렌드와 회전이 이미 구워져 있음. #343a40 은 이미지 밖 여백만 채움.
    //
    // PC·TAB 은 세로 가운데 정렬이 아님: 디자인의 절대 y 를 그대로 옮김
    // (제목 y=130, 버튼 y=273 이라 57px 간격). MO 는 세로 가운데 정렬:
    // (433 - 128 - 32 - 112) / 2 = 80.5 로 디자인의 제목 y 와 맞음.
    <section
      className={cn(
        "flex h-[433px] flex-col items-center gap-[57px] bg-[#343a40] bg-cover bg-center px-10 pt-[130px] max-mo:justify-center max-mo:gap-8 max-mo:px-5 max-mo:pt-0",
        className,
      )}
      style={{ backgroundImage: `url(${banner.bg})` }}
    >
      {/* w-[580px] 는 디자인의 제목 폭. */}
      <div className="flex w-[580px] flex-col items-center gap-4 text-center max-mo:w-full">
        <h2 className="m-0 text-[32px] leading-[1.4] font-bold text-white max-mo:text-2xl ko:break-keep">
          {t("banner.title")}
        </h2>
        <p className="m-0 text-lg leading-[1.4] font-medium text-[#adb5bd] max-mo:text-base ko:break-keep">
          {t("banner.description")}
        </p>
      </div>

      {/* MO 에서는 버튼이 세로로 쌓이고 각각 폭을 가득 채움. */}
      <div className="flex gap-4 max-mo:w-full max-mo:flex-col">
        {banner.buttons.map((button) => (
          <IntroCtaButton
            key={button.key}
            button={button}
            iconLoading="lazy"
            className={BUTTON_CLASS[button.variant]}
          />
        ))}
      </div>
    </section>
  );
}
