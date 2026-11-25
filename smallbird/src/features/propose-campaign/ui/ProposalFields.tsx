import { useCreatorTerms } from "@/entities/creator";
import { PriceField } from "@/shared/components/text-field";
import { formatNumber, useTranslation } from "@/shared/i18n";

import {
  isFeeVisible,
  parseAmount,
  parseFeeRate,
} from "../model/proposal-form";
import { CampaignSection } from "./CampaignSection";

import type { ProposalForm } from "../model/proposal-form";
import type { ProposalCampaign } from "@/entities/creator";
import type { ReactNode } from "react";

interface ProposalFieldsProps {
  campaigns: ProposalCampaign[];
  form: ProposalForm;
  onChangeForm: (form: ProposalForm) => void;
}

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-14 items-center border-b">
      <p className="min-w-0 flex-1 truncate px-4 ds-text-sm-5-normal text-foreground">
        {label}
      </p>
      <div className="w-47 shrink-0 px-4">{children}</div>
    </div>
  );
}

export function ProposalFields({
  campaigns,
  form,
  onChangeForm,
}: ProposalFieldsProps) {
  const { t } = useTranslation("features/propose-campaign");
  const { term } = useCreatorTerms();

  return (
    <>
      <CampaignSection
        campaigns={campaigns}
        selectedIdx={form.campaign?.campaignIdx}
        onSelectCampaign={(campaign) => onChangeForm({ ...form, campaign })}
      />
      <section className="flex shrink-0 flex-col gap-4">
        <h3 className="ds-text-sm-none-semibold text-foreground">
          {t("form.title")}
        </h3>
        <div>
          <FieldRow label={t("form.amount")}>
            <PriceField
              aria-label={t("form.amount")}
              unit={term("won")}
              value={form.amount === null ? "" : formatNumber(form.amount)}
              onChange={(event) =>
                onChangeForm({
                  ...form,
                  amount: parseAmount(event.target.value),
                })
              }
            />
          </FieldRow>
          {isFeeVisible(form) && (
            <FieldRow label={t("form.fee")}>
              <PriceField
                aria-label={t("form.fee")}
                unit={form.feeRate === null ? "" : "%"}
                placeholder={t("form.feePlaceholder")}
                value={form.feeRate ?? ""}
                onChange={(event) =>
                  onChangeForm({
                    ...form,
                    feeRate: parseFeeRate(event.target.value),
                  })
                }
              />
            </FieldRow>
          )}
        </div>
      </section>
    </>
  );
}
