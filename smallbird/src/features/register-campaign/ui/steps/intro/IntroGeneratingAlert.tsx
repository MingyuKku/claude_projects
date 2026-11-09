import { useTranslation } from "@/shared/i18n";
import { Spinner } from "@/shared/ui/spinner";

// AI 생성 중 안내(Figma Chat Base / Message Alert {State=Loading}, 7816:396816). 취소 버튼이 없고 딤도 없음.
// 다른 단계로 이동해 계속 작업할 수 있어야 해서 뒤 화면 클릭을 막지 않고, 안내 상자만 화면 가운데에 띄움.
export function IntroGeneratingAlert() {
  const { t } = useTranslation("features/register-campaign");

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-5">
      <div
        role="status"
        className="pointer-events-auto flex w-full max-w-lg flex-col gap-2 rounded-lg border bg-background p-5 text-center shadow-lg tablet:text-left"
      >
        <p className="flex items-center justify-center gap-2 text-lg leading-7 font-semibold text-primary tablet:justify-start">
          <Spinner aria-hidden />
          {t("intro.ai.generating.title")}
        </p>
        <p className="text-sm leading-5">{t("intro.ai.generating.message")}</p>
        <p className="text-xs leading-4 text-muted-foreground">
          {t("intro.ai.generating.note")}
        </p>
      </div>
    </div>
  );
}
