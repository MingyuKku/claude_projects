import { ChevronDown, Download } from "lucide-react";
import { useState } from "react";

import { useBrands } from "@/entities/brand";
import {
  CAMPAIGN_TYPES,
  isCampaignType,
  useCampaignLabels,
} from "@/entities/campaign";
import { Combobox } from "@/shared/components/combobox";
import { FormField } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { hasTypeDependentInput } from "../../lib/draft-input";
import { useCampaignRegisterStore } from "../../model/store-context";
import { useWizardPanel } from "../../model/use-wizard-panel";
import { ChoiceToggleGroup } from "../fields/ChoiceToggleGroup";
import { CampaignPeriodField } from "./CampaignPeriodField";
import { CampaignTypeChangeAlert } from "./CampaignTypeChangeAlert";

import type { CampaignType } from "@/entities/campaign";

// 1단계 캠페인 정보 입력(Figma 7555:333645). 캠페인 코드는 서버가 준 값을 읽기 전용 텍스트로 보임.
export function CampaignInfoStep() {
  const { t } = useTranslation("features/register-campaign");
  const labels = useCampaignLabels();
  const draft = useCampaignRegisterStore((state) => state.draft);
  const patchCampaignInfo = useCampaignRegisterStore(
    (state) => state.patchCampaignInfo,
  );
  const changeCampaignType = useCampaignRegisterStore(
    (state) => state.changeCampaignType,
  );
  const { brands } = useBrands();
  const { openPanel } = useWizardPanel();
  const [pendingType, setPendingType] = useState<CampaignType | null>(null);
  const { campaignInfo } = draft;

  // 유형을 바꾸면 2단계 입력과 6단계의 유형 전용 값이 비워지므로, 그런 값이 있을 때만 확인하고 없으면 바로 바꿈.
  function handleChangeType(next: CampaignType) {
    if (next === campaignInfo.campaignType) return;
    if (hasTypeDependentInput(draft)) {
      setPendingType(next);
      return;
    }
    changeCampaignType(next);
  }

  function handleConfirmTypeChange() {
    if (pendingType) changeCampaignType(pendingType);
    setPendingType(null);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 tablet:p-5 desktop:p-6">
      <div className="flex items-start gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-sm leading-5 font-medium text-foreground">
            {t("campaignInfo.code.label")}
          </span>
          <p className="truncate text-sm leading-5 text-muted-foreground opacity-50">
            {draft.campaignCode}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-9.5 shrink-0 desktop:h-10"
          onClick={() => openPanel("load-previous")}
        >
          <Download />
          {t("loadPrevious.open")}
        </Button>
      </div>
      {/* PC(≥1440)는 2열이고 TAB·MO는 1열(스펙 §3 반응형). */}
      <div className="grid gap-4 desktop:grid-cols-2 desktop:gap-6">
        <div className="flex min-w-0 flex-col gap-4">
          <FormField label={t("campaignInfo.name.label")} isRequired>
            {(control) => (
              <Input
                {...control}
                value={campaignInfo.name ?? ""}
                placeholder={t("campaignInfo.name.placeholder")}
                autoComplete="off"
                onChange={(event) =>
                  patchCampaignInfo({ name: event.target.value })
                }
              />
            )}
          </FormField>
          <ChoiceToggleGroup
            label={t("campaignInfo.type.label")}
            isRequired
            options={CAMPAIGN_TYPES.map((type) => ({
              value: type,
              label: labels.campaignType(type),
            }))}
            value={
              isCampaignType(campaignInfo.campaignType)
                ? campaignInfo.campaignType
                : null
            }
            onChangeValue={handleChangeType}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <Combobox
            label={t("campaignInfo.brand.label")}
            isRequired
            isSearchable={false}
            value={
              campaignInfo.brandIdx === null
                ? ""
                : String(campaignInfo.brandIdx)
            }
            options={(brands ?? []).map((brand) => ({
              value: String(brand.brandIdx),
              label: brand.nameKo,
            }))}
            placeholder={t("campaignInfo.brand.placeholder")}
            // 검색이 없는 목록이라 쓰지 않지만 컴포넌트가 요구하는 값임.
            searchPlaceholder={t("campaignInfo.brand.placeholder")}
            emptyText={t("campaignInfo.brand.placeholder")}
            triggerIcon={<ChevronDown className="ml-4 size-4 shrink-0" />}
            action={{
              label: t("campaignInfo.brand.add"),
              onSelect: () => openPanel("add-brand"),
            }}
            onValueChange={(value) =>
              patchCampaignInfo({ brandIdx: Number(value) })
            }
          />
          <CampaignPeriodField
            startDate={campaignInfo.startDate}
            onChangeStartDate={(startDate) => patchCampaignInfo({ startDate })}
          />
        </div>
      </div>
      <CampaignTypeChangeAlert
        open={pendingType !== null}
        onCancel={() => setPendingType(null)}
        onConfirm={handleConfirmTypeChange}
      />
    </div>
  );
}
