import { tryit } from "radash";
import { toast } from "sonner";

import { useLogout } from "@/entities/session";
import { registerThisDevice } from "@/features/enable-web-push";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";
import { hardNavigate } from "@/shared/lib";

export function useLogoutAction() {
  const { t } = useTranslation("widgets/app-shell");
  const { trigger: logout, isMutating: isLoggingOut } = useLogout();

  async function handleClickLogout() {
    const [error] = await tryit(logout)();
    if (error) {
      console.error("로그아웃 요청 실패", error);
      // 로그아웃 요청 전에 이 기기의 푸시를 꺼 두었는데 로그인 상태로 남으므로 다시 켬. 등록 가드는 같은 사용자라 재등록하지 않음.
      void registerThisDevice();
      toast.error(t("logoutFailed"));
      return;
    }
    // 재로드하여 이전 계정의 서버 캐시와 진행 중 요청을 함께 정리한다.
    hardNavigate(ROUTES.main);
  }

  return { handleClickLogout, isLoggingOut };
}
