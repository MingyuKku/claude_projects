import { useId } from "react";
import { Navigate } from "react-router";
import useSWRImmutable from "swr/immutable";

import { ROUTES } from "@/shared/config";

import type { SocialLoginOutcome } from "../model/schema";

interface SocialCallbackScreenProps {
  run: () => Promise<SocialLoginOutcome>;
}

/**
 * Shared shell of the four OAuth return screens: run once, then only redirect.
 * Success goes to main, an unregistered SNS account (C02) to the link screen,
 * anything else back to login.
 */
export function SocialCallbackScreen({ run }: SocialCallbackScreenProps) {
  // A per-mount key keeps a result cached from an earlier login from being
  // replayed, and lets SWR dedupe the StrictMode double mount into one request.
  const runId = useId();
  const { data, error } = useSWRImmutable(["social-callback", runId], run, {
    shouldRetryOnError: false,
  });

  if (error) return <Navigate to={ROUTES.login} />;

  if (data?.status === "success") return <Navigate to={ROUTES.main} />;
  if (data?.status === "needsLink") {
    return <Navigate to={ROUTES.snsLink} state={{ snsData: data.snsData }} />;
  }
  if (data) return <Navigate to={ROUTES.login} />;

  return (
    <div className="flex min-h-dvh items-center justify-center text-gray-700">
      로그인 처리 중...
    </div>
  );
}
