import { RefreshCcw } from "lucide-react";

import { MessageAlert } from "@/shared/components/chat-message";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { useGenerateIntro } from "../../../model/use-intro-generation";
import { useRegisterWizardStore } from "../../../model/wizard-context";
import { IntroAiUrlField } from "./IntroAiUrlField";
import { IntroFields } from "./IntroFields";
import { IntroModeField } from "./IntroModeField";

// 생성 중에도 다른 단계로 옮길 수 있게, 시안의 화면 딤 없이 안내만 띄움.
export function IntroStep() {
  const { t } = useTranslation("features/register-campaign");
  const introMode = useRegisterWizardStore((state) => state.introMode);
  const hasAiResult = useRegisterWizardStore(
    (state) => state.introAi.hasResult,
  );
  const isGenerating = useRegisterWizardStore(
    (state) => state.introAi.jobId !== null,
  );
  const canRegenerate = useRegisterWizardStore(
    (state) => state.introAi.url.trim().length > 0,
  );
  const setIntroMode = useRegisterWizardStore((state) => state.setIntroMode);
  const generateIntro = useGenerateIntro();

  const isAiMode = introMode === "AI";

  return (
    <div className="flex flex-col ds-gap-6">
      <Card className="ds-gap-4 ds-p-6">
        <IntroModeField
          value={introMode}
          onChangeValue={setIntroMode}
          disabled={isGenerating}
        />
        {isAiMode ? <IntroAiUrlField /> : <IntroFields />}
      </Card>
      {isAiMode && hasAiResult && (
        <section className="flex flex-col ds-gap-4">
          <h3 className="ds-text-base-none-semibold">
            {t("intro.ai.resultTitle")}
          </h3>
          <Card className="gap-0">
            <div className="ds-p-6">
              <IntroFields disabled={isGenerating} />
            </div>
            <div className="flex justify-end ds-px-6 ds-pb-6">
              <Button
                variant="outline"
                disabled={isGenerating || !canRegenerate}
                onClick={() => void generateIntro()}
              >
                <RefreshCcw aria-hidden />
                {t("intro.ai.regenerate")}
              </Button>
            </div>
          </Card>
        </section>
      )}
      {isGenerating && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center p-4">
          <MessageAlert
            status="loading"
            title={t("intro.ai.loading.title")}
            description={t("intro.ai.loading.description")}
            caption={t("intro.ai.loading.caption")}
            className="pointer-events-auto w-full max-w-127.5 shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
