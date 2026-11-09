import {
  generatePath,
  Navigate,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router";

import {
  CampaignSummarySections,
  isCampaignSection,
  summarySectionId,
  useCampaign,
} from "@/entities/campaign";
import {
  ApprovalBanner,
  CancelApprovalButton,
  ReapprovalButton,
  TestReviewButtons,
} from "@/features/manage-campaign-approval";
import {
  isSectionLockedInEdit,
  toStepSlug,
} from "@/features/register-campaign";
import { isApiError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { NotFoundError } from "@/shared/lib";
import { Spinner } from "@/shared/ui/spinner";
import { FocusShell } from "@/widgets/app-shell";

import {
  CampaignDetailMobileHeader,
  CampaignDetailSidebar,
} from "./CampaignDetailNav";

import type { CampaignSection } from "@/entities/campaign";
import type { SessionViewModel } from "@/entities/session";
import type { ReactNode } from "react";

// 등록 내역(기본 정보) `/campaign/:campaignId`. 작업 전용 셸(뒤로가기 헤더 + 사이드바)에 섹션 카드 8개를 보임.
// 사이드바는 맨 위 "기본정보"(현재)와 8단계(모두 완료 표시)이고, 항목을 누르면 그 섹션으로 스크롤함.
// 등록 중(결제 전) 캠페인은 작성 화면으로 보냄. 할당되지 않은 Sub ID 등 서버가 막으면(403) 홈으로 보냄.
export function CampaignDetailPage() {
  const { campaignId } = useParams();
  const id =
    campaignId !== undefined && /^\d+$/.test(campaignId)
      ? Number(campaignId)
      : null;
  if (id === null) throw new NotFoundError();

  return <CampaignDetail campaignId={id} />;
}

function CampaignDetail({ campaignId }: { campaignId: number }) {
  const { t } = useTranslation("pages/campaign-detail");
  const session = useOutletContext<SessionViewModel>();
  const navigate = useNavigate();
  const { campaign, error } = useCampaign(campaignId);
  // 할당받은 Sub ID는 조회만 하고 취소·재승인 버튼은 숨김(스펙 P-20 답 전까지).
  const canManage = session.authority !== "SUB";

  if (error) {
    if (isApiError(error) && error.status === 403) {
      return <Navigate to={ROUTES.main} replace />;
    }
    throw isApiError(error) && error.status === 404
      ? new NotFoundError()
      : error;
  }
  if (!campaign) return <LoadingScreen />;
  if (campaign.status === "DRAFT") {
    return (
      <Navigate
        to={generatePath(ROUTES.campaignRegisterDraft, {
          campaignId: String(campaignId),
        })}
        replace
      />
    );
  }

  // 반려된 섹션 중 고칠 수 있는 것만 "수정"을 보임(잠긴 4·7·8번은 사유만, Sub ID는 조회만).
  const editableSections =
    canManage && campaign.status === "REJECTED"
      ? campaign.rejections
          .map((rejection) => rejection.section)
          .filter(isCampaignSection)
          .filter((section) => !isSectionLockedInEdit(section))
      : [];

  function handleEdit(section: CampaignSection) {
    const slug = toStepSlug(section);
    if (!slug) return;
    void navigate(
      `${generatePath(ROUTES.campaignRegisterDraft, {
        campaignId: String(campaignId),
      })}?step=${slug}`,
    );
  }

  function handleSelectSection(sectionNumber: number) {
    document
      .getElementById(summarySectionId(sectionNumber))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <title>{t("title")}</title>
      <FocusShell
        session={session}
        title={t("title")}
        onBack={() => void navigate(ROUTES.main)}
        mainClassName="flex flex-col overflow-hidden p-0"
        sidebar={
          <div className="h-full overflow-y-auto border-r bg-muted/40 px-4 py-5">
            <CampaignDetailSidebar onSelectSection={handleSelectSection} />
          </div>
        }
      >
        <CampaignDetailMobileHeader onSelectSection={handleSelectSection} />
        <div className="min-h-0 flex-1 overflow-y-auto p-4 tablet:p-5">
          <div className="flex flex-col gap-4">
            <h2 className="text-base leading-none font-semibold text-foreground">
              {t("heading")}
            </h2>
            <ApprovalBanner
              campaign={campaign}
              action={
                canManage &&
                (campaign.status === "REVIEWING" ||
                  campaign.status === "RE_REVIEWING") && (
                  <CancelApprovalButton campaign={campaign} />
                )
              }
            />
            {import.meta.env.DEV && <TestReviewButtons campaign={campaign} />}
            <CampaignSummarySections
              campaign={campaign}
              editableSections={editableSections}
              onEdit={handleEdit}
            />
          </div>
        </div>
        {/* 반려 상태의 "재승인 요청"은 시안처럼 하단에 고정함. 시안의 "임시저장"은 저장할 입력이 없어 그리지 않음(스펙 D-10). */}
        {canManage && campaign.status === "REJECTED" && (
          <div className="flex shrink-0 justify-end p-4 tablet:p-5">
            <ReapprovalButton campaign={campaign} />
          </div>
        )}
      </FocusShell>
    </>
  );
}

function LoadingScreen(): ReactNode {
  const { t } = useTranslation();
  return (
    <div className="flex h-dvh items-center justify-center">
      <Spinner
        aria-label={t("status.loading")}
        className="size-6 text-primary"
      />
    </div>
  );
}
