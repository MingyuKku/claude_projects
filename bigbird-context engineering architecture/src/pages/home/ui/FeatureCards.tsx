import { MainCard } from "@/shared/components/cards";
import { ROUTES } from "@/shared/config/routes";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { cn } from "@/shared/lib/utils";

import { useTapNavigate } from "../lib/use-tap-navigate";
import { MOBILE_QUERY } from "../model/constants";

// to가 없는 카드는 갈 화면이 아직 없어 비활성. 시안의 기본 모습은 유지하고 클릭만 막으며, 화면이 연결될 때 to를 채움.
const CARDS = [
  { key: "recommend", to: ROUTES.influencerSearch },
  { key: "campaign" },
  { key: "pricing" },
] as const;

interface LinkCardProps {
  to: string;
  size: "default" | "mobile";
  title: string;
  description: string;
}

function LinkCard({ to, ...props }: LinkCardProps) {
  const tapHandlers = useTapNavigate(to);

  return (
    <MainCard
      {...props}
      {...tapHandlers}
      className="tablet:min-w-0 tablet:flex-1"
    />
  );
}

interface FeatureCardsProps {
  className?: string;
}

// 카드 3개. 인플루언서 추천은 비로그인도 이동하고, 나머지는 대상 화면이 생길 때까지 비활성.
export function FeatureCards({ className }: FeatureCardsProps) {
  const { t } = useTranslation("pages/home");
  const isMobile = useMediaQuery(MOBILE_QUERY);

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-start justify-center gap-2 tablet:flex-nowrap tablet:items-stretch tablet:gap-4",
        className,
      )}
    >
      {CARDS.map((card) => {
        const { key } = card;
        const to = "to" in card ? card.to : undefined;
        if (!to) {
          return (
            // MainCard의 title은 카드 제목이라 툴팁(title 속성)은 감싸는 요소에 둠.
            <span key={key} title={t("card.comingSoon")} className="contents">
              <MainCard
                size={isMobile ? "mobile" : "default"}
                title={t(`card.${key}.title`)}
                description={t(`card.${key}.description`)}
                aria-disabled="true"
                className="cursor-not-allowed hover:bg-blue-50 tablet:min-w-0 tablet:flex-1"
              />
            </span>
          );
        }
        return (
          <LinkCard
            key={key}
            to={to}
            size={isMobile ? "mobile" : "default"}
            title={t(`card.${key}.title`)}
            description={t(`card.${key}.description`)}
          />
        );
      })}
    </div>
  );
}
