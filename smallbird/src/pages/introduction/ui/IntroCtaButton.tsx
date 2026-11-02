import { cva } from "class-variance-authority";

import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { type IntroButton } from "../model/data";

const ctaButtonVariants = cva(
  "flex h-12 items-center justify-center gap-2 rounded-[4px] px-6 text-base leading-6 font-medium whitespace-nowrap no-underline",
  {
    variants: {
      variant: {
        // 보조 CTA: 흰 배경, #222 글자, 아이콘 없음.
        secondary: "bg-white text-[#222]",
        // 주 CTA: 브랜드 배경, 흰 글자, 오른쪽 화살표.
        primary: "bg-[#4b80c2] text-white",
        ghost: "",
      },
    },
  },
);

interface Props {
  button: IntroButton<"brochure" | "start">;
  /** 아이콘 이미지의 로딩 방식. 첫 화면 밖에 있으면 "lazy" 를 넘김. */
  iconLoading?: "lazy";
  className?: string;
}

// 히어로와 배너가 함께 쓰는 CTA 링크 버튼.
export function IntroCtaButton({ button, iconLoading, className }: Props) {
  const { t } = useTranslation("pages/introduction");

  return (
    <a
      className={cn(ctaButtonVariants({ variant: button.variant }), className)}
      href={button.href}
      download={button.download ? t("hero.downloadName") : undefined}
    >
      {t(`hero.${button.key}`)}
      {button.icon && (
        // 아이콘 슬롯은 16x16(이 폭이 159px 버튼을 만듦)이고 화살표 그래픽은 그 안의 5.99x10.665.
        // svg 가 preserveAspectRatio="none" 이라 슬롯과 그래픽의 크기를 따로 줌.
        <span className="flex size-4 flex-none items-center justify-center">
          <img
            className="block h-[10.665px] w-[5.99px]"
            src={button.icon}
            alt=""
            loading={iconLoading}
          />
        </span>
      )}
    </a>
  );
}
