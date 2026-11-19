import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router";

import { getCampaignRegisterPath } from "@/entities/campaign";
import { SubHeader } from "@/shared/components/app-header";
import { formatNumber, useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";

import { useApprovalActions } from "../../model/use-approval-actions";
import { DemoNotice } from "./DemoNotice";
import { DetailSections } from "./DetailSections";
import { DevReviewTools } from "./DevReviewTools";

import type { CampaignDetail, CampaignStage } from "@/entities/campaign";

interface CampaignDetailContentProps {
  detail: CampaignDetail;
  /** Sub ID는 조회만 함(승인 요청 취소·재승인 요청·수정 버튼을 숨김). */
  canManage: boolean;
  /** 데모일 때 PICK형 구독 여부(안내 문구·버튼을 정함). 아직 모르면 null. */
  isPickSubscribed?: boolean | null;
}

type BannerStage = Extract<
  CampaignStage,
  "REVIEWING" | "REJECTED" | "IN_PROGRESS"
>;

const BANNER_STYLES: Record<
  BannerStage,
  {
    icon: typeof Info;
    className: string;
    key: "reviewing" | "rejected" | "approved";
  }
> = {
  REVIEWING: { icon: Info, className: "text-primary", key: "reviewing" },
  REJECTED: {
    icon: TriangleAlert,
    className: "text-destructive",
    key: "rejected",
  },
  IN_PROGRESS: {
    icon: CircleCheck,
    className: "text-primary",
    key: "approved",
  },
};

function isBannerStage(stage: CampaignStage | null): stage is BannerStage {
  return (
    stage === "REVIEWING" || stage === "REJECTED" || stage === "IN_PROGRESS"
  );
}

export function CampaignDetailContent({
  detail,
  canManage,
  isPickSubscribed = null,
}: CampaignDetailContentProps) {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const actions = useApprovalActions(detail.campaignIdx);

  const stage = isBannerStage(detail.stage) ? detail.stage : null;
  const banner = stage ? BANNER_STYLES[stage] : null;
  const canCancel =
    canManage && (stage === "REVIEWING" || stage === "REJECTED");
  const isRejected = stage === "REJECTED";
  const BannerIcon = banner?.icon;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 조회 화면이라 시안의 "임시저장"을 그리지 않음. */}
      <SubHeader
        variant="list"
        className="tablet:hidden"
        title={<h2 className="truncate">{t("detail.title")}</h2>}
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 tablet:ds-p-5">
        <section className="flex flex-col ds-gap-4">
          <h2 className="hidden ds-text-base-none-semibold tablet:block">
            {t("detail.title")}
          </h2>
          {detail.isDemo && (
            <DemoNotice
              campaignIdx={detail.campaignIdx}
              isSubscribed={isPickSubscribed}
              canManage={canManage}
            />
          )}
          {!detail.isDemo && banner && BannerIcon && (
            <div className="flex flex-wrap items-end justify-end gap-3 rounded-lg border bg-background ds-p-6">
              <div className="flex min-w-65.5 flex-1 flex-col gap-2">
                <p
                  className={cn(
                    "flex items-center gap-2 ds-text-lg-7-semibold ko:break-keep",
                    banner.className,
                  )}
                >
                  <BannerIcon aria-hidden className="size-5 shrink-0" />
                  {t(`detail.banner.${banner.key}.title`)}
                </p>
                <p className="ds-text-sm-5-normal ko:break-keep">
                  {t(`detail.banner.${banner.key}.description`)}
                </p>
              </div>
              {canCancel && (
                <Button
                  variant={isRejected ? "outline-foreground" : "default"}
                  disabled={actions.isRequesting}
                  onClick={actions.openCancelConfirm}
                >
                  {t("detail.cancelApproval")}
                </Button>
              )}
            </div>
          )}
          {isRejected && detail.rejectReason && (
            <p className="flex items-start gap-1.5 rounded-lg border bg-muted/40 ds-p-5 ds-text-sm-5-normal text-muted-foreground">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              <span className="whitespace-pre-line">{detail.rejectReason}</span>
            </p>
          )}
          <DetailSections
            detail={detail}
            onEditStep={
              isRejected && canManage
                ? (step) =>
                    void navigate(
                      getCampaignRegisterPath(detail.campaignIdx, step),
                    )
                : undefined
            }
          />
          {import.meta.env.DEV && stage === "REVIEWING" && (
            <DevReviewTools campaignIdx={detail.campaignIdx} />
          )}
        </section>
      </div>
      {isRejected && canManage && (
        <div className="flex shrink-0 justify-end bg-background p-4 tablet:p-5">
          <Button
            className="flex-1 tablet:flex-none"
            disabled={actions.isRequesting}
            onClick={() => void actions.requestReapproval(detail.draft.policy)}
          >
            {t("detail.requestReapproval")}
          </Button>
        </div>
      )}

      <AlertDialog
        open={actions.dialog?.type === "cancelConfirm"}
        onOpenChange={(isOpen) => !isOpen && actions.closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("detail.dialog.cancel.title")}
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {t("detail.dialog.cancel.description", {
                amount: formatNumber(detail.payment?.paidAmount ?? 0),
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              destructive
              disabled={actions.isRequesting}
              onClick={(event) => {
                // 환불하는 동안 알럿을 열어 두고, 끝나면 닫음.
                event.preventDefault();
                void actions.cancelApproval();
              }}
            >
              {t("detail.dialog.cancel.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={
          actions.dialog?.type === "reapprovalRequested" ||
          actions.dialog?.type === "reapprovalRequired"
        }
        onOpenChange={(isOpen) => !isOpen && actions.confirmDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                actions.dialog?.type === "reapprovalRequired"
                  ? "dialog.requiredInfo.title"
                  : "detail.dialog.reapproval.title",
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                actions.dialog?.type === "reapprovalRequired"
                  ? "dialog.requiredInfo.description"
                  : "detail.dialog.reapproval.description",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={actions.confirmDialog}>
              {tCommon("action.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
