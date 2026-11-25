import { X } from "lucide-react";

import { CreatorScrollArea } from "@/entities/creator";
import chatbotIcon from "@/shared/assets/img/floating/chatbot.svg";
import { SubHeader } from "@/shared/components/app-header";
import { MessageBubble } from "@/shared/components/chat-message";
import { ChatbotTextField } from "@/shared/components/text-field";
import { useTranslation } from "@/shared/i18n";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

interface RecommendAssistantProps {
  userName: string;
  /** 없으면 닫을 수 없는 패널(PC). */
  onClose?: () => void;
  className?: string;
}

// 추천 API가 없어 인사말만 보이고 입력을 꺼 둠.
export function RecommendAssistant({
  userName,
  onClose,
  className,
}: RecommendAssistantProps) {
  const { t } = useTranslation("features/recommend-creators");
  const { t: tCommon } = useTranslation();

  return (
    <section
      aria-label={t("title")}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-lg border bg-muted",
        className,
      )}
    >
      <SubHeader
        className="h-15 shrink-0 pr-2"
        title={
          <span className="flex min-w-0 items-center ds-gap-3">
            <img src={chatbotIcon} alt="" className="size-7" />
            <h2 className="truncate">{t("title")}</h2>
          </span>
        }
        actions={
          onClose && (
            <Button
              variant="ghost-foreground"
              size="icon-lg"
              className="[&_svg:not([class*='size-'])]:size-6"
              aria-label={tCommon("action.close")}
              onClick={onClose}
            >
              <X />
            </Button>
          )
        }
      />
      <CreatorScrollArea className="flex-1" contentClassName="ds-px-5 ds-pt-5">
        <MessageBubble
          size="sm"
          className="max-w-50"
          message={t("greeting", { name: userName })}
        />
      </CreatorScrollArea>
      <div className="shrink-0 p-4">
        <ChatbotTextField
          disabled
          className="border-0 inset-ring inset-ring-input"
          attachLabel={t("attach")}
          submitLabel={t("submit")}
          aria-label={t("placeholder")}
          placeholder={t("placeholder")}
        />
      </div>
    </section>
  );
}
