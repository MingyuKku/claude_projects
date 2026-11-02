import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import S2_BG from "../assets/s2-bg.jpg";
import { REVEAL } from "../lib/tw";
import { section2 } from "../model/data";

interface Props {
  className?: string;
}

// 파트너 사이 구분선이며 방향은 화면마다 다름.
//   PC  : 파트너 사이 세로선 2개
//   TAB : 삼성 아래 가로선 1개 + AWS와 Google 사이 세로선 1개
//   MO  : 쌓인 셀 사이 가로선 2개
// 선은 3px(흰색 10%)이고 absolute 로 놓여 레이아웃 폭을 차지하지 않음. 디자인의 폭 0 선 노드와 같음.
const DIVIDER =
  "before:absolute before:top-1/2 before:left-[calc(-41px/2-1.5px)] before:h-[126px] before:w-[3px] before:-translate-y-1/2 before:bg-white/10 before:content-['']";

// 로고 좌표는 디자인 값. 셀과 이미지 크기가 파트너마다 달라 표로 둠.
const PARTNER = {
  samsung: {
    // TAB 에서 로고와 캡션을 한 줄로 늘어놓고 두 셀에 걸치는 것은 삼성뿐.
    // 그 아래 선은 폭 604px 고정이며 두 행 사이 16px 간격의 가운데에 놓임. 셀마다 border-top 을 주면 열 간격에서 끊김.
    // MO 는 1열이라 이런 선이 없음.
    root: "max-introtab:col-span-full max-introtab:flex-row max-introtab:justify-center max-introtab:gap-6 max-mo:flex-col max-mo:gap-[14px] max-introtab:after:absolute max-introtab:after:top-[calc(100%+8px-1.5px)] max-introtab:after:left-1/2 max-introtab:after:h-[3px] max-introtab:after:w-[604px] max-introtab:after:-translate-x-1/2 max-introtab:after:bg-white/10 max-introtab:after:content-[''] max-mo:after:content-none",
    logo: "",
    imgs: [
      // 'SAMSUNG Fit My Marketing'
      "top-[9.29px] left-[28px] h-[33.207px] w-[147.357px]",
      // Samsung Electronics wordmark
      "top-[54.95px] left-[57.06px] h-[64.339px] w-[175.173px]",
    ],
  },
  aws: {
    // TAB 에는 AWS 앞 세로선이 없음. MO 에서는 각 셀에 위 테두리만 남음(border 3px + pt 21 = 디자인의 24px).
    root: `${DIVIDER} max-introtab:before:content-none max-mo:gap-[13px] max-mo:border-t-[3px] max-mo:border-white/10 max-mo:pt-[21px]`,
    logo: "max-introtab:h-[90.585px] max-introtab:w-[184px]",
    imgs: [
      "top-[-14.71px] left-5 h-[156.406px] w-[219.946px] max-introtab:top-[-10.41px] max-introtab:left-[14.15px] max-introtab:h-[110.688px] max-introtab:w-[155.654px]",
    ],
  },
  google: {
    // TAB 안쪽 세로선은 24px 열 간격의 가운데에 놓임. Google 셀에 border-left 를 주면 그보다 12px 오른쪽에서 시작해
    // 가로선까지 이어짐.
    root: `${DIVIDER} max-introtab:before:left-[calc(-24px/2-1.5px)] max-mo:before:content-none max-mo:border-t-[3px] max-mo:border-white/10 max-mo:pt-[21px]`,
    logo: "max-introtab:h-[90.585px] max-introtab:w-[184px]",
    imgs: [
      "top-[-21.71px] left-1/2 h-[191.304px] w-[253.328px] translate-x-[calc(-50%-0.34px)] max-introtab:top-[-15.36px] max-introtab:h-[135.384px] max-introtab:w-[179.278px] max-introtab:translate-x-[calc(-50%-0.24px)]",
    ],
  },
} as const;

export function IntroSection2({ className }: Props) {
  const { t } = useTranslation("pages/introduction");
  return (
    <section
      className={cn(
        "relative flex flex-col items-center justify-center gap-12 overflow-hidden py-25 max-introtab:gap-8 max-introtab:px-10 max-introtab:py-20 max-mo:px-5 max-mo:py-15",
        className,
      )}
    >
      {/* 배경: 디자이너의 최종 합성본을 한 장으로 씀. 채움(파란 틴트 + 세로 그라데이션 + 20% 불투명도 사진)을 CSS 로
          다시 만들면 사진이 묻힘. 내보낸 파일이 노출 보정 전이라 거의 흰색이고, 그 20% 는 대비가 4/255 뿐이기 때문.
          비율을 지키려고 cover 로 둠: 2880x1670 원본에 비해 프레임 비율이 화면마다 크게 다르므로
          (PC 1.72 / TAB 0.93 / MO 0.34) cover 는 양옆을 잘라 내는 대가로 채움. 근본 해결은 TAB·MO 용 세로 사진이며
          디자이너를 기다리는 중.
          url() 을 인라인으로 두는 이유는 Tailwind 가 만든 CSS 가 컴포넌트 기준 상대 경로로 해석되지 않기 때문. */}
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${S2_BG})` }}
        aria-hidden="true"
      />

      <img
        className={cn(
          REVEAL,
          "relative h-[180px] w-[448px] max-introtab:h-[152px] max-introtab:w-[378px] max-mo:h-[128.677px] max-mo:w-80",
        )}
        data-reveal=""
        src={section2.awards}
        alt={t("section2.awardsAlt")}
        loading="lazy"
      />

      <div
        className={cn(
          REVEAL,
          "relative flex flex-col items-center gap-4 text-center",
        )}
        data-reveal=""
      >
        {/* max-w-[280px]: 디자인은 MO 를 2줄로 끊음. */}
        <h2 className="m-0 text-[32px] leading-[1.4] font-bold text-white max-mo:max-w-[280px] max-mo:text-2xl ko:break-keep">
          {t("section2.title")}
        </h2>
        <p className="m-0 text-lg leading-[1.4] font-medium text-[#adb5bd] max-mo:text-base ko:break-keep">
          {t("section2.description")}
        </p>
      </div>

      {/* TAB 은 두 행: 삼성(가로) / 구분선 / AWS와 Google 2열. flex-wrap 은 순서를 흩뜨리므로 grid 로 배치함. */}
      <div
        className={cn(
          REVEAL,
          "relative flex items-center justify-center gap-[41px] rounded-[20px] border-2 border-white/10 px-[54px] py-10",
          "max-introtab:grid max-introtab:w-full max-introtab:grid-cols-2 max-introtab:gap-x-6 max-introtab:gap-y-4 max-introtab:px-0 max-introtab:py-6",
          "max-mo:grid-cols-1 max-mo:gap-6 max-mo:py-8",
        )}
        data-reveal=""
      >
        {section2.partners.map((partner) => {
          const conf = PARTNER[partner.key];
          return (
            <div
              key={partner.key}
              className={cn(
                // MO 에서 로고와 캡션 사이는 13-14px 로 좁음.
                "relative flex w-[260px] flex-col items-center gap-6 max-introtab:w-auto max-introtab:gap-[23px] max-mo:gap-[14px]",
                conf.root,
              )}
            >
              <div
                className={cn(
                  "relative h-32 w-[260px] overflow-hidden",
                  conf.logo,
                )}
              >
                {partner.logos.map((logo, logoIndex) => (
                  // max-w-none: preflight 의 img{max-width:100%} 가 로고를 찌그러뜨림.
                  <img
                    key={logo}
                    className={cn("absolute max-w-none", conf.imgs[logoIndex])}
                    src={logo}
                    alt=""
                    loading="lazy"
                  />
                ))}
              </div>
              <p className="m-0 text-center text-sm leading-[1.4] font-medium whitespace-pre-line text-[#adb5bd]">
                {t(`section2.partners.${partner.key}`)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
