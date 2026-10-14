import { AuthGuard } from "@/entities/session";

import type { SessionViewModel } from "@/entities/session";

interface SessionSummaryProps {
  session: SessionViewModel;
}

/**
 * Temporary main screen: the layout shell is waiting on design, so for now it only
 * shows that the `GET /sec` authorization check really runs after login.
 *
 * Ids and email are left out on purpose: even a temporary screen ships in the
 * production bundle and `/` lands here.
 */
function SessionSummary({ session }: SessionSummaryProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background">
      <p className="text-lg font-bold text-gray-700">
        {session.displayName} 님, 로그인됨
      </p>
      <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm text-gray-700">
        <dt>권한</dt>
        <dd>{session.authority}</dd>
      </dl>
      <ul className="text-sm text-gray-400">
        {Object.entries(session.subPermissions).map(([name, isAllowed]) => (
          <li key={name}>
            {name}: {isAllowed ? "허용" : "차단"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MainPage() {
  return (
    <>
      <title>메인</title>
      <AuthGuard>{(session) => <SessionSummary session={session} />}</AuthGuard>
    </>
  );
}
