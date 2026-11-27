import { X } from "lucide-react";
import { useState } from "react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { CreatorInfoPanel } from "./CreatorInfoPanel";
import { ProposalConversation } from "./ProposalConversation";

import type { CampaignProposal } from "@/entities/campaign-progress";

type DetailTab = "chat" | "info";

interface ProposalDetailProps {
  proposal: CampaignProposal;
  myName: string;
  isReadOnly: boolean;
  /** PC는 대화·정보 두 열, TAB·MO는 탭. */
  layout: "desktop" | "tablet" | "mobile";
  onClose: () => void;
  onChanged: () => void;
  onPayNow: () => void;
}

// 매칭 상세보기(시안 PC 드로어, TAB·MO 목록을 덮는 전체 화면).
export function ProposalDetail({
  proposal,
  myName,
  isReadOnly,
  layout,
  onClose,
  onChanged,
  onPayNow,
}: ProposalDetailProps) {
  const { t } = useTranslation("features/campaign-matching");
  const [tab, setTab] = useState<DetailTab>("chat");
  const isDesktop = layout === "desktop";

  const conversation = (
    <ProposalConversation
      proposal={proposal}
      myName={myName}
      isReadOnly={isReadOnly}
      isCompact={layout === "mobile"}
      onChanged={onChanged}
      onPayNow={onPayNow}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex h-13.5 shrink-0 items-center justify-between gap-2 py-1.5 pr-1 pl-4 tablet:h-15 tablet:pr-2 tablet:pl-5">
        <h2 className="truncate ds-text-base-none-semibold">
          {t("detail.title")}
        </h2>
        <Button
          variant="ghost-foreground"
          size="icon"
          className="tablet:size-12 tablet:[&_svg:not([class*='size-'])]:size-6"
          aria-label={t("detail.close")}
          onClick={onClose}
        >
          <X />
        </Button>
      </header>
      {isDesktop ? (
        <div className="flex min-h-0 flex-1 gap-4 border-t px-5 pt-4 pb-5">
          {conversation}
          <CreatorInfoPanel
            proposalIdx={proposal.proposalIdx}
            hasHeader
            className="w-69.25 shrink-0"
          />
        </div>
      ) : (
        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value === "info" ? "info" : "chat")}
          className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4 tablet:gap-5 tablet:p-5"
        >
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="chat" className="flex-none">
              {t("detail.tab.chat")}
            </TabsTrigger>
            <TabsTrigger value="info" className="flex-none">
              {t("detail.tab.info")}
            </TabsTrigger>
          </TabsList>
          {/* 탭을 바꿔도 대화 스크롤·입력 중인 메모가 남도록 숨기기만 함. */}
          <TabsContent
            value="chat"
            forceMount
            hidden={tab !== "chat"}
            className="flex min-h-0 flex-1 flex-col"
          >
            {conversation}
          </TabsContent>
          <TabsContent
            value="info"
            forceMount
            hidden={tab !== "info"}
            className="flex min-h-0 flex-1 flex-col"
          >
            <CreatorInfoPanel
              proposalIdx={proposal.proposalIdx}
              hasHeader={false}
              className="flex-1"
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
