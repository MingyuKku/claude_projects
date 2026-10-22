import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import S3_DOTS from "../assets/s3-dots.png";
import S3_LOGOS_BOTTOM from "../assets/s3-logos-bottom.png";
import S3_LOGOS_TOP from "../assets/s3-logos-top.png";
import { REVEAL } from "../lib/tw";

interface Props {
  className?: string;
}

// 디자인은 두 행이 한 장에 든 1770x126 이미지를 주며, 각 행에는 빈 여백이 있음(윗행 왼쪽 247px / 오른쪽 274px).
// 그대로 타일링하면 이음매에서 두 여백이 더해져 로고 사이에 500px 이상의 구멍이 생김.
// 그래서 행마다 잘라 여백을 없애고, 행의 평균 로고 간격(윗행 60px / 아랫행 52px)만 오른쪽에 남김.
// 이제 이음매 간격이 행 안의 간격과 같음.
//
// 행마다 폭이 달라 속도를 맞추려고 스크롤 시간을 폭에 비례시킴.
// 키프레임은 전역 스타일시트에 있음(Tailwind 에는 범위가 한정된 키프레임이 없음).
// opacity 50% 는 디자인 값.
const ROW = "h-[63px] bg-repeat-x opacity-50 motion-reduce:animate-none";

export function IntroSection3({ className }: Props) {
  const { t } = useTranslation("pages/introduction");
  return (
    // MO 에서는 좌우 여백을 제목과 설명에만 둠. 섹션에 두면 로고 띠가 20px 안쪽으로 들어가 양 끝이 비어 보임.
    // 배경 #343a40 = bigbird/text.
    <section
      className={cn(
        "relative flex flex-col items-center gap-15 overflow-hidden bg-[#343a40] py-25 max-introtab:gap-8 max-introtab:py-20 max-mo:py-15",
        className,
      )}
    >
      {/* 점·호 패턴. 디자인은 흰 바탕에 연회색인 이미지를 어두운 면 위에 깖. 그대로 두면 면 전체가 밝아짐.
          invert 가 톤을 뒤집고 screen 블렌딩이 어두운 면은 유지한 채 패턴만 밝게 남김.

          크기는 디자인 값: PC 1440x497 (x=0), TAB 1322x456 (x=-277), MO 1236x427 (x=-438).
          모두 비율이 2.897 로 같고, 디자이너가 좁은 화면에서 양옆을 손으로 자름.
          그래서 폭을 섹션에 맞추지 않고 그 폭 그대로 가운데에 두어 넘치는 부분을 잘라 냄.
          inset:0 + 100% 100% 로 늘리면 폭이 바뀔 때 패턴이 세로로 찌그러짐.
          min-w-full 은 1440 이상에서 양옆이 비는 것을 막고, 그때는 aspect 가 비율을 유지함.

          원본 png 는 1024x512(2:1)로 노드의 비율과 다름. 디자인이 늘려 쓰므로
          background-size 100% 100% 가 같은 결과를 냄. */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 aspect-[1440/497] w-[1440px] min-w-full -translate-x-1/2 [background-size:100%_100%] opacity-80 mix-blend-screen invert max-introtab:w-[1322px] max-mo:w-[1236px]"
        style={{ backgroundImage: `url(${S3_DOTS})` }}
        aria-hidden="true"
      />

      {/* max-w-[512px] 는 디자인의 제목 폭. */}
      <div
        className={cn(
          REVEAL,
          "relative flex max-w-[512px] flex-col items-center gap-4 text-center max-mo:max-w-80 max-mo:px-5",
        )}
        data-reveal=""
      >
        <h2 className="m-0 text-[32px] leading-[1.4] font-bold text-white max-mo:text-2xl ko:break-keep">
          {t("section3.title")}
        </h2>
        <p className="m-0 text-lg leading-[1.4] font-medium text-[#adb5bd] max-mo:text-base ko:break-keep">
          {t("section3.description")}
        </p>
      </div>

      <div
        className={cn(REVEAL, "relative h-[126px] w-full overflow-hidden")}
        data-reveal=""
        role="img"
        aria-label={t("section3.brandsLabel")}
      >
        {/* repeat-x 가 이미지를 끝없이 타일링하고 배경 위치만 움직임. 타일 폭만큼 정확히 이동하면 다음 타일이
            같은 자리에 오므로 이음매가 없음. 윗행은 왼쪽(로고 8개), 아랫행은 반대쪽(로고 11개)으로 움직이며,
            개수와 폭이 달라 둘이 박자가 맞지 않음. */}
        <div
          className={cn(
            ROW,
            "animate-[intro-s3-left_29.6s_linear_infinite] [background-size:1308.6px_63px]",
          )}
          style={{ backgroundImage: `url(${S3_LOGOS_TOP})` }}
        />
        <div
          className={cn(
            ROW,
            "animate-[intro-s3-right_40s_linear_infinite] [background-size:1769.6px_63px]",
          )}
          style={{ backgroundImage: `url(${S3_LOGOS_BOTTOM})` }}
        />
      </div>
    </section>
  );
}
