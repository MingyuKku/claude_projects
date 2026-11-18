import { Outlet, useLoaderData } from "react-router";

import { AppShell } from "@/widgets/app-shell";

import type { sessionLoader } from "../router/session-middleware";

// 캠페인 현황·개설 셸. 헤더 제목은 LNB "캠페인"이고 모바일 헤더에도 제목을 보임.
export function CampaignLayout() {
  const session = useLoaderData<typeof sessionLoader>();

  return (
    <AppShell session={session} activeNavId="campaign" mainClassName="p-0">
      <Outlet context={session} />
    </AppShell>
  );
}
