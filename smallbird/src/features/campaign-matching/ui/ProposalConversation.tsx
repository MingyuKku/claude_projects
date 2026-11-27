import { Handshake, LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  getDisplayStatus,
  isAwaitingAdvertiser,
  useProposalConversation,
} from "@/entities/campaign-progress";
import { LoadError } from "@/entities/creator";
import { ChatMessage, MessageAlert } from "@/shared/components/chat-message";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { getProposalName } from "../lib/selection";
import { useProposalDecision } from "../lib/use-proposal-decision";
import { useProposalFormat } from "../lib/use-proposal-format";
import { CounterOfferForm } from "./CounterOfferForm";
import { ProposalDecisionDialogs } from "./ProposalDecisionDialogs";
import { ProposalOfferCard } from "./ProposalOfferCard";

import type { CampaignProposal } from "@/entities/campaign-progress";

interface ProposalConversationProps {
  proposal: CampaignProposal;
  /** 내 메시지 이름(광고주 계정 이름). */
  myName: string;
  isReadOnly: boolean;
  /** MO는 작은 카드. */
  isCompact: boolean;
  /** 수락·거절·다시 제안 뒤 목록을 다시 읽음. */
  onChanged: () => void;
  onPayNow: () => void;
}

// 제안·협상 대화. 지난 라운드 카드는 API에 없어(B-25) 지금 라운드 카드 하나만 대화 끝에 둠.
export function ProposalConversation({
  proposal,
  myName,
  isReadOnly,
  isCompact,
  onChanged,
  onPayNow,
}: ProposalConversationProps) {
  const { t } = useTranslation("features/campaign-matching");
  const format = useProposalFormat();
  const { conversation, error, mutate } = useProposalConversation(
    proposal.proposalIdx,
  );
  const decision = useProposalDecision(proposal.proposalIdx, () => {
    void mutate();
    onChanged();
  });
  const [isCounterOpen, setIsCounterOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const messageCount = conversation?.messages.length;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messageCount]);

  const isFromCreator = isAwaitingAdvertiser(proposal);
  const canDecide = isFromCreator && !isReadOnly;
  const creatorName = getProposalName(proposal);
  const offer = conversation?.offer;
  // MO 작은 카드는 버튼 셋이 카드 폭을 나눠 가짐.
  const actionClassName = isCompact ? "flex-1" : "w-20";

  function renderBody() {
    if (error && !conversation) {
      return <LoadError onClickRetry={() => void mutate()} />;
    }
    if (!conversation) {
      return (
        <LoaderCircle
          aria-label={t("detail.loading")}
          className="m-auto size-6 animate-spin text-muted-foreground"
        />
      );
    }
    return (
      <>
        {conversation.messages.map((message) => (
          <ChatMessage
            key={message.key}
            side={message.isMine ? "me" : "other"}
            size="md"
            name={message.isMine ? myName : creatorName}
            avatarSrc={
              message.isMine
                ? undefined
                : (proposal.profileImageUrl ?? undefined)
            }
            message={message.body}
            time={format.formatTime(message.writtenAt)}
          />
        ))}
        {offer && (
          <div
            className={cn(
              "flex",
              isFromCreator ? "justify-start" : "justify-end",
            )}
          >
            <ProposalOfferCard
              offer={offer}
              displayStatus={getDisplayStatus(proposal)}
              size={isCompact ? "sm" : "md"}
              actions={
                canDecide && (
                  <>
                    <Button
                      variant="outline-foreground"
                      size={isCompact ? "sm" : "default"}
                      className={actionClassName}
                      onClick={() => decision.open("reject")}
                    >
                      {t("decision.reject.action")}
                    </Button>
                    <Button
                      variant="outline"
                      size={isCompact ? "sm" : "default"}
                      className={actionClassName}
                      onClick={() => setIsCounterOpen(true)}
                    >
                      {t("counter.action")}
                    </Button>
                    <Button
                      size={isCompact ? "sm" : "default"}
                      className={actionClassName}
                      onClick={() => decision.open("accept")}
                    >
                      {t("decision.accept.action")}
                    </Button>
                  </>
                )
              }
            />
          </div>
        )}
        <div ref={endRef} />
      </>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-muted">
      <ScrollPanel
        className="flex-1"
        contentClassName="flex flex-col gap-3 px-4 pb-4 tablet:gap-4 tablet:px-5 tablet:pb-5"
      >
        <MessageAlert
          status="loading"
          icon={<Handshake aria-hidden className="size-5" />}
          title={t("detail.notice.title")}
          description={t("detail.notice.description")}
          caption={t("detail.notice.caption")}
          className="sticky top-4 z-1 mt-4 tablet:top-5 tablet:mt-5"
        />
        {renderBody()}
      </ScrollPanel>
      {isCounterOpen && offer && canDecide && (
        <div className="shrink-0 px-4 pb-4 tablet:px-5 tablet:pb-5">
          <CounterOfferForm
            currentAmount={offer.amount}
            isSending={decision.isBusy}
            onClose={() => setIsCounterOpen(false)}
            onSubmit={(amount) =>
              void decision.counter(amount).then((isDone) => {
                if (isDone) setIsCounterOpen(false);
              })
            }
          />
        </div>
      )}
      <ProposalDecisionDialogs
        dialog={decision.dialog}
        isBusy={decision.isBusy}
        onAccept={() => void decision.accept()}
        onReject={() => void decision.reject()}
        onPayNow={() => {
          decision.close();
          onPayNow();
        }}
        onClose={decision.close}
      />
    </div>
  );
}
