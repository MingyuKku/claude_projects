import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { useSession } from "@/entities/session";
import { isApiError } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { useTranslation } from "@/shared/i18n";

import { AppShell } from "./AppShell";

import type { ComponentProps } from "react";

type SessionAppShellProps = Pick<
  ComponentProps<typeof AppShell>,
  | "children"
  | "className"
  | "mainClassName"
  | "title"
  | "icon"
  | "activeNavId"
  | "isKeyboardAware"
>;

const SESSION_ERROR_TOAST_ID = "session-check-failed";

// 세션을 조회해 AppShell을 감쌈. 본문은 로그인 여부와 관계없이 항상 보여 주고, 세션은 헤더·LNB 모양만 정함.
// - 확인 중: 화면 전체를 비로그인 UI(기본값)로 그리고, 그 위에 전체를 덮는 밝은 오버레이와 스피너를 얹음.
// - 확인 후: 로그인이면 로그인 UI로 바뀌고, 401이면 비로그인 UI 그대로. `result: false`(경로 권한 거부)도 비로그인.
// - 401이 아닌 오류: 본문과 비로그인 UI는 그대로 두고, 실패 사실을 토스트로 알리며 재시도할 수 있게 함.
export function SessionAppShell({
  children,
  ...shellProps
}: SessionAppShellProps) {
  const { t } = useTranslation("widgets/app-shell");
  const { t: tCommon } = useTranslation();
  const { session, isLoading, isError, error, mutate } = useSession(
    ROUTES.main,
  );
  const isGuest = isApiError(error) && error.status === 401;
  const hasSessionError = isError && !isGuest;
  const activeSession = !isError && session?.isAllowed ? session : null;

  useEffect(() => {
    if (!hasSessionError) return;
    toast.error(t("session.checkFailed"), {
      id: SESSION_ERROR_TOAST_ID,
      action: {
        label: tCommon("action.retry"),
        onClick: () => {
          void mutate();
        },
      },
    });
  }, [hasSessionError, mutate, t, tCommon]);

  return (
    <>
      <AppShell session={activeSession} {...shellProps}>
        {children}
      </AppShell>
      {isLoading && (
        <div
          role="status"
          aria-label={t("session.checking")}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/70"
        >
          <Loader2Icon
            aria-hidden
            className="size-6 animate-spin text-primary"
          />
        </div>
      )}
    </>
  );
}
