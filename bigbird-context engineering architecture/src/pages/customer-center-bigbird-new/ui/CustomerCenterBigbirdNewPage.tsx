import { X } from "lucide-react";
import {
  generatePath,
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
} from "react-router";
import { toast } from "sonner";

import {
  buildSubmittedInquiryViewModel,
  useBigbirdInquiries,
  useInquiryCampaigns,
} from "@/entities/inquiry";
import {
  getCampaignsState,
  NewBigbirdInquiryForm,
  useRegisterBigbirdInquiry,
} from "@/features/new-bigbird-inquiry";
import {
  IS_REALTIME_WRITE_ENABLED,
  useRequestRealtimeConsultation,
} from "@/features/realtime-consultation";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { BigbirdInquiryWorkspace } from "@/widgets/bigbird-inquiry-workspace";

import type { InquiryCampaignViewModel } from "@/entities/inquiry";
import type { SessionViewModel } from "@/entities/session";
import type { NewBigbirdInquiryDraft } from "@/features/new-bigbird-inquiry";

// 문의 남기기(복수 문의) 등록. v2·운영 앱 호환 방안이 확정·검증되기 전이라 보류했으나, 사용자 지시(2026-10-20)로
// 켬. 호환 검증은 아직이라 알려진 위험을 감수한 상태(specs/customer-center/customer-center.md "v2와 동시 운영 및 연동 보류").
// 문제가 생기면 false로 되돌림.
const IS_REGISTRATION_ENABLED = true;

interface SubmittedInquiry {
  campaign: InquiryCampaignViewModel | null;
  body: string;
}

/** 실시간 요청 실패 뒤 "문의 메시지로 남기기"로 넘어올 때 함께 받는 값. */
export interface NewInquiryLocationState {
  campaignIdx: number | null;
}

export function CustomerCenterBigbirdNewPage() {
  const { t } = useTranslation("pages/customer-center-bigbird-new");
  const { t: tCommon } = useTranslation();
  const session = useOutletContext<SessionViewModel>();
  const navigate = useNavigate();
  const location = useLocation();
  const initialCampaignId = (location.state as NewInquiryLocationState | null)
    ?.campaignIdx;
  const { inquiries, isLoading, isError, mutate } = useBigbirdInquiries(
    session.threadUserIdx,
  );
  const {
    campaigns,
    isLoading: isCampaignsLoading,
    isError: isCampaignsError,
    mutate: mutateCampaigns,
  } = useInquiryCampaigns(session.threadUserIdx);
  const campaignsState = getCampaignsState({
    hasData: campaigns !== undefined,
    isLoading: isCampaignsLoading,
    isError: isCampaignsError,
  });
  const { register, isSubmitting } = useRegisterBigbirdInquiry();
  const { request, isRequesting } = useRequestRealtimeConsultation(session);

  // 목록 재조회는 수 초 걸릴 수 있어(stage 실측 9초) 기다리지 않고 바로 이동함. 방금 보낸 내용을 목록에
  // 먼저 넣어 대화가 바로 보이게 하고, 재조회가 끝나면 서버 값으로 바뀜.
  // 일반 문의만 넣음. 실시간 요청은 서버 목록이 올 때까지 대화 화면이 로딩을 보여 줌.
  function goToThread(threadIdx: number, submitted?: SubmittedInquiry) {
    if (!submitted) {
      void mutate();
    } else {
      const created = buildSubmittedInquiryViewModel({
        threadIdx,
        ...submitted,
      });
      void mutate(
        (current) =>
          current?.some((item) => item.threadIdx === threadIdx)
            ? current
            : [created, ...(current ?? [])],
        { revalidate: true },
      );
    }
    void navigate(
      generatePath(ROUTES.customerCenterBigbirdThread, {
        threadIdx: String(threadIdx),
      }),
      { state: { pendingThreadIdx: threadIdx } },
    );
  }

  async function handleSubmit({
    campaignId,
    method,
    body,
    files,
  }: NewBigbirdInquiryDraft) {
    const campaign =
      campaigns?.find((item) => item.campaignIdx === campaignId) ?? null;
    if (method === "realtime") {
      const requested = await request(campaign);
      if (requested.status !== "requested") {
        toast.error(t("requestFailed"));
        return;
      }
      goToThread(requested.threadIdx);
      return;
    }
    const result = await register(campaign, body, files);
    if (result.status !== "registered") {
      toast.error(t(result.status));
      return;
    }
    goToThread(result.threadIdx, { campaign, body });
  }

  return (
    <BigbirdInquiryWorkspace
      inquiries={inquiries}
      isLoading={isLoading}
      isError={isError}
      onClickRefresh={() => void mutate()}
      isPanelOpen
      panelLabel={t("title")}
    >
      <title>{t("title")}</title>
      <header className="flex h-13.25 shrink-0 items-center justify-between border-b px-4 tablet:h-15 tablet:px-5">
        <h2 className="text-base leading-none font-semibold">{t("title")}</h2>
        <Button asChild variant="ghost-foreground" size="icon-sm">
          <Link
            to={ROUTES.customerCenterBigbird}
            aria-label={tCommon("action.close")}
          >
            <X />
          </Link>
        </Button>
      </header>
      <NewBigbirdInquiryForm
        campaigns={(campaigns ?? []).map((campaign) => ({
          id: campaign.campaignIdx,
          name: campaign.name,
          periodLabel: campaign.period ?? undefined,
        }))}
        // 핸들러를 주지 않으면 폼이 문의하기 버튼을 비활성화함.
        onSubmit={
          IS_REGISTRATION_ENABLED || IS_REALTIME_WRITE_ENABLED
            ? (draft) => void handleSubmit(draft)
            : undefined
        }
        campaignsState={campaignsState}
        onClickRetryCampaigns={() => void mutateCampaigns()}
        isSubmitting={isSubmitting || isRequesting}
        isRealtimeAvailable={IS_REALTIME_WRITE_ENABLED}
        // 실시간만 켜고 문의 남기기 등록은 보류인 경우에만 문의 남기기를 막음. 둘 다 꺼져 있으면
        // 기존처럼 입력은 볼 수 있고 제출만 비활성.
        isBoardAvailable={IS_REGISTRATION_ENABLED || !IS_REALTIME_WRITE_ENABLED}
        initialCampaignId={initialCampaignId}
      />
    </BigbirdInquiryWorkspace>
  );
}
