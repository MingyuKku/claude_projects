import { Download } from "lucide-react";

import { FormField } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";

import { useRegisterPanel } from "../../../model/use-register-panel";
import { useRegisterWizardStore } from "../../../model/wizard-context";
import { BrandSelect } from "./BrandSelect";
import { CampaignPeriodField } from "./CampaignPeriodField";
import { CampaignTypeField } from "./CampaignTypeField";

/** 캠페인명 최대 글자 수(API A-5.1, 화면 시안에는 제한 표시 없음 P-11). */
const CAMPAIGN_NAME_MAX_LENGTH = 255;

// 1단계 캠페인 정보 입력(시안 13320:115396). PC는 2열(캠페인명·유형 | 브랜드·기간), TAB·MO는 1열.
export function CampaignInfoStep() {
  const { t } = useTranslation("features/register-campaign");
  const campaignCode = useRegisterWizardStore((state) => state.campaignCode);
  const name = useRegisterWizardStore((state) => state.draft.info.name);
  const patchStepDraft = useRegisterWizardStore(
    (state) => state.patchStepDraft,
  );
  const { openPanel } = useRegisterPanel();

  return (
    <Card className="ds-gap-4 ds-p-6">
      <div className="flex items-start gap-2">
        <dl className="flex min-w-0 flex-1 flex-col gap-2">
          <dt className="ds-text-sm-5-medium text-foreground">
            {t("info.code.label")}
          </dt>
          <dd className="truncate ds-text-sm-5-normal text-muted-foreground opacity-50">
            {campaignCode}
          </dd>
        </dl>
        <Button variant="outline" onClick={() => openPanel("load-previous")}>
          <Download aria-hidden />
          {t("loadPrevious.title")}
        </Button>
      </div>
      <div className="grid ds-gap-4 desktop:grid-cols-2 desktop:gap-6">
        <div className="flex min-w-0 flex-col ds-gap-4">
          <FormField label={t("info.name.label")} isRequired>
            {(control) => (
              <Input
                {...control}
                value={name}
                maxLength={CAMPAIGN_NAME_MAX_LENGTH}
                placeholder={t("info.name.placeholder")}
                onChange={(event) =>
                  patchStepDraft("info", { name: event.target.value })
                }
              />
            )}
          </FormField>
          <CampaignTypeField />
        </div>
        <div className="flex min-w-0 flex-col ds-gap-4">
          <BrandSelect onClickManage={() => openPanel("brands")} />
          <CampaignPeriodField />
        </div>
      </div>
    </Card>
  );
}
