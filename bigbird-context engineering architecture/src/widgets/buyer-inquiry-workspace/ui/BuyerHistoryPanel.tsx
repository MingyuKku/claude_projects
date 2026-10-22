import { LoaderCircle } from "lucide-react";
import { tryit } from "radash";
import { toast } from "sonner";

import {
  ConversationFiles,
  groupAttachments,
  useInquiryCampaigns,
  useInquiryUserImage,
  usePurchaserConversation,
} from "@/entities/inquiry";
import {
  ChatCodeCard,
  ChatDivider,
  ChatMessage,
} from "@/shared/components/chat-message";
import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";

import { formatDividerDate, formatMessageTime } from "../lib/format";

import type {
  BigbirdInquiryViewModel,
  BuyerInquiryViewModel,
} from "@/entities/inquiry";

interface BuyerHistoryPanelProps {
  inquiry: BuyerInquiryViewModel;
  /** 캠페인 카드의 이미지·이름을 광고주의 캠페인 목록에서 찾을 때 씀(세션 값). */
  threadUserIdx?: number;
}

// Figma 상담 기록(PC 6766:48765): 같은 구매자와의 과거 상담을 스레드(상담)별로 날짜 → 캠페인 카드 → 대화 순서로 보여 줌.
// 대화 조회와 같은 요청(`GET /v3/help/thread?type=client`)이라 별도 API 없이 SWR 캐시를 함께 씀.
// 시안의 캠페인 유형("PICK형")은 캠페인 목록 응답에 없어 생략하고, 이름·브랜드·진행기간·코드를 보여 줌.
export function BuyerHistoryPanel({
  inquiry,
  threadUserIdx,
}: BuyerHistoryPanelProps) {
  const { t } = useTranslation("widgets/buyer-inquiry-workspace");
  const { t: tCommon } = useTranslation();
  const { threads, isLoading, isError } = usePurchaserConversation(inquiry);
  const { campaigns } = useInquiryCampaigns(threadUserIdx);
  const avatarSrc = useInquiryUserImage(inquiry.threadUserIdx);
  const writerName = inquiry.writerName ?? t("unknownWriter");

  async function handleClickCopy(code: string) {
    const [error] = await tryit(() => navigator.clipboard.writeText(code))();
    if (error) {
      console.error("캠페인 코드 복사 실패", error);
      toast.error(t("copyFailed"));
      return;
    }
    toast.success(t("copied"));
  }

  if (isLoading) {
    return (
      <LoaderCircle
        role="status"
        aria-label={tCommon("status.loading")}
        className="m-auto size-6 animate-spin text-muted-foreground"
      />
    );
  }
  if (isError) {
    return (
      <EmptyState
        type="no-message"
        title={t("conversationError")}
        className="flex-1"
      />
    );
  }
  if (!threads || threads.length === 0) {
    return (
      <EmptyState
        type="no-message"
        title={t("historyEmpty")}
        className="flex-1"
      />
    );
  }

  function renderThread(thread: BigbirdInquiryViewModel) {
    const campaign =
      thread.campaignIdx === null
        ? undefined
        : campaigns?.find((item) => item.campaignIdx === thread.campaignIdx);
    // 캠페인 카드 메시지는 위의 카드로 대신하고, 시스템 메시지는 보이지 않음.
    const rows = groupAttachments(
      thread.messages.filter(
        (message) => message.kind !== "system" && !message.campaign,
      ),
    );
    return (
      <li key={thread.threadIdx} className="flex flex-col gap-3">
        <ChatDivider className="self-center">
          {formatDividerDate(thread.createdAt)}
        </ChatDivider>
        {campaign && (
          <ChatCodeCard
            size="sm"
            thumbnailSrc={campaign.imageUrl ?? undefined}
            title={campaign.productName}
            description={campaign.brandName}
            period={campaign.period ?? undefined}
            codeLabel={t("campaignCode")}
            code={campaign.campaignCode}
            copyLabel={t("copyCampaignCode")}
            onClickCopy={() => void handleClickCopy(campaign.campaignCode)}
          />
        )}
        {rows.map((row) => {
          const isMine = row.type === "files" ? row.isMine : row.message.isMine;
          const name = isMine ? t("advertiser") : writerName;
          if (row.type === "files") {
            return (
              <ConversationFiles
                key={row.id}
                row={row}
                name={name}
                time={
                  row.text ? formatMessageTime(row.text.createdAt) : undefined
                }
              />
            );
          }
          if (row.message.isDeleted) {
            return (
              <ChatDivider key={row.id} className="self-center">
                {t("messageDeleted")}
              </ChatDivider>
            );
          }
          return (
            <ChatMessage
              key={row.id}
              size="sm"
              name={name}
              side={isMine ? "me" : "other"}
              avatarSrc={isMine ? undefined : avatarSrc}
              message={row.message.body}
              time={formatMessageTime(row.message.createdAt)}
            />
          );
        })}
      </li>
    );
  }

  return <ol className="flex flex-col gap-6">{threads.map(renderThread)}</ol>;
}
