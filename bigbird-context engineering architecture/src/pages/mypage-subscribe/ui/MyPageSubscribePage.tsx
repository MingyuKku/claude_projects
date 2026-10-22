import { EmptyState } from "@/shared/components/empty-state";
import { useTranslation } from "@/shared/i18n";

// 화면이 구현되기 전까지 쓰는 자리표시자. 셸은 app 레이어의 MypageLayout이 감쌈.
export function MyPageSubscribePage() {
  const { t } = useTranslation("pages/mypage-subscribe");
  const { t: tCommon } = useTranslation();

  return (
    <>
      <title>{t("title")}</title>
      <div className="flex min-h-full items-center justify-center">
        <EmptyState type="construction" title={tCommon("status.comingSoon")} />
      </div>
    </>
  );
}
