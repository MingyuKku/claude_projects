import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib";

import { footer } from "../model/data";

interface Props {
  className?: string;
}

export function IntroFooter({ className }: Props) {
  const { t } = useTranslation("pages/introduction");
  const { t: tCommon } = useTranslation();

  return (
    // 패딩은 디자인 토큰(62 / 80)을 따르며 PC 좌우는 (1440-1200)/2 = 120.
    // border-top 2px #595a5d = gray/500.
    <footer
      className={cn(
        "flex flex-col items-start gap-5 border-t-2 border-[#595a5d] bg-[#222] px-30 pt-[62px] pb-20 max-introtab:px-10 max-mo:px-5",
        className,
      )}
    >
      <img
        className="h-[26.37px] w-[120.001px]"
        src={footer.logo}
        alt="Bigbird"
        loading="lazy"
      />

      <div className="flex w-full flex-col gap-5 pt-1">
        <ul className="m-0 flex list-none gap-5 p-0">
          {footer.links.map((link) => (
            <li key={link.href}>
              {/* inline-block 으로 line-height 가 21px 박스 높이에 포함되게 함. */}
              <a
                className="inline-block text-sm leading-[21px] font-normal whitespace-nowrap text-[#a1a3a7] underline"
                href={link.href}
              >
                {tCommon(`link.${link.key}`)}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2.5">
          {/* 디자인에서 두 줄은 한 텍스트 노드 안의 강제 줄바꿈. 좁은 폭에서는 각 줄이 다시 줄바꿈되므로
              자동 줄바꿈에 맡기는 block 으로 둠. */}
          <p className="m-0 text-sm leading-[21px] font-normal text-white/30">
            {footer.companyLines.map((line) => (
              <span key={line} className="block">
                {t(`footer.company.${line}`)}
              </span>
            ))}
          </p>
          <p className="m-0 text-sm leading-[21px] font-normal text-white/30">
            {footer.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
