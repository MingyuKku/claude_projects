import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useRevalidator } from "react-router";
import { toast } from "sonner";

import { isApiError } from "@/shared/api";
import { useTranslation } from "@/shared/i18n";
import { usePromiseState } from "@/shared/lib";

import { AppShell } from "./AppShell";

import type { SessionViewModel } from "@/entities/session";
import type { ComponentProps } from "react";

type SessionAppShellProps = {
  /** 라우터 loader가 기다리지 않고 넘긴 세션 확인(`GET /v3/sec`, `X-Path: /`) 결과. */
  session: Promise<SessionViewModel>;
} & Pick<
  ComponentProps<typeof AppShell>,
  | "children"
  | "className"
  | "mainClassName"
  | "title"
  | "icon"
  | "activeNavId"
  | "isKeyboardAware"
  | "keyboardGapClassName"
>;

const SESSION_ERROR_TOAST_ID = "session-check-failed";

// 세션 확인 결과를 받아 AppShell을 감쌈. 본문은 로그인 여부와 관계없이 항상 보여 주고, 세션은 헤더·LNB 모양만 정함.
// - 확인 중: 화면 전체를 비로그인 UI(기본값)로 그리고, 그 위에 전체를 덮는 밝은 오버레이와 스피너를 얹음.
// - 확인 후: 로그인이면 로그인 UI로 바뀌고, 401이면 비로그인 UI 그대로. `result: false`(경로 권한 거부)도 비로그인.
// - 401이 아닌 오류: 본문과 비로그인 UI는 그대로 두고, 실패 사실을 토스트로 알리며 재시도할 수 있게 함.
// - 다시 확인하는 동안(다시 시도, 홈 ↔ 검색 이동)은 직전 결과로 그리고 오버레이를 띄우지 않음.
export function SessionAppShell({
  session,
  children,
  ...shellProps
}: SessionAppShellProps) {
  const { t } = useTranslation("widgets/app-shell");
  const { t: tCommon } = useTranslation();
  const { revalidate } = useRevalidator();
  const { result, isPending } = usePromiseState(session);
  const isLoading = result === undefined;
  const error = result?.status === "rejected" ? result.error : undefined;
  const isGuest = isApiError(error) && error.status === 401;
  const hasSessionError = result?.status === "rejected" && !isGuest;
  const activeSession =
    result?.status === "fulfilled" && result.value.isAllowed
      ? result.value
      : null;

  // 확인 결과가 새로 올 때마다(result가 바뀔 때) 알림을 맞춤. 다시 시도가 또 실패하면 다시 띄우고, 성공하면 닫음.
  // 다시 확인하는 동안은 직전 실패가 남아 있어도 띄우지 않음(누른 뒤 닫힌 토스트가 확인 중에 다시 뜨지 않게).
  useEffect(() => {
    if (isPending) return;
    if (!hasSessionError) {
      toast.dismiss(SESSION_ERROR_TOAST_ID);
      return;
    }
    toast.error(t("session.checkFailed"), {
      id: SESSION_ERROR_TOAST_ID,
      action: {
        label: tCommon("action.retry"),
        onClick: () => {
          void revalidate();
        },
      },
    });
  }, [result, isPending, hasSessionError, revalidate, t, tCommon]);

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
