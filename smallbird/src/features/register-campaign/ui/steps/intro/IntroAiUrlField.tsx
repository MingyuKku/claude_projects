import { WandSparkles } from "lucide-react";

import { FormField } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import { useGenerateIntro } from "../../../model/use-intro-generation";
import { useRegisterWizardStore } from "../../../model/wizard-context";

export function IntroAiUrlField() {
  const { t } = useTranslation("features/register-campaign");
  const url = useRegisterWizardStore((state) => state.introAi.url);
  const isGenerating = useRegisterWizardStore(
    (state) => state.introAi.jobId !== null,
  );
  const setIntroAiUrl = useRegisterWizardStore((state) => state.setIntroAiUrl);
  const generateIntro = useGenerateIntro();

  const canGenerate = url.trim().length > 0 && !isGenerating;

  return (
    <FormField
      label={t("intro.ai.urlLabel")}
      isRequired
      helpText={t("intro.ai.urlHelp")}
      disabled={isGenerating}
    >
      {(control) => (
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (canGenerate) void generateIntro();
          }}
        >
          <Input
            {...control}
            type="url"
            inputMode="url"
            className="min-w-0 flex-1"
            placeholder={t("intro.ai.urlPlaceholder")}
            value={url}
            onChange={(event) => setIntroAiUrl(event.target.value)}
          />
          <Button type="submit" variant="outline" disabled={!canGenerate}>
            <WandSparkles aria-hidden />
            {t("intro.ai.generate")}
          </Button>
        </form>
      )}
    </FormField>
  );
}
