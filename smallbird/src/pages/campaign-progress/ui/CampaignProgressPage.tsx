import { useNavigate, useOutletContext, useParams } from "react-router";

import {
  isUnreadableCampaignError,
  parseCampaignIdx,
  toCampaignProgressStep,
  useCampaignDetail,
  useCampaignStatusReturnStore,
} from "@/entities/campaign";
import { DetailSections } from "@/features/register-campaign";
import { EmptyState } from "@/shared/components/empty-state";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { NotFoundError } from "@/shared/lib";
import { FocusShell } from "@/widgets/app-shell";

import { ProgressMobileHeader } from "./ProgressMobileHeader";
import { ProgressStepNav } from "./ProgressStepNav";

import type { SessionViewModel } from "@/entities/session";

// 캠페인 진행(스펙 campaign/progress §3). 열 수 있는 캠페인·단계인지는 loader가 정하고, 화면은 틀과 단계 내용을 그림.
// 단계 화면은 단계마다 MR로 붙이고, 그 전까지는 준비 중 화면.
export function CampaignProgressPage() {
  const { t } = useTranslation("pages/campaign-progress");
  const { t: tCommon } = useTranslation();
  const params = useParams();
  const campaignIdx = parseCampaignIdx(params.campaignIdx);
  const currentStep = toCampaignProgressStep(params.step);
  const session = useOutletContext<SessionViewModel>();
  const navigate = useNavigate();
  const statusSearch = useCampaignStatusReturnStore((state) => state.search);
  const { detail, error } = useCampaignDetail(campaignIdx, {
    isFilledByLoader: true,
  });

  if (campaignIdx === null) throw new NotFoundError();
  if (error) {
    if (isUnreadableCampaignError(error)) throw new NotFoundError();
    throw error;
  }

  const stepTitle = currentStep
    ? t(`step.${currentStep}`)
    : t("overview.title");

  return (
    <>
      <title>{t("title")}</title>
      <FocusShell
        session={session}
        title={t("title")}
        sidebar={
          detail && (
            <ScrollPanel
              className="h-full border-r bg-muted/40"
              contentClassName="px-4 py-5"
            >
              <ProgressStepNav
                detail={detail}
                currentStep={currentStep}
                size="md"
              />
            </ScrollPanel>
          )
        }
        // "<"는 등록 화면처럼 늘 캠페인 현황으로(마지막에 보던 탭·검색·쪽 유지).
        onBack={() => void navigate(`${ROUTES.campaign}${statusSearch}`)}
      >
        {detail && (
          <div className="flex min-h-0 flex-1 flex-col">
            <ProgressMobileHeader
              detail={detail}
              currentStep={currentStep}
              title={stepTitle}
            />
            {currentStep === null ? (
              <ScrollPanel
                className="flex-1"
                contentClassName="px-4 pb-4 tablet:ds-p-5"
              >
                <section className="flex flex-col ds-gap-4">
                  <h2 className="hidden ds-text-base-none-semibold tablet:block">
                    {stepTitle}
                  </h2>
                  <DetailSections detail={detail} isNumbered={false} />
                </section>
              </ScrollPanel>
            ) : (
              <div className="flex flex-1 items-center justify-center">
                <EmptyState
                  type="construction"
                  title={tCommon("status.comingSoon")}
                />
              </div>
            )}
          </div>
        )}
      </FocusShell>
    </>
  );
}
