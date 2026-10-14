import { Loader2Icon } from "lucide-react";
import { Navigate, useLocation } from "react-router";

import { ROUTES } from "@/shared/config";

import { useSession } from "../api/session-api";

import type { SessionViewModel } from "../model/schema";
import type { ReactNode } from "react";

interface Props {
  children: (session: SessionViewModel) => ReactNode;
}

/**
 * Waits for the server's answer and either lets the user through or sends them
 * out; permission rules stay on the server (`X-Path`). Children receive the
 * session so screens do not ask again: the session is never cached, so a second
 * `useSession` would fire another request.
 *
 * Unauthenticated users go to the introduction page; `/logout` and the login
 * page are not used as targets (same as the source guard).
 */
export function AuthGuard({ children }: Props) {
  const { pathname } = useLocation();
  const { session, isLoading, isError } = useSession(pathname);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Loader2Icon
          role="status"
          aria-label="Loading"
          className="size-6 animate-spin"
        />
        <span className="sr-only">확인 중</span>
      </div>
    );
  }

  // No session (401) and a denied path (`result: false`) are handled the same.
  if (isError || !session || !session.isAllowed) {
    return <Navigate to={ROUTES.introduction} replace />;
  }

  return children(session);
}
