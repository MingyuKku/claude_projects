import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { useProposalInfo } from "@/entities/campaign-progress";
import { CreatorChannelButton, LoadError } from "@/entities/creator";
import { toMatchingPlatform } from "@/entities/platform";
import { ClipboardButton } from "@/shared/components/clipboard-button";
import { ScrollPanel } from "@/shared/components/scroll-panel";
import { fieldTextareaClassName } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarImage, AvatarPlaceholder } from "@/shared/ui/avatar";

import { useMemoAutosave } from "../lib/use-memo-autosave";
import { useProposalFormat } from "../lib/use-proposal-format";

import type { ProposalInfo } from "@/entities/campaign-progress";
import type { ReactNode } from "react";

const MEMO_MAX_LENGTH = 2000;

interface CreatorInfoPanelProps {
  proposalIdx: number;
  /** PC는 머리글 "크리에이터 정보"가 있고, TAB·MO는 탭 이름이 대신함. */
  hasHeader: boolean;
  className?: string;
}

// 매칭 상세 오른쪽(TAB·MO는 두 번째 탭) 크리에이터·캠페인·제안 정보와 메모.
// 캠페인 이미지·SNS 채널 주소는 API에 없어(B-26) 이미지 칸은 비우고 채널 버튼은 꺼 둠.
export function CreatorInfoPanel({
  proposalIdx,
  hasHeader,
  className,
}: CreatorInfoPanelProps) {
  const { t } = useTranslation("features/campaign-matching");
  const { info, error, mutate } = useProposalInfo(proposalIdx);

  return (
    <section
      aria-label={t("info.title")}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border bg-background",
        className,
      )}
    >
      {hasHeader && (
        <header className="flex h-15 shrink-0 items-center border-b px-5">
          <h3 className="truncate ds-text-base-none-semibold">
            {t("info.title")}
          </h3>
        </header>
      )}
      {info ? (
        <InfoContent
          key={proposalIdx}
          proposalIdx={proposalIdx}
          info={info}
          onMemoSaved={(saved) =>
            void mutate((current) => current && { ...current, memo: saved }, {
              revalidate: false,
            })
          }
        />
      ) : error ? (
        <LoadError onClickRetry={() => void mutate()} />
      ) : (
        <LoaderCircle
          aria-label={t("detail.loading")}
          className="m-auto size-6 animate-spin text-muted-foreground"
        />
      )}
    </section>
  );
}

function InfoContent({
  proposalIdx,
  info,
  onMemoSaved,
}: {
  proposalIdx: number;
  info: ProposalInfo;
  onMemoSaved: (memo: string) => void;
}) {
  const { t } = useTranslation("features/campaign-matching");
  const format = useProposalFormat();
  const memo = useMemoAutosave(proposalIdx, info.memo, onMemoSaved, () =>
    toast.error(t("info.memoFailed")),
  );
  const { creator, campaign, offer } = info;
  const platformCode = toMatchingPlatform(creator.platformIdx);

  return (
    <ScrollPanel
      className="flex-1"
      contentClassName="flex flex-col gap-4 p-4 tablet:gap-6 tablet:p-5"
    >
      <div className="flex items-center gap-3 py-2 tablet:gap-4">
        <Avatar size="2xl">
          <AvatarImage src={creator.profileImageUrl ?? undefined} alt="" />
          <AvatarPlaceholder />
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
          <p className="w-full truncate ds-text-sm-none-semibold">
            {creator.nickname ?? `@${creator.handle}`}
          </p>
          <p className="w-full truncate ds-text-sm-none-normal text-muted-foreground">
            @{creator.handle}
          </p>
          <CreatorChannelButton
            platform={{
              platformIdx: creator.platformIdx,
              code: platformCode,
              name: "",
            }}
            url={null}
            size="xs"
          />
        </div>
      </div>
      <InfoGroup title={t("info.campaign")}>
        <div
          aria-hidden
          className="aspect-[235/81] w-full rounded-md border bg-muted"
        />
        <div className="flex flex-col gap-1.5">
          <p className="ds-text-sm-5-semibold">{campaign.name}</p>
          <Row label={t("info.type")} value={campaign.type} />
          <Row label={t("info.progress")} value={campaign.progressStatus} />
          <Row
            label={t("info.period")}
            value={format.formatDateRange(campaign.startDate, campaign.endDate)}
          />
          {campaign.code && (
            <ClipboardButton
              label={t("info.code")}
              value={campaign.code}
              hasValueIcon={false}
              onCopyValue={() => toast(t("info.copied"))}
              onCopyError={() => toast.error(t("info.copyFailed"))}
            />
          )}
        </div>
      </InfoGroup>
      <InfoGroup title={t("info.offer")}>
        <div className="flex flex-col gap-1.5">
          <Row
            label={t("info.initialAmount")}
            value={format.formatWon(offer.initialAmount)}
          />
          <Row
            label={t("info.currentAmount")}
            value={format.formatWon(offer.currentAmount)}
            isStrong
          />
          <Row
            label={t("info.schedule")}
            value={format.formatDateRange(
              offer.uploadScheduleStart,
              offer.uploadScheduleEnd,
            )}
          />
        </div>
      </InfoGroup>
      <InfoGroup title={t("info.memo")}>
        <textarea
          aria-label={t("info.memo")}
          className={cn(
            fieldTextareaClassName,
            "min-h-23 rounded-md border p-2.5 focus-visible:border-primary",
          )}
          maxLength={MEMO_MAX_LENGTH}
          placeholder={t("info.memoPlaceholder")}
          value={memo.memo}
          onChange={(event) => memo.change(event.target.value)}
        />
        {memo.state === "failed" && (
          <p role="alert" className="ds-text-xs-4-normal text-destructive">
            {t("info.memoFailed")}
          </p>
        )}
      </InfoGroup>
    </ScrollPanel>
  );
}

function InfoGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h4 className="ds-text-sm-none-semibold">{title}</h4>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  isStrong = false,
}: {
  label: string;
  value: string | null;
  isStrong?: boolean;
}) {
  return (
    <dl className="flex justify-between gap-2 ds-text-xs-4-normal">
      <dt className="shrink-0 font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("truncate text-right", isStrong && "font-semibold")}>
        {value ?? "-"}
      </dd>
    </dl>
  );
}
