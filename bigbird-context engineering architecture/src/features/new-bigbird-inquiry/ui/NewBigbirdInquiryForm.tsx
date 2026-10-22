import { CircleHelp, Handshake, Headset, Pencil } from "lucide-react";
import { useId, useState, type CSSProperties, type ReactNode } from "react";

import { AttachmentTextField, useInquiryAttachments } from "@/entities/inquiry";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import { ScrollArea } from "@/shared/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";

import {
  CAMPAIGN_TABLE_HEADER_HEIGHT,
  CAMPAIGN_TABLE_MAX_HEIGHT,
} from "../model/constants";
import { InquiryChoiceGroup } from "./InquiryChoiceGroup";

// 화면 입력 모델. 기간은 `c-client-campaign`의 진행기간을 시안 표기로 바꾼 값.
export interface InquiryCampaignOption {
  id: number;
  name: string;
  periodLabel?: string;
}

export interface NewBigbirdInquiryDraft {
  campaignId: number | null;
  method: "board" | "realtime";
  body: string;
  /** 입력창에 담은 첨부 파일. 실시간 상담하기에서는 비어 있음. */
  files: File[];
}

/** 캠페인 목록 조회 상태. 조회 실패·로딩을 "캠페인 없음"으로 보이지 않게 구분함. */
export type InquiryCampaignsState = "loading" | "error" | "ready";

interface NewBigbirdInquiryFormProps {
  campaigns: readonly InquiryCampaignOption[];
  campaignsState?: InquiryCampaignsState;
  onClickRetryCampaigns?: () => void;
  onSubmit?: (draft: NewBigbirdInquiryDraft) => void;
  /** 등록 요청 중. 같은 문의를 두 번 보내지 않도록 제출을 막음. */
  isSubmitting?: boolean;
  /** false면 실시간 상담하기를 고를 수 없음(실시간 쓰기를 켜기 전). */
  isRealtimeAvailable?: boolean;
  /** false면 문의 남기기를 고를 수 없음(복수 문의 호환 검증 전). */
  isBoardAvailable?: boolean;
  /**
   * 처음 선택해 둘 캠페인. 값이 있으면 캠페인 문의, null이면 기타 문의로 시작함
   * (실시간 요청 실패 뒤 "문의 메시지로 남기기"로 넘어올 때).
   */
  initialCampaignId?: number | null;
}

export function NewBigbirdInquiryForm({
  campaigns,
  campaignsState = "ready",
  onClickRetryCampaigns,
  onSubmit,
  isSubmitting = false,
  isRealtimeAvailable = true,
  isBoardAvailable = true,
  initialCampaignId,
}: NewBigbirdInquiryFormProps) {
  const { t } = useTranslation("features/new-bigbird-inquiry");
  const { t: tCommon } = useTranslation();
  const id = useId();
  const [type, setType] = useState<"campaign" | "other">(
    initialCampaignId === null ? "other" : "campaign",
  );
  const [method, setMethod] = useState<"board" | "realtime">(
    isBoardAvailable ? "board" : "realtime",
  );
  const [campaignId, setCampaignId] = useState<number | null>(
    initialCampaignId ?? null,
  );
  const [body, setBody] = useState("");
  const attachments = useInquiryAttachments();
  const selectedCampaign = campaigns.find(
    (campaign) => campaign.id === campaignId,
  );
  // 문의할 캠페인이 없으면 유형 카드 외 입력을 막아 기타 문의로만 진행하게 함.
  const hasNoCampaign =
    type === "campaign" && campaignsState === "ready" && campaigns.length === 0;
  const canSubmit =
    Boolean(onSubmit) &&
    !isSubmitting &&
    (type === "other" || Boolean(selectedCampaign)) &&
    (method === "realtime" ||
      Boolean(body.trim()) ||
      attachments.files.length > 0);

  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit)
          onSubmit?.({
            campaignId:
              type === "campaign" ? (selectedCampaign?.id ?? null) : null,
            method,
            body: method === "board" ? body : "",
            files: method === "board" ? attachments.files : [],
          });
      }}
    >
      <div className="customer-center-form-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-4 tablet:space-y-5 desktop:space-y-6 desktop:p-5">
        <InquiryChoiceGroup
          label={t("typeLabel")}
          value={type}
          onValueChange={(value) => {
            if (value === "campaign" || value === "other") setType(value);
          }}
          options={[
            {
              value: "campaign",
              label: t("campaignType"),
              description: t("campaignDescription"),
              icon: <Handshake aria-hidden className="size-4 shrink-0" />,
            },
            {
              value: "other",
              label: t("otherType"),
              description: t("otherDescription"),
              icon: <CircleHelp aria-hidden className="size-4 shrink-0" />,
            },
          ]}
        />

        {type === "campaign" && (
          <fieldset className="min-w-0">
            <legend className="mb-4 text-sm leading-none font-semibold">
              {t("campaignListLabel")}
            </legend>
            {/* 머리글은 고정하고 본문만 스크롤함. 스크롤바도 머리글 아래부터 시작함. */}
            <ScrollArea
              className="rounded-lg border border-border [&>[data-slot=scroll-area-viewport]]:max-h-(--campaign-table-max-height)"
              style={
                {
                  "--campaign-table-max-height": CAMPAIGN_TABLE_MAX_HEIGHT,
                } as CSSProperties
              }
              scrollBarStyle={{ top: CAMPAIGN_TABLE_HEADER_HEIGHT }}
            >
              <Table
                className="table-fixed"
                containerClassName="overflow-visible rounded-none border-0"
                aria-label={t("campaignListLabel")}
              >
                {/* sticky 머리글은 border-collapse에서 테두리가 따라오지 않아 그림자로 아래 선을 그림. */}
                <TableHeader className="sticky top-0 z-10 bg-background [&_th]:bg-muted/40 [&_th]:shadow-[inset_0_-1px_0_var(--color-border)] [&_tr]:border-b-0">
                  <TableRow>
                    <TableHead className="w-12">
                      <span className="sr-only">{t("select")}</span>
                    </TableHead>
                    <TableHead>{t("campaignName")}</TableHead>
                    <TableHead>{t("campaignPeriod")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            name={`${id}-campaign`}
                            id={`${id}-${campaign.id}`}
                            checked={campaignId === campaign.id}
                            onCheckedChange={(checked) =>
                              setCampaignId(
                                checked === true ? campaign.id : null,
                              )
                            }
                            aria-label={campaign.name}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <label
                          htmlFor={`${id}-${campaign.id}`}
                          className="block cursor-pointer truncate"
                          title={campaign.name}
                        >
                          {campaign.name}
                        </label>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        {campaign.periodLabel ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {campaignsState === "loading" && (
                    <CampaignStatusRow>
                      {tCommon("status.loading")}
                    </CampaignStatusRow>
                  )}
                  {campaignsState === "error" && (
                    <CampaignStatusRow>
                      <span className="inline-flex items-center gap-2">
                        {tCommon("error.title")}
                        {onClickRetryCampaigns && (
                          <Button
                            variant="outline-muted"
                            size="sm"
                            onClick={onClickRetryCampaigns}
                          >
                            {tCommon("action.retry")}
                          </Button>
                        )}
                      </span>
                    </CampaignStatusRow>
                  )}
                  {campaignsState === "ready" && campaigns.length === 0 && (
                    <CampaignStatusRow>{t("noCampaign")}</CampaignStatusRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </fieldset>
        )}

        <InquiryChoiceGroup
          label={t("methodLabel")}
          value={method}
          onValueChange={(value) => {
            if (value === "board" || value === "realtime") setMethod(value);
          }}
          disabled={hasNoCampaign}
          options={[
            {
              value: "board",
              label: t("board"),
              description: t("boardDescription"),
              icon: <Pencil aria-hidden className="size-4 shrink-0" />,
              disabled: !isBoardAvailable,
            },
            {
              value: "realtime",
              label: t("realtime"),
              description: t("realtimeDescription"),
              icon: <Headset aria-hidden className="size-4 shrink-0" />,
              disabled: !isRealtimeAvailable,
            },
          ]}
        />

        {method === "board" && (
          <div className="space-y-4">
            <label
              htmlFor={`${id}-body`}
              className="block text-sm leading-none font-semibold"
            >
              {t("board")}
            </label>
            <AttachmentTextField
              id={`${id}-body`}
              attachments={attachments}
              maxLength={3000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              disabled={hasNoCampaign}
              placeholder={t("messagePlaceholder")}
              submit={
                <Button type="submit" size="sm" disabled={!canSubmit}>
                  {t("send")}
                </Button>
              }
            />
          </div>
        )}
      </div>
      <footer className="shrink-0 p-4">
        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {t("submit")}
        </Button>
      </footer>
    </form>
  );
}

// 캠페인 표 본문 전체 너비로 상태 문구를 보여 주는 행.
function CampaignStatusRow({ children }: { children: ReactNode }) {
  return (
    <TableRow>
      <TableCell colSpan={3} className="h-14 text-center text-muted-foreground">
        {children}
      </TableCell>
    </TableRow>
  );
}
