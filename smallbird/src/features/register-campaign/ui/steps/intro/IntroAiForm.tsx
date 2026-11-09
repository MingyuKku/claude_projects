import { Wand2 } from "lucide-react";

import { FormField } from "@/shared/components/form-field";
import { useTranslation } from "@/shared/i18n";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface IntroAiFormProps {
  sourceUrl: string;
  isStarting: boolean;
  onChangeSourceUrl: (url: string) => void;
  onGenerate: () => void;
}

// AI 입력(Figma 7555:335852): 상품/서비스 URL과 "AI 생성". URL 형식 오류 문구는 시안에 없어 비어 있을 때만 막음.
export function IntroAiForm({
  sourceUrl,
  isStarting,
  onChangeSourceUrl,
  onGenerate,
}: IntroAiFormProps) {
  const { t } = useTranslation("features/register-campaign");
  const canGenerate = sourceUrl.trim() !== "" && !isStarting;

  return (
    <FormField
      label={t("intro.ai.url.label")}
      isRequired
      helpText={t("intro.ai.url.help")}
    >
      {(control) => (
        <div className="flex gap-2">
          <Input
            {...control}
            value={sourceUrl}
            placeholder={t("intro.ai.url.placeholder")}
            onChange={(event) => onChangeSourceUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter" || event.nativeEvent.isComposing)
                return;
              event.preventDefault();
              if (canGenerate) onGenerate();
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 text-primary"
            disabled={!canGenerate}
            onClick={onGenerate}
          >
            <Wand2 aria-hidden />
            {t("intro.ai.generate")}
          </Button>
        </div>
      )}
    </FormField>
  );
}
