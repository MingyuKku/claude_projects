import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

import { useInquiryUserImage } from "@/entities/inquiry";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";

import { BuyerConversation } from "./BuyerConversation";
import { BuyerHistoryPanel } from "./BuyerHistoryPanel";
import { BuyerInquiryDetailPanel } from "./BuyerInquiryDetailPanel";
import { BuyerReplyComposer } from "./BuyerReplyComposer";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

interface BuyerInquiryPanelsProps {
  inquiry: BuyerInquiryViewModel;
  /** 상세 패널이 캠페인 이미지·이름을 광고주의 캠페인 목록에서 찾을 때 씀(세션 값). */
  threadUserIdx?: number;
}

/** 구매자 문의 대화(구매자 문의 스레드·상품 Q&A)와 상세 정보·상담 기록 패널. */
export function BuyerInquiryPanels({
  inquiry,
  threadUserIdx,
}: BuyerInquiryPanelsProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const panel = searchParams.get("panel");
  const writerName = inquiry.writerName ?? t("unknownWriter");
  // 구매자 문의만 문의자 번호가 있음(상품 Q&A는 null이라 기본 아바타).
  const avatarSrc = useInquiryUserImage(inquiry.threadUserIdx);

  function setPanel(value: "detail" | "history" | null) {
    setSearchParams((params) => {
      if (value) params.set("panel", value);
      else params.delete("panel");
      return params;
    });
  }

  function goToList() {
    const params = new URLSearchParams(searchParams);
    params.delete("panel");
    void navigate({
      pathname: ROUTES.customerCenterBuyer,
      search: params.toString(),
    });
  }

  const conversation = (
    <section
      aria-label={t("conversation")}
      className={
        panel === "detail" || panel === "history"
          ? "hidden tablet:flex tablet:min-w-0 tablet:flex-1 tablet:flex-col"
          : "flex min-w-0 flex-1 flex-col"
      }
    >
      <header className="flex h-15 shrink-0 items-center gap-3 border-b border-border px-4 tablet:px-5">
        <Button
          variant="outline-foreground"
          size="icon-sm"
          className="tablet:hidden"
          aria-label={t("backToList")}
          onClick={goToList}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <Badge variant={inquiry.status === "waiting" ? "blue" : "gray"}>
          {t(`status.${inquiry.status}`)}
        </Badge>
        <Avatar size="md">
          {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
          <AvatarPlaceholder />
        </Avatar>
        <strong className="min-w-0 flex-1 truncate text-base font-semibold">
          {writerName}
        </strong>
        <Button
          variant="outline-foreground"
          size="sm"
          onClick={() => setPanel("history")}
        >
          {t("history")} <ChevronRight className="size-4" />
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-muted p-5">
        <BuyerConversation inquiry={inquiry} />
      </div>
      {/* 상품 Q&A는 답변 입력이 대화 안에 있음. */}
      {/* key로 문의마다 입력 중인 글·첨부를 분리함. 없으면 A에 쓰던 내용이 B로 오발송될 수 있음. */}
      {inquiry.source === "purchaser" && (
        <BuyerReplyComposer key={inquiry.key} inquiry={inquiry} />
      )}
      <Button
        variant="outline-foreground"
        size="sm"
        className="mx-4 mb-4 tablet:hidden"
        onClick={() => setPanel("detail")}
      >
        {t("detail")}
      </Button>
    </section>
  );

  const side =
    panel === "history" ? (
      <section
        aria-label={t("history")}
        className="flex min-h-0 min-w-0 flex-1 flex-col bg-muted tablet:w-69 tablet:flex-none tablet:border-l tablet:border-border"
      >
        <header className="flex h-15 shrink-0 items-center justify-between border-b border-border bg-background px-5">
          <h2 className="text-base font-semibold">{t("history")}</h2>
          <Button
            variant="ghost-foreground"
            size="icon-sm"
            aria-label={t("closeHistory")}
            onClick={() => setPanel(null)}
          >
            <X className="size-4" />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
          <BuyerHistoryPanel inquiry={inquiry} threadUserIdx={threadUserIdx} />
        </div>
      </section>
    ) : (
      <section
        aria-label={t("detail")}
        className={
          panel === "detail"
            ? "flex min-h-0 min-w-0 flex-1 flex-col tablet:w-69 tablet:flex-none tablet:border-l tablet:border-border"
            : "hidden min-h-0 tablet:flex tablet:w-69 tablet:flex-none tablet:flex-col tablet:border-l tablet:border-border"
        }
      >
        <header className="flex h-15 shrink-0 items-center justify-between border-b border-border px-5">
          <h2 className="text-base font-semibold">{t("detail")}</h2>
          {panel === "detail" && (
            <Button
              variant="ghost-foreground"
              size="icon-sm"
              className="tablet:hidden"
              aria-label={t("closeDetail")}
              onClick={() => setPanel(null)}
            >
              <X className="size-4" />
            </Button>
          )}
        </header>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <BuyerInquiryDetailPanel
            inquiry={inquiry}
            threadUserIdx={threadUserIdx}
          />
        </div>
      </section>
    );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1">
      {conversation}
      {side}
    </div>
  );
}
