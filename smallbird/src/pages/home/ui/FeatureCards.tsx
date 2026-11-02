import { useState } from "react";
import { useNavigate } from "react-router";

import { useSession } from "@/entities/session";
import { MainCard } from "@/shared/components/cards";
import { LoginRequiredAlert } from "@/shared/components/login-required-alert";
import { MEDIA_QUERY } from "@/shared/config";
import { ROUTES } from "@/shared/config/routes";
import { useTranslation } from "@/shared/i18n";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { cn } from "@/shared/lib/utils";

import { useTapAction } from "../lib/use-tap-action";

// to가 없는 카드는 갈 화면이 아직 없어 비활성. 시안의 기본 모습은 유지하고 클릭만 막으며, 화면이 연결될 때 to를 채움.
// isLoginRequired 카드는 비로그인이 누르면 로그인 안내 알럿을 띄움(디자인팀 QA 2026-10-28).
const CARDS = [
  { key: "recommend", to: ROUTES.influencerSearch, isLoginRequired: true },
  { key: "campaign", isLoginRequired: true },
  { key: "pricing" },
] as const;

interface TapCardProps {
  onTap: () => void;
  size: "default" | "mobile";
  title: string;
  description: string;
}

function TapCard({ onTap, ...props }: TapCardProps) {
  const tapHandlers = useTapAction(onTap);

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

// 카드 3개. 인플루언서 추천은 로그인하면 이동하고, 캠페인 등록/운영·요금 안내는 대상 화면이 생길 때까지 비활성.
// 인플루언서 추천·캠페인 등록/운영은 비로그인이 누르면 로그인 안내 알럿을 띄움.
export function FeatureCards({ className }: FeatureCardsProps) {
  const { t } = useTranslation("pages/home");
  const isMobile = useMediaQuery(MEDIA_QUERY.mobile);
  const navigate = useNavigate();
  const { session, isLoading } = useSession(ROUTES.main);
  const [isLoginAlertOpen, setIsLoginAlertOpen] = useState(false);
  // 세션을 확인하는 동안에는 비로그인으로 단정하지 않음(로그인한 사용자에게 알럿이 뜨지 않게). 확인이 끝나 401·오류·권한 거부면 비로그인.
  const isGuest = !isLoading && session?.isAllowed !== true;

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
        const isLoginRequired = "isLoginRequired" in card;
        if (isLoginRequired && isGuest) {
          return (
            <TapCard
              key={key}
              onTap={() => setIsLoginAlertOpen(true)}
              size={isMobile ? "mobile" : "default"}
              title={t(`card.${key}.title`)}
              description={t(`card.${key}.description`)}
            />
          );
        }
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
          <TapCard
            key={key}
            onTap={() => void navigate(to)}
            size={isMobile ? "mobile" : "default"}
            title={t(`card.${key}.title`)}
            description={t(`card.${key}.description`)}
          />
        );
      })}
      <LoginRequiredAlert
        open={isLoginAlertOpen}
        onCancel={() => setIsLoginAlertOpen(false)}
        onLogin={() => {
          setIsLoginAlertOpen(false);
          void navigate(ROUTES.login);
        }}
      />
    </div>
  );
}
