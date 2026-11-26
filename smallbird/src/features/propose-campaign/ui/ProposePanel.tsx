import { ChevronRight, Mail } from "lucide-react";
import { tryit } from "radash";
import { useState } from "react";
import { toast } from "sonner";

import {
  LoadError,
  CreatorPanel,
  SelectedCreatorSection,
  sendCampaignProposal,
  useCheckedTargets,
  useProposalPanel,
  useCreatorTerms,
} from "@/entities/creator";
import { isApiError } from "@/shared/api";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";

import { EMPTY_PROPOSAL_FORM, toProposalValues } from "../model/proposal-form";
import { GreetingPreview } from "./GreetingPreview";
import { ProposalFields } from "./ProposalFields";
import { ProposeProfile } from "./ProposeProfile";

import type { CreatorViewModel } from "@/entities/creator";

/** 고른 사람 중 같은 캠페인에 이미 제안한 사람이 있음. */
const DUPLICATED_STATUS = 409;

interface ProposePanelProps {
  /** 한 명이면 개별, 여러 명이면 일괄 제안. 처음엔 모두 체크됨. */
  targets: CreatorViewModel[];
  /** TAB부터 일괄 제안은 두 열 한 화면, MO는 크리에이터 → 제안 작성 두 단계. */
  isTabletUp: boolean;
  onClose: () => void;
  onProposed: () => void;
  onClickBookmark: (creator: CreatorViewModel) => void;
}

// 캠페인·금액(공구형은 수수료도)을 채워야 보낼 수 있음.
export function ProposePanel({
  targets,
  isTabletUp,
  onClose,
  onProposed,
  onClickBookmark,
}: ProposePanelProps) {
  const { t } = useTranslation("features/propose-campaign");
  const { term } = useCreatorTerms();
  const { t: tCommon } = useTranslation();
  const { panel, isError, reload } = useProposalPanel(targets);
  const { checkedKeys, checkedTargets, changeChecked } =
    useCheckedTargets(targets);
  const [form, setForm] = useState(EMPTY_PROPOSAL_FORM);
  const [isWriting, setIsWriting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [firstTarget] = targets;
  const isBatch = targets.length > 1;
  const isListVisible = isBatch && (isTabletUp || !isWriting);
  const isFormVisible = !isBatch || isTabletUp || isWriting;
  const values = toProposalValues(form);
  const [firstInfo] = panel?.creators ?? [];

  async function handleClickPropose() {
    if (!values) return;
    setIsSending(true);
    const [error] = await tryit(sendCampaignProposal)({
      ...values,
      targets: checkedTargets,
    });
    setIsSending(false);

    if (error) {
      const isDuplicated =
        isApiError(error) && error.status === DUPLICATED_STATUS;
      toast.error(
        isDuplicated ? t("result.duplicated") : tCommon("error.unexpected"),
      );
      return;
    }
    toast(t("result.sent"));
    onProposed();
  }

  function renderForm() {
    if (isError) {
      return <LoadError onClickRetry={() => void reload()} />;
    }
    if (!panel) {
      return (
        <div role="status" aria-label={tCommon("status.loading")}>
          <Skeleton className="h-60 w-full" />
        </div>
      );
    }
    return (
      <>
        <ProposalFields
          campaigns={panel.campaigns}
          form={form}
          onChangeForm={setForm}
        />
        {firstInfo && (
          <GreetingPreview
            message={firstInfo.greetingMessage}
            nickname={firstInfo.nickname}
            isBatch={isBatch}
          />
        )}
      </>
    );
  }

  return (
    <CreatorPanel
      title={isBatch ? t("title.batch") : term("propose")}
      onClose={onClose}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 ds-gap-5 ds-px-5",
          isBatch ? "ds-pt-5" : "pt-4",
        )}
      >
        {isListVisible && (
          <SelectedCreatorSection
            targets={targets}
            checkedKeys={checkedKeys}
            onChangeChecked={changeChecked}
          />
        )}
        {isFormVisible && (
          // 고른 카드의 바깥 링이 스크롤 영역에 잘리지 않게 링 폭만큼 여백을 둠.
          <ScrollPanel
            className="-m-1 min-w-0 flex-1"
            contentClassName="flex flex-col ds-gap-4 p-1"
          >
            {!isBatch && firstTarget && (
              <ProposeProfile
                creator={firstTarget}
                platformUrl={firstInfo?.platformUrl ?? firstTarget.platformUrl}
                onClickBookmark={() => onClickBookmark(firstTarget)}
              />
            )}
            {renderForm()}
          </ScrollPanel>
        )}
      </div>
      <footer
        className={cn(
          "grid shrink-0 ds-gap-5 ds-p-5",
          isBatch && "desktop:grid-cols-2",
        )}
      >
        {/* PC 일괄 제안은 버튼이 오른쪽 열 폭만 차지함. */}
        {isBatch && <span aria-hidden className="hidden desktop:block" />}
        {isFormVisible ? (
          <Button
            disabled={!values || checkedTargets.length === 0 || isSending}
            onClick={() => void handleClickPropose()}
          >
            <Mail />
            {term("propose")}
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={checkedTargets.length === 0}
            onClick={() => setIsWriting(true)}
          >
            {term("nextStep")}
            <ChevronRight />
          </Button>
        )}
      </footer>
    </CreatorPanel>
  );
}
