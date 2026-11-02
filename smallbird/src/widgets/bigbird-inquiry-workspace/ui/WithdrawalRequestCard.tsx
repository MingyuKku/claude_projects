import { ChatSuggestionCard } from "@/shared/components/chat-message";
import {
  formatDate,
  formatNumber,
  formatNumericDate,
  useTranslation,
} from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";

export type WithdrawalRequestStatus = "requested" | "approved" | "rejected";

const BADGE_VARIANT = {
  requested: "yellow",
  approved: "green",
  rejected: "red",
} as const;

interface WithdrawalRequestCardProps {
  status: WithdrawalRequestStatus;
  amount: number;
  applicantName: string;
  applicantId: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  requestedAt: Date;
  /** 거절일 때 구분선 아래에 보임. */
  rejectReason?: string;
  className?: string;
}

// 띄어 쓴 값 조각 사이 2px(Figma Date 줄 gap-0.5).
function Pieces({ items }: { items: string[] }) {
  return (
    <span className="flex flex-wrap gap-0.5">
      {items.map((item, index) => (
        // 조각 순서가 고정이라 인덱스 key로 충분함.
        <span key={index}>{item}</span>
      ))}
    </span>
  );
}

// Figma 26/10/30 "빅버드 머니 출금 요청 > 기타문의 채팅 case 추가"(11430:200465 요청·200466 승인·200467 거절).
// 백엔드 API가 없어 데이터는 props로만 받음. 대화 안 배치(요청은 내 쪽, 승인·거절은 빅버드 쪽)는 부모가 정함.
// MO(11430:200425)는 대화 폭 전체, 넓은 화면은 380px.
export function WithdrawalRequestCard({
  status,
  amount,
  applicantName,
  applicantId,
  bankName,
  accountNumber,
  accountHolder,
  requestedAt,
  rejectReason,
  className,
}: WithdrawalRequestCardProps) {
  const { t } = useTranslation("widgets/bigbird-inquiry-workspace");

  return (
    <ChatSuggestionCard
      badge={{
        label: t(`withdrawal.status.${status}`),
        variant: BADGE_VARIANT[status],
      }}
      title={t("withdrawal.title")}
      notice={
        status === "requested"
          ? undefined
          : {
              status: status === "approved" ? "accepted" : "destructive",
              text: t(`withdrawal.notice.${status}`),
            }
      }
      amountLabel={t("withdrawal.amount")}
      amount={t("withdrawal.won", { amount: formatNumber(amount) })}
      details={[
        {
          label: t("withdrawal.applicant"),
          value: t("withdrawal.applicantValue", {
            name: applicantName,
            id: applicantId,
          }),
        },
        {
          label: t("withdrawal.account"),
          value: <Pieces items={[bankName, accountNumber, accountHolder]} />,
        },
        {
          label: t("withdrawal.requestedAt"),
          value: (
            <Pieces
              items={[
                formatNumericDate(requestedAt),
                formatDate(requestedAt, {
                  hour: "2-digit",
                  minute: "2-digit",
                  hourCycle: "h23",
                }),
              ]}
            />
          ),
        },
      ]}
      footnote={
        status === "rejected" && rejectReason
          ? { label: t("withdrawal.rejectReason"), value: rejectReason }
          : undefined
      }
      className={cn("w-full max-w-95", className)}
    />
  );
}
