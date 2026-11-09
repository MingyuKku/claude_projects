import {
  generatePath,
  Navigate,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from "react-router";

import { useInitialCampaignDraft } from "@/entities/campaign";
import { ChargeInline } from "@/features/charge-bigbird-money";
import {
  CampaignRegisterProvider,
  CampaignRegisterWizard,
  CampaignStepSidebar,
  findFirstIncompleteStep,
  isStepSlug,
  parseServiceTypeParam,
  STEP_PARAM,
  useCreateCampaignDraft,
} from "@/features/register-campaign";
import { isApiError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { NotFoundError } from "@/shared/lib";
import { Spinner } from "@/shared/ui/spinner";
import { FocusShell } from "@/widgets/app-shell";

import { resolveRegisterEntry } from "../model/entry";
import { usePaymentReturn } from "../model/use-payment-return";
import { PaymentRequestedDialog } from "./PaymentRequestedDialog";

import type { SessionViewModel } from "@/entities/session";
import type { ReactNode } from "react";

const TYPE_PARAM = "type";
const FIRST_STEP = "campaign-info";

function toRegisterPath(campaignId: number, step: string) {
  return `${generatePath(ROUTES.campaignRegisterDraft, { campaignId: String(campaignId) })}?${STEP_PARAM}=${step}`;
}

function toDetailPath(campaignId: number) {
  return generatePath(ROUTES.campaignDetail, {
    campaignId: String(campaignId),
  });
}

// 라우트 하나가 두 주소를 맡음: 새로 만들기(`/campaign/register?type=`)와 작성(`/campaign/register/:campaignId?step=`).
// 셸(LNB 없는 뒤로가기 헤더 + 단계 사이드바)은 작성 화면에서만 그림. 로그인과 Sub ID 차단은 라우트의 세션 middleware가 끝냄.
export function CampaignRegisterPage() {
  const { campaignId } = useParams();

  return campaignId === undefined ? (
    <NewCampaign />
  ) : (
    <ExistingCampaign campaignId={campaignId} />
  );
}

// `?type=pick|recruit`로 들어오면 서버가 등록 중 캠페인을 만들고, 주소를 그 캠페인의 작성 주소로 바꿈(기록을 남기지 않음).
// `type`이 없거나 잘못되면 not-found.
function NewCampaign() {
  const [searchParams] = useSearchParams();
  const serviceType = parseServiceTypeParam(searchParams.get(TYPE_PARAM));
  if (!serviceType) throw new NotFoundError();

  return <CreateCampaign serviceType={serviceType} />;
}

function CreateCampaign({
  serviceType,
}: {
  serviceType: NonNullable<ReturnType<typeof parseServiceTypeParam>>;
}) {
  const { campaignIdx, error } = useCreateCampaignDraft(serviceType);
  if (error) throw error;
  if (campaignIdx !== null) {
    return <Navigate to={toRegisterPath(campaignIdx, FIRST_STEP)} replace />;
  }
  return <LoadingScreen />;
}

function ExistingCampaign({ campaignId }: { campaignId: string }) {
  const id = /^\d+$/.test(campaignId) ? Number(campaignId) : null;
  if (id === null) throw new NotFoundError();

  return <RegisterDraft campaignId={id} />;
}

function RegisterDraft({ campaignId }: { campaignId: number }) {
  const { t } = useTranslation("pages/campaign-register");
  const session = useOutletContext<SessionViewModel>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { draft, error } = useInitialCampaignDraft(campaignId);
  const { isReturned, isRequested, closeAlert } = usePaymentReturn();

  // 결제창에서 돌아오면(결제 서버가 붙인 `?isPaid=…`) 8단계로 열고 결제 서버가 붙인 쿼리를 모두 지움.
  if (isReturned) {
    return <Navigate to={toRegisterPath(campaignId, "payment")} replace />;
  }
  if (error) {
    // 없는 캠페인(남의 캠페인 포함)은 not-found, 그 밖의 실패는 라우트 오류 화면(다시 시도)이 받음.
    throw isApiError(error) && error.status === 404
      ? new NotFoundError()
      : error;
  }
  if (!draft) return <LoadingScreen />;

  const step = searchParams.get(STEP_PARAM);
  if (resolveRegisterEntry(draft.status, isStepSlug(step)) === "detail") {
    return <Navigate to={toDetailPath(campaignId)} replace />;
  }
  // `step`이 없거나 잘못됐으면 아직 완료하지 않은 첫 단계로 바로잡음(기록을 남기지 않음).
  if (!isStepSlug(step)) {
    const first = findFirstIncompleteStep(draft)?.slug ?? FIRST_STEP;
    return <Navigate to={toRegisterPath(campaignId, first)} replace />;
  }

  // "<"는 브라우저 뒤로가기이고, 앱 안에서 쌓인 기록이 없으면(주소로 바로 들어옴) 홈으로 감.
  function handleBack() {
    if (location.key === "default") {
      void navigate(ROUTES.main, { replace: true });
      return;
    }
    void navigate(-1);
  }

  return (
    <CampaignRegisterProvider
      campaignId={campaignId}
      fallback={<LoadingScreen />}
    >
      <title>{t("title")}</title>
      <FocusShell
        session={session}
        title={t("title")}
        onBack={handleBack}
        mainClassName="flex flex-col overflow-hidden p-0"
        sidebar={
          <div className="h-full overflow-y-auto border-r bg-muted/40 px-4 py-5">
            <CampaignStepSidebar />
          </div>
        }
      >
        <CampaignRegisterWizard
          chargeSlot={
            <ChargeInline
              returnPath={generatePath(ROUTES.campaignRegisterDraft, {
                campaignId: String(campaignId),
              })}
            />
          }
        />
      </FocusShell>
      <PaymentRequestedDialog open={isRequested} onConfirm={closeAlert} />
    </CampaignRegisterProvider>
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
