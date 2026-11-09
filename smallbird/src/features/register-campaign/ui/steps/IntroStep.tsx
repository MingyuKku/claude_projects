import { RefreshCw } from "lucide-react";

import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";

import { useCampaignRegisterStore } from "../../model/store-context";
import { useIntroGenerationStart } from "../../model/use-intro-generation";
import { IntroAiForm } from "./intro/IntroAiForm";
import { IntroGeneratingAlert } from "./intro/IntroGeneratingAlert";
import { IntroManualFields } from "./intro/IntroManualFields";
import { IntroModeCards } from "./intro/IntroModeCards";

const CARD_CLASS_NAME =
  "flex flex-col gap-4 rounded-lg border bg-card p-4 tablet:p-5 desktop:p-6";

// 5단계 캠페인 소개서 작성. 방식을 바꿔도 입력값은 지우지 않음.
// - 직접 작성(Figma 7555:335757): 방식 카드와 같은 카드 안에 입력 필드.
// - AI(7555:335852·7555:335869): 카드 안에는 URL 입력만 있고, 생성이 끝나면 별도 "AI 생성" 카드에 같은 필드를 채움.
// 생성 중에는 5단계 입력칸만 잠그고(다른 단계 이동은 막지 않음) 안내를 띄움.
export function IntroStep() {
  const { t } = useTranslation("features/register-campaign");
  const mode = useCampaignRegisterStore((state) => state.draft.intro.mode);
  const sourceUrl = useCampaignRegisterStore(
    (state) => state.draft.intro.sourceUrl,
  );
  const aiJob = useCampaignRegisterStore((state) => state.draft.intro.aiJob);
  const patchIntro = useCampaignRegisterStore((state) => state.patchIntro);
  const { start, isStarting } = useIntroGenerationStart();

  const isGenerating = aiJob?.status === "PENDING";
  const hasAiResult = mode === "AI" && aiJob?.status === "DONE";

  return (
    <div className="flex flex-col gap-4">
      <div className={CARD_CLASS_NAME} inert={isGenerating}>
        <IntroModeCards
          value={mode}
          onChangeValue={(next) => patchIntro({ mode: next })}
        />
        {mode === "AI" && (
          <IntroAiForm
            sourceUrl={sourceUrl ?? ""}
            isStarting={isStarting}
            onChangeSourceUrl={(url) => patchIntro({ sourceUrl: url })}
            onGenerate={() => void start(sourceUrl ?? "")}
          />
        )}
        {mode === "MANUAL" && <IntroManualFields />}
      </div>
      {hasAiResult && (
        <section className="flex flex-col gap-4">
          <h3 className="text-base leading-none font-semibold">
            {t("intro.ai.result.title")}
          </h3>
          <div className={CARD_CLASS_NAME} inert={isGenerating}>
            <IntroManualFields />
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isStarting || (sourceUrl ?? "").trim() === ""}
                onClick={() => void start(sourceUrl ?? "")}
              >
                <RefreshCw aria-hidden />
                {t("intro.ai.regenerate")}
              </Button>
            </div>
          </div>
        </section>
      )}
      {isGenerating && <IntroGeneratingAlert />}
    </div>
  );
}
