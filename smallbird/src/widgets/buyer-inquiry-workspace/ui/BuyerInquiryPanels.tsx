import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { tryit } from "radash";
import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";

import {
  closeBigbirdInquiry,
  useConsultationSync,
  isOtherDeviceError,
  useInquiryUserImage,
  usePurchaserConversation,
} from "@/entities/inquiry";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { ScrollArea } from "@/shared/ui/scroll-area";

import { STATUS_BADGE_VARIANT } from "../lib/format";
import { INQUIRY_MENU, isQnaSource, toInquiryMenu } from "../model/menu";
import {
  getRealtimeInquiryIdx,
  isOpenedByUser,
} from "../model/realtime-inquiry-idx";
import { useAcceptRealtimeOnOpen } from "../model/useAcceptRealtimeOnOpen";
import { BuyerConversation } from "./BuyerConversation";
import { BuyerInquiryDetailPanel } from "./BuyerInquiryDetailPanel";
import { BuyerReplyComposer } from "./BuyerReplyComposer";

import type { BuyerInquiryViewModel } from "@/entities/inquiry";

// Figma Scroll-area Base / Scrollbar는 내용 위에 겹쳐 떠서 폭을 차지하지 않습니다(브라우저 기본 스크롤바는 폭을 줄임).
// Radix 스크롤 영역은 안쪽을 display:table로 감싸 내용 폭만큼 늘어나므로 block으로 두고, 빈 화면 가운데 정렬을 위해 높이를 채웁니다.
const SCROLL_VIEWPORT_FIX =
  "[&_[data-slot=scroll-area-viewport]>div]:block! [&_[data-slot=scroll-area-viewport]>div]:h-full";

interface BuyerInquiryPanelsProps {
  inquiry: BuyerInquiryViewModel;
  /** 상세 패널이 캠페인 이미지·이름을 광고주의 캠페인 목록에서 찾을 때 씀(세션 값). */
  threadUserIdx?: number;
  /** 상담 종료처럼 목록의 상태가 바뀐 뒤 목록을 다시 받을 때 부름. */
  onChangeStatus?: () => void;
}

/** 문의 대화(구매자·인플루언서 문의 스레드, 상품·캠페인 Q&A)와 상세 정보 패널. */
export function BuyerInquiryPanels({
  inquiry,
  threadUserIdx,
  onChangeStatus,
}: BuyerInquiryPanelsProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const panel = searchParams.get("panel");
  const writerName = inquiry.writerName ?? t("unknownWriter");
  // 스레드 문의만 문의자 번호가 있음(Q&A는 null이라 기본 아바타).
  const avatarSrc = useInquiryUserImage(inquiry.threadUserIdx);
  const realtimeInquiryIdx = getRealtimeInquiryIdx(inquiry);
  // 상담 중이면 상담 문서를 구독해 새 메시지·연결·종료를 받고, 이미 연결된 상담은 다시 수락하지 않음.
  const { connection, isOtherDevice } = useConsultationSync(
    inquiry,
    onChangeStatus,
  );
  // 자동 선택으로 열린 첫 행은 수락하지 않고, 사용자가 직접 연 문의만 수락함.
  const { state } = useLocation();
  useAcceptRealtimeOnOpen(
    isOpenedByUser(state) ? realtimeInquiryIdx : null,
    connection,
  );

  function setPanel(value: "detail" | null) {
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
      pathname: INQUIRY_MENU[toInquiryMenu(inquiry.source)].listRoute,
      search: params.toString(),
    });
  }

  const conversation = (
    <section
      aria-label={t("conversation")}
      className={
        panel === "detail"
          ? "hidden tablet:flex tablet:min-w-0 tablet:flex-1 tablet:flex-col tablet:overflow-hidden tablet:rounded-lg tablet:border tablet:border-border"
          : "flex min-w-0 flex-1 flex-col tablet:overflow-hidden tablet:rounded-lg tablet:border tablet:border-border"
      }
    >
      {/* Figma Header / Sub(6756:28990): 배지·아바타·이름은 8px 간격입니다.
          MO(7817:143172)는 두 줄이고 아래 줄에 상세 정보 버튼이 전체 폭으로 놓입니다. */}
      <header className="flex shrink-0 flex-col gap-2 border-b border-border px-4 pt-2 pb-3 tablet:h-15 tablet:flex-row tablet:items-center tablet:px-5 tablet:py-0">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Button
            variant="outline-foreground"
            size="icon-sm"
            className="desktop:hidden"
            aria-label={t("backToList")}
            onClick={goToList}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Badge variant={STATUS_BADGE_VARIANT[inquiry.status]}>
            {t(`status.${inquiry.status}`)}
          </Badge>
          <Avatar size="md">
            {avatarSrc && <AvatarImage src={avatarSrc} alt="" />}
            <AvatarPlaceholder />
          </Avatar>
          <strong className="-my-0.5 min-w-0 flex-1 truncate py-0.5 text-base leading-none font-semibold">
            {writerName}
          </strong>
          {realtimeInquiryIdx !== null && (
            <RealtimeFinishButton
              inquiry={inquiry}
              inquiryIdx={realtimeInquiryIdx}
              onFinished={onChangeStatus}
            />
          )}
        </div>
        <Button
          variant="outline-foreground"
          size="sm"
          className="tablet:hidden"
          onClick={() => setPanel("detail")}
        >
          {t("detail")} <ChevronRight className="size-4" />
        </Button>
      </header>
      {/* Figma Conversation Area: MO 16px(7817:143173), TAB·PC 20px. */}
      <ScrollArea
        className={cn("min-h-0 flex-1 bg-muted", SCROLL_VIEWPORT_FIX)}
      >
        <div className="flex min-h-full flex-col p-4 tablet:p-5">
          <BuyerConversation inquiry={inquiry} isOtherDevice={isOtherDevice} />
        </div>
      </ScrollArea>
      {/* Q&A는 답변 입력이 대화 안에 있습니다. */}
      {/* key로 문의마다 입력 중인 글·첨부를 분리함. 없으면 A에 쓰던 내용이 B로 오발송될 수 있음. */}
      {!isQnaSource(inquiry.source) && (
        <BuyerReplyComposer key={inquiry.key} inquiry={inquiry} />
      )}
    </section>
  );

  const side = (
    <section
      aria-label={t("detail")}
      className={
        panel === "detail"
          ? "flex min-h-0 min-w-0 flex-1 flex-col tablet:w-69.25 tablet:flex-none tablet:overflow-hidden tablet:rounded-lg tablet:border tablet:border-border"
          : "hidden min-h-0 tablet:flex tablet:w-69.25 tablet:flex-none tablet:flex-col tablet:overflow-hidden tablet:rounded-lg tablet:border tablet:border-border"
      }
    >
      {/* Figma Header / Sub / Mobile(6791:67083): MO는 높이 53, 왼쪽 16·오른쪽 4, 닫기 버튼 40입니다. */}
      <header className="flex h-13.25 shrink-0 items-center justify-between border-b border-border pr-1 pl-4 tablet:h-15 tablet:px-5">
        <h2 className="text-base leading-none font-semibold">{t("detail")}</h2>
        {panel === "detail" && (
          <Button
            variant="ghost-foreground"
            size="icon"
            className="tablet:hidden"
            aria-label={t("closeDetail")}
            onClick={() => setPanel(null)}
          >
            <X className="size-4" />
          </Button>
        )}
      </header>
      <ScrollArea className={cn("min-h-0 flex-1", SCROLL_VIEWPORT_FIX)}>
        <div className="flex min-h-full flex-col">
          <BuyerInquiryDetailPanel
            inquiry={inquiry}
            threadUserIdx={threadUserIdx}
          />
        </div>
      </ScrollArea>
    </section>
  );

  return (
    // Figma(5202:105724): 대화와 상세 정보는 20px 떨어진 별도 박스(상세 277px)입니다.
    <div className="flex h-full min-h-0 min-w-0 flex-1 tablet:gap-5">
      {conversation}
      {side}
    </div>
  );
}

/**
 * 진행 중인 구매자·인플루언서 실시간 상담의 종료 버튼(`PUT /v3/help/thread/{threadIdx}`, 가이드 2026-11-03).
 * 문의 번호가 스레드 번호와 같음. 시간 초과 종료는 백엔드 스케줄러가 하므로 프론트 타이머는 없음.
 */
function RealtimeFinishButton({
  inquiry,
  inquiryIdx,
  onFinished,
}: {
  inquiry: BuyerInquiryViewModel;
  /** 진행 중인 실시간 상담의 문의 번호(getRealtimeInquiryIdx). */
  inquiryIdx: number;
  onFinished?: () => void;
}) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { mutate } = usePurchaserConversation(inquiry);
  const [isFinishing, setIsFinishing] = useState(false);

  async function handleClickFinish() {
    setIsFinishing(true);
    const [error] = await tryit(closeBigbirdInquiry)(inquiryIdx);
    setIsFinishing(false);
    if (error) {
      console.error("구매자 실시간 상담 종료 실패", error);
      toast.error(
        t(
          isOtherDeviceError(error)
            ? "realtime.otherDevice"
            : "realtime.endFailed",
        ),
      );
      return;
    }
    void mutate();
    onFinished?.();
  }

  return (
    <Button
      variant="outline-foreground"
      size="sm"
      disabled={isFinishing}
      onClick={() => void handleClickFinish()}
    >
      {t("realtime.end")}
    </Button>
  );
}
