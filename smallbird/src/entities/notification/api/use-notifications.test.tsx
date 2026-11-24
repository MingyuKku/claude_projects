import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { useMarkNotificationRead, useNotifications } from "./use-notifications";

import type { ReactNode } from "react";

const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));
vi.mock("@/shared/api", () => ({ serverApiV3: api }));

function listResponse(unreadCount: number, isRead: boolean) {
  return {
    list: [
      {
        notificationIdx: 1,
        type: "CAMPAIGN_APPROVED",
        campaignIdx: 10,
        campaignCode: null,
        campaignName: "뷰티",
        createdAt: "2027-12-12 00:00:00",
        isRead,
      },
    ],
    unreadCount,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
}

describe("알림 목록", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("사용하지 않으면 요청하지 않는다", () => {
    renderHook(() => useNotifications(false), { wrapper });

    expect(api.get).not.toHaveBeenCalled();
  });

  it("읽음 처리하면 요청한 뒤 목록을 다시 읽어 개수를 맞춘다", async () => {
    api.get
      .mockResolvedValueOnce(listResponse(1, false))
      .mockResolvedValue(listResponse(0, true));
    api.post.mockResolvedValue(undefined);
    const { result } = renderHook(
      () => ({
        list: useNotifications(true),
        markRead: useMarkNotificationRead(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data?.unreadCount).toBe(1));

    await act(() => result.current.markRead(1));

    expect(api.post).toHaveBeenCalledWith("/notifications/1/read");
    await waitFor(() => expect(result.current.list.data?.unreadCount).toBe(0));
  });

  it("읽음 처리가 실패해도 던지지 않고 안 읽음으로 되돌린다", async () => {
    api.get.mockResolvedValue(listResponse(1, false));
    api.post.mockRejectedValue(new Error("500"));
    const { result } = renderHook(
      () => ({
        list: useNotifications(true),
        markRead: useMarkNotificationRead(),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data?.unreadCount).toBe(1));

    await act(() => result.current.markRead(1));

    expect(result.current.list.data?.items[0]?.isRead).toBe(false);
    expect(result.current.list.data?.unreadCount).toBe(1);
  });
});
