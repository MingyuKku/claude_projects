import { useState } from "react";

import { CAMPAIGN_TYPES } from "@/entities/campaign";
import { FormField } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group";

import { CAMPAIGN_TYPE_LABEL_KEYS } from "../../../model/campaign-type-labels";
import { hasInputAfterInfo } from "../../../model/step-completion";
import { useRegisterWizardStore } from "../../../model/wizard-context";

import type { CampaignType } from "@/entities/campaign";

function isCampaignType(value: string): value is CampaignType {
  return CAMPAIGN_TYPES.some((type) => type === value);
}

// 캠페인 유형(테두리 토글, 하나만). 다시 눌러도 해제하지 않음. 2~7단계에 입력한 값이 있으면 확인 알럿(시안 13320:115621)을
// 띄운 뒤 바꾸고, 바꾸면 2~7단계 입력값을 모두 비움(스펙 §3 캠페인 유형 변경).
export function CampaignTypeField() {
  const { t } = useTranslation("features/register-campaign");
  const { t: tCommon } = useTranslation();
  const campaignType = useRegisterWizardStore(
    (state) => state.draft.info.campaignType,
  );
  const draft = useRegisterWizardStore((state) => state.draft);
  const changeCampaignType = useRegisterWizardStore(
    (state) => state.changeCampaignType,
  );
  const [pendingType, setPendingType] = useState<CampaignType | null>(null);

  function handleValueChange(value: string) {
    if (!isCampaignType(value) || value === campaignType) return;
    if (hasInputAfterInfo(draft)) {
      setPendingType(value);
      return;
    }
    changeCampaignType(value);
  }

  function handleConfirmChange() {
    if (pendingType) changeCampaignType(pendingType);
    setPendingType(null);
  }

  return (
    <>
      <FormField label={t("info.type.label")} isRequired>
        {({ id }) => (
          <ToggleGroup
            id={id}
            type="single"
            variant="outline"
            spacing={2}
            className="flex-wrap"
            aria-label={t("info.type.label")}
            value={campaignType ?? ""}
            onValueChange={handleValueChange}
          >
            {CAMPAIGN_TYPES.map((type) => (
              <ToggleGroupItem key={type} value={type}>
                {t(CAMPAIGN_TYPE_LABEL_KEYS[type])}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
      </FormField>
      <AlertDialog
        open={pendingType !== null}
        onOpenChange={(isOpen) => !isOpen && setPendingType(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("info.typeChange.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("info.typeChange.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              {t("info.typeChange.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
