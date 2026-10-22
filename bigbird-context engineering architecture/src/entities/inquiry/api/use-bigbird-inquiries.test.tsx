import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { useBigbirdInquiries } from "./inquiry-api";

import type { ReactNode } from "react";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, serverApiV3: { get: vi.fn() } };
});
// 실시간 상담(Firestore) 구독은 이 테스트의 관심사가 아니라 REST 목록을 그대로 돌려줌.
vi.mock("./use-live-inquiries", () => ({
  useLiveInquiries: (_threadUserIdx: unknown, inquiries: unknown) => inquiries,
}));

const message = (messageIdx: number, body: string) => ({
  messageIdx,
  threadIdx: 101,
  body,
  userIdx: 1,
  attachmentIdx: null,
  writeTime: "2026-10-01T10:00:00",
  readTime: null,
  modifyTime: null,
  deleteTime: null,
  identifier: "id",
  isUserMessage: false,
  fileName: null,
  fileSize: null,
  fileType: null,
  auto: false,
});

const response = (body: string) => ({
  result: true,
  data: [
    {
      threadIdx: 101,
      sequence: 7,
      viewing: null,
      toUserIdx: 1,
      fmUserIdx: 5971,
      campaignIdx: null,
      finishTime: null,
      created: "2026-10-01T10:00:00",
      boardType: true,
      status: "WAITING",
      messages: [message(1, body)],
    },
  ],
});

describe("useBigbirdInquiries", () => {
  it("탭으로 돌아오면 목록·대화를 다시 받아 새 운영자 답장을 보여 준다", async () => {
    vi.mocked(serverApiV3.get)
      .mockResolvedValueOnce(response("처음 메시지"))
      .mockResolvedValue(response("운영자가 답장했습니다."));
    // 앱의 SWRProvider와 같이 전역 기본은 포커스 재조회를 끔. 이 훅이 스스로 켜는지 확인함.
    // SWR은 첫 조회 직후 몇 초 안의 포커스는 건너뛰므로(실제 사용에서는 정상), 테스트에서만 간격을 0으로 줌.
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SWRConfig
        value={{
          provider: () => new Map(),
          revalidateOnFocus: false,
          focusThrottleInterval: 0,
          dedupingInterval: 0,
        }}
      >
        {children}
      </SWRConfig>
    );
    const { result } = renderHook(() => useBigbirdInquiries(5971), { wrapper });
    await waitFor(() =>
      expect(result.current.inquiries?.[0]?.messages[0]?.body).toBe(
        "처음 메시지",
      ),
    );

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() =>
      expect(result.current.inquiries?.[0]?.messages[0]?.body).toBe(
        "운영자가 답장했습니다.",
      ),
    );
    expect(serverApiV3.get).toHaveBeenCalledTimes(2);
  });
});
