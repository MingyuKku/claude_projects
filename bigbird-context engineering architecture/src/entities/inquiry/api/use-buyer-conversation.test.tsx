import { act, renderHook, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";

import { serverApiV3 } from "@/shared/api";

import { usePurchaserConversation } from "./inquiry-api";

import type { BuyerInquiryViewModel } from "../model/schema";
import type { ReactNode } from "react";

vi.mock("@/shared/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, serverApiV3: { get: vi.fn() } };
});

const inquiry = {
  key: "purchaser-501",
  inquiryIdx: 501,
  source: "purchaser",
  status: "waiting",
  campaignIdx: 10,
  threadUserIdx: 77,
  userIdx: null,
} as BuyerInquiryViewModel;

const response = (body: string) => ({
  result: true,
  data: [
    {
      threadIdx: 1,
      sequence: 1,
      viewing: null,
      toUserIdx: 1,
      fmUserIdx: 77,
      campaignIdx: 10,
      finishTime: null,
      created: "2026-10-01T10:00:00",
      boardType: true,
      status: "WAITING",
      messages: [
        {
          messageIdx: 1,
          threadIdx: 1,
          body,
          userIdx: 77,
          attachmentIdx: null,
          writeTime: "2026-10-01T10:00:00",
          readTime: null,
          modifyTime: null,
          deleteTime: null,
          identifier: "buyer",
          isUserMessage: false,
          fileName: null,
          fileSize: null,
          fileType: null,
          auto: false,
        },
      ],
    },
  ],
});

describe("usePurchaserConversation", () => {
  it("탭으로 돌아오면 구매자 대화를 다시 받아 새 메시지를 보여 준다", async () => {
    vi.mocked(serverApiV3.get)
      .mockResolvedValueOnce(response("배송이 언제 되나요?"))
      .mockResolvedValue(response("아직 안 왔어요."));
    // 앱의 SWRProvider처럼 전역 기본은 포커스 재조회를 끄고, SWR의 포커스 간격 보호는 테스트에서만 0으로 줌.
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
    const { result } = renderHook(() => usePurchaserConversation(inquiry), {
      wrapper,
    });
    await waitFor(() =>
      expect(result.current.messages?.[0]?.body).toBe("배송이 언제 되나요?"),
    );

    act(() => {
      window.dispatchEvent(new Event("focus"));
    });

    await waitFor(() =>
      expect(result.current.messages?.[0]?.body).toBe("아직 안 왔어요."),
    );
  });
});
